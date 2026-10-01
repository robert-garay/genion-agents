/** Minimal 5-field cron (minute hour day month weekday). UTC only for MVP. */

export type CronField = {
  kind: "any" | "step" | "exact" | "list" | "range";
  step?: number;
  exact?: number;
  list?: number[];
  range?: { from: number; to: number };
};

export type CronExpression = [
  CronField,
  CronField,
  CronField,
  CronField,
  CronField,
];

const FIELD_RANGES = [
  { min: 0, max: 59 },
  { min: 0, max: 23 },
  { min: 1, max: 31 },
  { min: 1, max: 12 },
  { min: 0, max: 7 },
] as const;

function parseField(part: string, index: number): CronField {
  const { min, max } = FIELD_RANGES[index];
  if (part === "*") {
    return { kind: "any" };
  }
  if (part.startsWith("*/")) {
    const step = Number.parseInt(part.slice(2), 10);
    if (!Number.isFinite(step) || step < 1) {
      throw new Error(`invalid_cron_step:${part}`);
    }
    return { kind: "step", step };
  }
  if (part.includes("-")) {
    const [fromRaw, toRaw] = part.split("-");
    const from = Number.parseInt(fromRaw, 10);
    const to = Number.parseInt(toRaw, 10);
    if (
      !Number.isFinite(from) ||
      !Number.isFinite(to) ||
      from < min ||
      to > max ||
      from > to
    ) {
      throw new Error(`invalid_cron_range:${part}`);
    }
    return { kind: "range", range: { from, to } };
  }
  if (part.includes(",")) {
    const list = part.split(",").map((s) => Number.parseInt(s, 10));
    if (list.some((n) => !Number.isFinite(n) || n < min || n > max)) {
      throw new Error(`invalid_cron_list:${part}`);
    }
    return { kind: "list", list };
  }
  const exact = Number.parseInt(part, 10);
  if (!Number.isFinite(exact) || exact < min || exact > max) {
    throw new Error(`invalid_cron_field:${part}`);
  }
  return { kind: "exact", exact };
}

export function parseCronExpression(expression: string): CronExpression {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`invalid_cron_fields:${expression}`);
  }
  return parts.map((part, i) => parseField(part, i)) as CronExpression;
}

function fieldMatches(field: CronField, value: number): boolean {
  switch (field.kind) {
    case "any":
      return true;
    case "step":
      return value % (field.step ?? 1) === 0;
    case "exact":
      return value === field.exact;
    case "list":
      return (field.list ?? []).includes(value);
    case "range":
      return (
        value >= (field.range?.from ?? 0) && value <= (field.range?.to ?? 0)
      );
    default:
      return false;
  }
}

/** True when all cron fields match the given instant (UTC). */
export function cronMatches(expression: string, date: Date): boolean {
  const cron = parseCronExpression(expression);
  const minute = date.getUTCMinutes();
  const hour = date.getUTCHours();
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const weekday = date.getUTCDay();

  return (
    fieldMatches(cron[0], minute) &&
    fieldMatches(cron[1], hour) &&
    fieldMatches(cron[2], day) &&
    fieldMatches(cron[3], month) &&
    fieldMatches(cron[4], weekday)
  );
}

function truncateToMinuteUtc(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      0,
      0,
    ),
  );
}

/**
 * Latest cron fire at or before `before`, strictly after `after`.
 * Walks minute-by-minute (fine for short poll windows).
 */
export function latestCronFireBetween(
  expression: string,
  after: Date,
  before: Date,
): Date | null {
  if (before.getTime() <= after.getTime()) {
    return null;
  }
  let cursor = truncateToMinuteUtc(after);
  cursor = new Date(cursor.getTime() + 60_000);
  const end = truncateToMinuteUtc(before);

  let latest: Date | null = null;
  while (cursor.getTime() <= end.getTime()) {
    if (cronMatches(expression, cursor)) {
      latest = new Date(cursor);
    }
    cursor = new Date(cursor.getTime() + 60_000);
  }
  return latest;
}

export function isCronDue(
  expression: string,
  lastRunAt: Date | null,
  now: Date,
): boolean {
  const after = lastRunAt ?? new Date(0);
  return latestCronFireBetween(expression, after, now) !== null;
}
