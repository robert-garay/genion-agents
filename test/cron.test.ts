import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cronMatches,
  isCronDue,
  latestCronFireBetween,
  parseCronExpression,
} from "../src/routines/cron.js";

describe("cron", () => {
  it("parses */5 * * * *", () => {
    const expr = parseCronExpression("*/5 * * * *");
    assert.equal(expr.length, 5);
  });

  it("matches every five minutes", () => {
    const d = new Date("2026-01-01T12:05:00.000Z");
    assert.equal(cronMatches("*/5 * * * *", d), true);
    const d2 = new Date("2026-01-01T12:07:00.000Z");
    assert.equal(cronMatches("*/5 * * * *", d2), false);
  });

  it("detects due when a fire fell between last run and now", () => {
    const last = new Date("2026-01-01T12:00:00.000Z");
    const now = new Date("2026-01-01T12:06:00.000Z");
    assert.equal(isCronDue("*/5 * * * *", last, now), true);
  });

  it("finds latest fire in window", () => {
    const after = new Date("2026-01-01T12:00:00.000Z");
    const before = new Date("2026-01-01T12:11:00.000Z");
    const fire = latestCronFireBetween("*/5 * * * *", after, before);
    assert.equal(fire?.toISOString(), "2026-01-01T12:10:00.000Z");
  });
});
