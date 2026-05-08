import { Box, Text } from "ink";
import Link from "ink-link";
import { CheckBadge, ReviewBadge } from "./status-badge.js";
import { timeAgo, summarizeChecks, truncate } from "../lib/format.js";
import type { PullRequest } from "../lib/types.js";

interface PrRowProps {
  pr: PullRequest;
  selected: boolean;
}

export function PrRow({ pr, selected }: PrRowProps) {
  return (
    <Box gap={1}>
      <Text color={selected ? "cyan" : undefined}>{selected ? "▸" : " "}</Text>
      <Box width={6}>
        <Text dimColor>
          <Link url={pr.url}>#{pr.number}</Link>
        </Text>
      </Box>
      <Box flexGrow={1}>
        <Text bold={selected} wrap="truncate">
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
        <Text color="cyan" wrap="truncate">
          {truncate(pr.headRefName, 18)}
        </Text>
      </Box>
      <Box width={9}>
        <CheckBadge summary={summarizeChecks(pr.statusCheckRollup)} />
      </Box>
      <Box width={11}>
        <ReviewBadge decision={pr.reviewDecision} />
      </Box>
      <Box width={9}>
        <Text dimColor>{timeAgo(pr.createdAt)}</Text>
      </Box>
    </Box>
  );
}
