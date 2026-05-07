import { useState, useEffect, useCallback } from "react";
import { fetchPullRequests } from "../lib/gh.js";
import type { PullRequest } from "../lib/types.js";

export function usePullRequests() {
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPrs(await fetchPullRequests());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch PRs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { prs, loading, error, refetch: load };
}
