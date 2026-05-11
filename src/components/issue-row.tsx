import { Box, Text } from "ink";
import { timeAgo, truncate } from "../lib/format.js";
import type { Issue } from "../lib/types.js";

interface IssueRowProps {
  issue: Issue;
  selected: boolean;
  marked?: boolean;
  stale?: boolean;
}

export function IssueRow({ issue, selected, marked, stale }: IssueRowProps) {
  const dim = stale && !selected;
  const labelText = issue.labels
    .map((l) => l.name)
    .join(", ");

  const indicator = selected ? "▸" : marked ? "●" : " ";

  return (
    <Box gap={1}>
      <Text color={selected ? "cyan" : marked ? "magenta" : undefined}>{indicator}</Text>
      <Box width={6}>
        <Text dimColor>
          #{issue.number}
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
