import { useGhData } from "./use-gh-data.js";
import { fetchBranches } from "../lib/gh.js";
import type { Branch } from "../lib/types.js";

export function useBranches() {
  const { data: branches, ...rest } = useGhData<Branch[]>(fetchBranches, []);
  return { branches, ...rest };
}
