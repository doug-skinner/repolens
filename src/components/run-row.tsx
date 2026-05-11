import { Box, Text } from "ink";
import { timeAgo, truncate } from "../lib/format.js";
import { useConfig, useTheme } from "../lib/config-context.js";
import { Columns, type ColumnDef } from "../lib/columns.js";
import type { RunColumn } from "../lib/config.js";
import type { WorkflowRun } from "../lib/types.js";

interface RunRowProps {
  run: WorkflowRun;
  selected: boolean;
  stale?: boolean;
}

export function RunRow({ run, selected, stale }: RunRowProps) {
  const { columns } = useConfig();
  const theme = useTheme();
  const dim = stale && !selected;

  function statusSymbol(): { symbol: string; color: string } {
    if (run.status === "in_progress") return { symbol: "●", color: theme.warning };
    if (run.status === "queued" || run.status === "waiting" || run.status === "pending")
      return { symbol: "○", color: theme.warning };
    if (run.conclusion === "success") return { symbol: "✓", color: theme.success };
    if (run.conclusion === "failure") return { symbol: "✗", color: theme.error };
    if (run.conclusion === "cancelled") return { symbol: "⊘", color: theme.muted };
    return { symbol: "·", color: theme.muted };
  }

  const { symbol, color } = statusSymbol();

  const defs: ColumnDef<RunColumn>[] = [
    { key: "status", width: 2, render: () => <Text color={dim ? undefined : color} dimColor={dim}>{symbol}</Text> },
    { key: "workflow", width: 20, render: () => <Text dimColor wrap="truncate">{truncate(run.workflowName, 18)}</Text> },
    { key: "title", flexGrow: 1, render: () => <Text bold={selected} dimColor={dim} wrap="truncate">{run.displayTitle}</Text> },
    { key: "branch", width: 20, render: () => <Text color={dim ? undefined : theme.branch} dimColor={dim} wrap="truncate">{truncate(run.headBranch, 18)}</Text> },
    { key: "time", width: 9, render: () => <Text dimColor>{timeAgo(run.createdAt)}</Text> },
  ];

  return (
    <Box gap={1}>
      <Text color={selected ? theme.accent : undefined}>{selected ? "▸" : " "}</Text>
      <Columns definitions={defs} visible={columns.actions} />
    </Box>
  );
}
