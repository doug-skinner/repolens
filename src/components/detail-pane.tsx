import type { ReactNode } from "react";
import { Box, Text } from "ink";
import { useTheme } from "../lib/config-context.js";

interface DetailPaneProps {
  title: string;
  height: number;
  children: ReactNode;
}

export function DetailPane({ title, height, children }: DetailPaneProps) {
  const theme = useTheme();

  if (height <= 0) return null;

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={theme.accent}
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
