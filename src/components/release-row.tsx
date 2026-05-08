import { Box, Text } from "ink";
import { timeAgo, truncate } from "../lib/format.js";
import type { Release } from "../lib/types.js";

interface ReleaseRowProps {
  release: Release;
  selected: boolean;
}

export function ReleaseRow({ release, selected }: ReleaseRowProps) {
  return (
    <Box gap={1}>
      <Text color={selected ? "cyan" : undefined}>{selected ? "▸" : " "}</Text>
      <Box width={20}>
        <Text bold={selected} wrap="truncate">
          {truncate(release.tagName, 18)}
        </Text>
      </Box>
      <Box width={40}>
        <Text dimColor wrap="truncate">
          {truncate(release.name, 38)}
        </Text>
      </Box>
      <Box width={9}>
        <Text dimColor>{timeAgo(release.publishedAt)}</Text>
      </Box>
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
    </Box>
  );
}
