import { useState } from "react";
import { Box, useInput } from "ink";
import { RunRow } from "./run-row.js";
import { openRunInBrowser } from "../lib/gh.js";
import type { WorkflowRun } from "../lib/types.js";

interface RunListProps {
  runs: WorkflowRun[];
}

export function RunList({ runs }: RunListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((_input, key) => {
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setSelectedIndex((i) => Math.min(runs.length - 1, i + 1));
    } else if (key.return) {
      openRunInBrowser(runs[selectedIndex].url);
    }
  });

  return (
    <Box flexDirection="column">
      {runs.map((run, i) => (
        <RunRow key={run.databaseId} run={run} selected={i === selectedIndex} />
      ))}
    </Box>
  );
}
