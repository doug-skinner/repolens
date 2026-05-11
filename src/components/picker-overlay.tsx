import { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";

const VIEWPORT_SIZE = 8;

function computeWindow(total: number, cursor: number) {
  if (total <= VIEWPORT_SIZE) return { start: 0, end: total };
  let start = cursor - Math.floor(VIEWPORT_SIZE / 2);
  start = Math.max(0, Math.min(start, total - VIEWPORT_SIZE));
  return { start, end: start + VIEWPORT_SIZE };
}

type PickerStatus = "picking" | "saving" | "success" | "error";

interface PickerOverlayProps {
  title: string;
  options: string[];
  selected: Set<string>;
  loading: boolean;
  onConfirm: (selected: Set<string>) => void;
  onCancel: () => void;
}

export function PickerOverlay({ title, options, selected: initial, loading, onConfirm, onCancel }: PickerOverlayProps) {
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState(() => new Set(initial));
  const [status, setStatus] = useState<PickerStatus>("picking");

  useEffect(() => { setSelected(new Set(initial)); }, [initial]);

  useInput((input, key) => {
    if (status !== "picking") return;

    if (key.escape) { onCancel(); return; }

    if (key.return) {
      setStatus("saving");
      onConfirm(selected);
      return;
    }

    if (input === "j" || key.downArrow) {
      setCursor((c) => Math.min(c + 1, options.length - 1));
    } else if (input === "k" || key.upArrow) {
      setCursor((c) => Math.max(c - 1, 0));
    } else if (input === " ") {
      const option = options[cursor];
      if (!option) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(option)) next.delete(option);
        else next.add(option);
        return next;
      });
    }
  });

  if (loading) {
    return (
      <Box paddingX={1} gap={1}>
        <Spinner type="dots" />
        <Text dimColor>Loading {title.toLowerCase()}…</Text>
      </Box>
    );
  }

  if (options.length === 0) {
    return (
      <Box paddingX={1}>
        <Text dimColor>No {title.toLowerCase()} available</Text>
      </Box>
    );
  }

  if (status === "saving") {
    return (
      <Box paddingX={1} gap={1}>
        <Spinner type="dots" />
        <Text>Saving {title.toLowerCase()}…</Text>
      </Box>
    );
  }

  const window = computeWindow(options.length, cursor);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
      <Text bold color="cyan">{title}</Text>
      {window.start > 0 && <Text dimColor>  ↑ more</Text>}
      {options.slice(window.start, window.end).map((option, i) => {
        const idx = window.start + i;
        const isCursor = idx === cursor;
        const isSelected = selected.has(option);
        return (
          <Box key={option} gap={1}>
            <Text color={isCursor ? "cyan" : undefined} bold={isCursor}>
              {isSelected ? "✓" : "○"} {option}
            </Text>
          </Box>
        );
      })}
      {window.end < options.length && <Text dimColor>  ↓ more</Text>}
      <Text dimColor>j/k navigate · Space toggle · Enter save · Esc cancel</Text>
    </Box>
  );
}
