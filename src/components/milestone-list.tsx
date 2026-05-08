import { useCallback, useState, useEffect } from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { MilestoneRow } from "./milestone-row.js";
import { DetailPane } from "./detail-pane.js";
import { openMilestoneInBrowser, fetchMilestoneIssues } from "../lib/gh.js";
import type { MilestoneIssue } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import type { Milestone } from "../lib/types.js";

interface MilestoneListProps {
  milestones: Milestone[];
}

function MilestoneDetail({ milestone, height }: { milestone: Milestone; height: number }) {
  const [issues, setIssues] = useState<MilestoneIssue[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setIssues(null);
    fetchMilestoneIssues(milestone.title).then((result) => {
      if (!cancelled) {
        setIssues(result);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [milestone.number]);

  return (
    <DetailPane title={milestone.title} height={height}>
      {milestone.description && (
        <Text dimColor>{milestone.description}</Text>
      )}
      {loading ? (
        <Box gap={1}>
          <Spinner type="dots" />
          <Text dimColor>Loading issues…</Text>
        </Box>
      ) : issues && issues.length > 0 ? (
        issues.map((issue) => (
          <Box key={issue.number} gap={1}>
            <Text color={issue.state === "OPEN" ? "green" : "magenta"}>
              {issue.state === "OPEN" ? "○" : "●"}
            </Text>
            <Text dimColor>#{issue.number}</Text>
            <Text>{issue.title}</Text>
          </Box>
        ))
      ) : (
        <Text dimColor>No issues</Text>
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
