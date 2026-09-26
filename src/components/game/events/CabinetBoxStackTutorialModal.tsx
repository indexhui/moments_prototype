"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Box, Button, Flex, Text } from "@chakra-ui/react";
import type { ExhibitionLocale } from "@/lib/game/exhibitionI18n";

export function CabinetBoxStackTutorialModal({
  locale,
  canFlip,
  preview,
  onStart,
}: {
  locale: ExhibitionLocale;
  canFlip: boolean;
  preview: ReactNode;
  onStart: () => void;
}) {
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const copy = {
    zh: {
      title: canFlip ? "進階紙箱教學" : "紙箱堆疊教學",
      instruction: canFlip
        ? "把方向翻正確"
        : "疊箱子，越高越好",
      start: "開始",
    },
    ja: {
      title: canFlip ? "上級・箱積みの遊び方" : "箱積みの遊び方",
      instruction: canFlip
        ? "箱を正しい向きに直そう"
        : "箱を高く積み上げよう",
      start: "スタート",
    },
    en: {
      title: canFlip ? "Advanced Box Stacking" : "How to Stack Boxes",
      instruction: canFlip
        ? "Flip the box the right way"
        : "Stack the boxes as high as you can",
      start: "Start",
    },
  }[locale];

  useEffect(() => {
    startButtonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <Flex
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      data-box-stack-tutorial={canFlip ? "advanced" : "standard"}
      position="absolute"
      inset="0"
      zIndex={310}
      align="safe center"
      justify="center"
      overflowY="auto"
      p="24px"
      bg="rgba(42, 37, 34, 0.52)"
      touchAction="pan-y"
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          startButtonRef.current?.focus();
        }
      }}
    >
      <Flex
        w="100%"
        maxW="350px"
        flexShrink={0}
        aspectRatio="602 / 620"
        position="relative"
        overflow="hidden"
        borderRadius="24px"
        bg="#FFFDF9"
        boxShadow="0 16px 34px rgba(0,0,0,0.28)"
        containerType="inline-size"
      >
        <Text
          as="h2"
          position="absolute"
          top="11%"
          left="4%"
          right="4%"
          color="#9C775C"
          fontSize="clamp(14px, 5.32cqw, 19px)"
          fontWeight="600"
          lineHeight="1.4"
          textAlign="center"
          whiteSpace="nowrap"
        >
          {copy.instruction}
        </Text>
        <Box position="absolute" top="25.5%" left="3.65%" w="92.7%" h="53.06%">
          {preview}
        </Box>
        <Button
          ref={startButtonRef}
          type="button"
          data-tutorial-start-ready="true"
          position="absolute"
          left="4.49%"
          top="82.26%"
          w="90.86%"
          h="13.23%"
          minH="42px"
          borderRadius="999px"
          bg="#9C775C"
          color="white"
          fontSize="clamp(18px, 5.32cqw, 20px)"
          fontWeight="400"
          _hover={{ bg: "#8E6D52" }}
          _active={{ bg: "#805F48", transform: "translateY(1px)" }}
          _focusVisible={{ outline: "3px solid #B8C99C", outlineOffset: "3px" }}
          onClick={onStart}
        >
          {copy.start}
        </Button>
      </Flex>
    </Flex>
  );
}
