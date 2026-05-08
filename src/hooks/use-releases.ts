import { useGhData } from "./use-gh-data.js";
import { fetchReleases } from "../lib/gh.js";
import type { Release } from "../lib/types.js";

export function useReleases() {
  const { data: releases, ...rest } = useGhData<Release[]>(fetchReleases, []);
  return { releases, ...rest };
}
