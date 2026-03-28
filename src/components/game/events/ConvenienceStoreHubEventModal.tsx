"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { CONVENIENCE_STORE_HUB_EVENT_COPY } from "@/lib/game/events";
import type { InventoryItemId } from "@/lib/game/playerProgress";
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

type ConvenienceStoreStep = "intro-1" | "intro-2" | "choice" | "shop-choice" | "result";
export type ConvenienceStoreOption = "shop" | "look" | "leave";
export type ConvenienceStoreFinishPayload = {
  option: ConvenienceStoreOption;
  purchasedItemId: InventoryItemId | null;
  purchasedPrice: number;
};

type ConvenienceStoreHubEventModalProps = {
  onFinish: (payload: ConvenienceStoreFinishPayload) => void;
  savings: number;
  actionPower: number;
  fatigue: number;
};

export function ConvenienceStoreHubEventModal({
  onFinish,
  savings,
  actionPower,
  fatigue,
}: ConvenienceStoreHubEventModalProps) {
  const {
    animation: backgroundShakeAnimation,
    effectNonce,
    activeEffectId,
  } = useBackgroundShake();
  const [step, setStep] = useState<ConvenienceStoreStep>("intro-1");
  const [resultText, setResultText] = useState("");
  const [effectText, setEffectText] = useState("");
  const [typingMode, setTypingMode] = useState<DialogTypingMode>(() => loadDialogTypingMode());
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<ConvenienceStoreOption | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<{
    itemId: InventoryItemId;
    price: number;
  } | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sourceText = useMemo(() => {
    if (step === "intro-1") return CONVENIENCE_STORE_HUB_EVENT_COPY.intro1;
    if (step === "intro-2") return CONVENIENCE_STORE_HUB_EVENT_COPY.intro2;
    if (step === "result") return resultText;
    return "";
  }, [resultText, step]);

  const isTypingComplete =
    step === "choice" || step === "shop-choice" || !sourceText || displayText === sourceText;

  const historyLines = useMemo(() => {
    const lines: Array<{ id: string; speaker: string; text: string }> = [
      { id: "intro-1", speaker: "旁白", text: CONVENIENCE_STORE_HUB_EVENT_COPY.intro1 },
    ];
    if (step !== "intro-1") {
      lines.push({ id: "intro-2", speaker: "旁白", text: CONVENIENCE_STORE_HUB_EVENT_COPY.intro2 });
    }
    if (selectedPurchase) {
      const product = CONVENIENCE_STORE_HUB_EVENT_COPY.products.find(
        (item) => item.itemId === selectedPurchase.itemId,
      );
      if (product) {
        lines.push({
          id: "shop-choice",
          speaker: "旁白",
          text: `你拿了${product.label}，準備去結帳。`,
        });
      }
    }
    if (step === "result" && resultText) {
      lines.push({ id: "result", speaker: "旁白", text: resultText });
    }
    return lines;
  }, [resultText, selectedPurchase, step]);

  useEffect(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (step === "choice" || step === "shop-choice" || !sourceText) {
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
    if (step === "intro-1") {
      setStep("intro-2");
      return;
    }
    if (step === "intro-2") {
      setStep("choice");
      return;
    }
    if (step === "result") {
      onFinish({
        option: selectedOption ?? "look",
        purchasedItemId: selectedPurchase?.itemId ?? null,
        purchasedPrice: selectedPurchase?.price ?? 0,
      });
    }
  };

  const chooseOption = (option: ConvenienceStoreOption) => {
    setSelectedOption(option);
    if (option === "shop") {
      setSelectedPurchase(null);
      setStep("shop-choice");
      return;
    }
    if (option === "look") {
      setResultText(CONVENIENCE_STORE_HUB_EVENT_COPY.lookResult);
      setEffectText(CONVENIENCE_STORE_HUB_EVENT_COPY.lookEffect);
      setStep("result");
      return;
    }
    setResultText(CONVENIENCE_STORE_HUB_EVENT_COPY.leaveResult);
    setEffectText(CONVENIENCE_STORE_HUB_EVENT_COPY.leaveEffect);
    setStep("result");
  };

  const chooseProduct = (itemId: InventoryItemId, price: number, label: string) => {
    setSelectedOption("shop");
    setSelectedPurchase({ itemId, price });
    setResultText(`你買了${label}，走到櫃台準備結帳。`);
    setEffectText(`儲蓄 -${price}`);
    setStep("result");
  };

  return (
    <Flex position="absolute" inset="0" zIndex={50} direction="column" bgColor="#EDE7DE">
      <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />

      <Flex
        key={`convenience-store-hub-bg-${effectNonce}`}
        flex="1"
        bgImage="url('/images/outside/mart.jpg')"
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
          {CONVENIENCE_STORE_HUB_EVENT_COPY.sceneTitle}
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

      <DialogQuickActions onOpenOptions={() => {}} onOpenHistory={() => setIsHistoryOpen(true)} />

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
            onClick={() => chooseOption("shop")}
          >
            <Text color="white">購物</Text>
            <Text color="#FCE9C8">先去結帳</Text>
          </Flex>
          <Flex
            bgColor="rgba(255,255,255,0.1)"
            borderRadius="8px"
            p="10px"
            justifyContent="space-between"
            alignItems="center"
            cursor="pointer"
            onClick={() => chooseOption("look")}
          >
            <Text color="white">四處看看</Text>
            <Text color="#FCE9C8">逛逛貨架</Text>
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
            <Text color="#FCE9C8">直接去公司</Text>
          </Flex>
        </EventDialogPanel>
      ) : step === "shop-choice" ? (
        <EventDialogPanel>
          <Text color="white" fontSize="16px" fontWeight="700">
            想買些什麼？
          </Text>
          {CONVENIENCE_STORE_HUB_EVENT_COPY.products.map((product) => {
            const canAfford = savings >= product.price;
            return (
              <Flex
                key={product.itemId}
                bgColor={canAfford ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}
                borderRadius="8px"
                p="10px"
                justifyContent="space-between"
                alignItems="center"
                cursor={canAfford ? "pointer" : "not-allowed"}
                opacity={canAfford ? 1 : 0.55}
                onClick={() => {
                  if (!canAfford) return;
                  chooseProduct(product.itemId, product.price, product.label);
                }}
              >
                <Text color="white">{product.label}</Text>
                <Text color="#FCE9C8">{product.price} 塊</Text>
              </Flex>
            );
          })}
          <Text color="#E7D8C3" fontSize="12px">
            目前儲蓄：{savings}
          </Text>
        </EventDialogPanel>
      ) : (
        <EventDialogPanel>
          <Text color="white" fontWeight="700">
            旁白
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
