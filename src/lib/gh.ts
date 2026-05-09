import { $ } from "bun";
import type { Issue, Milestone, PullRequest, Release, RepoInfo, WorkflowJob, WorkflowRun } from "./types.js";

const PR_FIELDS = [
  "number",
  "title",
  "author",
  "headRefName",
  "baseRefName",
  "reviewDecision",
  "statusCheckRollup",
  "url",
  "isDraft",
  "createdAt",
  "labels",
  "reviewRequests",
  "additions",
  "deletions",
].join(",");

export async function checkGhAuth(): Promise<boolean> {
  const result = await $`gh auth status`.quiet().nothrow();
  return result.exitCode === 0;
}

export async function fetchAuthenticatedUser(): Promise<string> {
  const result = await $`gh api user --jq .login`.quiet();
  return result.text().trim();
}

export async function fetchPullRequests(): Promise<PullRequest[]> {
  const result =
    await $`gh pr list --json ${PR_FIELDS} --limit 30`.quiet();
  return result.json();
}

export async function fetchRepoInfo(): Promise<RepoInfo> {
  const [repo, branch] = await Promise.all([
    $`gh repo view --json nameWithOwner`.quiet(),
    $`git branch --show-current`.quiet(),
  ]);
  const { nameWithOwner } = repo.json();
  return { nameWithOwner, branch: branch.text().trim() };
}

export async function openPrInBrowser(number: number): Promise<void> {
  await $`gh pr view ${number} --web`.quiet();
}

const ISSUE_FIELDS = [
  "number",
  "title",
  "body",
  "author",
  "assignees",
  "milestone",
  "labels",
  "createdAt",
  "url",
].join(",");

export async function fetchIssues(): Promise<Issue[]> {
  const result =
    await $`gh issue list --json ${ISSUE_FIELDS} --limit 30`.quiet();
  return result.json();
}

export async function openIssueInBrowser(number: number): Promise<void> {
  await $`gh issue view ${number} --web`.quiet();
}

export async function commentOnIssue(number: number, body: string): Promise<void> {
  await $`gh issue comment ${number} --body ${body}`.quiet();
}

export async function commentOnPr(number: number, body: string): Promise<void> {
  await $`gh pr comment ${number} --body ${body}`.quiet();
}

export async function fetchLabels(): Promise<string[]> {
  const result = await $`gh label list --json name --limit 100`.quiet();
  return (result.json() as { name: string }[]).map((l) => l.name).sort((a, b) => a.localeCompare(b));
}

export async function createIssue(opts: {
  title: string;
  body?: string;
  labels?: string[];
  milestone?: string;
  assignee?: string;
}): Promise<void> {
  const args: string[] = ["--title", opts.title];
  if (opts.body) args.push("--body", opts.body);
  if (opts.labels?.length) args.push("--label", opts.labels.join(","));
  if (opts.milestone) args.push("--milestone", opts.milestone);
  if (opts.assignee) args.push("--assignee", opts.assignee);
  await $`gh issue create ${args}`.quiet();
}

function parseVersion(title: string): [number, number, number] {
  const m = title.match(/v?(\d+)\.(\d+)\.(\d+)/);
  if (!m) return [Infinity, Infinity, Infinity];
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

export async function fetchMilestones(): Promise<Milestone[]> {
  const result = await $`gh api repos/{owner}/{repo}/milestones`.quiet();
  const milestones: Milestone[] = JSON.parse(result.text());
  return milestones.sort((a, b) => {
    const va = parseVersion(a.title);
    const vb = parseVersion(b.title);
    for (let i = 0; i < 3; i++) {
      if (va[i] !== vb[i]) return va[i] - vb[i];
    }
    return 0;
  });
}

export interface MilestoneIssue {
  number: number;
  title: string;
  state: string;
}

export async function fetchMilestoneIssues(milestoneTitle: string): Promise<MilestoneIssue[]> {
  const result =
    await $`gh issue list --milestone ${milestoneTitle} --state all --json number,title,state --limit 100`.quiet();
  return result.json();
}

export async function openMilestoneInBrowser(url: string): Promise<void> {
  await $`open ${url}`.quiet();
}

const RUN_FIELDS = [
  "databaseId",
  "displayTitle",
  "workflowName",
  "status",
  "conclusion",
  "headBranch",
  "createdAt",
  "url",
].join(",");

export async function fetchWorkflowRuns(): Promise<WorkflowRun[]> {
  const result =
    await $`gh run list --json ${RUN_FIELDS} --limit 30`.quiet();
  return result.json();
}

export async function openRunInBrowser(url: string): Promise<void> {
  await $`open ${url}`.quiet();
}

export async function fetchRunJobs(runId: number): Promise<WorkflowJob[]> {
  const result = await $`gh run view ${runId} --json jobs`.quiet();
  const { jobs } = result.json() as { jobs: WorkflowJob[] };
  return jobs;
}

interface RawRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  draft: boolean;
  prerelease: boolean;
  html_url: string;
  author: { login: string };
  assets: { download_count: number }[];
}

export async function fetchReleases(): Promise<Release[]> {
  const result = await $`gh api repos/{owner}/{repo}/releases?per_page=30`.quiet();
  const raw: RawRelease[] = JSON.parse(result.text());
  let foundLatest = false;
  return raw.map((r) => {
    const isLatest = !foundLatest && !r.draft && !r.prerelease;
    if (isLatest) foundLatest = true;
    return {
      tagName: r.tag_name,
      name: r.name,
      body: r.body ?? "",
      publishedAt: r.published_at,
      isDraft: r.draft,
      isPrerelease: r.prerelease,
      isLatest,
      url: r.html_url,
      author: { login: r.author.login },
      downloadCount: r.assets.reduce((sum, a) => sum + a.download_count, 0),
    };
  });
}

export async function openReleaseInBrowser(tagName: string): Promise<void> {
  await $`gh release view ${tagName} --web`.quiet();
}

export async function fetchReviewRequestCount(): Promise<number> {
  const result =
    await $`gh pr list --search "review-requested:@me" --json number --limit 100`.quiet();
  return (result.json() as unknown[]).length;
}
