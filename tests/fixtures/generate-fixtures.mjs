/**
 * Generates minimal but valid binary FIT fixture files for fitImporter tests.
 * Run once with: node tests/fixtures/generate-fixtures.mjs
 * Commit the resulting .fit and .fit.gz files.
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));

// FIT epoch offset: seconds from Unix epoch to FIT epoch (1989-12-31 UTC)
const FIT_EPOCH_SEC = 631065600;

function toFitTs(isoStr) {
  return Math.floor(new Date(isoStr).getTime() / 1000) - FIT_EPOCH_SEC;
}

// Base type bytes used in FIT definition messages
const BT = {
  ENUM:   0x00, // 1 byte
  UINT8:  0x02, // 1 byte
  UINT16: 0x84, // 2 bytes, little-endian
  UINT32: 0x86, // 4 bytes, little-endian
  SINT32: 0x85, // 4 bytes, little-endian (signed)
};

// Encoding helpers: physical value → byte array
const enc = {
  u8:    (v) => [v & 0xFF],
  u16:   (v) => { const b = Buffer.alloc(2); b.writeUInt16LE(v >>> 0); return [...b]; },
  u32:   (v) => { const b = Buffer.alloc(4); b.writeUInt32LE(v >>> 0); return [...b]; },
  s32:   (v) => { const b = Buffer.alloc(4); b.writeInt32LE(v | 0);    return [...b]; },
  // Physical encodings (applying FIT scale/offset)
  elapsed: (sec) => enc.u32(Math.round(sec * 1000)),        // scale=1000 → stored as ms
  dist:    (m)   => enc.u32(Math.round(m * 100)),           // scale=100 → stored as cm
  speed:   (ms)  => enc.u16(Math.round(ms * 1000)),         // scale=1000 → stored as mm/s
  alt:     (m)   => enc.u16(Math.round((m + 500) * 5)),     // scale=5, offset=-500
  recDist: (m)   => enc.u32(Math.round(m * 100)),           // scale=100
  vertOsc: (mm)  => enc.u16(Math.round(mm * 10)),           // scale=10, units=mm
  stance:  (ms)  => enc.u16(Math.round(ms * 10)),           // scale=10, units=ms
  stride:  (mm)  => enc.u16(Math.round(mm * 10)),           // scale=10, units=mm
  latlon:  (deg) => enc.s32(Math.round(deg * (Math.pow(2, 31) / 180))),
};

// Global FIT message numbers
const MSG_FILE_ID  = 0;
const MSG_SESSION  = 18;
const MSG_LAP      = 19;
const MSG_RECORD   = 20;

class FitBuilder {
  constructor() { this._chunks = []; this._defs = new Map(); }

  /** Define a local message type mapped to a global message. */
  define(localType, globalNum, fields) {
    const header = [0x40 | (localType & 0x0F), 0x00, 0x00,
                    globalNum & 0xFF, (globalNum >> 8) & 0xFF,
                    fields.length];
    const fieldDefs = fields.flatMap(f => [f.num, f.size, f.bt]);
    this._chunks.push([...header, ...fieldDefs]);
    this._defs.set(localType, fields);
    return this;
  }

  /** Write a data message; values is an array of byte arrays, one per field. */
  data(localType, values) {
    this._chunks.push([localType & 0x0F, ...values.flat()]);
    return this;
  }

  build() {
    const body = Buffer.from(this._chunks.flat());
    const hdr  = Buffer.alloc(14);
    hdr[0] = 14;          // header size
    hdr[1] = 0x10;        // protocol version 1.0
    hdr.writeUInt16LE(1000, 2);          // profile version
    hdr.writeUInt32LE(body.length, 4);   // data size
    hdr.write('.FIT', 8, 'ascii');
    hdr.writeUInt16LE(0, 12);            // header CRC (library does not validate)
    return Buffer.concat([hdr, body, Buffer.from([0, 0])]); // 2-byte file CRC (not validated)
  }
}

// ── Field-definition arrays ────────────────────────────────────────────────

const FILE_ID_FIELDS = [
  { num: 0, size: 1, bt: BT.ENUM   }, // type
  { num: 4, size: 4, bt: BT.UINT32 }, // time_created
];

const SESSION_FIELDS = [
  { num: 253, size: 4, bt: BT.UINT32 }, // timestamp
  { num: 2,   size: 4, bt: BT.UINT32 }, // start_time
  { num: 5,   size: 1, bt: BT.ENUM   }, // sport (1=running, 2=cycling)
  { num: 7,   size: 4, bt: BT.UINT32 }, // total_elapsed_time (scale=1000)
  { num: 8,   size: 4, bt: BT.UINT32 }, // total_timer_time   (scale=1000)
  { num: 9,   size: 4, bt: BT.UINT32 }, // total_distance     (scale=100)
  { num: 11,  size: 2, bt: BT.UINT16 }, // total_calories
  { num: 14,  size: 2, bt: BT.UINT16 }, // avg_speed          (scale=1000)
  { num: 16,  size: 1, bt: BT.UINT8  }, // avg_heart_rate
  { num: 17,  size: 1, bt: BT.UINT8  }, // max_heart_rate
  { num: 18,  size: 1, bt: BT.UINT8  }, // avg_cadence
  { num: 22,  size: 2, bt: BT.UINT16 }, // total_ascent
];

const SESSION_FIELDS_POWER = [
  ...SESSION_FIELDS,
  { num: 20, size: 2, bt: BT.UINT16 }, // avg_power
];

const RECORD_FIELDS = [
  { num: 253, size: 4, bt: BT.UINT32 }, // timestamp
  { num: 0,   size: 4, bt: BT.SINT32 }, // position_lat  (semicircles)
  { num: 1,   size: 4, bt: BT.SINT32 }, // position_long (semicircles)
  { num: 2,   size: 2, bt: BT.UINT16 }, // altitude      (scale=5, offset=-500)
  { num: 3,   size: 1, bt: BT.UINT8  }, // heart_rate
  { num: 4,   size: 1, bt: BT.UINT8  }, // cadence
  { num: 5,   size: 4, bt: BT.UINT32 }, // distance      (scale=100)
  { num: 6,   size: 2, bt: BT.UINT16 }, // speed         (scale=1000)
];

const RECORD_FIELDS_NO_GPS = [
  { num: 253, size: 4, bt: BT.UINT32 }, // timestamp
  { num: 3,   size: 1, bt: BT.UINT8  }, // heart_rate
  { num: 4,   size: 1, bt: BT.UINT8  }, // cadence
  { num: 5,   size: 4, bt: BT.UINT32 }, // distance
  { num: 6,   size: 2, bt: BT.UINT16 }, // speed
];

const RECORD_FIELDS_POWER = [
  ...RECORD_FIELDS,
  { num: 7,  size: 2, bt: BT.UINT16 }, // power               (watts)
  { num: 39, size: 2, bt: BT.UINT16 }, // vertical_oscillation (scale=10, mm)
  { num: 41, size: 2, bt: BT.UINT16 }, // stance_time          (scale=10, ms)
  { num: 85, size: 2, bt: BT.UINT16 }, // step_length          (scale=10, mm)
];

const LAP_FIELDS = [
  { num: 253, size: 4, bt: BT.UINT32 }, // timestamp
  { num: 2,   size: 4, bt: BT.UINT32 }, // start_time
  { num: 7,   size: 4, bt: BT.UINT32 }, // total_elapsed_time
  { num: 8,   size: 4, bt: BT.UINT32 }, // total_timer_time
  { num: 9,   size: 4, bt: BT.UINT32 }, // total_distance
  { num: 15,  size: 1, bt: BT.UINT8  }, // avg_heart_rate
  { num: 17,  size: 1, bt: BT.UINT8  }, // avg_cadence
];

// ── GPS run builder ────────────────────────────────────────────────────────

const LAT_START = 37.7749;
const LON_FIXED = -122.4194;
const DEG_PER_100M = 0.0009; // ~100m northward per step

function buildGpsRun({ startIso, durationSec, distMeters, avgHR, maxHR, avgCad,
                       ascent = 0, calories, numRecords = 50,
                       withLaps = false, withPower = false, sport = 1 }) {
  const b        = new FitBuilder();
  const startFit = toFitTs(startIso);
  const endFit   = startFit + durationSec;
  const speedMS  = distMeters / durationSec;
  const dt       = durationSec / numRecords; // seconds per interval

  // local type assignments (within this file only)
  const LOC_FILE_ID  = 0;
  const LOC_SESSION  = 1;
  const LOC_RECORD   = 2;
  const LOC_LAP      = 3;

  b.define(LOC_FILE_ID, MSG_FILE_ID, FILE_ID_FIELDS);
  b.data(LOC_FILE_ID, [enc.u8(4), enc.u32(startFit)]); // type=activity

  const recFields = withPower ? RECORD_FIELDS_POWER : RECORD_FIELDS;
  b.define(LOC_RECORD, MSG_RECORD, recFields);

  for (let i = 0; i <= numRecords; i++) {
    const tSec  = Math.round(i * dt);
    const dist  = (distMeters / numRecords) * i;
    const lat   = LAT_START + DEG_PER_100M * i;
    const hr    = Math.min(254, Math.round(avgHR - 10 + (20 * i / numRecords)));

    const base = [
      enc.u32(startFit + tSec),
      enc.latlon(lat),
      enc.latlon(LON_FIXED),
      enc.alt(150),
      enc.u8(hr),
      enc.u8(avgCad),
      enc.recDist(dist),
      enc.speed(speedMS),
    ];

    if (withPower) {
      b.data(LOC_RECORD, [...base,
        enc.u16(250),       // power = 250W
        enc.vertOsc(65),    // vertical_oscillation = 65mm
        enc.stance(225),    // stance_time = 225ms
        enc.stride(1200),   // step_length = 1200mm
      ]);
    } else {
      b.data(LOC_RECORD, base);
    }
  }

  if (withLaps) {
    const lapDist = distMeters / 5;
    const lapDur  = durationSec / 5;
    b.define(LOC_LAP, MSG_LAP, LAP_FIELDS);
    for (let i = 0; i < 5; i++) {
      const lapStart = startFit + i * lapDur;
      const lapEnd   = lapStart + lapDur;
      b.data(LOC_LAP, [
        enc.u32(lapEnd),
        enc.u32(lapStart),
        enc.elapsed(lapDur),
        enc.elapsed(lapDur),
        enc.dist(lapDist),
        enc.u8(avgHR),
        enc.u8(avgCad),
      ]);
    }
  }

  const sessFields = withPower ? SESSION_FIELDS_POWER : SESSION_FIELDS;
  b.define(LOC_SESSION, MSG_SESSION, sessFields);
  const sessVals = [
    enc.u32(endFit),
    enc.u32(startFit),
    enc.u8(sport),
    enc.elapsed(durationSec),
    enc.elapsed(durationSec),
    enc.dist(distMeters),
    enc.u16(calories),
    enc.speed(speedMS),
    enc.u8(avgHR),
    enc.u8(maxHR),
    enc.u8(avgCad),
    enc.u16(ascent),
  ];
  if (withPower) sessVals.push(enc.u16(250)); // avg_power
  b.data(LOC_SESSION, sessVals);

  return b.build();
}

// ── Indoor run builder ─────────────────────────────────────────────────────

function buildIndoorRun({ startIso, durationSec, distMeters, avgHR, maxHR,
                          avgCad, calories, numRecords = 20 }) {
  const b        = new FitBuilder();
  const startFit = toFitTs(startIso);
  const endFit   = startFit + durationSec;
  const speedMS  = distMeters / durationSec;
  const dt       = durationSec / numRecords;

  const LOC_FILE_ID = 0;
  const LOC_SESSION = 1;
  const LOC_RECORD  = 2;

  b.define(LOC_FILE_ID, MSG_FILE_ID, FILE_ID_FIELDS);
  b.data(LOC_FILE_ID, [enc.u8(4), enc.u32(startFit)]);

  b.define(LOC_RECORD, MSG_RECORD, RECORD_FIELDS_NO_GPS);
  for (let i = 0; i <= numRecords; i++) {
    const tSec = Math.round(i * dt);
    const dist = (distMeters / numRecords) * i;
    const hr   = Math.min(254, Math.round(avgHR - 10 + (20 * i / numRecords)));
    b.data(LOC_RECORD, [
      enc.u32(startFit + tSec),
      enc.u8(hr),
      enc.u8(avgCad),
      enc.recDist(dist),
      enc.speed(speedMS),
    ]);
  }

  b.define(LOC_SESSION, MSG_SESSION, SESSION_FIELDS);
  b.data(LOC_SESSION, [
    enc.u32(endFit),
    enc.u32(startFit),
    enc.u8(1), // sport=running
    enc.elapsed(durationSec),
    enc.elapsed(durationSec),
    enc.dist(distMeters),
    enc.u16(calories),
    enc.speed(speedMS),
    enc.u8(avgHR),
    enc.u8(maxHR),
    enc.u8(avgCad),
    enc.u16(0), // total_ascent
  ]);

  return b.build();
}

// ── Write fixtures ─────────────────────────────────────────────────────────

const fixtures = {
  // GPS run, HR+cadence, NO FIT lap messages → tests lapless split derivation
  'run-gps-hr.fit': buildGpsRun({
    startIso:   '2026-01-10T14:03:12Z',
    durationSec: 1800,
    distMeters:  5000,
    avgHR: 155, maxHR: 170, avgCad: 85,
    ascent: 50, calories: 420,
    numRecords: 50,
    withLaps: false,
  }),

  // Indoor treadmill run — no GPS route
  'run-indoor.fit': buildIndoorRun({
    startIso:    '2026-01-17T19:30:00Z',
    durationSec:  1200,
    distMeters:   3000,
    avgHR: 145, maxHR: 160, avgCad: 88,
    calories: 250,
    numRecords: 20,
  }),

  // Run with power + running-form metrics
  'run-power-form.fit': buildGpsRun({
    startIso:    '2026-01-24T22:00:00Z',
    durationSec:  2400,
    distMeters:   8000,
    avgHR: 160, maxHR: 175, avgCad: 88,
    ascent: 80, calories: 600,
    numRecords: 50,
    withPower: true,
  }),

  // Run WITH FIT lap messages (5 × 1km)
  'run-multilap.fit': buildGpsRun({
    startIso:    '2026-01-31T21:00:00Z',
    durationSec:  1800,
    distMeters:   5000,
    avgHR: 158, maxHR: 172, avgCad: 86,
    ascent: 0, calories: 425,
    numRecords: 50,
    withLaps: true,
  }),

  // Non-running activity (cycling) — importer must return null
  'activity-cycling.fit': buildGpsRun({
    startIso:    '2026-02-07T17:00:00Z',
    durationSec:  3600,
    distMeters:  30000,
    avgHR: 140, maxHR: 165, avgCad: 90,
    calories: 800,
    numRecords: 50,
    sport: 2, // cycling
  }),
};

for (const [name, buf] of Object.entries(fixtures)) {
  const p = join(__dirname, name);
  writeFileSync(p, buf);
  console.log(`wrote ${p}  (${buf.length} bytes)`);
}

// Gzipped version of the GPS run
const gzPath = join(__dirname, 'run-gps-hr.fit.gz');
writeFileSync(gzPath, gzipSync(fixtures['run-gps-hr.fit']));
console.log(`wrote ${gzPath}`);
