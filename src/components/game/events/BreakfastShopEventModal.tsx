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
import type { BreakfastShopMaiClueFirstChoice } from "@/lib/game/playerProgress";
import { playFmodGameEvent } from "@/lib/game/fmodWeb";

type BreakfastStep = "line-1" | "line-2" | "choice" | "owner-chat" | "result";
type BreakfastOption = "takeout" | "dinein" | "leave";
type BreakfastShopMaiClueOption =
  | BreakfastShopMaiClueFirstChoice
  | "hide-mistake"
  | "report-mistake"
  | "deny-wait"
  | "explain-wait";
type BreakfastShopMaiClueStep = "intro" | "choice" | "result";
type BreakfastShopMaiClueLine = {
  speaker: "旁白" | "小麥" | "老闆娘";
  text: string;
};
type BreakfastShopMaiClueOptionCopy = {
  id: BreakfastShopMaiClueOption;
  label: string;
  hint: string;
  resultLines: BreakfastShopMaiClueLine[];
};
type BreakfastShopMaiClueVisitCopy = {
  introLines: BreakfastShopMaiClueLine[];
  options: BreakfastShopMaiClueOptionCopy[];
  followupLines: BreakfastShopMaiClueLine[];
};

const BREAKFAST_SHOP_MAI_FIRST_VISIT: BreakfastShopMaiClueVisitCopy = {
  introLines: [
    { speaker: "旁白", text: "早晨，小麥依照公雞日記裡的線索，把早餐店排進上班路線。" },
    { speaker: "小麥", text: "老闆娘，不好意思，我要一份早餐……" },
    { speaker: "旁白", text: "煎台前的老闆娘太專心，完全沒有聽見小麥的聲音。" },
  ],
  options: [
    {
      id: "call-owner",
      label: "再次呼喚老闆娘",
      hint: "再大聲一點，讓老闆娘聽見",
      resultLines: [
        { speaker: "小麥", text: "老闆娘，不好意思！我想點餐。" },
        { speaker: "老闆娘", text: "啊！抱歉抱歉，我剛才太專心了，馬上幫妳做。" },
        { speaker: "老闆娘", text: "來，妳的餐點好了，讓妳久等了。" },
        { speaker: "小麥", text: "謝謝妳。" },
      ],
    },
    {
      id: "wait-owner",
      label: "等老闆娘忙完",
      hint: "先在一旁等她做完手上的餐點",
      resultLines: [
        { speaker: "旁白", text: "小麥決定先在旁邊等，直到老闆娘忙完手上的餐點。" },
        { speaker: "老闆娘", text: "天啊，抱歉！妳是不是等很久了？" },
        { speaker: "小麥", text: "沒關係，妳剛才很忙。" },
        { speaker: "老闆娘", text: "謝謝妳。妳是附近的學生嗎？" },
        { speaker: "小麥", text: "不是，我正在去上班。" },
        { speaker: "老闆娘", text: "原來如此。來，餐點好了，路上小心。" },
      ],
    },
  ],
  followupLines: [],
};

const BREAKFAST_SHOP_MAI_SHARED_CLUE_LINES: BreakfastShopMaiClueLine[] = [
  { speaker: "老闆娘", text: "我記得妳了。妳每次點的餐都很特別，跟一個常來的女生一模一樣。" },
  { speaker: "小麥", text: "妳說的可能是我的室友，小白。" },
  { speaker: "老闆娘", text: "原來妳們是室友啊。她以前有時也會來店裡買一樣的餐。" },
  { speaker: "小麥", text: "妳知道小白買完早餐後，平常喜歡去哪裡嗎？" },
  { speaker: "老闆娘", text: "公園。她常說吃完想去公園坐一下、畫畫。" },
  { speaker: "小麥", text: "公園……謝謝妳，我再去找找看。" },
];

const BREAKFAST_SHOP_MAI_SECOND_VISIT_AFTER_CALL: BreakfastShopMaiClueVisitCopy = {
  introLines: [
    { speaker: "旁白", text: "隔天早晨，小麥再次把早餐店排進上班路線。" },
    { speaker: "小麥", text: "老闆娘，早安。我想點跟上次一樣的餐點。" },
    { speaker: "旁白", text: "餐點做好後，小麥才發現老闆娘拿錯了。" },
  ],
  options: [
    {
      id: "hide-mistake",
      label: "先不跟老闆娘說",
      hint: "拿著餐點默默離開",
      resultLines: [
        { speaker: "旁白", text: "小麥正想默默離開，老闆娘卻發現她拿錯了餐點。" },
        { speaker: "老闆娘", text: "等等，那份不是妳的！對不起，我馬上幫妳換。" },
        { speaker: "老闆娘", text: "我上次是不是也讓妳等了一下？" },
      ],
    },
    {
      id: "report-mistake",
      label: "向老闆娘反應",
      hint: "告訴她餐點好像拿錯了",
      resultLines: [
        { speaker: "小麥", text: "不好意思，這份好像不是我點的。" },
        { speaker: "老闆娘", text: "真的耶，對不起！我馬上幫妳換。" },
        { speaker: "老闆娘", text: "啊，我想起來了，上次好像也讓妳等了一下。" },
      ],
    },
  ],
  followupLines: BREAKFAST_SHOP_MAI_SHARED_CLUE_LINES,
};

const BREAKFAST_SHOP_MAI_SECOND_VISIT_AFTER_WAIT: BreakfastShopMaiClueVisitCopy = {
  introLines: [
    { speaker: "旁白", text: "隔天早晨，小麥再次把早餐店排進上班路線。" },
    { speaker: "老闆娘", text: "早安！妳是上次等了很久的那個女生，對不對？" },
  ],
  options: [
    {
      id: "deny-wait",
      label: "沒有啦，沒有等很久",
      hint: "讓老闆娘別放在心上",
      resultLines: [
        { speaker: "小麥", text: "沒有啦～沒有等很久。" },
        { speaker: "老闆娘", text: "妳人真好，我還是一直覺得很不好意思。" },
      ],
    },
    {
      id: "explain-wait",
      label: "告訴她上次的想法",
      hint: "說明自己只是想等她忙完",
      resultLines: [
        {
          speaker: "小麥",
          text: "啊～因為上次看妳很專心在弄其他餐點，想說等妳忙完再點餐。",
        },
        { speaker: "老闆娘", text: "原來是這樣，謝謝妳體諒我。" },
      ],
    },
  ],
  followupLines: BREAKFAST_SHOP_MAI_SHARED_CLUE_LINES,
};

function getBreakfastShopMaiClueVisitCopy(
  visitNumber: number,
  firstVisitChoice: BreakfastShopMaiClueFirstChoice | null,
) {
  if (visitNumber <= 1) return BREAKFAST_SHOP_MAI_FIRST_VISIT;
  return firstVisitChoice === "wait-owner"
    ? BREAKFAST_SHOP_MAI_SECOND_VISIT_AFTER_WAIT
    : BREAKFAST_SHOP_MAI_SECOND_VISIT_AFTER_CALL;
}

type BreakfastShopEventModalProps = {
  onFinish: () => void;
  savings: number;
  actionPower: number;
  fatigue: number;
  onChooseOption: (option: BreakfastOption) => void;
  onUnlockBusStop?: () => void;
  hasUnlockedBusStop?: boolean;
  forceOwnerChat?: boolean;
};

export function BreakfastShopEventModal({
  onFinish,
  savings,
  actionPower,
  fatigue,
  onChooseOption,
  onUnlockBusStop,
  hasUnlockedBusStop = false,
  forceOwnerChat = false,
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
  const isOwnerSpeaking = step === "line-2" || step === "owner-chat";
  const avatarSpriteId = isOwnerSpeaking ? "breakfast-owner" : "mai";
  const avatarFrameIndex = isOwnerSpeaking && step === "owner-chat" ? 1 : 0;

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
    playFmodGameEvent("choiceConfirm");
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

    // 第一次公車解鎖一定會觸發老闆娘對話；之後再回到原本的隨機閒聊感。
    const shouldTalk = forceOwnerChat || !hasUnlockedBusStop || Math.random() < 0.5;
    if (shouldTalk && !hasUnlockedBusStop) {
      onUnlockBusStop?.();
    }
    setHasOwnerDialogue(shouldTalk);
    setResultText(BREAKFAST_SHOP_EVENT_COPY.dineInResult);
    setEffectText(
      shouldTalk && !hasUnlockedBusStop
        ? `${BREAKFAST_SHOP_EVENT_COPY.dineInEffect} / ${BREAKFAST_SHOP_EVENT_COPY.unlockBusStopEffect}`
        : BREAKFAST_SHOP_EVENT_COPY.dineInEffect,
    );
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
        <EventAvatarSprite spriteId={avatarSpriteId} frameIndex={avatarFrameIndex} />
      </Flex>

      <DialogQuickActions
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

export function BreakfastShopMaiClueEventModal({
  visitNumber,
  firstVisitChoice,
  onFinish,
  savings,
  actionPower,
  fatigue,
}: {
  visitNumber: number;
  firstVisitChoice: BreakfastShopMaiClueFirstChoice | null;
  onFinish: (option: BreakfastShopMaiClueOption) => void;
  savings: number;
  actionPower: number;
  fatigue: number;
}) {
  const safeVisitNumber = Math.max(1, Math.min(2, Math.floor(visitNumber)));
  const visitCopy = useMemo(
    () => getBreakfastShopMaiClueVisitCopy(safeVisitNumber, firstVisitChoice),
    [firstVisitChoice, safeVisitNumber],
  );
  const [step, setStep] = useState<BreakfastShopMaiClueStep>("intro");
  const [lineIndex, setLineIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<BreakfastShopMaiClueOptionCopy | null>(null);
  const [typingMode, setTypingMode] = useState<DialogTypingMode>(() => loadDialogTypingMode());
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resultLines = selectedOption
    ? [...selectedOption.resultLines, ...visitCopy.followupLines]
    : visitCopy.followupLines;
  const activeLine =
    step === "intro"
      ? visitCopy.introLines[lineIndex] ?? null
      : step === "result"
        ? resultLines[lineIndex] ?? null
        : null;
  const sourceText = activeLine?.text ?? "";
  const isTypingComplete = step === "choice" || !sourceText || displayText === sourceText;
  const activeAvatarSpriteId = activeLine?.speaker === "老闆娘" ? "breakfast-owner" : "mai";
  const activeAvatarFrameIndex =
    activeLine?.speaker === "老闆娘" && safeVisitNumber >= 2 ? 1 : 0;

  const historyLines = useMemo(() => {
    const lines: Array<{ id: string; speaker: string; text: string }> = [];
    visitCopy.introLines.forEach((line, index) => {
      if (step === "intro" && index > lineIndex) return;
      lines.push({ id: `intro-${index}`, speaker: line.speaker === "旁白" ? "" : line.speaker, text: line.text });
    });
    if (selectedOption) {
      lines.push({ id: "choice", speaker: "小麥", text: selectedOption.label });
    }
    if (step === "result") {
      resultLines.forEach((line, index) => {
        if (index > lineIndex) return;
        lines.push({ id: `result-${index}`, speaker: line.speaker === "旁白" ? "" : line.speaker, text: line.text });
      });
    }
    return lines;
  }, [lineIndex, resultLines, selectedOption, step, visitCopy.introLines]);

  useEffect(() => {
    setStep("intro");
    setLineIndex(0);
    setSelectedOption(null);
    setDisplayText("");
  }, [safeVisitNumber]);

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
        if (cursor < sourceText.length) typingTimerRef.current = setTimeout(tick, 32);
        return;
      }

      cursor = Math.min(sourceText.length, cursor + 1);
      setDisplayText(sourceText.slice(0, cursor));
      if (cursor < sourceText.length) {
        const currentChar = sourceText[cursor - 1];
        let delay = typingMode === "pause" ? 170 : 34;
        if (typingMode === "punctuated" || typingMode === "pause") {
          if (/[。！？!?]/.test(currentChar)) delay = typingMode === "pause" ? 420 : 280;
          else if (/[，、,]/.test(currentChar)) delay = typingMode === "pause" ? 260 : 160;
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
    if (step === "intro") {
      if (lineIndex < visitCopy.introLines.length - 1) {
        setLineIndex((current) => current + 1);
        return;
      }
      setStep("choice");
      setLineIndex(0);
      return;
    }
    if (step !== "result") return;
    if (lineIndex < resultLines.length - 1) {
      setLineIndex((current) => current + 1);
      return;
    }
    onFinish(selectedOption?.id ?? "call-owner");
  };

  const chooseOption = (option: BreakfastShopMaiClueOptionCopy) => {
    playFmodGameEvent("choiceConfirm");
    setSelectedOption(option);
    setStep("result");
    setLineIndex(0);
  };

  return (
    <Flex position="absolute" inset="0" zIndex={50} direction="column" bgColor="#EDE7DE">
      <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />

      <Flex
        flex="1"
        bgImage="url('/images/breakfast.jpg')"
        bgSize="cover"
        backgroundPosition="center"
        bgRepeat="no-repeat"
        position="relative"
        justifyContent="center"
        alignItems="flex-start"
        pt="18px"
      >
        <Text color="#F5EFE5" fontSize="12px" textShadow="0 2px 6px rgba(0,0,0,0.45)">
          早餐店
        </Text>
      </Flex>

      <Flex
        position="absolute"
        left="14px"
        bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
        zIndex={4}
        pointerEvents="none"
      >
        <EventAvatarSprite
          spriteId={activeAvatarSpriteId}
          frameIndex={activeAvatarFrameIndex}
        />
      </Flex>

      <DialogQuickActions onOpenHistory={() => setIsHistoryOpen(true)} />

      {step === "choice" ? (
        <EventDialogPanel>
          <Text color="white" fontSize="16px" fontWeight="700">
            小麥要怎麼做？
          </Text>
          {visitCopy.options.map((option) => (
            <Flex
              key={option.id}
              bgColor="rgba(255,255,255,0.1)"
              borderRadius="8px"
              p="10px"
              direction="column"
              gap="4px"
              cursor="pointer"
              onClick={() => chooseOption(option)}
            >
              <Text color="white" fontSize="15px" fontWeight="700">
                {option.label}
              </Text>
              <Text color="#FCE9C8" fontSize="13px">
                {option.hint}
              </Text>
            </Flex>
          ))}
        </EventDialogPanel>
      ) : (
        <EventDialogPanel>
          {activeLine && activeLine.speaker !== "旁白" ? (
            <Text color="white" fontWeight="700">
              {activeLine.speaker}
            </Text>
          ) : activeLine?.speaker === "旁白" ? (
            <Text color="white" fontWeight="700" visibility="hidden" aria-hidden="true">
              旁白
            </Text>
          ) : null}
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
          <Flex flex="1" minH="0" direction="column" justifyContent="center">
            <Text
              color="white"
              fontSize={typingMode === "pause" ? "18px" : "16px"}
              lineHeight={typingMode === "pause" ? "1.8" : "1.5"}
              letterSpacing={typingMode === "pause" ? "0.08em" : "normal"}
              fontWeight={typingMode === "pause" ? "700" : "400"}
              fontStyle={activeLine?.speaker === "旁白" ? "italic" : undefined}
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
