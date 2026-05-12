import { useState, useMemo, useCallback } from "react";
import { Box, Text } from "ink";
import { BranchRow } from "./branch-row.js";
import { DetailPane } from "./detail-pane.js";
import { Breadcrumb } from "./breadcrumb.js";
import { FilterInput } from "./filter-input.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import { useListFilter } from "../hooks/use-list-filter.js";
import { useListSort } from "../hooks/use-list-sort.js";
import { isStale } from "../lib/format.js";
import { useConfig, useTheme } from "../lib/config-context.js";
import { matchesFilter } from "../lib/filter.js";
import { byDateDesc, byDateAsc, byStringAsc } from "../lib/sort.js";
import type { Branch } from "../lib/types.js";

const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "name", label: "Name" },
  { key: "ahead", label: "Ahead" },
] as const;

interface BranchListProps {
  branches: Branch[];
  username: string | null;
  onFilteringChange?: (editing: boolean) => void;
}

function BranchDetail({ branch, height }: { branch: Branch; height: number }) {
  const theme = useTheme();

  return (
    <DetailPane title={branch.name} height={height}>
      {branch.isDefault && (
        <Text color={theme.info}>Default branch</Text>
      )}
      <Box gap={1}>
        <Text dimColor>Last commit:</Text>
        <Text color={theme.warning}>{branch.lastCommitHash}</Text>
        <Text dimColor>by</Text>
        <Text>{branch.lastCommitAuthor}</Text>
      </Box>
      {!branch.isDefault && (
        <Box gap={1}>
          <Text dimColor>vs default:</Text>
          <Text color={branch.ahead > 0 ? theme.success : undefined} dimColor={branch.ahead === 0}>
            {branch.ahead} ahead
          </Text>
          <Text dimColor>/</Text>
          <Text color={branch.behind > 0 ? theme.error : undefined} dimColor={branch.behind === 0}>
            {branch.behind} behind
          </Text>
        </Box>
      )}
    </DetailPane>
  );
}

export function BranchList({ branches, username, onFilteringChange }: BranchListProps) {
  const { staleDays } = useConfig();
  const filter = useListFilter(onFilteringChange);
  const sort = useListSort(SORT_OPTIONS);
  const [mine, setMine] = useState(false);

  const toggleMine = useCallback(() => setMine((v) => !v), []);

  const extraKeys = useMemo(() => ({ s: sort.cycleSort, m: toggleMine }), [sort.cycleSort, toggleMine]);

  const sorted = useMemo(() => {
    let items = branches.filter((b) =>
      matchesFilter(b.name, filter.filterQuery) ||
      matchesFilter(b.lastCommitAuthor, filter.filterQuery),
    );
    if (mine && username) {
      items = items.filter((b) => b.lastCommitAuthor === username);
    }
    if (sort.current === "oldest") items.sort((a, b) => byDateAsc(a.lastCommitDate, b.lastCommitDate));
    else if (sort.current === "name") items.sort((a, b) => byStringAsc(a.name, b.name));
    else if (sort.current === "ahead") items.sort((a, b) => b.ahead - a.ahead);
    else items.sort((a, b) => byDateDesc(a.lastCommitDate, b.lastCommitDate));
    return items;
  }, [branches, filter.filterQuery, mine, username, sort.current]);

  const resetTrigger = `${mine}:${sort.current}`;

  const onOpen = useCallback((_i: number) => {
    // no browser URL for branches
  }, []);
  const onYank = useCallback((i: number) => copyToClipboard(sorted[i].name), [sorted]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(sorted.length, { onOpen, onYank, filter, extraKeys, resetTrigger });
  const visible = sorted.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = sorted[selectedIndex];

  const tags: string[] = [];
  if (mine) tags.push("Mine");
  if (sort.current !== "newest") tags.push(sort.label);
  const viewLabel = tags.length > 0 ? `Branches [${tags.join(", ")}]` : "Branches";

  return (
    <Box flexDirection="column">
      <Breadcrumb view={viewLabel} detail={showDetail && selected ? selected.name : undefined} />
      <FilterInput query={filter.filterQuery} isEditing={filter.isEditing} resultCount={sorted.length} totalCount={branches.length} />
      <Box flexDirection="column">
        {visible.map((branch, i) => (
          <BranchRow key={branch.name} branch={branch} selected={scrollOffset + i === selectedIndex} stale={isStale(branch.lastCommitDate, staleDays)} />
        ))}
      </Box>
      {showDetail && selected && (
        <BranchDetail branch={selected} height={detailHeight} />
      )}
    </Box>
  );
}
