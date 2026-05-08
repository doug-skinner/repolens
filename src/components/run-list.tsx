import { useState, useEffect, useCallback } from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { RunRow } from "./run-row.js";
import { DetailPane } from "./detail-pane.js";
import { Breadcrumb } from "./breadcrumb.js";
import { openRunInBrowser, fetchRunJobs } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import type { WorkflowRun, WorkflowJob } from "../lib/types.js";

interface RunListProps {
  runs: WorkflowRun[];
}

function jobSymbol(job: WorkflowJob): { symbol: string; color: string } {
  if (job.status === "in_progress") return { symbol: "●", color: "yellow" };
  if (job.status === "queued" || job.status === "waiting")
    return { symbol: "○", color: "yellow" };
  if (job.conclusion === "success") return { symbol: "✓", color: "green" };
  if (job.conclusion === "failure") return { symbol: "✗", color: "red" };
  if (job.conclusion === "cancelled") return { symbol: "⊘", color: "gray" };
  return { symbol: "·", color: "gray" };
}

function RunDetail({ run, height }: { run: WorkflowRun; height: number }) {
  const [jobs, setJobs] = useState<WorkflowJob[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setJobs(null);
    fetchRunJobs(run.databaseId).then((result) => {
      if (!cancelled) {
        setJobs(result);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [run.databaseId]);

  return (
    <DetailPane title={`${run.workflowName}: ${run.displayTitle}`} height={height}>
      <Box gap={1}>
        <Text dimColor>Branch:</Text>
        <Text color="cyan">{run.headBranch}</Text>
        <Text dimColor>Status:</Text>
        <Text>{run.status}{run.conclusion ? ` (${run.conclusion})` : ""}</Text>
      </Box>
      {loading ? (
        <Box gap={1}>
          <Spinner type="dots" />
          <Text dimColor>Loading jobs…</Text>
        </Box>
      ) : jobs && jobs.length > 0 ? (
        jobs.map((job) => {
          const { symbol, color } = jobSymbol(job);
          return (
            <Box key={job.name} gap={1}>
              <Text color={color}>{symbol}</Text>
              <Text>{job.name}</Text>
            </Box>
          );
        })
      ) : (
        <Text dimColor>No jobs found</Text>
      )}
    </DetailPane>
  );
}

export function RunList({ runs }: RunListProps) {
  const onOpen = useCallback((i: number) => openRunInBrowser(runs[i].url), [runs]);
  const onYank = useCallback((i: number) => copyToClipboard(runs[i].url), [runs]);
  const onYankRef = useCallback((i: number) => copyToClipboard(String(runs[i].databaseId)), [runs]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(runs.length, { onOpen, onYank, onYankRef });
  const visible = runs.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = runs[selectedIndex];

  return (
    <Box flexDirection="column">
      <Breadcrumb view="Actions" detail={showDetail && selected ? `${selected.workflowName}: ${selected.displayTitle}` : undefined} />
      <Box flexDirection="column">
        {visible.map((run, i) => (
          <RunRow key={run.databaseId} run={run} selected={scrollOffset + i === selectedIndex} />
        ))}
      </Box>
      {showDetail && selected && (
        <RunDetail run={selected} height={detailHeight} />
      )}
    </Box>
  );
}
