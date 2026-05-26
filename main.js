var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to2, from2, except, desc) => {
  if (from2 && typeof from2 === "object" || typeof from2 === "function") {
    for (let key of __getOwnPropNames(from2))
      if (!__hasOwnProp.call(to2, key) && key !== except)
        __defProp(to2, key, { get: () => from2[key], enumerable: !(desc = __getOwnPropDesc(from2, key)) || desc.enumerable });
  }
  return to2;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => RunningLogPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian6 = require("obsidian");

// src/data/indexStore.ts
var import_obsidian = require("obsidian");
function mergeRuns(existing, incoming) {
  const byId = new Map(existing.map((r) => [r.id, r]));
  let newCount = 0;
  for (const r of incoming) {
    if (!byId.has(r.id))
      newCount++;
    byId.set(r.id, r);
  }
  const runs = Array.from(byId.values()).sort(
    (a, b) => a.startTime.localeCompare(b.startTime)
  );
  return { runs, newCount };
}
var IndexStore = class {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
    this.runs = [];
    this.loaded = false;
  }
  get indexPath() {
    return (0, import_obsidian.normalizePath)(`${this.settings.indexFolder}/index.json`);
  }
  async load() {
    var _a, _b;
    const { adapter } = this.app.vault;
    if (!await adapter.exists(this.indexPath)) {
      this.runs = [];
      this.loaded = true;
      return;
    }
    try {
      const raw = await adapter.read(this.indexPath);
      const parsed = JSON.parse(raw);
      if (parsed.schemaVersion === 1) {
        const v1runs = (_a = parsed.runs) != null ? _a : [];
        this.runs = v1runs.map((r) => ({
          ...r,
          hasRoute: false,
          hasSeries: false,
          hasLaps: false
        }));
        await this.save();
      } else {
        this.runs = (_b = parsed.runs) != null ? _b : [];
      }
    } catch (e) {
      this.runs = [];
    }
    this.loaded = true;
  }
  hasIndex() {
    return this.loaded && this.runs.length > 0;
  }
  getRuns() {
    return this.runs;
  }
  async upsertRun(summary) {
    const { runs } = mergeRuns(this.runs, [summary]);
    this.runs = runs;
    await this.save();
  }
  async save() {
    const { adapter } = this.app.vault;
    const folder = (0, import_obsidian.normalizePath)(this.settings.indexFolder);
    if (!await adapter.exists(folder)) {
      await adapter.mkdir(folder);
    }
    const index = {
      schemaVersion: 2,
      generatedAt: new Date().toISOString(),
      runCount: this.runs.length,
      runs: this.runs
    };
    await adapter.write(this.indexPath, JSON.stringify(index, null, 2));
  }
};

// src/data/detailStore.ts
var import_obsidian2 = require("obsidian");
var DetailStore = class {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
  }
  detailPath(id) {
    return (0, import_obsidian2.normalizePath)(`${this.settings.indexFolder}/detail/${id}.json`);
  }
  async read(id) {
    const { adapter } = this.app.vault;
    const p = this.detailPath(id);
    if (!await adapter.exists(p))
      return null;
    try {
      return JSON.parse(await adapter.read(p));
    } catch (e) {
      return null;
    }
  }
  async write(detail) {
    const { adapter } = this.app.vault;
    const dir = (0, import_obsidian2.normalizePath)(`${this.settings.indexFolder}/detail`);
    if (!await adapter.exists(dir)) {
      await adapter.mkdir(dir);
    }
    await adapter.write(this.detailPath(detail.id), JSON.stringify(detail));
  }
};

// src/ingest/inboxWatcher.ts
var import_obsidian3 = require("obsidian");

// node_modules/fit-file-parser/dist/binary.js
var import_buffer = require("buffer");

// node_modules/fit-file-parser/dist/fit.js
var metersInOneKilometer = 1e3;
var secondsInOneHour = 3600;
var metersInOneMile = 1609.344;
var centiBarsInOneBar = 100;
var psiInOneBar = 14.5037738;
var FIT = {
  scConst: 180 / Math.pow(2, 31),
  options: {
    speedUnits: {
      // native speed unit: meters per second [m/s]
      "m/s": {
        multiplier: 1,
        offset: 0
      },
      // miles per hour [mph]
      "mph": {
        multiplier: secondsInOneHour / metersInOneMile,
        offset: 0
      },
      // kilometers per hour [km/h]
      "km/h": {
        multiplier: secondsInOneHour / metersInOneKilometer,
        offset: 0
      }
    },
    lengthUnits: {
      // native length unit: meters [m]
      m: {
        multiplier: 1,
        offset: 0
      },
      // (international) mile [mi]
      mi: {
        multiplier: 1 / metersInOneMile,
        offset: 0
      },
      // kilometer [km]
      km: {
        multiplier: 1 / metersInOneKilometer,
        offset: 0
      }
    },
    temperatureUnits: {
      // native temperature unit: degree Celsius [°C]
      "\xB0C": {
        multiplier: 1,
        offset: 0
      },
      // kelvin [K]
      "kelvin": {
        multiplier: 1,
        offset: -273.15
      },
      // degree fahrenheit [°F]
      "fahrenheit": {
        multiplier: 9 / 5,
        offset: 32
      }
    },
    pressureUnits: {
      cbar: {
        multiplier: 1,
        offset: 0
      },
      bar: {
        multiplier: 1 / centiBarsInOneBar,
        offset: 0
      },
      psi: {
        multiplier: 1 / centiBarsInOneBar * psiInOneBar,
        offset: 0
      }
    }
  },
  messages: {
    0: {
      name: "file_id",
      0: { field: "type", type: "file", scale: null, offset: 0, units: "" },
      1: {
        field: "manufacturer",
        type: "manufacturer",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "product",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      3: {
        field: "serial_number",
        type: "uint32z",
        scale: null,
        offset: 0,
        units: ""
      },
      4: {
        field: "time_created",
        type: "date_time",
        scale: null,
        offset: 0,
        units: ""
      },
      5: { field: "number", type: "uint16", scale: null, offset: 0, units: "" },
      8: {
        field: "product_name",
        type: "string",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    1: {
      name: "capabilities",
      0: {
        field: "languages",
        type: "uint8z",
        scale: null,
        offset: 0,
        units: ""
      },
      1: {
        field: "sports",
        type: "sport_bits_0",
        scale: null,
        offset: 0,
        units: ""
      },
      21: {
        field: "workouts_supported",
        type: "workout_capabilities",
        scale: null,
        offset: 0,
        units: ""
      },
      23: {
        field: "connectivity_supported",
        type: "connectivity_capabilities",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    2: {
      name: "device_settings",
      0: {
        field: "active_time_zone",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      1: {
        field: "utc_offset",
        type: "uint32",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "time_offset",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "s"
      },
      5: {
        field: "time_zone_offset",
        type: "sint8",
        scale: 4,
        offset: 0,
        units: "hr"
      },
      55: {
        field: "display_orientation",
        type: "display_orientation",
        scale: null,
        offset: 0,
        units: ""
      },
      56: {
        field: "mounting_side",
        type: "side",
        scale: null,
        offset: 0,
        units: ""
      },
      94: {
        field: "number_of_screens",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      95: {
        field: "smart_notification_display_orientation",
        type: "display_orientation",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    3: {
      name: "user_profile",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      0: {
        field: "friendly_name",
        type: "string",
        scale: null,
        offset: 0,
        units: ""
      },
      1: { field: "gender", type: "gender", scale: null, offset: 0, units: "" },
      2: {
        field: "age",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "years"
      },
      3: { field: "height", type: "uint8", scale: 100, offset: 0, units: "m" },
      4: { field: "weight", type: "uint16", scale: 10, offset: 0, units: "kg" },
      5: {
        field: "language",
        type: "language",
        scale: null,
        offset: 0,
        units: ""
      },
      6: {
        field: "elev_setting",
        type: "display_measure",
        scale: null,
        offset: 0,
        units: ""
      },
      7: {
        field: "weight_setting",
        type: "display_measure",
        scale: null,
        offset: 0,
        units: ""
      },
      8: {
        field: "resting_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      9: {
        field: "default_max_running_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      10: {
        field: "default_max_biking_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      11: {
        field: "default_max_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      12: {
        field: "hr_setting",
        type: "display_heart",
        scale: null,
        offset: 0,
        units: ""
      },
      13: {
        field: "speed_setting",
        type: "display_measure",
        scale: null,
        offset: 0,
        units: ""
      },
      14: {
        field: "dist_setting",
        type: "display_measure",
        scale: null,
        offset: 0,
        units: ""
      },
      16: {
        field: "power_setting",
        type: "display_power",
        scale: null,
        offset: 0,
        units: ""
      },
      17: {
        field: "activity_class",
        type: "activity_class",
        scale: null,
        offset: 0,
        units: ""
      },
      18: {
        field: "position_setting",
        type: "display_position",
        scale: null,
        offset: 0,
        units: ""
      },
      21: {
        field: "temperature_setting",
        type: "display_measure",
        scale: null,
        offset: 0,
        units: ""
      },
      22: {
        field: "local_id",
        type: "user_local_id",
        scale: null,
        offset: 0,
        units: ""
      },
      23: {
        field: "global_id",
        type: "byte",
        scale: null,
        offset: 0,
        units: ""
      },
      28: {
        field: "wake_time",
        type: "localtime_into_day",
        scale: null,
        offset: 0,
        units: ""
      },
      29: {
        field: "sleep_time",
        type: "localtime_into_day",
        scale: null,
        offset: 0,
        units: ""
      },
      30: {
        field: "height_setting",
        type: "display_measure",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    4: {
      name: "hrm_profile",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      0: { field: "enabled", type: "bool", scale: null, offset: 0, units: "" },
      1: {
        field: "hrm_ant_id",
        type: "uint16z",
        scale: null,
        offset: 0,
        units: ""
      },
      2: { field: "log_hrv", type: "bool", scale: null, offset: 0, units: "" },
      3: {
        field: "hrm_ant_id_trans_type",
        type: "uint8z",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    5: {
      name: "sdm_profile",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      0: { field: "enabled", type: "bool", scale: null, offset: 0, units: "" },
      1: {
        field: "sdm_ant_id",
        type: "uint16z",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "sdm_cal_factor",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "%"
      },
      3: {
        field: "odometer",
        type: "uint32",
        scale: 100,
        offset: 0,
        units: "m"
      },
      4: {
        field: "speed_source",
        type: "bool",
        scale: null,
        offset: 0,
        units: ""
      },
      5: {
        field: "sdm_ant_id_trans_type",
        type: "uint8z",
        scale: null,
        offset: 0,
        units: ""
      },
      7: {
        field: "odometer_rollover",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    6: {
      name: "bike_profile",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      0: { field: "name", type: "string", scale: null, offset: 0, units: "" },
      1: { field: "sport", type: "sport", scale: null, offset: 0, units: "" },
      2: {
        field: "sub_sport",
        type: "sub_sport",
        scale: null,
        offset: 0,
        units: ""
      },
      3: {
        field: "odometer",
        type: "uint32",
        scale: 100,
        offset: 0,
        units: "m"
      },
      4: {
        field: "bike_spd_ant_id",
        type: "uint16z",
        scale: null,
        offset: 0,
        units: ""
      },
      5: {
        field: "bike_cad_ant_id",
        type: "uint16z",
        scale: null,
        offset: 0,
        units: ""
      },
      6: {
        field: "bike_spdcad_ant_id",
        type: "uint16z",
        scale: null,
        offset: 0,
        units: ""
      },
      7: {
        field: "bike_power_ant_id",
        type: "uint16z",
        scale: null,
        offset: 0,
        units: ""
      },
      8: {
        field: "custom_wheelsize",
        type: "uint16",
        scale: 1e3,
        offset: 0,
        units: "m"
      },
      9: {
        field: "auto_wheelsize",
        type: "uint16",
        scale: 1e3,
        offset: 0,
        units: "m"
      },
      10: {
        field: "bike_weight",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "kg"
      },
      11: {
        field: "power_cal_factor",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "%"
      },
      12: {
        field: "auto_wheel_cal",
        type: "bool",
        scale: null,
        offset: 0,
        units: ""
      },
      13: {
        field: "auto_power_zero",
        type: "bool",
        scale: null,
        offset: 0,
        units: ""
      },
      14: { field: "id", type: "uint8", scale: null, offset: 0, units: "" },
      15: {
        field: "spd_enabled",
        type: "bool",
        scale: null,
        offset: 0,
        units: ""
      },
      16: {
        field: "cad_enabled",
        type: "bool",
        scale: null,
        offset: 0,
        units: ""
      },
      17: {
        field: "spdcad_enabled",
        type: "bool",
        scale: null,
        offset: 0,
        units: ""
      },
      18: {
        field: "power_enabled",
        type: "bool",
        scale: null,
        offset: 0,
        units: ""
      },
      19: {
        field: "crank_length",
        type: "uint8",
        scale: 2,
        offset: -110,
        units: "mm"
      },
      20: { field: "enabled", type: "bool", scale: null, offset: 0, units: "" },
      21: {
        field: "bike_spd_ant_id_trans_type",
        type: "uint8z",
        scale: null,
        offset: 0,
        units: ""
      },
      22: {
        field: "bike_cad_ant_id_trans_type",
        type: "uint8z",
        scale: null,
        offset: 0,
        units: ""
      },
      23: {
        field: "bike_spdcad_ant_id_trans_type",
        type: "uint8z",
        scale: null,
        offset: 0,
        units: ""
      },
      24: {
        field: "bike_power_ant_id_trans_type",
        type: "uint8z",
        scale: null,
        offset: 0,
        units: ""
      },
      37: {
        field: "odometer_rollover",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      38: {
        field: "front_gear_num",
        type: "uint8z",
        scale: null,
        offset: 0,
        units: ""
      },
      39: {
        field: "front_gear",
        type: "uint8z",
        scale: null,
        offset: 0,
        units: ""
      },
      40: {
        field: "rear_gear_num",
        type: "uint8z",
        scale: null,
        offset: 0,
        units: ""
      },
      41: {
        field: "rear_gear",
        type: "uint8z",
        scale: null,
        offset: 0,
        units: ""
      },
      44: {
        field: "shimano_di2_enabled",
        type: "bool",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    7: {
      name: "zones_target",
      1: {
        field: "max_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "threshold_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      3: {
        field: "functional_threshold_power",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      5: {
        field: "hr_calc_type",
        type: "hr_zone_calc",
        scale: null,
        offset: 0,
        units: ""
      },
      7: {
        field: "pwr_calc_type",
        type: "pwr_zone_calc",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    8: {
      name: "hr_zone",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      1: {
        field: "high_bpm",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      2: { field: "name", type: "string", scale: null, offset: 0, units: "" }
    },
    9: {
      name: "power_zone",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      1: {
        field: "high_value",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      2: { field: "name", type: "string", scale: null, offset: 0, units: "" }
    },
    10: {
      name: "met_zone",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      1: {
        field: "high_bpm",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "calories",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "kcal / min"
      },
      3: {
        field: "fat_calories",
        type: "uint8",
        scale: 10,
        offset: 0,
        units: "kcal / min"
      }
    },
    12: {
      name: "sport",
      0: { field: "sport", type: "sport", scale: null, offset: 0, units: "" },
      1: {
        field: "sub_sport",
        type: "sub_sport",
        scale: null,
        offset: 0,
        units: ""
      },
      3: { field: "name", type: "string", scale: null, offset: 0, units: "" }
    },
    15: {
      name: "goal",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      0: { field: "sport", type: "sport", scale: null, offset: 0, units: "" },
      1: {
        field: "sub_sport",
        type: "sub_sport",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "start_date",
        type: "date_time",
        scale: null,
        offset: 0,
        units: ""
      },
      3: {
        field: "end_date",
        type: "date_time",
        scale: null,
        offset: 0,
        units: ""
      },
      4: { field: "type", type: "goal", scale: null, offset: 0, units: "" },
      5: { field: "value", type: "uint32", scale: null, offset: 0, units: "" },
      6: { field: "repeat", type: "bool", scale: null, offset: 0, units: "" },
      7: {
        field: "target_value",
        type: "uint32",
        scale: null,
        offset: 0,
        units: ""
      },
      8: {
        field: "recurrence",
        type: "goal_recurrence",
        scale: null,
        offset: 0,
        units: ""
      },
      9: {
        field: "recurrence_value",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      10: { field: "enabled", type: "bool", scale: null, offset: 0, units: "" }
    },
    18: {
      name: "session",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      253: {
        field: "timestamp",
        type: "date_time",
        scale: null,
        offset: 0,
        units: "s"
      },
      0: { field: "event", type: "event", scale: null, offset: 0, units: "" },
      1: {
        field: "event_type",
        type: "event_type",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "start_time",
        type: "date_time",
        scale: null,
        offset: 0,
        units: ""
      },
      3: {
        field: "start_position_lat",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      4: {
        field: "start_position_long",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      5: { field: "sport", type: "sport", scale: null, offset: 0, units: "" },
      6: {
        field: "sub_sport",
        type: "sub_sport",
        scale: null,
        offset: 0,
        units: ""
      },
      7: {
        field: "total_elapsed_time",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      8: {
        field: "total_timer_time",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      9: {
        field: "total_distance",
        type: "uint32",
        scale: 100,
        offset: 0,
        units: "m"
      },
      10: {
        field: "total_cycles",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "cycles"
      },
      11: {
        field: "total_calories",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "kcal"
      },
      13: {
        field: "total_fat_calories",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "kcal"
      },
      14: {
        field: "avg_speed",
        type: "uint16",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      15: {
        field: "max_speed",
        type: "uint16",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      16: {
        field: "avg_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      17: {
        field: "max_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      18: {
        field: "avg_cadence",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "rpm"
      },
      19: {
        field: "max_cadence",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "rpm"
      },
      20: {
        field: "avg_power",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      21: {
        field: "max_power",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      22: {
        field: "total_ascent",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "m"
      },
      23: {
        field: "total_descent",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "m"
      },
      24: {
        field: "total_training_effect",
        type: "uint8",
        scale: 10,
        offset: 0,
        units: ""
      },
      25: {
        field: "first_lap_index",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      26: {
        field: "num_laps",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      27: {
        field: "event_group",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      28: {
        field: "trigger",
        type: "session_trigger",
        scale: null,
        offset: 0,
        units: ""
      },
      29: {
        field: "nec_lat",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      30: {
        field: "nec_long",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      31: {
        field: "swc_lat",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      32: {
        field: "swc_long",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      34: {
        field: "normalized_power",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      35: {
        field: "training_stress_score",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "tss"
      },
      36: {
        field: "intensity_factor",
        type: "uint16",
        scale: 1e3,
        offset: 0,
        units: "if"
      },
      37: {
        field: "left_right_balance",
        type: "left_right_balance_100",
        scale: 100,
        offset: 0,
        units: "%"
      },
      38: {
        field: "end_position_lat",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      39: {
        field: "end_position_long",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      41: {
        field: "avg_stroke_count",
        type: "uint32",
        scale: 10,
        offset: 0,
        units: "strokes/lap"
      },
      42: {
        field: "avg_stroke_distance",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "m"
      },
      43: {
        field: "swim_stroke",
        type: "swim_stroke",
        scale: null,
        offset: 0,
        units: "swim_stroke"
      },
      44: {
        field: "pool_length",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "m"
      },
      45: {
        field: "threshold_power",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      46: {
        field: "pool_length_unit",
        type: "display_measure",
        scale: null,
        offset: 0,
        units: ""
      },
      47: {
        field: "num_active_lengths",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "lengths"
      },
      48: {
        field: "total_work",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "J"
      },
      49: {
        field: "avg_altitude",
        type: "uint16",
        scale: 5,
        offset: -500,
        units: "m"
      },
      50: {
        field: "max_altitude",
        type: "uint16",
        scale: 5,
        offset: -500,
        units: "m"
      },
      51: {
        field: "gps_accuracy",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "m"
      },
      52: {
        field: "avg_grade",
        type: "sint16",
        scale: 100,
        offset: 0,
        units: "%"
      },
      53: {
        field: "avg_pos_grade",
        type: "sint16",
        scale: 100,
        offset: 0,
        units: "%"
      },
      54: {
        field: "avg_neg_grade",
        type: "sint16",
        scale: 100,
        offset: 0,
        units: "%"
      },
      55: {
        field: "max_pos_grade",
        type: "sint16",
        scale: 100,
        offset: 0,
        units: "%"
      },
      56: {
        field: "max_neg_grade",
        type: "sint16",
        scale: 100,
        offset: 0,
        units: "%"
      },
      57: {
        field: "avg_temperature",
        type: "sint8",
        scale: null,
        offset: 0,
        units: "C"
      },
      58: {
        field: "max_temperature",
        type: "sint8",
        scale: null,
        offset: 0,
        units: "C"
      },
      59: {
        field: "total_moving_time",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      60: {
        field: "avg_pos_vertical_speed",
        type: "uint16",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      61: {
        field: "avg_neg_vertical_speed",
        type: "uint16",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      62: {
        field: "max_pos_vertical_speed",
        type: "uint16",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      63: {
        field: "max_neg_vertical_speed",
        type: "uint16",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      64: {
        field: "min_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      65: {
        field: "time_in_hr_zone",
        type: "uint32_array",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      66: {
        field: "time_in_speed_zone",
        type: "uint32_array",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      67: {
        field: "time_in_cadence_zone",
        type: "uint32_array",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      68: {
        field: "time_in_power_zone",
        type: "uint32_array",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      69: {
        field: "avg_lap_time",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      70: {
        field: "best_lap_index",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      71: {
        field: "min_altitude",
        type: "uint16",
        scale: 5,
        offset: -500,
        units: "m"
      },
      82: {
        field: "player_score",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      83: {
        field: "opponent_score",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      84: {
        field: "opponent_name",
        type: "string",
        scale: null,
        offset: 0,
        units: ""
      },
      85: {
        field: "stroke_count",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "counts"
      },
      86: {
        field: "zone_count",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "counts"
      },
      87: {
        field: "max_ball_speed",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "m/s"
      },
      88: {
        field: "avg_ball_speed",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "m/s"
      },
      89: {
        field: "avg_vertical_oscillation",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "mm"
      },
      90: {
        field: "avg_stance_time_percent",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "percent"
      },
      91: {
        field: "avg_stance_time",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "ms"
      },
      92: {
        field: "avg_fractional_cadence",
        type: "uint8",
        scale: 128,
        offset: 0,
        units: "rpm"
      },
      93: {
        field: "max_fractional_cadence",
        type: "uint8",
        scale: 128,
        offset: 0,
        units: "rpm"
      },
      94: {
        field: "total_fractional_cycles",
        type: "uint8",
        scale: 128,
        offset: 0,
        units: "cycles"
      },
      95: {
        field: "avg_total_hemoglobin_conc",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "g/dL"
      },
      96: {
        field: "min_total_hemoglobin_conc",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "g/dL"
      },
      97: {
        field: "max_total_hemoglobin_conc",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "g/dL"
      },
      98: {
        field: "avg_saturated_hemoglobin_percent",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "%"
      },
      99: {
        field: "min_saturated_hemoglobin_percent",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "%"
      },
      100: {
        field: "max_saturated_hemoglobin_percent",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "%"
      },
      101: {
        field: "avg_left_torque_effectiveness",
        type: "uint8",
        scale: 2,
        offset: 0,
        units: "percent"
      },
      102: {
        field: "avg_right_torque_effectiveness",
        type: "uint8",
        scale: 2,
        offset: 0,
        units: "percent"
      },
      103: {
        field: "avg_left_pedal_smoothness",
        type: "uint8",
        scale: 2,
        offset: 0,
        units: "percent"
      },
      104: {
        field: "avg_right_pedal_smoothness",
        type: "uint8",
        scale: 2,
        offset: 0,
        units: "percent"
      },
      105: {
        field: "avg_combined_pedal_smoothness",
        type: "uint8",
        scale: 2,
        offset: 0,
        units: "percent"
      },
      111: {
        field: "sport_index",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      112: {
        field: "time_standing",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      113: {
        field: "stand_count",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      114: {
        field: "avg_left_pco",
        type: "sint8",
        scale: null,
        offset: 0,
        units: "mm"
      },
      115: {
        field: "avg_right_pco",
        type: "sint8",
        scale: null,
        offset: 0,
        units: "mm"
      },
      116: {
        field: "avg_left_power_phase",
        type: "uint8",
        scale: 0.7111111,
        offset: 0,
        units: "degrees"
      },
      117: {
        field: "avg_left_power_phase_peak",
        type: "uint8",
        scale: 0.7111111,
        offset: 0,
        units: "degrees"
      },
      118: {
        field: "avg_right_power_phase",
        type: "uint8",
        scale: 0.7111111,
        offset: 0,
        units: "degrees"
      },
      119: {
        field: "avg_right_power_phase_peak",
        type: "uint8",
        scale: 0.7111111,
        offset: 0,
        units: "degrees"
      },
      120: {
        field: "avg_power_position",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      121: {
        field: "max_power_position",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      122: {
        field: "avg_cadence_position",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "rpm"
      },
      123: {
        field: "max_cadence_position",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "rpm"
      },
      124: {
        field: "enhanced_avg_speed",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      125: {
        field: "enhanced_max_speed",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      126: {
        field: "enhanced_avg_altitude",
        type: "uint32",
        scale: 5,
        offset: -500,
        units: "m"
      },
      127: {
        field: "enhanced_min_altitude",
        type: "uint32",
        scale: 5,
        offset: -500,
        units: "m"
      },
      128: {
        field: "enhanced_max_altitude",
        type: "uint32",
        scale: 5,
        offset: -500,
        units: "m"
      },
      129: {
        field: "avg_lev_motor_power",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      130: {
        field: "max_lev_motor_power",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      131: {
        field: "lev_battery_consumption",
        type: "uint8",
        scale: 2,
        offset: 0,
        units: "percent"
      },
      132: {
        field: "avg_vertical_ratio",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "percent"
      },
      133: {
        field: "avg_stance_time_balance",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "percent"
      },
      134: {
        field: "avg_step_length",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "mm"
      },
      137: {
        field: "total_anaerobic_training_effect",
        type: "uint8",
        scale: 10,
        offset: 0,
        units: ""
      },
      139: {
        field: "avg_vam",
        type: "uint16",
        scale: 1,
        // Raw 100 -> 100 (User specific m/h)
        offset: 0,
        units: "m/h"
      },
      192: {
        field: "workout_feel",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      193: {
        field: "workout_rpe",
        type: "uint8",
        scale: 10,
        offset: 0,
        units: ""
      },
      110: {
        field: "sport_profile_name",
        type: "string",
        scale: null,
        offset: 0,
        units: ""
      },
      168: {
        field: "training_load_peak",
        type: "uint32",
        scale: 1,
        offset: 0,
        units: ""
      },
      169: {
        field: "enhanced_avg_respiration_rate",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "breaths/min"
      },
      150: {
        field: "min_temperature",
        type: "sint8",
        scale: null,
        offset: 0,
        units: "C"
      },
      170: {
        field: "enhanced_max_respiration_rate",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "breaths/min"
      },
      178: {
        field: "est_sweat_loss",
        type: "uint16",
        scale: 1,
        // ml
        offset: 0,
        units: "ml"
      },
      180: {
        field: "enhanced_min_respiration_rate",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "breaths/min"
      },
      181: {
        field: "total_grit",
        type: "float32",
        scale: 1,
        offset: 0,
        units: "kGrit"
      },
      182: {
        field: "total_flow",
        type: "float32",
        scale: 1,
        offset: 0,
        units: "Flow"
      },
      183: {
        field: "jump_count",
        type: "uint16",
        scale: 1,
        offset: 0,
        units: ""
      },
      186: {
        field: "avg_grit",
        type: "float32",
        scale: 1,
        offset: 0,
        units: "kGrit"
      },
      187: {
        field: "avg_flow",
        type: "float32",
        scale: 1,
        offset: 0,
        units: "Flow"
      },
      188: {
        field: "primary_benefit",
        type: "uint8",
        scale: 1,
        offset: 0,
        units: ""
      },
      196: {
        field: "resting_calories",
        type: "uint16",
        scale: 1,
        offset: 0,
        units: "kcal"
      },
      205: {
        field: "beginning_potential_stamina",
        type: "uint8",
        scale: 1,
        offset: 0,
        units: "percent"
      },
      206: {
        field: "ending_potential_stamina",
        type: "uint8",
        scale: 1,
        offset: 0,
        units: "percent"
      },
      207: {
        field: "min_stamina",
        type: "uint8",
        scale: 1,
        offset: 0,
        units: "percent"
      },
      214: {
        field: "avg_grit",
        type: "float32",
        scale: null,
        offset: 0,
        units: ""
      },
      215: {
        field: "avg_flow",
        type: "float32",
        scale: null,
        offset: 0,
        units: ""
      },
      140: {
        field: "recovery_advisor",
        type: "uint16",
        // Minutes?
        scale: 1,
        offset: 0,
        units: "min"
      }
    },
    19: {
      name: "lap",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      253: {
        field: "timestamp",
        type: "date_time",
        scale: null,
        offset: 0,
        units: "s"
      },
      0: { field: "event", type: "event", scale: null, offset: 0, units: "" },
      1: {
        field: "event_type",
        type: "event_type",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "start_time",
        type: "date_time",
        scale: null,
        offset: 0,
        units: ""
      },
      3: {
        field: "start_position_lat",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      4: {
        field: "start_position_long",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      5: {
        field: "end_position_lat",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      6: {
        field: "end_position_long",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      7: {
        field: "total_elapsed_time",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      8: {
        field: "total_timer_time",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      9: {
        field: "total_distance",
        type: "uint32",
        scale: 100,
        offset: 0,
        units: "m"
      },
      10: {
        field: "total_cycles",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "cycles"
      },
      11: {
        field: "total_calories",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "kcal"
      },
      12: {
        field: "total_fat_calories",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "kcal"
      },
      13: {
        field: "avg_speed",
        type: "uint16",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      14: {
        field: "max_speed",
        type: "uint16",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      15: {
        field: "avg_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      16: {
        field: "max_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      17: {
        field: "avg_cadence",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "rpm"
      },
      18: {
        field: "max_cadence",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "rpm"
      },
      19: {
        field: "avg_power",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      20: {
        field: "max_power",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      21: {
        field: "total_ascent",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "m"
      },
      22: {
        field: "total_descent",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "m"
      },
      23: {
        field: "intensity",
        type: "intensity",
        scale: null,
        offset: 0,
        units: ""
      },
      24: {
        field: "lap_trigger",
        type: "lap_trigger",
        scale: null,
        offset: 0,
        units: ""
      },
      25: { field: "sport", type: "sport", scale: null, offset: 0, units: "" },
      26: {
        field: "event_group",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      32: {
        field: "num_lengths",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "lengths"
      },
      33: {
        field: "normalized_power",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      34: {
        field: "left_right_balance",
        type: "left_right_balance_100",
        scale: 100,
        offset: 0,
        units: "%"
      },
      35: {
        field: "first_length_index",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      37: {
        field: "avg_stroke_distance",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "m"
      },
      38: {
        field: "swim_stroke",
        type: "swim_stroke",
        scale: null,
        offset: 0,
        units: ""
      },
      39: {
        field: "sub_sport",
        type: "sub_sport",
        scale: null,
        offset: 0,
        units: ""
      },
      40: {
        field: "num_active_lengths",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "lengths"
      },
      41: {
        field: "total_work",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "J"
      },
      42: {
        field: "avg_altitude",
        type: "uint16",
        scale: 5,
        offset: -500,
        units: "m"
      },
      43: {
        field: "max_altitude",
        type: "uint16",
        scale: 5,
        offset: -500,
        units: "m"
      },
      44: {
        field: "gps_accuracy",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "m"
      },
      45: {
        field: "avg_grade",
        type: "sint16",
        scale: 100,
        offset: 0,
        units: "%"
      },
      46: {
        field: "avg_pos_grade",
        type: "sint16",
        scale: 100,
        offset: 0,
        units: "%"
      },
      47: {
        field: "avg_neg_grade",
        type: "sint16",
        scale: 100,
        offset: 0,
        units: "%"
      },
      48: {
        field: "max_pos_grade",
        type: "sint16",
        scale: 100,
        offset: 0,
        units: "%"
      },
      49: {
        field: "max_neg_grade",
        type: "sint16",
        scale: 100,
        offset: 0,
        units: "%"
      },
      50: {
        field: "avg_temperature",
        type: "sint8",
        scale: null,
        offset: 0,
        units: "C"
      },
      51: {
        field: "max_temperature",
        type: "sint8",
        scale: null,
        offset: 0,
        units: "C"
      },
      52: {
        field: "total_moving_time",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      53: {
        field: "avg_pos_vertical_speed",
        type: "uint16",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      54: {
        field: "avg_neg_vertical_speed",
        type: "uint16",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      55: {
        field: "max_pos_vertical_speed",
        type: "uint16",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      56: {
        field: "max_neg_vertical_speed",
        type: "uint16",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      57: {
        field: "time_in_hr_zone",
        type: "uint32_array",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      58: {
        field: "time_in_speed_zone",
        type: "uint32_array",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      59: {
        field: "time_in_cadence_zone",
        type: "uint32_array",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      60: {
        field: "time_in_power_zone",
        type: "uint32_array",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      61: {
        field: "repetition_num",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      62: {
        field: "min_altitude",
        type: "uint16",
        scale: 5,
        offset: -500,
        units: "m"
      },
      63: {
        field: "min_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      71: {
        field: "wkt_step_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      74: {
        field: "opponent_score",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      75: {
        field: "stroke_count",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "counts"
      },
      76: {
        field: "zone_count",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "counts"
      },
      77: {
        field: "avg_vertical_oscillation",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "mm"
      },
      78: {
        field: "avg_stance_time_percent",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "percent"
      },
      79: {
        field: "avg_stance_time",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "ms"
      },
      80: {
        field: "avg_fractional_cadence",
        type: "uint8",
        scale: 128,
        offset: 0,
        units: "rpm"
      },
      81: {
        field: "max_fractional_cadence",
        type: "uint8",
        scale: 128,
        offset: 0,
        units: "rpm"
      },
      82: {
        field: "total_fractional_cycles",
        type: "uint8",
        scale: 128,
        offset: 0,
        units: "cycles"
      },
      83: {
        field: "player_score",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      84: {
        field: "avg_total_hemoglobin_conc",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "g/dL"
      },
      85: {
        field: "min_total_hemoglobin_conc",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "g/dL"
      },
      86: {
        field: "max_total_hemoglobin_conc",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "g/dL"
      },
      87: {
        field: "avg_saturated_hemoglobin_percent",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "%"
      },
      88: {
        field: "min_saturated_hemoglobin_percent",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "%"
      },
      89: {
        field: "max_saturated_hemoglobin_percent",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "%"
      },
      91: {
        field: "avg_left_torque_effectiveness",
        type: "uint8",
        scale: 2,
        offset: 0,
        units: "percent"
      },
      92: {
        field: "avg_right_torque_effectiveness",
        type: "uint8",
        scale: 2,
        offset: 0,
        units: "percent"
      },
      93: {
        field: "avg_left_pedal_smoothness",
        type: "uint8",
        scale: 2,
        offset: 0,
        units: "percent"
      },
      94: {
        field: "avg_right_pedal_smoothness",
        type: "uint8",
        scale: 2,
        offset: 0,
        units: "percent"
      },
      95: {
        field: "avg_combined_pedal_smoothness",
        type: "uint8",
        scale: 2,
        offset: 0,
        units: "percent"
      },
      98: {
        field: "time_standing",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      99: {
        field: "stand_count",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      100: {
        field: "avg_left_pco",
        type: "sint8",
        scale: null,
        offset: 0,
        units: "mm"
      },
      101: {
        field: "avg_right_pco",
        type: "sint8",
        scale: null,
        offset: 0,
        units: "mm"
      },
      102: {
        field: "avg_left_power_phase",
        type: "uint8",
        scale: 0.7111111,
        offset: 0,
        units: "degrees"
      },
      103: {
        field: "avg_left_power_phase_peak",
        type: "uint8",
        scale: 0.7111111,
        offset: 0,
        units: "degrees"
      },
      104: {
        field: "avg_right_power_phase",
        type: "uint8",
        scale: 0.7111111,
        offset: 0,
        units: "degrees"
      },
      105: {
        field: "avg_right_power_phase_peak",
        type: "uint8",
        scale: 0.7111111,
        offset: 0,
        units: "degrees"
      },
      106: {
        field: "avg_power_position",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      107: {
        field: "max_power_position",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      108: {
        field: "avg_cadence_position",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "rpm"
      },
      109: {
        field: "max_cadence_position",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "rpm"
      },
      110: {
        field: "enhanced_avg_speed",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      111: {
        field: "enhanced_max_speed",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      112: {
        field: "enhanced_avg_altitude",
        type: "uint32",
        scale: 5,
        offset: -500,
        units: "m"
      },
      113: {
        field: "enhanced_min_altitude",
        type: "uint32",
        scale: 5,
        offset: -500,
        units: "m"
      },
      114: {
        field: "enhanced_max_altitude",
        type: "uint32",
        scale: 5,
        offset: -500,
        units: "m"
      },
      115: {
        field: "avg_lev_motor_power",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      116: {
        field: "max_lev_motor_power",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      117: {
        field: "lev_battery_consumption",
        type: "uint8",
        scale: 2,
        offset: 0,
        units: "percent"
      },
      118: {
        field: "avg_vertical_ratio",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "percent"
      },
      119: {
        field: "avg_stance_time_balance",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "percent"
      },
      120: {
        field: "avg_step_length",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "mm"
      },
      121: {
        field: "avg_vam",
        type: "uint16",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      }
    },
    20: {
      name: "record",
      253: {
        field: "timestamp",
        type: "date_time",
        scale: null,
        offset: 0,
        units: "s"
      },
      114: {
        field: "grit",
        type: "float32",
        scale: null,
        offset: 0,
        units: ""
      },
      115: {
        field: "flow",
        type: "float32",
        scale: null,
        offset: 0,
        units: ""
      },
      0: {
        field: "position_lat",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      1: {
        field: "position_long",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      2: {
        field: "altitude",
        type: "uint16",
        scale: 5,
        offset: -500,
        units: "m"
      },
      3: {
        field: "heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      4: {
        field: "cadence",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "rpm"
      },
      5: {
        field: "distance",
        type: "uint32",
        scale: 100,
        offset: 0,
        units: "m"
      },
      6: {
        field: "speed",
        type: "uint16",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      7: {
        field: "power",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      8: {
        field: "compressed_speed_distance",
        type: "byte",
        scale: 100.16,
        offset: 0,
        units: "m/s,m"
      },
      9: { field: "grade", type: "sint16", scale: 100, offset: 0, units: "%" },
      10: {
        field: "resistance",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      11: {
        field: "time_from_course",
        type: "sint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      12: {
        field: "cycle_length",
        type: "uint8",
        scale: 100,
        offset: 0,
        units: "m"
      },
      13: {
        field: "temperature",
        type: "sint8",
        scale: null,
        offset: 0,
        units: "C"
      },
      17: {
        field: "speed_1s",
        type: "uint8",
        scale: 16,
        offset: 0,
        units: "m/s"
      },
      18: {
        field: "cycles",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "cycles"
      },
      19: {
        field: "total_cycles",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "cycles"
      },
      28: {
        field: "compressed_accumulated_power",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      29: {
        field: "accumulated_power",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "watts"
      },
      30: {
        field: "left_right_balance",
        type: "left_right_balance",
        scale: null,
        offset: 0,
        units: ""
      },
      31: {
        field: "gps_accuracy",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "m"
      },
      32: {
        field: "vertical_speed",
        type: "sint16",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      33: {
        field: "calories",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "kcal"
      },
      39: {
        field: "vertical_oscillation",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "mm"
      },
      40: {
        field: "stance_time_percent",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "percent"
      },
      41: {
        field: "stance_time",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "ms"
      },
      42: {
        field: "activity_type",
        type: "activity_type",
        scale: null,
        offset: 0,
        units: ""
      },
      43: {
        field: "left_torque_effectiveness",
        type: "uint8",
        scale: 2,
        offset: 0,
        units: "percent"
      },
      44: {
        field: "right_torque_effectiveness",
        type: "uint8",
        scale: 2,
        offset: 0,
        units: "percent"
      },
      45: {
        field: "left_pedal_smoothness",
        type: "uint8",
        scale: 2,
        offset: 0,
        units: "percent"
      },
      46: {
        field: "right_pedal_smoothness",
        type: "uint8",
        scale: 2,
        offset: 0,
        units: "percent"
      },
      47: {
        field: "combined_pedal_smoothness",
        type: "uint8",
        scale: 2,
        offset: 0,
        units: "percent"
      },
      48: {
        field: "time128",
        type: "uint8",
        scale: 128,
        offset: 0,
        units: "s"
      },
      49: {
        field: "stroke_type",
        type: "stroke_type",
        scale: null,
        offset: 0,
        units: ""
      },
      50: { field: "zone", type: "uint8", scale: null, offset: 0, units: "" },
      51: {
        field: "ball_speed",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "m/s"
      },
      52: {
        field: "cadence256",
        type: "uint16",
        scale: 256,
        offset: 0,
        units: "rpm"
      },
      53: {
        field: "fractional_cadence",
        type: "uint8",
        scale: 128,
        offset: 0,
        units: "rpm"
      },
      54: {
        field: "total_hemoglobin_conc",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "g/dL"
      },
      55: {
        field: "total_hemoglobin_conc_min",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "g/dL"
      },
      56: {
        field: "total_hemoglobin_conc_max",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "g/dL"
      },
      57: {
        field: "saturated_hemoglobin_percent",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "%"
      },
      58: {
        field: "saturated_hemoglobin_percent_min",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "%"
      },
      59: {
        field: "saturated_hemoglobin_percent_max",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "%"
      },
      62: {
        field: "device_index",
        type: "device_index",
        scale: null,
        offset: 0,
        units: ""
      },
      67: {
        field: "left_pco",
        type: "sint8",
        scale: null,
        offset: 0,
        units: "mm"
      },
      68: {
        field: "right_pco",
        type: "sint8",
        scale: null,
        offset: 0,
        units: "mm"
      },
      69: {
        field: "left_power_phase",
        type: "uint8",
        scale: 0.7111111,
        offset: 0,
        units: "degrees"
      },
      70: {
        field: "left_power_phase_peak",
        type: "uint8",
        scale: 0.7111111,
        offset: 0,
        units: "degrees"
      },
      71: {
        field: "right_power_phase",
        type: "uint8",
        scale: 0.7111111,
        offset: 0,
        units: "degrees"
      },
      72: {
        field: "right_power_phase_peak",
        type: "uint8",
        scale: 0.7111111,
        offset: 0,
        units: "degrees"
      },
      73: {
        field: "enhanced_speed",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      78: {
        field: "enhanced_altitude",
        type: "uint32",
        scale: 5,
        offset: -500,
        units: "m"
      },
      81: {
        field: "battery_soc",
        type: "uint8",
        scale: 2,
        offset: 0,
        units: "percent"
      },
      82: {
        field: "motor_power",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      83: {
        field: "vertical_ratio",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "percent"
      },
      84: {
        field: "stance_time_balance",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "percent"
      },
      85: {
        field: "step_length",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "mm"
      },
      91: {
        field: "absolute_pressure",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "Pa"
      },
      92: {
        field: "depth",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "m"
      },
      93: {
        field: "next_stop_depth",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "m"
      },
      94: {
        field: "next_stop_time",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "s"
      },
      95: {
        field: "time_to_surface",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "s"
      },
      96: {
        field: "ndl_time",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "s"
      },
      97: {
        field: "cns_load",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "percent"
      },
      98: {
        field: "n2_load",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "percent"
      },
      137: {
        field: "potential_stamina",
        type: "uint8",
        scale: 1,
        offset: 0,
        units: "percent"
      },
      138: {
        field: "stamina",
        type: "uint8",
        scale: 1,
        offset: 0,
        units: "percent"
      }
    },
    312: {
      name: "split",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      0: {
        field: "split_type",
        type: "split_type",
        scale: null,
        offset: 0,
        units: ""
      },
      1: {
        field: "total_elapsed_time",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      2: {
        field: "total_timer_time",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      3: {
        field: "total_distance",
        type: "uint32",
        scale: 100,
        offset: 0,
        units: "m"
      },
      4: {
        field: "avg_speed",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      9: {
        field: "start_time",
        type: "date_time",
        scale: null,
        offset: 0,
        units: ""
      },
      13: {
        field: "total_ascent",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "m"
      },
      14: {
        field: "total_descent",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "m"
      },
      21: {
        field: "start_position_lat",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      22: {
        field: "start_position_long",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      23: {
        field: "end_position_lat",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      24: {
        field: "end_position_long",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      25: {
        field: "max_speed",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      26: {
        field: "avg_vert_speed",
        type: "sint32",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      27: {
        field: "end_time",
        type: "date_time",
        scale: null,
        offset: 0,
        units: ""
      },
      28: {
        field: "total_calories",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "kcal"
      },
      74: {
        field: "start_elevation",
        type: "uint32",
        scale: 5,
        offset: -500,
        units: "m"
      },
      78: {
        field: "active_time",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      107: {
        field: "beginning_potential_stamina",
        type: "uint8",
        scale: 1,
        offset: 0,
        units: "percent"
      },
      108: {
        field: "ending_potential_stamina",
        type: "uint8",
        scale: 1,
        offset: 0,
        units: "percent"
      },
      109: {
        field: "min_stamina",
        type: "uint8",
        scale: 1,
        offset: 0,
        units: "percent"
      },
      110: {
        field: "total_moving_time",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      }
    },
    313: {
      name: "split_summary",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      0: {
        field: "split_type",
        type: "split_type",
        scale: null,
        offset: 0,
        units: ""
      },
      3: {
        field: "num_splits",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      4: {
        field: "total_timer_time",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      5: {
        field: "total_distance",
        type: "uint32",
        scale: 100,
        offset: 0,
        units: "m"
      },
      6: {
        field: "avg_speed",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      7: {
        field: "max_speed",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      8: {
        field: "total_ascent",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "m"
      },
      9: {
        field: "total_descent",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "m"
      },
      10: {
        field: "avg_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      11: {
        field: "max_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      12: {
        field: "avg_vert_speed",
        type: "sint32",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      13: {
        field: "total_calories",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "kcal"
      },
      65: {
        field: "active_time",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      77: {
        field: "total_moving_time",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      }
    },
    285: {
      name: "jump",
      253: { field: "timestamp", type: "date_time", scale: null, offset: 0, units: "s" },
      0: { field: "distance", type: "float32", scale: null, offset: 0, units: "m" },
      1: { field: "height", type: "float32", scale: null, offset: 0, units: "m" },
      2: { field: "rotations", type: "uint8", scale: null, offset: 0, units: "" },
      3: { field: "hang_time", type: "float32", scale: null, offset: 0, units: "s" },
      4: { field: "score", type: "float32", scale: null, offset: 0, units: "" },
      5: { field: "position_lat", type: "sint32", scale: null, offset: 0, units: "semicircles" },
      6: { field: "position_long", type: "sint32", scale: null, offset: 0, units: "semicircles" },
      7: { field: "speed", type: "uint16", scale: 1e3, offset: 0, units: "m/s" },
      8: { field: "enhanced_speed", type: "uint32", scale: 1e3, offset: 0, units: "m/s" }
    },
    21: {
      name: "event",
      253: {
        field: "timestamp",
        type: "date_time",
        scale: null,
        offset: 0,
        units: "s"
      },
      0: { field: "event", type: "event", scale: null, offset: 0, units: "" },
      1: {
        field: "event_type",
        type: "event_type",
        scale: null,
        offset: 0,
        units: ""
      },
      2: { field: "data16", type: "uint16", scale: null, offset: 0, units: "" },
      3: { field: "data", type: "uint32", scale: null, offset: 0, units: "" },
      4: {
        field: "event_group",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      7: { field: "score", type: "uint16", scale: null, offset: 0, units: "" },
      8: {
        field: "opponent_score",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      9: {
        field: "front_gear_num",
        type: "uint8z",
        scale: null,
        offset: 0,
        units: ""
      },
      10: {
        field: "front_gear",
        type: "uint8z",
        scale: null,
        offset: 0,
        units: ""
      },
      11: {
        field: "rear_gear_num",
        type: "uint8z",
        scale: null,
        offset: 0,
        units: ""
      },
      12: {
        field: "rear_gear",
        type: "uint8z",
        scale: null,
        offset: 0,
        units: ""
      },
      13: {
        field: "device_index",
        type: "device_index",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    23: {
      name: "device_info",
      253: {
        field: "timestamp",
        type: "date_time",
        scale: null,
        offset: 0,
        units: "s"
      },
      0: {
        field: "device_index",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      1: {
        field: "device_type",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "manufacturer",
        type: "manufacturer",
        scale: null,
        offset: 0,
        units: ""
      },
      3: {
        field: "serial_number",
        type: "uint32z",
        scale: null,
        offset: 0,
        units: ""
      },
      4: {
        field: "product",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      5: {
        field: "software_version",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: ""
      },
      6: {
        field: "hardware_version",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      7: {
        field: "cum_operating_time",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "s"
      },
      10: {
        field: "battery_voltage",
        type: "uint16",
        scale: 256,
        offset: 0,
        units: "V"
      },
      32: {
        field: "battery_level",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "percent"
      },
      11: {
        field: "battery_status",
        type: "battery_status",
        scale: null,
        offset: 0,
        units: ""
      },
      18: {
        field: "sensor_position",
        type: "body_location",
        scale: null,
        offset: 0,
        units: ""
      },
      19: {
        field: "descriptor",
        type: "string",
        scale: null,
        offset: 0,
        units: ""
      },
      20: {
        field: "ant_transmission_type",
        type: "uint8z",
        scale: null,
        offset: 0,
        units: ""
      },
      21: {
        field: "ant_device_number",
        type: "uint16z",
        scale: null,
        offset: 0,
        units: ""
      },
      22: {
        field: "ant_network",
        type: "ant_network",
        scale: null,
        offset: 0,
        units: ""
      },
      24: {
        field: "ant_id",
        type: "uint32z",
        scale: null,
        offset: 0,
        units: ""
      },
      25: {
        field: "source_type",
        type: "source_type",
        scale: null,
        offset: 0,
        units: ""
      },
      27: {
        field: "product_name",
        type: "string",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    26: {
      name: "workout",
      4: { field: "sport", type: "sport", scale: null, offset: 0, units: "" },
      5: {
        field: "capabilities",
        type: "workout_capabilities",
        scale: null,
        offset: 0,
        units: ""
      },
      6: {
        field: "num_valid_steps",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      8: {
        field: "wkt_name",
        type: "string",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    27: {
      name: "workout_step",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      0: {
        field: "wkt_step_name",
        type: "string",
        scale: null,
        offset: 0,
        units: ""
      },
      1: {
        field: "duration_type",
        type: "wkt_step_duration",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "duration_value",
        type: "uint32",
        scale: null,
        offset: 0,
        units: ""
      },
      3: {
        field: "target_type",
        type: "wkt_step_target",
        scale: null,
        offset: 0,
        units: ""
      },
      4: {
        field: "target_value",
        type: "uint32",
        scale: null,
        offset: 0,
        units: ""
      },
      5: {
        field: "custom_target_value_low",
        type: "uint32",
        scale: null,
        offset: 0,
        units: ""
      },
      6: {
        field: "custom_target_value_high",
        type: "uint32",
        scale: null,
        offset: 0,
        units: ""
      },
      7: {
        field: "intensity",
        type: "intensity",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    30: {
      name: "weight_scale",
      253: {
        field: "timestamp",
        type: "date_time",
        scale: null,
        offset: 0,
        units: "s"
      },
      0: {
        field: "weight",
        type: "weight",
        scale: 100,
        offset: 0,
        units: "kg"
      },
      1: {
        field: "percent_fat",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "%"
      },
      2: {
        field: "percent_hydration",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "%"
      },
      3: {
        field: "visceral_fat_mass",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "kg"
      },
      4: {
        field: "bone_mass",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "kg"
      },
      5: {
        field: "muscle_mass",
        type: "uint16",
        scale: 100,
        offset: 0,
        units: "kg"
      },
      7: {
        field: "basal_met",
        type: "uint16",
        scale: 4,
        offset: 0,
        units: "kcal/day"
      },
      8: {
        field: "physique_rating",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      9: {
        field: "active_met",
        type: "uint16",
        scale: 4,
        offset: 0,
        units: "kcal/day"
      },
      10: {
        field: "metabolic_age",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "years"
      },
      11: {
        field: "visceral_fat_rating",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      12: {
        field: "user_profile_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    31: {
      name: "course",
      4: { field: "sport", type: "sport", scale: null, offset: 0, units: "" },
      5: { field: "name", type: "string", scale: null, offset: 0, units: "" },
      6: {
        field: "capabilities",
        type: "course_capabilities",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    32: {
      name: "course_point",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      1: {
        field: "timestamp",
        type: "date_time",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "position_lat",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      3: {
        field: "position_long",
        type: "sint32",
        scale: null,
        offset: 0,
        units: "semicircles"
      },
      4: {
        field: "distance",
        type: "uint32",
        scale: 100,
        offset: 0,
        units: "m"
      },
      5: {
        field: "type",
        type: "course_point",
        scale: null,
        offset: 0,
        units: ""
      },
      6: { field: "name", type: "string", scale: null, offset: 0, units: "" },
      8: { field: "favorite", type: "bool", scale: null, offset: 0, units: "" }
    },
    33: {
      name: "totals",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      253: {
        field: "timestamp",
        type: "date_time",
        scale: null,
        offset: 0,
        units: "s"
      },
      0: {
        field: "timer_time",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "s"
      },
      1: {
        field: "distance",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "m"
      },
      2: {
        field: "calories",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "kcal"
      },
      3: { field: "sport", type: "sport", scale: null, offset: 0, units: "" },
      4: {
        field: "elapsed_time",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "s"
      },
      5: {
        field: "sessions",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      6: {
        field: "active_time",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "s"
      },
      9: {
        field: "sport_index",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    34: {
      name: "activity",
      253: {
        field: "timestamp",
        type: "date_time",
        scale: null,
        offset: 0,
        units: ""
      },
      0: {
        field: "total_timer_time",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      1: {
        field: "num_sessions",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      2: { field: "type", type: "activity", scale: null, offset: 0, units: "" },
      3: { field: "event", type: "event", scale: null, offset: 0, units: "" },
      4: {
        field: "event_type",
        type: "event_type",
        scale: null,
        offset: 0,
        units: ""
      },
      5: {
        field: "local_timestamp",
        type: "local_date_time",
        scale: null,
        offset: 0,
        units: ""
      },
      6: {
        field: "event_group",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    35: {
      name: "software",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      3: { field: "version", type: "uint16", scale: 100, offset: 0, units: "" },
      5: {
        field: "part_number",
        type: "string",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    37: {
      name: "file_capabilities",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      0: { field: "type", type: "file", scale: null, offset: 0, units: "" },
      1: {
        field: "flags",
        type: "file_flags",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "directory",
        type: "string",
        scale: null,
        offset: 0,
        units: ""
      },
      3: {
        field: "max_count",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      4: {
        field: "max_size",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "bytes"
      }
    },
    38: {
      name: "mesg_capabilities",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      0: { field: "file", type: "file", scale: null, offset: 0, units: "" },
      1: {
        field: "mesg_num",
        type: "mesg_num",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "count_type",
        type: "mesg_count",
        scale: null,
        offset: 0,
        units: ""
      },
      3: { field: "count", type: "uint16", scale: null, offset: 0, units: "" }
    },
    39: {
      name: "field_capabilities",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      0: { field: "file", type: "file", scale: null, offset: 0, units: "" },
      1: {
        field: "mesg_num",
        type: "mesg_num",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "field_num",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      3: { field: "count", type: "uint16", scale: null, offset: 0, units: "" }
    },
    49: {
      name: "file_creator",
      0: {
        field: "software_version",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      1: {
        field: "hardware_version",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    51: {
      name: "blood_pressure",
      253: {
        field: "timestamp",
        type: "date_time",
        scale: null,
        offset: 0,
        units: "s"
      },
      0: {
        field: "systolic_pressure",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "mmHg"
      },
      1: {
        field: "diastolic_pressure",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "mmHg"
      },
      2: {
        field: "mean_arterial_pressure",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "mmHg"
      },
      3: {
        field: "map_3_sample_mean",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "mmHg"
      },
      4: {
        field: "map_morning_values",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "mmHg"
      },
      5: {
        field: "map_evening_values",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "mmHg"
      },
      6: {
        field: "heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      7: {
        field: "heart_rate_type",
        type: "hr_type",
        scale: null,
        offset: 0,
        units: ""
      },
      8: {
        field: "status",
        type: "bp_status",
        scale: null,
        offset: 0,
        units: ""
      },
      9: {
        field: "user_profile_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    55: {
      name: "monitoring",
      253: {
        field: "timestamp",
        type: "uint32",
        scale: null,
        offset: 0,
        units: ""
      },
      0: {
        field: "device_index",
        type: "device_index",
        scale: null,
        offset: 0,
        units: ""
      },
      1: {
        field: "calories",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "kcal"
      },
      2: {
        field: "distance",
        type: "float32",
        scale: null,
        offset: 0,
        units: "m"
      },
      3: {
        field: "cycles",
        type: "float32",
        scale: null,
        offset: 0,
        units: "cycles"
      },
      4: {
        field: "active_time",
        type: "float32",
        scale: null,
        offset: 0,
        units: "s"
      },
      5: {
        field: "activity_type",
        type: "activity_type",
        scale: null,
        offset: 0,
        units: ""
      },
      6: {
        field: "activity_subtype",
        type: "activity_subtype",
        scale: null,
        offset: 0,
        units: ""
      },
      7: {
        field: "activity_level",
        type: "activity_level",
        scale: null,
        offset: 0,
        units: "s"
      },
      8: {
        field: "distance16",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "m"
      },
      9: {
        field: "cycles16",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "cycles"
      },
      10: {
        field: "active_time16",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      11: {
        field: "local_timestamp",
        type: "uint32",
        scale: null,
        offset: 0,
        units: ""
      },
      12: {
        field: "temperature",
        type: "float32",
        scale: null,
        offset: 0,
        units: "C"
      },
      14: {
        field: "temperature_min",
        type: "float32",
        scale: null,
        offset: 0,
        units: "C"
      },
      15: {
        field: "temperature_max",
        type: "float32",
        scale: null,
        offset: 0,
        units: "C"
      },
      16: {
        field: "activity_time",
        type: "int32",
        scale: null,
        offset: 0,
        units: ""
      },
      19: {
        field: "active_calories",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "kcal"
      },
      24: {
        field: "current_activity_type_intensity",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      25: {
        field: "timestamp_min8",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      26: {
        field: "timestamp16",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      27: {
        field: "heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      28: {
        field: "intensity",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      29: {
        field: "duration_min",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      30: {
        field: "duration",
        type: "uint32",
        scale: null,
        offset: 0,
        units: ""
      },
      31: {
        field: "ascent",
        type: "float32",
        scale: null,
        offset: 0,
        units: "m"
      },
      32: {
        field: "descent",
        type: "float32",
        scale: null,
        offset: 0,
        units: "m"
      },
      33: {
        field: "moderate_activity_minutes",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      34: {
        field: "vigorous_activity_inutes",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    78: {
      name: "hrv",
      0: {
        field: "time",
        type: "uint16_array",
        scale: 1e3,
        offset: 0,
        units: "s"
      }
    },
    101: {
      name: "length",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      253: {
        field: "timestamp",
        type: "date_time",
        scale: null,
        offset: 0,
        units: "s"
      },
      0: { field: "event", type: "event", scale: null, offset: 0, units: "" },
      1: {
        field: "event_type",
        type: "event_type",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "start_time",
        type: "date_time",
        scale: null,
        offset: 0,
        units: ""
      },
      3: {
        field: "total_elapsed_time",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      4: {
        field: "total_timer_time",
        type: "uint32",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      5: {
        field: "total_strokes",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "strokes"
      },
      6: {
        field: "avg_speed",
        type: "uint16",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      7: {
        field: "swim_stroke",
        type: "swim_stroke",
        scale: null,
        offset: 0,
        units: "swim_stroke"
      },
      9: {
        field: "avg_swimming_cadence",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "strokes/min"
      },
      10: {
        field: "event_group",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      11: {
        field: "total_calories",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "kcal"
      },
      12: {
        field: "length_type",
        type: "length_type",
        scale: null,
        offset: 0,
        units: "length_type"
      },
      18: {
        field: "player_score",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      19: {
        field: "opponent_score",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      20: {
        field: "stroke_count",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "counts"
      },
      21: {
        field: "zone_count",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "counts"
      }
    },
    // Undocumented Garmin user metrics message. Observed in activity FIT files exported
    // from Garmin Connect and displayed by fitfileviewer as "User Metrics".
    79: {
      name: "user_metrics",
      253: {
        field: "timestamp",
        type: "date_time",
        scale: null,
        offset: 0,
        units: ""
      },
      0: {
        field: "vo2_max",
        type: "uint16",
        scale: 1024 / 3.5,
        offset: 0,
        units: "ml/kg/min"
      },
      1: {
        field: "age",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "years"
      },
      2: {
        field: "height",
        type: "uint8",
        scale: 100,
        offset: 0,
        units: "m"
      },
      3: {
        field: "weight",
        type: "uint16",
        scale: 10,
        offset: 0,
        units: "kg"
      },
      4: {
        field: "gender",
        type: "gender",
        scale: null,
        offset: 0,
        units: ""
      },
      6: {
        field: "max_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      8: {
        field: "remaining_recovery_time",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      11: {
        field: "lthr",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      12: {
        field: "ltpower",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      13: {
        field: "ltspeed",
        type: "uint16",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      16: {
        field: "start_of_activity",
        type: "date_time",
        scale: null,
        offset: 0,
        units: ""
      },
      19: {
        field: "first_vo2_max",
        type: "uint32",
        scale: 65536 / 3.5,
        offset: 0,
        units: "ml/kg/min"
      },
      35: {
        field: "end_of_previous_activity",
        type: "date_time",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    103: {
      name: "monitoring_info",
      253: {
        field: "timestamp",
        type: "date_time",
        scale: null,
        offset: 0,
        units: ""
      },
      0: {
        field: "local_timestamp",
        type: "uint32",
        scale: null,
        offset: 0,
        units: ""
      },
      1: {
        field: "activity_type",
        type: "activity_type",
        scale: null,
        offset: 0,
        units: ""
      },
      3: {
        field: "cycles_to_distance",
        type: "float32",
        scale: null,
        offset: 0,
        units: "cycles"
      },
      4: {
        field: "cycles_to_calories",
        type: "float32",
        scale: null,
        offset: 0,
        units: "kcal"
      },
      5: {
        field: "resting_metabolic_rate",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    108: {
      name: "o_hr_settings",
      253: {
        field: "timestamp",
        type: "date_time",
        scale: null,
        offset: 0,
        units: ""
      },
      0: { field: "enabled", type: "byte", scale: null, offset: 0, units: "" }
    },
    140: {
      name: "activity_metrics",
      1: {
        field: "new_max_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      4: {
        field: "aerobic_training_effect",
        type: "uint8",
        scale: 10,
        offset: 0,
        units: ""
      },
      7: {
        field: "vo2_max",
        type: "uint32",
        scale: 65536 / 3.5,
        offset: 0,
        units: "ml/kg/min"
      },
      9: {
        field: "recovery_time",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "min"
      },
      11: {
        field: "sport",
        type: "sport",
        scale: null,
        offset: 0,
        units: ""
      },
      20: {
        field: "anaerobic_training_effect",
        type: "uint8",
        scale: 10,
        offset: 0,
        units: ""
      },
      29: {
        field: "first_vo2_max",
        type: "uint32",
        scale: 65536 / 3.5,
        offset: 0,
        units: "ml/kg/min"
      },
      41: {
        field: "primary_benefit",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      60: {
        field: "total_ascent",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "m"
      },
      61: {
        field: "total_descent",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "m"
      },
      62: {
        field: "avg_power",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      },
      63: {
        field: "avg_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      }
    },
    206: {
      name: "field_description",
      0: {
        field: "developer_data_index",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      1: {
        field: "field_definition_number",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "fit_base_type_id",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      3: {
        field: "field_name",
        type: "string",
        scale: null,
        offset: 0,
        units: ""
      },
      // 4: { field: 'array', type: 'uint8', scale: null, offset: 0, units: '' },
      // 5: { field: 'components', type: 'string', scale: null, offset: 0, units: '' },
      6: { field: "scale", type: "uint8", scale: null, offset: 0, units: "" },
      7: { field: "offset", type: "sint8", scale: null, offset: 0, units: "" },
      8: { field: "units", type: "string", scale: null, offset: 0, units: "" },
      // 9: { field: 'bits', type: 'string', scale: null, offset: 0, units: '' },
      // 10: { field: 'accumulate', type: 'string', scale: null, offset: 0, units: '' },
      // 13: { field: 'fit_base_unit_id', type: 'uint16', scale: null, offset: 0, units: '' },
      // 14: { field: 'native_mesg_num', type: 'mesg_num', scale: null, offset: 0, units: '' },
      15: {
        field: "native_field_num",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    227: {
      name: "stress_level",
      0: {
        field: "stress_level_value",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      1: {
        field: "stress_level_time",
        type: "date_time",
        scale: null,
        offset: 0,
        units: "s"
      },
      2: {
        field: "field_two",
        type: "sint8",
        scale: null,
        offset: 0,
        units: ""
      },
      3: {
        field: "body_battery",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      4: {
        field: "field_four",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    207: {
      name: "developer_data_id",
      0: {
        field: "developer_id",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      1: {
        field: "application_id",
        type: "byte_array",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "manufacturer_id",
        type: "manufacturer",
        scale: null,
        offset: 0,
        units: ""
      },
      3: {
        field: "developer_data_index",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      4: {
        field: "application_version",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    258: {
      name: "dive_settings",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      0: { field: "name", type: "string", scale: null, offset: 0, units: "" },
      1: {
        field: "model",
        type: "tissue_model_type",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "gf_low",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "percent"
      },
      3: {
        field: "gf_high",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "percent"
      },
      4: {
        field: "water_type",
        type: "water_type",
        scale: null,
        offset: 0,
        units: ""
      },
      5: {
        field: "water_density",
        type: "float32",
        scale: null,
        offset: 0,
        units: "kg/m^3"
      },
      6: {
        field: "po2_warn",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "percent"
      },
      7: {
        field: "po2_critical",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "percent"
      },
      8: {
        field: "po2_deco",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "percent"
      },
      9: {
        field: "safety_stop_enabled",
        type: "bool",
        scale: null,
        offset: 0,
        units: ""
      },
      10: {
        field: "bottom_depth",
        type: "float32",
        scale: null,
        offset: 0,
        units: ""
      },
      11: {
        field: "bottom_time",
        type: "uint32",
        scale: null,
        offset: 0,
        units: ""
      },
      12: {
        field: "apnea_countdown_enabled",
        type: "bool",
        scale: null,
        offset: 0,
        units: ""
      },
      13: {
        field: "apnea_countdown_time",
        type: "uint32",
        scale: null,
        offset: 0,
        units: ""
      },
      14: {
        field: "backlight_mode",
        type: "dive_backlight_mode",
        scale: null,
        offset: 0,
        units: ""
      },
      15: {
        field: "backlight_brightness",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      },
      16: {
        field: "backlight_timeout",
        type: "backlight_timeout",
        scale: null,
        offset: 0,
        units: ""
      },
      17: {
        field: "repeat_dive_time",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "s"
      },
      18: {
        field: "safety_stop_time",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "s"
      },
      19: {
        field: "heart_rate_source_type",
        type: "source_type",
        scale: null,
        offset: 0,
        units: ""
      },
      20: {
        field: "heart_rate_source",
        type: "uint8",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    259: {
      name: "dive_gas",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      0: {
        field: "helium_content",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "percent"
      },
      1: {
        field: "oxygen_content",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "percent"
      },
      2: {
        field: "status",
        type: "dive_gas_status",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    262: {
      name: "dive_alarm",
      254: {
        field: "message_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      0: { field: "depth", type: "uint32", scale: null, offset: 0, units: "m" },
      1: { field: "time", type: "sint32", scale: null, offset: 0, units: "s" },
      2: { field: "enabled", type: "bool", scale: null, offset: 0, units: "" },
      3: {
        field: "alarm_type",
        type: "dive_alarm_type",
        scale: null,
        offset: 0,
        units: ""
      },
      4: { field: "sound", type: "tone", scale: null, offset: 0, units: "" },
      5: {
        field: "dive_types",
        type: "sub_sport",
        scale: null,
        offset: 0,
        units: ""
      }
    },
    268: {
      name: "dive_summary",
      253: {
        field: "timestamp",
        type: "date_time",
        scale: null,
        offset: 0,
        units: "s"
      },
      0: {
        field: "reference_mesg",
        type: "mesg_num",
        scale: null,
        offset: 0,
        units: ""
      },
      1: {
        field: "reference_index",
        type: "message_index",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "avg_depth",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "m"
      },
      3: {
        field: "max_depth",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "m"
      },
      4: {
        field: "surface_interval",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "s"
      },
      5: {
        field: "start_cns",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "percent"
      },
      6: {
        field: "end_cns",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "percent"
      },
      7: {
        field: "start_n2",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "percent"
      },
      8: {
        field: "end_n2",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "percent"
      },
      9: {
        field: "o2_toxicity",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "OTUs"
      },
      10: {
        field: "dive_number",
        type: "uint32",
        scale: null,
        offset: 0,
        units: ""
      },
      11: {
        field: "bottom_time",
        type: "uint32",
        scale: null,
        offset: 0,
        units: "s"
      }
    },
    319: {
      name: "tank_update",
      253: {
        field: "timestamp",
        type: "date_time",
        scale: null,
        offset: 0,
        units: "s"
      },
      0: { field: "sensor", type: "uint32", scale: null, offset: 0, units: "" },
      1: {
        field: "pressure",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "cbar"
      }
    },
    323: {
      name: "tank_summary",
      0: { field: "sensor", type: "uint32", scale: null, offset: 0, units: "" },
      1: {
        field: "start_pressure",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "cbar"
      },
      2: {
        field: "end_pressure",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "cbar"
      },
      3: {
        field: "volume_used",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "cbar"
      }
    },
    216: {
      name: "time_in_zone",
      253: {
        field: "timestamp",
        type: "date_time",
        scale: null,
        offset: 0,
        units: "s"
      },
      0: {
        field: "reference_mesg",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      1: {
        field: "reference_index",
        type: "uint16",
        scale: null,
        offset: 0,
        units: ""
      },
      2: {
        field: "time_in_hr_zone",
        type: "uint32_array",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      3: {
        field: "time_in_speed_zone",
        type: "uint32_array",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      4: {
        field: "time_in_power_zone",
        type: "uint32_array",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      5: {
        field: "time_in_power_zone",
        type: "uint32_array",
        scale: 1e3,
        offset: 0,
        units: "s"
      },
      6: {
        field: "hr_zone_high_boundary",
        type: "uint8_array",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      7: {
        field: "speed_zone_high_boundary",
        type: "uint16_array",
        scale: 1e3,
        offset: 0,
        units: "m/s"
      },
      8: {
        field: "power_zone_high_boundary",
        type: "uint16_array",
        scale: null,
        offset: 0,
        units: "watts"
      },
      9: {
        field: "power_zone_high_boundary",
        type: "uint16_array",
        scale: null,
        offset: 0,
        units: "watts"
      },
      10: {
        field: "max_heart_rate_deprecated",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      11: {
        field: "max_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      12: {
        field: "resting_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      13: {
        field: "threshold_heart_rate",
        type: "uint8",
        scale: null,
        offset: 0,
        units: "bpm"
      },
      14: {
        field: "pwr_calc_type",
        type: "pwr_zone_calc",
        scale: null,
        offset: 0,
        units: ""
      },
      15: {
        field: "functional_threshold_power",
        type: "uint16",
        scale: null,
        offset: 0,
        units: "watts"
      }
    }
  },
  types: {
    file: {
      1: "device",
      2: "settings",
      3: "sport",
      4: "activity",
      5: "workout",
      6: "course",
      7: "schedules",
      9: "weight",
      10: "totals",
      11: "goals",
      14: "blood_pressure",
      15: "monitoring_a",
      20: "activity_summary",
      28: "monitoring_daily",
      32: "monitoring_b",
      34: "segment",
      35: "segment_list",
      40: "exd_configuration",
      247: "mfg_range_min",
      254: "mfg_range_max"
    },
    mesg_num: {
      0: "file_id",
      1: "capabilities",
      2: "device_settings",
      3: "user_profile",
      4: "hrm_profile",
      5: "sdm_profile",
      6: "bike_profile",
      7: "zones_target",
      8: "hr_zone",
      9: "power_zone",
      10: "met_zone",
      12: "sport",
      15: "goal",
      18: "session",
      19: "lap",
      20: "record",
      21: "event",
      23: "device_info",
      26: "workout",
      27: "workout_step",
      28: "schedule",
      30: "weight_scale",
      31: "course",
      32: "course_point",
      33: "totals",
      34: "activity",
      35: "software",
      37: "file_capabilities",
      38: "mesg_capabilities",
      39: "field_capabilities",
      49: "file_creator",
      51: "blood_pressure",
      53: "speed_zone",
      55: "monitoring",
      72: "training_file",
      78: "hrv",
      79: "user_metrics",
      80: "ant_rx",
      81: "ant_tx",
      82: "ant_channel_id",
      101: "length",
      103: "monitoring_info",
      105: "pad",
      106: "slave_device",
      127: "connectivity",
      128: "weather_conditions",
      129: "weather_alert",
      131: "cadence_zone",
      132: "hr",
      140: "activity_metrics",
      142: "segment_lap",
      145: "memo_glob",
      148: "segment_id",
      149: "segment_leaderboard_entry",
      150: "segment_point",
      151: "segment_file",
      158: "workout_session",
      159: "watchface_settings",
      160: "gps_metadata",
      161: "camera_event",
      162: "timestamp_correlation",
      164: "gyroscope_data",
      165: "accelerometer_data",
      167: "three_d_sensor_calibration",
      169: "video_frame",
      174: "obdii_data",
      177: "nmea_sentence",
      178: "aviation_attitude",
      184: "video",
      185: "video_title",
      186: "video_description",
      187: "video_clip",
      200: "exd_screen_configuration",
      201: "exd_data_field_configuration",
      202: "exd_data_concept_configuration",
      206: "field_description",
      207: "developer_data_id",
      208: "magnetometer_data",
      209: "barometer_data",
      210: "one_d_sensor_calibration",
      225: "set",
      227: "stress_level",
      258: "dive_settings",
      259: "dive_gas",
      262: "dive_alarm",
      264: "exercise_title",
      268: "dive_summary",
      285: "jump",
      312: "split",
      313: "split_summary",
      317: "climb_pro",
      319: "tank_update",
      323: "tank_summary",
      216: "time_in_zone",
      347: "o_hr_settings",
      65280: "mfg_range_min",
      65534: "mfg_range_max"
    },
    checksum: {
      0: "clear",
      1: "ok"
    },
    file_flags: {
      0: 0,
      2: "read",
      4: "write",
      8: "erase"
    },
    mesg_count: {
      0: "num_per_file",
      1: "max_per_file",
      2: "max_per_file_type"
    },
    date_time: {
      0: 0,
      268435456: "min"
    },
    local_date_time: {
      0: 0,
      268435456: "min"
    },
    message_index: {
      0: 0,
      4095: "mask",
      28672: "reserved",
      32768: "selected"
    },
    gender: {
      0: "female",
      1: "male"
    },
    language: {
      0: "english",
      1: "french",
      2: "italian",
      3: "german",
      4: "spanish",
      5: "croatian",
      6: "czech",
      7: "danish",
      8: "dutch",
      9: "finnish",
      10: "greek",
      11: "hungarian",
      12: "norwegian",
      13: "polish",
      14: "portuguese",
      15: "slovakian",
      16: "slovenian",
      17: "swedish",
      18: "russian",
      19: "turkish",
      20: "latvian",
      21: "ukrainian",
      22: "arabic",
      23: "farsi",
      24: "bulgarian",
      25: "romanian",
      26: "chinese",
      27: "japanese",
      28: "korean",
      29: "taiwanese",
      30: "thai",
      31: "hebrew",
      32: "brazilian_portuguese",
      33: "indonesian",
      34: "malaysian",
      35: "vietnamese",
      36: "burmese",
      37: "mongolian",
      254: "custom"
    },
    language_bits_0: {
      0: 0,
      1: "english",
      2: "french",
      4: "italian",
      8: "german",
      16: "spanish",
      32: "croatian",
      64: "czech",
      128: "danish"
    },
    language_bits_1: {
      0: 0,
      1: "dutch",
      2: "finnish",
      4: "greek",
      8: "hungarian",
      16: "norwegian",
      32: "polish",
      64: "portuguese",
      128: "slovakian"
    },
    language_bits_2: {
      0: 0,
      1: "slovenian",
      2: "swedish",
      4: "russian",
      8: "turkish",
      16: "latvian",
      32: "ukrainian",
      64: "arabic",
      128: "farsi"
    },
    language_bits_3: {
      0: 0,
      1: "bulgarian",
      2: "romanian",
      4: "chinese",
      8: "japanese",
      16: "korean",
      32: "taiwanese",
      64: "thai",
      128: "hebrew"
    },
    language_bits_4: {
      0: 0,
      1: "brazilian_portuguese",
      2: "indonesian",
      4: "malaysian",
      8: "vietnamese",
      16: "burmese",
      32: "mongolian"
    },
    time_zone: {
      0: "almaty",
      1: "bangkok",
      2: "bombay",
      3: "brasilia",
      4: "cairo",
      5: "cape_verde_is",
      6: "darwin",
      7: "eniwetok",
      8: "fiji",
      9: "hong_kong",
      10: "islamabad",
      11: "kabul",
      12: "magadan",
      13: "mid_atlantic",
      14: "moscow",
      15: "muscat",
      16: "newfoundland",
      17: "samoa",
      18: "sydney",
      19: "tehran",
      20: "tokyo",
      21: "us_alaska",
      22: "us_atlantic",
      23: "us_central",
      24: "us_eastern",
      25: "us_hawaii",
      26: "us_mountain",
      27: "us_pacific",
      28: "other",
      29: "auckland",
      30: "kathmandu",
      31: "europe_western_wet",
      32: "europe_central_cet",
      33: "europe_eastern_eet",
      34: "jakarta",
      35: "perth",
      36: "adelaide",
      37: "brisbane",
      38: "tasmania",
      39: "iceland",
      40: "amsterdam",
      41: "athens",
      42: "barcelona",
      43: "berlin",
      44: "brussels",
      45: "budapest",
      46: "copenhagen",
      47: "dublin",
      48: "helsinki",
      49: "lisbon",
      50: "london",
      51: "madrid",
      52: "munich",
      53: "oslo",
      54: "paris",
      55: "prague",
      56: "reykjavik",
      57: "rome",
      58: "stockholm",
      59: "vienna",
      60: "warsaw",
      61: "zurich",
      62: "quebec",
      63: "ontario",
      64: "manitoba",
      65: "saskatchewan",
      66: "alberta",
      67: "british_columbia",
      68: "boise",
      69: "boston",
      70: "chicago",
      71: "dallas",
      72: "denver",
      73: "kansas_city",
      74: "las_vegas",
      75: "los_angeles",
      76: "miami",
      77: "minneapolis",
      78: "new_york",
      79: "new_orleans",
      80: "phoenix",
      81: "santa_fe",
      82: "seattle",
      83: "washington_dc",
      84: "us_arizona",
      85: "chita",
      86: "ekaterinburg",
      87: "irkutsk",
      88: "kaliningrad",
      89: "krasnoyarsk",
      90: "novosibirsk",
      91: "petropavlovsk_kamchatskiy",
      92: "samara",
      93: "vladivostok",
      94: "mexico_central",
      95: "mexico_mountain",
      96: "mexico_pacific",
      97: "cape_town",
      98: "winkhoek",
      99: "lagos",
      100: "riyahd",
      101: "venezuela",
      102: "australia_lh",
      103: "santiago",
      253: "manual",
      254: "automatic"
    },
    display_measure: {
      0: "metric",
      1: "statute",
      2: "nautical"
    },
    display_heart: {
      0: "bpm",
      1: "max",
      2: "reserve"
    },
    display_power: {
      0: "watts",
      1: "percent_ftp"
    },
    display_position: {
      0: "degree",
      1: "degree_minute",
      2: "degree_minute_second",
      3: "austrian_grid",
      4: "british_grid",
      5: "dutch_grid",
      6: "hungarian_grid",
      7: "finnish_grid",
      8: "german_grid",
      9: "icelandic_grid",
      10: "indonesian_equatorial",
      11: "indonesian_irian",
      12: "indonesian_southern",
      13: "india_zone_0",
      14: "india_zone_IA",
      15: "india_zone_IB",
      16: "india_zone_IIA",
      17: "india_zone_IIB",
      18: "india_zone_IIIA",
      19: "india_zone_IIIB",
      20: "india_zone_IVA",
      21: "india_zone_IVB",
      22: "irish_transverse",
      23: "irish_grid",
      24: "loran",
      25: "maidenhead_grid",
      26: "mgrs_grid",
      27: "new_zealand_grid",
      28: "new_zealand_transverse",
      29: "qatar_grid",
      30: "modified_swedish_grid",
      31: "swedish_grid",
      32: "south_african_grid",
      33: "swiss_grid",
      34: "taiwan_grid",
      35: "united_states_grid",
      36: "utm_ups_grid",
      37: "west_malayan",
      38: "borneo_rso",
      39: "estonian_grid",
      40: "latvian_grid",
      41: "swedish_ref_99_grid"
    },
    switch: {
      0: "off",
      1: "on",
      2: "auto"
    },
    sport: {
      0: "generic",
      1: "running",
      2: "cycling",
      3: "transition",
      4: "fitness_equipment",
      5: "swimming",
      6: "basketball",
      7: "soccer",
      8: "tennis",
      9: "american_football",
      10: "training",
      11: "walking",
      12: "cross_country_skiing",
      13: "alpine_skiing",
      14: "snowboarding",
      15: "rowing",
      16: "mountaineering",
      17: "hiking",
      18: "multisport",
      19: "paddling",
      20: "flying",
      21: "e_biking",
      22: "motorcycling",
      23: "boating",
      24: "driving",
      25: "golf",
      26: "hang_gliding",
      27: "horseback_riding",
      28: "hunting",
      29: "fishing",
      30: "inline_skating",
      31: "rock_climbing",
      32: "sailing",
      33: "ice_skating",
      34: "sky_diving",
      35: "snowshoeing",
      36: "snowmobiling",
      37: "stand_up_paddleboarding",
      38: "surfing",
      39: "wakeboarding",
      40: "water_skiing",
      41: "kayaking",
      42: "rafting",
      43: "windsurfing",
      44: "kitesurfing",
      45: "tactical",
      46: "jumpmaster",
      47: "boxing",
      48: "floor_climbing",
      53: "diving",
      254: "all"
    },
    sport_bits_0: {
      0: 0,
      1: "generic",
      2: "running",
      4: "cycling",
      8: "transition",
      16: "fitness_equipment",
      32: "swimming",
      64: "basketball",
      128: "soccer"
    },
    sport_bits_1: {
      0: 0,
      1: "tennis",
      2: "american_football",
      4: "training",
      8: "walking",
      16: "cross_country_skiing",
      32: "alpine_skiing",
      64: "snowboarding",
      128: "rowing"
    },
    sport_bits_2: {
      0: 0,
      1: "mountaineering",
      2: "hiking",
      4: "multisport",
      8: "paddling",
      16: "flying",
      32: "e_biking",
      64: "motorcycling",
      128: "boating"
    },
    sport_bits_3: {
      0: 0,
      1: "driving",
      2: "golf",
      4: "hang_gliding",
      8: "horseback_riding",
      16: "hunting",
      32: "fishing",
      64: "inline_skating",
      128: "rock_climbing"
    },
    sport_bits_4: {
      0: 0,
      1: "sailing",
      2: "ice_skating",
      4: "sky_diving",
      8: "snowshoeing",
      16: "snowmobiling",
      32: "stand_up_paddleboarding",
      64: "surfing",
      128: "wakeboarding"
    },
    sport_bits_5: {
      0: 0,
      1: "water_skiing",
      2: "kayaking",
      4: "rafting",
      8: "windsurfing",
      16: "kitesurfing",
      32: "tactical",
      64: "jumpmaster",
      128: "boxing"
    },
    sport_bits_6: {
      0: 0,
      1: "floor_climbing"
    },
    sub_sport: {
      0: "generic",
      1: "treadmill",
      2: "street",
      3: "trail",
      4: "track",
      5: "spin",
      6: "indoor_cycling",
      7: "road",
      8: "mountain",
      9: "downhill",
      10: "recumbent",
      11: "cyclocross",
      12: "hand_cycling",
      13: "track_cycling",
      14: "indoor_rowing",
      15: "elliptical",
      16: "stair_climbing",
      17: "lap_swimming",
      18: "open_water",
      19: "flexibility_training",
      20: "strength_training",
      21: "warm_up",
      22: "match",
      23: "exercise",
      24: "challenge",
      25: "indoor_skiing",
      26: "cardio_training",
      27: "indoor_walking",
      28: "e_bike_fitness",
      29: "bmx",
      30: "casual_walking",
      31: "speed_walking",
      32: "bike_to_run_transition",
      33: "run_to_bike_transition",
      34: "swim_to_bike_transition",
      35: "atv",
      36: "motocross",
      37: "backcountry",
      38: "resort",
      39: "rc_drone",
      40: "wingsuit",
      41: "whitewater",
      42: "skate_skiing",
      43: "yoga",
      44: "pilates",
      45: "indoor_running",
      46: "gravel_cycling",
      47: "e_bike_mountain",
      48: "commuting",
      49: "mixed_surface",
      50: "navigate",
      51: "track_me",
      52: "map",
      53: "single_gas_diving",
      54: "multi_gas_diving",
      55: "gauge_diving",
      56: "apnea_diving",
      57: "apnea_hunting",
      58: "virtual_activity",
      59: "obstacle",
      254: "all"
    },
    sport_event: {
      0: "uncategorized",
      1: "geocaching",
      2: "fitness",
      3: "recreation",
      4: "race",
      5: "special_event",
      6: "training",
      7: "transportation",
      8: "touring"
    },
    activity: {
      0: "manual",
      1: "auto_multi_sport"
    },
    intensity: {
      0: "active",
      1: "rest",
      2: "warmup",
      3: "cooldown",
      4: "recovery",
      5: "interval",
      6: "other"
    },
    session_trigger: {
      0: "activity_end",
      1: "manual",
      2: "auto_multi_sport",
      3: "fitness_equipment"
    },
    autolap_trigger: {
      0: "time",
      1: "distance",
      2: "position_start",
      3: "position_lap",
      4: "position_waypoint",
      5: "position_marked",
      6: "off"
    },
    lap_trigger: {
      0: "manual",
      1: "time",
      2: "distance",
      3: "position_start",
      4: "position_lap",
      5: "position_waypoint",
      6: "position_marked",
      7: "session_end",
      8: "fitness_equipment"
    },
    time_mode: {
      0: "hour12",
      1: "hour24",
      2: "military",
      3: "hour_12_with_seconds",
      4: "hour_24_with_seconds",
      5: "utc"
    },
    backlight_mode: {
      0: "off",
      1: "manual",
      2: "key_and_messages",
      3: "auto_brightness",
      4: "smart_notifications",
      5: "key_and_messages_night",
      6: "key_and_messages_and_smart_notifications"
    },
    date_mode: {
      0: "day_month",
      1: "month_day"
    },
    backlight_timeout: {
      0: "infinite"
    },
    event: {
      0: "timer",
      3: "workout",
      4: "workout_step",
      5: "power_down",
      6: "power_up",
      7: "off_course",
      8: "session",
      9: "lap",
      10: "course_point",
      11: "battery",
      12: "virtual_partner_pace",
      13: "hr_high_alert",
      14: "hr_low_alert",
      15: "speed_high_alert",
      16: "speed_low_alert",
      17: "cad_high_alert",
      18: "cad_low_alert",
      19: "power_high_alert",
      20: "power_low_alert",
      21: "recovery_hr",
      22: "battery_low",
      23: "time_duration_alert",
      24: "distance_duration_alert",
      25: "calorie_duration_alert",
      26: "activity",
      27: "fitness_equipment",
      28: "length",
      32: "user_marker",
      33: "sport_point",
      36: "calibration",
      42: "front_gear_change",
      43: "rear_gear_change",
      44: "rider_position_change",
      45: "elev_high_alert",
      46: "elev_low_alert",
      47: "comm_timeout"
    },
    event_type: {
      0: "start",
      1: "stop",
      2: "consecutive_depreciated",
      3: "marker",
      4: "stop_all",
      5: "begin_depreciated",
      6: "end_depreciated",
      7: "end_all_depreciated",
      8: "stop_disable",
      9: "stop_disable_all"
    },
    timer_trigger: {
      0: "manual",
      1: "auto",
      2: "fitness_equipment"
    },
    fitness_equipment_state: {
      0: "ready",
      1: "in_use",
      2: "paused",
      3: "unknown"
    },
    tone: {
      0: "off",
      1: "tone",
      2: "vibrate",
      3: "tone_and_vibrate"
    },
    autoscroll: {
      0: "none",
      1: "slow",
      2: "medium",
      3: "fast"
    },
    activity_class: {
      0: 0,
      100: "level_max",
      127: "level",
      128: "athlete"
    },
    hr_zone_calc: {
      0: "custom",
      1: "percent_max_hr",
      2: "percent_hrr"
    },
    pwr_zone_calc: {
      0: "custom",
      1: "percent_ftp"
    },
    wkt_step_duration: {
      0: "time",
      1: "distance",
      2: "hr_less_than",
      3: "hr_greater_than",
      4: "calories",
      5: "open",
      6: "repeat_until_steps_cmplt",
      7: "repeat_until_time",
      8: "repeat_until_distance",
      9: "repeat_until_calories",
      10: "repeat_until_hr_less_than",
      11: "repeat_until_hr_greater_than",
      12: "repeat_until_power_less_than",
      13: "repeat_until_power_greater_than",
      14: "power_less_than",
      15: "power_greater_than",
      16: "training_peaks_tss",
      17: "repeat_until_power_last_lap_less_than",
      18: "repeat_until_max_power_last_lap_less_than",
      19: "power_3s_less_than",
      20: "power_10s_less_than",
      21: "power_30s_less_than",
      22: "power_3s_greater_than",
      23: "power_10s_greater_than",
      24: "power_30s_greater_than",
      25: "power_lap_less_than",
      26: "power_lap_greater_than",
      27: "repeat_until_training_peaks_tss",
      28: "repetition_time",
      29: "reps"
    },
    wkt_step_target: {
      0: "speed",
      1: "heart_rate",
      2: "open",
      3: "cadence",
      4: "power",
      5: "grade",
      6: "resistance",
      7: "power_3s",
      8: "power_10s",
      9: "power_30s",
      10: "power_lap",
      11: "swim_stroke",
      12: "speed_lap",
      13: "heart_rate_lap"
    },
    goal: {
      0: "time",
      1: "distance",
      2: "calories",
      3: "frequency",
      4: "steps",
      5: "ascent",
      6: "active_minutes"
    },
    goal_recurrence: {
      0: "off",
      1: "daily",
      2: "weekly",
      3: "monthly",
      4: "yearly",
      5: "custom"
    },
    goal_source: {
      0: "auto",
      1: "community",
      2: "user"
    },
    schedule: {
      0: "workout",
      1: "course"
    },
    course_point: {
      0: "generic",
      1: "summit",
      2: "valley",
      3: "water",
      4: "food",
      5: "danger",
      6: "left",
      7: "right",
      8: "straight",
      9: "first_aid",
      10: "fourth_category",
      11: "third_category",
      12: "second_category",
      13: "first_category",
      14: "hors_category",
      15: "sprint",
      16: "left_fork",
      17: "right_fork",
      18: "middle_fork",
      19: "slight_left",
      20: "sharp_left",
      21: "slight_right",
      22: "sharp_right",
      23: "u_turn",
      24: "segment_start",
      25: "segment_end"
    },
    manufacturer: {
      0: 0,
      1: "garmin",
      2: "garmin_fr405_antfs",
      3: "zephyr",
      4: "dayton",
      5: "idt",
      6: "srm",
      7: "quarq",
      8: "ibike",
      9: "saris",
      10: "spark_hk",
      11: "tanita",
      12: "echowell",
      13: "dynastream_oem",
      14: "nautilus",
      15: "dynastream",
      16: "timex",
      17: "metrigear",
      18: "xelic",
      19: "beurer",
      20: "cardiosport",
      21: "a_and_d",
      22: "hmm",
      23: "suunto",
      24: "thita_elektronik",
      25: "gpulse",
      26: "clean_mobile",
      27: "pedal_brain",
      28: "peaksware",
      29: "saxonar",
      30: "lemond_fitness",
      31: "dexcom",
      32: "wahoo_fitness",
      33: "octane_fitness",
      34: "archinoetics",
      35: "the_hurt_box",
      36: "citizen_systems",
      37: "magellan",
      38: "osynce",
      39: "holux",
      40: "concept2",
      42: "one_giant_leap",
      43: "ace_sensor",
      44: "brim_brothers",
      45: "xplova",
      46: "perception_digital",
      47: "bf1systems",
      48: "pioneer",
      49: "spantec",
      50: "metalogics",
      51: "4iiiis",
      52: "seiko_epson",
      53: "seiko_epson_oem",
      54: "ifor_powell",
      55: "maxwell_guider",
      56: "star_trac",
      57: "breakaway",
      58: "alatech_technology_ltd",
      59: "mio_technology_europe",
      60: "rotor",
      61: "geonaute",
      62: "id_bike",
      63: "specialized",
      64: "wtek",
      65: "physical_enterprises",
      66: "north_pole_engineering",
      67: "bkool",
      68: "cateye",
      69: "stages_cycling",
      70: "sigmasport",
      71: "tomtom",
      72: "peripedal",
      73: "wattbike",
      76: "moxy",
      77: "ciclosport",
      78: "powerbahn",
      79: "acorn_projects_aps",
      80: "lifebeam",
      81: "bontrager",
      82: "wellgo",
      83: "scosche",
      84: "magura",
      85: "woodway",
      86: "elite",
      87: "nielsen_kellerman",
      88: "dk_city",
      89: "tacx",
      90: "direction_technology",
      91: "magtonic",
      92: "1partcarbon",
      93: "inside_ride_technologies",
      94: "sound_of_motion",
      95: "stryd",
      96: "icg",
      97: "mipulse",
      98: "bsx_athletics",
      99: "look",
      100: "campagnolo_srl",
      101: "body_bike_smart",
      102: "praxisworks",
      103: "limits_technology",
      104: "topaction_technology",
      105: "cosinuss",
      106: "fitcare",
      107: "magene",
      108: "giant_manufacturing_co",
      109: "tigrasport",
      110: "salutron",
      111: "technogym",
      112: "bryton_sensors",
      113: "latitude_limited",
      114: "soaring_technology",
      115: "igpsport",
      116: "thinkrider",
      117: "gopher_sport",
      118: "waterrower",
      119: "orangetheory",
      120: "inpeak",
      121: "kinetic",
      122: "johnson_health_tech",
      123: "polar_electro",
      124: "seesense",
      125: "nci_technology",
      255: "development",
      257: "healthandlife",
      258: "lezyne",
      259: "scribe_labs",
      260: "zwift",
      261: "watteam",
      262: "recon",
      263: "favero_electronics",
      264: "dynovelo",
      265: "strava",
      266: "precor",
      267: "bryton",
      268: "sram",
      269: "navman",
      270: "cobi",
      271: "spivi",
      272: "mio_magellan",
      273: "evesports",
      274: "sensitivus_gauge",
      275: "podoon",
      276: "life_time_fitness",
      277: "falco_e_motors",
      278: "minoura",
      279: "cycliq",
      280: "luxottica",
      281: "trainer_road",
      282: "the_sufferfest",
      283: "fullspeedahead",
      284: "virtualtraining",
      285: "feedbacksports",
      286: "omata",
      287: "vdo",
      288: "magneticdays",
      289: "hammerhead",
      290: "kinetic_by_kurt",
      291: "shapelog",
      292: "dabuziduo",
      293: "jetblack",
      294: "coros",
      295: "virtugo",
      296: "velosense",
      5759: "actigraphcorp"
    },
    garmin_product: {
      0: "hrm_bike",
      1: "hrm1",
      2: "axh01",
      3: "axb01",
      4: "axb02",
      5: "hrm2ss",
      6: "dsi_alf02",
      7: "hrm3ss",
      8: "hrm_run_single_byte_product_id",
      9: "bsm",
      10: "bcm",
      11: "axs01",
      12: "hrm_tri_single_byte_product_id",
      14: "fr225_single_byte_product_id",
      473: "fr301_china",
      474: "fr301_japan",
      475: "fr301_korea",
      494: "fr301_taiwan",
      717: "fr405",
      782: "fr50",
      987: "fr405_japan",
      988: "fr60",
      1011: "dsi_alf01",
      1018: "fr310xt",
      1036: "edge500",
      1124: "fr110",
      1169: "edge800",
      1199: "edge500_taiwan",
      1213: "edge500_japan",
      1253: "chirp",
      1274: "fr110_japan",
      1325: "edge200",
      1328: "fr910xt",
      1333: "edge800_taiwan",
      1334: "edge800_japan",
      1341: "alf04",
      1345: "fr610",
      1360: "fr210_japan",
      1380: "vector_ss",
      1381: "vector_cp",
      1386: "edge800_china",
      1387: "edge500_china",
      1410: "fr610_japan",
      1422: "edge500_korea",
      1436: "fr70",
      1446: "fr310xt_4t",
      1461: "amx",
      1482: "fr10",
      1497: "edge800_korea",
      1499: "swim",
      1537: "fr910xt_china",
      1551: "fenix",
      1555: "edge200_taiwan",
      1561: "edge510",
      1567: "edge810",
      1570: "tempe",
      1600: "fr910xt_japan",
      1623: "fr620",
      1632: "fr220",
      1664: "fr910xt_korea",
      1688: "fr10_japan",
      1721: "edge810_japan",
      1735: "virb_elite",
      1736: "edge_touring",
      1742: "edge510_japan",
      1743: "hrm_tri",
      1752: "hrm_run",
      1765: "fr920xt",
      1821: "edge510_asia",
      1822: "edge810_china",
      1823: "edge810_taiwan",
      1836: "edge1000",
      1837: "vivo_fit",
      1853: "virb_remote",
      1885: "vivo_ki",
      1903: "fr15",
      1907: "vivo_active",
      1918: "edge510_korea",
      1928: "fr620_japan",
      1929: "fr620_china",
      1930: "fr220_japan",
      1931: "fr220_china",
      1936: "approach_s6",
      1956: "vivo_smart",
      1967: "fenix2",
      1988: "epix",
      2050: "fenix3",
      2052: "edge1000_taiwan",
      2053: "edge1000_japan",
      2061: "fr15_japan",
      2067: "edge520",
      2070: "edge1000_china",
      2072: "fr620_russia",
      2073: "fr220_russia",
      2079: "vector_s",
      2100: "edge1000_korea",
      2130: "fr920xt_taiwan",
      2131: "fr920xt_china",
      2132: "fr920xt_japan",
      2134: "virbx",
      2135: "vivo_smart_apac",
      2140: "etrex_touch",
      2147: "edge25",
      2148: "fr25",
      2150: "vivo_fit2",
      2153: "fr225",
      2156: "fr630",
      2157: "fr230",
      2158: "fr735xt",
      2160: "vivo_active_apac",
      2161: "vector_2",
      2162: "vector_2s",
      2172: "virbxe",
      2173: "fr620_taiwan",
      2174: "fr220_taiwan",
      2175: "truswing",
      2188: "fenix3_china",
      2189: "fenix3_twn",
      2192: "varia_headlight",
      2193: "varia_taillight_old",
      2204: "edge_explore_1000",
      2219: "fr225_asia",
      2225: "varia_radar_taillight",
      2226: "varia_radar_display",
      2238: "edge20",
      2262: "d2_bravo",
      2266: "approach_s20",
      2276: "varia_remote",
      2327: "hrm4_run",
      2337: "vivo_active_hr",
      2348: "vivo_smart_hr",
      2368: "vivo_move",
      2398: "varia_vision",
      2406: "vivo_fit3",
      2413: "fenix3_hr",
      2417: "virb_ultra_30",
      2429: "index_smart_scale",
      2431: "fr235",
      2432: "fenix3_chronos",
      2441: "oregon7xx",
      2444: "rino7xx",
      2496: "nautix",
      2530: "edge_820",
      2531: "edge_explore_820",
      2544: "fenix5s",
      2547: "d2_bravo_titanium",
      2567: "varia_ut800",
      2593: "running_dynamics_pod",
      2604: "fenix5x",
      2606: "vivo_fit_jr",
      2691: "fr935",
      2697: "fenix5",
      2859: "descent",
      10007: "sdm4",
      10014: "edge_remote",
      20119: "training_center",
      65531: "connectiq_simulator",
      65532: "android_antplus_plugin",
      65534: "connect"
    },
    antplus_device_type: {
      1: "antfs",
      11: "bike_power",
      12: "environment_sensor_legacy",
      15: "multi_sport_speed_distance",
      16: "control",
      17: "fitness_equipment",
      18: "blood_pressure",
      19: "geocache_node",
      20: "light_electric_vehicle",
      25: "env_sensor",
      26: "racquet",
      27: "control_hub",
      31: "muscle_oxygen",
      34: "shifting",
      35: "bike_light_main",
      36: "bike_light_shared",
      38: "exd",
      40: "bike_radar",
      46: "bike_aero",
      119: "weight_scale",
      120: "heart_rate",
      121: "bike_speed_cadence",
      122: "bike_cadence",
      123: "bike_speed",
      124: "stride_speed_distance"
    },
    local_device_type: {
      0: "gps",
      1: "glonass",
      2: "gps_glonass",
      3: "accelerometer",
      4: "barometer",
      5: "temperature",
      10: "whr",
      12: "sensor_hub"
    },
    ble_device_type: {
      0: "connected_gps",
      1: "heart_rate",
      2: "bike_power",
      3: "bike_speed_cadence",
      4: "bike_speed",
      5: "bike_cadence",
      6: "footpod",
      7: "bike_trainer"
    },
    ant_network: {
      0: "public",
      1: "antplus",
      2: "antfs",
      3: "private"
    },
    workout_capabilities: {
      0: 0,
      1: "interval",
      2: "custom",
      4: "fitness_equipment",
      8: "firstbeat",
      16: "new_leaf",
      32: "tcx",
      128: "speed",
      256: "heart_rate",
      512: "distance",
      1024: "cadence",
      2048: "power",
      4096: "grade",
      8192: "resistance",
      16384: "protected"
    },
    battery_status: {
      0: 0,
      1: "new",
      2: "good",
      3: "ok",
      4: "low",
      5: "critical",
      6: "charging",
      7: "unknown"
    },
    hr_type: {
      0: "normal",
      1: "irregular"
    },
    course_capabilities: {
      0: 0,
      1: "processed",
      2: "valid",
      4: "time",
      8: "distance",
      16: "position",
      32: "heart_rate",
      64: "power",
      128: "cadence",
      256: "training",
      512: "navigation",
      1024: "bikeway"
    },
    weight: {
      0: 0,
      65534: "calculating"
    },
    workout_hr: {
      0: 0,
      100: "bpm_offset"
    },
    workout_power: {
      0: 0,
      1e3: "watts_offset"
    },
    bp_status: {
      0: "no_error",
      1: "error_incomplete_data",
      2: "error_no_measurement",
      3: "error_data_out_of_range",
      4: "error_irregular_heart_rate"
    },
    user_local_id: {
      0: "local_min",
      15: "local_max",
      16: "stationary_min",
      255: "stationary_max",
      256: "portable_min",
      65534: "portable_max"
    },
    swim_stroke: {
      0: "freestyle",
      1: "backstroke",
      2: "breaststroke",
      3: "butterfly",
      4: "drill",
      5: "mixed",
      6: "im"
    },
    activity_type: {
      0: "generic",
      1: "running",
      2: "cycling",
      3: "transition",
      4: "fitness_equipment",
      5: "swimming",
      6: "walking",
      8: "sedentary",
      254: "all"
    },
    activity_subtype: {
      0: "generic",
      1: "treadmill",
      2: "street",
      3: "trail",
      4: "track",
      5: "spin",
      6: "indoor_cycling",
      7: "road",
      8: "mountain",
      9: "downhill",
      10: "recumbent",
      11: "cyclocross",
      12: "hand_cycling",
      13: "track_cycling",
      14: "indoor_rowing",
      15: "elliptical",
      16: "stair_climbing",
      17: "lap_swimming",
      18: "open_water",
      254: "all"
    },
    activity_level: {
      0: "low",
      1: "medium",
      2: "high"
    },
    side: {
      0: "right",
      1: "left"
    },
    left_right_balance: {
      0: 0,
      127: "mask",
      128: "right"
    },
    left_right_balance_100: {
      0: 0,
      16383: "mask",
      32768: "right"
    },
    length_type: {
      0: "idle",
      1: "active"
    },
    day_of_week: {
      0: "sunday",
      1: "monday",
      2: "tuesday",
      3: "wednesday",
      4: "thursday",
      5: "friday",
      6: "saturday"
    },
    connectivity_capabilities: {
      0: 0,
      1: "bluetooth",
      2: "bluetooth_le",
      4: "ant",
      8: "activity_upload",
      16: "course_download",
      32: "workout_download",
      64: "live_track",
      128: "weather_conditions",
      256: "weather_alerts",
      512: "gps_ephemeris_download",
      1024: "explicit_archive",
      2048: "setup_incomplete",
      4096: "continue_sync_after_software_update",
      8192: "connect_iq_app_download",
      16384: "golf_course_download",
      32768: "device_initiates_sync",
      65536: "connect_iq_watch_app_download",
      131072: "connect_iq_widget_download",
      262144: "connect_iq_watch_face_download",
      524288: "connect_iq_data_field_download",
      1048576: "connect_iq_app_managment",
      2097152: "swing_sensor",
      4194304: "swing_sensor_remote",
      8388608: "incident_detection",
      16777216: "audio_prompts",
      33554432: "wifi_verification",
      67108864: "true_up",
      134217728: "find_my_watch",
      268435456: "remote_manual_sync",
      536870912: "live_track_auto_start",
      1073741824: "live_track_messaging",
      2147483648: "instant_input"
    },
    weather_report: {
      0: "current",
      1: "hourly_forecast",
      2: "daily_forecast"
    },
    weather_status: {
      0: "clear",
      1: "partly_cloudy",
      2: "mostly_cloudy",
      3: "rain",
      4: "snow",
      5: "windy",
      6: "thunderstorms",
      7: "wintry_mix",
      8: "fog",
      11: "hazy",
      12: "hail",
      13: "scattered_showers",
      14: "scattered_thunderstorms",
      15: "unknown_precipitation",
      16: "light_rain",
      17: "heavy_rain",
      18: "light_snow",
      19: "heavy_snow",
      20: "light_rain_snow",
      21: "heavy_rain_snow",
      22: "cloudy"
    },
    weather_severity: {
      0: "unknown",
      1: "warning",
      2: "watch",
      3: "advisory",
      4: "statement"
    },
    weather_severe_type: {
      0: "unspecified",
      1: "tornado",
      2: "tsunami",
      3: "hurricane",
      4: "extreme_wind",
      5: "typhoon",
      6: "inland_hurricane",
      7: "hurricane_force_wind",
      8: "waterspout",
      9: "severe_thunderstorm",
      10: "wreckhouse_winds",
      11: "les_suetes_wind",
      12: "avalanche",
      13: "flash_flood",
      14: "tropical_storm",
      15: "inland_tropical_storm",
      16: "blizzard",
      17: "ice_storm",
      18: "freezing_rain",
      19: "debris_flow",
      20: "flash_freeze",
      21: "dust_storm",
      22: "high_wind",
      23: "winter_storm",
      24: "heavy_freezing_spray",
      25: "extreme_cold",
      26: "wind_chill",
      27: "cold_wave",
      28: "heavy_snow_alert",
      29: "lake_effect_blowing_snow",
      30: "snow_squall",
      31: "lake_effect_snow",
      32: "winter_weather",
      33: "sleet",
      34: "snowfall",
      35: "snow_and_blowing_snow",
      36: "blowing_snow",
      37: "snow_alert",
      38: "arctic_outflow",
      39: "freezing_drizzle",
      40: "storm",
      41: "storm_surge",
      42: "rainfall",
      43: "areal_flood",
      44: "coastal_flood",
      45: "lakeshore_flood",
      46: "excessive_heat",
      47: "heat",
      48: "weather",
      49: "high_heat_and_humidity",
      50: "humidex_and_health",
      51: "humidex",
      52: "gale",
      53: "freezing_spray",
      54: "special_marine",
      55: "squall",
      56: "strong_wind",
      57: "lake_wind",
      58: "marine_weather",
      59: "wind",
      60: "small_craft_hazardous_seas",
      61: "hazardous_seas",
      62: "small_craft",
      63: "small_craft_winds",
      64: "small_craft_rough_bar",
      65: "high_water_level",
      66: "ashfall",
      67: "freezing_fog",
      68: "dense_fog",
      69: "dense_smoke",
      70: "blowing_dust",
      71: "hard_freeze",
      72: "freeze",
      73: "frost",
      74: "fire_weather",
      75: "flood",
      76: "rip_tide",
      77: "high_surf",
      78: "smog",
      79: "air_quality",
      80: "brisk_wind",
      81: "air_stagnation",
      82: "low_water",
      83: "hydrological",
      84: "special_weather"
    },
    stroke_type: {
      0: "no_event",
      1: "other",
      2: "serve",
      3: "forehand",
      4: "backhand",
      5: "smash"
    },
    body_location: {
      0: "left_leg",
      1: "left_calf",
      2: "left_shin",
      3: "left_hamstring",
      4: "left_quad",
      5: "left_glute",
      6: "right_leg",
      7: "right_calf",
      8: "right_shin",
      9: "right_hamstring",
      10: "right_quad",
      11: "right_glute",
      12: "torso_back",
      13: "left_lower_back",
      14: "left_upper_back",
      15: "right_lower_back",
      16: "right_upper_back",
      17: "torso_front",
      18: "left_abdomen",
      19: "left_chest",
      20: "right_abdomen",
      21: "right_chest",
      22: "left_arm",
      23: "left_shoulder",
      24: "left_bicep",
      25: "left_tricep",
      26: "left_brachioradialis",
      27: "left_forearm_extensors",
      28: "right_arm",
      29: "right_shoulder",
      30: "right_bicep",
      31: "right_tricep",
      32: "right_brachioradialis",
      33: "right_forearm_extensors",
      34: "neck",
      35: "throat",
      36: "waist_mid_back",
      37: "waist_front",
      38: "waist_left",
      39: "waist_right"
    },
    segment_lap_status: {
      0: "end",
      1: "fail"
    },
    segment_leaderboard_type: {
      0: "overall",
      1: "personal_best",
      2: "connections",
      3: "group",
      4: "challenger",
      5: "kom",
      6: "qom",
      7: "pr",
      8: "goal",
      9: "rival",
      10: "club_leader"
    },
    segment_delete_status: {
      0: "do_not_delete",
      1: "delete_one",
      2: "delete_all"
    },
    segment_selection_type: {
      0: "starred",
      1: "suggested"
    },
    split_type: {
      1: "ascent_split",
      2: "descent_split",
      3: "interval_active",
      4: "interval_rest",
      5: "interval_warmup",
      6: "interval_cooldown",
      7: "interval_recovery",
      8: "interval_other",
      9: "climb_active",
      10: "climb_rest",
      11: "surf_active",
      12: "run_active",
      13: "run_rest",
      14: "workout_round",
      17: "rwd_run",
      18: "rwd_walk",
      21: "windsurf_active",
      22: "rwd_stand",
      23: "transition",
      28: "ski_lift_split",
      29: "ski_run_split"
    },
    source_type: {
      0: "ant",
      1: "antplus",
      2: "bluetooth",
      3: "bluetooth_low_energy",
      4: "wifi",
      5: "local"
    },
    display_orientation: {
      0: "auto",
      1: "portrait",
      2: "landscape",
      3: "portrait_flipped",
      4: "landscape_flipped"
    },
    workout_equipment: {
      0: "none",
      1: "swim_fins",
      2: "swim_kickboard",
      3: "swim_paddles",
      4: "swim_pull_buoy",
      5: "swim_snorkel"
    },
    watchface_mode: {
      0: "digital",
      1: "analog",
      2: "connect_iq",
      3: "disabled"
    },
    digital_watchface_layout: {
      0: "traditional",
      1: "modern",
      2: "bold"
    },
    analog_watchface_layout: {
      0: "minimal",
      1: "traditional",
      2: "modern"
    },
    rider_position_type: {
      0: "seated",
      1: "standing",
      2: "transition_to_seated",
      3: "transition_to_standing"
    },
    power_phase_type: {
      0: "power_phase_start_angle",
      1: "power_phase_end_angle",
      2: "power_phase_arc_length",
      3: "power_phase_center"
    },
    camera_event_type: {
      0: "video_start",
      1: "video_split",
      2: "video_end",
      3: "photo_taken",
      4: "video_second_stream_start",
      5: "video_second_stream_split",
      6: "video_second_stream_end",
      7: "video_split_start",
      8: "video_second_stream_split_start",
      11: "video_pause",
      12: "video_second_stream_pause",
      13: "video_resume",
      14: "video_second_stream_resume"
    },
    sensor_type: {
      0: "accelerometer",
      1: "gyroscope",
      2: "compass",
      3: "barometer"
    },
    bike_light_network_config_type: {
      0: "auto",
      4: "individual",
      5: "high_visibility",
      6: "trail"
    },
    comm_timeout_type: {
      0: "wildcard_pairing_timeout",
      1: "pairing_timeout",
      2: "connection_lost",
      3: "connection_timeout"
    },
    camera_orientation_type: {
      0: "camera_orientation_0",
      1: "camera_orientation_90",
      2: "camera_orientation_180",
      3: "camera_orientation_270"
    },
    attitude_stage: {
      0: "failed",
      1: "aligning",
      2: "degraded",
      3: "valid"
    },
    attitude_validity: {
      0: 0,
      1: "track_angle_heading_valid",
      2: "pitch_valid",
      4: "roll_valid",
      8: "lateral_body_accel_valid",
      16: "normal_body_accel_valid",
      32: "turn_rate_valid",
      64: "hw_fail",
      128: "mag_invalid",
      256: "no_gps",
      512: "gps_invalid",
      1024: "solution_coasting",
      2048: "true_track_angle",
      4096: "magnetic_heading"
    },
    auto_sync_frequency: {
      0: "never",
      1: "occasionally",
      2: "frequent",
      3: "once_a_day",
      4: "remote"
    },
    exd_layout: {
      0: "full_screen",
      1: "half_vertical",
      2: "half_horizontal",
      3: "half_vertical_right_split",
      4: "half_horizontal_bottom_split",
      5: "full_quarter_split",
      6: "half_vertical_left_split",
      7: "half_horizontal_top_split"
    },
    exd_display_type: {
      0: "numerical",
      1: "simple",
      2: "graph",
      3: "bar",
      4: "circle_graph",
      5: "virtual_partner",
      6: "balance",
      7: "string_list",
      8: "string",
      9: "simple_dynamic_icon",
      10: "gauge"
    },
    exd_data_units: {
      0: "no_units",
      1: "laps",
      2: "miles_per_hour",
      3: "kilometers_per_hour",
      4: "feet_per_hour",
      5: "meters_per_hour",
      6: "degrees_celsius",
      7: "degrees_farenheit",
      8: "zone",
      9: "gear",
      10: "rpm",
      11: "bpm",
      12: "degrees",
      13: "millimeters",
      14: "meters",
      15: "kilometers",
      16: "feet",
      17: "yards",
      18: "kilofeet",
      19: "miles",
      20: "time",
      21: "enum_turn_type",
      22: "percent",
      23: "watts",
      24: "watts_per_kilogram",
      25: "enum_battery_status",
      26: "enum_bike_light_beam_angle_mode",
      27: "enum_bike_light_battery_status",
      28: "enum_bike_light_network_config_type",
      29: "lights",
      30: "seconds",
      31: "minutes",
      32: "hours",
      33: "calories",
      34: "kilojoules",
      35: "milliseconds",
      36: "second_per_mile",
      37: "second_per_kilometer",
      38: "centimeter",
      39: "enum_course_point",
      40: "bradians",
      41: "enum_sport",
      42: "inches_hg",
      43: "mm_hg",
      44: "mbars",
      45: "hecto_pascals",
      46: "feet_per_min",
      47: "meters_per_min",
      48: "meters_per_sec",
      49: "eight_cardinal"
    },
    exd_qualifiers: {
      0: "no_qualifier",
      1: "instantaneous",
      2: "average",
      3: "lap",
      4: "maximum",
      5: "maximum_average",
      6: "maximum_lap",
      7: "last_lap",
      8: "average_lap",
      9: "to_destination",
      10: "to_go",
      11: "to_next",
      12: "next_course_point",
      13: "total",
      14: "three_second_average",
      15: "ten_second_average",
      16: "thirty_second_average",
      17: "percent_maximum",
      18: "percent_maximum_average",
      19: "lap_percent_maximum",
      20: "elapsed",
      21: "sunrise",
      22: "sunset",
      23: "compared_to_virtual_partner",
      24: "maximum_24h",
      25: "minimum_24h",
      26: "minimum",
      27: "first",
      28: "second",
      29: "third",
      30: "shifter",
      31: "last_sport",
      32: "moving",
      33: "stopped",
      34: "estimated_total",
      242: "zone_9",
      243: "zone_8",
      244: "zone_7",
      245: "zone_6",
      246: "zone_5",
      247: "zone_4",
      248: "zone_3",
      249: "zone_2",
      250: "zone_1"
    },
    exd_descriptors: {
      0: "bike_light_battery_status",
      1: "beam_angle_status",
      2: "batery_level",
      3: "light_network_mode",
      4: "number_lights_connected",
      5: "cadence",
      6: "distance",
      7: "estimated_time_of_arrival",
      8: "heading",
      9: "time",
      10: "battery_level",
      11: "trainer_resistance",
      12: "trainer_target_power",
      13: "time_seated",
      14: "time_standing",
      15: "elevation",
      16: "grade",
      17: "ascent",
      18: "descent",
      19: "vertical_speed",
      20: "di2_battery_level",
      21: "front_gear",
      22: "rear_gear",
      23: "gear_ratio",
      24: "heart_rate",
      25: "heart_rate_zone",
      26: "time_in_heart_rate_zone",
      27: "heart_rate_reserve",
      28: "calories",
      29: "gps_accuracy",
      30: "gps_signal_strength",
      31: "temperature",
      32: "time_of_day",
      33: "balance",
      34: "pedal_smoothness",
      35: "power",
      36: "functional_threshold_power",
      37: "intensity_factor",
      38: "work",
      39: "power_ratio",
      40: "normalized_power",
      41: "training_stress_Score",
      42: "time_on_zone",
      43: "speed",
      44: "laps",
      45: "reps",
      46: "workout_step",
      47: "course_distance",
      48: "navigation_distance",
      49: "course_estimated_time_of_arrival",
      50: "navigation_estimated_time_of_arrival",
      51: "course_time",
      52: "navigation_time",
      53: "course_heading",
      54: "navigation_heading",
      55: "power_zone",
      56: "torque_effectiveness",
      57: "timer_time",
      58: "power_weight_ratio",
      59: "left_platform_center_offset",
      60: "right_platform_center_offset",
      61: "left_power_phase_start_angle",
      62: "right_power_phase_start_angle",
      63: "left_power_phase_finish_angle",
      64: "right_power_phase_finish_angle",
      65: "gears",
      66: "pace",
      67: "training_effect",
      68: "vertical_oscillation",
      69: "vertical_ratio",
      70: "ground_contact_time",
      71: "left_ground_contact_time_balance",
      72: "right_ground_contact_time_balance",
      73: "stride_length",
      74: "running_cadence",
      75: "performance_condition",
      76: "course_type",
      77: "time_in_power_zone",
      78: "navigation_turn",
      79: "course_location",
      80: "navigation_location",
      81: "compass",
      82: "gear_combo",
      83: "muscle_oxygen",
      84: "icon",
      85: "compass_heading",
      86: "gps_heading",
      87: "gps_elevation",
      88: "anaerobic_training_effect",
      89: "course",
      90: "off_course",
      91: "glide_ratio",
      92: "vertical_distance",
      93: "vmg",
      94: "ambient_pressure",
      95: "pressure",
      96: "vam"
    },
    auto_activity_detect: {
      0: "none",
      1: "running",
      2: "cycling",
      4: "swimming",
      8: "walking",
      16: "elliptical",
      32: "sedentary"
    },
    supported_exd_screen_layouts: {
      0: 0,
      1: "full_screen",
      2: "half_vertical",
      4: "half_horizontal",
      8: "half_vertical_right_split",
      16: "half_horizontal_bottom_split",
      32: "full_quarter_split",
      64: "half_vertical_left_split",
      128: "half_horizontal_top_split"
    },
    fit_base_type: {
      0: "enum",
      1: "sint8",
      2: "uint8",
      7: "string",
      10: "uint8z",
      13: "byte",
      131: "sint16",
      132: "uint16",
      133: "sint32",
      134: "uint32",
      136: "float32",
      137: "float64",
      139: "uint16z",
      140: "uint32z",
      142: "sint64",
      143: "uint64",
      144: "uint64z"
    },
    turn_type: {
      0: "arriving_idx",
      1: "arriving_left_idx",
      2: "arriving_right_idx",
      3: "arriving_via_idx",
      4: "arriving_via_left_idx",
      5: "arriving_via_right_idx",
      6: "bear_keep_left_idx",
      7: "bear_keep_right_idx",
      8: "continue_idx",
      9: "exit_left_idx",
      10: "exit_right_idx",
      11: "ferry_idx",
      12: "roundabout_45_idx",
      13: "roundabout_90_idx",
      14: "roundabout_135_idx",
      15: "roundabout_180_idx",
      16: "roundabout_225_idx",
      17: "roundabout_270_idx",
      18: "roundabout_315_idx",
      19: "roundabout_360_idx",
      20: "roundabout_neg_45_idx",
      21: "roundabout_neg_90_idx",
      22: "roundabout_neg_135_idx",
      23: "roundabout_neg_180_idx",
      24: "roundabout_neg_225_idx",
      25: "roundabout_neg_270_idx",
      26: "roundabout_neg_315_idx",
      27: "roundabout_neg_360_idx",
      28: "roundabout_generic_idx",
      29: "roundabout_neg_generic_idx",
      30: "sharp_turn_left_idx",
      31: "sharp_turn_right_idx",
      32: "turn_left_idx",
      33: "turn_right_idx",
      34: "uturn_left_idx",
      35: "uturn_right_idx",
      36: "icon_inv_idx",
      37: "icon_idx_cnt"
    },
    bike_light_beam_angle_mode: {
      0: "manual",
      1: "auto"
    },
    fit_base_unit: {
      0: "other",
      1: "kilogram",
      2: "pound"
    },
    set_type: {
      0: "rest",
      1: "active"
    },
    exercise_category: {
      0: "bench_press",
      1: "calf_raise",
      2: "cardio",
      3: "carry",
      4: "chop",
      5: "core",
      6: "crunch",
      7: "curl",
      8: "deadlift",
      9: "flye",
      10: "hip_raise",
      11: "hip_stability",
      12: "hip_swing",
      13: "hyperextension",
      14: "lateral_raise",
      15: "leg_curl",
      16: "leg_raise",
      17: "lunge",
      18: "olympic_lift",
      19: "plank",
      20: "plyo",
      21: "pull_up",
      22: "push_up",
      23: "row",
      24: "shoulder_press",
      25: "shoulder_stability",
      26: "shrug",
      27: "sit_up",
      28: "squat",
      29: "total_body",
      30: "triceps_extension",
      31: "warm_up",
      32: "run",
      65534: "unknown"
    },
    bench_press_exercise_name: {
      0: "alternating_dumbbell_chest_press_on_swiss_ball",
      1: "barbell_bench_press",
      2: "barbell_board_bench_press",
      3: "barbell_floor_press",
      4: "close_grip_barbell_bench_press",
      5: "decline_dumbbell_bench_press",
      6: "dumbbell_bench_press",
      7: "dumbbell_floor_press",
      8: "incline_barbell_bench_press",
      9: "incline_dumbbell_bench_press",
      10: "incline_smith_machine_bench_press",
      11: "isometric_barbell_bench_press",
      12: "kettlebell_chest_press",
      13: "neutral_grip_dumbbell_bench_press",
      14: "neutral_grip_dumbbell_incline_bench_press",
      15: "one_arm_floor_press",
      16: "weighted_one_arm_floor_press",
      17: "partial_lockout",
      18: "reverse_grip_barbell_bench_press",
      19: "reverse_grip_incline_bench_press",
      20: "single_arm_cable_chest_press",
      21: "single_arm_dumbbell_bench_press",
      22: "smith_machine_bench_press",
      23: "swiss_ball_dumbbell_chest_press",
      24: "triple_stop_barbell_bench_press",
      25: "wide_grip_barbell_bench_press",
      26: "alternating_dumbbell_chest_press"
    },
    calf_raise_exercise_name: {
      0: "3_way_calf_raise",
      1: "3_way_weighted_calf_raise",
      2: "3_way_single_leg_calf_raise",
      3: "3_way_weighted_single_leg_calf_raise",
      4: "donkey_calf_raise",
      5: "weighted_donkey_calf_raise",
      6: "seated_calf_raise",
      7: "weighted_seated_calf_raise",
      8: "seated_dumbbell_toe_raise",
      9: "single_leg_bent_knee_calf_raise",
      10: "weighted_single_leg_bent_knee_calf_raise",
      11: "single_leg_decline_push_up",
      12: "single_leg_donkey_calf_raise",
      13: "weighted_single_leg_donkey_calf_raise",
      14: "single_leg_hip_raise_with_knee_hold",
      15: "single_leg_standing_calf_raise",
      16: "single_leg_standing_dumbbell_calf_raise",
      17: "standing_barbell_calf_raise",
      18: "standing_calf_raise",
      19: "weighted_standing_calf_raise",
      20: "standing_dumbbell_calf_raise"
    },
    cardio_exercise_name: {
      0: "bob_and_weave_circle",
      1: "weighted_bob_and_weave_circle",
      2: "cardio_core_crawl",
      3: "weighted_cardio_core_crawl",
      4: "double_under",
      5: "weighted_double_under",
      6: "jump_rope",
      7: "weighted_jump_rope",
      8: "jump_rope_crossover",
      9: "weighted_jump_rope_crossover",
      10: "jump_rope_jog",
      11: "weighted_jump_rope_jog",
      12: "jumping_jacks",
      13: "weighted_jumping_jacks",
      14: "ski_moguls",
      15: "weighted_ski_moguls",
      16: "split_jacks",
      17: "weighted_split_jacks",
      18: "squat_jacks",
      19: "weighted_squat_jacks",
      20: "triple_under",
      21: "weighted_triple_under"
    },
    carry_exercise_name: {
      0: "bar_holds",
      1: "farmers_walk",
      2: "farmers_walk_on_toes",
      3: "hex_dumbbell_hold",
      4: "overhead_carry"
    },
    chop_exercise_name: {
      0: "cable_pull_through",
      1: "cable_rotational_lift",
      2: "cable_woodchop",
      3: "cross_chop_to_knee",
      4: "weighted_cross_chop_to_knee",
      5: "dumbbell_chop",
      6: "half_kneeling_rotation",
      7: "weighted_half_kneeling_rotation",
      8: "half_kneeling_rotational_chop",
      9: "half_kneeling_rotational_reverse_chop",
      10: "half_kneeling_stability_chop",
      11: "half_kneeling_stability_reverse_chop",
      12: "kneeling_rotational_chop",
      13: "kneeling_rotational_reverse_chop",
      14: "kneeling_stability_chop",
      15: "kneeling_woodchopper",
      16: "medicine_ball_wood_chops",
      17: "power_squat_chops",
      18: "weighted_power_squat_chops",
      19: "standing_rotational_chop",
      20: "standing_split_rotational_chop",
      21: "standing_split_rotational_reverse_chop",
      22: "standing_stability_reverse_chop"
    },
    core_exercise_name: {
      0: "abs_jabs",
      1: "weighted_abs_jabs",
      2: "alternating_plate_reach",
      3: "barbell_rollout",
      4: "weighted_barbell_rollout",
      5: "body_bar_oblique_twist",
      6: "cable_core_press",
      7: "cable_side_bend",
      8: "side_bend",
      9: "weighted_side_bend",
      10: "crescent_circle",
      11: "weighted_crescent_circle",
      12: "cycling_russian_twist",
      13: "weighted_cycling_russian_twist",
      14: "elevated_feet_russian_twist",
      15: "weighted_elevated_feet_russian_twist",
      16: "half_turkish_get_up",
      17: "kettlebell_windmill",
      18: "kneeling_ab_wheel",
      19: "weighted_kneeling_ab_wheel",
      20: "modified_front_lever",
      21: "open_knee_tucks",
      22: "weighted_open_knee_tucks",
      23: "side_abs_leg_lift",
      24: "weighted_side_abs_leg_lift",
      25: "swiss_ball_jackknife",
      26: "weighted_swiss_ball_jackknife",
      27: "swiss_ball_pike",
      28: "weighted_swiss_ball_pike",
      29: "swiss_ball_rollout",
      30: "weighted_swiss_ball_rollout",
      31: "triangle_hip_press",
      32: "weighted_triangle_hip_press",
      33: "trx_suspended_jackknife",
      34: "weighted_trx_suspended_jackknife",
      35: "u_boat",
      36: "weighted_u_boat",
      37: "windmill_switches",
      38: "weighted_windmill_switches",
      39: "alternating_slide_out",
      40: "weighted_alternating_slide_out",
      41: "ghd_back_extensions",
      42: "weighted_ghd_back_extensions",
      43: "overhead_walk",
      44: "inchworm",
      45: "weighted_modified_front_lever",
      46: "russian_twist",
      47: "abdominal_leg_rotations",
      48: "arm_and_leg_extension_on_knees",
      49: "bicycle",
      50: "bicep_curl_with_leg_extension",
      51: "cat_cow",
      52: "corkscrew",
      53: "criss_cross",
      54: "criss_cross_with_ball",
      55: "double_leg_stretch",
      56: "knee_folds",
      57: "lower_lift",
      58: "neck_pull",
      59: "pelvic_clocks",
      60: "roll_over",
      61: "roll_up",
      62: "rolling",
      63: "rowing_1",
      64: "rowing_2",
      65: "scissors",
      66: "single_leg_circles",
      67: "single_leg_stretch",
      68: "snake_twist_1_and_2",
      69: "swan",
      70: "swimming",
      71: "teaser",
      72: "the_hundred"
    },
    crunch_exercise_name: {
      0: "bicycle_crunch",
      1: "cable_crunch",
      2: "circular_arm_crunch",
      3: "crossed_arms_crunch",
      4: "weighted_crossed_arms_crunch",
      5: "cross_leg_reverse_crunch",
      6: "weighted_cross_leg_reverse_crunch",
      7: "crunch_chop",
      8: "weighted_crunch_chop",
      9: "double_crunch",
      10: "weighted_double_crunch",
      11: "elbow_to_knee_crunch",
      12: "weighted_elbow_to_knee_crunch",
      13: "flutter_kicks",
      14: "weighted_flutter_kicks",
      15: "foam_roller_reverse_crunch_on_bench",
      16: "weighted_foam_roller_reverse_crunch_on_bench",
      17: "foam_roller_reverse_crunch_with_dumbbell",
      18: "foam_roller_reverse_crunch_with_medicine_ball",
      19: "frog_press",
      20: "hanging_knee_raise_oblique_crunch",
      21: "weighted_hanging_knee_raise_oblique_crunch",
      22: "hip_crossover",
      23: "weighted_hip_crossover",
      24: "hollow_rock",
      25: "weighted_hollow_rock",
      26: "incline_reverse_crunch",
      27: "weighted_incline_reverse_crunch",
      28: "kneeling_cable_crunch",
      29: "kneeling_cross_crunch",
      30: "weighted_kneeling_cross_crunch",
      31: "kneeling_oblique_cable_crunch",
      32: "knees_to_elbow",
      33: "leg_extensions",
      34: "weighted_leg_extensions",
      35: "leg_levers",
      36: "mcgill_curl_up",
      37: "weighted_mcgill_curl_up",
      38: "modified_pilates_roll_up_with_ball",
      39: "weighted_modified_pilates_roll_up_with_ball",
      40: "pilates_crunch",
      41: "weighted_pilates_crunch",
      42: "pilates_roll_up_with_ball",
      43: "weighted_pilates_roll_up_with_ball",
      44: "raised_legs_crunch",
      45: "weighted_raised_legs_crunch",
      46: "reverse_crunch",
      47: "weighted_reverse_crunch",
      48: "reverse_crunch_on_a_bench",
      49: "weighted_reverse_crunch_on_a_bench",
      50: "reverse_curl_and_lift",
      51: "weighted_reverse_curl_and_lift",
      52: "rotational_lift",
      53: "weighted_rotational_lift",
      54: "seated_alternating_reverse_crunch",
      55: "weighted_seated_alternating_reverse_crunch",
      56: "seated_leg_u",
      57: "weighted_seated_leg_u",
      58: "side_to_side_crunch_and_weave",
      59: "weighted_side_to_side_crunch_and_weave",
      60: "single_leg_reverse_crunch",
      61: "weighted_single_leg_reverse_crunch",
      62: "skater_crunch_cross",
      63: "weighted_skater_crunch_cross",
      64: "standing_cable_crunch",
      65: "standing_side_crunch",
      66: "step_climb",
      67: "weighted_step_climb",
      68: "swiss_ball_crunch",
      69: "swiss_ball_reverse_crunch",
      70: "weighted_swiss_ball_reverse_crunch",
      71: "swiss_ball_russian_twist",
      72: "weighted_swiss_ball_russian_twist",
      73: "swiss_ball_side_crunch",
      74: "weighted_swiss_ball_side_crunch",
      75: "thoracic_crunches_on_foam_roller",
      76: "weighted_thoracic_crunches_on_foam_roller",
      77: "triceps_crunch",
      78: "weighted_bicycle_crunch",
      79: "weighted_crunch",
      80: "weighted_swiss_ball_crunch",
      81: "toes_to_bar",
      82: "weighted_toes_to_bar",
      83: "crunch",
      84: "straight_leg_crunch_with_ball"
    },
    curl_exercise_name: {
      0: "alternating_dumbbell_biceps_curl",
      1: "alternating_dumbbell_biceps_curl_on_swiss_ball",
      2: "alternating_incline_dumbbell_biceps_curl",
      3: "barbell_biceps_curl",
      4: "barbell_reverse_wrist_curl",
      5: "barbell_wrist_curl",
      6: "behind_the_back_barbell_reverse_wrist_curl",
      7: "behind_the_back_one_arm_cable_curl",
      8: "cable_biceps_curl",
      9: "cable_hammer_curl",
      10: "cheating_barbell_biceps_curl",
      11: "close_grip_ez_bar_biceps_curl",
      12: "cross_body_dumbbell_hammer_curl",
      13: "dead_hang_biceps_curl",
      14: "decline_hammer_curl",
      15: "dumbbell_biceps_curl_with_static_hold",
      16: "dumbbell_hammer_curl",
      17: "dumbbell_reverse_wrist_curl",
      18: "dumbbell_wrist_curl",
      19: "ez_bar_preacher_curl",
      20: "forward_bend_biceps_curl",
      21: "hammer_curl_to_press",
      22: "incline_dumbbell_biceps_curl",
      23: "incline_offset_thumb_dumbbell_curl",
      24: "kettlebell_biceps_curl",
      25: "lying_concentration_cable_curl",
      26: "one_arm_preacher_curl",
      27: "plate_pinch_curl",
      28: "preacher_curl_with_cable",
      29: "reverse_ez_bar_curl",
      30: "reverse_grip_wrist_curl",
      31: "reverse_grip_barbell_biceps_curl",
      32: "seated_alternating_dumbbell_biceps_curl",
      33: "seated_dumbbell_biceps_curl",
      34: "seated_reverse_dumbbell_curl",
      35: "split_stance_offset_pinky_dumbbell_curl",
      36: "standing_alternating_dumbbell_curls",
      37: "standing_dumbbell_biceps_curl",
      38: "standing_ez_bar_biceps_curl",
      39: "static_curl",
      40: "swiss_ball_dumbbell_overhead_triceps_extension",
      41: "swiss_ball_ez_bar_preacher_curl",
      42: "twisting_standing_dumbbell_biceps_curl",
      43: "wide_grip_ez_bar_biceps_curl"
    },
    deadlift_exercise_name: {
      0: "barbell_deadlift",
      1: "barbell_straight_leg_deadlift",
      2: "dumbbell_deadlift",
      3: "dumbbell_single_leg_deadlift_to_row",
      4: "dumbbell_straight_leg_deadlift",
      5: "kettlebell_floor_to_shelf",
      6: "one_arm_one_leg_deadlift",
      7: "rack_pull",
      8: "rotational_dumbbell_straight_leg_deadlift",
      9: "single_arm_deadlift",
      10: "single_leg_barbell_deadlift",
      11: "single_leg_barbell_straight_leg_deadlift",
      12: "single_leg_deadlift_with_barbell",
      13: "single_leg_rdl_circuit",
      14: "single_leg_romanian_deadlift_with_dumbbell",
      15: "sumo_deadlift",
      16: "sumo_deadlift_high_pull",
      17: "trap_bar_deadlift",
      18: "wide_grip_barbell_deadlift"
    },
    flye_exercise_name: {
      0: "cable_crossover",
      1: "decline_dumbbell_flye",
      2: "dumbbell_flye",
      3: "incline_dumbbell_flye",
      4: "kettlebell_flye",
      5: "kneeling_rear_flye",
      6: "single_arm_standing_cable_reverse_flye",
      7: "swiss_ball_dumbbell_flye",
      8: "arm_rotations",
      9: "hug_a_tree"
    },
    hip_raise_exercise_name: {
      0: "barbell_hip_thrust_on_floor",
      1: "barbell_hip_thrust_with_bench",
      2: "bent_knee_swiss_ball_reverse_hip_raise",
      3: "weighted_bent_knee_swiss_ball_reverse_hip_raise",
      4: "bridge_with_leg_extension",
      5: "weighted_bridge_with_leg_extension",
      6: "clam_bridge",
      7: "front_kick_tabletop",
      8: "weighted_front_kick_tabletop",
      9: "hip_extension_and_cross",
      10: "weighted_hip_extension_and_cross",
      11: "hip_raise",
      12: "weighted_hip_raise",
      13: "hip_raise_with_feet_on_swiss_ball",
      14: "weighted_hip_raise_with_feet_on_swiss_ball",
      15: "hip_raise_with_head_on_bosu_ball",
      16: "weighted_hip_raise_with_head_on_bosu_ball",
      17: "hip_raise_with_head_on_swiss_ball",
      18: "weighted_hip_raise_with_head_on_swiss_ball",
      19: "hip_raise_with_knee_squeeze",
      20: "weighted_hip_raise_with_knee_squeeze",
      21: "incline_rear_leg_extension",
      22: "weighted_incline_rear_leg_extension",
      23: "kettlebell_swing",
      24: "marching_hip_raise",
      25: "weighted_marching_hip_raise",
      26: "marching_hip_raise_with_feet_on_a_swiss_ball",
      27: "weighted_marching_hip_raise_with_feet_on_a_swiss_ball",
      28: "reverse_hip_raise",
      29: "weighted_reverse_hip_raise",
      30: "single_leg_hip_raise",
      31: "weighted_single_leg_hip_raise",
      32: "single_leg_hip_raise_with_foot_on_bench",
      33: "weighted_single_leg_hip_raise_with_foot_on_bench",
      34: "single_leg_hip_raise_with_foot_on_bosu_ball",
      35: "weighted_single_leg_hip_raise_with_foot_on_bosu_ball",
      36: "single_leg_hip_raise_with_foot_on_foam_roller",
      37: "weighted_single_leg_hip_raise_with_foot_on_foam_roller",
      38: "single_leg_hip_raise_with_foot_on_medicine_ball",
      39: "weighted_single_leg_hip_raise_with_foot_on_medicine_ball",
      40: "single_leg_hip_raise_with_head_on_bosu_ball",
      41: "weighted_single_leg_hip_raise_with_head_on_bosu_ball",
      42: "weighted_clam_bridge",
      43: "single_leg_swiss_ball_hip_raise_and_leg_curl",
      44: "clams",
      45: "inner_thigh_circles",
      46: "inner_thigh_side_lift",
      47: "leg_circles",
      48: "leg_lift",
      49: "leg_lift_in_external_rotation"
    },
    hip_stability_exercise_name: {
      0: "band_side_lying_leg_raise",
      1: "dead_bug",
      2: "weighted_dead_bug",
      3: "external_hip_raise",
      4: "weighted_external_hip_raise",
      5: "fire_hydrant_kicks",
      6: "weighted_fire_hydrant_kicks",
      7: "hip_circles",
      8: "weighted_hip_circles",
      9: "inner_thigh_lift",
      10: "weighted_inner_thigh_lift",
      11: "lateral_walks_with_band_at_ankles",
      12: "pretzel_side_kick",
      13: "weighted_pretzel_side_kick",
      14: "prone_hip_internal_rotation",
      15: "weighted_prone_hip_internal_rotation",
      16: "quadruped",
      17: "quadruped_hip_extension",
      18: "weighted_quadruped_hip_extension",
      19: "quadruped_with_leg_lift",
      20: "weighted_quadruped_with_leg_lift",
      21: "side_lying_leg_raise",
      22: "weighted_side_lying_leg_raise",
      23: "sliding_hip_adduction",
      24: "weighted_sliding_hip_adduction",
      25: "standing_adduction",
      26: "weighted_standing_adduction",
      27: "standing_cable_hip_abduction",
      28: "standing_hip_abduction",
      29: "weighted_standing_hip_abduction",
      30: "standing_rear_leg_raise",
      31: "weighted_standing_rear_leg_raise",
      32: "supine_hip_internal_rotation",
      33: "weighted_supine_hip_internal_rotation"
    },
    hip_swing_excercise_name: {
      0: "single_arm_kettlebell_swing",
      1: "single_arm_dumbbell_swing",
      2: "step_out_swing"
    },
    hyperextension_exercise_name: {
      0: "back_extension_with_opposite_arm_and_leg_reach",
      1: "weighted_back_extension_with_opposite_arm_and_leg_reach",
      2: "base_rotations",
      3: "weighted_base_rotations",
      4: "bent_knee_reverse_hyperextension",
      5: "weighted_bent_knee_reverse_hyperextension",
      6: "hollow_hold_and_roll",
      7: "weighted_hollow_hold_and_roll",
      8: "kicks",
      9: "weighted_kicks",
      10: "knee_raises",
      11: "weighted_knee_raises",
      12: "kneeling_superman",
      13: "weighted_kneeling_superman",
      14: "lat_pull_down_with_row",
      15: "medicine_ball_deadlift_to_reach",
      16: "one_arm_one_leg_row",
      17: "one_arm_row_with_band",
      18: "overhead_lunge_with_medicine_ball",
      19: "plank_knee_tucks",
      20: "weighted_plank_knee_tucks",
      21: "side_step",
      22: "weighted_side_step",
      23: "single_leg_back_extension",
      24: "weighted_single_leg_back_extension",
      25: "spine_extension",
      26: "weighted_spine_extension",
      27: "static_back_extension",
      28: "weighted_static_back_extension",
      29: "superman_from_floor",
      30: "weighted_superman_from_floor",
      31: "swiss_ball_back_extension",
      32: "weighted_swiss_ball_back_extension",
      33: "swiss_ball_hyperextension",
      34: "weighted_swiss_ball_hyperextension",
      35: "swiss_ball_opposite_arm_and_leg_lift",
      36: "weighted_swiss_ball_opposite_arm_and_leg_lift",
      37: "superman_on_swiss_ball",
      38: "cobra",
      39: "supine_floor_barre"
    },
    lateral_raise_exercise_name: {
      0: "45_degree_cable_external_rotation",
      1: "alternating_lateral_raise_with_static_hold",
      2: "bar_muscle_up",
      3: "bent_over_lateral_raise",
      4: "cable_diagonal_raise",
      5: "cable_front_raise",
      6: "calorie_row",
      7: "combo_shoulder_raise",
      8: "dumbbell_diagonal_raise",
      9: "dumbbell_v_raise",
      10: "front_raise",
      11: "leaning_dumbbell_lateral_raise",
      12: "lying_dumbbell_raise",
      13: "muscle_up",
      14: "one_arm_cable_lateral_raise",
      15: "overhand_grip_rear_lateral_raise",
      16: "plate_raises",
      17: "ring_dip",
      18: "weighted_ring_dip",
      19: "ring_muscle_up",
      20: "weighted_ring_muscle_up",
      21: "rope_climb",
      22: "weighted_rope_climb",
      23: "scaption",
      24: "seated_lateral_raise",
      25: "seated_rear_lateral_raise",
      26: "side_lying_lateral_raise",
      27: "standing_lift",
      28: "suspended_row",
      29: "underhand_grip_rear_lateral_raise",
      30: "wall_slide",
      31: "weighted_wall_slide",
      32: "arm_circles",
      33: "shaving_the_head"
    },
    leg_curl_exercise_name: {
      0: "leg_curl",
      1: "weighted_leg_curl",
      2: "good_morning",
      3: "seated_barbell_good_morning",
      4: "single_leg_barbell_good_morning",
      5: "single_leg_sliding_leg_curl",
      6: "sliding_leg_curl",
      7: "split_barbell_good_morning",
      8: "split_stance_extension",
      9: "staggered_stance_good_morning",
      10: "swiss_ball_hip_raise_and_leg_curl",
      11: "zercher_good_morning"
    },
    leg_raise_exercise_name: {
      0: "hanging_knee_raise",
      1: "hanging_leg_raise",
      2: "weighted_hanging_leg_raise",
      3: "hanging_single_leg_raise",
      4: "weighted_hanging_single_leg_raise",
      5: "kettlebell_leg_raises",
      6: "leg_lowering_drill",
      7: "weighted_leg_lowering_drill",
      8: "lying_straight_leg_raise",
      9: "weighted_lying_straight_leg_raise",
      10: "medicine_ball_leg_drops",
      11: "quadruped_leg_raise",
      12: "weighted_quadruped_leg_raise",
      13: "reverse_leg_raise",
      14: "weighted_reverse_leg_raise",
      15: "reverse_leg_raise_on_swiss_ball",
      16: "weighted_reverse_leg_raise_on_swiss_ball",
      17: "single_leg_lowering_drill",
      18: "weighted_single_leg_lowering_drill",
      19: "weighted_hanging_knee_raise",
      20: "lateral_stepover",
      21: "weighted_lateral_stepover"
    },
    lunge_exercise_name: {
      0: "overhead_lunge",
      1: "lunge_matrix",
      2: "weighted_lunge_matrix",
      3: "alternating_barbell_forward_lunge",
      4: "alternating_dumbbell_lunge_with_reach",
      5: "back_foot_elevated_dumbbell_split_squat",
      6: "barbell_box_lunge",
      7: "barbell_bulgarian_split_squat",
      8: "barbell_crossover_lunge",
      9: "barbell_front_split_squat",
      10: "barbell_lunge",
      11: "barbell_reverse_lunge",
      12: "barbell_side_lunge",
      13: "barbell_split_squat",
      14: "core_control_rear_lunge",
      15: "diagonal_lunge",
      16: "drop_lunge",
      17: "dumbbell_box_lunge",
      18: "dumbbell_bulgarian_split_squat",
      19: "dumbbell_crossover_lunge",
      20: "dumbbell_diagonal_lunge",
      21: "dumbbell_lunge",
      22: "dumbbell_lunge_and_rotation",
      23: "dumbbell_overhead_bulgarian_split_squat",
      24: "dumbbell_reverse_lunge_to_high_knee_and_press",
      25: "dumbbell_side_lunge",
      26: "elevated_front_foot_barbell_split_squat",
      27: "front_foot_elevated_dumbbell_split_squat",
      28: "gunslinger_lunge",
      29: "lawnmower_lunge",
      30: "low_lunge_with_isometric_adduction",
      31: "low_side_to_side_lunge",
      32: "lunge",
      33: "weighted_lunge",
      34: "lunge_with_arm_reach",
      35: "lunge_with_diagonal_reach",
      36: "lunge_with_side_bend",
      37: "offset_dumbbell_lunge",
      38: "offset_dumbbell_reverse_lunge",
      39: "overhead_bulgarian_split_squat",
      40: "overhead_dumbbell_reverse_lunge",
      41: "overhead_dumbbell_split_squat",
      42: "overhead_lunge_with_rotation",
      43: "reverse_barbell_box_lunge",
      44: "reverse_box_lunge",
      45: "reverse_dumbbell_box_lunge",
      46: "reverse_dumbbell_crossover_lunge",
      47: "reverse_dumbbell_diagonal_lunge",
      48: "reverse_lunge_with_reach_back",
      49: "weighted_reverse_lunge_with_reach_back",
      50: "reverse_lunge_with_twist_and_overhead_reach",
      51: "weighted_reverse_lunge_with_twist_and_overhead_reach",
      52: "reverse_sliding_box_lunge",
      53: "weighted_reverse_sliding_box_lunge",
      54: "reverse_sliding_lunge",
      55: "weighted_reverse_sliding_lunge",
      56: "runners_lunge_to_balance",
      57: "weighted_runners_lunge_to_balance",
      58: "shifting_side_lunge",
      59: "side_and_crossover_lunge",
      60: "weighted_side_and_crossover_lunge",
      61: "side_lunge",
      62: "weighted_side_lunge",
      63: "side_lunge_and_press",
      64: "side_lunge_jump_off",
      65: "side_lunge_sweep",
      66: "weighted_side_lunge_sweep",
      67: "side_lunge_to_crossover_tap",
      68: "weighted_side_lunge_to_crossover_tap",
      69: "side_to_side_lunge_chops",
      70: "weighted_side_to_side_lunge_chops",
      71: "siff_jump_lunge",
      72: "weighted_siff_jump_lunge",
      73: "single_arm_reverse_lunge_and_press",
      74: "sliding_lateral_lunge",
      75: "weighted_sliding_lateral_lunge",
      76: "walking_barbell_lunge",
      77: "walking_dumbbell_lunge",
      78: "walking_lunge",
      79: "weighted_walking_lunge",
      80: "wide_grip_overhead_barbell_split_squat"
    },
    olympic_lift_exercise_name: {
      0: "barbell_hang_power_clean",
      1: "barbell_hang_squat_clean",
      2: "barbell_power_clean",
      3: "barbell_power_snatch",
      4: "barbell_squat_clean",
      5: "clean_and_jerk",
      6: "barbell_hang_power_snatch",
      7: "barbell_hang_pull",
      8: "barbell_high_pull",
      9: "barbell_snatch",
      10: "barbell_split_jerk",
      11: "clean",
      12: "dumbbell_clean",
      13: "dumbbell_hang_pull",
      14: "one_hand_dumbbell_split_snatch",
      15: "push_jerk",
      16: "single_arm_dumbbell_snatch",
      17: "single_arm_hang_snatch",
      18: "single_arm_kettlebell_snatch",
      19: "split_jerk",
      20: "squat_clean_and_jerk"
    },
    plank_exercise_name: {
      0: "45_degree_plank",
      1: "weighted_45_degree_plank",
      2: "90_degree_static_hold",
      3: "weighted_90_degree_static_hold",
      4: "bear_crawl",
      5: "weighted_bear_crawl",
      6: "cross_body_mountain_climber",
      7: "weighted_cross_body_mountain_climber",
      8: "elbow_plank_pike_jacks",
      9: "weighted_elbow_plank_pike_jacks",
      10: "elevated_feet_plank",
      11: "weighted_elevated_feet_plank",
      12: "elevator_abs",
      13: "weighted_elevator_abs",
      14: "extended_plank",
      15: "weighted_extended_plank",
      16: "full_plank_passe_twist",
      17: "weighted_full_plank_passe_twist",
      18: "inching_elbow_plank",
      19: "weighted_inching_elbow_plank",
      20: "inchworm_to_side_plank",
      21: "weighted_inchworm_to_side_plank",
      22: "kneeling_plank",
      23: "weighted_kneeling_plank",
      24: "kneeling_side_plank_with_leg_lift",
      25: "weighted_kneeling_side_plank_with_leg_lift",
      26: "lateral_roll",
      27: "weighted_lateral_roll",
      28: "lying_reverse_plank",
      29: "weighted_lying_reverse_plank",
      30: "medicine_ball_mountain_climber",
      31: "weighted_medicine_ball_mountain_climber",
      32: "modified_mountain_climber_and_extension",
      33: "weighted_modified_mountain_climber_and_extension",
      34: "mountain_climber",
      35: "weighted_mountain_climber",
      36: "mountain_climber_on_sliding_discs",
      37: "weighted_mountain_climber_on_sliding_discs",
      38: "mountain_climber_with_feet_on_bosu_ball",
      39: "weighted_mountain_climber_with_feet_on_bosu_ball",
      40: "mountain_climber_with_hands_on_bench",
      41: "mountain_climber_with_hands_on_swiss_ball",
      42: "weighted_mountain_climber_with_hands_on_swiss_ball",
      43: "plank",
      44: "plank_jacks_with_feet_on_sliding_discs",
      45: "weighted_plank_jacks_with_feet_on_sliding_discs",
      46: "plank_knee_twist",
      47: "weighted_plank_knee_twist",
      48: "plank_pike_jumps",
      49: "weighted_plank_pike_jumps",
      50: "plank_pikes",
      51: "weighted_plank_pikes",
      52: "plank_to_stand_up",
      53: "weighted_plank_to_stand_up",
      54: "plank_with_arm_raise",
      55: "weighted_plank_with_arm_raise",
      56: "plank_with_knee_to_elbow",
      57: "weighted_plank_with_knee_to_elbow",
      58: "plank_with_oblique_crunch",
      59: "weighted_plank_with_oblique_crunch",
      60: "plyometric_side_plank",
      61: "weighted_plyometric_side_plank",
      62: "rolling_side_plank",
      63: "weighted_rolling_side_plank",
      64: "side_kick_plank",
      65: "weighted_side_kick_plank",
      66: "side_plank",
      67: "weighted_side_plank",
      68: "side_plank_and_row",
      69: "weighted_side_plank_and_row",
      70: "side_plank_lift",
      71: "weighted_side_plank_lift",
      72: "side_plank_with_elbow_on_bosu_ball",
      73: "weighted_side_plank_with_elbow_on_bosu_ball",
      74: "side_plank_with_feet_on_bench",
      75: "weighted_side_plank_with_feet_on_bench",
      76: "side_plank_with_knee_circle",
      77: "weighted_side_plank_with_knee_circle",
      78: "side_plank_with_knee_tuck",
      79: "weighted_side_plank_with_knee_tuck",
      80: "side_plank_with_leg_lift",
      81: "weighted_side_plank_with_leg_lift",
      82: "side_plank_with_reach_under",
      83: "weighted_side_plank_with_reach_under",
      84: "single_leg_elevated_feet_plank",
      85: "weighted_single_leg_elevated_feet_plank",
      86: "single_leg_flex_and_extend",
      87: "weighted_single_leg_flex_and_extend",
      88: "single_leg_side_plank",
      89: "weighted_single_leg_side_plank",
      90: "spiderman_plank",
      91: "weighted_spiderman_plank",
      92: "straight_arm_plank",
      93: "weighted_straight_arm_plank",
      94: "straight_arm_plank_with_shoulder_touch",
      95: "weighted_straight_arm_plank_with_shoulder_touch",
      96: "swiss_ball_plank",
      97: "weighted_swiss_ball_plank",
      98: "swiss_ball_plank_leg_lift",
      99: "weighted_swiss_ball_plank_leg_lift",
      100: "swiss_ball_plank_leg_lift_and_hold",
      101: "swiss_ball_plank_with_feet_on_bench",
      102: "weighted_swiss_ball_plank_with_feet_on_bench",
      103: "swiss_ball_prone_jackknife",
      104: "weighted_swiss_ball_prone_jackknife",
      105: "swiss_ball_side_plank",
      106: "weighted_swiss_ball_side_plank",
      107: "three_way_plank",
      108: "weighted_three_way_plank",
      109: "towel_plank_and_knee_in",
      110: "weighted_towel_plank_and_knee_in",
      111: "t_stabilization",
      112: "weighted_t_stabilization",
      113: "turkish_get_up_to_side_plank",
      114: "weighted_turkish_get_up_to_side_plank",
      115: "two_point_plank",
      116: "weighted_two_point_plank",
      117: "weighted_plank",
      118: "wide_stance_plank_with_diagonal_arm_lift",
      119: "weighted_wide_stance_plank_with_diagonal_arm_lift",
      120: "wide_stance_plank_with_diagonal_leg_lift",
      121: "weighted_wide_stance_plank_with_diagonal_leg_lift",
      122: "wide_stance_plank_with_leg_lift",
      123: "weighted_wide_stance_plank_with_leg_lift",
      124: "wide_stance_plank_with_opposite_arm_and_leg_lift",
      125: "weighted_mountain_climber_with_hands_on_bench",
      126: "weighted_swiss_ball_plank_leg_lift_and_hold",
      127: "weighted_wide_stance_plank_with_opposite_arm_and_leg_lift",
      128: "plank_with_feet_on_swiss_ball",
      129: "side_plank_to_plank_with_reach_under",
      130: "bridge_with_glute_lower_lift",
      131: "bridge_one_leg_bridge",
      132: "plank_with_arm_variations",
      133: "plank_with_leg_lift",
      134: "reverse_plank_with_leg_pull"
    },
    plyo_exercise_name: {
      0: "alternating_jump_lunge",
      1: "weighted_alternating_jump_lunge",
      2: "barbell_jump_squat",
      3: "body_weight_jump_squat",
      4: "weighted_jump_squat",
      5: "cross_knee_strike",
      6: "weighted_cross_knee_strike",
      7: "depth_jump",
      8: "weighted_depth_jump",
      9: "dumbbell_jump_squat",
      10: "dumbbell_split_jump",
      11: "front_knee_strike",
      12: "weighted_front_knee_strike",
      13: "high_box_jump",
      14: "weighted_high_box_jump",
      15: "isometric_explosive_body_weight_jump_squat",
      16: "weighted_isometric_explosive_jump_squat",
      17: "lateral_leap_and_hop",
      18: "weighted_lateral_leap_and_hop",
      19: "lateral_plyo_squats",
      20: "weighted_lateral_plyo_squats",
      21: "lateral_slide",
      22: "weighted_lateral_slide",
      23: "medicine_ball_overhead_throws",
      24: "medicine_ball_side_throw",
      25: "medicine_ball_slam",
      26: "side_to_side_medicine_ball_throws",
      27: "side_to_side_shuffle_jump",
      28: "weighted_side_to_side_shuffle_jump",
      29: "squat_jump_onto_box",
      30: "weighted_squat_jump_onto_box",
      31: "squat_jumps_in_and_out",
      32: "weighted_squat_jumps_in_and_out"
    },
    pull_up_exercise_name: {
      0: "banded_pull_ups",
      1: "30_degree_lat_pulldown",
      2: "band_assisted_chin_up",
      3: "close_grip_chin_up",
      4: "weighted_close_grip_chin_up",
      5: "close_grip_lat_pulldown",
      6: "crossover_chin_up",
      7: "weighted_crossover_chin_up",
      8: "ez_bar_pullover",
      9: "hanging_hurdle",
      10: "weighted_hanging_hurdle",
      11: "kneeling_lat_pulldown",
      12: "kneeling_underhand_grip_lat_pulldown",
      13: "lat_pulldown",
      14: "mixed_grip_chin_up",
      15: "weighted_mixed_grip_chin_up",
      16: "mixed_grip_pull_up",
      17: "weighted_mixed_grip_pull_up",
      18: "reverse_grip_pulldown",
      19: "standing_cable_pullover",
      20: "straight_arm_pulldown",
      21: "swiss_ball_ez_bar_pullover",
      22: "towel_pull_up",
      23: "weighted_towel_pull_up",
      24: "weighted_pull_up",
      25: "wide_grip_lat_pulldown",
      26: "wide_grip_pull_up",
      27: "weighted_wide_grip_pull_up",
      28: "burpee_pull_up",
      29: "weighted_burpee_pull_up",
      30: "jumping_pull_ups",
      31: "weighted_jumping_pull_ups",
      32: "kipping_pull_up",
      33: "weighted_kipping_pull_up",
      34: "l_pull_up",
      35: "weighted_l_pull_up",
      36: "suspended_chin_up",
      37: "weighted_suspended_chin_up",
      38: "pull_up"
    },
    push_up_exercise_name: {
      0: "chest_press_with_band",
      1: "alternating_staggered_push_up",
      2: "weighted_alternating_staggered_push_up",
      3: "alternating_hands_medicine_ball_push_up",
      4: "weighted_alternating_hands_medicine_ball_push_up",
      5: "bosu_ball_push_up",
      6: "weighted_bosu_ball_push_up",
      7: "clapping_push_up",
      8: "weighted_clapping_push_up",
      9: "close_grip_medicine_ball_push_up",
      10: "weighted_close_grip_medicine_ball_push_up",
      11: "close_hands_push_up",
      12: "weighted_close_hands_push_up",
      13: "decline_push_up",
      14: "weighted_decline_push_up",
      15: "diamond_push_up",
      16: "weighted_diamond_push_up",
      17: "explosive_crossover_push_up",
      18: "weighted_explosive_crossover_push_up",
      19: "explosive_push_up",
      20: "weighted_explosive_push_up",
      21: "feet_elevated_side_to_side_push_up",
      22: "weighted_feet_elevated_side_to_side_push_up",
      23: "hand_release_push_up",
      24: "weighted_hand_release_push_up",
      25: "handstand_push_up",
      26: "weighted_handstand_push_up",
      27: "incline_push_up",
      28: "weighted_incline_push_up",
      29: "isometric_explosive_push_up",
      30: "weighted_isometric_explosive_push_up",
      31: "judo_push_up",
      32: "weighted_judo_push_up",
      33: "kneeling_push_up",
      34: "weighted_kneeling_push_up",
      35: "medicine_ball_chest_pass",
      36: "medicine_ball_push_up",
      37: "weighted_medicine_ball_push_up",
      38: "one_arm_push_up",
      39: "weighted_one_arm_push_up",
      40: "weighted_push_up",
      41: "push_up_and_row",
      42: "weighted_push_up_and_row",
      43: "push_up_plus",
      44: "weighted_push_up_plus",
      45: "push_up_with_feet_on_swiss_ball",
      46: "weighted_push_up_with_feet_on_swiss_ball",
      47: "push_up_with_one_hand_on_medicine_ball",
      48: "weighted_push_up_with_one_hand_on_medicine_ball",
      49: "shoulder_push_up",
      50: "weighted_shoulder_push_up",
      51: "single_arm_medicine_ball_push_up",
      52: "weighted_single_arm_medicine_ball_push_up",
      53: "spiderman_push_up",
      54: "weighted_spiderman_push_up",
      55: "stacked_feet_push_up",
      56: "weighted_stacked_feet_push_up",
      57: "staggered_hands_push_up",
      58: "weighted_staggered_hands_push_up",
      59: "suspended_push_up",
      60: "weighted_suspended_push_up",
      61: "swiss_ball_push_up",
      62: "weighted_swiss_ball_push_up",
      63: "swiss_ball_push_up_plus",
      64: "weighted_swiss_ball_push_up_plus",
      65: "t_push_up",
      66: "weighted_t_push_up",
      67: "triple_stop_push_up",
      68: "weighted_triple_stop_push_up",
      69: "wide_hands_push_up",
      70: "weighted_wide_hands_push_up",
      71: "parallette_handstand_push_up",
      72: "weighted_parallette_handstand_push_up",
      73: "ring_handstand_push_up",
      74: "weighted_ring_handstand_push_up",
      75: "ring_push_up",
      76: "weighted_ring_push_up",
      77: "push_up",
      78: "pilates_pushup"
    },
    row_exercise_name: {
      0: "barbell_straight_leg_deadlift_to_row",
      1: "cable_row_standing",
      2: "dumbbell_row",
      3: "elevated_feet_inverted_row",
      4: "weighted_elevated_feet_inverted_row",
      5: "face_pull",
      6: "face_pull_with_external_rotation",
      7: "inverted_row_with_feet_on_swiss_ball",
      8: "weighted_inverted_row_with_feet_on_swiss_ball",
      9: "kettlebell_row",
      10: "modified_inverted_row",
      11: "weighted_modified_inverted_row",
      12: "neutral_grip_alternating_dumbbell_row",
      13: "one_arm_bent_over_row",
      14: "one_legged_dumbbell_row",
      15: "renegade_row",
      16: "reverse_grip_barbell_row",
      17: "rope_handle_cable_row",
      18: "seated_cable_row",
      19: "seated_dumbbell_row",
      20: "single_arm_cable_row",
      21: "single_arm_cable_row_and_rotation",
      22: "single_arm_inverted_row",
      23: "weighted_single_arm_inverted_row",
      24: "single_arm_neutral_grip_dumbbell_row",
      25: "single_arm_neutral_grip_dumbbell_row_and_rotation",
      26: "suspended_inverted_row",
      27: "weighted_suspended_inverted_row",
      28: "t_bar_row",
      29: "towel_grip_inverted_row",
      30: "weighted_towel_grip_inverted_row",
      31: "underhand_grip_cable_row",
      32: "v_grip_cable_row",
      33: "wide_grip_seated_cable_row"
    },
    shoulder_press_exercise_name: {
      0: "alternating_dumbbell_shoulder_press",
      1: "arnold_press",
      2: "barbell_front_squat_to_push_press",
      3: "barbell_push_press",
      4: "barbell_shoulder_press",
      5: "dead_curl_press",
      6: "dumbbell_alternating_shoulder_press_and_twist",
      7: "dumbbell_hammer_curl_to_lunge_to_press",
      8: "dumbbell_push_press",
      9: "floor_inverted_shoulder_press",
      10: "weighted_floor_inverted_shoulder_press",
      11: "inverted_shoulder_press",
      12: "weighted_inverted_shoulder_press",
      13: "one_arm_push_press",
      14: "overhead_barbell_press",
      15: "overhead_dumbbell_press",
      16: "seated_barbell_shoulder_press",
      17: "seated_dumbbell_shoulder_press",
      18: "single_arm_dumbbell_shoulder_press",
      19: "single_arm_step_up_and_press",
      20: "smith_machine_overhead_press",
      21: "split_stance_hammer_curl_to_press",
      22: "swiss_ball_dumbbell_shoulder_press",
      23: "weight_plate_front_raise"
    },
    shoulder_stability_exercise_name: {
      0: "90_degree_cable_external_rotation",
      1: "band_external_rotation",
      2: "band_internal_rotation",
      3: "bent_arm_lateral_raise_and_external_rotation",
      4: "cable_external_rotation",
      5: "dumbbell_face_pull_with_external_rotation",
      6: "floor_i_raise",
      7: "weighted_floor_i_raise",
      8: "floor_t_raise",
      9: "weighted_floor_t_raise",
      10: "floor_y_raise",
      11: "weighted_floor_y_raise",
      12: "incline_i_raise",
      13: "weighted_incline_i_raise",
      14: "incline_l_raise",
      15: "weighted_incline_l_raise",
      16: "incline_t_raise",
      17: "weighted_incline_t_raise",
      18: "incline_w_raise",
      19: "weighted_incline_w_raise",
      20: "incline_y_raise",
      21: "weighted_incline_y_raise",
      22: "lying_external_rotation",
      23: "seated_dumbbell_external_rotation",
      24: "standing_l_raise",
      25: "swiss_ball_i_raise",
      26: "weighted_swiss_ball_i_raise",
      27: "swiss_ball_t_raise",
      28: "weighted_swiss_ball_t_raise",
      29: "swiss_ball_w_raise",
      30: "weighted_swiss_ball_w_raise",
      31: "swiss_ball_y_raise",
      32: "weighted_swiss_ball_y_raise"
    },
    shrug_exercise_name: {
      0: "barbell_jump_shrug",
      1: "barbell_shrug",
      2: "barbell_upright_row",
      3: "behind_the_back_smith_machine_shrug",
      4: "dumbbell_jump_shrug",
      5: "dumbbell_shrug",
      6: "dumbbell_upright_row",
      7: "incline_dumbbell_shrug",
      8: "overhead_barbell_shrug",
      9: "overhead_dumbbell_shrug",
      10: "scaption_and_shrug",
      11: "scapular_retraction",
      12: "serratus_chair_shrug",
      13: "weighted_serratus_chair_shrug",
      14: "serratus_shrug",
      15: "weighted_serratus_shrug",
      16: "wide_grip_jump_shrug"
    },
    sit_up_exercise_name: {
      0: "alternating_sit_up",
      1: "weighted_alternating_sit_up",
      2: "bent_knee_v_up",
      3: "weighted_bent_knee_v_up",
      4: "butterfly_sit_up",
      5: "weighted_butterfly_situp",
      6: "cross_punch_roll_up",
      7: "weighted_cross_punch_roll_up",
      8: "crossed_arms_sit_up",
      9: "weighted_crossed_arms_sit_up",
      10: "get_up_sit_up",
      11: "weighted_get_up_sit_up",
      12: "hovering_sit_up",
      13: "weighted_hovering_sit_up",
      14: "kettlebell_sit_up",
      15: "medicine_ball_alternating_v_up",
      16: "medicine_ball_sit_up",
      17: "medicine_ball_v_up",
      18: "modified_sit_up",
      19: "negative_sit_up",
      20: "one_arm_full_sit_up",
      21: "reclining_circle",
      22: "weighted_reclining_circle",
      23: "reverse_curl_up",
      24: "weighted_reverse_curl_up",
      25: "single_leg_swiss_ball_jackknife",
      26: "weighted_single_leg_swiss_ball_jackknife",
      27: "the_teaser",
      28: "the_teaser_weighted",
      29: "three_part_roll_down",
      30: "weighted_three_part_roll_down",
      31: "v_up",
      32: "weighted_v_up",
      33: "weighted_russian_twist_on_swiss_ball",
      34: "weighted_sit_up",
      35: "x_abs",
      36: "weighted_x_abs",
      37: "sit_up"
    },
    squat_exercise_name: {
      0: "leg_press",
      1: "back_squat_with_body_bar",
      2: "back_squats",
      3: "weighted_back_squats",
      4: "balancing_squat",
      5: "weighted_balancing_squat",
      6: "barbell_back_squat",
      7: "barbell_box_squat",
      8: "barbell_front_squat",
      9: "barbell_hack_squat",
      10: "barbell_hang_squat_snatch",
      11: "barbell_lateral_step_up",
      12: "barbell_quarter_squat",
      13: "barbell_siff_squat",
      14: "barbell_squat_snatch",
      15: "barbell_squat_with_heels_raised",
      16: "barbell_stepover",
      17: "barbell_step_up",
      18: "bench_squat_with_rotational_chop",
      19: "weighted_bench_squat_with_rotational_chop",
      20: "body_weight_wall_squat",
      21: "weighted_wall_squat",
      22: "box_step_squat",
      23: "weighted_box_step_squat",
      24: "braced_squat",
      25: "crossed_arm_barbell_front_squat",
      26: "crossover_dumbbell_step_up",
      27: "dumbbell_front_squat",
      28: "dumbbell_split_squat",
      29: "dumbbell_squat",
      30: "dumbbell_squat_clean",
      31: "dumbbell_stepover",
      32: "dumbbell_step_up",
      33: "elevated_single_leg_squat",
      34: "weighted_elevated_single_leg_squat",
      35: "figure_four_squats",
      36: "weighted_figure_four_squats",
      37: "goblet_squat",
      38: "kettlebell_squat",
      39: "kettlebell_swing_overhead",
      40: "kettlebell_swing_with_flip_to_squat",
      41: "lateral_dumbbell_step_up",
      42: "one_legged_squat",
      43: "overhead_dumbbell_squat",
      44: "overhead_squat",
      45: "partial_single_leg_squat",
      46: "weighted_partial_single_leg_squat",
      47: "pistol_squat",
      48: "weighted_pistol_squat",
      49: "plie_slides",
      50: "weighted_plie_slides",
      51: "plie_squat",
      52: "weighted_plie_squat",
      53: "prisoner_squat",
      54: "weighted_prisoner_squat",
      55: "single_leg_bench_get_up",
      56: "weighted_single_leg_bench_get_up",
      57: "single_leg_bench_squat",
      58: "weighted_single_leg_bench_squat",
      59: "single_leg_squat_on_swiss_ball",
      60: "weighted_single_leg_squat_on_swiss_ball",
      61: "squat",
      62: "weighted_squat",
      63: "squats_with_band",
      64: "staggered_squat",
      65: "weighted_staggered_squat",
      66: "step_up",
      67: "weighted_step_up",
      68: "suitcase_squats",
      69: "sumo_squat",
      70: "sumo_squat_slide_in",
      71: "weighted_sumo_squat_slide_in",
      72: "sumo_squat_to_high_pull",
      73: "sumo_squat_to_stand",
      74: "weighted_sumo_squat_to_stand",
      75: "sumo_squat_with_rotation",
      76: "weighted_sumo_squat_with_rotation",
      77: "swiss_ball_body_weight_wall_squat",
      78: "weighted_swiss_ball_wall_squat",
      79: "thrusters",
      80: "uneven_squat",
      81: "weighted_uneven_squat",
      82: "waist_slimming_squat",
      83: "wall_ball",
      84: "wide_stance_barbell_squat",
      85: "wide_stance_goblet_squat",
      86: "zercher_squat",
      87: "kbs_overhead",
      88: "squat_and_side_kick",
      89: "squat_jumps_in_n_out",
      90: "pilates_plie_squats_parallel_turned_out_flat_and_heels",
      91: "releve_straight_leg_and_knee_bent_with_one_leg_variation"
    },
    total_body_exercise_name: {
      0: "burpee",
      1: "weighted_burpee",
      2: "burpee_box_jump",
      3: "weighted_burpee_box_jump",
      4: "high_pull_burpee",
      5: "man_makers",
      6: "one_arm_burpee",
      7: "squat_thrusts",
      8: "weighted_squat_thrusts",
      9: "squat_plank_push_up",
      10: "weighted_squat_plank_push_up",
      11: "standing_t_rotation_balance",
      12: "weighted_standing_t_rotation_balance"
    },
    triceps_extension_exercise_name: {
      0: "bench_dip",
      1: "weighted_bench_dip",
      2: "body_weight_dip",
      3: "cable_kickback",
      4: "cable_lying_triceps_extension",
      5: "cable_overhead_triceps_extension",
      6: "dumbbell_kickback",
      7: "dumbbell_lying_triceps_extension",
      8: "ez_bar_overhead_triceps_extension",
      9: "incline_dip",
      10: "weighted_incline_dip",
      11: "incline_ez_bar_lying_triceps_extension",
      12: "lying_dumbbell_pullover_to_extension",
      13: "lying_ez_bar_triceps_extension",
      14: "lying_triceps_extension_to_close_grip_bench_press",
      15: "overhead_dumbbell_triceps_extension",
      16: "reclining_triceps_press",
      17: "reverse_grip_pressdown",
      18: "reverse_grip_triceps_pressdown",
      19: "rope_pressdown",
      20: "seated_barbell_overhead_triceps_extension",
      21: "seated_dumbbell_overhead_triceps_extension",
      22: "seated_ez_bar_overhead_triceps_extension",
      23: "seated_single_arm_overhead_dumbbell_extension",
      24: "single_arm_dumbbell_overhead_triceps_extension",
      25: "single_dumbbell_seated_overhead_triceps_extension",
      26: "single_leg_bench_dip_and_kick",
      27: "weighted_single_leg_bench_dip_and_kick",
      28: "single_leg_dip",
      29: "weighted_single_leg_dip",
      30: "static_lying_triceps_extension",
      31: "suspended_dip",
      32: "weighted_suspended_dip",
      33: "swiss_ball_dumbbell_lying_triceps_extension",
      34: "swiss_ball_ez_bar_lying_triceps_extension",
      35: "swiss_ball_ez_bar_overhead_triceps_extension",
      36: "tabletop_dip",
      37: "weighted_tabletop_dip",
      38: "triceps_extension_on_floor",
      39: "triceps_pressdown",
      40: "weighted_dip"
    },
    warm_up_exercise_name: {
      0: "quadruped_rocking",
      1: "neck_tilts",
      2: "ankle_circles",
      3: "ankle_dorsiflexion_with_band",
      4: "ankle_internal_rotation",
      5: "arm_circles",
      6: "bent_over_reach_to_sky",
      7: "cat_camel",
      8: "elbow_to_foot_lunge",
      9: "forward_and_backward_leg_swings",
      10: "groiners",
      11: "inverted_hamstring_stretch",
      12: "lateral_duck_under",
      13: "neck_rotations",
      14: "opposite_arm_and_leg_balance",
      15: "reach_roll_and_lift",
      16: "scorpion",
      17: "shoulder_circles",
      18: "side_to_side_leg_swings",
      19: "sleeper_stretch",
      20: "slide_out",
      21: "swiss_ball_hip_crossover",
      22: "swiss_ball_reach_roll_and_lift",
      23: "swiss_ball_windshield_wipers",
      24: "thoracic_rotation",
      25: "walking_high_kicks",
      26: "walking_high_knees",
      27: "walking_knee_hugs",
      28: "walking_leg_cradles",
      29: "walkout",
      30: "walkout_from_push_up_position"
    },
    run_exercise_name: {
      0: "run",
      1: "walk",
      2: "jog",
      3: "sprint"
    },
    water_type: {
      0: "fresh",
      1: "salt",
      2: "en13319",
      3: "custom"
    },
    tissue_model_type: {
      0: "zhl_16c"
    },
    dive_gas_status: {
      0: "disabled",
      1: "enabled",
      2: "backup_only"
    },
    dive_alarm_type: {
      0: "depth",
      1: "time"
    },
    dive_backlight_mode: {
      0: "at_depth",
      1: "always_on"
    },
    favero_product: {
      10: "assioma_uno",
      12: "assioma_duo"
    }
  }
};

// node_modules/fit-file-parser/dist/messages.js
function getFieldObject(fieldNum, messageNum) {
  const message = FIT.messages[messageNum];
  if (!message) {
    return {};
  }
  return message[fieldNum] || {};
}
function getMessageName(messageNum) {
  const message = FIT.messages[messageNum];
  return message ? message.name : "";
}
function getFitMessage(messageNum) {
  return {
    name: getMessageName(messageNum),
    getAttributes: (fieldNum) => getFieldObject(fieldNum, messageNum)
  };
}
function getFitMessageBaseType(inp) {
  return inp;
}

// node_modules/fit-file-parser/dist/binary.js
var CompressedLocalMsgNumMask = 96;
var CompressedHeaderMask = 128;
var GarminTimeOffset = 6310656e5;
var monitoring_timestamp = 0;
function addEndian(littleEndian, bytes) {
  let result = 0;
  if (!littleEndian)
    bytes.reverse();
  for (let i = 0; i < bytes.length; i++) {
    result += bytes[i] << (i << 3) >>> 0;
  }
  return result;
}
function readData(blob, fDef, startIndex, options) {
  if (fDef.type === "uint8_array") {
    const array8 = [];
    for (let i = 0; i < fDef.size; i++) {
      array8.push(blob[startIndex + i]);
    }
    return array8;
  }
  if (fDef.endianAbility) {
    const temp = [];
    for (let i = 0; i < fDef.size; i++) {
      temp.push(blob[startIndex + i]);
    }
    const { buffer } = new Uint8Array(temp);
    const dataView = new DataView(buffer);
    try {
      switch (fDef.type) {
        case "sint16":
          return dataView.getInt16(0, fDef.littleEndian);
        case "uint16":
        case "uint16z":
          return dataView.getUint16(0, fDef.littleEndian);
        case "sint32":
          return dataView.getInt32(0, fDef.littleEndian);
        case "uint32":
        case "uint32z":
          return dataView.getUint32(0, fDef.littleEndian);
        case "float32":
          return dataView.getFloat32(0, fDef.littleEndian);
        case "float64":
          return dataView.getFloat64(0, fDef.littleEndian);
        case "uint32_array": {
          const array32 = [];
          for (let i = 0; i < fDef.size; i += 4) {
            array32.push(dataView.getUint32(i, fDef.littleEndian));
          }
          return array32;
        }
        case "uint16_array": {
          const array16 = [];
          for (let i = 0; i < fDef.size; i += 2) {
            array16.push(dataView.getUint16(i, fDef.littleEndian));
          }
          return array16;
        }
      }
    } catch (e) {
      if (!options.force) {
        throw e;
      }
    }
    return addEndian(fDef.littleEndian, temp);
  }
  if (fDef.type === "string") {
    const temp = [];
    for (let i = 0; i < fDef.size; i++) {
      if (blob[startIndex + i]) {
        temp.push(blob[startIndex + i]);
      }
    }
    return import_buffer.Buffer.from(temp).toString("utf-8");
  }
  if (fDef.type === "byte_array") {
    const temp = [];
    for (let i = 0; i < fDef.size; i++) {
      temp.push(blob[startIndex + i]);
    }
    return temp;
  }
  if (fDef.type === "sint8") {
    const val = blob[startIndex];
    return val > 127 ? val - 256 : val;
  }
  return blob[startIndex];
}
function formatByType(data, type, scale, offset) {
  switch (type) {
    case "date_time":
    case "local_date_time":
      return new Date(data * 1e3 + GarminTimeOffset);
    case "sint32":
      return data * FIT.scConst;
    case "uint8":
    case "sint16":
    case "uint32":
    case "uint16":
      return scale ? data / scale + offset : data;
    case "uint32_array":
    case "uint16_array":
    case "uint8_array":
      if (Array.isArray(data)) {
        const baseType = type.replace("_array", "");
        return data.map((dataItem) => {
          if (isInvalidValue(dataItem, baseType)) {
            return null;
          }
          return scale ? dataItem / scale + offset : dataItem;
        });
      }
      return scale ? data / scale + offset : data;
    default: {
      if (!FIT.types[type]) {
        return data;
      }
      const values = [];
      for (const key in FIT.types[type]) {
        if (key in FIT.types[type]) {
          values.push(String(FIT.types[type][key]));
        }
      }
      if (!values.includes("mask")) {
        const typeMap = FIT.types[type];
        const mapped = typeMap[String(data)];
        return mapped === void 0 ? data : mapped;
      }
      const dataItem = {};
      for (const key in FIT.types[type]) {
        if (key in FIT.types[type]) {
          if (FIT.types[type][key] === "mask") {
            dataItem.value = data & Number(key);
          } else {
            dataItem[FIT.types[type][key]] = !!((data & Number(key)) >> 7);
          }
        }
      }
      return dataItem;
    }
  }
}
function isInvalidValue(data, type) {
  switch (type) {
    case "enum":
      return data === 255;
    case "sint8":
      return data === 127;
    case "uint8":
      return data === 255;
    case "sint16":
      return data === 32767;
    case "uint16":
      return data === 65535;
    case "sint32":
      return data === 2147483647;
    case "uint32":
      return data === 4294967295;
    case "string":
      return data === 0;
    case "float32":
      return data === 4294967295;
    case "float64":
      return data === 18446744073709552e3;
    case "uint8z":
      return data === 0;
    case "uint16z":
      return data === 0;
    case "uint32z":
      return data === 0;
    case "byte":
      return data === 255;
    case "sint64":
      return data === 9223372036854776e3;
    case "uint64":
      return data === 18446744073709552e3;
    case "uint64z":
      return data === 0;
    default:
      return false;
  }
}
function isInvalidBaseTypeValue(data, baseTypeNo) {
  if (Array.isArray(data)) {
    return false;
  }
  const baseType = FIT.types.fit_base_type[baseTypeNo];
  return typeof baseType === "string" ? isInvalidValue(data, baseType) : false;
}
function convertTo(data, unitsList, unitName) {
  const options = FIT.options[unitsList];
  const unit = options[unitName];
  return unit ? data * unit.multiplier + unit.offset : data;
}
function applyOptions(data, field, options, fields) {
  switch (field) {
    case "device_type": {
      const isLocal = fields.source_type === "local" || fields.source_type === 5;
      const isBLE = fields.source_type === "bluetooth_low_energy" || fields.source_type === 3 || fields.source_type === "bluetooth" || fields.source_type === 2;
      const isANT = fields.source_type === "antplus" || fields.source_type === 1 || fields.source_type === "ant" || fields.source_type === 0;
      if (isLocal) {
        return FIT.types.local_device_type[data] || data;
      }
      if (isBLE) {
        return FIT.types.ble_device_type[data] || data;
      }
      if (isANT) {
        return FIT.types.antplus_device_type[data] || data;
      }
      return data;
    }
    case "speed":
    case "enhanced_speed":
    case "vertical_speed":
    case "avg_speed":
    case "max_speed":
    case "speed_1s":
    case "ball_speed":
    case "enhanced_avg_speed":
    case "enhanced_max_speed":
    case "avg_pos_vertical_speed":
    case "max_pos_vertical_speed":
    case "avg_neg_vertical_speed":
    case "max_neg_vertical_speed":
      return convertTo(data, "speedUnits", options.speedUnit);
    case "distance":
    case "total_distance":
    case "enhanced_avg_altitude":
    case "enhanced_min_altitude":
    case "enhanced_max_altitude":
    case "enhanced_altitude":
    case "height":
    case "odometer":
    case "avg_stroke_distance":
    case "min_altitude":
    case "avg_altitude":
    case "max_altitude":
    case "total_ascent":
    case "total_descent":
    case "altitude":
    case "cycle_length":
    case "auto_wheelsize":
    case "custom_wheelsize":
    case "gps_accuracy":
      return convertTo(data, "lengthUnits", options.lengthUnit);
    case "temperature":
    case "avg_temperature":
    case "max_temperature":
      return convertTo(data, "temperatureUnits", options.temperatureUnit);
    case "pressure":
    case "start_pressure":
    case "end_pressure":
      return convertTo(data, "pressureUnits", options.pressureUnit);
    case "ant_id": {
      const n1 = data >>> 28 & 15;
      const n2 = data >>> 24 & 15;
      const n3 = data >>> 16 & 255;
      const n4 = data & 65535;
      return `${n1.toString(16).toUpperCase()}-${n2.toString(16).toUpperCase()}-${n3.toString(16).toUpperCase().padStart(2, "0")}-${n4.toString(16).toUpperCase().padStart(4, "0")}`;
    }
    default:
      return data;
  }
}
function readRecord(blob, messageTypes, developerFields, startIndex, options, startDate, pausedTime) {
  var _a, _b;
  const recordHeader = blob[startIndex];
  let localMessageType = recordHeader & 15;
  if ((recordHeader & CompressedHeaderMask) === CompressedHeaderMask) {
    localMessageType = (recordHeader & CompressedLocalMsgNumMask) >> 5;
  } else if ((recordHeader & 64) === 64) {
    const hasDeveloperData = (recordHeader & 32) === 32;
    const lEnd = blob[startIndex + 2] === 0;
    const numberOfFields = blob[startIndex + 5];
    const numberOfDeveloperDataFields = hasDeveloperData ? blob[startIndex + 5 + numberOfFields * 3 + 1] : 0;
    const mTypeDef = {
      littleEndian: lEnd,
      globalMessageNumber: addEndian(lEnd, [
        blob[startIndex + 3],
        blob[startIndex + 4]
      ]),
      numberOfFields: numberOfFields + numberOfDeveloperDataFields,
      fieldDefs: []
    };
    const message2 = getFitMessage(mTypeDef.globalMessageNumber);
    for (let i = 0; i < numberOfFields; i++) {
      const fDefIndex = startIndex + 6 + i * 3;
      const baseType = blob[fDefIndex + 2];
      const { field, type } = message2.getAttributes(blob[fDefIndex]);
      const fDef = {
        type,
        fDefNo: blob[fDefIndex],
        size: blob[fDefIndex + 1],
        endianAbility: (baseType & 128) === 128,
        littleEndian: lEnd,
        baseTypeNo: baseType,
        name: field,
        dataType: getFitMessageBaseType(baseType & 15)
      };
      mTypeDef.fieldDefs.push(fDef);
    }
    for (let i = 0; i < numberOfDeveloperDataFields; i++) {
      try {
        const fDefIndex = startIndex + 6 + numberOfFields * 3 + 1 + i * 3;
        const fieldNum = blob[fDefIndex];
        const size = blob[fDefIndex + 1];
        const devDataIndex = blob[fDefIndex + 2];
        const devDef = developerFields[devDataIndex][fieldNum];
        const baseType = devDef.fit_base_type_id;
        const fDef = {
          type: FIT.types.fit_base_type[baseType],
          fDefNo: fieldNum,
          size,
          endianAbility: (baseType & 128) === 128,
          littleEndian: lEnd,
          baseTypeNo: baseType,
          name: devDef.field_name,
          dataType: getFitMessageBaseType(baseType & 15),
          scale: devDef.scale || 1,
          offset: devDef.offset || 0,
          developerDataIndex: devDataIndex,
          isDeveloperField: true
        };
        mTypeDef.fieldDefs.push(fDef);
      } catch (e) {
        if (options.force) {
          continue;
        }
        throw e;
      }
    }
    messageTypes[localMessageType] = mTypeDef;
    const nextIndex = startIndex + 6 + mTypeDef.numberOfFields * 3;
    const nextIndexWithDeveloperData = nextIndex + 1;
    return {
      messageType: "definition",
      nextIndex: hasDeveloperData ? nextIndexWithDeveloperData : nextIndex
    };
  }
  const messageType = messageTypes[localMessageType] || messageTypes[0];
  let messageSize = 0;
  let readDataFromIndex = startIndex + 1;
  const fields = {};
  const message = getFitMessage(messageType.globalMessageNumber);
  const rawFields = [];
  for (let i = 0; i < messageType.fieldDefs.length; i++) {
    const fDef = messageType.fieldDefs[i];
    const data = readData(blob, fDef, readDataFromIndex, options);
    if (!isInvalidValue(data, fDef.type) && !isInvalidBaseTypeValue(data, fDef.baseTypeNo)) {
      rawFields.push({ fDef, data });
    }
    readDataFromIndex += fDef.size;
    messageSize += fDef.size;
  }
  for (const { fDef, data } of rawFields) {
    const { field } = fDef.isDeveloperField ? { field: fDef.name } : message.getAttributes(fDef.fDefNo);
    if (field !== "unknown" && field !== "" && field !== void 0) {
      fields[field] = data;
    }
  }
  for (const { fDef, data } of rawFields) {
    if (fDef.isDeveloperField) {
      const field = fDef.name;
      const { type } = fDef;
      const scale = (_a = fDef.scale) !== null && _a !== void 0 ? _a : null;
      const offset = (_b = fDef.offset) !== null && _b !== void 0 ? _b : 0;
      fields[fDef.name] = applyOptions(formatByType(data, type, scale, offset), field, options, fields);
    } else {
      const { field, type, scale, offset } = message.getAttributes(fDef.fDefNo);
      if (field !== "unknown" && field !== "" && field !== void 0) {
        fields[field] = applyOptions(formatByType(data, type, scale, offset), field, options, fields);
      }
    }
    if (message.name === "record" && options.elapsedRecordField) {
      fields.elapsed_time = (fields.timestamp - (startDate || 0)) / 1e3;
      fields.timer_time = fields.elapsed_time - pausedTime;
    }
  }
  if (message.name === "field_description") {
    developerFields[fields.developer_data_index] = developerFields[fields.developer_data_index] || [];
    developerFields[fields.developer_data_index][fields.field_definition_number] = fields;
  }
  if (message.name === "monitoring") {
    if (fields.timestamp) {
      monitoring_timestamp = fields.timestamp;
      fields.timestamp = new Date(fields.timestamp * 1e3 + GarminTimeOffset);
    }
    if (fields.timestamp16 && !fields.timestamp) {
      monitoring_timestamp += fields.timestamp16 - (monitoring_timestamp & 65535) & 65535;
      fields.timestamp = new Date(monitoring_timestamp * 1e3 + GarminTimeOffset);
    }
  }
  return {
    messageType: message.name,
    nextIndex: startIndex + messageSize + 1,
    message: fields
  };
}
function getArrayBuffer(buffer) {
  if (buffer instanceof ArrayBuffer) {
    return buffer;
  }
  const ab = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return ab;
}
function calculateCRC(blob, start, end) {
  const crcTable = [
    0,
    52225,
    55297,
    5120,
    61441,
    15360,
    10240,
    58369,
    40961,
    27648,
    30720,
    46081,
    20480,
    39937,
    34817,
    17408
  ];
  let crc = 0;
  for (let i = start; i < end; i++) {
    const byteVal = blob[i];
    let tmp = crcTable[crc & 15];
    crc = crc >> 4 & 4095;
    crc = crc ^ tmp ^ crcTable[byteVal & 15];
    tmp = crcTable[crc & 15];
    crc = crc >> 4 & 4095;
    crc = crc ^ tmp ^ crcTable[byteVal >> 4 & 15];
  }
  return crc;
}

// node_modules/fit-file-parser/dist/helper.js
function mapDataIntoLap(inputLaps, lapKey, data) {
  const laps = [...inputLaps];
  let index = 0;
  for (let i = 0; i < laps.length; i++) {
    const nextLap = laps[i + 1];
    const tempData = [];
    const nextLapStartTime = nextLap ? new Date(nextLap.start_time).getTime() : null;
    for (let j = index; j < data.length; j++) {
      const row = data[j];
      if (nextLap && nextLapStartTime) {
        const timestamp = new Date(row.timestamp || row.start_time).getTime();
        if (nextLapStartTime > timestamp) {
          tempData.push(row);
        } else if (nextLapStartTime <= timestamp) {
          index = j;
          break;
        }
      } else {
        tempData.push(row);
      }
    }
    if (!laps[i][lapKey]) {
      laps[i][lapKey] = tempData;
    }
  }
  return laps;
}
function mapDataIntoSession(inputSessions, laps) {
  const sessions = [...inputSessions];
  let lapIndex = 0;
  for (let i = 0; i < sessions.length; i++) {
    const nextSession = sessions[i + 1];
    const tempLaps = [];
    const nextSessionStartTime = nextSession ? new Date(nextSession.start_time).getTime() : null;
    for (let j = lapIndex; j < laps.length; j++) {
      const lap = laps[j];
      if (nextSession && nextSessionStartTime) {
        const lapStartTime = new Date(lap.start_time).getTime();
        if (nextSessionStartTime > lapStartTime) {
          tempLaps.push(lap);
        } else if (nextSessionStartTime <= lapStartTime) {
          lapIndex = j;
          break;
        }
      } else {
        tempLaps.push(lap);
      }
    }
    if (!sessions[i].laps) {
      sessions[i].laps = tempLaps;
    }
  }
  return sessions;
}

// node_modules/fit-file-parser/dist/fit-parser.js
var FitParser = class {
  constructor(options = {}) {
    this.options = {
      force: options.force != null ? options.force : true,
      speedUnit: options.speedUnit || "m/s",
      lengthUnit: options.lengthUnit || "m",
      temperatureUnit: options.temperatureUnit || "celsius",
      elapsedRecordField: options.elapsedRecordField || false,
      pressureUnit: options.pressureUnit || "bar",
      mode: options.mode || "list"
    };
  }
  parseAsync(content) {
    return new Promise((resolve2, reject) => {
      this.parse(content, (error, data) => {
        if (error) {
          reject(error);
        } else if (data) {
          resolve2(data);
        }
      });
    });
  }
  parse(content, callback2) {
    var _a;
    const blob = new Uint8Array(getArrayBuffer(content));
    if (blob.length < 12) {
      callback2("File to small to be a FIT file", void 0);
      if (!this.options.force) {
        return;
      }
    }
    const headerLength = blob[0];
    if (headerLength !== 14 && headerLength !== 12) {
      callback2("Incorrect header size", void 0);
      if (!this.options.force) {
        return;
      }
    }
    let fileTypeString = "";
    for (let i = 8; i < 12; i++) {
      fileTypeString += String.fromCharCode(blob[i]);
    }
    if (fileTypeString !== ".FIT") {
      callback2("Missing '.FIT' in header", void 0);
      if (!this.options.force) {
        return;
      }
    }
    if (headerLength === 14) {
      const crcHeader = blob[12] + (blob[13] << 8);
      const crcHeaderCalc = calculateCRC(blob, 0, 12);
      if (crcHeader !== crcHeaderCalc) {
        if (!this.options.force) {
          return;
        }
      }
    }
    const protocolVersion = blob[1];
    const profileVersion = blob[2] + (blob[3] << 8);
    const dataLength = blob[4] + (blob[5] << 8) + (blob[6] << 16) + (blob[7] << 24);
    const crcStart = dataLength + headerLength;
    const crcFile = blob[crcStart] + (blob[crcStart + 1] << 8);
    const crcFileCalc = calculateCRC(blob, headerLength === 12 ? 0 : headerLength, crcStart);
    if (crcFile !== crcFileCalc) {
      if (!this.options.force) {
        return;
      }
    }
    const fitObj = {
      profileVersion,
      protocolVersion
    };
    let sessions = [];
    let laps = [];
    const records = [];
    const events = [];
    const hr_zone = [];
    const power_zone = [];
    const hrv = [];
    const device_infos = [];
    const applications = [];
    const fieldDescriptions = [];
    const dive_gases = [];
    const course_points = [];
    const sports = [];
    const monitors = [];
    const stress = [];
    const definitions = [];
    const file_ids = [];
    const monitor_info = [];
    const lengths = [];
    const tank_updates = [];
    const tank_summaries = [];
    const jumps = [];
    const splits = [];
    const split_summaries = [];
    const time_in_zone = [];
    const activity_metrics = [];
    const user_metrics = [];
    let loopIndex = headerLength;
    const messageTypes = [];
    const developerFields = [];
    const isModeCascade = this.options.mode === "cascade";
    const isCascadeNeeded = isModeCascade || this.options.mode === "both";
    let startDate;
    let lastStopTimestamp;
    let pausedTime = 0;
    while (loopIndex < crcStart) {
      const { nextIndex, messageType, message } = readRecord(blob, messageTypes, developerFields, loopIndex, this.options, startDate, pausedTime);
      loopIndex = nextIndex;
      switch (messageType) {
        case "lap":
          laps.push(message);
          break;
        case "session":
          sessions.push(message);
          break;
        case "event":
          if (message.event === "timer") {
            if (message.event_type === "stop_all") {
              lastStopTimestamp = message.timestamp;
            } else if (message.event_type === "start" && lastStopTimestamp) {
              pausedTime += (message.timestamp - lastStopTimestamp) / 1e3;
            }
          }
          events.push(message);
          break;
        case "length":
          lengths.push(message);
          break;
        case "hrv":
          hrv.push(message);
          break;
        case "hr_zone":
          hr_zone.push(message);
          break;
        case "power_zone":
          power_zone.push(message);
          break;
        case "record":
          if (!startDate) {
            startDate = message.timestamp;
            message.elapsed_time = 0;
            message.timer_time = 0;
          }
          records.push(message);
          break;
        case "field_description":
          fieldDescriptions.push(message);
          break;
        case "device_info":
          device_infos.push(message);
          break;
        case "developer_data_id":
          applications.push(message);
          break;
        case "dive_gas":
          dive_gases.push(message);
          break;
        case "course_point":
          course_points.push(message);
          break;
        case "sport":
          sports.push(message);
          break;
        case "file_id":
          if (message) {
            file_ids.push(message);
          }
          break;
        case "definition":
          if (message) {
            definitions.push(message);
          }
          break;
        case "monitoring":
          monitors.push(message);
          break;
        case "monitoring_info":
          monitor_info.push(message);
          break;
        case "stress_level":
          stress.push(message);
          break;
        case "software":
          fitObj.software = message;
          break;
        case "tank_update":
          tank_updates.push(message);
          break;
        case "tank_summary":
          tank_summaries.push(message);
          break;
        case "jump":
          jumps.push(message);
          break;
        case "split":
          splits.push(message);
          break;
        case "split_summary":
          split_summaries.push(message);
          break;
        case "time_in_zone":
          time_in_zone.push(message);
          break;
        case "activity_metrics":
          activity_metrics.push(message);
          break;
        case "user_metrics":
          user_metrics.push(message);
          break;
        default:
          if (messageType !== "") {
            fitObj[messageType] = message;
          }
          break;
      }
    }
    fitObj.hr_zone = hr_zone;
    fitObj.power_zone = power_zone;
    fitObj.dive_gases = dive_gases;
    fitObj.course_points = course_points;
    fitObj.sports = sports;
    fitObj.monitors = monitors;
    fitObj.stress = stress;
    fitObj.file_ids = file_ids;
    fitObj.monitor_info = monitor_info;
    fitObj.definitions = definitions;
    fitObj.tank_updates = tank_updates;
    fitObj.tank_summaries = tank_summaries;
    fitObj.jumps = jumps;
    fitObj.splits = splits;
    fitObj.split_summaries = split_summaries;
    fitObj.time_in_zone = time_in_zone;
    fitObj.activity_metrics = activity_metrics;
    fitObj.user_metrics = user_metrics;
    if (isCascadeNeeded) {
      laps = mapDataIntoLap(laps, "records", records);
      laps = mapDataIntoLap(laps, "lengths", lengths);
      sessions = mapDataIntoSession(sessions, laps);
      fitObj.activity = Object.assign(Object.assign({}, (_a = fitObj.activity) !== null && _a !== void 0 ? _a : {}), {
        // ugly but we assume the activity was parsed correctly with all other members correctly
        sessions,
        events,
        hrv,
        device_infos,
        developer_data_ids: applications,
        field_descriptions: fieldDescriptions,
        sports,
        splits,
        split_summaries
      });
    }
    if (!isModeCascade) {
      fitObj.sessions = sessions;
      fitObj.laps = laps;
      fitObj.lengths = lengths;
      fitObj.records = records;
      fitObj.events = events;
      fitObj.device_infos = device_infos;
      fitObj.developer_data_ids = applications;
      fitObj.field_descriptions = fieldDescriptions;
      fitObj.hrv = hrv;
    }
    callback2(void 0, fitObj);
  }
};

// src/ingest/fitImporter.ts
var import_zlib = require("zlib");
var import_crypto = require("crypto");
var SPLIT_DISTANCE_M = 1e3;
async function parseFitBuffer(buffer, options = { routeMaxPoints: 500 }) {
  var _a, _b, _c, _d, _e;
  const isGzip = buffer[0] === 31 && buffer[1] === 139;
  const fitBuffer = isGzip ? (0, import_zlib.gunzipSync)(buffer) : buffer;
  const parser = new FitParser({ force: true, speedUnit: "m/s", lengthUnit: "m", mode: "list" });
  const fit = await parser.parseAsync(fitBuffer);
  const sessions = (_a = fit.sessions) != null ? _a : [];
  const session = sessions.find((s) => s.sport === "running");
  if (!session)
    return null;
  const startDate = session.start_time;
  const endDate = session.timestamp;
  const startMs = startDate.getTime();
  const records = (_b = fit.records) != null ? _b : [];
  const samples = records.map((r) => {
    const ts = r.timestamp;
    const sample2 = {
      tOffsetSec: (ts.getTime() - startMs) / 1e3
    };
    if (r.heart_rate != null)
      sample2.heartRate = r.heart_rate;
    if (r.cadence != null)
      sample2.cadence = r.cadence;
    if (r.power != null)
      sample2.power = r.power;
    if (r.speed != null)
      sample2.speedMetersPerSec = r.speed;
    if (r.altitude != null)
      sample2.altitudeMeters = r.altitude;
    if (r.position_lat != null)
      sample2.lat = r.position_lat;
    if (r.position_long != null)
      sample2.lon = r.position_long;
    if (r.vertical_oscillation != null)
      sample2.verticalOscillationMm = r.vertical_oscillation;
    if (r.stance_time != null)
      sample2.groundContactMs = r.stance_time;
    if (r.step_length != null)
      sample2.strideLengthMeters = r.step_length / 1e3;
    return sample2;
  });
  const laps = deriveSplits(records, startMs);
  const route = buildRoute(records, options.routeMaxPoints);
  const startTimeIso = startDate.toISOString();
  const source = (_c = session.manufacturer) != null ? _c : "fit";
  const id = (0, import_crypto.createHash)("sha1").update(startTimeIso + source).digest("hex").slice(0, 16);
  const summary = {
    id,
    startTime: formatWithOffset(startDate),
    endTime: formatWithOffset(endDate),
    distanceMeters: (_d = session.total_distance) != null ? _d : 0,
    durationSeconds: (_e = session.total_timer_time) != null ? _e : 0,
    elapsedSeconds: session.total_elapsed_time,
    avgHeartRate: session.avg_heart_rate,
    maxHeartRate: session.max_heart_rate,
    // Raw FIT cadence is already steps/min for running (not half-cadence like cycling)
    avgCadence: session.avg_cadence,
    avgPower: session.avg_power,
    elevationGainMeters: session.total_ascent,
    energyKcal: session.total_calories,
    source,
    indoor: session.sub_sport === "indoor_running" || route.length === 0,
    hasRoute: route.length > 0,
    hasSeries: samples.length > 0,
    hasLaps: laps.length > 0
  };
  const detail = {
    id,
    samples,
    laps,
    route
  };
  return { summary, detail };
}
function deriveSplits(records, startMs) {
  var _a;
  const laps = [];
  let lapIndex = 0;
  let nextBoundary = SPLIT_DISTANCE_M;
  let lapStartMs = null;
  let lapHrSum = 0;
  let lapHrCount = 0;
  let lapCadSum = 0;
  let lapCadCount = 0;
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const dist = (_a = r.distance) != null ? _a : 0;
    const ts = r.timestamp;
    if (lapStartMs === null)
      lapStartMs = ts.getTime();
    if (r.heart_rate != null) {
      lapHrSum += r.heart_rate;
      lapHrCount++;
    }
    if (r.cadence != null) {
      lapCadSum += r.cadence;
      lapCadCount++;
    }
    if (dist >= nextBoundary) {
      const lapDist = SPLIT_DISTANCE_M;
      const lapDurSec = (ts.getTime() - lapStartMs) / 1e3;
      const lap = {
        index: lapIndex,
        startOffsetSec: (lapStartMs - startMs) / 1e3,
        distanceMeters: lapDist,
        durationSeconds: lapDurSec
      };
      if (lapHrCount > 0)
        lap.avgHeartRate = Math.round(lapHrSum / lapHrCount);
      if (lapCadCount > 0)
        lap.avgCadence = Math.round(lapCadSum / lapCadCount);
      laps.push(lap);
      lapIndex++;
      nextBoundary += SPLIT_DISTANCE_M;
      lapStartMs = ts.getTime();
      lapHrSum = 0;
      lapHrCount = 0;
      lapCadSum = 0;
      lapCadCount = 0;
    }
  }
  return laps;
}
function buildRoute(records, maxPoints) {
  var _a;
  const gpsRecords = records.filter(
    (r) => r.position_lat != null && r.position_long != null
  );
  if (gpsRecords.length === 0)
    return [];
  const step = Math.max(1, Math.floor(gpsRecords.length / maxPoints));
  const route = [];
  for (let i = 0; i < gpsRecords.length; i += step) {
    const r = gpsRecords[i];
    route.push([r.position_lat, r.position_long]);
  }
  const last = gpsRecords[gpsRecords.length - 1];
  if (((_a = route[route.length - 1]) == null ? void 0 : _a[0]) !== last.position_lat) {
    route.push([last.position_lat, last.position_long]);
  }
  return route;
}
function formatWithOffset(d) {
  return d.toISOString().replace("Z", "+00:00");
}

// src/ingest/inboxWatcher.ts
var InboxWatcher = class {
  constructor(app, settings, indexStore, detailStore) {
    this.app = app;
    this.settings = settings;
    this.indexStore = indexStore;
    this.detailStore = detailStore;
    this.eventRef = null;
  }
  start() {
    this.eventRef = this.app.vault.on("create", (file) => {
      if (file instanceof import_obsidian3.TFile && this.isInboxFit(file.path)) {
        void this.processFile(file.path);
      }
    });
  }
  stop() {
    if (this.eventRef) {
      this.app.vault.offref(this.eventRef);
      this.eventRef = null;
    }
  }
  async scanExisting() {
    const { adapter } = this.app.vault;
    const inbox = (0, import_obsidian3.normalizePath)(this.settings.inboxFolder);
    if (!await adapter.exists(inbox))
      return;
    const { files } = await adapter.list(inbox);
    const fits = files.filter((p) => this.isFitExtension(p));
    for (const p of fits) {
      await this.processFile(p);
    }
  }
  isInboxFit(vaultPath) {
    const inbox = (0, import_obsidian3.normalizePath)(this.settings.inboxFolder);
    const processed = (0, import_obsidian3.normalizePath)(`${this.settings.inboxFolder}/processed`);
    return vaultPath.startsWith(inbox + "/") && !vaultPath.startsWith(processed + "/") && this.isFitExtension(vaultPath);
  }
  isFitExtension(p) {
    return p.endsWith(".fit") || p.endsWith(".fit.gz");
  }
  async processFile(vaultPath) {
    const { adapter } = this.app.vault;
    try {
      const arrayBuf = await adapter.readBinary(vaultPath);
      const buffer = Buffer.from(arrayBuf);
      const result = await parseFitBuffer(buffer, {
        routeMaxPoints: this.settings.routeMaxPoints
      });
      if (!result) {
        await this.moveToProcessed(vaultPath);
        return;
      }
      await this.indexStore.upsertRun(result.summary);
      await this.detailStore.write(result.detail);
      await this.moveToProcessed(vaultPath);
      new import_obsidian3.Notice(`Running Log: imported ${this.describeRun(result.summary)}`, 4e3);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      new import_obsidian3.Notice(`Running Log: failed to import ${vaultPath} \u2014 ${msg}`, 6e3);
    }
  }
  async moveToProcessed(vaultPath) {
    const { adapter } = this.app.vault;
    const filename = vaultPath.split("/").pop();
    const processedDir = (0, import_obsidian3.normalizePath)(`${this.settings.inboxFolder}/processed`);
    if (!await adapter.exists(processedDir)) {
      await adapter.mkdir(processedDir);
    }
    const dest = (0, import_obsidian3.normalizePath)(`${processedDir}/${filename}`);
    await adapter.copy(vaultPath, dest);
    await adapter.remove(vaultPath);
  }
  describeRun(s) {
    const km = (s.distanceMeters / 1e3).toFixed(2);
    const min = Math.round(s.durationSeconds / 60);
    return `${km} km run (${min} min)`;
  }
};

// src/render/codeBlockProcessor.ts
var import_obsidian4 = require("obsidian");

// src/render/blockConfig.ts
var VALID_TYPES = [
  "weekly-mileage",
  "monthly-mileage",
  "pace-trend",
  "heatmap",
  "streak"
];
var KNOWN_KEYS = {
  "weekly-mileage": /* @__PURE__ */ new Set(["type", "title", "unit", "from", "to", "last", "goal", "showruncount"]),
  "monthly-mileage": /* @__PURE__ */ new Set(["type", "title", "unit", "from", "to", "last", "goal", "showruncount"]),
  "pace-trend": /* @__PURE__ */ new Set(["type", "title", "unit", "from", "to", "last", "metric", "smoothing", "mindistance", "trendline"]),
  "heatmap": /* @__PURE__ */ new Set(["type", "title", "unit", "year", "last", "metric", "levels"]),
  "streak": /* @__PURE__ */ new Set(["type", "title", "unit", "min", "showlongest"])
};
function parseBlockSource(source) {
  const config = {};
  for (const line of source.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#"))
      continue;
    const colon = trimmed.indexOf(":");
    if (colon === -1)
      continue;
    const key = trimmed.slice(0, colon).trim().toLowerCase();
    const raw = trimmed.slice(colon + 1).trim();
    if (raw === "true")
      config[key] = true;
    else if (raw === "false")
      config[key] = false;
    else if (raw !== "" && !isNaN(Number(raw)))
      config[key] = Number(raw);
    else
      config[key] = raw;
  }
  const warnings = [];
  const type = config["type"];
  if (type && KNOWN_KEYS[type]) {
    for (const key of Object.keys(config)) {
      if (!KNOWN_KEYS[type].has(key))
        warnings.push(`Unknown key: "${key}"`);
    }
  }
  return { config, warnings };
}

// src/render/theme.ts
function getThemePalette() {
  const s = getComputedStyle(document.body);
  const get = (v) => s.getPropertyValue(v).trim() || "#888";
  return {
    accent: get("--interactive-accent"),
    textMuted: get("--text-muted"),
    textFaint: get("--text-faint"),
    border: get("--background-modifier-border"),
    bgSecondary: get("--background-secondary")
  };
}

// node_modules/@kurkle/color/dist/color.esm.js
function round(v) {
  return v + 0.5 | 0;
}
var lim = (v, l, h) => Math.max(Math.min(v, h), l);
function p2b(v) {
  return lim(round(v * 2.55), 0, 255);
}
function n2b(v) {
  return lim(round(v * 255), 0, 255);
}
function b2n(v) {
  return lim(round(v / 2.55) / 100, 0, 1);
}
function n2p(v) {
  return lim(round(v * 100), 0, 100);
}
var map$1 = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, a: 10, b: 11, c: 12, d: 13, e: 14, f: 15 };
var hex = [..."0123456789ABCDEF"];
var h1 = (b) => hex[b & 15];
var h2 = (b) => hex[(b & 240) >> 4] + hex[b & 15];
var eq = (b) => (b & 240) >> 4 === (b & 15);
var isShort = (v) => eq(v.r) && eq(v.g) && eq(v.b) && eq(v.a);
function hexParse(str) {
  var len = str.length;
  var ret;
  if (str[0] === "#") {
    if (len === 4 || len === 5) {
      ret = {
        r: 255 & map$1[str[1]] * 17,
        g: 255 & map$1[str[2]] * 17,
        b: 255 & map$1[str[3]] * 17,
        a: len === 5 ? map$1[str[4]] * 17 : 255
      };
    } else if (len === 7 || len === 9) {
      ret = {
        r: map$1[str[1]] << 4 | map$1[str[2]],
        g: map$1[str[3]] << 4 | map$1[str[4]],
        b: map$1[str[5]] << 4 | map$1[str[6]],
        a: len === 9 ? map$1[str[7]] << 4 | map$1[str[8]] : 255
      };
    }
  }
  return ret;
}
var alpha = (a, f) => a < 255 ? f(a) : "";
function hexString(v) {
  var f = isShort(v) ? h1 : h2;
  return v ? "#" + f(v.r) + f(v.g) + f(v.b) + alpha(v.a, f) : void 0;
}
var HUE_RE = /^(hsla?|hwb|hsv)\(\s*([-+.e\d]+)(?:deg)?[\s,]+([-+.e\d]+)%[\s,]+([-+.e\d]+)%(?:[\s,]+([-+.e\d]+)(%)?)?\s*\)$/;
function hsl2rgbn(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  return [f(0), f(8), f(4)];
}
function hsv2rgbn(h, s, v) {
  const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5), f(3), f(1)];
}
function hwb2rgbn(h, w, b) {
  const rgb = hsl2rgbn(h, 1, 0.5);
  let i;
  if (w + b > 1) {
    i = 1 / (w + b);
    w *= i;
    b *= i;
  }
  for (i = 0; i < 3; i++) {
    rgb[i] *= 1 - w - b;
    rgb[i] += w;
  }
  return rgb;
}
function hueValue(r, g, b, d, max) {
  if (r === max) {
    return (g - b) / d + (g < b ? 6 : 0);
  }
  if (g === max) {
    return (b - r) / d + 2;
  }
  return (r - g) / d + 4;
}
function rgb2hsl(v) {
  const range = 255;
  const r = v.r / range;
  const g = v.g / range;
  const b = v.b / range;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h, s, d;
  if (max !== min) {
    d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = hueValue(r, g, b, d, max);
    h = h * 60 + 0.5;
  }
  return [h | 0, s || 0, l];
}
function calln(f, a, b, c) {
  return (Array.isArray(a) ? f(a[0], a[1], a[2]) : f(a, b, c)).map(n2b);
}
function hsl2rgb(h, s, l) {
  return calln(hsl2rgbn, h, s, l);
}
function hwb2rgb(h, w, b) {
  return calln(hwb2rgbn, h, w, b);
}
function hsv2rgb(h, s, v) {
  return calln(hsv2rgbn, h, s, v);
}
function hue(h) {
  return (h % 360 + 360) % 360;
}
function hueParse(str) {
  const m = HUE_RE.exec(str);
  let a = 255;
  let v;
  if (!m) {
    return;
  }
  if (m[5] !== v) {
    a = m[6] ? p2b(+m[5]) : n2b(+m[5]);
  }
  const h = hue(+m[2]);
  const p1 = +m[3] / 100;
  const p2 = +m[4] / 100;
  if (m[1] === "hwb") {
    v = hwb2rgb(h, p1, p2);
  } else if (m[1] === "hsv") {
    v = hsv2rgb(h, p1, p2);
  } else {
    v = hsl2rgb(h, p1, p2);
  }
  return {
    r: v[0],
    g: v[1],
    b: v[2],
    a
  };
}
function rotate(v, deg) {
  var h = rgb2hsl(v);
  h[0] = hue(h[0] + deg);
  h = hsl2rgb(h);
  v.r = h[0];
  v.g = h[1];
  v.b = h[2];
}
function hslString(v) {
  if (!v) {
    return;
  }
  const a = rgb2hsl(v);
  const h = a[0];
  const s = n2p(a[1]);
  const l = n2p(a[2]);
  return v.a < 255 ? `hsla(${h}, ${s}%, ${l}%, ${b2n(v.a)})` : `hsl(${h}, ${s}%, ${l}%)`;
}
var map = {
  x: "dark",
  Z: "light",
  Y: "re",
  X: "blu",
  W: "gr",
  V: "medium",
  U: "slate",
  A: "ee",
  T: "ol",
  S: "or",
  B: "ra",
  C: "lateg",
  D: "ights",
  R: "in",
  Q: "turquois",
  E: "hi",
  P: "ro",
  O: "al",
  N: "le",
  M: "de",
  L: "yello",
  F: "en",
  K: "ch",
  G: "arks",
  H: "ea",
  I: "ightg",
  J: "wh"
};
var names$1 = {
  OiceXe: "f0f8ff",
  antiquewEte: "faebd7",
  aqua: "ffff",
  aquamarRe: "7fffd4",
  azuY: "f0ffff",
  beige: "f5f5dc",
  bisque: "ffe4c4",
  black: "0",
  blanKedOmond: "ffebcd",
  Xe: "ff",
  XeviTet: "8a2be2",
  bPwn: "a52a2a",
  burlywood: "deb887",
  caMtXe: "5f9ea0",
  KartYuse: "7fff00",
  KocTate: "d2691e",
  cSO: "ff7f50",
  cSnflowerXe: "6495ed",
  cSnsilk: "fff8dc",
  crimson: "dc143c",
  cyan: "ffff",
  xXe: "8b",
  xcyan: "8b8b",
  xgTMnPd: "b8860b",
  xWay: "a9a9a9",
  xgYF: "6400",
  xgYy: "a9a9a9",
  xkhaki: "bdb76b",
  xmagFta: "8b008b",
  xTivegYF: "556b2f",
  xSange: "ff8c00",
  xScEd: "9932cc",
  xYd: "8b0000",
  xsOmon: "e9967a",
  xsHgYF: "8fbc8f",
  xUXe: "483d8b",
  xUWay: "2f4f4f",
  xUgYy: "2f4f4f",
  xQe: "ced1",
  xviTet: "9400d3",
  dAppRk: "ff1493",
  dApskyXe: "bfff",
  dimWay: "696969",
  dimgYy: "696969",
  dodgerXe: "1e90ff",
  fiYbrick: "b22222",
  flSOwEte: "fffaf0",
  foYstWAn: "228b22",
  fuKsia: "ff00ff",
  gaRsbSo: "dcdcdc",
  ghostwEte: "f8f8ff",
  gTd: "ffd700",
  gTMnPd: "daa520",
  Way: "808080",
  gYF: "8000",
  gYFLw: "adff2f",
  gYy: "808080",
  honeyMw: "f0fff0",
  hotpRk: "ff69b4",
  RdianYd: "cd5c5c",
  Rdigo: "4b0082",
  ivSy: "fffff0",
  khaki: "f0e68c",
  lavFMr: "e6e6fa",
  lavFMrXsh: "fff0f5",
  lawngYF: "7cfc00",
  NmoncEffon: "fffacd",
  ZXe: "add8e6",
  ZcSO: "f08080",
  Zcyan: "e0ffff",
  ZgTMnPdLw: "fafad2",
  ZWay: "d3d3d3",
  ZgYF: "90ee90",
  ZgYy: "d3d3d3",
  ZpRk: "ffb6c1",
  ZsOmon: "ffa07a",
  ZsHgYF: "20b2aa",
  ZskyXe: "87cefa",
  ZUWay: "778899",
  ZUgYy: "778899",
  ZstAlXe: "b0c4de",
  ZLw: "ffffe0",
  lime: "ff00",
  limegYF: "32cd32",
  lRF: "faf0e6",
  magFta: "ff00ff",
  maPon: "800000",
  VaquamarRe: "66cdaa",
  VXe: "cd",
  VScEd: "ba55d3",
  VpurpN: "9370db",
  VsHgYF: "3cb371",
  VUXe: "7b68ee",
  VsprRggYF: "fa9a",
  VQe: "48d1cc",
  VviTetYd: "c71585",
  midnightXe: "191970",
  mRtcYam: "f5fffa",
  mistyPse: "ffe4e1",
  moccasR: "ffe4b5",
  navajowEte: "ffdead",
  navy: "80",
  Tdlace: "fdf5e6",
  Tive: "808000",
  TivedBb: "6b8e23",
  Sange: "ffa500",
  SangeYd: "ff4500",
  ScEd: "da70d6",
  pOegTMnPd: "eee8aa",
  pOegYF: "98fb98",
  pOeQe: "afeeee",
  pOeviTetYd: "db7093",
  papayawEp: "ffefd5",
  pHKpuff: "ffdab9",
  peru: "cd853f",
  pRk: "ffc0cb",
  plum: "dda0dd",
  powMrXe: "b0e0e6",
  purpN: "800080",
  YbeccapurpN: "663399",
  Yd: "ff0000",
  Psybrown: "bc8f8f",
  PyOXe: "4169e1",
  saddNbPwn: "8b4513",
  sOmon: "fa8072",
  sandybPwn: "f4a460",
  sHgYF: "2e8b57",
  sHshell: "fff5ee",
  siFna: "a0522d",
  silver: "c0c0c0",
  skyXe: "87ceeb",
  UXe: "6a5acd",
  UWay: "708090",
  UgYy: "708090",
  snow: "fffafa",
  sprRggYF: "ff7f",
  stAlXe: "4682b4",
  tan: "d2b48c",
  teO: "8080",
  tEstN: "d8bfd8",
  tomato: "ff6347",
  Qe: "40e0d0",
  viTet: "ee82ee",
  JHt: "f5deb3",
  wEte: "ffffff",
  wEtesmoke: "f5f5f5",
  Lw: "ffff00",
  LwgYF: "9acd32"
};
function unpack() {
  const unpacked = {};
  const keys = Object.keys(names$1);
  const tkeys = Object.keys(map);
  let i, j, k, ok, nk;
  for (i = 0; i < keys.length; i++) {
    ok = nk = keys[i];
    for (j = 0; j < tkeys.length; j++) {
      k = tkeys[j];
      nk = nk.replace(k, map[k]);
    }
    k = parseInt(names$1[ok], 16);
    unpacked[nk] = [k >> 16 & 255, k >> 8 & 255, k & 255];
  }
  return unpacked;
}
var names;
function nameParse(str) {
  if (!names) {
    names = unpack();
    names.transparent = [0, 0, 0, 0];
  }
  const a = names[str.toLowerCase()];
  return a && {
    r: a[0],
    g: a[1],
    b: a[2],
    a: a.length === 4 ? a[3] : 255
  };
}
var RGB_RE = /^rgba?\(\s*([-+.\d]+)(%)?[\s,]+([-+.e\d]+)(%)?[\s,]+([-+.e\d]+)(%)?(?:[\s,/]+([-+.e\d]+)(%)?)?\s*\)$/;
function rgbParse(str) {
  const m = RGB_RE.exec(str);
  let a = 255;
  let r, g, b;
  if (!m) {
    return;
  }
  if (m[7] !== r) {
    const v = +m[7];
    a = m[8] ? p2b(v) : lim(v * 255, 0, 255);
  }
  r = +m[1];
  g = +m[3];
  b = +m[5];
  r = 255 & (m[2] ? p2b(r) : lim(r, 0, 255));
  g = 255 & (m[4] ? p2b(g) : lim(g, 0, 255));
  b = 255 & (m[6] ? p2b(b) : lim(b, 0, 255));
  return {
    r,
    g,
    b,
    a
  };
}
function rgbString(v) {
  return v && (v.a < 255 ? `rgba(${v.r}, ${v.g}, ${v.b}, ${b2n(v.a)})` : `rgb(${v.r}, ${v.g}, ${v.b})`);
}
var to = (v) => v <= 31308e-7 ? v * 12.92 : Math.pow(v, 1 / 2.4) * 1.055 - 0.055;
var from = (v) => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
function interpolate(rgb1, rgb2, t) {
  const r = from(b2n(rgb1.r));
  const g = from(b2n(rgb1.g));
  const b = from(b2n(rgb1.b));
  return {
    r: n2b(to(r + t * (from(b2n(rgb2.r)) - r))),
    g: n2b(to(g + t * (from(b2n(rgb2.g)) - g))),
    b: n2b(to(b + t * (from(b2n(rgb2.b)) - b))),
    a: rgb1.a + t * (rgb2.a - rgb1.a)
  };
}
function modHSL(v, i, ratio) {
  if (v) {
    let tmp = rgb2hsl(v);
    tmp[i] = Math.max(0, Math.min(tmp[i] + tmp[i] * ratio, i === 0 ? 360 : 1));
    tmp = hsl2rgb(tmp);
    v.r = tmp[0];
    v.g = tmp[1];
    v.b = tmp[2];
  }
}
function clone(v, proto) {
  return v ? Object.assign(proto || {}, v) : v;
}
function fromObject(input) {
  var v = { r: 0, g: 0, b: 0, a: 255 };
  if (Array.isArray(input)) {
    if (input.length >= 3) {
      v = { r: input[0], g: input[1], b: input[2], a: 255 };
      if (input.length > 3) {
        v.a = n2b(input[3]);
      }
    }
  } else {
    v = clone(input, { r: 0, g: 0, b: 0, a: 1 });
    v.a = n2b(v.a);
  }
  return v;
}
function functionParse(str) {
  if (str.charAt(0) === "r") {
    return rgbParse(str);
  }
  return hueParse(str);
}
var Color = class {
  constructor(input) {
    if (input instanceof Color) {
      return input;
    }
    const type = typeof input;
    let v;
    if (type === "object") {
      v = fromObject(input);
    } else if (type === "string") {
      v = hexParse(input) || nameParse(input) || functionParse(input);
    }
    this._rgb = v;
    this._valid = !!v;
  }
  get valid() {
    return this._valid;
  }
  get rgb() {
    var v = clone(this._rgb);
    if (v) {
      v.a = b2n(v.a);
    }
    return v;
  }
  set rgb(obj) {
    this._rgb = fromObject(obj);
  }
  rgbString() {
    return this._valid ? rgbString(this._rgb) : void 0;
  }
  hexString() {
    return this._valid ? hexString(this._rgb) : void 0;
  }
  hslString() {
    return this._valid ? hslString(this._rgb) : void 0;
  }
  mix(color2, weight) {
    if (color2) {
      const c1 = this.rgb;
      const c2 = color2.rgb;
      let w2;
      const p = weight === w2 ? 0.5 : weight;
      const w = 2 * p - 1;
      const a = c1.a - c2.a;
      const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2;
      w2 = 1 - w1;
      c1.r = 255 & w1 * c1.r + w2 * c2.r + 0.5;
      c1.g = 255 & w1 * c1.g + w2 * c2.g + 0.5;
      c1.b = 255 & w1 * c1.b + w2 * c2.b + 0.5;
      c1.a = p * c1.a + (1 - p) * c2.a;
      this.rgb = c1;
    }
    return this;
  }
  interpolate(color2, t) {
    if (color2) {
      this._rgb = interpolate(this._rgb, color2._rgb, t);
    }
    return this;
  }
  clone() {
    return new Color(this.rgb);
  }
  alpha(a) {
    this._rgb.a = n2b(a);
    return this;
  }
  clearer(ratio) {
    const rgb = this._rgb;
    rgb.a *= 1 - ratio;
    return this;
  }
  greyscale() {
    const rgb = this._rgb;
    const val = round(rgb.r * 0.3 + rgb.g * 0.59 + rgb.b * 0.11);
    rgb.r = rgb.g = rgb.b = val;
    return this;
  }
  opaquer(ratio) {
    const rgb = this._rgb;
    rgb.a *= 1 + ratio;
    return this;
  }
  negate() {
    const v = this._rgb;
    v.r = 255 - v.r;
    v.g = 255 - v.g;
    v.b = 255 - v.b;
    return this;
  }
  lighten(ratio) {
    modHSL(this._rgb, 2, ratio);
    return this;
  }
  darken(ratio) {
    modHSL(this._rgb, 2, -ratio);
    return this;
  }
  saturate(ratio) {
    modHSL(this._rgb, 1, ratio);
    return this;
  }
  desaturate(ratio) {
    modHSL(this._rgb, 1, -ratio);
    return this;
  }
  rotate(deg) {
    rotate(this._rgb, deg);
    return this;
  }
};

// node_modules/chart.js/dist/chunks/helpers.dataset.js
function noop() {
}
var uid = (() => {
  let id = 0;
  return () => id++;
})();
function isNullOrUndef(value) {
  return value === null || value === void 0;
}
function isArray(value) {
  if (Array.isArray && Array.isArray(value)) {
    return true;
  }
  const type = Object.prototype.toString.call(value);
  if (type.slice(0, 7) === "[object" && type.slice(-6) === "Array]") {
    return true;
  }
  return false;
}
function isObject(value) {
  return value !== null && Object.prototype.toString.call(value) === "[object Object]";
}
function isNumberFinite(value) {
  return (typeof value === "number" || value instanceof Number) && isFinite(+value);
}
function finiteOrDefault(value, defaultValue) {
  return isNumberFinite(value) ? value : defaultValue;
}
function valueOrDefault(value, defaultValue) {
  return typeof value === "undefined" ? defaultValue : value;
}
var toDimension = (value, dimension) => typeof value === "string" && value.endsWith("%") ? parseFloat(value) / 100 * dimension : +value;
function callback(fn, args, thisArg) {
  if (fn && typeof fn.call === "function") {
    return fn.apply(thisArg, args);
  }
}
function each(loopable, fn, thisArg, reverse) {
  let i, len, keys;
  if (isArray(loopable)) {
    len = loopable.length;
    if (reverse) {
      for (i = len - 1; i >= 0; i--) {
        fn.call(thisArg, loopable[i], i);
      }
    } else {
      for (i = 0; i < len; i++) {
        fn.call(thisArg, loopable[i], i);
      }
    }
  } else if (isObject(loopable)) {
    keys = Object.keys(loopable);
    len = keys.length;
    for (i = 0; i < len; i++) {
      fn.call(thisArg, loopable[keys[i]], keys[i]);
    }
  }
}
function _elementsEqual(a0, a1) {
  let i, ilen, v0, v1;
  if (!a0 || !a1 || a0.length !== a1.length) {
    return false;
  }
  for (i = 0, ilen = a0.length; i < ilen; ++i) {
    v0 = a0[i];
    v1 = a1[i];
    if (v0.datasetIndex !== v1.datasetIndex || v0.index !== v1.index) {
      return false;
    }
  }
  return true;
}
function clone2(source) {
  if (isArray(source)) {
    return source.map(clone2);
  }
  if (isObject(source)) {
    const target = /* @__PURE__ */ Object.create(null);
    const keys = Object.keys(source);
    const klen = keys.length;
    let k = 0;
    for (; k < klen; ++k) {
      target[keys[k]] = clone2(source[keys[k]]);
    }
    return target;
  }
  return source;
}
function isValidKey(key) {
  return [
    "__proto__",
    "prototype",
    "constructor"
  ].indexOf(key) === -1;
}
function _merger(key, target, source, options) {
  if (!isValidKey(key)) {
    return;
  }
  const tval = target[key];
  const sval = source[key];
  if (isObject(tval) && isObject(sval)) {
    merge(tval, sval, options);
  } else {
    target[key] = clone2(sval);
  }
}
function merge(target, source, options) {
  const sources = isArray(source) ? source : [
    source
  ];
  const ilen = sources.length;
  if (!isObject(target)) {
    return target;
  }
  options = options || {};
  const merger = options.merger || _merger;
  let current;
  for (let i = 0; i < ilen; ++i) {
    current = sources[i];
    if (!isObject(current)) {
      continue;
    }
    const keys = Object.keys(current);
    for (let k = 0, klen = keys.length; k < klen; ++k) {
      merger(keys[k], target, current, options);
    }
  }
  return target;
}
function mergeIf(target, source) {
  return merge(target, source, {
    merger: _mergerIf
  });
}
function _mergerIf(key, target, source) {
  if (!isValidKey(key)) {
    return;
  }
  const tval = target[key];
  const sval = source[key];
  if (isObject(tval) && isObject(sval)) {
    mergeIf(tval, sval);
  } else if (!Object.prototype.hasOwnProperty.call(target, key)) {
    target[key] = clone2(sval);
  }
}
var keyResolvers = {
  // Chart.helpers.core resolveObjectKey should resolve empty key to root object
  "": (v) => v,
  // default resolvers
  x: (o) => o.x,
  y: (o) => o.y
};
function _splitKey(key) {
  const parts = key.split(".");
  const keys = [];
  let tmp = "";
  for (const part of parts) {
    tmp += part;
    if (tmp.endsWith("\\")) {
      tmp = tmp.slice(0, -1) + ".";
    } else {
      keys.push(tmp);
      tmp = "";
    }
  }
  return keys;
}
function _getKeyResolver(key) {
  const keys = _splitKey(key);
  return (obj) => {
    for (const k of keys) {
      if (k === "") {
        break;
      }
      obj = obj && obj[k];
    }
    return obj;
  };
}
function resolveObjectKey(obj, key) {
  const resolver = keyResolvers[key] || (keyResolvers[key] = _getKeyResolver(key));
  return resolver(obj);
}
function _capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
var defined = (value) => typeof value !== "undefined";
var isFunction = (value) => typeof value === "function";
var setsEqual = (a, b) => {
  if (a.size !== b.size) {
    return false;
  }
  for (const item of a) {
    if (!b.has(item)) {
      return false;
    }
  }
  return true;
};
function _isClickEvent(e) {
  return e.type === "mouseup" || e.type === "click" || e.type === "contextmenu";
}
var PI = Math.PI;
var TAU = 2 * PI;
var PITAU = TAU + PI;
var INFINITY = Number.POSITIVE_INFINITY;
var RAD_PER_DEG = PI / 180;
var HALF_PI = PI / 2;
var QUARTER_PI = PI / 4;
var TWO_THIRDS_PI = PI * 2 / 3;
var log10 = Math.log10;
var sign = Math.sign;
function almostEquals(x, y, epsilon) {
  return Math.abs(x - y) < epsilon;
}
function niceNum(range) {
  const roundedRange = Math.round(range);
  range = almostEquals(range, roundedRange, range / 1e3) ? roundedRange : range;
  const niceRange = Math.pow(10, Math.floor(log10(range)));
  const fraction = range / niceRange;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * niceRange;
}
function _factorize(value) {
  const result = [];
  const sqrt = Math.sqrt(value);
  let i;
  for (i = 1; i < sqrt; i++) {
    if (value % i === 0) {
      result.push(i);
      result.push(value / i);
    }
  }
  if (sqrt === (sqrt | 0)) {
    result.push(sqrt);
  }
  result.sort((a, b) => a - b).pop();
  return result;
}
function isNonPrimitive(n) {
  return typeof n === "symbol" || typeof n === "object" && n !== null && !(Symbol.toPrimitive in n || "toString" in n || "valueOf" in n);
}
function isNumber(n) {
  return !isNonPrimitive(n) && !isNaN(parseFloat(n)) && isFinite(n);
}
function almostWhole(x, epsilon) {
  const rounded = Math.round(x);
  return rounded - epsilon <= x && rounded + epsilon >= x;
}
function _setMinAndMaxByKey(array, target, property) {
  let i, ilen, value;
  for (i = 0, ilen = array.length; i < ilen; i++) {
    value = array[i][property];
    if (!isNaN(value)) {
      target.min = Math.min(target.min, value);
      target.max = Math.max(target.max, value);
    }
  }
}
function toRadians(degrees) {
  return degrees * (PI / 180);
}
function toDegrees(radians) {
  return radians * (180 / PI);
}
function _decimalPlaces(x) {
  if (!isNumberFinite(x)) {
    return;
  }
  let e = 1;
  let p = 0;
  while (Math.round(x * e) / e !== x) {
    e *= 10;
    p++;
  }
  return p;
}
function getAngleFromPoint(centrePoint, anglePoint) {
  const distanceFromXCenter = anglePoint.x - centrePoint.x;
  const distanceFromYCenter = anglePoint.y - centrePoint.y;
  const radialDistanceFromCenter = Math.sqrt(distanceFromXCenter * distanceFromXCenter + distanceFromYCenter * distanceFromYCenter);
  let angle = Math.atan2(distanceFromYCenter, distanceFromXCenter);
  if (angle < -0.5 * PI) {
    angle += TAU;
  }
  return {
    angle,
    distance: radialDistanceFromCenter
  };
}
function distanceBetweenPoints(pt1, pt2) {
  return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
}
function _angleDiff(a, b) {
  return (a - b + PITAU) % TAU - PI;
}
function _normalizeAngle(a) {
  return (a % TAU + TAU) % TAU;
}
function _angleBetween(angle, start, end, sameAngleIsFullCircle) {
  const a = _normalizeAngle(angle);
  const s = _normalizeAngle(start);
  const e = _normalizeAngle(end);
  const angleToStart = _normalizeAngle(s - a);
  const angleToEnd = _normalizeAngle(e - a);
  const startToAngle = _normalizeAngle(a - s);
  const endToAngle = _normalizeAngle(a - e);
  return a === s || a === e || sameAngleIsFullCircle && s === e || angleToStart > angleToEnd && startToAngle < endToAngle;
}
function _limitValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function _int16Range(value) {
  return _limitValue(value, -32768, 32767);
}
function _isBetween(value, start, end, epsilon = 1e-6) {
  return value >= Math.min(start, end) - epsilon && value <= Math.max(start, end) + epsilon;
}
function _lookup(table, value, cmp) {
  cmp = cmp || ((index) => table[index] < value);
  let hi = table.length - 1;
  let lo = 0;
  let mid;
  while (hi - lo > 1) {
    mid = lo + hi >> 1;
    if (cmp(mid)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return {
    lo,
    hi
  };
}
var _lookupByKey = (table, key, value, last) => _lookup(table, value, last ? (index) => {
  const ti = table[index][key];
  return ti < value || ti === value && table[index + 1][key] === value;
} : (index) => table[index][key] < value);
var _rlookupByKey = (table, key, value) => _lookup(table, value, (index) => table[index][key] >= value);
function _filterBetween(values, min, max) {
  let start = 0;
  let end = values.length;
  while (start < end && values[start] < min) {
    start++;
  }
  while (end > start && values[end - 1] > max) {
    end--;
  }
  return start > 0 || end < values.length ? values.slice(start, end) : values;
}
var arrayEvents = [
  "push",
  "pop",
  "shift",
  "splice",
  "unshift"
];
function listenArrayEvents(array, listener) {
  if (array._chartjs) {
    array._chartjs.listeners.push(listener);
    return;
  }
  Object.defineProperty(array, "_chartjs", {
    configurable: true,
    enumerable: false,
    value: {
      listeners: [
        listener
      ]
    }
  });
  arrayEvents.forEach((key) => {
    const method = "_onData" + _capitalize(key);
    const base = array[key];
    Object.defineProperty(array, key, {
      configurable: true,
      enumerable: false,
      value(...args) {
        const res = base.apply(this, args);
        array._chartjs.listeners.forEach((object) => {
          if (typeof object[method] === "function") {
            object[method](...args);
          }
        });
        return res;
      }
    });
  });
}
function unlistenArrayEvents(array, listener) {
  const stub = array._chartjs;
  if (!stub) {
    return;
  }
  const listeners = stub.listeners;
  const index = listeners.indexOf(listener);
  if (index !== -1) {
    listeners.splice(index, 1);
  }
  if (listeners.length > 0) {
    return;
  }
  arrayEvents.forEach((key) => {
    delete array[key];
  });
  delete array._chartjs;
}
function _arrayUnique(items) {
  const set2 = new Set(items);
  if (set2.size === items.length) {
    return items;
  }
  return Array.from(set2);
}
var requestAnimFrame = function() {
  if (typeof window === "undefined") {
    return function(callback2) {
      return callback2();
    };
  }
  return window.requestAnimationFrame;
}();
function throttled(fn, thisArg) {
  let argsToUse = [];
  let ticking = false;
  return function(...args) {
    argsToUse = args;
    if (!ticking) {
      ticking = true;
      requestAnimFrame.call(window, () => {
        ticking = false;
        fn.apply(thisArg, argsToUse);
      });
    }
  };
}
function debounce(fn, delay) {
  let timeout;
  return function(...args) {
    if (delay) {
      clearTimeout(timeout);
      timeout = setTimeout(fn, delay, args);
    } else {
      fn.apply(this, args);
    }
    return delay;
  };
}
var _toLeftRightCenter = (align) => align === "start" ? "left" : align === "end" ? "right" : "center";
var _alignStartEnd = (align, start, end) => align === "start" ? start : align === "end" ? end : (start + end) / 2;
function _getStartAndCountOfVisiblePoints(meta, points, animationsDisabled) {
  const pointCount = points.length;
  let start = 0;
  let count = pointCount;
  if (meta._sorted) {
    const { iScale, vScale, _parsed } = meta;
    const spanGaps = meta.dataset ? meta.dataset.options ? meta.dataset.options.spanGaps : null : null;
    const axis = iScale.axis;
    const { min, max, minDefined, maxDefined } = iScale.getUserBounds();
    if (minDefined) {
      start = Math.min(
        // @ts-expect-error Need to type _parsed
        _lookupByKey(_parsed, axis, min).lo,
        // @ts-expect-error Need to fix types on _lookupByKey
        animationsDisabled ? pointCount : _lookupByKey(points, axis, iScale.getPixelForValue(min)).lo
      );
      if (spanGaps) {
        const distanceToDefinedLo = _parsed.slice(0, start + 1).reverse().findIndex((point) => !isNullOrUndef(point[vScale.axis]));
        start -= Math.max(0, distanceToDefinedLo);
      }
      start = _limitValue(start, 0, pointCount - 1);
    }
    if (maxDefined) {
      let end = Math.max(
        // @ts-expect-error Need to type _parsed
        _lookupByKey(_parsed, iScale.axis, max, true).hi + 1,
        // @ts-expect-error Need to fix types on _lookupByKey
        animationsDisabled ? 0 : _lookupByKey(points, axis, iScale.getPixelForValue(max), true).hi + 1
      );
      if (spanGaps) {
        const distanceToDefinedHi = _parsed.slice(end - 1).findIndex((point) => !isNullOrUndef(point[vScale.axis]));
        end += Math.max(0, distanceToDefinedHi);
      }
      count = _limitValue(end, start, pointCount) - start;
    } else {
      count = pointCount - start;
    }
  }
  return {
    start,
    count
  };
}
function _scaleRangesChanged(meta) {
  const { xScale, yScale, _scaleRanges } = meta;
  const newRanges = {
    xmin: xScale.min,
    xmax: xScale.max,
    ymin: yScale.min,
    ymax: yScale.max
  };
  if (!_scaleRanges) {
    meta._scaleRanges = newRanges;
    return true;
  }
  const changed = _scaleRanges.xmin !== xScale.min || _scaleRanges.xmax !== xScale.max || _scaleRanges.ymin !== yScale.min || _scaleRanges.ymax !== yScale.max;
  Object.assign(_scaleRanges, newRanges);
  return changed;
}
var atEdge = (t) => t === 0 || t === 1;
var elasticIn = (t, s, p) => -(Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * TAU / p));
var elasticOut = (t, s, p) => Math.pow(2, -10 * t) * Math.sin((t - s) * TAU / p) + 1;
var effects = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => -t * (t - 2),
  easeInOutQuad: (t) => (t /= 0.5) < 1 ? 0.5 * t * t : -0.5 * (--t * (t - 2) - 1),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (t -= 1) * t * t + 1,
  easeInOutCubic: (t) => (t /= 0.5) < 1 ? 0.5 * t * t * t : 0.5 * ((t -= 2) * t * t + 2),
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => -((t -= 1) * t * t * t - 1),
  easeInOutQuart: (t) => (t /= 0.5) < 1 ? 0.5 * t * t * t * t : -0.5 * ((t -= 2) * t * t * t - 2),
  easeInQuint: (t) => t * t * t * t * t,
  easeOutQuint: (t) => (t -= 1) * t * t * t * t + 1,
  easeInOutQuint: (t) => (t /= 0.5) < 1 ? 0.5 * t * t * t * t * t : 0.5 * ((t -= 2) * t * t * t * t + 2),
  easeInSine: (t) => -Math.cos(t * HALF_PI) + 1,
  easeOutSine: (t) => Math.sin(t * HALF_PI),
  easeInOutSine: (t) => -0.5 * (Math.cos(PI * t) - 1),
  easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: (t) => t === 1 ? 1 : -Math.pow(2, -10 * t) + 1,
  easeInOutExpo: (t) => atEdge(t) ? t : t < 0.5 ? 0.5 * Math.pow(2, 10 * (t * 2 - 1)) : 0.5 * (-Math.pow(2, -10 * (t * 2 - 1)) + 2),
  easeInCirc: (t) => t >= 1 ? t : -(Math.sqrt(1 - t * t) - 1),
  easeOutCirc: (t) => Math.sqrt(1 - (t -= 1) * t),
  easeInOutCirc: (t) => (t /= 0.5) < 1 ? -0.5 * (Math.sqrt(1 - t * t) - 1) : 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1),
  easeInElastic: (t) => atEdge(t) ? t : elasticIn(t, 0.075, 0.3),
  easeOutElastic: (t) => atEdge(t) ? t : elasticOut(t, 0.075, 0.3),
  easeInOutElastic(t) {
    const s = 0.1125;
    const p = 0.45;
    return atEdge(t) ? t : t < 0.5 ? 0.5 * elasticIn(t * 2, s, p) : 0.5 + 0.5 * elasticOut(t * 2 - 1, s, p);
  },
  easeInBack(t) {
    const s = 1.70158;
    return t * t * ((s + 1) * t - s);
  },
  easeOutBack(t) {
    const s = 1.70158;
    return (t -= 1) * t * ((s + 1) * t + s) + 1;
  },
  easeInOutBack(t) {
    let s = 1.70158;
    if ((t /= 0.5) < 1) {
      return 0.5 * (t * t * (((s *= 1.525) + 1) * t - s));
    }
    return 0.5 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2);
  },
  easeInBounce: (t) => 1 - effects.easeOutBounce(1 - t),
  easeOutBounce(t) {
    const m = 7.5625;
    const d = 2.75;
    if (t < 1 / d) {
      return m * t * t;
    }
    if (t < 2 / d) {
      return m * (t -= 1.5 / d) * t + 0.75;
    }
    if (t < 2.5 / d) {
      return m * (t -= 2.25 / d) * t + 0.9375;
    }
    return m * (t -= 2.625 / d) * t + 0.984375;
  },
  easeInOutBounce: (t) => t < 0.5 ? effects.easeInBounce(t * 2) * 0.5 : effects.easeOutBounce(t * 2 - 1) * 0.5 + 0.5
};
function isPatternOrGradient(value) {
  if (value && typeof value === "object") {
    const type = value.toString();
    return type === "[object CanvasPattern]" || type === "[object CanvasGradient]";
  }
  return false;
}
function color(value) {
  return isPatternOrGradient(value) ? value : new Color(value);
}
function getHoverColor(value) {
  return isPatternOrGradient(value) ? value : new Color(value).saturate(0.5).darken(0.1).hexString();
}
var numbers = [
  "x",
  "y",
  "borderWidth",
  "radius",
  "tension"
];
var colors = [
  "color",
  "borderColor",
  "backgroundColor"
];
function applyAnimationsDefaults(defaults2) {
  defaults2.set("animation", {
    delay: void 0,
    duration: 1e3,
    easing: "easeOutQuart",
    fn: void 0,
    from: void 0,
    loop: void 0,
    to: void 0,
    type: void 0
  });
  defaults2.describe("animation", {
    _fallback: false,
    _indexable: false,
    _scriptable: (name) => name !== "onProgress" && name !== "onComplete" && name !== "fn"
  });
  defaults2.set("animations", {
    colors: {
      type: "color",
      properties: colors
    },
    numbers: {
      type: "number",
      properties: numbers
    }
  });
  defaults2.describe("animations", {
    _fallback: "animation"
  });
  defaults2.set("transitions", {
    active: {
      animation: {
        duration: 400
      }
    },
    resize: {
      animation: {
        duration: 0
      }
    },
    show: {
      animations: {
        colors: {
          from: "transparent"
        },
        visible: {
          type: "boolean",
          duration: 0
        }
      }
    },
    hide: {
      animations: {
        colors: {
          to: "transparent"
        },
        visible: {
          type: "boolean",
          easing: "linear",
          fn: (v) => v | 0
        }
      }
    }
  });
}
function applyLayoutsDefaults(defaults2) {
  defaults2.set("layout", {
    autoPadding: true,
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  });
}
var intlCache = /* @__PURE__ */ new Map();
function getNumberFormat(locale, options) {
  options = options || {};
  const cacheKey = locale + JSON.stringify(options);
  let formatter = intlCache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    intlCache.set(cacheKey, formatter);
  }
  return formatter;
}
function formatNumber(num, locale, options) {
  return getNumberFormat(locale, options).format(num);
}
var formatters = {
  values(value) {
    return isArray(value) ? value : "" + value;
  },
  numeric(tickValue, index, ticks) {
    if (tickValue === 0) {
      return "0";
    }
    const locale = this.chart.options.locale;
    let notation;
    let delta = tickValue;
    if (ticks.length > 1) {
      const maxTick = Math.max(Math.abs(ticks[0].value), Math.abs(ticks[ticks.length - 1].value));
      if (maxTick < 1e-4 || maxTick > 1e15) {
        notation = "scientific";
      }
      delta = calculateDelta(tickValue, ticks);
    }
    const logDelta = log10(Math.abs(delta));
    const numDecimal = isNaN(logDelta) ? 1 : Math.max(Math.min(-1 * Math.floor(logDelta), 20), 0);
    const options = {
      notation,
      minimumFractionDigits: numDecimal,
      maximumFractionDigits: numDecimal
    };
    Object.assign(options, this.options.ticks.format);
    return formatNumber(tickValue, locale, options);
  },
  logarithmic(tickValue, index, ticks) {
    if (tickValue === 0) {
      return "0";
    }
    const remain = ticks[index].significand || tickValue / Math.pow(10, Math.floor(log10(tickValue)));
    if ([
      1,
      2,
      3,
      5,
      10,
      15
    ].includes(remain) || index > 0.8 * ticks.length) {
      return formatters.numeric.call(this, tickValue, index, ticks);
    }
    return "";
  }
};
function calculateDelta(tickValue, ticks) {
  let delta = ticks.length > 3 ? ticks[2].value - ticks[1].value : ticks[1].value - ticks[0].value;
  if (Math.abs(delta) >= 1 && tickValue !== Math.floor(tickValue)) {
    delta = tickValue - Math.floor(tickValue);
  }
  return delta;
}
var Ticks = {
  formatters
};
function applyScaleDefaults(defaults2) {
  defaults2.set("scale", {
    display: true,
    offset: false,
    reverse: false,
    beginAtZero: false,
    bounds: "ticks",
    clip: true,
    grace: 0,
    grid: {
      display: true,
      lineWidth: 1,
      drawOnChartArea: true,
      drawTicks: true,
      tickLength: 8,
      tickWidth: (_ctx, options) => options.lineWidth,
      tickColor: (_ctx, options) => options.color,
      offset: false
    },
    border: {
      display: true,
      dash: [],
      dashOffset: 0,
      width: 1
    },
    title: {
      display: false,
      text: "",
      padding: {
        top: 4,
        bottom: 4
      }
    },
    ticks: {
      minRotation: 0,
      maxRotation: 50,
      mirror: false,
      textStrokeWidth: 0,
      textStrokeColor: "",
      padding: 3,
      display: true,
      autoSkip: true,
      autoSkipPadding: 3,
      labelOffset: 0,
      callback: Ticks.formatters.values,
      minor: {},
      major: {},
      align: "center",
      crossAlign: "near",
      showLabelBackdrop: false,
      backdropColor: "rgba(255, 255, 255, 0.75)",
      backdropPadding: 2
    }
  });
  defaults2.route("scale.ticks", "color", "", "color");
  defaults2.route("scale.grid", "color", "", "borderColor");
  defaults2.route("scale.border", "color", "", "borderColor");
  defaults2.route("scale.title", "color", "", "color");
  defaults2.describe("scale", {
    _fallback: false,
    _scriptable: (name) => !name.startsWith("before") && !name.startsWith("after") && name !== "callback" && name !== "parser",
    _indexable: (name) => name !== "borderDash" && name !== "tickBorderDash" && name !== "dash"
  });
  defaults2.describe("scales", {
    _fallback: "scale"
  });
  defaults2.describe("scale.ticks", {
    _scriptable: (name) => name !== "backdropPadding" && name !== "callback",
    _indexable: (name) => name !== "backdropPadding"
  });
}
var overrides = /* @__PURE__ */ Object.create(null);
var descriptors = /* @__PURE__ */ Object.create(null);
function getScope$1(node, key) {
  if (!key) {
    return node;
  }
  const keys = key.split(".");
  for (let i = 0, n = keys.length; i < n; ++i) {
    const k = keys[i];
    node = node[k] || (node[k] = /* @__PURE__ */ Object.create(null));
  }
  return node;
}
function set(root, scope, values) {
  if (typeof scope === "string") {
    return merge(getScope$1(root, scope), values);
  }
  return merge(getScope$1(root, ""), scope);
}
var Defaults = class {
  constructor(_descriptors2, _appliers) {
    this.animation = void 0;
    this.backgroundColor = "rgba(0,0,0,0.1)";
    this.borderColor = "rgba(0,0,0,0.1)";
    this.color = "#666";
    this.datasets = {};
    this.devicePixelRatio = (context) => context.chart.platform.getDevicePixelRatio();
    this.elements = {};
    this.events = [
      "mousemove",
      "mouseout",
      "click",
      "touchstart",
      "touchmove"
    ];
    this.font = {
      family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
      size: 12,
      style: "normal",
      lineHeight: 1.2,
      weight: null
    };
    this.hover = {};
    this.hoverBackgroundColor = (ctx, options) => getHoverColor(options.backgroundColor);
    this.hoverBorderColor = (ctx, options) => getHoverColor(options.borderColor);
    this.hoverColor = (ctx, options) => getHoverColor(options.color);
    this.indexAxis = "x";
    this.interaction = {
      mode: "nearest",
      intersect: true,
      includeInvisible: false
    };
    this.maintainAspectRatio = true;
    this.onHover = null;
    this.onClick = null;
    this.parsing = true;
    this.plugins = {};
    this.responsive = true;
    this.scale = void 0;
    this.scales = {};
    this.showLine = true;
    this.drawActiveElementsOnTop = true;
    this.describe(_descriptors2);
    this.apply(_appliers);
  }
  set(scope, values) {
    return set(this, scope, values);
  }
  get(scope) {
    return getScope$1(this, scope);
  }
  describe(scope, values) {
    return set(descriptors, scope, values);
  }
  override(scope, values) {
    return set(overrides, scope, values);
  }
  route(scope, name, targetScope, targetName) {
    const scopeObject = getScope$1(this, scope);
    const targetScopeObject = getScope$1(this, targetScope);
    const privateName = "_" + name;
    Object.defineProperties(scopeObject, {
      [privateName]: {
        value: scopeObject[name],
        writable: true
      },
      [name]: {
        enumerable: true,
        get() {
          const local = this[privateName];
          const target = targetScopeObject[targetName];
          if (isObject(local)) {
            return Object.assign({}, target, local);
          }
          return valueOrDefault(local, target);
        },
        set(value) {
          this[privateName] = value;
        }
      }
    });
  }
  apply(appliers) {
    appliers.forEach((apply) => apply(this));
  }
};
var defaults = /* @__PURE__ */ new Defaults({
  _scriptable: (name) => !name.startsWith("on"),
  _indexable: (name) => name !== "events",
  hover: {
    _fallback: "interaction"
  },
  interaction: {
    _scriptable: false,
    _indexable: false
  }
}, [
  applyAnimationsDefaults,
  applyLayoutsDefaults,
  applyScaleDefaults
]);
function toFontString(font) {
  if (!font || isNullOrUndef(font.size) || isNullOrUndef(font.family)) {
    return null;
  }
  return (font.style ? font.style + " " : "") + (font.weight ? font.weight + " " : "") + font.size + "px " + font.family;
}
function _measureText(ctx, data, gc, longest, string) {
  let textWidth = data[string];
  if (!textWidth) {
    textWidth = data[string] = ctx.measureText(string).width;
    gc.push(string);
  }
  if (textWidth > longest) {
    longest = textWidth;
  }
  return longest;
}
function _longestText(ctx, font, arrayOfThings, cache) {
  cache = cache || {};
  let data = cache.data = cache.data || {};
  let gc = cache.garbageCollect = cache.garbageCollect || [];
  if (cache.font !== font) {
    data = cache.data = {};
    gc = cache.garbageCollect = [];
    cache.font = font;
  }
  ctx.save();
  ctx.font = font;
  let longest = 0;
  const ilen = arrayOfThings.length;
  let i, j, jlen, thing, nestedThing;
  for (i = 0; i < ilen; i++) {
    thing = arrayOfThings[i];
    if (thing !== void 0 && thing !== null && !isArray(thing)) {
      longest = _measureText(ctx, data, gc, longest, thing);
    } else if (isArray(thing)) {
      for (j = 0, jlen = thing.length; j < jlen; j++) {
        nestedThing = thing[j];
        if (nestedThing !== void 0 && nestedThing !== null && !isArray(nestedThing)) {
          longest = _measureText(ctx, data, gc, longest, nestedThing);
        }
      }
    }
  }
  ctx.restore();
  const gcLen = gc.length / 2;
  if (gcLen > arrayOfThings.length) {
    for (i = 0; i < gcLen; i++) {
      delete data[gc[i]];
    }
    gc.splice(0, gcLen);
  }
  return longest;
}
function _alignPixel(chart, pixel, width) {
  const devicePixelRatio = chart.currentDevicePixelRatio;
  const halfWidth = width !== 0 ? Math.max(width / 2, 0.5) : 0;
  return Math.round((pixel - halfWidth) * devicePixelRatio) / devicePixelRatio + halfWidth;
}
function clearCanvas(canvas, ctx) {
  if (!ctx && !canvas) {
    return;
  }
  ctx = ctx || canvas.getContext("2d");
  ctx.save();
  ctx.resetTransform();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}
function drawPoint(ctx, options, x, y) {
  drawPointLegend(ctx, options, x, y, null);
}
function drawPointLegend(ctx, options, x, y, w) {
  let type, xOffset, yOffset, size, cornerRadius, width, xOffsetW, yOffsetW;
  const style = options.pointStyle;
  const rotation = options.rotation;
  const radius = options.radius;
  let rad = (rotation || 0) * RAD_PER_DEG;
  if (style && typeof style === "object") {
    type = style.toString();
    if (type === "[object HTMLImageElement]" || type === "[object HTMLCanvasElement]") {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rad);
      ctx.drawImage(style, -style.width / 2, -style.height / 2, style.width, style.height);
      ctx.restore();
      return;
    }
  }
  if (isNaN(radius) || radius <= 0) {
    return;
  }
  ctx.beginPath();
  switch (style) {
    default:
      if (w) {
        ctx.ellipse(x, y, w / 2, radius, 0, 0, TAU);
      } else {
        ctx.arc(x, y, radius, 0, TAU);
      }
      ctx.closePath();
      break;
    case "triangle":
      width = w ? w / 2 : radius;
      ctx.moveTo(x + Math.sin(rad) * width, y - Math.cos(rad) * radius);
      rad += TWO_THIRDS_PI;
      ctx.lineTo(x + Math.sin(rad) * width, y - Math.cos(rad) * radius);
      rad += TWO_THIRDS_PI;
      ctx.lineTo(x + Math.sin(rad) * width, y - Math.cos(rad) * radius);
      ctx.closePath();
      break;
    case "rectRounded":
      cornerRadius = radius * 0.516;
      size = radius - cornerRadius;
      xOffset = Math.cos(rad + QUARTER_PI) * size;
      xOffsetW = Math.cos(rad + QUARTER_PI) * (w ? w / 2 - cornerRadius : size);
      yOffset = Math.sin(rad + QUARTER_PI) * size;
      yOffsetW = Math.sin(rad + QUARTER_PI) * (w ? w / 2 - cornerRadius : size);
      ctx.arc(x - xOffsetW, y - yOffset, cornerRadius, rad - PI, rad - HALF_PI);
      ctx.arc(x + yOffsetW, y - xOffset, cornerRadius, rad - HALF_PI, rad);
      ctx.arc(x + xOffsetW, y + yOffset, cornerRadius, rad, rad + HALF_PI);
      ctx.arc(x - yOffsetW, y + xOffset, cornerRadius, rad + HALF_PI, rad + PI);
      ctx.closePath();
      break;
    case "rect":
      if (!rotation) {
        size = Math.SQRT1_2 * radius;
        width = w ? w / 2 : size;
        ctx.rect(x - width, y - size, 2 * width, 2 * size);
        break;
      }
      rad += QUARTER_PI;
    case "rectRot":
      xOffsetW = Math.cos(rad) * (w ? w / 2 : radius);
      xOffset = Math.cos(rad) * radius;
      yOffset = Math.sin(rad) * radius;
      yOffsetW = Math.sin(rad) * (w ? w / 2 : radius);
      ctx.moveTo(x - xOffsetW, y - yOffset);
      ctx.lineTo(x + yOffsetW, y - xOffset);
      ctx.lineTo(x + xOffsetW, y + yOffset);
      ctx.lineTo(x - yOffsetW, y + xOffset);
      ctx.closePath();
      break;
    case "crossRot":
      rad += QUARTER_PI;
    case "cross":
      xOffsetW = Math.cos(rad) * (w ? w / 2 : radius);
      xOffset = Math.cos(rad) * radius;
      yOffset = Math.sin(rad) * radius;
      yOffsetW = Math.sin(rad) * (w ? w / 2 : radius);
      ctx.moveTo(x - xOffsetW, y - yOffset);
      ctx.lineTo(x + xOffsetW, y + yOffset);
      ctx.moveTo(x + yOffsetW, y - xOffset);
      ctx.lineTo(x - yOffsetW, y + xOffset);
      break;
    case "star":
      xOffsetW = Math.cos(rad) * (w ? w / 2 : radius);
      xOffset = Math.cos(rad) * radius;
      yOffset = Math.sin(rad) * radius;
      yOffsetW = Math.sin(rad) * (w ? w / 2 : radius);
      ctx.moveTo(x - xOffsetW, y - yOffset);
      ctx.lineTo(x + xOffsetW, y + yOffset);
      ctx.moveTo(x + yOffsetW, y - xOffset);
      ctx.lineTo(x - yOffsetW, y + xOffset);
      rad += QUARTER_PI;
      xOffsetW = Math.cos(rad) * (w ? w / 2 : radius);
      xOffset = Math.cos(rad) * radius;
      yOffset = Math.sin(rad) * radius;
      yOffsetW = Math.sin(rad) * (w ? w / 2 : radius);
      ctx.moveTo(x - xOffsetW, y - yOffset);
      ctx.lineTo(x + xOffsetW, y + yOffset);
      ctx.moveTo(x + yOffsetW, y - xOffset);
      ctx.lineTo(x - yOffsetW, y + xOffset);
      break;
    case "line":
      xOffset = w ? w / 2 : Math.cos(rad) * radius;
      yOffset = Math.sin(rad) * radius;
      ctx.moveTo(x - xOffset, y - yOffset);
      ctx.lineTo(x + xOffset, y + yOffset);
      break;
    case "dash":
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(rad) * (w ? w / 2 : radius), y + Math.sin(rad) * radius);
      break;
    case false:
      ctx.closePath();
      break;
  }
  ctx.fill();
  if (options.borderWidth > 0) {
    ctx.stroke();
  }
}
function _isPointInArea(point, area, margin) {
  margin = margin || 0.5;
  return !area || point && point.x > area.left - margin && point.x < area.right + margin && point.y > area.top - margin && point.y < area.bottom + margin;
}
function clipArea(ctx, area) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(area.left, area.top, area.right - area.left, area.bottom - area.top);
  ctx.clip();
}
function unclipArea(ctx) {
  ctx.restore();
}
function _steppedLineTo(ctx, previous, target, flip, mode) {
  if (!previous) {
    return ctx.lineTo(target.x, target.y);
  }
  if (mode === "middle") {
    const midpoint = (previous.x + target.x) / 2;
    ctx.lineTo(midpoint, previous.y);
    ctx.lineTo(midpoint, target.y);
  } else if (mode === "after" !== !!flip) {
    ctx.lineTo(previous.x, target.y);
  } else {
    ctx.lineTo(target.x, previous.y);
  }
  ctx.lineTo(target.x, target.y);
}
function _bezierCurveTo(ctx, previous, target, flip) {
  if (!previous) {
    return ctx.lineTo(target.x, target.y);
  }
  ctx.bezierCurveTo(flip ? previous.cp1x : previous.cp2x, flip ? previous.cp1y : previous.cp2y, flip ? target.cp2x : target.cp1x, flip ? target.cp2y : target.cp1y, target.x, target.y);
}
function setRenderOpts(ctx, opts) {
  if (opts.translation) {
    ctx.translate(opts.translation[0], opts.translation[1]);
  }
  if (!isNullOrUndef(opts.rotation)) {
    ctx.rotate(opts.rotation);
  }
  if (opts.color) {
    ctx.fillStyle = opts.color;
  }
  if (opts.textAlign) {
    ctx.textAlign = opts.textAlign;
  }
  if (opts.textBaseline) {
    ctx.textBaseline = opts.textBaseline;
  }
}
function decorateText(ctx, x, y, line, opts) {
  if (opts.strikethrough || opts.underline) {
    const metrics = ctx.measureText(line);
    const left = x - metrics.actualBoundingBoxLeft;
    const right = x + metrics.actualBoundingBoxRight;
    const top = y - metrics.actualBoundingBoxAscent;
    const bottom = y + metrics.actualBoundingBoxDescent;
    const yDecoration = opts.strikethrough ? (top + bottom) / 2 : bottom;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.lineWidth = opts.decorationWidth || 2;
    ctx.moveTo(left, yDecoration);
    ctx.lineTo(right, yDecoration);
    ctx.stroke();
  }
}
function drawBackdrop(ctx, opts) {
  const oldColor = ctx.fillStyle;
  ctx.fillStyle = opts.color;
  ctx.fillRect(opts.left, opts.top, opts.width, opts.height);
  ctx.fillStyle = oldColor;
}
function renderText(ctx, text, x, y, font, opts = {}) {
  const lines = isArray(text) ? text : [
    text
  ];
  const stroke = opts.strokeWidth > 0 && opts.strokeColor !== "";
  let i, line;
  ctx.save();
  ctx.font = font.string;
  setRenderOpts(ctx, opts);
  for (i = 0; i < lines.length; ++i) {
    line = lines[i];
    if (opts.backdrop) {
      drawBackdrop(ctx, opts.backdrop);
    }
    if (stroke) {
      if (opts.strokeColor) {
        ctx.strokeStyle = opts.strokeColor;
      }
      if (!isNullOrUndef(opts.strokeWidth)) {
        ctx.lineWidth = opts.strokeWidth;
      }
      ctx.strokeText(line, x, y, opts.maxWidth);
    }
    ctx.fillText(line, x, y, opts.maxWidth);
    decorateText(ctx, x, y, line, opts);
    y += Number(font.lineHeight);
  }
  ctx.restore();
}
function addRoundedRectPath(ctx, rect) {
  const { x, y, w, h, radius } = rect;
  ctx.arc(x + radius.topLeft, y + radius.topLeft, radius.topLeft, 1.5 * PI, PI, true);
  ctx.lineTo(x, y + h - radius.bottomLeft);
  ctx.arc(x + radius.bottomLeft, y + h - radius.bottomLeft, radius.bottomLeft, PI, HALF_PI, true);
  ctx.lineTo(x + w - radius.bottomRight, y + h);
  ctx.arc(x + w - radius.bottomRight, y + h - radius.bottomRight, radius.bottomRight, HALF_PI, 0, true);
  ctx.lineTo(x + w, y + radius.topRight);
  ctx.arc(x + w - radius.topRight, y + radius.topRight, radius.topRight, 0, -HALF_PI, true);
  ctx.lineTo(x + radius.topLeft, y);
}
var LINE_HEIGHT = /^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/;
var FONT_STYLE = /^(normal|italic|initial|inherit|unset|(oblique( -?[0-9]?[0-9]deg)?))$/;
function toLineHeight(value, size) {
  const matches = ("" + value).match(LINE_HEIGHT);
  if (!matches || matches[1] === "normal") {
    return size * 1.2;
  }
  value = +matches[2];
  switch (matches[3]) {
    case "px":
      return value;
    case "%":
      value /= 100;
      break;
  }
  return size * value;
}
var numberOrZero = (v) => +v || 0;
function _readValueToProps(value, props) {
  const ret = {};
  const objProps = isObject(props);
  const keys = objProps ? Object.keys(props) : props;
  const read = isObject(value) ? objProps ? (prop) => valueOrDefault(value[prop], value[props[prop]]) : (prop) => value[prop] : () => value;
  for (const prop of keys) {
    ret[prop] = numberOrZero(read(prop));
  }
  return ret;
}
function toTRBL(value) {
  return _readValueToProps(value, {
    top: "y",
    right: "x",
    bottom: "y",
    left: "x"
  });
}
function toTRBLCorners(value) {
  return _readValueToProps(value, [
    "topLeft",
    "topRight",
    "bottomLeft",
    "bottomRight"
  ]);
}
function toPadding(value) {
  const obj = toTRBL(value);
  obj.width = obj.left + obj.right;
  obj.height = obj.top + obj.bottom;
  return obj;
}
function toFont(options, fallback) {
  options = options || {};
  fallback = fallback || defaults.font;
  let size = valueOrDefault(options.size, fallback.size);
  if (typeof size === "string") {
    size = parseInt(size, 10);
  }
  let style = valueOrDefault(options.style, fallback.style);
  if (style && !("" + style).match(FONT_STYLE)) {
    console.warn('Invalid font style specified: "' + style + '"');
    style = void 0;
  }
  const font = {
    family: valueOrDefault(options.family, fallback.family),
    lineHeight: toLineHeight(valueOrDefault(options.lineHeight, fallback.lineHeight), size),
    size,
    style,
    weight: valueOrDefault(options.weight, fallback.weight),
    string: ""
  };
  font.string = toFontString(font);
  return font;
}
function resolve(inputs, context, index, info) {
  let cacheable = true;
  let i, ilen, value;
  for (i = 0, ilen = inputs.length; i < ilen; ++i) {
    value = inputs[i];
    if (value === void 0) {
      continue;
    }
    if (context !== void 0 && typeof value === "function") {
      value = value(context);
      cacheable = false;
    }
    if (index !== void 0 && isArray(value)) {
      value = value[index % value.length];
      cacheable = false;
    }
    if (value !== void 0) {
      if (info && !cacheable) {
        info.cacheable = false;
      }
      return value;
    }
  }
}
function _addGrace(minmax, grace, beginAtZero) {
  const { min, max } = minmax;
  const change = toDimension(grace, (max - min) / 2);
  const keepZero = (value, add) => beginAtZero && value === 0 ? 0 : value + add;
  return {
    min: keepZero(min, -Math.abs(change)),
    max: keepZero(max, change)
  };
}
function createContext(parentContext, context) {
  return Object.assign(Object.create(parentContext), context);
}
function _createResolver(scopes, prefixes = [
  ""
], rootScopes, fallback, getTarget = () => scopes[0]) {
  const finalRootScopes = rootScopes || scopes;
  if (typeof fallback === "undefined") {
    fallback = _resolve("_fallback", scopes);
  }
  const cache = {
    [Symbol.toStringTag]: "Object",
    _cacheable: true,
    _scopes: scopes,
    _rootScopes: finalRootScopes,
    _fallback: fallback,
    _getTarget: getTarget,
    override: (scope) => _createResolver([
      scope,
      ...scopes
    ], prefixes, finalRootScopes, fallback)
  };
  return new Proxy(cache, {
    /**
    * A trap for the delete operator.
    */
    deleteProperty(target, prop) {
      delete target[prop];
      delete target._keys;
      delete scopes[0][prop];
      return true;
    },
    /**
    * A trap for getting property values.
    */
    get(target, prop) {
      return _cached(target, prop, () => _resolveWithPrefixes(prop, prefixes, scopes, target));
    },
    /**
    * A trap for Object.getOwnPropertyDescriptor.
    * Also used by Object.hasOwnProperty.
    */
    getOwnPropertyDescriptor(target, prop) {
      return Reflect.getOwnPropertyDescriptor(target._scopes[0], prop);
    },
    /**
    * A trap for Object.getPrototypeOf.
    */
    getPrototypeOf() {
      return Reflect.getPrototypeOf(scopes[0]);
    },
    /**
    * A trap for the in operator.
    */
    has(target, prop) {
      return getKeysFromAllScopes(target).includes(prop);
    },
    /**
    * A trap for Object.getOwnPropertyNames and Object.getOwnPropertySymbols.
    */
    ownKeys(target) {
      return getKeysFromAllScopes(target);
    },
    /**
    * A trap for setting property values.
    */
    set(target, prop, value) {
      const storage = target._storage || (target._storage = getTarget());
      target[prop] = storage[prop] = value;
      delete target._keys;
      return true;
    }
  });
}
function _attachContext(proxy, context, subProxy, descriptorDefaults) {
  const cache = {
    _cacheable: false,
    _proxy: proxy,
    _context: context,
    _subProxy: subProxy,
    _stack: /* @__PURE__ */ new Set(),
    _descriptors: _descriptors(proxy, descriptorDefaults),
    setContext: (ctx) => _attachContext(proxy, ctx, subProxy, descriptorDefaults),
    override: (scope) => _attachContext(proxy.override(scope), context, subProxy, descriptorDefaults)
  };
  return new Proxy(cache, {
    /**
    * A trap for the delete operator.
    */
    deleteProperty(target, prop) {
      delete target[prop];
      delete proxy[prop];
      return true;
    },
    /**
    * A trap for getting property values.
    */
    get(target, prop, receiver) {
      return _cached(target, prop, () => _resolveWithContext(target, prop, receiver));
    },
    /**
    * A trap for Object.getOwnPropertyDescriptor.
    * Also used by Object.hasOwnProperty.
    */
    getOwnPropertyDescriptor(target, prop) {
      return target._descriptors.allKeys ? Reflect.has(proxy, prop) ? {
        enumerable: true,
        configurable: true
      } : void 0 : Reflect.getOwnPropertyDescriptor(proxy, prop);
    },
    /**
    * A trap for Object.getPrototypeOf.
    */
    getPrototypeOf() {
      return Reflect.getPrototypeOf(proxy);
    },
    /**
    * A trap for the in operator.
    */
    has(target, prop) {
      return Reflect.has(proxy, prop);
    },
    /**
    * A trap for Object.getOwnPropertyNames and Object.getOwnPropertySymbols.
    */
    ownKeys() {
      return Reflect.ownKeys(proxy);
    },
    /**
    * A trap for setting property values.
    */
    set(target, prop, value) {
      proxy[prop] = value;
      delete target[prop];
      return true;
    }
  });
}
function _descriptors(proxy, defaults2 = {
  scriptable: true,
  indexable: true
}) {
  const { _scriptable = defaults2.scriptable, _indexable = defaults2.indexable, _allKeys = defaults2.allKeys } = proxy;
  return {
    allKeys: _allKeys,
    scriptable: _scriptable,
    indexable: _indexable,
    isScriptable: isFunction(_scriptable) ? _scriptable : () => _scriptable,
    isIndexable: isFunction(_indexable) ? _indexable : () => _indexable
  };
}
var readKey = (prefix, name) => prefix ? prefix + _capitalize(name) : name;
var needsSubResolver = (prop, value) => isObject(value) && prop !== "adapters" && (Object.getPrototypeOf(value) === null || value.constructor === Object);
function _cached(target, prop, resolve2) {
  if (Object.prototype.hasOwnProperty.call(target, prop) || prop === "constructor") {
    return target[prop];
  }
  const value = resolve2();
  target[prop] = value;
  return value;
}
function _resolveWithContext(target, prop, receiver) {
  const { _proxy, _context, _subProxy, _descriptors: descriptors2 } = target;
  let value = _proxy[prop];
  if (isFunction(value) && descriptors2.isScriptable(prop)) {
    value = _resolveScriptable(prop, value, target, receiver);
  }
  if (isArray(value) && value.length) {
    value = _resolveArray(prop, value, target, descriptors2.isIndexable);
  }
  if (needsSubResolver(prop, value)) {
    value = _attachContext(value, _context, _subProxy && _subProxy[prop], descriptors2);
  }
  return value;
}
function _resolveScriptable(prop, getValue, target, receiver) {
  const { _proxy, _context, _subProxy, _stack } = target;
  if (_stack.has(prop)) {
    throw new Error("Recursion detected: " + Array.from(_stack).join("->") + "->" + prop);
  }
  _stack.add(prop);
  let value = getValue(_context, _subProxy || receiver);
  _stack.delete(prop);
  if (needsSubResolver(prop, value)) {
    value = createSubResolver(_proxy._scopes, _proxy, prop, value);
  }
  return value;
}
function _resolveArray(prop, value, target, isIndexable) {
  const { _proxy, _context, _subProxy, _descriptors: descriptors2 } = target;
  if (typeof _context.index !== "undefined" && isIndexable(prop)) {
    return value[_context.index % value.length];
  } else if (isObject(value[0])) {
    const arr = value;
    const scopes = _proxy._scopes.filter((s) => s !== arr);
    value = [];
    for (const item of arr) {
      const resolver = createSubResolver(scopes, _proxy, prop, item);
      value.push(_attachContext(resolver, _context, _subProxy && _subProxy[prop], descriptors2));
    }
  }
  return value;
}
function resolveFallback(fallback, prop, value) {
  return isFunction(fallback) ? fallback(prop, value) : fallback;
}
var getScope = (key, parent) => key === true ? parent : typeof key === "string" ? resolveObjectKey(parent, key) : void 0;
function addScopes(set2, parentScopes, key, parentFallback, value) {
  for (const parent of parentScopes) {
    const scope = getScope(key, parent);
    if (scope) {
      set2.add(scope);
      const fallback = resolveFallback(scope._fallback, key, value);
      if (typeof fallback !== "undefined" && fallback !== key && fallback !== parentFallback) {
        return fallback;
      }
    } else if (scope === false && typeof parentFallback !== "undefined" && key !== parentFallback) {
      return null;
    }
  }
  return false;
}
function createSubResolver(parentScopes, resolver, prop, value) {
  const rootScopes = resolver._rootScopes;
  const fallback = resolveFallback(resolver._fallback, prop, value);
  const allScopes = [
    ...parentScopes,
    ...rootScopes
  ];
  const set2 = /* @__PURE__ */ new Set();
  set2.add(value);
  let key = addScopesFromKey(set2, allScopes, prop, fallback || prop, value);
  if (key === null) {
    return false;
  }
  if (typeof fallback !== "undefined" && fallback !== prop) {
    key = addScopesFromKey(set2, allScopes, fallback, key, value);
    if (key === null) {
      return false;
    }
  }
  return _createResolver(Array.from(set2), [
    ""
  ], rootScopes, fallback, () => subGetTarget(resolver, prop, value));
}
function addScopesFromKey(set2, allScopes, key, fallback, item) {
  while (key) {
    key = addScopes(set2, allScopes, key, fallback, item);
  }
  return key;
}
function subGetTarget(resolver, prop, value) {
  const parent = resolver._getTarget();
  if (!(prop in parent)) {
    parent[prop] = {};
  }
  const target = parent[prop];
  if (isArray(target) && isObject(value)) {
    return value;
  }
  return target || {};
}
function _resolveWithPrefixes(prop, prefixes, scopes, proxy) {
  let value;
  for (const prefix of prefixes) {
    value = _resolve(readKey(prefix, prop), scopes);
    if (typeof value !== "undefined") {
      return needsSubResolver(prop, value) ? createSubResolver(scopes, proxy, prop, value) : value;
    }
  }
}
function _resolve(key, scopes) {
  for (const scope of scopes) {
    if (!scope) {
      continue;
    }
    const value = scope[key];
    if (typeof value !== "undefined") {
      return value;
    }
  }
}
function getKeysFromAllScopes(target) {
  let keys = target._keys;
  if (!keys) {
    keys = target._keys = resolveKeysFromAllScopes(target._scopes);
  }
  return keys;
}
function resolveKeysFromAllScopes(scopes) {
  const set2 = /* @__PURE__ */ new Set();
  for (const scope of scopes) {
    for (const key of Object.keys(scope).filter((k) => !k.startsWith("_"))) {
      set2.add(key);
    }
  }
  return Array.from(set2);
}
var EPSILON = Number.EPSILON || 1e-14;
var getPoint = (points, i) => i < points.length && !points[i].skip && points[i];
var getValueAxis = (indexAxis) => indexAxis === "x" ? "y" : "x";
function splineCurve(firstPoint, middlePoint, afterPoint, t) {
  const previous = firstPoint.skip ? middlePoint : firstPoint;
  const current = middlePoint;
  const next = afterPoint.skip ? middlePoint : afterPoint;
  const d01 = distanceBetweenPoints(current, previous);
  const d12 = distanceBetweenPoints(next, current);
  let s01 = d01 / (d01 + d12);
  let s12 = d12 / (d01 + d12);
  s01 = isNaN(s01) ? 0 : s01;
  s12 = isNaN(s12) ? 0 : s12;
  const fa = t * s01;
  const fb = t * s12;
  return {
    previous: {
      x: current.x - fa * (next.x - previous.x),
      y: current.y - fa * (next.y - previous.y)
    },
    next: {
      x: current.x + fb * (next.x - previous.x),
      y: current.y + fb * (next.y - previous.y)
    }
  };
}
function monotoneAdjust(points, deltaK, mK) {
  const pointsLen = points.length;
  let alphaK, betaK, tauK, squaredMagnitude, pointCurrent;
  let pointAfter = getPoint(points, 0);
  for (let i = 0; i < pointsLen - 1; ++i) {
    pointCurrent = pointAfter;
    pointAfter = getPoint(points, i + 1);
    if (!pointCurrent || !pointAfter) {
      continue;
    }
    if (almostEquals(deltaK[i], 0, EPSILON)) {
      mK[i] = mK[i + 1] = 0;
      continue;
    }
    alphaK = mK[i] / deltaK[i];
    betaK = mK[i + 1] / deltaK[i];
    squaredMagnitude = Math.pow(alphaK, 2) + Math.pow(betaK, 2);
    if (squaredMagnitude <= 9) {
      continue;
    }
    tauK = 3 / Math.sqrt(squaredMagnitude);
    mK[i] = alphaK * tauK * deltaK[i];
    mK[i + 1] = betaK * tauK * deltaK[i];
  }
}
function monotoneCompute(points, mK, indexAxis = "x") {
  const valueAxis = getValueAxis(indexAxis);
  const pointsLen = points.length;
  let delta, pointBefore, pointCurrent;
  let pointAfter = getPoint(points, 0);
  for (let i = 0; i < pointsLen; ++i) {
    pointBefore = pointCurrent;
    pointCurrent = pointAfter;
    pointAfter = getPoint(points, i + 1);
    if (!pointCurrent) {
      continue;
    }
    const iPixel = pointCurrent[indexAxis];
    const vPixel = pointCurrent[valueAxis];
    if (pointBefore) {
      delta = (iPixel - pointBefore[indexAxis]) / 3;
      pointCurrent[`cp1${indexAxis}`] = iPixel - delta;
      pointCurrent[`cp1${valueAxis}`] = vPixel - delta * mK[i];
    }
    if (pointAfter) {
      delta = (pointAfter[indexAxis] - iPixel) / 3;
      pointCurrent[`cp2${indexAxis}`] = iPixel + delta;
      pointCurrent[`cp2${valueAxis}`] = vPixel + delta * mK[i];
    }
  }
}
function splineCurveMonotone(points, indexAxis = "x") {
  const valueAxis = getValueAxis(indexAxis);
  const pointsLen = points.length;
  const deltaK = Array(pointsLen).fill(0);
  const mK = Array(pointsLen);
  let i, pointBefore, pointCurrent;
  let pointAfter = getPoint(points, 0);
  for (i = 0; i < pointsLen; ++i) {
    pointBefore = pointCurrent;
    pointCurrent = pointAfter;
    pointAfter = getPoint(points, i + 1);
    if (!pointCurrent) {
      continue;
    }
    if (pointAfter) {
      const slopeDelta = pointAfter[indexAxis] - pointCurrent[indexAxis];
      deltaK[i] = slopeDelta !== 0 ? (pointAfter[valueAxis] - pointCurrent[valueAxis]) / slopeDelta : 0;
    }
    mK[i] = !pointBefore ? deltaK[i] : !pointAfter ? deltaK[i - 1] : sign(deltaK[i - 1]) !== sign(deltaK[i]) ? 0 : (deltaK[i - 1] + deltaK[i]) / 2;
  }
  monotoneAdjust(points, deltaK, mK);
  monotoneCompute(points, mK, indexAxis);
}
function capControlPoint(pt, min, max) {
  return Math.max(Math.min(pt, max), min);
}
function capBezierPoints(points, area) {
  let i, ilen, point, inArea, inAreaPrev;
  let inAreaNext = _isPointInArea(points[0], area);
  for (i = 0, ilen = points.length; i < ilen; ++i) {
    inAreaPrev = inArea;
    inArea = inAreaNext;
    inAreaNext = i < ilen - 1 && _isPointInArea(points[i + 1], area);
    if (!inArea) {
      continue;
    }
    point = points[i];
    if (inAreaPrev) {
      point.cp1x = capControlPoint(point.cp1x, area.left, area.right);
      point.cp1y = capControlPoint(point.cp1y, area.top, area.bottom);
    }
    if (inAreaNext) {
      point.cp2x = capControlPoint(point.cp2x, area.left, area.right);
      point.cp2y = capControlPoint(point.cp2y, area.top, area.bottom);
    }
  }
}
function _updateBezierControlPoints(points, options, area, loop, indexAxis) {
  let i, ilen, point, controlPoints;
  if (options.spanGaps) {
    points = points.filter((pt) => !pt.skip);
  }
  if (options.cubicInterpolationMode === "monotone") {
    splineCurveMonotone(points, indexAxis);
  } else {
    let prev = loop ? points[points.length - 1] : points[0];
    for (i = 0, ilen = points.length; i < ilen; ++i) {
      point = points[i];
      controlPoints = splineCurve(prev, point, points[Math.min(i + 1, ilen - (loop ? 0 : 1)) % ilen], options.tension);
      point.cp1x = controlPoints.previous.x;
      point.cp1y = controlPoints.previous.y;
      point.cp2x = controlPoints.next.x;
      point.cp2y = controlPoints.next.y;
      prev = point;
    }
  }
  if (options.capBezierPoints) {
    capBezierPoints(points, area);
  }
}
function _isDomSupported() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
function _getParentNode(domNode) {
  let parent = domNode.parentNode;
  if (parent && parent.toString() === "[object ShadowRoot]") {
    parent = parent.host;
  }
  return parent;
}
function parseMaxStyle(styleValue, node, parentProperty) {
  let valueInPixels;
  if (typeof styleValue === "string") {
    valueInPixels = parseInt(styleValue, 10);
    if (styleValue.indexOf("%") !== -1) {
      valueInPixels = valueInPixels / 100 * node.parentNode[parentProperty];
    }
  } else {
    valueInPixels = styleValue;
  }
  return valueInPixels;
}
var getComputedStyle2 = (element) => element.ownerDocument.defaultView.getComputedStyle(element, null);
function getStyle(el, property) {
  return getComputedStyle2(el).getPropertyValue(property);
}
var positions = [
  "top",
  "right",
  "bottom",
  "left"
];
function getPositionedStyle(styles, style, suffix) {
  const result = {};
  suffix = suffix ? "-" + suffix : "";
  for (let i = 0; i < 4; i++) {
    const pos = positions[i];
    result[pos] = parseFloat(styles[style + "-" + pos + suffix]) || 0;
  }
  result.width = result.left + result.right;
  result.height = result.top + result.bottom;
  return result;
}
var useOffsetPos = (x, y, target) => (x > 0 || y > 0) && (!target || !target.shadowRoot);
function getCanvasPosition(e, canvas) {
  const touches = e.touches;
  const source = touches && touches.length ? touches[0] : e;
  const { offsetX, offsetY } = source;
  let box = false;
  let x, y;
  if (useOffsetPos(offsetX, offsetY, e.target)) {
    x = offsetX;
    y = offsetY;
  } else {
    const rect = canvas.getBoundingClientRect();
    x = source.clientX - rect.left;
    y = source.clientY - rect.top;
    box = true;
  }
  return {
    x,
    y,
    box
  };
}
function getRelativePosition(event, chart) {
  if ("native" in event) {
    return event;
  }
  const { canvas, currentDevicePixelRatio } = chart;
  const style = getComputedStyle2(canvas);
  const borderBox = style.boxSizing === "border-box";
  const paddings = getPositionedStyle(style, "padding");
  const borders = getPositionedStyle(style, "border", "width");
  const { x, y, box } = getCanvasPosition(event, canvas);
  const xOffset = paddings.left + (box && borders.left);
  const yOffset = paddings.top + (box && borders.top);
  let { width, height } = chart;
  if (borderBox) {
    width -= paddings.width + borders.width;
    height -= paddings.height + borders.height;
  }
  return {
    x: Math.round((x - xOffset) / width * canvas.width / currentDevicePixelRatio),
    y: Math.round((y - yOffset) / height * canvas.height / currentDevicePixelRatio)
  };
}
function getContainerSize(canvas, width, height) {
  let maxWidth, maxHeight;
  if (width === void 0 || height === void 0) {
    const container = canvas && _getParentNode(canvas);
    if (!container) {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
    } else {
      const rect = container.getBoundingClientRect();
      const containerStyle = getComputedStyle2(container);
      const containerBorder = getPositionedStyle(containerStyle, "border", "width");
      const containerPadding = getPositionedStyle(containerStyle, "padding");
      width = rect.width - containerPadding.width - containerBorder.width;
      height = rect.height - containerPadding.height - containerBorder.height;
      maxWidth = parseMaxStyle(containerStyle.maxWidth, container, "clientWidth");
      maxHeight = parseMaxStyle(containerStyle.maxHeight, container, "clientHeight");
    }
  }
  return {
    width,
    height,
    maxWidth: maxWidth || INFINITY,
    maxHeight: maxHeight || INFINITY
  };
}
var round1 = (v) => Math.round(v * 10) / 10;
function getMaximumSize(canvas, bbWidth, bbHeight, aspectRatio) {
  const style = getComputedStyle2(canvas);
  const margins = getPositionedStyle(style, "margin");
  const maxWidth = parseMaxStyle(style.maxWidth, canvas, "clientWidth") || INFINITY;
  const maxHeight = parseMaxStyle(style.maxHeight, canvas, "clientHeight") || INFINITY;
  const containerSize = getContainerSize(canvas, bbWidth, bbHeight);
  let { width, height } = containerSize;
  if (style.boxSizing === "content-box") {
    const borders = getPositionedStyle(style, "border", "width");
    const paddings = getPositionedStyle(style, "padding");
    width -= paddings.width + borders.width;
    height -= paddings.height + borders.height;
  }
  width = Math.max(0, width - margins.width);
  height = Math.max(0, aspectRatio ? width / aspectRatio : height - margins.height);
  width = round1(Math.min(width, maxWidth, containerSize.maxWidth));
  height = round1(Math.min(height, maxHeight, containerSize.maxHeight));
  if (width && !height) {
    height = round1(width / 2);
  }
  const maintainHeight = bbWidth !== void 0 || bbHeight !== void 0;
  if (maintainHeight && aspectRatio && containerSize.height && height > containerSize.height) {
    height = containerSize.height;
    width = round1(Math.floor(height * aspectRatio));
  }
  return {
    width,
    height
  };
}
function retinaScale(chart, forceRatio, forceStyle) {
  const pixelRatio = forceRatio || 1;
  const deviceHeight = round1(chart.height * pixelRatio);
  const deviceWidth = round1(chart.width * pixelRatio);
  chart.height = round1(chart.height);
  chart.width = round1(chart.width);
  const canvas = chart.canvas;
  if (canvas.style && (forceStyle || !canvas.style.height && !canvas.style.width)) {
    canvas.style.height = `${chart.height}px`;
    canvas.style.width = `${chart.width}px`;
  }
  if (chart.currentDevicePixelRatio !== pixelRatio || canvas.height !== deviceHeight || canvas.width !== deviceWidth) {
    chart.currentDevicePixelRatio = pixelRatio;
    canvas.height = deviceHeight;
    canvas.width = deviceWidth;
    chart.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    return true;
  }
  return false;
}
var supportsEventListenerOptions = function() {
  let passiveSupported = false;
  try {
    const options = {
      get passive() {
        passiveSupported = true;
        return false;
      }
    };
    if (_isDomSupported()) {
      window.addEventListener("test", null, options);
      window.removeEventListener("test", null, options);
    }
  } catch (e) {
  }
  return passiveSupported;
}();
function readUsedSize(element, property) {
  const value = getStyle(element, property);
  const matches = value && value.match(/^(\d+)(\.\d+)?px$/);
  return matches ? +matches[1] : void 0;
}
function _pointInLine(p1, p2, t, mode) {
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y)
  };
}
function _steppedInterpolation(p1, p2, t, mode) {
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: mode === "middle" ? t < 0.5 ? p1.y : p2.y : mode === "after" ? t < 1 ? p1.y : p2.y : t > 0 ? p2.y : p1.y
  };
}
function _bezierInterpolation(p1, p2, t, mode) {
  const cp1 = {
    x: p1.cp2x,
    y: p1.cp2y
  };
  const cp2 = {
    x: p2.cp1x,
    y: p2.cp1y
  };
  const a = _pointInLine(p1, cp1, t);
  const b = _pointInLine(cp1, cp2, t);
  const c = _pointInLine(cp2, p2, t);
  const d = _pointInLine(a, b, t);
  const e = _pointInLine(b, c, t);
  return _pointInLine(d, e, t);
}
var getRightToLeftAdapter = function(rectX, width) {
  return {
    x(x) {
      return rectX + rectX + width - x;
    },
    setWidth(w) {
      width = w;
    },
    textAlign(align) {
      if (align === "center") {
        return align;
      }
      return align === "right" ? "left" : "right";
    },
    xPlus(x, value) {
      return x - value;
    },
    leftForLtr(x, itemWidth) {
      return x - itemWidth;
    }
  };
};
var getLeftToRightAdapter = function() {
  return {
    x(x) {
      return x;
    },
    setWidth(w) {
    },
    textAlign(align) {
      return align;
    },
    xPlus(x, value) {
      return x + value;
    },
    leftForLtr(x, _itemWidth) {
      return x;
    }
  };
};
function getRtlAdapter(rtl, rectX, width) {
  return rtl ? getRightToLeftAdapter(rectX, width) : getLeftToRightAdapter();
}
function overrideTextDirection(ctx, direction) {
  let style, original;
  if (direction === "ltr" || direction === "rtl") {
    style = ctx.canvas.style;
    original = [
      style.getPropertyValue("direction"),
      style.getPropertyPriority("direction")
    ];
    style.setProperty("direction", direction, "important");
    ctx.prevTextDirection = original;
  }
}
function restoreTextDirection(ctx, original) {
  if (original !== void 0) {
    delete ctx.prevTextDirection;
    ctx.canvas.style.setProperty("direction", original[0], original[1]);
  }
}
function propertyFn(property) {
  if (property === "angle") {
    return {
      between: _angleBetween,
      compare: _angleDiff,
      normalize: _normalizeAngle
    };
  }
  return {
    between: _isBetween,
    compare: (a, b) => a - b,
    normalize: (x) => x
  };
}
function normalizeSegment({ start, end, count, loop, style }) {
  return {
    start: start % count,
    end: end % count,
    loop: loop && (end - start + 1) % count === 0,
    style
  };
}
function getSegment(segment, points, bounds) {
  const { property, start: startBound, end: endBound } = bounds;
  const { between, normalize } = propertyFn(property);
  const count = points.length;
  let { start, end, loop } = segment;
  let i, ilen;
  if (loop) {
    start += count;
    end += count;
    for (i = 0, ilen = count; i < ilen; ++i) {
      if (!between(normalize(points[start % count][property]), startBound, endBound)) {
        break;
      }
      start--;
      end--;
    }
    start %= count;
    end %= count;
  }
  if (end < start) {
    end += count;
  }
  return {
    start,
    end,
    loop,
    style: segment.style
  };
}
function _boundSegment(segment, points, bounds) {
  if (!bounds) {
    return [
      segment
    ];
  }
  const { property, start: startBound, end: endBound } = bounds;
  const count = points.length;
  const { compare, between, normalize } = propertyFn(property);
  const { start, end, loop, style } = getSegment(segment, points, bounds);
  const result = [];
  let inside = false;
  let subStart = null;
  let value, point, prevValue;
  const startIsBefore = () => between(startBound, prevValue, value) && compare(startBound, prevValue) !== 0;
  const endIsBefore = () => compare(endBound, value) === 0 || between(endBound, prevValue, value);
  const shouldStart = () => inside || startIsBefore();
  const shouldStop = () => !inside || endIsBefore();
  for (let i = start, prev = start; i <= end; ++i) {
    point = points[i % count];
    if (point.skip) {
      continue;
    }
    value = normalize(point[property]);
    if (value === prevValue) {
      continue;
    }
    inside = between(value, startBound, endBound);
    if (subStart === null && shouldStart()) {
      subStart = compare(value, startBound) === 0 ? i : prev;
    }
    if (subStart !== null && shouldStop()) {
      result.push(normalizeSegment({
        start: subStart,
        end: i,
        loop,
        count,
        style
      }));
      subStart = null;
    }
    prev = i;
    prevValue = value;
  }
  if (subStart !== null) {
    result.push(normalizeSegment({
      start: subStart,
      end,
      loop,
      count,
      style
    }));
  }
  return result;
}
function _boundSegments(line, bounds) {
  const result = [];
  const segments = line.segments;
  for (let i = 0; i < segments.length; i++) {
    const sub = _boundSegment(segments[i], line.points, bounds);
    if (sub.length) {
      result.push(...sub);
    }
  }
  return result;
}
function findStartAndEnd(points, count, loop, spanGaps) {
  let start = 0;
  let end = count - 1;
  if (loop && !spanGaps) {
    while (start < count && !points[start].skip) {
      start++;
    }
  }
  while (start < count && points[start].skip) {
    start++;
  }
  start %= count;
  if (loop) {
    end += start;
  }
  while (end > start && points[end % count].skip) {
    end--;
  }
  end %= count;
  return {
    start,
    end
  };
}
function solidSegments(points, start, max, loop) {
  const count = points.length;
  const result = [];
  let last = start;
  let prev = points[start];
  let end;
  for (end = start + 1; end <= max; ++end) {
    const cur = points[end % count];
    if (cur.skip || cur.stop) {
      if (!prev.skip) {
        loop = false;
        result.push({
          start: start % count,
          end: (end - 1) % count,
          loop
        });
        start = last = cur.stop ? end : null;
      }
    } else {
      last = end;
      if (prev.skip) {
        start = end;
      }
    }
    prev = cur;
  }
  if (last !== null) {
    result.push({
      start: start % count,
      end: last % count,
      loop
    });
  }
  return result;
}
function _computeSegments(line, segmentOptions) {
  const points = line.points;
  const spanGaps = line.options.spanGaps;
  const count = points.length;
  if (!count) {
    return [];
  }
  const loop = !!line._loop;
  const { start, end } = findStartAndEnd(points, count, loop, spanGaps);
  if (spanGaps === true) {
    return splitByStyles(line, [
      {
        start,
        end,
        loop
      }
    ], points, segmentOptions);
  }
  const max = end < start ? end + count : end;
  const completeLoop = !!line._fullLoop && start === 0 && end === count - 1;
  return splitByStyles(line, solidSegments(points, start, max, completeLoop), points, segmentOptions);
}
function splitByStyles(line, segments, points, segmentOptions) {
  if (!segmentOptions || !segmentOptions.setContext || !points) {
    return segments;
  }
  return doSplitByStyles(line, segments, points, segmentOptions);
}
function doSplitByStyles(line, segments, points, segmentOptions) {
  const chartContext = line._chart.getContext();
  const baseStyle = readStyle(line.options);
  const { _datasetIndex: datasetIndex, options: { spanGaps } } = line;
  const count = points.length;
  const result = [];
  let prevStyle = baseStyle;
  let start = segments[0].start;
  let i = start;
  function addStyle(s, e, l, st) {
    const dir = spanGaps ? -1 : 1;
    if (s === e) {
      return;
    }
    s += count;
    while (points[s % count].skip) {
      s -= dir;
    }
    while (points[e % count].skip) {
      e += dir;
    }
    if (s % count !== e % count) {
      result.push({
        start: s % count,
        end: e % count,
        loop: l,
        style: st
      });
      prevStyle = st;
      start = e % count;
    }
  }
  for (const segment of segments) {
    start = spanGaps ? start : segment.start;
    let prev = points[start % count];
    let style;
    for (i = start + 1; i <= segment.end; i++) {
      const pt = points[i % count];
      style = readStyle(segmentOptions.setContext(createContext(chartContext, {
        type: "segment",
        p0: prev,
        p1: pt,
        p0DataIndex: (i - 1) % count,
        p1DataIndex: i % count,
        datasetIndex
      })));
      if (styleChanged(style, prevStyle)) {
        addStyle(start, i - 1, segment.loop, prevStyle);
      }
      prev = pt;
      prevStyle = style;
    }
    if (start < i - 1) {
      addStyle(start, i - 1, segment.loop, prevStyle);
    }
  }
  return result;
}
function readStyle(options) {
  return {
    backgroundColor: options.backgroundColor,
    borderCapStyle: options.borderCapStyle,
    borderDash: options.borderDash,
    borderDashOffset: options.borderDashOffset,
    borderJoinStyle: options.borderJoinStyle,
    borderWidth: options.borderWidth,
    borderColor: options.borderColor
  };
}
function styleChanged(style, prevStyle) {
  if (!prevStyle) {
    return false;
  }
  const cache = [];
  const replacer = function(key, value) {
    if (!isPatternOrGradient(value)) {
      return value;
    }
    if (!cache.includes(value)) {
      cache.push(value);
    }
    return cache.indexOf(value);
  };
  return JSON.stringify(style, replacer) !== JSON.stringify(prevStyle, replacer);
}
function getSizeForArea(scale, chartArea, field) {
  return scale.options.clip ? scale[field] : chartArea[field];
}
function getDatasetArea(meta, chartArea) {
  const { xScale, yScale } = meta;
  if (xScale && yScale) {
    return {
      left: getSizeForArea(xScale, chartArea, "left"),
      right: getSizeForArea(xScale, chartArea, "right"),
      top: getSizeForArea(yScale, chartArea, "top"),
      bottom: getSizeForArea(yScale, chartArea, "bottom")
    };
  }
  return chartArea;
}
function getDatasetClipArea(chart, meta) {
  const clip = meta._clip;
  if (clip.disabled) {
    return false;
  }
  const area = getDatasetArea(meta, chart.chartArea);
  return {
    left: clip.left === false ? 0 : area.left - (clip.left === true ? 0 : clip.left),
    right: clip.right === false ? chart.width : area.right + (clip.right === true ? 0 : clip.right),
    top: clip.top === false ? 0 : area.top - (clip.top === true ? 0 : clip.top),
    bottom: clip.bottom === false ? chart.height : area.bottom + (clip.bottom === true ? 0 : clip.bottom)
  };
}

// node_modules/chart.js/dist/chart.js
var Animator = class {
  constructor() {
    this._request = null;
    this._charts = /* @__PURE__ */ new Map();
    this._running = false;
    this._lastDate = void 0;
  }
  _notify(chart, anims, date, type) {
    const callbacks = anims.listeners[type];
    const numSteps = anims.duration;
    callbacks.forEach((fn) => fn({
      chart,
      initial: anims.initial,
      numSteps,
      currentStep: Math.min(date - anims.start, numSteps)
    }));
  }
  _refresh() {
    if (this._request) {
      return;
    }
    this._running = true;
    this._request = requestAnimFrame.call(window, () => {
      this._update();
      this._request = null;
      if (this._running) {
        this._refresh();
      }
    });
  }
  _update(date = Date.now()) {
    let remaining = 0;
    this._charts.forEach((anims, chart) => {
      if (!anims.running || !anims.items.length) {
        return;
      }
      const items = anims.items;
      let i = items.length - 1;
      let draw2 = false;
      let item;
      for (; i >= 0; --i) {
        item = items[i];
        if (item._active) {
          if (item._total > anims.duration) {
            anims.duration = item._total;
          }
          item.tick(date);
          draw2 = true;
        } else {
          items[i] = items[items.length - 1];
          items.pop();
        }
      }
      if (draw2) {
        chart.draw();
        this._notify(chart, anims, date, "progress");
      }
      if (!items.length) {
        anims.running = false;
        this._notify(chart, anims, date, "complete");
        anims.initial = false;
      }
      remaining += items.length;
    });
    this._lastDate = date;
    if (remaining === 0) {
      this._running = false;
    }
  }
  _getAnims(chart) {
    const charts = this._charts;
    let anims = charts.get(chart);
    if (!anims) {
      anims = {
        running: false,
        initial: true,
        items: [],
        listeners: {
          complete: [],
          progress: []
        }
      };
      charts.set(chart, anims);
    }
    return anims;
  }
  listen(chart, event, cb) {
    this._getAnims(chart).listeners[event].push(cb);
  }
  add(chart, items) {
    if (!items || !items.length) {
      return;
    }
    this._getAnims(chart).items.push(...items);
  }
  has(chart) {
    return this._getAnims(chart).items.length > 0;
  }
  start(chart) {
    const anims = this._charts.get(chart);
    if (!anims) {
      return;
    }
    anims.running = true;
    anims.start = Date.now();
    anims.duration = anims.items.reduce((acc, cur) => Math.max(acc, cur._duration), 0);
    this._refresh();
  }
  running(chart) {
    if (!this._running) {
      return false;
    }
    const anims = this._charts.get(chart);
    if (!anims || !anims.running || !anims.items.length) {
      return false;
    }
    return true;
  }
  stop(chart) {
    const anims = this._charts.get(chart);
    if (!anims || !anims.items.length) {
      return;
    }
    const items = anims.items;
    let i = items.length - 1;
    for (; i >= 0; --i) {
      items[i].cancel();
    }
    anims.items = [];
    this._notify(chart, anims, Date.now(), "complete");
  }
  remove(chart) {
    return this._charts.delete(chart);
  }
};
var animator = /* @__PURE__ */ new Animator();
var transparent = "transparent";
var interpolators = {
  boolean(from2, to2, factor) {
    return factor > 0.5 ? to2 : from2;
  },
  color(from2, to2, factor) {
    const c0 = color(from2 || transparent);
    const c1 = c0.valid && color(to2 || transparent);
    return c1 && c1.valid ? c1.mix(c0, factor).hexString() : to2;
  },
  number(from2, to2, factor) {
    return from2 + (to2 - from2) * factor;
  }
};
var Animation = class {
  constructor(cfg, target, prop, to2) {
    const currentValue = target[prop];
    to2 = resolve([
      cfg.to,
      to2,
      currentValue,
      cfg.from
    ]);
    const from2 = resolve([
      cfg.from,
      currentValue,
      to2
    ]);
    this._active = true;
    this._fn = cfg.fn || interpolators[cfg.type || typeof from2];
    this._easing = effects[cfg.easing] || effects.linear;
    this._start = Math.floor(Date.now() + (cfg.delay || 0));
    this._duration = this._total = Math.floor(cfg.duration);
    this._loop = !!cfg.loop;
    this._target = target;
    this._prop = prop;
    this._from = from2;
    this._to = to2;
    this._promises = void 0;
  }
  active() {
    return this._active;
  }
  update(cfg, to2, date) {
    if (this._active) {
      this._notify(false);
      const currentValue = this._target[this._prop];
      const elapsed = date - this._start;
      const remain = this._duration - elapsed;
      this._start = date;
      this._duration = Math.floor(Math.max(remain, cfg.duration));
      this._total += elapsed;
      this._loop = !!cfg.loop;
      this._to = resolve([
        cfg.to,
        to2,
        currentValue,
        cfg.from
      ]);
      this._from = resolve([
        cfg.from,
        currentValue,
        to2
      ]);
    }
  }
  cancel() {
    if (this._active) {
      this.tick(Date.now());
      this._active = false;
      this._notify(false);
    }
  }
  tick(date) {
    const elapsed = date - this._start;
    const duration = this._duration;
    const prop = this._prop;
    const from2 = this._from;
    const loop = this._loop;
    const to2 = this._to;
    let factor;
    this._active = from2 !== to2 && (loop || elapsed < duration);
    if (!this._active) {
      this._target[prop] = to2;
      this._notify(true);
      return;
    }
    if (elapsed < 0) {
      this._target[prop] = from2;
      return;
    }
    factor = elapsed / duration % 2;
    factor = loop && factor > 1 ? 2 - factor : factor;
    factor = this._easing(Math.min(1, Math.max(0, factor)));
    this._target[prop] = this._fn(from2, to2, factor);
  }
  wait() {
    const promises = this._promises || (this._promises = []);
    return new Promise((res, rej) => {
      promises.push({
        res,
        rej
      });
    });
  }
  _notify(resolved) {
    const method = resolved ? "res" : "rej";
    const promises = this._promises || [];
    for (let i = 0; i < promises.length; i++) {
      promises[i][method]();
    }
  }
};
var Animations = class {
  constructor(chart, config) {
    this._chart = chart;
    this._properties = /* @__PURE__ */ new Map();
    this.configure(config);
  }
  configure(config) {
    if (!isObject(config)) {
      return;
    }
    const animationOptions = Object.keys(defaults.animation);
    const animatedProps = this._properties;
    Object.getOwnPropertyNames(config).forEach((key) => {
      const cfg = config[key];
      if (!isObject(cfg)) {
        return;
      }
      const resolved = {};
      for (const option of animationOptions) {
        resolved[option] = cfg[option];
      }
      (isArray(cfg.properties) && cfg.properties || [
        key
      ]).forEach((prop) => {
        if (prop === key || !animatedProps.has(prop)) {
          animatedProps.set(prop, resolved);
        }
      });
    });
  }
  _animateOptions(target, values) {
    const newOptions = values.options;
    const options = resolveTargetOptions(target, newOptions);
    if (!options) {
      return [];
    }
    const animations = this._createAnimations(options, newOptions);
    if (newOptions.$shared) {
      awaitAll(target.options.$animations, newOptions).then(() => {
        target.options = newOptions;
      }, () => {
      });
    }
    return animations;
  }
  _createAnimations(target, values) {
    const animatedProps = this._properties;
    const animations = [];
    const running = target.$animations || (target.$animations = {});
    const props = Object.keys(values);
    const date = Date.now();
    let i;
    for (i = props.length - 1; i >= 0; --i) {
      const prop = props[i];
      if (prop.charAt(0) === "$") {
        continue;
      }
      if (prop === "options") {
        animations.push(...this._animateOptions(target, values));
        continue;
      }
      const value = values[prop];
      let animation = running[prop];
      const cfg = animatedProps.get(prop);
      if (animation) {
        if (cfg && animation.active()) {
          animation.update(cfg, value, date);
          continue;
        } else {
          animation.cancel();
        }
      }
      if (!cfg || !cfg.duration) {
        target[prop] = value;
        continue;
      }
      running[prop] = animation = new Animation(cfg, target, prop, value);
      animations.push(animation);
    }
    return animations;
  }
  update(target, values) {
    if (this._properties.size === 0) {
      Object.assign(target, values);
      return;
    }
    const animations = this._createAnimations(target, values);
    if (animations.length) {
      animator.add(this._chart, animations);
      return true;
    }
  }
};
function awaitAll(animations, properties) {
  const running = [];
  const keys = Object.keys(properties);
  for (let i = 0; i < keys.length; i++) {
    const anim = animations[keys[i]];
    if (anim && anim.active()) {
      running.push(anim.wait());
    }
  }
  return Promise.all(running);
}
function resolveTargetOptions(target, newOptions) {
  if (!newOptions) {
    return;
  }
  let options = target.options;
  if (!options) {
    target.options = newOptions;
    return;
  }
  if (options.$shared) {
    target.options = options = Object.assign({}, options, {
      $shared: false,
      $animations: {}
    });
  }
  return options;
}
function scaleClip(scale, allowedOverflow) {
  const opts = scale && scale.options || {};
  const reverse = opts.reverse;
  const min = opts.min === void 0 ? allowedOverflow : 0;
  const max = opts.max === void 0 ? allowedOverflow : 0;
  return {
    start: reverse ? max : min,
    end: reverse ? min : max
  };
}
function defaultClip(xScale, yScale, allowedOverflow) {
  if (allowedOverflow === false) {
    return false;
  }
  const x = scaleClip(xScale, allowedOverflow);
  const y = scaleClip(yScale, allowedOverflow);
  return {
    top: y.end,
    right: x.end,
    bottom: y.start,
    left: x.start
  };
}
function toClip(value) {
  let t, r, b, l;
  if (isObject(value)) {
    t = value.top;
    r = value.right;
    b = value.bottom;
    l = value.left;
  } else {
    t = r = b = l = value;
  }
  return {
    top: t,
    right: r,
    bottom: b,
    left: l,
    disabled: value === false
  };
}
function getSortedDatasetIndices(chart, filterVisible) {
  const keys = [];
  const metasets = chart._getSortedDatasetMetas(filterVisible);
  let i, ilen;
  for (i = 0, ilen = metasets.length; i < ilen; ++i) {
    keys.push(metasets[i].index);
  }
  return keys;
}
function applyStack(stack, value, dsIndex, options = {}) {
  const keys = stack.keys;
  const singleMode = options.mode === "single";
  let i, ilen, datasetIndex, otherValue;
  if (value === null) {
    return;
  }
  let found = false;
  for (i = 0, ilen = keys.length; i < ilen; ++i) {
    datasetIndex = +keys[i];
    if (datasetIndex === dsIndex) {
      found = true;
      if (options.all) {
        continue;
      }
      break;
    }
    otherValue = stack.values[datasetIndex];
    if (isNumberFinite(otherValue) && (singleMode || value === 0 || sign(value) === sign(otherValue))) {
      value += otherValue;
    }
  }
  if (!found && !options.all) {
    return 0;
  }
  return value;
}
function convertObjectDataToArray(data, meta) {
  const { iScale, vScale } = meta;
  const iAxisKey = iScale.axis === "x" ? "x" : "y";
  const vAxisKey = vScale.axis === "x" ? "x" : "y";
  const keys = Object.keys(data);
  const adata = new Array(keys.length);
  let i, ilen, key;
  for (i = 0, ilen = keys.length; i < ilen; ++i) {
    key = keys[i];
    adata[i] = {
      [iAxisKey]: key,
      [vAxisKey]: data[key]
    };
  }
  return adata;
}
function isStacked(scale, meta) {
  const stacked = scale && scale.options.stacked;
  return stacked || stacked === void 0 && meta.stack !== void 0;
}
function getStackKey(indexScale, valueScale, meta) {
  return `${indexScale.id}.${valueScale.id}.${meta.stack || meta.type}`;
}
function getUserBounds(scale) {
  const { min, max, minDefined, maxDefined } = scale.getUserBounds();
  return {
    min: minDefined ? min : Number.NEGATIVE_INFINITY,
    max: maxDefined ? max : Number.POSITIVE_INFINITY
  };
}
function getOrCreateStack(stacks, stackKey, indexValue) {
  const subStack = stacks[stackKey] || (stacks[stackKey] = {});
  return subStack[indexValue] || (subStack[indexValue] = {});
}
function getLastIndexInStack(stack, vScale, positive, type) {
  for (const meta of vScale.getMatchingVisibleMetas(type).reverse()) {
    const value = stack[meta.index];
    if (positive && value > 0 || !positive && value < 0) {
      return meta.index;
    }
  }
  return null;
}
function updateStacks(controller, parsed) {
  const { chart, _cachedMeta: meta } = controller;
  const stacks = chart._stacks || (chart._stacks = {});
  const { iScale, vScale, index: datasetIndex } = meta;
  const iAxis = iScale.axis;
  const vAxis = vScale.axis;
  const key = getStackKey(iScale, vScale, meta);
  const ilen = parsed.length;
  let stack;
  for (let i = 0; i < ilen; ++i) {
    const item = parsed[i];
    const { [iAxis]: index, [vAxis]: value } = item;
    const itemStacks = item._stacks || (item._stacks = {});
    stack = itemStacks[vAxis] = getOrCreateStack(stacks, key, index);
    stack[datasetIndex] = value;
    stack._top = getLastIndexInStack(stack, vScale, true, meta.type);
    stack._bottom = getLastIndexInStack(stack, vScale, false, meta.type);
    const visualValues = stack._visualValues || (stack._visualValues = {});
    visualValues[datasetIndex] = value;
  }
}
function getFirstScaleId(chart, axis) {
  const scales = chart.scales;
  return Object.keys(scales).filter((key) => scales[key].axis === axis).shift();
}
function createDatasetContext(parent, index) {
  return createContext(parent, {
    active: false,
    dataset: void 0,
    datasetIndex: index,
    index,
    mode: "default",
    type: "dataset"
  });
}
function createDataContext(parent, index, element) {
  return createContext(parent, {
    active: false,
    dataIndex: index,
    parsed: void 0,
    raw: void 0,
    element,
    index,
    mode: "default",
    type: "data"
  });
}
function clearStacks(meta, items) {
  const datasetIndex = meta.controller.index;
  const axis = meta.vScale && meta.vScale.axis;
  if (!axis) {
    return;
  }
  items = items || meta._parsed;
  for (const parsed of items) {
    const stacks = parsed._stacks;
    if (!stacks || stacks[axis] === void 0 || stacks[axis][datasetIndex] === void 0) {
      return;
    }
    delete stacks[axis][datasetIndex];
    if (stacks[axis]._visualValues !== void 0 && stacks[axis]._visualValues[datasetIndex] !== void 0) {
      delete stacks[axis]._visualValues[datasetIndex];
    }
  }
}
var isDirectUpdateMode = (mode) => mode === "reset" || mode === "none";
var cloneIfNotShared = (cached, shared) => shared ? cached : Object.assign({}, cached);
var createStack = (canStack, meta, chart) => canStack && !meta.hidden && meta._stacked && {
  keys: getSortedDatasetIndices(chart, true),
  values: null
};
var DatasetController = class {
  constructor(chart, datasetIndex) {
    this.chart = chart;
    this._ctx = chart.ctx;
    this.index = datasetIndex;
    this._cachedDataOpts = {};
    this._cachedMeta = this.getMeta();
    this._type = this._cachedMeta.type;
    this.options = void 0;
    this._parsing = false;
    this._data = void 0;
    this._objectData = void 0;
    this._sharedOptions = void 0;
    this._drawStart = void 0;
    this._drawCount = void 0;
    this.enableOptionSharing = false;
    this.supportsDecimation = false;
    this.$context = void 0;
    this._syncList = [];
    this.datasetElementType = new.target.datasetElementType;
    this.dataElementType = new.target.dataElementType;
    this.initialize();
  }
  initialize() {
    const meta = this._cachedMeta;
    this.configure();
    this.linkScales();
    meta._stacked = isStacked(meta.vScale, meta);
    this.addElements();
    if (this.options.fill && !this.chart.isPluginEnabled("filler")) {
      console.warn("Tried to use the 'fill' option without the 'Filler' plugin enabled. Please import and register the 'Filler' plugin and make sure it is not disabled in the options");
    }
  }
  updateIndex(datasetIndex) {
    if (this.index !== datasetIndex) {
      clearStacks(this._cachedMeta);
    }
    this.index = datasetIndex;
  }
  linkScales() {
    const chart = this.chart;
    const meta = this._cachedMeta;
    const dataset = this.getDataset();
    const chooseId = (axis, x, y, r) => axis === "x" ? x : axis === "r" ? r : y;
    const xid = meta.xAxisID = valueOrDefault(dataset.xAxisID, getFirstScaleId(chart, "x"));
    const yid = meta.yAxisID = valueOrDefault(dataset.yAxisID, getFirstScaleId(chart, "y"));
    const rid = meta.rAxisID = valueOrDefault(dataset.rAxisID, getFirstScaleId(chart, "r"));
    const indexAxis = meta.indexAxis;
    const iid = meta.iAxisID = chooseId(indexAxis, xid, yid, rid);
    const vid = meta.vAxisID = chooseId(indexAxis, yid, xid, rid);
    meta.xScale = this.getScaleForId(xid);
    meta.yScale = this.getScaleForId(yid);
    meta.rScale = this.getScaleForId(rid);
    meta.iScale = this.getScaleForId(iid);
    meta.vScale = this.getScaleForId(vid);
  }
  getDataset() {
    return this.chart.data.datasets[this.index];
  }
  getMeta() {
    return this.chart.getDatasetMeta(this.index);
  }
  getScaleForId(scaleID) {
    return this.chart.scales[scaleID];
  }
  _getOtherScale(scale) {
    const meta = this._cachedMeta;
    return scale === meta.iScale ? meta.vScale : meta.iScale;
  }
  reset() {
    this._update("reset");
  }
  _destroy() {
    const meta = this._cachedMeta;
    if (this._data) {
      unlistenArrayEvents(this._data, this);
    }
    if (meta._stacked) {
      clearStacks(meta);
    }
  }
  _dataCheck() {
    const dataset = this.getDataset();
    const data = dataset.data || (dataset.data = []);
    const _data = this._data;
    if (isObject(data)) {
      const meta = this._cachedMeta;
      this._data = convertObjectDataToArray(data, meta);
    } else if (_data !== data) {
      if (_data) {
        unlistenArrayEvents(_data, this);
        const meta = this._cachedMeta;
        clearStacks(meta);
        meta._parsed = [];
      }
      if (data && Object.isExtensible(data)) {
        listenArrayEvents(data, this);
      }
      this._syncList = [];
      this._data = data;
    }
  }
  addElements() {
    const meta = this._cachedMeta;
    this._dataCheck();
    if (this.datasetElementType) {
      meta.dataset = new this.datasetElementType();
    }
  }
  buildOrUpdateElements(resetNewElements) {
    const meta = this._cachedMeta;
    const dataset = this.getDataset();
    let stackChanged = false;
    this._dataCheck();
    const oldStacked = meta._stacked;
    meta._stacked = isStacked(meta.vScale, meta);
    if (meta.stack !== dataset.stack) {
      stackChanged = true;
      clearStacks(meta);
      meta.stack = dataset.stack;
    }
    this._resyncElements(resetNewElements);
    if (stackChanged || oldStacked !== meta._stacked) {
      updateStacks(this, meta._parsed);
      meta._stacked = isStacked(meta.vScale, meta);
    }
  }
  configure() {
    const config = this.chart.config;
    const scopeKeys = config.datasetScopeKeys(this._type);
    const scopes = config.getOptionScopes(this.getDataset(), scopeKeys, true);
    this.options = config.createResolver(scopes, this.getContext());
    this._parsing = this.options.parsing;
    this._cachedDataOpts = {};
  }
  parse(start, count) {
    const { _cachedMeta: meta, _data: data } = this;
    const { iScale, _stacked } = meta;
    const iAxis = iScale.axis;
    let sorted = start === 0 && count === data.length ? true : meta._sorted;
    let prev = start > 0 && meta._parsed[start - 1];
    let i, cur, parsed;
    if (this._parsing === false) {
      meta._parsed = data;
      meta._sorted = true;
      parsed = data;
    } else {
      if (isArray(data[start])) {
        parsed = this.parseArrayData(meta, data, start, count);
      } else if (isObject(data[start])) {
        parsed = this.parseObjectData(meta, data, start, count);
      } else {
        parsed = this.parsePrimitiveData(meta, data, start, count);
      }
      const isNotInOrderComparedToPrev = () => cur[iAxis] === null || prev && cur[iAxis] < prev[iAxis];
      for (i = 0; i < count; ++i) {
        meta._parsed[i + start] = cur = parsed[i];
        if (sorted) {
          if (isNotInOrderComparedToPrev()) {
            sorted = false;
          }
          prev = cur;
        }
      }
      meta._sorted = sorted;
    }
    if (_stacked) {
      updateStacks(this, parsed);
    }
  }
  parsePrimitiveData(meta, data, start, count) {
    const { iScale, vScale } = meta;
    const iAxis = iScale.axis;
    const vAxis = vScale.axis;
    const labels = iScale.getLabels();
    const singleScale = iScale === vScale;
    const parsed = new Array(count);
    let i, ilen, index;
    for (i = 0, ilen = count; i < ilen; ++i) {
      index = i + start;
      parsed[i] = {
        [iAxis]: singleScale || iScale.parse(labels[index], index),
        [vAxis]: vScale.parse(data[index], index)
      };
    }
    return parsed;
  }
  parseArrayData(meta, data, start, count) {
    const { xScale, yScale } = meta;
    const parsed = new Array(count);
    let i, ilen, index, item;
    for (i = 0, ilen = count; i < ilen; ++i) {
      index = i + start;
      item = data[index];
      parsed[i] = {
        x: xScale.parse(item[0], index),
        y: yScale.parse(item[1], index)
      };
    }
    return parsed;
  }
  parseObjectData(meta, data, start, count) {
    const { xScale, yScale } = meta;
    const { xAxisKey = "x", yAxisKey = "y" } = this._parsing;
    const parsed = new Array(count);
    let i, ilen, index, item;
    for (i = 0, ilen = count; i < ilen; ++i) {
      index = i + start;
      item = data[index];
      parsed[i] = {
        x: xScale.parse(resolveObjectKey(item, xAxisKey), index),
        y: yScale.parse(resolveObjectKey(item, yAxisKey), index)
      };
    }
    return parsed;
  }
  getParsed(index) {
    return this._cachedMeta._parsed[index];
  }
  getDataElement(index) {
    return this._cachedMeta.data[index];
  }
  applyStack(scale, parsed, mode) {
    const chart = this.chart;
    const meta = this._cachedMeta;
    const value = parsed[scale.axis];
    const stack = {
      keys: getSortedDatasetIndices(chart, true),
      values: parsed._stacks[scale.axis]._visualValues
    };
    return applyStack(stack, value, meta.index, {
      mode
    });
  }
  updateRangeFromParsed(range, scale, parsed, stack) {
    const parsedValue = parsed[scale.axis];
    let value = parsedValue === null ? NaN : parsedValue;
    const values = stack && parsed._stacks[scale.axis];
    if (stack && values) {
      stack.values = values;
      value = applyStack(stack, parsedValue, this._cachedMeta.index);
    }
    range.min = Math.min(range.min, value);
    range.max = Math.max(range.max, value);
  }
  getMinMax(scale, canStack) {
    const meta = this._cachedMeta;
    const _parsed = meta._parsed;
    const sorted = meta._sorted && scale === meta.iScale;
    const ilen = _parsed.length;
    const otherScale = this._getOtherScale(scale);
    const stack = createStack(canStack, meta, this.chart);
    const range = {
      min: Number.POSITIVE_INFINITY,
      max: Number.NEGATIVE_INFINITY
    };
    const { min: otherMin, max: otherMax } = getUserBounds(otherScale);
    let i, parsed;
    function _skip() {
      parsed = _parsed[i];
      const otherValue = parsed[otherScale.axis];
      return !isNumberFinite(parsed[scale.axis]) || otherMin > otherValue || otherMax < otherValue;
    }
    for (i = 0; i < ilen; ++i) {
      if (_skip()) {
        continue;
      }
      this.updateRangeFromParsed(range, scale, parsed, stack);
      if (sorted) {
        break;
      }
    }
    if (sorted) {
      for (i = ilen - 1; i >= 0; --i) {
        if (_skip()) {
          continue;
        }
        this.updateRangeFromParsed(range, scale, parsed, stack);
        break;
      }
    }
    return range;
  }
  getAllParsedValues(scale) {
    const parsed = this._cachedMeta._parsed;
    const values = [];
    let i, ilen, value;
    for (i = 0, ilen = parsed.length; i < ilen; ++i) {
      value = parsed[i][scale.axis];
      if (isNumberFinite(value)) {
        values.push(value);
      }
    }
    return values;
  }
  getMaxOverflow() {
    return false;
  }
  getLabelAndValue(index) {
    const meta = this._cachedMeta;
    const iScale = meta.iScale;
    const vScale = meta.vScale;
    const parsed = this.getParsed(index);
    return {
      label: iScale ? "" + iScale.getLabelForValue(parsed[iScale.axis]) : "",
      value: vScale ? "" + vScale.getLabelForValue(parsed[vScale.axis]) : ""
    };
  }
  _update(mode) {
    const meta = this._cachedMeta;
    this.update(mode || "default");
    meta._clip = toClip(valueOrDefault(this.options.clip, defaultClip(meta.xScale, meta.yScale, this.getMaxOverflow())));
  }
  update(mode) {
  }
  draw() {
    const ctx = this._ctx;
    const chart = this.chart;
    const meta = this._cachedMeta;
    const elements = meta.data || [];
    const area = chart.chartArea;
    const active = [];
    const start = this._drawStart || 0;
    const count = this._drawCount || elements.length - start;
    const drawActiveElementsOnTop = this.options.drawActiveElementsOnTop;
    let i;
    if (meta.dataset) {
      meta.dataset.draw(ctx, area, start, count);
    }
    for (i = start; i < start + count; ++i) {
      const element = elements[i];
      if (element.hidden) {
        continue;
      }
      if (element.active && drawActiveElementsOnTop) {
        active.push(element);
      } else {
        element.draw(ctx, area);
      }
    }
    for (i = 0; i < active.length; ++i) {
      active[i].draw(ctx, area);
    }
  }
  getStyle(index, active) {
    const mode = active ? "active" : "default";
    return index === void 0 && this._cachedMeta.dataset ? this.resolveDatasetElementOptions(mode) : this.resolveDataElementOptions(index || 0, mode);
  }
  getContext(index, active, mode) {
    const dataset = this.getDataset();
    let context;
    if (index >= 0 && index < this._cachedMeta.data.length) {
      const element = this._cachedMeta.data[index];
      context = element.$context || (element.$context = createDataContext(this.getContext(), index, element));
      context.parsed = this.getParsed(index);
      context.raw = dataset.data[index];
      context.index = context.dataIndex = index;
    } else {
      context = this.$context || (this.$context = createDatasetContext(this.chart.getContext(), this.index));
      context.dataset = dataset;
      context.index = context.datasetIndex = this.index;
    }
    context.active = !!active;
    context.mode = mode;
    return context;
  }
  resolveDatasetElementOptions(mode) {
    return this._resolveElementOptions(this.datasetElementType.id, mode);
  }
  resolveDataElementOptions(index, mode) {
    return this._resolveElementOptions(this.dataElementType.id, mode, index);
  }
  _resolveElementOptions(elementType, mode = "default", index) {
    const active = mode === "active";
    const cache = this._cachedDataOpts;
    const cacheKey = elementType + "-" + mode;
    const cached = cache[cacheKey];
    const sharing = this.enableOptionSharing && defined(index);
    if (cached) {
      return cloneIfNotShared(cached, sharing);
    }
    const config = this.chart.config;
    const scopeKeys = config.datasetElementScopeKeys(this._type, elementType);
    const prefixes = active ? [
      `${elementType}Hover`,
      "hover",
      elementType,
      ""
    ] : [
      elementType,
      ""
    ];
    const scopes = config.getOptionScopes(this.getDataset(), scopeKeys);
    const names2 = Object.keys(defaults.elements[elementType]);
    const context = () => this.getContext(index, active, mode);
    const values = config.resolveNamedOptions(scopes, names2, context, prefixes);
    if (values.$shared) {
      values.$shared = sharing;
      cache[cacheKey] = Object.freeze(cloneIfNotShared(values, sharing));
    }
    return values;
  }
  _resolveAnimations(index, transition, active) {
    const chart = this.chart;
    const cache = this._cachedDataOpts;
    const cacheKey = `animation-${transition}`;
    const cached = cache[cacheKey];
    if (cached) {
      return cached;
    }
    let options;
    if (chart.options.animation !== false) {
      const config = this.chart.config;
      const scopeKeys = config.datasetAnimationScopeKeys(this._type, transition);
      const scopes = config.getOptionScopes(this.getDataset(), scopeKeys);
      options = config.createResolver(scopes, this.getContext(index, active, transition));
    }
    const animations = new Animations(chart, options && options.animations);
    if (options && options._cacheable) {
      cache[cacheKey] = Object.freeze(animations);
    }
    return animations;
  }
  getSharedOptions(options) {
    if (!options.$shared) {
      return;
    }
    return this._sharedOptions || (this._sharedOptions = Object.assign({}, options));
  }
  includeOptions(mode, sharedOptions) {
    return !sharedOptions || isDirectUpdateMode(mode) || this.chart._animationsDisabled;
  }
  _getSharedOptions(start, mode) {
    const firstOpts = this.resolveDataElementOptions(start, mode);
    const previouslySharedOptions = this._sharedOptions;
    const sharedOptions = this.getSharedOptions(firstOpts);
    const includeOptions = this.includeOptions(mode, sharedOptions) || sharedOptions !== previouslySharedOptions;
    this.updateSharedOptions(sharedOptions, mode, firstOpts);
    return {
      sharedOptions,
      includeOptions
    };
  }
  updateElement(element, index, properties, mode) {
    if (isDirectUpdateMode(mode)) {
      Object.assign(element, properties);
    } else {
      this._resolveAnimations(index, mode).update(element, properties);
    }
  }
  updateSharedOptions(sharedOptions, mode, newOptions) {
    if (sharedOptions && !isDirectUpdateMode(mode)) {
      this._resolveAnimations(void 0, mode).update(sharedOptions, newOptions);
    }
  }
  _setStyle(element, index, mode, active) {
    element.active = active;
    const options = this.getStyle(index, active);
    this._resolveAnimations(index, mode, active).update(element, {
      options: !active && this.getSharedOptions(options) || options
    });
  }
  removeHoverStyle(element, datasetIndex, index) {
    this._setStyle(element, index, "active", false);
  }
  setHoverStyle(element, datasetIndex, index) {
    this._setStyle(element, index, "active", true);
  }
  _removeDatasetHoverStyle() {
    const element = this._cachedMeta.dataset;
    if (element) {
      this._setStyle(element, void 0, "active", false);
    }
  }
  _setDatasetHoverStyle() {
    const element = this._cachedMeta.dataset;
    if (element) {
      this._setStyle(element, void 0, "active", true);
    }
  }
  _resyncElements(resetNewElements) {
    const data = this._data;
    const elements = this._cachedMeta.data;
    for (const [method, arg1, arg2] of this._syncList) {
      this[method](arg1, arg2);
    }
    this._syncList = [];
    const numMeta = elements.length;
    const numData = data.length;
    const count = Math.min(numData, numMeta);
    if (count) {
      this.parse(0, count);
    }
    if (numData > numMeta) {
      this._insertElements(numMeta, numData - numMeta, resetNewElements);
    } else if (numData < numMeta) {
      this._removeElements(numData, numMeta - numData);
    }
  }
  _insertElements(start, count, resetNewElements = true) {
    const meta = this._cachedMeta;
    const data = meta.data;
    const end = start + count;
    let i;
    const move = (arr) => {
      arr.length += count;
      for (i = arr.length - 1; i >= end; i--) {
        arr[i] = arr[i - count];
      }
    };
    move(data);
    for (i = start; i < end; ++i) {
      data[i] = new this.dataElementType();
    }
    if (this._parsing) {
      move(meta._parsed);
    }
    this.parse(start, count);
    if (resetNewElements) {
      this.updateElements(data, start, count, "reset");
    }
  }
  updateElements(element, start, count, mode) {
  }
  _removeElements(start, count) {
    const meta = this._cachedMeta;
    if (this._parsing) {
      const removed = meta._parsed.splice(start, count);
      if (meta._stacked) {
        clearStacks(meta, removed);
      }
    }
    meta.data.splice(start, count);
  }
  _sync(args) {
    if (this._parsing) {
      this._syncList.push(args);
    } else {
      const [method, arg1, arg2] = args;
      this[method](arg1, arg2);
    }
    this.chart._dataChanges.push([
      this.index,
      ...args
    ]);
  }
  _onDataPush() {
    const count = arguments.length;
    this._sync([
      "_insertElements",
      this.getDataset().data.length - count,
      count
    ]);
  }
  _onDataPop() {
    this._sync([
      "_removeElements",
      this._cachedMeta.data.length - 1,
      1
    ]);
  }
  _onDataShift() {
    this._sync([
      "_removeElements",
      0,
      1
    ]);
  }
  _onDataSplice(start, count) {
    if (count) {
      this._sync([
        "_removeElements",
        start,
        count
      ]);
    }
    const newCount = arguments.length - 2;
    if (newCount) {
      this._sync([
        "_insertElements",
        start,
        newCount
      ]);
    }
  }
  _onDataUnshift() {
    this._sync([
      "_insertElements",
      0,
      arguments.length
    ]);
  }
};
__publicField(DatasetController, "defaults", {});
__publicField(DatasetController, "datasetElementType", null);
__publicField(DatasetController, "dataElementType", null);
function getAllScaleValues(scale, type) {
  if (!scale._cache.$bar) {
    const visibleMetas = scale.getMatchingVisibleMetas(type);
    let values = [];
    for (let i = 0, ilen = visibleMetas.length; i < ilen; i++) {
      values = values.concat(visibleMetas[i].controller.getAllParsedValues(scale));
    }
    scale._cache.$bar = _arrayUnique(values.sort((a, b) => a - b));
  }
  return scale._cache.$bar;
}
function computeMinSampleSize(meta) {
  const scale = meta.iScale;
  const values = getAllScaleValues(scale, meta.type);
  let min = scale._length;
  let i, ilen, curr, prev;
  const updateMinAndPrev = () => {
    if (curr === 32767 || curr === -32768) {
      return;
    }
    if (defined(prev)) {
      min = Math.min(min, Math.abs(curr - prev) || min);
    }
    prev = curr;
  };
  for (i = 0, ilen = values.length; i < ilen; ++i) {
    curr = scale.getPixelForValue(values[i]);
    updateMinAndPrev();
  }
  prev = void 0;
  for (i = 0, ilen = scale.ticks.length; i < ilen; ++i) {
    curr = scale.getPixelForTick(i);
    updateMinAndPrev();
  }
  return min;
}
function computeFitCategoryTraits(index, ruler, options, stackCount) {
  const thickness = options.barThickness;
  let size, ratio;
  if (isNullOrUndef(thickness)) {
    size = ruler.min * options.categoryPercentage;
    ratio = options.barPercentage;
  } else {
    size = thickness * stackCount;
    ratio = 1;
  }
  return {
    chunk: size / stackCount,
    ratio,
    start: ruler.pixels[index] - size / 2
  };
}
function computeFlexCategoryTraits(index, ruler, options, stackCount) {
  const pixels = ruler.pixels;
  const curr = pixels[index];
  let prev = index > 0 ? pixels[index - 1] : null;
  let next = index < pixels.length - 1 ? pixels[index + 1] : null;
  const percent = options.categoryPercentage;
  if (prev === null) {
    prev = curr - (next === null ? ruler.end - ruler.start : next - curr);
  }
  if (next === null) {
    next = curr + curr - prev;
  }
  const start = curr - (curr - Math.min(prev, next)) / 2 * percent;
  const size = Math.abs(next - prev) / 2 * percent;
  return {
    chunk: size / stackCount,
    ratio: options.barPercentage,
    start
  };
}
function parseFloatBar(entry, item, vScale, i) {
  const startValue = vScale.parse(entry[0], i);
  const endValue = vScale.parse(entry[1], i);
  const min = Math.min(startValue, endValue);
  const max = Math.max(startValue, endValue);
  let barStart = min;
  let barEnd = max;
  if (Math.abs(min) > Math.abs(max)) {
    barStart = max;
    barEnd = min;
  }
  item[vScale.axis] = barEnd;
  item._custom = {
    barStart,
    barEnd,
    start: startValue,
    end: endValue,
    min,
    max
  };
}
function parseValue(entry, item, vScale, i) {
  if (isArray(entry)) {
    parseFloatBar(entry, item, vScale, i);
  } else {
    item[vScale.axis] = vScale.parse(entry, i);
  }
  return item;
}
function parseArrayOrPrimitive(meta, data, start, count) {
  const iScale = meta.iScale;
  const vScale = meta.vScale;
  const labels = iScale.getLabels();
  const singleScale = iScale === vScale;
  const parsed = [];
  let i, ilen, item, entry;
  for (i = start, ilen = start + count; i < ilen; ++i) {
    entry = data[i];
    item = {};
    item[iScale.axis] = singleScale || iScale.parse(labels[i], i);
    parsed.push(parseValue(entry, item, vScale, i));
  }
  return parsed;
}
function isFloatBar(custom) {
  return custom && custom.barStart !== void 0 && custom.barEnd !== void 0;
}
function barSign(size, vScale, actualBase) {
  if (size !== 0) {
    return sign(size);
  }
  return (vScale.isHorizontal() ? 1 : -1) * (vScale.min >= actualBase ? 1 : -1);
}
function borderProps(properties) {
  let reverse, start, end, top, bottom;
  if (properties.horizontal) {
    reverse = properties.base > properties.x;
    start = "left";
    end = "right";
  } else {
    reverse = properties.base < properties.y;
    start = "bottom";
    end = "top";
  }
  if (reverse) {
    top = "end";
    bottom = "start";
  } else {
    top = "start";
    bottom = "end";
  }
  return {
    start,
    end,
    reverse,
    top,
    bottom
  };
}
function setBorderSkipped(properties, options, stack, index) {
  let edge = options.borderSkipped;
  const res = {};
  if (!edge) {
    properties.borderSkipped = res;
    return;
  }
  if (edge === true) {
    properties.borderSkipped = {
      top: true,
      right: true,
      bottom: true,
      left: true
    };
    return;
  }
  const { start, end, reverse, top, bottom } = borderProps(properties);
  if (edge === "middle" && stack) {
    properties.enableBorderRadius = true;
    if ((stack._top || 0) === index) {
      edge = top;
    } else if ((stack._bottom || 0) === index) {
      edge = bottom;
    } else {
      res[parseEdge(bottom, start, end, reverse)] = true;
      edge = top;
    }
  }
  res[parseEdge(edge, start, end, reverse)] = true;
  properties.borderSkipped = res;
}
function parseEdge(edge, a, b, reverse) {
  if (reverse) {
    edge = swap(edge, a, b);
    edge = startEnd(edge, b, a);
  } else {
    edge = startEnd(edge, a, b);
  }
  return edge;
}
function swap(orig, v1, v2) {
  return orig === v1 ? v2 : orig === v2 ? v1 : orig;
}
function startEnd(v, start, end) {
  return v === "start" ? start : v === "end" ? end : v;
}
function setInflateAmount(properties, { inflateAmount }, ratio) {
  properties.inflateAmount = inflateAmount === "auto" ? ratio === 1 ? 0.33 : 0 : inflateAmount;
}
var BarController = class extends DatasetController {
  parsePrimitiveData(meta, data, start, count) {
    return parseArrayOrPrimitive(meta, data, start, count);
  }
  parseArrayData(meta, data, start, count) {
    return parseArrayOrPrimitive(meta, data, start, count);
  }
  parseObjectData(meta, data, start, count) {
    const { iScale, vScale } = meta;
    const { xAxisKey = "x", yAxisKey = "y" } = this._parsing;
    const iAxisKey = iScale.axis === "x" ? xAxisKey : yAxisKey;
    const vAxisKey = vScale.axis === "x" ? xAxisKey : yAxisKey;
    const parsed = [];
    let i, ilen, item, obj;
    for (i = start, ilen = start + count; i < ilen; ++i) {
      obj = data[i];
      item = {};
      item[iScale.axis] = iScale.parse(resolveObjectKey(obj, iAxisKey), i);
      parsed.push(parseValue(resolveObjectKey(obj, vAxisKey), item, vScale, i));
    }
    return parsed;
  }
  updateRangeFromParsed(range, scale, parsed, stack) {
    super.updateRangeFromParsed(range, scale, parsed, stack);
    const custom = parsed._custom;
    if (custom && scale === this._cachedMeta.vScale) {
      range.min = Math.min(range.min, custom.min);
      range.max = Math.max(range.max, custom.max);
    }
  }
  getMaxOverflow() {
    return 0;
  }
  getLabelAndValue(index) {
    const meta = this._cachedMeta;
    const { iScale, vScale } = meta;
    const parsed = this.getParsed(index);
    const custom = parsed._custom;
    const value = isFloatBar(custom) ? "[" + custom.start + ", " + custom.end + "]" : "" + vScale.getLabelForValue(parsed[vScale.axis]);
    return {
      label: "" + iScale.getLabelForValue(parsed[iScale.axis]),
      value
    };
  }
  initialize() {
    this.enableOptionSharing = true;
    super.initialize();
    const meta = this._cachedMeta;
    meta.stack = this.getDataset().stack;
  }
  update(mode) {
    const meta = this._cachedMeta;
    this.updateElements(meta.data, 0, meta.data.length, mode);
  }
  updateElements(bars, start, count, mode) {
    const reset = mode === "reset";
    const { index, _cachedMeta: { vScale } } = this;
    const base = vScale.getBasePixel();
    const horizontal = vScale.isHorizontal();
    const ruler = this._getRuler();
    const { sharedOptions, includeOptions } = this._getSharedOptions(start, mode);
    for (let i = start; i < start + count; i++) {
      const parsed = this.getParsed(i);
      const vpixels = reset || isNullOrUndef(parsed[vScale.axis]) ? {
        base,
        head: base
      } : this._calculateBarValuePixels(i);
      const ipixels = this._calculateBarIndexPixels(i, ruler);
      const stack = (parsed._stacks || {})[vScale.axis];
      const properties = {
        horizontal,
        base: vpixels.base,
        enableBorderRadius: !stack || isFloatBar(parsed._custom) || index === stack._top || index === stack._bottom,
        x: horizontal ? vpixels.head : ipixels.center,
        y: horizontal ? ipixels.center : vpixels.head,
        height: horizontal ? ipixels.size : Math.abs(vpixels.size),
        width: horizontal ? Math.abs(vpixels.size) : ipixels.size
      };
      if (includeOptions) {
        properties.options = sharedOptions || this.resolveDataElementOptions(i, bars[i].active ? "active" : mode);
      }
      const options = properties.options || bars[i].options;
      setBorderSkipped(properties, options, stack, index);
      setInflateAmount(properties, options, ruler.ratio);
      this.updateElement(bars[i], i, properties, mode);
    }
  }
  _getStacks(last, dataIndex) {
    const { iScale } = this._cachedMeta;
    const metasets = iScale.getMatchingVisibleMetas(this._type).filter((meta) => meta.controller.options.grouped);
    const stacked = iScale.options.stacked;
    const stacks = [];
    const currentParsed = this._cachedMeta.controller.getParsed(dataIndex);
    const iScaleValue = currentParsed && currentParsed[iScale.axis];
    const skipNull = (meta) => {
      const parsed = meta._parsed.find((item) => item[iScale.axis] === iScaleValue);
      const val = parsed && parsed[meta.vScale.axis];
      if (isNullOrUndef(val) || isNaN(val)) {
        return true;
      }
    };
    for (const meta of metasets) {
      if (dataIndex !== void 0 && skipNull(meta)) {
        continue;
      }
      if (stacked === false || stacks.indexOf(meta.stack) === -1 || stacked === void 0 && meta.stack === void 0) {
        stacks.push(meta.stack);
      }
      if (meta.index === last) {
        break;
      }
    }
    if (!stacks.length) {
      stacks.push(void 0);
    }
    return stacks;
  }
  _getStackCount(index) {
    return this._getStacks(void 0, index).length;
  }
  _getAxisCount() {
    return this._getAxis().length;
  }
  getFirstScaleIdForIndexAxis() {
    const scales = this.chart.scales;
    const indexScaleId = this.chart.options.indexAxis;
    return Object.keys(scales).filter((key) => scales[key].axis === indexScaleId).shift();
  }
  _getAxis() {
    const axis = {};
    const firstScaleAxisId = this.getFirstScaleIdForIndexAxis();
    for (const dataset of this.chart.data.datasets) {
      axis[valueOrDefault(this.chart.options.indexAxis === "x" ? dataset.xAxisID : dataset.yAxisID, firstScaleAxisId)] = true;
    }
    return Object.keys(axis);
  }
  _getStackIndex(datasetIndex, name, dataIndex) {
    const stacks = this._getStacks(datasetIndex, dataIndex);
    const index = name !== void 0 ? stacks.indexOf(name) : -1;
    return index === -1 ? stacks.length - 1 : index;
  }
  _getRuler() {
    const opts = this.options;
    const meta = this._cachedMeta;
    const iScale = meta.iScale;
    const pixels = [];
    let i, ilen;
    for (i = 0, ilen = meta.data.length; i < ilen; ++i) {
      pixels.push(iScale.getPixelForValue(this.getParsed(i)[iScale.axis], i));
    }
    const barThickness = opts.barThickness;
    const min = barThickness || computeMinSampleSize(meta);
    return {
      min,
      pixels,
      start: iScale._startPixel,
      end: iScale._endPixel,
      stackCount: this._getStackCount(),
      scale: iScale,
      grouped: opts.grouped,
      ratio: barThickness ? 1 : opts.categoryPercentage * opts.barPercentage
    };
  }
  _calculateBarValuePixels(index) {
    const { _cachedMeta: { vScale, _stacked, index: datasetIndex }, options: { base: baseValue, minBarLength } } = this;
    const actualBase = baseValue || 0;
    const parsed = this.getParsed(index);
    const custom = parsed._custom;
    const floating = isFloatBar(custom);
    let value = parsed[vScale.axis];
    let start = 0;
    let length = _stacked ? this.applyStack(vScale, parsed, _stacked) : value;
    let head, size;
    if (length !== value) {
      start = length - value;
      length = value;
    }
    if (floating) {
      value = custom.barStart;
      length = custom.barEnd - custom.barStart;
      if (value !== 0 && sign(value) !== sign(custom.barEnd)) {
        start = 0;
      }
      start += value;
    }
    const startValue = !isNullOrUndef(baseValue) && !floating ? baseValue : start;
    let base = vScale.getPixelForValue(startValue);
    if (this.chart.getDataVisibility(index)) {
      head = vScale.getPixelForValue(start + length);
    } else {
      head = base;
    }
    size = head - base;
    if (Math.abs(size) < minBarLength) {
      size = barSign(size, vScale, actualBase) * minBarLength;
      if (value === actualBase) {
        base -= size / 2;
      }
      const startPixel = vScale.getPixelForDecimal(0);
      const endPixel = vScale.getPixelForDecimal(1);
      const min = Math.min(startPixel, endPixel);
      const max = Math.max(startPixel, endPixel);
      base = Math.max(Math.min(base, max), min);
      head = base + size;
      if (_stacked && !floating) {
        parsed._stacks[vScale.axis]._visualValues[datasetIndex] = vScale.getValueForPixel(head) - vScale.getValueForPixel(base);
      }
    }
    if (base === vScale.getPixelForValue(actualBase)) {
      const halfGrid = sign(size) * vScale.getLineWidthForValue(actualBase) / 2;
      base += halfGrid;
      size -= halfGrid;
    }
    return {
      size,
      base,
      head,
      center: head + size / 2
    };
  }
  _calculateBarIndexPixels(index, ruler) {
    const scale = ruler.scale;
    const options = this.options;
    const skipNull = options.skipNull;
    const maxBarThickness = valueOrDefault(options.maxBarThickness, Infinity);
    let center, size;
    const axisCount = this._getAxisCount();
    if (ruler.grouped) {
      const stackCount = skipNull ? this._getStackCount(index) : ruler.stackCount;
      const range = options.barThickness === "flex" ? computeFlexCategoryTraits(index, ruler, options, stackCount * axisCount) : computeFitCategoryTraits(index, ruler, options, stackCount * axisCount);
      const axisID = this.chart.options.indexAxis === "x" ? this.getDataset().xAxisID : this.getDataset().yAxisID;
      const axisNumber = this._getAxis().indexOf(valueOrDefault(axisID, this.getFirstScaleIdForIndexAxis()));
      const stackIndex = this._getStackIndex(this.index, this._cachedMeta.stack, skipNull ? index : void 0) + axisNumber;
      center = range.start + range.chunk * stackIndex + range.chunk / 2;
      size = Math.min(maxBarThickness, range.chunk * range.ratio);
    } else {
      center = scale.getPixelForValue(this.getParsed(index)[scale.axis], index);
      size = Math.min(maxBarThickness, ruler.min * ruler.ratio);
    }
    return {
      base: center - size / 2,
      head: center + size / 2,
      center,
      size
    };
  }
  draw() {
    const meta = this._cachedMeta;
    const vScale = meta.vScale;
    const rects = meta.data;
    const ilen = rects.length;
    let i = 0;
    for (; i < ilen; ++i) {
      if (this.getParsed(i)[vScale.axis] !== null && !rects[i].hidden) {
        rects[i].draw(this._ctx);
      }
    }
  }
};
__publicField(BarController, "id", "bar");
__publicField(BarController, "defaults", {
  datasetElementType: false,
  dataElementType: "bar",
  categoryPercentage: 0.8,
  barPercentage: 0.9,
  grouped: true,
  animations: {
    numbers: {
      type: "number",
      properties: [
        "x",
        "y",
        "base",
        "width",
        "height"
      ]
    }
  }
});
__publicField(BarController, "overrides", {
  scales: {
    _index_: {
      type: "category",
      offset: true,
      grid: {
        offset: true
      }
    },
    _value_: {
      type: "linear",
      beginAtZero: true
    }
  }
});
var LineController = class extends DatasetController {
  initialize() {
    this.enableOptionSharing = true;
    this.supportsDecimation = true;
    super.initialize();
  }
  update(mode) {
    const meta = this._cachedMeta;
    const { dataset: line, data: points = [], _dataset } = meta;
    const animationsDisabled = this.chart._animationsDisabled;
    let { start, count } = _getStartAndCountOfVisiblePoints(meta, points, animationsDisabled);
    this._drawStart = start;
    this._drawCount = count;
    if (_scaleRangesChanged(meta)) {
      start = 0;
      count = points.length;
    }
    line._chart = this.chart;
    line._datasetIndex = this.index;
    line._decimated = !!_dataset._decimated;
    line.points = points;
    const options = this.resolveDatasetElementOptions(mode);
    if (!this.options.showLine) {
      options.borderWidth = 0;
    }
    options.segment = this.options.segment;
    this.updateElement(line, void 0, {
      animated: !animationsDisabled,
      options
    }, mode);
    this.updateElements(points, start, count, mode);
  }
  updateElements(points, start, count, mode) {
    const reset = mode === "reset";
    const { iScale, vScale, _stacked, _dataset } = this._cachedMeta;
    const { sharedOptions, includeOptions } = this._getSharedOptions(start, mode);
    const iAxis = iScale.axis;
    const vAxis = vScale.axis;
    const { spanGaps, segment } = this.options;
    const maxGapLength = isNumber(spanGaps) ? spanGaps : Number.POSITIVE_INFINITY;
    const directUpdate = this.chart._animationsDisabled || reset || mode === "none";
    const end = start + count;
    const pointsCount = points.length;
    let prevParsed = start > 0 && this.getParsed(start - 1);
    for (let i = 0; i < pointsCount; ++i) {
      const point = points[i];
      const properties = directUpdate ? point : {};
      if (i < start || i >= end) {
        properties.skip = true;
        continue;
      }
      const parsed = this.getParsed(i);
      const nullData = isNullOrUndef(parsed[vAxis]);
      const iPixel = properties[iAxis] = iScale.getPixelForValue(parsed[iAxis], i);
      const vPixel = properties[vAxis] = reset || nullData ? vScale.getBasePixel() : vScale.getPixelForValue(_stacked ? this.applyStack(vScale, parsed, _stacked) : parsed[vAxis], i);
      properties.skip = isNaN(iPixel) || isNaN(vPixel) || nullData;
      properties.stop = i > 0 && Math.abs(parsed[iAxis] - prevParsed[iAxis]) > maxGapLength;
      if (segment) {
        properties.parsed = parsed;
        properties.raw = _dataset.data[i];
      }
      if (includeOptions) {
        properties.options = sharedOptions || this.resolveDataElementOptions(i, point.active ? "active" : mode);
      }
      if (!directUpdate) {
        this.updateElement(point, i, properties, mode);
      }
      prevParsed = parsed;
    }
  }
  getMaxOverflow() {
    const meta = this._cachedMeta;
    const dataset = meta.dataset;
    const border = dataset.options && dataset.options.borderWidth || 0;
    const data = meta.data || [];
    if (!data.length) {
      return border;
    }
    const firstPoint = data[0].size(this.resolveDataElementOptions(0));
    const lastPoint = data[data.length - 1].size(this.resolveDataElementOptions(data.length - 1));
    return Math.max(border, firstPoint, lastPoint) / 2;
  }
  draw() {
    const meta = this._cachedMeta;
    meta.dataset.updateControlPoints(this.chart.chartArea, meta.iScale.axis);
    super.draw();
  }
};
__publicField(LineController, "id", "line");
__publicField(LineController, "defaults", {
  datasetElementType: "line",
  dataElementType: "point",
  showLine: true,
  spanGaps: false
});
__publicField(LineController, "overrides", {
  scales: {
    _index_: {
      type: "category"
    },
    _value_: {
      type: "linear"
    }
  }
});
function abstract() {
  throw new Error("This method is not implemented: Check that a complete date adapter is provided.");
}
var DateAdapterBase = class {
  constructor(options) {
    __publicField(this, "options");
    this.options = options || {};
  }
  /**
  * Override default date adapter methods.
  * Accepts type parameter to define options type.
  * @example
  * Chart._adapters._date.override<{myAdapterOption: string}>({
  *   init() {
  *     console.log(this.options.myAdapterOption);
  *   }
  * })
  */
  static override(members) {
    Object.assign(DateAdapterBase.prototype, members);
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  init() {
  }
  formats() {
    return abstract();
  }
  parse() {
    return abstract();
  }
  format() {
    return abstract();
  }
  add() {
    return abstract();
  }
  diff() {
    return abstract();
  }
  startOf() {
    return abstract();
  }
  endOf() {
    return abstract();
  }
};
var adapters = {
  _date: DateAdapterBase
};
function binarySearch(metaset, axis, value, intersect) {
  const { controller, data, _sorted } = metaset;
  const iScale = controller._cachedMeta.iScale;
  const spanGaps = metaset.dataset ? metaset.dataset.options ? metaset.dataset.options.spanGaps : null : null;
  if (iScale && axis === iScale.axis && axis !== "r" && _sorted && data.length) {
    const lookupMethod = iScale._reversePixels ? _rlookupByKey : _lookupByKey;
    if (!intersect) {
      const result = lookupMethod(data, axis, value);
      if (spanGaps) {
        const { vScale } = controller._cachedMeta;
        const { _parsed } = metaset;
        const distanceToDefinedLo = _parsed.slice(0, result.lo + 1).reverse().findIndex((point) => !isNullOrUndef(point[vScale.axis]));
        result.lo -= Math.max(0, distanceToDefinedLo);
        const distanceToDefinedHi = _parsed.slice(result.hi).findIndex((point) => !isNullOrUndef(point[vScale.axis]));
        result.hi += Math.max(0, distanceToDefinedHi);
      }
      return result;
    } else if (controller._sharedOptions) {
      const el = data[0];
      const range = typeof el.getRange === "function" && el.getRange(axis);
      if (range) {
        const start = lookupMethod(data, axis, value - range);
        const end = lookupMethod(data, axis, value + range);
        return {
          lo: start.lo,
          hi: end.hi
        };
      }
    }
  }
  return {
    lo: 0,
    hi: data.length - 1
  };
}
function evaluateInteractionItems(chart, axis, position, handler, intersect) {
  const metasets = chart.getSortedVisibleDatasetMetas();
  const value = position[axis];
  for (let i = 0, ilen = metasets.length; i < ilen; ++i) {
    const { index, data } = metasets[i];
    const { lo, hi } = binarySearch(metasets[i], axis, value, intersect);
    for (let j = lo; j <= hi; ++j) {
      const element = data[j];
      if (!element.skip) {
        handler(element, index, j);
      }
    }
  }
}
function getDistanceMetricForAxis(axis) {
  const useX = axis.indexOf("x") !== -1;
  const useY = axis.indexOf("y") !== -1;
  return function(pt1, pt2) {
    const deltaX = useX ? Math.abs(pt1.x - pt2.x) : 0;
    const deltaY = useY ? Math.abs(pt1.y - pt2.y) : 0;
    return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
  };
}
function getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible) {
  const items = [];
  if (!includeInvisible && !chart.isPointInArea(position)) {
    return items;
  }
  const evaluationFunc = function(element, datasetIndex, index) {
    if (!includeInvisible && !_isPointInArea(element, chart.chartArea, 0)) {
      return;
    }
    if (element.inRange(position.x, position.y, useFinalPosition)) {
      items.push({
        element,
        datasetIndex,
        index
      });
    }
  };
  evaluateInteractionItems(chart, axis, position, evaluationFunc, true);
  return items;
}
function getNearestRadialItems(chart, position, axis, useFinalPosition) {
  let items = [];
  function evaluationFunc(element, datasetIndex, index) {
    const { startAngle, endAngle } = element.getProps([
      "startAngle",
      "endAngle"
    ], useFinalPosition);
    const { angle } = getAngleFromPoint(element, {
      x: position.x,
      y: position.y
    });
    if (_angleBetween(angle, startAngle, endAngle)) {
      items.push({
        element,
        datasetIndex,
        index
      });
    }
  }
  evaluateInteractionItems(chart, axis, position, evaluationFunc);
  return items;
}
function getNearestCartesianItems(chart, position, axis, intersect, useFinalPosition, includeInvisible) {
  let items = [];
  const distanceMetric = getDistanceMetricForAxis(axis);
  let minDistance = Number.POSITIVE_INFINITY;
  function evaluationFunc(element, datasetIndex, index) {
    const inRange2 = element.inRange(position.x, position.y, useFinalPosition);
    if (intersect && !inRange2) {
      return;
    }
    const center = element.getCenterPoint(useFinalPosition);
    const pointInArea = !!includeInvisible || chart.isPointInArea(center);
    if (!pointInArea && !inRange2) {
      return;
    }
    const distance = distanceMetric(position, center);
    if (distance < minDistance) {
      items = [
        {
          element,
          datasetIndex,
          index
        }
      ];
      minDistance = distance;
    } else if (distance === minDistance) {
      items.push({
        element,
        datasetIndex,
        index
      });
    }
  }
  evaluateInteractionItems(chart, axis, position, evaluationFunc);
  return items;
}
function getNearestItems(chart, position, axis, intersect, useFinalPosition, includeInvisible) {
  if (!includeInvisible && !chart.isPointInArea(position)) {
    return [];
  }
  return axis === "r" && !intersect ? getNearestRadialItems(chart, position, axis, useFinalPosition) : getNearestCartesianItems(chart, position, axis, intersect, useFinalPosition, includeInvisible);
}
function getAxisItems(chart, position, axis, intersect, useFinalPosition) {
  const items = [];
  const rangeMethod = axis === "x" ? "inXRange" : "inYRange";
  let intersectsItem = false;
  evaluateInteractionItems(chart, axis, position, (element, datasetIndex, index) => {
    if (element[rangeMethod] && element[rangeMethod](position[axis], useFinalPosition)) {
      items.push({
        element,
        datasetIndex,
        index
      });
      intersectsItem = intersectsItem || element.inRange(position.x, position.y, useFinalPosition);
    }
  });
  if (intersect && !intersectsItem) {
    return [];
  }
  return items;
}
var Interaction = {
  evaluateInteractionItems,
  modes: {
    index(chart, e, options, useFinalPosition) {
      const position = getRelativePosition(e, chart);
      const axis = options.axis || "x";
      const includeInvisible = options.includeInvisible || false;
      const items = options.intersect ? getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible) : getNearestItems(chart, position, axis, false, useFinalPosition, includeInvisible);
      const elements = [];
      if (!items.length) {
        return [];
      }
      chart.getSortedVisibleDatasetMetas().forEach((meta) => {
        const index = items[0].index;
        const element = meta.data[index];
        if (element && !element.skip) {
          elements.push({
            element,
            datasetIndex: meta.index,
            index
          });
        }
      });
      return elements;
    },
    dataset(chart, e, options, useFinalPosition) {
      const position = getRelativePosition(e, chart);
      const axis = options.axis || "xy";
      const includeInvisible = options.includeInvisible || false;
      let items = options.intersect ? getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible) : getNearestItems(chart, position, axis, false, useFinalPosition, includeInvisible);
      if (items.length > 0) {
        const datasetIndex = items[0].datasetIndex;
        const data = chart.getDatasetMeta(datasetIndex).data;
        items = [];
        for (let i = 0; i < data.length; ++i) {
          items.push({
            element: data[i],
            datasetIndex,
            index: i
          });
        }
      }
      return items;
    },
    point(chart, e, options, useFinalPosition) {
      const position = getRelativePosition(e, chart);
      const axis = options.axis || "xy";
      const includeInvisible = options.includeInvisible || false;
      return getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible);
    },
    nearest(chart, e, options, useFinalPosition) {
      const position = getRelativePosition(e, chart);
      const axis = options.axis || "xy";
      const includeInvisible = options.includeInvisible || false;
      return getNearestItems(chart, position, axis, options.intersect, useFinalPosition, includeInvisible);
    },
    x(chart, e, options, useFinalPosition) {
      const position = getRelativePosition(e, chart);
      return getAxisItems(chart, position, "x", options.intersect, useFinalPosition);
    },
    y(chart, e, options, useFinalPosition) {
      const position = getRelativePosition(e, chart);
      return getAxisItems(chart, position, "y", options.intersect, useFinalPosition);
    }
  }
};
var STATIC_POSITIONS = [
  "left",
  "top",
  "right",
  "bottom"
];
function filterByPosition(array, position) {
  return array.filter((v) => v.pos === position);
}
function filterDynamicPositionByAxis(array, axis) {
  return array.filter((v) => STATIC_POSITIONS.indexOf(v.pos) === -1 && v.box.axis === axis);
}
function sortByWeight(array, reverse) {
  return array.sort((a, b) => {
    const v0 = reverse ? b : a;
    const v1 = reverse ? a : b;
    return v0.weight === v1.weight ? v0.index - v1.index : v0.weight - v1.weight;
  });
}
function wrapBoxes(boxes) {
  const layoutBoxes = [];
  let i, ilen, box, pos, stack, stackWeight;
  for (i = 0, ilen = (boxes || []).length; i < ilen; ++i) {
    box = boxes[i];
    ({ position: pos, options: { stack, stackWeight = 1 } } = box);
    layoutBoxes.push({
      index: i,
      box,
      pos,
      horizontal: box.isHorizontal(),
      weight: box.weight,
      stack: stack && pos + stack,
      stackWeight
    });
  }
  return layoutBoxes;
}
function buildStacks(layouts2) {
  const stacks = {};
  for (const wrap of layouts2) {
    const { stack, pos, stackWeight } = wrap;
    if (!stack || !STATIC_POSITIONS.includes(pos)) {
      continue;
    }
    const _stack = stacks[stack] || (stacks[stack] = {
      count: 0,
      placed: 0,
      weight: 0,
      size: 0
    });
    _stack.count++;
    _stack.weight += stackWeight;
  }
  return stacks;
}
function setLayoutDims(layouts2, params) {
  const stacks = buildStacks(layouts2);
  const { vBoxMaxWidth, hBoxMaxHeight } = params;
  let i, ilen, layout;
  for (i = 0, ilen = layouts2.length; i < ilen; ++i) {
    layout = layouts2[i];
    const { fullSize } = layout.box;
    const stack = stacks[layout.stack];
    const factor = stack && layout.stackWeight / stack.weight;
    if (layout.horizontal) {
      layout.width = factor ? factor * vBoxMaxWidth : fullSize && params.availableWidth;
      layout.height = hBoxMaxHeight;
    } else {
      layout.width = vBoxMaxWidth;
      layout.height = factor ? factor * hBoxMaxHeight : fullSize && params.availableHeight;
    }
  }
  return stacks;
}
function buildLayoutBoxes(boxes) {
  const layoutBoxes = wrapBoxes(boxes);
  const fullSize = sortByWeight(layoutBoxes.filter((wrap) => wrap.box.fullSize), true);
  const left = sortByWeight(filterByPosition(layoutBoxes, "left"), true);
  const right = sortByWeight(filterByPosition(layoutBoxes, "right"));
  const top = sortByWeight(filterByPosition(layoutBoxes, "top"), true);
  const bottom = sortByWeight(filterByPosition(layoutBoxes, "bottom"));
  const centerHorizontal = filterDynamicPositionByAxis(layoutBoxes, "x");
  const centerVertical = filterDynamicPositionByAxis(layoutBoxes, "y");
  return {
    fullSize,
    leftAndTop: left.concat(top),
    rightAndBottom: right.concat(centerVertical).concat(bottom).concat(centerHorizontal),
    chartArea: filterByPosition(layoutBoxes, "chartArea"),
    vertical: left.concat(right).concat(centerVertical),
    horizontal: top.concat(bottom).concat(centerHorizontal)
  };
}
function getCombinedMax(maxPadding, chartArea, a, b) {
  return Math.max(maxPadding[a], chartArea[a]) + Math.max(maxPadding[b], chartArea[b]);
}
function updateMaxPadding(maxPadding, boxPadding) {
  maxPadding.top = Math.max(maxPadding.top, boxPadding.top);
  maxPadding.left = Math.max(maxPadding.left, boxPadding.left);
  maxPadding.bottom = Math.max(maxPadding.bottom, boxPadding.bottom);
  maxPadding.right = Math.max(maxPadding.right, boxPadding.right);
}
function updateDims(chartArea, params, layout, stacks) {
  const { pos, box } = layout;
  const maxPadding = chartArea.maxPadding;
  if (!isObject(pos)) {
    if (layout.size) {
      chartArea[pos] -= layout.size;
    }
    const stack = stacks[layout.stack] || {
      size: 0,
      count: 1
    };
    stack.size = Math.max(stack.size, layout.horizontal ? box.height : box.width);
    layout.size = stack.size / stack.count;
    chartArea[pos] += layout.size;
  }
  if (box.getPadding) {
    updateMaxPadding(maxPadding, box.getPadding());
  }
  const newWidth = Math.max(0, params.outerWidth - getCombinedMax(maxPadding, chartArea, "left", "right"));
  const newHeight = Math.max(0, params.outerHeight - getCombinedMax(maxPadding, chartArea, "top", "bottom"));
  const widthChanged = newWidth !== chartArea.w;
  const heightChanged = newHeight !== chartArea.h;
  chartArea.w = newWidth;
  chartArea.h = newHeight;
  return layout.horizontal ? {
    same: widthChanged,
    other: heightChanged
  } : {
    same: heightChanged,
    other: widthChanged
  };
}
function handleMaxPadding(chartArea) {
  const maxPadding = chartArea.maxPadding;
  function updatePos(pos) {
    const change = Math.max(maxPadding[pos] - chartArea[pos], 0);
    chartArea[pos] += change;
    return change;
  }
  chartArea.y += updatePos("top");
  chartArea.x += updatePos("left");
  updatePos("right");
  updatePos("bottom");
}
function getMargins(horizontal, chartArea) {
  const maxPadding = chartArea.maxPadding;
  function marginForPositions(positions2) {
    const margin = {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    };
    positions2.forEach((pos) => {
      margin[pos] = Math.max(chartArea[pos], maxPadding[pos]);
    });
    return margin;
  }
  return horizontal ? marginForPositions([
    "left",
    "right"
  ]) : marginForPositions([
    "top",
    "bottom"
  ]);
}
function fitBoxes(boxes, chartArea, params, stacks) {
  const refitBoxes = [];
  let i, ilen, layout, box, refit, changed;
  for (i = 0, ilen = boxes.length, refit = 0; i < ilen; ++i) {
    layout = boxes[i];
    box = layout.box;
    box.update(layout.width || chartArea.w, layout.height || chartArea.h, getMargins(layout.horizontal, chartArea));
    const { same, other } = updateDims(chartArea, params, layout, stacks);
    refit |= same && refitBoxes.length;
    changed = changed || other;
    if (!box.fullSize) {
      refitBoxes.push(layout);
    }
  }
  return refit && fitBoxes(refitBoxes, chartArea, params, stacks) || changed;
}
function setBoxDims(box, left, top, width, height) {
  box.top = top;
  box.left = left;
  box.right = left + width;
  box.bottom = top + height;
  box.width = width;
  box.height = height;
}
function placeBoxes(boxes, chartArea, params, stacks) {
  const userPadding = params.padding;
  let { x, y } = chartArea;
  for (const layout of boxes) {
    const box = layout.box;
    const stack = stacks[layout.stack] || {
      count: 1,
      placed: 0,
      weight: 1
    };
    const weight = layout.stackWeight / stack.weight || 1;
    if (layout.horizontal) {
      const width = chartArea.w * weight;
      const height = stack.size || box.height;
      if (defined(stack.start)) {
        y = stack.start;
      }
      if (box.fullSize) {
        setBoxDims(box, userPadding.left, y, params.outerWidth - userPadding.right - userPadding.left, height);
      } else {
        setBoxDims(box, chartArea.left + stack.placed, y, width, height);
      }
      stack.start = y;
      stack.placed += width;
      y = box.bottom;
    } else {
      const height = chartArea.h * weight;
      const width = stack.size || box.width;
      if (defined(stack.start)) {
        x = stack.start;
      }
      if (box.fullSize) {
        setBoxDims(box, x, userPadding.top, width, params.outerHeight - userPadding.bottom - userPadding.top);
      } else {
        setBoxDims(box, x, chartArea.top + stack.placed, width, height);
      }
      stack.start = x;
      stack.placed += height;
      x = box.right;
    }
  }
  chartArea.x = x;
  chartArea.y = y;
}
var layouts = {
  addBox(chart, item) {
    if (!chart.boxes) {
      chart.boxes = [];
    }
    item.fullSize = item.fullSize || false;
    item.position = item.position || "top";
    item.weight = item.weight || 0;
    item._layers = item._layers || function() {
      return [
        {
          z: 0,
          draw(chartArea) {
            item.draw(chartArea);
          }
        }
      ];
    };
    chart.boxes.push(item);
  },
  removeBox(chart, layoutItem) {
    const index = chart.boxes ? chart.boxes.indexOf(layoutItem) : -1;
    if (index !== -1) {
      chart.boxes.splice(index, 1);
    }
  },
  configure(chart, item, options) {
    item.fullSize = options.fullSize;
    item.position = options.position;
    item.weight = options.weight;
  },
  update(chart, width, height, minPadding) {
    if (!chart) {
      return;
    }
    const padding = toPadding(chart.options.layout.padding);
    const availableWidth = Math.max(width - padding.width, 0);
    const availableHeight = Math.max(height - padding.height, 0);
    const boxes = buildLayoutBoxes(chart.boxes);
    const verticalBoxes = boxes.vertical;
    const horizontalBoxes = boxes.horizontal;
    each(chart.boxes, (box) => {
      if (typeof box.beforeLayout === "function") {
        box.beforeLayout();
      }
    });
    const visibleVerticalBoxCount = verticalBoxes.reduce((total, wrap) => wrap.box.options && wrap.box.options.display === false ? total : total + 1, 0) || 1;
    const params = Object.freeze({
      outerWidth: width,
      outerHeight: height,
      padding,
      availableWidth,
      availableHeight,
      vBoxMaxWidth: availableWidth / 2 / visibleVerticalBoxCount,
      hBoxMaxHeight: availableHeight / 2
    });
    const maxPadding = Object.assign({}, padding);
    updateMaxPadding(maxPadding, toPadding(minPadding));
    const chartArea = Object.assign({
      maxPadding,
      w: availableWidth,
      h: availableHeight,
      x: padding.left,
      y: padding.top
    }, padding);
    const stacks = setLayoutDims(verticalBoxes.concat(horizontalBoxes), params);
    fitBoxes(boxes.fullSize, chartArea, params, stacks);
    fitBoxes(verticalBoxes, chartArea, params, stacks);
    if (fitBoxes(horizontalBoxes, chartArea, params, stacks)) {
      fitBoxes(verticalBoxes, chartArea, params, stacks);
    }
    handleMaxPadding(chartArea);
    placeBoxes(boxes.leftAndTop, chartArea, params, stacks);
    chartArea.x += chartArea.w;
    chartArea.y += chartArea.h;
    placeBoxes(boxes.rightAndBottom, chartArea, params, stacks);
    chart.chartArea = {
      left: chartArea.left,
      top: chartArea.top,
      right: chartArea.left + chartArea.w,
      bottom: chartArea.top + chartArea.h,
      height: chartArea.h,
      width: chartArea.w
    };
    each(boxes.chartArea, (layout) => {
      const box = layout.box;
      Object.assign(box, chart.chartArea);
      box.update(chartArea.w, chartArea.h, {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      });
    });
  }
};
var BasePlatform = class {
  acquireContext(canvas, aspectRatio) {
  }
  releaseContext(context) {
    return false;
  }
  addEventListener(chart, type, listener) {
  }
  removeEventListener(chart, type, listener) {
  }
  getDevicePixelRatio() {
    return 1;
  }
  getMaximumSize(element, width, height, aspectRatio) {
    width = Math.max(0, width || element.width);
    height = height || element.height;
    return {
      width,
      height: Math.max(0, aspectRatio ? Math.floor(width / aspectRatio) : height)
    };
  }
  isAttached(canvas) {
    return true;
  }
  updateConfig(config) {
  }
};
var BasicPlatform = class extends BasePlatform {
  acquireContext(item) {
    return item && item.getContext && item.getContext("2d") || null;
  }
  updateConfig(config) {
    config.options.animation = false;
  }
};
var EXPANDO_KEY = "$chartjs";
var EVENT_TYPES = {
  touchstart: "mousedown",
  touchmove: "mousemove",
  touchend: "mouseup",
  pointerenter: "mouseenter",
  pointerdown: "mousedown",
  pointermove: "mousemove",
  pointerup: "mouseup",
  pointerleave: "mouseout",
  pointerout: "mouseout"
};
var isNullOrEmpty = (value) => value === null || value === "";
function initCanvas(canvas, aspectRatio) {
  const style = canvas.style;
  const renderHeight = canvas.getAttribute("height");
  const renderWidth = canvas.getAttribute("width");
  canvas[EXPANDO_KEY] = {
    initial: {
      height: renderHeight,
      width: renderWidth,
      style: {
        display: style.display,
        height: style.height,
        width: style.width
      }
    }
  };
  style.display = style.display || "block";
  style.boxSizing = style.boxSizing || "border-box";
  if (isNullOrEmpty(renderWidth)) {
    const displayWidth = readUsedSize(canvas, "width");
    if (displayWidth !== void 0) {
      canvas.width = displayWidth;
    }
  }
  if (isNullOrEmpty(renderHeight)) {
    if (canvas.style.height === "") {
      canvas.height = canvas.width / (aspectRatio || 2);
    } else {
      const displayHeight = readUsedSize(canvas, "height");
      if (displayHeight !== void 0) {
        canvas.height = displayHeight;
      }
    }
  }
  return canvas;
}
var eventListenerOptions = supportsEventListenerOptions ? {
  passive: true
} : false;
function addListener(node, type, listener) {
  if (node) {
    node.addEventListener(type, listener, eventListenerOptions);
  }
}
function removeListener(chart, type, listener) {
  if (chart && chart.canvas) {
    chart.canvas.removeEventListener(type, listener, eventListenerOptions);
  }
}
function fromNativeEvent(event, chart) {
  const type = EVENT_TYPES[event.type] || event.type;
  const { x, y } = getRelativePosition(event, chart);
  return {
    type,
    chart,
    native: event,
    x: x !== void 0 ? x : null,
    y: y !== void 0 ? y : null
  };
}
function nodeListContains(nodeList, canvas) {
  for (const node of nodeList) {
    if (node === canvas || node.contains(canvas)) {
      return true;
    }
  }
}
function createAttachObserver(chart, type, listener) {
  const canvas = chart.canvas;
  const observer = new MutationObserver((entries) => {
    let trigger = false;
    for (const entry of entries) {
      trigger = trigger || nodeListContains(entry.addedNodes, canvas);
      trigger = trigger && !nodeListContains(entry.removedNodes, canvas);
    }
    if (trigger) {
      listener();
    }
  });
  observer.observe(document, {
    childList: true,
    subtree: true
  });
  return observer;
}
function createDetachObserver(chart, type, listener) {
  const canvas = chart.canvas;
  const observer = new MutationObserver((entries) => {
    let trigger = false;
    for (const entry of entries) {
      trigger = trigger || nodeListContains(entry.removedNodes, canvas);
      trigger = trigger && !nodeListContains(entry.addedNodes, canvas);
    }
    if (trigger) {
      listener();
    }
  });
  observer.observe(document, {
    childList: true,
    subtree: true
  });
  return observer;
}
var drpListeningCharts = /* @__PURE__ */ new Map();
var oldDevicePixelRatio = 0;
function onWindowResize() {
  const dpr = window.devicePixelRatio;
  if (dpr === oldDevicePixelRatio) {
    return;
  }
  oldDevicePixelRatio = dpr;
  drpListeningCharts.forEach((resize, chart) => {
    if (chart.currentDevicePixelRatio !== dpr) {
      resize();
    }
  });
}
function listenDevicePixelRatioChanges(chart, resize) {
  if (!drpListeningCharts.size) {
    window.addEventListener("resize", onWindowResize);
  }
  drpListeningCharts.set(chart, resize);
}
function unlistenDevicePixelRatioChanges(chart) {
  drpListeningCharts.delete(chart);
  if (!drpListeningCharts.size) {
    window.removeEventListener("resize", onWindowResize);
  }
}
function createResizeObserver(chart, type, listener) {
  const canvas = chart.canvas;
  const container = canvas && _getParentNode(canvas);
  if (!container) {
    return;
  }
  const resize = throttled((width, height) => {
    const w = container.clientWidth;
    listener(width, height);
    if (w < container.clientWidth) {
      listener();
    }
  }, window);
  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    const width = entry.contentRect.width;
    const height = entry.contentRect.height;
    if (width === 0 && height === 0) {
      return;
    }
    resize(width, height);
  });
  observer.observe(container);
  listenDevicePixelRatioChanges(chart, resize);
  return observer;
}
function releaseObserver(chart, type, observer) {
  if (observer) {
    observer.disconnect();
  }
  if (type === "resize") {
    unlistenDevicePixelRatioChanges(chart);
  }
}
function createProxyAndListen(chart, type, listener) {
  const canvas = chart.canvas;
  const proxy = throttled((event) => {
    if (chart.ctx !== null) {
      listener(fromNativeEvent(event, chart));
    }
  }, chart);
  addListener(canvas, type, proxy);
  return proxy;
}
var DomPlatform = class extends BasePlatform {
  acquireContext(canvas, aspectRatio) {
    const context = canvas && canvas.getContext && canvas.getContext("2d");
    if (context && context.canvas === canvas) {
      initCanvas(canvas, aspectRatio);
      return context;
    }
    return null;
  }
  releaseContext(context) {
    const canvas = context.canvas;
    if (!canvas[EXPANDO_KEY]) {
      return false;
    }
    const initial = canvas[EXPANDO_KEY].initial;
    [
      "height",
      "width"
    ].forEach((prop) => {
      const value = initial[prop];
      if (isNullOrUndef(value)) {
        canvas.removeAttribute(prop);
      } else {
        canvas.setAttribute(prop, value);
      }
    });
    const style = initial.style || {};
    Object.keys(style).forEach((key) => {
      canvas.style[key] = style[key];
    });
    canvas.width = canvas.width;
    delete canvas[EXPANDO_KEY];
    return true;
  }
  addEventListener(chart, type, listener) {
    this.removeEventListener(chart, type);
    const proxies = chart.$proxies || (chart.$proxies = {});
    const handlers = {
      attach: createAttachObserver,
      detach: createDetachObserver,
      resize: createResizeObserver
    };
    const handler = handlers[type] || createProxyAndListen;
    proxies[type] = handler(chart, type, listener);
  }
  removeEventListener(chart, type) {
    const proxies = chart.$proxies || (chart.$proxies = {});
    const proxy = proxies[type];
    if (!proxy) {
      return;
    }
    const handlers = {
      attach: releaseObserver,
      detach: releaseObserver,
      resize: releaseObserver
    };
    const handler = handlers[type] || removeListener;
    handler(chart, type, proxy);
    proxies[type] = void 0;
  }
  getDevicePixelRatio() {
    return window.devicePixelRatio;
  }
  getMaximumSize(canvas, width, height, aspectRatio) {
    return getMaximumSize(canvas, width, height, aspectRatio);
  }
  isAttached(canvas) {
    const container = canvas && _getParentNode(canvas);
    return !!(container && container.isConnected);
  }
};
function _detectPlatform(canvas) {
  if (!_isDomSupported() || typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
    return BasicPlatform;
  }
  return DomPlatform;
}
var Element = class {
  constructor() {
    __publicField(this, "x");
    __publicField(this, "y");
    __publicField(this, "active", false);
    __publicField(this, "options");
    __publicField(this, "$animations");
  }
  tooltipPosition(useFinalPosition) {
    const { x, y } = this.getProps([
      "x",
      "y"
    ], useFinalPosition);
    return {
      x,
      y
    };
  }
  hasValue() {
    return isNumber(this.x) && isNumber(this.y);
  }
  getProps(props, final) {
    const anims = this.$animations;
    if (!final || !anims) {
      return this;
    }
    const ret = {};
    props.forEach((prop) => {
      ret[prop] = anims[prop] && anims[prop].active() ? anims[prop]._to : this[prop];
    });
    return ret;
  }
};
__publicField(Element, "defaults", {});
__publicField(Element, "defaultRoutes");
function autoSkip(scale, ticks) {
  const tickOpts = scale.options.ticks;
  const determinedMaxTicks = determineMaxTicks(scale);
  const ticksLimit = Math.min(tickOpts.maxTicksLimit || determinedMaxTicks, determinedMaxTicks);
  const majorIndices = tickOpts.major.enabled ? getMajorIndices(ticks) : [];
  const numMajorIndices = majorIndices.length;
  const first = majorIndices[0];
  const last = majorIndices[numMajorIndices - 1];
  const newTicks = [];
  if (numMajorIndices > ticksLimit) {
    skipMajors(ticks, newTicks, majorIndices, numMajorIndices / ticksLimit);
    return newTicks;
  }
  const spacing = calculateSpacing(majorIndices, ticks, ticksLimit);
  if (numMajorIndices > 0) {
    let i, ilen;
    const avgMajorSpacing = numMajorIndices > 1 ? Math.round((last - first) / (numMajorIndices - 1)) : null;
    skip(ticks, newTicks, spacing, isNullOrUndef(avgMajorSpacing) ? 0 : first - avgMajorSpacing, first);
    for (i = 0, ilen = numMajorIndices - 1; i < ilen; i++) {
      skip(ticks, newTicks, spacing, majorIndices[i], majorIndices[i + 1]);
    }
    skip(ticks, newTicks, spacing, last, isNullOrUndef(avgMajorSpacing) ? ticks.length : last + avgMajorSpacing);
    return newTicks;
  }
  skip(ticks, newTicks, spacing);
  return newTicks;
}
function determineMaxTicks(scale) {
  const offset = scale.options.offset;
  const tickLength = scale._tickSize();
  const maxScale = scale._length / tickLength + (offset ? 0 : 1);
  const maxChart = scale._maxLength / tickLength;
  return Math.floor(Math.min(maxScale, maxChart));
}
function calculateSpacing(majorIndices, ticks, ticksLimit) {
  const evenMajorSpacing = getEvenSpacing(majorIndices);
  const spacing = ticks.length / ticksLimit;
  if (!evenMajorSpacing) {
    return Math.max(spacing, 1);
  }
  const factors = _factorize(evenMajorSpacing);
  for (let i = 0, ilen = factors.length - 1; i < ilen; i++) {
    const factor = factors[i];
    if (factor > spacing) {
      return factor;
    }
  }
  return Math.max(spacing, 1);
}
function getMajorIndices(ticks) {
  const result = [];
  let i, ilen;
  for (i = 0, ilen = ticks.length; i < ilen; i++) {
    if (ticks[i].major) {
      result.push(i);
    }
  }
  return result;
}
function skipMajors(ticks, newTicks, majorIndices, spacing) {
  let count = 0;
  let next = majorIndices[0];
  let i;
  spacing = Math.ceil(spacing);
  for (i = 0; i < ticks.length; i++) {
    if (i === next) {
      newTicks.push(ticks[i]);
      count++;
      next = majorIndices[count * spacing];
    }
  }
}
function skip(ticks, newTicks, spacing, majorStart, majorEnd) {
  const start = valueOrDefault(majorStart, 0);
  const end = Math.min(valueOrDefault(majorEnd, ticks.length), ticks.length);
  let count = 0;
  let length, i, next;
  spacing = Math.ceil(spacing);
  if (majorEnd) {
    length = majorEnd - majorStart;
    spacing = length / Math.floor(length / spacing);
  }
  next = start;
  while (next < 0) {
    count++;
    next = Math.round(start + count * spacing);
  }
  for (i = Math.max(start, 0); i < end; i++) {
    if (i === next) {
      newTicks.push(ticks[i]);
      count++;
      next = Math.round(start + count * spacing);
    }
  }
}
function getEvenSpacing(arr) {
  const len = arr.length;
  let i, diff;
  if (len < 2) {
    return false;
  }
  for (diff = arr[0], i = 1; i < len; ++i) {
    if (arr[i] - arr[i - 1] !== diff) {
      return false;
    }
  }
  return diff;
}
var reverseAlign = (align) => align === "left" ? "right" : align === "right" ? "left" : align;
var offsetFromEdge = (scale, edge, offset) => edge === "top" || edge === "left" ? scale[edge] + offset : scale[edge] - offset;
var getTicksLimit = (ticksLength, maxTicksLimit) => Math.min(maxTicksLimit || ticksLength, ticksLength);
function sample(arr, numItems) {
  const result = [];
  const increment = arr.length / numItems;
  const len = arr.length;
  let i = 0;
  for (; i < len; i += increment) {
    result.push(arr[Math.floor(i)]);
  }
  return result;
}
function getPixelForGridLine(scale, index, offsetGridLines) {
  const length = scale.ticks.length;
  const validIndex2 = Math.min(index, length - 1);
  const start = scale._startPixel;
  const end = scale._endPixel;
  const epsilon = 1e-6;
  let lineValue = scale.getPixelForTick(validIndex2);
  let offset;
  if (offsetGridLines) {
    if (length === 1) {
      offset = Math.max(lineValue - start, end - lineValue);
    } else if (index === 0) {
      offset = (scale.getPixelForTick(1) - lineValue) / 2;
    } else {
      offset = (lineValue - scale.getPixelForTick(validIndex2 - 1)) / 2;
    }
    lineValue += validIndex2 < index ? offset : -offset;
    if (lineValue < start - epsilon || lineValue > end + epsilon) {
      return;
    }
  }
  return lineValue;
}
function garbageCollect(caches, length) {
  each(caches, (cache) => {
    const gc = cache.gc;
    const gcLen = gc.length / 2;
    let i;
    if (gcLen > length) {
      for (i = 0; i < gcLen; ++i) {
        delete cache.data[gc[i]];
      }
      gc.splice(0, gcLen);
    }
  });
}
function getTickMarkLength(options) {
  return options.drawTicks ? options.tickLength : 0;
}
function getTitleHeight(options, fallback) {
  if (!options.display) {
    return 0;
  }
  const font = toFont(options.font, fallback);
  const padding = toPadding(options.padding);
  const lines = isArray(options.text) ? options.text.length : 1;
  return lines * font.lineHeight + padding.height;
}
function createScaleContext(parent, scale) {
  return createContext(parent, {
    scale,
    type: "scale"
  });
}
function createTickContext(parent, index, tick) {
  return createContext(parent, {
    tick,
    index,
    type: "tick"
  });
}
function titleAlign(align, position, reverse) {
  let ret = _toLeftRightCenter(align);
  if (reverse && position !== "right" || !reverse && position === "right") {
    ret = reverseAlign(ret);
  }
  return ret;
}
function titleArgs(scale, offset, position, align) {
  const { top, left, bottom, right, chart } = scale;
  const { chartArea, scales } = chart;
  let rotation = 0;
  let maxWidth, titleX, titleY;
  const height = bottom - top;
  const width = right - left;
  if (scale.isHorizontal()) {
    titleX = _alignStartEnd(align, left, right);
    if (isObject(position)) {
      const positionAxisID = Object.keys(position)[0];
      const value = position[positionAxisID];
      titleY = scales[positionAxisID].getPixelForValue(value) + height - offset;
    } else if (position === "center") {
      titleY = (chartArea.bottom + chartArea.top) / 2 + height - offset;
    } else {
      titleY = offsetFromEdge(scale, position, offset);
    }
    maxWidth = right - left;
  } else {
    if (isObject(position)) {
      const positionAxisID = Object.keys(position)[0];
      const value = position[positionAxisID];
      titleX = scales[positionAxisID].getPixelForValue(value) - width + offset;
    } else if (position === "center") {
      titleX = (chartArea.left + chartArea.right) / 2 - width + offset;
    } else {
      titleX = offsetFromEdge(scale, position, offset);
    }
    titleY = _alignStartEnd(align, bottom, top);
    rotation = position === "left" ? -HALF_PI : HALF_PI;
  }
  return {
    titleX,
    titleY,
    maxWidth,
    rotation
  };
}
var Scale = class extends Element {
  constructor(cfg) {
    super();
    this.id = cfg.id;
    this.type = cfg.type;
    this.options = void 0;
    this.ctx = cfg.ctx;
    this.chart = cfg.chart;
    this.top = void 0;
    this.bottom = void 0;
    this.left = void 0;
    this.right = void 0;
    this.width = void 0;
    this.height = void 0;
    this._margins = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    };
    this.maxWidth = void 0;
    this.maxHeight = void 0;
    this.paddingTop = void 0;
    this.paddingBottom = void 0;
    this.paddingLeft = void 0;
    this.paddingRight = void 0;
    this.axis = void 0;
    this.labelRotation = void 0;
    this.min = void 0;
    this.max = void 0;
    this._range = void 0;
    this.ticks = [];
    this._gridLineItems = null;
    this._labelItems = null;
    this._labelSizes = null;
    this._length = 0;
    this._maxLength = 0;
    this._longestTextCache = {};
    this._startPixel = void 0;
    this._endPixel = void 0;
    this._reversePixels = false;
    this._userMax = void 0;
    this._userMin = void 0;
    this._suggestedMax = void 0;
    this._suggestedMin = void 0;
    this._ticksLength = 0;
    this._borderValue = 0;
    this._cache = {};
    this._dataLimitsCached = false;
    this.$context = void 0;
  }
  init(options) {
    this.options = options.setContext(this.getContext());
    this.axis = options.axis;
    this._userMin = this.parse(options.min);
    this._userMax = this.parse(options.max);
    this._suggestedMin = this.parse(options.suggestedMin);
    this._suggestedMax = this.parse(options.suggestedMax);
  }
  parse(raw, index) {
    return raw;
  }
  getUserBounds() {
    let { _userMin, _userMax, _suggestedMin, _suggestedMax } = this;
    _userMin = finiteOrDefault(_userMin, Number.POSITIVE_INFINITY);
    _userMax = finiteOrDefault(_userMax, Number.NEGATIVE_INFINITY);
    _suggestedMin = finiteOrDefault(_suggestedMin, Number.POSITIVE_INFINITY);
    _suggestedMax = finiteOrDefault(_suggestedMax, Number.NEGATIVE_INFINITY);
    return {
      min: finiteOrDefault(_userMin, _suggestedMin),
      max: finiteOrDefault(_userMax, _suggestedMax),
      minDefined: isNumberFinite(_userMin),
      maxDefined: isNumberFinite(_userMax)
    };
  }
  getMinMax(canStack) {
    let { min, max, minDefined, maxDefined } = this.getUserBounds();
    let range;
    if (minDefined && maxDefined) {
      return {
        min,
        max
      };
    }
    const metas = this.getMatchingVisibleMetas();
    for (let i = 0, ilen = metas.length; i < ilen; ++i) {
      range = metas[i].controller.getMinMax(this, canStack);
      if (!minDefined) {
        min = Math.min(min, range.min);
      }
      if (!maxDefined) {
        max = Math.max(max, range.max);
      }
    }
    min = maxDefined && min > max ? max : min;
    max = minDefined && min > max ? min : max;
    return {
      min: finiteOrDefault(min, finiteOrDefault(max, min)),
      max: finiteOrDefault(max, finiteOrDefault(min, max))
    };
  }
  getPadding() {
    return {
      left: this.paddingLeft || 0,
      top: this.paddingTop || 0,
      right: this.paddingRight || 0,
      bottom: this.paddingBottom || 0
    };
  }
  getTicks() {
    return this.ticks;
  }
  getLabels() {
    const data = this.chart.data;
    return this.options.labels || (this.isHorizontal() ? data.xLabels : data.yLabels) || data.labels || [];
  }
  getLabelItems(chartArea = this.chart.chartArea) {
    const items = this._labelItems || (this._labelItems = this._computeLabelItems(chartArea));
    return items;
  }
  beforeLayout() {
    this._cache = {};
    this._dataLimitsCached = false;
  }
  beforeUpdate() {
    callback(this.options.beforeUpdate, [
      this
    ]);
  }
  update(maxWidth, maxHeight, margins) {
    const { beginAtZero, grace, ticks: tickOpts } = this.options;
    const sampleSize = tickOpts.sampleSize;
    this.beforeUpdate();
    this.maxWidth = maxWidth;
    this.maxHeight = maxHeight;
    this._margins = margins = Object.assign({
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    }, margins);
    this.ticks = null;
    this._labelSizes = null;
    this._gridLineItems = null;
    this._labelItems = null;
    this.beforeSetDimensions();
    this.setDimensions();
    this.afterSetDimensions();
    this._maxLength = this.isHorizontal() ? this.width + margins.left + margins.right : this.height + margins.top + margins.bottom;
    if (!this._dataLimitsCached) {
      this.beforeDataLimits();
      this.determineDataLimits();
      this.afterDataLimits();
      this._range = _addGrace(this, grace, beginAtZero);
      this._dataLimitsCached = true;
    }
    this.beforeBuildTicks();
    this.ticks = this.buildTicks() || [];
    this.afterBuildTicks();
    const samplingEnabled = sampleSize < this.ticks.length;
    this._convertTicksToLabels(samplingEnabled ? sample(this.ticks, sampleSize) : this.ticks);
    this.configure();
    this.beforeCalculateLabelRotation();
    this.calculateLabelRotation();
    this.afterCalculateLabelRotation();
    if (tickOpts.display && (tickOpts.autoSkip || tickOpts.source === "auto")) {
      this.ticks = autoSkip(this, this.ticks);
      this._labelSizes = null;
      this.afterAutoSkip();
    }
    if (samplingEnabled) {
      this._convertTicksToLabels(this.ticks);
    }
    this.beforeFit();
    this.fit();
    this.afterFit();
    this.afterUpdate();
  }
  configure() {
    let reversePixels = this.options.reverse;
    let startPixel, endPixel;
    if (this.isHorizontal()) {
      startPixel = this.left;
      endPixel = this.right;
    } else {
      startPixel = this.top;
      endPixel = this.bottom;
      reversePixels = !reversePixels;
    }
    this._startPixel = startPixel;
    this._endPixel = endPixel;
    this._reversePixels = reversePixels;
    this._length = endPixel - startPixel;
    this._alignToPixels = this.options.alignToPixels;
  }
  afterUpdate() {
    callback(this.options.afterUpdate, [
      this
    ]);
  }
  beforeSetDimensions() {
    callback(this.options.beforeSetDimensions, [
      this
    ]);
  }
  setDimensions() {
    if (this.isHorizontal()) {
      this.width = this.maxWidth;
      this.left = 0;
      this.right = this.width;
    } else {
      this.height = this.maxHeight;
      this.top = 0;
      this.bottom = this.height;
    }
    this.paddingLeft = 0;
    this.paddingTop = 0;
    this.paddingRight = 0;
    this.paddingBottom = 0;
  }
  afterSetDimensions() {
    callback(this.options.afterSetDimensions, [
      this
    ]);
  }
  _callHooks(name) {
    this.chart.notifyPlugins(name, this.getContext());
    callback(this.options[name], [
      this
    ]);
  }
  beforeDataLimits() {
    this._callHooks("beforeDataLimits");
  }
  determineDataLimits() {
  }
  afterDataLimits() {
    this._callHooks("afterDataLimits");
  }
  beforeBuildTicks() {
    this._callHooks("beforeBuildTicks");
  }
  buildTicks() {
    return [];
  }
  afterBuildTicks() {
    this._callHooks("afterBuildTicks");
  }
  beforeTickToLabelConversion() {
    callback(this.options.beforeTickToLabelConversion, [
      this
    ]);
  }
  generateTickLabels(ticks) {
    const tickOpts = this.options.ticks;
    let i, ilen, tick;
    for (i = 0, ilen = ticks.length; i < ilen; i++) {
      tick = ticks[i];
      tick.label = callback(tickOpts.callback, [
        tick.value,
        i,
        ticks
      ], this);
    }
  }
  afterTickToLabelConversion() {
    callback(this.options.afterTickToLabelConversion, [
      this
    ]);
  }
  beforeCalculateLabelRotation() {
    callback(this.options.beforeCalculateLabelRotation, [
      this
    ]);
  }
  calculateLabelRotation() {
    const options = this.options;
    const tickOpts = options.ticks;
    const numTicks = getTicksLimit(this.ticks.length, options.ticks.maxTicksLimit);
    const minRotation = tickOpts.minRotation || 0;
    const maxRotation = tickOpts.maxRotation;
    let labelRotation = minRotation;
    let tickWidth, maxHeight, maxLabelDiagonal;
    if (!this._isVisible() || !tickOpts.display || minRotation >= maxRotation || numTicks <= 1 || !this.isHorizontal()) {
      this.labelRotation = minRotation;
      return;
    }
    const labelSizes = this._getLabelSizes();
    const maxLabelWidth = labelSizes.widest.width;
    const maxLabelHeight = labelSizes.highest.height;
    const maxWidth = _limitValue(this.chart.width - maxLabelWidth, 0, this.maxWidth);
    tickWidth = options.offset ? this.maxWidth / numTicks : maxWidth / (numTicks - 1);
    if (maxLabelWidth + 6 > tickWidth) {
      tickWidth = maxWidth / (numTicks - (options.offset ? 0.5 : 1));
      maxHeight = this.maxHeight - getTickMarkLength(options.grid) - tickOpts.padding - getTitleHeight(options.title, this.chart.options.font);
      maxLabelDiagonal = Math.sqrt(maxLabelWidth * maxLabelWidth + maxLabelHeight * maxLabelHeight);
      labelRotation = toDegrees(Math.min(Math.asin(_limitValue((labelSizes.highest.height + 6) / tickWidth, -1, 1)), Math.asin(_limitValue(maxHeight / maxLabelDiagonal, -1, 1)) - Math.asin(_limitValue(maxLabelHeight / maxLabelDiagonal, -1, 1))));
      labelRotation = Math.max(minRotation, Math.min(maxRotation, labelRotation));
    }
    this.labelRotation = labelRotation;
  }
  afterCalculateLabelRotation() {
    callback(this.options.afterCalculateLabelRotation, [
      this
    ]);
  }
  afterAutoSkip() {
  }
  beforeFit() {
    callback(this.options.beforeFit, [
      this
    ]);
  }
  fit() {
    const minSize = {
      width: 0,
      height: 0
    };
    const { chart, options: { ticks: tickOpts, title: titleOpts, grid: gridOpts } } = this;
    const display = this._isVisible();
    const isHorizontal = this.isHorizontal();
    if (display) {
      const titleHeight = getTitleHeight(titleOpts, chart.options.font);
      if (isHorizontal) {
        minSize.width = this.maxWidth;
        minSize.height = getTickMarkLength(gridOpts) + titleHeight;
      } else {
        minSize.height = this.maxHeight;
        minSize.width = getTickMarkLength(gridOpts) + titleHeight;
      }
      if (tickOpts.display && this.ticks.length) {
        const { first, last, widest, highest } = this._getLabelSizes();
        const tickPadding = tickOpts.padding * 2;
        const angleRadians = toRadians(this.labelRotation);
        const cos = Math.cos(angleRadians);
        const sin = Math.sin(angleRadians);
        if (isHorizontal) {
          const labelHeight = tickOpts.mirror ? 0 : sin * widest.width + cos * highest.height;
          minSize.height = Math.min(this.maxHeight, minSize.height + labelHeight + tickPadding);
        } else {
          const labelWidth = tickOpts.mirror ? 0 : cos * widest.width + sin * highest.height;
          minSize.width = Math.min(this.maxWidth, minSize.width + labelWidth + tickPadding);
        }
        this._calculatePadding(first, last, sin, cos);
      }
    }
    this._handleMargins();
    if (isHorizontal) {
      this.width = this._length = chart.width - this._margins.left - this._margins.right;
      this.height = minSize.height;
    } else {
      this.width = minSize.width;
      this.height = this._length = chart.height - this._margins.top - this._margins.bottom;
    }
  }
  _calculatePadding(first, last, sin, cos) {
    const { ticks: { align, padding }, position } = this.options;
    const isRotated = this.labelRotation !== 0;
    const labelsBelowTicks = position !== "top" && this.axis === "x";
    if (this.isHorizontal()) {
      const offsetLeft = this.getPixelForTick(0) - this.left;
      const offsetRight = this.right - this.getPixelForTick(this.ticks.length - 1);
      let paddingLeft = 0;
      let paddingRight = 0;
      if (isRotated) {
        if (labelsBelowTicks) {
          paddingLeft = cos * first.width;
          paddingRight = sin * last.height;
        } else {
          paddingLeft = sin * first.height;
          paddingRight = cos * last.width;
        }
      } else if (align === "start") {
        paddingRight = last.width;
      } else if (align === "end") {
        paddingLeft = first.width;
      } else if (align !== "inner") {
        paddingLeft = first.width / 2;
        paddingRight = last.width / 2;
      }
      this.paddingLeft = Math.max((paddingLeft - offsetLeft + padding) * this.width / (this.width - offsetLeft), 0);
      this.paddingRight = Math.max((paddingRight - offsetRight + padding) * this.width / (this.width - offsetRight), 0);
    } else {
      let paddingTop = last.height / 2;
      let paddingBottom = first.height / 2;
      if (align === "start") {
        paddingTop = 0;
        paddingBottom = first.height;
      } else if (align === "end") {
        paddingTop = last.height;
        paddingBottom = 0;
      }
      this.paddingTop = paddingTop + padding;
      this.paddingBottom = paddingBottom + padding;
    }
  }
  _handleMargins() {
    if (this._margins) {
      this._margins.left = Math.max(this.paddingLeft, this._margins.left);
      this._margins.top = Math.max(this.paddingTop, this._margins.top);
      this._margins.right = Math.max(this.paddingRight, this._margins.right);
      this._margins.bottom = Math.max(this.paddingBottom, this._margins.bottom);
    }
  }
  afterFit() {
    callback(this.options.afterFit, [
      this
    ]);
  }
  isHorizontal() {
    const { axis, position } = this.options;
    return position === "top" || position === "bottom" || axis === "x";
  }
  isFullSize() {
    return this.options.fullSize;
  }
  _convertTicksToLabels(ticks) {
    this.beforeTickToLabelConversion();
    this.generateTickLabels(ticks);
    let i, ilen;
    for (i = 0, ilen = ticks.length; i < ilen; i++) {
      if (isNullOrUndef(ticks[i].label)) {
        ticks.splice(i, 1);
        ilen--;
        i--;
      }
    }
    this.afterTickToLabelConversion();
  }
  _getLabelSizes() {
    let labelSizes = this._labelSizes;
    if (!labelSizes) {
      const sampleSize = this.options.ticks.sampleSize;
      let ticks = this.ticks;
      if (sampleSize < ticks.length) {
        ticks = sample(ticks, sampleSize);
      }
      this._labelSizes = labelSizes = this._computeLabelSizes(ticks, ticks.length, this.options.ticks.maxTicksLimit);
    }
    return labelSizes;
  }
  _computeLabelSizes(ticks, length, maxTicksLimit) {
    const { ctx, _longestTextCache: caches } = this;
    const widths = [];
    const heights = [];
    const increment = Math.floor(length / getTicksLimit(length, maxTicksLimit));
    let widestLabelSize = 0;
    let highestLabelSize = 0;
    let i, j, jlen, label, tickFont, fontString, cache, lineHeight, width, height, nestedLabel;
    for (i = 0; i < length; i += increment) {
      label = ticks[i].label;
      tickFont = this._resolveTickFontOptions(i);
      ctx.font = fontString = tickFont.string;
      cache = caches[fontString] = caches[fontString] || {
        data: {},
        gc: []
      };
      lineHeight = tickFont.lineHeight;
      width = height = 0;
      if (!isNullOrUndef(label) && !isArray(label)) {
        width = _measureText(ctx, cache.data, cache.gc, width, label);
        height = lineHeight;
      } else if (isArray(label)) {
        for (j = 0, jlen = label.length; j < jlen; ++j) {
          nestedLabel = label[j];
          if (!isNullOrUndef(nestedLabel) && !isArray(nestedLabel)) {
            width = _measureText(ctx, cache.data, cache.gc, width, nestedLabel);
            height += lineHeight;
          }
        }
      }
      widths.push(width);
      heights.push(height);
      widestLabelSize = Math.max(width, widestLabelSize);
      highestLabelSize = Math.max(height, highestLabelSize);
    }
    garbageCollect(caches, length);
    const widest = widths.indexOf(widestLabelSize);
    const highest = heights.indexOf(highestLabelSize);
    const valueAt = (idx) => ({
      width: widths[idx] || 0,
      height: heights[idx] || 0
    });
    return {
      first: valueAt(0),
      last: valueAt(length - 1),
      widest: valueAt(widest),
      highest: valueAt(highest),
      widths,
      heights
    };
  }
  getLabelForValue(value) {
    return value;
  }
  getPixelForValue(value, index) {
    return NaN;
  }
  getValueForPixel(pixel) {
  }
  getPixelForTick(index) {
    const ticks = this.ticks;
    if (index < 0 || index > ticks.length - 1) {
      return null;
    }
    return this.getPixelForValue(ticks[index].value);
  }
  getPixelForDecimal(decimal) {
    if (this._reversePixels) {
      decimal = 1 - decimal;
    }
    const pixel = this._startPixel + decimal * this._length;
    return _int16Range(this._alignToPixels ? _alignPixel(this.chart, pixel, 0) : pixel);
  }
  getDecimalForPixel(pixel) {
    const decimal = (pixel - this._startPixel) / this._length;
    return this._reversePixels ? 1 - decimal : decimal;
  }
  getBasePixel() {
    return this.getPixelForValue(this.getBaseValue());
  }
  getBaseValue() {
    const { min, max } = this;
    return min < 0 && max < 0 ? max : min > 0 && max > 0 ? min : 0;
  }
  getContext(index) {
    const ticks = this.ticks || [];
    if (index >= 0 && index < ticks.length) {
      const tick = ticks[index];
      return tick.$context || (tick.$context = createTickContext(this.getContext(), index, tick));
    }
    return this.$context || (this.$context = createScaleContext(this.chart.getContext(), this));
  }
  _tickSize() {
    const optionTicks = this.options.ticks;
    const rot = toRadians(this.labelRotation);
    const cos = Math.abs(Math.cos(rot));
    const sin = Math.abs(Math.sin(rot));
    const labelSizes = this._getLabelSizes();
    const padding = optionTicks.autoSkipPadding || 0;
    const w = labelSizes ? labelSizes.widest.width + padding : 0;
    const h = labelSizes ? labelSizes.highest.height + padding : 0;
    return this.isHorizontal() ? h * cos > w * sin ? w / cos : h / sin : h * sin < w * cos ? h / cos : w / sin;
  }
  _isVisible() {
    const display = this.options.display;
    if (display !== "auto") {
      return !!display;
    }
    return this.getMatchingVisibleMetas().length > 0;
  }
  _computeGridLineItems(chartArea) {
    const axis = this.axis;
    const chart = this.chart;
    const options = this.options;
    const { grid, position, border } = options;
    const offset = grid.offset;
    const isHorizontal = this.isHorizontal();
    const ticks = this.ticks;
    const ticksLength = ticks.length + (offset ? 1 : 0);
    const tl = getTickMarkLength(grid);
    const items = [];
    const borderOpts = border.setContext(this.getContext());
    const axisWidth = borderOpts.display ? borderOpts.width : 0;
    const axisHalfWidth = axisWidth / 2;
    const alignBorderValue = function(pixel) {
      return _alignPixel(chart, pixel, axisWidth);
    };
    let borderValue, i, lineValue, alignedLineValue;
    let tx1, ty1, tx2, ty2, x1, y1, x2, y2;
    if (position === "top") {
      borderValue = alignBorderValue(this.bottom);
      ty1 = this.bottom - tl;
      ty2 = borderValue - axisHalfWidth;
      y1 = alignBorderValue(chartArea.top) + axisHalfWidth;
      y2 = chartArea.bottom;
    } else if (position === "bottom") {
      borderValue = alignBorderValue(this.top);
      y1 = chartArea.top;
      y2 = alignBorderValue(chartArea.bottom) - axisHalfWidth;
      ty1 = borderValue + axisHalfWidth;
      ty2 = this.top + tl;
    } else if (position === "left") {
      borderValue = alignBorderValue(this.right);
      tx1 = this.right - tl;
      tx2 = borderValue - axisHalfWidth;
      x1 = alignBorderValue(chartArea.left) + axisHalfWidth;
      x2 = chartArea.right;
    } else if (position === "right") {
      borderValue = alignBorderValue(this.left);
      x1 = chartArea.left;
      x2 = alignBorderValue(chartArea.right) - axisHalfWidth;
      tx1 = borderValue + axisHalfWidth;
      tx2 = this.left + tl;
    } else if (axis === "x") {
      if (position === "center") {
        borderValue = alignBorderValue((chartArea.top + chartArea.bottom) / 2 + 0.5);
      } else if (isObject(position)) {
        const positionAxisID = Object.keys(position)[0];
        const value = position[positionAxisID];
        borderValue = alignBorderValue(this.chart.scales[positionAxisID].getPixelForValue(value));
      }
      y1 = chartArea.top;
      y2 = chartArea.bottom;
      ty1 = borderValue + axisHalfWidth;
      ty2 = ty1 + tl;
    } else if (axis === "y") {
      if (position === "center") {
        borderValue = alignBorderValue((chartArea.left + chartArea.right) / 2);
      } else if (isObject(position)) {
        const positionAxisID = Object.keys(position)[0];
        const value = position[positionAxisID];
        borderValue = alignBorderValue(this.chart.scales[positionAxisID].getPixelForValue(value));
      }
      tx1 = borderValue - axisHalfWidth;
      tx2 = tx1 - tl;
      x1 = chartArea.left;
      x2 = chartArea.right;
    }
    const limit = valueOrDefault(options.ticks.maxTicksLimit, ticksLength);
    const step = Math.max(1, Math.ceil(ticksLength / limit));
    for (i = 0; i < ticksLength; i += step) {
      const context = this.getContext(i);
      const optsAtIndex = grid.setContext(context);
      const optsAtIndexBorder = border.setContext(context);
      const lineWidth = optsAtIndex.lineWidth;
      const lineColor = optsAtIndex.color;
      const borderDash = optsAtIndexBorder.dash || [];
      const borderDashOffset = optsAtIndexBorder.dashOffset;
      const tickWidth = optsAtIndex.tickWidth;
      const tickColor = optsAtIndex.tickColor;
      const tickBorderDash = optsAtIndex.tickBorderDash || [];
      const tickBorderDashOffset = optsAtIndex.tickBorderDashOffset;
      lineValue = getPixelForGridLine(this, i, offset);
      if (lineValue === void 0) {
        continue;
      }
      alignedLineValue = _alignPixel(chart, lineValue, lineWidth);
      if (isHorizontal) {
        tx1 = tx2 = x1 = x2 = alignedLineValue;
      } else {
        ty1 = ty2 = y1 = y2 = alignedLineValue;
      }
      items.push({
        tx1,
        ty1,
        tx2,
        ty2,
        x1,
        y1,
        x2,
        y2,
        width: lineWidth,
        color: lineColor,
        borderDash,
        borderDashOffset,
        tickWidth,
        tickColor,
        tickBorderDash,
        tickBorderDashOffset
      });
    }
    this._ticksLength = ticksLength;
    this._borderValue = borderValue;
    return items;
  }
  _computeLabelItems(chartArea) {
    const axis = this.axis;
    const options = this.options;
    const { position, ticks: optionTicks } = options;
    const isHorizontal = this.isHorizontal();
    const ticks = this.ticks;
    const { align, crossAlign, padding, mirror } = optionTicks;
    const tl = getTickMarkLength(options.grid);
    const tickAndPadding = tl + padding;
    const hTickAndPadding = mirror ? -padding : tickAndPadding;
    const rotation = -toRadians(this.labelRotation);
    const items = [];
    let i, ilen, tick, label, x, y, textAlign, pixel, font, lineHeight, lineCount, textOffset;
    let textBaseline = "middle";
    if (position === "top") {
      y = this.bottom - hTickAndPadding;
      textAlign = this._getXAxisLabelAlignment();
    } else if (position === "bottom") {
      y = this.top + hTickAndPadding;
      textAlign = this._getXAxisLabelAlignment();
    } else if (position === "left") {
      const ret = this._getYAxisLabelAlignment(tl);
      textAlign = ret.textAlign;
      x = ret.x;
    } else if (position === "right") {
      const ret = this._getYAxisLabelAlignment(tl);
      textAlign = ret.textAlign;
      x = ret.x;
    } else if (axis === "x") {
      if (position === "center") {
        y = (chartArea.top + chartArea.bottom) / 2 + tickAndPadding;
      } else if (isObject(position)) {
        const positionAxisID = Object.keys(position)[0];
        const value = position[positionAxisID];
        y = this.chart.scales[positionAxisID].getPixelForValue(value) + tickAndPadding;
      }
      textAlign = this._getXAxisLabelAlignment();
    } else if (axis === "y") {
      if (position === "center") {
        x = (chartArea.left + chartArea.right) / 2 - tickAndPadding;
      } else if (isObject(position)) {
        const positionAxisID = Object.keys(position)[0];
        const value = position[positionAxisID];
        x = this.chart.scales[positionAxisID].getPixelForValue(value);
      }
      textAlign = this._getYAxisLabelAlignment(tl).textAlign;
    }
    if (axis === "y") {
      if (align === "start") {
        textBaseline = "top";
      } else if (align === "end") {
        textBaseline = "bottom";
      }
    }
    const labelSizes = this._getLabelSizes();
    for (i = 0, ilen = ticks.length; i < ilen; ++i) {
      tick = ticks[i];
      label = tick.label;
      const optsAtIndex = optionTicks.setContext(this.getContext(i));
      pixel = this.getPixelForTick(i) + optionTicks.labelOffset;
      font = this._resolveTickFontOptions(i);
      lineHeight = font.lineHeight;
      lineCount = isArray(label) ? label.length : 1;
      const halfCount = lineCount / 2;
      const color2 = optsAtIndex.color;
      const strokeColor = optsAtIndex.textStrokeColor;
      const strokeWidth = optsAtIndex.textStrokeWidth;
      let tickTextAlign = textAlign;
      if (isHorizontal) {
        x = pixel;
        if (textAlign === "inner") {
          if (i === ilen - 1) {
            tickTextAlign = !this.options.reverse ? "right" : "left";
          } else if (i === 0) {
            tickTextAlign = !this.options.reverse ? "left" : "right";
          } else {
            tickTextAlign = "center";
          }
        }
        if (position === "top") {
          if (crossAlign === "near" || rotation !== 0) {
            textOffset = -lineCount * lineHeight + lineHeight / 2;
          } else if (crossAlign === "center") {
            textOffset = -labelSizes.highest.height / 2 - halfCount * lineHeight + lineHeight;
          } else {
            textOffset = -labelSizes.highest.height + lineHeight / 2;
          }
        } else {
          if (crossAlign === "near" || rotation !== 0) {
            textOffset = lineHeight / 2;
          } else if (crossAlign === "center") {
            textOffset = labelSizes.highest.height / 2 - halfCount * lineHeight;
          } else {
            textOffset = labelSizes.highest.height - lineCount * lineHeight;
          }
        }
        if (mirror) {
          textOffset *= -1;
        }
        if (rotation !== 0 && !optsAtIndex.showLabelBackdrop) {
          x += lineHeight / 2 * Math.sin(rotation);
        }
      } else {
        y = pixel;
        textOffset = (1 - lineCount) * lineHeight / 2;
      }
      let backdrop;
      if (optsAtIndex.showLabelBackdrop) {
        const labelPadding = toPadding(optsAtIndex.backdropPadding);
        const height = labelSizes.heights[i];
        const width = labelSizes.widths[i];
        let top = textOffset - labelPadding.top;
        let left = 0 - labelPadding.left;
        switch (textBaseline) {
          case "middle":
            top -= height / 2;
            break;
          case "bottom":
            top -= height;
            break;
        }
        switch (textAlign) {
          case "center":
            left -= width / 2;
            break;
          case "right":
            left -= width;
            break;
          case "inner":
            if (i === ilen - 1) {
              left -= width;
            } else if (i > 0) {
              left -= width / 2;
            }
            break;
        }
        backdrop = {
          left,
          top,
          width: width + labelPadding.width,
          height: height + labelPadding.height,
          color: optsAtIndex.backdropColor
        };
      }
      items.push({
        label,
        font,
        textOffset,
        options: {
          rotation,
          color: color2,
          strokeColor,
          strokeWidth,
          textAlign: tickTextAlign,
          textBaseline,
          translation: [
            x,
            y
          ],
          backdrop
        }
      });
    }
    return items;
  }
  _getXAxisLabelAlignment() {
    const { position, ticks } = this.options;
    const rotation = -toRadians(this.labelRotation);
    if (rotation) {
      return position === "top" ? "left" : "right";
    }
    let align = "center";
    if (ticks.align === "start") {
      align = "left";
    } else if (ticks.align === "end") {
      align = "right";
    } else if (ticks.align === "inner") {
      align = "inner";
    }
    return align;
  }
  _getYAxisLabelAlignment(tl) {
    const { position, ticks: { crossAlign, mirror, padding } } = this.options;
    const labelSizes = this._getLabelSizes();
    const tickAndPadding = tl + padding;
    const widest = labelSizes.widest.width;
    let textAlign;
    let x;
    if (position === "left") {
      if (mirror) {
        x = this.right + padding;
        if (crossAlign === "near") {
          textAlign = "left";
        } else if (crossAlign === "center") {
          textAlign = "center";
          x += widest / 2;
        } else {
          textAlign = "right";
          x += widest;
        }
      } else {
        x = this.right - tickAndPadding;
        if (crossAlign === "near") {
          textAlign = "right";
        } else if (crossAlign === "center") {
          textAlign = "center";
          x -= widest / 2;
        } else {
          textAlign = "left";
          x = this.left;
        }
      }
    } else if (position === "right") {
      if (mirror) {
        x = this.left + padding;
        if (crossAlign === "near") {
          textAlign = "right";
        } else if (crossAlign === "center") {
          textAlign = "center";
          x -= widest / 2;
        } else {
          textAlign = "left";
          x -= widest;
        }
      } else {
        x = this.left + tickAndPadding;
        if (crossAlign === "near") {
          textAlign = "left";
        } else if (crossAlign === "center") {
          textAlign = "center";
          x += widest / 2;
        } else {
          textAlign = "right";
          x = this.right;
        }
      }
    } else {
      textAlign = "right";
    }
    return {
      textAlign,
      x
    };
  }
  _computeLabelArea() {
    if (this.options.ticks.mirror) {
      return;
    }
    const chart = this.chart;
    const position = this.options.position;
    if (position === "left" || position === "right") {
      return {
        top: 0,
        left: this.left,
        bottom: chart.height,
        right: this.right
      };
    }
    if (position === "top" || position === "bottom") {
      return {
        top: this.top,
        left: 0,
        bottom: this.bottom,
        right: chart.width
      };
    }
  }
  drawBackground() {
    const { ctx, options: { backgroundColor }, left, top, width, height } = this;
    if (backgroundColor) {
      ctx.save();
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(left, top, width, height);
      ctx.restore();
    }
  }
  getLineWidthForValue(value) {
    const grid = this.options.grid;
    if (!this._isVisible() || !grid.display) {
      return 0;
    }
    const ticks = this.ticks;
    const index = ticks.findIndex((t) => t.value === value);
    if (index >= 0) {
      const opts = grid.setContext(this.getContext(index));
      return opts.lineWidth;
    }
    return 0;
  }
  drawGrid(chartArea) {
    const grid = this.options.grid;
    const ctx = this.ctx;
    const items = this._gridLineItems || (this._gridLineItems = this._computeGridLineItems(chartArea));
    let i, ilen;
    const drawLine = (p1, p2, style) => {
      if (!style.width || !style.color) {
        return;
      }
      ctx.save();
      ctx.lineWidth = style.width;
      ctx.strokeStyle = style.color;
      ctx.setLineDash(style.borderDash || []);
      ctx.lineDashOffset = style.borderDashOffset;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.restore();
    };
    if (grid.display) {
      for (i = 0, ilen = items.length; i < ilen; ++i) {
        const item = items[i];
        if (grid.drawOnChartArea) {
          drawLine({
            x: item.x1,
            y: item.y1
          }, {
            x: item.x2,
            y: item.y2
          }, item);
        }
        if (grid.drawTicks) {
          drawLine({
            x: item.tx1,
            y: item.ty1
          }, {
            x: item.tx2,
            y: item.ty2
          }, {
            color: item.tickColor,
            width: item.tickWidth,
            borderDash: item.tickBorderDash,
            borderDashOffset: item.tickBorderDashOffset
          });
        }
      }
    }
  }
  drawBorder() {
    const { chart, ctx, options: { border, grid } } = this;
    const borderOpts = border.setContext(this.getContext());
    const axisWidth = border.display ? borderOpts.width : 0;
    if (!axisWidth) {
      return;
    }
    const lastLineWidth = grid.setContext(this.getContext(0)).lineWidth;
    const borderValue = this._borderValue;
    let x1, x2, y1, y2;
    if (this.isHorizontal()) {
      x1 = _alignPixel(chart, this.left, axisWidth) - axisWidth / 2;
      x2 = _alignPixel(chart, this.right, lastLineWidth) + lastLineWidth / 2;
      y1 = y2 = borderValue;
    } else {
      y1 = _alignPixel(chart, this.top, axisWidth) - axisWidth / 2;
      y2 = _alignPixel(chart, this.bottom, lastLineWidth) + lastLineWidth / 2;
      x1 = x2 = borderValue;
    }
    ctx.save();
    ctx.lineWidth = borderOpts.width;
    ctx.strokeStyle = borderOpts.color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }
  drawLabels(chartArea) {
    const optionTicks = this.options.ticks;
    if (!optionTicks.display) {
      return;
    }
    const ctx = this.ctx;
    const area = this._computeLabelArea();
    if (area) {
      clipArea(ctx, area);
    }
    const items = this.getLabelItems(chartArea);
    for (const item of items) {
      const renderTextOptions = item.options;
      const tickFont = item.font;
      const label = item.label;
      const y = item.textOffset;
      renderText(ctx, label, 0, y, tickFont, renderTextOptions);
    }
    if (area) {
      unclipArea(ctx);
    }
  }
  drawTitle() {
    const { ctx, options: { position, title, reverse } } = this;
    if (!title.display) {
      return;
    }
    const font = toFont(title.font);
    const padding = toPadding(title.padding);
    const align = title.align;
    let offset = font.lineHeight / 2;
    if (position === "bottom" || position === "center" || isObject(position)) {
      offset += padding.bottom;
      if (isArray(title.text)) {
        offset += font.lineHeight * (title.text.length - 1);
      }
    } else {
      offset += padding.top;
    }
    const { titleX, titleY, maxWidth, rotation } = titleArgs(this, offset, position, align);
    renderText(ctx, title.text, 0, 0, font, {
      color: title.color,
      maxWidth,
      rotation,
      textAlign: titleAlign(align, position, reverse),
      textBaseline: "middle",
      translation: [
        titleX,
        titleY
      ]
    });
  }
  draw(chartArea) {
    if (!this._isVisible()) {
      return;
    }
    this.drawBackground();
    this.drawGrid(chartArea);
    this.drawBorder();
    this.drawTitle();
    this.drawLabels(chartArea);
  }
  _layers() {
    const opts = this.options;
    const tz = opts.ticks && opts.ticks.z || 0;
    const gz = valueOrDefault(opts.grid && opts.grid.z, -1);
    const bz = valueOrDefault(opts.border && opts.border.z, 0);
    if (!this._isVisible() || this.draw !== Scale.prototype.draw) {
      return [
        {
          z: tz,
          draw: (chartArea) => {
            this.draw(chartArea);
          }
        }
      ];
    }
    return [
      {
        z: gz,
        draw: (chartArea) => {
          this.drawBackground();
          this.drawGrid(chartArea);
          this.drawTitle();
        }
      },
      {
        z: bz,
        draw: () => {
          this.drawBorder();
        }
      },
      {
        z: tz,
        draw: (chartArea) => {
          this.drawLabels(chartArea);
        }
      }
    ];
  }
  getMatchingVisibleMetas(type) {
    const metas = this.chart.getSortedVisibleDatasetMetas();
    const axisID = this.axis + "AxisID";
    const result = [];
    let i, ilen;
    for (i = 0, ilen = metas.length; i < ilen; ++i) {
      const meta = metas[i];
      if (meta[axisID] === this.id && (!type || meta.type === type)) {
        result.push(meta);
      }
    }
    return result;
  }
  _resolveTickFontOptions(index) {
    const opts = this.options.ticks.setContext(this.getContext(index));
    return toFont(opts.font);
  }
  _maxDigits() {
    const fontSize = this._resolveTickFontOptions(0).lineHeight;
    return (this.isHorizontal() ? this.width : this.height) / fontSize;
  }
};
var TypedRegistry = class {
  constructor(type, scope, override) {
    this.type = type;
    this.scope = scope;
    this.override = override;
    this.items = /* @__PURE__ */ Object.create(null);
  }
  isForType(type) {
    return Object.prototype.isPrototypeOf.call(this.type.prototype, type.prototype);
  }
  register(item) {
    const proto = Object.getPrototypeOf(item);
    let parentScope;
    if (isIChartComponent(proto)) {
      parentScope = this.register(proto);
    }
    const items = this.items;
    const id = item.id;
    const scope = this.scope + "." + id;
    if (!id) {
      throw new Error("class does not have id: " + item);
    }
    if (id in items) {
      return scope;
    }
    items[id] = item;
    registerDefaults(item, scope, parentScope);
    if (this.override) {
      defaults.override(item.id, item.overrides);
    }
    return scope;
  }
  get(id) {
    return this.items[id];
  }
  unregister(item) {
    const items = this.items;
    const id = item.id;
    const scope = this.scope;
    if (id in items) {
      delete items[id];
    }
    if (scope && id in defaults[scope]) {
      delete defaults[scope][id];
      if (this.override) {
        delete overrides[id];
      }
    }
  }
};
function registerDefaults(item, scope, parentScope) {
  const itemDefaults = merge(/* @__PURE__ */ Object.create(null), [
    parentScope ? defaults.get(parentScope) : {},
    defaults.get(scope),
    item.defaults
  ]);
  defaults.set(scope, itemDefaults);
  if (item.defaultRoutes) {
    routeDefaults(scope, item.defaultRoutes);
  }
  if (item.descriptors) {
    defaults.describe(scope, item.descriptors);
  }
}
function routeDefaults(scope, routes) {
  Object.keys(routes).forEach((property) => {
    const propertyParts = property.split(".");
    const sourceName = propertyParts.pop();
    const sourceScope = [
      scope
    ].concat(propertyParts).join(".");
    const parts = routes[property].split(".");
    const targetName = parts.pop();
    const targetScope = parts.join(".");
    defaults.route(sourceScope, sourceName, targetScope, targetName);
  });
}
function isIChartComponent(proto) {
  return "id" in proto && "defaults" in proto;
}
var Registry = class {
  constructor() {
    this.controllers = new TypedRegistry(DatasetController, "datasets", true);
    this.elements = new TypedRegistry(Element, "elements");
    this.plugins = new TypedRegistry(Object, "plugins");
    this.scales = new TypedRegistry(Scale, "scales");
    this._typedRegistries = [
      this.controllers,
      this.scales,
      this.elements
    ];
  }
  add(...args) {
    this._each("register", args);
  }
  remove(...args) {
    this._each("unregister", args);
  }
  addControllers(...args) {
    this._each("register", args, this.controllers);
  }
  addElements(...args) {
    this._each("register", args, this.elements);
  }
  addPlugins(...args) {
    this._each("register", args, this.plugins);
  }
  addScales(...args) {
    this._each("register", args, this.scales);
  }
  getController(id) {
    return this._get(id, this.controllers, "controller");
  }
  getElement(id) {
    return this._get(id, this.elements, "element");
  }
  getPlugin(id) {
    return this._get(id, this.plugins, "plugin");
  }
  getScale(id) {
    return this._get(id, this.scales, "scale");
  }
  removeControllers(...args) {
    this._each("unregister", args, this.controllers);
  }
  removeElements(...args) {
    this._each("unregister", args, this.elements);
  }
  removePlugins(...args) {
    this._each("unregister", args, this.plugins);
  }
  removeScales(...args) {
    this._each("unregister", args, this.scales);
  }
  _each(method, args, typedRegistry) {
    [
      ...args
    ].forEach((arg) => {
      const reg = typedRegistry || this._getRegistryForType(arg);
      if (typedRegistry || reg.isForType(arg) || reg === this.plugins && arg.id) {
        this._exec(method, reg, arg);
      } else {
        each(arg, (item) => {
          const itemReg = typedRegistry || this._getRegistryForType(item);
          this._exec(method, itemReg, item);
        });
      }
    });
  }
  _exec(method, registry2, component) {
    const camelMethod = _capitalize(method);
    callback(component["before" + camelMethod], [], component);
    registry2[method](component);
    callback(component["after" + camelMethod], [], component);
  }
  _getRegistryForType(type) {
    for (let i = 0; i < this._typedRegistries.length; i++) {
      const reg = this._typedRegistries[i];
      if (reg.isForType(type)) {
        return reg;
      }
    }
    return this.plugins;
  }
  _get(id, typedRegistry, type) {
    const item = typedRegistry.get(id);
    if (item === void 0) {
      throw new Error('"' + id + '" is not a registered ' + type + ".");
    }
    return item;
  }
};
var registry = /* @__PURE__ */ new Registry();
var PluginService = class {
  constructor() {
    this._init = void 0;
  }
  notify(chart, hook, args, filter) {
    if (hook === "beforeInit") {
      this._init = this._createDescriptors(chart, true);
      this._notify(this._init, chart, "install");
    }
    if (this._init === void 0) {
      return;
    }
    const descriptors2 = filter ? this._descriptors(chart).filter(filter) : this._descriptors(chart);
    const result = this._notify(descriptors2, chart, hook, args);
    if (hook === "afterDestroy") {
      this._notify(descriptors2, chart, "stop");
      this._notify(this._init, chart, "uninstall");
      this._init = void 0;
    }
    return result;
  }
  _notify(descriptors2, chart, hook, args) {
    args = args || {};
    for (const descriptor of descriptors2) {
      const plugin = descriptor.plugin;
      const method = plugin[hook];
      const params = [
        chart,
        args,
        descriptor.options
      ];
      if (callback(method, params, plugin) === false && args.cancelable) {
        return false;
      }
    }
    return true;
  }
  invalidate() {
    if (!isNullOrUndef(this._cache)) {
      this._oldCache = this._cache;
      this._cache = void 0;
    }
  }
  _descriptors(chart) {
    if (this._cache) {
      return this._cache;
    }
    const descriptors2 = this._cache = this._createDescriptors(chart);
    this._notifyStateChanges(chart);
    return descriptors2;
  }
  _createDescriptors(chart, all) {
    const config = chart && chart.config;
    const options = valueOrDefault(config.options && config.options.plugins, {});
    const plugins = allPlugins(config);
    return options === false && !all ? [] : createDescriptors(chart, plugins, options, all);
  }
  _notifyStateChanges(chart) {
    const previousDescriptors = this._oldCache || [];
    const descriptors2 = this._cache;
    const diff = (a, b) => a.filter((x) => !b.some((y) => x.plugin.id === y.plugin.id));
    this._notify(diff(previousDescriptors, descriptors2), chart, "stop");
    this._notify(diff(descriptors2, previousDescriptors), chart, "start");
  }
};
function allPlugins(config) {
  const localIds = {};
  const plugins = [];
  const keys = Object.keys(registry.plugins.items);
  for (let i = 0; i < keys.length; i++) {
    plugins.push(registry.getPlugin(keys[i]));
  }
  const local = config.plugins || [];
  for (let i = 0; i < local.length; i++) {
    const plugin = local[i];
    if (plugins.indexOf(plugin) === -1) {
      plugins.push(plugin);
      localIds[plugin.id] = true;
    }
  }
  return {
    plugins,
    localIds
  };
}
function getOpts(options, all) {
  if (!all && options === false) {
    return null;
  }
  if (options === true) {
    return {};
  }
  return options;
}
function createDescriptors(chart, { plugins, localIds }, options, all) {
  const result = [];
  const context = chart.getContext();
  for (const plugin of plugins) {
    const id = plugin.id;
    const opts = getOpts(options[id], all);
    if (opts === null) {
      continue;
    }
    result.push({
      plugin,
      options: pluginOpts(chart.config, {
        plugin,
        local: localIds[id]
      }, opts, context)
    });
  }
  return result;
}
function pluginOpts(config, { plugin, local }, opts, context) {
  const keys = config.pluginScopeKeys(plugin);
  const scopes = config.getOptionScopes(opts, keys);
  if (local && plugin.defaults) {
    scopes.push(plugin.defaults);
  }
  return config.createResolver(scopes, context, [
    ""
  ], {
    scriptable: false,
    indexable: false,
    allKeys: true
  });
}
function getIndexAxis(type, options) {
  const datasetDefaults = defaults.datasets[type] || {};
  const datasetOptions = (options.datasets || {})[type] || {};
  return datasetOptions.indexAxis || options.indexAxis || datasetDefaults.indexAxis || "x";
}
function getAxisFromDefaultScaleID(id, indexAxis) {
  let axis = id;
  if (id === "_index_") {
    axis = indexAxis;
  } else if (id === "_value_") {
    axis = indexAxis === "x" ? "y" : "x";
  }
  return axis;
}
function getDefaultScaleIDFromAxis(axis, indexAxis) {
  return axis === indexAxis ? "_index_" : "_value_";
}
function idMatchesAxis(id) {
  if (id === "x" || id === "y" || id === "r") {
    return id;
  }
}
function axisFromPosition(position) {
  if (position === "top" || position === "bottom") {
    return "x";
  }
  if (position === "left" || position === "right") {
    return "y";
  }
}
function determineAxis(id, ...scaleOptions) {
  if (idMatchesAxis(id)) {
    return id;
  }
  for (const opts of scaleOptions) {
    const axis = opts.axis || axisFromPosition(opts.position) || id.length > 1 && idMatchesAxis(id[0].toLowerCase());
    if (axis) {
      return axis;
    }
  }
  throw new Error(`Cannot determine type of '${id}' axis. Please provide 'axis' or 'position' option.`);
}
function getAxisFromDataset(id, axis, dataset) {
  if (dataset[axis + "AxisID"] === id) {
    return {
      axis
    };
  }
}
function retrieveAxisFromDatasets(id, config) {
  if (config.data && config.data.datasets) {
    const boundDs = config.data.datasets.filter((d) => d.xAxisID === id || d.yAxisID === id);
    if (boundDs.length) {
      return getAxisFromDataset(id, "x", boundDs[0]) || getAxisFromDataset(id, "y", boundDs[0]);
    }
  }
  return {};
}
function mergeScaleConfig(config, options) {
  const chartDefaults = overrides[config.type] || {
    scales: {}
  };
  const configScales = options.scales || {};
  const chartIndexAxis = getIndexAxis(config.type, options);
  const scales = /* @__PURE__ */ Object.create(null);
  Object.keys(configScales).forEach((id) => {
    const scaleConf = configScales[id];
    if (!isObject(scaleConf)) {
      return console.error(`Invalid scale configuration for scale: ${id}`);
    }
    if (scaleConf._proxy) {
      return console.warn(`Ignoring resolver passed as options for scale: ${id}`);
    }
    const axis = determineAxis(id, scaleConf, retrieveAxisFromDatasets(id, config), defaults.scales[scaleConf.type]);
    const defaultId = getDefaultScaleIDFromAxis(axis, chartIndexAxis);
    const defaultScaleOptions = chartDefaults.scales || {};
    scales[id] = mergeIf(/* @__PURE__ */ Object.create(null), [
      {
        axis
      },
      scaleConf,
      defaultScaleOptions[axis],
      defaultScaleOptions[defaultId]
    ]);
  });
  config.data.datasets.forEach((dataset) => {
    const type = dataset.type || config.type;
    const indexAxis = dataset.indexAxis || getIndexAxis(type, options);
    const datasetDefaults = overrides[type] || {};
    const defaultScaleOptions = datasetDefaults.scales || {};
    Object.keys(defaultScaleOptions).forEach((defaultID) => {
      const axis = getAxisFromDefaultScaleID(defaultID, indexAxis);
      const id = dataset[axis + "AxisID"] || axis;
      scales[id] = scales[id] || /* @__PURE__ */ Object.create(null);
      mergeIf(scales[id], [
        {
          axis
        },
        configScales[id],
        defaultScaleOptions[defaultID]
      ]);
    });
  });
  Object.keys(scales).forEach((key) => {
    const scale = scales[key];
    mergeIf(scale, [
      defaults.scales[scale.type],
      defaults.scale
    ]);
  });
  return scales;
}
function initOptions(config) {
  const options = config.options || (config.options = {});
  options.plugins = valueOrDefault(options.plugins, {});
  options.scales = mergeScaleConfig(config, options);
}
function initData(data) {
  data = data || {};
  data.datasets = data.datasets || [];
  data.labels = data.labels || [];
  return data;
}
function initConfig(config) {
  config = config || {};
  config.data = initData(config.data);
  initOptions(config);
  return config;
}
var keyCache = /* @__PURE__ */ new Map();
var keysCached = /* @__PURE__ */ new Set();
function cachedKeys(cacheKey, generate) {
  let keys = keyCache.get(cacheKey);
  if (!keys) {
    keys = generate();
    keyCache.set(cacheKey, keys);
    keysCached.add(keys);
  }
  return keys;
}
var addIfFound = (set2, obj, key) => {
  const opts = resolveObjectKey(obj, key);
  if (opts !== void 0) {
    set2.add(opts);
  }
};
var Config = class {
  constructor(config) {
    this._config = initConfig(config);
    this._scopeCache = /* @__PURE__ */ new Map();
    this._resolverCache = /* @__PURE__ */ new Map();
  }
  get platform() {
    return this._config.platform;
  }
  get type() {
    return this._config.type;
  }
  set type(type) {
    this._config.type = type;
  }
  get data() {
    return this._config.data;
  }
  set data(data) {
    this._config.data = initData(data);
  }
  get options() {
    return this._config.options;
  }
  set options(options) {
    this._config.options = options;
  }
  get plugins() {
    return this._config.plugins;
  }
  update() {
    const config = this._config;
    this.clearCache();
    initOptions(config);
  }
  clearCache() {
    this._scopeCache.clear();
    this._resolverCache.clear();
  }
  datasetScopeKeys(datasetType) {
    return cachedKeys(datasetType, () => [
      [
        `datasets.${datasetType}`,
        ""
      ]
    ]);
  }
  datasetAnimationScopeKeys(datasetType, transition) {
    return cachedKeys(`${datasetType}.transition.${transition}`, () => [
      [
        `datasets.${datasetType}.transitions.${transition}`,
        `transitions.${transition}`
      ],
      [
        `datasets.${datasetType}`,
        ""
      ]
    ]);
  }
  datasetElementScopeKeys(datasetType, elementType) {
    return cachedKeys(`${datasetType}-${elementType}`, () => [
      [
        `datasets.${datasetType}.elements.${elementType}`,
        `datasets.${datasetType}`,
        `elements.${elementType}`,
        ""
      ]
    ]);
  }
  pluginScopeKeys(plugin) {
    const id = plugin.id;
    const type = this.type;
    return cachedKeys(`${type}-plugin-${id}`, () => [
      [
        `plugins.${id}`,
        ...plugin.additionalOptionScopes || []
      ]
    ]);
  }
  _cachedScopes(mainScope, resetCache) {
    const _scopeCache = this._scopeCache;
    let cache = _scopeCache.get(mainScope);
    if (!cache || resetCache) {
      cache = /* @__PURE__ */ new Map();
      _scopeCache.set(mainScope, cache);
    }
    return cache;
  }
  getOptionScopes(mainScope, keyLists, resetCache) {
    const { options, type } = this;
    const cache = this._cachedScopes(mainScope, resetCache);
    const cached = cache.get(keyLists);
    if (cached) {
      return cached;
    }
    const scopes = /* @__PURE__ */ new Set();
    keyLists.forEach((keys) => {
      if (mainScope) {
        scopes.add(mainScope);
        keys.forEach((key) => addIfFound(scopes, mainScope, key));
      }
      keys.forEach((key) => addIfFound(scopes, options, key));
      keys.forEach((key) => addIfFound(scopes, overrides[type] || {}, key));
      keys.forEach((key) => addIfFound(scopes, defaults, key));
      keys.forEach((key) => addIfFound(scopes, descriptors, key));
    });
    const array = Array.from(scopes);
    if (array.length === 0) {
      array.push(/* @__PURE__ */ Object.create(null));
    }
    if (keysCached.has(keyLists)) {
      cache.set(keyLists, array);
    }
    return array;
  }
  chartOptionScopes() {
    const { options, type } = this;
    return [
      options,
      overrides[type] || {},
      defaults.datasets[type] || {},
      {
        type
      },
      defaults,
      descriptors
    ];
  }
  resolveNamedOptions(scopes, names2, context, prefixes = [
    ""
  ]) {
    const result = {
      $shared: true
    };
    const { resolver, subPrefixes } = getResolver(this._resolverCache, scopes, prefixes);
    let options = resolver;
    if (needContext(resolver, names2)) {
      result.$shared = false;
      context = isFunction(context) ? context() : context;
      const subResolver = this.createResolver(scopes, context, subPrefixes);
      options = _attachContext(resolver, context, subResolver);
    }
    for (const prop of names2) {
      result[prop] = options[prop];
    }
    return result;
  }
  createResolver(scopes, context, prefixes = [
    ""
  ], descriptorDefaults) {
    const { resolver } = getResolver(this._resolverCache, scopes, prefixes);
    return isObject(context) ? _attachContext(resolver, context, void 0, descriptorDefaults) : resolver;
  }
};
function getResolver(resolverCache, scopes, prefixes) {
  let cache = resolverCache.get(scopes);
  if (!cache) {
    cache = /* @__PURE__ */ new Map();
    resolverCache.set(scopes, cache);
  }
  const cacheKey = prefixes.join();
  let cached = cache.get(cacheKey);
  if (!cached) {
    const resolver = _createResolver(scopes, prefixes);
    cached = {
      resolver,
      subPrefixes: prefixes.filter((p) => !p.toLowerCase().includes("hover"))
    };
    cache.set(cacheKey, cached);
  }
  return cached;
}
var hasFunction = (value) => isObject(value) && Object.getOwnPropertyNames(value).some((key) => isFunction(value[key]));
function needContext(proxy, names2) {
  const { isScriptable, isIndexable } = _descriptors(proxy);
  for (const prop of names2) {
    const scriptable = isScriptable(prop);
    const indexable = isIndexable(prop);
    const value = (indexable || scriptable) && proxy[prop];
    if (scriptable && (isFunction(value) || hasFunction(value)) || indexable && isArray(value)) {
      return true;
    }
  }
  return false;
}
var version = "4.5.1";
var KNOWN_POSITIONS = [
  "top",
  "bottom",
  "left",
  "right",
  "chartArea"
];
function positionIsHorizontal(position, axis) {
  return position === "top" || position === "bottom" || KNOWN_POSITIONS.indexOf(position) === -1 && axis === "x";
}
function compare2Level(l1, l2) {
  return function(a, b) {
    return a[l1] === b[l1] ? a[l2] - b[l2] : a[l1] - b[l1];
  };
}
function onAnimationsComplete(context) {
  const chart = context.chart;
  const animationOptions = chart.options.animation;
  chart.notifyPlugins("afterRender");
  callback(animationOptions && animationOptions.onComplete, [
    context
  ], chart);
}
function onAnimationProgress(context) {
  const chart = context.chart;
  const animationOptions = chart.options.animation;
  callback(animationOptions && animationOptions.onProgress, [
    context
  ], chart);
}
function getCanvas(item) {
  if (_isDomSupported() && typeof item === "string") {
    item = document.getElementById(item);
  } else if (item && item.length) {
    item = item[0];
  }
  if (item && item.canvas) {
    item = item.canvas;
  }
  return item;
}
var instances = {};
var getChart = (key) => {
  const canvas = getCanvas(key);
  return Object.values(instances).filter((c) => c.canvas === canvas).pop();
};
function moveNumericKeys(obj, start, move) {
  const keys = Object.keys(obj);
  for (const key of keys) {
    const intKey = +key;
    if (intKey >= start) {
      const value = obj[key];
      delete obj[key];
      if (move > 0 || intKey > start) {
        obj[intKey + move] = value;
      }
    }
  }
}
function determineLastEvent(e, lastEvent, inChartArea, isClick) {
  if (!inChartArea || e.type === "mouseout") {
    return null;
  }
  if (isClick) {
    return lastEvent;
  }
  return e;
}
var Chart = class {
  static register(...items) {
    registry.add(...items);
    invalidatePlugins();
  }
  static unregister(...items) {
    registry.remove(...items);
    invalidatePlugins();
  }
  constructor(item, userConfig) {
    const config = this.config = new Config(userConfig);
    const initialCanvas = getCanvas(item);
    const existingChart = getChart(initialCanvas);
    if (existingChart) {
      throw new Error("Canvas is already in use. Chart with ID '" + existingChart.id + "' must be destroyed before the canvas with ID '" + existingChart.canvas.id + "' can be reused.");
    }
    const options = config.createResolver(config.chartOptionScopes(), this.getContext());
    this.platform = new (config.platform || _detectPlatform(initialCanvas))();
    this.platform.updateConfig(config);
    const context = this.platform.acquireContext(initialCanvas, options.aspectRatio);
    const canvas = context && context.canvas;
    const height = canvas && canvas.height;
    const width = canvas && canvas.width;
    this.id = uid();
    this.ctx = context;
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this._options = options;
    this._aspectRatio = this.aspectRatio;
    this._layers = [];
    this._metasets = [];
    this._stacks = void 0;
    this.boxes = [];
    this.currentDevicePixelRatio = void 0;
    this.chartArea = void 0;
    this._active = [];
    this._lastEvent = void 0;
    this._listeners = {};
    this._responsiveListeners = void 0;
    this._sortedMetasets = [];
    this.scales = {};
    this._plugins = new PluginService();
    this.$proxies = {};
    this._hiddenIndices = {};
    this.attached = false;
    this._animationsDisabled = void 0;
    this.$context = void 0;
    this._doResize = debounce((mode) => this.update(mode), options.resizeDelay || 0);
    this._dataChanges = [];
    instances[this.id] = this;
    if (!context || !canvas) {
      console.error("Failed to create chart: can't acquire context from the given item");
      return;
    }
    animator.listen(this, "complete", onAnimationsComplete);
    animator.listen(this, "progress", onAnimationProgress);
    this._initialize();
    if (this.attached) {
      this.update();
    }
  }
  get aspectRatio() {
    const { options: { aspectRatio, maintainAspectRatio }, width, height, _aspectRatio } = this;
    if (!isNullOrUndef(aspectRatio)) {
      return aspectRatio;
    }
    if (maintainAspectRatio && _aspectRatio) {
      return _aspectRatio;
    }
    return height ? width / height : null;
  }
  get data() {
    return this.config.data;
  }
  set data(data) {
    this.config.data = data;
  }
  get options() {
    return this._options;
  }
  set options(options) {
    this.config.options = options;
  }
  get registry() {
    return registry;
  }
  _initialize() {
    this.notifyPlugins("beforeInit");
    if (this.options.responsive) {
      this.resize();
    } else {
      retinaScale(this, this.options.devicePixelRatio);
    }
    this.bindEvents();
    this.notifyPlugins("afterInit");
    return this;
  }
  clear() {
    clearCanvas(this.canvas, this.ctx);
    return this;
  }
  stop() {
    animator.stop(this);
    return this;
  }
  resize(width, height) {
    if (!animator.running(this)) {
      this._resize(width, height);
    } else {
      this._resizeBeforeDraw = {
        width,
        height
      };
    }
  }
  _resize(width, height) {
    const options = this.options;
    const canvas = this.canvas;
    const aspectRatio = options.maintainAspectRatio && this.aspectRatio;
    const newSize = this.platform.getMaximumSize(canvas, width, height, aspectRatio);
    const newRatio = options.devicePixelRatio || this.platform.getDevicePixelRatio();
    const mode = this.width ? "resize" : "attach";
    this.width = newSize.width;
    this.height = newSize.height;
    this._aspectRatio = this.aspectRatio;
    if (!retinaScale(this, newRatio, true)) {
      return;
    }
    this.notifyPlugins("resize", {
      size: newSize
    });
    callback(options.onResize, [
      this,
      newSize
    ], this);
    if (this.attached) {
      if (this._doResize(mode)) {
        this.render();
      }
    }
  }
  ensureScalesHaveIDs() {
    const options = this.options;
    const scalesOptions = options.scales || {};
    each(scalesOptions, (axisOptions, axisID) => {
      axisOptions.id = axisID;
    });
  }
  buildOrUpdateScales() {
    const options = this.options;
    const scaleOpts = options.scales;
    const scales = this.scales;
    const updated = Object.keys(scales).reduce((obj, id) => {
      obj[id] = false;
      return obj;
    }, {});
    let items = [];
    if (scaleOpts) {
      items = items.concat(Object.keys(scaleOpts).map((id) => {
        const scaleOptions = scaleOpts[id];
        const axis = determineAxis(id, scaleOptions);
        const isRadial = axis === "r";
        const isHorizontal = axis === "x";
        return {
          options: scaleOptions,
          dposition: isRadial ? "chartArea" : isHorizontal ? "bottom" : "left",
          dtype: isRadial ? "radialLinear" : isHorizontal ? "category" : "linear"
        };
      }));
    }
    each(items, (item) => {
      const scaleOptions = item.options;
      const id = scaleOptions.id;
      const axis = determineAxis(id, scaleOptions);
      const scaleType = valueOrDefault(scaleOptions.type, item.dtype);
      if (scaleOptions.position === void 0 || positionIsHorizontal(scaleOptions.position, axis) !== positionIsHorizontal(item.dposition)) {
        scaleOptions.position = item.dposition;
      }
      updated[id] = true;
      let scale = null;
      if (id in scales && scales[id].type === scaleType) {
        scale = scales[id];
      } else {
        const scaleClass = registry.getScale(scaleType);
        scale = new scaleClass({
          id,
          type: scaleType,
          ctx: this.ctx,
          chart: this
        });
        scales[scale.id] = scale;
      }
      scale.init(scaleOptions, options);
    });
    each(updated, (hasUpdated, id) => {
      if (!hasUpdated) {
        delete scales[id];
      }
    });
    each(scales, (scale) => {
      layouts.configure(this, scale, scale.options);
      layouts.addBox(this, scale);
    });
  }
  _updateMetasets() {
    const metasets = this._metasets;
    const numData = this.data.datasets.length;
    const numMeta = metasets.length;
    metasets.sort((a, b) => a.index - b.index);
    if (numMeta > numData) {
      for (let i = numData; i < numMeta; ++i) {
        this._destroyDatasetMeta(i);
      }
      metasets.splice(numData, numMeta - numData);
    }
    this._sortedMetasets = metasets.slice(0).sort(compare2Level("order", "index"));
  }
  _removeUnreferencedMetasets() {
    const { _metasets: metasets, data: { datasets } } = this;
    if (metasets.length > datasets.length) {
      delete this._stacks;
    }
    metasets.forEach((meta, index) => {
      if (datasets.filter((x) => x === meta._dataset).length === 0) {
        this._destroyDatasetMeta(index);
      }
    });
  }
  buildOrUpdateControllers() {
    const newControllers = [];
    const datasets = this.data.datasets;
    let i, ilen;
    this._removeUnreferencedMetasets();
    for (i = 0, ilen = datasets.length; i < ilen; i++) {
      const dataset = datasets[i];
      let meta = this.getDatasetMeta(i);
      const type = dataset.type || this.config.type;
      if (meta.type && meta.type !== type) {
        this._destroyDatasetMeta(i);
        meta = this.getDatasetMeta(i);
      }
      meta.type = type;
      meta.indexAxis = dataset.indexAxis || getIndexAxis(type, this.options);
      meta.order = dataset.order || 0;
      meta.index = i;
      meta.label = "" + dataset.label;
      meta.visible = this.isDatasetVisible(i);
      if (meta.controller) {
        meta.controller.updateIndex(i);
        meta.controller.linkScales();
      } else {
        const ControllerClass = registry.getController(type);
        const { datasetElementType, dataElementType } = defaults.datasets[type];
        Object.assign(ControllerClass, {
          dataElementType: registry.getElement(dataElementType),
          datasetElementType: datasetElementType && registry.getElement(datasetElementType)
        });
        meta.controller = new ControllerClass(this, i);
        newControllers.push(meta.controller);
      }
    }
    this._updateMetasets();
    return newControllers;
  }
  _resetElements() {
    each(this.data.datasets, (dataset, datasetIndex) => {
      this.getDatasetMeta(datasetIndex).controller.reset();
    }, this);
  }
  reset() {
    this._resetElements();
    this.notifyPlugins("reset");
  }
  update(mode) {
    const config = this.config;
    config.update();
    const options = this._options = config.createResolver(config.chartOptionScopes(), this.getContext());
    const animsDisabled = this._animationsDisabled = !options.animation;
    this._updateScales();
    this._checkEventBindings();
    this._updateHiddenIndices();
    this._plugins.invalidate();
    if (this.notifyPlugins("beforeUpdate", {
      mode,
      cancelable: true
    }) === false) {
      return;
    }
    const newControllers = this.buildOrUpdateControllers();
    this.notifyPlugins("beforeElementsUpdate");
    let minPadding = 0;
    for (let i = 0, ilen = this.data.datasets.length; i < ilen; i++) {
      const { controller } = this.getDatasetMeta(i);
      const reset = !animsDisabled && newControllers.indexOf(controller) === -1;
      controller.buildOrUpdateElements(reset);
      minPadding = Math.max(+controller.getMaxOverflow(), minPadding);
    }
    minPadding = this._minPadding = options.layout.autoPadding ? minPadding : 0;
    this._updateLayout(minPadding);
    if (!animsDisabled) {
      each(newControllers, (controller) => {
        controller.reset();
      });
    }
    this._updateDatasets(mode);
    this.notifyPlugins("afterUpdate", {
      mode
    });
    this._layers.sort(compare2Level("z", "_idx"));
    const { _active, _lastEvent } = this;
    if (_lastEvent) {
      this._eventHandler(_lastEvent, true);
    } else if (_active.length) {
      this._updateHoverStyles(_active, _active, true);
    }
    this.render();
  }
  _updateScales() {
    each(this.scales, (scale) => {
      layouts.removeBox(this, scale);
    });
    this.ensureScalesHaveIDs();
    this.buildOrUpdateScales();
  }
  _checkEventBindings() {
    const options = this.options;
    const existingEvents = new Set(Object.keys(this._listeners));
    const newEvents = new Set(options.events);
    if (!setsEqual(existingEvents, newEvents) || !!this._responsiveListeners !== options.responsive) {
      this.unbindEvents();
      this.bindEvents();
    }
  }
  _updateHiddenIndices() {
    const { _hiddenIndices } = this;
    const changes = this._getUniformDataChanges() || [];
    for (const { method, start, count } of changes) {
      const move = method === "_removeElements" ? -count : count;
      moveNumericKeys(_hiddenIndices, start, move);
    }
  }
  _getUniformDataChanges() {
    const _dataChanges = this._dataChanges;
    if (!_dataChanges || !_dataChanges.length) {
      return;
    }
    this._dataChanges = [];
    const datasetCount = this.data.datasets.length;
    const makeSet = (idx) => new Set(_dataChanges.filter((c) => c[0] === idx).map((c, i) => i + "," + c.splice(1).join(",")));
    const changeSet = makeSet(0);
    for (let i = 1; i < datasetCount; i++) {
      if (!setsEqual(changeSet, makeSet(i))) {
        return;
      }
    }
    return Array.from(changeSet).map((c) => c.split(",")).map((a) => ({
      method: a[1],
      start: +a[2],
      count: +a[3]
    }));
  }
  _updateLayout(minPadding) {
    if (this.notifyPlugins("beforeLayout", {
      cancelable: true
    }) === false) {
      return;
    }
    layouts.update(this, this.width, this.height, minPadding);
    const area = this.chartArea;
    const noArea = area.width <= 0 || area.height <= 0;
    this._layers = [];
    each(this.boxes, (box) => {
      if (noArea && box.position === "chartArea") {
        return;
      }
      if (box.configure) {
        box.configure();
      }
      this._layers.push(...box._layers());
    }, this);
    this._layers.forEach((item, index) => {
      item._idx = index;
    });
    this.notifyPlugins("afterLayout");
  }
  _updateDatasets(mode) {
    if (this.notifyPlugins("beforeDatasetsUpdate", {
      mode,
      cancelable: true
    }) === false) {
      return;
    }
    for (let i = 0, ilen = this.data.datasets.length; i < ilen; ++i) {
      this.getDatasetMeta(i).controller.configure();
    }
    for (let i = 0, ilen = this.data.datasets.length; i < ilen; ++i) {
      this._updateDataset(i, isFunction(mode) ? mode({
        datasetIndex: i
      }) : mode);
    }
    this.notifyPlugins("afterDatasetsUpdate", {
      mode
    });
  }
  _updateDataset(index, mode) {
    const meta = this.getDatasetMeta(index);
    const args = {
      meta,
      index,
      mode,
      cancelable: true
    };
    if (this.notifyPlugins("beforeDatasetUpdate", args) === false) {
      return;
    }
    meta.controller._update(mode);
    args.cancelable = false;
    this.notifyPlugins("afterDatasetUpdate", args);
  }
  render() {
    if (this.notifyPlugins("beforeRender", {
      cancelable: true
    }) === false) {
      return;
    }
    if (animator.has(this)) {
      if (this.attached && !animator.running(this)) {
        animator.start(this);
      }
    } else {
      this.draw();
      onAnimationsComplete({
        chart: this
      });
    }
  }
  draw() {
    let i;
    if (this._resizeBeforeDraw) {
      const { width, height } = this._resizeBeforeDraw;
      this._resizeBeforeDraw = null;
      this._resize(width, height);
    }
    this.clear();
    if (this.width <= 0 || this.height <= 0) {
      return;
    }
    if (this.notifyPlugins("beforeDraw", {
      cancelable: true
    }) === false) {
      return;
    }
    const layers = this._layers;
    for (i = 0; i < layers.length && layers[i].z <= 0; ++i) {
      layers[i].draw(this.chartArea);
    }
    this._drawDatasets();
    for (; i < layers.length; ++i) {
      layers[i].draw(this.chartArea);
    }
    this.notifyPlugins("afterDraw");
  }
  _getSortedDatasetMetas(filterVisible) {
    const metasets = this._sortedMetasets;
    const result = [];
    let i, ilen;
    for (i = 0, ilen = metasets.length; i < ilen; ++i) {
      const meta = metasets[i];
      if (!filterVisible || meta.visible) {
        result.push(meta);
      }
    }
    return result;
  }
  getSortedVisibleDatasetMetas() {
    return this._getSortedDatasetMetas(true);
  }
  _drawDatasets() {
    if (this.notifyPlugins("beforeDatasetsDraw", {
      cancelable: true
    }) === false) {
      return;
    }
    const metasets = this.getSortedVisibleDatasetMetas();
    for (let i = metasets.length - 1; i >= 0; --i) {
      this._drawDataset(metasets[i]);
    }
    this.notifyPlugins("afterDatasetsDraw");
  }
  _drawDataset(meta) {
    const ctx = this.ctx;
    const args = {
      meta,
      index: meta.index,
      cancelable: true
    };
    const clip = getDatasetClipArea(this, meta);
    if (this.notifyPlugins("beforeDatasetDraw", args) === false) {
      return;
    }
    if (clip) {
      clipArea(ctx, clip);
    }
    meta.controller.draw();
    if (clip) {
      unclipArea(ctx);
    }
    args.cancelable = false;
    this.notifyPlugins("afterDatasetDraw", args);
  }
  isPointInArea(point) {
    return _isPointInArea(point, this.chartArea, this._minPadding);
  }
  getElementsAtEventForMode(e, mode, options, useFinalPosition) {
    const method = Interaction.modes[mode];
    if (typeof method === "function") {
      return method(this, e, options, useFinalPosition);
    }
    return [];
  }
  getDatasetMeta(datasetIndex) {
    const dataset = this.data.datasets[datasetIndex];
    const metasets = this._metasets;
    let meta = metasets.filter((x) => x && x._dataset === dataset).pop();
    if (!meta) {
      meta = {
        type: null,
        data: [],
        dataset: null,
        controller: null,
        hidden: null,
        xAxisID: null,
        yAxisID: null,
        order: dataset && dataset.order || 0,
        index: datasetIndex,
        _dataset: dataset,
        _parsed: [],
        _sorted: false
      };
      metasets.push(meta);
    }
    return meta;
  }
  getContext() {
    return this.$context || (this.$context = createContext(null, {
      chart: this,
      type: "chart"
    }));
  }
  getVisibleDatasetCount() {
    return this.getSortedVisibleDatasetMetas().length;
  }
  isDatasetVisible(datasetIndex) {
    const dataset = this.data.datasets[datasetIndex];
    if (!dataset) {
      return false;
    }
    const meta = this.getDatasetMeta(datasetIndex);
    return typeof meta.hidden === "boolean" ? !meta.hidden : !dataset.hidden;
  }
  setDatasetVisibility(datasetIndex, visible) {
    const meta = this.getDatasetMeta(datasetIndex);
    meta.hidden = !visible;
  }
  toggleDataVisibility(index) {
    this._hiddenIndices[index] = !this._hiddenIndices[index];
  }
  getDataVisibility(index) {
    return !this._hiddenIndices[index];
  }
  _updateVisibility(datasetIndex, dataIndex, visible) {
    const mode = visible ? "show" : "hide";
    const meta = this.getDatasetMeta(datasetIndex);
    const anims = meta.controller._resolveAnimations(void 0, mode);
    if (defined(dataIndex)) {
      meta.data[dataIndex].hidden = !visible;
      this.update();
    } else {
      this.setDatasetVisibility(datasetIndex, visible);
      anims.update(meta, {
        visible
      });
      this.update((ctx) => ctx.datasetIndex === datasetIndex ? mode : void 0);
    }
  }
  hide(datasetIndex, dataIndex) {
    this._updateVisibility(datasetIndex, dataIndex, false);
  }
  show(datasetIndex, dataIndex) {
    this._updateVisibility(datasetIndex, dataIndex, true);
  }
  _destroyDatasetMeta(datasetIndex) {
    const meta = this._metasets[datasetIndex];
    if (meta && meta.controller) {
      meta.controller._destroy();
    }
    delete this._metasets[datasetIndex];
  }
  _stop() {
    let i, ilen;
    this.stop();
    animator.remove(this);
    for (i = 0, ilen = this.data.datasets.length; i < ilen; ++i) {
      this._destroyDatasetMeta(i);
    }
  }
  destroy() {
    this.notifyPlugins("beforeDestroy");
    const { canvas, ctx } = this;
    this._stop();
    this.config.clearCache();
    if (canvas) {
      this.unbindEvents();
      clearCanvas(canvas, ctx);
      this.platform.releaseContext(ctx);
      this.canvas = null;
      this.ctx = null;
    }
    delete instances[this.id];
    this.notifyPlugins("afterDestroy");
  }
  toBase64Image(...args) {
    return this.canvas.toDataURL(...args);
  }
  bindEvents() {
    this.bindUserEvents();
    if (this.options.responsive) {
      this.bindResponsiveEvents();
    } else {
      this.attached = true;
    }
  }
  bindUserEvents() {
    const listeners = this._listeners;
    const platform = this.platform;
    const _add = (type, listener2) => {
      platform.addEventListener(this, type, listener2);
      listeners[type] = listener2;
    };
    const listener = (e, x, y) => {
      e.offsetX = x;
      e.offsetY = y;
      this._eventHandler(e);
    };
    each(this.options.events, (type) => _add(type, listener));
  }
  bindResponsiveEvents() {
    if (!this._responsiveListeners) {
      this._responsiveListeners = {};
    }
    const listeners = this._responsiveListeners;
    const platform = this.platform;
    const _add = (type, listener2) => {
      platform.addEventListener(this, type, listener2);
      listeners[type] = listener2;
    };
    const _remove = (type, listener2) => {
      if (listeners[type]) {
        platform.removeEventListener(this, type, listener2);
        delete listeners[type];
      }
    };
    const listener = (width, height) => {
      if (this.canvas) {
        this.resize(width, height);
      }
    };
    let detached;
    const attached = () => {
      _remove("attach", attached);
      this.attached = true;
      this.resize();
      _add("resize", listener);
      _add("detach", detached);
    };
    detached = () => {
      this.attached = false;
      _remove("resize", listener);
      this._stop();
      this._resize(0, 0);
      _add("attach", attached);
    };
    if (platform.isAttached(this.canvas)) {
      attached();
    } else {
      detached();
    }
  }
  unbindEvents() {
    each(this._listeners, (listener, type) => {
      this.platform.removeEventListener(this, type, listener);
    });
    this._listeners = {};
    each(this._responsiveListeners, (listener, type) => {
      this.platform.removeEventListener(this, type, listener);
    });
    this._responsiveListeners = void 0;
  }
  updateHoverStyle(items, mode, enabled) {
    const prefix = enabled ? "set" : "remove";
    let meta, item, i, ilen;
    if (mode === "dataset") {
      meta = this.getDatasetMeta(items[0].datasetIndex);
      meta.controller["_" + prefix + "DatasetHoverStyle"]();
    }
    for (i = 0, ilen = items.length; i < ilen; ++i) {
      item = items[i];
      const controller = item && this.getDatasetMeta(item.datasetIndex).controller;
      if (controller) {
        controller[prefix + "HoverStyle"](item.element, item.datasetIndex, item.index);
      }
    }
  }
  getActiveElements() {
    return this._active || [];
  }
  setActiveElements(activeElements) {
    const lastActive = this._active || [];
    const active = activeElements.map(({ datasetIndex, index }) => {
      const meta = this.getDatasetMeta(datasetIndex);
      if (!meta) {
        throw new Error("No dataset found at index " + datasetIndex);
      }
      return {
        datasetIndex,
        element: meta.data[index],
        index
      };
    });
    const changed = !_elementsEqual(active, lastActive);
    if (changed) {
      this._active = active;
      this._lastEvent = null;
      this._updateHoverStyles(active, lastActive);
    }
  }
  notifyPlugins(hook, args, filter) {
    return this._plugins.notify(this, hook, args, filter);
  }
  isPluginEnabled(pluginId) {
    return this._plugins._cache.filter((p) => p.plugin.id === pluginId).length === 1;
  }
  _updateHoverStyles(active, lastActive, replay) {
    const hoverOptions = this.options.hover;
    const diff = (a, b) => a.filter((x) => !b.some((y) => x.datasetIndex === y.datasetIndex && x.index === y.index));
    const deactivated = diff(lastActive, active);
    const activated = replay ? active : diff(active, lastActive);
    if (deactivated.length) {
      this.updateHoverStyle(deactivated, hoverOptions.mode, false);
    }
    if (activated.length && hoverOptions.mode) {
      this.updateHoverStyle(activated, hoverOptions.mode, true);
    }
  }
  _eventHandler(e, replay) {
    const args = {
      event: e,
      replay,
      cancelable: true,
      inChartArea: this.isPointInArea(e)
    };
    const eventFilter = (plugin) => (plugin.options.events || this.options.events).includes(e.native.type);
    if (this.notifyPlugins("beforeEvent", args, eventFilter) === false) {
      return;
    }
    const changed = this._handleEvent(e, replay, args.inChartArea);
    args.cancelable = false;
    this.notifyPlugins("afterEvent", args, eventFilter);
    if (changed || args.changed) {
      this.render();
    }
    return this;
  }
  _handleEvent(e, replay, inChartArea) {
    const { _active: lastActive = [], options } = this;
    const useFinalPosition = replay;
    const active = this._getActiveElements(e, lastActive, inChartArea, useFinalPosition);
    const isClick = _isClickEvent(e);
    const lastEvent = determineLastEvent(e, this._lastEvent, inChartArea, isClick);
    if (inChartArea) {
      this._lastEvent = null;
      callback(options.onHover, [
        e,
        active,
        this
      ], this);
      if (isClick) {
        callback(options.onClick, [
          e,
          active,
          this
        ], this);
      }
    }
    const changed = !_elementsEqual(active, lastActive);
    if (changed || replay) {
      this._active = active;
      this._updateHoverStyles(active, lastActive, replay);
    }
    this._lastEvent = lastEvent;
    return changed;
  }
  _getActiveElements(e, lastActive, inChartArea, useFinalPosition) {
    if (e.type === "mouseout") {
      return [];
    }
    if (!inChartArea) {
      return lastActive;
    }
    const hoverOptions = this.options.hover;
    return this.getElementsAtEventForMode(e, hoverOptions.mode, hoverOptions, useFinalPosition);
  }
};
__publicField(Chart, "defaults", defaults);
__publicField(Chart, "instances", instances);
__publicField(Chart, "overrides", overrides);
__publicField(Chart, "registry", registry);
__publicField(Chart, "version", version);
__publicField(Chart, "getChart", getChart);
function invalidatePlugins() {
  return each(Chart.instances, (chart) => chart._plugins.invalidate());
}
function setStyle(ctx, options, style = options) {
  ctx.lineCap = valueOrDefault(style.borderCapStyle, options.borderCapStyle);
  ctx.setLineDash(valueOrDefault(style.borderDash, options.borderDash));
  ctx.lineDashOffset = valueOrDefault(style.borderDashOffset, options.borderDashOffset);
  ctx.lineJoin = valueOrDefault(style.borderJoinStyle, options.borderJoinStyle);
  ctx.lineWidth = valueOrDefault(style.borderWidth, options.borderWidth);
  ctx.strokeStyle = valueOrDefault(style.borderColor, options.borderColor);
}
function lineTo(ctx, previous, target) {
  ctx.lineTo(target.x, target.y);
}
function getLineMethod(options) {
  if (options.stepped) {
    return _steppedLineTo;
  }
  if (options.tension || options.cubicInterpolationMode === "monotone") {
    return _bezierCurveTo;
  }
  return lineTo;
}
function pathVars(points, segment, params = {}) {
  const count = points.length;
  const { start: paramsStart = 0, end: paramsEnd = count - 1 } = params;
  const { start: segmentStart, end: segmentEnd } = segment;
  const start = Math.max(paramsStart, segmentStart);
  const end = Math.min(paramsEnd, segmentEnd);
  const outside = paramsStart < segmentStart && paramsEnd < segmentStart || paramsStart > segmentEnd && paramsEnd > segmentEnd;
  return {
    count,
    start,
    loop: segment.loop,
    ilen: end < start && !outside ? count + end - start : end - start
  };
}
function pathSegment(ctx, line, segment, params) {
  const { points, options } = line;
  const { count, start, loop, ilen } = pathVars(points, segment, params);
  const lineMethod = getLineMethod(options);
  let { move = true, reverse } = params || {};
  let i, point, prev;
  for (i = 0; i <= ilen; ++i) {
    point = points[(start + (reverse ? ilen - i : i)) % count];
    if (point.skip) {
      continue;
    } else if (move) {
      ctx.moveTo(point.x, point.y);
      move = false;
    } else {
      lineMethod(ctx, prev, point, reverse, options.stepped);
    }
    prev = point;
  }
  if (loop) {
    point = points[(start + (reverse ? ilen : 0)) % count];
    lineMethod(ctx, prev, point, reverse, options.stepped);
  }
  return !!loop;
}
function fastPathSegment(ctx, line, segment, params) {
  const points = line.points;
  const { count, start, ilen } = pathVars(points, segment, params);
  const { move = true, reverse } = params || {};
  let avgX = 0;
  let countX = 0;
  let i, point, prevX, minY, maxY, lastY;
  const pointIndex = (index) => (start + (reverse ? ilen - index : index)) % count;
  const drawX = () => {
    if (minY !== maxY) {
      ctx.lineTo(avgX, maxY);
      ctx.lineTo(avgX, minY);
      ctx.lineTo(avgX, lastY);
    }
  };
  if (move) {
    point = points[pointIndex(0)];
    ctx.moveTo(point.x, point.y);
  }
  for (i = 0; i <= ilen; ++i) {
    point = points[pointIndex(i)];
    if (point.skip) {
      continue;
    }
    const x = point.x;
    const y = point.y;
    const truncX = x | 0;
    if (truncX === prevX) {
      if (y < minY) {
        minY = y;
      } else if (y > maxY) {
        maxY = y;
      }
      avgX = (countX * avgX + x) / ++countX;
    } else {
      drawX();
      ctx.lineTo(x, y);
      prevX = truncX;
      countX = 0;
      minY = maxY = y;
    }
    lastY = y;
  }
  drawX();
}
function _getSegmentMethod(line) {
  const opts = line.options;
  const borderDash = opts.borderDash && opts.borderDash.length;
  const useFastPath = !line._decimated && !line._loop && !opts.tension && opts.cubicInterpolationMode !== "monotone" && !opts.stepped && !borderDash;
  return useFastPath ? fastPathSegment : pathSegment;
}
function _getInterpolationMethod(options) {
  if (options.stepped) {
    return _steppedInterpolation;
  }
  if (options.tension || options.cubicInterpolationMode === "monotone") {
    return _bezierInterpolation;
  }
  return _pointInLine;
}
function strokePathWithCache(ctx, line, start, count) {
  let path = line._path;
  if (!path) {
    path = line._path = new Path2D();
    if (line.path(path, start, count)) {
      path.closePath();
    }
  }
  setStyle(ctx, line.options);
  ctx.stroke(path);
}
function strokePathDirect(ctx, line, start, count) {
  const { segments, options } = line;
  const segmentMethod = _getSegmentMethod(line);
  for (const segment of segments) {
    setStyle(ctx, options, segment.style);
    ctx.beginPath();
    if (segmentMethod(ctx, line, segment, {
      start,
      end: start + count - 1
    })) {
      ctx.closePath();
    }
    ctx.stroke();
  }
}
var usePath2D = typeof Path2D === "function";
function draw(ctx, line, start, count) {
  if (usePath2D && !line.options.segment) {
    strokePathWithCache(ctx, line, start, count);
  } else {
    strokePathDirect(ctx, line, start, count);
  }
}
var LineElement = class extends Element {
  constructor(cfg) {
    super();
    this.animated = true;
    this.options = void 0;
    this._chart = void 0;
    this._loop = void 0;
    this._fullLoop = void 0;
    this._path = void 0;
    this._points = void 0;
    this._segments = void 0;
    this._decimated = false;
    this._pointsUpdated = false;
    this._datasetIndex = void 0;
    if (cfg) {
      Object.assign(this, cfg);
    }
  }
  updateControlPoints(chartArea, indexAxis) {
    const options = this.options;
    if ((options.tension || options.cubicInterpolationMode === "monotone") && !options.stepped && !this._pointsUpdated) {
      const loop = options.spanGaps ? this._loop : this._fullLoop;
      _updateBezierControlPoints(this._points, options, chartArea, loop, indexAxis);
      this._pointsUpdated = true;
    }
  }
  set points(points) {
    this._points = points;
    delete this._segments;
    delete this._path;
    this._pointsUpdated = false;
  }
  get points() {
    return this._points;
  }
  get segments() {
    return this._segments || (this._segments = _computeSegments(this, this.options.segment));
  }
  first() {
    const segments = this.segments;
    const points = this.points;
    return segments.length && points[segments[0].start];
  }
  last() {
    const segments = this.segments;
    const points = this.points;
    const count = segments.length;
    return count && points[segments[count - 1].end];
  }
  interpolate(point, property) {
    const options = this.options;
    const value = point[property];
    const points = this.points;
    const segments = _boundSegments(this, {
      property,
      start: value,
      end: value
    });
    if (!segments.length) {
      return;
    }
    const result = [];
    const _interpolate = _getInterpolationMethod(options);
    let i, ilen;
    for (i = 0, ilen = segments.length; i < ilen; ++i) {
      const { start, end } = segments[i];
      const p1 = points[start];
      const p2 = points[end];
      if (p1 === p2) {
        result.push(p1);
        continue;
      }
      const t = Math.abs((value - p1[property]) / (p2[property] - p1[property]));
      const interpolated = _interpolate(p1, p2, t, options.stepped);
      interpolated[property] = point[property];
      result.push(interpolated);
    }
    return result.length === 1 ? result[0] : result;
  }
  pathSegment(ctx, segment, params) {
    const segmentMethod = _getSegmentMethod(this);
    return segmentMethod(ctx, this, segment, params);
  }
  path(ctx, start, count) {
    const segments = this.segments;
    const segmentMethod = _getSegmentMethod(this);
    let loop = this._loop;
    start = start || 0;
    count = count || this.points.length - start;
    for (const segment of segments) {
      loop &= segmentMethod(ctx, this, segment, {
        start,
        end: start + count - 1
      });
    }
    return !!loop;
  }
  draw(ctx, chartArea, start, count) {
    const options = this.options || {};
    const points = this.points || [];
    if (points.length && options.borderWidth) {
      ctx.save();
      draw(ctx, this, start, count);
      ctx.restore();
    }
    if (this.animated) {
      this._pointsUpdated = false;
      this._path = void 0;
    }
  }
};
__publicField(LineElement, "id", "line");
__publicField(LineElement, "defaults", {
  borderCapStyle: "butt",
  borderDash: [],
  borderDashOffset: 0,
  borderJoinStyle: "miter",
  borderWidth: 3,
  capBezierPoints: true,
  cubicInterpolationMode: "default",
  fill: false,
  spanGaps: false,
  stepped: false,
  tension: 0
});
__publicField(LineElement, "defaultRoutes", {
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
});
__publicField(LineElement, "descriptors", {
  _scriptable: true,
  _indexable: (name) => name !== "borderDash" && name !== "fill"
});
function inRange$1(el, pos, axis, useFinalPosition) {
  const options = el.options;
  const { [axis]: value } = el.getProps([
    axis
  ], useFinalPosition);
  return Math.abs(pos - value) < options.radius + options.hitRadius;
}
var PointElement = class extends Element {
  constructor(cfg) {
    super();
    __publicField(this, "parsed");
    __publicField(this, "skip");
    __publicField(this, "stop");
    this.options = void 0;
    this.parsed = void 0;
    this.skip = void 0;
    this.stop = void 0;
    if (cfg) {
      Object.assign(this, cfg);
    }
  }
  inRange(mouseX, mouseY, useFinalPosition) {
    const options = this.options;
    const { x, y } = this.getProps([
      "x",
      "y"
    ], useFinalPosition);
    return Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2) < Math.pow(options.hitRadius + options.radius, 2);
  }
  inXRange(mouseX, useFinalPosition) {
    return inRange$1(this, mouseX, "x", useFinalPosition);
  }
  inYRange(mouseY, useFinalPosition) {
    return inRange$1(this, mouseY, "y", useFinalPosition);
  }
  getCenterPoint(useFinalPosition) {
    const { x, y } = this.getProps([
      "x",
      "y"
    ], useFinalPosition);
    return {
      x,
      y
    };
  }
  size(options) {
    options = options || this.options || {};
    let radius = options.radius || 0;
    radius = Math.max(radius, radius && options.hoverRadius || 0);
    const borderWidth = radius && options.borderWidth || 0;
    return (radius + borderWidth) * 2;
  }
  draw(ctx, area) {
    const options = this.options;
    if (this.skip || options.radius < 0.1 || !_isPointInArea(this, area, this.size(options) / 2)) {
      return;
    }
    ctx.strokeStyle = options.borderColor;
    ctx.lineWidth = options.borderWidth;
    ctx.fillStyle = options.backgroundColor;
    drawPoint(ctx, options, this.x, this.y);
  }
  getRange() {
    const options = this.options || {};
    return options.radius + options.hitRadius;
  }
};
__publicField(PointElement, "id", "point");
/**
* @type {any}
*/
__publicField(PointElement, "defaults", {
  borderWidth: 1,
  hitRadius: 1,
  hoverBorderWidth: 1,
  hoverRadius: 4,
  pointStyle: "circle",
  radius: 3,
  rotation: 0
});
/**
* @type {any}
*/
__publicField(PointElement, "defaultRoutes", {
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
});
function getBarBounds(bar, useFinalPosition) {
  const { x, y, base, width, height } = bar.getProps([
    "x",
    "y",
    "base",
    "width",
    "height"
  ], useFinalPosition);
  let left, right, top, bottom, half;
  if (bar.horizontal) {
    half = height / 2;
    left = Math.min(x, base);
    right = Math.max(x, base);
    top = y - half;
    bottom = y + half;
  } else {
    half = width / 2;
    left = x - half;
    right = x + half;
    top = Math.min(y, base);
    bottom = Math.max(y, base);
  }
  return {
    left,
    top,
    right,
    bottom
  };
}
function skipOrLimit(skip2, value, min, max) {
  return skip2 ? 0 : _limitValue(value, min, max);
}
function parseBorderWidth(bar, maxW, maxH) {
  const value = bar.options.borderWidth;
  const skip2 = bar.borderSkipped;
  const o = toTRBL(value);
  return {
    t: skipOrLimit(skip2.top, o.top, 0, maxH),
    r: skipOrLimit(skip2.right, o.right, 0, maxW),
    b: skipOrLimit(skip2.bottom, o.bottom, 0, maxH),
    l: skipOrLimit(skip2.left, o.left, 0, maxW)
  };
}
function parseBorderRadius(bar, maxW, maxH) {
  const { enableBorderRadius } = bar.getProps([
    "enableBorderRadius"
  ]);
  const value = bar.options.borderRadius;
  const o = toTRBLCorners(value);
  const maxR = Math.min(maxW, maxH);
  const skip2 = bar.borderSkipped;
  const enableBorder = enableBorderRadius || isObject(value);
  return {
    topLeft: skipOrLimit(!enableBorder || skip2.top || skip2.left, o.topLeft, 0, maxR),
    topRight: skipOrLimit(!enableBorder || skip2.top || skip2.right, o.topRight, 0, maxR),
    bottomLeft: skipOrLimit(!enableBorder || skip2.bottom || skip2.left, o.bottomLeft, 0, maxR),
    bottomRight: skipOrLimit(!enableBorder || skip2.bottom || skip2.right, o.bottomRight, 0, maxR)
  };
}
function boundingRects(bar) {
  const bounds = getBarBounds(bar);
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  const border = parseBorderWidth(bar, width / 2, height / 2);
  const radius = parseBorderRadius(bar, width / 2, height / 2);
  return {
    outer: {
      x: bounds.left,
      y: bounds.top,
      w: width,
      h: height,
      radius
    },
    inner: {
      x: bounds.left + border.l,
      y: bounds.top + border.t,
      w: width - border.l - border.r,
      h: height - border.t - border.b,
      radius: {
        topLeft: Math.max(0, radius.topLeft - Math.max(border.t, border.l)),
        topRight: Math.max(0, radius.topRight - Math.max(border.t, border.r)),
        bottomLeft: Math.max(0, radius.bottomLeft - Math.max(border.b, border.l)),
        bottomRight: Math.max(0, radius.bottomRight - Math.max(border.b, border.r))
      }
    }
  };
}
function inRange(bar, x, y, useFinalPosition) {
  const skipX = x === null;
  const skipY = y === null;
  const skipBoth = skipX && skipY;
  const bounds = bar && !skipBoth && getBarBounds(bar, useFinalPosition);
  return bounds && (skipX || _isBetween(x, bounds.left, bounds.right)) && (skipY || _isBetween(y, bounds.top, bounds.bottom));
}
function hasRadius(radius) {
  return radius.topLeft || radius.topRight || radius.bottomLeft || radius.bottomRight;
}
function addNormalRectPath(ctx, rect) {
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
}
function inflateRect(rect, amount, refRect = {}) {
  const x = rect.x !== refRect.x ? -amount : 0;
  const y = rect.y !== refRect.y ? -amount : 0;
  const w = (rect.x + rect.w !== refRect.x + refRect.w ? amount : 0) - x;
  const h = (rect.y + rect.h !== refRect.y + refRect.h ? amount : 0) - y;
  return {
    x: rect.x + x,
    y: rect.y + y,
    w: rect.w + w,
    h: rect.h + h,
    radius: rect.radius
  };
}
var BarElement = class extends Element {
  constructor(cfg) {
    super();
    this.options = void 0;
    this.horizontal = void 0;
    this.base = void 0;
    this.width = void 0;
    this.height = void 0;
    this.inflateAmount = void 0;
    if (cfg) {
      Object.assign(this, cfg);
    }
  }
  draw(ctx) {
    const { inflateAmount, options: { borderColor, backgroundColor } } = this;
    const { inner, outer } = boundingRects(this);
    const addRectPath = hasRadius(outer.radius) ? addRoundedRectPath : addNormalRectPath;
    ctx.save();
    if (outer.w !== inner.w || outer.h !== inner.h) {
      ctx.beginPath();
      addRectPath(ctx, inflateRect(outer, inflateAmount, inner));
      ctx.clip();
      addRectPath(ctx, inflateRect(inner, -inflateAmount, outer));
      ctx.fillStyle = borderColor;
      ctx.fill("evenodd");
    }
    ctx.beginPath();
    addRectPath(ctx, inflateRect(inner, inflateAmount));
    ctx.fillStyle = backgroundColor;
    ctx.fill();
    ctx.restore();
  }
  inRange(mouseX, mouseY, useFinalPosition) {
    return inRange(this, mouseX, mouseY, useFinalPosition);
  }
  inXRange(mouseX, useFinalPosition) {
    return inRange(this, mouseX, null, useFinalPosition);
  }
  inYRange(mouseY, useFinalPosition) {
    return inRange(this, null, mouseY, useFinalPosition);
  }
  getCenterPoint(useFinalPosition) {
    const { x, y, base, horizontal } = this.getProps([
      "x",
      "y",
      "base",
      "horizontal"
    ], useFinalPosition);
    return {
      x: horizontal ? (x + base) / 2 : x,
      y: horizontal ? y : (y + base) / 2
    };
  }
  getRange(axis) {
    return axis === "x" ? this.width / 2 : this.height / 2;
  }
};
__publicField(BarElement, "id", "bar");
__publicField(BarElement, "defaults", {
  borderSkipped: "start",
  borderWidth: 0,
  borderRadius: 0,
  inflateAmount: "auto",
  pointStyle: void 0
});
__publicField(BarElement, "defaultRoutes", {
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
});
var positioners = {
  average(items) {
    if (!items.length) {
      return false;
    }
    let i, len;
    let xSet = /* @__PURE__ */ new Set();
    let y = 0;
    let count = 0;
    for (i = 0, len = items.length; i < len; ++i) {
      const el = items[i].element;
      if (el && el.hasValue()) {
        const pos = el.tooltipPosition();
        xSet.add(pos.x);
        y += pos.y;
        ++count;
      }
    }
    if (count === 0 || xSet.size === 0) {
      return false;
    }
    const xAverage = [
      ...xSet
    ].reduce((a, b) => a + b) / xSet.size;
    return {
      x: xAverage,
      y: y / count
    };
  },
  nearest(items, eventPosition) {
    if (!items.length) {
      return false;
    }
    let x = eventPosition.x;
    let y = eventPosition.y;
    let minDistance = Number.POSITIVE_INFINITY;
    let i, len, nearestElement;
    for (i = 0, len = items.length; i < len; ++i) {
      const el = items[i].element;
      if (el && el.hasValue()) {
        const center = el.getCenterPoint();
        const d = distanceBetweenPoints(eventPosition, center);
        if (d < minDistance) {
          minDistance = d;
          nearestElement = el;
        }
      }
    }
    if (nearestElement) {
      const tp = nearestElement.tooltipPosition();
      x = tp.x;
      y = tp.y;
    }
    return {
      x,
      y
    };
  }
};
function pushOrConcat(base, toPush) {
  if (toPush) {
    if (isArray(toPush)) {
      Array.prototype.push.apply(base, toPush);
    } else {
      base.push(toPush);
    }
  }
  return base;
}
function splitNewlines(str) {
  if ((typeof str === "string" || str instanceof String) && str.indexOf("\n") > -1) {
    return str.split("\n");
  }
  return str;
}
function createTooltipItem(chart, item) {
  const { element, datasetIndex, index } = item;
  const controller = chart.getDatasetMeta(datasetIndex).controller;
  const { label, value } = controller.getLabelAndValue(index);
  return {
    chart,
    label,
    parsed: controller.getParsed(index),
    raw: chart.data.datasets[datasetIndex].data[index],
    formattedValue: value,
    dataset: controller.getDataset(),
    dataIndex: index,
    datasetIndex,
    element
  };
}
function getTooltipSize(tooltip, options) {
  const ctx = tooltip.chart.ctx;
  const { body, footer, title } = tooltip;
  const { boxWidth, boxHeight } = options;
  const bodyFont = toFont(options.bodyFont);
  const titleFont = toFont(options.titleFont);
  const footerFont = toFont(options.footerFont);
  const titleLineCount = title.length;
  const footerLineCount = footer.length;
  const bodyLineItemCount = body.length;
  const padding = toPadding(options.padding);
  let height = padding.height;
  let width = 0;
  let combinedBodyLength = body.reduce((count, bodyItem) => count + bodyItem.before.length + bodyItem.lines.length + bodyItem.after.length, 0);
  combinedBodyLength += tooltip.beforeBody.length + tooltip.afterBody.length;
  if (titleLineCount) {
    height += titleLineCount * titleFont.lineHeight + (titleLineCount - 1) * options.titleSpacing + options.titleMarginBottom;
  }
  if (combinedBodyLength) {
    const bodyLineHeight = options.displayColors ? Math.max(boxHeight, bodyFont.lineHeight) : bodyFont.lineHeight;
    height += bodyLineItemCount * bodyLineHeight + (combinedBodyLength - bodyLineItemCount) * bodyFont.lineHeight + (combinedBodyLength - 1) * options.bodySpacing;
  }
  if (footerLineCount) {
    height += options.footerMarginTop + footerLineCount * footerFont.lineHeight + (footerLineCount - 1) * options.footerSpacing;
  }
  let widthPadding = 0;
  const maxLineWidth = function(line) {
    width = Math.max(width, ctx.measureText(line).width + widthPadding);
  };
  ctx.save();
  ctx.font = titleFont.string;
  each(tooltip.title, maxLineWidth);
  ctx.font = bodyFont.string;
  each(tooltip.beforeBody.concat(tooltip.afterBody), maxLineWidth);
  widthPadding = options.displayColors ? boxWidth + 2 + options.boxPadding : 0;
  each(body, (bodyItem) => {
    each(bodyItem.before, maxLineWidth);
    each(bodyItem.lines, maxLineWidth);
    each(bodyItem.after, maxLineWidth);
  });
  widthPadding = 0;
  ctx.font = footerFont.string;
  each(tooltip.footer, maxLineWidth);
  ctx.restore();
  width += padding.width;
  return {
    width,
    height
  };
}
function determineYAlign(chart, size) {
  const { y, height } = size;
  if (y < height / 2) {
    return "top";
  } else if (y > chart.height - height / 2) {
    return "bottom";
  }
  return "center";
}
function doesNotFitWithAlign(xAlign, chart, options, size) {
  const { x, width } = size;
  const caret = options.caretSize + options.caretPadding;
  if (xAlign === "left" && x + width + caret > chart.width) {
    return true;
  }
  if (xAlign === "right" && x - width - caret < 0) {
    return true;
  }
}
function determineXAlign(chart, options, size, yAlign) {
  const { x, width } = size;
  const { width: chartWidth, chartArea: { left, right } } = chart;
  let xAlign = "center";
  if (yAlign === "center") {
    xAlign = x <= (left + right) / 2 ? "left" : "right";
  } else if (x <= width / 2) {
    xAlign = "left";
  } else if (x >= chartWidth - width / 2) {
    xAlign = "right";
  }
  if (doesNotFitWithAlign(xAlign, chart, options, size)) {
    xAlign = "center";
  }
  return xAlign;
}
function determineAlignment(chart, options, size) {
  const yAlign = size.yAlign || options.yAlign || determineYAlign(chart, size);
  return {
    xAlign: size.xAlign || options.xAlign || determineXAlign(chart, options, size, yAlign),
    yAlign
  };
}
function alignX(size, xAlign) {
  let { x, width } = size;
  if (xAlign === "right") {
    x -= width;
  } else if (xAlign === "center") {
    x -= width / 2;
  }
  return x;
}
function alignY(size, yAlign, paddingAndSize) {
  let { y, height } = size;
  if (yAlign === "top") {
    y += paddingAndSize;
  } else if (yAlign === "bottom") {
    y -= height + paddingAndSize;
  } else {
    y -= height / 2;
  }
  return y;
}
function getBackgroundPoint(options, size, alignment, chart) {
  const { caretSize, caretPadding, cornerRadius } = options;
  const { xAlign, yAlign } = alignment;
  const paddingAndSize = caretSize + caretPadding;
  const { topLeft, topRight, bottomLeft, bottomRight } = toTRBLCorners(cornerRadius);
  let x = alignX(size, xAlign);
  const y = alignY(size, yAlign, paddingAndSize);
  if (yAlign === "center") {
    if (xAlign === "left") {
      x += paddingAndSize;
    } else if (xAlign === "right") {
      x -= paddingAndSize;
    }
  } else if (xAlign === "left") {
    x -= Math.max(topLeft, bottomLeft) + caretSize;
  } else if (xAlign === "right") {
    x += Math.max(topRight, bottomRight) + caretSize;
  }
  return {
    x: _limitValue(x, 0, chart.width - size.width),
    y: _limitValue(y, 0, chart.height - size.height)
  };
}
function getAlignedX(tooltip, align, options) {
  const padding = toPadding(options.padding);
  return align === "center" ? tooltip.x + tooltip.width / 2 : align === "right" ? tooltip.x + tooltip.width - padding.right : tooltip.x + padding.left;
}
function getBeforeAfterBodyLines(callback2) {
  return pushOrConcat([], splitNewlines(callback2));
}
function createTooltipContext(parent, tooltip, tooltipItems) {
  return createContext(parent, {
    tooltip,
    tooltipItems,
    type: "tooltip"
  });
}
function overrideCallbacks(callbacks, context) {
  const override = context && context.dataset && context.dataset.tooltip && context.dataset.tooltip.callbacks;
  return override ? callbacks.override(override) : callbacks;
}
var defaultCallbacks = {
  beforeTitle: noop,
  title(tooltipItems) {
    if (tooltipItems.length > 0) {
      const item = tooltipItems[0];
      const labels = item.chart.data.labels;
      const labelCount = labels ? labels.length : 0;
      if (this && this.options && this.options.mode === "dataset") {
        return item.dataset.label || "";
      } else if (item.label) {
        return item.label;
      } else if (labelCount > 0 && item.dataIndex < labelCount) {
        return labels[item.dataIndex];
      }
    }
    return "";
  },
  afterTitle: noop,
  beforeBody: noop,
  beforeLabel: noop,
  label(tooltipItem) {
    if (this && this.options && this.options.mode === "dataset") {
      return tooltipItem.label + ": " + tooltipItem.formattedValue || tooltipItem.formattedValue;
    }
    let label = tooltipItem.dataset.label || "";
    if (label) {
      label += ": ";
    }
    const value = tooltipItem.formattedValue;
    if (!isNullOrUndef(value)) {
      label += value;
    }
    return label;
  },
  labelColor(tooltipItem) {
    const meta = tooltipItem.chart.getDatasetMeta(tooltipItem.datasetIndex);
    const options = meta.controller.getStyle(tooltipItem.dataIndex);
    return {
      borderColor: options.borderColor,
      backgroundColor: options.backgroundColor,
      borderWidth: options.borderWidth,
      borderDash: options.borderDash,
      borderDashOffset: options.borderDashOffset,
      borderRadius: 0
    };
  },
  labelTextColor() {
    return this.options.bodyColor;
  },
  labelPointStyle(tooltipItem) {
    const meta = tooltipItem.chart.getDatasetMeta(tooltipItem.datasetIndex);
    const options = meta.controller.getStyle(tooltipItem.dataIndex);
    return {
      pointStyle: options.pointStyle,
      rotation: options.rotation
    };
  },
  afterLabel: noop,
  afterBody: noop,
  beforeFooter: noop,
  footer: noop,
  afterFooter: noop
};
function invokeCallbackWithFallback(callbacks, name, ctx, arg) {
  const result = callbacks[name].call(ctx, arg);
  if (typeof result === "undefined") {
    return defaultCallbacks[name].call(ctx, arg);
  }
  return result;
}
var Tooltip = class extends Element {
  constructor(config) {
    super();
    this.opacity = 0;
    this._active = [];
    this._eventPosition = void 0;
    this._size = void 0;
    this._cachedAnimations = void 0;
    this._tooltipItems = [];
    this.$animations = void 0;
    this.$context = void 0;
    this.chart = config.chart;
    this.options = config.options;
    this.dataPoints = void 0;
    this.title = void 0;
    this.beforeBody = void 0;
    this.body = void 0;
    this.afterBody = void 0;
    this.footer = void 0;
    this.xAlign = void 0;
    this.yAlign = void 0;
    this.x = void 0;
    this.y = void 0;
    this.height = void 0;
    this.width = void 0;
    this.caretX = void 0;
    this.caretY = void 0;
    this.labelColors = void 0;
    this.labelPointStyles = void 0;
    this.labelTextColors = void 0;
  }
  initialize(options) {
    this.options = options;
    this._cachedAnimations = void 0;
    this.$context = void 0;
  }
  _resolveAnimations() {
    const cached = this._cachedAnimations;
    if (cached) {
      return cached;
    }
    const chart = this.chart;
    const options = this.options.setContext(this.getContext());
    const opts = options.enabled && chart.options.animation && options.animations;
    const animations = new Animations(this.chart, opts);
    if (opts._cacheable) {
      this._cachedAnimations = Object.freeze(animations);
    }
    return animations;
  }
  getContext() {
    return this.$context || (this.$context = createTooltipContext(this.chart.getContext(), this, this._tooltipItems));
  }
  getTitle(context, options) {
    const { callbacks } = options;
    const beforeTitle = invokeCallbackWithFallback(callbacks, "beforeTitle", this, context);
    const title = invokeCallbackWithFallback(callbacks, "title", this, context);
    const afterTitle = invokeCallbackWithFallback(callbacks, "afterTitle", this, context);
    let lines = [];
    lines = pushOrConcat(lines, splitNewlines(beforeTitle));
    lines = pushOrConcat(lines, splitNewlines(title));
    lines = pushOrConcat(lines, splitNewlines(afterTitle));
    return lines;
  }
  getBeforeBody(tooltipItems, options) {
    return getBeforeAfterBodyLines(invokeCallbackWithFallback(options.callbacks, "beforeBody", this, tooltipItems));
  }
  getBody(tooltipItems, options) {
    const { callbacks } = options;
    const bodyItems = [];
    each(tooltipItems, (context) => {
      const bodyItem = {
        before: [],
        lines: [],
        after: []
      };
      const scoped = overrideCallbacks(callbacks, context);
      pushOrConcat(bodyItem.before, splitNewlines(invokeCallbackWithFallback(scoped, "beforeLabel", this, context)));
      pushOrConcat(bodyItem.lines, invokeCallbackWithFallback(scoped, "label", this, context));
      pushOrConcat(bodyItem.after, splitNewlines(invokeCallbackWithFallback(scoped, "afterLabel", this, context)));
      bodyItems.push(bodyItem);
    });
    return bodyItems;
  }
  getAfterBody(tooltipItems, options) {
    return getBeforeAfterBodyLines(invokeCallbackWithFallback(options.callbacks, "afterBody", this, tooltipItems));
  }
  getFooter(tooltipItems, options) {
    const { callbacks } = options;
    const beforeFooter = invokeCallbackWithFallback(callbacks, "beforeFooter", this, tooltipItems);
    const footer = invokeCallbackWithFallback(callbacks, "footer", this, tooltipItems);
    const afterFooter = invokeCallbackWithFallback(callbacks, "afterFooter", this, tooltipItems);
    let lines = [];
    lines = pushOrConcat(lines, splitNewlines(beforeFooter));
    lines = pushOrConcat(lines, splitNewlines(footer));
    lines = pushOrConcat(lines, splitNewlines(afterFooter));
    return lines;
  }
  _createItems(options) {
    const active = this._active;
    const data = this.chart.data;
    const labelColors = [];
    const labelPointStyles = [];
    const labelTextColors = [];
    let tooltipItems = [];
    let i, len;
    for (i = 0, len = active.length; i < len; ++i) {
      tooltipItems.push(createTooltipItem(this.chart, active[i]));
    }
    if (options.filter) {
      tooltipItems = tooltipItems.filter((element, index, array) => options.filter(element, index, array, data));
    }
    if (options.itemSort) {
      tooltipItems = tooltipItems.sort((a, b) => options.itemSort(a, b, data));
    }
    each(tooltipItems, (context) => {
      const scoped = overrideCallbacks(options.callbacks, context);
      labelColors.push(invokeCallbackWithFallback(scoped, "labelColor", this, context));
      labelPointStyles.push(invokeCallbackWithFallback(scoped, "labelPointStyle", this, context));
      labelTextColors.push(invokeCallbackWithFallback(scoped, "labelTextColor", this, context));
    });
    this.labelColors = labelColors;
    this.labelPointStyles = labelPointStyles;
    this.labelTextColors = labelTextColors;
    this.dataPoints = tooltipItems;
    return tooltipItems;
  }
  update(changed, replay) {
    const options = this.options.setContext(this.getContext());
    const active = this._active;
    let properties;
    let tooltipItems = [];
    if (!active.length) {
      if (this.opacity !== 0) {
        properties = {
          opacity: 0
        };
      }
    } else {
      const position = positioners[options.position].call(this, active, this._eventPosition);
      tooltipItems = this._createItems(options);
      this.title = this.getTitle(tooltipItems, options);
      this.beforeBody = this.getBeforeBody(tooltipItems, options);
      this.body = this.getBody(tooltipItems, options);
      this.afterBody = this.getAfterBody(tooltipItems, options);
      this.footer = this.getFooter(tooltipItems, options);
      const size = this._size = getTooltipSize(this, options);
      const positionAndSize = Object.assign({}, position, size);
      const alignment = determineAlignment(this.chart, options, positionAndSize);
      const backgroundPoint = getBackgroundPoint(options, positionAndSize, alignment, this.chart);
      this.xAlign = alignment.xAlign;
      this.yAlign = alignment.yAlign;
      properties = {
        opacity: 1,
        x: backgroundPoint.x,
        y: backgroundPoint.y,
        width: size.width,
        height: size.height,
        caretX: position.x,
        caretY: position.y
      };
    }
    this._tooltipItems = tooltipItems;
    this.$context = void 0;
    if (properties) {
      this._resolveAnimations().update(this, properties);
    }
    if (changed && options.external) {
      options.external.call(this, {
        chart: this.chart,
        tooltip: this,
        replay
      });
    }
  }
  drawCaret(tooltipPoint, ctx, size, options) {
    const caretPosition = this.getCaretPosition(tooltipPoint, size, options);
    ctx.lineTo(caretPosition.x1, caretPosition.y1);
    ctx.lineTo(caretPosition.x2, caretPosition.y2);
    ctx.lineTo(caretPosition.x3, caretPosition.y3);
  }
  getCaretPosition(tooltipPoint, size, options) {
    const { xAlign, yAlign } = this;
    const { caretSize, cornerRadius } = options;
    const { topLeft, topRight, bottomLeft, bottomRight } = toTRBLCorners(cornerRadius);
    const { x: ptX, y: ptY } = tooltipPoint;
    const { width, height } = size;
    let x1, x2, x3, y1, y2, y3;
    if (yAlign === "center") {
      y2 = ptY + height / 2;
      if (xAlign === "left") {
        x1 = ptX;
        x2 = x1 - caretSize;
        y1 = y2 + caretSize;
        y3 = y2 - caretSize;
      } else {
        x1 = ptX + width;
        x2 = x1 + caretSize;
        y1 = y2 - caretSize;
        y3 = y2 + caretSize;
      }
      x3 = x1;
    } else {
      if (xAlign === "left") {
        x2 = ptX + Math.max(topLeft, bottomLeft) + caretSize;
      } else if (xAlign === "right") {
        x2 = ptX + width - Math.max(topRight, bottomRight) - caretSize;
      } else {
        x2 = this.caretX;
      }
      if (yAlign === "top") {
        y1 = ptY;
        y2 = y1 - caretSize;
        x1 = x2 - caretSize;
        x3 = x2 + caretSize;
      } else {
        y1 = ptY + height;
        y2 = y1 + caretSize;
        x1 = x2 + caretSize;
        x3 = x2 - caretSize;
      }
      y3 = y1;
    }
    return {
      x1,
      x2,
      x3,
      y1,
      y2,
      y3
    };
  }
  drawTitle(pt, ctx, options) {
    const title = this.title;
    const length = title.length;
    let titleFont, titleSpacing, i;
    if (length) {
      const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);
      pt.x = getAlignedX(this, options.titleAlign, options);
      ctx.textAlign = rtlHelper.textAlign(options.titleAlign);
      ctx.textBaseline = "middle";
      titleFont = toFont(options.titleFont);
      titleSpacing = options.titleSpacing;
      ctx.fillStyle = options.titleColor;
      ctx.font = titleFont.string;
      for (i = 0; i < length; ++i) {
        ctx.fillText(title[i], rtlHelper.x(pt.x), pt.y + titleFont.lineHeight / 2);
        pt.y += titleFont.lineHeight + titleSpacing;
        if (i + 1 === length) {
          pt.y += options.titleMarginBottom - titleSpacing;
        }
      }
    }
  }
  _drawColorBox(ctx, pt, i, rtlHelper, options) {
    const labelColor = this.labelColors[i];
    const labelPointStyle = this.labelPointStyles[i];
    const { boxHeight, boxWidth } = options;
    const bodyFont = toFont(options.bodyFont);
    const colorX = getAlignedX(this, "left", options);
    const rtlColorX = rtlHelper.x(colorX);
    const yOffSet = boxHeight < bodyFont.lineHeight ? (bodyFont.lineHeight - boxHeight) / 2 : 0;
    const colorY = pt.y + yOffSet;
    if (options.usePointStyle) {
      const drawOptions = {
        radius: Math.min(boxWidth, boxHeight) / 2,
        pointStyle: labelPointStyle.pointStyle,
        rotation: labelPointStyle.rotation,
        borderWidth: 1
      };
      const centerX = rtlHelper.leftForLtr(rtlColorX, boxWidth) + boxWidth / 2;
      const centerY = colorY + boxHeight / 2;
      ctx.strokeStyle = options.multiKeyBackground;
      ctx.fillStyle = options.multiKeyBackground;
      drawPoint(ctx, drawOptions, centerX, centerY);
      ctx.strokeStyle = labelColor.borderColor;
      ctx.fillStyle = labelColor.backgroundColor;
      drawPoint(ctx, drawOptions, centerX, centerY);
    } else {
      ctx.lineWidth = isObject(labelColor.borderWidth) ? Math.max(...Object.values(labelColor.borderWidth)) : labelColor.borderWidth || 1;
      ctx.strokeStyle = labelColor.borderColor;
      ctx.setLineDash(labelColor.borderDash || []);
      ctx.lineDashOffset = labelColor.borderDashOffset || 0;
      const outerX = rtlHelper.leftForLtr(rtlColorX, boxWidth);
      const innerX = rtlHelper.leftForLtr(rtlHelper.xPlus(rtlColorX, 1), boxWidth - 2);
      const borderRadius = toTRBLCorners(labelColor.borderRadius);
      if (Object.values(borderRadius).some((v) => v !== 0)) {
        ctx.beginPath();
        ctx.fillStyle = options.multiKeyBackground;
        addRoundedRectPath(ctx, {
          x: outerX,
          y: colorY,
          w: boxWidth,
          h: boxHeight,
          radius: borderRadius
        });
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = labelColor.backgroundColor;
        ctx.beginPath();
        addRoundedRectPath(ctx, {
          x: innerX,
          y: colorY + 1,
          w: boxWidth - 2,
          h: boxHeight - 2,
          radius: borderRadius
        });
        ctx.fill();
      } else {
        ctx.fillStyle = options.multiKeyBackground;
        ctx.fillRect(outerX, colorY, boxWidth, boxHeight);
        ctx.strokeRect(outerX, colorY, boxWidth, boxHeight);
        ctx.fillStyle = labelColor.backgroundColor;
        ctx.fillRect(innerX, colorY + 1, boxWidth - 2, boxHeight - 2);
      }
    }
    ctx.fillStyle = this.labelTextColors[i];
  }
  drawBody(pt, ctx, options) {
    const { body } = this;
    const { bodySpacing, bodyAlign, displayColors, boxHeight, boxWidth, boxPadding } = options;
    const bodyFont = toFont(options.bodyFont);
    let bodyLineHeight = bodyFont.lineHeight;
    let xLinePadding = 0;
    const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);
    const fillLineOfText = function(line) {
      ctx.fillText(line, rtlHelper.x(pt.x + xLinePadding), pt.y + bodyLineHeight / 2);
      pt.y += bodyLineHeight + bodySpacing;
    };
    const bodyAlignForCalculation = rtlHelper.textAlign(bodyAlign);
    let bodyItem, textColor, lines, i, j, ilen, jlen;
    ctx.textAlign = bodyAlign;
    ctx.textBaseline = "middle";
    ctx.font = bodyFont.string;
    pt.x = getAlignedX(this, bodyAlignForCalculation, options);
    ctx.fillStyle = options.bodyColor;
    each(this.beforeBody, fillLineOfText);
    xLinePadding = displayColors && bodyAlignForCalculation !== "right" ? bodyAlign === "center" ? boxWidth / 2 + boxPadding : boxWidth + 2 + boxPadding : 0;
    for (i = 0, ilen = body.length; i < ilen; ++i) {
      bodyItem = body[i];
      textColor = this.labelTextColors[i];
      ctx.fillStyle = textColor;
      each(bodyItem.before, fillLineOfText);
      lines = bodyItem.lines;
      if (displayColors && lines.length) {
        this._drawColorBox(ctx, pt, i, rtlHelper, options);
        bodyLineHeight = Math.max(bodyFont.lineHeight, boxHeight);
      }
      for (j = 0, jlen = lines.length; j < jlen; ++j) {
        fillLineOfText(lines[j]);
        bodyLineHeight = bodyFont.lineHeight;
      }
      each(bodyItem.after, fillLineOfText);
    }
    xLinePadding = 0;
    bodyLineHeight = bodyFont.lineHeight;
    each(this.afterBody, fillLineOfText);
    pt.y -= bodySpacing;
  }
  drawFooter(pt, ctx, options) {
    const footer = this.footer;
    const length = footer.length;
    let footerFont, i;
    if (length) {
      const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);
      pt.x = getAlignedX(this, options.footerAlign, options);
      pt.y += options.footerMarginTop;
      ctx.textAlign = rtlHelper.textAlign(options.footerAlign);
      ctx.textBaseline = "middle";
      footerFont = toFont(options.footerFont);
      ctx.fillStyle = options.footerColor;
      ctx.font = footerFont.string;
      for (i = 0; i < length; ++i) {
        ctx.fillText(footer[i], rtlHelper.x(pt.x), pt.y + footerFont.lineHeight / 2);
        pt.y += footerFont.lineHeight + options.footerSpacing;
      }
    }
  }
  drawBackground(pt, ctx, tooltipSize, options) {
    const { xAlign, yAlign } = this;
    const { x, y } = pt;
    const { width, height } = tooltipSize;
    const { topLeft, topRight, bottomLeft, bottomRight } = toTRBLCorners(options.cornerRadius);
    ctx.fillStyle = options.backgroundColor;
    ctx.strokeStyle = options.borderColor;
    ctx.lineWidth = options.borderWidth;
    ctx.beginPath();
    ctx.moveTo(x + topLeft, y);
    if (yAlign === "top") {
      this.drawCaret(pt, ctx, tooltipSize, options);
    }
    ctx.lineTo(x + width - topRight, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + topRight);
    if (yAlign === "center" && xAlign === "right") {
      this.drawCaret(pt, ctx, tooltipSize, options);
    }
    ctx.lineTo(x + width, y + height - bottomRight);
    ctx.quadraticCurveTo(x + width, y + height, x + width - bottomRight, y + height);
    if (yAlign === "bottom") {
      this.drawCaret(pt, ctx, tooltipSize, options);
    }
    ctx.lineTo(x + bottomLeft, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - bottomLeft);
    if (yAlign === "center" && xAlign === "left") {
      this.drawCaret(pt, ctx, tooltipSize, options);
    }
    ctx.lineTo(x, y + topLeft);
    ctx.quadraticCurveTo(x, y, x + topLeft, y);
    ctx.closePath();
    ctx.fill();
    if (options.borderWidth > 0) {
      ctx.stroke();
    }
  }
  _updateAnimationTarget(options) {
    const chart = this.chart;
    const anims = this.$animations;
    const animX = anims && anims.x;
    const animY = anims && anims.y;
    if (animX || animY) {
      const position = positioners[options.position].call(this, this._active, this._eventPosition);
      if (!position) {
        return;
      }
      const size = this._size = getTooltipSize(this, options);
      const positionAndSize = Object.assign({}, position, this._size);
      const alignment = determineAlignment(chart, options, positionAndSize);
      const point = getBackgroundPoint(options, positionAndSize, alignment, chart);
      if (animX._to !== point.x || animY._to !== point.y) {
        this.xAlign = alignment.xAlign;
        this.yAlign = alignment.yAlign;
        this.width = size.width;
        this.height = size.height;
        this.caretX = position.x;
        this.caretY = position.y;
        this._resolveAnimations().update(this, point);
      }
    }
  }
  _willRender() {
    return !!this.opacity;
  }
  draw(ctx) {
    const options = this.options.setContext(this.getContext());
    let opacity = this.opacity;
    if (!opacity) {
      return;
    }
    this._updateAnimationTarget(options);
    const tooltipSize = {
      width: this.width,
      height: this.height
    };
    const pt = {
      x: this.x,
      y: this.y
    };
    opacity = Math.abs(opacity) < 1e-3 ? 0 : opacity;
    const padding = toPadding(options.padding);
    const hasTooltipContent = this.title.length || this.beforeBody.length || this.body.length || this.afterBody.length || this.footer.length;
    if (options.enabled && hasTooltipContent) {
      ctx.save();
      ctx.globalAlpha = opacity;
      this.drawBackground(pt, ctx, tooltipSize, options);
      overrideTextDirection(ctx, options.textDirection);
      pt.y += padding.top;
      this.drawTitle(pt, ctx, options);
      this.drawBody(pt, ctx, options);
      this.drawFooter(pt, ctx, options);
      restoreTextDirection(ctx, options.textDirection);
      ctx.restore();
    }
  }
  getActiveElements() {
    return this._active || [];
  }
  setActiveElements(activeElements, eventPosition) {
    const lastActive = this._active;
    const active = activeElements.map(({ datasetIndex, index }) => {
      const meta = this.chart.getDatasetMeta(datasetIndex);
      if (!meta) {
        throw new Error("Cannot find a dataset at index " + datasetIndex);
      }
      return {
        datasetIndex,
        element: meta.data[index],
        index
      };
    });
    const changed = !_elementsEqual(lastActive, active);
    const positionChanged = this._positionChanged(active, eventPosition);
    if (changed || positionChanged) {
      this._active = active;
      this._eventPosition = eventPosition;
      this._ignoreReplayEvents = true;
      this.update(true);
    }
  }
  handleEvent(e, replay, inChartArea = true) {
    if (replay && this._ignoreReplayEvents) {
      return false;
    }
    this._ignoreReplayEvents = false;
    const options = this.options;
    const lastActive = this._active || [];
    const active = this._getActiveElements(e, lastActive, replay, inChartArea);
    const positionChanged = this._positionChanged(active, e);
    const changed = replay || !_elementsEqual(active, lastActive) || positionChanged;
    if (changed) {
      this._active = active;
      if (options.enabled || options.external) {
        this._eventPosition = {
          x: e.x,
          y: e.y
        };
        this.update(true, replay);
      }
    }
    return changed;
  }
  _getActiveElements(e, lastActive, replay, inChartArea) {
    const options = this.options;
    if (e.type === "mouseout") {
      return [];
    }
    if (!inChartArea) {
      return lastActive.filter((i) => this.chart.data.datasets[i.datasetIndex] && this.chart.getDatasetMeta(i.datasetIndex).controller.getParsed(i.index) !== void 0);
    }
    const active = this.chart.getElementsAtEventForMode(e, options.mode, options, replay);
    if (options.reverse) {
      active.reverse();
    }
    return active;
  }
  _positionChanged(active, e) {
    const { caretX, caretY, options } = this;
    const position = positioners[options.position].call(this, active, e);
    return position !== false && (caretX !== position.x || caretY !== position.y);
  }
};
__publicField(Tooltip, "positioners", positioners);
var plugin_tooltip = {
  id: "tooltip",
  _element: Tooltip,
  positioners,
  afterInit(chart, _args, options) {
    if (options) {
      chart.tooltip = new Tooltip({
        chart,
        options
      });
    }
  },
  beforeUpdate(chart, _args, options) {
    if (chart.tooltip) {
      chart.tooltip.initialize(options);
    }
  },
  reset(chart, _args, options) {
    if (chart.tooltip) {
      chart.tooltip.initialize(options);
    }
  },
  afterDraw(chart) {
    const tooltip = chart.tooltip;
    if (tooltip && tooltip._willRender()) {
      const args = {
        tooltip
      };
      if (chart.notifyPlugins("beforeTooltipDraw", {
        ...args,
        cancelable: true
      }) === false) {
        return;
      }
      tooltip.draw(chart.ctx);
      chart.notifyPlugins("afterTooltipDraw", args);
    }
  },
  afterEvent(chart, args) {
    if (chart.tooltip) {
      const useFinalPosition = args.replay;
      if (chart.tooltip.handleEvent(args.event, useFinalPosition, args.inChartArea)) {
        args.changed = true;
      }
    }
  },
  defaults: {
    enabled: true,
    external: null,
    position: "average",
    backgroundColor: "rgba(0,0,0,0.8)",
    titleColor: "#fff",
    titleFont: {
      weight: "bold"
    },
    titleSpacing: 2,
    titleMarginBottom: 6,
    titleAlign: "left",
    bodyColor: "#fff",
    bodySpacing: 2,
    bodyFont: {},
    bodyAlign: "left",
    footerColor: "#fff",
    footerSpacing: 2,
    footerMarginTop: 6,
    footerFont: {
      weight: "bold"
    },
    footerAlign: "left",
    padding: 6,
    caretPadding: 2,
    caretSize: 5,
    cornerRadius: 6,
    boxHeight: (ctx, opts) => opts.bodyFont.size,
    boxWidth: (ctx, opts) => opts.bodyFont.size,
    multiKeyBackground: "#fff",
    displayColors: true,
    boxPadding: 0,
    borderColor: "rgba(0,0,0,0)",
    borderWidth: 0,
    animation: {
      duration: 400,
      easing: "easeOutQuart"
    },
    animations: {
      numbers: {
        type: "number",
        properties: [
          "x",
          "y",
          "width",
          "height",
          "caretX",
          "caretY"
        ]
      },
      opacity: {
        easing: "linear",
        duration: 200
      }
    },
    callbacks: defaultCallbacks
  },
  defaultRoutes: {
    bodyFont: "font",
    footerFont: "font",
    titleFont: "font"
  },
  descriptors: {
    _scriptable: (name) => name !== "filter" && name !== "itemSort" && name !== "external",
    _indexable: false,
    callbacks: {
      _scriptable: false,
      _indexable: false
    },
    animation: {
      _fallback: false
    },
    animations: {
      _fallback: "animation"
    }
  },
  additionalOptionScopes: [
    "interaction"
  ]
};
var addIfString = (labels, raw, index, addedLabels) => {
  if (typeof raw === "string") {
    index = labels.push(raw) - 1;
    addedLabels.unshift({
      index,
      label: raw
    });
  } else if (isNaN(raw)) {
    index = null;
  }
  return index;
};
function findOrAddLabel(labels, raw, index, addedLabels) {
  const first = labels.indexOf(raw);
  if (first === -1) {
    return addIfString(labels, raw, index, addedLabels);
  }
  const last = labels.lastIndexOf(raw);
  return first !== last ? index : first;
}
var validIndex = (index, max) => index === null ? null : _limitValue(Math.round(index), 0, max);
function _getLabelForValue(value) {
  const labels = this.getLabels();
  if (value >= 0 && value < labels.length) {
    return labels[value];
  }
  return value;
}
var CategoryScale = class extends Scale {
  constructor(cfg) {
    super(cfg);
    this._startValue = void 0;
    this._valueRange = 0;
    this._addedLabels = [];
  }
  init(scaleOptions) {
    const added = this._addedLabels;
    if (added.length) {
      const labels = this.getLabels();
      for (const { index, label } of added) {
        if (labels[index] === label) {
          labels.splice(index, 1);
        }
      }
      this._addedLabels = [];
    }
    super.init(scaleOptions);
  }
  parse(raw, index) {
    if (isNullOrUndef(raw)) {
      return null;
    }
    const labels = this.getLabels();
    index = isFinite(index) && labels[index] === raw ? index : findOrAddLabel(labels, raw, valueOrDefault(index, raw), this._addedLabels);
    return validIndex(index, labels.length - 1);
  }
  determineDataLimits() {
    const { minDefined, maxDefined } = this.getUserBounds();
    let { min, max } = this.getMinMax(true);
    if (this.options.bounds === "ticks") {
      if (!minDefined) {
        min = 0;
      }
      if (!maxDefined) {
        max = this.getLabels().length - 1;
      }
    }
    this.min = min;
    this.max = max;
  }
  buildTicks() {
    const min = this.min;
    const max = this.max;
    const offset = this.options.offset;
    const ticks = [];
    let labels = this.getLabels();
    labels = min === 0 && max === labels.length - 1 ? labels : labels.slice(min, max + 1);
    this._valueRange = Math.max(labels.length - (offset ? 0 : 1), 1);
    this._startValue = this.min - (offset ? 0.5 : 0);
    for (let value = min; value <= max; value++) {
      ticks.push({
        value
      });
    }
    return ticks;
  }
  getLabelForValue(value) {
    return _getLabelForValue.call(this, value);
  }
  configure() {
    super.configure();
    if (!this.isHorizontal()) {
      this._reversePixels = !this._reversePixels;
    }
  }
  getPixelForValue(value) {
    if (typeof value !== "number") {
      value = this.parse(value);
    }
    return value === null ? NaN : this.getPixelForDecimal((value - this._startValue) / this._valueRange);
  }
  getPixelForTick(index) {
    const ticks = this.ticks;
    if (index < 0 || index > ticks.length - 1) {
      return null;
    }
    return this.getPixelForValue(ticks[index].value);
  }
  getValueForPixel(pixel) {
    return Math.round(this._startValue + this.getDecimalForPixel(pixel) * this._valueRange);
  }
  getBasePixel() {
    return this.bottom;
  }
};
__publicField(CategoryScale, "id", "category");
__publicField(CategoryScale, "defaults", {
  ticks: {
    callback: _getLabelForValue
  }
});
function generateTicks$1(generationOptions, dataRange) {
  const ticks = [];
  const MIN_SPACING = 1e-14;
  const { bounds, step, min, max, precision, count, maxTicks, maxDigits, includeBounds } = generationOptions;
  const unit = step || 1;
  const maxSpaces = maxTicks - 1;
  const { min: rmin, max: rmax } = dataRange;
  const minDefined = !isNullOrUndef(min);
  const maxDefined = !isNullOrUndef(max);
  const countDefined = !isNullOrUndef(count);
  const minSpacing = (rmax - rmin) / (maxDigits + 1);
  let spacing = niceNum((rmax - rmin) / maxSpaces / unit) * unit;
  let factor, niceMin, niceMax, numSpaces;
  if (spacing < MIN_SPACING && !minDefined && !maxDefined) {
    return [
      {
        value: rmin
      },
      {
        value: rmax
      }
    ];
  }
  numSpaces = Math.ceil(rmax / spacing) - Math.floor(rmin / spacing);
  if (numSpaces > maxSpaces) {
    spacing = niceNum(numSpaces * spacing / maxSpaces / unit) * unit;
  }
  if (!isNullOrUndef(precision)) {
    factor = Math.pow(10, precision);
    spacing = Math.ceil(spacing * factor) / factor;
  }
  if (bounds === "ticks") {
    niceMin = Math.floor(rmin / spacing) * spacing;
    niceMax = Math.ceil(rmax / spacing) * spacing;
  } else {
    niceMin = rmin;
    niceMax = rmax;
  }
  if (minDefined && maxDefined && step && almostWhole((max - min) / step, spacing / 1e3)) {
    numSpaces = Math.round(Math.min((max - min) / spacing, maxTicks));
    spacing = (max - min) / numSpaces;
    niceMin = min;
    niceMax = max;
  } else if (countDefined) {
    niceMin = minDefined ? min : niceMin;
    niceMax = maxDefined ? max : niceMax;
    numSpaces = count - 1;
    spacing = (niceMax - niceMin) / numSpaces;
  } else {
    numSpaces = (niceMax - niceMin) / spacing;
    if (almostEquals(numSpaces, Math.round(numSpaces), spacing / 1e3)) {
      numSpaces = Math.round(numSpaces);
    } else {
      numSpaces = Math.ceil(numSpaces);
    }
  }
  const decimalPlaces = Math.max(_decimalPlaces(spacing), _decimalPlaces(niceMin));
  factor = Math.pow(10, isNullOrUndef(precision) ? decimalPlaces : precision);
  niceMin = Math.round(niceMin * factor) / factor;
  niceMax = Math.round(niceMax * factor) / factor;
  let j = 0;
  if (minDefined) {
    if (includeBounds && niceMin !== min) {
      ticks.push({
        value: min
      });
      if (niceMin < min) {
        j++;
      }
      if (almostEquals(Math.round((niceMin + j * spacing) * factor) / factor, min, relativeLabelSize(min, minSpacing, generationOptions))) {
        j++;
      }
    } else if (niceMin < min) {
      j++;
    }
  }
  for (; j < numSpaces; ++j) {
    const tickValue = Math.round((niceMin + j * spacing) * factor) / factor;
    if (maxDefined && tickValue > max) {
      break;
    }
    ticks.push({
      value: tickValue
    });
  }
  if (maxDefined && includeBounds && niceMax !== max) {
    if (ticks.length && almostEquals(ticks[ticks.length - 1].value, max, relativeLabelSize(max, minSpacing, generationOptions))) {
      ticks[ticks.length - 1].value = max;
    } else {
      ticks.push({
        value: max
      });
    }
  } else if (!maxDefined || niceMax === max) {
    ticks.push({
      value: niceMax
    });
  }
  return ticks;
}
function relativeLabelSize(value, minSpacing, { horizontal, minRotation }) {
  const rad = toRadians(minRotation);
  const ratio = (horizontal ? Math.sin(rad) : Math.cos(rad)) || 1e-3;
  const length = 0.75 * minSpacing * ("" + value).length;
  return Math.min(minSpacing / ratio, length);
}
var LinearScaleBase = class extends Scale {
  constructor(cfg) {
    super(cfg);
    this.start = void 0;
    this.end = void 0;
    this._startValue = void 0;
    this._endValue = void 0;
    this._valueRange = 0;
  }
  parse(raw, index) {
    if (isNullOrUndef(raw)) {
      return null;
    }
    if ((typeof raw === "number" || raw instanceof Number) && !isFinite(+raw)) {
      return null;
    }
    return +raw;
  }
  handleTickRangeOptions() {
    const { beginAtZero } = this.options;
    const { minDefined, maxDefined } = this.getUserBounds();
    let { min, max } = this;
    const setMin = (v) => min = minDefined ? min : v;
    const setMax = (v) => max = maxDefined ? max : v;
    if (beginAtZero) {
      const minSign = sign(min);
      const maxSign = sign(max);
      if (minSign < 0 && maxSign < 0) {
        setMax(0);
      } else if (minSign > 0 && maxSign > 0) {
        setMin(0);
      }
    }
    if (min === max) {
      let offset = max === 0 ? 1 : Math.abs(max * 0.05);
      setMax(max + offset);
      if (!beginAtZero) {
        setMin(min - offset);
      }
    }
    this.min = min;
    this.max = max;
  }
  getTickLimit() {
    const tickOpts = this.options.ticks;
    let { maxTicksLimit, stepSize } = tickOpts;
    let maxTicks;
    if (stepSize) {
      maxTicks = Math.ceil(this.max / stepSize) - Math.floor(this.min / stepSize) + 1;
      if (maxTicks > 1e3) {
        console.warn(`scales.${this.id}.ticks.stepSize: ${stepSize} would result generating up to ${maxTicks} ticks. Limiting to 1000.`);
        maxTicks = 1e3;
      }
    } else {
      maxTicks = this.computeTickLimit();
      maxTicksLimit = maxTicksLimit || 11;
    }
    if (maxTicksLimit) {
      maxTicks = Math.min(maxTicksLimit, maxTicks);
    }
    return maxTicks;
  }
  computeTickLimit() {
    return Number.POSITIVE_INFINITY;
  }
  buildTicks() {
    const opts = this.options;
    const tickOpts = opts.ticks;
    let maxTicks = this.getTickLimit();
    maxTicks = Math.max(2, maxTicks);
    const numericGeneratorOptions = {
      maxTicks,
      bounds: opts.bounds,
      min: opts.min,
      max: opts.max,
      precision: tickOpts.precision,
      step: tickOpts.stepSize,
      count: tickOpts.count,
      maxDigits: this._maxDigits(),
      horizontal: this.isHorizontal(),
      minRotation: tickOpts.minRotation || 0,
      includeBounds: tickOpts.includeBounds !== false
    };
    const dataRange = this._range || this;
    const ticks = generateTicks$1(numericGeneratorOptions, dataRange);
    if (opts.bounds === "ticks") {
      _setMinAndMaxByKey(ticks, this, "value");
    }
    if (opts.reverse) {
      ticks.reverse();
      this.start = this.max;
      this.end = this.min;
    } else {
      this.start = this.min;
      this.end = this.max;
    }
    return ticks;
  }
  configure() {
    const ticks = this.ticks;
    let start = this.min;
    let end = this.max;
    super.configure();
    if (this.options.offset && ticks.length) {
      const offset = (end - start) / Math.max(ticks.length - 1, 1) / 2;
      start -= offset;
      end += offset;
    }
    this._startValue = start;
    this._endValue = end;
    this._valueRange = end - start;
  }
  getLabelForValue(value) {
    return formatNumber(value, this.chart.options.locale, this.options.ticks.format);
  }
};
var LinearScale = class extends LinearScaleBase {
  determineDataLimits() {
    const { min, max } = this.getMinMax(true);
    this.min = isNumberFinite(min) ? min : 0;
    this.max = isNumberFinite(max) ? max : 1;
    this.handleTickRangeOptions();
  }
  computeTickLimit() {
    const horizontal = this.isHorizontal();
    const length = horizontal ? this.width : this.height;
    const minRotation = toRadians(this.options.ticks.minRotation);
    const ratio = (horizontal ? Math.sin(minRotation) : Math.cos(minRotation)) || 1e-3;
    const tickFont = this._resolveTickFontOptions(0);
    return Math.ceil(length / Math.min(40, tickFont.lineHeight / ratio));
  }
  getPixelForValue(value) {
    return value === null ? NaN : this.getPixelForDecimal((value - this._startValue) / this._valueRange);
  }
  getValueForPixel(pixel) {
    return this._startValue + this.getDecimalForPixel(pixel) * this._valueRange;
  }
};
__publicField(LinearScale, "id", "linear");
__publicField(LinearScale, "defaults", {
  ticks: {
    callback: Ticks.formatters.numeric
  }
});
var log10Floor = (v) => Math.floor(log10(v));
var changeExponent = (v, m) => Math.pow(10, log10Floor(v) + m);
function isMajor(tickVal) {
  const remain = tickVal / Math.pow(10, log10Floor(tickVal));
  return remain === 1;
}
function steps(min, max, rangeExp) {
  const rangeStep = Math.pow(10, rangeExp);
  const start = Math.floor(min / rangeStep);
  const end = Math.ceil(max / rangeStep);
  return end - start;
}
function startExp(min, max) {
  const range = max - min;
  let rangeExp = log10Floor(range);
  while (steps(min, max, rangeExp) > 10) {
    rangeExp++;
  }
  while (steps(min, max, rangeExp) < 10) {
    rangeExp--;
  }
  return Math.min(rangeExp, log10Floor(min));
}
function generateTicks(generationOptions, { min, max }) {
  min = finiteOrDefault(generationOptions.min, min);
  const ticks = [];
  const minExp = log10Floor(min);
  let exp = startExp(min, max);
  let precision = exp < 0 ? Math.pow(10, Math.abs(exp)) : 1;
  const stepSize = Math.pow(10, exp);
  const base = minExp > exp ? Math.pow(10, minExp) : 0;
  const start = Math.round((min - base) * precision) / precision;
  const offset = Math.floor((min - base) / stepSize / 10) * stepSize * 10;
  let significand = Math.floor((start - offset) / Math.pow(10, exp));
  let value = finiteOrDefault(generationOptions.min, Math.round((base + offset + significand * Math.pow(10, exp)) * precision) / precision);
  while (value < max) {
    ticks.push({
      value,
      major: isMajor(value),
      significand
    });
    if (significand >= 10) {
      significand = significand < 15 ? 15 : 20;
    } else {
      significand++;
    }
    if (significand >= 20) {
      exp++;
      significand = 2;
      precision = exp >= 0 ? 1 : precision;
    }
    value = Math.round((base + offset + significand * Math.pow(10, exp)) * precision) / precision;
  }
  const lastTick = finiteOrDefault(generationOptions.max, value);
  ticks.push({
    value: lastTick,
    major: isMajor(lastTick),
    significand
  });
  return ticks;
}
var LogarithmicScale = class extends Scale {
  constructor(cfg) {
    super(cfg);
    this.start = void 0;
    this.end = void 0;
    this._startValue = void 0;
    this._valueRange = 0;
  }
  parse(raw, index) {
    const value = LinearScaleBase.prototype.parse.apply(this, [
      raw,
      index
    ]);
    if (value === 0) {
      this._zero = true;
      return void 0;
    }
    return isNumberFinite(value) && value > 0 ? value : null;
  }
  determineDataLimits() {
    const { min, max } = this.getMinMax(true);
    this.min = isNumberFinite(min) ? Math.max(0, min) : null;
    this.max = isNumberFinite(max) ? Math.max(0, max) : null;
    if (this.options.beginAtZero) {
      this._zero = true;
    }
    if (this._zero && this.min !== this._suggestedMin && !isNumberFinite(this._userMin)) {
      this.min = min === changeExponent(this.min, 0) ? changeExponent(this.min, -1) : changeExponent(this.min, 0);
    }
    this.handleTickRangeOptions();
  }
  handleTickRangeOptions() {
    const { minDefined, maxDefined } = this.getUserBounds();
    let min = this.min;
    let max = this.max;
    const setMin = (v) => min = minDefined ? min : v;
    const setMax = (v) => max = maxDefined ? max : v;
    if (min === max) {
      if (min <= 0) {
        setMin(1);
        setMax(10);
      } else {
        setMin(changeExponent(min, -1));
        setMax(changeExponent(max, 1));
      }
    }
    if (min <= 0) {
      setMin(changeExponent(max, -1));
    }
    if (max <= 0) {
      setMax(changeExponent(min, 1));
    }
    this.min = min;
    this.max = max;
  }
  buildTicks() {
    const opts = this.options;
    const generationOptions = {
      min: this._userMin,
      max: this._userMax
    };
    const ticks = generateTicks(generationOptions, this);
    if (opts.bounds === "ticks") {
      _setMinAndMaxByKey(ticks, this, "value");
    }
    if (opts.reverse) {
      ticks.reverse();
      this.start = this.max;
      this.end = this.min;
    } else {
      this.start = this.min;
      this.end = this.max;
    }
    return ticks;
  }
  getLabelForValue(value) {
    return value === void 0 ? "0" : formatNumber(value, this.chart.options.locale, this.options.ticks.format);
  }
  configure() {
    const start = this.min;
    super.configure();
    this._startValue = log10(start);
    this._valueRange = log10(this.max) - log10(start);
  }
  getPixelForValue(value) {
    if (value === void 0 || value === 0) {
      value = this.min;
    }
    if (value === null || isNaN(value)) {
      return NaN;
    }
    return this.getPixelForDecimal(value === this.min ? 0 : (log10(value) - this._startValue) / this._valueRange);
  }
  getValueForPixel(pixel) {
    const decimal = this.getDecimalForPixel(pixel);
    return Math.pow(10, this._startValue + decimal * this._valueRange);
  }
};
__publicField(LogarithmicScale, "id", "logarithmic");
__publicField(LogarithmicScale, "defaults", {
  ticks: {
    callback: Ticks.formatters.logarithmic,
    major: {
      enabled: true
    }
  }
});
function getTickBackdropHeight(opts) {
  const tickOpts = opts.ticks;
  if (tickOpts.display && opts.display) {
    const padding = toPadding(tickOpts.backdropPadding);
    return valueOrDefault(tickOpts.font && tickOpts.font.size, defaults.font.size) + padding.height;
  }
  return 0;
}
function measureLabelSize(ctx, font, label) {
  label = isArray(label) ? label : [
    label
  ];
  return {
    w: _longestText(ctx, font.string, label),
    h: label.length * font.lineHeight
  };
}
function determineLimits(angle, pos, size, min, max) {
  if (angle === min || angle === max) {
    return {
      start: pos - size / 2,
      end: pos + size / 2
    };
  } else if (angle < min || angle > max) {
    return {
      start: pos - size,
      end: pos
    };
  }
  return {
    start: pos,
    end: pos + size
  };
}
function fitWithPointLabels(scale) {
  const orig = {
    l: scale.left + scale._padding.left,
    r: scale.right - scale._padding.right,
    t: scale.top + scale._padding.top,
    b: scale.bottom - scale._padding.bottom
  };
  const limits = Object.assign({}, orig);
  const labelSizes = [];
  const padding = [];
  const valueCount = scale._pointLabels.length;
  const pointLabelOpts = scale.options.pointLabels;
  const additionalAngle = pointLabelOpts.centerPointLabels ? PI / valueCount : 0;
  for (let i = 0; i < valueCount; i++) {
    const opts = pointLabelOpts.setContext(scale.getPointLabelContext(i));
    padding[i] = opts.padding;
    const pointPosition = scale.getPointPosition(i, scale.drawingArea + padding[i], additionalAngle);
    const plFont = toFont(opts.font);
    const textSize = measureLabelSize(scale.ctx, plFont, scale._pointLabels[i]);
    labelSizes[i] = textSize;
    const angleRadians = _normalizeAngle(scale.getIndexAngle(i) + additionalAngle);
    const angle = Math.round(toDegrees(angleRadians));
    const hLimits = determineLimits(angle, pointPosition.x, textSize.w, 0, 180);
    const vLimits = determineLimits(angle, pointPosition.y, textSize.h, 90, 270);
    updateLimits(limits, orig, angleRadians, hLimits, vLimits);
  }
  scale.setCenterPoint(orig.l - limits.l, limits.r - orig.r, orig.t - limits.t, limits.b - orig.b);
  scale._pointLabelItems = buildPointLabelItems(scale, labelSizes, padding);
}
function updateLimits(limits, orig, angle, hLimits, vLimits) {
  const sin = Math.abs(Math.sin(angle));
  const cos = Math.abs(Math.cos(angle));
  let x = 0;
  let y = 0;
  if (hLimits.start < orig.l) {
    x = (orig.l - hLimits.start) / sin;
    limits.l = Math.min(limits.l, orig.l - x);
  } else if (hLimits.end > orig.r) {
    x = (hLimits.end - orig.r) / sin;
    limits.r = Math.max(limits.r, orig.r + x);
  }
  if (vLimits.start < orig.t) {
    y = (orig.t - vLimits.start) / cos;
    limits.t = Math.min(limits.t, orig.t - y);
  } else if (vLimits.end > orig.b) {
    y = (vLimits.end - orig.b) / cos;
    limits.b = Math.max(limits.b, orig.b + y);
  }
}
function createPointLabelItem(scale, index, itemOpts) {
  const outerDistance = scale.drawingArea;
  const { extra, additionalAngle, padding, size } = itemOpts;
  const pointLabelPosition = scale.getPointPosition(index, outerDistance + extra + padding, additionalAngle);
  const angle = Math.round(toDegrees(_normalizeAngle(pointLabelPosition.angle + HALF_PI)));
  const y = yForAngle(pointLabelPosition.y, size.h, angle);
  const textAlign = getTextAlignForAngle(angle);
  const left = leftForTextAlign(pointLabelPosition.x, size.w, textAlign);
  return {
    visible: true,
    x: pointLabelPosition.x,
    y,
    textAlign,
    left,
    top: y,
    right: left + size.w,
    bottom: y + size.h
  };
}
function isNotOverlapped(item, area) {
  if (!area) {
    return true;
  }
  const { left, top, right, bottom } = item;
  const apexesInArea = _isPointInArea({
    x: left,
    y: top
  }, area) || _isPointInArea({
    x: left,
    y: bottom
  }, area) || _isPointInArea({
    x: right,
    y: top
  }, area) || _isPointInArea({
    x: right,
    y: bottom
  }, area);
  return !apexesInArea;
}
function buildPointLabelItems(scale, labelSizes, padding) {
  const items = [];
  const valueCount = scale._pointLabels.length;
  const opts = scale.options;
  const { centerPointLabels, display } = opts.pointLabels;
  const itemOpts = {
    extra: getTickBackdropHeight(opts) / 2,
    additionalAngle: centerPointLabels ? PI / valueCount : 0
  };
  let area;
  for (let i = 0; i < valueCount; i++) {
    itemOpts.padding = padding[i];
    itemOpts.size = labelSizes[i];
    const item = createPointLabelItem(scale, i, itemOpts);
    items.push(item);
    if (display === "auto") {
      item.visible = isNotOverlapped(item, area);
      if (item.visible) {
        area = item;
      }
    }
  }
  return items;
}
function getTextAlignForAngle(angle) {
  if (angle === 0 || angle === 180) {
    return "center";
  } else if (angle < 180) {
    return "left";
  }
  return "right";
}
function leftForTextAlign(x, w, align) {
  if (align === "right") {
    x -= w;
  } else if (align === "center") {
    x -= w / 2;
  }
  return x;
}
function yForAngle(y, h, angle) {
  if (angle === 90 || angle === 270) {
    y -= h / 2;
  } else if (angle > 270 || angle < 90) {
    y -= h;
  }
  return y;
}
function drawPointLabelBox(ctx, opts, item) {
  const { left, top, right, bottom } = item;
  const { backdropColor } = opts;
  if (!isNullOrUndef(backdropColor)) {
    const borderRadius = toTRBLCorners(opts.borderRadius);
    const padding = toPadding(opts.backdropPadding);
    ctx.fillStyle = backdropColor;
    const backdropLeft = left - padding.left;
    const backdropTop = top - padding.top;
    const backdropWidth = right - left + padding.width;
    const backdropHeight = bottom - top + padding.height;
    if (Object.values(borderRadius).some((v) => v !== 0)) {
      ctx.beginPath();
      addRoundedRectPath(ctx, {
        x: backdropLeft,
        y: backdropTop,
        w: backdropWidth,
        h: backdropHeight,
        radius: borderRadius
      });
      ctx.fill();
    } else {
      ctx.fillRect(backdropLeft, backdropTop, backdropWidth, backdropHeight);
    }
  }
}
function drawPointLabels(scale, labelCount) {
  const { ctx, options: { pointLabels } } = scale;
  for (let i = labelCount - 1; i >= 0; i--) {
    const item = scale._pointLabelItems[i];
    if (!item.visible) {
      continue;
    }
    const optsAtIndex = pointLabels.setContext(scale.getPointLabelContext(i));
    drawPointLabelBox(ctx, optsAtIndex, item);
    const plFont = toFont(optsAtIndex.font);
    const { x, y, textAlign } = item;
    renderText(ctx, scale._pointLabels[i], x, y + plFont.lineHeight / 2, plFont, {
      color: optsAtIndex.color,
      textAlign,
      textBaseline: "middle"
    });
  }
}
function pathRadiusLine(scale, radius, circular, labelCount) {
  const { ctx } = scale;
  if (circular) {
    ctx.arc(scale.xCenter, scale.yCenter, radius, 0, TAU);
  } else {
    let pointPosition = scale.getPointPosition(0, radius);
    ctx.moveTo(pointPosition.x, pointPosition.y);
    for (let i = 1; i < labelCount; i++) {
      pointPosition = scale.getPointPosition(i, radius);
      ctx.lineTo(pointPosition.x, pointPosition.y);
    }
  }
}
function drawRadiusLine(scale, gridLineOpts, radius, labelCount, borderOpts) {
  const ctx = scale.ctx;
  const circular = gridLineOpts.circular;
  const { color: color2, lineWidth } = gridLineOpts;
  if (!circular && !labelCount || !color2 || !lineWidth || radius < 0) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = color2;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(borderOpts.dash || []);
  ctx.lineDashOffset = borderOpts.dashOffset;
  ctx.beginPath();
  pathRadiusLine(scale, radius, circular, labelCount);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}
function createPointLabelContext(parent, index, label) {
  return createContext(parent, {
    label,
    index,
    type: "pointLabel"
  });
}
var RadialLinearScale = class extends LinearScaleBase {
  constructor(cfg) {
    super(cfg);
    this.xCenter = void 0;
    this.yCenter = void 0;
    this.drawingArea = void 0;
    this._pointLabels = [];
    this._pointLabelItems = [];
  }
  setDimensions() {
    const padding = this._padding = toPadding(getTickBackdropHeight(this.options) / 2);
    const w = this.width = this.maxWidth - padding.width;
    const h = this.height = this.maxHeight - padding.height;
    this.xCenter = Math.floor(this.left + w / 2 + padding.left);
    this.yCenter = Math.floor(this.top + h / 2 + padding.top);
    this.drawingArea = Math.floor(Math.min(w, h) / 2);
  }
  determineDataLimits() {
    const { min, max } = this.getMinMax(false);
    this.min = isNumberFinite(min) && !isNaN(min) ? min : 0;
    this.max = isNumberFinite(max) && !isNaN(max) ? max : 0;
    this.handleTickRangeOptions();
  }
  computeTickLimit() {
    return Math.ceil(this.drawingArea / getTickBackdropHeight(this.options));
  }
  generateTickLabels(ticks) {
    LinearScaleBase.prototype.generateTickLabels.call(this, ticks);
    this._pointLabels = this.getLabels().map((value, index) => {
      const label = callback(this.options.pointLabels.callback, [
        value,
        index
      ], this);
      return label || label === 0 ? label : "";
    }).filter((v, i) => this.chart.getDataVisibility(i));
  }
  fit() {
    const opts = this.options;
    if (opts.display && opts.pointLabels.display) {
      fitWithPointLabels(this);
    } else {
      this.setCenterPoint(0, 0, 0, 0);
    }
  }
  setCenterPoint(leftMovement, rightMovement, topMovement, bottomMovement) {
    this.xCenter += Math.floor((leftMovement - rightMovement) / 2);
    this.yCenter += Math.floor((topMovement - bottomMovement) / 2);
    this.drawingArea -= Math.min(this.drawingArea / 2, Math.max(leftMovement, rightMovement, topMovement, bottomMovement));
  }
  getIndexAngle(index) {
    const angleMultiplier = TAU / (this._pointLabels.length || 1);
    const startAngle = this.options.startAngle || 0;
    return _normalizeAngle(index * angleMultiplier + toRadians(startAngle));
  }
  getDistanceFromCenterForValue(value) {
    if (isNullOrUndef(value)) {
      return NaN;
    }
    const scalingFactor = this.drawingArea / (this.max - this.min);
    if (this.options.reverse) {
      return (this.max - value) * scalingFactor;
    }
    return (value - this.min) * scalingFactor;
  }
  getValueForDistanceFromCenter(distance) {
    if (isNullOrUndef(distance)) {
      return NaN;
    }
    const scaledDistance = distance / (this.drawingArea / (this.max - this.min));
    return this.options.reverse ? this.max - scaledDistance : this.min + scaledDistance;
  }
  getPointLabelContext(index) {
    const pointLabels = this._pointLabels || [];
    if (index >= 0 && index < pointLabels.length) {
      const pointLabel = pointLabels[index];
      return createPointLabelContext(this.getContext(), index, pointLabel);
    }
  }
  getPointPosition(index, distanceFromCenter, additionalAngle = 0) {
    const angle = this.getIndexAngle(index) - HALF_PI + additionalAngle;
    return {
      x: Math.cos(angle) * distanceFromCenter + this.xCenter,
      y: Math.sin(angle) * distanceFromCenter + this.yCenter,
      angle
    };
  }
  getPointPositionForValue(index, value) {
    return this.getPointPosition(index, this.getDistanceFromCenterForValue(value));
  }
  getBasePosition(index) {
    return this.getPointPositionForValue(index || 0, this.getBaseValue());
  }
  getPointLabelPosition(index) {
    const { left, top, right, bottom } = this._pointLabelItems[index];
    return {
      left,
      top,
      right,
      bottom
    };
  }
  drawBackground() {
    const { backgroundColor, grid: { circular } } = this.options;
    if (backgroundColor) {
      const ctx = this.ctx;
      ctx.save();
      ctx.beginPath();
      pathRadiusLine(this, this.getDistanceFromCenterForValue(this._endValue), circular, this._pointLabels.length);
      ctx.closePath();
      ctx.fillStyle = backgroundColor;
      ctx.fill();
      ctx.restore();
    }
  }
  drawGrid() {
    const ctx = this.ctx;
    const opts = this.options;
    const { angleLines, grid, border } = opts;
    const labelCount = this._pointLabels.length;
    let i, offset, position;
    if (opts.pointLabels.display) {
      drawPointLabels(this, labelCount);
    }
    if (grid.display) {
      this.ticks.forEach((tick, index) => {
        if (index !== 0 || index === 0 && this.min < 0) {
          offset = this.getDistanceFromCenterForValue(tick.value);
          const context = this.getContext(index);
          const optsAtIndex = grid.setContext(context);
          const optsAtIndexBorder = border.setContext(context);
          drawRadiusLine(this, optsAtIndex, offset, labelCount, optsAtIndexBorder);
        }
      });
    }
    if (angleLines.display) {
      ctx.save();
      for (i = labelCount - 1; i >= 0; i--) {
        const optsAtIndex = angleLines.setContext(this.getPointLabelContext(i));
        const { color: color2, lineWidth } = optsAtIndex;
        if (!lineWidth || !color2) {
          continue;
        }
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color2;
        ctx.setLineDash(optsAtIndex.borderDash);
        ctx.lineDashOffset = optsAtIndex.borderDashOffset;
        offset = this.getDistanceFromCenterForValue(opts.reverse ? this.min : this.max);
        position = this.getPointPosition(i, offset);
        ctx.beginPath();
        ctx.moveTo(this.xCenter, this.yCenter);
        ctx.lineTo(position.x, position.y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  drawBorder() {
  }
  drawLabels() {
    const ctx = this.ctx;
    const opts = this.options;
    const tickOpts = opts.ticks;
    if (!tickOpts.display) {
      return;
    }
    const startAngle = this.getIndexAngle(0);
    let offset, width;
    ctx.save();
    ctx.translate(this.xCenter, this.yCenter);
    ctx.rotate(startAngle);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    this.ticks.forEach((tick, index) => {
      if (index === 0 && this.min >= 0 && !opts.reverse) {
        return;
      }
      const optsAtIndex = tickOpts.setContext(this.getContext(index));
      const tickFont = toFont(optsAtIndex.font);
      offset = this.getDistanceFromCenterForValue(this.ticks[index].value);
      if (optsAtIndex.showLabelBackdrop) {
        ctx.font = tickFont.string;
        width = ctx.measureText(tick.label).width;
        ctx.fillStyle = optsAtIndex.backdropColor;
        const padding = toPadding(optsAtIndex.backdropPadding);
        ctx.fillRect(-width / 2 - padding.left, -offset - tickFont.size / 2 - padding.top, width + padding.width, tickFont.size + padding.height);
      }
      renderText(ctx, tick.label, 0, -offset, tickFont, {
        color: optsAtIndex.color,
        strokeColor: optsAtIndex.textStrokeColor,
        strokeWidth: optsAtIndex.textStrokeWidth
      });
    });
    ctx.restore();
  }
  drawTitle() {
  }
};
__publicField(RadialLinearScale, "id", "radialLinear");
__publicField(RadialLinearScale, "defaults", {
  display: true,
  animate: true,
  position: "chartArea",
  angleLines: {
    display: true,
    lineWidth: 1,
    borderDash: [],
    borderDashOffset: 0
  },
  grid: {
    circular: false
  },
  startAngle: 0,
  ticks: {
    showLabelBackdrop: true,
    callback: Ticks.formatters.numeric
  },
  pointLabels: {
    backdropColor: void 0,
    backdropPadding: 2,
    display: true,
    font: {
      size: 10
    },
    callback(label) {
      return label;
    },
    padding: 5,
    centerPointLabels: false
  }
});
__publicField(RadialLinearScale, "defaultRoutes", {
  "angleLines.color": "borderColor",
  "pointLabels.color": "color",
  "ticks.color": "color"
});
__publicField(RadialLinearScale, "descriptors", {
  angleLines: {
    _fallback: "grid"
  }
});
var INTERVALS = {
  millisecond: {
    common: true,
    size: 1,
    steps: 1e3
  },
  second: {
    common: true,
    size: 1e3,
    steps: 60
  },
  minute: {
    common: true,
    size: 6e4,
    steps: 60
  },
  hour: {
    common: true,
    size: 36e5,
    steps: 24
  },
  day: {
    common: true,
    size: 864e5,
    steps: 30
  },
  week: {
    common: false,
    size: 6048e5,
    steps: 4
  },
  month: {
    common: true,
    size: 2628e6,
    steps: 12
  },
  quarter: {
    common: false,
    size: 7884e6,
    steps: 4
  },
  year: {
    common: true,
    size: 3154e7
  }
};
var UNITS = /* @__PURE__ */ Object.keys(INTERVALS);
function sorter(a, b) {
  return a - b;
}
function parse(scale, input) {
  if (isNullOrUndef(input)) {
    return null;
  }
  const adapter = scale._adapter;
  const { parser, round: round2, isoWeekday } = scale._parseOpts;
  let value = input;
  if (typeof parser === "function") {
    value = parser(value);
  }
  if (!isNumberFinite(value)) {
    value = typeof parser === "string" ? adapter.parse(value, parser) : adapter.parse(value);
  }
  if (value === null) {
    return null;
  }
  if (round2) {
    value = round2 === "week" && (isNumber(isoWeekday) || isoWeekday === true) ? adapter.startOf(value, "isoWeek", isoWeekday) : adapter.startOf(value, round2);
  }
  return +value;
}
function determineUnitForAutoTicks(minUnit, min, max, capacity) {
  const ilen = UNITS.length;
  for (let i = UNITS.indexOf(minUnit); i < ilen - 1; ++i) {
    const interval = INTERVALS[UNITS[i]];
    const factor = interval.steps ? interval.steps : Number.MAX_SAFE_INTEGER;
    if (interval.common && Math.ceil((max - min) / (factor * interval.size)) <= capacity) {
      return UNITS[i];
    }
  }
  return UNITS[ilen - 1];
}
function determineUnitForFormatting(scale, numTicks, minUnit, min, max) {
  for (let i = UNITS.length - 1; i >= UNITS.indexOf(minUnit); i--) {
    const unit = UNITS[i];
    if (INTERVALS[unit].common && scale._adapter.diff(max, min, unit) >= numTicks - 1) {
      return unit;
    }
  }
  return UNITS[minUnit ? UNITS.indexOf(minUnit) : 0];
}
function determineMajorUnit(unit) {
  for (let i = UNITS.indexOf(unit) + 1, ilen = UNITS.length; i < ilen; ++i) {
    if (INTERVALS[UNITS[i]].common) {
      return UNITS[i];
    }
  }
}
function addTick(ticks, time, timestamps) {
  if (!timestamps) {
    ticks[time] = true;
  } else if (timestamps.length) {
    const { lo, hi } = _lookup(timestamps, time);
    const timestamp = timestamps[lo] >= time ? timestamps[lo] : timestamps[hi];
    ticks[timestamp] = true;
  }
}
function setMajorTicks(scale, ticks, map2, majorUnit) {
  const adapter = scale._adapter;
  const first = +adapter.startOf(ticks[0].value, majorUnit);
  const last = ticks[ticks.length - 1].value;
  let major, index;
  for (major = first; major <= last; major = +adapter.add(major, 1, majorUnit)) {
    index = map2[major];
    if (index >= 0) {
      ticks[index].major = true;
    }
  }
  return ticks;
}
function ticksFromTimestamps(scale, values, majorUnit) {
  const ticks = [];
  const map2 = {};
  const ilen = values.length;
  let i, value;
  for (i = 0; i < ilen; ++i) {
    value = values[i];
    map2[value] = i;
    ticks.push({
      value,
      major: false
    });
  }
  return ilen === 0 || !majorUnit ? ticks : setMajorTicks(scale, ticks, map2, majorUnit);
}
var TimeScale = class extends Scale {
  constructor(props) {
    super(props);
    this._cache = {
      data: [],
      labels: [],
      all: []
    };
    this._unit = "day";
    this._majorUnit = void 0;
    this._offsets = {};
    this._normalized = false;
    this._parseOpts = void 0;
  }
  init(scaleOpts, opts = {}) {
    const time = scaleOpts.time || (scaleOpts.time = {});
    const adapter = this._adapter = new adapters._date(scaleOpts.adapters.date);
    adapter.init(opts);
    mergeIf(time.displayFormats, adapter.formats());
    this._parseOpts = {
      parser: time.parser,
      round: time.round,
      isoWeekday: time.isoWeekday
    };
    super.init(scaleOpts);
    this._normalized = opts.normalized;
  }
  parse(raw, index) {
    if (raw === void 0) {
      return null;
    }
    return parse(this, raw);
  }
  beforeLayout() {
    super.beforeLayout();
    this._cache = {
      data: [],
      labels: [],
      all: []
    };
  }
  determineDataLimits() {
    const options = this.options;
    const adapter = this._adapter;
    const unit = options.time.unit || "day";
    let { min, max, minDefined, maxDefined } = this.getUserBounds();
    function _applyBounds(bounds) {
      if (!minDefined && !isNaN(bounds.min)) {
        min = Math.min(min, bounds.min);
      }
      if (!maxDefined && !isNaN(bounds.max)) {
        max = Math.max(max, bounds.max);
      }
    }
    if (!minDefined || !maxDefined) {
      _applyBounds(this._getLabelBounds());
      if (options.bounds !== "ticks" || options.ticks.source !== "labels") {
        _applyBounds(this.getMinMax(false));
      }
    }
    min = isNumberFinite(min) && !isNaN(min) ? min : +adapter.startOf(Date.now(), unit);
    max = isNumberFinite(max) && !isNaN(max) ? max : +adapter.endOf(Date.now(), unit) + 1;
    this.min = Math.min(min, max - 1);
    this.max = Math.max(min + 1, max);
  }
  _getLabelBounds() {
    const arr = this.getLabelTimestamps();
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    if (arr.length) {
      min = arr[0];
      max = arr[arr.length - 1];
    }
    return {
      min,
      max
    };
  }
  buildTicks() {
    const options = this.options;
    const timeOpts = options.time;
    const tickOpts = options.ticks;
    const timestamps = tickOpts.source === "labels" ? this.getLabelTimestamps() : this._generate();
    if (options.bounds === "ticks" && timestamps.length) {
      this.min = this._userMin || timestamps[0];
      this.max = this._userMax || timestamps[timestamps.length - 1];
    }
    const min = this.min;
    const max = this.max;
    const ticks = _filterBetween(timestamps, min, max);
    this._unit = timeOpts.unit || (tickOpts.autoSkip ? determineUnitForAutoTicks(timeOpts.minUnit, this.min, this.max, this._getLabelCapacity(min)) : determineUnitForFormatting(this, ticks.length, timeOpts.minUnit, this.min, this.max));
    this._majorUnit = !tickOpts.major.enabled || this._unit === "year" ? void 0 : determineMajorUnit(this._unit);
    this.initOffsets(timestamps);
    if (options.reverse) {
      ticks.reverse();
    }
    return ticksFromTimestamps(this, ticks, this._majorUnit);
  }
  afterAutoSkip() {
    if (this.options.offsetAfterAutoskip) {
      this.initOffsets(this.ticks.map((tick) => +tick.value));
    }
  }
  initOffsets(timestamps = []) {
    let start = 0;
    let end = 0;
    let first, last;
    if (this.options.offset && timestamps.length) {
      first = this.getDecimalForValue(timestamps[0]);
      if (timestamps.length === 1) {
        start = 1 - first;
      } else {
        start = (this.getDecimalForValue(timestamps[1]) - first) / 2;
      }
      last = this.getDecimalForValue(timestamps[timestamps.length - 1]);
      if (timestamps.length === 1) {
        end = last;
      } else {
        end = (last - this.getDecimalForValue(timestamps[timestamps.length - 2])) / 2;
      }
    }
    const limit = timestamps.length < 3 ? 0.5 : 0.25;
    start = _limitValue(start, 0, limit);
    end = _limitValue(end, 0, limit);
    this._offsets = {
      start,
      end,
      factor: 1 / (start + 1 + end)
    };
  }
  _generate() {
    const adapter = this._adapter;
    const min = this.min;
    const max = this.max;
    const options = this.options;
    const timeOpts = options.time;
    const minor = timeOpts.unit || determineUnitForAutoTicks(timeOpts.minUnit, min, max, this._getLabelCapacity(min));
    const stepSize = valueOrDefault(options.ticks.stepSize, 1);
    const weekday = minor === "week" ? timeOpts.isoWeekday : false;
    const hasWeekday = isNumber(weekday) || weekday === true;
    const ticks = {};
    let first = min;
    let time, count;
    if (hasWeekday) {
      first = +adapter.startOf(first, "isoWeek", weekday);
    }
    first = +adapter.startOf(first, hasWeekday ? "day" : minor);
    if (adapter.diff(max, min, minor) > 1e5 * stepSize) {
      throw new Error(min + " and " + max + " are too far apart with stepSize of " + stepSize + " " + minor);
    }
    const timestamps = options.ticks.source === "data" && this.getDataTimestamps();
    for (time = first, count = 0; time < max; time = +adapter.add(time, stepSize, minor), count++) {
      addTick(ticks, time, timestamps);
    }
    if (time === max || options.bounds === "ticks" || count === 1) {
      addTick(ticks, time, timestamps);
    }
    return Object.keys(ticks).sort(sorter).map((x) => +x);
  }
  getLabelForValue(value) {
    const adapter = this._adapter;
    const timeOpts = this.options.time;
    if (timeOpts.tooltipFormat) {
      return adapter.format(value, timeOpts.tooltipFormat);
    }
    return adapter.format(value, timeOpts.displayFormats.datetime);
  }
  format(value, format) {
    const options = this.options;
    const formats = options.time.displayFormats;
    const unit = this._unit;
    const fmt = format || formats[unit];
    return this._adapter.format(value, fmt);
  }
  _tickFormatFunction(time, index, ticks, format) {
    const options = this.options;
    const formatter = options.ticks.callback;
    if (formatter) {
      return callback(formatter, [
        time,
        index,
        ticks
      ], this);
    }
    const formats = options.time.displayFormats;
    const unit = this._unit;
    const majorUnit = this._majorUnit;
    const minorFormat = unit && formats[unit];
    const majorFormat = majorUnit && formats[majorUnit];
    const tick = ticks[index];
    const major = majorUnit && majorFormat && tick && tick.major;
    return this._adapter.format(time, format || (major ? majorFormat : minorFormat));
  }
  generateTickLabels(ticks) {
    let i, ilen, tick;
    for (i = 0, ilen = ticks.length; i < ilen; ++i) {
      tick = ticks[i];
      tick.label = this._tickFormatFunction(tick.value, i, ticks);
    }
  }
  getDecimalForValue(value) {
    return value === null ? NaN : (value - this.min) / (this.max - this.min);
  }
  getPixelForValue(value) {
    const offsets = this._offsets;
    const pos = this.getDecimalForValue(value);
    return this.getPixelForDecimal((offsets.start + pos) * offsets.factor);
  }
  getValueForPixel(pixel) {
    const offsets = this._offsets;
    const pos = this.getDecimalForPixel(pixel) / offsets.factor - offsets.end;
    return this.min + pos * (this.max - this.min);
  }
  _getLabelSize(label) {
    const ticksOpts = this.options.ticks;
    const tickLabelWidth = this.ctx.measureText(label).width;
    const angle = toRadians(this.isHorizontal() ? ticksOpts.maxRotation : ticksOpts.minRotation);
    const cosRotation = Math.cos(angle);
    const sinRotation = Math.sin(angle);
    const tickFontSize = this._resolveTickFontOptions(0).size;
    return {
      w: tickLabelWidth * cosRotation + tickFontSize * sinRotation,
      h: tickLabelWidth * sinRotation + tickFontSize * cosRotation
    };
  }
  _getLabelCapacity(exampleTime) {
    const timeOpts = this.options.time;
    const displayFormats = timeOpts.displayFormats;
    const format = displayFormats[timeOpts.unit] || displayFormats.millisecond;
    const exampleLabel = this._tickFormatFunction(exampleTime, 0, ticksFromTimestamps(this, [
      exampleTime
    ], this._majorUnit), format);
    const size = this._getLabelSize(exampleLabel);
    const capacity = Math.floor(this.isHorizontal() ? this.width / size.w : this.height / size.h) - 1;
    return capacity > 0 ? capacity : 1;
  }
  getDataTimestamps() {
    let timestamps = this._cache.data || [];
    let i, ilen;
    if (timestamps.length) {
      return timestamps;
    }
    const metas = this.getMatchingVisibleMetas();
    if (this._normalized && metas.length) {
      return this._cache.data = metas[0].controller.getAllParsedValues(this);
    }
    for (i = 0, ilen = metas.length; i < ilen; ++i) {
      timestamps = timestamps.concat(metas[i].controller.getAllParsedValues(this));
    }
    return this._cache.data = this.normalize(timestamps);
  }
  getLabelTimestamps() {
    const timestamps = this._cache.labels || [];
    let i, ilen;
    if (timestamps.length) {
      return timestamps;
    }
    const labels = this.getLabels();
    for (i = 0, ilen = labels.length; i < ilen; ++i) {
      timestamps.push(parse(this, labels[i]));
    }
    return this._cache.labels = this._normalized ? timestamps : this.normalize(timestamps);
  }
  normalize(values) {
    return _arrayUnique(values.sort(sorter));
  }
};
__publicField(TimeScale, "id", "time");
__publicField(TimeScale, "defaults", {
  bounds: "data",
  adapters: {},
  time: {
    parser: false,
    unit: false,
    round: false,
    isoWeekday: false,
    minUnit: "millisecond",
    displayFormats: {}
  },
  ticks: {
    source: "auto",
    callback: false,
    major: {
      enabled: false
    }
  }
});
function interpolate2(table, val, reverse) {
  let lo = 0;
  let hi = table.length - 1;
  let prevSource, nextSource, prevTarget, nextTarget;
  if (reverse) {
    if (val >= table[lo].pos && val <= table[hi].pos) {
      ({ lo, hi } = _lookupByKey(table, "pos", val));
    }
    ({ pos: prevSource, time: prevTarget } = table[lo]);
    ({ pos: nextSource, time: nextTarget } = table[hi]);
  } else {
    if (val >= table[lo].time && val <= table[hi].time) {
      ({ lo, hi } = _lookupByKey(table, "time", val));
    }
    ({ time: prevSource, pos: prevTarget } = table[lo]);
    ({ time: nextSource, pos: nextTarget } = table[hi]);
  }
  const span = nextSource - prevSource;
  return span ? prevTarget + (nextTarget - prevTarget) * (val - prevSource) / span : prevTarget;
}
var TimeSeriesScale = class extends TimeScale {
  constructor(props) {
    super(props);
    this._table = [];
    this._minPos = void 0;
    this._tableRange = void 0;
  }
  initOffsets() {
    const timestamps = this._getTimestampsForTable();
    const table = this._table = this.buildLookupTable(timestamps);
    this._minPos = interpolate2(table, this.min);
    this._tableRange = interpolate2(table, this.max) - this._minPos;
    super.initOffsets(timestamps);
  }
  buildLookupTable(timestamps) {
    const { min, max } = this;
    const items = [];
    const table = [];
    let i, ilen, prev, curr, next;
    for (i = 0, ilen = timestamps.length; i < ilen; ++i) {
      curr = timestamps[i];
      if (curr >= min && curr <= max) {
        items.push(curr);
      }
    }
    if (items.length < 2) {
      return [
        {
          time: min,
          pos: 0
        },
        {
          time: max,
          pos: 1
        }
      ];
    }
    for (i = 0, ilen = items.length; i < ilen; ++i) {
      next = items[i + 1];
      prev = items[i - 1];
      curr = items[i];
      if (Math.round((next + prev) / 2) !== curr) {
        table.push({
          time: curr,
          pos: i / (ilen - 1)
        });
      }
    }
    return table;
  }
  _generate() {
    const min = this.min;
    const max = this.max;
    let timestamps = super.getDataTimestamps();
    if (!timestamps.includes(min) || !timestamps.length) {
      timestamps.splice(0, 0, min);
    }
    if (!timestamps.includes(max) || timestamps.length === 1) {
      timestamps.push(max);
    }
    return timestamps.sort((a, b) => a - b);
  }
  _getTimestampsForTable() {
    let timestamps = this._cache.all || [];
    if (timestamps.length) {
      return timestamps;
    }
    const data = this.getDataTimestamps();
    const label = this.getLabelTimestamps();
    if (data.length && label.length) {
      timestamps = this.normalize(data.concat(label));
    } else {
      timestamps = data.length ? data : label;
    }
    timestamps = this._cache.all = timestamps;
    return timestamps;
  }
  getDecimalForValue(value) {
    return (interpolate2(this._table, value) - this._minPos) / this._tableRange;
  }
  getValueForPixel(pixel) {
    const offsets = this._offsets;
    const decimal = this.getDecimalForPixel(pixel) / offsets.factor - offsets.end;
    return interpolate2(this._table, decimal * this._tableRange + this._minPos, true);
  }
};
__publicField(TimeSeriesScale, "id", "timeseries");
__publicField(TimeSeriesScale, "defaults", TimeScale.defaults);

// src/util/units.ts
var METERS_PER_MILE = 1609.344;
var METERS_PER_KM = 1e3;
function metersToUnit(meters, unit) {
  return unit === "mi" ? meters / METERS_PER_MILE : meters / METERS_PER_KM;
}
function unitToMeters(value, unit) {
  return unit === "mi" ? value * METERS_PER_MILE : value * METERS_PER_KM;
}

// src/util/pace.ts
function paceSecondsPerUnit(distanceMeters, durationSeconds, unit) {
  const dist = metersToUnit(distanceMeters, unit);
  return dist > 0 ? durationSeconds / dist : 0;
}
function speedUnitsPerHour(distanceMeters, durationSeconds, unit) {
  const dist = metersToUnit(distanceMeters, unit);
  const hours = durationSeconds / 3600;
  return hours > 0 ? dist / hours : 0;
}
function movingAverage(values, window2) {
  if (window2 <= 1)
    return values;
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window2 + 1), i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

// src/util/dates.ts
function localDateStr(isoWithOffset) {
  return isoWithOffset.slice(0, 10);
}
function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function weekStart(dateStr, weekStartsOn) {
  const d = new Date(dateStr + "T12:00:00Z");
  const dow = d.getUTCDay();
  const target = weekStartsOn === "monday" ? 1 : 0;
  let diff = dow - target;
  if (diff < 0)
    diff += 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}
function monthStart(dateStr) {
  return dateStr.slice(0, 7) + "-01";
}
function addMonths(monthStartStr, n) {
  const d = new Date(monthStartStr + "T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

// src/data/aggregations.ts
function byWeek(runs, opts) {
  var _a, _b, _c, _d, _e;
  const toDate = (_a = opts.to) != null ? _a : today();
  const lastN = (_b = opts.last) != null ? _b : 12;
  const fromDate = (_c = opts.from) != null ? _c : addDays(weekStart(toDate, opts.weekStartsOn), -(lastN - 1) * 7);
  const firstBucket = weekStart(fromDate, opts.weekStartsOn);
  const lastBucket = weekStart(toDate, opts.weekStartsOn);
  const runsByBucket = /* @__PURE__ */ new Map();
  for (const run of runs) {
    const date = localDateStr(run.startTime);
    if (date < fromDate || date > toDate)
      continue;
    const bucket = weekStart(date, opts.weekStartsOn);
    if (bucket < firstBucket || bucket > lastBucket)
      continue;
    const arr = (_d = runsByBucket.get(bucket)) != null ? _d : [];
    arr.push(run);
    runsByBucket.set(bucket, arr);
  }
  const result = [];
  let current = firstBucket;
  while (current <= lastBucket) {
    const week = (_e = runsByBucket.get(current)) != null ? _e : [];
    result.push({
      periodStart: current,
      distance: week.reduce((s, r) => s + metersToUnit(r.distanceMeters, opts.unit), 0),
      runCount: week.length
    });
    current = addDays(current, 7);
  }
  return result;
}
function byMonth(runs, opts) {
  var _a, _b, _c, _d;
  const toDate = (_a = opts.to) != null ? _a : today();
  const lastN = (_b = opts.last) != null ? _b : 12;
  const currentMonth = monthStart(toDate);
  const fromMonth = opts.from ? monthStart(opts.from) : addMonths(currentMonth, -(lastN - 1));
  const runsByMonth = /* @__PURE__ */ new Map();
  for (const run of runs) {
    const month = monthStart(localDateStr(run.startTime));
    if (month < fromMonth || month > currentMonth)
      continue;
    const arr = (_c = runsByMonth.get(month)) != null ? _c : [];
    arr.push(run);
    runsByMonth.set(month, arr);
  }
  const result = [];
  let current = fromMonth;
  while (current <= currentMonth) {
    const month = (_d = runsByMonth.get(current)) != null ? _d : [];
    result.push({
      periodStart: current,
      distance: month.reduce((s, r) => s + metersToUnit(r.distanceMeters, opts.unit), 0),
      runCount: month.length
    });
    current = addMonths(current, 1);
  }
  return result;
}
function paceSeries(runs, opts) {
  var _a, _b, _c, _d, _e, _f;
  const toDate = (_a = opts.to) != null ? _a : today();
  const lastN = (_b = opts.last) != null ? _b : 90;
  const fromDate = (_c = opts.from) != null ? _c : addDays(toDate, -(lastN - 1));
  const metric = (_d = opts.metric) != null ? _d : "pace";
  const smoothingWindow = (_e = opts.smoothing) != null ? _e : 0;
  const minDist = (_f = opts.minDistanceMeters) != null ? _f : 0;
  const qualifying = runs.filter((r) => {
    const date = localDateStr(r.startTime);
    return date >= fromDate && date <= toDate && r.distanceMeters >= minDist;
  });
  const rawValues = qualifying.map(
    (r) => metric === "pace" ? paceSecondsPerUnit(r.distanceMeters, r.durationSeconds, opts.unit) : speedUnitsPerHour(r.distanceMeters, r.durationSeconds, opts.unit)
  );
  const smoothed = smoothingWindow > 1 ? movingAverage(rawValues, smoothingWindow) : rawValues;
  return qualifying.map((r, i) => ({
    date: localDateStr(r.startTime),
    paceSecondsPerUnit: smoothed[i]
  }));
}
function heatmapDays(runs, opts) {
  var _a, _b, _c, _d;
  const metric = (_a = opts.metric) != null ? _a : "distance";
  const levels = (_b = opts.levels) != null ? _b : 5;
  let fromDate;
  let toDate;
  if (opts.year !== void 0) {
    fromDate = `${opts.year}-01-01`;
    toDate = `${opts.year}-12-31`;
  } else {
    toDate = today();
    fromDate = addDays(toDate, -((_c = opts.last) != null ? _c : 365) + 1);
  }
  const byDate = /* @__PURE__ */ new Map();
  for (const run of runs) {
    const date = localDateStr(run.startTime);
    if (date < fromDate || date > toDate)
      continue;
    const arr = (_d = byDate.get(date)) != null ? _d : [];
    arr.push(run);
    byDate.set(date, arr);
  }
  if (byDate.size === 0)
    return [];
  const days = Array.from(byDate.entries()).map(([date, dayRuns]) => {
    const distance = dayRuns.reduce((s, r) => s + metersToUnit(r.distanceMeters, opts.unit), 0);
    const rawValue = metric === "distance" ? distance : metric === "duration" ? dayRuns.reduce((s, r) => s + r.durationSeconds, 0) : dayRuns.length;
    return { date, distance, runCount: dayRuns.length, rawValue };
  });
  const maxVal = Math.max(...days.map((d) => d.rawValue));
  return days.sort((a, b) => a.date.localeCompare(b.date)).map(({ date, distance, runCount, rawValue }) => ({
    date,
    distance,
    runCount,
    intensity: maxVal > 0 ? Math.ceil(rawValue / maxVal * levels) / levels : 0
  }));
}
function streaks(runs, opts) {
  var _a;
  const minDist = (_a = opts.minDistanceMeters) != null ? _a : 0;
  const qualifying = runs.filter((r) => r.distanceMeters >= minDist);
  if (qualifying.length === 0) {
    return { currentStreak: 0, longestStreak: 0, unit: opts.unit, lastRunDate: null };
  }
  const lastRunDate = localDateStr(qualifying[qualifying.length - 1].startTime);
  const periodSet = /* @__PURE__ */ new Set();
  for (const r of qualifying) {
    const date = localDateStr(r.startTime);
    periodSet.add(opts.unit === "week" ? weekStart(date, opts.weekStartsOn) : date);
  }
  const periods = Array.from(periodSet).sort();
  let longestStreak = 1;
  let runningStreak = 1;
  for (let i = 1; i < periods.length; i++) {
    const expected = opts.unit === "week" ? addDays(periods[i - 1], 7) : addDays(periods[i - 1], 1);
    if (periods[i] === expected) {
      runningStreak++;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 1;
    }
  }
  const todayPeriod = opts.unit === "week" ? weekStart(today(), opts.weekStartsOn) : today();
  const prevPeriod = opts.unit === "week" ? addDays(todayPeriod, -7) : addDays(todayPeriod, -1);
  let currentStreak = 0;
  if (periodSet.has(todayPeriod) || periodSet.has(prevPeriod)) {
    let check = periodSet.has(todayPeriod) ? todayPeriod : prevPeriod;
    const step = opts.unit === "week" ? -7 : -1;
    while (periodSet.has(check)) {
      currentStreak++;
      check = addDays(check, step);
    }
  }
  return { currentStreak, longestStreak, unit: opts.unit, lastRunDate };
}

// src/render/charts/barChart.ts
Chart.register(BarController, CategoryScale, LinearScale, BarElement, plugin_tooltip);
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtWeek(d) {
  const dt = new Date(d + "T12:00:00Z");
  return `${MONTHS[dt.getUTCMonth()]} ${dt.getUTCDate()}`;
}
function fmtMonth(d) {
  return MONTHS[new Date(d + "T12:00:00Z").getUTCMonth()];
}
function renderBarChart(el, config, runs, settings, palette) {
  var _a, _b;
  const isWeekly = config["type"] === "weekly-mileage";
  const unit = (_a = config["unit"]) != null ? _a : settings.displayUnit;
  const goal = (_b = config["goal"]) != null ? _b : settings.defaultGoal;
  const showRunCount = config["showruncount"];
  const buckets = isWeekly ? byWeek(runs, {
    unit,
    weekStartsOn: settings.weekStartsOn,
    last: config["last"],
    from: config["from"],
    to: config["to"]
  }) : byMonth(runs, {
    unit,
    last: config["last"],
    from: config["from"],
    to: config["to"]
  });
  const labels = buckets.map((b) => isWeekly ? fmtWeek(b.periodStart) : fmtMonth(b.periodStart));
  const goalLinePlugin = {
    id: "goalLine",
    afterDraw(chart) {
      if (goal == null)
        return;
      const { ctx, scales, chartArea } = chart;
      const yVal = scales["y"].getPixelForValue(goal);
      ctx.save();
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(chartArea.left, yVal);
      ctx.lineTo(chartArea.right, yVal);
      ctx.stroke();
      ctx.restore();
    }
  };
  const container = el.createDiv({ cls: "running-log-chart-container" });
  const canvas = container.createEl("canvas");
  const chartConfig = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data: buckets.map((b) => b.distance),
          backgroundColor: palette.accent + "99",
          borderColor: palette.accent,
          borderWidth: 1,
          borderRadius: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const b = buckets[ctx.dataIndex];
              const dist = ctx.raw.toFixed(1);
              const runs2 = `${b.runCount} run${b.runCount !== 1 ? "s" : ""}`;
              const goalHit = goal != null && b.distance >= goal ? " \u2713" : "";
              return showRunCount ? `${dist} ${unit} \xB7 ${runs2}${goalHit}` : `${dist} ${unit}${goalHit}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: palette.border },
          ticks: { color: palette.textMuted, maxRotation: 45 }
        },
        y: {
          beginAtZero: true,
          grid: { color: palette.border },
          ticks: { color: palette.textMuted },
          title: { display: true, text: unit, color: palette.textMuted }
        }
      }
    },
    plugins: [goalLinePlugin]
  };
  return new Chart(canvas, chartConfig);
}

// src/render/charts/lineChart.ts
Chart.register(LineController, CategoryScale, LinearScale, LineElement, PointElement, plugin_tooltip);
function fmtPace(seconds) {
  const m = Math.floor(seconds / 60);
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${m}:${s}`;
}
function linearRegression(ys) {
  const n = ys.length;
  const xs = ys.map((_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumXX = xs.reduce((s, x) => s + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0)
    return { slope: 0, intercept: sumY / n };
  return {
    slope: (n * sumXY - sumX * sumY) / denom,
    intercept: (sumY - (n * sumXY - sumX * sumY) / denom * sumX) / n
  };
}
function renderLineChart(el, config, runs, settings, palette) {
  var _a, _b;
  const unit = (_a = config["unit"]) != null ? _a : settings.displayUnit;
  const metric = (_b = config["metric"]) != null ? _b : "pace";
  const isPace = metric === "pace";
  const trendline = config["trendline"];
  const minDistDisplay = config["mindistance"];
  const minDistMeters = minDistDisplay != null ? unitToMeters(minDistDisplay, unit) : 0;
  const points = paceSeries(runs, {
    unit,
    last: config["last"],
    from: config["from"],
    to: config["to"],
    metric,
    smoothing: config["smoothing"],
    minDistanceMeters: minDistMeters
  });
  const labels = points.map((p) => p.date);
  const values = points.map((p) => p.paceSecondsPerUnit);
  const datasets = [
    {
      data: values,
      borderColor: palette.accent,
      backgroundColor: palette.accent + "22",
      pointRadius: values.length > 60 ? 0 : 3,
      pointHoverRadius: 5,
      tension: 0.2,
      fill: false
    }
  ];
  if (trendline && values.length >= 2) {
    const { slope, intercept } = linearRegression(values);
    datasets.push({
      data: [intercept, intercept + slope * (values.length - 1)],
      borderColor: palette.textMuted,
      borderWidth: 1.5,
      borderDash: [5, 4],
      pointRadius: 0,
      fill: false
      // Only plot the first and last point; pad with null in the middle
      // Use a sparse array trick: set only first/last indices
    });
    const sparse = new Array(values.length).fill(null);
    sparse[0] = intercept;
    sparse[values.length - 1] = intercept + slope * (values.length - 1);
    datasets[datasets.length - 1].data = sparse;
  }
  const yTickCallback = isPace ? (v) => fmtPace(v) : void 0;
  const tooltipLabel = isPace ? (ctx) => `${fmtPace(ctx.raw)} /${unit} \xB7 ${labels[ctx.dataIndex]}` : (ctx) => `${ctx.raw.toFixed(1)} ${unit}/hr \xB7 ${labels[ctx.dataIndex]}`;
  const container = el.createDiv({ cls: "running-log-chart-container" });
  const canvas = container.createEl("canvas");
  const chartConfig = {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: tooltipLabel },
          filter: (item) => item.datasetIndex === 0
        }
      },
      scales: {
        x: {
          grid: { color: palette.border },
          ticks: { color: palette.textMuted, maxTicksLimit: 12, maxRotation: 45 }
        },
        y: {
          reverse: isPace,
          grid: { color: palette.border },
          ticks: { color: palette.textMuted, callback: yTickCallback },
          title: {
            display: true,
            text: isPace ? `min/${unit}` : `${unit}/hr`,
            color: palette.textMuted
          }
        }
      }
    }
  };
  return new Chart(canvas, chartConfig);
}

// src/render/charts/heatmap.ts
var NS = "http://www.w3.org/2000/svg";
var CELL = 11;
var GAP = 2;
var STRIDE = CELL + GAP;
var LEFT = 24;
var TOP = 20;
var MONTHS2 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var DAYS_MON = ["Mon", "", "Wed", "", "Fri", "", "Sun"];
var DAYS_SUN = ["Sun", "", "Tue", "", "Thu", "", "Sat"];
function svgEl(tag) {
  return document.createElementNS(NS, tag);
}
function dayOfWeekOffset(dateStr, weekStartsOn) {
  const dow = new Date(dateStr + "T12:00:00Z").getUTCDay();
  return weekStartsOn === "monday" ? (dow + 6) % 7 : dow;
}
function renderHeatmap(el, config, runs, settings, palette) {
  var _a;
  const unit = (_a = config["unit"]) != null ? _a : settings.displayUnit;
  const year = config["year"];
  const weekStartsOn = settings.weekStartsOn;
  const days = heatmapDays(runs, {
    unit,
    year,
    last: config["last"],
    metric: config["metric"],
    levels: config["levels"]
  });
  const byDate = new Map(days.map((d) => [d.date, d]));
  const displayYear = year != null ? year : new Date().getFullYear();
  const startDate = `${displayYear}-01-01`;
  const endDate = `${displayYear}-12-31`;
  const startOffset = dayOfWeekOffset(startDate, weekStartsOn);
  const startMs = new Date(startDate + "T12:00:00Z").getTime();
  const endMs = new Date(endDate + "T12:00:00Z").getTime();
  const numDays = Math.round((endMs - startMs) / 864e5) + 1;
  const numCols = Math.ceil((startOffset + numDays) / 7);
  const svgWidth = LEFT + numCols * STRIDE;
  const svgHeight = TOP + 7 * STRIDE;
  const svg = svgEl("svg");
  svg.setAttribute("width", String(svgWidth));
  svg.setAttribute("height", String(svgHeight));
  svg.setAttribute("style", "display:block;");
  const dayLabels = weekStartsOn === "monday" ? DAYS_MON : DAYS_SUN;
  for (let row = 0; row < 7; row++) {
    if (!dayLabels[row])
      continue;
    const text = svgEl("text");
    text.setAttribute("x", String(LEFT - 4));
    text.setAttribute("y", String(TOP + row * STRIDE + CELL - 2));
    text.setAttribute("text-anchor", "end");
    text.setAttribute("font-size", "9");
    text.setAttribute("fill", palette.textFaint);
    text.textContent = dayLabels[row];
    svg.appendChild(text);
  }
  const monthLabelCols = /* @__PURE__ */ new Map();
  for (let dayIdx = 0; dayIdx < numDays; dayIdx++) {
    const dateMs = startMs + dayIdx * 864e5;
    const d = new Date(dateMs);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const gridPos = dayIdx + startOffset;
    const col = Math.floor(gridPos / 7);
    const row = gridPos % 7;
    if (d.getUTCDate() === 1)
      monthLabelCols.set(col, MONTHS2[d.getUTCMonth()]);
    const dayData = byDate.get(dateStr);
    const rect = svgEl("rect");
    rect.setAttribute("x", String(LEFT + col * STRIDE));
    rect.setAttribute("y", String(TOP + row * STRIDE));
    rect.setAttribute("width", String(CELL));
    rect.setAttribute("height", String(CELL));
    rect.setAttribute("rx", "2");
    if (dayData) {
      rect.setAttribute("fill", palette.accent);
      rect.setAttribute("fill-opacity", String(dayData.intensity));
      const dist = dayData.distance.toFixed(1);
      const runs2 = dayData.runCount;
      const title = svgEl("title");
      title.textContent = `${dateStr}: ${dist} ${unit} (${runs2} run${runs2 !== 1 ? "s" : ""})`;
      rect.appendChild(title);
    } else {
      rect.setAttribute("fill", palette.bgSecondary);
    }
    svg.appendChild(rect);
  }
  for (const [col, label] of monthLabelCols) {
    const text = svgEl("text");
    text.setAttribute("x", String(LEFT + col * STRIDE));
    text.setAttribute("y", String(TOP - 6));
    text.setAttribute("font-size", "9");
    text.setAttribute("fill", palette.textMuted);
    text.textContent = label;
    svg.appendChild(text);
  }
  const container = el.createDiv({ cls: "running-log-heatmap-container" });
  container.appendChild(svg);
}

// src/render/charts/streak.ts
function renderStreak(el, config, runs, settings) {
  var _a;
  const unitParam = config["unit"];
  const streakUnit = unitParam != null ? unitParam : "day";
  const showLongest = (_a = config["showlongest"]) != null ? _a : true;
  const minDisplay = config["min"];
  const displayUnit = settings.displayUnit;
  const minMeters = minDisplay != null ? unitToMeters(minDisplay, displayUnit) : settings.minRunDistance;
  const summary = streaks(runs, {
    unit: streakUnit,
    weekStartsOn: settings.weekStartsOn,
    minDistanceMeters: minMeters
  });
  const periodLabel = streakUnit === "week" ? "week streak" : "day streak";
  const card = el.createDiv({ cls: "running-log-streak" });
  const current = card.createDiv({ cls: "running-log-stat" });
  current.createEl("span", { cls: "running-log-stat-value", text: String(summary.currentStreak) });
  current.createEl("span", { cls: "running-log-stat-label", text: `current ${periodLabel}` });
  if (showLongest) {
    const longest = card.createDiv({ cls: "running-log-stat" });
    longest.createEl("span", { cls: "running-log-stat-value", text: String(summary.longestStreak) });
    longest.createEl("span", { cls: "running-log-stat-label", text: `longest ${periodLabel}` });
  }
  if (summary.lastRunDate) {
    card.createEl("span", {
      cls: "running-log-last-run",
      text: `Last run: ${summary.lastRunDate}`
    });
  }
}

// src/render/codeBlockProcessor.ts
var RunningLogBlock = class extends import_obsidian4.MarkdownRenderChild {
  constructor(app, containerEl, source, store, settings) {
    super(containerEl);
    this.app = app;
    this.source = source;
    this.store = store;
    this.settings = settings;
    this.chart = null;
  }
  onload() {
    this.render();
    this.registerEvent(
      this.app.workspace.on("css-change", () => this.render())
    );
  }
  onunload() {
    var _a;
    (_a = this.chart) == null ? void 0 : _a.destroy();
    this.chart = null;
  }
  render() {
    var _a;
    (_a = this.chart) == null ? void 0 : _a.destroy();
    this.chart = null;
    this.containerEl.empty();
    const { config, warnings } = parseBlockSource(this.source);
    for (const w of warnings) {
      this.containerEl.createEl("p", { cls: "running-log-warning", text: w });
    }
    const type = config["type"];
    if (!type || !VALID_TYPES.includes(type)) {
      this.containerEl.createEl("p", {
        cls: "running-log-error",
        text: `Running Log: unknown type "${type != null ? type : ""}". Valid types: ${VALID_TYPES.join(", ")}.`
      });
      return;
    }
    if (!this.store.hasIndex()) {
      this.containerEl.createEl("p", {
        cls: "running-log-empty",
        text: "No runs yet. Drop a .fit file into your inbox folder to get started."
      });
      return;
    }
    const runs = this.store.getRuns();
    const palette = getThemePalette();
    if (type === "streak") {
      renderStreak(this.containerEl, config, runs, this.settings);
      return;
    }
    if (type === "heatmap") {
      renderHeatmap(this.containerEl, config, runs, this.settings, palette);
      return;
    }
    if (type === "weekly-mileage" || type === "monthly-mileage") {
      this.chart = renderBarChart(this.containerEl, config, runs, this.settings, palette);
      return;
    }
    if (type === "pace-trend") {
      this.chart = renderLineChart(this.containerEl, config, runs, this.settings, palette);
      return;
    }
  }
};
function createCodeBlockProcessor(app, store, settings) {
  return (source, el, ctx) => {
    ctx.addChild(new RunningLogBlock(app, el, source, store, settings));
  };
}

// src/settings.ts
var import_obsidian5 = require("obsidian");
var DEFAULT_SETTINGS = {
  indexFolder: "running-log",
  inboxFolder: "running-log/inbox",
  autoImport: true,
  routeMaxPoints: 500,
  displayUnit: "mi",
  weekStartsOn: "monday",
  minRunDistance: 0
};
var RunningLogSettingsTab = class extends import_obsidian5.PluginSettingTab {
  constructor(app, plugin, settings, save) {
    super(app, plugin);
    this.settings = settings;
    this.save = save;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Running Log" });
    containerEl.createEl("h3", { text: "Inbox" });
    new import_obsidian5.Setting(containerEl).setName("Index folder").setDesc("Vault folder where runs.json is stored and export.xml is expected. Takes effect on next import.").addText(
      (text) => text.setPlaceholder("running-log").setValue(this.settings.indexFolder).onChange(async (value) => {
        this.settings.indexFolder = value.trim() || DEFAULT_SETTINGS.indexFolder;
        await this.save();
      })
    );
    new import_obsidian5.Setting(containerEl).setName("Inbox folder").setDesc("Vault folder to watch for incoming .fit files.").addText(
      (text) => text.setPlaceholder("running-log/inbox").setValue(this.settings.inboxFolder).onChange(async (value) => {
        this.settings.inboxFolder = value.trim() || DEFAULT_SETTINGS.inboxFolder;
        await this.save();
      })
    );
    containerEl.createEl("h3", { text: "Display" });
    new import_obsidian5.Setting(containerEl).setName("Distance unit").setDesc("Miles or kilometres. Can be overridden per block with unit: mi / unit: km.").addDropdown(
      (drop) => drop.addOption("mi", "Miles").addOption("km", "Kilometres").setValue(this.settings.displayUnit).onChange(async (value) => {
        this.settings.displayUnit = value;
        await this.save();
      })
    );
    new import_obsidian5.Setting(containerEl).setName("Week starts on").setDesc("Affects weekly mileage buckets and run streaks.").addDropdown(
      (drop) => drop.addOption("monday", "Monday").addOption("sunday", "Sunday").setValue(this.settings.weekStartsOn).onChange(async (value) => {
        this.settings.weekStartsOn = value;
        await this.save();
      })
    );
    new import_obsidian5.Setting(containerEl).setName("Default goal").setDesc("Default goal line for mileage charts (in the selected distance unit). Leave blank for none.").addText((text) => {
      text.setPlaceholder("e.g. 30").setValue(this.settings.defaultGoal != null ? String(this.settings.defaultGoal) : "");
      text.inputEl.type = "number";
      text.inputEl.min = "0";
      text.onChange(async (value) => {
        const n = parseFloat(value);
        this.settings.defaultGoal = value.trim() === "" || isNaN(n) ? void 0 : n;
        await this.save();
      });
      return text;
    });
    new import_obsidian5.Setting(containerEl).setName("Minimum run distance (meters)").setDesc("Runs shorter than this are ignored. Use 400 to filter phantom workouts recorded by Apple Health.").addText((text) => {
      text.setPlaceholder("0").setValue(String(this.settings.minRunDistance));
      text.inputEl.type = "number";
      text.inputEl.min = "0";
      text.onChange(async (value) => {
        const n = parseFloat(value);
        this.settings.minRunDistance = isNaN(n) ? 0 : Math.max(0, n);
        await this.save();
      });
      return text;
    });
  }
};

// src/main.ts
var RunningLogPlugin = class extends import_obsidian6.Plugin {
  constructor() {
    super(...arguments);
    this.settings = { ...DEFAULT_SETTINGS };
  }
  async onload() {
    await this.loadSettings();
    this.store = new IndexStore(this.app, this.settings);
    this.detailStore = new DetailStore(this.app, this.settings);
    await this.store.load();
    this.watcher = new InboxWatcher(
      this.app,
      this.settings,
      this.store,
      this.detailStore
    );
    if (this.settings.autoImport) {
      this.watcher.start();
      void this.watcher.scanExisting().catch((err) => {
        new import_obsidian6.Notice(`Running Log: inbox scan failed \u2014 ${err instanceof Error ? err.message : err}`, 5e3);
      });
    }
    this.registerMarkdownCodeBlockProcessor(
      "running-log",
      createCodeBlockProcessor(this.app, this.store, this.settings)
    );
    this.addSettingTab(
      new RunningLogSettingsTab(this.app, this, this.settings, () => this.saveSettings())
    );
  }
  onunload() {
    var _a;
    (_a = this.watcher) == null ? void 0 : _a.stop();
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async loadSettings() {
    const saved = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved != null ? saved : {});
  }
};
/*! Bundled license information:

@kurkle/color/dist/color.esm.js:
  (*!
   * @kurkle/color v0.3.4
   * https://github.com/kurkle/color#readme
   * (c) 2024 Jukka Kurkela
   * Released under the MIT License
   *)

chart.js/dist/chunks/helpers.dataset.js:
  (*!
   * Chart.js v4.5.1
   * https://www.chartjs.org
   * (c) 2025 Chart.js Contributors
   * Released under the MIT License
   *)

chart.js/dist/chart.js:
  (*!
   * Chart.js v4.5.1
   * https://www.chartjs.org
   * (c) 2025 Chart.js Contributors
   * Released under the MIT License
   *)
*/
