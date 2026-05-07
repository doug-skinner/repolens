import { useGhData } from "./use-gh-data.js";
import { fetchIssues } from "../lib/gh.js";
import type { Issue } from "../lib/types.js";

export function useIssues() {
  const { data: issues, ...rest } = useGhData<Issue[]>(fetchIssues, []);
  return { issues, ...rest };
}
