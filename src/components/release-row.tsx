import { Box, Text } from "ink";
import Link from "ink-link";
import { timeAgo, truncate } from "../lib/format.js";
import type { Release } from "../lib/types.js";

interface ReleaseRowProps {
  release: Release;
  selected: boolean;
}

function statusSymbol(release: Release): { symbol: string; color: string } | null {
  if (release.isLatest) return { symbol: "✓", color: "green" };
  if (release.isPrerelease) return { symbol: "○", color: "yellow" };
  if (release.isDraft) return { symbol: "·", color: "gray" };
  return null;
}

export function ReleaseRow({ release, selected }: ReleaseRowProps) {
  const showName = release.name && release.name !== release.tagName;
  const status = statusSymbol(release);
  const firstLine = release.body.split("\n").find((l) => l.trim()) ?? "";
  const detail = showName ? release.name : firstLine;

  return (
    <Box gap={1}>
      <Text color={selected ? "cyan" : undefined}>{selected ? "▸" : " "}</Text>
      <Box width={2}>
        {status ? <Text color={status.color}>{status.symbol}</Text> : <Text> </Text>}
      </Box>
      <Box width={20}>
        <Link url={release.url}>
          <Text bold={selected}>{truncate(release.tagName, 18)}</Text>
        </Link>
      </Box>
      <Box flexGrow={1}>
        {detail ? (
          <Text dimColor wrap="truncate">
            {detail}
          </Text>
        ) : null}
      </Box>
      <Box width={14}>
        <Text dimColor wrap="truncate">
          {truncate(release.author.login, 12)}
        </Text>
      </Box>
      {release.downloadCount > 0 && (
        <Box width={10}>
          <Text dimColor>↓ {release.downloadCount}</Text>
        </Box>
      )}
      <Box width={9}>
        <Text dimColor>{timeAgo(release.publishedAt)}</Text>
      </Box>
    </Box>
  );
}
