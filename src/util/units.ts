export const METERS_PER_MILE = 1609.344;
export const METERS_PER_KM = 1000;

export function metersToUnit(meters: number, unit: "mi" | "km"): number {
  return unit === "mi" ? meters / METERS_PER_MILE : meters / METERS_PER_KM;
}

export function unitToMeters(value: number, unit: "mi" | "km"): number {
  return unit === "mi" ? value * METERS_PER_MILE : value * METERS_PER_KM;
}

export function secondsToHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
