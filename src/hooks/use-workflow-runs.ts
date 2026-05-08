import { useGhData } from "./use-gh-data.js";
import { fetchWorkflowRuns } from "../lib/gh.js";
import type { WorkflowRun } from "../lib/types.js";

export function useWorkflowRuns() {
  const { data: runs, ...rest } = useGhData<WorkflowRun[]>(fetchWorkflowRuns, []);
  return { runs, ...rest };
}
