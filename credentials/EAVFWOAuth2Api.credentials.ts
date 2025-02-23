import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class EAVFWOAuth2Api implements ICredentialType {
	name = 'eavfwOAuth2Api';
	displayName = 'EAVFW OAuth2 API';
	documentationUrl = 'https://your-api-docs-url';
	properties: INodeProperties[] = [
		{
			displayName: 'Environment URL',
			name: 'environmentUrl',
			type: 'string',
			default: 'https://quizzical-chebyshev-000.env.medlemscentralen.dk',
			required: true,
			description: 'The base URL of your EAVFW environment',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
		}
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Authorization': '=Bearer {{$credentials.oauthAccessToken}}',
			},
		},
	};
}