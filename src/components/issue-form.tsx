import { useState, useEffect, useMemo, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";
import { fetchLabels, createIssue } from "../lib/gh.js";
import type { Milestone } from "../lib/types.js";

const FIELDS = ["title", "body", "labels", "milestone", "assignee"] as const;
type FieldName = (typeof FIELDS)[number];

const SELECT_VIEWPORT = 6;

function computeWindow(total: number, cursor: number) {
  if (total <= SELECT_VIEWPORT) return { start: 0, end: total };
  let start = cursor - Math.floor(SELECT_VIEWPORT / 2);
  start = Math.max(0, Math.min(start, total - SELECT_VIEWPORT));
  return { start, end: start + SELECT_VIEWPORT };
}

interface IssueFormProps {
  milestones: Milestone[];
  onClose: () => void;
  onCreated: () => void;
}

export function IssueForm({ milestones, onClose, onCreated }: IssueFormProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [assignee, setAssignee] = useState("");
  const [repoLabels, setRepoLabels] = useState<string[]>([]);
  const [labelsLoading, setLabelsLoading] = useState(true);
  const [labelsCursor, setLabelsCursor] = useState(0);
  const [milestoneCursor, setMilestoneCursor] = useState(0);
  const [status, setStatus] = useState<"editing" | "submitting" | "error">("editing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchLabels()
      .then((l) => {
        setRepoLabels(l);
        setLabelsLoading(false);
      })
      .catch(() => setLabelsLoading(false));
  }, []);

  const milestoneNames = useMemo(() => milestones.map((m) => m.title), [milestones]);
  const focusedField: FieldName = FIELDS[focusedIndex];
  const isSelectField = focusedField === "labels" || focusedField === "milestone";

  const submit = useCallback(async () => {
    setStatus("submitting");
    try {
      await createIssue({
        title: title.trim(),
        body: body.trim() || undefined,
        labels: selectedLabels.size > 0 ? [...selectedLabels] : undefined,
        milestone: selectedMilestone ?? undefined,
        assignee: assignee.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to create issue");
      setTimeout(() => setStatus("editing"), 3000);
    }
  }, [title, body, selectedLabels, selectedMilestone, assignee, onCreated]);

  useInput((input, key) => {
    if (status !== "editing") return;

    if (key.escape) {
      onClose();
      return;
    }

    if (key.return) {
      if (!title.trim()) return;
      submit();
      return;
    }

    if (key.tab) {
      setFocusedIndex((i) => (key.shift ? (i - 1 + FIELDS.length) % FIELDS.length : (i + 1) % FIELDS.length));
      return;
    }

    if (isSelectField) {
      const options = focusedField === "labels" ? repoLabels : milestoneNames;
      const cursor = focusedField === "labels" ? labelsCursor : milestoneCursor;
      const setCursor = focusedField === "labels" ? setLabelsCursor : setMilestoneCursor;

      if (input === "j" || key.downArrow) {
        setCursor(Math.min(cursor + 1, options.length - 1));
      } else if (input === "k" || key.upArrow) {
        setCursor(Math.max(cursor - 1, 0));
      } else if (input === " ") {
        const option = options[cursor];
        if (!option) return;
        if (focusedField === "labels") {
          setSelectedLabels((prev) => {
            const next = new Set(prev);
            if (next.has(option)) next.delete(option);
            else next.add(option);
            return next;
          });
        } else {
          setSelectedMilestone((prev) => (prev === option ? null : option));
        }
      }
      return;
    }

    if (key.upArrow) {
      setFocusedIndex((i) => (i - 1 + FIELDS.length) % FIELDS.length);
      return;
    }
    if (key.downArrow) {
      setFocusedIndex((i) => (i + 1) % FIELDS.length);
      return;
    }

    if (key.backspace || key.delete) {
      if (focusedField === "title") setTitle((t) => t.slice(0, -1));
      else if (focusedField === "body") setBody((b) => b.slice(0, -1));
      else if (focusedField === "assignee") setAssignee((a) => a.slice(0, -1));
      return;
    }

    if (input && !key.ctrl && !key.meta) {
      if (focusedField === "title") setTitle((t) => t + input);
      else if (focusedField === "body") setBody((b) => b + input);
      else if (focusedField === "assignee") setAssignee((a) => a + input);
    }
  });

  if (status === "submitting") {
    return (
      <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
        <Text bold color="cyan">New Issue</Text>
        <Box gap={1} marginTop={1}>
          <Spinner type="dots" />
          <Text>Creating issue…</Text>
        </Box>
      </Box>
    );
  }

  const labelFieldLabel = "Labels:".padEnd(11);
  const milestoneFieldLabel = "Milestone:".padEnd(11);

  const labelsWindow = computeWindow(repoLabels.length, labelsCursor);
  const milestoneWindow = computeWindow(milestoneNames.length, milestoneCursor);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
      <Text bold color="cyan">New Issue</Text>

      <TextField label="Title:" focused={focusedIndex === 0} value={title} required />
      <TextField label="Body:" focused={focusedIndex === 1} value={body} />

      {/* Labels */}
      <Box flexDirection="column" marginTop={focusedIndex === 2 ? 0 : 0}>
        <Box gap={1}>
          <Text color={focusedIndex === 2 ? "cyan" : undefined} dimColor={focusedIndex !== 2}>
            {labelFieldLabel}
          </Text>
          {focusedIndex !== 2 && selectedLabels.size > 0 && (
            <Text color="yellow">{[...selectedLabels].join(", ")}</Text>
          )}
          {focusedIndex !== 2 && selectedLabels.size === 0 && <Text dimColor>none</Text>}
        </Box>
        {focusedIndex === 2 &&
          (labelsLoading ? (
            <Box paddingLeft={2} gap={1}>
              <Spinner type="dots" />
              <Text dimColor>Loading labels…</Text>
            </Box>
          ) : repoLabels.length === 0 ? (
            <Box paddingLeft={2}>
              <Text dimColor>No labels in repository</Text>
            </Box>
          ) : (
            <>
              {labelsWindow.start > 0 && (
                <Box paddingLeft={2}>
                  <Text dimColor>↑ more</Text>
                </Box>
              )}
              {repoLabels.slice(labelsWindow.start, labelsWindow.end).map((label, i) => {
                const idx = labelsWindow.start + i;
                const isCursor = idx === labelsCursor;
                const isSelected = selectedLabels.has(label);
                return (
                  <Box key={label} paddingLeft={2} gap={1}>
                    <Text color={isCursor ? "cyan" : undefined} bold={isCursor}>
                      {isSelected ? "✓" : "○"} {label}
                    </Text>
                  </Box>
                );
              })}
              {labelsWindow.end < repoLabels.length && (
                <Box paddingLeft={2}>
                  <Text dimColor>↓ more</Text>
                </Box>
              )}
            </>
          ))}
      </Box>

      {/* Milestone */}
      <Box flexDirection="column">
        <Box gap={1}>
          <Text color={focusedIndex === 3 ? "cyan" : undefined} dimColor={focusedIndex !== 3}>
            {milestoneFieldLabel}
          </Text>
          {focusedIndex !== 3 && selectedMilestone && <Text color="cyan">{selectedMilestone}</Text>}
          {focusedIndex !== 3 && !selectedMilestone && <Text dimColor>none</Text>}
        </Box>
        {focusedIndex === 3 &&
          (milestoneNames.length === 0 ? (
            <Box paddingLeft={2}>
              <Text dimColor>No open milestones</Text>
            </Box>
          ) : (
            <>
              {milestoneWindow.start > 0 && (
                <Box paddingLeft={2}>
                  <Text dimColor>↑ more</Text>
                </Box>
              )}
              {milestoneNames.slice(milestoneWindow.start, milestoneWindow.end).map((ms, i) => {
                const idx = milestoneWindow.start + i;
                const isCursor = idx === milestoneCursor;
                const isSelected = selectedMilestone === ms;
                return (
                  <Box key={ms} paddingLeft={2} gap={1}>
                    <Text color={isCursor ? "cyan" : undefined} bold={isCursor}>
                      {isSelected ? "●" : "○"} {ms}
                    </Text>
                  </Box>
                );
              })}
              {milestoneWindow.end < milestoneNames.length && (
                <Box paddingLeft={2}>
                  <Text dimColor>↓ more</Text>
                </Box>
              )}
            </>
          ))}
      </Box>

      <TextField label="Assignee:" focused={focusedIndex === 4} value={assignee} />

      {status === "error" && (
        <Box marginTop={1}>
          <Text color="red">✗ {errorMessage}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>
          {isSelectField
            ? "j/k navigate · Space select · Tab next · Enter submit · Esc cancel"
            : "Tab next field · ↑↓ prev/next · Enter submit · Esc cancel"}
        </Text>
      </Box>
    </Box>
  );
}

function TextField({
  label,
  focused,
  value,
  required,
}: {
  label: string;
  focused: boolean;
  value: string;
  required?: boolean;
}) {
  return (
    <Box gap={1}>
      <Text color={focused ? "cyan" : undefined} dimColor={!focused}>
        {label.padEnd(11)}
      </Text>
      {value ? <Text>{value}</Text> : !focused && <Text dimColor>{required ? "(required)" : "none"}</Text>}
      {focused && <Text color="cyan">▏</Text>}
    </Box>
  );
}
