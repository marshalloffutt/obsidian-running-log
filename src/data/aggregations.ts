import { RunSummary, MileageBucket, PacePoint, HeatmapDay, StreakSummary } from "./types";
import { metersToUnit } from "../util/units";
import { paceSecondsPerUnit, speedUnitsPerHour, movingAverage } from "../util/pace";
import { localDateStr, today, addDays, addMonths, weekStart, monthStart } from "../util/dates";

// ─── Weekly mileage ──────────────────────────────────────────────────────────

export function byWeek(
  runs: RunSummary[],
  opts: {
    unit: "mi" | "km";
    weekStartsOn: "monday" | "sunday";
    last?: number;
    from?: string;
    to?: string;
  }
): MileageBucket[] {
  const toDate = opts.to ?? today();
  const lastN = opts.last ?? 12;
  const fromDate = opts.from ?? addDays(weekStart(toDate, opts.weekStartsOn), -(lastN - 1) * 7);

  const firstBucket = weekStart(fromDate, opts.weekStartsOn);
  const lastBucket = weekStart(toDate, opts.weekStartsOn);

  const runsByBucket = new Map<string, RunSummary[]>();
  for (const run of runs) {
    const date = localDateStr(run.startTime);
    if (date < fromDate || date > toDate) continue;
    const bucket = weekStart(date, opts.weekStartsOn);
    if (bucket < firstBucket || bucket > lastBucket) continue;
    const arr = runsByBucket.get(bucket) ?? [];
    arr.push(run);
    runsByBucket.set(bucket, arr);
  }

  const result: MileageBucket[] = [];
  let current = firstBucket;
  while (current <= lastBucket) {
    const week = runsByBucket.get(current) ?? [];
    result.push({
      periodStart: current,
      distance: week.reduce((s, r) => s + metersToUnit(r.distanceMeters, opts.unit), 0),
      runCount: week.length,
    });
    current = addDays(current, 7);
  }
  return result;
}

// ─── Monthly mileage ─────────────────────────────────────────────────────────

export function byMonth(
  runs: RunSummary[],
  opts: {
    unit: "mi" | "km";
    last?: number;
    from?: string;
    to?: string;
  }
): MileageBucket[] {
  const toDate = opts.to ?? today();
  const lastN = opts.last ?? 12;
  const currentMonth = monthStart(toDate);
  const fromMonth = opts.from ? monthStart(opts.from) : addMonths(currentMonth, -(lastN - 1));

  const runsByMonth = new Map<string, RunSummary[]>();
  for (const run of runs) {
    const month = monthStart(localDateStr(run.startTime));
    if (month < fromMonth || month > currentMonth) continue;
    const arr = runsByMonth.get(month) ?? [];
    arr.push(run);
    runsByMonth.set(month, arr);
  }

  const result: MileageBucket[] = [];
  let current = fromMonth;
  while (current <= currentMonth) {
    const month = runsByMonth.get(current) ?? [];
    result.push({
      periodStart: current,
      distance: month.reduce((s, r) => s + metersToUnit(r.distanceMeters, opts.unit), 0),
      runCount: month.length,
    });
    current = addMonths(current, 1);
  }
  return result;
}

// ─── Pace trend ──────────────────────────────────────────────────────────────

export function paceSeries(
  runs: RunSummary[],
  opts: {
    unit: "mi" | "km";
    last?: number; // days
    from?: string;
    to?: string;
    metric?: "pace" | "speed";
    smoothing?: number;
    minDistanceMeters?: number;
  }
): PacePoint[] {
  const toDate = opts.to ?? today();
  const lastN = opts.last ?? 90;
  const fromDate = opts.from ?? addDays(toDate, -(lastN - 1));
  const metric = opts.metric ?? "pace";
  const smoothingWindow = opts.smoothing ?? 0;
  const minDist = opts.minDistanceMeters ?? 0;

  const qualifying = runs.filter((r) => {
    const date = localDateStr(r.startTime);
    return date >= fromDate && date <= toDate && r.distanceMeters >= minDist;
  });

  const rawValues = qualifying.map((r) =>
    metric === "pace"
      ? paceSecondsPerUnit(r.distanceMeters, r.durationSeconds, opts.unit)
      : speedUnitsPerHour(r.distanceMeters, r.durationSeconds, opts.unit)
  );

  const smoothed = smoothingWindow > 1 ? movingAverage(rawValues, smoothingWindow) : rawValues;

  return qualifying.map((r, i) => ({
    date: localDateStr(r.startTime),
    paceSecondsPerUnit: smoothed[i],
  }));
}

// ─── Calendar heatmap ────────────────────────────────────────────────────────

export function heatmapDays(
  runs: RunSummary[],
  opts: {
    unit: "mi" | "km";
    year?: number;
    last?: number;
    metric?: "distance" | "duration" | "count";
    levels?: number;
  }
): HeatmapDay[] {
  const metric = opts.metric ?? "distance";
  const levels = opts.levels ?? 5;

  let fromDate: string;
  let toDate: string;
  if (opts.year !== undefined) {
    fromDate = `${opts.year}-01-01`;
    toDate = `${opts.year}-12-31`;
  } else {
    toDate = today();
    fromDate = addDays(toDate, -(opts.last ?? 365) + 1);
  }

  const byDate = new Map<string, RunSummary[]>();
  for (const run of runs) {
    const date = localDateStr(run.startTime);
    if (date < fromDate || date > toDate) continue;
    const arr = byDate.get(date) ?? [];
    arr.push(run);
    byDate.set(date, arr);
  }

  if (byDate.size === 0) return [];

  const days = Array.from(byDate.entries()).map(([date, dayRuns]) => {
    const distance = dayRuns.reduce((s, r) => s + metersToUnit(r.distanceMeters, opts.unit), 0);
    const rawValue =
      metric === "distance" ? distance :
      metric === "duration" ? dayRuns.reduce((s, r) => s + r.durationSeconds, 0) :
      dayRuns.length;
    return { date, distance, runCount: dayRuns.length, rawValue };
  });

  const maxVal = Math.max(...days.map((d) => d.rawValue));
  return days
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ date, distance, runCount, rawValue }) => ({
      date,
      distance,
      runCount,
      intensity: maxVal > 0 ? Math.ceil((rawValue / maxVal) * levels) / levels : 0,
    }));
}

// ─── Streak tracker ──────────────────────────────────────────────────────────

export function streaks(
  runs: RunSummary[],
  opts: {
    unit: "day" | "week";
    weekStartsOn: "monday" | "sunday";
    minDistanceMeters?: number;
  }
): StreakSummary {
  const minDist = opts.minDistanceMeters ?? 0;
  const qualifying = runs.filter((r) => r.distanceMeters >= minDist);

  if (qualifying.length === 0) {
    return { currentStreak: 0, longestStreak: 0, unit: opts.unit, lastRunDate: null };
  }

  const lastRunDate = localDateStr(qualifying[qualifying.length - 1].startTime);

  // Build a set of unique periods (day strings or week-start strings)
  const periodSet = new Set<string>();
  for (const r of qualifying) {
    const date = localDateStr(r.startTime);
    periodSet.add(opts.unit === "week" ? weekStart(date, opts.weekStartsOn) : date);
  }
  const periods = Array.from(periodSet).sort();

  // Longest streak: scan forward looking for consecutive periods
  let longestStreak = 1;
  let runningStreak = 1;
  for (let i = 1; i < periods.length; i++) {
    const expected = opts.unit === "week"
      ? addDays(periods[i - 1], 7)
      : addDays(periods[i - 1], 1);
    if (periods[i] === expected) {
      runningStreak++;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 1;
    }
  }

  // Current streak: walk backwards from today (or yesterday if today has no run)
  const todayPeriod = opts.unit === "week"
    ? weekStart(today(), opts.weekStartsOn)
    : today();
  const prevPeriod = opts.unit === "week"
    ? addDays(todayPeriod, -7)
    : addDays(todayPeriod, -1);

  let currentStreak = 0;
  if (periodSet.has(todayPeriod) || periodSet.has(prevPeriod)) {
    let check = periodSet.has(todayPeriod) ? todayPeriod : prevPeriod;
    const step = opts.unit === "week" ? -7 : -1;
    while (periodSet.has(check)) {
      currentStreak++;
      check = addDays(check, step);
    }
  }

  return { currentStreak, longestStreak, unit: opts.unit, lastRunDate };
}
