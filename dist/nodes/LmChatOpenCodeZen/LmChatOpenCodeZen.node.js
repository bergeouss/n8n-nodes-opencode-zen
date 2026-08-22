"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LmChatOpenCodeZen = void 0;
const openCodeChatModel_1 = require("../shared/openCodeChatModel");
/**
 * OpenCode Zen — main gateway (all model families).
 * Base URL: https://opencode.ai/zen/v1
 */
exports.LmChatOpenCodeZen = (0, openCodeChatModel_1.makeOpenCodeChatModel)({
    displayName: 'OpenCode Zen Chat Model',
    nodeName: 'lmChatOpenCodeZen',
    nodeDescription: 'Connect any OpenCode Zen model to your AI Agent or chain',
    credentialName: 'openCodeZenApi',
    defaultBaseUrl: 'https://opencode.ai/zen/v1',
    defaultModel: 'x-preview-f-free',
    iconBaseName: 'opencodezen',
});
