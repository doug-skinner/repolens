import { useCallback, useMemo } from "react";
import { Box, Text } from "ink";
import { IssueRow } from "./issue-row.js";
import { DetailPane } from "./detail-pane.js";
import { Breadcrumb } from "./breadcrumb.js";
import { FilterInput } from "./filter-input.js";
import { openIssueInBrowser } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import { useListFilter } from "../hooks/use-list-filter.js";
import { matchesFilter } from "../lib/filter.js";
import type { Issue } from "../lib/types.js";

interface IssueListProps {
  issues: Issue[];
  onFilteringChange?: (editing: boolean) => void;
}

function IssueDetail({ issue, height }: { issue: Issue; height: number }) {
  return (
    <DetailPane title={`#${issue.number} ${issue.title}`} height={height}>
      {issue.assignees.length > 0 && (
        <Box gap={1}>
          <Text dimColor>Assignees:</Text>
          <Text>{issue.assignees.map((a) => a.login).join(", ")}</Text>
        </Box>
      )}
      {issue.milestone && (
        <Box gap={1}>
          <Text dimColor>Milestone:</Text>
          <Text color="cyan">{issue.milestone.title}</Text>
        </Box>
      )}
      {issue.labels.length > 0 && (
        <Box gap={1}>
          <Text dimColor>Labels:</Text>
          <Text color="yellow">{issue.labels.map((l) => l.name).join(", ")}</Text>
        </Box>
      )}
      {issue.body ? (
        <Box flexDirection="column" marginTop={1} flexGrow={1} overflow="hidden">
          <Text>{issue.body}</Text>
        </Box>
      ) : (
        <Text dimColor>No description</Text>
      )}
    </DetailPane>
  );
}

export function IssueList({ issues, onFilteringChange }: IssueListProps) {
  const filter = useListFilter(onFilteringChange);
  const filtered = useMemo(
    () => issues.filter((issue) => matchesFilter(issue.title, filter.filterQuery, issue.labels)),
    [issues, filter.filterQuery],
  );

  const onOpen = useCallback((i: number) => openIssueInBrowser(filtered[i].number), [filtered]);
  const onYank = useCallback((i: number) => copyToClipboard(filtered[i].url), [filtered]);
  const onYankRef = useCallback((i: number) => copyToClipboard(`#${filtered[i].number}`), [filtered]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(filtered.length, { onOpen, onYank, onYankRef, filter });
  const visible = filtered.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = filtered[selectedIndex];

  return (
    <Box flexDirection="column">
      <Breadcrumb view="Issues" detail={showDetail && selected ? `#${selected.number} ${selected.title}` : undefined} />
      <FilterInput query={filter.filterQuery} isEditing={filter.isEditing} resultCount={filtered.length} totalCount={issues.length} />
      <Box flexDirection="column">
        {visible.map((issue, i) => (
          <IssueRow key={issue.number} issue={issue} selected={scrollOffset + i === selectedIndex} />
        ))}
      </Box>
      {showDetail && selected && (
        <IssueDetail issue={selected} height={detailHeight} />
      )}
    </Box>
  );
}
