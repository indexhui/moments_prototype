"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { BUS_SUNBEAST_CAT_EVENT_COPY } from "@/lib/game/events";
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
import type { AvatarSpriteId } from "@/components/game/events/EventAvatarSprite";
import { getTypingAdvance, loadDialogTypingMode } from "@/lib/game/dialogTyping";
import { recordPhotoCapture } from "@/lib/game/playerProgress";

type CatPhase =
  | "line-0"
  | "line-1"
  | "line-2"
  | "line-3"
  | "line-4"
  | "line-5"
  | "line-6"
  | "line-7"
  | "line-8"
  | "line-9"
  | "line-10"
  | "line-11"
  | "photo"
  | "post-0"
  | "post-1"
  | "post-2"
  | "post-3";

const PHASE_ORDER: CatPhase[] = [
  "line-0",
  "line-1",
  "line-2",
  "line-3",
  "line-4",
  "line-5",
  "line-6",
  "line-7",
  "line-8",
  "line-9",
  "line-10",
  "line-11",
  "photo",
  "post-0",
  "post-1",
  "post-2",
  "post-3",
];

const BUS_STOP_IMAGE = "/images/outside/bus.jpg";

function getLine(phase: CatPhase) {
  if (phase.startsWith("line-")) {
    const index = Number(phase.replace("line-", ""));
    if (!Number.isFinite(index)) return null;
    return BUS_SUNBEAST_CAT_EVENT_COPY.lines[index] ?? null;
  }
  if (phase.startsWith("post-")) {
    const index = Number(phase.replace("post-", ""));
    if (!Number.isFinite(index)) return null;
    return BUS_SUNBEAST_CAT_EVENT_COPY.postPhotoLines[index] ?? null;
  }
  return null;
}

type BusSunbeastCatEventModalProps = {
  onFinish: () => void;
  savings: number;
  actionPower: number;
  fatigue: number;
};

export function BusSunbeastCatEventModal({
  onFinish,
  savings,
  actionPower,
  fatigue,
}: BusSunbeastCatEventModalProps) {
  const [phase, setPhase] = useState<CatPhase>("line-0");
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [photoResetNonce, setPhotoResetNonce] = useState(0);
  const [naturalImageSize, setNaturalImageSize] = useState<NaturalImageSize | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const typingMode = loadDialogTypingMode();
  const line = getLine(phase);
  const sourceText = line?.text ?? "";
  const isPhotoMode = phase === "photo";
  const isTypingComplete = isPhotoMode || displayText === sourceText;

  useEffect(() => {
    const image = new Image();
    image.src = BUS_STOP_IMAGE;
    image.onload = () => {
      setNaturalImageSize({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
  }, []);

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

  const historyLines = useMemo(() => {
    const lines: Array<{ id: string; speaker: string; text: string }> = [];
    PHASE_ORDER.forEach((item) => {
      if (item === "photo") return;
      const itemLine = getLine(item);
      if (!itemLine) return;
      if (PHASE_ORDER.indexOf(item) <= PHASE_ORDER.indexOf(phase)) {
        lines.push({
          id: item,
          speaker: itemLine.speaker,
          text: itemLine.text,
        });
      }
    });
    return lines;
  }, [phase]);

  const handleContinue = () => {
    if (!isPhotoMode && sourceText && displayText !== sourceText) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setDisplayText(sourceText);
      return;
    }
    if (phase === "line-11") {
      setPhotoResetNonce((value) => value + 1);
      setPhase("photo");
      return;
    }
    if (phase === "photo") return;
    if (phase === "post-3") {
      onFinish();
      return;
    }
    const currentIndex = PHASE_ORDER.indexOf(phase);
    if (currentIndex < PHASE_ORDER.length - 1) {
      setPhase(PHASE_ORDER[currentIndex + 1]);
    }
  };

  const handleConfirmPolaroid = (capture: PhotoCaptureResult) => {
    recordPhotoCapture({
      sourceImage: capture.sourceImage,
      previewImage: capture.framePreviewUrl,
      dogCoveragePercent: capture.score,
      cameraFrameRect: capture.normalizedCameraFrameRect,
      capturedRect: capture.normalizedCroppedRect,
    });
    setPhase("post-0");
  };

  const avatarSpriteId: AvatarSpriteId = line?.speaker === "小貝狗" ? "beigo" : "mai";
  const shouldShowAvatar = Boolean(line?.speaker === "小麥" || line?.speaker === "小貝狗");

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
        flex="1"
        bgImage={`url('${BUS_STOP_IMAGE}')`}
        bgSize={isPhotoMode ? "contain" : "cover"}
        backgroundPosition="center center"
        bgRepeat="no-repeat"
        bgColor={isPhotoMode ? "#1B1A18" : "transparent"}
        position="relative"
        justifyContent="center"
        alignItems="flex-start"
        pt="18px"
      >
        {isPhotoMode ? (
          <Flex
            position="absolute"
            left="62%"
            top="21%"
            transform="translateX(-50%)"
            zIndex={5}
            pointerEvents="none"
          >
            <Text fontSize="54px" filter="drop-shadow(0 8px 12px rgba(0,0,0,0.35))">
              🐈
            </Text>
          </Flex>
        ) : null}

        <EventPhotoCaptureLayer
          enabled={isPhotoMode}
          resetNonce={photoResetNonce}
          backgroundRef={backgroundRef}
          backgroundImageSrc={BUS_STOP_IMAGE}
          naturalImageSize={naturalImageSize}
          fitMode="contain"
          targetRectNormalized={{ x: 0.53, y: 0.12, width: 0.22, height: 0.22 }}
          passScore={60}
          hintText="點擊快門捕捉小日獸"
          onConfirm={handleConfirmPolaroid}
        />

        <Text color="#F5EFE5" fontSize="12px" textShadow="0 2px 6px rgba(0,0,0,0.45)">
          {BUS_SUNBEAST_CAT_EVENT_COPY.sceneTitle}
        </Text>
      </Flex>

      <Flex
        position="absolute"
        left="14px"
        bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
        transform={isPhotoMode ? "translateY(30px)" : "translateY(0px)"}
        zIndex={4}
        pointerEvents="none"
        opacity={isPhotoMode || !shouldShowAvatar ? 0 : 1}
        transition="opacity 0.35s ease, transform 0.35s ease"
      >
        <EventAvatarSprite spriteId={avatarSpriteId} frameIndex={0} />
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
          <Text color="white" fontWeight="700">
            {line?.speaker ?? "旁白"}
          </Text>
          <Flex flex="1" minH="0" direction="column">
            <Text color="white" fontSize="16px" lineHeight="1.5">
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
