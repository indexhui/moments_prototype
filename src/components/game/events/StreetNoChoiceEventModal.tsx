"use client";

import { useEffect, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FaDroplet } from "react-icons/fa6";
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
  outcomeCue?: {
    label: string;
    delta: number;
  };
  onResolveOutcome?: () => void;
  comicImage?: {
    src: string;
    alt: string;
  };
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

const comicPanelIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const statusCueIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
  }
  65% {
    opacity: 1;
    transform: translateY(-2px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const statusCuePulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 rgba(249, 225, 125, 0);
  }
  50% {
    box-shadow: 0 0 18px rgba(249, 225, 125, 0.42);
  }
`;

export function StreetNoChoiceEventModal({
  onFinish,
  savings,
  actionPower,
  fatigue,
  line,
  effectText,
  outcomeCue,
  onResolveOutcome,
  comicImage,
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
  const outcomeResolvedRef = useRef(false);
  const [isEffectVisible, setIsEffectVisible] = useState(!revealEffectAfterTyping);
  const [phase, setPhase] = useState<"story" | "outcome">("story");

  const isTypingComplete = displayText === line;
  const isOutcomePhase = phase === "outcome" && Boolean(outcomeCue);

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
    if (outcomeCue && phase === "story") {
      setPhase("outcome");
      if (!outcomeResolvedRef.current) {
        outcomeResolvedRef.current = true;
        onResolveOutcome?.();
      }
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
        alignItems="center"
        pt="18px"
        px="18px"
        pb="22px"
        animation={backgroundShakeAnimation}
      >
        <EventBackgroundFxLayer effectId={activeEffectId} effectNonce={effectNonce} />
        <Text
          position="absolute"
          top="18px"
          color="#F5EFE5"
          fontSize="12px"
          textShadow="0 2px 6px rgba(0,0,0,0.45)"
        >
          {sceneTitle}
        </Text>
        {comicImage ? (
          <Flex
            w="min(88%, 330px)"
            aspectRatio="702 / 461"
            animation={`${comicPanelIn} 420ms ease-out both`}
          >
            <img
              src={comicImage.src}
              alt={comicImage.alt}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </Flex>
        ) : null}
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
        {isOutcomePhase && outcomeCue ? (
          <Flex flex="1" minH="0" alignItems="center" justifyContent="center">
            <Flex
              direction="column"
              alignItems="center"
              gap="6px"
              w="100%"
              maxW="220px"
              p="12px"
              borderRadius="10px"
              bgColor="rgba(255, 247, 225, 0.14)"
              border="1px solid rgba(255, 237, 190, 0.26)"
              animation={`${statusCueIn} 360ms ease-out both, ${statusCuePulse} 1.2s ease-in-out 360ms 2`}
            >
              <Flex alignItems="center" justifyContent="center" gap="10px">
                <Flex
                  w="34px"
                  h="34px"
                  borderRadius="999px"
                  bgColor="rgba(87, 116, 144, 0.88)"
                  border="1px solid rgba(207, 232, 255, 0.42)"
                  alignItems="center"
                  justifyContent="center"
                >
                  <FaDroplet size={18} color="#CFE8FF" />
                </Flex>
                <Flex direction="column" gap="2px">
                  <Text color="white" fontSize="15px" fontWeight="800" lineHeight="1">
                    {outcomeCue.label}
                  </Text>
                  <Text color="#F9E17D" fontSize="20px" fontWeight="900" lineHeight="1">
                    +{outcomeCue.delta}
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        ) : (
          <>
            {speakerLabel ? (
              <Text color="white" fontWeight="700">
                {speakerLabel}
              </Text>
            ) : null}
            <Flex flex="1" minH="0" direction="column">
              <Text color="white" fontSize="16px" lineHeight="1.5">
                {displayText}
              </Text>
              {isEffectVisible && !outcomeCue ? (
                <Text color="#F9E17D" fontSize="14px" fontWeight="700" mt="8px" animation={`${effectFloatIn} 260ms ease-out`}>
                  {effectText}
                </Text>
              ) : null}
            </Flex>
          </>
        )}
        <EventContinueAction
          enabled={isOutcomePhase || isTypingComplete}
          label={isOutcomePhase ? "繼續" : "點擊繼續"}
          onClick={handleContinue}
        />
      </EventDialogPanel>

      <EventHistoryOverlay
        title="事件回顧"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        lines={[
          { id: "line-1", speaker: speakerLabel ?? "事件", text: line },
          ...(outcomeCue
            ? [{ id: "outcome", speaker: outcomeCue.label, text: `+${outcomeCue.delta}` }]
            : []),
        ]}
      />
    </Flex>
  );
}
