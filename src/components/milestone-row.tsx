import { Box, Text } from "ink";
import { truncate } from "../lib/format.js";
import { useConfig, useTheme } from "../lib/config-context.js";
import { Columns, type ColumnDef } from "../lib/columns.js";
import type { MilestoneColumn } from "../lib/config.js";
import type { Milestone } from "../lib/types.js";

interface MilestoneRowProps {
  milestone: Milestone;
  selected: boolean;
}

function formatDue(dueOn: string | null): string {
  if (!dueOn) return "No due date";
  const due = new Date(dueOn);
  const now = new Date();
  const days = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  return `${days}d left`;
}

function progressBar(open: number, closed: number): string {
  const total = open + closed;
  if (total === 0) return "░░░░░░░░ 0/0";
  const filled = Math.round((closed / total) * 8);
  return "█".repeat(filled) + "░".repeat(8 - filled) + ` ${closed}/${total}`;
}

export function MilestoneRow({ milestone, selected }: MilestoneRowProps) {
  const { columns } = useConfig();
  const theme = useTheme();
  const total = milestone.open_issues + milestone.closed_issues;
  const pct = total > 0 ? Math.round((milestone.closed_issues / total) * 100) : 0;

  const defs: ColumnDef<MilestoneColumn>[] = [
    { key: "title", flexGrow: 1, render: () => <Text bold={selected} wrap="truncate">{truncate(milestone.title, 28)}</Text> },
    { key: "due", width: 14, render: () => <Text dimColor>{formatDue(milestone.due_on)}</Text> },
    { key: "progress", width: 20, render: () => <Text color={pct === 100 ? theme.success : theme.warning}>{progressBar(milestone.open_issues, milestone.closed_issues)}</Text> },
    { key: "percent", width: 6, render: () => <Text dimColor>{pct}%</Text> },
  ];

  return (
    <Box gap={1}>
      <Text color={selected ? theme.accent : undefined}>{selected ? "▸" : " "}</Text>
      <Columns definitions={defs} visible={columns.milestones} />
    </Box>
  );
}
