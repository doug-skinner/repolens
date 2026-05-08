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
import { useListSort } from "../hooks/use-list-sort.js";
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
  username: string | null;
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

export function RunList({ runs, username, onFilteringChange }: RunListProps) {
  const filter = useListFilter(onFilteringChange);
  const sort = useListSort(SORT_OPTIONS);
  const [mine, setMine] = useState(false);

  const toggleMine = useCallback(() => setMine((v) => !v), []);

  const sorted = useMemo(() => {
    let items = runs.filter((run) =>
      matchesFilter(run.displayTitle, filter.filterQuery) ||
      matchesFilter(run.workflowName, filter.filterQuery),
    );
    if (mine && username) {
      items = items.filter((run) => run.actor.login === username);
    }
    if (sort.current === "oldest") items.sort((a, b) => byDateAsc(a.createdAt, b.createdAt));
    else if (sort.current === "name") items.sort((a, b) => byStringAsc(a.workflowName, b.workflowName));
    else if (sort.current === "newest") items.sort((a, b) => byDateDesc(a.createdAt, b.createdAt));
    return items;
  }, [runs, filter.filterQuery, mine, username, sort.current]);

  const extraKeys = useMemo(() => ({ s: sort.cycleSort, m: toggleMine }), [sort.cycleSort, toggleMine]);

  const onOpen = useCallback((i: number) => openRunInBrowser(sorted[i].url), [sorted]);
  const onYank = useCallback((i: number) => copyToClipboard(sorted[i].url), [sorted]);
  const onYankRef = useCallback((i: number) => copyToClipboard(String(sorted[i].databaseId)), [sorted]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(sorted.length, { onOpen, onYank, onYankRef, filter, extraKeys, resetTrigger: `${mine}:${sort.current}` });
  const visible = sorted.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = sorted[selectedIndex];
  const tags: string[] = [];
  if (mine) tags.push("Mine");
  if (sort.current !== "newest") tags.push(sort.label);
  const viewLabel = tags.length > 0 ? `Actions [${tags.join(", ")}]` : "Actions";

  return (
    <Box flexDirection="column">
      <Breadcrumb view={viewLabel} detail={showDetail && selected ? `${selected.workflowName}: ${selected.displayTitle}` : undefined} />
      <FilterInput query={filter.filterQuery} isEditing={filter.isEditing} resultCount={sorted.length} totalCount={runs.length} />
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
