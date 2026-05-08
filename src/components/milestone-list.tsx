import { useCallback } from "react";
import { Box, Text } from "ink";
import { MilestoneRow } from "./milestone-row.js";
import { DetailPane } from "./detail-pane.js";
import { openMilestoneInBrowser } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import type { Milestone } from "../lib/types.js";

interface MilestoneListProps {
  milestones: Milestone[];
}

function MilestoneDetail({ milestone, height }: { milestone: Milestone; height: number }) {
  return (
    <DetailPane title={milestone.title} height={height}>
      {milestone.description ? (
        <Box flexDirection="column" flexGrow={1} overflow="hidden">
          <Text>{milestone.description}</Text>
        </Box>
      ) : (
        <Text dimColor>No description</Text>
      )}
    </DetailPane>
  );
}

export function MilestoneList({ milestones }: MilestoneListProps) {
  const onOpen = useCallback((i: number) => openMilestoneInBrowser(milestones[i].html_url), [milestones]);
  const onYank = useCallback((i: number) => copyToClipboard(milestones[i].html_url), [milestones]);
  const onYankRef = useCallback((i: number) => copyToClipboard(milestones[i].title), [milestones]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(milestones.length, { onOpen, onYank, onYankRef });
  const visible = milestones.slice(scrollOffset, scrollOffset + viewportHeight);

  return (
    <Box flexDirection="column">
      <Box flexDirection="column">
        {visible.map((ms, i) => (
          <MilestoneRow key={ms.number} milestone={ms} selected={scrollOffset + i === selectedIndex} />
        ))}
      </Box>
      {showDetail && milestones[selectedIndex] && (
        <MilestoneDetail milestone={milestones[selectedIndex]} height={detailHeight} />
      )}
    </Box>
  );
}
