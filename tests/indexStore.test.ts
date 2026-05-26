import { describe, it, expect } from "vitest";
import { mergeRuns } from "../src/data/indexStore";
import { RunSummary } from "../src/data/types";

function rec(id: string, startTime: string, overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    id, startTime, endTime: startTime,
    distanceMeters: 5000, durationSeconds: 1800,
    hasRoute: false, hasSeries: false, hasLaps: false,
    ...overrides,
  };
}

describe("mergeRuns", () => {
  it("treats all incoming as new when existing is empty", () => {
    const { runs, newCount } = mergeRuns([], [rec("a", "2026-01-01"), rec("b", "2026-01-02")]);
    expect(newCount).toBe(2);
    expect(runs).toHaveLength(2);
  });

  it("returns 0 new when all incoming ids already exist", () => {
    const existing = [rec("a", "2026-01-01"), rec("b", "2026-01-02")];
    const { newCount, runs } = mergeRuns(existing, [rec("a", "2026-01-01"), rec("b", "2026-01-02")]);
    expect(newCount).toBe(0);
    expect(runs).toHaveLength(2);
  });

  it("counts only genuinely new ids in a mixed batch", () => {
    const existing = [rec("a", "2026-01-01"), rec("b", "2026-01-03")];
    const incoming = [rec("b", "2026-01-03"), rec("c", "2026-01-05")];
    const { runs, newCount } = mergeRuns(existing, incoming);
    expect(newCount).toBe(1);
    expect(runs).toHaveLength(3);
  });

  it("sorts merged result ascending by startTime", () => {
    const existing = [rec("b", "2026-01-03")];
    const incoming = [rec("c", "2026-01-05"), rec("a", "2026-01-01")];
    const { runs } = mergeRuns(existing, incoming);
    expect(runs.map((r) => r.id)).toEqual(["a", "b", "c"]);
  });

  it("incoming record overwrites existing on duplicate id (last-writer-wins)", () => {
    const existing = [rec("a", "2026-01-01", { durationSeconds: 1000 })];
    const incoming = [rec("a", "2026-01-01", { durationSeconds: 2000 })];
    const { runs } = mergeRuns(existing, incoming);
    expect(runs).toHaveLength(1);
    expect(runs[0].durationSeconds).toBe(2000);
  });

  it("preserves all fields of each record", () => {
    const r = rec("a", "2026-01-01", { source: "fit", energyKcal: 350, indoor: false });
    const { runs } = mergeRuns([], [r]);
    expect(runs[0]).toEqual(r);
  });
});
