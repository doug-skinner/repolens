import { useState, useRef, useCallback } from "react";
import { useInput, useStdout } from "ink";

const GG_TIMEOUT_MS = 500;
const LAYOUT_OVERHEAD = 6; // header (4) + margin (1) + footer (1)

export function useListNavigation(length: number, onSelect: (index: number) => void) {
  const { stdout } = useStdout();
  const viewportHeight = Math.max(1, (stdout?.rows ?? 24) - LAYOUT_OVERHEAD);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollOffsetRef = useRef(0);
  const gPending = useRef(false);
  const gTimer = useRef<ReturnType<typeof setTimeout>>();

  const clearPendingG = useCallback(() => {
    gPending.current = false;
    if (gTimer.current) {
      clearTimeout(gTimer.current);
      gTimer.current = undefined;
    }
  }, []);

  useInput((input, key) => {
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
    } else if (key.return) {
      clearPendingG();
      onSelect(selectedIndex);
    } else {
      clearPendingG();
    }
  });

  let offset = scrollOffsetRef.current;
  if (selectedIndex < offset) offset = selectedIndex;
  if (selectedIndex >= offset + viewportHeight) offset = selectedIndex - viewportHeight + 1;
  offset = Math.max(0, Math.min(offset, Math.max(0, length - viewportHeight)));
  scrollOffsetRef.current = offset;

  return { selectedIndex, scrollOffset: offset, viewportHeight };
}
