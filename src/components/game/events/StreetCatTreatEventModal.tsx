"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { STREET_CAT_TREAT_EVENT_COPY } from "@/lib/game/events";
import { PlayerStatusBar } from "@/components/game/PlayerStatusBar";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import {
  EventDialogPanel,
  EVENT_DIALOG_HEIGHT,
} from "@/components/game/events/EventDialogPanel";
import { useBackgroundShake } from "@/components/game/events/useBackgroundShake";
import { EventBackgroundFxLayer } from "@/components/game/events/EventBackgroundFxLayer";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { DialogQuickActions } from "@/components/game/events/DialogQuickActions";
import { EventHistoryOverlay } from "@/components/game/events/EventHistoryOverlay";
import {
  loadDialogTypingMode,
  saveDialogTypingMode,
  type DialogTypingMode,
} from "@/lib/game/dialogTyping";

type StreetCatTreatStep = "line-1" | "line-2" | "line-3" | "line-4" | "result";

type StreetCatTreatEventModalProps = {
  onFinish: () => void;
  savings: number;
  actionPower: number;
  fatigue: number;
};

export function StreetCatTreatEventModal({
  onFinish,
  savings,
  actionPower,
  fatigue,
}: StreetCatTreatEventModalProps) {
  const {
    animation: backgroundShakeAnimation,
    effectNonce,
    activeEffectId,
  } = useBackgroundShake();
  const [step, setStep] = useState<StreetCatTreatStep>("line-1");
  const [typingMode, setTypingMode] = useState<DialogTypingMode>(() => loadDialogTypingMode());
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sourceText = useMemo(() => {
    if (step === "line-1") return STREET_CAT_TREAT_EVENT_COPY.line1;
    if (step === "line-2") return STREET_CAT_TREAT_EVENT_COPY.line2;
    if (step === "line-3") return STREET_CAT_TREAT_EVENT_COPY.line3;
    if (step === "line-4") return STREET_CAT_TREAT_EVENT_COPY.line4;
    return STREET_CAT_TREAT_EVENT_COPY.result;
  }, [step]);
  const isTypingComplete = !sourceText || displayText === sourceText;
  const historyLines = useMemo(() => {
    const lines: Array<{ id: string; speaker: string; text: string }> = [];
    lines.push({ id: "line-1", speaker: "旁白", text: STREET_CAT_TREAT_EVENT_COPY.line1 });
    if (step !== "line-1") {
      lines.push({ id: "line-2", speaker: "旁白", text: STREET_CAT_TREAT_EVENT_COPY.line2 });
    }
    if (step === "line-3" || step === "line-4" || step === "result") {
      lines.push({ id: "line-3", speaker: "旁白", text: STREET_CAT_TREAT_EVENT_COPY.line3 });
    }
    if (step === "line-4" || step === "result") {
      lines.push({ id: "line-4", speaker: "路人", text: STREET_CAT_TREAT_EVENT_COPY.line4 });
    }
    if (step === "result") {
      lines.push({ id: "result", speaker: "旁白", text: STREET_CAT_TREAT_EVENT_COPY.result });
    }
    return lines;
  }, [step]);

  useEffect(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    let cursor = 0;
    setDisplayText("");

    const tick = () => {
      if (typingMode === "double-char") {
        cursor = Math.min(sourceText.length, cursor + 2);
        setDisplayText(sourceText.slice(0, cursor));
        if (cursor < sourceText.length) {
          typingTimerRef.current = setTimeout(tick, 32);
        }
        return;
      }

      cursor = Math.min(sourceText.length, cursor + 1);
      setDisplayText(sourceText.slice(0, cursor));
      if (cursor < sourceText.length) {
        const currentChar = sourceText[cursor - 1];
        let delay = typingMode === "pause" ? 170 : 34;
        if (typingMode === "punctuated" || typingMode === "pause") {
          if (/[。！？!?]/.test(currentChar)) delay = 280;
          else if (/[，、,]/.test(currentChar)) delay = 160;
          if (typingMode === "pause") {
            if (/[。！？!?]/.test(currentChar)) delay = 420;
            else if (/[，、,]/.test(currentChar)) delay = 260;
          }
        }
        typingTimerRef.current = setTimeout(tick, delay);
      }
    };

    typingTimerRef.current = setTimeout(tick, 90);

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [sourceText, typingMode]);

  const handleContinue = () => {
    if (sourceText && displayText !== sourceText) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setDisplayText(sourceText);
      return;
    }
    if (step === "line-1") {
      setStep("line-2");
      return;
    }
    if (step === "line-2") {
      setStep("line-3");
      return;
    }
    if (step === "line-3") {
      setStep("line-4");
      return;
    }
    if (step === "line-4") {
      setStep("result");
      return;
    }
    onFinish();
  };

  return (
    <Flex position="absolute" inset="0" zIndex={50} direction="column" bgColor="#EDE7DE">
      <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />

      <Flex
        key={`street-cat-treat-bg-${effectNonce}`}
        flex="1"
        bgImage="url('/images/street.jpg')"
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
          {STREET_CAT_TREAT_EVENT_COPY.sceneTitle}
        </Text>
      </Flex>

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

      <DialogQuickActions
        onOpenOptions={() => {}}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      <EventDialogPanel>
        <Text color="white" fontWeight="700">
          {step === "line-4" ? "路人" : "旁白"}
        </Text>
        <Flex gap="6px" position="absolute" top="12px" right="12px">
          {([
            { key: "char", label: "逐字" },
            { key: "double-char", label: "雙字" },
            { key: "punctuated", label: "標點" },
            { key: "pause", label: "停頓" },
          ] as Array<{ key: DialogTypingMode; label: string }>).map((mode) => (
            <Flex
              key={mode.key}
              px="8px"
              h="24px"
              borderRadius="999px"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              bgColor={typingMode === mode.key ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.1)"}
              onClick={() => {
                setTypingMode(mode.key);
                saveDialogTypingMode(mode.key);
              }}
            >
              <Text color="white" fontSize="11px">
                {mode.label}
              </Text>
            </Flex>
          ))}
        </Flex>
        <Flex flex="1" minH="0" direction="column">
          <Text
            color="white"
            fontSize={typingMode === "pause" ? "18px" : "16px"}
            lineHeight={typingMode === "pause" ? "1.8" : "1.5"}
            letterSpacing={typingMode === "pause" ? "0.08em" : "normal"}
            fontWeight={typingMode === "pause" ? "700" : "400"}
          >
            {displayText}
          </Text>
          {step === "result" ? (
            <Text color="#F9E17D" fontSize="14px" fontWeight="700" mt="8px">
              {STREET_CAT_TREAT_EVENT_COPY.effect}
            </Text>
          ) : null}
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
