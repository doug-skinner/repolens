import { useState, useCallback, useMemo, useRef } from "react";
import { Box, Text } from "ink";
import { IssueRow } from "./issue-row.js";
import { DetailPane } from "./detail-pane.js";
import { Breadcrumb } from "./breadcrumb.js";
import { FilterInput } from "./filter-input.js";
import { CommentInput } from "./comment-input.js";
import { ConfirmBar } from "./confirm-bar.js";
import { PickerOverlay } from "./picker-overlay.js";
import { openIssueInBrowser, commentOnIssue, closeIssue, fetchLabels, fetchCollaborators, setIssueLabels, setIssueAssignees } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import { useListFilter } from "../hooks/use-list-filter.js";
import { useListSort } from "../hooks/use-list-sort.js";
import { useCommentInput } from "../hooks/use-comment-input.js";
import { isStale, timeAgo } from "../lib/format.js";
import { STALE_DAYS } from "../lib/config.js";
import { matchesFilter } from "../lib/filter.js";
import { byDateDesc, byDateAsc, byStringAsc } from "../lib/sort.js";
import type { Issue } from "../lib/types.js";

const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "title", label: "Title" },
] as const;

interface IssueListProps {
  issues: Issue[];
  username: string | null;
  onFilteringChange?: (editing: boolean) => void;
  onCreateIssue?: () => void;
  onEditIssue?: (issue: Issue) => void;
  onIssueChanged?: () => void;
}

function IssueDetail({ issue, height }: { issue: Issue; height: number }) {
  return (
    <DetailPane title={`#${issue.number} ${issue.title}`} height={height}>
      {issue.assignees.length > 0 && (
        <Box gap={1}>
          <Text dimColor>Assignees:</Text>
          <Text>{issue.assignees.map((a) => a.login).join(", ")}</Text>
        </Box>
      )}
      {issue.milestone && (
        <Box gap={1}>
          <Text dimColor>Milestone:</Text>
          <Text color="cyan">{issue.milestone.title}</Text>
        </Box>
      )}
      {issue.labels.length > 0 && (
        <Box gap={1}>
          <Text dimColor>Labels:</Text>
          <Text color="yellow">{issue.labels.map((l) => l.name).join(", ")}</Text>
        </Box>
      )}
      {issue.body ? (
        <Box flexDirection="column" marginTop={1} overflow="hidden">
          <Text>{issue.body}</Text>
        </Box>
      ) : (
        <Text dimColor>No description</Text>
      )}
      {issue.comments.length > 0 && (
        <Box flexDirection="column" marginTop={1} flexGrow={1} overflow="hidden">
          <Text bold dimColor>Comments ({issue.comments.length})</Text>
          {issue.comments.map((c, i) => (
            <Box key={i} flexDirection="column" marginTop={i === 0 ? 0 : 1}>
              <Text>
                <Text color="cyan">{c.author.login}</Text>
                <Text dimColor> · {timeAgo(c.createdAt)}</Text>
              </Text>
              <Text>{c.body}</Text>
            </Box>
          ))}
        </Box>
      )}
    </DetailPane>
  );
}

export function IssueList({ issues, username, onFilteringChange, onCreateIssue, onEditIssue, onIssueChanged }: IssueListProps) {
  const filter = useListFilter(onFilteringChange);
  const comment = useCommentInput(onFilteringChange);
  const sort = useListSort(SORT_OPTIONS);
  const [mine, setMine] = useState(false);
  const commentTargetRef = useRef(0);
  const selectedIndexRef = useRef(0);
  const [confirmClose, setConfirmClose] = useState<{ number: number; title: string } | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<"confirming" | "working" | "success" | "error">("confirming");

  const [picker, setPicker] = useState<{ kind: "labels" | "assignees"; number: number; current: Set<string> } | null>(null);
  const [pickerOptions, setPickerOptions] = useState<string[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const toggleMine = useCallback(() => setMine((v) => !v), []);

  const sorted = useMemo(() => {
    let items = issues.filter((issue) => matchesFilter(issue.title, filter.filterQuery, issue.labels));
    if (mine && username) {
      items = items.filter((issue) =>
        issue.author.login === username || issue.assignees.some((a) => a.login === username),
      );
    }
    if (sort.current === "oldest") items.sort((a, b) => byDateAsc(a.createdAt, b.createdAt));
    else if (sort.current === "title") items.sort((a, b) => byStringAsc(a.title, b.title));
    else if (sort.current === "newest") items.sort((a, b) => byDateDesc(a.createdAt, b.createdAt));
    return items;
  }, [issues, filter.filterQuery, mine, username, sort.current]);

  const openPicker = useCallback((kind: "labels" | "assignees", i: number) => {
    const issue = sorted[i];
    if (!issue) return;
    const current = kind === "labels"
      ? new Set(issue.labels.map((l) => l.name))
      : new Set(issue.assignees.map((a) => a.login));
    setPicker({ kind, number: issue.number, current });
    setPickerLoading(true);
    onFilteringChange?.(true);
    const fetch = kind === "labels" ? fetchLabels() : fetchCollaborators();
    fetch.then((opts) => { setPickerOptions(opts); setPickerLoading(false); })
      .catch(() => { setPickerOptions([]); setPickerLoading(false); });
  }, [sorted, onFilteringChange]);

  const handlePickerConfirm = useCallback(async (selected: Set<string>) => {
    if (!picker) return;
    const { kind, number, current } = picker;
    const add = [...selected].filter((s) => !current.has(s));
    const remove = [...current].filter((s) => !selected.has(s));
    try {
      if (kind === "labels") await setIssueLabels(number, add, remove);
      else await setIssueAssignees(number, add, remove);
      onIssueChanged?.();
    } catch { /* silently fail */ }
    setPicker(null);
    onFilteringChange?.(false);
  }, [picker, onIssueChanged, onFilteringChange]);

  const handlePickerCancel = useCallback(() => {
    setPicker(null);
    onFilteringChange?.(false);
  }, [onFilteringChange]);

  const startClose = useCallback((i: number) => {
    const issue = sorted[i];
    if (!issue) return;
    setConfirmClose({ number: issue.number, title: issue.title });
    setConfirmStatus("confirming");
    onFilteringChange?.(true);
  }, [sorted, onFilteringChange]);

  const handleConfirm = useCallback(async () => {
    if (!confirmClose) return;
    setConfirmStatus("working");
    try {
      await closeIssue(confirmClose.number);
      setConfirmStatus("success");
      onIssueChanged?.();
      setTimeout(() => {
        setConfirmClose(null);
        setConfirmStatus("confirming");
        onFilteringChange?.(false);
      }, 1500);
    } catch {
      setConfirmStatus("error");
      setTimeout(() => {
        setConfirmClose(null);
        setConfirmStatus("confirming");
        onFilteringChange?.(false);
      }, 2000);
    }
  }, [confirmClose, onIssueChanged, onFilteringChange]);

  const handleCancelClose = useCallback(() => {
    setConfirmClose(null);
    setConfirmStatus("confirming");
    onFilteringChange?.(false);
  }, [onFilteringChange]);

  const extraKeys = useMemo(() => {
    const keys: Record<string, () => void> = { s: sort.cycleSort, m: toggleMine };
    if (onCreateIssue) keys.c = onCreateIssue;
    if (onEditIssue) keys.e = () => { const issue = sorted[selectedIndexRef.current]; if (issue) onEditIssue(issue); };
    keys.x = () => startClose(selectedIndexRef.current);
    keys.l = () => openPicker("labels", selectedIndexRef.current);
    keys.A = () => openPicker("assignees", selectedIndexRef.current);
    return keys;
  }, [sort.cycleSort, toggleMine, onCreateIssue, onEditIssue, sorted, startClose, openPicker]);

  const onOpen = useCallback((i: number) => openIssueInBrowser(sorted[i].number), [sorted]);
  const onYank = useCallback((i: number) => copyToClipboard(sorted[i].url), [sorted]);
  const onYankRef = useCallback((i: number) => copyToClipboard(`#${sorted[i].number}`), [sorted]);
  const onStartComment = useCallback((i: number) => {
    commentTargetRef.current = sorted[i].number;
    comment.startEditing(`#${sorted[i].number}`);
  }, [sorted, comment.startEditing]);
  const onCommentSubmit = useCallback(async (text: string) => {
    try {
      await commentOnIssue(commentTargetRef.current, text);
      comment.resolveSubmit();
    } catch {
      comment.rejectSubmit();
    }
  }, [comment.resolveSubmit, comment.rejectSubmit]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(sorted.length, { onOpen, onYank, onYankRef, onStartComment, onCommentSubmit, filter, comment, extraKeys, resetTrigger: `${mine}:${sort.current}`, inputBlocked: !!confirmClose || !!picker });
  selectedIndexRef.current = selectedIndex;
  const visible = sorted.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = sorted[selectedIndex];
  const tags: string[] = [];
  if (mine) tags.push("Mine");
  if (sort.current !== "newest") tags.push(sort.label);
  const viewLabel = tags.length > 0 ? `Issues [${tags.join(", ")}]` : "Issues";

  return (
    <Box flexDirection="column">
      <Breadcrumb view={viewLabel} detail={showDetail && selected ? `#${selected.number} ${selected.title}` : undefined} />
      <FilterInput query={filter.filterQuery} isEditing={filter.isEditing} resultCount={sorted.length} totalCount={issues.length} />
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
      {confirmClose && (
        <ConfirmBar
          message={confirmStatus === "success" ? `Closed #${confirmClose.number}` : confirmStatus === "error" ? `Failed to close #${confirmClose.number}` : `Close #${confirmClose.number} "${confirmClose.title}"?`}
          status={confirmStatus}
          onConfirm={handleConfirm}
          onCancel={handleCancelClose}
        />
      )}
      <Box flexDirection="column">
        {visible.map((issue, i) => (
          <IssueRow key={issue.number} issue={issue} selected={scrollOffset + i === selectedIndex} stale={isStale(issue.createdAt, STALE_DAYS)} />
        ))}
      </Box>
      {showDetail && selected && (
        <IssueDetail issue={selected} height={detailHeight} />
      )}
    </Box>
  );
}
