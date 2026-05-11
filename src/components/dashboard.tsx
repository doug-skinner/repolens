import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { timeAgo, truncate } from "../lib/format.js";
import { useConfig, useTheme } from "../lib/config-context.js";
import type { DashboardSection } from "../lib/config.js";
import type { PullRequest, Issue, WorkflowRun, Milestone, Release } from "../lib/types.js";
import type { ReactNode } from "react";

interface DashboardProps {
  prs: PullRequest[];
  issues: Issue[];
  runs: WorkflowRun[];
  milestones: Milestone[];
  releases: Release[];
  loading: boolean;
}

function SectionHeader({ label, keyHint }: { label: string; keyHint: string }) {
  const theme = useTheme();
  return (
    <Text bold color={theme.accent}>
      {keyHint}:{label}
    </Text>
  );
}

const VIEW_KEY_HINTS: Record<DashboardSection, string> = {
  prs: "2",
  issues: "3",
  actions: "4",
  milestones: "5",
  releases: "6",
};

function PrSection({ prs }: { prs: PullRequest[] }) {
  const theme = useTheme();
  return (
    <Box flexDirection="column">
      <SectionHeader label="Pull Requests" keyHint={VIEW_KEY_HINTS.prs} />
      <Text>
        <Text color={theme.success} bold>{prs.length}</Text>
        <Text dimColor> open</Text>
      </Text>
      {prs.slice(0, 3).map((pr) => (
        <Text key={pr.number} dimColor>
          #{pr.number} {truncate(pr.title, 48)}
        </Text>
      ))}
    </Box>
  );
}

function IssueSection({ issues }: { issues: Issue[] }) {
  const theme = useTheme();
  return (
    <Box flexDirection="column">
      <SectionHeader label="Issues" keyHint={VIEW_KEY_HINTS.issues} />
      <Text>
        <Text color={theme.warning} bold>{issues.length}</Text>
        <Text dimColor> open</Text>
      </Text>
      {issues.slice(0, 3).map((issue) => (
        <Text key={issue.number} dimColor>
          #{issue.number} {truncate(issue.title, 48)}
        </Text>
      ))}
    </Box>
  );
}

function ActionsSection({ runs }: { runs: WorkflowRun[] }) {
  const theme = useTheme();
  const passed = runs.filter((r) => r.conclusion === "success").length;
  const failed = runs.filter((r) => r.conclusion === "failure").length;
  const running = runs.filter((r) => r.status === "in_progress").length;

  return (
    <Box flexDirection="column">
      <SectionHeader label="Actions" keyHint={VIEW_KEY_HINTS.actions} />
      <Box gap={2}>
        <Text>
          <Text color={theme.success}>✓ {passed}</Text>
        </Text>
        <Text>
          <Text color={theme.error}>✗ {failed}</Text>
        </Text>
        <Text>
          <Text color={theme.warning}>● {running}</Text>
        </Text>
      </Box>
      {runs.slice(0, 2).map((run) => (
        <Text key={run.databaseId} dimColor>
          {run.conclusion === "success" ? "✓" : run.conclusion === "failure" ? "✗" : "●"}{" "}
          {truncate(run.displayTitle, 44)} <Text>{timeAgo(run.createdAt)}</Text>
        </Text>
      ))}
    </Box>
  );
}

function MilestoneSection({ milestones }: { milestones: Milestone[] }) {
  const next = milestones
    .filter((m) => m.due_on)
    .sort((a, b) => new Date(a.due_on!).getTime() - new Date(b.due_on!).getTime())
    .find((m) => new Date(m.due_on!) >= new Date());

  return (
    <Box flexDirection="column">
      <SectionHeader label="Milestones" keyHint={VIEW_KEY_HINTS.milestones} />
      {next ? (
        <>
          <Text>
            <Text bold>{next.title}</Text>
          </Text>
          <Text dimColor>
            due {new Date(next.due_on!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {" · "}
            {next.closed_issues}/{next.open_issues + next.closed_issues} done
          </Text>
        </>
      ) : milestones.length > 0 ? (
        <>
          <Text>
            <Text bold>{milestones[0].title}</Text>
          </Text>
          <Text dimColor>
            {milestones[0].closed_issues}/{milestones[0].open_issues + milestones[0].closed_issues} done
          </Text>
        </>
      ) : (
        <Text dimColor>No milestones</Text>
      )}
    </Box>
  );
}

function ReleaseSection({ releases }: { releases: Release[] }) {
  const theme = useTheme();
  const latest = releases.find((r) => r.isLatest) ?? releases[0];

  return (
    <Box flexDirection="column">
      <SectionHeader label="Releases" keyHint={VIEW_KEY_HINTS.releases} />
      {latest ? (
        <Text>
          <Text bold color={theme.info}>{latest.tagName}</Text>
          {latest.name && latest.name !== latest.tagName && (
            <Text dimColor> {truncate(latest.name, 36)}</Text>
          )}
          <Text dimColor> · {timeAgo(latest.publishedAt)}</Text>
        </Text>
      ) : (
        <Text dimColor>No releases</Text>
      )}
    </Box>
  );
}

export function Dashboard({ prs, issues, runs, milestones, releases, loading }: DashboardProps) {
  const { dashboard } = useConfig();

  if (loading && prs.length === 0 && issues.length === 0) {
    return (
      <Box gap={1} paddingX={1}>
        <Spinner type="dots" />
        <Text>Loading dashboard…</Text>
      </Box>
    );
  }

  const sectionMap: Record<DashboardSection, ReactNode> = {
    prs: <PrSection prs={prs} />,
    issues: <IssueSection issues={issues} />,
    actions: <ActionsSection runs={runs} />,
    milestones: <MilestoneSection milestones={milestones} />,
    releases: <ReleaseSection releases={releases} />,
  };

  const visibleSections = dashboard.sections.filter((s) => s in sectionMap);

  const rows: [DashboardSection, DashboardSection?][] = [];
  for (let i = 0; i < visibleSections.length; i += 2) {
    rows.push([visibleSections[i], visibleSections[i + 1]]);
  }

  const COL = 38;

  return (
    <Box flexDirection="column" gap={1} paddingX={1}>
      {rows.map(([left, right], i) => (
        <Box key={i} gap={2}>
          <Box width={COL} flexShrink={0} flexDirection="column">{sectionMap[left]}</Box>
          {right && <Box flexDirection="column">{sectionMap[right]}</Box>}
        </Box>
      ))}
    </Box>
  );
}
