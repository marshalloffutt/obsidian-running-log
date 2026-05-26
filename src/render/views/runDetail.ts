import {
  Chart,
  LineController,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartConfiguration,
} from "chart.js";
import { RunSummary, RunDetail, Sample, Lap, RunningLogSettings } from "../../data/types";
import { DetailStore } from "../../data/detailStore";
import { metersToUnit, secondsToHMS, METERS_PER_MILE, METERS_PER_KM } from "../../util/units";
import { localDateStr } from "../../util/dates";
import { movingAverage } from "../../util/pace";
import { ThemePalette } from "../theme";
import { renderRouteMap } from "./routeMap";

Chart.register(LineController, CategoryScale, LinearScale, LineElement, PointElement, Tooltip);

type ConfigValue = string | number | boolean;

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDetailDate(isoWithOffset: string): string {
  const [y, m, d] = localDateStr(isoWithOffset).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dow = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][date.getUTCDay()];
  return `${dow}, ${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

function fmtPace(secPerUnit: number): string {
  const m = Math.floor(secPerUnit / 60);
  const s = String(Math.floor(secPerUnit % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = String(Math.floor(sec % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

function findRun(
  config: Record<string, ConfigValue>,
  runs: RunSummary[]
): RunSummary | null {
  if (runs.length === 0) return null;

  if (typeof config["id"] === "string") {
    return runs.find((r) => r.id === config["id"]) ?? null;
  }

  if (typeof config["date"] === "string") {
    const target = config["date"] as string;
    const nth = typeof config["nth"] === "number" ? (config["nth"] as number) : 1;
    const matching = runs.filter((r) => localDateStr(r.startTime) === target);
    return matching[nth - 1] ?? null;
  }

  // latest (default)
  return runs[runs.length - 1];
}

function renderSummaryPanel(
  container: HTMLElement,
  summary: RunSummary,
  unit: "mi" | "km"
): void {
  const metersPerUnit = unit === "mi" ? METERS_PER_MILE : METERS_PER_KM;
  const dist = metersToUnit(summary.distanceMeters, unit);
  const pace = summary.distanceMeters > 0
    ? summary.durationSeconds / (summary.distanceMeters / metersPerUnit)
    : 0;

  const stats: { label: string; value: string }[] = [
    { label: "Distance", value: `${dist.toFixed(2)} ${unit}` },
    { label: "Time", value: secondsToHMS(summary.durationSeconds) },
    { label: "Avg Pace", value: `${fmtPace(pace)} /${unit}` },
  ];
  if (summary.avgHeartRate) stats.push({ label: "Avg HR", value: `${summary.avgHeartRate} bpm` });
  if (summary.maxHeartRate) stats.push({ label: "Max HR", value: `${summary.maxHeartRate} bpm` });
  if (summary.avgCadence) stats.push({ label: "Cadence", value: `${summary.avgCadence} spm` });
  if (summary.elevationGainMeters) stats.push({ label: "Elevation", value: `+${Math.round(summary.elevationGainMeters)} m` });
  if (summary.energyKcal) stats.push({ label: "Calories", value: `${summary.energyKcal} kcal` });
  if (summary.avgPower) stats.push({ label: "Avg Power", value: `${summary.avgPower} W` });

  const row = container.createEl("div", { cls: "running-log-stat-row" });
  for (const { label, value } of stats) {
    const cell = row.createEl("div", { cls: "running-log-stat" });
    cell.createEl("div", { cls: "running-log-stat-value", text: value });
    cell.createEl("div", { cls: "running-log-stat-label", text: label });
  }
}

function renderSplitsPanel(
  container: HTMLElement,
  laps: Lap[],
  unit: "mi" | "km",
  palette: ThemePalette
): void {
  if (laps.length === 0) {
    container.createEl("p", { cls: "running-log-empty", text: "No splits available." });
    return;
  }

  const metersPerUnit = unit === "mi" ? METERS_PER_MILE : METERS_PER_KM;
  const table = container.createEl("table", { cls: "running-log-splits" });
  const thead = table.createEl("thead");
  const headerRow = thead.createEl("tr");
  for (const h of ["Lap", `Dist (${unit})`, "Time", `Pace /${unit}`, "HR"]) {
    headerRow.createEl("th", { text: h });
  }

  const tbody = table.createEl("tbody");
  for (const lap of laps) {
    const tr = tbody.createEl("tr");
    const pace = lap.distanceMeters > 0
      ? lap.durationSeconds / (lap.distanceMeters / metersPerUnit)
      : 0;
    tr.createEl("td", { text: String(lap.index + 1) });
    tr.createEl("td", { text: metersToUnit(lap.distanceMeters, unit).toFixed(2) });
    tr.createEl("td", { text: fmtTime(lap.durationSeconds) });
    tr.createEl("td", { text: fmtPace(pace) });
    tr.createEl("td", { text: lap.avgHeartRate ? `${lap.avgHeartRate}` : "—" });
  }
}

function makeSeriesChart(
  canvas: HTMLCanvasElement,
  samples: Sample[],
  extract: (s: Sample) => number | undefined,
  yLabel: string,
  formatY: (v: number) => string,
  palette: ThemePalette,
  smoothingWindow: number,
  reverseY = false
): Chart {
  const filtered = samples
    .map((s) => ({ x: s.tOffsetSec, y: extract(s) }))
    .filter((p): p is { x: number; y: number } => p.y !== undefined);

  const xs = filtered.map((p) => p.x);
  const ys = smoothingWindow > 1 ? movingAverage(filtered.map((p) => p.y), smoothingWindow) : filtered.map((p) => p.y);

  const labels = xs.map(fmtTime);

  const cfg: ChartConfiguration = {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: ys,
        borderColor: palette.accent,
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${yLabel}: ${formatY(ctx.parsed.y ?? 0)}`,
            title: (items) => `Time: ${items[0].label}`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: palette.textMuted,
            maxTicksLimit: 8,
            maxRotation: 0,
          },
          grid: { color: palette.border },
        },
        y: {
          reverse: reverseY,
          ticks: {
            color: palette.textMuted,
            callback: (v) => formatY(v as number),
          },
          grid: { color: palette.border },
        },
      },
    },
  };

  return new Chart(canvas, cfg);
}

type PanelRenderer = {
  hasSamples: (s: Sample[]) => boolean;
  render: (container: HTMLElement, detail: RunDetail, palette: ThemePalette, smoothing: number, unit: "mi" | "km") => Chart | null;
};

const PANEL_RENDERERS: Record<string, PanelRenderer> = {
  pace: {
    hasSamples: (s) => s.some((p) => p.speedMetersPerSec !== undefined),
    render(container, detail, palette, smoothing, unit) {
      const metersPerUnit = unit === "mi" ? METERS_PER_MILE : METERS_PER_KM;
      const canvas = container.createEl("canvas");
      return makeSeriesChart(
        canvas, detail.samples,
        (s) => s.speedMetersPerSec && s.speedMetersPerSec > 0 ? metersPerUnit / s.speedMetersPerSec : undefined,
        "Pace", fmtPace, palette, smoothing, true
      );
    },
  },
  hr: {
    hasSamples: (s) => s.some((p) => p.heartRate !== undefined),
    render(container, detail, palette, smoothing) {
      const canvas = container.createEl("canvas");
      return makeSeriesChart(canvas, detail.samples, (s) => s.heartRate, "HR", (v) => `${Math.round(v)} bpm`, palette, smoothing);
    },
  },
  cadence: {
    hasSamples: (s) => s.some((p) => p.cadence !== undefined),
    render(container, detail, palette, smoothing) {
      const canvas = container.createEl("canvas");
      return makeSeriesChart(canvas, detail.samples, (s) => s.cadence, "Cadence", (v) => `${Math.round(v)} spm`, palette, smoothing);
    },
  },
  power: {
    hasSamples: (s) => s.some((p) => p.power !== undefined),
    render(container, detail, palette, smoothing) {
      const canvas = container.createEl("canvas");
      return makeSeriesChart(canvas, detail.samples, (s) => s.power, "Power", (v) => `${Math.round(v)} W`, palette, smoothing);
    },
  },
  elevation: {
    hasSamples: (s) => s.some((p) => p.altitudeMeters !== undefined),
    render(container, detail, palette, smoothing) {
      const canvas = container.createEl("canvas");
      return makeSeriesChart(canvas, detail.samples, (s) => s.altitudeMeters, "Elevation", (v) => `${Math.round(v)} m`, palette, smoothing);
    },
  },
};

export async function renderRunDetail(
  container: HTMLElement,
  config: Record<string, ConfigValue>,
  runs: RunSummary[],
  detailStore: DetailStore,
  settings: RunningLogSettings,
  palette: ThemePalette
): Promise<Chart[]> {
  const charts: Chart[] = [];

  const summary = findRun(config, runs);
  if (!summary) {
    container.createEl("p", {
      cls: "running-log-empty",
      text: "No run found. Use date: YYYY-MM-DD, id:, or latest: true.",
    });
    return charts;
  }

  const unit = (config["unit"] as "mi" | "km" | undefined) ?? settings.displayUnit;
  const smoothing = typeof config["smoothing"] === "number" ? config["smoothing"] : 0;
  const panelsRaw = (config["panels"] as string | undefined) ?? "summary, splits, pace, hr, route";
  const panels = panelsRaw.split(",").map((p) => p.trim().toLowerCase());

  // Heading
  const title = config["title"] as string | undefined;
  if (title !== "") {
    container.createEl("h4", {
      cls: "running-log-detail-title",
      text: title ?? formatDetailDate(summary.startTime),
    });
  }

  const wrap = container.createEl("div", { cls: "running-log-detail" });

  for (const panel of panels) {
    if (panel === "summary") {
      const sec = wrap.createEl("div", { cls: "running-log-detail-section" });
      renderSummaryPanel(sec, summary, unit);
      continue;
    }

    if (panel === "splits") {
      // Need detail for splits
      break; // handled below with detail load
    }

    if (panel === "route") {
      break; // also needs detail
    }

    if (PANEL_RENDERERS[panel]) {
      break; // needs detail for samples
    }
  }

  // Re-render everything that needs detail in one pass after loading
  const needsDetail = panels.some(
    (p) => p === "splits" || p === "route" || PANEL_RENDERERS[p]
  );

  // Re-render summary (not detail-dependent)
  wrap.empty();

  let detail: RunDetail | null = null;
  if (needsDetail) {
    detail = await detailStore.read(summary.id);
  }

  for (const panel of panels) {
    if (panel === "summary") {
      const sec = wrap.createEl("div", { cls: "running-log-detail-section" });
      renderSummaryPanel(sec, summary, unit);
      continue;
    }

    if (panel === "splits") {
      const sec = wrap.createEl("div", { cls: "running-log-detail-section" });
      sec.createEl("h5", { cls: "running-log-detail-section-title", text: "Splits" });
      if (!detail) {
        sec.createEl("p", { cls: "running-log-empty", text: "Detail file not found." });
      } else {
        renderSplitsPanel(sec, detail.laps, unit, palette);
      }
      continue;
    }

    if (panel === "route") {
      const sec = wrap.createEl("div", { cls: "running-log-detail-section" });
      sec.createEl("h5", { cls: "running-log-detail-section-title", text: "Route" });
      if (!detail || detail.route.length < 2) {
        sec.createEl("p", { cls: "running-log-empty", text: "No GPS route for this run." });
      } else {
        renderRouteMap(sec, detail.route, palette);
      }
      continue;
    }

    const renderer = PANEL_RENDERERS[panel];
    if (renderer) {
      if (!detail || !renderer.hasSamples(detail.samples)) {
        const sec = wrap.createEl("div", { cls: "running-log-detail-section" });
        sec.createEl("p", {
          cls: "running-log-empty",
          text: `No ${panel} data for this run.`,
        });
        continue;
      }
      const sec = wrap.createEl("div", {
        cls: "running-log-detail-section running-log-detail-chart",
      });
      sec.createEl("h5", { cls: "running-log-detail-section-title", text: panel.charAt(0).toUpperCase() + panel.slice(1) });
      const chart = renderer.render(sec, detail!, palette, smoothing, unit);
      if (chart) charts.push(chart);
      continue;
    }

    // Unknown panel name — soft skip
    wrap.createEl("p", {
      cls: "running-log-empty",
      text: `Unknown panel: "${panel}".`,
    });
  }

  return charts;
}
