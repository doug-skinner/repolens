import { Box, Text } from "ink";
import { timeAgo, truncate } from "../lib/format.js";
import { useConfig, useTheme } from "../lib/config-context.js";
import { Columns, type ColumnDef } from "../lib/columns.js";
import type { IssueColumn } from "../lib/config.js";
import type { Issue } from "../lib/types.js";

interface IssueRowProps {
  issue: Issue;
  selected: boolean;
  marked?: boolean;
  stale?: boolean;
}

export function IssueRow({ issue, selected, marked, stale }: IssueRowProps) {
  const { columns } = useConfig();
  const theme = useTheme();
  const dim = stale && !selected;
  const labelText = issue.labels.map((l) => l.name).join(", ");

  const indicator = selected ? "▸" : marked ? "●" : " ";

  const defs: ColumnDef<IssueColumn>[] = [
    { key: "number", width: 6, render: () => <Text dimColor>#{issue.number}</Text> },
    { key: "title", flexGrow: 1, render: () => <Text bold={selected} dimColor={dim} wrap="truncate">{issue.title}</Text> },
    { key: "author", width: 14, render: () => <Text dimColor wrap="truncate">{truncate(issue.author.login, 12)}</Text> },
    { key: "labels", width: 26, render: () => <Text color={dim ? undefined : theme.warning} dimColor={dim} wrap="truncate">{truncate(labelText, 24)}</Text> },
    { key: "time", width: 9, render: () => <Text dimColor>{timeAgo(issue.createdAt)}</Text> },
  ];

  return (
    <Box gap={1}>
      <Text color={selected ? theme.accent : marked ? theme.info : undefined}>{indicator}</Text>
      <Columns definitions={defs} visible={columns.issues} />
    </Box>
  );
}
