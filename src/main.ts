import { Plugin, MarkdownPostProcessorContext } from "obsidian";

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
  async onload() {
    this.registerMarkdownCodeBlockProcessor(
      "running-log",
      (source: string, el: HTMLElement, _ctx: MarkdownPostProcessorContext) => {
        const config = parseBlockConfig(source);
        el.createEl("pre").setText(JSON.stringify(config, null, 2));
      }
    );
  }

  onunload() {}
}
