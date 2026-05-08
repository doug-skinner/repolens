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

export function useListSort<K extends string>(options: readonly SortOption<K>[]): ListSort<K> {
  const [index, setIndex] = useState(0);

  const cycleSort = useCallback(() => {
    setIndex((i) => (i + 1) % options.length);
  }, [options.length]);

  return useMemo(() => ({
    current: options[index].key,
    label: options[index].label,
    cycleSort,
  }), [options, index, cycleSort]);
}
