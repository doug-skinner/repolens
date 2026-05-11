import { Box, Text } from "ink";
import { timeAgo, truncate } from "../lib/format.js";
import { useConfig, useTheme } from "../lib/config-context.js";
import { Columns, type ColumnDef } from "../lib/columns.js";
import type { CommitColumn } from "../lib/config.js";
import type { Commit } from "../lib/types.js";

interface CommitRowProps {
  commit: Commit;
  selected: boolean;
  stale?: boolean;
}

export function CommitRow({ commit, selected, stale }: CommitRowProps) {
  const { columns } = useConfig();
  const theme = useTheme();
  const dim = stale && !selected;

  const defs: ColumnDef<CommitColumn>[] = [
    { key: "hash", width: 9, render: () => <Text color={dim ? undefined : theme.warning} dimColor={dim}>{commit.hash.slice(0, 7)}</Text> },
    { key: "message", flexGrow: 1, render: () => <Text bold={selected} dimColor={dim} wrap="truncate">{commit.message}</Text> },
    { key: "author", width: 14, render: () => <Text dimColor wrap="truncate">{truncate(commit.author, 12)}</Text> },
    { key: "time", width: 9, render: () => <Text dimColor>{timeAgo(commit.date)}</Text> },
  ];

  return (
    <Box gap={1}>
      <Text color={selected ? theme.accent : undefined}>{selected ? "▸" : " "}</Text>
      <Columns definitions={defs} visible={columns.commits} />
    </Box>
  );
}
