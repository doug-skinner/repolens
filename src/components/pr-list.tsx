import { useCallback } from "react";
import { Box, Text } from "ink";
import { PrRow } from "./pr-row.js";
import { DetailPane } from "./detail-pane.js";
import { Breadcrumb } from "./breadcrumb.js";
import { openPrInBrowser } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import { truncate } from "../lib/format.js";
import type { PullRequest } from "../lib/types.js";

interface PrListProps {
  prs: PullRequest[];
}

function checkSymbol(status: string, conclusion: string): { symbol: string; color: string } {
  if (status === "IN_PROGRESS") return { symbol: "●", color: "yellow" };
  if (conclusion === "SUCCESS") return { symbol: "✓", color: "green" };
  if (conclusion === "FAILURE") return { symbol: "✗", color: "red" };
  return { symbol: "○", color: "yellow" };
}

function PrDetail({ pr, height }: { pr: PullRequest; height: number }) {
  return (
    <DetailPane title={`#${pr.number} ${pr.title}`} height={height}>
      <Box gap={1}>
        <Text dimColor>Branch:</Text>
        <Text color="cyan">{pr.headRefName}</Text>
        <Text dimColor>{"→"}</Text>
        <Text color="cyan">{pr.baseRefName}</Text>
      </Box>
      <Box gap={1}>
        <Text dimColor>Diff:</Text>
        <Text color="green">+{pr.additions}</Text>
        <Text color="red">-{pr.deletions}</Text>
      </Box>
      {pr.reviewRequests.length > 0 && (
        <Box gap={1}>
          <Text dimColor>Reviewers:</Text>
          <Text>{pr.reviewRequests.map((r) => r.login).join(", ")}</Text>
        </Box>
      )}
      {pr.labels.length > 0 && (
        <Box gap={1}>
          <Text dimColor>Labels:</Text>
          <Text color="yellow">{pr.labels.map((l) => l.name).join(", ")}</Text>
        </Box>
      )}
      {pr.statusCheckRollup.map((check) => {
        const { symbol, color } = checkSymbol(check.status, check.conclusion);
        return (
          <Box key={check.name} gap={1}>
            <Text color={color}>{symbol}</Text>
            <Text>{truncate(check.name, 60)}</Text>
          </Box>
        );
      })}
    </DetailPane>
  );
}

export function PrList({ prs }: PrListProps) {
  const onOpen = useCallback((i: number) => openPrInBrowser(prs[i].number), [prs]);
  const onYank = useCallback((i: number) => copyToClipboard(prs[i].url), [prs]);
  const onYankRef = useCallback((i: number) => copyToClipboard(`#${prs[i].number}`), [prs]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(prs.length, { onOpen, onYank, onYankRef });
  const visible = prs.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = prs[selectedIndex];

  return (
    <Box flexDirection="column">
      <Breadcrumb view="PRs" detail={showDetail && selected ? `#${selected.number} ${selected.title}` : undefined} />
      <Box flexDirection="column">
        {visible.map((pr, i) => (
          <PrRow key={pr.number} pr={pr} selected={scrollOffset + i === selectedIndex} />
        ))}
      </Box>
      {showDetail && selected && (
        <PrDetail pr={selected} height={detailHeight} />
      )}
    </Box>
  );
}
