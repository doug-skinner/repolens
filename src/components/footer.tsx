import { Box, Text } from "ink";
import type { View } from "../lib/types.js";

interface FooterProps {
  activeView: View;
  isFiltering?: boolean;
}

interface HintGroup {
  label: string;
  hints: string[];
}

const FILTER_ACTIVE_GROUPS: HintGroup[] = [
  { label: "Filter", hints: ["type to search", "Enter confirm", "Esc clear"] },
];

const DASHBOARD_GROUPS: HintGroup[] = [
  { label: "Nav", hints: ["tab switch", "1-8 jump"] },
  { label: "Global", hints: ["r refresh", "? help"] },
];

const ISSUE_GROUPS: HintGroup[] = [
  { label: "Nav", hints: ["↑↓ jk", "/ filter", "s sort", "m mine"] },
  { label: "Actions", hints: ["c create", "e edit", "x close", "l labels", "A assign", "C comment"] },
  { label: "View", hints: ["Space mark", "d detail", "o open", "? help"] },
];

const PR_GROUPS: HintGroup[] = [
  { label: "Nav", hints: ["↑↓ jk", "/ filter", "s sort", "m mine"] },
  { label: "Actions", hints: ["f files", "M merge", "x close", "a approve", "X changes", "l labels", "A assign", "C comment"] },
  { label: "View", hints: ["Space mark", "d detail", "o open", "? help"] },
];

const ACTION_GROUPS: HintGroup[] = [
  { label: "Nav", hints: ["↑↓ jk", "/ filter", "s sort"] },
  { label: "Actions", hints: ["R re-run"] },
  { label: "View", hints: ["d detail", "o open", "? help"] },
];

const MILESTONE_GROUPS: HintGroup[] = [
  { label: "Nav", hints: ["↑↓ jk", "/ filter", "s sort"] },
  { label: "Actions", hints: ["x close", "i issues"] },
  { label: "View", hints: ["d detail", "o open", "? help"] },
];

const RELEASE_GROUPS: HintGroup[] = [
  { label: "Nav", hints: ["↑↓ jk", "/ filter", "s sort", "m mine"] },
  { label: "Actions", hints: ["f type"] },
  { label: "View", hints: ["d detail", "o open", "? help"] },
];

const COMMIT_GROUPS: HintGroup[] = [
  { label: "Nav", hints: ["↑↓ jk", "/ filter", "s sort", "m mine"] },
  { label: "View", hints: ["d detail", "o open", "? help"] },
];

const NOTIFICATION_GROUPS: HintGroup[] = [
  { label: "Nav", hints: ["↑↓ jk", "/ filter", "s sort"] },
  { label: "Actions", hints: ["u unread", "n mark read"] },
  { label: "View", hints: ["d detail", "o open", "? help"] },
];

const BRANCH_GROUPS: HintGroup[] = [
  { label: "Nav", hints: ["↑↓ jk", "/ filter", "s sort", "m mine"] },
  { label: "View", hints: ["d detail", "? help"] },
];

const LIST_GROUPS: HintGroup[] = [
  { label: "Nav", hints: ["↑↓ jk", "/ filter", "s sort", "m mine"] },
  { label: "View", hints: ["d detail", "o open", "? help"] },
];

const VIEW_GROUPS: Record<View, HintGroup[]> = {
  dashboard: DASHBOARD_GROUPS,
  issues: ISSUE_GROUPS,
  prs: PR_GROUPS,
  actions: ACTION_GROUPS,
  milestones: MILESTONE_GROUPS,
  releases: RELEASE_GROUPS,
  commits: COMMIT_GROUPS,
  notifications: NOTIFICATION_GROUPS,
  branches: BRANCH_GROUPS,
};

export function Footer({ activeView, isFiltering }: FooterProps) {
  const groups = isFiltering ? FILTER_ACTIVE_GROUPS : (VIEW_GROUPS[activeView] ?? LIST_GROUPS);

  return (
    <Box paddingX={1} gap={1}>
      {groups.map((group, i) => (
        <Box key={group.label}>
          {i > 0 && <Text dimColor> | </Text>}
          <Text bold dimColor>{group.label}: </Text>
          <Text dimColor>{group.hints.join("  ")}</Text>
        </Box>
      ))}
    </Box>
  );
}
