import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import type {
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from 'n8n-workflow';

/**
 * Minimal shape of the supplyData context n8n injects.
 * Kept structural (instead of importing runtime helpers) so the node
 * only needs n8n-workflow as a dev-time type dependency.
 */
interface ISupplyDataContext {
	getCredentials<T extends Record<string, unknown>>(name: string): Promise<T>;
	getNodeParameter(name: string, itemIndex: number, fallback?: unknown): unknown;
	getNode(): { typeVersion: number };
}

const ANTHROPIC_MODEL_PREFIXES = ['claude-', 'qwen'];
const DEFAULT_MAX_TOKENS_ANTHROPIC = 4096;

export class LmChatOpenCodeZen implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OpenCode Zen Chat Model',
		// eslint-disable-next-line n8n-nodes-base/node-param-default-name-same-as-display-name
		name: 'lmChatOpenCodeZen',
		icon: { light: 'file:opencodezen.svg', dark: 'file:opencodezen.dark.svg' },
		group: ['transform'],
		version: [1],
		description: 'Connect any OpenCode Zen model to your AI Agent or chain',
		defaults: {
			name: 'OpenCode Zen Chat Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
		},
		inputs: [],
		outputs: ['ai_languageModel'],
		outputNames: ['Model'],
		credentials: [
			{
				name: 'openCodeZenApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{ $credentials?.url }}',
			headers: {
				Authorization: '=Bearer {{ $credentials?.apiKey }}',
			},
		},
		properties: [
			{
				displayName:
					'This node feeds an AI Agent, Chain or other consumer with a language model. Pick a model, connect it, done.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				typeOptions: {
					loadOptions: {
						routing: {
							request: {
								method: 'GET',
								url: '/models',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
									{
										type: 'setKeyValue',
										properties: {
											name: '={{$responseItem.id}}',
											value: '={{$responseItem.id}}',
										},
									},
									{
										type: 'sort',
										properties: {
											key: 'name',
										},
									},
								],
							},
						},
					},
				},
				routing: {
					send: {
						type: 'body',
						property: 'model',
					},
				},
				default: 'x-preview-f-free',
				description:
					'The Zen model ID. List is fetched live from the gateway. Free models are marked "-free".',
			},
			{
				displayName: 'Options',
				name: 'options',
				placeholder: 'Add Option',
				description: 'Additional options',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: 'Sampling Temperature',
						name: 'temperature',
						default: 0.7,
						type: 'number',
						typeOptions: { maxValue: 2, minValue: 0, numberPrecision: 1 },
						description:
							'Controls randomness: lowering results in less random completions.',
					},
					{
						displayName: 'Maximum Number of Tokens',
						name: 'maxTokens',
						default: -1,
						type: 'number',
						description:
							'Maximum number of tokens to generate. -1 lets the provider decide (Anthropic path falls back to a safe default).',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						default: 1,
						type: 'number',
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 2 },
						description:
							'Nucleus sampling threshold. Generally prefer adjusting temperature OR top P, not both.',
					},
					{
						displayName: 'Timeout',
						name: 'timeout',
						default: 360000,
						type: 'number',
						description: 'Max time a request may take, in milliseconds.',
					},
					{
						displayName: 'Max Retries',
						name: 'maxRetries',
						default: 2,
						type: 'number',
						description: 'Maximum number of retries on failure.',
					},
					{
						displayName: 'API Protocol',
						name: 'protocol',
						type: 'options',
						default: 'auto',
						options: [
							{
								name: 'Auto (recommended)',
								value: 'auto',
								description:
									'Routes claude-/qwen models through the Anthropic Messages API, everything else through OpenAI Chat Completions.',
							},
							{
								name: 'OpenAI Chat Completions',
								value: 'openai',
								description:
									'POST {baseUrl}/chat/completions. Works for GPT, Grok, DeepSeek, GLM, Kimi, MiniMax, Gemini and most Claude models behind the Zen gateway.',
							},
							{
								name: 'Anthropic Messages',
								value: 'anthropic',
								description:
									'POST {gateway}/v1/messages with x-api-key headers. For Claude/Qwen models needing native semantics.',
							},
						],
						description: 'Which wire protocol to speak to the Zen gateway.',
					},
					{
						displayName: 'Streaming Response',
						name: 'streaming',
						default: false,
						type: 'boolean',
						description:
							'Whether to stream responses. Enable for long generations to avoid timeouts.',
					},
				],
			},
		],
	};

	async supplyData(this: ISupplyDataContext, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials<{
			url?: string;
			apiKey: string;
		}>('openCodeZenApi');

		const baseUrl = credentials.url ?? 'https://opencode.ai/zen/v1';
		const apiKey = credentials.apiKey;

		const modelName = this.getNodeParameter('model', itemIndex) as string;
		if (!modelName) {
			throw new Error('No model selected. Please choose a model.');
		}

		const options = this.getNodeParameter('options', itemIndex, {}) as {
			temperature?: number;
			maxTokens?: number;
			topP?: number;
			timeout?: number;
			maxRetries?: number;
			protocol?: 'auto' | 'openai' | 'anthropic';
			streaming?: boolean;
		};

		let protocol = options.protocol ?? 'auto';
		if (protocol === 'auto') {
			const isAnthropicFamily = ANTHROPIC_MODEL_PREFIXES.some((p) =>
				modelName.toLowerCase().startsWith(p),
			);
			protocol = isAnthropicFamily ? 'anthropic' : 'openai';
		}

		const timeoutMs = options.timeout ?? 360000;
		const maxRetries = options.maxRetries ?? 2;

		let model: BaseChatModel;

		if (protocol === 'anthropic') {
			// The Anthropic SDK appends /v1/messages to the base URL, so strip
			// a trailing /v1 from the stored gateway URL.
			const anthropicBaseUrl = baseUrl.replace(/\/v1\/?$/, '');
			model = new ChatAnthropic({
				anthropicApiKey: apiKey,
				model: modelName,
				anthropicApiUrl: anthropicBaseUrl,
				maxTokens:
					options.maxTokens && options.maxTokens > 0
						? options.maxTokens
						: DEFAULT_MAX_TOKENS_ANTHROPIC,
				temperature: options.temperature,
				topP: options.topP !== undefined && options.topP !== 1 ? options.topP : undefined,
				streaming: options.streaming ?? false,
				clientOptions: {
					timeout: timeoutMs,
					maxRetries,
				},
			});
			// ChatAnthropic defaults topP in ways some models reject; unset when unused.
			if (options.topP === undefined || options.topP === 1) {
				// @ts-expect-error runtime prop cleanup, mirrors official n8n node behavior
				delete model.topP;
			}
		} else {
			model = new ChatOpenAI({
				apiKey,
				model: modelName,
				temperature: options.temperature,
				maxTokens: options.maxTokens && options.maxTokens > 0 ? options.maxTokens : undefined,
				topP: options.topP !== undefined && options.topP !== 1 ? options.topP : undefined,
				streaming: options.streaming ?? false,
				timeout: timeoutMs,
				maxRetries,
				configuration: {
					baseURL: baseUrl,
				},
			});
		}

		return {
			response: model,
		} as unknown as SupplyData;
	}
}
