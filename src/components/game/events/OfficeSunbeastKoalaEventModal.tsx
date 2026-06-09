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
import {
  EventPhotoCaptureLayer,
  type NaturalImageSize,
  type PhotoCaptureResult,
} from "@/components/game/events/EventPhotoCaptureLayer";
import { getTypingAdvance, loadDialogTypingMode } from "@/lib/game/dialogTyping";
import { recordPhotoCapture } from "@/lib/game/playerProgress";

const OFFICE_DUSK_IMAGE = "/images/work/Office_Work_Dusk_Focus_G01.png";
const KOALA_IMAGE = "/images/animals/放視大賞 5/無尾熊替身.png";
const KOALA_TARGET_RECT_NORMALIZED = {
  x: 0.55,
  y: 0.33,
  width: 0.26,
  height: 0.38,
};

type KoalaDialogSpeaker = "小麥" | "小貝狗" | "同事";
type KoalaStep =
  | {
      id: string;
      kind: "dialog";
      speaker: KoalaDialogSpeaker;
      text: string;
      innerThought?: boolean;
      avatarSpriteId?: AvatarSpriteId;
      avatarFrameIndex?: number;
      showKoala?: boolean;
    }
  | { id: string; kind: "koala-photo" };

const KOALA_STORY_STEPS: KoalaStep[] = [
  {
    id: "thanks-0",
    kind: "dialog",
    speaker: "同事",
    text: "小麥，真的太謝謝你了。沒有你我完全不知道今天該怎麼辦。",
    avatarSpriteId: "coworker",
    avatarFrameIndex: 1,
  },
  {
    id: "thanks-1",
    kind: "dialog",
    speaker: "小麥",
    text: "沒事，文件有趕上就好。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 0,
  },
  {
    id: "thanks-2",
    kind: "dialog",
    speaker: "小麥",
    text: "最近好像一直在幫他救火。明明不是討厭幫忙，可是心裡總有點沉沉的。",
    innerThought: true,
    avatarSpriteId: "mai",
    avatarFrameIndex: 36,
  },
  {
    id: "appear-0",
    kind: "dialog",
    speaker: "小貝狗",
    text: "嗷，小麥，你看同事旁邊。",
    avatarSpriteId: "beigo",
    avatarFrameIndex: 1,
    showKoala: true,
  },
  {
    id: "appear-1",
    kind: "dialog",
    speaker: "小麥",
    text: "咦？那隻抱著文件不放的無尾熊……是小白日記裡畫的那種感覺。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 34,
    showKoala: true,
  },
  {
    id: "appear-2",
    kind: "dialog",
    speaker: "小麥",
    text: "先拍下來。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 0,
    showKoala: true,
  },
  { id: "koala-photo", kind: "koala-photo" },
  {
    id: "post-0",
    kind: "dialog",
    speaker: "小貝狗",
    text: "嗷，拍到了。這隻無尾熊黏在需要被照顧的人身邊，像是在等誰安排好一切。",
    avatarSpriteId: "beigo",
    avatarFrameIndex: 1,
    showKoala: true,
  },
  {
    id: "post-1",
    kind: "dialog",
    speaker: "小麥",
    text: "小白的日記裡，應該還藏著下一個線索。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 36,
    showKoala: true,
  },
];

const POST_PHOTO_START_STEP_INDEX = KOALA_STORY_STEPS.findIndex((step) => step.id === "post-0");

const overlayFadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

function isDialogStep(step: KoalaStep): step is Extract<KoalaStep, { kind: "dialog" }> {
  return step.kind === "dialog";
}

type OfficeSunbeastKoalaEventModalProps = {
  onOpenDiary: (onContinue: () => void) => void;
  onFinish: () => void;
  savings: number;
  actionPower: number;
  fatigue: number;
};

export function OfficeSunbeastKoalaEventModal({
  onOpenDiary,
  onFinish,
  savings,
  actionPower,
  fatigue,
}: OfficeSunbeastKoalaEventModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [photoResetNonce, setPhotoResetNonce] = useState(0);
  const [naturalImageSize, setNaturalImageSize] = useState<NaturalImageSize | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const typingMode = loadDialogTypingMode();
  const step = KOALA_STORY_STEPS[stepIndex] ?? KOALA_STORY_STEPS[0];
  const dialogStep = isDialogStep(step) ? step : null;
  const isPhotoMode = step.kind === "koala-photo";
  const sourceText = dialogStep?.text ?? "";
  const isTypingComplete = !dialogStep || displayText === sourceText;
  const shouldShowKoala = Boolean(dialogStep?.showKoala) && !isPhotoMode;

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
    recordPhotoCapture({
      sourceImage: capture.sourceImage,
      previewImage: capture.framePreviewUrl,
      dogCoveragePercent: capture.score,
      cameraFrameRect: capture.normalizedCameraFrameRect,
      capturedRect: capture.normalizedCroppedRect,
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
