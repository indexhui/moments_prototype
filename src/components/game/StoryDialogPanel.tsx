"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import {
  EventDialogPanel,
  EVENT_DIALOG_ACTION_HEIGHT,
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
import {
  getNarrativeContinueDelayMs,
  type NarrativeModeSettings,
} from "@/lib/game/narrativeMode";

const innerThoughtToneBlockFadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const STORY_DIALOG_SCREEN_CONTINUE_TRIGGER = "moment:story-dialog-screen-continue";

type StoryDialogPanelProps = {
  characterName: string;
  dialogue: string;
  dialogueItalicPrefix?: string;
  nextSceneId?: string;
  onContinue?: () => void;
  onRequestNextScene?: (nextSceneId: string) => void;
  showAvatarSprite?: boolean;
  showCharacterName?: boolean;
  avatarFrameIndex?: number;
  avatarSpriteId?: AvatarSpriteId;
  avatarMotionId?: AvatarMotionId;
  avatarMotionLoop?: boolean;
  avatarFlipX?: boolean;
  avatarTransform?: string;
  avatarOpacity?: number;
  avatarTransition?: string;
  panelOpacity?: number;
  panelTransition?: string;
  isInnerThought?: boolean;
  showContinueAction?: boolean;
  narrativeMode?: NarrativeModeSettings;
  onTypingComplete?: () => void;
  typingMode?: DialogTypingMode;
  dialogueFontSize?: string;
  initialTypingDelayMs?: number;
  typingPauseAfterText?: string;
  typingPauseDelayMs?: number;
  enableScreenContinue?: boolean;
  onContinueReadyChange?: (isReady: boolean) => void;
  lockAfterContinue?: boolean;
};

export function StoryDialogPanel({
  characterName,
  dialogue,
  dialogueItalicPrefix,
  nextSceneId,
  onContinue,
  onRequestNextScene,
  showAvatarSprite = false,
  showCharacterName = true,
  avatarFrameIndex,
  avatarSpriteId = "mai",
  avatarMotionId,
  avatarMotionLoop = false,
  avatarFlipX = false,
  avatarTransform,
  avatarOpacity = 1,
  avatarTransition,
  panelOpacity = 1,
  panelTransition,
  isInnerThought = false,
  showContinueAction = true,
  narrativeMode,
  onTypingComplete,
  typingMode = "double-char",
  dialogueFontSize = "16px",
  initialTypingDelayMs = 90,
  typingPauseAfterText,
  typingPauseDelayMs = 520,
  enableScreenContinue = false,
  onContinueReadyChange,
  lockAfterContinue = true,
}: StoryDialogPanelProps) {
  const router = useRouter();
  const [displayText, setDisplayText] = useState("");
  const [isContinuing, setIsContinuing] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const narrativeModeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingDoneNotifiedRef = useRef(false);
  const isTypingComplete = displayText === dialogue;
  const narrativeContinueDelayMs = getNarrativeContinueDelayMs(narrativeMode);
  const hasNarrativeContinueDelay = narrativeContinueDelayMs > 0;
  const [isNarrativeModeReady, setIsNarrativeModeReady] = useState(!hasNarrativeContinueDelay);
  const isContinueReady =
    isTypingComplete &&
    !isContinuing &&
    (!hasNarrativeContinueDelay || isNarrativeModeReady);

  useEffect(() => {
    if (!nextSceneId) return;
    router.prefetch(withTrialProfileSearch(ROUTES.gameScene(nextSceneId)));
  }, [nextSceneId, router]);

  useEffect(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingDoneNotifiedRef.current = false;
    setIsContinuing(false);
    let cursor = 0;
    setDisplayText("");

    const tick = () => {
      const previousChar = cursor > 0 ? dialogue[cursor - 1] : "";
      const { step, delay } = getTypingAdvance(typingMode, previousChar);
      const previousCursor = cursor;
      const pauseIndex =
        typingPauseAfterText && dialogue.startsWith(typingPauseAfterText)
          ? typingPauseAfterText.length
          : -1;
      const shouldStopAtPauseText =
        pauseIndex > 0 && previousCursor < pauseIndex && previousCursor + step >= pauseIndex;
      cursor = shouldStopAtPauseText
        ? pauseIndex
        : Math.min(dialogue.length, cursor + step);
      setDisplayText(dialogue.slice(0, cursor));
      if (cursor < dialogue.length) {
        typingTimerRef.current = setTimeout(
          tick,
          shouldStopAtPauseText ? typingPauseDelayMs : delay,
        );
      }
    };

    typingTimerRef.current = setTimeout(tick, initialTypingDelayMs);

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [dialogue, typingMode, initialTypingDelayMs, typingPauseAfterText, typingPauseDelayMs]);

  useEffect(() => {
    if (!isTypingComplete || typingDoneNotifiedRef.current) return;
    typingDoneNotifiedRef.current = true;
    onTypingComplete?.();
  }, [isTypingComplete, onTypingComplete]);

  useEffect(() => {
    if (narrativeModeTimerRef.current) clearTimeout(narrativeModeTimerRef.current);
    if (!hasNarrativeContinueDelay) {
      setIsNarrativeModeReady(true);
      return;
    }
    setIsNarrativeModeReady(false);
    if (!isTypingComplete) return;

    narrativeModeTimerRef.current = setTimeout(() => {
      setIsNarrativeModeReady(true);
      narrativeModeTimerRef.current = null;
    }, narrativeContinueDelayMs);

    return () => {
      if (narrativeModeTimerRef.current) clearTimeout(narrativeModeTimerRef.current);
    };
  }, [dialogue, hasNarrativeContinueDelay, narrativeContinueDelayMs, isTypingComplete]);

  const handleContinue = useCallback(() => {
    if (!isContinueReady) return;
    if (lockAfterContinue) setIsContinuing(true);
    if (onContinue) {
      onContinue();
      return;
    }
    if (nextSceneId) {
      if (onRequestNextScene) {
        onRequestNextScene(nextSceneId);
        return;
      }
      router.push(withTrialProfileSearch(ROUTES.gameScene(nextSceneId)));
    }
  }, [isContinueReady, lockAfterContinue, nextSceneId, onContinue, onRequestNextScene, router]);

  useEffect(() => {
    onContinueReadyChange?.(isContinueReady);
  }, [isContinueReady, onContinueReadyChange]);

  useEffect(() => {
    if (!enableScreenContinue) return;

    const handleScreenContinue = () => {
      handleContinue();
    };

    window.addEventListener(STORY_DIALOG_SCREEN_CONTINUE_TRIGGER, handleScreenContinue);
    return () => {
      window.removeEventListener(STORY_DIALOG_SCREEN_CONTINUE_TRIGGER, handleScreenContinue);
    };
  }, [enableScreenContinue, handleContinue]);

  const renderDialogueText = () => {
    if (!dialogueItalicPrefix || !displayText) return displayText;
    const isTypingThroughItalicPrefix =
      displayText.length <= dialogueItalicPrefix.length &&
      dialogueItalicPrefix.startsWith(displayText);
    const hasVisibleItalicPrefix = displayText.startsWith(dialogueItalicPrefix);
    if (!isTypingThroughItalicPrefix && !hasVisibleItalicPrefix) return displayText;

    const italicLength = Math.min(displayText.length, dialogueItalicPrefix.length);
    const visibleItalicText = displayText.slice(0, italicLength);
    const restText = displayText.slice(italicLength);

    return (
      <>
        <span style={{ fontStyle: "italic" }}>{visibleItalicText}</span>
        {restText}
      </>
    );
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
            flipX={avatarFlipX}
          />
        </Flex>
      ) : null}
      <EventDialogPanel
        w="100%"
        opacity={panelOpacity}
        transition={panelTransition}
        bgColor="#8E6D52"
      >
        {isInnerThought ? (
          <Flex
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom={EVENT_DIALOG_ACTION_HEIGHT}
            bgImage="linear-gradient(180deg, rgba(105, 75, 52, 0.92) 0%, rgba(155, 116, 84, 0.82) 100%)"
            pointerEvents="none"
            zIndex={1}
            animation={`${innerThoughtToneBlockFadeIn} 140ms ease-out both`}
          />
        ) : null}
        {showCharacterName ? (
          <Text color="white" fontWeight="700" position="relative" zIndex={2}>
            {characterName}
          </Text>
        ) : (
          <Text
            color="white"
            fontWeight="700"
            visibility="hidden"
            aria-hidden="true"
            position="relative"
            zIndex={2}
          >
            旁白
          </Text>
        )}
        <Flex
          flex="1"
          minH="0"
          direction="column"
          justifyContent="center"
          position="relative"
          zIndex={2}
        >
          <Text color="white" fontSize={dialogueFontSize} lineHeight="1.5">
            {renderDialogueText()}
          </Text>
        </Flex>
        {(nextSceneId || onContinue) && showContinueAction ? (
          <EventContinueAction
            onClick={handleContinue}
            enabled={isContinueReady}
          />
        ) : null}
      </EventDialogPanel>
    </Flex>
  );
}
