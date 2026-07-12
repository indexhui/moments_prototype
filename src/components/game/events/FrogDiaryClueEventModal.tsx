"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { PlayerStatusBar } from "@/components/game/PlayerStatusBar";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import {
  EventDialogPanel,
  EVENT_DIALOG_HEIGHT,
} from "@/components/game/events/EventDialogPanel";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { DialogQuickActions } from "@/components/game/events/DialogQuickActions";
import {
  EventHistoryOverlay,
  type EventHistoryLine,
} from "@/components/game/events/EventHistoryOverlay";
import { FrogFlyerWindMinigame } from "@/components/game/events/FrogFlyerWindMinigame";
import {
  EventPhotoCaptureLayer,
  type NaturalImageSize,
  type PhotoCaptureResult,
} from "@/components/game/events/EventPhotoCaptureLayer";
import type { AvatarSpriteId } from "@/components/game/events/EventAvatarSprite";
import {
  FIRST_FROG_CLUE_ESCAPE_LINE,
  FIRST_FROG_CLUE_WORK_LUNCH_RETURN_LINES,
  FROG_POUNCE_IMAGE_PATH,
  STREET_FLYER_WIND_MINIGAME_AFTER_LINE_INDEX,
  buildFrogDiaryClueSceneJumpSteps,
  getFrogDiaryCluePostPhotoLines,
  type FrogDiaryClueLine,
  type FrogDiaryClueStage,
} from "@/lib/game/frogDiaryClueFlow";
import { dispatchSceneJumpContextChange } from "@/lib/game/sceneJumpContextBus";
import { getTypingAdvance, loadDialogTypingMode } from "@/lib/game/dialogTyping";
import {
  recordPhotoCapture,
  recordStreetForgotLunchFrogPhotoCapture,
} from "@/lib/game/playerProgress";
import { SUNBEAST_RETAKE_CAPTURE_PROPS } from "@/lib/game/sunbeastRegistry";

type FrogDiaryClueEventOutcome = {
  result: "captured" | "clue-photo";
  attemptAlreadyRecorded?: boolean;
  diaryRevealCompleted?: boolean;
  returnToWorkAndOffwork?: boolean;
};

type FrogDiaryClueEventModalProps = {
  stage: FrogDiaryClueStage;
  onFinish: (outcome: FrogDiaryClueEventOutcome) => void;
  savings: number;
  actionPower: number;
  fatigue: number;
  photoAttemptNumber: number;
  requiredPhotoAttempts?: number;
  /** Scene jump menu can resume a concrete dialogue or interaction beat. */
  initialSceneJumpStepId?: string;
  onFirstClueDiaryReveal?: (onComplete: () => void) => void;
};

type FrogDiaryCluePhase =
  | { kind: "line"; index: number }
  | { kind: "flyer-wind-minigame" }
  | { kind: "photo" }
  | { kind: "escape-line" }
  | { kind: "waiting-diary" }
  | { kind: "work-lunch-return-line"; index: number }
  | { kind: "post-photo"; index: number };

function getInitialFrogDiaryCluePhase({
  stage,
  photoAttemptNumber,
  initialSceneJumpStepId,
}: {
  stage: FrogDiaryClueStage;
  photoAttemptNumber: number;
  initialSceneJumpStepId?: string;
}): FrogDiaryCluePhase {
  const defaultPhase: FrogDiaryCluePhase = { kind: "line", index: 0 };
  if (!initialSceneJumpStepId) return defaultPhase;

  const lineMatch = initialSceneJumpStepId.match(/^line-(\d+)$/);
  if (lineMatch) {
    const index = Number(lineMatch[1]);
    if (Number.isInteger(index) && index >= 0 && index < stage.lines.length) {
      return { kind: "line", index };
    }
  }

  if (initialSceneJumpStepId === "photo") return { kind: "photo" };
  if (initialSceneJumpStepId === "flyer-wind-minigame" && stage.id === "street-flyer") {
    return { kind: "flyer-wind-minigame" };
  }
  if (initialSceneJumpStepId === "escape-line" && photoAttemptNumber <= 1) {
    return { kind: "escape-line" };
  }
  if (initialSceneJumpStepId === "waiting-diary" && photoAttemptNumber <= 1) {
    return { kind: "waiting-diary" };
  }

  const workLunchReturnMatch = initialSceneJumpStepId.match(/^work-lunch-return-(\d+)$/);
  if (workLunchReturnMatch && photoAttemptNumber <= 1) {
    const index = Number(workLunchReturnMatch[1]);
    if (Number.isInteger(index) && index >= 0 && index < FIRST_FROG_CLUE_WORK_LUNCH_RETURN_LINES.length) {
      return { kind: "work-lunch-return-line", index };
    }
  }

  const postPhotoMatch = initialSceneJumpStepId.match(/^post-photo-(\d+)$/);
  if (postPhotoMatch) {
    const index = Number(postPhotoMatch[1]);
    const postPhotoLines = getFrogDiaryCluePostPhotoLines(photoAttemptNumber, 3);
    if (Number.isInteger(index) && index >= 0 && index < postPhotoLines.length) {
      return { kind: "post-photo", index };
    }
  }

  return defaultPhase;
}

const frogPounceDropIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-96px) scale(0.9);
    filter: blur(2px);
  }
  48% {
    opacity: 0.86;
    transform: translateY(-16px) scale(0.98);
    filter: blur(0.5px);
  }
  78% {
    opacity: 1;
    transform: translateY(8px) scale(1.03);
    filter: blur(0);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
`;

function getPhaseKey(phase: FrogDiaryCluePhase, stageId: string) {
  if (phase.kind === "line") return `${stageId}-line-${phase.index}`;
  if (phase.kind === "flyer-wind-minigame") return `${stageId}-flyer-wind-minigame`;
  if (phase.kind === "escape-line") return `${stageId}-escape`;
  if (phase.kind === "waiting-diary") return `${stageId}-waiting-diary`;
  if (phase.kind === "work-lunch-return-line") return `${stageId}-return-${phase.index}`;
  if (phase.kind === "post-photo") return `${stageId}-post-${phase.index}`;
  return `${stageId}-photo`;
}

function getFrogDiaryClueSceneJumpStepId(phase: FrogDiaryCluePhase) {
  if (phase.kind === "line") return `line-${phase.index}`;
  if (phase.kind === "flyer-wind-minigame") return "flyer-wind-minigame";
  if (phase.kind === "photo") return "photo";
  if (phase.kind === "escape-line") return "escape-line";
  if (phase.kind === "waiting-diary") return "waiting-diary";
  if (phase.kind === "work-lunch-return-line") return `work-lunch-return-${phase.index}`;
  if (phase.kind === "post-photo") return `post-photo-${phase.index}`;
  return "current";
}

function getAvatar(line: FrogDiaryClueLine | null): { spriteId: AvatarSpriteId; frameIndex: number } | null {
  if (!line) return null;
  if (line.speaker === "小貝狗") return { spriteId: "beigo", frameIndex: line.text.includes("小日獸") ? 2 : 0 };
  if (line.speaker === "店員") {
    return { spriteId: "convenience-clerk", frameIndex: line.text.includes("抱歉") || line.text.includes("說錯") ? 1 : 0 };
  }
  if (line.speaker !== "小麥") return null;
  if (line.text.includes("沒有拍到正臉")) return { spriteId: "mai", frameIndex: 34 };
  if (line.text.includes("忘記帶便當")) return { spriteId: "mai", frameIndex: 27 };
  if (line.text.includes("糟糕")) return { spriteId: "mai", frameIndex: 27 };
  if (line.text.includes("咦") || line.text.includes("等等")) return { spriteId: "mai", frameIndex: 14 };
  if (line.text.includes("是小日獸")) return { spriteId: "mai", frameIndex: 34 };
  if (line.text.includes("收集到了")) return { spriteId: "mai", frameIndex: 34 };
  return { spriteId: "mai", frameIndex: 0 };
}

export function FrogDiaryClueEventModal({
  stage,
  onFinish,
  savings,
  actionPower,
  fatigue,
  photoAttemptNumber,
  requiredPhotoAttempts = 3,
  initialSceneJumpStepId,
  onFirstClueDiaryReveal,
}: FrogDiaryClueEventModalProps) {
  const [phase, setPhase] = useState<FrogDiaryCluePhase>(() =>
    getInitialFrogDiaryCluePhase({
      stage,
      photoAttemptNumber,
      initialSceneJumpStepId,
    }),
  );
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [naturalImageSize, setNaturalImageSize] = useState<NaturalImageSize | null>(null);
  const [historyLines, setHistoryLines] = useState<EventHistoryLine[]>([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const hasRequestedFirstClueDiaryRevealRef = useRef(false);

  const typingMode = loadDialogTypingMode();
  const isFinalPhotoAttempt = photoAttemptNumber >= requiredPhotoAttempts;
  const shouldPlayStreetFlyerWindMinigame = stage.id === "street-flyer";
  const postPhotoLines = useMemo(
    () => getFrogDiaryCluePostPhotoLines(photoAttemptNumber, requiredPhotoAttempts),
    [photoAttemptNumber, requiredPhotoAttempts],
  );
  const sceneJumpSteps = useMemo(
    () =>
      buildFrogDiaryClueSceneJumpSteps({
        stage,
        photoAttemptNumber,
        requiredPhotoAttempts,
      }),
    [photoAttemptNumber, requiredPhotoAttempts, stage],
  );
  const line = useMemo(() => {
    if (phase.kind === "line") return stage.lines[phase.index] ?? null;
    if (phase.kind === "escape-line") return FIRST_FROG_CLUE_ESCAPE_LINE;
    if (phase.kind === "work-lunch-return-line") {
      return FIRST_FROG_CLUE_WORK_LUNCH_RETURN_LINES[phase.index] ?? null;
    }
    if (phase.kind === "post-photo") return postPhotoLines[phase.index] ?? null;
    return null;
  }, [phase, postPhotoLines, stage.lines]);
  const sourceText = line?.text ?? "";
  const isNarrationLine = line?.speaker === "旁白";
  const shouldItalicizeLine = Boolean(line?.isItalic || isNarrationLine);
  const sceneImage = line?.sceneImage ?? stage.sceneImage;
  const sceneColor = line?.sceneColor ?? stage.sceneColor;
  const sceneTitle = line?.sceneTitle ?? stage.sceneTitle;
  const sceneBackgroundSize = line?.sceneBackgroundSize ?? stage.sceneBackgroundSize;
  const phaseKey = getPhaseKey(phase, stage.id);
  const isPhotoMode = phase.kind === "photo";
  const isTypingComplete = isPhotoMode || !sourceText || displayText === sourceText;
  const avatar = getAvatar(line);
  const shouldShowFrogPounce =
    (phase.kind === "line" && phase.index >= Math.max(0, stage.lines.length - 2)) ||
    (phase.kind === "post-photo" && isFinalPhotoAttempt);

  useEffect(() => {
    setPhase(
      getInitialFrogDiaryCluePhase({
        stage,
        photoAttemptNumber,
        initialSceneJumpStepId,
      }),
    );
    setDisplayText("");
    setHistoryLines([]);
    hasRequestedFirstClueDiaryRevealRef.current = false;
  }, [initialSceneJumpStepId, stage.id]);

  useEffect(() => {
    const image = new Image();
    image.src = sceneImage;
    image.onload = () => {
      setNaturalImageSize({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
  }, [sceneImage]);

  useEffect(() => {
    if (!line) return;
    const isNarration = line.speaker === "旁白";
    setHistoryLines((current) =>
      current.some((item) => item.id === phaseKey)
        ? current
        : [
            ...current,
            {
              id: phaseKey,
              speaker: isNarration ? "" : line.speaker,
              text: line.text,
              isItalic: line.isItalic || isNarration,
            },
          ],
    );
  }, [line, phaseKey]);

  useEffect(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (!sourceText) {
      setDisplayText("");
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
  }, [sourceText, typingMode]);

  useEffect(() => {
    const currentStepId = getFrogDiaryClueSceneJumpStepId(phase);
    if (line) {
      dispatchSceneJumpContextChange({
        eventId: stage.eventId,
        kindLabel: "對話",
        speaker: line.speaker,
        text: line.text,
        steps: sceneJumpSteps,
        currentStepId,
      });
      return;
    }
    if (phase.kind === "photo") {
      dispatchSceneJumpContextChange({
        eventId: stage.eventId,
        kindLabel: "拍照",
        text: isFinalPhotoAttempt ? "拍下青蛙小日獸" : "拍下青蛙線索",
        steps: sceneJumpSteps,
        currentStepId,
      });
      return;
    }
    if (phase.kind === "flyer-wind-minigame") {
      dispatchSceneJumpContextChange({
        eventId: stage.eventId,
        kindLabel: "小遊戲",
        text: "傳單被風吹散了",
        steps: sceneJumpSteps,
        currentStepId,
      });
      return;
    }
    if (phase.kind === "waiting-diary") {
      dispatchSceneJumpContextChange({
        eventId: stage.eventId,
        kindLabel: "日記",
        text: "日記碎片浮現",
        steps: sceneJumpSteps,
        currentStepId,
      });
    }
  }, [isFinalPhotoAttempt, line, phase, sceneJumpSteps, stage.eventId]);

  useEffect(() => {
    return () => {
      dispatchSceneJumpContextChange({ eventId: stage.eventId, clear: true });
    };
  }, [stage.eventId]);

  const completeTyping = () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setDisplayText(sourceText);
  };

  const handleContinue = () => {
    if (phase.kind === "photo") return;
    if (sourceText && displayText !== sourceText) {
      completeTyping();
      return;
    }
    if (phase.kind === "line") {
      if (
        shouldPlayStreetFlyerWindMinigame &&
        phase.index === STREET_FLYER_WIND_MINIGAME_AFTER_LINE_INDEX
      ) {
        setPhase({ kind: "flyer-wind-minigame" });
        return;
      }
      if (phase.index < stage.lines.length - 1) {
        setPhase({ kind: "line", index: phase.index + 1 });
        return;
      }
      setPhase({ kind: "photo" });
      return;
    }
    if (phase.kind === "escape-line") {
      if (photoAttemptNumber <= 1 && onFirstClueDiaryReveal && !hasRequestedFirstClueDiaryRevealRef.current) {
        hasRequestedFirstClueDiaryRevealRef.current = true;
        setPhase({ kind: "waiting-diary" });
        onFirstClueDiaryReveal(() => {
          setPhase({ kind: "work-lunch-return-line", index: 0 });
        });
        return;
      }
      setPhase({ kind: "post-photo", index: 0 });
      return;
    }
    if (phase.kind === "waiting-diary") {
      return;
    }
    if (phase.kind === "work-lunch-return-line") {
      if (phase.index < FIRST_FROG_CLUE_WORK_LUNCH_RETURN_LINES.length - 1) {
        setPhase({ kind: "work-lunch-return-line", index: phase.index + 1 });
        return;
      }
      onFinish({
        result: "clue-photo",
        attemptAlreadyRecorded: true,
        diaryRevealCompleted: true,
        returnToWorkAndOffwork: true,
      });
      return;
    }
    if (phase.kind !== "post-photo") return;
    if (phase.index < postPhotoLines.length - 1) {
      setPhase({ kind: "post-photo", index: phase.index + 1 });
      return;
    }
    onFinish({ result: isFinalPhotoAttempt ? "captured" : "clue-photo" });
  };

  const handleConfirmPolaroid = (capture: PhotoCaptureResult) => {
    const photoSnapshot = {
      sourceImage: capture.sourceImage,
      previewImage: capture.framePreviewUrl,
      dogCoveragePercent: capture.score,
      cameraFrameRect: capture.normalizedCameraFrameRect,
      capturedRect: capture.normalizedCroppedRect,
    };
    recordPhotoCapture(photoSnapshot);
    recordStreetForgotLunchFrogPhotoCapture(photoAttemptNumber, photoSnapshot);
    if (photoAttemptNumber <= 1) {
      setPhase({ kind: "escape-line" });
      return;
    }
    if (!isFinalPhotoAttempt) {
      onFinish({ result: "clue-photo" });
      return;
    }
    setPhase({ kind: "post-photo", index: 0 });
  };

  if (phase.kind === "flyer-wind-minigame") {
    return (
      <FrogFlyerWindMinigame
        sceneImage={stage.sceneImage}
        sceneColor={stage.sceneColor}
        savings={savings}
        actionPower={actionPower}
        fatigue={fatigue}
        onComplete={() => {
          setPhase({ kind: "line", index: STREET_FLYER_WIND_MINIGAME_AFTER_LINE_INDEX + 1 });
        }}
      />
    );
  }

  return (
    <Flex position="absolute" inset="0" zIndex={50} direction="column" bgColor="#EDE7DE">
      <Flex
        opacity={isPhotoMode ? 0 : 1}
        transform={isPhotoMode ? "translateY(30px)" : "translateY(0px)"}
        pointerEvents={isPhotoMode ? "none" : "auto"}
        transition="opacity 0.35s ease, transform 0.35s ease"
      >
        <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />
      </Flex>

      <Flex
        ref={backgroundRef}
        flex={isPhotoMode ? undefined : "1"}
        bgImage={`url("${sceneImage}")`}
        bgSize={sceneBackgroundSize ?? "cover"}
        backgroundPosition="center center"
        bgRepeat="no-repeat"
        bgColor={isPhotoMode ? "#050505" : sceneColor}
        position={isPhotoMode ? "absolute" : "relative"}
        inset={isPhotoMode ? "0" : undefined}
        zIndex={isPhotoMode ? 3 : undefined}
        justifyContent="center"
        alignItems="flex-start"
        pt={isPhotoMode ? "0" : "18px"}
      >
        <Text
          color="#F5EFE5"
          fontSize="12px"
          textShadow="0 2px 6px rgba(0,0,0,0.45)"
          mt={isPhotoMode ? "18px" : "0"}
        >
          {sceneTitle}
        </Text>

        {shouldShowFrogPounce && !isPhotoMode ? (
          <img
            src={FROG_POUNCE_IMAGE_PATH}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              position: "absolute",
              left: `${stage.frogTargetRect.x * 100}%`,
              top: `${stage.frogTargetRect.y * 100}%`,
              width: `${stage.frogTargetRect.width * 100}%`,
              height: `${stage.frogTargetRect.height * 100}%`,
              objectFit: "contain",
              pointerEvents: "none",
              zIndex: 1,
              transformOrigin: "center bottom",
              animation: `${frogPounceDropIn} 920ms cubic-bezier(0.18, 0.9, 0.22, 1) both`,
            }}
          />
        ) : null}

        <EventPhotoCaptureLayer
          enabled={isPhotoMode}
          resetNonce={0}
          backgroundRef={backgroundRef}
          backgroundImageSrc={sceneImage}
          naturalImageSize={naturalImageSize}
          fitMode="cover"
          targetRectNormalized={stage.frogTargetRect}
          captureOverlays={[{ imageSrc: FROG_POUNCE_IMAGE_PATH, rectNormalized: stage.frogTargetRect }]}
          passScore={60}
          hintText={isFinalPhotoAttempt ? "點擊畫面或空白鍵捕捉青蛙小日獸" : "點擊畫面或空白鍵拍下青蛙線索"}
          tutorialTitle={isFinalPhotoAttempt ? "拍下青蛙小日獸" : undefined}
          tutorialLines={
            isFinalPhotoAttempt
              ? ["把取景框對準青蛙小日獸的位置。", "拍下牠跳出來的一瞬間。"]
              : []
          }
          {...SUNBEAST_RETAKE_CAPTURE_PROPS}
          onConfirm={handleConfirmPolaroid}
        />
      </Flex>

      <Flex
        position="absolute"
        left="14px"
        bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
        transform={isPhotoMode ? "translateY(30px)" : "translateY(0px)"}
        zIndex={4}
        pointerEvents="none"
        opacity={isPhotoMode || !avatar ? 0 : 1}
        transition="opacity 0.35s ease, transform 0.35s ease"
      >
        {avatar ? <EventAvatarSprite spriteId={avatar.spriteId} frameIndex={avatar.frameIndex} /> : null}
      </Flex>

      <Flex
        opacity={isPhotoMode ? 0 : 1}
        transform={isPhotoMode ? "translateY(30px)" : "translateY(0px)"}
        pointerEvents={isPhotoMode ? "none" : "auto"}
        transition="opacity 0.35s ease, transform 0.35s ease"
      >
        <DialogQuickActions onOpenOptions={() => {}} onOpenHistory={() => setIsHistoryOpen(true)} />
      </Flex>

      <Flex
        w="100%"
        direction="column"
        opacity={isPhotoMode ? 0 : 1}
        transform={isPhotoMode ? "translateY(30px)" : "translateY(0px)"}
        pointerEvents={isPhotoMode ? "none" : "auto"}
        transition="opacity 0.35s ease, transform 0.35s ease"
      >
        <EventDialogPanel>
          {line && !isNarrationLine ? (
            <Text color="white" fontWeight="700">
              {line.speaker}
            </Text>
          ) : line && isNarrationLine ? (
            <Text color="white" fontWeight="700" visibility="hidden" aria-hidden="true">
              旁白
            </Text>
          ) : !line ? (
            <Text color="white" fontWeight="700">
              旁白
            </Text>
          ) : null}
          <Flex flex="1" minH="0" direction="column" justifyContent="center">
            <Text color="white" fontSize="16px" lineHeight="1.5" fontStyle={shouldItalicizeLine ? "italic" : undefined}>
              {displayText}
            </Text>
          </Flex>
          <EventContinueAction enabled={isTypingComplete} onClick={handleContinue} />
        </EventDialogPanel>
      </Flex>

      <EventHistoryOverlay
        title="事件回顧"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        lines={historyLines}
      />
    </Flex>
  );
}
