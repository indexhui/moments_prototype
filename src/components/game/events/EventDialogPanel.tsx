"use client";

import { Flex, type FlexProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

export const EVENT_DIALOG_HEIGHT = "200px";

type EventDialogPanelProps = FlexProps & {
  children: ReactNode;
};

export function EventDialogPanel({ children, ...rest }: EventDialogPanelProps) {
  return (
    <Flex
      h={EVENT_DIALOG_HEIGHT}
      minH={EVENT_DIALOG_HEIGHT}
      maxH={EVENT_DIALOG_HEIGHT}
      bgColor="#8E6D52"
      p="12px"
      direction="column"
      gap="8px"
      overflow="visible"
      position="relative"
      zIndex={8}
      {...rest}
    >
      {children}
    </Flex>
  );
}
