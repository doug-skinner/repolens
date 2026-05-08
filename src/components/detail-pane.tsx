import type { ReactNode } from "react";
import { Box, Text } from "ink";

interface DetailPaneProps {
  title: string;
  height: number;
  children: ReactNode;
}

export function DetailPane({ title, height, children }: DetailPaneProps) {
  if (height <= 0) return null;

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="cyan"
      height={height}
      overflow="hidden"
      paddingX={1}
    >
      <Text bold dimColor>{title}</Text>
      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {children}
      </Box>
    </Box>
  );
}
