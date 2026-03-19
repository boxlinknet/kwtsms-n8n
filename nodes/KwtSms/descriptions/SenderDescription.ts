/**
 * Sender resource description for the kwtSMS node.
 * Defines operations for listing sender IDs.
 *
 * Related files:
 *   - ../KwtSms.node.ts (main node file)
 *   - ./index.ts (barrel export)
 */

import type { INodeProperties } from 'n8n-workflow';

export const senderOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['sender'],
			},
		},
		options: [
			{
				name: 'List',
				value: 'list',
				description: 'List all available sender IDs on the account',
				action: 'List sender IDs',
			},
		],
		default: 'list',
	},
];

export const senderFields: INodeProperties[] = [];
