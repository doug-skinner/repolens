import { Box, Text } from "ink";

interface BreadcrumbProps {
  view: string;
  detail?: string;
}

export function Breadcrumb({ view, detail }: BreadcrumbProps) {
  return (
    <Box paddingX={1}>
      <Text dimColor>{view}</Text>
      {detail && (
        <>
          <Text dimColor> › </Text>
          <Text>{detail}</Text>
        </>
      )}
    </Box>
  );
}
