import { Box, Text } from "ink";
import { CheckBadge, ReviewBadge, SizeBadge } from "./status-badge.js";
import { timeAgo, summarizeChecks, truncate } from "../lib/format.js";
import { useConfig, useTheme } from "../lib/config-context.js";
import { Columns, type ColumnDef } from "../lib/columns.js";
import type { PrColumn } from "../lib/config.js";
import type { PullRequest } from "../lib/types.js";

interface PrRowProps {
  pr: PullRequest;
  selected: boolean;
  marked?: boolean;
  stale?: boolean;
}

export function PrRow({ pr, selected, marked, stale }: PrRowProps) {
  const { columns } = useConfig();
  const theme = useTheme();
  const dim = stale && !selected;

  const indicator = selected ? "▸" : marked ? "●" : " ";

  const defs: ColumnDef<PrColumn>[] = [
    { key: "number", width: 6, render: () => <Text dimColor>#{pr.number}</Text> },
    { key: "title", flexGrow: 1, render: () => <Text bold={selected} dimColor={dim} wrap="truncate">{pr.isDraft ? <Text dimColor>[draft] </Text> : null}{pr.title}</Text> },
    { key: "author", width: 14, render: () => <Text dimColor wrap="truncate">{truncate(pr.author.login, 12)}</Text> },
    { key: "branch", width: 20, render: () => <Text color={dim ? undefined : theme.branch} dimColor={dim} wrap="truncate">{truncate(pr.headRefName, 18)}</Text> },
    { key: "checks", width: 9, render: () => dim ? <Text dimColor>—</Text> : <CheckBadge summary={summarizeChecks(pr.statusCheckRollup)} /> },
    { key: "review", width: 11, render: () => dim ? <Text dimColor>—</Text> : <ReviewBadge decision={pr.reviewDecision} /> },
    { key: "size", width: 4, render: () => dim ? <Text dimColor>—</Text> : <SizeBadge linesChanged={pr.additions + pr.deletions} /> },
    { key: "time", width: 9, render: () => <Text dimColor>{timeAgo(pr.createdAt)}</Text> },
  ];

  return (
    <Box gap={1}>
      <Text color={selected ? theme.accent : marked ? theme.info : undefined}>{indicator}</Text>
      <Columns definitions={defs} visible={columns.prs} />
    </Box>
  );
}
