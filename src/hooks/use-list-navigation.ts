import { useState, useRef, useCallback, useEffect } from "react";
import { useInput, useStdout } from "ink";
import type { ListFilter } from "./use-list-filter.js";
import type { CommentState } from "./use-comment-input.js";

const GG_TIMEOUT_MS = 500;
const LAYOUT_OVERHEAD = 7; // header (4) + breadcrumb (1) + margin (1) + footer (1)
const LIST_HEIGHT_WITH_DETAIL = 5;

interface ListNavigationOptions {
  onOpen: (index: number) => void;
  onYank?: (index: number) => void;
  onYankRef?: (index: number) => void;
  onToggleMark?: (index: number) => void;
  onStartComment?: (index: number) => void;
  onCommentSubmit?: (text: string) => void;
  filter?: ListFilter;
  comment?: CommentState;
  extraKeys?: Record<string, () => void>;
  resetTrigger?: string | number;
  inputBlocked?: boolean;
}

export function useListNavigation(length: number, options: ListNavigationOptions) {
  const { onOpen, onYank, onYankRef, onToggleMark, onStartComment, onCommentSubmit, filter, comment, extraKeys } = options;
  const { stdout } = useStdout();
  const filterBarVisible = filter ? (filter.isEditing || !!filter.filterQuery) : false;
  const commentBarVisible = comment ? (comment.isEditing || comment.status !== "idle") : false;
  const totalAvailable = Math.max(1, (stdout?.rows ?? 24) - LAYOUT_OVERHEAD - (filterBarVisible ? 1 : 0) - (commentBarVisible ? 1 : 0));

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const scrollOffsetRef = useRef(0);
  const gPending = useRef(false);
  const gTimer = useRef<ReturnType<typeof setTimeout>>();

  const filterQuery = filter?.filterQuery ?? "";
  const resetTrigger = options.resetTrigger;
  useEffect(() => {
    setSelectedIndex(0);
    scrollOffsetRef.current = 0;
  }, [filterQuery, resetTrigger]);

  const clearPendingG = useCallback(() => {
    gPending.current = false;
    if (gTimer.current) {
      clearTimeout(gTimer.current);
      gTimer.current = undefined;
    }
  }, []);

  useInput((input, key) => {
    if (options.inputBlocked) return;

    if (comment?.isEditing) {
      if (key.escape) {
        comment.cancel();
        return;
      }
      if (key.return) {
        const text = comment.commentText.trim();
        if (text) {
          comment.beginSubmit();
          onCommentSubmit?.(text);
        }
        return;
      }
      if (key.backspace || key.delete) {
        comment.backspace();
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        comment.appendChar(input);
      }
      return;
    }

    if (filter?.isEditing) {
      if (key.escape) {
        filter.clearFilter();
        return;
      }
      if (key.return) {
        filter.confirmEditing();
        return;
      }
      if (key.backspace || key.delete) {
        filter.backspace();
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        filter.appendChar(input);
      }
      return;
    }

    if (input === "/" && filter) {
      clearPendingG();
      filter.startEditing();
      return;
    }

    if (key.escape && filter?.filterQuery) {
      clearPendingG();
      filter.clearFilter();
      return;
    }

    if (input === " " && onToggleMark) {
      clearPendingG();
      onToggleMark(selectedIndex);
      return;
    }

    if (extraKeys?.[input]) {
      clearPendingG();
      extraKeys[input]();
      return;
    }

    if (input === "C" && onStartComment) {
      clearPendingG();
      onStartComment(selectedIndex);
      return;
    }

    if (key.upArrow || input === "k") {
      clearPendingG();
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow || input === "j") {
      clearPendingG();
      setSelectedIndex((i) => Math.min(length - 1, i + 1));
    } else if (input === "G") {
      clearPendingG();
      setSelectedIndex(length - 1);
    } else if (input === "g") {
      if (gPending.current) {
        clearPendingG();
        setSelectedIndex(0);
      } else {
        gPending.current = true;
        gTimer.current = setTimeout(clearPendingG, GG_TIMEOUT_MS);
      }
    } else if (input === "y") {
      clearPendingG();
      onYank?.(selectedIndex);
    } else if (input === "Y") {
      clearPendingG();
      onYankRef?.(selectedIndex);
    } else if (key.return || input === "d") {
      clearPendingG();
      setShowDetail((v) => !v);
    } else if (input === "o") {
      clearPendingG();
      onOpen(selectedIndex);
    } else {
      clearPendingG();
    }
  });

  const safeIndex = length === 0 ? 0 : Math.min(selectedIndex, length - 1);

  const listHeight = showDetail
    ? Math.min(LIST_HEIGHT_WITH_DETAIL, totalAvailable)
    : totalAvailable;
  const detailHeight = showDetail ? totalAvailable - listHeight : 0;

  let offset = scrollOffsetRef.current;
  if (safeIndex < offset) offset = safeIndex;
  if (safeIndex >= offset + listHeight) offset = safeIndex - listHeight + 1;
  offset = Math.max(0, Math.min(offset, Math.max(0, length - listHeight)));
  scrollOffsetRef.current = offset;

  return {
    selectedIndex: safeIndex,
    scrollOffset: offset,
    viewportHeight: listHeight,
    showDetail,
    detailHeight,
  };
}
