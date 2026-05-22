"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { MART_ONE_DOLLAR_GOAT_PRELUDE_EVENT_COPY } from "@/lib/game/events";
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

const MART_BACKGROUND_IMAGE = "/images/outside/mart.jpg";

export type MartOneDollarPreludeChoice = "stay" | "leave";

type Phase =
  | { kind: "intro"; index: number }
  | { kind: "choice" }
  | { kind: "result"; choice: MartOneDollarPreludeChoice; index: number }
  | { kind: "effect"; choice: MartOneDollarPreludeChoice }
  | { kind: "hint"; choice: MartOneDollarPreludeChoice };

type MartOneDollarGoatPreludeEventModalProps = {
  onFinish: (choice: MartOneDollarPreludeChoice) => void;
  savings: number;
  actionPower: number;
  fatigue: number;
};

function getResultLines(choice: MartOneDollarPreludeChoice) {
  return choice === "stay"
    ? MART_ONE_DOLLAR_GOAT_PRELUDE_EVENT_COPY.stayResultLines
    : MART_ONE_DOLLAR_GOAT_PRELUDE_EVENT_COPY.leaveResultLines;
}

function getEffectText(choice: MartOneDollarPreludeChoice) {
  return choice === "stay"
    ? MART_ONE_DOLLAR_GOAT_PRELUDE_EVENT_COPY.stayEffect
    : MART_ONE_DOLLAR_GOAT_PRELUDE_EVENT_COPY.leaveEffect;
}

export function MartOneDollarGoatPreludeEventModal({
  onFinish,
  savings,
  actionPower,
  fatigue,
}: MartOneDollarGoatPreludeEventModalProps) {
  const [phase, setPhase] = useState<Phase>({ kind: "intro", index: 0 });
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingMode = loadDialogTypingMode();

  const currentLine = useMemo(() => {
    if (phase.kind === "intro") return MART_ONE_DOLLAR_GOAT_PRELUDE_EVENT_COPY.introLines[phase.index] ?? null;
    if (phase.kind === "result") return getResultLines(phase.choice)[phase.index] ?? null;
    return null;
  }, [phase]);

  const sourceText = useMemo(() => {
    if (phase.kind === "intro" || phase.kind === "result") return currentLine?.text ?? "";
    if (phase.kind === "effect") return getEffectText(phase.choice);
    if (phase.kind === "hint") return MART_ONE_DOLLAR_GOAT_PRELUDE_EVENT_COPY.hint;
    return "";
  }, [currentLine, phase]);

  const isTypingComplete = phase.kind === "choice" || !sourceText || displayText === sourceText;

  useEffect(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (phase.kind === "choice" || !sourceText) {
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
  }, [sourceText, typingMode, phase.kind]);

  const historyLines = useMemo(() => {
    const items: Array<{ id: string; speaker: string; text: string }> = [];
    MART_ONE_DOLLAR_GOAT_PRELUDE_EVENT_COPY.introLines.forEach((line, index) => {
      const reached = phase.kind !== "intro" || phase.index >= index;
      if (reached) items.push({ id: `intro-${index}`, speaker: line.speaker, text: line.text });
    });
    if (phase.kind === "result" || phase.kind === "effect" || phase.kind === "hint") {
      const choice = phase.choice;
      const resultLines = getResultLines(choice);
      const reachedResultIndex = phase.kind === "result" ? phase.index : resultLines.length - 1;
      resultLines.forEach((line, index) => {
        if (index <= reachedResultIndex) {
          items.push({ id: `result-${choice}-${index}`, speaker: line.speaker, text: line.text });
        }
      });
      if (phase.kind === "effect" || phase.kind === "hint") {
        items.push({ id: `effect-${choice}`, speaker: "心情", text: getEffectText(choice) });
      }
      if (phase.kind === "hint") {
        items.push({ id: "hint", speaker: "線索", text: MART_ONE_DOLLAR_GOAT_PRELUDE_EVENT_COPY.hint });
      }
    }
    return items;
  }, [phase]);

  const completeTyping = () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setDisplayText(sourceText);
  };

  const handleContinue = () => {
    if (phase.kind === "choice") return;
    if (sourceText && displayText !== sourceText) {
      completeTyping();
      return;
    }
    if (phase.kind === "intro") {
      if (phase.index < MART_ONE_DOLLAR_GOAT_PRELUDE_EVENT_COPY.introLines.length - 1) {
        setPhase({ kind: "intro", index: phase.index + 1 });
        return;
      }
      setPhase({ kind: "choice" });
      return;
    }
    if (phase.kind === "result") {
      const resultLines = getResultLines(phase.choice);
      if (phase.index < resultLines.length - 1) {
        setPhase({ kind: "result", choice: phase.choice, index: phase.index + 1 });
        return;
      }
      setPhase({ kind: "effect", choice: phase.choice });
      return;
    }
    if (phase.kind === "effect") {
      setPhase({ kind: "hint", choice: phase.choice });
      return;
    }
    if (phase.kind === "hint") {
      onFinish(phase.choice);
    }
  };

  const handleChoose = (choice: MartOneDollarPreludeChoice) => {
    setPhase({ kind: "result", choice, index: 0 });
  };

  const speakerLabel = useMemo(() => {
    if (phase.kind === "intro" || phase.kind === "result") return currentLine?.speaker ?? "旁白";
    if (phase.kind === "effect") return "心情";
    if (phase.kind === "hint") return "線索";
    return "旁白";
  }, [currentLine, phase.kind]);

  const isAccentText = phase.kind === "effect" || phase.kind === "hint";
  const shouldShowAvatar = currentLine?.speaker === "小麥";

  return (
    <Flex position="absolute" inset="0" zIndex={50} direction="column" bgColor="#EDE7DE">
      <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />

      <Flex
        flex="1"
        bgImage={`url('${MART_BACKGROUND_IMAGE}')`}
        bgSize="cover"
        backgroundPosition="center"
        bgRepeat="no-repeat"
        position="relative"
        justifyContent="center"
        alignItems="flex-start"
        pt="18px"
      >
        <Text color="#F5EFE5" fontSize="12px" textShadow="0 2px 6px rgba(0,0,0,0.45)">
          {MART_ONE_DOLLAR_GOAT_PRELUDE_EVENT_COPY.sceneTitle}
        </Text>
      </Flex>

      <Flex
        position="absolute"
        left="14px"
        bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
        zIndex={4}
        pointerEvents="none"
        opacity={shouldShowAvatar ? 1 : 0}
      >
        <EventAvatarSprite spriteId="mai" frameIndex={0} />
      </Flex>

      <DialogQuickActions onOpenOptions={() => {}} onOpenHistory={() => setIsHistoryOpen(true)} />

      {phase.kind === "choice" ? (
        <EventDialogPanel>
          <Text color="white" fontSize="16px" fontWeight="700">
            {MART_ONE_DOLLAR_GOAT_PRELUDE_EVENT_COPY.choicePrompt}
          </Text>
          <Flex
            bgColor="rgba(255,255,255,0.1)"
            borderRadius="8px"
            p="10px"
            justifyContent="space-between"
            alignItems="center"
            cursor="pointer"
            onClick={() => handleChoose("stay")}
          >
            <Text color="white">{MART_ONE_DOLLAR_GOAT_PRELUDE_EVENT_COPY.options.stay.label}</Text>
            <Text color="#FCE9C8" fontSize="12px">
              {MART_ONE_DOLLAR_GOAT_PRELUDE_EVENT_COPY.options.stay.description}
            </Text>
          </Flex>
          <Flex
            bgColor="rgba(255,255,255,0.1)"
            borderRadius="8px"
            p="10px"
            justifyContent="space-between"
            alignItems="center"
            cursor="pointer"
            onClick={() => handleChoose("leave")}
          >
            <Text color="white">{MART_ONE_DOLLAR_GOAT_PRELUDE_EVENT_COPY.options.leave.label}</Text>
            <Text color="#FCE9C8" fontSize="12px">
              {MART_ONE_DOLLAR_GOAT_PRELUDE_EVENT_COPY.options.leave.description}
            </Text>
          </Flex>
        </EventDialogPanel>
      ) : (
        <EventDialogPanel>
          <Text color={isAccentText ? "#F9E17D" : "white"} fontWeight="700">
            {speakerLabel}
          </Text>
          <Flex flex="1" minH="0" direction="column">
            <Text
              color={isAccentText ? "#F9E17D" : "white"}
              fontSize={isAccentText ? "18px" : "16px"}
              fontWeight={isAccentText ? "700" : "400"}
              lineHeight="1.6"
            >
              {displayText}
            </Text>
          </Flex>
          <EventContinueAction enabled={isTypingComplete} onClick={handleContinue} />
        </EventDialogPanel>
      )}

      <EventHistoryOverlay
        title="事件回顧"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        lines={historyLines}
      />
    </Flex>
  );
}
