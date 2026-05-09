import { useState, useCallback, useMemo, useRef } from "react";
import { Box, Text } from "ink";
import { PrRow } from "./pr-row.js";
import { DetailPane } from "./detail-pane.js";
import { Breadcrumb } from "./breadcrumb.js";
import { FilterInput } from "./filter-input.js";
import { CommentInput } from "./comment-input.js";
import { openPrInBrowser, commentOnPr } from "../lib/gh.js";
import { copyToClipboard } from "../lib/clipboard.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import { useListFilter } from "../hooks/use-list-filter.js";
import { useListSort } from "../hooks/use-list-sort.js";
import { useCommentInput } from "../hooks/use-comment-input.js";
import { truncate, isStale } from "../lib/format.js";
import { STALE_DAYS } from "../lib/config.js";
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
}

function checkSymbol(status: string, conclusion: string): { symbol: string; color: string } {
  if (status === "IN_PROGRESS") return { symbol: "●", color: "yellow" };
  if (conclusion === "SUCCESS") return { symbol: "✓", color: "green" };
  if (conclusion === "FAILURE") return { symbol: "✗", color: "red" };
  return { symbol: "○", color: "yellow" };
}

function PrDetail({ pr, height }: { pr: PullRequest; height: number }) {
  return (
    <DetailPane title={`#${pr.number} ${pr.title}`} height={height}>
      <Box gap={1}>
        <Text dimColor>Branch:</Text>
        <Text color="cyan">{pr.headRefName}</Text>
        <Text dimColor>{"→"}</Text>
        <Text color="cyan">{pr.baseRefName}</Text>
      </Box>
      <Box gap={1}>
        <Text dimColor>Diff:</Text>
        <Text color="green">+{pr.additions}</Text>
        <Text color="red">-{pr.deletions}</Text>
      </Box>
      {pr.reviewRequests.length > 0 && (
        <Box gap={1}>
          <Text dimColor>Reviewers:</Text>
          <Text>{pr.reviewRequests.map((r) => r.login).join(", ")}</Text>
        </Box>
      )}
      {pr.labels.length > 0 && (
        <Box gap={1}>
          <Text dimColor>Labels:</Text>
          <Text color="yellow">{pr.labels.map((l) => l.name).join(", ")}</Text>
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

export function PrList({ prs, username, onFilteringChange }: PrListProps) {
  const filter = useListFilter(onFilteringChange);
  const comment = useCommentInput(onFilteringChange);
  const sort = useListSort(SORT_OPTIONS);
  const [mine, setMine] = useState(false);
  const commentTargetRef = useRef(0);

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

  const extraKeys = useMemo(() => ({ s: sort.cycleSort, m: toggleMine }), [sort.cycleSort, toggleMine]);

  const onOpen = useCallback((i: number) => openPrInBrowser(sorted[i].number), [sorted]);
  const onYank = useCallback((i: number) => copyToClipboard(sorted[i].url), [sorted]);
  const onYankRef = useCallback((i: number) => copyToClipboard(`#${sorted[i].number}`), [sorted]);
  const onStartComment = useCallback((i: number) => {
    commentTargetRef.current = sorted[i].number;
    comment.startEditing(`#${sorted[i].number}`);
  }, [sorted, comment.startEditing]);
  const onCommentSubmit = useCallback(async (text: string) => {
    try {
      await commentOnPr(commentTargetRef.current, text);
      comment.resolveSubmit();
    } catch {
      comment.rejectSubmit();
    }
  }, [comment.resolveSubmit, comment.rejectSubmit]);
  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight } =
    useListNavigation(sorted.length, { onOpen, onYank, onYankRef, onStartComment, onCommentSubmit, filter, comment, extraKeys, resetTrigger: `${mine}:${sort.current}` });
  const visible = sorted.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = sorted[selectedIndex];
  const tags: string[] = [];
  if (mine) tags.push("Mine");
  if (sort.current !== "newest") tags.push(sort.label);
  const viewLabel = tags.length > 0 ? `PRs [${tags.join(", ")}]` : "PRs";

  return (
    <Box flexDirection="column">
      <Breadcrumb view={viewLabel} detail={showDetail && selected ? `#${selected.number} ${selected.title}` : undefined} />
      <FilterInput query={filter.filterQuery} isEditing={filter.isEditing} resultCount={sorted.length} totalCount={prs.length} />
      <CommentInput targetLabel={comment.targetLabel} text={comment.commentText} isEditing={comment.isEditing} status={comment.status} />
      <Box flexDirection="column">
        {visible.map((pr, i) => (
          <PrRow key={pr.number} pr={pr} selected={scrollOffset + i === selectedIndex} stale={isStale(pr.createdAt, STALE_DAYS)} />
        ))}
      </Box>
      {showDetail && selected && (
        <PrDetail pr={selected} height={detailHeight} />
      )}
    </Box>
  );
}
