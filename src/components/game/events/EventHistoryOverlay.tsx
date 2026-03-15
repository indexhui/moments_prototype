"use client";

import { Flex, Text } from "@chakra-ui/react";

export type EventHistoryLine = {
  id: string;
  speaker: string;
  text: string;
};

type EventHistoryOverlayProps = {
  title?: string;
  open: boolean;
  onClose: () => void;
  lines: EventHistoryLine[];
};

export function EventHistoryOverlay({
  title = "回顧",
  open,
  onClose,
  lines,
}: EventHistoryOverlayProps) {
  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={70}
      opacity={open ? 1 : 0}
      pointerEvents={open ? "auto" : "none"}
      transition="opacity 0.22s ease"
    >
      <Flex
        position="absolute"
        inset="0"
        bgColor="rgba(0, 0, 0, 0.25)"
        onClick={onClose}
      />
      <Flex
        w="100%"
        h="100%"
        bgColor="#9E795A"
        direction="column"
        transform={open ? "translateY(0)" : "translateY(12px)"}
        transition="transform 0.22s ease"
      >
        <Flex
          h="72px"
          borderBottom="1px solid rgba(255,255,255,0.28)"
          alignItems="center"
          px="16px"
          justifyContent="space-between"
        >
          <Flex onClick={onClose} cursor="pointer">
            <Text color="white" fontSize="18px" fontWeight="700">
              {"< 返回"}
            </Text>
          </Flex>
          <Text color="white" fontSize="28px" fontWeight="700" lineHeight="1">
            {title}
          </Text>
          <Flex w="64px" />
        </Flex>

        <Flex direction="column" gap="16px" p="16px" overflowY="auto">
          {lines.length === 0 ? (
            <Text color="white" fontSize="15px" lineHeight="1.6">
              目前還沒有可回顧的對話。
            </Text>
          ) : (
            lines.map((item) => (
              <Flex key={item.id} direction="column" gap="6px">
                <Text color="white" fontWeight="700" fontSize="22px" lineHeight="1.2">
                  {item.speaker}
                </Text>
                <Text color="white" fontSize="16px" lineHeight="1.55">
                  {item.text}
                </Text>
              </Flex>
            ))
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}
