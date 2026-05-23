import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RunRecord } from "../src/data/types";
import { byWeek, byMonth, paceSeries, heatmapDays, streaks } from "../src/data/aggregations";

// Fixed reference date: Sunday 2026-03-15
const FIXED_TODAY = "2026-03-15";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${FIXED_TODAY}T12:00:00Z`));
});
afterEach(() => {
  vi.useRealTimers();
});

function run(
  startDate: string,
  distanceMeters: number,
  durationSeconds = 1800,
  overrides: Partial<RunRecord> = {}
): RunRecord {
  const iso = `${startDate}T07:00:00-07:00`;
  return {
    id: `${startDate}-${distanceMeters}`,
    startTime: iso,
    endTime: iso,
    distanceMeters,
    durationSeconds,
    ...overrides,
  };
}

// ─── byWeek ──────────────────────────────────────────────────────────────────

describe("byWeek", () => {
  it("generates one bucket per week in the explicit range, including empty weeks", () => {
    const runs = [
      run("2026-01-05", 8046),  // Mon week of Jan 5
      run("2026-01-19", 8046),  // Mon week of Jan 19
    ];
    const buckets = byWeek(runs, {
      unit: "mi",
      weekStartsOn: "monday",
      from: "2026-01-05",
      to: "2026-01-25",
    });
    // Weeks: Jan 5, Jan 12 (empty), Jan 19, Jan 26 — wait Jan 25 is Sun so last is Jan 19
    // from Jan 5 (Mon) to Jan 25 (Sun): weekStart(Jan 25, mon) = Jan 19
    expect(buckets).toHaveLength(3); // Jan 5, Jan 12, Jan 19
    expect(buckets[1].runCount).toBe(0);
    expect(buckets[1].distance).toBe(0);
  });

  it("converts distance from meters to miles", () => {
    const runs = [run("2026-01-05", 1609.344)]; // exactly 1 mile
    const [bucket] = byWeek(runs, {
      unit: "mi",
      weekStartsOn: "monday",
      from: "2026-01-05",
      to: "2026-01-11",
    });
    expect(bucket.distance).toBeCloseTo(1.0, 5);
  });

  it("respects weekStartsOn: sunday puts Saturday in same week as the preceding Sunday", () => {
    // 2026-01-03 is Saturday. With Sunday-start, it belongs to the week of 2025-12-28.
    const runs = [run("2026-01-03", 5000)];
    const buckets = byWeek(runs, {
      unit: "km",
      weekStartsOn: "sunday",
      from: "2025-12-28",
      to: "2026-01-03",
    });
    expect(buckets).toHaveLength(1);
    expect(buckets[0].periodStart).toBe("2025-12-28");
    expect(buckets[0].runCount).toBe(1);
  });

  it("uses last N weeks from today when no from/to given", () => {
    const buckets = byWeek([], { unit: "mi", weekStartsOn: "monday", last: 4 });
    expect(buckets).toHaveLength(4);
  });
});

// ─── byMonth ─────────────────────────────────────────────────────────────────

describe("byMonth", () => {
  it("generates one bucket per month in range including empty months", () => {
    const runs = [
      run("2026-01-10", 10000),
      run("2026-03-05", 10000),
    ];
    const buckets = byMonth(runs, {
      unit: "km",
      from: "2026-01-01",
      to: "2026-03-31",
    });
    expect(buckets).toHaveLength(3); // Jan, Feb, Mar
    expect(buckets[1].distance).toBe(0); // February empty
    expect(buckets[0].distance).toBeCloseTo(10, 3);
  });

  it("sums multiple runs within the same month", () => {
    const runs = [run("2026-02-10", 5000), run("2026-02-20", 5000)];
    const [bucket] = byMonth(runs, { unit: "km", from: "2026-02-01", to: "2026-02-28" });
    expect(bucket.runCount).toBe(2);
    expect(bucket.distance).toBeCloseTo(10, 3);
  });
});

// ─── paceSeries ──────────────────────────────────────────────────────────────

describe("paceSeries", () => {
  it("computes pace in seconds per mile", () => {
    // 1 mile in 600 seconds = 10:00/mi
    const runs = [run("2026-01-10", 1609.344, 600)];
    const points = paceSeries(runs, {
      unit: "mi",
      from: "2026-01-10",
      to: "2026-01-10",
    });
    expect(points).toHaveLength(1);
    expect(points[0].paceSecondsPerUnit).toBeCloseTo(600, 2);
  });

  it("excludes runs shorter than minDistanceMeters", () => {
    const runs = [run("2026-01-10", 500), run("2026-01-11", 5000)];
    const points = paceSeries(runs, {
      unit: "km",
      from: "2026-01-10",
      to: "2026-01-11",
      minDistanceMeters: 1000,
    });
    expect(points).toHaveLength(1);
    expect(points[0].date).toBe("2026-01-11");
  });

  it("applies moving average smoothing", () => {
    // Three runs with paces 300, 600, 900 s/mi (in mi). Window 3 → last value avg of all 3.
    const runs = [
      run("2026-01-10", 1609.344, 300), // 300 s/mi
      run("2026-01-11", 1609.344, 600), // 600 s/mi
      run("2026-01-12", 1609.344, 900), // 900 s/mi
    ];
    const points = paceSeries(runs, {
      unit: "mi",
      from: "2026-01-10",
      to: "2026-01-12",
      smoothing: 3,
    });
    expect(points[2].paceSecondsPerUnit).toBeCloseTo(600, 2); // avg of 300+600+900
  });
});

// ─── heatmapDays ─────────────────────────────────────────────────────────────

describe("heatmapDays", () => {
  it("groups runs by day and assigns intensity=1 to the highest-value day", () => {
    const runs = [
      run("2026-01-10", 5000),
      run("2026-01-10", 5000), // same day → 10km combined
      run("2026-01-11", 5000), // 5km
    ];
    const days = heatmapDays(runs, { unit: "km", year: 2026 });
    const jan10 = days.find((d) => d.date === "2026-01-10")!;
    const jan11 = days.find((d) => d.date === "2026-01-11")!;
    expect(jan10.intensity).toBe(1.0);
    expect(jan11.intensity).toBeLessThan(jan10.intensity);
    expect(jan10.runCount).toBe(2);
  });

  it("returns only days with runs (no zero-distance entries)", () => {
    const days = heatmapDays([run("2026-02-14", 8000)], { unit: "mi", year: 2026 });
    expect(days).toHaveLength(1);
    expect(days[0].date).toBe("2026-02-14");
  });
});

// ─── streaks ─────────────────────────────────────────────────────────────────

describe("streaks", () => {
  const opts = { unit: "day" as const, weekStartsOn: "monday" as const };

  it("returns zeros and null lastRunDate when no runs qualify", () => {
    const result = streaks([], opts);
    expect(result).toEqual({ currentStreak: 0, longestStreak: 0, unit: "day", lastRunDate: null });
  });

  it("computes longest streak across a gap", () => {
    // 3 consecutive, gap, 5 consecutive
    const runs = [
      run("2026-01-01", 5000), run("2026-01-02", 5000), run("2026-01-03", 5000),
      run("2026-01-06", 5000), run("2026-01-07", 5000), run("2026-01-08", 5000),
      run("2026-01-09", 5000), run("2026-01-10", 5000),
    ];
    expect(streaks(runs, opts).longestStreak).toBe(5);
  });

  it("counts current streak ending yesterday (today = 2026-03-15)", () => {
    // Runs on Mar 13 and Mar 14 (yesterday) — no run today yet
    const runs = [run("2026-03-13", 5000), run("2026-03-14", 5000)];
    expect(streaks(runs, opts).currentStreak).toBe(2);
  });

  it("week streak treats any run within the week as satisfying that week", () => {
    // Runs on Mon Jan 5, Thu Jan 8, Mon Jan 12 — two consecutive weeks
    const runs = [
      run("2026-01-05", 5000),
      run("2026-01-08", 5000),
      run("2026-01-12", 5000),
    ];
    const result = streaks(runs, { unit: "week", weekStartsOn: "monday" });
    expect(result.longestStreak).toBe(2);
  });
});
