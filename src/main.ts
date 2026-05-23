import { FileSystemAdapter, Notice, Plugin } from "obsidian";
import * as path from "path";
import { IndexStore } from "./data/indexStore";
import { RunningLogSettings } from "./data/types";
import { parseAppleHealthXml } from "./parser/appleHealthParser";
import { createCodeBlockProcessor } from "./render/codeBlockProcessor";
import { DEFAULT_SETTINGS, RunningLogSettingsTab } from "./settings";

export default class RunningLogPlugin extends Plugin {
  settings: RunningLogSettings = { ...DEFAULT_SETTINGS };
  store!: IndexStore;

  async onload() {
    await this.loadSettings();

    this.store = new IndexStore(this.app, this.settings);
    await this.store.load();

    this.registerMarkdownCodeBlockProcessor(
      "running-log",
      createCodeBlockProcessor(this.app, this.store, this.settings)
    );

    this.addCommand({
      id: "import-apple-health",
      name: "Import Apple Health runs",
      callback: () => void this.runImport(),
    });

    this.addSettingTab(
      new RunningLogSettingsTab(this.app, this, this.settings, () => this.saveSettings())
    );
  }

  onunload() {}

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async loadSettings() {
    const saved = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved ?? {});
  }

  private async runImport() {
    const adapter = this.app.vault.adapter as FileSystemAdapter;
    const exportPath = path.join(
      adapter.getBasePath(),
      this.settings.indexFolder,
      this.settings.exportFileName
    );

    const notice = new Notice("Running Log: Importing…", 0);

    try {
      const records = await parseAppleHealthXml(exportPath);
      const newCount = await this.store.importRuns(records);
      notice.hide();
      new Notice(`Running Log: Imported ${records.length} runs (${newCount} new).`, 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notice.hide();
      if (msg.includes("ENOENT")) {
        new Notice(
          `Running Log: Export not found. Drop ${this.settings.exportFileName} into ${this.settings.indexFolder}/ and try again.`,
          6000
        );
      } else {
        new Notice(`Running Log: Import failed — ${msg}`, 6000);
      }
    }
  }
}
