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
import {
  EventPhotoCaptureLayer,
  type NaturalImageSize,
  type PhotoCaptureResult,
} from "@/components/game/events/EventPhotoCaptureLayer";
import { recordPhotoCapture, recordSunbeastPhotoCapture } from "@/lib/game/playerProgress";
import { SUNBEAST_RETAKE_CAPTURE_PROPS } from "@/lib/game/sunbeastRegistry";
import { getTypingAdvance, loadDialogTypingMode } from "@/lib/game/dialogTyping";

const HEBAN_CHICKEN_IMAGE = "/images/背景/place_chicken_demo.png";
const COMPANY_CHICKEN_IMAGE = "/images/背景/place_chicken_demo_company.png";
const OFFICE_DUSK_WORK_IMAGE = "/images/work/Office_Work_Dusk_Focus_G01.png";
const OFFICE_NIGHT_IMAGE = "/images/背景/公司_晚上.jpg";
const CHICKEN_EVENT_FATIGUE_INCREASE = 0;

const HEBAN_CHICKEN_TARGET_RECT_NORMALIZED = {
  x: 0.35,
  y: 0.55,
  width: 0.42,
  height: 0.2,
};

const COMPANY_CHICKEN_TARGET_RECT_NORMALIZED = {
  x: 0.56,
  y: 0.35,
  width: 0.22,
  height: 0.1,
};

type ChickenDialogStage = "heban" | "phone" | "office" | "final";
type ChickenDialogSpeaker = "小麥" | "小貝狗" | "老闆";
type ChickenPhotoTarget = "heban" | "company";
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
  | { id: string; kind: "boss-call" }
  | { id: string; kind: "work-transition" }
  | { id: string; kind: "chicken-photo"; target: ChickenPhotoTarget };

const CHICKEN_STORY_STEPS: ChickenStep[] = [
  {
    id: "heban-0",
    kind: "dialog",
    stage: "heban",
    speaker: "小麥",
    text: "照著早餐店老闆娘給的地圖，小麥來到了河畔。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 36,
  },
  {
    id: "heban-1",
    kind: "dialog",
    stage: "heban",
    speaker: "小貝狗",
    text: "嗷，這裡就是小白下午會來的秘密基地嗎。",
    avatarSpriteId: "beigo",
    avatarFrameIndex: 1,
  },
  {
    id: "heban-2",
    kind: "dialog",
    stage: "heban",
    speaker: "小麥",
    text: "嗯。早餐店老闆娘說，小白壓力大的時候會來這裡畫畫。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 36,
  },
  {
    id: "heban-3",
    kind: "dialog",
    stage: "heban",
    speaker: "小貝狗",
    text: "嗷，你看那邊，有一隻公雞一直追著蟲子。",
    avatarSpriteId: "beigo",
    avatarFrameIndex: 1,
    showBeigoPeek: true,
  },
  {
    id: "heban-4",
    kind: "dialog",
    stage: "heban",
    speaker: "小麥",
    text: "牠好專心……像完全沒有注意到旁邊的聲音。",
    innerThought: true,
    avatarSpriteId: "mai",
    avatarFrameIndex: 36,
    showBeigoPeek: true,
  },
  {
    id: "heban-5",
    kind: "dialog",
    stage: "heban",
    speaker: "小麥",
    text: "如果這也是小白留下的線索，得先拍下來。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 0,
    showBeigoPeek: true,
  },
  { id: "heban-photo", kind: "chicken-photo", target: "heban" },
  { id: "boss-call", kind: "boss-call" },
  {
    id: "phone-0",
    kind: "dialog",
    stage: "phone",
    speaker: "老闆",
    text: "小麥，你現在方便回公司一趟嗎？剛剛那份資料要今天先確認。",
  },
  {
    id: "phone-1",
    kind: "dialog",
    stage: "phone",
    speaker: "小麥",
    text: "好，我現在回去。看來只能先把公雞的事放一邊了。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 25,
  },
  {
    id: "phone-2",
    kind: "dialog",
    stage: "phone",
    speaker: "小貝狗",
    text: "嗷，被公雞發現，牠跑走了。",
    avatarSpriteId: "beigo",
    avatarFrameIndex: 1,
    showBeigoPeek: true,
  },
  { id: "work-transition", kind: "work-transition" },
  {
    id: "office-0",
    kind: "dialog",
    stage: "office",
    speaker: "小麥",
    text: "這份文件太複雜，要完成的表格好多。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 3,
    backgroundImageSrc: OFFICE_DUSK_WORK_IMAGE,
  },
  {
    id: "office-1",
    kind: "dialog",
    stage: "office",
    speaker: "小麥",
    text: "差點趕不完……",
    avatarSpriteId: "mai",
    avatarFrameIndex: 5,
    backgroundImageSrc: OFFICE_DUSK_WORK_IMAGE,
  },
  {
    id: "office-2",
    kind: "dialog",
    stage: "office",
    speaker: "小麥",
    text: "趕緊拿給老闆看看。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 36,
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "office-3",
    kind: "dialog",
    stage: "office",
    speaker: "小麥",
    text: "老闆，你早上說要確認的文件完成了。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 0,
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "office-4",
    kind: "dialog",
    stage: "office",
    speaker: "老闆",
    text: "……",
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "office-5",
    kind: "dialog",
    stage: "office",
    speaker: "小麥",
    text: "老闆好像完全沒聽見……她也太專心了。",
    innerThought: true,
    avatarSpriteId: "mai",
    avatarFrameIndex: 36,
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "office-6",
    kind: "dialog",
    stage: "office",
    speaker: "小貝狗",
    text: "嗷，你看。",
    avatarSpriteId: "beigo",
    avatarFrameIndex: 1,
    showBeigoPeek: true,
    backgroundImageSrc: COMPANY_CHICKEN_IMAGE,
  },
  {
    id: "office-7",
    kind: "dialog",
    stage: "office",
    speaker: "小麥",
    text: "那是早上的公雞！",
    avatarSpriteId: "mai",
    avatarFrameIndex: 34,
    showBeigoPeek: true,
    backgroundImageSrc: COMPANY_CHICKEN_IMAGE,
  },
  { id: "company-photo", kind: "chicken-photo", target: "company" },
  {
    id: "final-0",
    kind: "dialog",
    stage: "final",
    speaker: "小麥",
    text: "拍到了。原來河畔的線索，真的指向這隻很專心的公雞。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 0,
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "final-1",
    kind: "dialog",
    stage: "final",
    speaker: "老闆",
    text: "啊，是小麥呀。妳在這裡等很久了嗎？",
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "final-2",
    kind: "dialog",
    stage: "final",
    speaker: "小麥",
    text: "沒有，文件我放在這裡。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 0,
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "final-3",
    kind: "dialog",
    stage: "final",
    speaker: "老闆",
    text: "太好了，謝謝妳。今天辛苦了，先下班吧。",
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
  {
    id: "final-4",
    kind: "dialog",
    stage: "final",
    speaker: "小麥",
    text: "嗯。等回家再慢慢整理小白留下的日記。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 36,
    backgroundImageSrc: OFFICE_NIGHT_IMAGE,
  },
];

const FINAL_START_STEP_INDEX = CHICKEN_STORY_STEPS.findIndex((step) => step.id === "final-0");

const overlayFadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

const phonePulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

function isDialogStep(step: ChickenStep): step is Extract<ChickenStep, { kind: "dialog" }> {
  return step.kind === "dialog";
}

function getSpeakerLabel(step: Extract<ChickenStep, { kind: "dialog" }>) {
  return step.speaker;
}

function getBackgroundImageForStep(step: ChickenStep) {
  if (step.kind === "chicken-photo") {
    return step.target === "company" ? COMPANY_CHICKEN_IMAGE : HEBAN_CHICKEN_IMAGE;
  }
  if (step.kind === "work-transition") return OFFICE_DUSK_WORK_IMAGE;
  if (step.kind === "dialog") {
    if (step.backgroundImageSrc) return step.backgroundImageSrc;
    if (step.stage === "office" || step.stage === "final") return OFFICE_NIGHT_IMAGE;
  }
  return HEBAN_CHICKEN_IMAGE;
}

type OfficeSunbeastChickenEventModalProps = {
  onFinish: (fatigueIncrease: number) => void;
  onStartCompanyTransition?: (onArriveCompany: () => void) => void;
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
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const typingMode = loadDialogTypingMode();
  const step = CHICKEN_STORY_STEPS[stepIndex] ?? CHICKEN_STORY_STEPS[0];
  const dialogStep = isDialogStep(step) ? step : null;
  const isPhotoMode = step.kind === "chicken-photo";
  const isHebanPhotoMode = step.kind === "chicken-photo" && step.target === "heban";
  const isCompanyPhotoMode = step.kind === "chicken-photo" && step.target === "company";
  const isBossCallMode = step.kind === "boss-call";
  const isWorkTransition = step.kind === "work-transition";
  const sourceText = dialogStep?.text ?? "";
  const isTypingComplete = !dialogStep || displayText === sourceText;
  const backgroundImageSrc = getBackgroundImageForStep(step);

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
    image.src = backgroundImageSrc;
    return () => {
      cancelled = true;
    };
  }, [backgroundImageSrc]);

  useEffect(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (!dialogStep) {
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
  }, [dialogStep, sourceText, typingMode]);

  const historyLines = useMemo(
    () =>
      CHICKEN_STORY_STEPS.slice(0, stepIndex + 1)
        .filter(isDialogStep)
        .map((item) => ({
          id: item.id,
          speaker: getSpeakerLabel(item),
          text: item.text,
        })),
    [stepIndex],
  );

  const canShowDialog = Boolean(dialogStep && !isPhotoMode && !isWorkTransition);
  const showAvatar = Boolean(dialogStep?.avatarSpriteId) && !isPhotoMode && !isWorkTransition;
  const shouldShowBeigoPeek = Boolean(dialogStep?.showBeigoPeek);

  const goToStep = (nextIndex: number) => {
    const nextStep = CHICKEN_STORY_STEPS[nextIndex];
    if (!nextStep) return;
    setStepIndex(nextIndex);
    if (nextStep.kind === "chicken-photo") {
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
      onFinish(CHICKEN_EVENT_FATIGUE_INCREASE);
      return;
    }

    if (nextStep.kind === "work-transition") {
      if (onStartCompanyTransition) {
        onStartCompanyTransition(() => {
          goToStep(nextIndex);
        });
        return;
      }
      goToStep(nextIndex);
      return;
    }

    goToStep(nextIndex);
  };

  const handleBossCallAnswer = () => {
    goToStep(stepIndex + 1);
  };

  const handleHebanPhotoShutter = () => {
    goToStep(stepIndex + 1);
    return false;
  };

  const handleWorkTransitionFinish = () => {
    goToStep(stepIndex + 1);
  };

  const handleCompanyPhotoConfirm = (capture: PhotoCaptureResult) => {
    const photoSnapshot = {
      sourceImage: capture.sourceImage,
      previewImage: capture.framePreviewUrl,
      dogCoveragePercent: capture.score,
      cameraFrameRect: capture.normalizedCameraFrameRect,
      capturedRect: capture.normalizedCroppedRect,
    };
    recordPhotoCapture(photoSnapshot);
    recordSunbeastPhotoCapture("chicken", photoSnapshot, { maxCaptures: 1 });
    onOpenCollection(() => {
      goToStep(FINAL_START_STEP_INDEX);
    });
  };

  const dialogTitle = dialogStep ? getSpeakerLabel(dialogStep) : "";

  return (
    <Flex position="absolute" inset="0" zIndex={55} direction="column" bgColor="#EDE7DE">
      <Flex
        display={isPhotoMode || isBossCallMode || isWorkTransition ? "none" : "flex"}
        transition="opacity 0.25s ease"
      >
        <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />
      </Flex>

      <Flex
        ref={backgroundRef}
        flex="1"
        bgImage={isPhotoMode ? "none" : `url("${backgroundImageSrc}")`}
        bgSize="cover"
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
            animation={`${overlayFadeIn} 160ms ease-out both`}
          />
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
          enabled={isHebanPhotoMode}
          resetNonce={photoResetNonce}
          backgroundRef={backgroundRef}
          backgroundImageSrc={HEBAN_CHICKEN_IMAGE}
          naturalImageSize={naturalImageSize}
          fitMode="cover"
          targetRectNormalized={HEBAN_CHICKEN_TARGET_RECT_NORMALIZED}
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
          tutorialTitle="拍下公雞"
          tutorialLines={[
            "滾輪或雙指可放大縮小場景。",
            "抓準牠進到取景中間的瞬間按下快門。",
          ]}
          tutorialHighlightText="滾輪或雙指可放大縮小場景"
          tutorialConfirmLabel="開始拍照"
          onBeforeCapture={handleHebanPhotoShutter}
          onConfirm={() => {}}
        />

        <EventPhotoCaptureLayer
          enabled={isCompanyPhotoMode}
          resetNonce={photoResetNonce}
          backgroundRef={backgroundRef}
          backgroundImageSrc={COMPANY_CHICKEN_IMAGE}
          naturalImageSize={naturalImageSize}
          fitMode="cover"
          targetRectNormalized={COMPANY_CHICKEN_TARGET_RECT_NORMALIZED}
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
          {...SUNBEAST_RETAKE_CAPTURE_PROPS}
          onConfirm={handleCompanyPhotoConfirm}
        />

        {isBossCallMode ? (
          <Flex
            position="absolute"
            inset="0"
            zIndex={8}
            bgColor="rgba(10, 10, 12, 0.86)"
            alignItems="center"
            justifyContent="center"
            px="24px"
            animation={`${overlayFadeIn} 180ms ease-out both`}
          >
            <Flex
              w="100%"
              maxW="320px"
              minH="420px"
              borderRadius="32px"
              bgColor="#111418"
              border="1px solid rgba(255,255,255,0.16)"
              boxShadow="0 28px 80px rgba(0,0,0,0.5)"
              direction="column"
              alignItems="center"
              justifyContent="space-between"
              p="30px 22px"
            >
              <Flex direction="column" alignItems="center" gap="10px">
                <Text color="rgba(255,255,255,0.58)" fontSize="14px" fontWeight="700">
                  來電
                </Text>
                <Flex
                  w="92px"
                  h="92px"
                  borderRadius="999px"
                  bgColor="#2B3138"
                  border="1px solid rgba(255,255,255,0.12)"
                  alignItems="center"
                  justifyContent="center"
                  animation={`${phonePulse} 1.15s ease-in-out infinite`}
                >
                  <Text color="white" fontSize="34px" fontWeight="800" lineHeight="1">
                    老
                  </Text>
                </Flex>
                <Text color="white" fontSize="30px" fontWeight="800" lineHeight="1.1">
                  老闆
                </Text>
                <Text color="rgba(255,255,255,0.62)" fontSize="14px" fontWeight="700">
                  手機來電中
                </Text>
              </Flex>

              <Flex w="100%" justifyContent="center">
                <Flex
                  as="button"
                  aria-label="接聽老闆來電"
                  w="72px"
                  h="72px"
                  borderRadius="999px"
                  bgColor="#25C06D"
                  alignItems="center"
                  justifyContent="center"
                  color="white"
                  fontSize="18px"
                  fontWeight="800"
                  cursor="pointer"
                  boxShadow="0 14px 32px rgba(37,192,109,0.36)"
                  transition="transform 140ms ease, background-color 140ms ease"
                  _hover={{ transform: "translateY(-1px)", bgColor: "#2DD77D" }}
                  _active={{ transform: "translateY(0)", bgColor: "#20A85F" }}
                  onClick={handleBossCallAnswer}
                >
                  接聽
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        ) : null}
      </Flex>

      <Flex
        position="absolute"
        left="14px"
        bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
        zIndex={9}
        pointerEvents="none"
        opacity={showAvatar && !isBossCallMode ? 1 : 0}
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
        opacity={canShowDialog && !isBossCallMode ? 1 : 0}
        pointerEvents={canShowDialog && !isBossCallMode ? "auto" : "none"}
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
              animation={`${overlayFadeIn} 140ms ease-out both`}
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

      <EventHistoryOverlay
        title="事件回顧"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        lines={historyLines}
      />
    </Flex>
  );
}
