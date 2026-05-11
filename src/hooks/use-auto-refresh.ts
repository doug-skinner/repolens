import { useState, useEffect, useCallback, useRef } from "react";
import { useConfig } from "../lib/config-context.js";

interface UseAutoRefreshOptions {
  refetch: () => void;
  paused?: boolean;
}

export function useAutoRefresh({ refetch, paused }: UseAutoRefreshOptions) {
  const { refreshInterval } = useConfig();
  const intervalMs = refreshInterval * 1000;
  const disabled = refreshInterval === 0;

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
    if (disabled) return;
    timerRef.current = setInterval(tick, intervalMs);
  }, [clearTimer, tick, disabled, intervalMs]);

  useEffect(() => {
    if (paused || disabled) {
      clearTimer();
    } else {
      startTimer();
    }
    return clearTimer;
  }, [paused, disabled, startTimer, clearTimer]);

  const refreshNow = useCallback(() => {
    tick();
    if (!paused && !disabled) startTimer();
  }, [tick, paused, disabled, startTimer]);

  return { lastRefreshedAt, refreshNow };
}
