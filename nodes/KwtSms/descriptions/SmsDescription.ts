/**
 * SMS resource description for the kwtSMS node.
 * Defines operations and fields for sending SMS messages.
 *
 * Related files:
 *   - ../KwtSms.node.ts (main node file)
 *   - ./index.ts (barrel export)
 */

import type { INodeProperties } from 'n8n-workflow';

export const smsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['sms'],
			},
		},
		options: [
			{
				name: 'Send',
				value: 'send',
				description: 'Send an SMS to one or more recipients',
				action: 'Send an SMS',
			},
		],
		default: 'send',
	},
];

export const smsFields: INodeProperties[] = [
	{
		displayName: 'To',
		name: 'to',
		type: 'string',
		required: true,
		default: '',
		placeholder: '96598765432',
		description:
			'Recipient phone number(s). Comma-separated for multiple. International format, digits only.',
		displayOptions: {
			show: {
				resource: ['sms'],
				operation: ['send'],
			},
		},
	},
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		required: true,
		default: '',
		typeOptions: {
			rows: 4,
		},
		description:
			'The SMS message text. English: 160 chars/page. Arabic: 70 chars/page. Max 7 pages.',
		displayOptions: {
			show: {
				resource: ['sms'],
				operation: ['send'],
			},
		},
	},
	{
		displayName: 'Sender ID',
		name: 'senderId',
		type: 'string',
		required: true,
		default: '={{$credentials.defaultSenderId}}',
		description:
			'Sender ID for the message. Must be pre-approved on your kwtSMS account.',
		displayOptions: {
			show: {
				resource: ['sms'],
				operation: ['send'],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['sms'],
				operation: ['send'],
			},
		},
		options: [
			{
				displayName: 'Test Mode',
				name: 'testMode',
				type: 'boolean',
				default: false,
				description:
					'Send in test mode. Message enters queue but is not delivered. No credits consumed.',
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'options',
				options: [
					{
						name: 'Auto Detect',
						value: 'auto',
					},
					{
						name: 'English (GSM-7)',
						value: 'english',
					},
					{
						name: 'Arabic (Unicode)',
						value: 'arabic',
					},
				],
				default: 'auto',
				description:
					'Message encoding. Auto detect is recommended.',
			},
		],
	},
];
