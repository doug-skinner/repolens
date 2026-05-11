import { Box, Text } from "ink";
import type { View } from "../lib/types.js";

interface FooterProps {
  activeView: View;
}

const DASHBOARD_HINTS = ["tab switch view", "1-6 jump", "r refresh", "? help"];
const LIST_HINTS = ["/ filter", "s sort", "m mine", "d detail", "o open", "? help"];
const ACTION_HINTS = ["/ filter", "s sort", "R re-run", "d detail", "o open", "? help"];
const ISSUE_HINTS = ["/ filter", "s sort", "m mine", "c create", "e edit", "x close", "C comment", "d detail", "o open", "? help"];
const PR_HINTS = ["/ filter", "s sort", "m mine", "M merge", "x close", "C comment", "d detail", "o open", "? help"];
const RELEASE_HINTS = ["/ filter", "s sort", "m mine", "f type", "d detail", "o open", "? help"];

export function Footer({ activeView }: FooterProps) {
  const hints = activeView === "dashboard"
    ? DASHBOARD_HINTS
    : activeView === "releases"
      ? RELEASE_HINTS
      : activeView === "issues"
        ? ISSUE_HINTS
        : activeView === "prs"
          ? PR_HINTS
          : activeView === "actions"
            ? ACTION_HINTS
            : LIST_HINTS;

  return (
    <Box paddingX={1}>
      <Text dimColor>{hints.join(" · ")}</Text>
    </Box>
  );
}
