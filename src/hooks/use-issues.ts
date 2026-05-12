import { useCallback } from "react";
import { usePagedGhData } from "./use-paged-gh-data.js";
import { fetchIssues } from "../lib/gh.js";
import type { Issue } from "../lib/types.js";

export function useIssues() {
  const fetchFn = useCallback((limit: number) => fetchIssues(limit), []);
  const { data: issues, ...rest } = usePagedGhData<Issue>(fetchFn);
  return { issues, ...rest };
}
