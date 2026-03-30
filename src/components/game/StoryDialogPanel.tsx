"use client";

import { useEffect, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import {
  EventDialogPanel,
  EVENT_DIALOG_HEIGHT,
} from "@/components/game/events/EventDialogPanel";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import {
  EventAvatarSprite,
  type AvatarSpriteId,
} from "@/components/game/events/EventAvatarSprite";
import {
  getTypingAdvance,
  type DialogTypingMode,
} from "@/lib/game/dialogTyping";
import type { AvatarMotionId } from "@/lib/game/avatarPerformance";

type StoryDialogPanelProps = {
  characterName: string;
  dialogue: string;
  nextSceneId?: string;
  onRequestNextScene?: (nextSceneId: string) => void;
  showAvatarSprite?: boolean;
  showCharacterName?: boolean;
  avatarFrameIndex?: number;
  avatarSpriteId?: AvatarSpriteId;
  avatarMotionId?: AvatarMotionId;
  avatarMotionLoop?: boolean;
  avatarTransform?: string;
  avatarOpacity?: number;
  avatarTransition?: string;
  showContinueAction?: boolean;
  onTypingComplete?: () => void;
  typingMode?: DialogTypingMode;
};

export function StoryDialogPanel({
  characterName,
  dialogue,
  nextSceneId,
  onRequestNextScene,
  showAvatarSprite = false,
  showCharacterName = true,
  avatarFrameIndex,
  avatarSpriteId = "mai",
  avatarMotionId,
  avatarMotionLoop = false,
  avatarTransform,
  avatarOpacity = 1,
  avatarTransition,
  showContinueAction = true,
  onTypingComplete,
  typingMode = "double-char",
}: StoryDialogPanelProps) {
  const router = useRouter();
  const [displayText, setDisplayText] = useState("");
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingDoneNotifiedRef = useRef(false);
  const isTypingComplete = displayText === dialogue;

  useEffect(() => {
    if (!nextSceneId) return;
    router.prefetch(ROUTES.gameScene(nextSceneId));
  }, [nextSceneId, router]);

  useEffect(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingDoneNotifiedRef.current = false;
    let cursor = 0;
    setDisplayText("");

    const tick = () => {
      const previousChar = cursor > 0 ? dialogue[cursor - 1] : "";
      const { step, delay } = getTypingAdvance(typingMode, previousChar);
      cursor = Math.min(dialogue.length, cursor + step);
      setDisplayText(dialogue.slice(0, cursor));
      if (cursor < dialogue.length) {
        typingTimerRef.current = setTimeout(tick, delay);
      }
    };

    typingTimerRef.current = setTimeout(tick, 90);

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [dialogue, typingMode]);

  useEffect(() => {
    if (!isTypingComplete || typingDoneNotifiedRef.current) return;
    typingDoneNotifiedRef.current = true;
    onTypingComplete?.();
  }, [isTypingComplete, onTypingComplete]);

  const handleContinue = () => {
    if (!isTypingComplete) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setDisplayText(dialogue);
      return;
    }
    if (nextSceneId) {
      if (onRequestNextScene) {
        onRequestNextScene(nextSceneId);
        return;
      }
      router.push(ROUTES.gameScene(nextSceneId));
    }
  };

  return (
    <Flex mt="auto" w="100%" position="relative">
      {showAvatarSprite ? (
        <Flex
          position="absolute"
          left="14px"
          bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
          zIndex={6}
          pointerEvents="none"
          transform={avatarTransform}
          opacity={avatarOpacity}
          transition={avatarTransition}
        >
          <EventAvatarSprite
            frameIndex={avatarFrameIndex}
            spriteId={avatarSpriteId}
            motionId={avatarMotionId}
            motionLoop={avatarMotionLoop}
          />
        </Flex>
      ) : null}
      <EventDialogPanel w="100%">
        {showCharacterName ? (
          <Text color="white" fontWeight="700">
            {characterName}
          </Text>
        ) : null}
        <Flex flex="1" minH="0" direction="column" justifyContent="center">
          <Text color="white" fontSize="16px" lineHeight="1.5">
            {displayText}
          </Text>
        </Flex>
        {nextSceneId && showContinueAction ? <EventContinueAction onClick={handleContinue} /> : null}
      </EventDialogPanel>
    </Flex>
  );
}
