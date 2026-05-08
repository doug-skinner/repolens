import { useState, useEffect, useCallback } from "react";

export function useListFilter(onFilteringChange?: (editing: boolean) => void) {
  const [isEditing, setIsEditing] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  useEffect(() => {
    onFilteringChange?.(isEditing);
  }, [isEditing, onFilteringChange]);

  const startEditing = useCallback(() => setIsEditing(true), []);

  const confirmEditing = useCallback(() => setIsEditing(false), []);

  const clearFilter = useCallback(() => {
    setIsEditing(false);
    setFilterQuery("");
  }, []);

  const appendChar = useCallback(
    (ch: string) => setFilterQuery((q) => q + ch),
    [],
  );

  const backspace = useCallback(
    () => setFilterQuery((q) => q.slice(0, -1)),
    [],
  );

  return {
    isEditing,
    filterQuery,
    startEditing,
    confirmEditing,
    clearFilter,
    appendChar,
    backspace,
  };
}

export type ListFilter = ReturnType<typeof useListFilter>;
