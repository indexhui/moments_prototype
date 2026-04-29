"use client";

import { Flex, type FlexProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

export const EVENT_DIALOG_HEIGHT = "200px";
export const EVENT_DIALOG_ACTION_HEIGHT = "52px";
export const EVENT_DIALOG_ACTION_INSET = "12px";

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
      p={EVENT_DIALOG_ACTION_INSET}
      pb={`calc(${EVENT_DIALOG_ACTION_HEIGHT} + ${EVENT_DIALOG_ACTION_INSET} * 2)`}
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
