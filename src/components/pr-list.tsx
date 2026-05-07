import { useState } from "react";
import { Box, useInput, useApp } from "ink";
import { PrRow } from "./pr-row.js";
import { openPrInBrowser } from "../lib/gh.js";
import type { PullRequest } from "../lib/types.js";

interface PrListProps {
  prs: PullRequest[];
  refetch: () => void;
}

export function PrList({ prs, refetch }: PrListProps) {
  const { exit } = useApp();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setSelectedIndex((i) => Math.min(prs.length - 1, i + 1));
    } else if (key.return) {
      openPrInBrowser(prs[selectedIndex].number);
    } else if (input === "r") {
      setSelectedIndex(0);
      refetch();
    } else if (input === "q") {
      exit();
    }
  });

  return (
    <Box flexDirection="column">
      {prs.map((pr, i) => (
        <PrRow key={pr.number} pr={pr} selected={i === selectedIndex} />
      ))}
    </Box>
  );
}
