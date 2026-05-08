import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { RunRow } from "./run-row.js";
import { DetailPane } from "./detail-pane.js";
import { Breadcrumb } from "./breadcrumb.js";
import { FilterInput } from "./filter-input.js";
import { openRunInBrowser, fetchRunJobs } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import { useListFilter } from "../hooks/use-list-filter.js";
import { matchesFilter } from "../lib/filter.js";
import type { WorkflowRun, WorkflowJob } from "../lib/types.js";

interface RunListProps {
  runs: WorkflowRun[];
  onFilteringChange?: (editing: boolean) => void;
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
          const failedStep = job.conclusion === "failure"
            ? job.steps?.find((s) => s.conclusion === "failure")
            : null;
          return (
            <Box key={job.name} flexDirection="column">
              <Box gap={1}>
                <Text color={color}>{symbol}</Text>
                <Text>{job.name}</Text>
              </Box>
              {failedStep && (
                <Box paddingLeft={2} gap={1}>
                  <Text dimColor>└</Text>
                  <Text color="red">{failedStep.name}</Text>
                </Box>
              )}
            </Box>
          );
        })
      ) : (
        <Text dimColor>No jobs found</Text>
      )}
    </DetailPane>
  );
}

export function RunList({ runs, onFilteringChange }: RunListProps) {
  const filter = useListFilter(onFilteringChange);
  const filtered = useMemo(
    () => runs.filter((run) =>
      matchesFilter(run.displayTitle, filter.filterQuery) ||
      matchesFilter(run.workflowName, filter.filterQuery),
    ),
    [runs, filter.filterQuery],
  );

  const onOpen = useCallback((i: number) => openRunInBrowser(filtered[i].url), [filtered]);
  const onYank = useCallback((i: number) => copyToClipboard(filtered[i].url), [filtered]);
  const onYankRef = useCallback((i: number) => copyToClipboard(String(filtered[i].databaseId)), [filtered]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(filtered.length, { onOpen, onYank, onYankRef, filter });
  const visible = filtered.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = filtered[selectedIndex];

  return (
    <Box flexDirection="column">
      <Breadcrumb view="Actions" detail={showDetail && selected ? `${selected.workflowName}: ${selected.displayTitle}` : undefined} />
      <FilterInput query={filter.filterQuery} isEditing={filter.isEditing} resultCount={filtered.length} totalCount={runs.length} />
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
