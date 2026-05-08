import { Box, Text } from "ink";

interface FilterInputProps {
  query: string;
  isEditing: boolean;
  resultCount: number;
  totalCount: number;
}

export function FilterInput({ query, isEditing, resultCount, totalCount }: FilterInputProps) {
  if (!isEditing && !query) return null;

  return (
    <Box paddingX={1} gap={1}>
      <Text color={isEditing ? "cyan" : undefined} dimColor={!isEditing}>/</Text>
      <Text dimColor={!isEditing}>{query}</Text>
      {isEditing && <Text color="cyan">▏</Text>}
      <Text dimColor>({resultCount}/{totalCount})</Text>
    </Box>
  );
}
