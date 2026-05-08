import { useCallback } from "react";
import { Box } from "ink";
import { ReleaseRow } from "./release-row.js";
import { openReleaseInBrowser } from "../lib/gh.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import type { Release } from "../lib/types.js";

interface ReleaseListProps {
  releases: Release[];
}

export function ReleaseList({ releases }: ReleaseListProps) {
  const onSelect = useCallback((i: number) => openReleaseInBrowser(releases[i].tagName), [releases]);
  const selectedIndex = useListNavigation(releases.length, onSelect);

  return (
    <Box flexDirection="column">
      {releases.map((release, i) => (
        <ReleaseRow key={release.tagName} release={release} selected={i === selectedIndex} />
      ))}
    </Box>
  );
}
