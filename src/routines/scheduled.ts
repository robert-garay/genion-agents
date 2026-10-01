import fs from "node:fs/promises";
import path from "node:path";
import { isCronDue } from "./cron.js";

/** One-shot: run once at runAt. Cron: repeat on a 5-field schedule (UTC). */
export type RoutineKind = "once" | "cron";

interface RoutineBase {
  id: string;
  prompt: string;
  /** When true, still log to routine-deliveries.jsonl but skip stdout. */
  quiet?: boolean;
  /** ISO time of last successful run (cron repeats use this). */
  lastRunAt?: string;
}

export interface OnceRoutine extends RoutineBase {
  kind?: "once";
  runAt: string;
  done?: boolean;
}

export interface CronRoutine extends RoutineBase {
  kind: "cron";
  cron: string;
}

export type ScheduledRoutine = OnceRoutine | CronRoutine;

export interface RoutineManifest {
  routines: ScheduledRoutine[];
}

export function routineKind(routine: ScheduledRoutine): RoutineKind {
  if (routine.kind === "cron" || ("cron" in routine && routine.cron)) {
    return "cron";
  }
  return "once";
}

export function isCronRoutine(
  routine: ScheduledRoutine,
): routine is CronRoutine {
  return routineKind(routine) === "cron";
}

export function isOnceRoutine(
  routine: ScheduledRoutine,
): routine is OnceRoutine {
  return routineKind(routine) === "once";
}

export async function loadManifest(
  manifestPath: string,
): Promise<RoutineManifest> {
  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    return JSON.parse(raw) as RoutineManifest;
  } catch {
    return { routines: [] };
  }
}

export async function saveManifest(
  manifestPath: string,
  manifest: RoutineManifest,
): Promise<void> {
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(
    manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

export function isRoutineDue(
  routine: ScheduledRoutine,
  now = new Date(),
): boolean {
  if (isOnceRoutine(routine)) {
    if (routine.done) return false;
    const at = Date.parse(routine.runAt);
    return !Number.isNaN(at) && at <= now.getTime();
  }
  const last = routine.lastRunAt ? new Date(routine.lastRunAt) : null;
  return isCronDue(routine.cron, last, now);
}

/** Returns routines that should run now. Does not mutate the manifest. */
export function dueRoutines(
  manifest: RoutineManifest,
  now = new Date(),
): ScheduledRoutine[] {
  return manifest.routines.filter((r) => isRoutineDue(r, now));
}

export function markRoutineRan(
  manifest: RoutineManifest,
  id: string,
  finishedAt: Date,
): RoutineManifest {
  return {
    routines: manifest.routines.map((r) => {
      if (r.id !== id) return r;
      if (isOnceRoutine(r)) {
        return { ...r, done: true, lastRunAt: finishedAt.toISOString() };
      }
      return { ...r, lastRunAt: finishedAt.toISOString() };
    }),
  };
}

/** @deprecated Use markRoutineRan */
export function markRoutineDone(
  manifest: RoutineManifest,
  id: string,
): RoutineManifest {
  return markRoutineRan(manifest, id, new Date());
}

export function upsertRoutine(
  manifest: RoutineManifest,
  routine: ScheduledRoutine,
): RoutineManifest {
  const rest = manifest.routines.filter((r) => r.id !== routine.id);
  return { routines: [...rest, routine] };
}

export function defaultManifestPath(dataDir: string): string {
  return path.join(dataDir, "routines.json");
}
