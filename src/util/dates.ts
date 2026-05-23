/** Extracts the local calendar date from a stored ISO-with-offset timestamp. */
export function localDateStr(isoWithOffset: string): string {
  // "2026-05-20T07:03:12-07:00" → "2026-05-20"
  // The date segment before T is already the run's local calendar date.
  return isoWithOffset.slice(0, 10);
}

export function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Add (or subtract) whole days, returning YYYY-MM-DD. */
export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** YYYY-MM-DD of the week containing dateStr, starting on weekStartsOn. */
export function weekStart(dateStr: string, weekStartsOn: "monday" | "sunday"): string {
  const d = new Date(dateStr + "T12:00:00Z");
  const dow = d.getUTCDay(); // 0=Sun … 6=Sat
  const target = weekStartsOn === "monday" ? 1 : 0;
  let diff = dow - target;
  if (diff < 0) diff += 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

/** YYYY-MM-01 of the month containing dateStr. */
export function monthStart(dateStr: string): string {
  return dateStr.slice(0, 7) + "-01";
}

/** YYYY-MM-01 n months after monthStartStr. */
export function addMonths(monthStartStr: string, n: number): string {
  const d = new Date(monthStartStr + "T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}
