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
