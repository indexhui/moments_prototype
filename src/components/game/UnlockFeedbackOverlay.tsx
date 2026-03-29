"use client";

import { Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

export type UnlockFeedbackTone = "place" | "event" | "feature";

export type UnlockFeedbackItem = {
  id: string;
  badge: string;
  title: string;
  description: string;
  tone: UnlockFeedbackTone;
};

const toastIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-10px) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 12px 24px rgba(0,0,0,0.22);
  }
  50% {
    box-shadow: 0 16px 32px rgba(0,0,0,0.28);
  }
`;

function getToneStyle(tone: UnlockFeedbackTone) {
  if (tone === "place") {
    return {
      bg: "linear-gradient(135deg, rgba(255,247,230,0.96) 0%, rgba(244,225,188,0.96) 100%)",
      border: "rgba(181,132,64,0.55)",
      title: "#6D4B1F",
      body: "#7F6441",
      badgeBg: "rgba(181,132,64,0.14)",
    };
  }
  if (tone === "event") {
    return {
      bg: "linear-gradient(135deg, rgba(235,247,245,0.96) 0%, rgba(198,232,226,0.96) 100%)",
      border: "rgba(76,137,129,0.55)",
      title: "#285E58",
      body: "#4C6E69",
      badgeBg: "rgba(76,137,129,0.14)",
    };
  }
  return {
    bg: "linear-gradient(135deg, rgba(247,239,255,0.96) 0%, rgba(227,214,248,0.96) 100%)",
    border: "rgba(126,101,176,0.55)",
    title: "#543B84",
    body: "#6D6090",
    badgeBg: "rgba(126,101,176,0.14)",
  };
}

export function UnlockFeedbackOverlay({
  items,
}: {
  items: UnlockFeedbackItem[];
}) {
  if (items.length <= 0) return null;

  return (
    <Flex
      position="absolute"
      top="14px"
      left="50%"
      transform="translateX(-50%)"
      zIndex={80}
      direction="column"
      gap="10px"
      w="calc(100% - 28px)"
      maxW="320px"
      pointerEvents="none"
    >
      {items.map((item) => {
        const toneStyle = getToneStyle(item.tone);
        return (
          <Flex
            key={item.id}
            direction="column"
            gap="4px"
            px="14px"
            py="12px"
            borderRadius="16px"
            bg={toneStyle.bg}
            border={`1px solid ${toneStyle.border}`}
            boxShadow="0 12px 24px rgba(0,0,0,0.22)"
            animation={`${toastIn} 280ms ease-out, ${glowPulse} 1.8s ease-in-out 1`}
            backdropFilter="blur(10px)"
          >
            <Flex align="center" gap="8px">
              <Flex
                minW="32px"
                h="32px"
                px="8px"
                borderRadius="999px"
                align="center"
                justify="center"
                bg={toneStyle.badgeBg}
              >
                <Text fontSize="16px" lineHeight="1">
                  {item.badge}
                </Text>
              </Flex>
              <Text color={toneStyle.title} fontSize="15px" fontWeight="800" lineHeight="1.2">
                {item.title}
              </Text>
            </Flex>
            <Text color={toneStyle.body} fontSize="12px" fontWeight="700" lineHeight="1.45">
              {item.description}
            </Text>
          </Flex>
        );
      })}
    </Flex>
  );
}
