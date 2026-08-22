import { makeOpenCodeChatModel } from '../shared/openCodeChatModel';

/**
 * OpenCode Zen — main gateway (all model families).
 * Base URL: https://opencode.ai/zen/v1
 */
export const LmChatOpenCodeZen = makeOpenCodeChatModel({
	displayName: 'OpenCode Zen Chat Model',
	nodeName: 'lmChatOpenCodeZen',
	nodeDescription: 'Connect any OpenCode Zen model to your AI Agent or chain',
	credentialName: 'openCodeZenApi',
	defaultBaseUrl: 'https://opencode.ai/zen/v1',
	defaultModel: 'x-preview-f-free',
	iconBaseName: 'opencodezen',
});
