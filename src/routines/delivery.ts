import fs from "node:fs/promises";
import path from "node:path";

export interface RoutineDeliveryRecord {
  routineId: string;
  finishedAt: string;
  finalText: string;
  quiet: boolean;
}

export function deliveriesPath(dataDir: string): string {
  return path.join(dataDir, "routine-deliveries.jsonl");
}

export async function deliverRoutineResult(
  dataDir: string,
  record: RoutineDeliveryRecord,
): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  const line = `${JSON.stringify(record)}\n`;
  await fs.appendFile(deliveriesPath(dataDir), line, "utf8");
  if (!record.quiet) {
    console.log(`[routine:${record.routineId}] ${record.finalText}`);
  }
}
