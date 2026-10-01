import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  type RoutineManifest,
  dueRoutines,
  markRoutineRan,
} from "../src/routines/scheduled.js";

describe("routines manifest", () => {
  it("returns due once routines by runAt", () => {
    const manifest: RoutineManifest = {
      routines: [
        {
          id: "a",
          runAt: "2020-01-01T00:00:00.000Z",
          prompt: "hi",
        },
      ],
    };
    const due = dueRoutines(manifest, new Date("2026-01-01T00:00:00.000Z"));
    assert.deepEqual(
      due.map((r) => r.id),
      ["a"],
    );
  });

  it("returns due cron routines from lastRunAt", () => {
    const manifest: RoutineManifest = {
      routines: [
        {
          id: "tick",
          kind: "cron",
          cron: "*/5 * * * *",
          prompt: "ping",
          lastRunAt: "2026-01-01T12:00:00.000Z",
        },
      ],
    };
    const due = dueRoutines(manifest, new Date("2026-01-01T12:06:00.000Z"));
    assert.deepEqual(
      due.map((r) => r.id),
      ["tick"],
    );
  });

  it("marks once routine done and cron routine with lastRunAt", () => {
    const manifest: RoutineManifest = {
      routines: [
        { id: "once", runAt: "2020-01-01T00:00:00.000Z", prompt: "x" },
        { id: "cron", kind: "cron", cron: "* * * * *", prompt: "y" },
      ],
    };
    const at = new Date("2026-01-01T12:00:00.000Z");
    const next = markRoutineRan(manifest, "once", at);
    const once = next.routines.find((r) => r.id === "once");
    assert.ok(once && "done" in once);
    assert.equal(once.done, true);

    const next2 = markRoutineRan(next, "cron", at);
    const cron = next2.routines.find((r) => r.id === "cron");
    assert.equal(cron?.lastRunAt, at.toISOString());
  });
});
