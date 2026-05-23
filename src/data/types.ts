export interface RunRecord {
  id: string;
  startTime: string;        // ISO 8601 with offset, e.g. "2026-05-20T07:03:12-07:00"
  endTime: string;
  distanceMeters: number;
  durationSeconds: number;
  source?: string;
  energyKcal?: number;
  avgHeartRate?: number;    // reserved for v2
  indoor?: boolean;
}

export interface RunIndex {
  schemaVersion: number;
  generatedAt: string;
  source: string;
  sourceExportDate: string;
  runCount: number;
  runs: RunRecord[];
}

export interface MileageBucket {
  periodStart: string; // YYYY-MM-DD (week or month start)
  distance: number;    // in display unit
  runCount: number;
}

export interface PacePoint {
  date: string;              // YYYY-MM-DD
  paceSecondsPerUnit: number; // seconds per mi or km; for speed, units/hr
}

export interface HeatmapDay {
  date: string;      // YYYY-MM-DD
  distance: number;  // in display unit
  runCount: number;
  intensity: number; // 0..1, bucketed to `levels`
}

export interface StreakSummary {
  currentStreak: number;
  longestStreak: number;
  unit: "day" | "week";
  lastRunDate: string | null; // YYYY-MM-DD
}

export interface RunningLogSettings {
  indexFolder: string;
  exportFileName: string;
  displayUnit: "mi" | "km";
  weekStartsOn: "monday" | "sunday";
  defaultGoal?: number;
  minRunDistance: number;
}
