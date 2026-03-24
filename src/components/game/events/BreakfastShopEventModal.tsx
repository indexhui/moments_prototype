"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { BREAKFAST_SHOP_EVENT_COPY } from "@/lib/game/events";
import { PlayerStatusBar } from "@/components/game/PlayerStatusBar";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import { EventDialogPanel, EVENT_DIALOG_HEIGHT } from "@/components/game/events/EventDialogPanel";
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

type BreakfastStep = "line-1" | "line-2" | "choice" | "owner-chat" | "result";
type BreakfastOption = "takeout" | "dinein" | "leave";

type BreakfastShopEventModalProps = {
  onFinish: () => void;
  savings: number;
  actionPower: number;
  fatigue: number;
  onChooseOption: (option: BreakfastOption) => void;
};

export function BreakfastShopEventModal({
  onFinish,
  savings,
  actionPower,
  fatigue,
  onChooseOption,
}: BreakfastShopEventModalProps) {
  const {
    animation: backgroundShakeAnimation,
    effectNonce,
    activeEffectId,
  } = useBackgroundShake();
  const [step, setStep] = useState<BreakfastStep>("line-1");
  const [resultText, setResultText] = useState("");
  const [effectText, setEffectText] = useState("");
  const [typingMode, setTypingMode] = useState<DialogTypingMode>(() => loadDialogTypingMode());
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [hasOwnerDialogue, setHasOwnerDialogue] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sourceText = useMemo(() => {
    if (step === "line-1") return BREAKFAST_SHOP_EVENT_COPY.line1;
    if (step === "line-2") return BREAKFAST_SHOP_EVENT_COPY.line2;
    if (step === "owner-chat") return BREAKFAST_SHOP_EVENT_COPY.ownerChat;
    if (step === "result") return resultText;
    return "";
  }, [resultText, step]);
  const isTypingComplete = step === "choice" || !sourceText || displayText === sourceText;

  const historyLines = useMemo(() => {
    const lines: Array<{ id: string; speaker: string; text: string }> = [];
    lines.push({ id: "line-1", speaker: "旁白", text: BREAKFAST_SHOP_EVENT_COPY.line1 });
    if (step !== "line-1") {
      lines.push({ id: "line-2", speaker: "老闆娘", text: BREAKFAST_SHOP_EVENT_COPY.line2 });
    }
    if (hasOwnerDialogue) {
      lines.push({ id: "owner", speaker: "老闆娘", text: BREAKFAST_SHOP_EVENT_COPY.ownerChat });
    }
    if (step === "result" && resultText) {
      lines.push({ id: "result", speaker: "旁白", text: resultText });
    }
    return lines;
  }, [hasOwnerDialogue, resultText, step]);

  useEffect(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (step === "choice" || !sourceText) {
      setDisplayText("");
      return;
    }

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
  }, [sourceText, step, typingMode]);

  const handleContinue = () => {
    if (step !== "choice" && sourceText && displayText !== sourceText) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setDisplayText(sourceText);
      return;
    }
    if (step === "line-1") {
      setStep("line-2");
      return;
    }
    if (step === "line-2") {
      setStep("choice");
      return;
    }
    if (step === "owner-chat") {
      setStep("result");
      return;
    }
    if (step === "result") {
      onFinish();
    }
  };

  const chooseOption = (option: BreakfastOption) => {
    onChooseOption(option);
    if (option === "takeout") {
      setHasOwnerDialogue(false);
      setResultText(BREAKFAST_SHOP_EVENT_COPY.takeoutResult);
      setEffectText(BREAKFAST_SHOP_EVENT_COPY.takeoutEffect);
      setStep("result");
      return;
    }
    if (option === "leave") {
      setHasOwnerDialogue(false);
      setResultText(BREAKFAST_SHOP_EVENT_COPY.leaveResult);
      setEffectText(BREAKFAST_SHOP_EVENT_COPY.leaveEffect);
      setStep("result");
      return;
    }

    // 內用時有機會觸發額外對話
    const shouldTalk = Math.random() < 0.5;
    setHasOwnerDialogue(shouldTalk);
    setResultText(BREAKFAST_SHOP_EVENT_COPY.dineInResult);
    setEffectText(BREAKFAST_SHOP_EVENT_COPY.dineInEffect);
    setStep(shouldTalk ? "owner-chat" : "result");
  };

  return (
    <Flex position="absolute" inset="0" zIndex={50} direction="column" bgColor="#EDE7DE">
      <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />

      <Flex
        key={`breakfast-bg-${effectNonce}`}
        flex="1"
        bgImage="url('/images/breakfast.jpg')"
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
          {BREAKFAST_SHOP_EVENT_COPY.sceneTitle}
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

      {step === "choice" ? (
        <EventDialogPanel>
          <Text color="white" fontSize="16px" fontWeight="700">
            你打算怎麼做？
          </Text>
          <Flex
            bgColor="rgba(255,255,255,0.1)"
            borderRadius="8px"
            p="10px"
            justifyContent="space-between"
            alignItems="center"
            cursor="pointer"
            onClick={() => chooseOption("takeout")}
          >
            <Text color="white">外帶</Text>
            <Text color="#FCE9C8">儲蓄 -1 / 疲勞 -5</Text>
          </Flex>
          <Flex
            bgColor="rgba(255,255,255,0.1)"
            borderRadius="8px"
            p="10px"
            justifyContent="space-between"
            alignItems="center"
            cursor="pointer"
            onClick={() => chooseOption("dinein")}
          >
            <Text color="white">內用</Text>
            <Text color="#FCE9C8">儲蓄 -1 / 行動力 -1 / 疲勞 -8</Text>
          </Flex>
          <Flex
            bgColor="rgba(255,255,255,0.1)"
            borderRadius="8px"
            p="10px"
            justifyContent="space-between"
            alignItems="center"
            cursor="pointer"
            onClick={() => chooseOption("leave")}
          >
            <Text color="white">離開</Text>
            <Text color="#FCE9C8">不消耗資源</Text>
          </Flex>
        </EventDialogPanel>
      ) : (
        <EventDialogPanel>
          <Text color="white" fontWeight="700">
            {step === "line-2" || step === "owner-chat" ? "老闆娘" : "旁白"}
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
            {step === "result" && effectText ? (
              <Text color="#F9E17D" fontSize="14px" fontWeight="700" mt="8px">
                {effectText}
              </Text>
            ) : null}
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
