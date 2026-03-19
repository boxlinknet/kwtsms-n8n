/**
 * Validation resource description for the kwtSMS node.
 * Defines operations for validating phone numbers.
 *
 * Related files:
 *   - ../KwtSms.node.ts (main node file)
 *   - ./index.ts (barrel export)
 */

import type { INodeProperties } from 'n8n-workflow';

export const validationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['validation'],
			},
		},
		options: [
			{
				name: 'Validate Numbers',
				value: 'validateNumbers',
				description: 'Validate phone numbers before sending',
				action: 'Validate phone numbers',
			},
		],
		default: 'validateNumbers',
	},
];

export const validationFields: INodeProperties[] = [
	{
		displayName: 'Phone Numbers',
		name: 'numbers',
		type: 'string',
		required: true,
		default: '',
		placeholder: '96598765432,96512345678',
		description:
			'Phone numbers to validate. Comma-separated. Numbers are normalized automatically.',
		displayOptions: {
			show: {
				resource: ['validation'],
				operation: ['validateNumbers'],
			},
		},
	},
];
