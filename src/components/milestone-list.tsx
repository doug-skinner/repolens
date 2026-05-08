import { useCallback, useState, useEffect, useMemo } from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { MilestoneRow } from "./milestone-row.js";
import { DetailPane } from "./detail-pane.js";
import { Breadcrumb } from "./breadcrumb.js";
import { FilterInput } from "./filter-input.js";
import { openMilestoneInBrowser, fetchMilestoneIssues } from "../lib/gh.js";
import type { MilestoneIssue } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import { useListFilter } from "../hooks/use-list-filter.js";
import { useListSort } from "../hooks/use-list-sort.js";
import { matchesFilter } from "../lib/filter.js";
import { byVersion, byDateAsc, byStringAsc, byNumberDesc } from "../lib/sort.js";
import type { Milestone } from "../lib/types.js";

const SORT_OPTIONS = [
  { key: "version", label: "Version" },
  { key: "due", label: "Due date" },
  { key: "progress", label: "Progress" },
  { key: "title", label: "Title" },
] as const;

interface MilestoneListProps {
  milestones: Milestone[];
  onFilteringChange?: (editing: boolean) => void;
}

function MilestoneDetail({ milestone, height }: { milestone: Milestone; height: number }) {
  const [issues, setIssues] = useState<MilestoneIssue[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setIssues(null);
    fetchMilestoneIssues(milestone.title).then((result) => {
      if (!cancelled) {
        setIssues(result);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [milestone.number]);

  return (
    <DetailPane title={milestone.title} height={height}>
      {milestone.description && (
        <Text dimColor>{milestone.description}</Text>
      )}
      {loading ? (
        <Box gap={1}>
          <Spinner type="dots" />
          <Text dimColor>Loading issues…</Text>
        </Box>
      ) : issues && issues.length > 0 ? (
        issues.map((issue) => (
          <Box key={issue.number} gap={1}>
            <Text color={issue.state === "OPEN" ? "green" : "magenta"}>
              {issue.state === "OPEN" ? "○" : "●"}
            </Text>
            <Text dimColor>#{issue.number}</Text>
            <Text>{issue.title}</Text>
          </Box>
        ))
      ) : (
        <Text dimColor>No issues</Text>
      )}
    </DetailPane>
  );
}

export function MilestoneList({ milestones, onFilteringChange }: MilestoneListProps) {
  const filter = useListFilter(onFilteringChange);
  const sort = useListSort(SORT_OPTIONS);

  const sorted = useMemo(() => {
    const items = milestones.filter((ms) => matchesFilter(ms.title, filter.filterQuery));
    if (sort.current === "version") items.sort((a, b) => byVersion(a.title, b.title));
    else if (sort.current === "due") items.sort((a, b) => {
      if (!a.due_on && !b.due_on) return 0;
      if (!a.due_on) return 1;
      if (!b.due_on) return -1;
      return byDateAsc(a.due_on, b.due_on);
    });
    else if (sort.current === "progress") items.sort((a, b) => {
      const pa = a.open_issues + a.closed_issues > 0 ? a.closed_issues / (a.open_issues + a.closed_issues) : 0;
      const pb = b.open_issues + b.closed_issues > 0 ? b.closed_issues / (b.open_issues + b.closed_issues) : 0;
      return byNumberDesc(pa, pb);
    });
    else if (sort.current === "title") items.sort((a, b) => byStringAsc(a.title, b.title));
    return items;
  }, [milestones, filter.filterQuery, sort.current]);

  const extraKeys = useMemo(() => ({ s: sort.cycleSort }), [sort.cycleSort]);

  const onOpen = useCallback((i: number) => openMilestoneInBrowser(sorted[i].html_url), [sorted]);
  const onYank = useCallback((i: number) => copyToClipboard(sorted[i].html_url), [sorted]);
  const onYankRef = useCallback((i: number) => copyToClipboard(sorted[i].title), [sorted]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(sorted.length, { onOpen, onYank, onYankRef, filter, extraKeys, resetTrigger: sort.current });
  const visible = sorted.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = sorted[selectedIndex];
  const viewLabel = sort.current === "version" ? "Milestones" : `Milestones [${sort.label}]`;

  return (
    <Box flexDirection="column">
      <Breadcrumb view={viewLabel} detail={showDetail && selected ? selected.title : undefined} />
      <FilterInput query={filter.filterQuery} isEditing={filter.isEditing} resultCount={sorted.length} totalCount={milestones.length} />
      <Box flexDirection="column">
        {visible.map((ms, i) => (
          <MilestoneRow key={ms.number} milestone={ms} selected={scrollOffset + i === selectedIndex} />
        ))}
      </Box>
      {showDetail && selected && (
        <MilestoneDetail milestone={selected} height={detailHeight} />
      )}
    </Box>
  );
}
