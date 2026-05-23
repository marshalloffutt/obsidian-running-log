export interface ThemePalette {
  accent: string;
  textMuted: string;
  textFaint: string;
  border: string;
  bgSecondary: string;
}

export function getThemePalette(): ThemePalette {
  const s = getComputedStyle(document.body);
  const get = (v: string) => s.getPropertyValue(v).trim() || "#888";
  return {
    accent:      get("--interactive-accent"),
    textMuted:   get("--text-muted"),
    textFaint:   get("--text-faint"),
    border:      get("--background-modifier-border"),
    bgSecondary: get("--background-secondary"),
  };
}
