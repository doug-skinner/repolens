import { Box, Text } from "ink";
import { timeAgo, truncate } from "../lib/format.js";
import { useConfig, useTheme } from "../lib/config-context.js";
import { Columns, type ColumnDef } from "../lib/columns.js";
import type { BranchColumn } from "../lib/config.js";
import type { Branch } from "../lib/types.js";

interface BranchRowProps {
  branch: Branch;
  selected: boolean;
  stale?: boolean;
}

export function BranchRow({ branch, selected, stale }: BranchRowProps) {
  const { columns } = useConfig();
  const theme = useTheme();
  const dim = stale && !selected;

  const defs: ColumnDef<BranchColumn>[] = [
    {
      key: "name",
      flexGrow: 1,
      render: () => (
        <Text bold={selected} color={dim ? undefined : theme.branch} dimColor={dim} wrap="truncate">
          {branch.isDefault ? `${branch.name} *` : branch.name}
        </Text>
      ),
    },
    {
      key: "ahead",
      width: 8,
      render: () => (
        <Text color={branch.ahead > 0 ? theme.success : undefined} dimColor={branch.ahead === 0}>
          {branch.ahead > 0 ? `+${branch.ahead}` : "—"}
        </Text>
      ),
    },
    {
      key: "behind",
      width: 8,
      render: () => (
        <Text color={branch.behind > 0 ? theme.error : undefined} dimColor={branch.behind === 0}>
          {branch.behind > 0 ? `-${branch.behind}` : "—"}
        </Text>
      ),
    },
    { key: "author", width: 14, render: () => <Text dimColor wrap="truncate">{truncate(branch.lastCommitAuthor, 12)}</Text> },
    { key: "time", width: 9, render: () => <Text dimColor>{timeAgo(branch.lastCommitDate)}</Text> },
  ];

  return (
    <Box gap={1}>
      <Text color={selected ? theme.accent : undefined}>{selected ? "▸" : " "}</Text>
      <Columns definitions={defs} visible={columns.branches} />
    </Box>
  );
}
