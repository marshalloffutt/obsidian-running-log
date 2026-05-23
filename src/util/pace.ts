import { metersToUnit } from "./units";

export function paceSecondsPerUnit(
  distanceMeters: number,
  durationSeconds: number,
  unit: "mi" | "km"
): number {
  const dist = metersToUnit(distanceMeters, unit);
  return dist > 0 ? durationSeconds / dist : 0;
}

export function speedUnitsPerHour(
  distanceMeters: number,
  durationSeconds: number,
  unit: "mi" | "km"
): number {
  const dist = metersToUnit(distanceMeters, unit);
  const hours = durationSeconds / 3600;
  return hours > 0 ? dist / hours : 0;
}

export function movingAverage(values: number[], window: number): number[] {
  if (window <= 1) return values;
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}
