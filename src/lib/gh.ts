import { $ } from "bun";
import type { PullRequest, RepoInfo } from "./types.js";

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
