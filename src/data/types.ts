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

// ── v2 types (FIT-based store) ────────────────────────────────────────────

export interface RunSummary {
  id: string;
  startTime: string;            // ISO 8601 with offset
  endTime: string;
  distanceMeters: number;
  durationSeconds: number;      // moving time (timer time)
  elapsedSeconds?: number;      // total elapsed including pauses
  avgHeartRate?: number;        // bpm
  maxHeartRate?: number;
  avgCadence?: number;          // steps/min (raw FIT value)
  avgPower?: number;            // watts
  elevationGainMeters?: number;
  energyKcal?: number;
  source?: string;
  indoor?: boolean;
  hasRoute: boolean;
  hasSeries: boolean;
  hasLaps: boolean;
}

export interface Sample {
  tOffsetSec: number;
  heartRate?: number;
  cadence?: number;
  power?: number;
  speedMetersPerSec?: number;
  altitudeMeters?: number;
  lat?: number;
  lon?: number;
  verticalOscillationMm?: number;
  groundContactMs?: number;
  strideLengthMeters?: number;
}

export interface Lap {
  index: number;
  startOffsetSec: number;
  distanceMeters: number;
  durationSeconds: number;
  avgHeartRate?: number;
  avgCadence?: number;
}

export interface RunDetail {
  id: string;
  samples: Sample[];
  laps: Lap[];
  route: [number, number][]; // [lat, lon] in degrees, downsampled
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
