import { Box, Text } from "ink";
import { CheckBadge, ReviewBadge, SizeBadge } from "./status-badge.js";
import { timeAgo, summarizeChecks, truncate } from "../lib/format.js";
import type { PullRequest } from "../lib/types.js";

interface PrRowProps {
  pr: PullRequest;
  selected: boolean;
  marked?: boolean;
  stale?: boolean;
}

export function PrRow({ pr, selected, marked, stale }: PrRowProps) {
  const dim = stale && !selected;

  const indicator = selected ? "▸" : marked ? "●" : " ";

  return (
    <Box gap={1}>
      <Text color={selected ? "cyan" : marked ? "magenta" : undefined}>{indicator}</Text>
      <Box width={6}>
        <Text dimColor>
          #{pr.number}
        </Text>
      </Box>
      <Box flexGrow={1}>
        <Text bold={selected} dimColor={dim} wrap="truncate">
          {pr.isDraft ? <Text dimColor>[draft] </Text> : null}
          {pr.title}
        </Text>
      </Box>
      <Box width={14}>
        <Text dimColor wrap="truncate">
          {truncate(pr.author.login, 12)}
        </Text>
      </Box>
      <Box width={20}>
        <Text color={dim ? undefined : "cyan"} dimColor={dim} wrap="truncate">
          {truncate(pr.headRefName, 18)}
        </Text>
      </Box>
      <Box width={9}>
        {dim ? <Text dimColor>—</Text> : <CheckBadge summary={summarizeChecks(pr.statusCheckRollup)} />}
      </Box>
      <Box width={11}>
        {dim ? <Text dimColor>—</Text> : <ReviewBadge decision={pr.reviewDecision} />}
      </Box>
      <Box width={4}>
        {dim ? <Text dimColor>—</Text> : <SizeBadge linesChanged={pr.additions + pr.deletions} />}
      </Box>
      <Box width={9}>
        <Text dimColor>{timeAgo(pr.createdAt)}</Text>
      </Box>
    </Box>
  );
}
