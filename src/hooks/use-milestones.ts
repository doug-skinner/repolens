import { useGhData } from "./use-gh-data.js";
import { fetchMilestones } from "../lib/gh.js";
import type { Milestone } from "../lib/types.js";

export function useMilestones() {
  const { data: milestones, ...rest } = useGhData<Milestone[]>(fetchMilestones, []);
  return { milestones, ...rest };
}
