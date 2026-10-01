# Genion Agents architecture (MVP)

Plain-language overview of the six-part spine for the MVP scaffold. This is not a large framework; it is a small runnable skeleton you can grow.

## 1. Agent loop

The core is a turn loop in `src/agent/loop.ts`:

1. Append the user message to history (plus an optional system prompt).
2. Call the model with tool definitions.
3. If the model returns tool calls, run each through the registry and append tool results.
4. Repeat until the model returns text with no tool calls, or until `maxTurns`.

The demo in `scripts/demo.ts` exercises memory, `read_file`, and `fetch_url` in one session. `scripts/tools-smoke.ts` calls the same three capabilities directly (no model).

## 2. Tool registry

`src/tools/registry.ts` holds named tools with JSON Schema parameters and async handlers. MVP tools:

| Tool | Purpose |
|------|---------|
| `fetch_url` | HTTP GET with timeout and max body size |
| `read_file` | Read UTF-8 text only under the workspace root |
| `memory_get` | Read a key from durable memory |
| `memory_set` | Write a key to durable memory |

Adding a tool: implement `RegisteredTool` (definition + handler), register in the default list or pass a custom array to `ToolRegistry`.

## 3. Memory and identity

**Memory (implemented):** `FileMemoryStore` persists a JSON map at `.data/memory.json`. Tools `memory_get` and `memory_set` are the agent-facing API.

**Identity (stub):** No separate identity service in MVP. System prompt and memory keys stand in for persona and long-term facts. Future: agent id, workspace id, and scoped memory namespaces.

## 4. Routines and wake

**Routine type (implemented): cron + one-shot manifest**

- File: `.data/routines.json` (copy from `routines.example.json` to seed)
- Shapes:
  - Cron: `{ "id", "kind": "cron", "cron": "*/5 * * * *", "prompt", "quiet?", "lastRunAt?" }` (UTC, 5-field cron)
  - One-shot: `{ "id", "runAt" (ISO time), "prompt", "done?", "quiet?" }`
- Helpers: `npm run routine:add` writes/updates entries; `src/routines/cron.ts` parses schedules.
- Run once: `npm run routine:run` loads due entries, runs the agent loop, delivers output, updates `lastRunAt` or `done`.
- Delivery: `.data/routine-deliveries.jsonl` (append-only). Stdout unless `quiet: true`.

**Wake (local MVP):** `npm run routine:watch` polls every `ROUTINE_POLL_MS` (default 30s) and calls the same runner. This only fires while the Node process stays up (your Mac awake, a terminal open, or a local launchd/cron job wrapping `routine:run`). There is no cloud scheduler in this repo yet.

**Wake (future):** file-watch or webhook to enqueue work without polling.

## 5. Computer and browser path (thin)

Not implemented in MVP. Intended direction:

- **Computer use:** optional tool that delegates to a sandbox or desktop automation layer (out of scope for this repo's first commit).
- **Browser:** optional tool wrapping headless fetch or a real browser session for interactive sites.

For now, `fetch_url` covers read-only HTTP. Keep computer/browser behind the same registry pattern when added.

## 6. Product shape

- **Runtime:** Node 20+, TypeScript, BYOK provider client (`src/provider/openai.ts`).
- **Deployment:** local or self-hosted; no required cloud services.
- **Relation to OpenChat:** separate codebase and roadmap; sibling app by default. OpenChat fork mode is TBD Verify.

## Data on disk

| Path | Role |
|------|------|
| `.data/memory.json` | Durable key-value memory |
| `.data/routines.json` | Cron and one-shot routines |
| `.data/routine-deliveries.jsonl` | Routine run outputs |

Both are gitignored. Secrets live only in `.env`.

## CI

GitHub Actions runs `typecheck`, `lint`, `test`, and `tools:smoke` on push/PR.
