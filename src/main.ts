import { FileSystemAdapter, MarkdownPostProcessorContext, Notice, Plugin } from "obsidian";
import * as path from "path";
import { IndexStore } from "./data/indexStore";
import { RunningLogSettings } from "./data/types";
import { parseAppleHealthXml } from "./parser/appleHealthParser";
import { DEFAULT_SETTINGS } from "./settings";

type ConfigValue = string | number | boolean;

function parseBlockConfig(source: string): Record<string, ConfigValue> {
  const config: Record<string, ConfigValue> = {};
  for (const line of source.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const raw = trimmed.slice(colonIdx + 1).trim();
    if (raw === "true") config[key] = true;
    else if (raw === "false") config[key] = false;
    else if (raw !== "" && !isNaN(Number(raw))) config[key] = Number(raw);
    else config[key] = raw;
  }
  return config;
}

export default class RunningLogPlugin extends Plugin {
  settings: RunningLogSettings = { ...DEFAULT_SETTINGS };
  store!: IndexStore;

  async onload() {
    await this.loadSettings();

    this.store = new IndexStore(this.app, this.settings);
    await this.store.load();

    this.registerMarkdownCodeBlockProcessor(
      "running-log",
      (source: string, el: HTMLElement, _ctx: MarkdownPostProcessorContext) => {
        const config = parseBlockConfig(source);
        el.createEl("pre").setText(JSON.stringify(config, null, 2));
      }
    );

    this.addCommand({
      id: "import-apple-health",
      name: "Import Apple Health runs",
      callback: () => void this.runImport(),
    });
  }

  onunload() {}

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
      notice.setMessage(
        `Running Log: Imported ${records.length} runs (${newCount} new).`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("ENOENT")) {
        notice.setMessage(
          `Running Log: Export not found. Drop ${this.settings.exportFileName} into ${this.settings.indexFolder}/ and try again.`
        );
      } else {
        notice.setMessage(`Running Log: Import failed — ${msg}`);
      }
    }
  }
}
