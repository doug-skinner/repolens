import { useState } from "react";
import { Box, useInput } from "ink";
import { IssueRow } from "./issue-row.js";
import { openIssueInBrowser } from "../lib/gh.js";
import type { Issue } from "../lib/types.js";

interface IssueListProps {
  issues: Issue[];
}

export function IssueList({ issues }: IssueListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((_input, key) => {
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setSelectedIndex((i) => Math.min(issues.length - 1, i + 1));
    } else if (key.return) {
      openIssueInBrowser(issues[selectedIndex].number);
    }
  });

  return (
    <Box flexDirection="column">
      {issues.map((issue, i) => (
        <IssueRow key={issue.number} issue={issue} selected={i === selectedIndex} />
      ))}
    </Box>
  );
}
