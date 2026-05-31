import { RunSummary, RunningLogSettings } from "../../data/types";
import { metersToUnit } from "../../util/units";
import { localDateStr } from "../../util/dates";

type ConfigValue = string | number | boolean;

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export function renderSummary(
  container: HTMLElement,
  config: Record<string, ConfigValue>,
  allRuns: RunSummary[],
  settings: RunningLogSettings
): void {
  const unit = (config["unit"] as "mi" | "km" | undefined) ?? settings.displayUnit;
  const fromDate = config["from"] as string | undefined;
  const toDate = config["to"] as string | undefined;
  const month = config["month"] as string | undefined;

  let runs = [...allRuns];
  let autoTitle: string;

  if (fromDate || toDate) {
    runs = runs.filter((r) => {
      const d = localDateStr(r.startTime);
      return (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
    });
    autoTitle = [fromDate, toDate].filter(Boolean).join(" – ");
  } else {
    const ym = month ?? currentYearMonth();
    runs = runs.filter((r) => localDateStr(r.startTime).startsWith(ym));
    autoTitle = monthLabel(ym);
  }

  const title = config["title"] as string | undefined;
  if (title !== "") {
    container.createEl("h4", { cls: "running-log-gallery-title", text: title ?? autoTitle });
  }

  const runDist = runs
    .filter((r) => r.activityType !== "walk")
    .reduce((sum, r) => sum + r.distanceMeters, 0);

  const walkDist = runs
    .filter((r) => r.activityType === "walk")
    .reduce((sum, r) => sum + r.distanceMeters, 0);

  const totalDist = runDist + walkDist;

  const stats: { label: string; value: string }[] = [
    { label: "Total Distance", value: `${metersToUnit(totalDist, unit).toFixed(1)} ${unit}` },
    { label: "Run",            value: `${metersToUnit(runDist, unit).toFixed(1)} ${unit}` },
    { label: "Walk",           value: `${metersToUnit(walkDist, unit).toFixed(1)} ${unit}` },
  ];

  const row = container.createEl("div", { cls: "running-log-summary" });

  for (const stat of stats) {
    const block = row.createEl("div", { cls: "running-log-summary-stat" });
    block.createEl("div", { cls: "running-log-summary-value", text: stat.value });
    block.createEl("div", { cls: "running-log-summary-label", text: stat.label });
  }
}
