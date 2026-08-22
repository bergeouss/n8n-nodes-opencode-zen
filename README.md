# n8n-nodes-opencode-zen

Community node for [n8n](https://n8n.io): **OpenCode Zen Chat Model**, a chat model sub-node that plugs any [OpenCode Zen](https://opencode.ai/docs/zen) model straight into your AI Agents and chains.

One node, one gateway, every model family:

| Model family | Examples |
|---|---|
| GPT / Grok / Muse | `gpt-5.4`, `grok-4.6`, `muse-spark-1.2` |
| Claude / Qwen | `claude-sonnet-4-6`, `claude-haiku-4-5`, `qwen3.7-plus` |
| Gemini | `gemini-3-flash`, `gemini-3.1-pro` |
| DeepSeek / GLM / Kimi / MiniMax | `deepseek-v4-pro`, `glm-5.2`, `kimi-k2.6`, `minimax-m3` |
| Free tier | `x-preview-f-free`, `deepseek-v4-flash-free`, `hy3-free`, ... |

## Features

- **Model dropdown fetched live** from the gateway (`GET /models`) — always up to date
- **Auto protocol routing**: Anthropic-family models go through the Messages API semantics, everything else through OpenAI Chat Completions (override in Options if needed)
- **Credential connection test**: validates your API key with a tiny real request on a free model (~zero cost)
- Standard options: temperature, max tokens, top P, timeout, retries, streaming

## Install (private community node)

On a Docker setup, drop the package into your mounted `.n8n/nodes` directory:

```bash
DEST=/path/to/n8n-data/.n8n/nodes/node_modules/@bergeouss/n8n-nodes-opencode-zen
git clone https://github.com/bergeouss/n8n-nodes-opencode-zen.git "$DEST"
docker restart n8n
```

Then set up credentials in n8n:

1. Get an API key at [opencode.ai](https://opencode.ai) (workspace settings)
2. In n8n: Credentials → **OpenCode Zen API** → paste key (test button included)

## Usage

1. Add an **AI Agent** (or Chain) node
2. Under *Chat Model*, pick **OpenCode Zen Chat Model**
3. Choose a model from the dropdown, connect, done

Free models (`-free` suffix) work immediately. Paid models require credits on your OpenCode workspace.

## How it works

The n8n Agent consumes LangChain `ChatModel` instances supplied by sub-nodes through `supplyData()`. This node returns either a `ChatOpenAI` (base URL pointed at the Zen gateway) or a `ChatAnthropic` depending on the selected model — the gateway routes by model ID, so one credential covers all families.

Built following the same pattern as n8n's official `LmChatOpenRouter` node.

## Dev

```bash
npm install
npm run build   # tsc + copies icons into dist/
```

## License

MIT — [Vincent / bergeouss](https://github.com/bergeouss) · [blog.brgv.fr](https://blog.brgv.fr)
