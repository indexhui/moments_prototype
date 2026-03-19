"use client";

import { Flex, Text } from "@chakra-ui/react";
import { EVENT_DIALOG_HEIGHT } from "@/components/game/events/EventDialogPanel";

type DialogQuickActionsProps = {
  onOpenOptions?: () => void;
  onOpenHistory?: () => void;
  onOpenDiary?: () => void;
};

export function DialogQuickActions({
  onOpenOptions,
  onOpenHistory,
  onOpenDiary,
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
      {onOpenDiary ? (
        <Flex
          w="38px"
          h="38px"
          bgColor="rgba(148, 110, 79, 0.9)"
          borderRadius="6px"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          onClick={onOpenDiary}
        >
          <Text color="white" fontSize="15px" fontWeight="700">
            日記
          </Text>
        </Flex>
      ) : null}
    </Flex>
  );
}
