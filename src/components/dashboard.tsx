import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { timeAgo, truncate } from "../lib/format.js";
import type { PullRequest, Issue, WorkflowRun, Milestone, Release } from "../lib/types.js";

interface DashboardProps {
  prs: PullRequest[];
  issues: Issue[];
  runs: WorkflowRun[];
  milestones: Milestone[];
  releases: Release[];
  loading: boolean;
}

function SectionHeader({ label, keyHint }: { label: string; keyHint: string }) {
  return (
    <Text bold color="cyan">
      {keyHint}:{label}
    </Text>
  );
}

function PrSection({ prs }: { prs: PullRequest[] }) {
  return (
    <Box flexDirection="column">
      <SectionHeader label="Pull Requests" keyHint="2" />
      <Text>
        <Text color="green" bold>{prs.length}</Text>
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
  return (
    <Box flexDirection="column">
      <SectionHeader label="Issues" keyHint="3" />
      <Text>
        <Text color="yellow" bold>{issues.length}</Text>
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
  const passed = runs.filter((r) => r.conclusion === "success").length;
  const failed = runs.filter((r) => r.conclusion === "failure").length;
  const running = runs.filter((r) => r.status === "in_progress").length;

  return (
    <Box flexDirection="column">
      <SectionHeader label="Actions" keyHint="4" />
      <Box gap={2}>
        <Text>
          <Text color="green">✓ {passed}</Text>
        </Text>
        <Text>
          <Text color="red">✗ {failed}</Text>
        </Text>
        <Text>
          <Text color="yellow">● {running}</Text>
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
      <SectionHeader label="Milestones" keyHint="5" />
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
        <Text dimColor>{milestones.length} milestone{milestones.length !== 1 ? "s" : ""} (none with upcoming due date)</Text>
      ) : (
        <Text dimColor>No milestones</Text>
      )}
    </Box>
  );
}

function ReleaseSection({ releases }: { releases: Release[] }) {
  const latest = releases.find((r) => r.isLatest) ?? releases[0];

  return (
    <Box flexDirection="column">
      <SectionHeader label="Releases" keyHint="6" />
      {latest ? (
        <Text>
          <Text bold color="magenta">{latest.tagName}</Text>
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
  if (loading && prs.length === 0 && issues.length === 0) {
    return (
      <Box gap={1} paddingX={1}>
        <Spinner type="dots" />
        <Text>Loading dashboard…</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" gap={1} paddingX={1}>
      <Box gap={4}>
        <PrSection prs={prs} />
        <IssueSection issues={issues} />
      </Box>
      <Box gap={4}>
        <ActionsSection runs={runs} />
        <MilestoneSection milestones={milestones} />
      </Box>
      <ReleaseSection releases={releases} />
    </Box>
  );
}
