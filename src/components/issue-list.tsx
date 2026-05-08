import { useCallback } from "react";
import { Box } from "ink";
import { IssueRow } from "./issue-row.js";
import { openIssueInBrowser } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import type { Issue } from "../lib/types.js";

interface IssueListProps {
  issues: Issue[];
}

export function IssueList({ issues }: IssueListProps) {
  const onSelect = useCallback((i: number) => openIssueInBrowser(issues[i].number), [issues]);
  const onYank = useCallback((i: number) => copyToClipboard(issues[i].url), [issues]);
  const onYankRef = useCallback((i: number) => copyToClipboard(`#${issues[i].number}`), [issues]);
  const { selectedIndex, scrollOffset, viewportHeight } = useListNavigation(issues.length, { onSelect, onYank, onYankRef });
  const visible = issues.slice(scrollOffset, scrollOffset + viewportHeight);

  return (
    <Box flexDirection="column">
      {visible.map((issue, i) => (
        <IssueRow key={issue.number} issue={issue} selected={scrollOffset + i === selectedIndex} />
      ))}
    </Box>
  );
}
