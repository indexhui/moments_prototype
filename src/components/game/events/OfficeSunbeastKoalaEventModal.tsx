"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { PlayerStatusBar } from "@/components/game/PlayerStatusBar";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import {
  EventDialogPanel,
  EVENT_DIALOG_ACTION_HEIGHT,
  EVENT_DIALOG_HEIGHT,
} from "@/components/game/events/EventDialogPanel";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { DialogQuickActions } from "@/components/game/events/DialogQuickActions";
import { EventHistoryOverlay } from "@/components/game/events/EventHistoryOverlay";
import {
  EventPhotoCaptureLayer,
  type NaturalImageSize,
  type PhotoCaptureResult,
} from "@/components/game/events/EventPhotoCaptureLayer";
import { getTypingAdvance, loadDialogTypingMode } from "@/lib/game/dialogTyping";
import { recordPhotoCapture, recordSunbeastPhotoCapture } from "@/lib/game/playerProgress";
import { SUNBEAST_RETAKE_CAPTURE_PROPS } from "@/lib/game/sunbeastRegistry";
import {
  KOALA_SCENE_JUMP_STEPS,
  KOALA_STORY_STEPS,
  getInitialKoalaStoryStepIndex,
  isKoalaDiarySceneJumpStepId,
  type KoalaStoryStep,
} from "@/lib/game/koalaSceneFlow";
import { dispatchSceneJumpContextChange } from "@/lib/game/sceneJumpContextBus";

const OFFICE_DUSK_IMAGE = "/images/work/Office_Work_Dusk_Focus_G01.png";
const KOALA_IMAGE = "/images/animals/放視大賞 5/無尾熊替身.png";
const KOALA_TARGET_RECT_NORMALIZED = {
  x: 0.55,
  y: 0.33,
  width: 0.26,
  height: 0.38,
};

const POST_PHOTO_START_STEP_INDEX = KOALA_STORY_STEPS.findIndex((step) => step.id === "post-0");

const overlayFadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

function isDialogStep(step: KoalaStoryStep): step is Extract<KoalaStoryStep, { kind: "dialog" }> {
  return step.kind === "dialog";
}

type OfficeSunbeastKoalaEventModalProps = {
  onOpenDiary: (onContinue: () => void) => void;
  onFinish: () => void;
  savings: number;
  actionPower: number;
  fatigue: number;
  initialSceneJumpStepId?: string;
};

export function OfficeSunbeastKoalaEventModal({
  onOpenDiary,
  onFinish,
  savings,
  actionPower,
  fatigue,
  initialSceneJumpStepId,
}: OfficeSunbeastKoalaEventModalProps) {
  const [stepIndex, setStepIndex] = useState(() =>
    getInitialKoalaStoryStepIndex(initialSceneJumpStepId),
  );
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [photoResetNonce, setPhotoResetNonce] = useState(0);
  const [naturalImageSize, setNaturalImageSize] = useState<NaturalImageSize | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const hasOpenedInitialDiaryRef = useRef(false);
  const typingMode = loadDialogTypingMode();
  const step = KOALA_STORY_STEPS[stepIndex] ?? KOALA_STORY_STEPS[0];
  const dialogStep = isDialogStep(step) ? step : null;
  const isPhotoMode = step.kind === "koala-photo";
  const sourceText = dialogStep?.text ?? "";
  const isTypingComplete = !dialogStep || displayText === sourceText;
  const shouldShowKoala = Boolean(dialogStep?.showKoala) && !isPhotoMode;

  useEffect(() => {
    setStepIndex(getInitialKoalaStoryStepIndex(initialSceneJumpStepId));
    setDisplayText("");
    hasOpenedInitialDiaryRef.current = false;
  }, [initialSceneJumpStepId]);

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
    image.src = OFFICE_DUSK_IMAGE;
    return () => {
      cancelled = true;
    };
  }, []);

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
      KOALA_STORY_STEPS.slice(0, stepIndex + 1)
        .filter(isDialogStep)
        .map((item) => ({
          id: item.id,
          speaker: item.speaker,
          text: item.text,
        })),
    [stepIndex],
  );

  const goToStep = (nextIndex: number) => {
    const nextStep = KOALA_STORY_STEPS[nextIndex];
    if (!nextStep) return;
    setStepIndex(nextIndex);
    if (nextStep.kind === "koala-photo") {
      setPhotoResetNonce((value) => value + 1);
    }
  };

  useEffect(() => {
    if (!isKoalaDiarySceneJumpStepId(initialSceneJumpStepId)) return;
    if (hasOpenedInitialDiaryRef.current) return;
    hasOpenedInitialDiaryRef.current = true;
    const requestedDiaryStep =
      KOALA_SCENE_JUMP_STEPS.find((item) => item.id === initialSceneJumpStepId) ??
      KOALA_SCENE_JUMP_STEPS.find((item) => item.id === "koala-diary-photo-slide");
    dispatchSceneJumpContextChange({
      eventId: "office-sunbeast-koala",
      kindLabel: requestedDiaryStep?.kindLabel ?? "日記",
      text: requestedDiaryStep?.text ?? "無尾熊照片飛入交換日記",
      steps: [...KOALA_SCENE_JUMP_STEPS],
      currentStepId: requestedDiaryStep?.id ?? "koala-diary-photo-slide",
    });
    onOpenDiary(() => goToStep(POST_PHOTO_START_STEP_INDEX));
  }, [initialSceneJumpStepId, onOpenDiary]);

  useEffect(() => {
    if (
      isKoalaDiarySceneJumpStepId(initialSceneJumpStepId) &&
      stepIndex < POST_PHOTO_START_STEP_INDEX
    ) {
      return;
    }
    if (dialogStep) {
      dispatchSceneJumpContextChange({
        eventId: "office-sunbeast-koala",
        kindLabel: "對話",
        speaker: dialogStep.speaker,
        text: dialogStep.text,
        steps: [...KOALA_SCENE_JUMP_STEPS],
        currentStepId: dialogStep.id,
      });
      return;
    }
    if (isPhotoMode) {
      dispatchSceneJumpContextChange({
        eventId: "office-sunbeast-koala",
        kindLabel: "拍照",
        text: "拍下無尾熊小日獸",
        steps: [...KOALA_SCENE_JUMP_STEPS],
        currentStepId: "koala-photo",
      });
    }
  }, [dialogStep, initialSceneJumpStepId, isPhotoMode, stepIndex]);

  useEffect(() => {
    return () => {
      dispatchSceneJumpContextChange({ eventId: "office-sunbeast-koala", clear: true });
    };
  }, []);

  const handleContinue = () => {
    if (!dialogStep) return;
    if (sourceText && displayText !== sourceText) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setDisplayText(sourceText);
      return;
    }

    const nextIndex = stepIndex + 1;
    const nextStep = KOALA_STORY_STEPS[nextIndex];
    if (!nextStep) {
      onFinish();
      return;
    }
    goToStep(nextIndex);
  };

  const handleKoalaPhotoConfirm = (capture: PhotoCaptureResult) => {
    const photoSnapshot = {
      sourceImage: capture.sourceImage,
      previewImage: capture.framePreviewUrl,
      dogCoveragePercent: capture.score,
      cameraFrameRect: capture.normalizedCameraFrameRect,
      capturedRect: capture.normalizedCroppedRect,
    };
    recordPhotoCapture(photoSnapshot);
    recordSunbeastPhotoCapture("koala", photoSnapshot, { maxCaptures: 1 });
    const diaryStep = KOALA_SCENE_JUMP_STEPS.find((item) => item.id === "koala-diary-photo-slide");
    dispatchSceneJumpContextChange({
      eventId: "office-sunbeast-koala",
      kindLabel: diaryStep?.kindLabel ?? "日記",
      text: diaryStep?.text ?? "無尾熊照片飛入交換日記",
      steps: [...KOALA_SCENE_JUMP_STEPS],
      currentStepId: diaryStep?.id ?? "koala-diary-photo-slide",
    });
    onOpenDiary(() => {
      goToStep(POST_PHOTO_START_STEP_INDEX);
    });
  };

  const canShowDialog = Boolean(dialogStep && !isPhotoMode);
  const showAvatar = Boolean(dialogStep?.avatarSpriteId) && !isPhotoMode;

  return (
    <Flex position="absolute" inset="0" zIndex={55} direction="column" bgColor="#EDE7DE">
      <Flex display={isPhotoMode ? "none" : "flex"} transition="opacity 0.25s ease">
        <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />
      </Flex>

      <Flex
        ref={backgroundRef}
        flex="1"
        bgImage={`url("${OFFICE_DUSK_IMAGE}")`}
        bgSize="cover"
        backgroundPosition="center center"
        bgRepeat="no-repeat"
        bgColor="#EDE7DE"
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
            bgColor="rgba(42, 31, 24, 0.3)"
            pointerEvents="none"
            animation={`${overlayFadeIn} 160ms ease-out both`}
          />
        ) : null}

        {shouldShowKoala ? (
          <Box
            position="absolute"
            right="13%"
            bottom={`calc(${EVENT_DIALOG_HEIGHT} + 34px)`}
            w="28%"
            maxW="156px"
            minW="98px"
            zIndex={3}
            pointerEvents="none"
            filter="drop-shadow(0 12px 18px rgba(34,24,18,0.34))"
            animation={`${overlayFadeIn} 180ms ease-out both`}
          >
            <img
              src={KOALA_IMAGE}
              alt=""
              aria-hidden="true"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Box>
        ) : null}

        <EventPhotoCaptureLayer
          enabled={isPhotoMode}
          resetNonce={photoResetNonce}
          backgroundRef={backgroundRef}
          backgroundImageSrc={OFFICE_DUSK_IMAGE}
          naturalImageSize={naturalImageSize}
          fitMode="cover"
          targetRectNormalized={KOALA_TARGET_RECT_NORMALIZED}
          captureOverlays={[
            {
              imageSrc: KOALA_IMAGE,
              rectNormalized: KOALA_TARGET_RECT_NORMALIZED,
            },
          ]}
          passScore={55}
          hintText="點擊畫面或空白鍵捕捉無尾熊"
          tutorialTitle="拍下無尾熊"
          tutorialLines={[
            "等無尾熊進到取景框中央時按下快門。",
            "這張照片會讓下一篇小白日記殘篇浮現。",
          ]}
          tutorialConfirmLabel="開始拍照"
          {...SUNBEAST_RETAKE_CAPTURE_PROPS}
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
              animation={`${overlayFadeIn} 140ms ease-out both`}
            />
          ) : null}
          <Text color="white" fontWeight="700" position="relative" zIndex={2}>
            {dialogStep.speaker}
          </Text>
          <Flex flex="1" minH="0" direction="column">
            <Text
              color="white"
              fontSize="16px"
              fontStyle={dialogStep.innerThought ? "italic" : "normal"}
              lineHeight="1.5"
              position="relative"
              zIndex={2}
            >
              {displayText}
            </Text>
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
