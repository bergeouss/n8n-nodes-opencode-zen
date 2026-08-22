"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeOpenCodeChatModel = makeOpenCodeChatModel;
const openai_1 = require("@langchain/openai");
const anthropic_1 = require("@langchain/anthropic");
const ANTHROPIC_MODEL_PREFIXES = ['claude-', 'qwen'];
const DEFAULT_MAX_TOKENS_ANTHROPIC = 4096;
const SHARED_OPTIONS = [
    {
        displayName: 'Sampling Temperature',
        name: 'temperature',
        default: 0.7,
        type: 'number',
        typeOptions: { maxValue: 2, minValue: 0, numberPrecision: 1 },
        description: 'Controls randomness: lowering results in less random completions.',
    },
    {
        displayName: 'Maximum Number of Tokens',
        name: 'maxTokens',
        default: -1,
        type: 'number',
        description: 'Maximum number of tokens to generate. -1 lets the provider decide (Anthropic path falls back to a safe default).',
    },
    {
        displayName: 'Top P',
        name: 'topP',
        default: 1,
        type: 'number',
        typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 2 },
        description: 'Nucleus sampling threshold. Generally prefer adjusting temperature OR top P, not both.',
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
                description: 'Routes claude-/qwen models through the Anthropic Messages API, everything else through OpenAI Chat Completions.',
            },
            {
                name: 'OpenAI Chat Completions',
                value: 'openai',
                description: 'POST {baseUrl}/chat/completions. Works for GPT, Grok, DeepSeek, GLM, Kimi, MiniMax, Gemini and most Claude models behind the gateway.',
            },
            {
                name: 'Anthropic Messages',
                value: 'anthropic',
                description: '{gateway}/v1/messages with x-api-key headers. For Claude/Qwen models needing native semantics.',
            },
        ],
        description: 'Which wire protocol to speak to the gateway.',
    },
    {
        displayName: 'Streaming Response',
        name: 'streaming',
        default: false,
        type: 'boolean',
        description: 'Whether to stream responses. Enable for long generations to avoid timeouts.',
    },
];
function modelListProperties(credentialName) {
    return {
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
        default: '',
        description: 'The model ID. List is fetched live from the gateway. Free models are marked "-free".',
    };
}
function makeOpenCodeChatModel(cfg) {
    return class {
        description = {
            displayName: cfg.displayName,
            name: cfg.nodeName,
            icon: {
                light: `file:${cfg.iconBaseName}.svg`,
                dark: `file:${cfg.iconBaseName}.dark.svg`,
            },
            group: ['transform'],
            version: [1],
            description: cfg.nodeDescription,
            defaults: {
                name: cfg.displayName,
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
                    name: cfg.credentialName,
                    required: true,
                },
            ],
            requestDefaults: {
                baseURL: `={{ $credentials?.url }}`,
                headers: {
                    Authorization: '=Bearer {{ $credentials?.apiKey }}',
                },
            },
            properties: [
                {
                    displayName: 'This node feeds an AI Agent, Chain or other consumer with a language model. Pick a model, connect it, done.',
                    name: 'notice',
                    type: 'notice',
                    default: '',
                },
                modelListProperties(cfg.credentialName),
                {
                    displayName: 'Options',
                    name: 'options',
                    placeholder: 'Add Option',
                    description: 'Additional options',
                    type: 'collection',
                    default: {},
                    options: SHARED_OPTIONS,
                },
            ],
        };
        async supplyData(itemIndex) {
            const credentials = await this.getCredentials(cfg.credentialName);
            const baseUrl = credentials.url ?? cfg.defaultBaseUrl;
            const apiKey = credentials.apiKey;
            const modelName = this.getNodeParameter('model', itemIndex);
            if (!modelName) {
                throw new Error('No model selected. Please choose a model.');
            }
            const options = this.getNodeParameter('options', itemIndex, {});
            let protocol = options.protocol ?? 'auto';
            if (protocol === 'auto') {
                const isAnthropicFamily = ANTHROPIC_MODEL_PREFIXES.some((p) => modelName.toLowerCase().startsWith(p));
                protocol = isAnthropicFamily ? 'anthropic' : 'openai';
            }
            const timeoutMs = options.timeout ?? 360000;
            const maxRetries = options.maxRetries ?? 2;
            let model;
            if (protocol === 'anthropic') {
                // The Anthropic SDK appends /v1/messages, so strip a trailing /v1.
                const anthropicBaseUrl = baseUrl.replace(/\/v1\/?$/, '');
                model = new anthropic_1.ChatAnthropic({
                    anthropicApiKey: apiKey,
                    model: modelName,
                    anthropicApiUrl: anthropicBaseUrl,
                    maxTokens: options.maxTokens && options.maxTokens > 0
                        ? options.maxTokens
                        : DEFAULT_MAX_TOKENS_ANTHROPIC,
                    temperature: options.temperature,
                    topP: options.topP !== undefined && options.topP !== 1
                        ? options.topP
                        : undefined,
                    streaming: options.streaming ?? false,
                    clientOptions: {
                        timeout: timeoutMs,
                        maxRetries,
                    },
                });
                if (options.topP === undefined || options.topP === 1) {
                    // @ts-expect-error runtime prop cleanup, mirrors official n8n nodes
                    delete model.topP;
                }
            }
            else {
                model = new openai_1.ChatOpenAI({
                    apiKey,
                    model: modelName,
                    temperature: options.temperature,
                    maxTokens: options.maxTokens && options.maxTokens > 0
                        ? options.maxTokens
                        : undefined,
                    topP: options.topP !== undefined && options.topP !== 1
                        ? options.topP
                        : undefined,
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
            };
        }
    };
}
