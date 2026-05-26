import { Notice, Plugin } from "obsidian";
import { IndexStore } from "./data/indexStore";
import { DetailStore } from "./data/detailStore";
import { RunningLogSettings } from "./data/types";
import { InboxWatcher } from "./ingest/inboxWatcher";
import { createCodeBlockProcessor } from "./render/codeBlockProcessor";
import { DEFAULT_SETTINGS, RunningLogSettingsTab } from "./settings";

export default class RunningLogPlugin extends Plugin {
  settings: RunningLogSettings = { ...DEFAULT_SETTINGS };
  store!: IndexStore;
  private detailStore!: DetailStore;
  private watcher!: InboxWatcher;

  async onload() {
    await this.loadSettings();

    this.store = new IndexStore(this.app, this.settings);
    this.detailStore = new DetailStore(this.app, this.settings);
    await this.store.load();

    this.watcher = new InboxWatcher(
      this.app,
      this.settings,
      this.store,
      this.detailStore
    );

    if (this.settings.autoImport) {
      this.watcher.start();
      // Process any .fit files already sitting in the inbox
      void this.watcher.scanExisting().catch((err) => {
        new Notice(`Running Log: inbox scan failed — ${err instanceof Error ? err.message : err}`, 5000);
      });
    }

    this.registerMarkdownCodeBlockProcessor(
      "running-log",
      createCodeBlockProcessor(this.app, this.store, this.detailStore, this.settings)
    );

    this.addSettingTab(
      new RunningLogSettingsTab(this.app, this, this.settings, () => this.saveSettings())
    );
  }

  onunload() {
    this.watcher?.stop();
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async loadSettings() {
    const saved = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved ?? {});
  }
}
