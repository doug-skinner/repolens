import { Box, Text } from "ink";

interface EmptyStateProps {
  message: string;
  hint?: string;
}

export function EmptyState({ message, hint }: EmptyStateProps) {
  return (
    <Box paddingY={1} flexDirection="column" alignItems="center">
      <Text bold>{message}</Text>
      {hint && <Text dimColor>{hint}</Text>}
    </Box>
  );
}
