export type TaskFrequency = "once" | "daily" | "weekly" | "monthly";

export const DEFAULT_TASK_TIMEZONE = "Africa/Lagos";

const RECURRING: TaskFrequency[] = ["daily", "weekly", "monthly"];

export function isRecurringFrequency(frequency: string | null | undefined): frequency is Exclude<TaskFrequency, "once"> {
  return RECURRING.includes((frequency ?? "once") as TaskFrequency);
}

/** Parts of a date in a given IANA timezone. */
function zonedParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
  ) as Record<string, string>;

  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const weekday = parts.weekday; // Sun, Mon, ...
  return { year, month, day, weekday };
}

/** Monday-based ISO week number for a calendar date in the task timezone. */
function isoWeekKey(year: number, month: number, day: number): string {
  // Use UTC noon on the calendar date to avoid DST edge cases.
  const utc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  // ISO week: Thursday determines the year; week starts Monday.
  const dayNum = utc.getUTCDay() || 7; // 1=Mon ... 7=Sun
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const isoYear = utc.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

export function getPeriodKey(
  frequency: TaskFrequency | string,
  date: Date = new Date(),
  timeZone: string = DEFAULT_TASK_TIMEZONE,
): string | null {
  if (frequency === "once" || !frequency) return null;
  const { year, month, day } = zonedParts(date, timeZone);
  if (frequency === "daily") {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  if (frequency === "weekly") {
    return isoWeekKey(year, month, day);
  }
  if (frequency === "monthly") {
    return `${year}-${String(month).padStart(2, "0")}`;
  }
  return null;
}

export function periodLabel(frequency: TaskFrequency | string): string {
  switch (frequency) {
    case "daily":
      return "today";
    case "weekly":
      return "this week";
    case "monthly":
      return "this month";
    default:
      return "once";
  }
}

function addCalendarDay(year: number, month: number, day: number, delta: number) {
  const d = new Date(Date.UTC(year, month - 1, day + delta, 12, 0, 0));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    weekday: "",
  };
}

function parseYmd(key: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/** List expected period keys from startsAt through end (inclusive), capped for safety. */
export function listExpectedPeriodKeys(
  frequency: TaskFrequency | string,
  startsAt: Date | string,
  endsAt: Date | string | null | undefined,
  timeZone: string = DEFAULT_TASK_TIMEZONE,
  now: Date = new Date(),
  maxKeys = 400,
): string[] {
  if (!isRecurringFrequency(frequency)) return [];

  const start = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
  const endCap =
    endsAt != null && endsAt !== ""
      ? typeof endsAt === "string"
        ? new Date(endsAt)
        : endsAt
      : now;
  const end = endCap.getTime() < now.getTime() ? endCap : now;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];

  const keys: string[] = [];
  const seen = new Set<string>();

  if (frequency === "daily") {
    let cursor = zonedParts(start, timeZone);
    const endParts = zonedParts(end, timeZone);
    while (keys.length < maxKeys) {
      const key = `${cursor.year}-${String(cursor.month).padStart(2, "0")}-${String(cursor.day).padStart(2, "0")}`;
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
      if (
        cursor.year === endParts.year &&
        cursor.month === endParts.month &&
        cursor.day === endParts.day
      ) {
        break;
      }
      cursor = addCalendarDay(cursor.year, cursor.month, cursor.day, 1);
    }
    return keys;
  }

  if (frequency === "weekly") {
    let cursor = zonedParts(start, timeZone);
    const endKey = getPeriodKey("weekly", end, timeZone);
    while (keys.length < maxKeys) {
      const key = isoWeekKey(cursor.year, cursor.month, cursor.day);
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
      if (key === endKey) break;
      cursor = addCalendarDay(cursor.year, cursor.month, cursor.day, 7);
    }
    return keys;
  }

  // monthly
  let { year, month } = zonedParts(start, timeZone);
  const endParts = zonedParts(end, timeZone);
  while (keys.length < maxKeys) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
    if (year === endParts.year && month === endParts.month) break;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return keys;
}

export function isCurrentPeriodComplete(
  completedPeriodKeys: Iterable<string>,
  periodKey: string | null,
): boolean {
  if (!periodKey) return false;
  const set = completedPeriodKeys instanceof Set ? completedPeriodKeys : new Set(completedPeriodKeys);
  return set.has(periodKey);
}

export function completionRate(completed: number, expected: number): number {
  if (expected <= 0) return 0;
  return Math.round((completed / expected) * 100);
}

/** Guard: unused helper kept for callers that parse daily keys. */
export function isValidDailyPeriodKey(key: string): boolean {
  return parseYmd(key) != null;
}
