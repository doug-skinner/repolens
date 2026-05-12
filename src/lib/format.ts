import type { StatusCheck, CheckSummary } from "./types.js";

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  const intervals = [
    { label: "d", seconds: 86400 },
    { label: "h", seconds: 3600 },
    { label: "m", seconds: 60 },
  ];
  for (const { label, seconds: s } of intervals) {
    const count = Math.floor(seconds / s);
    if (count >= 1) return `${count}${label} ago`;
  }
  return "just now";
}

export function isStale(dateStr: string, days: number): boolean {
  if (days <= 0) return false;
  const ms = Date.now() - new Date(dateStr).getTime();
  return ms > days * 86_400_000;
}

export function summarizeChecks(checks: StatusCheck[]): CheckSummary {
  if (checks.length === 0) return "none";
  if (checks.some((c) => c.conclusion === "FAILURE")) return "fail";
  if (checks.some((c) => c.status === "IN_PROGRESS")) return "running";
  if (checks.every((c) => c.status === "COMPLETED")) return "pass";
  return "pending";
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "…";
}

const SPARK_CHARS = "▁▂▃▄▅▆▇█";

export function sparkline(values: number[]): string {
  const max = Math.max(...values);
  if (max === 0) return SPARK_CHARS[0].repeat(values.length);
  return values
    .map((v) => SPARK_CHARS[Math.round((v / max) * (SPARK_CHARS.length - 1))])
    .join("");
}

export function bucketByDay(dates: string[], days: number): number[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const counts = new Array<number>(days).fill(0);
  for (const d of dates) {
    const diff = Math.floor((startOfToday.getTime() - new Date(d).getTime()) / 86_400_000);
    const idx = days - 1 - diff;
    if (idx >= 0 && idx < days) counts[idx]++;
  }
  return counts;
}
