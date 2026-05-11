import { Box, Text } from "ink";
import { VIEWS, VIEW_LABELS, type View, type RepoInfo } from "../lib/types.js";
import { timeAgo } from "../lib/format.js";
import { useTheme } from "../lib/config-context.js";

interface HeaderProps {
  repo: RepoInfo | null;
  prCount: number;
  issueCount: number;
  reviewRequestCount: number;
  activeView: View;
  lastRefreshedAt: Date | null;
}

export function Header({ repo, prCount, issueCount, reviewRequestCount, activeView, lastRefreshedAt }: HeaderProps) {
  const theme = useTheme();

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.accent}
      paddingX={1}
    >
      <Box gap={2}>
        <Text bold color={theme.accent}>
          {repo?.nameWithOwner ?? "…"}
        </Text>
        {repo?.branch && (
          <Text dimColor>
            on <Text color={theme.warning}>{repo.branch}</Text>
          </Text>
        )}
        <Text dimColor>
          {prCount} PR{prCount !== 1 ? "s" : ""} · {issueCount} issue{issueCount !== 1 ? "s" : ""}
          {reviewRequestCount > 0 && (
            <Text color={theme.info}> · {reviewRequestCount} review{reviewRequestCount !== 1 ? "s" : ""}</Text>
          )}
        </Text>
        <Box flexGrow={1} />
        {lastRefreshedAt && (
          <Text dimColor>↻ {timeAgo(lastRefreshedAt.toISOString())}</Text>
        )}
      </Box>
      <Box gap={1}>
        {VIEWS.map((view, i) => (
          <Text key={view} bold={view === activeView} color={view === activeView ? theme.accent : undefined} dimColor={view !== activeView}>
            {i + 1}:{VIEW_LABELS[view]}
          </Text>
        ))}
      </Box>
    </Box>
  );
}
