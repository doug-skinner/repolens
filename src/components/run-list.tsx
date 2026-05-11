import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { RunRow } from "./run-row.js";
import { DetailPane } from "./detail-pane.js";
import { Breadcrumb } from "./breadcrumb.js";
import { FilterInput } from "./filter-input.js";
import { ConfirmBar } from "./confirm-bar.js";
import { openRunInBrowser, fetchRunJobs, rerunWorkflow } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import { useListFilter } from "../hooks/use-list-filter.js";
import { useListSort } from "../hooks/use-list-sort.js";
import { isStale } from "../lib/format.js";
import { STALE_DAYS } from "../lib/config.js";
import { matchesFilter } from "../lib/filter.js";
import { byDateDesc, byDateAsc, byStringAsc } from "../lib/sort.js";
import type { WorkflowRun, WorkflowJob } from "../lib/types.js";

const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "name", label: "Name" },
] as const;

interface RunListProps {
  runs: WorkflowRun[];
  onFilteringChange?: (editing: boolean) => void;
  onRunChanged?: () => void;
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

export function RunList({ runs, onFilteringChange, onRunChanged }: RunListProps) {
  const filter = useListFilter(onFilteringChange);
  const sort = useListSort(SORT_OPTIONS);
  const selectedIndexRef = useRef(0);
  const [confirmRerun, setConfirmRerun] = useState<{ runId: number; name: string } | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<"confirming" | "working" | "success" | "error">("confirming");

  const sorted = useMemo(() => {
    let items = runs.filter((run) =>
      matchesFilter(run.displayTitle, filter.filterQuery) ||
      matchesFilter(run.workflowName, filter.filterQuery),
    );
    if (sort.current === "oldest") items.sort((a, b) => byDateAsc(a.createdAt, b.createdAt));
    else if (sort.current === "name") items.sort((a, b) => byStringAsc(a.workflowName, b.workflowName));
    else if (sort.current === "newest") items.sort((a, b) => byDateDesc(a.createdAt, b.createdAt));
    return items;
  }, [runs, filter.filterQuery, sort.current]);

  const startRerun = useCallback((i: number) => {
    const run = sorted[i];
    if (!run) return;
    setConfirmRerun({ runId: run.databaseId, name: run.workflowName });
    setConfirmStatus("confirming");
    onFilteringChange?.(true);
  }, [sorted, onFilteringChange]);

  const handleConfirm = useCallback(async () => {
    if (!confirmRerun) return;
    setConfirmStatus("working");
    try {
      await rerunWorkflow(confirmRerun.runId);
      setConfirmStatus("success");
      onRunChanged?.();
      setTimeout(() => {
        setConfirmRerun(null);
        setConfirmStatus("confirming");
        onFilteringChange?.(false);
      }, 1500);
    } catch {
      setConfirmStatus("error");
      setTimeout(() => {
        setConfirmRerun(null);
        setConfirmStatus("confirming");
        onFilteringChange?.(false);
      }, 2000);
    }
  }, [confirmRerun, onRunChanged, onFilteringChange]);

  const handleCancel = useCallback(() => {
    setConfirmRerun(null);
    setConfirmStatus("confirming");
    onFilteringChange?.(false);
  }, [onFilteringChange]);

  const extraKeys = useMemo(() => ({
    s: sort.cycleSort,
    R: () => startRerun(selectedIndexRef.current),
  }), [sort.cycleSort, startRerun]);

  const onOpen = useCallback((i: number) => openRunInBrowser(sorted[i].url), [sorted]);
  const onYank = useCallback((i: number) => copyToClipboard(sorted[i].url), [sorted]);
  const onYankRef = useCallback((i: number) => copyToClipboard(String(sorted[i].databaseId)), [sorted]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(sorted.length, { onOpen, onYank, onYankRef, filter, extraKeys, resetTrigger: sort.current, inputBlocked: !!confirmRerun });
  selectedIndexRef.current = selectedIndex;
  const visible = sorted.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = sorted[selectedIndex];
  const viewLabel = sort.current !== "newest" ? `Actions [${sort.label}]` : "Actions";

  return (
    <Box flexDirection="column">
      <Breadcrumb view={viewLabel} detail={showDetail && selected ? `${selected.workflowName}: ${selected.displayTitle}` : undefined} />
      <FilterInput query={filter.filterQuery} isEditing={filter.isEditing} resultCount={sorted.length} totalCount={runs.length} />
      {confirmRerun && (
        <ConfirmBar
          message={confirmStatus === "success" ? `Re-ran ${confirmRerun.name}` : confirmStatus === "error" ? `Failed to re-run ${confirmRerun.name}` : `Re-run "${confirmRerun.name}"?`}
          status={confirmStatus}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
      <Box flexDirection="column">
        {visible.map((run, i) => (
          <RunRow key={run.databaseId} run={run} selected={scrollOffset + i === selectedIndex} stale={isStale(run.createdAt, STALE_DAYS)} />
        ))}
      </Box>
      {showDetail && selected && (
        <RunDetail run={selected} height={detailHeight} />
      )}
    </Box>
  );
}
