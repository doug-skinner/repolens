import { useState, useCallback, useEffect, useRef } from "react";

const PAGE_SIZE = 30;

interface PagedResult<T> {
  data: T[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}

export function usePagedGhData<T>(
  fetchFn: (limit: number) => Promise<T[]>,
  pageSize: number = PAGE_SIZE,
): PagedResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limitRef = useRef(pageSize);
  const hasLoaded = useRef(false);
  const isFetching = useRef(false);

  const load = useCallback(async (targetLimit: number, isMore: boolean) => {
    if (isFetching.current) return;
    isFetching.current = true;
    if (isMore) setLoadingMore(true);
    else if (!hasLoaded.current) setLoading(true);
    setError(null);
    try {
      const result = await fetchFn(targetLimit);
      setData(result);
      limitRef.current = targetLimit;
      hasLoaded.current = true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch data");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetching.current = false;
    }
  }, [fetchFn]);

  useEffect(() => {
    load(pageSize, false);
  }, [load, pageSize]);

  const loadMore = useCallback(() => {
    load(limitRef.current + pageSize, true);
  }, [load, pageSize]);

  const refetch = useCallback(() => {
    load(limitRef.current, false);
  }, [load]);

  const hasMore = data.length >= limitRef.current;

  return { data, loading, loadingMore, error, hasMore, loadMore, refetch };
}
