// Minimal Obsidian stub for vitest. Only the symbols used by src/ need to be here.
export class App {}
export class Plugin {}
export class Notice {
  constructor(_msg: string, _duration?: number) {}
  setMessage(_msg: string) { return this; }
  hide() {}
}
export class FileSystemAdapter {
  getBasePath() { return ""; }
}
export function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}
