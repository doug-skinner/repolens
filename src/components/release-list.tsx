import { useState } from "react";
import { Box, useInput } from "ink";
import { ReleaseRow } from "./release-row.js";
import { openReleaseInBrowser } from "../lib/gh.js";
import type { Release } from "../lib/types.js";

interface ReleaseListProps {
  releases: Release[];
}

export function ReleaseList({ releases }: ReleaseListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((_input, key) => {
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setSelectedIndex((i) => Math.min(releases.length - 1, i + 1));
    } else if (key.return) {
      openReleaseInBrowser(releases[selectedIndex].tagName);
    }
  });

  return (
    <Box flexDirection="column">
      {releases.map((release, i) => (
        <ReleaseRow key={release.tagName} release={release} selected={i === selectedIndex} />
      ))}
    </Box>
  );
}
