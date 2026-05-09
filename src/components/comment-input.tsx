import { Box, Text } from "ink";
import Spinner from "ink-spinner";

interface CommentInputProps {
  targetLabel: string;
  text: string;
  isEditing: boolean;
  status: "idle" | "submitting" | "success" | "error";
}

export function CommentInput({ targetLabel, text, isEditing, status }: CommentInputProps) {
  if (!isEditing && status === "idle") return null;

  if (status === "submitting") {
    return (
      <Box paddingX={1} gap={1}>
        <Spinner type="dots" />
        <Text>Posting comment on {targetLabel}…</Text>
      </Box>
    );
  }

  if (status === "success") {
    return (
      <Box paddingX={1} gap={1}>
        <Text color="green">✓</Text>
        <Text>Comment posted on {targetLabel}</Text>
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box paddingX={1} gap={1}>
        <Text color="red">✗</Text>
        <Text>Failed to post comment</Text>
      </Box>
    );
  }

  return (
    <Box paddingX={1} gap={1}>
      <Text color="cyan">{targetLabel}:</Text>
      <Text>{text}</Text>
      <Text color="cyan">▏</Text>
    </Box>
  );
}
