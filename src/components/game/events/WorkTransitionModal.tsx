"use client";

import { useEffect, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
const waveChar = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
`;
const WORKING_TEXT = "上班中...";
const WORK_DAY_FRAMES = [
  "/images/work/Office_Work_Day_Focus_01.png",
  "/images/work/Office_Work_Day_Focus_02.png",
  "/images/work/Office_Work_Day_Focus_03.png",
] as const;
const WORK_TRANSITION_DURATION_MS = 1800;

export function WorkTransitionModal({
  onFinish,
}: {
  onFinish: () => void;
}) {
  const [isImageVisible, setIsImageVisible] = useState(false);
  const [workFrameIndex, setWorkFrameIndex] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    const fadeInTimer = setTimeout(() => {
      setIsImageVisible(true);
    }, 80);
    timers.push(fadeInTimer);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, WORK_TRANSITION_DURATION_MS);
    timers.push(finishTimer);

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [onFinish]);

  useEffect(() => {
    const frameTimer = window.setInterval(() => {
      setWorkFrameIndex((prev) => (prev + 1) % WORK_DAY_FRAMES.length);
    }, 240);
    return () => window.clearInterval(frameTimer);
  }, []);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={55}
      direction="column"
      overflow="hidden"
      justifyContent="center"
      alignItems="center"
      p="20px"
    >
      <Box position="absolute" inset="0">
        <img
          src={WORK_DAY_FRAMES[workFrameIndex]}
          alt="上班背景動畫"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </Box>
      <Text
        mt="2px"
        color="white"
        fontSize="18px"
        fontWeight="800"
        textShadow="0 2px 8px rgba(0,0,0,0.35)"
        position="relative"
        zIndex={1}
      >
        {WORKING_TEXT.split("").map((char, index) => (
          <Text
            as="span"
            key={`${char}-${index}`}
            display="inline-block"
            animation={`${waveChar} 0.9s ease-in-out ${index * 0.08}s infinite`}
          >
            {char}
          </Text>
        ))}
      </Text>
    </Flex>
  );
}
