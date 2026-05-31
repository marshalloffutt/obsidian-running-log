import { heatmapDays } from "../../data/aggregations";
import { RunSummary, RunningLogSettings } from "../../data/types";
import { ThemePalette } from "../theme";

const NS = "http://www.w3.org/2000/svg";
const CELL = 11;
const GAP = 2;
const STRIDE = CELL + GAP;
const LEFT = 24;   // space for day labels
const TOP = 20;    // space for month labels

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_MON = ["Mon","","Wed","","Fri","","Sun"];
const DAYS_SUN = ["Sun","","Tue","","Thu","","Sat"];

function svgEl<T extends SVGElement>(tag: string): T {
  return document.createElementNS(NS, tag) as T;
}

function dayOfWeekOffset(dateStr: string, weekStartsOn: "monday" | "sunday"): number {
  const dow = new Date(dateStr + "T12:00:00Z").getUTCDay(); // 0=Sun
  return weekStartsOn === "monday" ? (dow + 6) % 7 : dow;
}

export function renderHeatmap(
  el: HTMLElement,
  config: Record<string, unknown>,
  runs: RunSummary[],
  settings: RunningLogSettings,
  palette: ThemePalette
): void {
  const unit = (config["unit"] as "mi" | "km" | undefined) ?? settings.displayUnit;
  const year = config["year"] as number | undefined;
  const weekStartsOn = settings.weekStartsOn;

  const days = heatmapDays(runs, {
    unit,
    year,
    last: config["last"] as number | undefined,
    metric: config["metric"] as "distance" | "duration" | "count" | undefined,
    levels: config["levels"] as number | undefined,
  });

  // Build lookup map
  const byDate = new Map(days.map((d) => [d.date, d]));

  // Determine display range
  const displayYear = year ?? new Date().getFullYear();
  const startDate = `${displayYear}-01-01`;
  const endDate = `${displayYear}-12-31`;
  const startOffset = dayOfWeekOffset(startDate, weekStartsOn);

  // Count days in year
  const startMs = new Date(startDate + "T12:00:00Z").getTime();
  const endMs = new Date(endDate + "T12:00:00Z").getTime();
  const numDays = Math.round((endMs - startMs) / 86400000) + 1;
  const numCols = Math.ceil((startOffset + numDays) / 7);

  const svgWidth = LEFT + numCols * STRIDE;
  const svgHeight = TOP + 7 * STRIDE;

  const svg = svgEl<SVGSVGElement>("svg");
  svg.setAttribute("width", String(svgWidth));
  svg.setAttribute("height", String(svgHeight));
  svg.setAttribute("style", "display:block;");

  const dayLabels = weekStartsOn === "monday" ? DAYS_MON : DAYS_SUN;
  for (let row = 0; row < 7; row++) {
    if (!dayLabels[row]) continue;
    const text = svgEl<SVGTextElement>("text");
    text.setAttribute("x", String(LEFT - 4));
    text.setAttribute("y", String(TOP + row * STRIDE + CELL - 2));
    text.setAttribute("text-anchor", "end");
    text.setAttribute("font-size", "9");
    text.setAttribute("fill", palette.textFaint);
    text.textContent = dayLabels[row];
    svg.appendChild(text);
  }

  // Month labels — track first column of each month
  const monthLabelCols = new Map<number, string>();

  for (let dayIdx = 0; dayIdx < numDays; dayIdx++) {
    const dateMs = startMs + dayIdx * 86400000;
    const d = new Date(dateMs);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const gridPos = dayIdx + startOffset;
    const col = Math.floor(gridPos / 7);
    const row = gridPos % 7;

    // Track first column of each month for the label
    if (d.getUTCDate() === 1) monthLabelCols.set(col, MONTHS[d.getUTCMonth()]);

    const dayData = byDate.get(dateStr);
    const rect = svgEl<SVGRectElement>("rect");
    rect.setAttribute("x", String(LEFT + col * STRIDE));
    rect.setAttribute("y", String(TOP + row * STRIDE));
    rect.setAttribute("width", String(CELL));
    rect.setAttribute("height", String(CELL));
    rect.setAttribute("rx", "2");

    if (dayData) {
      rect.setAttribute("fill", palette.accent);
      rect.setAttribute("fill-opacity", String(dayData.intensity));
      const dist = dayData.distance.toFixed(1);
      const runs = dayData.runCount;
      const title = svgEl<SVGTitleElement>("title");
      title.textContent = `${dateStr}: ${dist} ${unit} (${runs} run${runs !== 1 ? "s" : ""})`;
      rect.appendChild(title);
    } else {
      rect.setAttribute("fill", palette.bgSecondary);
    }

    svg.appendChild(rect);
  }

  // Draw month labels
  for (const [col, label] of monthLabelCols) {
    const text = svgEl<SVGTextElement>("text");
    text.setAttribute("x", String(LEFT + col * STRIDE));
    text.setAttribute("y", String(TOP - 6));
    text.setAttribute("font-size", "9");
    text.setAttribute("fill", palette.textMuted);
    text.textContent = label;
    svg.appendChild(text);
  }

  const title = config["title"] as string | undefined;
  if (title !== "") {
    el.createEl("h4", { cls: "running-log-gallery-title", text: title ?? "Activity Heatmap" });
  }

  const container = el.createDiv({ cls: "running-log-heatmap-container" });
  container.appendChild(svg);
}
