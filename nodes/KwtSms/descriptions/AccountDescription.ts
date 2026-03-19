/**
 * Account resource description for the kwtSMS node.
 * Defines operations for checking balance and coverage.
 *
 * Related files:
 *   - ../KwtSms.node.ts (main node file)
 *   - ./index.ts (barrel export)
 */

import type { INodeProperties } from 'n8n-workflow';

export const accountOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['account'],
			},
		},
		options: [
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get the current account credit balance',
				action: 'Get account balance',
			},
			{
				name: 'Get Coverage',
				value: 'getCoverage',
				description: 'List active country prefixes on the account',
				action: 'Get coverage list',
			},
		],
		default: 'getBalance',
	},
];

export const accountFields: INodeProperties[] = [];
