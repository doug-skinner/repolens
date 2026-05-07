import { useState } from "react";
import { Box, useInput } from "ink";
import { MilestoneRow } from "./milestone-row.js";
import { openMilestoneInBrowser } from "../lib/gh.js";
import type { Milestone } from "../lib/types.js";

interface MilestoneListProps {
  milestones: Milestone[];
}

export function MilestoneList({ milestones }: MilestoneListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((_input, key) => {
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setSelectedIndex((i) => Math.min(milestones.length - 1, i + 1));
    } else if (key.return) {
      openMilestoneInBrowser(milestones[selectedIndex].html_url);
    }
  });

  return (
    <Box flexDirection="column">
      {milestones.map((ms, i) => (
        <MilestoneRow key={ms.number} milestone={ms} selected={i === selectedIndex} />
      ))}
    </Box>
  );
}
