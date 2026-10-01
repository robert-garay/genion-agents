import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadProviderFromEnv } from "../src/provider/openai.js";
import { runDueRoutines } from "../src/routines/run-due.js";
import { ToolRegistry } from "../src/tools/registry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const dataDir = path.join(workspaceRoot, ".data");

function pollIntervalMs(): number {
  const raw = process.env.ROUTINE_POLL_MS;
  if (!raw) return 30_000;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 5_000 ? n : 30_000;
}

async function tick(): Promise<void> {
  const provider = loadProviderFromEnv();
  if (!provider) {
    console.log("Routine watch: OPENAI_API_KEY not set; skipping tick.");
    return;
  }
  const tools = new ToolRegistry();
  const toolContext = { workspaceRoot, memoryDir: dataDir };
  await runDueRoutines({
    dataDir,
    agent: { provider, tools, toolContext },
  });
}

async function main(): Promise<void> {
  const intervalMs = pollIntervalMs();
  console.log(
    `Routine watch started (poll every ${intervalMs}ms). Runs only while this process stays up.`,
  );
  await tick();
  setInterval(() => {
    tick().catch((err) => {
      console.error("Routine watch tick failed:", err);
    });
  }, intervalMs);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
