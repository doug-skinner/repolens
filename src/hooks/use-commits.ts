import { useGhData } from "./use-gh-data.js";
import { fetchCommits } from "../lib/gh.js";
import type { Commit } from "../lib/types.js";

export function useCommits() {
  const { data: commits, ...rest } = useGhData<Commit[]>(fetchCommits, []);
  return { commits, ...rest };
}
