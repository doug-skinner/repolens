import { useState } from "react";
import { Box, useInput } from "ink";
import { PrRow } from "./pr-row.js";
import { openPrInBrowser } from "../lib/gh.js";
import type { PullRequest } from "../lib/types.js";

interface PrListProps {
  prs: PullRequest[];
}

export function PrList({ prs }: PrListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((_input, key) => {
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setSelectedIndex((i) => Math.min(prs.length - 1, i + 1));
    } else if (key.return) {
      openPrInBrowser(prs[selectedIndex].number);
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
