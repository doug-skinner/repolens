import type { ThemeColors, ThemeConfig } from "./config.js";

const DARK_THEME: ThemeColors = {
  accent: "cyan",
  success: "green",
  error: "red",
  warning: "yellow",
  info: "magenta",
  branch: "cyan",
  muted: "gray",
};

const LIGHT_THEME: ThemeColors = {
  accent: "blue",
  success: "green",
  error: "red",
  warning: "#b58900",
  info: "magenta",
  branch: "blue",
  muted: "gray",
};

export function resolveTheme(config: ThemeConfig): ThemeColors {
  const base = config.preset === "light" ? LIGHT_THEME : DARK_THEME;
  return { ...base, ...config.overrides };
}
