import { useCallback } from "react";
import { usePagedGhData } from "./use-paged-gh-data.js";
import { fetchNotifications } from "../lib/gh.js";
import type { GitHubNotification } from "../lib/types.js";

export function useNotifications() {
  const fetchFn = useCallback((limit: number) => fetchNotifications(limit), []);
  const { data: notifications, ...rest } = usePagedGhData<GitHubNotification>(fetchFn, 50);
  return { notifications, ...rest };
}
