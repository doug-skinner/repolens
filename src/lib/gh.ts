import { $ } from "bun";
import type { Issue, Milestone, PullRequest, Release, RepoInfo, WorkflowRun } from "./types.js";

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
  "additions",
  "deletions",
].join(",");

export async function checkGhAuth(): Promise<boolean> {
  const result = await $`gh auth status`.quiet().nothrow();
  return result.exitCode === 0;
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
  "author",
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

const RELEASE_FIELDS = [
  "tagName",
  "name",
  "publishedAt",
  "isDraft",
  "isPrerelease",
  "isLatest",
].join(",");

export async function fetchReleases(): Promise<Release[]> {
  const result =
    await $`gh release list --json ${RELEASE_FIELDS} --limit 30`.quiet();
  return result.json();
}

export async function openReleaseInBrowser(tagName: string): Promise<void> {
  await $`gh release view ${tagName} --web`.quiet();
}
