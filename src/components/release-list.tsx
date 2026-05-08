import { useState, useCallback, useMemo } from "react";
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

const RELEASE_TYPES = ["all", "stable", "prerelease", "draft"] as const;
type ReleaseType = (typeof RELEASE_TYPES)[number];

const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = {
  all: "All",
  stable: "Stable",
  prerelease: "Pre-release",
  draft: "Draft",
};

function matchesReleaseType(release: Release, type: ReleaseType): boolean {
  if (type === "all") return true;
  if (type === "draft") return release.isDraft;
  if (type === "prerelease") return release.isPrerelease;
  return !release.isDraft && !release.isPrerelease;
}

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
  const [releaseType, setReleaseType] = useState<ReleaseType>("all");

  const cycleType = useCallback(() => {
    setReleaseType((t) => RELEASE_TYPES[(RELEASE_TYPES.indexOf(t) + 1) % RELEASE_TYPES.length]);
  }, []);

  const extraKeys = useMemo(() => ({ f: cycleType }), [cycleType]);

  const filtered = useMemo(
    () => releases.filter((r) =>
      matchesReleaseType(r, releaseType) && (
        matchesFilter(r.tagName, filter.filterQuery) ||
        (r.name && matchesFilter(r.name, filter.filterQuery))
      ),
    ),
    [releases, filter.filterQuery, releaseType],
  );

  const onOpen = useCallback((i: number) => openReleaseInBrowser(filtered[i].tagName), [filtered]);
  const onYank = useCallback((i: number) => copyToClipboard(filtered[i].url), [filtered]);
  const onYankRef = useCallback((i: number) => copyToClipboard(filtered[i].tagName), [filtered]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(filtered.length, { onOpen, onYank, onYankRef, filter, extraKeys, resetTrigger: releaseType });
  const visible = filtered.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = filtered[selectedIndex];
  const detailLabel = selected
    ? `${selected.tagName}${selected.name && selected.name !== selected.tagName ? ` — ${selected.name}` : ""}`
    : undefined;

  const viewLabel = releaseType === "all" ? "Releases" : `Releases [${RELEASE_TYPE_LABELS[releaseType]}]`;

  return (
    <Box flexDirection="column">
      <Breadcrumb view={viewLabel} detail={showDetail && selected ? detailLabel : undefined} />
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
