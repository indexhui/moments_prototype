"use client";

import { Flex, Text } from "@chakra-ui/react";
import { EVENT_DIALOG_HEIGHT } from "@/components/game/events/EventDialogPanel";

type DialogQuickActionsProps = {
  onOpenOptions?: () => void;
  onOpenHistory?: () => void;
};

export function DialogQuickActions({
  onOpenOptions,
  onOpenHistory,
}: DialogQuickActionsProps) {
  return (
    <Flex
      position="absolute"
      right="14px"
      bottom={`calc(${EVENT_DIALOG_HEIGHT} + 8px)`}
      direction="column"
      gap="8px"
      zIndex={12}
    >
      <Flex
        w="38px"
        h="38px"
        bgColor="rgba(148, 110, 79, 0.9)"
        borderRadius="6px"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        onClick={onOpenOptions}
      >
        <Text color="white" fontSize="18px">
          ≡
        </Text>
      </Flex>
      <Flex
        w="38px"
        h="38px"
        bgColor="rgba(148, 110, 79, 0.9)"
        borderRadius="6px"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        onClick={onOpenHistory}
      >
        <Text color="white" fontSize="18px">
          ↺
        </Text>
      </Flex>
    </Flex>
  );
}
