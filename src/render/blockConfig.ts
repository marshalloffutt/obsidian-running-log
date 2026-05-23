type ConfigValue = string | number | boolean;

export type BlockType =
  | "weekly-mileage"
  | "monthly-mileage"
  | "pace-trend"
  | "heatmap"
  | "streak";

export const VALID_TYPES: BlockType[] = [
  "weekly-mileage",
  "monthly-mileage",
  "pace-trend",
  "heatmap",
  "streak",
];

const KNOWN_KEYS: Record<BlockType, ReadonlySet<string>> = {
  "weekly-mileage":  new Set(["type","title","unit","from","to","last","goal","showruncount"]),
  "monthly-mileage": new Set(["type","title","unit","from","to","last","goal","showruncount"]),
  "pace-trend":      new Set(["type","title","unit","from","to","last","metric","smoothing","mindistance","trendline"]),
  "heatmap":         new Set(["type","title","unit","year","last","metric","levels"]),
  "streak":          new Set(["type","title","unit","min","showlongest"]),
};

export function parseBlockSource(source: string): {
  config: Record<string, ConfigValue>;
  warnings: string[];
} {
  const config: Record<string, ConfigValue> = {};
  for (const line of source.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const colon = trimmed.indexOf(":");
    if (colon === -1) continue;
    const key = trimmed.slice(0, colon).trim().toLowerCase();
    const raw = trimmed.slice(colon + 1).trim();
    if (raw === "true") config[key] = true;
    else if (raw === "false") config[key] = false;
    else if (raw !== "" && !isNaN(Number(raw))) config[key] = Number(raw);
    else config[key] = raw;
  }

  const warnings: string[] = [];
  const type = config["type"] as BlockType | undefined;
  if (type && KNOWN_KEYS[type]) {
    for (const key of Object.keys(config)) {
      if (!KNOWN_KEYS[type].has(key)) warnings.push(`Unknown key: "${key}"`);
    }
  }

  return { config, warnings };
}
