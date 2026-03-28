"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { OFFICE_SUNBEAST_CHICKEN_EVENT_COPY } from "@/lib/game/events";
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

type ChickenPhase =
  | "line-0"
  | "line-1"
  | "line-2"
  | "work-half"
  | "line-3"
  | "line-4"
  | "line-5"
  | "line-6"
  | "line-7"
  | "line-8"
  | "line-9"
  | "line-10"
  | "photo"
  | "post-0"
  | "post-1"
  | "post-2"
  | "post-3";

const PHASE_ORDER: ChickenPhase[] = [
  "line-0",
  "line-1",
  "line-2",
  "work-half",
  "line-3",
  "line-4",
  "line-5",
  "line-6",
  "line-7",
  "line-8",
  "line-9",
  "line-10",
  "photo",
  "post-0",
  "post-1",
  "post-2",
  "post-3",
];

const thoughtPulse = keyframes`
  0%, 100% { opacity: 0.92; transform: translateY(0px); }
  50% { opacity: 1; transform: translateY(-3px); }
`;
const workWave = keyframes`
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`;

function getLine(phase: ChickenPhase) {
  if (phase.startsWith("line-")) {
    const index = Number(phase.replace("line-", ""));
    if (!Number.isFinite(index)) return null;
    return OFFICE_SUNBEAST_CHICKEN_EVENT_COPY.lines[index] ?? null;
  }
  if (phase.startsWith("post-")) {
    const index = Number(phase.replace("post-", ""));
    if (!Number.isFinite(index)) return null;
    return OFFICE_SUNBEAST_CHICKEN_EVENT_COPY.postPhotoLines[index] ?? null;
  }
  return null;
}

type OfficeSunbeastChickenEventModalProps = {
  onFinish: (fatigueIncrease: number) => void;
  savings: number;
  actionPower: number;
  fatigue: number;
};

export function OfficeSunbeastChickenEventModal({
  onFinish,
  savings,
  actionPower,
  fatigue,
}: OfficeSunbeastChickenEventModalProps) {
  const [phase, setPhase] = useState<ChickenPhase>("line-0");
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [rhythmProgress, setRhythmProgress] = useState(0);
  const [cycleStartAt, setCycleStartAt] = useState(() => Date.now());
  const [rhythmFeedback, setRhythmFeedback] = useState<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingMode = loadDialogTypingMode();
  const line = getLine(phase);
  const isPhotoMode = phase === "photo";
  const isThoughtPhase = Boolean(line && "innerThought" in line && line.innerThought);
  const sourceText = line?.text ?? "";
  const isTypingComplete =
    phase === "work-half" || isPhotoMode || displayText === sourceText;

  useEffect(() => {
    if (phase !== "work-half") return;
    workTimerRef.current = setTimeout(() => {
      setPhase("line-3");
    }, 2500);
    return () => {
      if (workTimerRef.current) clearTimeout(workTimerRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (!sourceText || phase === "work-half" || isPhotoMode) {
      setDisplayText(phase === "work-half" ? "（專注處理文件中）" : "");
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
  }, [sourceText, typingMode, phase, isPhotoMode]);

  useEffect(() => {
    if (!isPhotoMode) return;
    setRhythmProgress(0);
    setCycleStartAt(Date.now());
    setRhythmFeedback(null);
  }, [isPhotoMode]);

  const historyLines = useMemo(() => {
    const lines: Array<{ id: string; speaker: string; text: string }> = [];
    PHASE_ORDER.forEach((item) => {
      if (item === "work-half" || item === "photo") return;
      const itemLine = getLine(item);
      if (!itemLine) return;
      if (PHASE_ORDER.indexOf(item) <= PHASE_ORDER.indexOf(phase)) {
        lines.push({
          id: item,
          speaker:
            "innerThought" in itemLine && itemLine.innerThought
              ? "小麥（心裡話）"
              : itemLine.speaker,
          text: itemLine.text,
        });
      }
    });
    return lines;
  }, [phase]);

  const showAvatar = Boolean(
    line?.speaker === "小麥" || line?.speaker === "小貝狗",
  ) && !isThoughtPhase && !isPhotoMode;
  const avatarSpriteId = line?.speaker === "小貝狗" ? "beigo" : "mai";

  const handleContinue = () => {
    if (phase === "work-half" || isPhotoMode) return;
    if (sourceText && displayText !== sourceText) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setDisplayText(sourceText);
      return;
    }
    if (phase === "line-2") {
      setPhase("work-half");
      return;
    }
    if (phase === "line-10") {
      setPhase("photo");
      return;
    }
    if (phase === "post-3") {
      onFinish(OFFICE_SUNBEAST_CHICKEN_EVENT_COPY.workFatigueIncrease);
      return;
    }
    const currentIndex = PHASE_ORDER.indexOf(phase);
    if (currentIndex < PHASE_ORDER.length - 1) {
      setPhase(PHASE_ORDER[currentIndex + 1]);
    }
  };

  const handleRhythmCapture = () => {
    if (!isPhotoMode) return;
    const cycleDuration = 1400;
    const successCenterMs = 760;
    const successWindowMs = 170;
    const elapsed = (Date.now() - cycleStartAt) % cycleDuration;
    const delta = Math.abs(elapsed - successCenterMs);

    if (delta <= successWindowMs) {
      const nextProgress = Math.min(3, rhythmProgress + 1);
      setRhythmProgress(nextProgress);
      setRhythmFeedback("節奏對上了");
      setCycleStartAt(Date.now() + 160);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => setRhythmFeedback(null), 700);
      if (nextProgress >= 3) {
        window.setTimeout(() => {
          setPhase("post-0");
        }, 520);
      }
      return;
    }

    setRhythmFeedback("再跟著旋律一次");
    setCycleStartAt(Date.now());
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setRhythmFeedback(null), 700);
  };

  return (
    <Flex position="absolute" inset="0" zIndex={55} direction="column" bgColor="#EDE7DE">
      <Flex
        opacity={isPhotoMode ? 0 : 1}
        pointerEvents={isPhotoMode ? "none" : "auto"}
        transition="opacity 0.25s ease"
      >
        <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />
      </Flex>

      <Flex
        flex="1"
        bgImage="url('/images/office.jpg')"
        bgSize="cover"
        backgroundPosition="center"
        bgRepeat="no-repeat"
        position="relative"
        justifyContent="center"
        alignItems="flex-start"
        pt="18px"
      >
        <Text color="#F5EFE5" fontSize="12px" textShadow="0 2px 6px rgba(0,0,0,0.45)">
          {OFFICE_SUNBEAST_CHICKEN_EVENT_COPY.sceneTitle}
        </Text>

        {phase === "work-half" ? (
          <Flex position="absolute" inset="0" bgColor="rgba(20,17,14,0.32)" alignItems="center" justifyContent="center">
            <Text color="white" fontSize="28px" fontWeight="800" textShadow="0 4px 10px rgba(0,0,0,0.35)">
              {"認真工作中...".split("").map((char, index) => (
                <Text
                  as="span"
                  key={`${char}-${index}`}
                  display="inline-block"
                  animation={`${workWave} 0.9s ease-in-out ${index * 0.08}s infinite`}
                >
                  {char}
                </Text>
              ))}
            </Text>
          </Flex>
        ) : null}

        {isThoughtPhase ? (
          <Flex position="absolute" inset="0" alignItems="center" justifyContent="center" px="28px">
            <Box
              px="18px"
              py="14px"
              borderRadius="16px"
              bgColor="rgba(37,30,26,0.7)"
              border="1px solid rgba(255,255,255,0.16)"
              boxShadow="0 10px 24px rgba(0,0,0,0.24)"
              animation={`${thoughtPulse} 2.1s ease-in-out infinite`}
            >
              <Text color="#FFF1D8" fontSize="18px" fontWeight="700" lineHeight="1.8" textAlign="center">
                {displayText}
              </Text>
            </Box>
          </Flex>
        ) : null}

        {isPhotoMode ? (
          <ChickenRhythmPhotoLayer
            progress={rhythmProgress}
            feedback={rhythmFeedback}
            cycleStartAt={cycleStartAt}
            onShutter={handleRhythmCapture}
          />
        ) : null}
      </Flex>

      <Flex
        position="absolute"
        left="14px"
        bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
        zIndex={4}
        pointerEvents="none"
        opacity={showAvatar ? 1 : 0}
        transition="opacity 0.25s ease"
      >
        <EventAvatarSprite spriteId={avatarSpriteId} frameIndex={0} />
      </Flex>

      <Flex
        opacity={isPhotoMode ? 0 : 1}
        pointerEvents={isPhotoMode ? "none" : "auto"}
        transition="opacity 0.25s ease"
      >
        <DialogQuickActions onOpenOptions={() => {}} onOpenHistory={() => setIsHistoryOpen(true)} />
      </Flex>

      {!isPhotoMode ? (
        <EventDialogPanel>
          <Text color="white" fontWeight="700">
            {phase === "work-half"
              ? "上班中"
              : isThoughtPhase
                ? "心裡話"
                : (line?.speaker ?? "旁白")}
          </Text>
          <Flex flex="1" minH="0" direction="column">
            {!isThoughtPhase ? (
              <Text color="white" fontSize="16px" lineHeight="1.5">
                {displayText}
              </Text>
            ) : (
              <Text color="#E7D8C3" fontSize="13px">
                想法湧上來了……
              </Text>
            )}
          </Flex>
          <EventContinueAction enabled={isTypingComplete} onClick={handleContinue} />
        </EventDialogPanel>
      ) : null}

      <EventHistoryOverlay
        title="事件回顧"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        lines={historyLines}
      />
    </Flex>
  );
}

function ChickenRhythmPhotoLayer({
  progress,
  feedback,
  cycleStartAt,
  onShutter,
}: {
  progress: number;
  feedback: string | null;
  cycleStartAt: number;
  onShutter: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let rafId = 0;
    const tick = () => {
      setNow(Date.now());
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const cycleDuration = 1400;
  const elapsed = (now - cycleStartAt + cycleDuration) % cycleDuration;
  const t = elapsed / cycleDuration;
  const frameY = -80 + t * 350;
  const targetY = 110;
  const isInBeat = Math.abs(frameY - targetY) < 28;

  return (
    <Flex position="absolute" inset="0" zIndex={8} direction="column">
      <Flex justify="space-between" align="flex-start" px="18px" pt="16px">
        <Flex
          px="12px"
          py="8px"
          borderRadius="14px"
          bgColor="rgba(30,24,19,0.72)"
          border="1px solid rgba(255,255,255,0.18)"
          gap="6px"
        >
          {[0, 1, 2].map((index) => (
            <Text key={index} color={index < progress ? "#FFE281" : "rgba(255,255,255,0.38)"} fontSize="20px">
              ♪
            </Text>
          ))}
        </Flex>
        <Text color="#FFF0C8" fontSize="12px" fontWeight="700" textShadow="0 2px 6px rgba(0,0,0,0.4)">
          跟著旋律按下三次快門
        </Text>
      </Flex>

      <Flex position="absolute" left="50%" top="136px" transform="translateX(-50%)" align="center" direction="column">
        <Text fontSize="60px" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.35))">
          🐔
        </Text>
        <Text color="#FFF0C8" fontSize="12px" fontWeight="700" mt="4px" textShadow="0 2px 6px rgba(0,0,0,0.4)">
          雉雞
        </Text>
      </Flex>

      <Flex
        position="absolute"
        left="50%"
        top={`${frameY}px`}
        transform="translateX(-50%)"
        w="236px"
        h="160px"
        borderRadius="16px"
        border={isInBeat ? "3px solid #FFE281" : "3px solid rgba(255,255,255,0.76)"}
        boxShadow={isInBeat ? "0 0 0 4px rgba(255,226,129,0.16), 0 10px 24px rgba(0,0,0,0.24)" : "0 10px 24px rgba(0,0,0,0.24)"}
        bgColor="rgba(255,255,255,0.04)"
      />

      <Flex
        position="absolute"
        left="50%"
        top={`${targetY}px`}
        transform="translateX(-50%)"
        w="252px"
        h="176px"
        borderRadius="18px"
        border="2px dashed rgba(255,226,129,0.48)"
      />

      {feedback ? (
        <Flex position="absolute" left="50%" bottom="148px" transform="translateX(-50%)" px="12px" py="7px" borderRadius="999px" bgColor="rgba(29,24,20,0.76)">
          <Text color="#FFF0C8" fontSize="12px" fontWeight="700">
            {feedback}
          </Text>
        </Flex>
      ) : null}

      <Flex position="absolute" left="0" right="0" bottom="34px" justify="center">
        <Flex
          as="button"
          w="86px"
          h="86px"
          borderRadius="999px"
          border="5px solid white"
          bgColor={isInBeat ? "#F17B67" : "#E05C46"}
          boxShadow="0 12px 24px rgba(0,0,0,0.28)"
          alignItems="center"
          justifyContent="center"
          onClick={onShutter}
        >
          <Box w="54px" h="54px" borderRadius="999px" bgColor="white" />
        </Flex>
      </Flex>
    </Flex>
  );
}
