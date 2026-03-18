"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { METRO_FIRST_SUNBEAST_DOG_EVENT_COPY } from "@/lib/game/events";
import { PlayerStatusBar } from "@/components/game/PlayerStatusBar";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import {
  EventDialogPanel,
  EVENT_DIALOG_HEIGHT,
} from "@/components/game/events/EventDialogPanel";
import { useBackgroundShake } from "@/components/game/events/useBackgroundShake";
import { EventBackgroundFxLayer } from "@/components/game/events/EventBackgroundFxLayer";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { DialogQuickActions } from "@/components/game/events/DialogQuickActions";
import { EventHistoryOverlay } from "@/components/game/events/EventHistoryOverlay";
import { FaCamera } from "react-icons/fa6";
import {
  GAME_PHOTO_CHEAT_TRIGGER,
  type PhotoCheatPayload,
} from "@/lib/game/photoCheatBus";
import { recordPhotoCapture } from "@/lib/game/playerProgress";

type EventStep =
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
  | "line-12"
  | "line-13"
  | "line-14";
type TypewriterMode = "char" | "double-char" | "punctuated" | "pause";

type MetroFirstSunbeastDogEventModalProps = {
  onFinish: () => void;
  savings: number;
  actionPower: number;
  fatigue: number;
};

const EVENT_STEPS: EventStep[] = [
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
  "line-12",
  "line-13",
  "line-14",
];

const cameraFrameSweep = keyframes`
  0% {
    transform: translate(-50%, -140px);
    opacity: 0;
  }
  8% {
    opacity: 1;
  }
  82% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, 430px);
    opacity: 0;
  }
`;
const cameraShutterFlash = keyframes`
  0% { opacity: 0; }
  12% { opacity: 0.95; }
  100% { opacity: 0; }
`;

type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type NaturalImageSize = {
  width: number;
  height: number;
};

const POLAROID_CARD_WIDTH = 236;
const POLAROID_CARD_HEIGHT = 286; // 近似拍立得外框比例
const POLAROID_PHOTO_SIZE = 192; // 拍立得中間成像區（方形）
const POLAROID_TARGET_RATIO = 1; // width / height
const PHOTO_PASS_SCORE = 30;
const CAMERA_FRAME_WIDTH = 248;
const CAMERA_FRAME_HEIGHT = 168;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function fitRectToRatio(rect: CropRect, targetRatio: number): CropRect {
  if (rect.width <= 0 || rect.height <= 0) return rect;
  const currentRatio = rect.width / rect.height;
  if (Math.abs(currentRatio - targetRatio) < 0.0001) return rect;

  if (currentRatio > targetRatio) {
    const nextWidth = rect.height * targetRatio;
    const delta = (rect.width - nextWidth) / 2;
    return { ...rect, x: rect.x + delta, width: nextWidth };
  }
  const nextHeight = rect.width / targetRatio;
  const delta = (rect.height - nextHeight) / 2;
  return { ...rect, y: rect.y + delta, height: nextHeight };
}

function intersectRect(a: CropRect, b: CropRect): CropRect {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  return {
    x,
    y,
    width: Math.max(0, right - x),
    height: Math.max(0, bottom - y),
  };
}

function toImageCropRect(params: {
  frameInContainer: CropRect;
  containerWidth: number;
  containerHeight: number;
  natural: NaturalImageSize;
  targetRatio: number;
  fitMode: "cover" | "contain";
}): CropRect {
  const { frameInContainer, containerWidth, containerHeight, natural, targetRatio, fitMode } = params;
  const scale =
    fitMode === "contain"
      ? Math.min(containerWidth / natural.width, containerHeight / natural.height)
      : Math.max(containerWidth / natural.width, containerHeight / natural.height);
  const renderedWidth = natural.width * scale;
  const renderedHeight = natural.height * scale;
  const offsetX = (containerWidth - renderedWidth) / 2;
  const offsetY = (containerHeight - renderedHeight) / 2;

  const visibleFrame = intersectRect(frameInContainer, {
    x: 0,
    y: 0,
    width: containerWidth,
    height: containerHeight,
  });
  let mapped: CropRect = {
    x: (visibleFrame.x - offsetX) / scale,
    y: (visibleFrame.y - offsetY) / scale,
    width: visibleFrame.width / scale,
    height: visibleFrame.height / scale,
  };
  mapped = fitRectToRatio(mapped, targetRatio);

  const maxX = Math.max(0, natural.width - mapped.width);
  const maxY = Math.max(0, natural.height - mapped.height);
  return {
    x: clamp(mapped.x, 0, maxX),
    y: clamp(mapped.y, 0, maxY),
    width: clamp(mapped.width, 1, natural.width),
    height: clamp(mapped.height, 1, natural.height),
  };
}

function calculateCaptureScore(cropRect: CropRect, natural: NaturalImageSize): number {
  // 黃金獵犬目標區（可再微調）
  const targetRect: CropRect = {
    x: natural.width * 0.58,
    y: natural.height * 0.48,
    width: natural.width * 0.3,
    height: natural.height * 0.38,
  };
  const overlap = intersectRect(cropRect, targetRect);
  const overlapArea = overlap.width * overlap.height;
  const targetArea = targetRect.width * targetRect.height;
  if (targetArea <= 0) return 0;
  return Math.round(clamp((overlapArea / targetArea) * 100, 0, 100));
}

async function renderCropToDataUrl(
  imageSrc: string,
  cropRect: CropRect,
  outputSize: number,
): Promise<string> {
  const img = new Image();
  img.src = imageSrc;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image-load-failed"));
  });
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas-context-missing");
  context.drawImage(
    img,
    cropRect.x,
    cropRect.y,
    cropRect.width,
    cropRect.height,
    0,
    0,
    outputSize,
    outputSize,
  );
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function renderCropToDataUrlBySize(
  imageSrc: string,
  cropRect: CropRect,
  outputWidth: number,
  outputHeight: number,
): Promise<string> {
  const img = new Image();
  img.src = imageSrc;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image-load-failed"));
  });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(outputWidth));
  canvas.height = Math.max(1, Math.floor(outputHeight));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas-context-missing");
  context.drawImage(
    img,
    cropRect.x,
    cropRect.y,
    cropRect.width,
    cropRect.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas.toDataURL("image/jpeg", 0.92);
}

export function MetroFirstSunbeastDogEventModal({
  onFinish,
  savings,
  actionPower,
  fatigue,
}: MetroFirstSunbeastDogEventModalProps) {
  const {
    animation: backgroundShakeAnimation,
    effectNonce,
    activeEffectId,
  } = useBackgroundShake();
  const [step, setStep] = useState<EventStep>("line-1");
  const [typingMode, setTypingMode] = useState<TypewriterMode>("punctuated");
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPhotoMode, setIsPhotoMode] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isShutterFlashVisible, setIsShutterFlashVisible] = useState(false);
  const [capturedPolaroidUrl, setCapturedPolaroidUrl] = useState<string | null>(null);
  const [captureScore, setCaptureScore] = useState<number | null>(null);
  const [captureCameraFrameRect, setCaptureCameraFrameRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [captureCroppedRect, setCaptureCroppedRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [capturedSourceImage, setCapturedSourceImage] = useState<string>("/images/CH/CH01_SC04_MRT_DogStuck.png");
  const [naturalImageSize, setNaturalImageSize] = useState<NaturalImageSize | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const cameraFrameRef = useRef<HTMLDivElement | null>(null);
  const lastCaptureSnapshotRef = useRef<{
    sourceImage: string;
    previewImage: string;
    dogCoveragePercent: number;
    cameraFrameRect: { x: number; y: number; width: number; height: number };
    capturedRect: { x: number; y: number; width: number; height: number };
  } | null>(null);

  const sourceText = useMemo(() => {
    if (step === "line-1") return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line1;
    if (step === "line-2") return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line2;
    if (step === "line-3") return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line3;
    if (step === "line-4") return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line4;
    if (step === "line-5") return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line5;
    if (step === "line-6") return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line6;
    if (step === "line-7") return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line7;
    if (step === "line-8") return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line8;
    if (step === "line-9") return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line9;
    if (step === "line-10") return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line10;
    if (step === "line-11") return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line11;
    if (step === "line-12") return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line12;
    if (step === "line-13") return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line13;
    return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line14;
  }, [step]);
  const isTypingComplete = !sourceText || displayText === sourceText;
  const historyLines = useMemo(() => {
    const lineMeta: Array<{ id: EventStep; speaker: string; text: string }> = [
      { id: "line-1", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line1 },
      { id: "line-2", speaker: "小貝狗", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line2 },
      { id: "line-3", speaker: "小麥（心裡話）", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line3 },
      { id: "line-4", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line4 },
      { id: "line-5", speaker: "小貝狗", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line5 },
      { id: "line-6", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line6 },
      { id: "line-7", speaker: "小貝狗", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line7 },
      { id: "line-8", speaker: "旁白", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line8 },
      { id: "line-9", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line9 },
      { id: "line-10", speaker: "小貝狗", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line10 },
      { id: "line-11", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line11 },
      { id: "line-12", speaker: "小貝狗", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line12 },
      { id: "line-13", speaker: "旁白", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line13 },
      { id: "line-14", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line14 },
    ];
    const visibleIndex = EVENT_STEPS.indexOf(step);
    const lines: Array<{ id: string; speaker: string; text: string }> = [];
    lineMeta.forEach((item, index) => {
      if (index <= visibleIndex) lines.push(item);
    });
    return lines;
  }, [step]);

  useEffect(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    let cursor = 0;
    setDisplayText("");

    const tick = () => {
      if (typingMode === "double-char") {
        cursor = Math.min(sourceText.length, cursor + 2);
        setDisplayText(sourceText.slice(0, cursor));
        if (cursor < sourceText.length) {
          typingTimerRef.current = setTimeout(tick, 32);
        }
        return;
      }

      cursor = Math.min(sourceText.length, cursor + 1);
      setDisplayText(sourceText.slice(0, cursor));
      if (cursor < sourceText.length) {
        const currentChar = sourceText[cursor - 1];
        let delay = typingMode === "pause" ? 170 : 34;
        if (typingMode === "punctuated" || typingMode === "pause") {
          if (/[。！？!?]/.test(currentChar)) delay = 280;
          else if (/[，、,]/.test(currentChar)) delay = 160;
          if (typingMode === "pause") {
            if (/[。！？!?]/.test(currentChar)) delay = 420;
            else if (/[，、,]/.test(currentChar)) delay = 260;
          }
        }
        typingTimerRef.current = setTimeout(tick, delay);
      }
    };

    typingTimerRef.current = setTimeout(tick, 90);

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [sourceText, typingMode]);

  const speaker = useMemo(() => {
    if (step === "line-2" || step === "line-5" || step === "line-7" || step === "line-10" || step === "line-12") return "小貝狗";
    if (step === "line-8" || step === "line-13") return "旁白";
    if (step === "line-3") return "小麥（心裡話）";
    return "小麥";
  }, [step]);

  const avatarSpriteId = useMemo(() => {
    if (step === "line-2" || step === "line-5" || step === "line-7" || step === "line-10" || step === "line-12") return "beigo";
    return "mai";
  }, [step]);
  const avatarFrameIndex = useMemo(() => {
    if (step === "line-3") return 4; // 表情5（1-based）=> frameIndex 4（0-based）
    if (step === "line-4") return 10; // 表情11（1-based）=> frameIndex 10（0-based）
    return 0;
  }, [step]);

  const backgroundImageSrc = useMemo(() => {
    if (step === "line-1" || step === "line-2" || step === "line-3") {
      return "/images/mrt_01.jpg";
    }
    if (step === "line-9" || step === "line-10") {
      return "/images/mrt_01.jpg";
    }
    if (step === "line-11" || step === "line-12" || step === "line-13" || step === "line-14") {
      return "/images/demo_show_get_dog.jpg";
    }
    return "/images/CH/CH01_SC04_MRT_DogStuck.png";
  }, [step]);
  const backgroundImage = `url('${backgroundImageSrc}')`;

  useEffect(() => {
    const image = new Image();
    image.src = backgroundImageSrc;
    image.onload = () => {
      setNaturalImageSize({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
  }, [backgroundImageSrc]);

  useEffect(() => {
    const handlePhotoCheat = (event: Event) => {
      const customEvent = event as CustomEvent<PhotoCheatPayload>;
      const action = customEvent.detail?.action;
      if (!action) return;
      if (action === "enter-photo-mode") {
        setStep("line-7");
        setIsPhotoMode(true);
        setCapturedPolaroidUrl(null);
        setCaptureScore(null);
        setCaptureCameraFrameRect(null);
        setCaptureCroppedRect(null);
        lastCaptureSnapshotRef.current = null;
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        setDisplayText(METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line7);
        return;
      }
      if (action === "retake-photo") {
        setIsPhotoMode(true);
        setCapturedPolaroidUrl(null);
        setCaptureScore(null);
        setCaptureCameraFrameRect(null);
        setCaptureCroppedRect(null);
        lastCaptureSnapshotRef.current = null;
      }
    };
    window.addEventListener(GAME_PHOTO_CHEAT_TRIGGER, handlePhotoCheat);
    return () => {
      window.removeEventListener(GAME_PHOTO_CHEAT_TRIGGER, handlePhotoCheat);
    };
  }, []);

  const handleContinue = () => {
    if (sourceText && displayText !== sourceText) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setDisplayText(sourceText);
      return;
    }
    if (step === "line-7") {
      setIsPhotoMode(true);
      setCapturedPolaroidUrl(null);
      setCaptureScore(null);
      setCaptureCameraFrameRect(null);
      setCaptureCroppedRect(null);
      lastCaptureSnapshotRef.current = null;
      return;
    }
    const currentIndex = EVENT_STEPS.indexOf(step);
    if (currentIndex < EVENT_STEPS.length - 1) {
      setStep(EVENT_STEPS[currentIndex + 1]);
      return;
    }
    onFinish();
  };
  const handleShutterClick = () => {
    if (isCapturing || capturedPolaroidUrl) return;
    if (!backgroundRef.current || !cameraFrameRef.current || !naturalImageSize) return;

    const runCapture = async () => {
      try {
        setIsCapturing(true);
        setIsShutterFlashVisible(true);
        await new Promise<void>((resolve) => {
          window.setTimeout(() => resolve(), 120);
        });
        const backgroundRect = backgroundRef.current?.getBoundingClientRect();
        const frameRect = cameraFrameRef.current?.getBoundingClientRect();
        if (!backgroundRect || !frameRect) return;
        const frameInContainer: CropRect = {
          x: frameRect.left - backgroundRect.left,
          y: frameRect.top - backgroundRect.top,
          width: frameRect.width,
          height: frameRect.height,
        };
        const cropRect = toImageCropRect({
          frameInContainer,
          containerWidth: backgroundRect.width,
          containerHeight: backgroundRect.height,
          natural: naturalImageSize,
          targetRatio: POLAROID_TARGET_RATIO,
          fitMode: "contain",
        });
        const cameraFrameMappedRect = toImageCropRect({
          frameInContainer,
          containerWidth: backgroundRect.width,
          containerHeight: backgroundRect.height,
          natural: naturalImageSize,
          targetRatio: CAMERA_FRAME_WIDTH / CAMERA_FRAME_HEIGHT,
          fitMode: "contain",
        });
        const nextScore = calculateCaptureScore(cropRect, naturalImageSize);
        const dataUrl = await renderCropToDataUrl(backgroundImageSrc, cropRect, 620);
        const framePreviewWidth = 900;
        const framePreviewHeight = Math.max(
          1,
          Math.round(framePreviewWidth * (cameraFrameMappedRect.height / cameraFrameMappedRect.width)),
        );
        const framePreviewUrl = await renderCropToDataUrlBySize(
          backgroundImageSrc,
          cameraFrameMappedRect,
          framePreviewWidth,
          framePreviewHeight,
        );
        setCapturedPolaroidUrl(dataUrl);
        setCaptureScore(nextScore);
        setCapturedSourceImage(backgroundImageSrc);
        setCaptureCameraFrameRect({
          x: Math.max(0, Math.min(1, cameraFrameMappedRect.x / naturalImageSize.width)),
          y: Math.max(0, Math.min(1, cameraFrameMappedRect.y / naturalImageSize.height)),
          width: Math.max(0, Math.min(1, cameraFrameMappedRect.width / naturalImageSize.width)),
          height: Math.max(0, Math.min(1, cameraFrameMappedRect.height / naturalImageSize.height)),
        });
        setCaptureCroppedRect({
          x: Math.max(0, Math.min(1, cropRect.x / naturalImageSize.width)),
          y: Math.max(0, Math.min(1, cropRect.y / naturalImageSize.height)),
          width: Math.max(0, Math.min(1, cropRect.width / naturalImageSize.width)),
          height: Math.max(0, Math.min(1, cropRect.height / naturalImageSize.height)),
        });
        lastCaptureSnapshotRef.current = {
          sourceImage: backgroundImageSrc,
          previewImage: framePreviewUrl,
          dogCoveragePercent: nextScore,
          cameraFrameRect: {
            x: Math.max(0, Math.min(1, cameraFrameMappedRect.x / naturalImageSize.width)),
            y: Math.max(0, Math.min(1, cameraFrameMappedRect.y / naturalImageSize.height)),
            width: Math.max(0, Math.min(1, cameraFrameMappedRect.width / naturalImageSize.width)),
            height: Math.max(0, Math.min(1, cameraFrameMappedRect.height / naturalImageSize.height)),
          },
          capturedRect: {
            x: Math.max(0, Math.min(1, cropRect.x / naturalImageSize.width)),
            y: Math.max(0, Math.min(1, cropRect.y / naturalImageSize.height)),
            width: Math.max(0, Math.min(1, cropRect.width / naturalImageSize.width)),
            height: Math.max(0, Math.min(1, cropRect.height / naturalImageSize.height)),
          },
        };
      } finally {
        setIsCapturing(false);
        window.setTimeout(() => {
          setIsShutterFlashVisible(false);
        }, 80);
      }
    };
    void runCapture();
  };

  const handleConfirmPolaroid = () => {
    const snapshot = lastCaptureSnapshotRef.current;
    if (snapshot) {
      recordPhotoCapture(snapshot);
    } else if (captureScore !== null && captureCameraFrameRect && captureCroppedRect) {
      recordPhotoCapture({
        sourceImage: capturedSourceImage,
        previewImage: capturedPolaroidUrl ?? capturedSourceImage,
        dogCoveragePercent: captureScore,
        cameraFrameRect: captureCameraFrameRect,
        capturedRect: captureCroppedRect,
      });
    }
    setIsPhotoMode(false);
    setCapturedPolaroidUrl(null);
    setCaptureScore(null);
    setCaptureCameraFrameRect(null);
    setCaptureCroppedRect(null);
    lastCaptureSnapshotRef.current = null;
    setStep("line-8");
  };
  const handleRetakePhoto = () => {
    setCapturedPolaroidUrl(null);
    setCaptureScore(null);
    setCaptureCameraFrameRect(null);
    setCaptureCroppedRect(null);
    lastCaptureSnapshotRef.current = null;
  };
  const hasPassedPhotoCheck = (captureScore ?? 0) >= PHOTO_PASS_SCORE;
  const shouldShowAvatar = speaker !== "旁白";

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
        key={`metro-first-sunbeast-bg-${effectNonce}-${step}`}
        flex="1"
        bgImage={backgroundImage}
        bgSize={isPhotoMode ? "contain" : "cover"}
        backgroundPosition="center center"
        bgRepeat="no-repeat"
        bgColor={isPhotoMode ? "#1B1A18" : "transparent"}
        position="relative"
        justifyContent="center"
        alignItems="flex-start"
        pt="18px"
        animation={backgroundShakeAnimation}
      >
        <EventBackgroundFxLayer effectId={activeEffectId} effectNonce={effectNonce} />
        {step === "line-3" ? (
          <Flex pointerEvents="none" position="absolute" inset="0" zIndex={1}>
            <Flex
              position="absolute"
              inset="0"
              bg="linear-gradient(180deg, rgba(28,24,36,0.48) 0%, rgba(15,12,20,0.56) 100%)"
            />
            <Flex
              position="absolute"
              top="18px"
              right="18px"
              px="10px"
              py="4px"
              borderRadius="999px"
              bgColor="rgba(20,18,28,0.72)"
              border="1px solid rgba(255,255,255,0.22)"
            >
              <Text color="#E6DAFF" fontSize="12px" fontWeight="700" letterSpacing="0.04em">
                心裡話
              </Text>
            </Flex>
          </Flex>
        ) : null}
        {isPhotoMode && !capturedPolaroidUrl ? (
          <Flex
            pointerEvents="none"
            position="absolute"
            inset="0"
            zIndex={6}
            justifyContent="center"
            overflow="hidden"
          >
            <Flex
              ref={cameraFrameRef}
              position="absolute"
              left="50%"
              top="0"
              w={`${CAMERA_FRAME_WIDTH}px`}
              h={`${CAMERA_FRAME_HEIGHT}px`}
              borderRadius="14px"
              boxShadow="0 0 0 2px rgba(44,31,20,0.22), 0 10px 24px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.14)"
              animation={`${cameraFrameSweep} 2.2s ease-in-out infinite`}
            >
              <Flex
                position="absolute"
                top="0"
                left="0"
                w="26px"
                h="26px"
                borderTop="4px solid rgba(255,255,255,0.95)"
                borderLeft="4px solid rgba(255,255,255,0.95)"
                borderTopLeftRadius="12px"
              />
              <Flex
                position="absolute"
                top="0"
                right="0"
                w="26px"
                h="26px"
                borderTop="4px solid rgba(255,255,255,0.95)"
                borderRight="4px solid rgba(255,255,255,0.95)"
                borderTopRightRadius="12px"
              />
              <Flex
                position="absolute"
                bottom="0"
                left="0"
                w="26px"
                h="26px"
                borderBottom="4px solid rgba(255,255,255,0.95)"
                borderLeft="4px solid rgba(255,255,255,0.95)"
                borderBottomLeftRadius="12px"
              />
              <Flex
                position="absolute"
                bottom="0"
                right="0"
                w="26px"
                h="26px"
                borderBottom="4px solid rgba(255,255,255,0.95)"
                borderRight="4px solid rgba(255,255,255,0.95)"
                borderBottomRightRadius="12px"
              />
              <Flex
                position="absolute"
                left="50%"
                top="50%"
                transform="translate(-50%, -50%)"
                w="34px"
                h="34px"
                border="2px solid rgba(255,255,255,0.88)"
                borderRadius="999px"
                alignItems="center"
                justifyContent="center"
              >
                <Flex position="absolute" w="14px" h="2px" bgColor="rgba(255,255,255,0.9)" />
                <Flex position="absolute" w="2px" h="14px" bgColor="rgba(255,255,255,0.9)" />
              </Flex>
              <Flex
                position="absolute"
                left="10px"
                right="10px"
                top="8px"
                h="2px"
                bgColor="rgba(255,255,255,0.86)"
              />
            </Flex>
          </Flex>
        ) : null}
        {isPhotoMode && capturedPolaroidUrl ? (
          <Flex
            pointerEvents="none"
            position="absolute"
            inset="0"
            zIndex={14}
            alignItems="center"
            justifyContent="center"
          >
            <Flex
              w={`${POLAROID_CARD_WIDTH}px`}
              h={`${POLAROID_CARD_HEIGHT}px`}
              borderRadius="10px"
              bgColor="#F8F6EF"
              boxShadow="0 16px 30px rgba(0,0,0,0.36)"
              border="1px solid rgba(180,164,142,0.75)"
              pt="14px"
              px="14px"
              pb="34px"
              direction="column"
              alignItems="center"
              gap="12px"
            >
              <Flex
                w={`${POLAROID_PHOTO_SIZE}px`}
                h={`${POLAROID_PHOTO_SIZE}px`}
                borderRadius="4px"
                overflow="hidden"
                boxShadow="inset 0 0 0 1px rgba(130,112,90,0.35)"
                bgImage={`url('${capturedPolaroidUrl}')`}
                bgSize="cover"
                backgroundPosition="center"
                bgRepeat="no-repeat"
              />
              <Text color="#6E5A47" fontSize="13px" fontWeight="700">
                拍攝精準度 {captureScore ?? 0}%
              </Text>
              {(captureScore ?? 0) < PHOTO_PASS_SCORE ? (
                <Text color="#A14F3F" fontSize="12px" fontWeight="700">
                  教學提示：需要至少 {PHOTO_PASS_SCORE}% 才能通過，請重拍
                </Text>
              ) : null}
            </Flex>
          </Flex>
        ) : null}
        {isPhotoMode && isShutterFlashVisible ? (
          <Flex
            pointerEvents="none"
            position="absolute"
            inset="0"
            zIndex={18}
            bgColor="rgba(255,255,255,0.98)"
            animation={`${cameraShutterFlash} 220ms ease-out 1`}
          />
        ) : null}
        <Text color="#F5EFE5" fontSize="12px" textShadow="0 2px 6px rgba(0,0,0,0.45)">
          {METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.sceneTitle}
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
        <EventAvatarSprite spriteId={avatarSpriteId} frameIndex={avatarFrameIndex} />
      </Flex>

      <Flex
        opacity={isPhotoMode ? 0 : 1}
        transform={isPhotoMode ? "translateY(30px)" : "translateY(0px)"}
        pointerEvents={isPhotoMode ? "none" : "auto"}
        transition="opacity 0.35s ease, transform 0.35s ease"
      >
        <DialogQuickActions
          onOpenOptions={() => {}}
          onOpenHistory={() => setIsHistoryOpen(true)}
        />
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
            {speaker}
          </Text>
          <Flex gap="6px" position="absolute" top="12px" right="12px">
            {([
              { key: "char", label: "逐字" },
              { key: "double-char", label: "雙字" },
              { key: "punctuated", label: "標點" },
              { key: "pause", label: "停頓" },
            ] as Array<{ key: TypewriterMode; label: string }>).map((mode) => (
              <Flex
                key={mode.key}
                px="8px"
                h="24px"
                borderRadius="999px"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                bgColor={typingMode === mode.key ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.1)"}
                onClick={() => setTypingMode(mode.key)}
              >
                <Text color="white" fontSize="11px">
                  {mode.label}
                </Text>
              </Flex>
            ))}
          </Flex>
          <Flex flex="1" minH="0" direction="column">
            <Text
              color="white"
              fontSize={typingMode === "pause" ? "18px" : "16px"}
              lineHeight={typingMode === "pause" ? "1.8" : "1.5"}
              letterSpacing={typingMode === "pause" ? "0.08em" : "normal"}
              fontWeight={typingMode === "pause" ? "700" : "400"}
            >
              {displayText}
            </Text>
          </Flex>
          <EventContinueAction enabled={isTypingComplete} onClick={handleContinue} />
        </EventDialogPanel>
      </Flex>

      {isPhotoMode && !capturedPolaroidUrl ? (
        <Flex
          position="absolute"
          left="50%"
          bottom="34px"
          transform="translateX(-50%)"
          zIndex={16}
          direction="column"
          alignItems="center"
          gap="10px"
        >
          <Text color="white" fontSize="14px" fontWeight="700" textShadow="0 2px 6px rgba(0,0,0,0.45)">
            點擊快門捕捉小日獸
          </Text>
          <Flex
            as="button"
            w="76px"
            h="76px"
            borderRadius="999px"
            bgColor="rgba(255,255,255,0.9)"
            border="4px solid #7C6751"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            boxShadow="0 8px 20px rgba(0,0,0,0.35)"
            onClick={handleShutterClick}
            opacity={isCapturing ? 0.7 : 1}
          >
            <FaCamera size={30} color="#6B5947" />
          </Flex>
        </Flex>
      ) : null}
      {isPhotoMode && capturedPolaroidUrl ? (
        <Flex
          position="absolute"
          left="50%"
          bottom="30px"
          transform="translateX(-50%)"
          zIndex={16}
          direction="column"
          alignItems="center"
          gap="8px"
        >
          <Text color="white" fontSize="13px" textShadow="0 2px 6px rgba(0,0,0,0.45)">
            {hasPassedPhotoCheck ? "取景完成" : "取景偏離，請重拍"}
          </Text>
          <Flex
            as="button"
            w="132px"
            h="42px"
            borderRadius="999px"
            bgColor={hasPassedPhotoCheck ? "rgba(255,255,255,0.92)" : "rgba(255,245,240,0.95)"}
            border="2px solid #7C6751"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            boxShadow="0 8px 20px rgba(0,0,0,0.28)"
            onClick={hasPassedPhotoCheck ? handleConfirmPolaroid : handleRetakePhoto}
          >
            <Text color="#5F4C3B" fontWeight="700">
              {hasPassedPhotoCheck ? "收下照片" : "重拍"}
            </Text>
          </Flex>
        </Flex>
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
