import { useState, useCallback, useMemo, useRef } from "react";
import { Box, Text } from "ink";
import { PrRow } from "./pr-row.js";
import { PrDiffView } from "./pr-diff-view.js";
import { DetailPane } from "./detail-pane.js";
import { Breadcrumb } from "./breadcrumb.js";
import { FilterInput } from "./filter-input.js";
import { CommentInput } from "./comment-input.js";
import { ConfirmBar } from "./confirm-bar.js";
import { MergeBar, type MergeStrategy } from "./merge-bar.js";
import { PickerOverlay } from "./picker-overlay.js";
import { openPrInBrowser, commentOnPr, mergePr, closePr, approvePr, requestChangesPr, fetchLabels, fetchCollaborators, setPrLabels, setPrAssignees, fetchPrDiff } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import { useListFilter } from "../hooks/use-list-filter.js";
import { useListSort } from "../hooks/use-list-sort.js";
import { useCommentInput } from "../hooks/use-comment-input.js";
import { truncate, isStale } from "../lib/format.js";
import { useConfig, useTheme } from "../lib/config-context.js";
import { matchesFilter } from "../lib/filter.js";
import { byDateDesc, byDateAsc, byStringAsc } from "../lib/sort.js";
import type { PullRequest } from "../lib/types.js";

const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "title", label: "Title" },
] as const;

interface PrListProps {
  prs: PullRequest[];
  username: string | null;
  onFilteringChange?: (editing: boolean) => void;
  onPrChanged?: () => void;
}

function PrDetail({ pr, height }: { pr: PullRequest; height: number }) {
  const theme = useTheme();

  function checkSymbol(status: string, conclusion: string): { symbol: string; color: string } {
    if (status === "IN_PROGRESS") return { symbol: "●", color: theme.warning };
    if (conclusion === "SUCCESS") return { symbol: "✓", color: theme.success };
    if (conclusion === "FAILURE") return { symbol: "✗", color: theme.error };
    return { symbol: "○", color: theme.warning };
  }

  return (
    <DetailPane title={`#${pr.number} ${pr.title}`} height={height}>
      <Box gap={1}>
        <Text dimColor>Branch:</Text>
        <Text color={theme.branch}>{pr.headRefName}</Text>
        <Text dimColor>{"→"}</Text>
        <Text color={theme.branch}>{pr.baseRefName}</Text>
      </Box>
      <Box gap={1}>
        <Text dimColor>Diff:</Text>
        <Text color={theme.success}>+{pr.additions}</Text>
        <Text color={theme.error}>-{pr.deletions}</Text>
      </Box>
      {pr.assignees.length > 0 && (
        <Box gap={1}>
          <Text dimColor>Assignees:</Text>
          <Text>{pr.assignees.map((a) => a.login).join(", ")}</Text>
        </Box>
      )}
      {pr.reviewRequests.length > 0 && (
        <Box gap={1}>
          <Text dimColor>Reviewers:</Text>
          <Text>{pr.reviewRequests.map((r) => r.login).join(", ")}</Text>
        </Box>
      )}
      {pr.labels.length > 0 && (
        <Box gap={1}>
          <Text dimColor>Labels:</Text>
          <Text color={theme.warning}>{pr.labels.map((l) => l.name).join(", ")}</Text>
        </Box>
      )}
      {pr.statusCheckRollup.map((check) => {
        const { symbol, color } = checkSymbol(check.status, check.conclusion);
        return (
          <Box key={check.name} gap={1}>
            <Text color={color}>{symbol}</Text>
            <Text>{truncate(check.name, 60)}</Text>
          </Box>
        );
      })}
    </DetailPane>
  );
}

export function PrList({ prs, username, onFilteringChange, onPrChanged }: PrListProps) {
  const { staleDays } = useConfig();
  const filter = useListFilter(onFilteringChange);
  const comment = useCommentInput(onFilteringChange);
  const sort = useListSort(SORT_OPTIONS);
  const [mine, setMine] = useState(false);
  const commentTargetRef = useRef(0);
  const selectedIndexRef = useRef(0);
  const [markedNumbers, setMarkedNumbers] = useState<Set<number>>(new Set());
  const [confirm, setConfirm] = useState<{ action: "close" | "approve"; numbers: number[]; title: string } | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<"confirming" | "working" | "success" | "error">("confirming");
  const [merge, setMerge] = useState<{ number: number; title: string } | null>(null);
  const [mergeStatus, setMergeStatus] = useState<"choosing" | "working" | "success" | "error">("choosing");
  const commentModeRef = useRef<"comment" | "request-changes">("comment");

  const [diffView, setDiffView] = useState<{ number: number; title: string; diff: string } | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  const [picker, setPicker] = useState<{ kind: "labels" | "assignees"; targets: number[]; current: Set<string> } | null>(null);
  const [pickerOptions, setPickerOptions] = useState<string[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const toggleMine = useCallback(() => setMine((v) => !v), []);

  const sorted = useMemo(() => {
    let items = prs.filter((pr) => matchesFilter(pr.title, filter.filterQuery, pr.labels));
    if (mine && username) {
      items = items.filter((pr) =>
        pr.author.login === username || pr.reviewRequests.some((r) => r.login === username),
      );
    }
    if (sort.current === "oldest") items.sort((a, b) => byDateAsc(a.createdAt, b.createdAt));
    else if (sort.current === "title") items.sort((a, b) => byStringAsc(a.title, b.title));
    else if (sort.current === "newest") items.sort((a, b) => byDateDesc(a.createdAt, b.createdAt));
    return items;
  }, [prs, filter.filterQuery, mine, username, sort.current]);

  const onToggleMark = useCallback((i: number) => {
    const num = sorted[i]?.number;
    if (num == null) return;
    setMarkedNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num); else next.add(num);
      return next;
    });
  }, [sorted]);

  const getTargets = useCallback((i: number): number[] => {
    if (markedNumbers.size > 0) return [...markedNumbers];
    const num = sorted[i]?.number;
    return num != null ? [num] : [];
  }, [sorted, markedNumbers]);

  const openPicker = useCallback((kind: "labels" | "assignees", i: number) => {
    const targets = getTargets(i);
    if (targets.length === 0) return;
    const bulk = targets.length > 1;
    const current = bulk
      ? new Set<string>()
      : kind === "labels"
        ? new Set(sorted[i].labels.map((l) => l.name))
        : new Set(sorted[i].assignees.map((a) => a.login));
    setPicker({ kind, targets, current });
    setPickerLoading(true);
    onFilteringChange?.(true);
    const fetch = kind === "labels" ? fetchLabels() : fetchCollaborators();
    fetch.then((opts) => { setPickerOptions(opts); setPickerLoading(false); })
      .catch(() => { setPickerOptions([]); setPickerLoading(false); });
  }, [sorted, getTargets, onFilteringChange]);

  const handlePickerConfirm = useCallback(async (selected: Set<string>) => {
    if (!picker) return;
    const { kind, targets, current } = picker;
    const bulk = targets.length > 1;
    const add = bulk ? [...selected] : [...selected].filter((s) => !current.has(s));
    const remove = bulk ? [] : [...current].filter((s) => !selected.has(s));
    try {
      const fn = kind === "labels" ? setPrLabels : setPrAssignees;
      await Promise.all(targets.map((n) => fn(n, add, remove)));
      onPrChanged?.();
    } catch { /* silently fail */ }
    if (bulk) setMarkedNumbers(new Set());
    setPicker(null);
    onFilteringChange?.(false);
  }, [picker, onPrChanged, onFilteringChange]);

  const handlePickerCancel = useCallback(() => {
    setPicker(null);
    onFilteringChange?.(false);
  }, [onFilteringChange]);

  const startConfirm = useCallback((action: "close" | "approve", i: number) => {
    const targets = getTargets(i);
    if (targets.length === 0) return;
    const title = targets.length === 1
      ? `#${targets[0]} "${sorted.find((s) => s.number === targets[0])?.title ?? ""}"`
      : `${targets.length} PRs`;
    setConfirm({ action, numbers: targets, title });
    setConfirmStatus("confirming");
    onFilteringChange?.(true);
  }, [sorted, getTargets, onFilteringChange]);

  const handleConfirm = useCallback(async () => {
    if (!confirm) return;
    setConfirmStatus("working");
    try {
      const fn = confirm.action === "approve" ? approvePr : closePr;
      await Promise.all(confirm.numbers.map((n) => fn(n)));
      setConfirmStatus("success");
      onPrChanged?.();
      if (confirm.numbers.length > 1) setMarkedNumbers(new Set());
      setTimeout(() => {
        setConfirm(null);
        setConfirmStatus("confirming");
        onFilteringChange?.(false);
      }, 1500);
    } catch {
      setConfirmStatus("error");
      setTimeout(() => {
        setConfirm(null);
        setConfirmStatus("confirming");
        onFilteringChange?.(false);
      }, 2000);
    }
  }, [confirm, onPrChanged, onFilteringChange]);

  const handleCancel = useCallback(() => {
    setConfirm(null);
    setConfirmStatus("confirming");
    onFilteringChange?.(false);
  }, [onFilteringChange]);

  const startMerge = useCallback((i: number) => {
    const pr = sorted[i];
    if (!pr) return;
    setMerge({ number: pr.number, title: pr.title });
    setMergeStatus("choosing");
    onFilteringChange?.(true);
  }, [sorted, onFilteringChange]);

  const handleMergeSelect = useCallback(async (strategy: MergeStrategy) => {
    if (!merge) return;
    setMergeStatus("working");
    try {
      await mergePr(merge.number, strategy);
      setMergeStatus("success");
      onPrChanged?.();
      setTimeout(() => {
        setMerge(null);
        setMergeStatus("choosing");
        onFilteringChange?.(false);
      }, 1500);
    } catch {
      setMergeStatus("error");
      setTimeout(() => {
        setMerge(null);
        setMergeStatus("choosing");
        onFilteringChange?.(false);
      }, 2000);
    }
  }, [merge, onPrChanged, onFilteringChange]);

  const handleMergeCancel = useCallback(() => {
    setMerge(null);
    setMergeStatus("choosing");
    onFilteringChange?.(false);
  }, [onFilteringChange]);

  const openDiff = useCallback(async (i: number) => {
    const pr = sorted[i];
    if (!pr || diffLoading) return;
    setDiffLoading(true);
    onFilteringChange?.(true);
    try {
      const diff = await fetchPrDiff(pr.number);
      setDiffView({ number: pr.number, title: pr.title, diff });
    } catch { /* silently fail */ }
    setDiffLoading(false);
  }, [sorted, diffLoading, onFilteringChange]);

  const startRequestChanges = useCallback((i: number) => {
    const pr = sorted[i];
    if (!pr) return;
    commentModeRef.current = "request-changes";
    commentTargetRef.current = pr.number;
    comment.startEditing(`Request changes on #${pr.number}`);
  }, [sorted, comment.startEditing]);

  const extraKeys = useMemo(() => ({
    s: sort.cycleSort,
    m: toggleMine,
    f: () => openDiff(selectedIndexRef.current),
    M: () => startMerge(selectedIndexRef.current),
    x: () => startConfirm("close", selectedIndexRef.current),
    a: () => startConfirm("approve", selectedIndexRef.current),
    X: () => startRequestChanges(selectedIndexRef.current),
    l: () => openPicker("labels", selectedIndexRef.current),
    A: () => openPicker("assignees", selectedIndexRef.current),
  }), [sort.cycleSort, toggleMine, openDiff, startMerge, startConfirm, startRequestChanges, openPicker]);

  const onOpen = useCallback((i: number) => openPrInBrowser(sorted[i].number), [sorted]);
  const onYank = useCallback((i: number) => copyToClipboard(sorted[i].url), [sorted]);
  const onYankRef = useCallback((i: number) => copyToClipboard(`#${sorted[i].number}`), [sorted]);
  const onStartComment = useCallback((i: number) => {
    commentModeRef.current = "comment";
    commentTargetRef.current = sorted[i].number;
    comment.startEditing(`#${sorted[i].number}`);
  }, [sorted, comment.startEditing]);
  const onCommentSubmit = useCallback(async (text: string) => {
    try {
      if (commentModeRef.current === "request-changes") {
        await requestChangesPr(commentTargetRef.current, text);
      } else {
        await commentOnPr(commentTargetRef.current, text);
      }
      comment.resolveSubmit();
      if (commentModeRef.current === "request-changes") onPrChanged?.();
    } catch {
      comment.rejectSubmit();
    }
  }, [comment.resolveSubmit, comment.rejectSubmit, onPrChanged]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(sorted.length, { onOpen, onYank, onYankRef, onToggleMark, onStartComment, onCommentSubmit, filter, comment, extraKeys, resetTrigger: `${mine}:${sort.current}`, inputBlocked: !!confirm || !!merge || !!picker });
  selectedIndexRef.current = selectedIndex;
  const visible = sorted.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = sorted[selectedIndex];
  const tags: string[] = [];
  if (markedNumbers.size > 0) tags.push(`${markedNumbers.size} marked`);
  if (mine) tags.push("Mine");
  if (sort.current !== "newest") tags.push(sort.label);
  const viewLabel = tags.length > 0 ? `PRs [${tags.join(", ")}]` : "PRs";

  const confirmLabel = confirm?.action === "approve" ? "Approve" : "Close";
  const confirmPast = confirm?.action === "approve" ? "Approved" : "Closed";
  const confirmMessage = confirm
    ? confirmStatus === "success"
      ? `${confirmPast} ${confirm.title}`
      : confirmStatus === "error"
        ? `Failed to ${confirmLabel.toLowerCase()} ${confirm.title}`
        : `${confirmLabel} ${confirm.title}?`
    : "";

  if (diffView) {
    return (
      <PrDiffView
        prNumber={diffView.number}
        prTitle={diffView.title}
        diff={diffView.diff}
        onClose={() => { setDiffView(null); onFilteringChange?.(false); }}
      />
    );
  }

  return (
    <Box flexDirection="column">
      <Breadcrumb view={viewLabel} detail={showDetail && selected ? `#${selected.number} ${selected.title}` : undefined} />
      {diffLoading && (
        <Box gap={1} paddingX={1}>
          <Text>⏳</Text>
          <Text dimColor>Loading diff…</Text>
        </Box>
      )}
      <FilterInput query={filter.filterQuery} isEditing={filter.isEditing} resultCount={sorted.length} totalCount={prs.length} />
      <CommentInput targetLabel={comment.targetLabel} text={comment.commentText} isEditing={comment.isEditing} status={comment.status} />
      {picker && (
        <PickerOverlay
          title={picker.kind === "labels" ? "Labels" : "Assignees"}
          options={pickerOptions}
          selected={picker.current}
          loading={pickerLoading}
          onConfirm={handlePickerConfirm}
          onCancel={handlePickerCancel}
        />
      )}
      {merge && (
        <MergeBar
          prNumber={merge.number}
          prTitle={merge.title}
          status={mergeStatus}
          onSelect={handleMergeSelect}
          onCancel={handleMergeCancel}
        />
      )}
      {confirm && (
        <ConfirmBar
          message={confirmMessage}
          status={confirmStatus}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
      <Box flexDirection="column">
        {visible.map((pr, i) => (
          <PrRow key={pr.number} pr={pr} selected={scrollOffset + i === selectedIndex} marked={markedNumbers.has(pr.number)} stale={isStale(pr.createdAt, staleDays)} />
        ))}
      </Box>
      {showDetail && selected && (
        <PrDetail pr={selected} height={detailHeight} />
      )}
    </Box>
  );
}
