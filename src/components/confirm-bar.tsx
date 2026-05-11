import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";
import { useTheme } from "../lib/config-context.js";

interface ConfirmBarProps {
  message: string;
  status: "confirming" | "working" | "success" | "error";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmBar({ message, status, onConfirm, onCancel }: ConfirmBarProps) {
  const theme = useTheme();

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
        <Text color={theme.success}>✓</Text>
        <Text>{message}</Text>
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box paddingX={1} gap={1}>
        <Text color={theme.error}>✗</Text>
        <Text>{message}</Text>
      </Box>
    );
  }

  return (
    <Box paddingX={1} gap={1}>
      <Text color={theme.warning}>{message}</Text>
      <Text dimColor>y to confirm · Esc to cancel</Text>
    </Box>
  );
}
