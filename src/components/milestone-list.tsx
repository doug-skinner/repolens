import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { Box, Text, useInput } from "ink";
import { MilestoneRow } from "./milestone-row.js";
import { DetailPane } from "./detail-pane.js";
import { Breadcrumb } from "./breadcrumb.js";
import { FilterInput } from "./filter-input.js";
import { ConfirmBar } from "./confirm-bar.js";
import { openMilestoneInBrowser, fetchMilestoneIssues, openIssueInBrowser, setIssueMilestone } from "../lib/gh.js";
import type { MilestoneIssue } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useConfig, useTheme } from "../lib/config-context.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import { useListFilter } from "../hooks/use-list-filter.js";
import { useListSort } from "../hooks/use-list-sort.js";
import { matchesFilter } from "../lib/filter.js";
import { byVersion, byDateAsc, byStringAsc, byNumberDesc } from "../lib/sort.js";
import type { Milestone } from "../lib/types.js";

const SORT_OPTIONS = [
  { key: "version", label: "Version" },
  { key: "due", label: "Due date" },
  { key: "progress", label: "Progress" },
  { key: "title", label: "Title" },
] as const;

interface MilestoneListProps {
  milestones: Milestone[];
  onFilteringChange?: (editing: boolean) => void;
  onMilestoneChanged?: () => void;
}

function MilestoneDetail({
  milestone,
  height,
  focused,
  onExit,
  onUnlinked,
}: {
  milestone: Milestone;
  height: number;
  focused: boolean;
  onExit: () => void;
  onUnlinked: () => void;
}) {
  const theme = useTheme();
  const [issues, setIssues] = useState<MilestoneIssue[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(0);
  const [showIssueDetail, setShowIssueDetail] = useState(false);
  const scrollOffsetRef = useRef(0);
  const [confirmUnlink, setConfirmUnlink] = useState<number | null>(null);
  const [unlinkStatus, setUnlinkStatus] = useState<"confirming" | "working" | "success" | "error">("confirming");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setIssues(null);
    fetchMilestoneIssues(milestone.title).then((result) => {
      if (!cancelled) {
        setIssues(result);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [milestone.number]);

  useEffect(() => {
    setCursor(0);
    scrollOffsetRef.current = 0;
    setShowIssueDetail(false);
  }, [issues]);

  const innerHeight = Math.max(0, height - 2);
  const headerLines = 1 + (milestone.description ? 1 : 0);
  const hintLines = 1;
  const confirmLines = confirmUnlink !== null ? 1 : 0;
  const availableForContent = Math.max(1, innerHeight - headerLines - hintLines - confirmLines);

  const issueCount = issues?.length ?? 0;
  const issueListHeight = showIssueDetail
    ? Math.min(3, issueCount, availableForContent)
    : Math.min(issueCount, availableForContent);

  const safeCursor = issueCount > 0 ? Math.min(cursor, issueCount - 1) : 0;
  let issueOffset = scrollOffsetRef.current;
  if (safeCursor < issueOffset) issueOffset = safeCursor;
  if (safeCursor >= issueOffset + issueListHeight) issueOffset = safeCursor - issueListHeight + 1;
  issueOffset = Math.max(0, issueOffset);
  scrollOffsetRef.current = issueOffset;

  const handleConfirmUnlink = useCallback(async () => {
    if (confirmUnlink === null) return;
    setUnlinkStatus("working");
    try {
      await setIssueMilestone(confirmUnlink, "");
      setUnlinkStatus("success");
      onUnlinked();
      const updated = await fetchMilestoneIssues(milestone.title);
      setIssues(updated);
      setTimeout(() => {
        setConfirmUnlink(null);
        setUnlinkStatus("confirming");
      }, 1500);
    } catch {
      setUnlinkStatus("error");
      setTimeout(() => {
        setConfirmUnlink(null);
        setUnlinkStatus("confirming");
      }, 2000);
    }
  }, [confirmUnlink, milestone.title, onUnlinked]);

  const handleCancelUnlink = useCallback(() => {
    setConfirmUnlink(null);
    setUnlinkStatus("confirming");
  }, []);

  useInput((input, key) => {
    if (!focused) return;

    if (key.escape) {
      if (confirmUnlink !== null) return;
      setShowIssueDetail(false);
      onExit();
      return;
    }

    if (confirmUnlink !== null) return;
    if (!issues || issues.length === 0) return;

    if (input === "j" || key.downArrow) {
      setCursor((c) => Math.min(issues.length - 1, c + 1));
    } else if (input === "k" || key.upArrow) {
      setCursor((c) => Math.max(0, c - 1));
    } else if (input === "G") {
      setCursor(issues.length - 1);
    } else if (input === "o") {
      openIssueInBrowser(issues[safeCursor].number);
    } else if (input === "d" || key.return) {
      setShowIssueDetail((v) => !v);
    } else if (input === "u") {
      setConfirmUnlink(issues[safeCursor].number);
      setUnlinkStatus("confirming");
    }
  });

  const selectedIssue = issues?.[safeCursor];
  const visibleIssues = issues?.slice(issueOffset, issueOffset + issueListHeight) ?? [];

  return (
    <DetailPane title={milestone.title} height={height}>
      {milestone.description && (
        <Text dimColor>{milestone.description}</Text>
      )}
      {confirmUnlink !== null && (
        <ConfirmBar
          message={unlinkStatus === "success" ? `Unlinked #${confirmUnlink}` : unlinkStatus === "error" ? `Failed to unlink #${confirmUnlink}` : `Unlink #${confirmUnlink} from ${milestone.title}?`}
          status={unlinkStatus}
          onConfirm={handleConfirmUnlink}
          onCancel={handleCancelUnlink}
        />
      )}
      {loading ? (
        <Box gap={1}>
          <Text>⏳</Text>
          <Text dimColor>Loading issues…</Text>
        </Box>
      ) : issues && issues.length > 0 ? (
        <>
          {visibleIssues.map((issue, i) => {
            const idx = issueOffset + i;
            const isSelected = focused && idx === safeCursor;
            return (
              <Box key={issue.number} gap={1}>
                {focused && (
                  <Text color={isSelected ? theme.accent : undefined}>
                    {isSelected ? "▸" : " "}
                  </Text>
                )}
                <Text color={issue.state === "OPEN" ? theme.success : theme.info}>
                  {issue.state === "OPEN" ? "○" : "●"}
                </Text>
                <Text dimColor>#{issue.number}</Text>
                <Text bold={isSelected}>{issue.title}</Text>
              </Box>
            );
          })}
          {showIssueDetail && selectedIssue && (
            <Box flexDirection="column" marginTop={1} overflow="hidden">
              {selectedIssue.assignees.length > 0 && (
                <Box gap={1}>
                  <Text dimColor>Assignees:</Text>
                  <Text>{selectedIssue.assignees.map((a) => a.login).join(", ")}</Text>
                </Box>
              )}
              {selectedIssue.labels.length > 0 && (
                <Box gap={1}>
                  <Text dimColor>Labels:</Text>
                  <Text color={theme.warning}>{selectedIssue.labels.map((l) => l.name).join(", ")}</Text>
                </Box>
              )}
              {selectedIssue.body ? (
                <Text>{selectedIssue.body}</Text>
              ) : (
                <Text dimColor>No description</Text>
              )}
            </Box>
          )}
        </>
      ) : (
        <Text dimColor>No issues</Text>
      )}
      {focused ? (
        issues && issues.length > 0 ? (
          <Text dimColor>j/k navigate · d detail · o open · u unlink · Esc back</Text>
        ) : (
          <Text dimColor>Esc back</Text>
        )
      ) : !loading && issues && issues.length > 0 ? (
        <Text dimColor>i to navigate issues</Text>
      ) : null}
    </DetailPane>
  );
}

export function MilestoneList({ milestones, onFilteringChange, onMilestoneChanged }: MilestoneListProps) {
  const { milestoneSort } = useConfig();
  const filter = useListFilter(onFilteringChange);
  const sort = useListSort(SORT_OPTIONS, milestoneSort);
  const [detailFocused, setDetailFocused] = useState(false);
  const showDetailRef = useRef(false);

  const sorted = useMemo(() => {
    const items = milestones.filter((ms) => matchesFilter(ms.title, filter.filterQuery));
    if (sort.current === "version") items.sort((a, b) => byVersion(a.title, b.title));
    else if (sort.current === "due") items.sort((a, b) => {
      if (!a.due_on && !b.due_on) return 0;
      if (!a.due_on) return 1;
      if (!b.due_on) return -1;
      return byDateAsc(a.due_on, b.due_on);
    });
    else if (sort.current === "progress") items.sort((a, b) => {
      const pa = a.open_issues + a.closed_issues > 0 ? a.closed_issues / (a.open_issues + a.closed_issues) : 0;
      const pb = b.open_issues + b.closed_issues > 0 ? b.closed_issues / (b.open_issues + b.closed_issues) : 0;
      return byNumberDesc(pa, pb);
    });
    else if (sort.current === "title") items.sort((a, b) => byStringAsc(a.title, b.title));
    return items;
  }, [milestones, filter.filterQuery, sort.current]);

  const enterDetailFocus = useCallback(() => {
    if (!showDetailRef.current) return;
    setDetailFocused(true);
    onFilteringChange?.(true);
  }, [onFilteringChange]);

  const exitDetailFocus = useCallback(() => {
    setDetailFocused(false);
    onFilteringChange?.(false);
  }, [onFilteringChange]);

  const extraKeys = useMemo(() => ({ s: sort.cycleSort, i: enterDetailFocus }), [sort.cycleSort, enterDetailFocus]);

  const onOpen = useCallback((i: number) => openMilestoneInBrowser(sorted[i].html_url), [sorted]);
  const onYank = useCallback((i: number) => copyToClipboard(sorted[i].html_url), [sorted]);
  const onYankRef = useCallback((i: number) => copyToClipboard(sorted[i].title), [sorted]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(sorted.length, { onOpen, onYank, onYankRef, filter, extraKeys, resetTrigger: sort.current, inputBlocked: detailFocused });
  showDetailRef.current = showDetail;
  const visible = sorted.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = sorted[selectedIndex];
  const viewLabel = sort.current === "version" ? "Milestones" : `Milestones [${sort.label}]`;

  return (
    <Box flexDirection="column">
      <Breadcrumb view={viewLabel} detail={showDetail && selected ? selected.title : undefined} />
      <FilterInput query={filter.filterQuery} isEditing={filter.isEditing} resultCount={sorted.length} totalCount={milestones.length} />
      <Box flexDirection="column">
        {visible.map((ms, i) => (
          <MilestoneRow key={ms.number} milestone={ms} selected={scrollOffset + i === selectedIndex} />
        ))}
      </Box>
      {showDetail && selected && (
        <MilestoneDetail
          milestone={selected}
          height={detailHeight}
          focused={detailFocused}
          onExit={exitDetailFocus}
          onUnlinked={() => onMilestoneChanged?.()}
        />
      )}
    </Box>
  );
}
