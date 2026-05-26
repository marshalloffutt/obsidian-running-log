import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";
import { parseFitBuffer } from "../src/ingest/fitImporter";

const fixturesDir = join(__dirname, "fixtures");

function loadFixture(name: string): Buffer {
  return readFileSync(join(fixturesDir, name));
}

describe("parseFitBuffer", () => {
  describe("run-gps-hr.fit — GPS run, no FIT laps", () => {
    it("returns a result (not null)", async () => {
      const result = await parseFitBuffer(loadFixture("run-gps-hr.fit"));
      expect(result).not.toBeNull();
    });

    it("summary has correct distance and duration", async () => {
      const result = await parseFitBuffer(loadFixture("run-gps-hr.fit"));
      expect(result!.summary.distanceMeters).toBeCloseTo(5000, 0);
      expect(result!.summary.durationSeconds).toBeCloseTo(1800, 0);
    });

    it("summary has correct HR, cadence, ascent, calories", async () => {
      const { summary } = (await parseFitBuffer(loadFixture("run-gps-hr.fit")))!;
      expect(summary.avgHeartRate).toBe(155);
      expect(summary.maxHeartRate).toBe(170);
      expect(summary.avgCadence).toBe(85);
      expect(summary.elevationGainMeters).toBe(50);
      expect(summary.energyKcal).toBe(420);
    });

    it("summary startTime is ISO 8601 with offset", async () => {
      const { summary } = (await parseFitBuffer(loadFixture("run-gps-hr.fit")))!;
      expect(summary.startTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(summary.startTime).toContain("2026-01-10");
    });

    it("summary id is 16 hex characters", async () => {
      const { summary } = (await parseFitBuffer(loadFixture("run-gps-hr.fit")))!;
      expect(summary.id).toMatch(/^[0-9a-f]{16}$/);
    });

    it("summary flags: hasRoute, hasSeries, hasLaps", async () => {
      const { summary } = (await parseFitBuffer(loadFixture("run-gps-hr.fit")))!;
      expect(summary.hasRoute).toBe(true);
      expect(summary.hasSeries).toBe(true);
      expect(summary.hasLaps).toBe(true);
      expect(summary.indoor).toBe(false);
    });

    it("detail has 51 samples (records i=0..50)", async () => {
      const { detail } = (await parseFitBuffer(loadFixture("run-gps-hr.fit")))!;
      expect(detail.samples).toHaveLength(51);
    });

    it("samples have tOffsetSec, heartRate, cadence, speed, altitudeMeters, lat, lon", async () => {
      const { detail } = (await parseFitBuffer(loadFixture("run-gps-hr.fit")))!;
      const first = detail.samples[0];
      expect(first.tOffsetSec).toBeCloseTo(0, 1);
      expect(first.heartRate).toBeDefined();
      expect(first.cadence).toBeDefined();
      expect(first.speedMetersPerSec).toBeDefined();
      expect(first.altitudeMeters).toBeCloseTo(150, 0);
      expect(first.lat).toBeCloseTo(37.7749, 3);
      expect(first.lon).toBeCloseTo(-122.4194, 3);
    });

    it("last sample tOffsetSec is ~1800s", async () => {
      const { detail } = (await parseFitBuffer(loadFixture("run-gps-hr.fit")))!;
      const last = detail.samples[detail.samples.length - 1];
      expect(last.tOffsetSec).toBeCloseTo(1800, 0);
    });

    it("derives 5 splits of ~1km each (no FIT lap messages)", async () => {
      const { detail } = (await parseFitBuffer(loadFixture("run-gps-hr.fit")))!;
      expect(detail.laps).toHaveLength(5);
      detail.laps.forEach((lap, i) => {
        expect(lap.index).toBe(i);
        expect(lap.distanceMeters).toBe(1000);
        expect(lap.durationSeconds).toBeCloseTo(360, 1);
        expect(lap.avgHeartRate).toBeDefined();
        expect(lap.avgCadence).toBeDefined();
      });
    });

    it("first split starts at offset 0", async () => {
      const { detail } = (await parseFitBuffer(loadFixture("run-gps-hr.fit")))!;
      expect(detail.laps[0].startOffsetSec).toBeCloseTo(0, 1);
    });

    it("route has GPS points with valid lat/lon", async () => {
      const { detail } = (await parseFitBuffer(loadFixture("run-gps-hr.fit")))!;
      expect(detail.route.length).toBeGreaterThan(0);
      const [lat, lon] = detail.route[0];
      expect(lat).toBeCloseTo(37.7749, 3);
      expect(lon).toBeCloseTo(-122.4194, 3);
    });
  });

  describe("run-indoor.fit — indoor run, no GPS", () => {
    it("returns a result (not null, sport=running)", async () => {
      const result = await parseFitBuffer(loadFixture("run-indoor.fit"));
      expect(result).not.toBeNull();
    });

    it("summary has correct distance and duration", async () => {
      const { summary } = (await parseFitBuffer(loadFixture("run-indoor.fit")))!;
      expect(summary.distanceMeters).toBeCloseTo(3000, 0);
      expect(summary.durationSeconds).toBeCloseTo(1200, 0);
    });

    it("summary.indoor is true, hasRoute is false", async () => {
      const { summary } = (await parseFitBuffer(loadFixture("run-indoor.fit")))!;
      expect(summary.indoor).toBe(true);
      expect(summary.hasRoute).toBe(false);
    });

    it("detail.route is empty", async () => {
      const { detail } = (await parseFitBuffer(loadFixture("run-indoor.fit")))!;
      expect(detail.route).toHaveLength(0);
    });

    it("detail has samples with no lat/lon", async () => {
      const { detail } = (await parseFitBuffer(loadFixture("run-indoor.fit")))!;
      expect(detail.samples.length).toBeGreaterThan(0);
      detail.samples.forEach((s) => {
        expect(s.lat).toBeUndefined();
        expect(s.lon).toBeUndefined();
      });
    });

    it("derives splits from sample distances (no GPS needed)", async () => {
      const { detail } = (await parseFitBuffer(loadFixture("run-indoor.fit")))!;
      // 3km run, 21 records at 150m each: crossing 1000m, 2000m, 3000m → 3 splits
      expect(detail.laps.length).toBeGreaterThanOrEqual(2);
      expect(detail.laps.length).toBeLessThanOrEqual(3);
    });
  });

  describe("run-power-form.fit — run with power and form metrics", () => {
    it("returns a result", async () => {
      const result = await parseFitBuffer(loadFixture("run-power-form.fit"));
      expect(result).not.toBeNull();
    });

    it("summary has avgPower", async () => {
      const { summary } = (await parseFitBuffer(loadFixture("run-power-form.fit")))!;
      expect(summary.avgPower).toBe(250);
    });

    it("samples have power, verticalOscillationMm, groundContactMs, strideLengthMeters", async () => {
      const { detail } = (await parseFitBuffer(loadFixture("run-power-form.fit")))!;
      const s = detail.samples[1]; // skip i=0 since power is non-null from index 0
      expect(s.power).toBe(250);
      expect(s.verticalOscillationMm).toBeCloseTo(65, 0);
      expect(s.groundContactMs).toBeCloseTo(225, 0);
      expect(s.strideLengthMeters).toBeCloseTo(1.2, 2);
    });

    it("derives splits for 8km run", async () => {
      const { detail } = (await parseFitBuffer(loadFixture("run-power-form.fit")))!;
      // 8km at 160m/record (50 records): boundaries at 1000,2000,...,8000
      expect(detail.laps.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe("run-multilap.fit — GPS run WITH FIT lap messages", () => {
    it("returns a result", async () => {
      const result = await parseFitBuffer(loadFixture("run-multilap.fit"));
      expect(result).not.toBeNull();
    });

    it("still derives 5 splits from samples (ignores FIT lap messages)", async () => {
      const { detail } = (await parseFitBuffer(loadFixture("run-multilap.fit")))!;
      // Same sample structure as run-gps-hr.fit: 51 records, 100m each
      expect(detail.laps).toHaveLength(5);
    });

    it("hasLaps flag is true", async () => {
      const { summary } = (await parseFitBuffer(loadFixture("run-multilap.fit")))!;
      expect(summary.hasLaps).toBe(true);
    });
  });

  describe("activity-cycling.fit — non-running activity", () => {
    it("returns null for cycling sport", async () => {
      const result = await parseFitBuffer(loadFixture("activity-cycling.fit"));
      expect(result).toBeNull();
    });
  });

  describe("run-gps-hr.fit.gz — gzip compressed", () => {
    it("returns same result as uncompressed", async () => {
      const plain = await parseFitBuffer(loadFixture("run-gps-hr.fit"));
      const gzipped = await parseFitBuffer(loadFixture("run-gps-hr.fit.gz"));

      expect(gzipped).not.toBeNull();
      expect(gzipped!.summary.distanceMeters).toBeCloseTo(plain!.summary.distanceMeters, 0);
      expect(gzipped!.summary.durationSeconds).toBeCloseTo(plain!.summary.durationSeconds, 0);
      expect(gzipped!.summary.avgHeartRate).toBe(plain!.summary.avgHeartRate);
      expect(gzipped!.detail.laps).toHaveLength(plain!.detail.laps.length);
      expect(gzipped!.detail.route).toHaveLength(plain!.detail.route.length);
    });
  });
});
