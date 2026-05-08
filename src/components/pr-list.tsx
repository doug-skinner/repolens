import { useCallback, useMemo } from "react";
import { Box, Text } from "ink";
import { PrRow } from "./pr-row.js";
import { DetailPane } from "./detail-pane.js";
import { Breadcrumb } from "./breadcrumb.js";
import { FilterInput } from "./filter-input.js";
import { openPrInBrowser } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import { useListFilter } from "../hooks/use-list-filter.js";
import { useListSort } from "../hooks/use-list-sort.js";
import { truncate } from "../lib/format.js";
import { matchesFilter } from "../lib/filter.js";
import { byDateDesc, byDateAsc, byStringAsc } from "../lib/sort.js";
import type { PullRequest } from "../lib/types.js";

const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "title", label: "Title" },
] as const;

interface PrListProps {
  prs: PullRequest[];
  onFilteringChange?: (editing: boolean) => void;
}

function checkSymbol(status: string, conclusion: string): { symbol: string; color: string } {
  if (status === "IN_PROGRESS") return { symbol: "●", color: "yellow" };
  if (conclusion === "SUCCESS") return { symbol: "✓", color: "green" };
  if (conclusion === "FAILURE") return { symbol: "✗", color: "red" };
  return { symbol: "○", color: "yellow" };
}

function PrDetail({ pr, height }: { pr: PullRequest; height: number }) {
  return (
    <DetailPane title={`#${pr.number} ${pr.title}`} height={height}>
      <Box gap={1}>
        <Text dimColor>Branch:</Text>
        <Text color="cyan">{pr.headRefName}</Text>
        <Text dimColor>{"→"}</Text>
        <Text color="cyan">{pr.baseRefName}</Text>
      </Box>
      <Box gap={1}>
        <Text dimColor>Diff:</Text>
        <Text color="green">+{pr.additions}</Text>
        <Text color="red">-{pr.deletions}</Text>
      </Box>
      {pr.reviewRequests.length > 0 && (
        <Box gap={1}>
          <Text dimColor>Reviewers:</Text>
          <Text>{pr.reviewRequests.map((r) => r.login).join(", ")}</Text>
        </Box>
      )}
      {pr.labels.length > 0 && (
        <Box gap={1}>
          <Text dimColor>Labels:</Text>
          <Text color="yellow">{pr.labels.map((l) => l.name).join(", ")}</Text>
        </Box>
      )}
      {pr.statusCheckRollup.map((check) => {
        const { symbol, color } = checkSymbol(check.status, check.conclusion);
        return (
          <Box key={check.name} gap={1}>
            <Text color={color}>{symbol}</Text>
            <Text>{truncate(check.name, 60)}</Text>
          </Box>
        );
      })}
    </DetailPane>
  );
}

export function PrList({ prs, onFilteringChange }: PrListProps) {
  const filter = useListFilter(onFilteringChange);
  const sort = useListSort(SORT_OPTIONS);

  const sorted = useMemo(() => {
    const items = prs.filter((pr) => matchesFilter(pr.title, filter.filterQuery, pr.labels));
    if (sort.current === "oldest") items.sort((a, b) => byDateAsc(a.createdAt, b.createdAt));
    else if (sort.current === "title") items.sort((a, b) => byStringAsc(a.title, b.title));
    else if (sort.current === "newest") items.sort((a, b) => byDateDesc(a.createdAt, b.createdAt));
    return items;
  }, [prs, filter.filterQuery, sort.current]);

  const extraKeys = useMemo(() => ({ s: sort.cycleSort }), [sort.cycleSort]);

  const onOpen = useCallback((i: number) => openPrInBrowser(sorted[i].number), [sorted]);
  const onYank = useCallback((i: number) => copyToClipboard(sorted[i].url), [sorted]);
  const onYankRef = useCallback((i: number) => copyToClipboard(`#${sorted[i].number}`), [sorted]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(sorted.length, { onOpen, onYank, onYankRef, filter, extraKeys, resetTrigger: sort.current });
  const visible = sorted.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = sorted[selectedIndex];
  const viewLabel = sort.current === "newest" ? "PRs" : `PRs [${sort.label}]`;

  return (
    <Box flexDirection="column">
      <Breadcrumb view={viewLabel} detail={showDetail && selected ? `#${selected.number} ${selected.title}` : undefined} />
      <FilterInput query={filter.filterQuery} isEditing={filter.isEditing} resultCount={sorted.length} totalCount={prs.length} />
      <Box flexDirection="column">
        {visible.map((pr, i) => (
          <PrRow key={pr.number} pr={pr} selected={scrollOffset + i === selectedIndex} />
        ))}
      </Box>
      {showDetail && selected && (
        <PrDetail pr={selected} height={detailHeight} />
      )}
    </Box>
  );
}
