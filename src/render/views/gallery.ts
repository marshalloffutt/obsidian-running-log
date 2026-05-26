import { RunSummary, RunningLogSettings } from "../../data/types";
import { metersToUnit, secondsToHMS, METERS_PER_MILE, METERS_PER_KM } from "../../util/units";
import { localDateStr } from "../../util/dates";
import { ThemePalette } from "../theme";

type ConfigValue = string | number | boolean;

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatCardDate(isoWithOffset: string): string {
  const [y, m, d] = localDateStr(isoWithOffset).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dow = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][date.getUTCDay()];
  return `${dow} ${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

function formatPace(distanceMeters: number, durationSeconds: number, unit: "mi" | "km"): string {
  const dist = metersToUnit(distanceMeters, unit);
  if (dist <= 0) return "—";
  const spu = durationSeconds / dist;
  const m = Math.floor(spu / 60);
  const s = String(Math.floor(spu % 60)).padStart(2, "0");
  return `${m}:${s} /${unit}`;
}

function accentIntensity(
  run: RunSummary,
  metric: string,
  allRuns: RunSummary[],
  unit: "mi" | "km"
): number {
  type Extractor = (r: RunSummary) => number | undefined;
  const metersPerUnit = unit === "mi" ? METERS_PER_MILE : METERS_PER_KM;

  const extractors: Record<string, Extractor> = {
    pace: (r) => r.distanceMeters > 0 ? r.durationSeconds / (r.distanceMeters / metersPerUnit) : undefined,
    distance: (r) => r.distanceMeters,
    hr: (r) => r.avgHeartRate,
  };
  const extract = extractors[metric] ?? extractors.pace;

  const values = allRuns.map(extract).filter((v): v is number => v !== undefined);
  if (values.length === 0) return 0.5;

  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 0.5;

  const val = extract(run);
  if (val === undefined) return 0.3;

  const normalized = (val - min) / (max - min);
  // For pace: higher seconds/unit = slower = less intense, so invert
  return metric === "pace" ? 1 - normalized : normalized;
}

export function renderGallery(
  container: HTMLElement,
  config: Record<string, ConfigValue>,
  allRuns: RunSummary[],
  settings: RunningLogSettings,
  palette: ThemePalette
): void {
  const unit = (config["unit"] as "mi" | "km" | undefined) ?? settings.displayUnit;
  const last = typeof config["last"] === "number" ? config["last"] : 30;
  const sort = (config["sort"] as string | undefined) ?? "date";
  const metric = (config["metric"] as string | undefined) ?? "pace";
  const columns = typeof config["columns"] === "number" ? config["columns"] : undefined;

  const fromDate = config["from"] as string | undefined;
  const toDate = config["to"] as string | undefined;

  let runs = [...allRuns];

  if (fromDate || toDate) {
    runs = runs.filter((r) => {
      const d = localDateStr(r.startTime);
      return (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
    });
  } else {
    runs = runs.slice(-last);
  }

  const metersPerUnit = unit === "mi" ? METERS_PER_MILE : METERS_PER_KM;

  runs.sort((a, b) => {
    if (sort === "distance") return b.distanceMeters - a.distanceMeters;
    if (sort === "duration") return b.durationSeconds - a.durationSeconds;
    if (sort === "pace") {
      const pa = a.distanceMeters > 0 ? a.durationSeconds / (a.distanceMeters / metersPerUnit) : Infinity;
      const pb = b.distanceMeters > 0 ? b.durationSeconds / (b.distanceMeters / metersPerUnit) : Infinity;
      return pa - pb; // faster first
    }
    return b.startTime.localeCompare(a.startTime); // date: newest first
  });

  if (runs.length === 0) {
    container.createEl("p", { cls: "running-log-empty", text: "No runs in this range." });
    return;
  }

  const title = config["title"] as string | undefined;
  if (title !== "") {
    const heading = title ?? `Last ${runs.length} runs`;
    container.createEl("h4", { cls: "running-log-gallery-title", text: heading });
  }

  const grid = container.createEl("div", { cls: "running-log-gallery" });
  if (columns) {
    grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  }

  for (const run of runs) {
    const card = grid.createEl("div", { cls: "running-log-card" });

    card.createEl("div", {
      cls: "running-log-card-date",
      text: formatCardDate(run.startTime),
    });

    const stats = card.createEl("div", { cls: "running-log-card-stats" });

    const dist = metersToUnit(run.distanceMeters, unit);
    stats.createEl("span", {
      cls: "running-log-card-primary",
      text: `${dist.toFixed(2)} ${unit}`,
    });

    stats.createEl("span", {
      cls: "running-log-card-secondary",
      text: secondsToHMS(run.durationSeconds),
    });

    stats.createEl("span", {
      cls: "running-log-card-secondary",
      text: formatPace(run.distanceMeters, run.durationSeconds, unit),
    });

    if (run.avgHeartRate) {
      stats.createEl("span", {
        cls: "running-log-card-meta",
        text: `${run.avgHeartRate} bpm`,
      });
    }

    const intensity = accentIntensity(run, metric, runs, unit);
    const bar = card.createEl("div", { cls: "running-log-card-bar" });
    bar.style.setProperty("--bar-intensity", String(intensity));
    bar.style.background = palette.accent;
    bar.style.opacity = String(0.25 + intensity * 0.75);
  }
}
