/**
 * kwtSMS n8n Community Node
 *
 * Provides SMS operations via the kwtSMS gateway (kwtsms.com):
 *   - Send SMS (single and bulk with auto-batching)
 *   - Check account balance
 *   - List coverage (active country prefixes)
 *   - List sender IDs
 *   - Validate phone numbers
 *
 * Related files:
 *   - ./GenericFunctions.ts (API helper, phone normalization, message cleaning)
 *   - ./descriptions/ (resource and operation parameter definitions)
 *   - ../../credentials/KwtSmsApi.credentials.ts (credential definition)
 *
 * @see https://www.kwtsms.com/integrations.html
 */
import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';

import { sleep } from 'n8n-workflow';

import {
	kwtSmsApiRequest,
	normalizePhone,
	cleanMessage,
	deduplicateNumbers,
	maskPhone,
} from './GenericFunctions';

import {
	smsOperations,
	smsFields,
	accountOperations,
	accountFields,
	senderOperations,
	senderFields,
	validationOperations,
	validationFields,
} from './descriptions';

/** Maximum numbers per API request. */
const MAX_NUMBERS_PER_BATCH = 200;

/** Delay between batch requests in milliseconds. */
const BATCH_DELAY_MS = 500;

/** ERR013 backoff delays in milliseconds. */
const ERR013_BACKOFF = [30_000, 60_000, 120_000];

/** Maximum retry attempts for ERR013 (queue full). */
const ERR013_MAX_RETRIES = 3;

export class KwtSms implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'kwtSMS',
		name: 'kwtSms',
		icon: 'file:kwtsms.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Send SMS, check balance, validate numbers via kwtSMS gateway',
		defaults: {
			name: 'kwtSMS',
		},
		inputs: ['main'],
		outputs: ['main'],
		usableAsTool: true,
		credentials: [
			{
				name: 'kwtSmsApi',
				required: true,
			},
		],
		properties: [
			// Resource selector
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'SMS',
						value: 'sms',
					},
					{
						name: 'Account',
						value: 'account',
					},
					{
						name: 'Sender',
						value: 'sender',
					},
					{
						name: 'Validation',
						value: 'validation',
					},
				],
				default: 'sms',
			},
			// Operations and fields per resource
			...smsOperations,
			...smsFields,
			...accountOperations,
			...accountFields,
			...senderOperations,
			...senderFields,
			...validationOperations,
			...validationFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				// ----- SMS: Send -----
				if (resource === 'sms' && operation === 'send') {
					const rawTo = this.getNodeParameter('to', i) as string;
					const rawMessage = this.getNodeParameter('message', i) as string;
					let senderId = this.getNodeParameter('senderId', i) as string;
					const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
					const testMode = (additionalFields.testMode as boolean) ?? false;

					// Fall back to default sender ID from credentials if not specified
					if (!senderId) {
						const credentials = await this.getCredentials('kwtSmsApi');
						senderId = (credentials.defaultSenderId as string) || 'KWT-SMS';
					}

					// Pre-send pipeline: normalize, clean, deduplicate
					const normalizedNumbers = rawTo
						.split(',')
						.map((n) => normalizePhone(n.trim()))
						.filter((n) => n.length >= 7);

					const uniqueNumbers = deduplicateNumbers(normalizedNumbers);
					const message = cleanMessage(rawMessage);

					if (uniqueNumbers.length === 0) {
						throw new Error('No valid phone numbers provided after normalization.');
					}

					if (message.length === 0) {
						throw new Error('Message is empty after cleaning.');
					}

					// Pre-send balance check
					const balanceResponse = await kwtSmsApiRequest.call(
						this,
						'POST',
						'/balance/',
					);
					const availableBalance = balanceResponse.available as number;

					if (availableBalance <= 0 && !testMode) {
						throw new Error(
							`Account balance is zero (${availableBalance} credits). Cannot send SMS.`,
						);
					}

					// Pre-send coverage check
					let coveragePrefixes: string[] = [];
					try {
						const coverageResponse = await kwtSmsApiRequest.call(
							this,
							'POST',
							'/coverage/',
						);
						if (Array.isArray(coverageResponse.coverage)) {
							coveragePrefixes = coverageResponse.coverage as string[];
						}
					} catch (_err) {
						// If coverage check fails, proceed without filtering
						this.logger.warn('kwtSMS: Coverage check failed, sending without coverage filter.');
					}

					// Filter numbers by coverage (if coverage data available)
					let numbersToSend = uniqueNumbers;
					const skippedNumbers: string[] = [];

					if (coveragePrefixes.length > 0) {
						numbersToSend = [];
						for (const num of uniqueNumbers) {
							const hasRoute = coveragePrefixes.some((prefix) => num.startsWith(prefix));
							if (hasRoute) {
								numbersToSend.push(num);
							} else {
								skippedNumbers.push(num);
								this.logger.info(
									`kwtSMS: Skipping ${maskPhone(num)}, no route for country prefix.`,
								);
							}
						}
					}

					if (numbersToSend.length === 0) {
						throw new Error(
							'No numbers remain after coverage check. All numbers are to unsupported countries.',
						);
					}

					// Batch sending
					const batches: string[][] = [];
					for (let j = 0; j < numbersToSend.length; j += MAX_NUMBERS_PER_BATCH) {
						batches.push(numbersToSend.slice(j, j + MAX_NUMBERS_PER_BATCH));
					}

					const allResults: IDataObject[] = [];
					let latestBalance = availableBalance;

					for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
						const batch = batches[batchIndex];

						// Delay between batches (not before the first one)
						if (batchIndex > 0) {
							await sleep(BATCH_DELAY_MS);
						}

						const sendBody: IDataObject = {
							sender: senderId,
							mobile: batch.join(','),
							message,
							test: testMode ? '1' : '0',
						};

						// ERR013 retry with exponential backoff
						let response: IDataObject | undefined;
						for (let attempt = 0; attempt <= ERR013_MAX_RETRIES; attempt++) {
							try {
								response = await kwtSmsApiRequest.call(
									this,
									'POST',
									'/send/',
									sendBody,
								);
								break; // Success, exit retry loop
							} catch (err) {
								const error = err as Error & { description?: string };
								if (
									error.message?.includes('ERR013') ||
									error.description?.includes('ERR013')
								) {
									if (attempt < ERR013_MAX_RETRIES) {
										const delay = ERR013_BACKOFF[attempt];
										this.logger.warn(
											`kwtSMS: Queue full (ERR013), retrying in ${delay / 1000}s (attempt ${attempt + 1}/${ERR013_MAX_RETRIES}).`,
										);
										await sleep(delay);
										continue;
									}
								}
								throw err;
							}
						}

						if (response) {
							allResults.push(response);
							if (typeof response['balance-after'] === 'number') {
								latestBalance = response['balance-after'] as number;
							}
						}
					}

					// Aggregate results
					const totalSent = allResults.reduce(
						(sum, r) => sum + ((r.numbers as number) || 0),
						0,
					);
					const totalCharged = allResults.reduce(
						(sum, r) => sum + ((r['points-charged'] as number) || 0),
						0,
					);

					returnData.push({
						json: {
							result: 'OK',
							totalNumbersSent: totalSent,
							totalPointsCharged: totalCharged,
							balanceAfter: latestBalance,
							batchesSent: allResults.length,
							skippedNumbers: skippedNumbers.length,
							testMode,
							batches: allResults,
						},
						pairedItem: { item: i },
					});
				}

				// ----- Account: Get Balance -----
				else if (resource === 'account' && operation === 'getBalance') {
					const response = await kwtSmsApiRequest.call(this, 'POST', '/balance/');
					returnData.push({
						json: response,
						pairedItem: { item: i },
					});
				}

				// ----- Account: Get Coverage -----
				else if (resource === 'account' && operation === 'getCoverage') {
					const response = await kwtSmsApiRequest.call(this, 'POST', '/coverage/');
					returnData.push({
						json: response,
						pairedItem: { item: i },
					});
				}

				// ----- Sender: List -----
				else if (resource === 'sender' && operation === 'list') {
					const response = await kwtSmsApiRequest.call(this, 'POST', '/senderid/');
					returnData.push({
						json: response,
						pairedItem: { item: i },
					});
				}

				// ----- Validation: Validate Numbers -----
				else if (resource === 'validation' && operation === 'validateNumbers') {
					const rawNumbers = this.getNodeParameter('numbers', i) as string;
					const normalized = rawNumbers
						.split(',')
						.map((n) => normalizePhone(n.trim()))
						.filter((n) => n.length > 0);

					const response = await kwtSmsApiRequest.call(this, 'POST', '/validate/', {
						mobile: normalized.join(','),
					});
					returnData.push({
						json: response,
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

