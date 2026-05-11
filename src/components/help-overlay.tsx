import { Box, Text, useInput } from "ink";
import { useTheme } from "../lib/config-context.js";

interface HelpOverlayProps {
  onClose: () => void;
}

const SECTIONS = [
  {
    title: "Global",
    bindings: [
      ["?", "Toggle this help screen"],
      ["q", "Quit"],
      ["r", "Refresh all data"],
      ["Tab", "Next view"],
      ["Shift+Tab", "Previous view"],
      ["1–6", "Jump to view"],
    ],
  },
  {
    title: "List views",
    bindings: [
      ["↑/↓ or j/k", "Navigate items"],
      ["gg / G", "Jump to top / bottom"],
      ["/", "Filter by title"],
      ["s", "Cycle sort order"],
      ["m", "Toggle My stuff filter"],
      ["Enter", "Confirm filter / toggle detail"],
      ["Esc", "Clear filter"],
      ["Space", "Mark / unmark item"],
      ["C", "Comment on selected item"],
      ["d", "Toggle detail pane"],
      ["o", "Open in browser"],
    ],
  },
  {
    title: "Issues",
    bindings: [
      ["c", "Create new issue"],
      ["e", "Edit selected issue"],
      ["x", "Close selected issue"],
      ["l", "Toggle labels"],
      ["A", "Toggle assignees"],
    ],
  },
  {
    title: "Milestones",
    bindings: [
      ["x", "Close selected milestone"],
      ["i", "Navigate issues in detail pane"],
      ["u", "Unlink issue from milestone"],
    ],
  },
  {
    title: "Pull Requests",
    bindings: [
      ["M", "Merge (pick strategy)"],
      ["x", "Close selected PR"],
      ["a", "Approve selected PR"],
      ["X", "Request changes"],
      ["l", "Toggle labels"],
      ["A", "Toggle assignees"],
    ],
  },
  {
    title: "Actions",
    bindings: [
      ["R", "Re-run selected workflow"],
    ],
  },
  {
    title: "Releases",
    bindings: [
      ["f", "Cycle type filter (All/Stable/Pre-release/Draft)"],
    ],
  },
];

export function HelpOverlay({ onClose }: HelpOverlayProps) {
  const theme = useTheme();

  useInput((input, key) => {
    if (input === "?" || key.escape) onClose();
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.accent}
      paddingX={2}
      paddingY={1}
    >
      <Text bold color={theme.accent}>
        Keybindings
      </Text>
      {SECTIONS.map((section) => (
        <Box key={section.title} flexDirection="column" marginTop={1}>
          <Text bold>
            {section.title}
          </Text>
          {section.bindings.map(([key, desc]) => (
            <Box key={key} gap={1}>
              <Text color={theme.warning}>{key.padEnd(12)}</Text>
              <Text>{desc}</Text>
            </Box>
          ))}
        </Box>
      ))}
      <Box marginTop={1}>
        <Text dimColor>Press ? or Esc to close</Text>
      </Box>
    </Box>
  );
}
