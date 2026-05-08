import { Box, Text } from "ink";
import { VIEWS, VIEW_LABELS, type View, type RepoInfo } from "../lib/types.js";

interface HeaderProps {
  repo: RepoInfo | null;
  prCount: number;
  issueCount: number;
  activeView: View;
}

export function Header({ repo, prCount, issueCount, activeView }: HeaderProps) {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={1}
    >
      <Box gap={2}>
        <Text bold color="cyan">
          {repo?.nameWithOwner ?? "…"}
        </Text>
        {repo?.branch && (
          <Text dimColor>
            on <Text color="yellow">{repo.branch}</Text>
          </Text>
        )}
        <Text dimColor>
          {prCount} PR{prCount !== 1 ? "s" : ""} · {issueCount} issue{issueCount !== 1 ? "s" : ""}
        </Text>
      </Box>
      <Box gap={1}>
        {VIEWS.map((view, i) => (
          <Text key={view} bold={view === activeView} color={view === activeView ? "cyan" : undefined} dimColor={view !== activeView}>
            {i + 1}:{VIEW_LABELS[view]}
          </Text>
        ))}
      </Box>
      <Text dimColor>
        tab/shift+tab switch view · 1-6 jump to view · ↑↓ navigate · enter open · r refresh · q quit
      </Text>
    </Box>
  );
}
