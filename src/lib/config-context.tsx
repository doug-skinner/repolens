import { createContext, useContext, useMemo } from "react";
import type { RepolensConfig, ThemeColors } from "./config.js";
import { resolveTheme } from "./theme.js";

const ConfigContext = createContext<RepolensConfig | null>(null);

export function ConfigProvider({ config, children }: { config: RepolensConfig; children: React.ReactNode }) {
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useConfig(): RepolensConfig {
  const config = useContext(ConfigContext);
  if (!config) throw new Error("useConfig must be used within ConfigProvider");
  return config;
}

export function useTheme(): ThemeColors {
  const config = useConfig();
  return useMemo(() => resolveTheme(config.theme), [config.theme]);
}
