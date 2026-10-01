# Genion Agents architecture (MVP)

Plain-language overview of the six-part spine for the MVP scaffold. This is not a large framework; it is a small runnable skeleton you can grow.

## 1. Agent loop

The core is a turn loop in `src/agent/loop.ts`:

1. Append the user message to history (plus an optional system prompt).
2. Call the model with tool definitions.
3. If the model returns tool calls, run each through the registry and append tool results.
4. Repeat until the model returns text with no tool calls, or until `maxTurns`.

The demo in `scripts/demo.ts` exercises multiple turns including tool use.

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

**Routine type (implemented): scheduled manifest**

- File: `.data/routines.json` (copy from `routines.example.json` to seed)
- Shape: `{ "routines": [{ "id", "runAt" (ISO time), "prompt", "done?" }] }`
- Runner: `npm run routine:run` loads due entries, runs the agent loop with each prompt, marks `done`.

**Wake (stub):** File-watch or webhook wake is not implemented. Documented target: external event enqueues a routine or injects a user message into the loop. Scheduled routines prove the "run later" path.

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
| `.data/routines.json` | Scheduled routines |

Both are gitignored. Secrets live only in `.env`.

## CI

GitHub Actions runs `npm run typecheck` and `npm run lint` on push/PR.
