import { useCallback, useMemo } from "react";
import { Box, Text } from "ink";
import { ReleaseRow } from "./release-row.js";
import { DetailPane } from "./detail-pane.js";
import { Breadcrumb } from "./breadcrumb.js";
import { FilterInput } from "./filter-input.js";
import { openReleaseInBrowser } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import { useListFilter } from "../hooks/use-list-filter.js";
import { matchesFilter } from "../lib/filter.js";
import type { Release } from "../lib/types.js";

interface ReleaseListProps {
  releases: Release[];
  onFilteringChange?: (editing: boolean) => void;
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

export function ReleaseList({ releases, onFilteringChange }: ReleaseListProps) {
  const filter = useListFilter(onFilteringChange);
  const filtered = useMemo(
    () => releases.filter((r) =>
      matchesFilter(r.tagName, filter.filterQuery) ||
      (r.name && matchesFilter(r.name, filter.filterQuery)),
    ),
    [releases, filter.filterQuery],
  );

  const onOpen = useCallback((i: number) => openReleaseInBrowser(filtered[i].tagName), [filtered]);
  const onYank = useCallback((i: number) => copyToClipboard(filtered[i].url), [filtered]);
  const onYankRef = useCallback((i: number) => copyToClipboard(filtered[i].tagName), [filtered]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(filtered.length, { onOpen, onYank, onYankRef, filter });
  const visible = filtered.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = filtered[selectedIndex];
  const detailLabel = selected
    ? `${selected.tagName}${selected.name && selected.name !== selected.tagName ? ` — ${selected.name}` : ""}`
    : undefined;

  return (
    <Box flexDirection="column">
      <Breadcrumb view="Releases" detail={showDetail && selected ? detailLabel : undefined} />
      <FilterInput query={filter.filterQuery} isEditing={filter.isEditing} resultCount={filtered.length} totalCount={releases.length} />
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
