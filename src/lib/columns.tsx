import { Box } from "ink";
import type { ReactNode } from "react";

export interface ColumnDef<K extends string> {
  key: K;
  width?: number;
  flexGrow?: number;
  render: () => ReactNode;
}

interface ColumnsProps<K extends string> {
  definitions: ColumnDef<K>[];
  visible: Record<K, boolean>;
}

export function Columns<K extends string>({ definitions, visible }: ColumnsProps<K>) {
  const shown = definitions.filter((d) => visible[d.key]);

  return (
    <>
      {shown.map((col) => (
        <Box
          key={col.key}
          width={col.flexGrow ? undefined : col.width}
          flexGrow={col.flexGrow ?? 0}
        >
          {col.render()}
        </Box>
      ))}
    </>
  );
}
