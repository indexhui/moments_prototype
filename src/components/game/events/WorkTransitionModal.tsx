"use client";

import { useEffect, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { StoryDialogPanel } from "@/components/game/StoryDialogPanel";
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
const WORK_DUSK_FRAMES = [
  "/images/work/Office_Work_Dusk_Focus_01.png",
  "/images/work/Office_Work_Dusk_Focus_02.png",
  "/images/work/Office_Work_Dusk_Focus_03.png",
] as const;
const WORK_PRELUDE_FRAMES = [
  "/images/work/Office_Work_Day_Look.png",
  "/images/work/Office_Work_Day_Empty.png",
  "/images/work/Office_Work_Day_Focus_01.png",
] as const;
const WORK_TRANSITION_DURATION_MS = 1800;
const WORK_PRELUDE_DURATION_MS = 2000;
const WORK_DUSK_DURATION_MS = 3000;
const FRAME_CROSSFADE_MS = 320;
const STICKY_PRELUDE_DIALOGUE =
  "今天要來把昨天的會議便利貼整理一下，順序好像是這樣子的....";

type WorkTransitionVariant = "plain" | "sticky-prelude" | "dusk-plain";

export function WorkTransitionModal({
  onFinish,
  variant = "plain",
}: {
  onFinish: () => void;
  variant?: WorkTransitionVariant;
}) {
  const [isImageVisible, setIsImageVisible] = useState(false);
  const [workFrameIndex, setWorkFrameIndex] = useState(0);
  const [previousFrameIndex, setPreviousFrameIndex] = useState<number | null>(null);
  const [isFrameCrossfading, setIsFrameCrossfading] = useState(false);
  const [isPreludeDialogueVisible, setIsPreludeDialogueVisible] = useState(false);
  const isStickyPrelude = variant === "sticky-prelude";
  const isDuskPlain = variant === "dusk-plain";
  const frames = isStickyPrelude
    ? WORK_PRELUDE_FRAMES
    : isDuskPlain
      ? WORK_DUSK_FRAMES
      : WORK_DAY_FRAMES;
  const durationMs = isStickyPrelude
    ? WORK_PRELUDE_DURATION_MS
    : isDuskPlain
      ? WORK_DUSK_DURATION_MS
      : WORK_TRANSITION_DURATION_MS;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    const fadeInTimer = setTimeout(() => {
      setIsImageVisible(true);
    }, 80);
    timers.push(fadeInTimer);

    if (isStickyPrelude) {
      const dialogueTimer = setTimeout(() => {
        setIsPreludeDialogueVisible(true);
      }, durationMs);
      timers.push(dialogueTimer);
    } else {
      const finishTimer = setTimeout(() => {
        onFinish();
      }, durationMs);
      timers.push(finishTimer);
    }

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [durationMs, isStickyPrelude, onFinish]);

  useEffect(() => {
    setIsPreludeDialogueVisible(false);
  }, [variant]);

  useEffect(() => {
    if (isStickyPrelude && isPreludeDialogueVisible) return;
    const frameTimer = window.setInterval(() => {
      setWorkFrameIndex((prev) => {
        const nextIndex = (prev + 1) % frames.length;
        setPreviousFrameIndex(prev);
        setIsFrameCrossfading(true);
        return nextIndex;
      });
    }, isStickyPrelude ? 820 : 320);
    return () => window.clearInterval(frameTimer);
  }, [frames.length, isPreludeDialogueVisible, isStickyPrelude]);

  useEffect(() => {
    if (!isFrameCrossfading) return;
    const timer = window.setTimeout(() => {
      setIsFrameCrossfading(false);
      setPreviousFrameIndex(null);
    }, FRAME_CROSSFADE_MS);
    return () => window.clearTimeout(timer);
  }, [isFrameCrossfading]);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={55}
      direction="column"
      overflow="hidden"
      justifyContent="center"
      alignItems="center"
    >
      <Box position="absolute" inset="0">
        {previousFrameIndex !== null ? (
          <img
            src={frames[previousFrameIndex]}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              opacity: isFrameCrossfading ? 1 : 0,
              transition: `opacity ${FRAME_CROSSFADE_MS}ms ease`,
            }}
          />
        ) : null}
        <img
          src={frames[workFrameIndex]}
          alt="上班背景動畫"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            opacity: isImageVisible ? 1 : 0,
            transition: `opacity ${FRAME_CROSSFADE_MS}ms ease`,
          }}
        />
      </Box>
      {isStickyPrelude ? (
        <Flex position="relative" zIndex={1} w="100%" h="100%" direction="column">
          {isPreludeDialogueVisible ? (
            <StoryDialogPanel
              characterName="小麥"
              dialogue={STICKY_PRELUDE_DIALOGUE}
              onContinue={onFinish}
              showAvatarSprite
              avatarSpriteId="mai"
              avatarFrameIndex={0}
            />
          ) : (
            <Text
              mt="auto"
              mb="40px"
              color="white"
              fontSize="18px"
              fontWeight="800"
              textShadow="0 2px 8px rgba(0,0,0,0.35)"
              textAlign="center"
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
          )}
        </Flex>
      ) : (
        <Text
          mt="2px"
          color="white"
          fontSize="18px"
          fontWeight="800"
          textShadow="0 2px 8px rgba(0,0,0,0.35)"
          position="relative"
          zIndex={1}
        >
          {(isDuskPlain ? "工作中..." : WORKING_TEXT).split("").map((char, index) => (
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
      )}
    </Flex>
  );
}
