import { App, MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";
import type { Chart } from "chart.js";
import { IndexStore } from "../data/indexStore";
import { DetailStore } from "../data/detailStore";
import { RunningLogSettings } from "../data/types";
import { parseBlockSource, VALID_TYPES, BlockType } from "./blockConfig";
import { getThemePalette } from "./theme";
import { renderBarChart } from "./charts/barChart";
import { renderLineChart } from "./charts/lineChart";
import { renderHeatmap } from "./charts/heatmap";
import { renderStreak } from "./charts/streak";
import { renderGallery } from "./views/gallery";
import { renderRunDetail } from "./views/runDetail";
import { renderSummary } from "./views/summary";

class RunningLogBlock extends MarkdownRenderChild {
  private charts: Chart[] = [];

  constructor(
    private app: App,
    containerEl: HTMLElement,
    private source: string,
    private store: IndexStore,
    private detailStore: DetailStore,
    private settings: RunningLogSettings
  ) {
    super(containerEl);
  }

  onload() {
    this.render();
    this.registerEvent(
      this.app.workspace.on("css-change", () => this.render())
    );
  }

  onunload() {
    for (const c of this.charts) c.destroy();
    this.charts = [];
  }

  private render() {
    for (const c of this.charts) c.destroy();
    this.charts = [];
    this.containerEl.empty();

    const { config, warnings } = parseBlockSource(this.source);

    for (const w of warnings) {
      this.containerEl.createEl("p", { cls: "running-log-warning", text: w });
    }

    const type = config["type"] as BlockType | undefined;

    if (!type || !VALID_TYPES.includes(type)) {
      this.containerEl.createEl("p", {
        cls: "running-log-error",
        text: `Running Log: unknown type "${type ?? ""}". Valid types: ${VALID_TYPES.join(", ")}.`,
      });
      return;
    }

    if (!this.store.hasIndex()) {
      this.containerEl.createEl("p", {
        cls: "running-log-empty",
        text: 'No runs yet. Drop a .fit file into your inbox folder to get started.',
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
      const chart = renderBarChart(this.containerEl, config, runs, this.settings, palette);
      if (chart) this.charts.push(chart);
      return;
    }

    if (type === "pace-trend") {
      const chart = renderLineChart(this.containerEl, config, runs, this.settings, palette);
      if (chart) this.charts.push(chart);
      return;
    }

    if (type === "summary") {
      renderSummary(this.containerEl, config, runs, this.settings);
      return;
    }

    if (type === "gallery") {
      renderGallery(this.containerEl, config, runs, this.settings, palette);
      return;
    }

    if (type === "run-detail") {
      void renderRunDetail(
        this.containerEl, config, runs, this.detailStore, this.settings, palette
      ).then((charts) => {
        this.charts.push(...charts);
      });
      return;
    }
  }
}

export function createCodeBlockProcessor(
  app: App,
  store: IndexStore,
  detailStore: DetailStore,
  settings: RunningLogSettings
) {
  return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    ctx.addChild(new RunningLogBlock(app, el, source, store, detailStore, settings));
  };
}
