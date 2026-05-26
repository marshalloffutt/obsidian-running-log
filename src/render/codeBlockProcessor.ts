import { App, MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";
import type { Chart } from "chart.js";
import { IndexStore } from "../data/indexStore";
import { RunningLogSettings } from "../data/types";
import { parseBlockSource, VALID_TYPES, BlockType } from "./blockConfig";
import { getThemePalette } from "./theme";
import { renderBarChart } from "./charts/barChart";
import { renderLineChart } from "./charts/lineChart";
import { renderHeatmap } from "./charts/heatmap";
import { renderStreak } from "./charts/streak";

class RunningLogBlock extends MarkdownRenderChild {
  private chart: Chart | null = null;

  constructor(
    private app: App,
    containerEl: HTMLElement,
    private source: string,
    private store: IndexStore,
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
    this.chart?.destroy();
    this.chart = null;
  }

  private render() {
    this.chart?.destroy();
    this.chart = null;
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
      this.chart = renderBarChart(this.containerEl, config, runs, this.settings, palette);
      return;
    }

    if (type === "pace-trend") {
      this.chart = renderLineChart(this.containerEl, config, runs, this.settings, palette);
      return;
    }
  }
}

export function createCodeBlockProcessor(
  app: App,
  store: IndexStore,
  settings: RunningLogSettings
) {
  return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    ctx.addChild(new RunningLogBlock(app, el, source, store, settings));
  };
}
