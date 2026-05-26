import { App, normalizePath } from "obsidian";
import { RunSummary, RunRecord, RunningLogSettings } from "./types";

export const SCHEMA_VERSION = 2;

interface V2Index {
  schemaVersion: 2;
  generatedAt: string;
  runCount: number;
  runs: RunSummary[];
}

export function mergeRuns(
  existing: RunSummary[],
  incoming: RunSummary[]
): { runs: RunSummary[]; newCount: number } {
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
  private runs: RunSummary[] = [];
  private loaded = false;

  constructor(private app: App, private settings: RunningLogSettings) {}

  private get indexPath(): string {
    return normalizePath(`${this.settings.indexFolder}/index.json`);
  }

  async load(): Promise<void> {
    const { adapter } = this.app.vault;
    if (!(await adapter.exists(this.indexPath))) {
      this.runs = [];
      this.loaded = true;
      return;
    }
    try {
      const raw = await adapter.read(this.indexPath);
      const parsed = JSON.parse(raw);
      if (parsed.schemaVersion === 1) {
        // Migrate v1 RunRecord[] → v2 RunSummary[]
        const v1runs = (parsed.runs ?? []) as RunRecord[];
        this.runs = v1runs.map((r) => ({
          ...r,
          hasRoute: false,
          hasSeries: false,
          hasLaps: false,
        }));
        await this.save();
      } else {
        this.runs = (parsed as V2Index).runs ?? [];
      }
    } catch {
      this.runs = [];
    }
    this.loaded = true;
  }

  hasIndex(): boolean {
    return this.loaded && this.runs.length > 0;
  }

  getRuns(): RunSummary[] {
    return this.runs;
  }

  async upsertRun(summary: RunSummary): Promise<void> {
    const { runs } = mergeRuns(this.runs, [summary]);
    this.runs = runs;
    await this.save();
  }

  private async save(): Promise<void> {
    const { adapter } = this.app.vault;
    const folder = normalizePath(this.settings.indexFolder);
    if (!(await adapter.exists(folder))) {
      await adapter.mkdir(folder);
    }
    const index: V2Index = {
      schemaVersion: 2,
      generatedAt: new Date().toISOString(),
      runCount: this.runs.length,
      runs: this.runs,
    };
    await adapter.write(this.indexPath, JSON.stringify(index, null, 2));
  }
}
