# n8n-nodes-opencode

Community nodes for [n8n](https://n8n.io): plug the [OpenCode](https://opencode.ai) LLM gateways straight into your AI Agents and chains as chat model sub-nodes.

## The two nodes

| | **OpenCode Zen Chat Model** | **OpenCode Go Chat Model** |
|---|---|---|
| Node name | `lmChatOpenCodeZen` | `lmChatOpenCodeGo` |
| Gateway | `https://opencode.ai/zen/v1` | `https://opencode.ai/zen/go/v1` |
| Catalogue | Full list, ~64 models | Curated coding selection, ~29 models |
| Free model | `x-preview-f-free`, `deepseek-v4-flash-free`, ... | `ox-alpha-free` |
| Credential | OpenCode Zen API | OpenCode Go API |

**Which one?** Zen = everything (all providers, all families). Go = a smaller, coding-benchmarked selection curated by the OpenCode team. Same API key works for both.

## Model families available

| Family | Examples |
|---|---|
| GPT / Grok / Muse | `gpt-5.4`, `gpt-5.6-luna` (Go), `grok-4.6`, `muse-spark-1.2` |
| Claude / Qwen | `claude-sonnet-4-6`, `claude-haiku-4-5`, `qwen3.7-plus` |
| Gemini | `gemini-3-flash`, `gemini-3.1-pro` |
| DeepSeek / GLM / Kimi / MiniMax | `deepseek-v4-pro`, `glm-5.2` / `glm-5.3` (Go), `kimi-k2.6`, `minimax-m3` |
| Free tier | `x-preview-f-free` (Zen), `ox-alpha-free` (Go) |

> **Reasoning models**: some models (e.g. `ox-alpha-free`) spend tokens on hidden chain-of-thought before answering. Give them a reasonable Max Token budget or the visible answer can come back empty.

## Shared features

Both nodes expose the same feature set:

- **Model dropdown fetched live** from the gateway (`GET /models`) — always up to date
- **Auto protocol routing**: Anthropic-family models (`claude-*`, `qwen*`) go through Messages API semantics, everything else through OpenAI Chat Completions (override in Options)
- **Credential connection test**: validates your API key with a tiny real request on the gateway's free model (~zero cost)
- Standard options: temperature, max tokens, top P, timeout, retries, streaming

They are built from one shared implementation (`nodes/shared/openCodeChatModel.ts`) — adding another OpenCode gateway later is ~15 lines of config.

## Install (private community node)

On a Docker setup, drop the package into your mounted `.n8n/nodes` directory:

```bash
DEST=/path/to/n8n-data/.n8n/nodes/node_modules/@bergeouss/n8n-nodes-opencode
git clone https://github.com/bergeouss/n8n-nodes-opencode.git "$DEST"
docker restart n8n
```

Both nodes appear in the palette after restart.

## Setup

1. Get an API key at [opencode.ai](https://opencode.ai) (workspace settings) — one key covers Zen and Go
2. In n8n → Credentials → create **OpenCode Zen API** and/or **OpenCode Go API**, paste the key (test button included)

## Usage

1. Add an **AI Agent** (or Chain) node
2. Under *Chat Model*, connect **OpenCode Zen Chat Model** or **OpenCode Go Chat Model**
3. Pick a model from the live dropdown, done

Free models work immediately; paid models require credits on your OpenCode workspace.

## How it works

The n8n Agent consumes LangChain `ChatModel` instances supplied by sub-nodes through `supplyData()`. Each node returns either a `ChatOpenAI` (base URL pointed at the chosen gateway) or a `ChatAnthropic` depending on the selected model — the OpenCode gateway routes by model ID, so one credential covers all families.

Built following the same pattern as n8n's official `LmChatOpenRouter` node.

## Dev

```bash
npm install
npm run build   # tsc + copies icons into dist/
```

## License

MIT — [Vincent / bergeouss](https://github.com/bergeouss) · [blog.brgv.fr](https://blog.brgv.fr)
