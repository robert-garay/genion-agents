import path from "node:path";
import { fileURLToPath } from "node:url";
import { runAgentTurn } from "../src/agent/loop.js";
import { loadProviderFromEnv } from "../src/provider/openai.js";
import {
  defaultManifestPath,
  dueRoutines,
  loadManifest,
  markRoutineDone,
  saveManifest,
} from "../src/routines/scheduled.js";
import { ToolRegistry } from "../src/tools/registry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const dataDir = path.join(workspaceRoot, ".data");

async function main(): Promise<void> {
  const manifestPath = defaultManifestPath(dataDir);
  let manifest = await loadManifest(manifestPath);
  const due = dueRoutines(manifest);
  if (due.length === 0) {
    console.log("No due routines.");
    return;
  }

  const provider = loadProviderFromEnv();
  if (!provider) {
    console.log("Cannot run routines: OPENAI_API_KEY not set.");
    process.exit(1);
  }

  const tools = new ToolRegistry();
  const toolContext = { workspaceRoot, memoryDir: dataDir };

  for (const routine of due) {
    console.log(
      `Running routine ${routine.id}: ${routine.prompt.slice(0, 60)}...`,
    );
    const result = await runAgentTurn(routine.prompt, [], {
      provider,
      tools,
      toolContext,
      systemPrompt: "You are a scheduled Genion routine runner. Be concise.",
    });
    console.log(result.finalText);
    manifest = markRoutineDone(manifest, routine.id);
    await saveManifest(manifestPath, manifest);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
