import { useCallback } from "react";
import { usePagedGhData } from "./use-paged-gh-data.js";
import { fetchPullRequests } from "../lib/gh.js";
import type { PullRequest } from "../lib/types.js";

export function usePullRequests() {
  const fetchFn = useCallback((limit: number) => fetchPullRequests(limit), []);
  const { data: prs, ...rest } = usePagedGhData<PullRequest>(fetchFn);
  return { prs, ...rest };
}
