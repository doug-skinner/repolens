import { useState, useCallback } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import Spinner from "ink-spinner";
import { Header } from "./components/header.js";
import { Dashboard } from "./components/dashboard.js";
import { PrList } from "./components/pr-list.js";
import { IssueList } from "./components/issue-list.js";
import { MilestoneList } from "./components/milestone-list.js";
import { RunList } from "./components/run-list.js";
import { ReleaseList } from "./components/release-list.js";
import { EmptyState } from "./components/empty-state.js";
import { HelpOverlay } from "./components/help-overlay.js";
import { Footer } from "./components/footer.js";
import { usePullRequests } from "./hooks/use-pull-requests.js";
import { useIssues } from "./hooks/use-issues.js";
import { useMilestones } from "./hooks/use-milestones.js";
import { useWorkflowRuns } from "./hooks/use-workflow-runs.js";
import { useReleases } from "./hooks/use-releases.js";
import { useReviewRequests } from "./hooks/use-review-requests.js";
import { useRepoInfo } from "./hooks/use-repo-info.js";
import { useAutoRefresh } from "./hooks/use-auto-refresh.js";
import { VIEWS, type View } from "./lib/types.js";

export function App() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const { prs, loading: prsLoading, error: prsError, refetch: refetchPrs } = usePullRequests();
  const { issues, loading: issuesLoading, error: issuesError, refetch: refetchIssues } = useIssues();
  const { milestones, loading: msLoading, error: msError, refetch: refetchMs } = useMilestones();
  const { runs, loading: runsLoading, error: runsError, refetch: refetchRuns } = useWorkflowRuns();
  const { releases, loading: relLoading, error: relError, refetch: refetchRel } = useReleases();
  const { count: reviewRequestCount, refetch: refetchReviews } = useReviewRequests();
  const { repo } = useRepoInfo();
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [showHelp, setShowHelp] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  const refetchAll = useCallback(() => {
    refetchPrs();
    refetchIssues();
    refetchMs();
    refetchRuns();
    refetchRel();
    refetchReviews();
  }, [refetchPrs, refetchIssues, refetchMs, refetchRuns, refetchRel, refetchReviews]);

  const { lastRefreshedAt, refreshNow } = useAutoRefresh({ refetch: refetchAll, paused: showHelp });

  useInput((input, key) => {
    if (showHelp || isFiltering) return;

    if (input === "?") {
      setShowHelp(true);
      return;
    }

    if (input === "q") exit();
    if (input === "r") refreshNow();

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
    if (activeView === "dashboard") {
      const anyLoading = prsLoading || issuesLoading || runsLoading || msLoading || relLoading;
      return (
        <Dashboard
          prs={prs}
          issues={issues}
          runs={runs}
          milestones={milestones}
          releases={releases}
          loading={anyLoading}
        />
      );
    }

    if (activeView === "prs") {
      if (prsLoading) {
        return (
          <Box gap={1} paddingX={1}>
            <Spinner type="dots" />
            <Text>Loading pull requests…</Text>
          </Box>
        );
      }
      if (prsError) {
        return (
          <Box paddingX={1}>
            <Text color="red">{prsError}</Text>
          </Box>
        );
      }
      if (prs.length === 0) {
        return <EmptyState message="No open pull requests" />;
      }
      return <PrList prs={prs} onFilteringChange={setIsFiltering} />;
    }

    if (activeView === "issues") {
      if (issuesLoading) {
        return (
          <Box gap={1} paddingX={1}>
            <Spinner type="dots" />
            <Text>Loading issues…</Text>
          </Box>
        );
      }
      if (issuesError) {
        return (
          <Box paddingX={1}>
            <Text color="red">{issuesError}</Text>
          </Box>
        );
      }
      if (issues.length === 0) {
        return <EmptyState message="No open issues" />;
      }
      return <IssueList issues={issues} onFilteringChange={setIsFiltering} />;
    }

    if (activeView === "milestones") {
      if (msLoading) {
        return (
          <Box gap={1} paddingX={1}>
            <Spinner type="dots" />
            <Text>Loading milestones…</Text>
          </Box>
        );
      }
      if (msError) {
        return (
          <Box paddingX={1}>
            <Text color="red">{msError}</Text>
          </Box>
        );
      }
      if (milestones.length === 0) {
        return <EmptyState message="No open milestones" />;
      }
      return <MilestoneList milestones={milestones} onFilteringChange={setIsFiltering} />;
    }

    if (activeView === "actions") {
      if (runsLoading) {
        return (
          <Box gap={1} paddingX={1}>
            <Spinner type="dots" />
            <Text>Loading workflow runs…</Text>
          </Box>
        );
      }
      if (runsError) {
        return (
          <Box paddingX={1}>
            <Text color="red">{runsError}</Text>
          </Box>
        );
      }
      if (runs.length === 0) {
        return <EmptyState message="No workflow runs" />;
      }
      return <RunList runs={runs} onFilteringChange={setIsFiltering} />;
    }

    if (activeView === "releases") {
      if (relLoading) {
        return (
          <Box gap={1} paddingX={1}>
            <Spinner type="dots" />
            <Text>Loading releases…</Text>
          </Box>
        );
      }
      if (relError) {
        return (
          <Box paddingX={1}>
            <Text color="red">{relError}</Text>
          </Box>
        );
      }
      if (releases.length === 0) {
        return <EmptyState message="No releases" />;
      }
      return <ReleaseList releases={releases} onFilteringChange={setIsFiltering} />;
    }

    return null;
  };

  return (
    <Box flexDirection="column" paddingX={1} height={stdout?.rows}>
      <Header repo={repo} prCount={prs.length} issueCount={issues.length} reviewRequestCount={reviewRequestCount} activeView={activeView} lastRefreshedAt={lastRefreshedAt} />
      <Box marginTop={1} flexDirection="column" flexGrow={1} overflow="hidden">
        {showHelp ? <HelpOverlay onClose={() => setShowHelp(false)} /> : renderView()}
      </Box>
      {!showHelp && <Footer activeView={activeView} />}
    </Box>
  );
}
