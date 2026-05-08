import { useGhData } from "./use-gh-data.js";
import { fetchReviewRequestCount } from "../lib/gh.js";

export function useReviewRequests() {
  const { data: count, ...rest } = useGhData(fetchReviewRequestCount, 0);
  return { count, ...rest };
}
