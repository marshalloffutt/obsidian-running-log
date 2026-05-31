import {
  Chart,
  LineController,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartConfiguration,
  type ChartDataset,
} from "chart.js";
import { paceSeries } from "../../data/aggregations";
import { unitToMeters } from "../../util/units";
import { RunSummary, RunningLogSettings } from "../../data/types";
import { ThemePalette } from "../theme";

Chart.register(LineController, CategoryScale, LinearScale, LineElement, PointElement, Tooltip);

function fmtPace(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

function linearRegression(ys: number[]): { slope: number; intercept: number } {
  const n = ys.length;
  const xs = ys.map((_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumXX = xs.reduce((s, x) => s + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  return {
    slope: (n * sumXY - sumX * sumY) / denom,
    intercept: (sumY - ((n * sumXY - sumX * sumY) / denom) * sumX) / n,
  };
}

export function renderLineChart(
  el: HTMLElement,
  config: Record<string, unknown>,
  runs: RunSummary[],
  settings: RunningLogSettings,
  palette: ThemePalette
): Chart {
  const unit = (config["unit"] as "mi" | "km" | undefined) ?? settings.displayUnit;
  const metric = (config["metric"] as "pace" | "speed" | undefined) ?? "pace";
  const isPace = metric === "pace";
  const trendline = config["trendline"] as boolean | undefined;
  const minDistDisplay = config["mindistance"] as number | undefined;
  const minDistMeters = minDistDisplay != null ? unitToMeters(minDistDisplay, unit) : 0;

  const points = paceSeries(runs, {
    unit,
    last: config["last"] as number | undefined,
    from: config["from"] as string | undefined,
    to: config["to"] as string | undefined,
    metric,
    smoothing: config["smoothing"] as number | undefined,
    minDistanceMeters: minDistMeters,
  });

  const labels = points.map((p) => p.date);
  const values = points.map((p) => p.paceSecondsPerUnit);

  const datasets: ChartDataset<"line">[] = [
    {
      data: values,
      borderColor: palette.accent,
      backgroundColor: palette.accent + "22",
      pointRadius: values.length > 60 ? 0 : 3,
      pointHoverRadius: 5,
      tension: 0.2,
      fill: false,
    },
  ];

  if (trendline && values.length >= 2) {
    const { slope, intercept } = linearRegression(values);
    datasets.push({
      data: [intercept, intercept + slope * (values.length - 1)],
      borderColor: palette.textMuted,
      borderWidth: 1.5,
      borderDash: [5, 4],
      pointRadius: 0,
      fill: false,
      // Only plot the first and last point; pad with null in the middle
      // Use a sparse array trick: set only first/last indices
    } as ChartDataset<"line">);
    // Replace with sparse: null-fill middle entries
    const sparse: (number | null)[] = new Array(values.length).fill(null);
    sparse[0] = intercept;
    sparse[values.length - 1] = intercept + slope * (values.length - 1);
    datasets[datasets.length - 1].data = sparse;
  }

  const yTickCallback = isPace
    ? (v: unknown) => fmtPace(v as number)
    : undefined;

  const tooltipLabel = isPace
    ? (ctx: { raw: unknown; dataIndex: number }) =>
        `${fmtPace(ctx.raw as number)} /${unit} · ${labels[ctx.dataIndex]}`
    : (ctx: { raw: unknown; dataIndex: number }) =>
        `${(ctx.raw as number).toFixed(1)} ${unit}/hr · ${labels[ctx.dataIndex]}`;

  const title = config["title"] as string | undefined;
  if (title !== "") {
    el.createEl("h4", { cls: "running-log-gallery-title", text: title ?? "Pace Trend" });
  }

  const container = el.createDiv({ cls: "running-log-chart-container" });
  const canvas = container.createEl("canvas");

  const chartConfig: ChartConfiguration<"line"> = {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: tooltipLabel as never },
          filter: (item) => item.datasetIndex === 0,
        },
      },
      scales: {
        x: {
          grid: { color: palette.border },
          ticks: { color: palette.textMuted, maxTicksLimit: 12, maxRotation: 45 },
        },
        y: {
          reverse: isPace,
          grid: { color: palette.border },
          ticks: { color: palette.textMuted, callback: yTickCallback as never },
          title: {
            display: true,
            text: isPace ? `min/${unit}` : `${unit}/hr`,
            color: palette.textMuted,
          },
        },
      },
    },
  };

  return new Chart(canvas, chartConfig);
}
