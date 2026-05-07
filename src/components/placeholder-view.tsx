import { Box, Text } from "ink";
import { VIEW_LABELS, type View } from "../lib/types.js";

interface PlaceholderViewProps {
  view: View;
}

export function PlaceholderView({ view }: PlaceholderViewProps) {
  return (
    <Box paddingY={1} paddingX={2}>
      <Text dimColor>{VIEW_LABELS[view]} — coming soon</Text>
    </Box>
  );
}
