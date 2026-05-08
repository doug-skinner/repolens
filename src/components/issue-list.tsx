import { useCallback } from "react";
import { Box, Text } from "ink";
import { IssueRow } from "./issue-row.js";
import { DetailPane } from "./detail-pane.js";
import { openIssueInBrowser } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import type { Issue } from "../lib/types.js";

interface IssueListProps {
  issues: Issue[];
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

export function IssueList({ issues }: IssueListProps) {
  const onOpen = useCallback((i: number) => openIssueInBrowser(issues[i].number), [issues]);
  const onYank = useCallback((i: number) => copyToClipboard(issues[i].url), [issues]);
  const onYankRef = useCallback((i: number) => copyToClipboard(`#${issues[i].number}`), [issues]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(issues.length, { onOpen, onYank, onYankRef });
  const visible = issues.slice(scrollOffset, scrollOffset + viewportHeight);

  return (
    <Box flexDirection="column">
      <Box flexDirection="column">
        {visible.map((issue, i) => (
          <IssueRow key={issue.number} issue={issue} selected={scrollOffset + i === selectedIndex} />
        ))}
      </Box>
      {showDetail && issues[selectedIndex] && (
        <IssueDetail issue={issues[selectedIndex]} height={detailHeight} />
      )}
    </Box>
  );
}
