import { App, normalizePath } from "obsidian";
import { RunDetail, RunningLogSettings } from "./types";

export class DetailStore {
  constructor(private app: App, private settings: RunningLogSettings) {}

  private detailPath(id: string): string {
    return normalizePath(`${this.settings.indexFolder}/detail/${id}.json`);
  }

  async read(id: string): Promise<RunDetail | null> {
    const { adapter } = this.app.vault;
    const p = this.detailPath(id);
    if (!(await adapter.exists(p))) return null;
    try {
      return JSON.parse(await adapter.read(p)) as RunDetail;
    } catch {
      return null;
    }
  }

  async write(detail: RunDetail): Promise<void> {
    const { adapter } = this.app.vault;
    const dir = normalizePath(`${this.settings.indexFolder}/detail`);
    if (!(await adapter.exists(dir))) {
      await adapter.mkdir(dir);
    }
    await adapter.write(this.detailPath(detail.id), JSON.stringify(detail));
  }
}
