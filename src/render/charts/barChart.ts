import {
  Chart,
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  type ChartConfiguration,
  type Plugin,
} from "chart.js";
import { byWeek, byMonth } from "../../data/aggregations";
import { RunRecord, RunningLogSettings } from "../../data/types";
import { ThemePalette } from "../theme";

Chart.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip);

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtWeek(d: string) {
  const dt = new Date(d + "T12:00:00Z");
  return `${MONTHS[dt.getUTCMonth()]} ${dt.getUTCDate()}`;
}

function fmtMonth(d: string) {
  return MONTHS[new Date(d + "T12:00:00Z").getUTCMonth()];
}

export function renderBarChart(
  el: HTMLElement,
  config: Record<string, unknown>,
  runs: RunRecord[],
  settings: RunningLogSettings,
  palette: ThemePalette
): Chart {
  const isWeekly = config["type"] === "weekly-mileage";
  const unit = (config["unit"] as "mi" | "km" | undefined) ?? settings.displayUnit;
  const goal = config["goal"] as number | undefined;
  const showRunCount = config["showruncount"] as boolean | undefined;

  const buckets = isWeekly
    ? byWeek(runs, {
        unit,
        weekStartsOn: settings.weekStartsOn,
        last: config["last"] as number | undefined,
        from: config["from"] as string | undefined,
        to: config["to"] as string | undefined,
      })
    : byMonth(runs, {
        unit,
        last: config["last"] as number | undefined,
        from: config["from"] as string | undefined,
        to: config["to"] as string | undefined,
      });

  const labels = buckets.map((b) => (isWeekly ? fmtWeek(b.periodStart) : fmtMonth(b.periodStart)));

  const goalLinePlugin: Plugin<"bar"> = {
    id: "goalLine",
    afterDraw(chart) {
      if (goal == null) return;
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
    },
  };

  const container = el.createDiv({ cls: "running-log-chart-container" });
  const canvas = container.createEl("canvas");

  const chartConfig: ChartConfiguration<"bar"> = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data: buckets.map((b) => b.distance),
          backgroundColor: palette.accent + "99",
          borderColor: palette.accent,
          borderWidth: 1,
          borderRadius: 2,
        },
      ],
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
              const dist = (ctx.raw as number).toFixed(1);
              const runs = `${b.runCount} run${b.runCount !== 1 ? "s" : ""}`;
              const goalHit = goal != null && b.distance >= goal ? " ✓" : "";
              return showRunCount ? `${dist} ${unit} · ${runs}${goalHit}` : `${dist} ${unit}${goalHit}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: palette.border },
          ticks: { color: palette.textMuted, maxRotation: 45 },
        },
        y: {
          beginAtZero: true,
          grid: { color: palette.border },
          ticks: { color: palette.textMuted },
          title: { display: true, text: unit, color: palette.textMuted },
        },
      },
    },
    plugins: [goalLinePlugin],
  };

  return new Chart(canvas, chartConfig);
}
