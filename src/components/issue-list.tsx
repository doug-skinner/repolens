import { useCallback } from "react";
import { Box } from "ink";
import { IssueRow } from "./issue-row.js";
import { openIssueInBrowser } from "../lib/gh.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import type { Issue } from "../lib/types.js";

interface IssueListProps {
  issues: Issue[];
}

export function IssueList({ issues }: IssueListProps) {
  const onSelect = useCallback((i: number) => openIssueInBrowser(issues[i].number), [issues]);
  const selectedIndex = useListNavigation(issues.length, onSelect);

  return (
    <Box flexDirection="column">
      {issues.map((issue, i) => (
        <IssueRow key={issue.number} issue={issue} selected={i === selectedIndex} />
      ))}
    </Box>
  );
}
