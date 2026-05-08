import { useCallback } from "react";
import { Box } from "ink";
import { RunRow } from "./run-row.js";
import { openRunInBrowser } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import type { WorkflowRun } from "../lib/types.js";

interface RunListProps {
  runs: WorkflowRun[];
}

export function RunList({ runs }: RunListProps) {
  const onSelect = useCallback((i: number) => openRunInBrowser(runs[i].url), [runs]);
  const onYank = useCallback((i: number) => copyToClipboard(runs[i].url), [runs]);
  const onYankRef = useCallback((i: number) => copyToClipboard(String(runs[i].databaseId)), [runs]);
  const { selectedIndex, scrollOffset, viewportHeight } = useListNavigation(runs.length, { onSelect, onYank, onYankRef });
  const visible = runs.slice(scrollOffset, scrollOffset + viewportHeight);

  return (
    <Box flexDirection="column">
      {visible.map((run, i) => (
        <RunRow key={run.databaseId} run={run} selected={scrollOffset + i === selectedIndex} />
      ))}
    </Box>
  );
}
