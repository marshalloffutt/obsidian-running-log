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

export interface RunningLogSettings {
  indexFolder: string;
  exportFileName: string;
  displayUnit: "mi" | "km";
  weekStartsOn: "monday" | "sunday";
  defaultGoal?: number;
  minRunDistance: number;
}
