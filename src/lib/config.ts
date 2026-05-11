import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export type PrColumn = "number" | "title" | "author" | "branch" | "checks" | "review" | "size" | "time";
export type IssueColumn = "number" | "title" | "author" | "labels" | "time";
export type RunColumn = "status" | "workflow" | "title" | "branch" | "time";
export type MilestoneColumn = "title" | "due" | "progress" | "percent";
export type ReleaseColumn = "status" | "tag" | "detail" | "author" | "downloads" | "time";

export type DashboardSection = "prs" | "issues" | "actions" | "milestones" | "releases";
export type MilestoneSortKey = "version" | "due" | "progress" | "title";

export interface ThemeColors {
  accent: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  branch: string;
  muted: string;
}

export type ThemePreset = "dark" | "light";

export interface ThemeConfig {
  preset: ThemePreset;
  overrides: Partial<ThemeColors>;
}

export interface RepolensConfig {
  staleDays: number;
  refreshInterval: number;
  columns: {
    prs: Record<PrColumn, boolean>;
    issues: Record<IssueColumn, boolean>;
    actions: Record<RunColumn, boolean>;
    milestones: Record<MilestoneColumn, boolean>;
    releases: Record<ReleaseColumn, boolean>;
  };
  dashboard: {
    sections: DashboardSection[];
  };
  theme: ThemeConfig;
  milestoneSort: MilestoneSortKey;
}

export const DEFAULT_CONFIG: RepolensConfig = {
  staleDays: 14,
  refreshInterval: 30,
  columns: {
    prs: { number: true, title: true, author: true, branch: true, checks: true, review: true, size: true, time: true },
    issues: { number: true, title: true, author: true, labels: true, time: true },
    actions: { status: true, workflow: true, title: true, branch: true, time: true },
    milestones: { title: true, due: true, progress: true, percent: true },
    releases: { status: true, tag: true, detail: true, author: true, downloads: true, time: true },
  },
  dashboard: {
    sections: ["prs", "issues", "actions", "milestones", "releases"],
  },
  theme: {
    preset: "dark",
    overrides: {},
  },
  milestoneSort: "version",
};

function deepMerge<T extends Record<string, unknown>>(defaults: T, overrides: Record<string, unknown>): T {
  const result = { ...defaults };
  for (const key of Object.keys(overrides)) {
    const defaultVal = (defaults as Record<string, unknown>)[key];
    const overrideVal = overrides[key];
    if (
      defaultVal !== null &&
      overrideVal !== null &&
      typeof defaultVal === "object" &&
      typeof overrideVal === "object" &&
      !Array.isArray(defaultVal) &&
      !Array.isArray(overrideVal)
    ) {
      (result as Record<string, unknown>)[key] = deepMerge(
        defaultVal as Record<string, unknown>,
        overrideVal as Record<string, unknown>,
      );
    } else {
      (result as Record<string, unknown>)[key] = overrideVal;
    }
  }
  return result;
}

function enforceSafetyRails(config: RepolensConfig): void {
  config.columns.prs.title = true;
  config.columns.issues.title = true;
  config.columns.actions.status = true;
  config.columns.actions.title = true;
  config.columns.milestones.title = true;
  config.columns.releases.tag = true;
}

function resolveConfigPath(): string | null {
  const xdgHome = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  const xdgPath = join(xdgHome, "repolens", "config.json");
  if (existsSync(xdgPath)) return xdgPath;

  const homePath = join(homedir(), ".repolens.json");
  if (existsSync(homePath)) return homePath;

  return null;
}

export function loadConfig(): RepolensConfig {
  const configPath = resolveConfigPath();
  let userConfig: Record<string, unknown> = {};

  if (configPath) {
    try {
      const raw = readFileSync(configPath, "utf-8");
      userConfig = JSON.parse(raw);
    } catch {
      console.error(`Warning: Could not parse config at ${configPath}, using defaults.`);
    }
  }

  const config = deepMerge(DEFAULT_CONFIG as unknown as Record<string, unknown>, userConfig) as unknown as RepolensConfig;

  const envStaleDays = process.env.REPOLENS_STALE_DAYS;
  if (envStaleDays !== undefined) {
    config.staleDays = Number(envStaleDays);
  }

  enforceSafetyRails(config);

  return config;
}
