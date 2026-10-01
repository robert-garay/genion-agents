import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadProviderFromEnv } from "../src/provider/openai.js";
import { runDueRoutines } from "../src/routines/run-due.js";
import { ToolRegistry } from "../src/tools/registry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const dataDir = path.join(workspaceRoot, ".data");
const dryRun = process.argv.includes("--dry-run");

async function main(): Promise<void> {
  const provider = loadProviderFromEnv();
  if (!provider && !dryRun) {
    console.log("Cannot run routines: OPENAI_API_KEY not set.");
    process.exit(1);
  }

  const tools = new ToolRegistry();
  const toolContext = { workspaceRoot, memoryDir: dataDir };

  const { ran } = await runDueRoutines({
    dataDir,
    dryRun,
    ...(provider ? { agent: { provider, tools, toolContext } } : {}),
  });

  if (ran.length === 0) {
    console.log("No due routines.");
    return;
  }

  if (dryRun) {
    console.log(`Due (${ran.length}): ${ran.map((r) => r.id).join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
