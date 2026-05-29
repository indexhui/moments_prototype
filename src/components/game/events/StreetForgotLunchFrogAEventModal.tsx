"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { STREET_FORGOT_LUNCH_FROG_A_EVENT_COPY } from "@/lib/game/events";
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

type FrogAOutcome = {
  result: "captured";
};

type StreetForgotLunchFrogAEventModalProps = {
  onFinish: (outcome: FrogAOutcome) => void;
  savings: number;
  actionPower: number;
  fatigue: number;
};

type FrogAPhase =
  | "street-0"
  | "street-1"
  | "street-2"
  | "street-3"
  | "street-4"
  | "work-half"
  | "mart-0"
  | "mart-1"
  | "mart-2"
  | "mart-3"
  | "mart-4"
  | "mart-5"
  | "photo"
  | "post-0"
  | "post-1";

const workWave = keyframes`
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`;

const FROG_A_PHASE_ORDER: FrogAPhase[] = [
  "street-0",
  "street-1",
  "street-2",
  "street-3",
  "street-4",
  "work-half",
  "mart-0",
  "mart-1",
  "mart-2",
  "mart-3",
  "mart-4",
  "mart-5",
  "photo",
  "post-0",
  "post-1",
];

const FROG_POUNCE_IMAGE_PATH = "/images/animals/青蛙_撲.png";
const FROG_A_CAPTURE_RECT = { x: 0.31, y: 0.285, width: 0.38, height: 0.175 };
const FROG_A_CAPTURE_OVERLAYS = [{ imageSrc: FROG_POUNCE_IMAGE_PATH, rectNormalized: FROG_A_CAPTURE_RECT }];

function nextFrogAPhase(current: FrogAPhase): FrogAPhase | null {
  const index = FROG_A_PHASE_ORDER.indexOf(current);
  if (index < 0 || index >= FROG_A_PHASE_ORDER.length - 1) return null;
  return FROG_A_PHASE_ORDER[index + 1];
}

function getFrogASceneMeta(phase: FrogAPhase) {
  if (phase.startsWith("street")) return { title: "街道", bgImage: "/images/street.jpg" };
  if (phase === "work-half") return { title: "前往便利商店", bgImage: "/images/outside/mart.jpg" };
  if (phase === "mart-5" || phase === "photo") return { title: "便利商店", bgImage: "/images/outside/mart.jpg" };
  if (phase.startsWith("mart") || phase.startsWith("post")) {
    return { title: "便利商店", bgImage: "/images/outside/mart.jpg" };
  }
  return { title: "街道", bgImage: "/images/street.jpg" };
}

function getFrogAPhaseLine(phase: FrogAPhase): { speaker: string; text: string } | null {
  if (phase === "street-0") return STREET_FORGOT_LUNCH_FROG_A_EVENT_COPY.streetLines[0];
  if (phase === "street-1") return STREET_FORGOT_LUNCH_FROG_A_EVENT_COPY.streetLines[1];
  if (phase === "street-2") return STREET_FORGOT_LUNCH_FROG_A_EVENT_COPY.streetLines[2];
  if (phase === "street-3") return STREET_FORGOT_LUNCH_FROG_A_EVENT_COPY.streetLines[3];
  if (phase === "street-4") return STREET_FORGOT_LUNCH_FROG_A_EVENT_COPY.streetLines[4];
  if (phase === "mart-0") return STREET_FORGOT_LUNCH_FROG_A_EVENT_COPY.martLines[0];
  if (phase === "mart-1") return STREET_FORGOT_LUNCH_FROG_A_EVENT_COPY.martLines[1];
  if (phase === "mart-2") return STREET_FORGOT_LUNCH_FROG_A_EVENT_COPY.martLines[2];
  if (phase === "mart-3") return STREET_FORGOT_LUNCH_FROG_A_EVENT_COPY.martLines[3];
  if (phase === "mart-4") return STREET_FORGOT_LUNCH_FROG_A_EVENT_COPY.martLines[4];
  if (phase === "mart-5") return STREET_FORGOT_LUNCH_FROG_A_EVENT_COPY.martLines[5];
  if (phase === "post-0") return STREET_FORGOT_LUNCH_FROG_A_EVENT_COPY.postPhotoLines[0];
  if (phase === "post-1") return STREET_FORGOT_LUNCH_FROG_A_EVENT_COPY.postPhotoLines[1];
  return null;
}

export function StreetForgotLunchFrogAEventModal({
  onFinish,
  savings,
  actionPower,
  fatigue,
}: StreetForgotLunchFrogAEventModalProps) {
  const [phase, setPhase] = useState<FrogAPhase>("street-0");
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [photoResetNonce, setPhotoResetNonce] = useState(0);
  const [naturalImageSize, setNaturalImageSize] = useState<NaturalImageSize | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);

  const typingMode = loadDialogTypingMode();
  const sceneMeta = getFrogASceneMeta(phase);
  const line = getFrogAPhaseLine(phase);
  const sourceText = line?.text ?? "";
  const isTypingComplete = phase === "work-half" || phase === "photo" || displayText === sourceText;
  const isPhotoMode = phase === "photo";
  const shouldShowFrogPounce = phase === "mart-5";
  const avatarSpriteId: AvatarSpriteId = line?.speaker === "小貝狗" ? "beigo" : "mai";
  const avatarFrameIndex = useMemo(() => {
    if (phase === "street-0") return 27;
    if (phase === "street-2") return 13;
    if (phase === "street-3") return 24;
    if (phase === "street-4") return 36;
    if (phase === "mart-0") return 1;
    if (phase === "mart-4") return 4;
    return 0;
  }, [phase]);
  const shouldShowAvatar = Boolean(line?.speaker === "小麥" || line?.speaker === "小貝狗");

  useEffect(() => {
    const image = new Image();
    image.src = sceneMeta.bgImage;
    image.onload = () => {
      setNaturalImageSize({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
  }, [sceneMeta.bgImage]);

  const historyLines = useMemo(() => {
    const lines: Array<{ id: string; speaker: string; text: string }> = [];
    FROG_A_PHASE_ORDER.forEach((item) => {
      if (item === "work-half" || item === "photo") return;
      const phaseLine = getFrogAPhaseLine(item);
      if (!phaseLine) return;
      if (FROG_A_PHASE_ORDER.indexOf(item) <= FROG_A_PHASE_ORDER.indexOf(phase)) {
        lines.push({ id: item, speaker: phaseLine.speaker, text: phaseLine.text });
      }
    });
    return lines;
  }, [phase]);

  useEffect(() => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (phase !== "work-half") return;
    transitionTimerRef.current = setTimeout(() => {
      setPhase("mart-0");
    }, 1700);
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, [phase]);

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

  const handleContinue = () => {
    if (phase === "work-half" || phase === "photo") return;
    if (sourceText && displayText !== sourceText) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setDisplayText(sourceText);
      return;
    }
    if (phase === "mart-5") {
      setPhotoResetNonce((value) => value + 1);
    }
    const next = nextFrogAPhase(phase);
    if (!next) {
      onFinish({ result: "captured" });
      return;
    }
    setPhase(next);
  };

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
        bgImage={`url('${sceneMeta.bgImage}')`}
        bgSize="cover"
        backgroundPosition="center center"
        bgRepeat="no-repeat"
        bgColor={isPhotoMode ? "#1B1A18" : "transparent"}
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
          {sceneMeta.title}
        </Text>

        {shouldShowFrogPounce ? (
          <img
            src={FROG_POUNCE_IMAGE_PATH}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              position: "absolute",
              left: `${FROG_A_CAPTURE_RECT.x * 100}%`,
              top: `${FROG_A_CAPTURE_RECT.y * 100}%`,
              width: `${FROG_A_CAPTURE_RECT.width * 100}%`,
              height: `${FROG_A_CAPTURE_RECT.height * 100}%`,
              objectFit: "contain",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        ) : null}

        {phase === "work-half" ? (
          <Flex position="absolute" inset="0" bgColor="rgba(25,21,17,0.32)" alignItems="center" justifyContent="center">
            <Text color="white" fontSize="28px" fontWeight="800" textShadow="0 4px 10px rgba(0,0,0,0.35)">
              {"前往便利商店...".split("").map((char, index) => (
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

        <EventPhotoCaptureLayer
          enabled={isPhotoMode}
          resetNonce={photoResetNonce}
          backgroundRef={backgroundRef}
          backgroundImageSrc={sceneMeta.bgImage}
          naturalImageSize={naturalImageSize}
          fitMode="cover"
          targetRectNormalized={FROG_A_CAPTURE_RECT}
          captureOverlays={FROG_A_CAPTURE_OVERLAYS}
          passScore={60}
          hintText="點擊畫面或空白鍵捕捉小日獸"
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
        opacity={isPhotoMode || !shouldShowAvatar ? 0 : 1}
        transition="opacity 0.35s ease, transform 0.35s ease"
      >
        <EventAvatarSprite spriteId={avatarSpriteId} frameIndex={avatarFrameIndex} />
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
          {line ? (
            <Text color="white" fontWeight="700">
              {line.speaker}
            </Text>
          ) : (
            <Text color="white" fontWeight="700">
              移動中
            </Text>
          )}
          <Flex flex="1" minH="0" direction="column">
            <Text color="white" fontSize="16px" lineHeight="1.5">
              {phase === "work-half" ? "（前往便利商店）" : displayText}
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
