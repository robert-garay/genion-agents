# Genion Agents

Genion Agents is a Muse/Grok-Bot-class agent runtime: a loop that calls a model, executes tools, keeps memory, and can wake on routines. It is a sibling product to [OpenChat](https://github.com/robert-garay/openchat), not a fork of it.

**Linear project:** [Genion Agents](https://linear.app/genion/project/genion-agents-45c6d41757ab)

## MVP scope (this repo)

- Agent turn loop (message → model → optional tool calls → reply)
- Tool registry with JSON schemas and handlers: `fetch_url`, `read_file`, `memory_get`, `memory_set`
- File-backed memory under `.data/`
- One routine type: cron and one-shot entries in `.data/routines.json` (see `ARCHITECTURE.md`)
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

The demo runs three turns in one session: memory set/get, `read_file` on `README.md`, then `fetch_url` on example.com.

Without a key, the demo exits with a clear message (no synthetic LLM responses).

Verify tools without an API key:

```bash
npm test
npm run tools:smoke
```

## Other scripts

```bash
npm run typecheck
npm run lint
npm run build
npm run routine:run   # run due routines once (needs API key)
npm run routine:watch # poll and run due routines (needs API key; stays up locally)
npm run routine:add -- --id my-cron --prompt "Your task" --cron "*/5 * * * *"
```

### Cron routines (local MVP)

1. Copy the example manifest: `mkdir -p .data && cp routines.example.json .data/routines.json`
2. Edit schedules or add one with `npm run routine:add`.
3. Start the watcher (runs only while this terminal/process is up, e.g. Mac awake):

```bash
npm run routine:watch
```

4. Results append to `.data/routine-deliveries.jsonl` and print to stdout unless `quiet: true`.

One-shot check without an API key: `npm run routine:run -- --dry-run`

**Limitation:** there is no hosted always-on scheduler yet. Use `routine:watch`, launchd, or cron on your machine to keep the runner alive.

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
