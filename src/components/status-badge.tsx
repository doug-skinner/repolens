import { Text } from "ink";
import Spinner from "ink-spinner";
import type { CheckSummary } from "../lib/types.js";

const checkBadges: Record<CheckSummary, () => React.JSX.Element> = {
  pass: () => <Text color="green">✓ checks</Text>,
  fail: () => <Text color="red">✗ checks</Text>,
  running: () => (
    <Text color="yellow">
      <Spinner type="dots" /> checks
    </Text>
  ),
  pending: () => <Text color="yellow">○ checks</Text>,
  none: () => <Text dimColor>— checks</Text>,
};

const reviewLabels: Record<string, () => React.JSX.Element> = {
  APPROVED: () => <Text color="green">✓ approved</Text>,
  CHANGES_REQUESTED: () => <Text color="red">✗ changes </Text>,
  REVIEW_REQUIRED: () => <Text color="yellow">● review  </Text>,
};

export function CheckBadge({ summary }: { summary: CheckSummary }) {
  const Badge = checkBadges[summary];
  return <Badge />;
}

export function ReviewBadge({ decision }: { decision: string }) {
  const Badge = reviewLabels[decision];
  if (!Badge) return <Text dimColor>— review  </Text>;
  return <Badge />;
}
