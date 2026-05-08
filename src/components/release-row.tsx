import { Box, Text } from "ink";
import Link from "ink-link";
import { timeAgo, truncate } from "../lib/format.js";
import type { Release } from "../lib/types.js";

interface ReleaseRowProps {
  release: Release;
  selected: boolean;
}

export function ReleaseRow({ release, selected }: ReleaseRowProps) {
  const showName = release.name && release.name !== release.tagName;

  return (
    <Box gap={1}>
      <Text color={selected ? "cyan" : undefined}>{selected ? "▸" : " "}</Text>
      <Box width={20}>
        <Link url={release.url}>
          <Text bold={selected}>{truncate(release.tagName, 18)}</Text>
        </Link>
      </Box>
      {showName ? (
        <Box flexGrow={1}>
          <Text dimColor wrap="truncate">
            {release.name}
          </Text>
        </Box>
      ) : (
        <Box flexGrow={1} />
      )}
      {release.isLatest && (
        <Box>
          <Text color="green">latest</Text>
        </Box>
      )}
      {release.isPrerelease && (
        <Box>
          <Text color="yellow">pre-release</Text>
        </Box>
      )}
      {release.isDraft && (
        <Box>
          <Text color="gray">draft</Text>
        </Box>
      )}
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
