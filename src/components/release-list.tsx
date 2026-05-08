import { useCallback } from "react";
import { Box } from "ink";
import { ReleaseRow } from "./release-row.js";
import { openReleaseInBrowser } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import type { Release } from "../lib/types.js";

interface ReleaseListProps {
  releases: Release[];
}

export function ReleaseList({ releases }: ReleaseListProps) {
  const onSelect = useCallback((i: number) => openReleaseInBrowser(releases[i].tagName), [releases]);
  const onYank = useCallback((i: number) => copyToClipboard(releases[i].url), [releases]);
  const onYankRef = useCallback((i: number) => copyToClipboard(releases[i].tagName), [releases]);
  const { selectedIndex, scrollOffset, viewportHeight } = useListNavigation(releases.length, { onSelect, onYank, onYankRef });
  const visible = releases.slice(scrollOffset, scrollOffset + viewportHeight);

  return (
    <Box flexDirection="column">
      {visible.map((release, i) => (
        <ReleaseRow key={release.tagName} release={release} selected={scrollOffset + i === selectedIndex} />
      ))}
    </Box>
  );
}
