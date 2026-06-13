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
type BreakfastShopMaiClueOption = "order" | "ask" | "observe";
type BreakfastShopMaiClueStep = "intro" | "choice" | "result";
type BreakfastShopMaiClueLine = {
  speaker: "旁白" | "小麥" | "老闆娘";
  text: string;
};
type BreakfastShopMaiClueOptionCopy = {
  id: BreakfastShopMaiClueOption;
  label: string;
  hint: string;
  resultLine: BreakfastShopMaiClueLine;
};
type BreakfastShopMaiClueVisitCopy = {
  introLines: BreakfastShopMaiClueLine[];
  options: BreakfastShopMaiClueOptionCopy[];
  followupLines: BreakfastShopMaiClueLine[];
};

const BREAKFAST_SHOP_MAI_CLUE_VISITS: readonly BreakfastShopMaiClueVisitCopy[] = [
  {
    introLines: [
      { speaker: "旁白", text: "小麥依照日記裡的線索，把今天的路線排進早餐店。" },
      { speaker: "旁白", text: "店裡客人一波接一波，老闆娘忙著煎蛋、裝袋、喊號碼。" },
    ],
    options: [
      {
        id: "order",
        label: "照平常點餐",
        hint: "像普通客人一樣坐下來",
        resultLine: { speaker: "旁白", text: "小麥照著平常的步調點了早餐，找了角落坐下。" },
      },
      {
        id: "ask",
        label: "試著問小白",
        hint: "趁空檔開口詢問",
        resultLine: { speaker: "小麥", text: "不好意思，我想問一下小白以前是不是常來這裡……" },
      },
      {
        id: "observe",
        label: "先坐下觀察",
        hint: "看看老闆娘什麼時候有空",
        resultLine: { speaker: "旁白", text: "小麥先坐下來，觀察老闆娘和每個熟客打招呼的節奏。" },
      },
    ],
    followupLines: [
      { speaker: "旁白", text: "但店裡實在太忙，老闆娘只來得及把餐點放到桌上。" },
      { speaker: "旁白", text: "今天她似乎沒有注意到小麥。" },
    ],
  },
  {
    introLines: [
      { speaker: "旁白", text: "小麥第二次把早餐店排進路線。" },
      { speaker: "旁白", text: "這次店裡安靜了一些，老闆娘在櫃台後抬起頭。" },
    ],
    options: [
      {
        id: "order",
        label: "點一樣的早餐",
        hint: "讓老闆娘想起自己",
        resultLine: { speaker: "小麥", text: "我想點跟上次一樣的餐點。" },
      },
      {
        id: "ask",
        label: "提起小白",
        hint: "直接問她記不記得小白",
        resultLine: { speaker: "小麥", text: "老闆娘，妳還記得小白嗎？" },
      },
      {
        id: "observe",
        label: "坐同一個位置",
        hint: "看看老闆娘會不會注意到",
        resultLine: { speaker: "旁白", text: "小麥坐到上次的位置，假裝整理包包，等老闆娘靠近。" },
      },
    ],
    followupLines: [
      { speaker: "老闆娘", text: "咦？妳是不是前幾天也有來？" },
      { speaker: "老闆娘", text: "這份是小白以前最喜歡點的，今天招待妳，別客氣。" },
      { speaker: "小麥", text: "小白最喜歡的餐點……謝謝妳。" },
    ],
  },
  {
    introLines: [
      { speaker: "旁白", text: "第三次經過早餐店時，小麥才剛推開門，老闆娘就朝她揮了揮手。" },
      { speaker: "老闆娘", text: "早安，我猜你今天也會來，先幫你做好了。" },
    ],
    options: [
      {
        id: "order",
        label: "接過餐點",
        hint: "先謝謝老闆娘",
        resultLine: { speaker: "小麥", text: "謝謝妳，妳怎麼知道我今天會來？" },
      },
      {
        id: "ask",
        label: "問下午的事",
        hint: "把日記裡的下落問出口",
        resultLine: { speaker: "小麥", text: "小白以前下午會去哪裡？她有跟妳提過嗎？" },
      },
      {
        id: "observe",
        label: "留下來聊天",
        hint: "慢慢等老闆娘開口",
        resultLine: { speaker: "旁白", text: "小麥端著餐點坐下，老闆娘趁空檔走了過來。" },
      },
    ],
    followupLines: [
      { speaker: "老闆娘", text: "小白以前壓力大的時候，下午常去河畔。" },
      { speaker: "老闆娘", text: "她說那裡是她的秘密基地，畫畫、發呆，誰也不太會去打擾她。" },
      { speaker: "小麥", text: "河畔……原來下午的下落在那裡。" },
    ],
  },
] as const;

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

export function BreakfastShopMaiClueEventModal({
  visitNumber,
  onFinish,
  savings,
  actionPower,
  fatigue,
}: {
  visitNumber: number;
  onFinish: (option: BreakfastShopMaiClueOption) => void;
  savings: number;
  actionPower: number;
  fatigue: number;
}) {
  const safeVisitNumber = Math.max(1, Math.min(3, Math.floor(visitNumber)));
  const visitCopy = BREAKFAST_SHOP_MAI_CLUE_VISITS[safeVisitNumber - 1] ?? BREAKFAST_SHOP_MAI_CLUE_VISITS[0];
  const [step, setStep] = useState<BreakfastShopMaiClueStep>("intro");
  const [lineIndex, setLineIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<BreakfastShopMaiClueOptionCopy | null>(null);
  const [typingMode, setTypingMode] = useState<DialogTypingMode>(() => loadDialogTypingMode());
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resultLines = selectedOption
    ? [selectedOption.resultLine, ...visitCopy.followupLines]
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
    activeLine?.speaker === "老闆娘" && safeVisitNumber >= 3 ? 1 : 0;

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
    onFinish(selectedOption?.id ?? "order");
  };

  const chooseOption = (option: BreakfastShopMaiClueOptionCopy) => {
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

      <DialogQuickActions onOpenOptions={() => {}} onOpenHistory={() => setIsHistoryOpen(true)} />

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
