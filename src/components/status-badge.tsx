import { Text } from "ink";
import Spinner from "ink-spinner";
import { useTheme } from "../lib/config-context.js";
import type { ThemeColors } from "../lib/config.js";
import type { CheckSummary } from "../lib/types.js";

function checkBadge(summary: CheckSummary, theme: ThemeColors): React.JSX.Element {
  switch (summary) {
    case "pass": return <Text color={theme.success}>✓ checks</Text>;
    case "fail": return <Text color={theme.error}>✗ checks</Text>;
    case "running": return <Text color={theme.warning}><Spinner type="dots" /> checks</Text>;
    case "pending": return <Text color={theme.warning}>○ checks</Text>;
    case "none": return <Text dimColor>— checks</Text>;
  }
}

function reviewBadge(decision: string, theme: ThemeColors): React.JSX.Element | null {
  switch (decision) {
    case "APPROVED": return <Text color={theme.success}>✓ approved</Text>;
    case "CHANGES_REQUESTED": return <Text color={theme.error}>✗ changes </Text>;
    case "REVIEW_REQUIRED": return <Text color={theme.warning}>● review  </Text>;
    default: return null;
  }
}

export function CheckBadge({ summary }: { summary: CheckSummary }) {
  const theme = useTheme();
  return checkBadge(summary, theme);
}

export function ReviewBadge({ decision }: { decision: string }) {
  const theme = useTheme();
  const badge = reviewBadge(decision, theme);
  if (!badge) return <Text dimColor>— review  </Text>;
  return badge;
}

function prSize(linesChanged: number): { label: string; color: "success" | "warning" | "info" | "error" } {
  if (linesChanged < 50) return { label: "S", color: "success" };
  if (linesChanged < 250) return { label: "M", color: "warning" };
  if (linesChanged < 1000) return { label: "L", color: "info" };
  return { label: "XL", color: "error" };
}

export function SizeBadge({ linesChanged }: { linesChanged: number }) {
  const theme = useTheme();
  const { label, color } = prSize(linesChanged);
  return <Text color={theme[color]}>{label}</Text>;
}
