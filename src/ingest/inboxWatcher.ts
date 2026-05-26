import { App, EventRef, Notice, TAbstractFile, TFile, normalizePath } from "obsidian";
import { RunningLogSettings } from "../data/types";
import { IndexStore } from "../data/indexStore";
import { DetailStore } from "../data/detailStore";
import { parseFitBuffer } from "./fitImporter";

export class InboxWatcher {
  private eventRef: EventRef | null = null;

  constructor(
    private app: App,
    private settings: RunningLogSettings,
    private indexStore: IndexStore,
    private detailStore: DetailStore
  ) {}

  start(): void {
    this.eventRef = this.app.vault.on("create", (file: TAbstractFile) => {
      if (file instanceof TFile && this.isInboxFit(file.path)) {
        void this.processFile(file.path);
      }
    });
  }

  stop(): void {
    if (this.eventRef) {
      this.app.vault.offref(this.eventRef);
      this.eventRef = null;
    }
  }

  async scanExisting(): Promise<void> {
    const { adapter } = this.app.vault;
    const inbox = normalizePath(this.settings.inboxFolder);
    if (!(await adapter.exists(inbox))) return;

    const { files } = await adapter.list(inbox);
    const fits = files.filter((p) => this.isFitExtension(p));
    for (const p of fits) {
      await this.processFile(p);
    }
  }

  private isInboxFit(vaultPath: string): boolean {
    const inbox = normalizePath(this.settings.inboxFolder);
    const processed = normalizePath(`${this.settings.inboxFolder}/processed`);
    return (
      vaultPath.startsWith(inbox + "/") &&
      !vaultPath.startsWith(processed + "/") &&
      this.isFitExtension(vaultPath)
    );
  }

  private isFitExtension(p: string): boolean {
    return p.endsWith(".fit") || p.endsWith(".fit.gz");
  }

  private async processFile(vaultPath: string): Promise<void> {
    const { adapter } = this.app.vault;
    try {
      const arrayBuf = await adapter.readBinary(vaultPath);
      const buffer = Buffer.from(arrayBuf);
      const result = await parseFitBuffer(buffer, {
        routeMaxPoints: this.settings.routeMaxPoints,
      });

      if (!result) {
        // Non-running activity — move to processed without importing
        await this.moveToProcessed(vaultPath);
        return;
      }

      await this.indexStore.upsertRun(result.summary);
      await this.detailStore.write(result.detail);
      await this.moveToProcessed(vaultPath);

      new Notice(`Running Log: imported ${this.describeRun(result.summary)}`, 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      new Notice(`Running Log: failed to import ${vaultPath} — ${msg}`, 6000);
    }
  }

  private async moveToProcessed(vaultPath: string): Promise<void> {
    const { adapter } = this.app.vault;
    const filename = vaultPath.split("/").pop()!;
    const processedDir = normalizePath(`${this.settings.inboxFolder}/processed`);
    if (!(await adapter.exists(processedDir))) {
      await adapter.mkdir(processedDir);
    }
    const dest = normalizePath(`${processedDir}/${filename}`);
    await adapter.copy(vaultPath, dest);
    await adapter.remove(vaultPath);
  }

  private describeRun(s: { distanceMeters: number; durationSeconds: number }): string {
    const km = (s.distanceMeters / 1000).toFixed(2);
    const min = Math.round(s.durationSeconds / 60);
    return `${km} km run (${min} min)`;
  }
}
