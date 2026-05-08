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
  const selectedIndex = useListNavigation(milestones.length, onSelect);

  return (
    <Box flexDirection="column">
      {milestones.map((ms, i) => (
        <MilestoneRow key={ms.number} milestone={ms} selected={i === selectedIndex} />
      ))}
    </Box>
  );
}
