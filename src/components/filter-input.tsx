import { Box, Text } from "ink";
import { useTheme } from "../lib/config-context.js";

interface FilterInputProps {
  query: string;
  isEditing: boolean;
  resultCount: number;
  totalCount: number;
}

export function FilterInput({ query, isEditing, resultCount, totalCount }: FilterInputProps) {
  const theme = useTheme();

  if (!isEditing && !query) return null;

  return (
    <Box paddingX={1} gap={1}>
      <Text color={isEditing ? theme.accent : undefined} dimColor={!isEditing}>/</Text>
      <Text dimColor={!isEditing}>{query}</Text>
      {isEditing && <Text color={theme.accent}>▏</Text>}
      <Text dimColor>({resultCount}/{totalCount})</Text>
    </Box>
  );
}
