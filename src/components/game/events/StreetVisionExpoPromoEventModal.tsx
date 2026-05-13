"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { STREET_VISION_EXPO_PROMO_EVENT_COPY } from "@/lib/game/events";
import {
  EventAvatarSprite,
  type AvatarSpriteId,
} from "@/components/game/events/EventAvatarSprite";
import {
  EventDialogPanel,
  EVENT_DIALOG_HEIGHT,
} from "@/components/game/events/EventDialogPanel";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { DialogQuickActions } from "@/components/game/events/DialogQuickActions";
import { EventHistoryOverlay } from "@/components/game/events/EventHistoryOverlay";
import { getTypingAdvance, loadDialogTypingMode } from "@/lib/game/dialogTyping";

type StreetVisionExpoPromoEventModalProps = {
  onFinish: () => void;
  savings: number;
  actionPower: number;
  fatigue: number;
};

const comicFadeIn = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

const softGlow = keyframes`
  0%, 100% {
    filter: drop-shadow(0 14px 22px rgba(50, 34, 22, 0.22));
  }
  50% {
    filter: drop-shadow(0 18px 28px rgba(50, 34, 22, 0.3));
  }
`;

const beigoSlideUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(44px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

export function StreetVisionExpoPromoEventModal({
  onFinish,
}: StreetVisionExpoPromoEventModalProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [thinkingFrameIndex, setThinkingFrameIndex] = useState(36);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thinkingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const typingMode = loadDialogTypingMode();
  const lines = STREET_VISION_EXPO_PROMO_EVENT_COPY.lines;
  const line = lines[lineIndex];
  const sourceText = line.text;
  const isTypingComplete = displayText === sourceText;
  const hasThoughtSwitch = "thoughtSwitch" in line && line.thoughtSwitch;
  const activeComicImageId = lines
    .slice(0, lineIndex + 1)
    .findLast((item) => "comicImageId" in item)
    ?.comicImageId;
  const activeComicImage = activeComicImageId
    ? STREET_VISION_EXPO_PROMO_EVENT_COPY.comicImages[activeComicImageId]
    : null;
  const avatarFrameIndex = hasThoughtSwitch ? thinkingFrameIndex : line.avatarFrameIndex;
  const avatarSpriteId = line.avatarSpriteId as AvatarSpriteId;

  const historyLines = useMemo(
    () =>
      lines.slice(0, lineIndex + 1).map((item, index) => ({
        id: `vision-promo-${index}`,
        speaker: item.speaker,
        text: item.text,
      })),
    [lineIndex, lines],
  );

  useEffect(() => {
    if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
    if (!hasThoughtSwitch) {
      setThinkingFrameIndex(36);
      return;
    }
    thinkingTimerRef.current = setInterval(() => {
      setThinkingFrameIndex((current) => (current === 36 ? 37 : 36));
    }, 520);
    return () => {
      if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
    };
  }, [hasThoughtSwitch]);

  useEffect(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    let cursor = 0;
    setDisplayText("");
    const tick = () => {
      const previousChar = cursor > 0 ? sourceText[cursor - 1] : "";
      const { step, delay } = getTypingAdvance(typingMode, previousChar);
      cursor = Math.min(sourceText.length, cursor + step);
      setDisplayText(sourceText.slice(0, cursor));
      if (cursor < sourceText.length) {
        typingTimerRef.current = setTimeout(tick, delay);
      }
    };
    typingTimerRef.current = setTimeout(tick, 90);
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [sourceText, typingMode]);

  const handleContinue = () => {
    if (!isTypingComplete) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setDisplayText(sourceText);
      return;
    }
    if (lineIndex < lines.length - 1) {
      setLineIndex((current) => current + 1);
      return;
    }
    onFinish();
  };

  return (
    <Flex position="absolute" inset="0" zIndex={50} direction="column" bgColor="#EDE7DE">
      <Flex
        flex="1"
        bgImage="url('/images/428出圖/背景/家門口巷弄_白天.jpg')"
        bgSize="cover"
        backgroundPosition="center"
        bgRepeat="no-repeat"
        position="relative"
        justifyContent="center"
        alignItems="flex-start"
        pt="18px"
        overflow="hidden"
      >
        <Text
          position="relative"
          color="#F5EFE5"
          fontSize="12px"
          textShadow="0 2px 6px rgba(0,0,0,0.45)"
        >
          {STREET_VISION_EXPO_PROMO_EVENT_COPY.sceneTitle}
        </Text>

        {activeComicImage ? (
          <Flex
            key={activeComicImageId}
            position="absolute"
            top="142px"
            left="50%"
            zIndex={8}
            w="80%"
            maxW="290px"
            maxH={`calc(100% - ${EVENT_DIALOG_HEIGHT} - 152px)`}
            align="center"
            justify="center"
            pointerEvents="none"
            transform="translateX(-50%)"
            animation={`${comicFadeIn} 420ms ease-out both, ${softGlow} 2.4s ease-in-out 420ms infinite`}
            transformOrigin="50% 80%"
          >
            <Image
              src={activeComicImage.src}
              alt={activeComicImage.alt}
              w="100%"
              h="auto"
              objectFit="contain"
            />
          </Flex>
        ) : null}
      </Flex>

      <Flex
        key={`${avatarSpriteId}-${lineIndex}`}
        position="absolute"
        left={avatarSpriteId === "beigo" ? "36px" : "14px"}
        bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
        zIndex={4}
        pointerEvents="none"
        animation={avatarSpriteId === "beigo" ? `${beigoSlideUp} 360ms ease-out both` : undefined}
      >
        <EventAvatarSprite
          spriteId={avatarSpriteId}
          frameIndex={avatarFrameIndex}
          motionId={lineIndex === 0 ? "slide-in-left" : undefined}
        />
      </Flex>

      <DialogQuickActions
        onOpenOptions={() => {}}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      <EventDialogPanel>
        <Text color="white" fontWeight="700">
          {line.speaker}
        </Text>
        <Text color="white" fontSize="19px" lineHeight="1.45">
          {displayText}
        </Text>
        <EventContinueAction enabled={isTypingComplete} onClick={handleContinue} />
      </EventDialogPanel>

      <EventHistoryOverlay
        title="事件回顧"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        lines={historyLines}
      />
    </Flex>
  );
}
