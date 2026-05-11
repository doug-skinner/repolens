import { useGhData } from "./use-gh-data.js";
import { fetchNotifications } from "../lib/gh.js";
import type { GitHubNotification } from "../lib/types.js";

export function useNotifications() {
  const { data: notifications, ...rest } = useGhData<GitHubNotification[]>(fetchNotifications, []);
  return { notifications, ...rest };
}
