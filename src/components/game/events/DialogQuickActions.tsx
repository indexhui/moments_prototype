"use client";

import { useState } from "react";
import { Flex, Grid, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { EVENT_DIALOG_HEIGHT } from "@/components/game/events/EventDialogPanel";
import { ROUTES } from "@/lib/routes";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import {
  loadDialogTypingMode,
  saveDialogTypingMode,
  type DialogTypingMode,
} from "@/lib/game/dialogTyping";

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
  const router = useRouter();
  const [isDefaultOptionsOpen, setIsDefaultOptionsOpen] = useState(false);
  const [dialogTypingMode, setDialogTypingMode] = useState<DialogTypingMode>(
    () => loadDialogTypingMode(),
  );

  const handleOpenOptions = () => {
    if (onOpenOptions) {
      onOpenOptions();
      return;
    }
    setIsDefaultOptionsOpen(true);
  };

  const navigateTo = (path: string) => {
    setIsDefaultOptionsOpen(false);
    router.push(withTrialProfileSearch(path));
  };

  return (
    <>
      <Flex
        position="absolute"
        top="14px"
        left="14px"
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
            handleOpenOptions();
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
      </Flex>
      {onOpenDiary ? (
        <Flex
          as="button"
          position="absolute"
          right="14px"
          bottom={`calc(${EVENT_DIALOG_HEIGHT} + 8px)`}
          w="38px"
          h="38px"
          border="0"
          bgColor="rgba(148, 110, 79, 0.9)"
          borderRadius="6px"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          zIndex={12}
          data-no-story-advance="true"
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
      {isDefaultOptionsOpen ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={72}
          bgColor="rgba(18,14,10,0.52)"
          alignItems="center"
          justifyContent="center"
          p="24px"
          data-no-story-advance="true"
          onClick={(event) => {
            event.stopPropagation();
            setIsDefaultOptionsOpen(false);
          }}
        >
          <Flex
            w="100%"
            maxW="280px"
            borderRadius="14px"
            border="2px solid rgba(255,255,255,0.3)"
            bgColor="rgba(95,74,56,0.96)"
            boxShadow="0 14px 30px rgba(0,0,0,0.35)"
            p="14px"
            direction="column"
            gap="10px"
            onClick={(event) => event.stopPropagation()}
          >
            <Text color="#FFF2E3" fontSize="15px" fontWeight="700" px="6px">
              選單
            </Text>
            <Flex
              as="button"
              h="40px"
              borderRadius="10px"
              bgColor="rgba(255,255,255,0.18)"
              border="1px solid rgba(255,255,255,0.26)"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              onClick={() => navigateTo(ROUTES.gameLobby)}
            >
              <Text color="white" fontSize="14px" fontWeight="700">
                遊戲大廳
              </Text>
            </Flex>
            <Flex
              as="button"
              h="40px"
              borderRadius="10px"
              bgColor="rgba(255,255,255,0.18)"
              border="1px solid rgba(255,255,255,0.26)"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              onClick={() => navigateTo(ROUTES.gameScene("scene-night-hub"))}
            >
              <Text color="white" fontSize="14px" fontWeight="700">
                前往夜間 Hub
              </Text>
            </Flex>
            <Flex direction="column" gap="6px" px="4px" py="2px">
              <Text color="#FCECDD" fontSize="12px" fontWeight="700">
                對話速度
              </Text>
              <Grid templateColumns="repeat(4, minmax(0, 1fr))" gap="6px">
                {([
                  { key: "char", label: "逐字" },
                  { key: "double-char", label: "雙字" },
                  { key: "punctuated", label: "標點" },
                  { key: "pause", label: "停頓" },
                ] as Array<{ key: DialogTypingMode; label: string }>).map((mode) => (
                  <Flex
                    as="button"
                    key={mode.key}
                    h="28px"
                    borderRadius="999px"
                    border="1px solid rgba(255,255,255,0.26)"
                    bgColor={
                      dialogTypingMode === mode.key
                        ? "rgba(255,255,255,0.26)"
                        : "rgba(255,255,255,0.08)"
                    }
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    onClick={() => {
                      setDialogTypingMode(mode.key);
                      saveDialogTypingMode(mode.key);
                    }}
                  >
                    <Text color="white" fontSize="11px" fontWeight="700">
                      {mode.label}
                    </Text>
                  </Flex>
                ))}
              </Grid>
            </Flex>
            <Flex
              as="button"
              h="36px"
              borderRadius="999px"
              bgColor="rgba(255,255,255,0.12)"
              border="1px solid rgba(255,255,255,0.22)"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              onClick={() => setIsDefaultOptionsOpen(false)}
            >
              <Text color="#FCECDD" fontSize="13px" fontWeight="700">
                關閉
              </Text>
            </Flex>
          </Flex>
        </Flex>
      ) : null}
    </>
  );
}
