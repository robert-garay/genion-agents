import type { AgentLoopOptions } from "../agent/loop.js";
import { runAgentTurn } from "../agent/loop.js";
import { latestCronFireBetween } from "./cron.js";
import { deliverRoutineResult } from "./delivery.js";
import type { RoutineManifest, ScheduledRoutine } from "./scheduled.js";
import {
  defaultManifestPath,
  dueRoutines,
  isCronRoutine,
  loadManifest,
  markRoutineRan,
  saveManifest,
} from "./scheduled.js";

function finishedAtForRoutine(routine: ScheduledRoutine, now: Date): Date {
  if (!isCronRoutine(routine)) {
    return now;
  }
  const last = routine.lastRunAt ? new Date(routine.lastRunAt) : new Date(0);
  return latestCronFireBetween(routine.cron, last, now) ?? now;
}

export interface RunDueRoutinesOptions {
  dataDir: string;
  manifestPath?: string;
  agent?: AgentLoopOptions;
  now?: Date;
  /** When set, list due routines without calling the model. */
  dryRun?: boolean;
}

export interface RunDueRoutinesResult {
  manifest: RoutineManifest;
  ran: ScheduledRoutine[];
  skippedReason?: string;
}

export async function runDueRoutines(
  options: RunDueRoutinesOptions,
): Promise<RunDueRoutinesResult> {
  const manifestPath =
    options.manifestPath ?? defaultManifestPath(options.dataDir);
  let manifest = await loadManifest(manifestPath);
  const due = dueRoutines(manifest, options.now);
  if (due.length === 0) {
    return { manifest, ran: [] };
  }

  if (options.dryRun) {
    return { manifest, ran: due };
  }

  if (!options.agent) {
    return { manifest, ran: [], skippedReason: "missing_agent" };
  }

  const ran: ScheduledRoutine[] = [];

  const now = options.now ?? new Date();

  for (const routine of due) {
    const finishedAt = finishedAtForRoutine(routine, now);
    console.log(
      `Running routine ${routine.id}: ${routine.prompt.slice(0, 60)}...`,
    );
    const agent = options.agent;
    const result = await runAgentTurn(routine.prompt, [], {
      ...agent,
      systemPrompt:
        agent.systemPrompt ??
        "You are a scheduled Genion routine runner. Be concise.",
    });
    await deliverRoutineResult(options.dataDir, {
      routineId: routine.id,
      finishedAt: finishedAt.toISOString(),
      finalText: result.finalText,
      quiet: routine.quiet ?? false,
    });
    manifest = markRoutineRan(manifest, routine.id, finishedAt);
    await saveManifest(manifestPath, manifest);
    ran.push(routine);
  }

  return { manifest, ran };
}
