"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

type GamePhase = "intro" | "running" | "result";
type PdfStageId = "range" | "sequence" | "export";
type FeedbackTone = "success" | "corrupt";

type PdfStage = {
  id: PdfStageId;
  title: string;
  subtitle: string;
  qteLabel: string;
};

const GAME_BG = "#6E7892";
const DESKTOP_BG = "#485067";
const PANEL_BG = "#F4EFE4";
const PAPER_BG = "#FFFDF8";
const INK = "#4F4A41";
const MUTED = "#81786A";
const GOOD = "#62A66B";
const GOOD_DARK = "#437C4A";
const WARNING = "#C65D56";
const ACCENT = "#D5A04F";
const TOTAL_STAGES = 3;
const RANGE_MARKER_DURATION_MS = 980;
const RANGE_TARGET_START = 43;
const RANGE_TARGET_END = 58;
const MASH_TARGET = 13;
const MASH_TIME_MS = 4200;
const STAGE_SETTLE_MS = 470;
const CORRUPT_FEEDBACK_MS = 760;
const COMPLETE_DELAY_MS = 3400;

const REQUIRED_KEYS = ["P", "D", "F"] as const;

const PDF_STAGES: PdfStage[] = [
  {
    id: "range",
    title: "鎖定輸出品質",
    subtitle: "指針進入綠色區間時確認",
    qteLabel: "精準停格",
  },
  {
    id: "sequence",
    title: "確認檔名快捷鍵",
    subtitle: "依序輸入 P D F",
    qteLabel: "按鍵序列",
  },
  {
    id: "export",
    title: "開始重新輸出",
    subtitle: "連打確認直到進度完成",
    qteLabel: "連打檢定",
  },
];

const boardEnter = keyframes`
  0% { opacity: 0; transform: translateY(14px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const feedbackPop = keyframes`
  0% { opacity: 0; transform: translate(-50%, 8px) scale(0.92); }
  18% { opacity: 1; transform: translate(-50%, 0) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -10px) scale(0.98); }
`;

const corruptShake = keyframes`
  0%, 100% { transform: translateX(0); }
  18% { transform: translateX(-7px); }
  36% { transform: translateX(6px); }
  54% { transform: translateX(-4px); }
  72% { transform: translateX(3px); }
`;

const successCoverTop = keyframes`
  0% { transform: translateY(-100%); }
  100% { transform: translateY(0); }
`;

const successCoverBottom = keyframes`
  0% { transform: translateY(100%); }
  100% { transform: translateY(0); }
`;

const successFadeUp = keyframes`
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const successFadeOut = keyframes`
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-6px); }
`;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPingPongValue(elapsedMs: number, durationMs: number) {
  if (durationMs <= 0) return 0;
  const phase = (elapsedMs % (durationMs * 2)) / durationMs;
  const progress = phase <= 1 ? phase : 2 - phase;
  return clamp(progress * 100, 0, 100);
}

function CssFileIcon({
  label,
  tone = "paper",
  cracked = false,
}: {
  label: string;
  tone?: "paper" | "pdf" | "corrupt" | "done";
  cracked?: boolean;
}) {
  const colors = {
    paper: { bg: "#FFFDF8", border: "#D6CEC0", text: "#6E655A" },
    pdf: { bg: "#FFF7EA", border: ACCENT, text: "#8A5D1B" },
    corrupt: { bg: "#FFF0EF", border: WARNING, text: WARNING },
    done: { bg: "#F1FAF0", border: GOOD, text: GOOD_DARK },
  }[tone];

  return (
    <Flex
      position="relative"
      w="58px"
      h="76px"
      border="2px solid"
      borderColor={colors.border}
      bgColor={colors.bg}
      direction="column"
      align="center"
      justify="flex-end"
      pb="9px"
      color={colors.text}
      fontSize="12px"
      fontWeight="900"
      lineHeight="1"
      boxShadow="0 4px 0 rgba(0,0,0,0.08)"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top="-2px"
        right="-2px"
        w="20px"
        h="20px"
        bgColor={colors.bg}
        borderLeft="2px solid"
        borderBottom="2px solid"
        borderColor={colors.border}
        transform="skew(-10deg)"
      />
      <Flex position="absolute" left="10px" right="10px" top="24px" direction="column" gap="5px">
        <Box h="3px" bgColor={colors.border} opacity={0.5} />
        <Box h="3px" w="76%" bgColor={colors.border} opacity={0.42} />
        <Box h="3px" w="88%" bgColor={colors.border} opacity={0.32} />
      </Flex>
      {cracked ? (
        <Box
          position="absolute"
          left="24px"
          top="14px"
          w="3px"
          h="52px"
          bgColor={WARNING}
          transform="rotate(18deg)"
          boxShadow="8px 18px 0 -1px #C65D56, -7px 30px 0 -1px #C65D56"
        />
      ) : null}
      {label}
    </Flex>
  );
}

function PdfDocumentPreview({
  corruptCount,
  isCorrupting,
}: {
  corruptCount: number;
  isCorrupting: boolean;
}) {
  return (
    <Flex
      position="relative"
      h="100%"
      minH="0"
      direction="row"
      align="center"
      justify="center"
      gap="16px"
      animation={isCorrupting ? `${corruptShake} 280ms ease` : undefined}
    >
      <Flex
        position="relative"
        w="118px"
        h="166px"
        bgColor={PAPER_BG}
        border="2px solid #D6CEC0"
        boxShadow="0 8px 0 rgba(0,0,0,0.08)"
        direction="column"
        px="12px"
        pt="14px"
        pb="10px"
        overflow="hidden"
      >
        <Box position="absolute" top="-2px" right="-2px" w="28px" h="28px" bgColor="#F5EAD9" borderLeft="2px solid #D6CEC0" borderBottom="2px solid #D6CEC0" />
        <Text color="#6D5443" fontSize="12px" fontWeight="900" lineHeight="1">
          Q2_REPORT
        </Text>
        <Flex mt="12px" direction="column" gap="5px">
          <Box h="5px" bgColor="#CFC6B7" />
          <Box h="5px" w="82%" bgColor="#D8D0C3" />
          <Box h="5px" w="90%" bgColor="#D8D0C3" />
        </Flex>
        <Grid mt="13px" templateColumns="repeat(3, 1fr)" gap="3px">
          {Array.from({ length: 9 }).map((_, index) => (
            <Box key={index} h="13px" bgColor={index % 2 === 0 ? "#ECE3D4" : "#E2D8C8"} />
          ))}
        </Grid>
        <Flex mt="12px" gap="5px" align="flex-end">
          {[28, 42, 22, 54].map((height, index) => (
            <Box key={index} flex="1" h={`${height}px`} bgColor={index === 1 ? "#D5A04F" : "#CFC6B7"} />
          ))}
        </Flex>
        {isCorrupting ? (
          <Box position="absolute" inset="0" bgColor="rgba(198,93,86,0.12)" />
        ) : null}
      </Flex>
      <Flex gap="8px" align="center">
        <CssFileIcon label="PDF" tone={isCorrupting ? "corrupt" : "pdf"} cracked={isCorrupting} />
        <Flex direction="column" gap="6px">
          <Text color="rgba(255,255,255,0.88)" fontSize="12px" fontWeight="800">
            輸出佇列
          </Text>
          <Text color="rgba(255,255,255,0.68)" fontSize="11px" fontWeight="700">
            壞檔 {corruptCount} 次
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

function StageProgress({ activeIndex }: { activeIndex: number }) {
  return (
    <Flex gap="6px" align="center">
      {PDF_STAGES.map((stage, index) => (
        <Box
          key={stage.id}
          w={index === activeIndex ? "22px" : "7px"}
          h="7px"
          borderRadius="999px"
          bgColor={index <= activeIndex ? "#F4D28D" : "rgba(255,255,255,0.28)"}
          transition="width 180ms ease, background-color 180ms ease"
        />
      ))}
    </Flex>
  );
}

function RangeQte({
  markerValue,
}: {
  markerValue: number;
}) {
  const isInRange = markerValue >= RANGE_TARGET_START && markerValue <= RANGE_TARGET_END;

  return (
    <Flex direction="column" gap="18px">
      <Flex direction="column" gap="10px">
        <Flex justify="space-between" align="center">
          <Text color={INK} fontSize="13px" fontWeight="900">
            PDF 相容性
          </Text>
          <Text color={isInRange ? GOOD_DARK : MUTED} fontSize="12px" fontWeight="900">
            {Math.round(markerValue)}%
          </Text>
        </Flex>
        <Box position="relative" h="38px" bgColor="#DED5C7" border="2px solid #C7BBA9">
          <Box
            position="absolute"
            top="0"
            bottom="0"
            left={`${RANGE_TARGET_START}%`}
            w={`${RANGE_TARGET_END - RANGE_TARGET_START}%`}
            bgColor="rgba(98,166,107,0.44)"
            borderLeft="2px solid #62A66B"
            borderRight="2px solid #62A66B"
          />
          <Box
            position="absolute"
            top="-8px"
            bottom="-8px"
            left={`calc(${markerValue}% - 2px)`}
            w="4px"
            bgColor={isInRange ? "#E8FFE6" : "#FFFFFF"}
            boxShadow="0 0 12px rgba(255,255,255,0.88)"
            pointerEvents="none"
          />
        </Box>
      </Flex>
      <Grid templateColumns="repeat(3, 1fr)" gap="8px">
        {["過度壓縮", "標準 PDF", "檔案過大"].map((label, index) => (
          <Flex
            key={label}
            minH="52px"
            border="2px solid"
            borderColor={index === 1 ? GOOD : "#D4CBBB"}
            bgColor={index === 1 ? "#EEF8EC" : "#FFFDF8"}
            align="center"
            justify="center"
            color={index === 1 ? GOOD_DARK : MUTED}
            fontSize="12px"
            fontWeight="900"
            textAlign="center"
            px="6px"
          >
            {label}
          </Flex>
        ))}
      </Grid>
    </Flex>
  );
}

function SequenceQte({
  sequenceIndex,
  onPress,
}: {
  sequenceIndex: number;
  onPress: (key: string) => void;
}) {
  const buttons = ["P", "D", "F", "X"];

  return (
    <Flex direction="column" gap="18px">
      <Flex justify="center" gap="10px">
        {REQUIRED_KEYS.map((key, index) => {
          const isDone = index < sequenceIndex;
          const isCurrent = index === sequenceIndex;
          return (
            <Flex
              key={key}
              w="54px"
              h="54px"
              align="center"
              justify="center"
              border="2px solid"
              borderColor={isDone ? GOOD : isCurrent ? ACCENT : "#D4CBBB"}
              bgColor={isDone ? "#EEF8EC" : isCurrent ? "#FFF4D8" : "#FFFDF8"}
              color={isDone ? GOOD_DARK : INK}
              fontSize="24px"
              fontWeight="900"
            >
              {key}
            </Flex>
          );
        })}
      </Flex>
      <Grid templateColumns="repeat(4, minmax(0, 1fr))" gap="8px">
        {buttons.map((key) => (
          <Flex
            as="button"
            key={key}
            h="48px"
            align="center"
            justify="center"
            bgColor="#4F5870"
            color="white"
            fontSize="18px"
            fontWeight="900"
            border="2px solid rgba(255,255,255,0.16)"
            onPointerDown={(event) => {
              event.stopPropagation();
              onPress(key);
            }}
          >
            {key}
          </Flex>
        ))}
      </Grid>
      <Text color={MUTED} fontSize="12px" fontWeight="700" lineHeight="1.6" textAlign="center">
        下一個鍵：{REQUIRED_KEYS[sequenceIndex] ?? "完成"}
      </Text>
    </Flex>
  );
}

function ExportQte({
  mashCount,
  mashTimeLeftMs,
}: {
  mashCount: number;
  mashTimeLeftMs: number;
}) {
  const progress = clamp((mashCount / MASH_TARGET) * 100, 0, 100);
  const timeProgress = clamp((mashTimeLeftMs / MASH_TIME_MS) * 100, 0, 100);

  return (
    <Flex direction="column" gap="18px">
      <Flex direction="column" gap="9px">
        <Flex justify="space-between">
          <Text color={INK} fontSize="13px" fontWeight="900">
            匯出進度
          </Text>
          <Text color={GOOD_DARK} fontSize="13px" fontWeight="900">
            {Math.round(progress)}%
          </Text>
        </Flex>
        <Box h="30px" bgColor="#DDD3C2" border="2px solid #C7BBA9" overflow="hidden">
          <Box h="100%" w={`${progress}%`} bgColor={GOOD} transition="width 80ms ease" />
        </Box>
      </Flex>
      <Flex direction="column" gap="9px">
        <Flex justify="space-between">
          <Text color={INK} fontSize="12px" fontWeight="900">
            重新輸出期限
          </Text>
          <Text color={timeProgress > 30 ? MUTED : WARNING} fontSize="12px" fontWeight="900">
            {(mashTimeLeftMs / 1000).toFixed(1)}s
          </Text>
        </Flex>
        <Box h="10px" bgColor="#DDD3C2" overflow="hidden">
          <Box h="100%" w={`${timeProgress}%`} bgColor={timeProgress > 30 ? ACCENT : WARNING} />
        </Box>
      </Flex>
      <Flex h="56px" align="center" justify="center" bgColor="#4F5870" color="white" fontSize="16px" fontWeight="900">
        點擊或按 Enter 連打
      </Flex>
    </Flex>
  );
}

export function WorkPdfExportMinigameModal({
  baseFatigue: _baseFatigue,
  onSkip,
  onSolved,
  onComplete,
  successSavingsTotal,
}: {
  baseFatigue: number;
  onSkip: () => void;
  onSolved?: () => void;
  onComplete?: () => void;
  successSavingsTotal?: number | null;
}) {
  const animationFrameRef = useRef<number | null>(null);
  const stageStartedAtRef = useRef(0);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const corruptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const solvedNotifiedRef = useRef(false);
  const stageLockedRef = useRef(false);
  const mashCountRef = useRef(0);

  const [phase, setPhase] = useState<GamePhase>("intro");
  const [stageIndex, setStageIndex] = useState(0);
  const [markerValue, setMarkerValue] = useState(0);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [mashCount, setMashCount] = useState(0);
  const [mashTimeLeftMs, setMashTimeLeftMs] = useState(MASH_TIME_MS);
  const [corruptCount, setCorruptCount] = useState(0);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>("success");
  const [feedbackNonce, setFeedbackNonce] = useState(0);
  const [isCorrupting, setIsCorrupting] = useState(false);

  const currentStage = PDF_STAGES[stageIndex] ?? PDF_STAGES[0];
  const stageNumberLabel = `${Math.min(stageIndex + 1, TOTAL_STAGES)}/${TOTAL_STAGES}`;

  const clearTimers = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (transitionTimerRef.current !== null) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (corruptTimerRef.current !== null) {
      clearTimeout(corruptTimerRef.current);
      corruptTimerRef.current = null;
    }
    if (completeTimerRef.current !== null) {
      clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
  }, []);

  const resetStageState = useCallback(() => {
    setMarkerValue(0);
    setSequenceIndex(0);
    mashCountRef.current = 0;
    setMashCount(0);
    setMashTimeLeftMs(MASH_TIME_MS);
    stageStartedAtRef.current = performance.now();
  }, []);

  const resetGame = useCallback(() => {
    clearTimers();
    stageLockedRef.current = false;
    solvedNotifiedRef.current = false;
    setPhase("intro");
    setStageIndex(0);
    setCorruptCount(0);
    setFeedbackText(null);
    setFeedbackTone("success");
    setIsCorrupting(false);
    resetStageState();
  }, [clearTimers, resetStageState]);

  const startGame = () => {
    clearTimers();
    stageLockedRef.current = false;
    solvedNotifiedRef.current = false;
    setPhase("running");
    setStageIndex(0);
    setCorruptCount(0);
    setFeedbackText(null);
    setFeedbackTone("success");
    setIsCorrupting(false);
    resetStageState();
  };

  const triggerFeedback = useCallback((text: string, tone: FeedbackTone) => {
    setFeedbackNonce((prev) => prev + 1);
    setFeedbackText(text);
    setFeedbackTone(tone);
  }, []);

  const finishStage = useCallback(() => {
    if (stageLockedRef.current) return;
    stageLockedRef.current = true;
    triggerFeedback("OK", "success");

    transitionTimerRef.current = setTimeout(() => {
      setFeedbackText(null);
      if (stageIndex >= PDF_STAGES.length - 1) {
        setPhase("result");
      } else {
        setStageIndex((prev) => prev + 1);
        resetStageState();
      }
      stageLockedRef.current = false;
    }, STAGE_SETTLE_MS);
  }, [resetStageState, stageIndex, triggerFeedback]);

  const triggerCorrupt = useCallback((message: string) => {
    if (stageLockedRef.current) return;
    stageLockedRef.current = true;
    setIsCorrupting(true);
    setCorruptCount((prev) => prev + 1);
    triggerFeedback(message, "corrupt");

    corruptTimerRef.current = setTimeout(() => {
      setIsCorrupting(false);
      setFeedbackText(null);
      resetStageState();
      stageLockedRef.current = false;
    }, CORRUPT_FEEDBACK_MS);
  }, [resetStageState, triggerFeedback]);

  const handleSequencePress = useCallback((pressedKey: string) => {
    if (phase !== "running" || currentStage.id !== "sequence" || stageLockedRef.current) return;
    const normalizedKey = pressedKey.toUpperCase();
    const expectedKey = REQUIRED_KEYS[sequenceIndex];

    if (normalizedKey !== expectedKey) {
      triggerCorrupt("快捷鍵錯誤，PDF 壞掉了");
      return;
    }

    const nextIndex = sequenceIndex + 1;
    setSequenceIndex(nextIndex);
    if (nextIndex >= REQUIRED_KEYS.length) {
      finishStage();
    }
  }, [currentStage.id, finishStage, phase, sequenceIndex, triggerCorrupt]);

  const handleAction = useCallback(() => {
    if (phase !== "running" || stageLockedRef.current) return;

    if (currentStage.id === "range") {
      if (markerValue >= RANGE_TARGET_START && markerValue <= RANGE_TARGET_END) {
        finishStage();
      } else {
        triggerCorrupt("品質區間錯誤，PDF 壞掉了");
      }
      return;
    }

    if (currentStage.id === "export") {
      const nextCount = clamp(mashCountRef.current + 1, 0, MASH_TARGET);
      mashCountRef.current = nextCount;
      setMashCount(nextCount);
      if (nextCount >= MASH_TARGET) {
        finishStage();
      }
    }
  }, [currentStage.id, finishStage, markerValue, phase, triggerCorrupt]);

  useEffect(() => {
    if (phase !== "running") return;
    resetStageState();
  }, [phase, resetStageState, stageIndex]);

  useEffect(() => {
    if (phase !== "running" || isCorrupting) return;
    if (currentStage.id !== "range") return;

    const animate = (timestamp: number) => {
      const elapsedMs = timestamp - stageStartedAtRef.current;
      setMarkerValue(getPingPongValue(elapsedMs, RANGE_MARKER_DURATION_MS));
      animationFrameRef.current = window.requestAnimationFrame(animate);
    };
    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [currentStage.id, isCorrupting, phase]);

  useEffect(() => {
    if (phase !== "running" || isCorrupting || currentStage.id !== "export") return;

    const timer = window.setInterval(() => {
      const elapsedMs = performance.now() - stageStartedAtRef.current;
      const timeLeftMs = Math.max(0, MASH_TIME_MS - elapsedMs);
      setMashTimeLeftMs(timeLeftMs);
      if (timeLeftMs <= 0 && mashCountRef.current < MASH_TARGET) {
        window.clearInterval(timer);
        triggerCorrupt("匯出逾時，PDF 壞掉了");
      }
    }, 40);

    return () => window.clearInterval(timer);
  }, [currentStage.id, isCorrupting, phase, triggerCorrupt]);

  useEffect(() => {
    if (phase !== "result") return;
    if (!solvedNotifiedRef.current) {
      solvedNotifiedRef.current = true;
      onSolved?.();
    }
    completeTimerRef.current = setTimeout(() => {
      onComplete?.();
    }, COMPLETE_DELAY_MS);
    return () => {
      if (completeTimerRef.current !== null) {
        clearTimeout(completeTimerRef.current);
        completeTimerRef.current = null;
      }
    };
  }, [onComplete, onSolved, phase]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onSkip();
        return;
      }
      if (phase !== "running") return;

      if (currentStage.id === "sequence") {
        const key = event.key.toUpperCase();
        if (/^[A-Z]$/.test(key)) {
          event.preventDefault();
          handleSequencePress(key);
        }
        return;
      }

      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        handleAction();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStage.id, handleAction, handleSequencePress, onSkip, phase]);

  useEffect(() => clearTimers, [clearTimers]);

  const renderStageContent = () => {
    if (currentStage.id === "range") {
      return <RangeQte markerValue={markerValue} />;
    }
    if (currentStage.id === "sequence") {
      return <SequenceQte sequenceIndex={sequenceIndex} onPress={handleSequencePress} />;
    }
    return <ExportQte mashCount={mashCount} mashTimeLeftMs={mashTimeLeftMs} />;
  };

  return (
    <Flex position="absolute" inset="0" zIndex={70} bgColor={GAME_BG}>
      <Flex w="100%" direction="column" overflow="hidden" bgColor={GAME_BG}>
        <Flex position="relative" px="16px" pt="16px" justify="space-between" align="center">
          <Flex
            as="button"
            onClick={resetGame}
            w="34px"
            h="34px"
            borderRadius="999px"
            bgColor="rgba(255,255,255,0.86)"
            align="center"
            justify="center"
            color="#5E6679"
            fontSize="18px"
            fontWeight="900"
            lineHeight="1"
          >
            ↻
          </Flex>
          <Flex direction="column" align="center" gap="5px">
            <Text color="white" fontSize="18px" fontWeight="900" lineHeight="1">
              匯出 PDF 檢定
            </Text>
            <StageProgress activeIndex={stageIndex} />
          </Flex>
          <Flex
            as="button"
            onClick={onSkip}
            minW="72px"
            h="34px"
            px="12px"
            borderRadius="999px"
            bgColor="rgba(46,36,30,0.24)"
            align="center"
            justify="center"
            color="white"
            fontSize="12px"
            fontWeight="700"
          >
            先放著
          </Flex>
        </Flex>

        <Flex flex="1" px="16px" pb="16px" minH="0">
          <Flex
            position="relative"
            flex="1"
            minH="0"
            bgColor={DESKTOP_BG}
            overflow="hidden"
            animation={`${boardEnter} 220ms ease both`}
            onPointerDown={() => {
              if (currentStage.id !== "sequence") {
                handleAction();
              }
            }}
          >
            <Box
              position="absolute"
              inset="0"
              bgImage="linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)"
              bgSize="24px 24px"
              pointerEvents="none"
            />
            <Flex position="absolute" top="12px" left="14px" right="14px" h="34px" bgColor="#343B4D" align="center" px="10px" gap="8px">
              <Box w="8px" h="8px" borderRadius="999px" bgColor="#E46E62" />
              <Box w="8px" h="8px" borderRadius="999px" bgColor="#E0B651" />
              <Box w="8px" h="8px" borderRadius="999px" bgColor="#62A66B" />
              <Text ml="4px" color="rgba(255,255,255,0.72)" fontSize="11px" fontWeight="800">
                report_export.app
              </Text>
            </Flex>

            <Flex
              position="absolute"
              inset="58px 14px 14px"
              direction="column"
              gap="12px"
              minH="0"
            >
              <Flex
                flex="0 0 204px"
                minH="0"
                bgColor="#5B647D"
                border="2px solid rgba(255,255,255,0.1)"
                overflow="hidden"
              >
                <PdfDocumentPreview corruptCount={corruptCount} isCorrupting={isCorrupting} />
              </Flex>

              <Flex
                flex="1"
                minH="0"
                bgColor={PANEL_BG}
                border="2px solid #D7CDBD"
                direction="column"
                overflow="hidden"
              >
                <Flex h="46px" px="14px" align="center" justify="space-between" bgColor="#E7DDCC" borderBottom="2px solid #D7CDBD">
                  <Flex direction="column" gap="3px">
                    <Text color={INK} fontSize="14px" fontWeight="900" lineHeight="1">
                      {currentStage.title}
                    </Text>
                    <Text color={MUTED} fontSize="10px" fontWeight="800" lineHeight="1">
                      {currentStage.qteLabel}
                    </Text>
                  </Flex>
                  <Text color="#A47B3E" fontSize="13px" fontWeight="900">
                    {stageNumberLabel}
                  </Text>
                </Flex>

                <Flex flex="1" minH="0" direction="column" px="14px" py="14px" gap="14px">
                  <Text color={MUTED} fontSize="13px" fontWeight="800" lineHeight="1.6">
                    {currentStage.subtitle}
                  </Text>
                  <Flex flex="1" minH="0" direction="column" justify="center">
                    {renderStageContent()}
                  </Flex>
                  {currentStage.id !== "sequence" ? (
                    <Flex
                      h="44px"
                      align="center"
                      justify="center"
                      bgColor="#4F5870"
                      color="white"
                      fontSize="14px"
                      fontWeight="900"
                    >
                      點擊畫面或按 Space / Enter 確認
                    </Flex>
                  ) : null}
                </Flex>
              </Flex>
            </Flex>

            {feedbackText ? (
              <Flex
                key={`pdf-feedback-${feedbackNonce}`}
                position="absolute"
                left="50%"
                top="92px"
                zIndex={35}
                transform="translateX(-50%)"
                px="16px"
                py="9px"
                bgColor={feedbackTone === "success" ? "rgba(67,124,74,0.94)" : "rgba(198,93,86,0.95)"}
                color="white"
                fontSize={feedbackText.length > 8 ? "14px" : "22px"}
                fontWeight="900"
                lineHeight="1"
                boxShadow="0 8px 18px rgba(0,0,0,0.18)"
                animation={`${feedbackPop} ${feedbackTone === "success" ? STAGE_SETTLE_MS : CORRUPT_FEEDBACK_MS}ms ease forwards`}
                pointerEvents="none"
              >
                {feedbackText}
              </Flex>
            ) : null}

            {phase === "result" ? (
              <Flex position="absolute" inset="0" zIndex={50} pointerEvents="none">
                <Box position="absolute" top="0" left="0" right="0" h="50%" bgColor={GOOD_DARK} animation={`${successCoverTop} 420ms cubic-bezier(0.2, 0.9, 0.22, 1) forwards`} />
                <Box position="absolute" bottom="0" left="0" right="0" h="50%" bgColor={GOOD_DARK} animation={`${successCoverBottom} 420ms cubic-bezier(0.2, 0.9, 0.22, 1) forwards`} />
                <Flex position="absolute" inset="0" align="center" justify="center">
                  <Flex
                    position="absolute"
                    direction="column"
                    align="center"
                    gap="8px"
                    animation={`${successFadeUp} 260ms ease 320ms both, ${successFadeOut} 240ms ease 980ms forwards`}
                  >
                    <Text color="white" fontSize="21px" fontWeight="900">
                      PDF 匯出成功
                    </Text>
                    <Text color="rgba(255,255,255,0.84)" fontSize="13px" fontWeight="800" textAlign="center">
                      報表沒有壞掉，可以送出去了。
                    </Text>
                  </Flex>
                  <Flex direction="column" align="center" gap="9px" animation={`${successFadeUp} 260ms ease 2220ms both`}>
                    <CssFileIcon label="PDF" tone="done" />
                    <Text color="rgba(255,255,255,0.92)" fontSize="15px" fontWeight="900">
                      壞檔重輸出 {corruptCount} 次
                    </Text>
                    <Text color="rgba(255,255,255,0.92)" fontSize="14px" fontWeight="900">
                      小遊戲獎勵
                    </Text>
                    <Text color="#FFF1D9" fontSize="18px" fontWeight="900">
                      小日幣 x10
                    </Text>
                    {successSavingsTotal !== null && successSavingsTotal !== undefined ? (
                      <Text color="rgba(255,255,255,0.82)" fontSize="12px" fontWeight="800">
                        目前共有 {successSavingsTotal} 小日幣
                      </Text>
                    ) : null}
                  </Flex>
                </Flex>
              </Flex>
            ) : null}
          </Flex>
        </Flex>

        {phase === "intro" ? (
          <Flex position="absolute" inset="0" zIndex={90} bgColor="rgba(18,14,12,0.48)" align="center" justify="center" p="24px">
            <Flex
              w="100%"
              maxW="320px"
              borderRadius="10px"
              bgColor="#F7EFE2"
              boxShadow="0 14px 28px rgba(0,0,0,0.22)"
              direction="column"
              overflow="hidden"
            >
              <Flex h="176px" bgColor="#505973" align="center" justify="center" gap="18px">
                <CssFileIcon label="PDF" tone="pdf" />
                <Flex direction="column" gap="8px">
                  <Text color="white" fontSize="18px" fontWeight="900" lineHeight="1">
                    PDF 匯出檢定
                  </Text>
                  <Text color="rgba(255,255,255,0.74)" fontSize="12px" fontWeight="800" lineHeight="1.5">
                    錯過時機或輸入錯誤就會產生壞檔。
                  </Text>
                </Flex>
              </Flex>
              <Flex px="18px" pt="18px" pb="10px" direction="column" gap="10px">
                <Text color="#6D5443" fontSize="18px" fontWeight="900">
                  匯出說明
                </Text>
                <Text color="#7B6352" fontSize="14px" lineHeight="1.8">
                  連續通過品質、快捷鍵與連打三個 QTE，才能產出正確 PDF。
                </Text>
                <Text color="#7B6352" fontSize="13px" lineHeight="1.7">
                  一旦檔案壞掉，該步會重新輸出。
                </Text>
              </Flex>
              <Flex px="18px" pb="18px" pt="6px" justify="flex-end">
                <Flex
                  as="button"
                  onClick={startGame}
                  minW="84px"
                  h="36px"
                  px="14px"
                  borderRadius="999px"
                  bgColor="#8E6D52"
                  align="center"
                  justify="center"
                  color="white"
                  fontSize="13px"
                  fontWeight="700"
                >
                  開始
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  );
}
