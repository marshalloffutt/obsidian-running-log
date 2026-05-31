import FitParser from "fit-file-parser";
import { gunzipSync } from "zlib";
import { createHash } from "crypto";
import type { RunSummary, RunDetail, Sample, Lap } from "../data/types";

export interface FitImportResult {
  summary: RunSummary;
  detail: RunDetail;
}

const SPLIT_DISTANCE_M = 1000;

export async function parseFitBuffer(
  buffer: Buffer,
  options: { routeMaxPoints: number } = { routeMaxPoints: 500 }
): Promise<FitImportResult | null> {
  const isGzip = buffer[0] === 0x1f && buffer[1] === 0x8b;
  const fitBuffer: Buffer = isGzip ? gunzipSync(buffer) : buffer;

  const parser = new FitParser({ force: true, speedUnit: "m/s", lengthUnit: "m", mode: "list" });
  const fit = await parser.parseAsync(fitBuffer);

  const sessions: any[] = (fit as any).sessions ?? [];
  const session = sessions.find((s: any) => s.sport === "running" || s.sport === "walking");
  if (!session) return null;
  const activityType: "run" | "walk" = session.sport === "walking" ? "walk" : "run";

  // Runtime delivers Date objects despite TS types saying string
  const startDate = session.start_time as unknown as Date;
  const endDate = session.timestamp as unknown as Date;

  const startMs = startDate.getTime();

  const records: any[] = (fit as any).records ?? [];

  const samples: Sample[] = records.map((r: any) => {
    const ts = r.timestamp as unknown as Date;
    const sample: Sample = {
      tOffsetSec: (ts.getTime() - startMs) / 1000,
    };
    if (r.heart_rate != null) sample.heartRate = r.heart_rate;
    if (r.cadence != null) sample.cadence = r.cadence;
    if (r.power != null) sample.power = r.power;
    if (r.speed != null) sample.speedMetersPerSec = r.speed;
    if (r.altitude != null) sample.altitudeMeters = r.altitude;
    // position_lat/long are already in degrees (library applies sint32 * scConst)
    if (r.position_lat != null) sample.lat = r.position_lat;
    if (r.position_long != null) sample.lon = r.position_long;
    if (r.vertical_oscillation != null) sample.verticalOscillationMm = r.vertical_oscillation;
    if (r.stance_time != null) sample.groundContactMs = r.stance_time;
    if (r.step_length != null) sample.strideLengthMeters = r.step_length / 1000;
    return sample;
  });

  const laps = deriveSplits(records, startMs);

  const route = buildRoute(records, options.routeMaxPoints);

  const startTimeIso = startDate.toISOString();
  const source = (session.manufacturer as string | undefined) ?? "fit";
  const id = createHash("sha1")
    .update(startTimeIso + source)
    .digest("hex")
    .slice(0, 16);

  const summary: RunSummary = {
    id,
    startTime: formatWithOffset(startDate),
    endTime: formatWithOffset(endDate),
    distanceMeters: session.total_distance ?? 0,
    durationSeconds: session.total_timer_time ?? 0,
    elapsedSeconds: session.total_elapsed_time,
    avgHeartRate: session.avg_heart_rate,
    maxHeartRate: session.max_heart_rate,
    // Raw FIT cadence is already steps/min for running (not half-cadence like cycling)
    avgCadence: session.avg_cadence,
    avgPower: session.avg_power,
    elevationGainMeters: session.total_ascent,
    energyKcal: session.total_calories,
    source,
    indoor: ["indoor_running", "indoor_walking"].includes(session.sub_sport ?? "") || route.length === 0,
    activityType,
    hasRoute: route.length > 0,
    hasSeries: samples.length > 0,
    hasLaps: laps.length > 0,
  };

  const detail: RunDetail = {
    id,
    samples,
    laps,
    route,
  };

  return { summary, detail };
}

function deriveSplits(records: any[], startMs: number): Lap[] {
  const laps: Lap[] = [];
  let lapIndex = 0;
  let nextBoundary = SPLIT_DISTANCE_M;
  let lapStartMs: number | null = null;
  let lapHrSum = 0;
  let lapHrCount = 0;
  let lapCadSum = 0;
  let lapCadCount = 0;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const dist: number = r.distance ?? 0;
    const ts = r.timestamp as unknown as Date;

    if (lapStartMs === null) lapStartMs = ts.getTime();

    if (r.heart_rate != null) { lapHrSum += r.heart_rate; lapHrCount++; }
    if (r.cadence != null) { lapCadSum += r.cadence; lapCadCount++; }

    if (dist >= nextBoundary) {
      const lapDist = SPLIT_DISTANCE_M;
      const lapDurSec = (ts.getTime() - lapStartMs) / 1000;
      const lap: Lap = {
        index: lapIndex,
        startOffsetSec: (lapStartMs - startMs) / 1000,
        distanceMeters: lapDist,
        durationSeconds: lapDurSec,
      };
      if (lapHrCount > 0) lap.avgHeartRate = Math.round(lapHrSum / lapHrCount);
      if (lapCadCount > 0) lap.avgCadence = Math.round(lapCadSum / lapCadCount);

      laps.push(lap);
      lapIndex++;
      nextBoundary += SPLIT_DISTANCE_M;
      lapStartMs = ts.getTime();
      lapHrSum = 0; lapHrCount = 0;
      lapCadSum = 0; lapCadCount = 0;
    }
  }

  return laps;
}

function buildRoute(records: any[], maxPoints: number): [number, number][] {
  const gpsRecords = records.filter(
    (r: any) => r.position_lat != null && r.position_long != null
  );
  if (gpsRecords.length === 0) return [];

  const step = Math.max(1, Math.floor(gpsRecords.length / maxPoints));
  const route: [number, number][] = [];
  for (let i = 0; i < gpsRecords.length; i += step) {
    const r = gpsRecords[i];
    route.push([r.position_lat, r.position_long]);
  }
  // Always include last point
  const last = gpsRecords[gpsRecords.length - 1];
  if (route[route.length - 1]?.[0] !== last.position_lat) {
    route.push([last.position_lat, last.position_long]);
  }
  return route;
}

// FIT timestamps have no timezone info — treat as UTC and format with +00:00
function formatWithOffset(d: Date): string {
  return d.toISOString().replace("Z", "+00:00");
}
