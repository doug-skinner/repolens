import { useCallback } from "react";
import { usePagedGhData } from "./use-paged-gh-data.js";
import { fetchWorkflowRuns } from "../lib/gh.js";
import type { WorkflowRun } from "../lib/types.js";

export function useWorkflowRuns() {
  const fetchFn = useCallback((limit: number) => fetchWorkflowRuns(limit), []);
  const { data: runs, ...rest } = usePagedGhData<WorkflowRun>(fetchFn);
  return { runs, ...rest };
}
