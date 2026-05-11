import { Box, Text } from "ink";
import { timeAgo, truncate } from "../lib/format.js";
import { useConfig, useTheme } from "../lib/config-context.js";
import { Columns, type ColumnDef } from "../lib/columns.js";
import type { ReleaseColumn } from "../lib/config.js";
import type { Release } from "../lib/types.js";

interface ReleaseRowProps {
  release: Release;
  selected: boolean;
  stale?: boolean;
}

export function ReleaseRow({ release, selected, stale }: ReleaseRowProps) {
  const { columns } = useConfig();
  const theme = useTheme();
  const dim = stale && !selected;
  const showName = release.name && release.name !== release.tagName;
  const firstLine = release.body.split("\n").find((l) => l.trim()) ?? "";
  const detail = showName ? release.name : firstLine;

  function statusSymbol(): { symbol: string; color: string } | null {
    if (release.isLatest) return { symbol: "✓", color: theme.success };
    if (release.isPrerelease) return { symbol: "○", color: theme.warning };
    if (release.isDraft) return { symbol: "·", color: theme.muted };
    return null;
  }

  const status = statusSymbol();

  const defs: ColumnDef<ReleaseColumn>[] = [
    { key: "status", width: 2, render: () => status ? <Text color={dim ? undefined : status.color} dimColor={dim}>{status.symbol}</Text> : <Text> </Text> },
    { key: "tag", width: 20, render: () => <Text bold={selected} dimColor={dim}>{truncate(release.tagName, 18)}</Text> },
    { key: "detail", flexGrow: 1, render: () => detail ? <Text dimColor wrap="truncate">{detail}</Text> : null },
    { key: "author", width: 14, render: () => <Text dimColor wrap="truncate">{truncate(release.author.login, 12)}</Text> },
    { key: "downloads", width: 10, render: () => release.downloadCount > 0 ? <Text dimColor>↓ {release.downloadCount}</Text> : null },
    { key: "time", width: 9, render: () => <Text dimColor>{timeAgo(release.publishedAt)}</Text> },
  ];

  return (
    <Box gap={1}>
      <Text color={selected ? theme.accent : undefined}>{selected ? "▸" : " "}</Text>
      <Columns definitions={defs} visible={columns.releases} />
    </Box>
  );
}
