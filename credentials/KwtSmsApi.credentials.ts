/**
 * kwtSMS API credentials.
 *
 * Authentication is body-based: username and password are sent
 * as part of the POST request body (not via headers).
 *
 * @see https://www.kwtsms.com/integrations.html
 */
import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class KwtSmsApi implements ICredentialType {
	name = 'kwtSmsApi';

	displayName = 'kwtSMS API';

	icon = 'file:kwtsms.svg' as const;

	documentationUrl = 'https://www.kwtsms.com/integrations.html';

	properties: INodeProperties[] = [
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'API Username',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			placeholder: 'API Password',
		},
		{
			displayName: 'Default Sender ID',
			name: 'defaultSenderId',
			type: 'string',
			default: 'KWT-SMS',
			description:
				'Default Sender ID for outgoing messages. KWT-SMS is for testing only.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			body: {
				username: '={{$credentials.username}}',
				password: '={{$credentials.password}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://www.kwtsms.com/API',
			url: '/balance/',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
		},
	};
}
