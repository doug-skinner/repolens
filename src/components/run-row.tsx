import { Box, Text } from "ink";
import { timeAgo, truncate } from "../lib/format.js";
import type { WorkflowRun } from "../lib/types.js";

interface RunRowProps {
  run: WorkflowRun;
  selected: boolean;
}

function statusSymbol(run: WorkflowRun): { symbol: string; color: string } {
  if (run.status === "in_progress") return { symbol: "●", color: "yellow" };
  if (run.status === "queued" || run.status === "waiting" || run.status === "pending")
    return { symbol: "○", color: "yellow" };
  if (run.conclusion === "success") return { symbol: "✓", color: "green" };
  if (run.conclusion === "failure") return { symbol: "✗", color: "red" };
  if (run.conclusion === "cancelled") return { symbol: "⊘", color: "gray" };
  return { symbol: "·", color: "gray" };
}

export function RunRow({ run, selected }: RunRowProps) {
  const { symbol, color } = statusSymbol(run);

  return (
    <Box gap={1}>
      <Text color={selected ? "cyan" : undefined}>{selected ? "▸" : " "}</Text>
      <Box width={2}>
        <Text color={color}>{symbol}</Text>
      </Box>
      <Box width={20}>
        <Text dimColor wrap="truncate">
          {truncate(run.workflowName, 18)}
        </Text>
      </Box>
      <Box flexGrow={1}>
        <Text bold={selected} wrap="truncate">
          {run.displayTitle}
        </Text>
      </Box>
      <Box width={20}>
        <Text color="cyan" wrap="truncate">
          {truncate(run.headBranch, 18)}
        </Text>
      </Box>
      <Box width={9}>
        <Text dimColor>{timeAgo(run.createdAt)}</Text>
      </Box>
    </Box>
  );
}
