import { RunSummary, RunningLogSettings } from "../../data/types";
import { metersToUnit, secondsToHMS, METERS_PER_MILE, METERS_PER_KM } from "../../util/units";
import { localDateStr } from "../../util/dates";
import { ThemePalette } from "../theme";

type ConfigValue = string | number | boolean;

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function formatRowDate(isoWithOffset: string): string {
  const [y, m, d] = localDateStr(isoWithOffset).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${DOW[date.getUTCDay()]} ${MONTH_NAMES[m - 1]} ${d}`;
}

function formatPace(distanceMeters: number, durationSeconds: number, unit: "mi" | "km"): string {
  const dist = metersToUnit(distanceMeters, unit);
  if (dist <= 0) return "—";
  const spu = durationSeconds / dist;
  const m = Math.floor(spu / 60);
  const s = String(Math.floor(spu % 60)).padStart(2, "0");
  return `${m}:${s} /${unit}`;
}

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export function renderGallery(
  container: HTMLElement,
  config: Record<string, ConfigValue>,
  allRuns: RunSummary[],
  settings: RunningLogSettings,
  _palette: ThemePalette
): void {
  const unit = (config["unit"] as "mi" | "km" | undefined) ?? settings.displayUnit;
  const last = typeof config["last"] === "number" ? config["last"] : null;
  const month = config["month"] as string | undefined;
  const sort = (config["sort"] as string | undefined) ?? "date";

  const fromDate = config["from"] as string | undefined;
  const toDate = config["to"] as string | undefined;

  let runs = [...allRuns];
  let autoTitle: string;

  if (fromDate || toDate) {
    runs = runs.filter((r) => {
      const d = localDateStr(r.startTime);
      return (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
    });
    autoTitle = [fromDate, toDate].filter(Boolean).join(" – ");
  } else if (last !== null) {
    runs = runs.slice(-last);
    autoTitle = `Last ${last} activities`;
  } else {
    const ym = month ?? currentYearMonth();
    runs = runs.filter((r) => localDateStr(r.startTime).startsWith(ym));
    autoTitle = monthLabel(ym);
  }

  const metersPerUnit = unit === "mi" ? METERS_PER_MILE : METERS_PER_KM;

  runs.sort((a, b) => {
    if (sort === "distance") return b.distanceMeters - a.distanceMeters;
    if (sort === "duration") return b.durationSeconds - a.durationSeconds;
    if (sort === "pace") {
      const pa = a.distanceMeters > 0 ? a.durationSeconds / (a.distanceMeters / metersPerUnit) : Infinity;
      const pb = b.distanceMeters > 0 ? b.durationSeconds / (b.distanceMeters / metersPerUnit) : Infinity;
      return pa - pb;
    }
    return b.startTime.localeCompare(a.startTime); // date: newest first
  });

  if (runs.length === 0) {
    container.createEl("p", { cls: "running-log-empty", text: "No activities in this range." });
    return;
  }

  const title = config["title"] as string | undefined;
  if (title) {
    container.createEl("h4", { cls: "running-log-gallery-title", text: title });
  }

  const showHr = runs.some((r) => r.avgHeartRate != null);

  const table = container.createEl("table", { cls: "running-log-table" });

  const thead = table.createEl("thead");
  const headerRow = thead.createEl("tr");
  headerRow.createEl("th", { text: "Date" });
  headerRow.createEl("th", { text: "Type" });
  headerRow.createEl("th", { text: `Distance (${unit})`, cls: "running-log-th-num" });
  headerRow.createEl("th", { text: "Time", cls: "running-log-th-num" });
  headerRow.createEl("th", { text: "Pace", cls: "running-log-th-num" });
  if (showHr) headerRow.createEl("th", { text: "Avg HR", cls: "running-log-th-num" });

  const tbody = table.createEl("tbody");

  for (const run of runs) {
    const isWalk = run.activityType === "walk";
    const tr = tbody.createEl("tr", { cls: isWalk ? "running-log-tr running-log-tr-walk" : "running-log-tr" });

    tr.createEl("td", { text: formatRowDate(run.startTime), cls: "running-log-td-date" });
    tr.createEl("td", { text: isWalk ? "Walk" : "Run", cls: "running-log-td-type" });

    const dist = metersToUnit(run.distanceMeters, unit);
    tr.createEl("td", { text: dist.toFixed(2), cls: "running-log-td-num" });
    tr.createEl("td", { text: secondsToHMS(run.durationSeconds), cls: "running-log-td-num" });
    tr.createEl("td", { text: formatPace(run.distanceMeters, run.durationSeconds, unit), cls: "running-log-td-num" });
    if (showHr) {
      tr.createEl("td", {
        text: run.avgHeartRate ? `${run.avgHeartRate}` : "—",
        cls: "running-log-td-num",
      });
    }
  }
}
