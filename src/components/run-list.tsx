import { useCallback } from "react";
import { Box } from "ink";
import { RunRow } from "./run-row.js";
import { openRunInBrowser } from "../lib/gh.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import type { WorkflowRun } from "../lib/types.js";

interface RunListProps {
  runs: WorkflowRun[];
}

export function RunList({ runs }: RunListProps) {
  const onSelect = useCallback((i: number) => openRunInBrowser(runs[i].url), [runs]);
  const selectedIndex = useListNavigation(runs.length, onSelect);

  return (
    <Box flexDirection="column">
      {runs.map((run, i) => (
        <RunRow key={run.databaseId} run={run} selected={i === selectedIndex} />
      ))}
    </Box>
  );
}
