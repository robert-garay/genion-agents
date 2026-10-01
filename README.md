# Genion Agents

Genion Agents is a Muse/Grok-Bot-class agent runtime: a loop that calls a model, executes tools, keeps memory, and can wake on routines. It is a sibling product to [OpenChat](https://github.com/robert-garay/openchat), not a fork of it.

**Linear project:** [Genion Agents](https://linear.app/genion/project/genion-agents-45c6d41757ab)

## MVP scope (this repo)

- Agent turn loop (message → model → optional tool calls → reply)
- Tool registry with JSON schemas and stub implementations: `fetch_url`, `read_file`, `memory_get`, `memory_set`
- File-backed memory under `.data/`
- One routine type: scheduled entries in `.data/routines.json` (see `ARCHITECTURE.md`)
- BYOK: bring your own OpenAI-compatible API key

## Out of scope (for now)

- Hosted multi-tenant runtime, billing, or paid infra
- Full computer-use or browser automation (documented as a thin future path only)
- OpenChat integration or modifications to OpenChat
- Production-grade auth, observability, or agent marketplace

**Product shape:** default assumption is a standalone sibling app next to OpenChat. Whether Genion ships as a fork of OpenChat is **TBD Verify** in product planning.

## Requirements

- Node.js 20+
- An OpenAI-compatible chat completions API key

## Setup (BYOK)

```bash
cp .env.example .env
# Edit .env and set OPENAI_API_KEY
npm install
```

Optional env vars:

| Variable | Default |
|----------|---------|
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | `gpt-4o-mini` |

## Run the demo

With a valid key in `.env`:

```bash
npm run demo
```

The demo runs two scripted turns: store/read memory, then read `README.md` via `read_file`.

Without a key, the demo exits with a clear message (no synthetic LLM responses).

## Other scripts

```bash
npm run typecheck
npm run lint
npm run build
npm run routine:run   # run due scheduled routines (needs API key)
```

## Layout

- `src/agent/` — turn loop
- `src/tools/` — registry and tools
- `src/memory/` — file store
- `src/routines/` — scheduled routine manifest
- `src/provider/` — OpenAI-compatible client
- `scripts/demo.ts` — multi-turn demo

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the system spine.

## License

MIT
