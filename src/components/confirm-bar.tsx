import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";

interface ConfirmBarProps {
  message: string;
  status: "confirming" | "working" | "success" | "error";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmBar({ message, status, onConfirm, onCancel }: ConfirmBarProps) {
  useInput((input, key) => {
    if (status !== "confirming") return;
    if (input === "y") onConfirm();
    if (input === "n" || key.escape) onCancel();
  });

  if (status === "working") {
    return (
      <Box paddingX={1} gap={1}>
        <Spinner type="dots" />
        <Text>{message}</Text>
      </Box>
    );
  }

  if (status === "success") {
    return (
      <Box paddingX={1} gap={1}>
        <Text color="green">✓</Text>
        <Text>{message}</Text>
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box paddingX={1} gap={1}>
        <Text color="red">✗</Text>
        <Text>{message}</Text>
      </Box>
    );
  }

  return (
    <Box paddingX={1} gap={1}>
      <Text color="yellow">{message}</Text>
      <Text dimColor>y to confirm · Esc to cancel</Text>
    </Box>
  );
}
