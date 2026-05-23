import * as fs from "fs";
import * as sax from "sax";
import { createHash } from "crypto";
import { RunRecord } from "../data/types";

interface WorkoutBuffer {
  startDate: string;
  endDate: string;
  duration: string;
  durationUnit: string;
  totalDistance?: string;
  totalDistanceUnit?: string;
  totalEnergyBurned?: string;
  sourceName: string;
  statsDistance?: string;
  statsDistanceUnit?: string;
  statsEnergy?: string;
  indoor?: boolean;
}

// "2026-05-20 07:03:12 -0700" → "2026-05-20T07:03:12-07:00"
function appleHealthDateToIso(s: string): string {
  return s.replace(
    /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})$/,
    "$1T$2$3:$4"
  );
}

function toDurationSeconds(value: string, unit: string): number {
  const n = parseFloat(value);
  switch (unit.toLowerCase()) {
    case "min": return n * 60;
    case "hr":
    case "hour": return n * 3600;
    default: return n; // assume seconds
  }
}

function toMeters(value: string, unit: string): number {
  const n = parseFloat(value);
  switch (unit.toLowerCase()) {
    case "mi": return n * 1609.344;
    case "km": return n * 1000;
    default: return n; // assume meters
  }
}

function makeId(startTime: string, source: string): string {
  return createHash("sha1")
    .update(`${startTime}|${source}`)
    .digest("hex")
    .slice(0, 16);
}

function bufferToRecord(buf: WorkoutBuffer): RunRecord {
  const startTime = appleHealthDateToIso(buf.startDate);
  const endTime = appleHealthDateToIso(buf.endDate);
  const source = buf.sourceName || "";

  // Prefer top-level attributes; fall back to WorkoutStatistics children
  const distRaw = buf.totalDistance ?? buf.statsDistance;
  const distUnit = buf.totalDistanceUnit ?? buf.statsDistanceUnit ?? "mi";
  const distanceMeters = distRaw ? toMeters(distRaw, distUnit) : 0;

  const energyRaw = buf.totalEnergyBurned ?? buf.statsEnergy;
  const energyKcal = energyRaw ? parseFloat(energyRaw) : undefined;

  const record: RunRecord = {
    id: makeId(startTime, source),
    startTime,
    endTime,
    distanceMeters,
    durationSeconds: toDurationSeconds(buf.duration, buf.durationUnit),
  };

  if (source) record.source = source;
  if (energyKcal !== undefined) record.energyKcal = energyKcal;
  if (buf.indoor !== undefined) record.indoor = buf.indoor;

  return record;
}

export function parseAppleHealthXml(filePath: string): Promise<RunRecord[]> {
  return new Promise((resolve, reject) => {
    const records: RunRecord[] = [];
    let inRunningWorkout = false;
    let buf: WorkoutBuffer | null = null;

    const saxStream = sax.createStream(true, {});

    saxStream.on("opentag", (node: sax.Tag) => {
      const attrs = node.attributes as Record<string, string>;

      if (node.name === "Workout") {
        if (attrs["workoutActivityType"] === "HKWorkoutActivityTypeRunning") {
          inRunningWorkout = true;
          buf = {
            startDate: attrs["startDate"],
            endDate: attrs["endDate"],
            duration: attrs["duration"],
            durationUnit: attrs["durationUnit"] ?? "min",
            totalDistance: attrs["totalDistance"] || undefined,
            totalDistanceUnit: attrs["totalDistanceUnit"] || undefined,
            totalEnergyBurned: attrs["totalEnergyBurned"] || undefined,
            sourceName: attrs["sourceName"] ?? "",
          };
        }
        return;
      }

      if (!inRunningWorkout || !buf) return;

      if (node.name === "WorkoutStatistics") {
        const type = attrs["type"];
        if (type === "HKQuantityTypeIdentifierDistanceWalkingRunning") {
          buf.statsDistance = attrs["sum"];
          buf.statsDistanceUnit = attrs["unit"];
        } else if (type === "HKQuantityTypeIdentifierActiveEnergyBurned") {
          buf.statsEnergy = attrs["sum"];
        }
      } else if (node.name === "MetadataEntry") {
        if (attrs["key"] === "HKIndoorWorkout") {
          buf.indoor = attrs["value"] === "1";
        }
      }
    });

    saxStream.on("closetag", (name: string) => {
      if (name === "Workout" && inRunningWorkout && buf) {
        records.push(bufferToRecord(buf));
        inRunningWorkout = false;
        buf = null;
      }
    });

    saxStream.on("error", reject);

    saxStream.on("end", () => resolve(records));

    fs.createReadStream(filePath).pipe(saxStream);
  });
}
