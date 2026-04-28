"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { METRO_SUNBEAST_GOAT_EVENT_COPY } from "@/lib/game/events";
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
} from "@/components/game/events/EventPhotoCaptureLayer";
import type { AvatarSpriteId } from "@/components/game/events/EventAvatarSprite";
import { getTypingAdvance, loadDialogTypingMode } from "@/lib/game/dialogTyping";

const METRO_CARRIAGE_IMAGE = "/images/428出圖/背景/捷運.png";
const METRO_ESCALATOR_IMAGE = "/images/outside/mrt_escalator_entrance.jpg";
const METRO_ESCALATOR_GOAT_IMAGE = "/images/outside/mrt_escalator_entrance_goat.jpg";

type GoatPhase =
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
  | "photo";

const PHASE_ORDER: GoatPhase[] = [
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
];

type MetroSunbeastGoatEventModalProps = {
  onFinish: () => void;
  savings: number;
  actionPower: number;
  fatigue: number;
};

function getLine(phase: GoatPhase) {
  if (!phase.startsWith("line-")) return null;
  const index = Number(phase.replace("line-", ""));
  if (!Number.isFinite(index)) return null;
  return METRO_SUNBEAST_GOAT_EVENT_COPY.lines[index] ?? null;
}

function getBackgroundImage(phase: GoatPhase) {
  if (phase === "line-0" || phase === "line-1" || phase === "line-2" || phase === "line-3" || phase === "line-4") {
    return METRO_CARRIAGE_IMAGE;
  }
  if (phase === "line-9" || phase === "line-10" || phase === "line-11") {
    return METRO_ESCALATOR_GOAT_IMAGE;
  }
  if (phase === "photo") {
    return METRO_ESCALATOR_GOAT_IMAGE;
  }
  return METRO_ESCALATOR_IMAGE;
}

export function MetroSunbeastGoatEventModal({
  onFinish,
  savings,
  actionPower,
  fatigue,
}: MetroSunbeastGoatEventModalProps) {
  const [phase, setPhase] = useState<GoatPhase>("line-0");
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [photoResetNonce, setPhotoResetNonce] = useState(0);
  const [naturalImageSize, setNaturalImageSize] = useState<NaturalImageSize | null>(null);
  const [resolvedGoatImage, setResolvedGoatImage] = useState(METRO_ESCALATOR_IMAGE);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const typingMode = loadDialogTypingMode();
  const line = getLine(phase);
  const sourceText = line?.text ?? "";
  const isPhotoMode = phase === "photo";
  const isTypingComplete = isPhotoMode || displayText === sourceText;
  const fallbackSafeBackgroundImage =
    getBackgroundImage(phase) === METRO_ESCALATOR_GOAT_IMAGE
      ? resolvedGoatImage
      : getBackgroundImage(phase);
  const backgroundImage = fallbackSafeBackgroundImage;

  useEffect(() => {
    const probe = new Image();
    probe.src = METRO_ESCALATOR_GOAT_IMAGE;
    probe.onload = () => setResolvedGoatImage(METRO_ESCALATOR_GOAT_IMAGE);
    probe.onerror = () => setResolvedGoatImage(METRO_ESCALATOR_IMAGE);
  }, []);

  useEffect(() => {
    const image = new Image();
    image.src = backgroundImage;
    image.onload = () => {
      setNaturalImageSize({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
  }, [backgroundImage]);

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
      if (!item.startsWith("line-")) return;
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
    const currentIndex = PHASE_ORDER.indexOf(phase);
    if (currentIndex < PHASE_ORDER.length - 1) {
      setPhase(PHASE_ORDER[currentIndex + 1]);
      return;
    }
    onFinish();
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
        bgImage={`url('${backgroundImage}')`}
        bgSize={isPhotoMode ? "contain" : "cover"}
        backgroundPosition="center center"
        bgRepeat="no-repeat"
        bgColor={isPhotoMode ? "#1B1A18" : "transparent"}
        position="relative"
        justifyContent="center"
        alignItems="flex-start"
        pt="18px"
      >
        <EventPhotoCaptureLayer
          enabled={isPhotoMode}
          resetNonce={photoResetNonce}
          backgroundRef={backgroundRef}
          backgroundImageSrc={backgroundImage}
          naturalImageSize={naturalImageSize}
          fitMode="contain"
          targetRectNormalized={{ x: 0.43, y: 0.18, width: 0.24, height: 0.3 }}
          passScore={30}
          hintText="點擊快門捕捉小日獸"
          onConfirm={() => onFinish()}
        />

        <Text color="#F5EFE5" fontSize="12px" textShadow="0 2px 6px rgba(0,0,0,0.45)">
          {METRO_SUNBEAST_GOAT_EVENT_COPY.sceneTitle}
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
