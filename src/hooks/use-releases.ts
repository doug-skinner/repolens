import { useCallback } from "react";
import { usePagedGhData } from "./use-paged-gh-data.js";
import { fetchReleases } from "../lib/gh.js";
import type { Release } from "../lib/types.js";

export function useReleases() {
  const fetchFn = useCallback((limit: number) => fetchReleases(limit), []);
  const { data: releases, ...rest } = usePagedGhData<Release>(fetchFn);
  return { releases, ...rest };
}
