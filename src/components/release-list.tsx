import { useCallback } from "react";
import { Box, Text } from "ink";
import { ReleaseRow } from "./release-row.js";
import { DetailPane } from "./detail-pane.js";
import { Breadcrumb } from "./breadcrumb.js";
import { openReleaseInBrowser } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import type { Release } from "../lib/types.js";

interface ReleaseListProps {
  releases: Release[];
}

function ReleaseDetail({ release, height }: { release: Release; height: number }) {
  const title = `${release.tagName}${release.name && release.name !== release.tagName ? ` — ${release.name}` : ""}`;

  return (
    <DetailPane title={title} height={height}>
      {release.body ? (
        <Box flexDirection="column" flexGrow={1} overflow="hidden">
          <Text>{release.body}</Text>
        </Box>
      ) : (
        <Text dimColor>No release notes</Text>
      )}
    </DetailPane>
  );
}

export function ReleaseList({ releases }: ReleaseListProps) {
  const onOpen = useCallback((i: number) => openReleaseInBrowser(releases[i].tagName), [releases]);
  const onYank = useCallback((i: number) => copyToClipboard(releases[i].url), [releases]);
  const onYankRef = useCallback((i: number) => copyToClipboard(releases[i].tagName), [releases]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(releases.length, { onOpen, onYank, onYankRef });
  const visible = releases.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = releases[selectedIndex];
  const detailLabel = selected
    ? `${selected.tagName}${selected.name && selected.name !== selected.tagName ? ` — ${selected.name}` : ""}`
    : undefined;

  return (
    <Box flexDirection="column">
      <Breadcrumb view="Releases" detail={showDetail && selected ? detailLabel : undefined} />
      <Box flexDirection="column">
        {visible.map((release, i) => (
          <ReleaseRow key={release.tagName} release={release} selected={scrollOffset + i === selectedIndex} />
        ))}
      </Box>
      {showDetail && selected && (
        <ReleaseDetail release={selected} height={detailHeight} />
      )}
    </Box>
  );
}
