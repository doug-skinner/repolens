import { useState, useCallback, useEffect, useRef } from "react";

export function useCommentInput(onInputModeChange?: (editing: boolean) => void) {
  const [isEditing, setIsEditing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [targetLabel, setTargetLabel] = useState("");
  const clearTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    onInputModeChange?.(isEditing);
  }, [isEditing, onInputModeChange]);

  useEffect(() => {
    return () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, []);

  const startEditing = useCallback((label: string) => {
    if (clearTimer.current) clearTimeout(clearTimer.current);
    setTargetLabel(label);
    setCommentText("");
    setStatus("idle");
    setIsEditing(true);
  }, []);

  const cancel = useCallback(() => {
    setIsEditing(false);
    setCommentText("");
  }, []);

  const beginSubmit = useCallback(() => {
    setIsEditing(false);
    setStatus("submitting");
  }, []);

  const resolveSubmit = useCallback(() => {
    setCommentText("");
    setStatus("success");
    clearTimer.current = setTimeout(() => setStatus("idle"), 2000);
  }, []);

  const rejectSubmit = useCallback(() => {
    setStatus("error");
    clearTimer.current = setTimeout(() => setStatus("idle"), 3000);
  }, []);

  const appendChar = useCallback((ch: string) => setCommentText((q) => q + ch), []);
  const backspace = useCallback(() => setCommentText((q) => q.slice(0, -1)), []);

  return {
    isEditing,
    commentText,
    status,
    targetLabel,
    startEditing,
    cancel,
    beginSubmit,
    resolveSubmit,
    rejectSubmit,
    appendChar,
    backspace,
  };
}

export type CommentState = ReturnType<typeof useCommentInput>;
