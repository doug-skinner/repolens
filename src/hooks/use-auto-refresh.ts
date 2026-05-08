import { useState, useEffect, useCallback, useRef } from "react";

const REFRESH_INTERVAL_MS = 30_000;

interface UseAutoRefreshOptions {
  refetch: () => void;
  paused?: boolean;
}

export function useAutoRefresh({ refetch, paused }: UseAutoRefreshOptions) {
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    refetch();
    setLastRefreshedAt(new Date());
  }, [refetch]);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(tick, REFRESH_INTERVAL_MS);
  }, [clearTimer, tick]);

  useEffect(() => {
    if (paused) {
      clearTimer();
    } else {
      startTimer();
    }
    return clearTimer;
  }, [paused, startTimer, clearTimer]);

  const refreshNow = useCallback(() => {
    tick();
    if (!paused) startTimer();
  }, [tick, paused, startTimer]);

  return { lastRefreshedAt, refreshNow };
}
