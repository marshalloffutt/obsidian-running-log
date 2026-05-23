import { App, PluginSettingTab, Setting } from "obsidian";
import { RunningLogSettings } from "./data/types";

export const DEFAULT_SETTINGS: RunningLogSettings = {
  indexFolder: "running-log",
  exportFileName: "export.xml",
  displayUnit: "mi",
  weekStartsOn: "monday",
  minRunDistance: 0,
};

type SaveFn = () => Promise<void>;

export class RunningLogSettingsTab extends PluginSettingTab {
  constructor(
    app: App,
    private settings: RunningLogSettings,
    private save: SaveFn
  ) {
    // PluginSettingTab requires the plugin instance; we pass null cast as Plugin
    // because we only need app + containerEl from the parent class at runtime.
    // The actual plugin reference is passed via the Obsidian framework.
    super(app, null as never);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Running Log" });

    // ── Import ─────────────────────────────────────────────────────────────

    containerEl.createEl("h3", { text: "Import" });

    new Setting(containerEl)
      .setName("Index folder")
      .setDesc("Vault folder where runs.json is stored and export.xml is expected. Takes effect on next import.")
      .addText((text) =>
        text
          .setPlaceholder("running-log")
          .setValue(this.settings.indexFolder)
          .onChange(async (value) => {
            this.settings.indexFolder = value.trim() || DEFAULT_SETTINGS.indexFolder;
            await this.save();
          })
      );

    new Setting(containerEl)
      .setName("Export file name")
      .setDesc("Name of the Apple Health export file dropped into the index folder.")
      .addText((text) =>
        text
          .setPlaceholder("export.xml")
          .setValue(this.settings.exportFileName)
          .onChange(async (value) => {
            this.settings.exportFileName = value.trim() || DEFAULT_SETTINGS.exportFileName;
            await this.save();
          })
      );

    // ── Display ────────────────────────────────────────────────────────────

    containerEl.createEl("h3", { text: "Display" });

    new Setting(containerEl)
      .setName("Distance unit")
      .setDesc("Miles or kilometres. Can be overridden per block with unit: mi / unit: km.")
      .addDropdown((drop) =>
        drop
          .addOption("mi", "Miles")
          .addOption("km", "Kilometres")
          .setValue(this.settings.displayUnit)
          .onChange(async (value) => {
            this.settings.displayUnit = value as "mi" | "km";
            await this.save();
          })
      );

    new Setting(containerEl)
      .setName("Week starts on")
      .setDesc("Affects weekly mileage buckets and run streaks.")
      .addDropdown((drop) =>
        drop
          .addOption("monday", "Monday")
          .addOption("sunday", "Sunday")
          .setValue(this.settings.weekStartsOn)
          .onChange(async (value) => {
            this.settings.weekStartsOn = value as "monday" | "sunday";
            await this.save();
          })
      );

    new Setting(containerEl)
      .setName("Default goal")
      .setDesc("Default goal line for mileage charts (in the selected distance unit). Leave blank for none.")
      .addText((text) => {
        text
          .setPlaceholder("e.g. 30")
          .setValue(this.settings.defaultGoal != null ? String(this.settings.defaultGoal) : "");
        text.inputEl.type = "number";
        text.inputEl.min = "0";
        text.onChange(async (value) => {
          const n = parseFloat(value);
          this.settings.defaultGoal = value.trim() === "" || isNaN(n) ? undefined : n;
          await this.save();
        });
        return text;
      });

    new Setting(containerEl)
      .setName("Minimum run distance (meters)")
      .setDesc("Runs shorter than this are ignored. Use 400 to filter phantom workouts recorded by Apple Health.")
      .addText((text) => {
        text
          .setPlaceholder("0")
          .setValue(String(this.settings.minRunDistance));
        text.inputEl.type = "number";
        text.inputEl.min = "0";
        text.onChange(async (value) => {
          const n = parseFloat(value);
          this.settings.minRunDistance = isNaN(n) ? 0 : Math.max(0, n);
          await this.save();
        });
        return text;
      });
  }
}
