import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class OpenCodeGoApi implements ICredentialType {
	name = 'openCodeGoApi';
	displayName = 'OpenCode Go API';
	documentationUrl = 'https://opencode.ai/docs/zen';

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{ $credentials.apiKey }}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			baseURL: '={{ $credentials?.url }}',
			url: '/chat/completions',
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				model: 'ox-alpha-free',
				max_tokens: 1,
				messages: [{ role: 'user', content: 'ping' }],
			},
		},
	};

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Your OpenCode API key (the same key works for both the Zen and Go gateways). Used as Bearer token.',
		},
		{
			displayName: 'Base URL',
			name: 'url',
			type: 'string',
			required: false,
			default: 'https://opencode.ai/zen/go/v1',
			description:
				'Go gateway base URL including version path. Leave default unless you self-host a compatible gateway.',
		},
		{
			displayName:
				'The connection test runs one tiny real request on a free model. If the key is valid but every free model is momentarily down upstream, the test may fail while the key still works — retry later.',
			name: 'testNotice',
			type: 'notice',
			default: '',
		},
	];
}
