import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Box, Text } from "ink";
import { NotificationRow } from "./notification-row.js";
import { Breadcrumb } from "./breadcrumb.js";
import { FilterInput } from "./filter-input.js";
import { markNotificationRead } from "../lib/gh.js";
import { useListNavigation } from "../hooks/use-list-navigation.js";
import { useListFilter } from "../hooks/use-list-filter.js";
import { useListSort } from "../hooks/use-list-sort.js";
import { matchesFilter } from "../lib/filter.js";
import { byDateDesc, byDateAsc } from "../lib/sort.js";
import type { GitHubNotification } from "../lib/types.js";

interface NotificationListProps {
  notifications: GitHubNotification[];
  onFilteringChange?: (editing: boolean) => void;
  onNotificationChanged?: () => void;
  loadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
] as const;

export function NotificationList({ notifications, onFilteringChange, onNotificationChanged, loadMore, hasMore, loadingMore }: NotificationListProps) {
  const filter = useListFilter(onFilteringChange);
  const sort = useListSort(SORT_OPTIONS);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const selectedIndexRef = useRef(0);

  const toggleUnread = useCallback(() => setUnreadOnly((v) => !v), []);

  const sorted = useMemo(() => {
    let items = notifications.filter((n) =>
      matchesFilter(n.title, filter.filterQuery),
    );
    if (unreadOnly) {
      items = items.filter((n) => n.unread);
    }
    if (sort.current === "oldest") items.sort((a, b) => byDateAsc(a.updatedAt, b.updatedAt));
    else if (sort.current === "newest") items.sort((a, b) => byDateDesc(a.updatedAt, b.updatedAt));
    return items;
  }, [notifications, filter.filterQuery, unreadOnly, sort.current]);

  const handleMarkRead = useCallback(async () => {
    const n = sorted[selectedIndexRef.current];
    if (!n?.unread) return;
    await markNotificationRead(n.id);
    onNotificationChanged?.();
  }, [sorted, onNotificationChanged]);

  const extraKeys = useMemo(() => ({
    s: sort.cycleSort,
    u: toggleUnread,
    n: handleMarkRead,
  }), [sort.cycleSort, toggleUnread, handleMarkRead]);

  const resetTrigger = `${unreadOnly}:${sort.current}`;

  const onOpen = useCallback(async (i: number) => {
    const n = sorted[i];
    if (!n) return;
    if (n.unread) {
      await markNotificationRead(n.id);
      onNotificationChanged?.();
    }
  }, [sorted, onNotificationChanged]);

  const { selectedIndex, scrollOffset, viewportHeight, showDetail, detailHeight: _detailHeight } =
    useListNavigation(sorted.length, { onOpen, filter, extraKeys, resetTrigger });
  selectedIndexRef.current = selectedIndex;

  useEffect(() => {
    if (hasMore && !loadingMore && sorted.length > 0 && selectedIndex >= sorted.length - 5) {
      loadMore?.();
    }
  }, [selectedIndex, sorted.length, hasMore, loadingMore, loadMore]);

  const visible = sorted.slice(scrollOffset, scrollOffset + viewportHeight);

  const selected = sorted[selectedIndex];
  const detailLabel = selected ? selected.title : undefined;

  const tags: string[] = [];
  if (unreadOnly) tags.push("Unread");
  if (sort.current !== "newest") tags.push(sort.label);
  const viewLabel = tags.length > 0 ? `Notifications [${tags.join(", ")}]` : "Notifications";

  return (
    <Box flexDirection="column">
      <Breadcrumb view={viewLabel} detail={showDetail && selected ? detailLabel : undefined} />
      <FilterInput query={filter.filterQuery} isEditing={filter.isEditing} resultCount={sorted.length} totalCount={notifications.length} />
      <Box flexDirection="column">
        {visible.map((notification, i) => (
          <NotificationRow key={notification.id} notification={notification} selected={scrollOffset + i === selectedIndex} />
        ))}
        {loadingMore && <Text dimColor> Loading more…</Text>}
      </Box>
      {showDetail && selected && (
        <Box flexDirection="column" paddingX={1} marginTop={1}>
          <Text bold>{selected.title}</Text>
          <Text dimColor>Type: {selected.type} · Reason: {selected.reason} · {selected.unread ? "Unread" : "Read"}</Text>
        </Box>
      )}
    </Box>
  );
}
