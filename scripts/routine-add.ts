import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCronExpression } from "../src/routines/cron.js";
import type { CronRoutine, OnceRoutine } from "../src/routines/scheduled.js";
import {
  defaultManifestPath,
  loadManifest,
  saveManifest,
  upsertRoutine,
} from "../src/routines/scheduled.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const dataDir = path.join(workspaceRoot, ".data");

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i === -1 || i + 1 >= process.argv.length) return undefined;
  return process.argv[i + 1];
}

async function main(): Promise<void> {
  const id = argValue("--id");
  const prompt = argValue("--prompt");
  const cron = argValue("--cron");
  const runAt = argValue("--run-at");
  const quiet = process.argv.includes("--quiet");

  if (!id || !prompt) {
    console.log(
      "Usage: npm run routine:add -- --id <id> --prompt <text> (--cron '*/5 * * * *' | --run-at ISO)",
    );
    process.exit(1);
  }

  if (!cron && !runAt) {
    console.log("Provide --cron or --run-at.");
    process.exit(1);
  }
  if (cron && runAt) {
    console.log("Use only one of --cron or --run-at.");
    process.exit(1);
  }

  let routine: CronRoutine | OnceRoutine;
  if (cron) {
    parseCronExpression(cron);
    routine = { id, prompt, kind: "cron", cron, quiet: quiet || undefined };
  } else {
    routine = { id, prompt, runAt: runAt as string, quiet: quiet || undefined };
  }

  const manifestPath = defaultManifestPath(dataDir);
  const manifest = upsertRoutine(await loadManifest(manifestPath), routine);
  await saveManifest(manifestPath, manifest);
  console.log(`Saved routine "${id}" to ${manifestPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
