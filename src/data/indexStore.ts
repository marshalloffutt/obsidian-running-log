import { App, normalizePath } from "obsidian";
import { RunRecord, RunIndex, RunningLogSettings } from "./types";

export const SCHEMA_VERSION = 1;

/**
 * Pure merge: upsert incoming runs into existing by id.
 * Returns the deduplicated, ascending-sorted result and a count of genuinely new ids.
 */
export function mergeRuns(
  existing: RunRecord[],
  incoming: RunRecord[]
): { runs: RunRecord[]; newCount: number } {
  const byId = new Map(existing.map((r) => [r.id, r]));
  let newCount = 0;
  for (const r of incoming) {
    if (!byId.has(r.id)) newCount++;
    byId.set(r.id, r);
  }
  const runs = Array.from(byId.values()).sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );
  return { runs, newCount };
}

export class IndexStore {
  private index: RunIndex | null = null;

  constructor(private app: App, private settings: RunningLogSettings) {}

  private get indexPath(): string {
    return normalizePath(`${this.settings.indexFolder}/runs.json`);
  }

  async load(): Promise<void> {
    const { adapter } = this.app.vault;
    if (!(await adapter.exists(this.indexPath))) {
      this.index = null;
      return;
    }
    try {
      const raw = await adapter.read(this.indexPath);
      this.index = JSON.parse(raw) as RunIndex;
    } catch {
      this.index = null;
    }
  }

  getRuns(): RunRecord[] {
    return this.index?.runs ?? [];
  }

  async importRuns(incoming: RunRecord[]): Promise<number> {
    const { runs, newCount } = mergeRuns(this.getRuns(), incoming);
    this.index = {
      schemaVersion: SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      source: "apple-health-xml",
      sourceExportDate: new Date().toISOString(),
      runCount: runs.length,
      runs,
    };
    await this.save();
    return newCount;
  }

  private async save(): Promise<void> {
    const { adapter } = this.app.vault;
    const folder = normalizePath(this.settings.indexFolder);
    if (!(await adapter.exists(folder))) {
      await adapter.mkdir(folder);
    }
    await adapter.write(this.indexPath, JSON.stringify(this.index, null, 2));
  }
}
