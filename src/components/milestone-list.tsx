import { useCallback } from "react";
import { Box } from "ink";
import { MilestoneRow } from "./milestone-row.js";
import { openMilestoneInBrowser } from "../lib/gh.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import type { Milestone } from "../lib/types.js";

interface MilestoneListProps {
  milestones: Milestone[];
}

export function MilestoneList({ milestones }: MilestoneListProps) {
  const onSelect = useCallback((i: number) => openMilestoneInBrowser(milestones[i].html_url), [milestones]);
  const { selectedIndex, scrollOffset, viewportHeight } = useListNavigation(milestones.length, onSelect);
  const visible = milestones.slice(scrollOffset, scrollOffset + viewportHeight);

  return (
    <Box flexDirection="column">
      {visible.map((ms, i) => (
        <MilestoneRow key={ms.number} milestone={ms} selected={scrollOffset + i === selectedIndex} />
      ))}
    </Box>
  );
}
