"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LmChatOpenCodeGo = void 0;
const openCodeChatModel_1 = require("../shared/openCodeChatModel");
/**
 * OpenCode Go — curated gateway (coding-focused model selection).
 * Base URL: https://opencode.ai/zen/go/v1
 */
exports.LmChatOpenCodeGo = (0, openCodeChatModel_1.makeOpenCodeChatModel)({
    displayName: 'OpenCode Go Chat Model',
    nodeName: 'lmChatOpenCodeGo',
    nodeDescription: 'Connect any OpenCode Go model to your AI Agent or chain',
    credentialName: 'openCodeGoApi',
    defaultBaseUrl: 'https://opencode.ai/zen/go/v1',
    defaultModel: 'ox-alpha-free',
    iconBaseName: 'opencodego',
});
