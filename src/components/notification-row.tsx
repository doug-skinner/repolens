import { Box, Text } from "ink";
import { timeAgo, truncate } from "../lib/format.js";
import { useConfig, useTheme } from "../lib/config-context.js";
import { Columns, type ColumnDef } from "../lib/columns.js";
import type { NotificationColumn } from "../lib/config.js";
import type { GitHubNotification } from "../lib/types.js";

interface NotificationRowProps {
  notification: GitHubNotification;
  selected: boolean;
}

const REASON_LABELS: Record<string, string> = {
  assign: "Assigned",
  author: "Author",
  ci_activity: "CI",
  comment: "Comment",
  manual: "Manual",
  mention: "Mention",
  review_requested: "Review",
  state_change: "State",
  subscribed: "Subscribed",
  team_mention: "Team",
};

const TYPE_LABELS: Record<string, string> = {
  CheckSuite: "CI",
  Commit: "Commit",
  Discussion: "Discussion",
  Issue: "Issue",
  PullRequest: "PR",
  Release: "Release",
};

export function NotificationRow({ notification, selected }: NotificationRowProps) {
  const { columns } = useConfig();
  const theme = useTheme();

  const defs: ColumnDef<NotificationColumn>[] = [
    { key: "status", width: 2, render: () => <Text color={notification.unread ? theme.info : undefined} dimColor={!notification.unread}>{notification.unread ? "●" : "○"}</Text> },
    { key: "type", width: 12, render: () => <Text dimColor>{TYPE_LABELS[notification.type] ?? notification.type}</Text> },
    { key: "title", flexGrow: 1, render: () => <Text bold={selected} dimColor={!notification.unread && !selected} wrap="truncate">{notification.title}</Text> },
    { key: "reason", width: 12, render: () => <Text dimColor>{REASON_LABELS[notification.reason] ?? truncate(notification.reason, 10)}</Text> },
    { key: "time", width: 9, render: () => <Text dimColor>{timeAgo(notification.updatedAt)}</Text> },
  ];

  return (
    <Box gap={1}>
      <Text color={selected ? theme.accent : undefined}>{selected ? "▸" : " "}</Text>
      <Columns definitions={defs} visible={columns.notifications} />
    </Box>
  );
}
