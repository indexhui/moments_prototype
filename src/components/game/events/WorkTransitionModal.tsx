"use client";

import { useEffect, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { StoryDialogPanel } from "@/components/game/StoryDialogPanel";
import type { AvatarSpriteId } from "@/components/game/events/EventAvatarSprite";
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
const PARK_PRELUDE_FRAMES = ["/images/背景/公園.png"] as const;
const WORK_TRANSITION_DURATION_MS = 1800;
const WORK_PRELUDE_DURATION_MS = 2000;
const WORK_DUSK_DURATION_MS = 3000;
const FRAME_CROSSFADE_MS = 320;
const STICKY_PRELUDE_DIALOGUE =
  "今天要來把昨天的會議便利貼整理一下，順序好像是這樣子的....";
const STAMP_PRELUDE_DIALOGUE = "又一堆文件要跑簽核，真麻煩。";
const PDF_PRELUDE_DIALOGUE = "報表終於整理完了，接下來要匯出 PDF，拜託不要壞檔。";
const CHICKEN_PRELUDE_DIALOGUE = "咦，辦公室裡好像有什麼白白的小東西在專心工作。";
const OSTRICH_PRELUDE_DIALOGUE = "公園長椅旁有隻低著頭的鴕鳥，這樣好像拍不到牠。";
const STAMP_PRELUDE_AVATAR_FRAME_INDEX = 9;
const PDF_PRELUDE_AVATAR_FRAME_INDEX = 37;

type WorkTransitionVariant =
  | "plain"
  | "sticky-prelude"
  | "stamp-prelude"
  | "pdf-prelude"
  | "chicken-prelude"
  | "ostrich-prelude"
  | "dusk-plain";

export function WorkTransitionModal({
  onFinish,
  variant = "plain",
  preludeDialogueOverride,
  preludeCharacterNameOverride,
  preludeAvatarSpriteIdOverride,
  preludeAvatarFrameIndexOverride,
  labelOverride,
  durationMsOverride,
}: {
  onFinish: () => void;
  variant?: WorkTransitionVariant;
  preludeDialogueOverride?: string;
  preludeCharacterNameOverride?: string;
  preludeAvatarSpriteIdOverride?: AvatarSpriteId;
  preludeAvatarFrameIndexOverride?: number;
  labelOverride?: string;
  durationMsOverride?: number;
}) {
  const [isImageVisible, setIsImageVisible] = useState(false);
  const [workFrameIndex, setWorkFrameIndex] = useState(0);
  const [isPreludeDialogueVisible, setIsPreludeDialogueVisible] = useState(false);
  const isPreludeVariant =
    variant === "sticky-prelude" ||
    variant === "stamp-prelude" ||
    variant === "pdf-prelude" ||
    variant === "chicken-prelude" ||
    variant === "ostrich-prelude";
  const isDuskPlain = variant === "dusk-plain";
  const isOstrichPrelude = variant === "ostrich-prelude";
  const defaultPreludeDialogue =
    variant === "ostrich-prelude"
      ? OSTRICH_PRELUDE_DIALOGUE
      : variant === "chicken-prelude"
      ? CHICKEN_PRELUDE_DIALOGUE
      : variant === "stamp-prelude"
      ? STAMP_PRELUDE_DIALOGUE
      : variant === "pdf-prelude"
        ? PDF_PRELUDE_DIALOGUE
        : STICKY_PRELUDE_DIALOGUE;
  const preludeDialogue = preludeDialogueOverride ?? defaultPreludeDialogue;
  const defaultPreludeAvatarFrameIndex =
    variant === "chicken-prelude"
      ? 15
      : variant === "ostrich-prelude"
      ? 15
      : variant === "stamp-prelude"
      ? STAMP_PRELUDE_AVATAR_FRAME_INDEX
      : variant === "pdf-prelude"
        ? PDF_PRELUDE_AVATAR_FRAME_INDEX
        : 0;
  const preludeAvatarFrameIndex =
    preludeAvatarFrameIndexOverride ?? defaultPreludeAvatarFrameIndex;
  const preludeCharacterName = preludeCharacterNameOverride ?? "小麥";
  const preludeAvatarSpriteId = preludeAvatarSpriteIdOverride ?? "mai";
  const frames = isOstrichPrelude
    ? PARK_PRELUDE_FRAMES
    : isPreludeVariant
    ? WORK_PRELUDE_FRAMES
    : isDuskPlain
      ? WORK_DUSK_FRAMES
      : WORK_DAY_FRAMES;
  const workingText = isOstrichPrelude ? "散步中..." : WORKING_TEXT;
  const transitionText = labelOverride ?? (isDuskPlain ? "工作中..." : WORKING_TEXT);
  const durationMs =
    durationMsOverride ??
    (isPreludeVariant
      ? WORK_PRELUDE_DURATION_MS
      : isDuskPlain
        ? WORK_DUSK_DURATION_MS
        : WORK_TRANSITION_DURATION_MS);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    const fadeInTimer = setTimeout(() => {
      setIsImageVisible(true);
    }, 80);
    timers.push(fadeInTimer);

    if (isPreludeVariant) {
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
  }, [durationMs, isPreludeVariant, onFinish]);

  useEffect(() => {
    setIsPreludeDialogueVisible(false);
    setWorkFrameIndex(0);
  }, [variant]);

  useEffect(() => {
    if (isPreludeVariant && isPreludeDialogueVisible) return;
    const frameTimer = window.setInterval(() => {
      setWorkFrameIndex((prev) => (prev + 1) % frames.length);
    }, isPreludeVariant ? 820 : 320);
    return () => window.clearInterval(frameTimer);
  }, [frames.length, isPreludeDialogueVisible, isPreludeVariant]);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={55}
      direction="column"
      overflow="hidden"
      justifyContent="center"
      alignItems="center"
      bgColor={isOstrichPrelude ? "#7FB99F" : isDuskPlain ? "#2C2525" : "#1F2428"}
    >
      <Box position="absolute" inset="0">
        {isDuskPlain ? (
          <img
            src={WORK_DAY_FRAMES[0]}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : null}
        <img
          src={frames[0]}
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
        {workFrameIndex > 0 ? (
          <img
            key={`${variant}-work-frame-${workFrameIndex}`}
            src={frames[workFrameIndex]}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              opacity: isImageVisible ? 1 : 0,
              transition: "opacity 90ms linear",
            }}
          />
        ) : null}
      </Box>
      {isPreludeVariant ? (
        <Flex position="relative" zIndex={1} w="100%" h="100%" direction="column">
          {isPreludeDialogueVisible ? (
            <StoryDialogPanel
              characterName={preludeCharacterName}
              dialogue={preludeDialogue}
              onContinue={onFinish}
              showAvatarSprite
              avatarSpriteId={preludeAvatarSpriteId}
              avatarFrameIndex={preludeAvatarFrameIndex}
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
              {workingText.split("").map((char, index) => (
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
          {transitionText.split("").map((char, index) => (
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
