import { Box, Text } from "ink";
import Link from "ink-link";
import { timeAgo, truncate } from "../lib/format.js";
import type { Issue } from "../lib/types.js";

interface IssueRowProps {
  issue: Issue;
  selected: boolean;
  stale?: boolean;
}

export function IssueRow({ issue, selected, stale }: IssueRowProps) {
  const dim = stale && !selected;
  const labelText = issue.labels
    .map((l) => l.name)
    .join(", ");

  return (
    <Box gap={1}>
      <Text color={selected ? "cyan" : undefined}>{selected ? "▸" : " "}</Text>
      <Box width={6}>
        <Text dimColor>
          <Link url={issue.url}>#{issue.number}</Link>
        </Text>
      </Box>
      <Box flexGrow={1}>
        <Text bold={selected} dimColor={dim} wrap="truncate">
          {issue.title}
        </Text>
      </Box>
      <Box width={14}>
        <Text dimColor wrap="truncate">
          {truncate(issue.author.login, 12)}
        </Text>
      </Box>
      <Box width={26}>
        <Text color={dim ? undefined : "yellow"} dimColor={dim} wrap="truncate">
          {truncate(labelText, 24)}
        </Text>
      </Box>
      <Box width={9}>
        <Text dimColor>{timeAgo(issue.createdAt)}</Text>
      </Box>
    </Box>
  );
}
