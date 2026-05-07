import { Box, Text } from "ink";

export function EmptyState() {
  return (
    <Box paddingY={1} paddingX={2}>
      <Text dimColor>No open pull requests</Text>
    </Box>
  );
}
