interface ParsedQuery {
  text: string;
  labelFilters: string[];
}

function parseQuery(query: string): ParsedQuery {
  const parts = query.split(/\s+/).filter(Boolean);
  const labelFilters: string[] = [];
  const textParts: string[] = [];

  for (const part of parts) {
    if (part.startsWith("label:") && part.length > 6) {
      labelFilters.push(part.slice(6).toLowerCase());
    } else {
      textParts.push(part);
    }
  }

  return { text: textParts.join(" "), labelFilters };
}

export function matchesFilter(
  title: string,
  query: string,
  labels?: { name: string }[],
): boolean {
  if (!query) return true;

  const { text, labelFilters } = parseQuery(query);

  if (labelFilters.length > 0) {
    if (!labels) return false;
    const hasAll = labelFilters.every((lf) =>
      labels.some((l) => l.name.toLowerCase().includes(lf)),
    );
    if (!hasAll) return false;
  }

  if (text) {
    return title.toLowerCase().includes(text.toLowerCase());
  }

  return true;
}
