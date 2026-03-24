"use client";

import { useEffect, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { PlayerStatusBar } from "@/components/game/PlayerStatusBar";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import { EventDialogPanel, EVENT_DIALOG_HEIGHT } from "@/components/game/events/EventDialogPanel";
import { useBackgroundShake } from "@/components/game/events/useBackgroundShake";
import { EventBackgroundFxLayer } from "@/components/game/events/EventBackgroundFxLayer";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { DialogQuickActions } from "@/components/game/events/DialogQuickActions";
import { EventHistoryOverlay } from "@/components/game/events/EventHistoryOverlay";
import {
  getTypingAdvance,
  loadDialogTypingMode,
} from "@/lib/game/dialogTyping";

type StreetNoChoiceEventModalProps = {
  onFinish: () => void;
  savings: number;
  actionPower: number;
  fatigue: number;
  line: string;
  effectText: string;
  sceneTitle?: string;
  backgroundImage?: string;
  showAvatar?: boolean;
  speakerLabel?: string | null;
  revealEffectAfterTyping?: boolean;
};

const effectFloatIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

export function StreetNoChoiceEventModal({
  onFinish,
  savings,
  actionPower,
  fatigue,
  line,
  effectText,
  sceneTitle = "街道",
  backgroundImage = "/images/street.jpg",
  showAvatar = true,
  speakerLabel = "旁白",
  revealEffectAfterTyping = false,
}: StreetNoChoiceEventModalProps) {
  const typingMode = loadDialogTypingMode();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const {
    animation: backgroundShakeAnimation,
    effectNonce,
    activeEffectId,
  } = useBackgroundShake();
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const effectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isEffectVisible, setIsEffectVisible] = useState(!revealEffectAfterTyping);

  const isTypingComplete = displayText === line;

  useEffect(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (!line) {
      setDisplayText("");
      return;
    }

    let cursor = 0;
    setDisplayText("");
    const tick = () => {
      const previousChar = cursor > 0 ? line[cursor - 1] : "";
      const { step, delay } = getTypingAdvance(typingMode, previousChar);
      cursor = Math.min(line.length, cursor + step);
      setDisplayText(line.slice(0, cursor));
      if (cursor < line.length) {
        typingTimerRef.current = setTimeout(tick, delay);
      }
    };
    typingTimerRef.current = setTimeout(tick, 90);

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [line, typingMode]);

  useEffect(() => {
    if (effectTimerRef.current) clearTimeout(effectTimerRef.current);
    if (!revealEffectAfterTyping) {
      setIsEffectVisible(true);
      return;
    }
    if (!isTypingComplete) {
      setIsEffectVisible(false);
      return;
    }
    effectTimerRef.current = setTimeout(() => {
      setIsEffectVisible(true);
    }, 220);
    return () => {
      if (effectTimerRef.current) clearTimeout(effectTimerRef.current);
    };
  }, [isTypingComplete, revealEffectAfterTyping, line]);

  const handleContinue = () => {
    if (!isTypingComplete) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setDisplayText(line);
      return;
    }
    onFinish();
  };

  return (
    <Flex position="absolute" inset="0" zIndex={50} direction="column" bgColor="#EDE7DE">
      <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />

      <Flex
        key={`street-single-bg-${effectNonce}`}
        flex="1"
        bgImage={`url('${backgroundImage}')`}
        bgSize="cover"
        backgroundPosition="center"
        bgRepeat="no-repeat"
        position="relative"
        justifyContent="center"
        alignItems="flex-start"
        pt="18px"
        animation={backgroundShakeAnimation}
      >
        <EventBackgroundFxLayer effectId={activeEffectId} effectNonce={effectNonce} />
        <Text color="#F5EFE5" fontSize="12px" textShadow="0 2px 6px rgba(0,0,0,0.45)">
          {sceneTitle}
        </Text>
      </Flex>

      {showAvatar ? (
        <Flex
          position="absolute"
          left="14px"
          bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
          transform="none"
          zIndex={4}
          pointerEvents="none"
        >
          <EventAvatarSprite />
        </Flex>
      ) : null}

      <DialogQuickActions
        onOpenOptions={() => {}}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      <EventDialogPanel>
        {speakerLabel ? (
          <Text color="white" fontWeight="700">
            {speakerLabel}
          </Text>
        ) : null}
        <Flex flex="1" minH="0" direction="column">
          <Text color="white" fontSize="16px" lineHeight="1.5">
            {displayText}
          </Text>
          {isEffectVisible ? (
            <Text
              color="#F9E17D"
              fontSize="14px"
              fontWeight="700"
              mt="8px"
              animation={`${effectFloatIn} 260ms ease-out`}
            >
              {effectText}
            </Text>
          ) : null}
        </Flex>
        <EventContinueAction enabled={isTypingComplete} onClick={handleContinue} />
      </EventDialogPanel>

      <EventHistoryOverlay
        title="事件回顧"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        lines={[{ id: "line-1", speaker: speakerLabel ?? "事件", text: line }]}
      />
    </Flex>
  );
}
