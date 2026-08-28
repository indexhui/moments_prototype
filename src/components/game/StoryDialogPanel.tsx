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
import { playFmodGameEvent } from "@/lib/game/fmodWeb";
import { EXHIBITION_UI_COPY } from "@/lib/game/exhibitionI18n";
import { useExhibitionLocale } from "@/components/game/ExhibitionLocaleContext";
import { renderDialogueSemanticText } from "@/components/game/DialogueSemanticText";

const innerThoughtToneBlockFadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const cinematicCaptionFadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const cinematicContinueBreathe = keyframes`
  0%, 100% { opacity: 0.56; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(3px); }
`;

export const STORY_DIALOG_SCREEN_CONTINUE_TRIGGER = "moment:story-dialog-screen-continue";

type StoryDialogPanelProps = {
  presentation?: "standard" | "cinematic-opening";
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
  presentation = "standard",
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
  const locale = useExhibitionLocale();
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
      playFmodGameEvent("dialogueClick");
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

  if (presentation === "cinematic-opening") {
    const captionEnterDelayMs = Math.max(0, initialTypingDelayMs - 180);

    return (
      <Flex
        data-game-interface-ui="true"
        position="absolute"
        inset="0"
        zIndex={10}
        direction="column"
        justifyContent="flex-end"
        pointerEvents="none"
        bgImage="linear-gradient(180deg, transparent 48%, rgba(26, 34, 35, 0.04) 60%, rgba(20, 28, 28, 0.54) 100%)"
        animation={`${cinematicCaptionFadeIn} 760ms cubic-bezier(0.22, 0.72, 0.2, 1) ${captionEnterDelayMs}ms both`}
      >
        <Flex
          minH="194px"
          w="100%"
          px="30px"
          pb="32px"
          direction="column"
          alignItems="center"
          justifyContent="flex-end"
          textAlign="center"
        >
          <Flex alignItems="center" justifyContent="center" gap="11px" w="100%">
            <Flex w="28px" h="1px" bgColor="rgba(255,255,255,0.58)" />
            <Text
              minH="32px"
              color="rgba(255,255,255,0.98)"
              fontSize="20px"
              fontWeight="600"
              lineHeight="1.6"
              letterSpacing="0.13em"
              textShadow="0 2px 12px rgba(15, 22, 23, 0.9), 0 1px 2px rgba(15, 22, 23, 0.9)"
            >
              {renderDialogueSemanticText(displayText, locale)}
            </Text>
            <Flex w="28px" h="1px" bgColor="rgba(255,255,255,0.58)" />
          </Flex>

          <Flex
            as="button"
            mt="22px"
            minH="34px"
            px="15px"
            border="0"
            borderRadius="999px"
            bgColor="rgba(15, 23, 24, 0.24)"
            color="rgba(255,255,255,0.9)"
            alignItems="center"
            justifyContent="center"
            gap="7px"
            pointerEvents={isContinueReady ? "auto" : "none"}
            opacity={isContinueReady ? 1 : 0}
            cursor={isContinueReady ? "pointer" : "default"}
            transition="opacity 420ms ease"
            aria-label={EXHIBITION_UI_COPY.tapToContinue[locale]}
            onClick={(event) => {
              event.stopPropagation();
              playFmodGameEvent("dialogueClick");
              handleContinue();
            }}
          >
            <Text fontSize="12px" fontWeight="600" letterSpacing="0.16em">
              {EXHIBITION_UI_COPY.tapToContinue[locale]}
            </Text>
            <Text
              aria-hidden="true"
              fontSize="13px"
              lineHeight="1"
              animation={`${cinematicContinueBreathe} 1200ms ease-in-out infinite`}
            >
              ↓
            </Text>
          </Flex>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex data-game-interface-ui="true" mt="auto" w="100%" position="relative">
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
