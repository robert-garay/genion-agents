import path from "node:path";
import { fileURLToPath } from "node:url";
import { runAgentTurn } from "../src/agent/loop.js";
import { loadProviderFromEnv } from "../src/provider/openai.js";
import { ToolRegistry } from "../src/tools/registry.js";
import type { Message } from "../src/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const memoryDir = path.join(workspaceRoot, ".data");

async function main(): Promise<void> {
  const provider = loadProviderFromEnv();
  if (!provider) {
    console.log(
      "Demo skipped: set OPENAI_API_KEY in .env (see .env.example). No mock LLM in MVP scaffold.",
    );
    process.exit(0);
  }

  const tools = new ToolRegistry();
  const toolContext = { workspaceRoot, memoryDir };
  let history: Message[] = [];

  console.log("--- Turn 1: remember a fact via memory_set ---");
  const turn1 = await runAgentTurn(
    'Use memory_set to store key "demo_user" with value "Alex". Then confirm with memory_get.',
    history,
    { provider, tools, toolContext },
  );
  history = turn1.messages.filter((m) => m.role !== "system");
  console.log(turn1.finalText);

  console.log("\n--- Turn 2: read README from workspace ---");
  const turn2 = await runAgentTurn(
    "Use read_file on path README.md and summarize the mission in one sentence.",
    history,
    { provider, tools, toolContext },
  );
  history = turn2.messages.filter((m) => m.role !== "system");
  console.log(turn2.finalText);

  console.log("\nDemo complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
