import { makeOpenCodeChatModel } from '../shared/openCodeChatModel';

/**
 * OpenCode Go — curated gateway (coding-focused model selection).
 * Base URL: https://opencode.ai/zen/go/v1
 */
export const LmChatOpenCodeGo = makeOpenCodeChatModel({
	displayName: 'OpenCode Go Chat Model',
	nodeName: 'lmChatOpenCodeGo',
	nodeDescription: 'Connect any OpenCode Go model to your AI Agent or chain',
	credentialName: 'openCodeGoApi',
	defaultBaseUrl: 'https://opencode.ai/zen/go/v1',
	defaultModel: 'ox-alpha-free',
	iconBaseName: 'opencodego',
});
