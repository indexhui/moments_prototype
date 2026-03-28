"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { BUS_MELODY_CHICKEN_PRELUDE_EVENT_COPY } from "@/lib/game/events";
import { PlayerStatusBar } from "@/components/game/PlayerStatusBar";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import {
  EventDialogPanel,
  EVENT_DIALOG_HEIGHT,
} from "@/components/game/events/EventDialogPanel";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { DialogQuickActions } from "@/components/game/events/DialogQuickActions";
import { EventHistoryOverlay } from "@/components/game/events/EventHistoryOverlay";
import { getTypingAdvance, loadDialogTypingMode } from "@/lib/game/dialogTyping";

type PreludePhase =
  | "line-0"
  | "line-1"
  | "line-2"
  | "line-3"
  | "line-4"
  | "line-5"
  | "line-6"
  | "line-7"
  | "line-8"
  | "line-9"
  | "line-10"
  | "line-11"
  | "effect";

const PHASE_ORDER: PreludePhase[] = [
  "line-0",
  "line-1",
  "line-2",
  "line-3",
  "line-4",
  "line-5",
  "line-6",
  "line-7",
  "line-8",
  "line-9",
  "line-10",
  "line-11",
  "effect",
];

function getLine(phase: PreludePhase) {
  if (!phase.startsWith("line-")) return null;
  const index = Number(phase.replace("line-", ""));
  if (!Number.isFinite(index)) return null;
  return BUS_MELODY_CHICKEN_PRELUDE_EVENT_COPY.lines[index] ?? null;
}

type BusMelodyChickenPreludeEventModalProps = {
  onFinish: () => void;
  savings: number;
  actionPower: number;
  fatigue: number;
};

export function BusMelodyChickenPreludeEventModal({
  onFinish,
  savings,
  actionPower,
  fatigue,
}: BusMelodyChickenPreludeEventModalProps) {
  const [phase, setPhase] = useState<PreludePhase>("line-0");
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingMode = loadDialogTypingMode();
  const line = getLine(phase);
  const sourceText = phase === "effect" ? BUS_MELODY_CHICKEN_PRELUDE_EVENT_COPY.effect : (line?.text ?? "");
  const isTypingComplete = displayText === sourceText;
  const isEffectPhase = phase === "effect";

  useEffect(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (!sourceText) {
      setDisplayText("");
      return;
    }

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

  const historyLines = useMemo(() => {
    const lines: Array<{ id: string; speaker: string; text: string }> = [];
    PHASE_ORDER.forEach((item) => {
      if (item === "effect") {
        if (PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf("effect")) {
          lines.push({
            id: "effect",
            speaker: "獲得",
            text: BUS_MELODY_CHICKEN_PRELUDE_EVENT_COPY.effect,
          });
        }
        return;
      }
      const itemLine = getLine(item);
      if (!itemLine) return;
      if (PHASE_ORDER.indexOf(item) <= PHASE_ORDER.indexOf(phase)) {
        lines.push({
          id: item,
          speaker: itemLine.speaker,
          text: itemLine.text,
        });
      }
    });
    return lines;
  }, [phase]);

  const handleContinue = () => {
    if (sourceText && displayText !== sourceText) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setDisplayText(sourceText);
      return;
    }

    if (phase === "effect") {
      onFinish();
      return;
    }

    const currentIndex = PHASE_ORDER.indexOf(phase);
    if (currentIndex < PHASE_ORDER.length - 1) {
      setPhase(PHASE_ORDER[currentIndex + 1]);
    }
  };

  const shouldShowAvatar = line?.speaker === "小麥";

  return (
    <Flex position="absolute" inset="0" zIndex={50} direction="column" bgColor="#EDE7DE">
      <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />

      <Flex
        flex="1"
        bgImage="url('/images/outside/bus.jpg')"
        bgSize="cover"
        backgroundPosition="center"
        bgRepeat="no-repeat"
        position="relative"
        justifyContent="center"
        alignItems="flex-start"
        pt="18px"
      >
        <Text color="#F5EFE5" fontSize="12px" textShadow="0 2px 6px rgba(0,0,0,0.45)">
          {BUS_MELODY_CHICKEN_PRELUDE_EVENT_COPY.sceneTitle}
        </Text>
      </Flex>

      <Flex
        position="absolute"
        left="14px"
        bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
        transform="none"
        zIndex={4}
        pointerEvents="none"
        opacity={shouldShowAvatar ? 1 : 0}
      >
        <EventAvatarSprite spriteId="mai" frameIndex={0} />
      </Flex>

      <DialogQuickActions onOpenOptions={() => {}} onOpenHistory={() => setIsHistoryOpen(true)} />

      <EventDialogPanel>
        <Text color={isEffectPhase ? "#F9E17D" : "white"} fontWeight="700">
          {isEffectPhase ? "獲得" : (line?.speaker ?? "旁白")}
        </Text>
        <Flex flex="1" minH="0" direction="column">
          <Text
            color={isEffectPhase ? "#F9E17D" : "white"}
            fontSize={isEffectPhase ? "18px" : "16px"}
            fontWeight={isEffectPhase ? "700" : "400"}
            lineHeight="1.6"
          >
            {displayText}
          </Text>
        </Flex>
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
