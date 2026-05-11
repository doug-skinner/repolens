import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";

export type MergeStrategy = "merge" | "squash" | "rebase";

interface MergeBarProps {
  prNumber: number;
  prTitle: string;
  status: "choosing" | "working" | "success" | "error";
  onSelect: (strategy: MergeStrategy) => void;
  onCancel: () => void;
}

export function MergeBar({ prNumber, prTitle, status, onSelect, onCancel }: MergeBarProps) {
  useInput((input, key) => {
    if (status !== "choosing") return;
    if (input === "m") onSelect("merge");
    else if (input === "s") onSelect("squash");
    else if (input === "r") onSelect("rebase");
    else if (key.escape || input === "n") onCancel();
  });

  if (status === "working") {
    return (
      <Box paddingX={1} gap={1}>
        <Spinner type="dots" />
        <Text>Merging #{prNumber}…</Text>
      </Box>
    );
  }

  if (status === "success") {
    return (
      <Box paddingX={1} gap={1}>
        <Text color="green">✓</Text>
        <Text>Merged #{prNumber}</Text>
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box paddingX={1} gap={1}>
        <Text color="red">✗</Text>
        <Text>Failed to merge #{prNumber}</Text>
      </Box>
    );
  }

  return (
    <Box paddingX={1} gap={1}>
      <Text color="yellow">Merge #{prNumber} "{prTitle}"?</Text>
      <Text dimColor>m merge · s squash · r rebase · Esc cancel</Text>
    </Box>
  );
}
