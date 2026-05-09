import { Box, Text, useInput } from "ink";

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
      ["C", "Comment on selected item"],
      ["d", "Toggle detail pane"],
      ["o", "Open in browser"],
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
  useInput((input, key) => {
    if (input === "?" || key.escape) onClose();
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
    >
      <Text bold color="cyan">
        Keybindings
      </Text>
      {SECTIONS.map((section) => (
        <Box key={section.title} flexDirection="column" marginTop={1}>
          <Text bold underline>
            {section.title}
          </Text>
          {section.bindings.map(([key, desc]) => (
            <Box key={key} gap={1}>
              <Text color="yellow">{key.padEnd(12)}</Text>
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
