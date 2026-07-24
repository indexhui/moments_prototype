"use client";

import { Flex, Text } from "@chakra-ui/react";
import { EVENT_DIALOG_HEIGHT } from "@/components/game/events/EventDialogPanel";

type DialogQuickActionsProps = {
  onOpenOptions?: () => void;
  onOpenHistory?: () => void;
  onOpenDiary?: () => void;
  placement?: "dialog" | "top-right";
};

export function DialogQuickActions({
  onOpenOptions,
  onOpenHistory,
  onOpenDiary,
  placement = "dialog",
}: DialogQuickActionsProps) {
  const isTopRight = placement === "top-right";

  return (
    <Flex
      position="absolute"
      top={isTopRight ? "14px" : undefined}
      right="14px"
      bottom={isTopRight ? undefined : `calc(${EVENT_DIALOG_HEIGHT} + ${onOpenDiary ? 8 : 54}px)`}
      direction="column"
      gap="8px"
      zIndex={12}
      data-no-story-advance="true"
    >
      <Flex
        as="button"
        w="38px"
        h="38px"
        border="0"
        bgColor="rgba(148, 110, 79, 0.9)"
        borderRadius="6px"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        aria-label="開啟選單"
        onClick={(event) => {
          event.stopPropagation();
          onOpenOptions?.();
        }}
      >
        <Text color="white" fontSize="18px" pointerEvents="none">
          ≡
        </Text>
      </Flex>
      <Flex
        as="button"
        w="38px"
        h="38px"
        border="0"
        bgColor="rgba(148, 110, 79, 0.9)"
        borderRadius="6px"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        aria-label="開啟對話回顧"
        onClick={(event) => {
          event.stopPropagation();
          onOpenHistory?.();
        }}
      >
        <Text color="white" fontSize="18px" pointerEvents="none">
          ↺
        </Text>
      </Flex>
      {onOpenDiary ? (
        <Flex
          as="button"
          w="38px"
          h="38px"
          border="0"
          bgColor="rgba(148, 110, 79, 0.9)"
          borderRadius="6px"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          aria-label="開啟日記"
          onClick={(event) => {
            event.stopPropagation();
            onOpenDiary();
          }}
        >
          <Text color="white" fontSize="15px" fontWeight="700" pointerEvents="none">
            日記
          </Text>
        </Flex>
      ) : null}
    </Flex>
  );
}
