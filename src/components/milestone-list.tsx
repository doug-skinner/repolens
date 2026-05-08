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
import { matchesFilter } from "../lib/filter.js";
import type { Milestone } from "../lib/types.js";

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
  const filtered = useMemo(
    () => milestones.filter((ms) => matchesFilter(ms.title, filter.filterQuery)),
    [milestones, filter.filterQuery],
  );

  const onOpen = useCallback((i: number) => openMilestoneInBrowser(filtered[i].html_url), [filtered]);
  const onYank = useCallback((i: number) => copyToClipboard(filtered[i].html_url), [filtered]);
  const onYankRef = useCallback((i: number) => copyToClipboard(filtered[i].title), [filtered]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(filtered.length, { onOpen, onYank, onYankRef, filter });
  const visible = filtered.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = filtered[selectedIndex];

  return (
    <Box flexDirection="column">
      <Breadcrumb view="Milestones" detail={showDetail && selected ? selected.title : undefined} />
      <FilterInput query={filter.filterQuery} isEditing={filter.isEditing} resultCount={filtered.length} totalCount={milestones.length} />
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
