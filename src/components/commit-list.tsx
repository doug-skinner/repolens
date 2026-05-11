import { useState, useMemo, useCallback } from "react";
import { Box, Text } from "ink";
import { CommitRow } from "./commit-row.js";
import { DetailPane } from "./detail-pane.js";
import { Breadcrumb } from "./breadcrumb.js";
import { FilterInput } from "./filter-input.js";
import { openCommitInBrowser } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import { useListFilter } from "../hooks/use-list-filter.js";
import { useListSort } from "../hooks/use-list-sort.js";
import { isStale } from "../lib/format.js";
import { useConfig } from "../lib/config-context.js";
import { matchesFilter } from "../lib/filter.js";
import { byDateDesc, byDateAsc } from "../lib/sort.js";
import type { Commit } from "../lib/types.js";

interface CommitListProps {
  commits: Commit[];
  username: string | null;
  onFilteringChange?: (editing: boolean) => void;
}

function CommitDetail({ commit, height }: { commit: Commit; height: number }) {
  const title = `${commit.hash.slice(0, 7)} — ${commit.message}`;

  return (
    <DetailPane title={title} height={height}>
      {commit.body ? (
        <Box flexDirection="column" flexGrow={1} overflow="hidden">
          <Text>{commit.body}</Text>
        </Box>
      ) : (
        <Text dimColor>No additional commit message</Text>
      )}
    </DetailPane>
  );
}

const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
] as const;

export function CommitList({ commits, username, onFilteringChange }: CommitListProps) {
  const { staleDays } = useConfig();
  const filter = useListFilter(onFilteringChange);
  const sort = useListSort(SORT_OPTIONS);
  const [mine, setMine] = useState(false);

  const toggleMine = useCallback(() => setMine((v) => !v), []);

  const extraKeys = useMemo(() => ({ s: sort.cycleSort, m: toggleMine }), [sort.cycleSort, toggleMine]);

  const sorted = useMemo(() => {
    let items = commits.filter((c) =>
      matchesFilter(c.message, filter.filterQuery) ||
      matchesFilter(c.author, filter.filterQuery),
    );
    if (mine && username) {
      items = items.filter((c) => c.author === username);
    }
    if (sort.current === "oldest") items.sort((a, b) => byDateAsc(a.date, b.date));
    else if (sort.current === "newest") items.sort((a, b) => byDateDesc(a.date, b.date));
    return items;
  }, [commits, filter.filterQuery, mine, username, sort.current]);

  const resetTrigger = `${mine}:${sort.current}`;

  const onOpen = useCallback((i: number) => openCommitInBrowser(sorted[i].hash), [sorted]);
  const onYank = useCallback((i: number) => copyToClipboard(sorted[i].hash), [sorted]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(sorted.length, { onOpen, onYank, filter, extraKeys, resetTrigger });
  const visible = sorted.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = sorted[selectedIndex];
  const detailLabel = selected ? `${selected.hash.slice(0, 7)} — ${selected.message}` : undefined;

  const tags: string[] = [];
  if (mine) tags.push("Mine");
  if (sort.current !== "newest") tags.push(sort.label);
  const viewLabel = tags.length > 0 ? `Commits [${tags.join(", ")}]` : "Commits";

  return (
    <Box flexDirection="column">
      <Breadcrumb view={viewLabel} detail={showDetail && selected ? detailLabel : undefined} />
      <FilterInput query={filter.filterQuery} isEditing={filter.isEditing} resultCount={sorted.length} totalCount={commits.length} />
      <Box flexDirection="column">
        {visible.map((commit, i) => (
          <CommitRow key={commit.hash} commit={commit} selected={scrollOffset + i === selectedIndex} stale={isStale(commit.date, staleDays)} />
        ))}
      </Box>
      {showDetail && selected && (
        <CommitDetail commit={selected} height={detailHeight} />
      )}
    </Box>
  );
}
