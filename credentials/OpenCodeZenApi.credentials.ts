import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class OpenCodeZenApi implements ICredentialType {
	name = 'openCodeZenApi';
	displayName = 'OpenCode Zen API';
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
				model: 'x-preview-f-free',
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
				'Your Zen API key from opencode.ai (workspace settings). Used as Bearer token for OpenAI paths and x-api-key for the Anthropic path.',
		},
		{
			displayName: 'Base URL',
			name: 'url',
			type: 'string',
			required: false,
			default: 'https://opencode.ai/zen/v1',
			description:
				'Gateway base URL including version path. Leave default unless you self-host a compatible gateway.',
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
