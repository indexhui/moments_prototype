"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { OFFICE_SUNBEAST_GOAT_EVENT_COPY } from "@/lib/game/events";
import { PlayerStatusBar } from "@/components/game/PlayerStatusBar";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import {
  EventDialogPanel,
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

const OFFICE_DAY_IMAGE = "/images/428出圖/背景/公司_白天.jpg";
const GOAT_CAPTURE_PHOTO_IMAGE = "/animals/goat.png";
const OFFICE_GOAT_TARGET_RECT = { x: 0.6, y: 0.32, width: 0.22, height: 0.28 };

type DialogLine = {
  speaker: string;
  text: string;
  innerThought?: boolean;
  avatarSpriteId?: "mai" | "beigo";
};

type GoatPhase =
  | { kind: "meeting-1"; index: number }
  | { kind: "meeting-2"; index: number }
  | { kind: "meeting-3"; index: number }
  | { kind: "photo" }
  | { kind: "post-photo"; index: number };

type OfficeSunbeastGoatEventModalProps = {
  onFinish: (fatigueIncrease: number) => void;
  savings: number;
  actionPower: number;
  fatigue: number;
};

function getLineList(phase: GoatPhase): readonly DialogLine[] | null {
  if (phase.kind === "meeting-1") return OFFICE_SUNBEAST_GOAT_EVENT_COPY.meetingOneLines;
  if (phase.kind === "meeting-2") return OFFICE_SUNBEAST_GOAT_EVENT_COPY.meetingTwoLines;
  if (phase.kind === "meeting-3") return OFFICE_SUNBEAST_GOAT_EVENT_COPY.meetingThreeLines;
  if (phase.kind === "post-photo") return OFFICE_SUNBEAST_GOAT_EVENT_COPY.postPhotoLines;
  return null;
}

function getCurrentLine(phase: GoatPhase): DialogLine | null {
  const lines = getLineList(phase);
  if (!lines) return null;
  if (phase.kind === "photo") return null;
  return lines[phase.index] ?? null;
}

function advanceWithinPhase(phase: GoatPhase): GoatPhase | null {
  if (phase.kind === "photo") return null;
  const lines = getLineList(phase);
  if (!lines) return null;
  if (phase.index < lines.length - 1) {
    return { ...phase, index: phase.index + 1 };
  }
  if (phase.kind === "meeting-1") return { kind: "meeting-2", index: 0 };
  if (phase.kind === "meeting-2") return { kind: "meeting-3", index: 0 };
  if (phase.kind === "meeting-3") return { kind: "photo" };
  if (phase.kind === "post-photo") return null;
  return null;
}

export function OfficeSunbeastGoatEventModal({
  onFinish,
  savings,
  actionPower,
  fatigue,
}: OfficeSunbeastGoatEventModalProps) {
  const [phase, setPhase] = useState<GoatPhase>({ kind: "meeting-1", index: 0 });
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [photoResetNonce, setPhotoResetNonce] = useState(0);
  const [naturalImageSize, setNaturalImageSize] = useState<NaturalImageSize | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingMode = loadDialogTypingMode();

  const currentLine = getCurrentLine(phase);
  const isPhotoMode = phase.kind === "photo";
  const sourceText = currentLine?.text ?? "";
  const isTypingComplete = isPhotoMode || !sourceText || displayText === sourceText;

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
    image.src = OFFICE_DAY_IMAGE;
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (!sourceText || isPhotoMode) {
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
  }, [sourceText, typingMode, isPhotoMode]);

  const historyLines = useMemo(() => {
    const items: Array<{ id: string; speaker: string; text: string }> = [];
    const pushPhase = (
      key: GoatPhase["kind"],
      lines: readonly DialogLine[],
      upToIndex: number,
    ) => {
      lines.forEach((line, index) => {
        if (index <= upToIndex) {
          items.push({ id: `${key}-${index}`, speaker: line.speaker, text: line.text });
        }
      });
    };
    const meeting1Reached = phase.kind !== "meeting-1";
    pushPhase(
      "meeting-1",
      OFFICE_SUNBEAST_GOAT_EVENT_COPY.meetingOneLines,
      meeting1Reached ? OFFICE_SUNBEAST_GOAT_EVENT_COPY.meetingOneLines.length - 1 : phase.index,
    );
    if (phase.kind === "meeting-2" || phase.kind === "meeting-3" || phase.kind === "photo" || phase.kind === "post-photo") {
      pushPhase(
        "meeting-2",
        OFFICE_SUNBEAST_GOAT_EVENT_COPY.meetingTwoLines,
        phase.kind === "meeting-2" ? phase.index : OFFICE_SUNBEAST_GOAT_EVENT_COPY.meetingTwoLines.length - 1,
      );
    }
    if (phase.kind === "meeting-3" || phase.kind === "photo" || phase.kind === "post-photo") {
      pushPhase(
        "meeting-3",
        OFFICE_SUNBEAST_GOAT_EVENT_COPY.meetingThreeLines,
        phase.kind === "meeting-3" ? phase.index : OFFICE_SUNBEAST_GOAT_EVENT_COPY.meetingThreeLines.length - 1,
      );
    }
    if (phase.kind === "post-photo") {
      pushPhase("post-photo", OFFICE_SUNBEAST_GOAT_EVENT_COPY.postPhotoLines, phase.index);
    }
    return items;
  }, [phase]);

  const completeTyping = () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setDisplayText(sourceText);
  };

  const handleContinue = () => {
    if (isPhotoMode) return;
    if (sourceText && displayText !== sourceText) {
      completeTyping();
      return;
    }
    const next = advanceWithinPhase(phase);
    if (!next) {
      onFinish(OFFICE_SUNBEAST_GOAT_EVENT_COPY.workFatigueIncrease);
      return;
    }
    if (next.kind === "photo") {
      setPhotoResetNonce((value) => value + 1);
    }
    setPhase(next);
  };

  const handlePhotoConfirm = (capture: PhotoCaptureResult) => {
    recordPhotoCapture({
      sourceImage: capture.sourceImage,
      previewImage: GOAT_CAPTURE_PHOTO_IMAGE,
      dogCoveragePercent: capture.score,
      cameraFrameRect: capture.normalizedCameraFrameRect,
      capturedRect: capture.normalizedCroppedRect,
    });
    setPhase({ kind: "post-photo", index: 0 });
  };

  const avatarSpriteId = currentLine?.avatarSpriteId ?? "mai";
  const shouldShowAvatar = Boolean(currentLine?.avatarSpriteId);

  return (
    <Flex position="absolute" inset="0" zIndex={55} direction="column" bgColor="#EDE7DE">
      <Flex
        display={isPhotoMode ? "none" : "flex"}
        transition="opacity 0.25s ease"
      >
        <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />
      </Flex>

      <Flex
        ref={backgroundRef}
        flex="1"
        bgImage={`url('${OFFICE_DAY_IMAGE}')`}
        bgSize={isPhotoMode ? "contain" : "cover"}
        backgroundPosition="center center"
        bgRepeat="no-repeat"
        bgColor={isPhotoMode ? "#1B1A18" : "transparent"}
        position="relative"
        justifyContent="center"
        alignItems="flex-start"
        pt="18px"
      >
        <Text color="#F5EFE5" fontSize="12px" textShadow="0 2px 6px rgba(0,0,0,0.45)">
          {OFFICE_SUNBEAST_GOAT_EVENT_COPY.sceneTitle}
        </Text>

        <EventPhotoCaptureLayer
          enabled={isPhotoMode}
          resetNonce={photoResetNonce}
          backgroundRef={backgroundRef}
          backgroundImageSrc={OFFICE_DAY_IMAGE}
          naturalImageSize={naturalImageSize}
          fitMode="contain"
          targetRectNormalized={OFFICE_GOAT_TARGET_RECT}
          passScore={55}
          hintText="點擊快門捕捉小日獸"
          tutorialTitle="拍下山羊小日獸"
          tutorialLines={[
            "趁著會議室一片混亂，找準同事 A 頭上的角入鏡。",
            "白色框會由上往下掃過畫面，抓準時機按下快門。",
          ]}
          tutorialConfirmLabel="開始拍照"
          onConfirm={handlePhotoConfirm}
        />
      </Flex>

      <Flex
        position="absolute"
        left="14px"
        bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
        zIndex={4}
        pointerEvents="none"
        opacity={isPhotoMode || !shouldShowAvatar ? 0 : 1}
        transition="opacity 0.35s ease"
      >
        <EventAvatarSprite spriteId={avatarSpriteId} frameIndex={0} />
      </Flex>

      <Flex
        opacity={isPhotoMode ? 0 : 1}
        pointerEvents={isPhotoMode ? "none" : "auto"}
        transition="opacity 0.35s ease"
      >
        <DialogQuickActions onOpenOptions={() => {}} onOpenHistory={() => setIsHistoryOpen(true)} />
      </Flex>

      {!isPhotoMode && currentLine ? (
        <EventDialogPanel>
          <Text color="white" fontWeight="700">
            {currentLine.speaker}
          </Text>
          <Flex flex="1" minH="0" direction="column">
            <Text
              color={currentLine.innerThought ? "#F6E2C7" : "white"}
              fontSize="16px"
              fontStyle={currentLine.innerThought ? "italic" : "normal"}
              lineHeight="1.5"
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
