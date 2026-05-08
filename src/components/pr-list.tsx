import { useCallback } from "react";
import { Box } from "ink";
import { PrRow } from "./pr-row.js";
import { openPrInBrowser } from "../lib/gh.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import type { PullRequest } from "../lib/types.js";

interface PrListProps {
  prs: PullRequest[];
}

export function PrList({ prs }: PrListProps) {
  const onSelect = useCallback((i: number) => openPrInBrowser(prs[i].number), [prs]);
  const { selectedIndex, scrollOffset, viewportHeight } = useListNavigation(prs.length, onSelect);
  const visible = prs.slice(scrollOffset, scrollOffset + viewportHeight);

  return (
    <Box flexDirection="column">
      {visible.map((pr, i) => (
        <PrRow key={pr.number} pr={pr} selected={scrollOffset + i === selectedIndex} />
      ))}
    </Box>
  );
}
