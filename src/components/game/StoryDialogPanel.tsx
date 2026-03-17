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

type StoryDialogPanelProps = {
  characterName: string;
  dialogue: string;
  nextSceneId?: string;
  onRequestNextScene?: (nextSceneId: string) => void;
  showAvatarSprite?: boolean;
  showCharacterName?: boolean;
  avatarFrameIndex?: number;
  avatarSpriteId?: AvatarSpriteId;
  onTypingComplete?: () => void;
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
  onTypingComplete,
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
      cursor = Math.min(dialogue.length, cursor + 1);
      setDisplayText(dialogue.slice(0, cursor));
      if (cursor < dialogue.length) {
        const currentChar = dialogue[cursor - 1];
        let delay = 34;
        if (/[。！？!?]/.test(currentChar)) delay = 280;
        else if (/[，、,]/.test(currentChar)) delay = 160;
        typingTimerRef.current = setTimeout(tick, delay);
      }
    };

    typingTimerRef.current = setTimeout(tick, 90);

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [dialogue]);

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter") return;
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === "input" || tagName === "textarea") return;
      event.preventDefault();
      handleContinue();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dialogue, isTypingComplete, nextSceneId]);

  return (
    <Flex mt="auto" w="100%" position="relative">
      {showAvatarSprite ? (
        <Flex
          position="absolute"
          left="14px"
          bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
          zIndex={6}
          pointerEvents="none"
        >
          <EventAvatarSprite frameIndex={avatarFrameIndex} spriteId={avatarSpriteId} />
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
        {nextSceneId ? <EventContinueAction onClick={handleContinue} /> : null}
      </EventDialogPanel>
    </Flex>
  );
}
