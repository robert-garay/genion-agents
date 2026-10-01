import fs from "node:fs/promises";
import path from "node:path";

/** One routine type for MVP: cron-like schedule entries in a JSON manifest. */
export interface ScheduledRoutine {
  id: string;
  /** ISO-8601 datetime; run when now >= runAt and not yet marked done */
  runAt: string;
  prompt: string;
  done?: boolean;
}

export interface RoutineManifest {
  routines: ScheduledRoutine[];
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

/** Returns routines that are due and not done. Does not mark them done (caller runs agent then marks). */
export function dueRoutines(
  manifest: RoutineManifest,
  now = new Date(),
): ScheduledRoutine[] {
  return manifest.routines.filter((r) => {
    if (r.done) return false;
    const at = Date.parse(r.runAt);
    return !Number.isNaN(at) && at <= now.getTime();
  });
}

export function markRoutineDone(
  manifest: RoutineManifest,
  id: string,
): RoutineManifest {
  return {
    routines: manifest.routines.map((r) =>
      r.id === id ? { ...r, done: true } : r,
    ),
  };
}

export function defaultManifestPath(dataDir: string): string {
  return path.join(dataDir, "routines.json");
}
