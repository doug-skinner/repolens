import { useState, useCallback, useMemo, useRef } from "react";
import { Box, Text } from "ink";
import { IssueRow } from "./issue-row.js";
import { DetailPane } from "./detail-pane.js";
import { Breadcrumb } from "./breadcrumb.js";
import { FilterInput } from "./filter-input.js";
import { CommentInput } from "./comment-input.js";
import { openIssueInBrowser, commentOnIssue } from "../lib/gh.js";
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

export function IssueList({ issues, username, onFilteringChange, onCreateIssue }: IssueListProps) {
  const filter = useListFilter(onFilteringChange);
  const comment = useCommentInput(onFilteringChange);
  const sort = useListSort(SORT_OPTIONS);
  const [mine, setMine] = useState(false);
  const commentTargetRef = useRef(0);

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

  const extraKeys = useMemo(() => {
    const keys: Record<string, () => void> = { s: sort.cycleSort, m: toggleMine };
    if (onCreateIssue) keys.c = onCreateIssue;
    return keys;
  }, [sort.cycleSort, toggleMine, onCreateIssue]);

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
    useListNavigation(sorted.length, { onOpen, onYank, onYankRef, onStartComment, onCommentSubmit, filter, comment, extraKeys, resetTrigger: `${mine}:${sort.current}` });
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
