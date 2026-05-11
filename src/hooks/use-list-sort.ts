import { useState, useCallback, useMemo } from "react";

export interface SortOption<K extends string = string> {
  key: K;
  label: string;
}

export interface ListSort<K extends string = string> {
  current: K;
  label: string;
  cycleSort: () => void;
}

export function useListSort<K extends string>(options: readonly SortOption<K>[], defaultKey?: K): ListSort<K> {
  const defaultIndex = defaultKey
    ? Math.max(0, options.findIndex((o) => o.key === defaultKey))
    : 0;
  const [index, setIndex] = useState(defaultIndex);

  const cycleSort = useCallback(() => {
    setIndex((i) => (i + 1) % options.length);
  }, [options.length]);

  return useMemo(() => ({
    current: options[index].key,
    label: options[index].label,
    cycleSort,
  }), [options, index, cycleSort]);
}
