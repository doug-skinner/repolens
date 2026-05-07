import { useState } from "react";
import { Box, Text, useInput, useApp } from "ink";
import Spinner from "ink-spinner";
import { Header } from "./components/header.js";
import { PrList } from "./components/pr-list.js";
import { EmptyState } from "./components/empty-state.js";
import { PlaceholderView } from "./components/placeholder-view.js";
import { usePullRequests } from "./hooks/use-pull-requests.js";
import { useRepoInfo } from "./hooks/use-repo-info.js";
import { VIEWS, type View } from "./lib/types.js";

export function App() {
  const { exit } = useApp();
  const { prs, loading, error, refetch } = usePullRequests();
  const { repo } = useRepoInfo();
  const [activeView, setActiveView] = useState<View>("prs");

  useInput((input, key) => {
    if (input === "q") exit();
    if (input === "r") refetch();

    if (key.tab) {
      setActiveView((v) => {
        const i = VIEWS.indexOf(v);
        return key.shift
          ? VIEWS[(i - 1 + VIEWS.length) % VIEWS.length]
          : VIEWS[(i + 1) % VIEWS.length];
      });
    }

    const num = Number(input);
    if (num >= 1 && num <= VIEWS.length) {
      setActiveView(VIEWS[num - 1]);
    }
  });

  const renderView = () => {
    if (activeView !== "prs") {
      return <PlaceholderView view={activeView} />;
    }
    if (loading) {
      return (
        <Box gap={1} paddingX={1}>
          <Spinner type="dots" />
          <Text>Loading pull requests…</Text>
        </Box>
      );
    }
    if (error) {
      return (
        <Box paddingX={1}>
          <Text color="red">{error}</Text>
        </Box>
      );
    }
    if (prs.length === 0) {
      return <EmptyState />;
    }
    return <PrList prs={prs} />;
  };

  return (
    <Box flexDirection="column" paddingX={1}>
      <Header repo={repo} prCount={prs.length} activeView={activeView} />
      <Box marginTop={1} flexDirection="column">
        {renderView()}
      </Box>
    </Box>
  );
}
