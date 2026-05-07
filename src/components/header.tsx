import { Box, Text } from "ink";
import type { RepoInfo } from "../lib/types.js";

interface HeaderProps {
  repo: RepoInfo | null;
  prCount: number;
}

export function Header({ repo, prCount }: HeaderProps) {
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
          {prCount} open PR{prCount !== 1 ? "s" : ""}
        </Text>
      </Box>
      <Text dimColor>
        ↑↓ navigate · enter open in browser · r refresh · q quit
      </Text>
    </Box>
  );
}
