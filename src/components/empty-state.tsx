import { Box, Text } from "ink";

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <Box paddingY={1} paddingX={2}>
      <Text dimColor>{message}</Text>
    </Box>
  );
}
