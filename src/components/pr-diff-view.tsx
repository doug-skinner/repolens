import { useState, useMemo } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { useTheme } from "../lib/config-context.js";

interface PrDiffViewProps {
  prNumber: number;
  prTitle: string;
  diff: string;
  onClose: () => void;
}

interface FileStat {
  file: string;
  additions: number;
  deletions: number;
}

function parseFileStats(diff: string): FileStat[] {
  const stats: FileStat[] = [];
  let currentFile: string | null = null;
  let additions = 0;
  let deletions = 0;

  for (const line of diff.split("\n")) {
    if (line.startsWith("diff --git")) {
      if (currentFile) stats.push({ file: currentFile, additions, deletions });
      const match = line.match(/b\/(.+)$/);
      currentFile = match ? match[1] : "unknown";
      additions = 0;
      deletions = 0;
    } else if (currentFile && line.startsWith("+") && !line.startsWith("+++")) {
      additions++;
    } else if (currentFile && line.startsWith("-") && !line.startsWith("---")) {
      deletions++;
    }
  }
  if (currentFile) stats.push({ file: currentFile, additions, deletions });
  return stats;
}

const LAYOUT_OVERHEAD = 7;

export function PrDiffView({ prNumber, prTitle, diff, onClose }: PrDiffViewProps) {
  const theme = useTheme();
  const { stdout } = useStdout();
  const totalHeight = Math.max(1, (stdout?.rows ?? 24) - LAYOUT_OVERHEAD);
  const [scrollOffset, setScrollOffset] = useState(0);

  const fileStats = useMemo(() => parseFileStats(diff), [diff]);

  const lines = useMemo(() => {
    const result: { text: string; color?: string; dim?: boolean; bold?: boolean }[] = [];

    result.push({ text: `PR #${prNumber}: ${prTitle}`, bold: true });
    result.push({ text: "" });
    result.push({ text: `${fileStats.length} file${fileStats.length !== 1 ? "s" : ""} changed`, bold: true });

    for (const stat of fileStats) {
      const parts = `  ${stat.file}`;
      const suffix = ` +${stat.additions} -${stat.deletions}`;
      result.push({ text: parts + suffix, dim: true });
    }

    result.push({ text: "" });

    for (const line of diff.split("\n")) {
      if (line.startsWith("diff --git")) {
        result.push({ text: "" });
        result.push({ text: line, bold: true, color: theme.accent });
      } else if (line.startsWith("@@")) {
        result.push({ text: line, color: theme.info });
      } else if (line.startsWith("+") && !line.startsWith("+++")) {
        result.push({ text: line, color: theme.success });
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        result.push({ text: line, color: theme.error });
      } else if (line.startsWith("+++") || line.startsWith("---")) {
        result.push({ text: line, bold: true });
      } else {
        result.push({ text: line });
      }
    }

    return result;
  }, [diff, fileStats, prNumber, prTitle, theme]);

  const maxScroll = Math.max(0, lines.length - totalHeight);

  useInput((input, key) => {
    if (key.escape || input === "f" || input === "q") {
      onClose();
      return;
    }
    if (key.upArrow || input === "k") {
      setScrollOffset((o) => Math.max(0, o - 1));
    } else if (key.downArrow || input === "j") {
      setScrollOffset((o) => Math.min(maxScroll, o + 1));
    } else if (input === "g") {
      setScrollOffset(0);
    } else if (input === "G") {
      setScrollOffset(maxScroll);
    } else if (input === "d" && key.ctrl) {
      setScrollOffset((o) => Math.min(maxScroll, o + Math.floor(totalHeight / 2)));
    } else if (input === "u" && key.ctrl) {
      setScrollOffset((o) => Math.max(0, o - Math.floor(totalHeight / 2)));
    }
  });

  const visible = lines.slice(scrollOffset, scrollOffset + totalHeight);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={theme.accent} paddingX={1} height={totalHeight + 2} overflow="hidden">
      {visible.map((line, i) => (
        <Text key={scrollOffset + i} color={line.color} dimColor={line.dim} bold={line.bold} wrap="truncate">
          {line.text}
        </Text>
      ))}
    </Box>
  );
}
