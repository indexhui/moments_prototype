"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { PlayerStatusBar } from "@/components/game/PlayerStatusBar";
import {
  EventAvatarSprite,
  type AvatarSpriteId,
} from "@/components/game/events/EventAvatarSprite";
import {
  EventDialogPanel,
  EVENT_DIALOG_ACTION_HEIGHT,
  EVENT_DIALOG_HEIGHT,
} from "@/components/game/events/EventDialogPanel";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { DialogQuickActions } from "@/components/game/events/DialogQuickActions";
import { EventHistoryOverlay } from "@/components/game/events/EventHistoryOverlay";
import { WorkTransitionModal } from "@/components/game/events/WorkTransitionModal";
import { WorkMinigameTestModal } from "@/components/game/events/WorkMinigameTestModal";
import {
  EventPhotoCaptureLayer,
  type NaturalImageSize,
  type PhotoCaptureResult,
} from "@/components/game/events/EventPhotoCaptureLayer";
import { recordPhotoCapture } from "@/lib/game/playerProgress";
import { getTypingAdvance, loadDialogTypingMode } from "@/lib/game/dialogTyping";

const PLACE_CHICKEN_IMAGE = "/images/背景/公園.png";
const STREET_EMPTY_IMAGE = PLACE_CHICKEN_IMAGE;
const OFFICE_DUSK_WORK_IMAGE = "/images/work/Office_Work_Dusk_Focus_G01.png";
const OFFICE_NIGHT_IMAGE = "/images/背景/公司_晚上.jpg";
const COMPANY_CHICKEN_IMAGE = OFFICE_NIGHT_IMAGE;
const CHICKEN_CAPTURE_PHOTO_IMAGE = "/images/animals/公雞.png";
const KOALA_CAPTURE_PHOTO_IMAGE = "/images/animals/放視大賞 5/無尾熊替身.png";
const CHICKEN_WORK_FATIGUE_INCREASE = 25;

const PLACE_CHICKEN_TARGET_RECT_NORMALIZED = {
  x: 0.34,
  y: 0.55,
  width: 0.36,
  height: 0.16,
};

const COMPANY_CHICKEN_TARGET_RECT_NORMALIZED = {
  x: 0.56,
  y: 0.35,
  width: 0.22,
  height: 0.1,
};

const OFFICE_KOALA_TARGET_RECT_NORMALIZED = {
  x: 0.18,
  y: 0.45,
  width: 0.24,
  height: 0.2,
};

const PLACE_CHICKEN_CAPTURE_OVERLAYS = [
  { imageSrc: CHICKEN_CAPTURE_PHOTO_IMAGE, rectNormalized: PLACE_CHICKEN_TARGET_RECT_NORMALIZED },
];

const COMPANY_CHICKEN_CAPTURE_OVERLAYS = [
  { imageSrc: CHICKEN_CAPTURE_PHOTO_IMAGE, rectNormalized: COMPANY_CHICKEN_TARGET_RECT_NORMALIZED },
];

const OFFICE_KOALA_CAPTURE_OVERLAYS = [
  { imageSrc: KOALA_CAPTURE_PHOTO_IMAGE, rectNormalized: OFFICE_KOALA_TARGET_RECT_NORMALIZED },
];

type ChickenDialogStage = "place" | "phone" | "office" | "final";
type ChickenDialogSpeaker = "小麥" | "小貝狗" | "老闆" | "同事";
type ChickenStep =
  | {
      id: string;
      kind: "dialog";
      stage: ChickenDialogStage;
      speaker: ChickenDialogSpeaker;
      text: string;
      innerThought?: boolean;
      avatarSpriteId?: AvatarSpriteId;
      avatarFrameIndex?: number;
      showBeigoPeek?: boolean;
      backgroundImageSrc?: string;
    }
  | { id: string; kind: "first-photo" }
  | { id: string; kind: "work-transition" }
  | { id: string; kind: "work-minigame" }
  | { id: string; kind: "koala-photo" }
  | { id: string; kind: "second-photo" };

const CHICKEN_STORY_STEPS: ChickenStep[] = [
  {
    id: "place-0",
    kind: "dialog",
    stage: "place",
    speaker: "小麥",
    text: "照著早餐店老闆娘給的地圖，小麥來到了河絆。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 36,
  },
  {
    id: "place-1",
    kind: "dialog",
    stage: "place",
    speaker: "小貝狗",
    text: "嗷，這裡就是小白下午會來的秘密基地嗎。",
    avatarSpriteId: "beigo",
    avatarFrameIndex: 1,
  },
  {
    id: "place-2",
    kind: "dialog",
    stage: "place",
    speaker: "小麥",
    text: "等等，那邊有一隻公雞，在很認真地追著蟲子。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 14,
  },
  {
    id: "place-3",
    kind: "dialog",
    stage: "place",
    speaker: "小貝狗",
    text: "牠好專心嗷，先不要打擾牠。",
    avatarSpriteId: "beigo",
    avatarFrameIndex: 1,
  },
  {
    id: "place-4",
    kind: "dialog",
    stage: "place",
    speaker: "小麥",
    text: "好，我抓準牠追上蟲子的那一瞬間。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 12,
  },
  { id: "first-photo", kind: "first-photo" },
  {
    id: "phone-0",
    kind: "dialog",
    stage: "phone",
    speaker: "小麥",
    text: "啊 老闆是...",
    avatarSpriteId: "mai",
    avatarFrameIndex: 13,
  },
  {
    id: "phone-1",
    kind: "dialog",
    stage: "phone",
    speaker: "小麥",
    text: "現在要我回公司幫忙救火嗎？",
    avatarSpriteId: "mai",
    avatarFrameIndex: 13,
  },
  {
    id: "phone-2",
    kind: "dialog",
    stage: "phone",
    speaker: "小麥",
    text: "好",
    avatarSpriteId: "mai",
    avatarFrameIndex: 13,
  },
  {
    id: "phone-3",
    kind: "dialog",
    stage: "phone",
    speaker: "小貝狗",
    text: "啊，公雞被鈴聲嚇到了，牠跑走了嗷。",
    avatarSpriteId: "beigo",
    avatarFrameIndex: 1,
  },
  {
    id: "phone-4",
    kind: "dialog",
    stage: "phone",
    speaker: "小麥",
    text: "先回公司吧。河絆這邊，只能晚點再想辦法了。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 5,
  },
  { id: "work-transition", kind: "work-transition" },
  { id: "work-minigame", kind: "work-minigame" },
  {
    id: "office-0",
    kind: "dialog",
    stage: "office",
    speaker: "同事",
    text: "小麥，太感謝你了！這些文件如果明天早上才發現就完了。",
    avatarSpriteId: "coworker",
    avatarFrameIndex: 1,
    backgroundImageSrc: OFFICE_DUSK_WORK_IMAGE,
  },
  {
    id: "office-1",
    kind: "dialog",
    stage: "office",
    speaker: "小麥",
    text: "還好趕上了。接下來只要把整理好的文件交給老闆……",
    avatarSpriteId: "mai",
    avatarFrameIndex: 36,
    backgroundImageSrc: OFFICE_DUSK_WORK_IMAGE,
  },
  {
    id: "office-2",
    kind: "dialog",
    stage: "office",
    speaker: "小貝狗",
    text: "嗷，你看同事旁邊。",
    avatarSpriteId: "beigo",
    avatarFrameIndex: 1,
    showBeigoPeek: true,
    backgroundImageSrc: OFFICE_DUSK_WORK_IMAGE,
  },
  {
    id: "office-3",
    kind: "dialog",
    stage: "office",
    speaker: "小麥",
    text: "是一隻抱著文件的無尾熊……牠也太黏人了吧。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 14,
    showBeigoPeek: true,
    backgroundImageSrc: OFFICE_DUSK_WORK_IMAGE,
  },
  { id: "koala-photo", kind: "koala-photo" },
  {
    id: "office-4",
    kind: "dialog",
    stage: "office",
    speaker: "小麥",
    text: "拍到了。現在把文件交給老闆吧。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 0,
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "office-5",
    kind: "dialog",
    stage: "office",
    speaker: "小麥",
    text: "老闆，你早上打電話要我整理的文件好了。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 0,
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "office-6",
    kind: "dialog",
    stage: "office",
    speaker: "老闆",
    text: "...",
    avatarSpriteId: "manager",
    avatarFrameIndex: 1,
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "office-7",
    kind: "dialog",
    stage: "office",
    speaker: "小麥",
    text: "老闆好專心，完全沒聽到我說話。",
    innerThought: true,
    avatarSpriteId: "mai",
    avatarFrameIndex: 36,
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "office-8",
    kind: "dialog",
    stage: "office",
    speaker: "小麥",
    text: "老闆",
    avatarSpriteId: "mai",
    avatarFrameIndex: 0,
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "office-9",
    kind: "dialog",
    stage: "office",
    speaker: "小麥",
    text: "好像完全聽不見我叫他",
    innerThought: true,
    avatarSpriteId: "mai",
    avatarFrameIndex: 5,
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "office-10",
    kind: "dialog",
    stage: "office",
    speaker: "小貝狗",
    text: "鑽出來",
    avatarSpriteId: "beigo",
    avatarFrameIndex: 0,
    showBeigoPeek: true,
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "office-11",
    kind: "dialog",
    stage: "office",
    speaker: "小麥",
    text: "啊，你不要跑出來拉",
    avatarSpriteId: "mai",
    avatarFrameIndex: 34,
    showBeigoPeek: true,
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "office-12",
    kind: "dialog",
    stage: "office",
    speaker: "小貝狗",
    text: "嗷，你看",
    avatarSpriteId: "beigo",
    avatarFrameIndex: 1,
    showBeigoPeek: true,
    backgroundImageSrc: COMPANY_CHICKEN_IMAGE,
  },
  {
    id: "office-13",
    kind: "dialog",
    stage: "office",
    speaker: "小麥",
    text: "那是早上的公雞！！",
    avatarSpriteId: "mai",
    avatarFrameIndex: 34,
    showBeigoPeek: true,
    backgroundImageSrc: COMPANY_CHICKEN_IMAGE,
  },
  { id: "second-photo", kind: "second-photo" },
  {
    id: "final-0",
    kind: "dialog",
    stage: "final",
    speaker: "老闆",
    text: "啊 是小麥呀",
    avatarSpriteId: "manager",
    avatarFrameIndex: 2,
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "final-1",
    kind: "dialog",
    stage: "final",
    speaker: "小麥",
    text: "老闆，這是文件我完成了",
    avatarSpriteId: "mai",
    avatarFrameIndex: 0,
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "final-2",
    kind: "dialog",
    stage: "final",
    speaker: "老闆",
    text: "啊 太感謝了，抱歉很突然要提交這份提案，我自己來不及完成",
    avatarSpriteId: "manager",
    avatarFrameIndex: 0,
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "final-3",
    kind: "dialog",
    stage: "final",
    speaker: "老闆",
    text: "好險有妳",
    avatarSpriteId: "manager",
    avatarFrameIndex: 0,
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "final-4",
    kind: "dialog",
    stage: "final",
    speaker: "老闆",
    text: "都已經這麼晚了，感謝 妳先下班吧，我來處理",
    avatarSpriteId: "manager",
    avatarFrameIndex: 0,
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
];

const PHONE_START_STEP_INDEX = CHICKEN_STORY_STEPS.findIndex((step) => step.id === "phone-0");
const WORK_TRANSITION_STEP_INDEX = CHICKEN_STORY_STEPS.findIndex((step) => step.id === "work-transition");
const FINAL_START_STEP_INDEX = CHICKEN_STORY_STEPS.findIndex((step) => step.id === "final-0");

const phoneNoticeJitter = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  8% { transform: translate3d(-2px, 1px, 0) rotate(-1.5deg); }
  16% { transform: translate3d(2px, -1px, 0) rotate(1.3deg); }
  24% { transform: translate3d(-1px, -1px, 0) rotate(-1deg); }
  32% { transform: translate3d(2px, 1px, 0) rotate(1.1deg); }
  42%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
`;

const phoneBodyBuzz = keyframes`
  0%, 100% { transform: translateX(0) rotate(0deg); }
  15% { transform: translateX(-2px) rotate(-4deg); }
  30% { transform: translateX(2px) rotate(4deg); }
  45% { transform: translateX(-1px) rotate(-3deg); }
  60% { transform: translateX(1px) rotate(3deg); }
  75% { transform: translateX(0) rotate(0deg); }
`;

const phoneRingWave = keyframes`
  0% { opacity: 0.58; transform: translate(-50%, -50%) scale(0.72); }
  72%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(1.34); }
`;

const phoneNoticeBlink = keyframes`
  0%, 100% { opacity: 0.48; }
  50% { opacity: 1; }
`;

const phoneOverlayFadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

const chickenAlertPop = keyframes`
  0% { opacity: 0; transform: translateY(10px) scale(0.72); }
  24% { opacity: 1; transform: translateY(-8px) scale(1.08); }
  62% { opacity: 1; transform: translateY(-12px) scale(1); }
  100% { opacity: 0; transform: translateY(-24px) scale(0.92); }
`;

const emptyStreetFadeIn = keyframes`
  0%, 46% { opacity: 0; }
  100% { opacity: 1; }
`;

function isDialogStep(step: ChickenStep): step is Extract<ChickenStep, { kind: "dialog" }> {
  return step.kind === "dialog";
}

function getSpeakerLabel(step: Extract<ChickenStep, { kind: "dialog" }>) {
  return step.speaker;
}

function getBackgroundImageForStep(step: ChickenStep) {
  if (step.kind === "koala-photo" || step.kind === "work-minigame") return OFFICE_DUSK_WORK_IMAGE;
  if (step.kind === "second-photo") return COMPANY_CHICKEN_IMAGE;
  if (step.kind === "dialog") {
    if (step.backgroundImageSrc) return step.backgroundImageSrc;
    if (step.stage === "office" || step.stage === "final") return OFFICE_NIGHT_IMAGE;
  }
  return PLACE_CHICKEN_IMAGE;
}

type OfficeSunbeastChickenEventModalProps = {
  onFinish: (fatigueIncrease: number) => void;
  onStartCompanyTransition: (onArriveCompany: () => void) => void;
  onOpenCollection: (onContinue: () => void) => void;
  savings: number;
  actionPower: number;
  fatigue: number;
};

export function OfficeSunbeastChickenEventModal({
  onFinish,
  onStartCompanyTransition,
  onOpenCollection,
  savings,
  actionPower,
  fatigue,
}: OfficeSunbeastChickenEventModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [photoResetNonce, setPhotoResetNonce] = useState(0);
  const [naturalImageSize, setNaturalImageSize] = useState<NaturalImageSize | null>(null);
  const [isPhoneCallAnswered, setIsPhoneCallAnswered] = useState(false);
  const [isChickenEscapePlaying, setIsChickenEscapePlaying] = useState(false);
  const [hasChickenEscaped, setHasChickenEscaped] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chickenEscapeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const typingMode = loadDialogTypingMode();
  const step = CHICKEN_STORY_STEPS[stepIndex] ?? CHICKEN_STORY_STEPS[0];
  const dialogStep = isDialogStep(step) ? step : null;
  const isPhoneIntroStep = dialogStep?.id === "phone-0";
  const isPhoneAwaitingAnswer = Boolean(isPhoneIntroStep && !isPhoneCallAnswered);
  const isFirstPhotoMode = step.kind === "first-photo";
  const isKoalaPhotoMode = step.kind === "koala-photo";
  const isSecondPhotoMode = step.kind === "second-photo";
  const isPhotoMode = isFirstPhotoMode || isKoalaPhotoMode || isSecondPhotoMode;
  const isWorkTransition = step.kind === "work-transition";
  const isWorkMinigame = step.kind === "work-minigame";
  const sourceText = isPhoneAwaitingAnswer ? "" : dialogStep?.text ?? "";
  const isTypingComplete = !dialogStep || displayText === sourceText;
  const backgroundImageSrc = getBackgroundImageForStep(step);
  const displayBackgroundImageSrc =
    dialogStep?.stage === "phone" && hasChickenEscaped ? STREET_EMPTY_IMAGE : backgroundImageSrc;

  const clearChickenEscapeTimers = () => {
    chickenEscapeTimersRef.current.forEach((timer) => clearTimeout(timer));
    chickenEscapeTimersRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearChickenEscapeTimers();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setNaturalImageSize(null);
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      setNaturalImageSize({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
    image.src = displayBackgroundImageSrc;
    return () => {
      cancelled = true;
    };
  }, [displayBackgroundImageSrc]);

  useEffect(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (!dialogStep || isPhoneAwaitingAnswer) {
      setDisplayText("");
      return;
    }

    let cursor = 0;
    setDisplayText("");
    const tick = () => {
      const previousChar = cursor > 0 ? sourceText[cursor - 1] : "";
      const { step: typeStep, delay } = getTypingAdvance(typingMode, previousChar);
      cursor = Math.min(sourceText.length, cursor + typeStep);
      setDisplayText(sourceText.slice(0, cursor));
      if (cursor < sourceText.length) {
        typingTimerRef.current = setTimeout(tick, delay);
      }
    };
    typingTimerRef.current = setTimeout(tick, 90);
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [dialogStep, isPhoneAwaitingAnswer, sourceText, typingMode]);

  const historyLines = useMemo(() => {
    const lastVisibleStepIndex = isPhoneAwaitingAnswer ? stepIndex - 1 : stepIndex;
    return CHICKEN_STORY_STEPS.slice(0, lastVisibleStepIndex + 1)
      .filter(isDialogStep)
      .map((item) => ({
        id: item.id,
        speaker: getSpeakerLabel(item),
        text: item.text,
      }));
  }, [isPhoneAwaitingAnswer, stepIndex]);

  const canShowDialog = Boolean(dialogStep && !isPhotoMode && !isWorkTransition && !isWorkMinigame && !isPhoneAwaitingAnswer);
  const showAvatar = Boolean(dialogStep?.avatarSpriteId) && !isPhotoMode && !isWorkMinigame && !isPhoneAwaitingAnswer;
  const shouldShowPhoneCallCue = isPhoneAwaitingAnswer;
  const shouldShowBeigoPeek = Boolean(dialogStep?.showBeigoPeek);
  const shouldShowOfficeKoala = dialogStep?.id === "office-2" || dialogStep?.id === "office-3";
  const shouldShowPlaceChicken =
    Boolean(dialogStep?.stage === "place" && stepIndex >= 2) ||
    Boolean(dialogStep?.stage === "phone" && !isChickenEscapePlaying && !hasChickenEscaped);
  const shouldShowCompanyChicken = dialogStep?.id === "office-12" || dialogStep?.id === "office-13";
  const sceneChickenRect = shouldShowCompanyChicken
    ? COMPANY_CHICKEN_TARGET_RECT_NORMALIZED
    : PLACE_CHICKEN_TARGET_RECT_NORMALIZED;
  const shouldShowSceneChicken =
    !isPhotoMode &&
    !isWorkTransition &&
    !isWorkMinigame &&
    !hasChickenEscaped &&
    !isChickenEscapePlaying &&
    (shouldShowPlaceChicken || shouldShowCompanyChicken);

  const goToStep = (nextIndex: number) => {
    const nextStep = CHICKEN_STORY_STEPS[nextIndex];
    if (!nextStep) return;
    setStepIndex(nextIndex);
    if (
      nextStep.kind === "first-photo" ||
      nextStep.kind === "koala-photo" ||
      nextStep.kind === "second-photo"
    ) {
      setPhotoResetNonce((value) => value + 1);
    }
  };

  const handleContinue = () => {
    if (!dialogStep) return;
    if (sourceText && displayText !== sourceText) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setDisplayText(sourceText);
      return;
    }

    const nextIndex = stepIndex + 1;
    const nextStep = CHICKEN_STORY_STEPS[nextIndex];
    if (!nextStep) {
      onFinish(CHICKEN_WORK_FATIGUE_INCREASE);
      return;
    }

    if (nextStep.kind === "work-transition") {
      onStartCompanyTransition(() => {
        goToStep(WORK_TRANSITION_STEP_INDEX);
      });
      return;
    }

    goToStep(nextIndex);
  };

  const handleFirstPhotoShutter = () => {
    clearChickenEscapeTimers();
    setIsPhoneCallAnswered(false);
    setIsChickenEscapePlaying(false);
    setHasChickenEscaped(false);
    goToStep(PHONE_START_STEP_INDEX);
    return false;
  };

  const handleAnswerPhoneCall = () => {
    if (!isPhoneAwaitingAnswer) return;

    clearChickenEscapeTimers();
    setIsPhoneCallAnswered(true);
    setIsChickenEscapePlaying(true);
    setHasChickenEscaped(false);
    setDisplayText("");

    const streetSwapTimer = setTimeout(() => {
      setHasChickenEscaped(true);
    }, 620);
    const finishEscapeTimer = setTimeout(() => {
      setIsChickenEscapePlaying(false);
    }, 1080);
    chickenEscapeTimersRef.current = [streetSwapTimer, finishEscapeTimer];
  };

  const handleWorkTransitionFinish = () => {
    goToStep(WORK_TRANSITION_STEP_INDEX + 1);
  };

  const handleWorkMinigameFinish = () => {
    goToStep(stepIndex + 1);
  };

  const handleKoalaPhotoConfirm = (capture: PhotoCaptureResult) => {
    recordPhotoCapture({
      sourceImage: capture.sourceImage,
      previewImage: KOALA_CAPTURE_PHOTO_IMAGE,
      dogCoveragePercent: capture.score,
      cameraFrameRect: capture.normalizedCameraFrameRect,
      capturedRect: capture.normalizedCroppedRect,
    });
    goToStep(stepIndex + 1);
  };

  const handleSecondPhotoConfirm = (capture: PhotoCaptureResult) => {
    recordPhotoCapture({
      sourceImage: capture.sourceImage,
      previewImage: CHICKEN_CAPTURE_PHOTO_IMAGE,
      dogCoveragePercent: capture.score,
      cameraFrameRect: capture.normalizedCameraFrameRect,
      capturedRect: capture.normalizedCroppedRect,
    });
    onOpenCollection(() => {
      goToStep(FINAL_START_STEP_INDEX);
    });
  };

  const dialogTitle = dialogStep ? getSpeakerLabel(dialogStep) : "";

  return (
    <Flex position="absolute" inset="0" zIndex={55} direction="column" bgColor="#EDE7DE">
      <Flex
        display={isPhotoMode || isWorkTransition || isWorkMinigame ? "none" : "flex"}
        transition="opacity 0.25s ease"
      >
        <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />
      </Flex>

      <Flex
        ref={backgroundRef}
        flex="1"
        bgImage={isFirstPhotoMode ? "none" : `url("${displayBackgroundImageSrc}")`}
        bgSize={isSecondPhotoMode ? "contain" : "cover"}
        backgroundPosition="center center"
        bgRepeat="no-repeat"
        bgColor={isPhotoMode ? "#151413" : "#EDE7DE"}
        position="relative"
        justifyContent="center"
        alignItems="flex-start"
        overflow="hidden"
      >
        {dialogStep?.innerThought ? (
          <Box
            position="absolute"
            inset="0"
            zIndex={2}
            bgColor="rgba(42, 31, 24, 0.28)"
            pointerEvents="none"
            animation={`${phoneOverlayFadeIn} 160ms ease-out both`}
          />
        ) : null}

        {shouldShowSceneChicken ? (
          <img
            src={CHICKEN_CAPTURE_PHOTO_IMAGE}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              position: "absolute",
              left: `${sceneChickenRect.x * 100}%`,
              top: `${sceneChickenRect.y * 100}%`,
              width: `${sceneChickenRect.width * 100}%`,
              height: `${sceneChickenRect.height * 100}%`,
              objectFit: "contain",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        ) : null}

        {shouldShowOfficeKoala && !isPhotoMode && !isWorkTransition && !isWorkMinigame ? (
          <img
            src={KOALA_CAPTURE_PHOTO_IMAGE}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              position: "absolute",
              left: `${OFFICE_KOALA_TARGET_RECT_NORMALIZED.x * 100}%`,
              top: `${OFFICE_KOALA_TARGET_RECT_NORMALIZED.y * 100}%`,
              width: `${OFFICE_KOALA_TARGET_RECT_NORMALIZED.width * 100}%`,
              height: `${OFFICE_KOALA_TARGET_RECT_NORMALIZED.height * 100}%`,
              objectFit: "contain",
              pointerEvents: "none",
              zIndex: 1,
              filter: "drop-shadow(0 10px 16px rgba(28, 21, 18, 0.24))",
            }}
          />
        ) : null}

        {isChickenEscapePlaying ? (
          <>
            <Box
              position="absolute"
              inset="0"
              zIndex={3}
              bgImage={`url("${STREET_EMPTY_IMAGE}")`}
              bgSize="cover"
              backgroundPosition="center center"
              bgRepeat="no-repeat"
              pointerEvents="none"
              animation={`${emptyStreetFadeIn} 1.08s ease-out both`}
            />
            <Flex
              position="absolute"
              left="40%"
              top="58%"
              zIndex={4}
              w="42px"
              h="42px"
              borderRadius="999px"
              bgColor="rgba(255, 225, 116, 0.9)"
              border="2px solid rgba(109, 75, 31, 0.82)"
              alignItems="center"
              justifyContent="center"
              color="#8E6D52"
              fontSize="27px"
              fontWeight="900"
              pointerEvents="none"
              animation={`${chickenAlertPop} 0.92s ease-out both`}
            >
              !
            </Flex>
          </>
        ) : null}

        {shouldShowPhoneCallCue ? (
          <Flex
            position="absolute"
            inset="0"
            zIndex={12}
            pointerEvents="auto"
            alignItems="center"
            justifyContent="center"
            px="24px"
            bg="radial-gradient(circle at center, rgba(18, 14, 12, 0.7) 0%, rgba(18, 14, 12, 0.56) 38%, rgba(18, 14, 12, 0.22) 78%, rgba(18, 14, 12, 0.08) 100%)"
            backdropFilter="blur(1.2px)"
            animation={`${phoneOverlayFadeIn} 180ms ease-out both`}
          >
            <Flex
              direction="column"
              alignItems="center"
              gap="18px"
              w="min(78%, 310px)"
              px="24px"
              py="26px"
              borderRadius="32px"
              bgColor="rgba(38, 30, 25, 0.68)"
              border="1px solid rgba(255, 242, 224, 0.28)"
              boxShadow="0 24px 52px rgba(42, 27, 17, 0.36), inset 0 1px 0 rgba(255,255,255,0.18)"
              animation={`${phoneNoticeJitter} 0.74s steps(1, end) infinite`}
            >
              <Flex direction="column" alignItems="center" gap="5px">
                <Text color="#F9E8D2" fontSize="15px" fontWeight="800" lineHeight="1.1">
                  老闆
                </Text>
                <Text color="#FFFDF8" fontSize="34px" fontWeight="900" lineHeight="1">
                  來電
                </Text>
              </Flex>

              <Box position="relative" w="116px" h="116px" flexShrink={0}>
                {[0, 1, 2].map((index) => (
                  <Box
                    key={index}
                    position="absolute"
                    left="50%"
                    top="50%"
                    w="92px"
                    h="92px"
                    borderRadius="999px"
                    border="2px solid rgba(255, 238, 213, 0.42)"
                    animation={`${phoneRingWave} 1.16s ease-out ${index * 0.22}s infinite`}
                  />
                ))}
                <Flex
                  position="absolute"
                  inset="0"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Flex
                    w="46px"
                    h="68px"
                    borderRadius="15px"
                    bgColor="#FFF5E7"
                    border="3px solid #8E6D52"
                    boxShadow="0 10px 20px rgba(48, 31, 19, 0.28)"
                    animation={`${phoneBodyBuzz} 0.42s steps(2, end) infinite`}
                    alignItems="center"
                    justifyContent="center"
                    position="relative"
                  >
                    <Box position="absolute" top="7px" w="15px" h="3px" borderRadius="999px" bgColor="#B88561" />
                    <Box w="20px" h="20px" borderRadius="999px" border="3px solid #8E6D52" />
                  </Flex>
                </Flex>
              </Box>

              <Flex
                alignItems="center"
                gap="8px"
                px="13px"
                py="7px"
                borderRadius="999px"
                bgColor="rgba(255, 248, 237, 0.18)"
                border="1px solid rgba(255, 248, 237, 0.18)"
              >
                <Box
                  w="8px"
                  h="8px"
                  borderRadius="999px"
                  bgColor="#FFB08C"
                  boxShadow="0 0 0 4px rgba(255, 176, 140, 0.14)"
                  animation={`${phoneNoticeBlink} 0.62s ease-in-out infinite`}
                />
                <Text color="#FFF8ED" fontSize="13px" fontWeight="900" lineHeight="1">
                  拍攝中斷
                </Text>
              </Flex>

              <Flex w="100%" justifyContent="center" opacity={0.98}>
                <Flex
                  as="button"
                  role="button"
                  tabIndex={0}
                  direction="column"
                  alignItems="center"
                  gap="7px"
                  cursor="pointer"
                  border="0"
                  bg="transparent"
                  p="0"
                  onClick={handleAnswerPhoneCall}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleAnswerPhoneCall();
                    }
                  }}
                >
                  <Flex
                    w="72px"
                    h="72px"
                    borderRadius="999px"
                    bgColor="rgba(92, 152, 111, 0.94)"
                    border="2px solid rgba(255,255,255,0.26)"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 10px 24px rgba(31, 82, 48, 0.28)"
                    _active={{ transform: "scale(0.96)" }}
                  >
                    <Box
                      w="27px"
                      h="27px"
                      borderRadius="8px"
                      border="4px solid #FFF8ED"
                      borderTopColor="transparent"
                      borderLeftColor="transparent"
                      transform="rotate(-45deg)"
                    />
                  </Flex>
                  <Text color="#FFF8ED" fontSize="13px" fontWeight="900">
                    接聽
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        ) : null}

        {shouldShowBeigoPeek ? (
          <Flex position="absolute" left="24px" bottom="18px" w="118px" pointerEvents="none">
            <img
              src="/images/beigo/Beigo_Spirt.png"
              alt="從包包探出頭的小貝狗"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        <EventPhotoCaptureLayer
          enabled={isFirstPhotoMode}
          resetNonce={photoResetNonce}
          backgroundRef={backgroundRef}
          backgroundImageSrc={PLACE_CHICKEN_IMAGE}
          naturalImageSize={naturalImageSize}
          targetRectNormalized={PLACE_CHICKEN_TARGET_RECT_NORMALIZED}
          captureOverlays={PLACE_CHICKEN_CAPTURE_OVERLAYS}
          passScore={55}
          hintText="點擊畫面或空白鍵捕捉公雞"
          fitMode="cover"
          frameSweepAxis="vertical"
          frameSweepFromY={20}
          frameSweepToY={604}
          targetFadeLeadPx={54}
          movingBackground={{
            enabled: true,
            mode: "responsive",
            scaleMultiplier: 1.12,
            panRangePx: 42,
            centerOffsetPx: -30,
          }}
          tutorialTitle="拍下公雞"
          tutorialLines={[
            "白色框會由上往下掃過畫面。",
            "移動游標或輕微傾斜手機找景，等公雞進到取景中間時按下快門。",
          ]}
          tutorialConfirmLabel="開始拍照"
          onBeforeCapture={handleFirstPhotoShutter}
          onConfirm={() => {}}
        />

        <EventPhotoCaptureLayer
          enabled={isSecondPhotoMode}
          resetNonce={photoResetNonce}
          backgroundRef={backgroundRef}
          backgroundImageSrc={COMPANY_CHICKEN_IMAGE}
          naturalImageSize={naturalImageSize}
          fitMode="cover"
          targetRectNormalized={COMPANY_CHICKEN_TARGET_RECT_NORMALIZED}
          captureOverlays={COMPANY_CHICKEN_CAPTURE_OVERLAYS}
          passScore={55}
          hintText="點擊畫面或空白鍵捕捉公雞"
          frameSweepAxis="vertical"
          frameSweepFromY={20}
          frameSweepToY={604}
          movingBackground={{
            enabled: true,
            mode: "responsive",
            scaleMultiplier: 1.06,
            panRangePx: 46,
            centerOffsetPx: 0,
            zoom: {
              enabled: true,
              minMultiplier: 0.95,
              maxMultiplier: 1.55,
              initialMultiplier: 1,
              wheelStep: 0.07,
              pinchSensitivity: 1,
            },
          }}
          tutorialTitle="再次拍下公雞"
          tutorialLines={[
            "滾輪或雙指可放大縮小場景。",
            "抓準牠進到取景中間的瞬間按下快門。",
          ]}
          tutorialHighlightText="滾輪或雙指可放大縮小場景"
          tutorialConfirmLabel="開始拍照"
          freeRetakeOfferText="第一次拍照可以免費重拍一次。要再試一次嗎？"
          freeRetakeButtonLabel="免費重拍"
          keepPhotoButtonLabel="收下這張"
          onConfirm={handleSecondPhotoConfirm}
        />

        <EventPhotoCaptureLayer
          enabled={isKoalaPhotoMode}
          resetNonce={photoResetNonce}
          backgroundRef={backgroundRef}
          backgroundImageSrc={OFFICE_DUSK_WORK_IMAGE}
          naturalImageSize={naturalImageSize}
          fitMode="cover"
          targetRectNormalized={OFFICE_KOALA_TARGET_RECT_NORMALIZED}
          captureOverlays={OFFICE_KOALA_CAPTURE_OVERLAYS}
          passScore={55}
          hintText="點擊畫面或空白鍵捕捉無尾熊"
          frameSweepAxis="vertical"
          frameSweepFromY={20}
          frameSweepToY={604}
          movingBackground={{
            enabled: true,
            mode: "responsive",
            scaleMultiplier: 1.06,
            panRangePx: 36,
            centerOffsetPx: 0,
          }}
          tutorialTitle="拍下無尾熊"
          tutorialLines={[
            "同事太依賴小麥的心情，旁邊冒出了無尾熊。",
            "等無尾熊進到取景中間時按下快門。",
          ]}
          tutorialConfirmLabel="開始拍照"
          onConfirm={handleKoalaPhotoConfirm}
        />
      </Flex>

      <Flex
        position="absolute"
        left="14px"
        bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
        zIndex={9}
        pointerEvents="none"
        opacity={showAvatar ? 1 : 0}
        transition="opacity 0.25s ease"
      >
        {dialogStep?.avatarSpriteId ? (
          <EventAvatarSprite
            spriteId={dialogStep.avatarSpriteId}
            frameIndex={dialogStep.avatarFrameIndex ?? 0}
          />
        ) : null}
      </Flex>

      <Flex
        opacity={canShowDialog ? 1 : 0}
        pointerEvents={canShowDialog ? "auto" : "none"}
        transition="opacity 0.25s ease"
      >
        <DialogQuickActions onOpenOptions={() => {}} onOpenHistory={() => setIsHistoryOpen(true)} />
      </Flex>

      {canShowDialog && dialogStep ? (
        <EventDialogPanel>
          {dialogStep.innerThought ? (
            <Flex
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom={EVENT_DIALOG_ACTION_HEIGHT}
              bgImage="linear-gradient(180deg, rgba(105, 75, 52, 0.92) 0%, rgba(155, 116, 84, 0.82) 100%)"
              pointerEvents="none"
              zIndex={1}
              animation={`${phoneOverlayFadeIn} 140ms ease-out both`}
            />
          ) : null}
          <Text color="white" fontWeight="700" position="relative" zIndex={2}>
            {dialogTitle}
          </Text>
          <Flex flex="1" minH="0" direction="column">
            <Text color="white" fontSize="16px" lineHeight="1.5" position="relative" zIndex={2}>
              {displayText}
            </Text>
          </Flex>
          <EventContinueAction enabled={isTypingComplete} onClick={handleContinue} />
        </EventDialogPanel>
      ) : null}

      {isWorkTransition ? (
        <WorkTransitionModal variant="dusk-plain" onFinish={handleWorkTransitionFinish} />
      ) : null}

      {isWorkMinigame ? (
        <WorkMinigameTestModal
          baseFatigue={0}
          onSkip={handleWorkMinigameFinish}
          onSolved={() => {}}
          onComplete={handleWorkMinigameFinish}
          successSavingsTotal={null}
          title="救火整理文件"
          successRewardHeading="同事的請託"
          successRewardLabel="文件整理完成"
          successFootnote="混在一起的文件暫時整理好了"
        />
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
