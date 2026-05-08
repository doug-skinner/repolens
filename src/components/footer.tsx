import { Box, Text } from "ink";
import type { View } from "../lib/types.js";

interface FooterProps {
  activeView: View;
}

const GLOBAL_HINTS = [
  "tab/shift+tab switch view",
  "1-6 jump to view",
  "r refresh",
  "q quit",
  "? help",
];

const LIST_HINTS = ["↑↓ navigate", "enter open", "y copy url", "Y copy ref"];

export function Footer({ activeView }: FooterProps) {
  const hints = activeView === "dashboard"
    ? GLOBAL_HINTS
    : [...LIST_HINTS, ...GLOBAL_HINTS];

  return (
    <Box paddingX={1}>
      <Text dimColor>{hints.join(" · ")}</Text>
    </Box>
  );
}
