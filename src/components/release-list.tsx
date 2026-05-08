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
import { useListSort } from "../hooks/use-list-sort.js";
import { matchesFilter } from "../lib/filter.js";
import { byDateDesc, byDateAsc, byNumberDesc } from "../lib/sort.js";
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
  username: string | null;
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

const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "downloads", label: "Downloads" },
] as const;

export function ReleaseList({ releases, username, onFilteringChange }: ReleaseListProps) {
  const filter = useListFilter(onFilteringChange);
  const sort = useListSort(SORT_OPTIONS);
  const [releaseType, setReleaseType] = useState<ReleaseType>("all");
  const [mine, setMine] = useState(false);

  const cycleType = useCallback(() => {
    setReleaseType((t) => RELEASE_TYPES[(RELEASE_TYPES.indexOf(t) + 1) % RELEASE_TYPES.length]);
  }, []);

  const toggleMine = useCallback(() => setMine((v) => !v), []);

  const extraKeys = useMemo(() => ({ f: cycleType, s: sort.cycleSort, m: toggleMine }), [cycleType, sort.cycleSort, toggleMine]);

  const sorted = useMemo(() => {
    let items = releases.filter((r) =>
      matchesReleaseType(r, releaseType) && (
        matchesFilter(r.tagName, filter.filterQuery) ||
        (r.name && matchesFilter(r.name, filter.filterQuery))
      ),
    );
    if (mine && username) {
      items = items.filter((r) => r.author.login === username);
    }
    if (sort.current === "oldest") items.sort((a, b) => byDateAsc(a.publishedAt, b.publishedAt));
    else if (sort.current === "downloads") items.sort((a, b) => byNumberDesc(a.downloadCount, b.downloadCount));
    else if (sort.current === "newest") items.sort((a, b) => byDateDesc(a.publishedAt, b.publishedAt));
    return items;
  }, [releases, filter.filterQuery, releaseType, mine, username, sort.current]);

  const resetTrigger = `${releaseType}:${mine}:${sort.current}`;

  const onOpen = useCallback((i: number) => openReleaseInBrowser(sorted[i].tagName), [sorted]);
  const onYank = useCallback((i: number) => copyToClipboard(sorted[i].url), [sorted]);
  const onYankRef = useCallback((i: number) => copyToClipboard(sorted[i].tagName), [sorted]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(sorted.length, { onOpen, onYank, onYankRef, filter, extraKeys, resetTrigger });
  const visible = sorted.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = sorted[selectedIndex];
  const detailLabel = selected
    ? `${selected.tagName}${selected.name && selected.name !== selected.tagName ? ` — ${selected.name}` : ""}`
    : undefined;

  const tags: string[] = [];
  if (mine) tags.push("Mine");
  if (releaseType !== "all") tags.push(RELEASE_TYPE_LABELS[releaseType]);
  if (sort.current !== "newest") tags.push(sort.label);
  const viewLabel = tags.length > 0 ? `Releases [${tags.join(", ")}]` : "Releases";

  return (
    <Box flexDirection="column">
      <Breadcrumb view={viewLabel} detail={showDetail && selected ? detailLabel : undefined} />
      <FilterInput query={filter.filterQuery} isEditing={filter.isEditing} resultCount={sorted.length} totalCount={releases.length} />
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
