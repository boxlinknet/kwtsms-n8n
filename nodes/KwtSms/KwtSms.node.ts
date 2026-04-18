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

import { NodeConnectionTypes, NodeOperationError, sleep } from 'n8n-workflow';

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
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
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
						name: 'Account',
						value: 'account',
						description: 'Check balance or list coverage',
					},
					{
						name: 'Sender',
						value: 'sender',
						description: 'List approved sender IDs on the account',
					},
					{
						name: 'SMS',
						value: 'sms',
						description: 'Send single or bulk SMS messages',
					},
					{
						name: 'Validation',
						value: 'validation',
						description: 'Validate phone numbers',
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
					const testMode = this.getNodeParameter('testMode', i, true) as boolean;

					// Fall back to default sender ID from credentials if not specified
					if (!senderId) {
						const credentials = await this.getCredentials('kwtSmsApi');
						senderId = (credentials.defaultSenderId as string) || 'KWT-SMS';
					}

					// Pre-send pipeline: split on common separators, normalize, dedupe.
					const rawParts = rawTo.split(/[,;\n\r\t]+/);
					const nonEmptyParts = rawParts.filter((p) => p.trim().length > 0);
					const normalizedNumbers = nonEmptyParts
						.map((n) => normalizePhone(n.trim()))
						.filter((n) => n.length >= 7);
					const invalidInputs = nonEmptyParts.length - normalizedNumbers.length;

					const uniqueNumbers = deduplicateNumbers(normalizedNumbers);
					const message = cleanMessage(rawMessage);

					if (uniqueNumbers.length === 0) {
						throw new NodeOperationError(
							this.getNode(),
							'No valid phone numbers provided after normalization.',
						);
					}

					if (message.length === 0) {
						throw new NodeOperationError(this.getNode(), 'Message is empty after cleaning.');
					}

					// Use cached balance as a soft check; do not call /balance/ pre-send.
					const staticData = this.getWorkflowStaticData('node');
					const rawCached = staticData.balance;
					const cachedBalance =
						typeof rawCached === 'number' && Number.isFinite(rawCached) ? rawCached : undefined;
					if (cachedBalance !== undefined && cachedBalance <= 0 && !testMode) {
						throw new NodeOperationError(
							this.getNode(),
							`Cached account balance is zero (${cachedBalance} credits). Cannot send SMS.`,
						);
					}

					// Pre-send coverage check. Only swallow ERR033 (no active coverage).
					let coveragePrefixes: string[] = [];
					try {
						const coverageResponse = await kwtSmsApiRequest.call(this, 'POST', '/coverage/');
						if (Array.isArray(coverageResponse.coverage)) {
							coveragePrefixes = coverageResponse.coverage as string[];
						}
					} catch (err) {
						const error = err as Error & { description?: string };
						const isNoCoverage =
							error.message?.includes('ERR033') || error.description?.includes('ERR033');
						if (!isNoCoverage) {
							throw err;
						}
						this.logger.warn(
							'kwtSMS: No active coverage (ERR033), sending without coverage filter.',
						);
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
						throw new NodeOperationError(
							this.getNode(),
							'No numbers remain after coverage check. All numbers are to unsupported countries.',
						);
					}

					// Batch sending (no ERR013 retry — a single failure surfaces to the caller).
					const batches: string[][] = [];
					for (let j = 0; j < numbersToSend.length; j += MAX_NUMBERS_PER_BATCH) {
						batches.push(numbersToSend.slice(j, j + MAX_NUMBERS_PER_BATCH));
					}

					const allResults: IDataObject[] = [];
					let latestBalance: number | undefined = cachedBalance;

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

						const response = await kwtSmsApiRequest.call(this, 'POST', '/send/', sendBody);
						allResults.push(response);

						const balanceAfter = response['balance-after'];
						if (typeof balanceAfter === 'number' && Number.isFinite(balanceAfter)) {
							latestBalance = balanceAfter;
							staticData.balance = balanceAfter;
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
							mode: testMode ? 'test' : 'live',
							totalNumbersSent: totalSent,
							totalPointsCharged: totalCharged,
							balanceAfter: latestBalance ?? null,
							batchesSent: allResults.length,
							invalidInputs,
							skippedNumbers: skippedNumbers.map(maskPhone),
							batches: allResults,
						},
						pairedItem: { item: i },
					});
				}

				// ----- Account: Get Balance -----
				else if (resource === 'account' && operation === 'getBalance') {
					const response = await kwtSmsApiRequest.call(this, 'POST', '/balance/');
					const available = response.available;
					if (typeof available === 'number' && Number.isFinite(available)) {
						this.getWorkflowStaticData('node').balance = available;
					}
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
						.split(/[,;\n\r\t]+/)
						.map((n) => normalizePhone(n.trim()))
						.filter((n) => n.length > 0);

					if (normalized.length === 0) {
						throw new NodeOperationError(
							this.getNode(),
							'No valid phone numbers provided after normalization.',
						);
					}

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

