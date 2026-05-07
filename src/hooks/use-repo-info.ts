import { useState, useEffect } from "react";
import { fetchRepoInfo } from "../lib/gh.js";
import type { RepoInfo } from "../lib/types.js";

export function useRepoInfo() {
  const [repo, setRepo] = useState<RepoInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepoInfo()
      .then(setRepo)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { repo, loading };
}
