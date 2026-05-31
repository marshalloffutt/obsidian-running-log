import { streaks } from "../../data/aggregations";
import { unitToMeters } from "../../util/units";
import { RunSummary, RunningLogSettings } from "../../data/types";

export function renderStreak(
  el: HTMLElement,
  config: Record<string, unknown>,
  runs: RunSummary[],
  settings: RunningLogSettings
): void {
  const unitParam = config["unit"] as "day" | "week" | undefined;
  const streakUnit = unitParam ?? "day";
  const showLongest = (config["showlongest"] as boolean | undefined) ?? true;
  const minDisplay = config["min"] as number | undefined;
  const displayUnit = settings.displayUnit;
  const minMeters = minDisplay != null
    ? unitToMeters(minDisplay, displayUnit)
    : settings.minRunDistance;

  const summary = streaks(runs, {
    unit: streakUnit,
    weekStartsOn: settings.weekStartsOn,
    minDistanceMeters: minMeters,
  });

  const periodLabel = streakUnit === "week" ? "week streak" : "day streak";

  const title = config["title"] as string | undefined;
  if (title !== "") {
    el.createEl("h4", { cls: "running-log-gallery-title", text: title ?? "Streak" });
  }

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
      text: `Last run: ${summary.lastRunDate}`,
    });
  }
}
