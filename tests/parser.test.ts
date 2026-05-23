import { describe, it, expect, beforeAll } from "vitest";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import { parseAppleHealthXml } from "../src/parser/appleHealthParser";
import { RunRecord } from "../src/data/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(__dirname, "fixtures", "export.xml");

let records: RunRecord[];

beforeAll(async () => {
  records = await parseAppleHealthXml(fixturePath);
});

describe("parseAppleHealthXml", () => {
  it("skips non-running workouts and emits one record per running workout", () => {
    // 4 running workouts in fixture (including the duplicate); 1 walking skipped
    expect(records).toHaveLength(4);
  });

  it("case 1 — old format: reads distance from totalDistance attribute (mi → meters)", () => {
    const r = records[0];
    expect(r.startTime).toBe("2026-01-10T07:03:12-07:00");
    expect(r.endTime).toBe("2026-01-10T07:35:36-07:00");
    expect(r.durationSeconds).toBeCloseTo(1944, 5); // 32.4 min * 60
    expect(r.distanceMeters).toBeCloseTo(5.02 * 1609.344, 3);
    expect(r.source).toBe("Apple Watch");
    expect(r.energyKcal).toBe(410);
    expect(r.indoor).toBeUndefined();
  });

  it("case 2 — new format: reads distance from WorkoutStatistics child (km → meters)", () => {
    const r = records[1];
    expect(r.startTime).toBe("2026-01-17T06:30:00-07:00");
    expect(r.durationSeconds).toBeCloseTo(2700, 5); // 45 min * 60
    expect(r.distanceMeters).toBeCloseTo(8050, 3); // 8.05 km * 1000
    expect(r.energyKcal).toBe(550);
    expect(r.indoor).toBeUndefined();
  });

  it("case 3 — indoor run: sets indoor=true from MetadataEntry", () => {
    const r = records[2];
    expect(r.startTime).toBe("2026-01-24T19:00:00-07:00");
    expect(r.distanceMeters).toBeCloseTo(4.0 * 1609.344, 3);
    expect(r.indoor).toBe(true);
    expect(r.energyKcal).toBeUndefined();
  });

  it("case 4 — duplicate: same startTime+source produces the same id as case 1", () => {
    expect(records[3].id).toBe(records[0].id);
  });

  it("generates a stable, non-empty id for every record", () => {
    for (const r of records) {
      expect(typeof r.id).toBe("string");
      expect(r.id.length).toBeGreaterThan(0);
    }
  });

  it("preserves the timezone offset from the source date", () => {
    // All fixture runs are at -07:00; verify the offset is carried through
    for (const r of records) {
      expect(r.startTime).toMatch(/-07:00$/);
    }
  });
});
