import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { RunningLogSettings } from "./data/types";

export const DEFAULT_SETTINGS: RunningLogSettings = {
  indexFolder: "running-log",
  inboxFolder: "running-log/inbox",
  autoImport: true,
  routeMaxPoints: 500,
  displayUnit: "mi",
  weekStartsOn: "monday",
  minRunDistance: 0,
};

type SaveFn = () => Promise<void>;

export class RunningLogSettingsTab extends PluginSettingTab {
  constructor(
    app: App,
    plugin: Plugin,
    private settings: RunningLogSettings,
    private save: SaveFn
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Running Log" });

    // ── Inbox ──────────────────────────────────────────────────────────────

    containerEl.createEl("h3", { text: "Inbox" });

    new Setting(containerEl)
      .setName("Index folder")
      .setDesc("Vault folder where index.json and run detail files are stored.")
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
      .setName("Inbox folder")
      .setDesc("Vault folder to watch for incoming .fit files. Processed files move to inbox/processed/.")
      .addText((text) =>
        text
          .setPlaceholder("running-log/inbox")
          .setValue(this.settings.inboxFolder)
          .onChange(async (value) => {
            this.settings.inboxFolder = value.trim() || DEFAULT_SETTINGS.inboxFolder;
            await this.save();
          })
      );

    new Setting(containerEl)
      .setName("Auto-import")
      .setDesc("Automatically import .fit files when they appear in the inbox folder.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.settings.autoImport)
          .onChange(async (value) => {
            this.settings.autoImport = value;
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
      .setDesc("Runs shorter than this are ignored. Useful to filter short walks or accidental recordings.")
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

    // ── Advanced ───────────────────────────────────────────────────────────

    containerEl.createEl("h3", { text: "Advanced" });

    new Setting(containerEl)
      .setName("Route max points")
      .setDesc("Maximum GPS points stored per run for route maps. Lower values reduce file size.")
      .addText((text) => {
        text
          .setPlaceholder("500")
          .setValue(String(this.settings.routeMaxPoints));
        text.inputEl.type = "number";
        text.inputEl.min = "50";
        text.inputEl.max = "2000";
        text.onChange(async (value) => {
          const n = parseInt(value, 10);
          this.settings.routeMaxPoints = isNaN(n) ? DEFAULT_SETTINGS.routeMaxPoints : Math.max(50, Math.min(2000, n));
          await this.save();
        });
        return text;
      });
  }
}
