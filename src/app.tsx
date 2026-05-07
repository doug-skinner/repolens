import { Box, Text, useInput, useApp } from "ink";
import Spinner from "ink-spinner";
import { Header } from "./components/header.js";
import { PrList } from "./components/pr-list.js";
import { EmptyState } from "./components/empty-state.js";
import { usePullRequests } from "./hooks/use-pull-requests.js";
import { useRepoInfo } from "./hooks/use-repo-info.js";

export function App() {
  const { exit } = useApp();
  const { prs, loading, error, refetch } = usePullRequests();
  const { repo } = useRepoInfo();

  useInput((input) => {
    if (input === "q") exit();
    if (input === "r") refetch();
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Header repo={repo} prCount={prs.length} />
      <Box marginTop={1} flexDirection="column">
        {loading ? (
          <Box gap={1} paddingX={1}>
            <Spinner type="dots" />
            <Text>Loading pull requests…</Text>
          </Box>
        ) : error ? (
          <Box paddingX={1}>
            <Text color="red">{error}</Text>
          </Box>
        ) : prs.length === 0 ? (
          <EmptyState />
        ) : (
          <PrList prs={prs} />
        )}
      </Box>
    </Box>
  );
}
