import { useGhData } from "./use-gh-data.js";
import { fetchPullRequests } from "../lib/gh.js";
import type { PullRequest } from "../lib/types.js";

export function usePullRequests() {
  const { data: prs, ...rest } = useGhData<PullRequest[]>(fetchPullRequests, []);
  return { prs, ...rest };
}
