"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Image as ChakraImage, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FaCamera } from "react-icons/fa6";
import {
  playPhotoShutterSound,
  preparePhotoShutterSound,
} from "@/lib/game/fmodWeb";
import { preloadGameImage } from "@/lib/game/preloadAssets";
import { playGameSfx, type GameSfxId } from "@/lib/game/soundEffects";
import { samplePhotoHopMotion, type PhotoHopKeyframe } from "@/lib/game/photoHopMotion";
import {
  EXHIBITION_UI_COPY,
  type ExhibitionLocale,
} from "@/lib/game/exhibitionI18n";

type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PhotoCaptureOverlay = {
  id?: string;
  imageSrc: string;
  frameSources?: readonly string[];
  frameDurationMs?: number;
  rectNormalized: CropRect;
  opacity?: number;
  ariaLabel?: string;
  interactionClipPath?: string;
  motion?: {
    preset: "orbit" | "hop-left";
    hopKeyframes?: readonly PhotoHopKeyframe[];
    syncFramesToHop?: boolean;
    radiusXNormalized?: number;
    radiusYNormalized?: number;
    /** Independent orbit period for a layer following a hop trajectory. */
    orbitDurationMs?: number;
    durationMs?: number;
    phaseOffsetRadians?: number;
    direction?: 1 | -1;
    draggable?: boolean;
    dragRangeXNormalized?: number;
    dragRangeYNormalized?: number;
    tracksPhotoTarget?: boolean;
  };
  transform?: {
    rotateDegrees?: number;
    flipX?: boolean;
  };
};

type PhotoCaptureTargetMotion = {
  preset: "dvd-bounce";
  speedPxPerSecond?: number;
  sizePx?: number;
  initialDirection?: {
    x: number;
    y: number;
  };
  edgeInsetPx?: number;
  edgeHitSfxId?: GameSfxId;
};

const EMPTY_CAPTURE_OVERLAYS: PhotoCaptureOverlay[] = [];

function getDvdBounceImageDirection(velocityX: number, velocityY: number) {
  const isMovingRight = velocityX >= 0;
  const isMovingUp = velocityY < 0;
  return {
    rotateDegrees: isMovingUp ? 180 : 0,
    flipX: isMovingRight !== isMovingUp,
    label: `${isMovingUp ? "up" : "down"}-${isMovingRight ? "right" : "left"}`,
  };
}

export type NaturalImageSize = {
  width: number;
  height: number;
};

export type PhotoCaptureResult = {
  score: number;
  polaroidUrl: string;
  sourceImage: string;
  normalizedCameraFrameRect: CropRect;
  normalizedCroppedRect: CropRect;
  framePreviewUrl: string;
};

type EventPhotoCaptureLayerProps = {
  locale?: ExhibitionLocale;
  enabled: boolean;
  backgroundRef: React.RefObject<HTMLDivElement | null>;
  backgroundImageSrc: string;
  naturalImageSize: NaturalImageSize | null;
  targetRectNormalized: CropRect;
  captureOverlays?: PhotoCaptureOverlay[];
  targetMotion?: PhotoCaptureTargetMotion;
  passScore?: number;
  hintText?: string;
  hideHintText?: boolean;
  cameraFrameImageSrc?: string;
  cameraFrameSizePx?: number;
  fitMode?: "cover" | "contain";
  captureTriggerMode?: "anywhere" | "shutter-only";
  resetNonce?: number;
  frameSweepAxis?: "vertical" | "horizontal";
  frameSweepFromY?: number;
  frameSweepToY?: number;
  targetFadeLeadPx?: number;
  tutorialTitle?: string;
  tutorialLines?: string[];
  hideTutorialLines?: boolean;
  tutorialHighlightText?: string;
  tutorialConfirmLabel?: string;
  tutorialDemoImageSrc?: string;
  tutorialDemoImageAlt?: string;
  freeRetakeOfferText?: string;
  freeRetakeButtonLabel?: string;
  keepPhotoButtonLabel?: string;
  movingBackground?: {
    enabled?: boolean;
    mode?: "auto" | "responsive";
    scaleMultiplier?: number;
    panRangePx?: number;
    centerOffsetPx?: number;
    durationMs?: number;
    zoom?: {
      enabled?: boolean;
      minMultiplier?: number;
      maxMultiplier?: number;
      initialMultiplier?: number;
      wheelStep?: number;
      pinchSensitivity?: number;
    };
  };
  onBeforeCapture?: () => boolean | void;
  onConfirm: (result: PhotoCaptureResult) => void;
};

function buildCameraFrameSweep(
  from: number,
  to: number,
  axis: "vertical" | "horizontal",
) {
  if (axis === "horizontal") {
    return keyframes`
  0% { transform: translate(${from}px, -50%); }
  100% { transform: translate(${to}px, -50%); }
`;
  }
  return keyframes`
  0% { transform: translate(-50%, ${from}px); }
  100% { transform: translate(-50%, ${to}px); }
`;
}
const shutterFlash = keyframes`
  0% { opacity: 0; }
  7% { opacity: 1; }
  22% { opacity: 0.98; }
  52% { opacity: 0.42; }
  100% { opacity: 0; }
`;

const capturedPhotoDevelop = keyframes`
  0% {
    opacity: 0;
    filter: brightness(1.65) saturate(0.72);
    transform: translate3d(0, 18px, 0) rotate(-1.5deg) scale(0.94);
  }
  58% {
    opacity: 1;
    filter: brightness(1.16) saturate(0.9);
  }
  100% {
    opacity: 1;
    filter: brightness(1) saturate(1);
    transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
  }
`;

const capturedPhotoLightSweep = keyframes`
  0% {
    opacity: 0;
    transform: translate3d(0, 0, 0) rotate(45deg);
  }
  10%, 82% { opacity: 1; }
  100% {
    opacity: 0;
    transform: translate3d(520px, 0, 0) rotate(45deg);
  }
`;

const pointerNudgeRight = keyframes`
  0%, 18%, 100% { right: calc(100% + 16px); }
  44% { right: calc(100% + 8px); }
  58% { right: calc(100% + 10px); }
  76% { right: calc(100% + 16px); }
`;

const tutorialFrameSweep = keyframes`
  0%, 14% { transform: translate3d(-50%, -140%, 0); }
  42%, 68% { transform: translate3d(-50%, -50%, 0); }
  94%, 100% { transform: translate3d(-50%, 40%, 0); }
`;

const tutorialTargetLock = keyframes`
  0%, 36%, 74%, 100% { opacity: 0; transform: scale(0.88); }
  44%, 66% { opacity: 1; transform: scale(1); }
`;

const tutorialShutterTap = keyframes`
  0%, 42%, 76%, 100% { opacity: 0.45; transform: scale(0.9); }
  52%, 68% { opacity: 1; transform: scale(1.08); }
`;

const tutorialShutterFlash = keyframes`
  0%, 57%, 100% { opacity: 0; }
  61% { opacity: 0.86; }
  69% { opacity: 0; }
`;

const PHOTO_TUTORIAL_DOTS_IMAGE = "/images/figma/photo-tutorial/dots.png";
const PHOTO_TUTORIAL_CAMERA_IMAGE = "/images/figma/photo-tutorial/camera-solid.svg";
const PHOTO_TUTORIAL_COLOR = {
  surface: "#FFFDF9",
  preview: "#FCF7EC",
  accent: "#9C775C",
  copy: "#725844",
  highlight: "#FFE7A3",
} as const;

const CAMERA_FRAME_WIDTH = 248;
const CAMERA_FRAME_HEIGHT = 248;
const POLAROID_CARD_WIDTH = 236;
const POLAROID_CARD_HEIGHT = 286;
const POLAROID_PHOTO_SIZE = 192;
const POLAROID_TARGET_RATIO = 1;
const TAP_CAPTURE_MAX_DURATION_MS = 420;
const TAP_CAPTURE_MAX_MOVE_PX = 12;
const SHUTTER_FLASH_DURATION_MS = 520;
const CAPTURE_RESULT_REVEAL_DELAY_MS = 280;

type PhotoTapCandidate = {
  pointerId: number;
  startX: number;
  startY: number;
  startedAt: number;
  hadMultiPointer: boolean;
  moved: boolean;
};

type LivePhotoOverlayState = {
  imageSrc: string;
  rectNormalized: CropRect;
  dragOffsetXNormalized: number;
  dragOffsetYNormalized: number;
  orbitOffsetXNormalized: number;
  orbitOffsetYNormalized: number;
  isDragging: boolean;
};

type PhotoOverlayDragState = {
  overlayIndex: number;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startRectXNormalized: number;
  startRectYNormalized: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isPhotoControlTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("[data-photo-control='true']"));
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

function getRenderedImageMetrics(params: {
  containerWidth: number;
  containerHeight: number;
  natural: NaturalImageSize;
  fitMode: "cover" | "contain";
  scaleMultiplier?: number;
  offsetX?: number;
  offsetY?: number;
  clampToContainer?: boolean;
}) {
  const { containerWidth, containerHeight, natural, fitMode } = params;
  const scaleMultiplier = params.scaleMultiplier ?? 1;
  const scale =
    fitMode === "contain"
      ? Math.min(containerWidth / natural.width, containerHeight / natural.height)
      : Math.max(containerWidth / natural.width, containerHeight / natural.height);
  const adjustedScale = scale * scaleMultiplier;
  const renderedWidth = natural.width * adjustedScale;
  const renderedHeight = natural.height * adjustedScale;
  const centeredOffsetX = (containerWidth - renderedWidth) / 2 + (params.offsetX ?? 0);
  const centeredOffsetY = (containerHeight - renderedHeight) / 2 + (params.offsetY ?? 0);
  const offsetX = params.clampToContainer
    ? renderedWidth >= containerWidth
      ? clamp(centeredOffsetX, containerWidth - renderedWidth, 0)
      : (containerWidth - renderedWidth) / 2
    : centeredOffsetX;
  const offsetY = params.clampToContainer
    ? renderedHeight >= containerHeight
      ? clamp(centeredOffsetY, containerHeight - renderedHeight, 0)
      : (containerHeight - renderedHeight) / 2
    : centeredOffsetY;
  return {
    scale: adjustedScale,
    renderedWidth,
    renderedHeight,
    offsetX,
    offsetY,
  };
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
  imageScaleMultiplier?: number;
  imageOffsetX?: number;
  imageOffsetY?: number;
  imageClampToContainer?: boolean;
}): CropRect {
  const { frameInContainer, containerWidth, containerHeight, natural, targetRatio, fitMode } = params;
  const { offsetX, offsetY, scale } = getRenderedImageMetrics({
    containerWidth,
    containerHeight,
    natural,
    fitMode,
    scaleMultiplier: params.imageScaleMultiplier,
    offsetX: params.imageOffsetX,
    offsetY: params.imageOffsetY,
    clampToContainer: params.imageClampToContainer,
  });

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

function calculateCaptureScore(cropRect: CropRect, targetRect: CropRect): number {
  const overlap = intersectRect(cropRect, targetRect);
  const overlapArea = overlap.width * overlap.height;
  const targetArea = targetRect.width * targetRect.height;
  if (targetArea <= 0) return 0;
  return Math.round(clamp((overlapArea / targetArea) * 100, 0, 100));
}

function calculateCameraFrameScore(cameraFrameRect: CropRect, targetRect: CropRect): number {
  return calculateCaptureScore(cameraFrameRect, targetRect);
}

const captureImagePromises = new Map<string, Promise<HTMLImageElement>>();

function loadCaptureImage(src: string): Promise<HTMLImageElement> {
  const cached = captureImagePromises.get(src);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      void image.decode().catch(() => undefined).finally(() => resolve(image));
    };
    image.onerror = () => reject(new Error(`capture-image-load-failed: ${src}`));
    image.src = src;
    if (image.complete && image.naturalWidth > 0) {
      void image.decode().catch(() => undefined).finally(() => resolve(image));
    }
  }).catch((error) => {
    captureImagePromises.delete(src);
    throw error;
  });

  captureImagePromises.set(src, promise);
  return promise;
}

function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<string> {
  if (typeof canvas.toBlob !== "function") {
    return Promise.resolve(canvas.toDataURL(type, quality));
  }

  return new Promise<string>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("canvas-encode-failed"));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }
        reject(new Error("canvas-data-url-read-failed"));
      };
      reader.onerror = () => reject(new Error("canvas-data-url-read-failed"));
      reader.readAsDataURL(blob);
    }, type, quality);
  });
}

async function renderCropToDataUrl(
  imageSrc: string,
  cropRect: CropRect,
  outputWidth: number,
  outputHeight: number,
  overlays: PhotoCaptureOverlay[] = [],
): Promise<string> {
  const img = await loadCaptureImage(imageSrc);
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

  const imageWidth = img.naturalWidth || img.width;
  const imageHeight = img.naturalHeight || img.height;
  for (const overlay of overlays) {
    let overlayImg: HTMLImageElement;
    try {
      overlayImg = await loadCaptureImage(overlay.imageSrc);
    } catch {
      continue;
    }

    const overlayTargetRect: CropRect = {
      x: imageWidth * overlay.rectNormalized.x,
      y: imageHeight * overlay.rectNormalized.y,
      width: imageWidth * overlay.rectNormalized.width,
      height: imageHeight * overlay.rectNormalized.height,
    };
    const overlayWidth = overlayImg.naturalWidth || overlayImg.width;
    const overlayHeight = overlayImg.naturalHeight || overlayImg.height;
    if (overlayWidth <= 0 || overlayHeight <= 0 || overlayTargetRect.width <= 0 || overlayTargetRect.height <= 0) {
      continue;
    }

    let overlaySource: CanvasImageSource = overlayImg;
    const overlayRotation = overlay.transform?.rotateDegrees ?? 0;
    const shouldFlipOverlayX = Boolean(overlay.transform?.flipX);
    if (overlayRotation !== 0 || shouldFlipOverlayX) {
      const transformedOverlayCanvas = document.createElement("canvas");
      transformedOverlayCanvas.width = overlayWidth;
      transformedOverlayCanvas.height = overlayHeight;
      const transformedOverlayContext = transformedOverlayCanvas.getContext("2d");
      if (transformedOverlayContext) {
        transformedOverlayContext.translate(overlayWidth / 2, overlayHeight / 2);
        transformedOverlayContext.rotate((overlayRotation * Math.PI) / 180);
        transformedOverlayContext.scale(shouldFlipOverlayX ? -1 : 1, 1);
        transformedOverlayContext.drawImage(
          overlayImg,
          -overlayWidth / 2,
          -overlayHeight / 2,
          overlayWidth,
          overlayHeight,
        );
        overlaySource = transformedOverlayCanvas;
      }
    }

    const overlayRatio = overlayWidth / overlayHeight;
    const targetRatio = overlayTargetRect.width / overlayTargetRect.height;
    const fittedOverlayRect =
      targetRatio > overlayRatio
        ? {
            x: overlayTargetRect.x + (overlayTargetRect.width - overlayTargetRect.height * overlayRatio) / 2,
            y: overlayTargetRect.y,
            width: overlayTargetRect.height * overlayRatio,
            height: overlayTargetRect.height,
          }
        : {
            x: overlayTargetRect.x,
            y: overlayTargetRect.y + (overlayTargetRect.height - overlayTargetRect.width / overlayRatio) / 2,
            width: overlayTargetRect.width,
            height: overlayTargetRect.width / overlayRatio,
          };
    const visibleOverlayRect = intersectRect(cropRect, fittedOverlayRect);
    if (visibleOverlayRect.width <= 0 || visibleOverlayRect.height <= 0) continue;

    const previousAlpha = context.globalAlpha;
    context.globalAlpha = overlay.opacity ?? 1;
    context.drawImage(
      overlaySource,
      ((visibleOverlayRect.x - fittedOverlayRect.x) / fittedOverlayRect.width) * overlayWidth,
      ((visibleOverlayRect.y - fittedOverlayRect.y) / fittedOverlayRect.height) * overlayHeight,
      (visibleOverlayRect.width / fittedOverlayRect.width) * overlayWidth,
      (visibleOverlayRect.height / fittedOverlayRect.height) * overlayHeight,
      ((visibleOverlayRect.x - cropRect.x) / cropRect.width) * canvas.width,
      ((visibleOverlayRect.y - cropRect.y) / cropRect.height) * canvas.height,
      (visibleOverlayRect.width / cropRect.width) * canvas.width,
      (visibleOverlayRect.height / cropRect.height) * canvas.height,
    );
    context.globalAlpha = previousAlpha;
  }

  return canvasToDataUrl(canvas, "image/jpeg", 0.88);
}

export function EventPhotoCaptureLayer({
  locale = "zh",
  enabled,
  backgroundRef,
  backgroundImageSrc,
  naturalImageSize,
  targetRectNormalized,
  captureOverlays = EMPTY_CAPTURE_OVERLAYS,
  targetMotion,
  passScore = 60,
  hintText = "點擊畫面或空白鍵捕捉小日獸",
  hideHintText = false,
  cameraFrameImageSrc,
  cameraFrameSizePx,
  fitMode = "contain",
  captureTriggerMode = "anywhere",
  resetNonce = 0,
  frameSweepAxis = "vertical",
  frameSweepFromY = -130,
  frameSweepToY = 360,
  tutorialTitle,
  tutorialLines = [],
  hideTutorialLines = false,
  tutorialHighlightText,
  tutorialConfirmLabel = "我知道了",
  tutorialDemoImageSrc,
  tutorialDemoImageAlt = "拍照目標",
  freeRetakeOfferText,
  freeRetakeButtonLabel = "再拍一次",
  keepPhotoButtonLabel = "收下照片",
  movingBackground,
  onBeforeCapture,
  onConfirm,
}: EventPhotoCaptureLayerProps) {
  const cameraFrameRef = useRef<HTMLDivElement | null>(null);
  const captureTapCandidateRef = useRef<PhotoTapCandidate | null>(null);
  const captureTapActivePointerIdsRef = useRef(new Set<number>());
  const isCaptureInFlightRef = useRef(false);
  const shutterFlashTimerRef = useRef<number | null>(null);
  const movingBackgroundPanOffsetXRef = useRef(0);
  const movingBackgroundTargetOffsetXRef = useRef(0);
  const movingBackgroundZoomMultiplierRef = useRef(1);
  const movingBackgroundActivePointersRef = useRef(new Map<number, { x: number; y: number }>());
  const movingBackgroundPinchDistanceRef = useRef<number | null>(null);
  const movingBackgroundPinchStartZoomRef = useRef(1);
  const lastPointerPanAtRef = useRef(0);
  const animatedTargetOverlayRef = useRef<HTMLDivElement | null>(null);
  const photoOverlayNodesRef = useRef<Array<HTMLDivElement | null>>([]);
  const photoOverlayFrameNodesRef = useRef<Array<Array<HTMLImageElement | null>>>([]);
  const liveOverlayStatesRef = useRef<LivePhotoOverlayState[]>([]);
  const photoOverlayDragStateRef = useRef<PhotoOverlayDragState | null>(null);
  const decodedOverlayFrameSourceKeyRef = useRef("");
  const liveTargetRectNormalizedRef = useRef<CropRect>(targetRectNormalized);
  const liveTargetTransformRef = useRef<NonNullable<PhotoCaptureOverlay["transform"]>>({
    rotateDegrees: 0,
    flipX: false,
  });
  const dvdBounceStateRef = useRef<{
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    width: number;
    height: number;
    lastFrameAt: number;
  } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);

  useEffect(() => {
    preparePhotoShutterSound();
  }, []);
  const [capturedPolaroidUrl, setCapturedPolaroidUrl] = useState<string | null>(null);
  const [captureScore, setCaptureScore] = useState<number | null>(null);
  const [captureResult, setCaptureResult] = useState<PhotoCaptureResult | null>(null);
  const hasTutorial = Boolean(tutorialTitle || tutorialLines.length > 0);
  const [isTutorialOpen, setIsTutorialOpen] = useState(hasTutorial);
  const [hasUsedFreeRetakeOffer, setHasUsedFreeRetakeOffer] = useState(false);
  const [freeRetakeOriginalResult, setFreeRetakeOriginalResult] = useState<PhotoCaptureResult | null>(null);
  const [containerSize, setContainerSize] = useState<NaturalImageSize | null>(null);
  const [movingBackgroundPanOffsetX, setMovingBackgroundPanOffsetX] = useState(0);
  const [movingBackgroundZoomMultiplier, setMovingBackgroundZoomMultiplier] = useState(1);
  const cameraFrameSweep = useMemo(
    () => buildCameraFrameSweep(frameSweepFromY, frameSweepToY, frameSweepAxis),
    [frameSweepAxis, frameSweepFromY, frameSweepToY],
  );
  const isHorizontalSweep = frameSweepAxis === "horizontal";
  const hasDvdBounceTarget =
    targetMotion?.preset === "dvd-bounce" && captureOverlays.length > 0;
  const hasAmbientOverlayMotion = captureOverlays.some(
    (overlay) => Boolean(overlay.motion) || (overlay.frameSources?.length ?? 0) > 1,
  );
  const overlayFrameSources = useMemo(
    () =>
      Array.from(
        new Set(captureOverlays.flatMap((overlay) => overlay.frameSources ?? [])),
      ),
    [captureOverlays],
  );
  const overlayFrameSourceKey = overlayFrameSources.join("\u001f");
  const hasAmbientTargetMotion = captureOverlays.some(
    (overlay) => overlay.motion?.tracksPhotoTarget,
  );
  const hasLivePhotoTarget = hasDvdBounceTarget || hasAmbientTargetMotion;

  useEffect(() => {
    decodedOverlayFrameSourceKeyRef.current = "";
    if (overlayFrameSources.length === 0) return;

    let cancelled = false;
    void Promise.all(
      overlayFrameSources.map((src) => preloadGameImage(src).catch(() => undefined)),
    ).then(() => {
      if (!cancelled) decodedOverlayFrameSourceKeyRef.current = overlayFrameSourceKey;
    });
    return () => {
      cancelled = true;
    };
  }, [overlayFrameSourceKey, overlayFrameSources]);

  useEffect(() => {
    if (!enabled) return;
    const captureSources = Array.from(
      new Set([
        backgroundImageSrc,
        ...(cameraFrameImageSrc ? [cameraFrameImageSrc] : []),
        ...captureOverlays.flatMap((overlay) => [
          overlay.imageSrc,
          ...(overlay.frameSources ?? []),
        ]),
      ]),
    );
    void Promise.all(
      captureSources.map((src) => loadCaptureImage(src).catch(() => undefined)),
    );
  }, [backgroundImageSrc, cameraFrameImageSrc, captureOverlays, enabled]);

  const isMovingBackgroundEnabled = Boolean(movingBackground?.enabled);
  const movingBackgroundBaseScaleMultiplier = isMovingBackgroundEnabled
    ? movingBackground?.scaleMultiplier ?? 1
    : 1;
  const isMovingBackgroundZoomEnabled = Boolean(isMovingBackgroundEnabled && movingBackground?.zoom?.enabled);
  const movingBackgroundMinZoomMultiplier = movingBackground?.zoom?.minMultiplier ?? 0.92;
  const movingBackgroundMaxZoomMultiplier = movingBackground?.zoom?.maxMultiplier ?? 1.32;
  const movingBackgroundInitialZoomMultiplier = movingBackground?.zoom?.initialMultiplier ?? 1;
  const movingBackgroundWheelZoomStep = movingBackground?.zoom?.wheelStep ?? 0.07;
  const movingBackgroundPinchSensitivity = movingBackground?.zoom?.pinchSensitivity ?? 1;
  const movingBackgroundScaleMultiplier = movingBackgroundBaseScaleMultiplier * movingBackgroundZoomMultiplier;
  const movingBackgroundMode = movingBackground?.mode ?? "auto";
  const movingBackgroundPanRangePx = movingBackground?.panRangePx ?? 0;
  const movingBackgroundCenterOffsetPx = isMovingBackgroundEnabled
    ? movingBackground?.centerOffsetPx ?? 0
    : 0;
  const movingBackgroundDurationMs = movingBackground?.durationMs ?? 2800;
  const movingBackgroundSafePanRangePx = useMemo(() => {
    if (!isMovingBackgroundEnabled || !containerSize || !naturalImageSize) return 0;
    const metrics = getRenderedImageMetrics({
      containerWidth: containerSize.width,
      containerHeight: containerSize.height,
      natural: naturalImageSize,
      fitMode,
      scaleMultiplier: movingBackgroundScaleMultiplier,
    });
    return Math.max(0, (metrics.renderedWidth - containerSize.width) / 2 - 1);
  }, [
    containerSize,
    fitMode,
    isMovingBackgroundEnabled,
    movingBackgroundScaleMultiplier,
    naturalImageSize,
  ]);
  const hasCaptured = Boolean(capturedPolaroidUrl);
  const hasPassedPhotoCheck = (captureScore ?? 0) >= passScore;
  const isCaptureLockedByTutorial = hasTutorial && isTutorialOpen && !hasCaptured;
  const shouldUseWideShutter = isMovingBackgroundEnabled && movingBackgroundMode === "responsive" && !hasCaptured;
  const shouldShowShutterPointer = !shouldUseWideShutter && !hasCaptured && hasTutorial;
  const shouldShowFreeRetakeOffer = Boolean(
    freeRetakeOfferText && hasCaptured && hasPassedPhotoCheck && !hasUsedFreeRetakeOffer,
  );
  const shouldShowRetakeChoice = Boolean(
    freeRetakeOriginalResult && captureResult && hasCaptured && hasPassedPhotoCheck && hasUsedFreeRetakeOffer,
  );

  useEffect(() => {
    if (shutterFlashTimerRef.current !== null) {
      window.clearTimeout(shutterFlashTimerRef.current);
      shutterFlashTimerRef.current = null;
    }
    setIsCapturing(false);
    setIsShutterFlashing(false);
    setCapturedPolaroidUrl(null);
    setCaptureScore(null);
    setCaptureResult(null);
    setIsTutorialOpen(hasTutorial);
    setHasUsedFreeRetakeOffer(false);
    setFreeRetakeOriginalResult(null);
    captureTapCandidateRef.current = null;
    captureTapActivePointerIdsRef.current.clear();
    photoOverlayDragStateRef.current = null;
    liveOverlayStatesRef.current = [];
    isCaptureInFlightRef.current = false;
  }, [enabled, resetNonce, backgroundImageSrc, hasTutorial]);

  useEffect(() => {
    liveTargetRectNormalizedRef.current = targetRectNormalized;
    const initialImageDirection = getDvdBounceImageDirection(
      targetMotion?.initialDirection?.x ?? 1,
      targetMotion?.initialDirection?.y ?? 0.72,
    );
    liveTargetTransformRef.current = {
      rotateDegrees: initialImageDirection.rotateDegrees,
      flipX: initialImageDirection.flipX,
    };
    dvdBounceStateRef.current = null;
  }, [
    backgroundImageSrc,
    enabled,
    resetNonce,
    targetMotion?.initialDirection?.x,
    targetMotion?.initialDirection?.y,
    targetMotion?.preset,
    targetRectNormalized.height,
    targetRectNormalized.width,
    targetRectNormalized.x,
    targetRectNormalized.y,
  ]);

  useEffect(
    () => () => {
      if (shutterFlashTimerRef.current !== null) {
        window.clearTimeout(shutterFlashTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const initialZoom = isMovingBackgroundZoomEnabled
      ? clamp(
          movingBackgroundInitialZoomMultiplier,
          movingBackgroundMinZoomMultiplier,
          movingBackgroundMaxZoomMultiplier,
        )
      : 1;
    movingBackgroundZoomMultiplierRef.current = initialZoom;
    movingBackgroundActivePointersRef.current.clear();
    movingBackgroundPinchDistanceRef.current = null;
    movingBackgroundPinchStartZoomRef.current = initialZoom;
    setMovingBackgroundZoomMultiplier(initialZoom);
  }, [
    backgroundImageSrc,
    enabled,
    isMovingBackgroundZoomEnabled,
    movingBackgroundInitialZoomMultiplier,
    movingBackgroundMaxZoomMultiplier,
    movingBackgroundMinZoomMultiplier,
    resetNonce,
  ]);

  useEffect(() => {
    if (!enabled || !backgroundRef.current) return;
    const syncContainerSize = () => {
      const rect = backgroundRef.current?.getBoundingClientRect();
      if (!rect) return;
      setContainerSize({
        width: rect.width,
        height: rect.height,
      });
    };
    syncContainerSize();
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(syncContainerSize)
        : null;
    if (observer && backgroundRef.current) {
      observer.observe(backgroundRef.current);
    }
    window.addEventListener("resize", syncContainerSize);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", syncContainerSize);
    };
  }, [backgroundRef, enabled]);

  useEffect(() => {
    if (!enabled || !isMovingBackgroundEnabled || hasCaptured || isCaptureLockedByTutorial) {
      movingBackgroundPanOffsetXRef.current = 0;
      movingBackgroundTargetOffsetXRef.current = 0;
      movingBackgroundActivePointersRef.current.clear();
      movingBackgroundPinchDistanceRef.current = null;
      setMovingBackgroundPanOffsetX(0);
      return;
    }

    let frameId: number | null = null;
    const startedAt = performance.now();
    const backgroundNode = backgroundRef.current;
    const getPanRange = () =>
      Math.min(movingBackgroundPanRangePx, movingBackgroundSafePanRangePx);
    const getClampedOffset = (offset: number) =>
      clamp(offset, -movingBackgroundSafePanRangePx, movingBackgroundSafePanRangePx);
    const getRestingOffset = () => getClampedOffset(movingBackgroundCenterOffsetPx);
    const getPointerDistance = () => {
      const points = Array.from(movingBackgroundActivePointersRef.current.values());
      if (points.length < 2) return null;
      const first = points[0];
      const second = points[1];
      if (!first || !second) return null;
      return Math.hypot(second.x - first.x, second.y - first.y);
    };
    const applyZoomMultiplier = (nextZoom: number) => {
      const clampedZoom = clamp(
        nextZoom,
        movingBackgroundMinZoomMultiplier,
        movingBackgroundMaxZoomMultiplier,
      );
      movingBackgroundZoomMultiplierRef.current = clampedZoom;
      setMovingBackgroundZoomMultiplier(clampedZoom);
    };
    movingBackgroundTargetOffsetXRef.current = getRestingOffset();
    const handlePointerDown = (event: PointerEvent) => {
      if (isPhotoControlTarget(event.target)) return;
      if (!isMovingBackgroundZoomEnabled || movingBackgroundMode !== "responsive") return;
      movingBackgroundActivePointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      if (movingBackgroundActivePointersRef.current.size === 2) {
        movingBackgroundPinchDistanceRef.current = getPointerDistance();
        movingBackgroundPinchStartZoomRef.current = movingBackgroundZoomMultiplierRef.current;
      }
      try {
        backgroundNode?.setPointerCapture(event.pointerId);
      } catch {
        // Some browsers reject pointer capture on non-primary touch streams.
      }
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (!backgroundNode) return;
      if (
        isPhotoControlTarget(event.target) &&
        !movingBackgroundActivePointersRef.current.has(event.pointerId)
      ) return;
      if (isMovingBackgroundZoomEnabled && movingBackgroundActivePointersRef.current.has(event.pointerId)) {
        movingBackgroundActivePointersRef.current.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
        });
        const currentDistance = getPointerDistance();
        const startDistance = movingBackgroundPinchDistanceRef.current;
        if (currentDistance && startDistance && startDistance > 0) {
          const distanceRatio = currentDistance / startDistance;
          const zoomRatio = 1 + (distanceRatio - 1) * movingBackgroundPinchSensitivity;
          applyZoomMultiplier(movingBackgroundPinchStartZoomRef.current * zoomRatio);
          return;
        }
      }
      const rect = backgroundNode.getBoundingClientRect();
      if (rect.width <= 0) return;
      const normalizedX = clamp((event.clientX - rect.left - rect.width / 2) / (rect.width / 2), -1, 1);
      movingBackgroundTargetOffsetXRef.current = getClampedOffset(
        movingBackgroundCenterOffsetPx - normalizedX * getPanRange(),
      );
      lastPointerPanAtRef.current = Date.now();
    };
    const handlePointerUp = (event: PointerEvent) => {
      movingBackgroundActivePointersRef.current.delete(event.pointerId);
      if (movingBackgroundActivePointersRef.current.size < 2) {
        movingBackgroundPinchDistanceRef.current = null;
        movingBackgroundPinchStartZoomRef.current = movingBackgroundZoomMultiplierRef.current;
      }
      try {
        backgroundNode?.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture may already be released by the browser.
      }
    };
    const handlePointerLeave = () => {
      if (movingBackgroundActivePointersRef.current.size > 0) return;
      movingBackgroundTargetOffsetXRef.current = getRestingOffset();
    };
    const handleWheel = (event: WheelEvent) => {
      if (isPhotoControlTarget(event.target)) return;
      if (!isMovingBackgroundZoomEnabled || movingBackgroundMode !== "responsive") return;
      event.preventDefault();
      const direction = event.deltaY > 0 ? -1 : 1;
      applyZoomMultiplier(movingBackgroundZoomMultiplierRef.current + direction * movingBackgroundWheelZoomStep);
    };
    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (Date.now() - lastPointerPanAtRef.current < 1200) return;
      const gamma = event.gamma;
      if (typeof gamma !== "number") return;
      const normalizedTilt = clamp(gamma / 26, -1, 1);
      movingBackgroundTargetOffsetXRef.current = getClampedOffset(
        movingBackgroundCenterOffsetPx - normalizedTilt * getPanRange(),
      );
    };

    const originalTouchAction = backgroundNode?.style.touchAction;
    if (movingBackgroundMode === "responsive") {
      if (backgroundNode && isMovingBackgroundZoomEnabled) {
        backgroundNode.style.touchAction = "none";
      }
      backgroundNode?.addEventListener("pointerdown", handlePointerDown);
      backgroundNode?.addEventListener("pointermove", handlePointerMove);
      backgroundNode?.addEventListener("pointerup", handlePointerUp);
      backgroundNode?.addEventListener("pointercancel", handlePointerUp);
      backgroundNode?.addEventListener("pointerleave", handlePointerLeave);
      backgroundNode?.addEventListener("wheel", handleWheel, { passive: false });
      window.addEventListener("deviceorientation", handleDeviceOrientation);
    }

    const tick = (now: number) => {
      const duration = Math.max(1, movingBackgroundDurationMs);
      if (movingBackgroundMode === "auto") {
        const phase = ((now - startedAt) / duration) * Math.PI * 2 - Math.PI / 2;
        movingBackgroundTargetOffsetXRef.current = getClampedOffset(
          movingBackgroundCenterOffsetPx + Math.sin(phase) * getPanRange(),
        );
      }
      const currentOffset = movingBackgroundPanOffsetXRef.current;
      const targetOffset = movingBackgroundTargetOffsetXRef.current;
      const nextOffset =
        Math.abs(targetOffset - currentOffset) < 0.05
          ? targetOffset
          : currentOffset + (targetOffset - currentOffset) * 0.14;
      movingBackgroundPanOffsetXRef.current = nextOffset;
      setMovingBackgroundPanOffsetX(nextOffset);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      movingBackgroundActivePointersRef.current.clear();
      movingBackgroundPinchDistanceRef.current = null;
      backgroundNode?.removeEventListener("pointermove", handlePointerMove);
      backgroundNode?.removeEventListener("pointerdown", handlePointerDown);
      backgroundNode?.removeEventListener("pointerup", handlePointerUp);
      backgroundNode?.removeEventListener("pointercancel", handlePointerUp);
      backgroundNode?.removeEventListener("pointerleave", handlePointerLeave);
      backgroundNode?.removeEventListener("wheel", handleWheel);
      if (backgroundNode && isMovingBackgroundZoomEnabled) {
        backgroundNode.style.touchAction = originalTouchAction ?? "";
      }
      window.removeEventListener("deviceorientation", handleDeviceOrientation);
    };
  }, [
    backgroundRef,
    enabled,
    hasCaptured,
    isCaptureLockedByTutorial,
    isMovingBackgroundEnabled,
    isMovingBackgroundZoomEnabled,
    movingBackgroundMaxZoomMultiplier,
    movingBackgroundMinZoomMultiplier,
    movingBackgroundDurationMs,
    movingBackgroundCenterOffsetPx,
    movingBackgroundMode,
    movingBackgroundPanRangePx,
    movingBackgroundPinchSensitivity,
    movingBackgroundSafePanRangePx,
    movingBackgroundWheelZoomStep,
    resetNonce,
  ]);

  const movingBackgroundMetrics = useMemo(() => {
    if (!enabled || !isMovingBackgroundEnabled || !containerSize || !naturalImageSize) return null;
    return getRenderedImageMetrics({
      containerWidth: containerSize.width,
      containerHeight: containerSize.height,
      natural: naturalImageSize,
      fitMode,
      scaleMultiplier: movingBackgroundScaleMultiplier,
      offsetX: movingBackgroundPanOffsetX,
      clampToContainer: true,
    });
  }, [
    containerSize,
    enabled,
    fitMode,
    isMovingBackgroundEnabled,
    movingBackgroundPanOffsetX,
    movingBackgroundScaleMultiplier,
    naturalImageSize,
  ]);
  const captureImageMetrics = useMemo(() => {
    if (!enabled || !containerSize || !naturalImageSize) return null;
    return (
      movingBackgroundMetrics ??
      getRenderedImageMetrics({
        containerWidth: containerSize.width,
        containerHeight: containerSize.height,
        natural: naturalImageSize,
        fitMode,
      })
    );
  }, [containerSize, enabled, fitMode, movingBackgroundMetrics, naturalImageSize]);
  const renderedOverlayMetrics = useMemo(() => {
    if (!captureImageMetrics || captureOverlays.length === 0) return [];
    return captureOverlays.map((overlay, index) => ({
      id: overlay.id ?? `${overlay.imageSrc}-${index}`,
      imageSrc: overlay.imageSrc,
      opacity: overlay.opacity ?? 1,
      left:
        captureImageMetrics.offsetX +
        captureImageMetrics.renderedWidth * overlay.rectNormalized.x,
      top:
        captureImageMetrics.offsetY +
        captureImageMetrics.renderedHeight * overlay.rectNormalized.y,
      width: captureImageMetrics.renderedWidth * overlay.rectNormalized.width,
      height: captureImageMetrics.renderedHeight * overlay.rectNormalized.height,
    }));
  }, [
    captureOverlays,
    captureImageMetrics,
  ]);

  useEffect(() => {
    if (
      !hasAmbientOverlayMotion ||
      !enabled ||
      isCaptureLockedByTutorial ||
      hasCaptured ||
      !captureImageMetrics
    ) {
      return;
    }

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const previousStates = liveOverlayStatesRef.current;
    liveOverlayStatesRef.current = captureOverlays.map((overlay, index) => {
      const previous = previousStates[index];
      const dragOffsetXNormalized = previous?.dragOffsetXNormalized ?? 0;
      const dragOffsetYNormalized = previous?.dragOffsetYNormalized ?? 0;
      return {
        imageSrc: previous?.imageSrc ?? overlay.imageSrc,
        rectNormalized: {
          ...overlay.rectNormalized,
          x: overlay.rectNormalized.x + dragOffsetXNormalized,
          y: overlay.rectNormalized.y + dragOffsetYNormalized,
        },
        dragOffsetXNormalized,
        dragOffsetYNormalized,
        orbitOffsetXNormalized: 0,
        orbitOffsetYNormalized: 0,
        isDragging: false,
      };
    });

    let frameId: number | null = null;
    const startedAt = performance.now();
    const tick = (now: number) => {
      if (!isCaptureInFlightRef.current) {
        const elapsedMs = now - startedAt;
        captureOverlays.forEach((overlay, index) => {
          const state = liveOverlayStatesRef.current[index];
          const node = photoOverlayNodesRef.current[index];
          if (!state) return;

          const motion = overlay.motion;
          let hopFrameIndex: number | undefined;
          if (motion && !state.isDragging) {
            const durationMs = Math.max(1200, motion.durationMs ?? 4200);
            const direction = motion.direction ?? 1;
            const phase =
              ((elapsedMs / durationMs) * Math.PI * 2 * direction) +
              (motion.phaseOffsetRadians ?? 0);
            if (motion.preset === "hop-left") {
              const progress = ((phase / (Math.PI * 2)) % 1 + 1) % 1;
              const pose = samplePhotoHopMotion(progress, motion.hopKeyframes ?? []);
              if (motion.syncFramesToHop) hopFrameIndex = pose.frameIndex;
              // A foreground ticket stays with the hop, but circles the body
              // on its own slower clock, including while the frog is grounded.
              const orbitPhase = elapsedMs / Math.max(1200, motion.orbitDurationMs ?? durationMs) * Math.PI * 2;
              state.orbitOffsetXNormalized = prefersReducedMotion
                ? 0 : pose.x + Math.cos(orbitPhase) * (motion.radiusXNormalized ?? 0);
              state.orbitOffsetYNormalized = prefersReducedMotion
                ? 0 : pose.y + Math.sin(orbitPhase) * (motion.radiusYNormalized ?? 0);
            } else {
              state.orbitOffsetXNormalized = prefersReducedMotion
                ? 0
                : Math.cos(phase) * (motion.radiusXNormalized ?? 0);
              state.orbitOffsetYNormalized = prefersReducedMotion
                ? 0
                : Math.sin(phase) * (motion.radiusYNormalized ?? 0);
            }
            state.rectNormalized = {
              ...overlay.rectNormalized,
              x:
                overlay.rectNormalized.x +
                state.dragOffsetXNormalized +
                state.orbitOffsetXNormalized,
              y:
                overlay.rectNormalized.y +
                state.dragOffsetYNormalized +
                state.orbitOffsetYNormalized,
            };
          }

          const frameSources = overlay.frameSources;
          if (frameSources && frameSources.length > 0) {
            const frameDurationMs = Math.max(80, overlay.frameDurationMs ?? 280);
            const canAnimateFrames =
              decodedOverlayFrameSourceKeyRef.current === overlayFrameSourceKey;
            const frameIndex = prefersReducedMotion || !canAnimateFrames
              ? 0
              : (hopFrameIndex ?? Math.floor(elapsedMs / frameDurationMs)) % frameSources.length;
            state.imageSrc = frameSources[frameIndex] ?? overlay.imageSrc;
          } else {
            state.imageSrc = overlay.imageSrc;
          }

          if (motion?.tracksPhotoTarget) {
            liveTargetRectNormalizedRef.current = {
              ...targetRectNormalized,
              x:
                targetRectNormalized.x +
                state.rectNormalized.x -
                overlay.rectNormalized.x,
              y:
                targetRectNormalized.y +
                state.rectNormalized.y -
                overlay.rectNormalized.y,
            };
          }

          if (!node) return;
          const translateX =
            (state.rectNormalized.x - overlay.rectNormalized.x) *
            captureImageMetrics.renderedWidth;
          const translateY =
            (state.rectNormalized.y - overlay.rectNormalized.y) *
            captureImageMetrics.renderedHeight;
          node.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
          const frameNodes = photoOverlayFrameNodesRef.current[index] ?? [];
          frameNodes.forEach((frameNode) => {
            if (!frameNode) return;
            const isActiveFrame = frameNode.dataset.photoOverlayFrameSrc === state.imageSrc;
            frameNode.style.opacity = isActiveFrame ? "1" : "0";
            frameNode.dataset.photoOverlayFrameActive = isActiveFrame ? "true" : "false";
          });
        });
      }
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      photoOverlayDragStateRef.current = null;
    };
  }, [
    captureImageMetrics,
    captureOverlays,
    enabled,
    hasAmbientOverlayMotion,
    hasCaptured,
    isCaptureLockedByTutorial,
    overlayFrameSourceKey,
    targetRectNormalized,
  ]);

  const releasePhotoOverlayDrag = useCallback(
    (overlayIndex: number, pointerId: number, node?: HTMLDivElement | null) => {
      const dragState = photoOverlayDragStateRef.current;
      if (
        !dragState ||
        dragState.overlayIndex !== overlayIndex ||
        dragState.pointerId !== pointerId
      ) {
        return;
      }

      const state = liveOverlayStatesRef.current[overlayIndex];
      if (state) state.isDragging = false;
      const overlayNode = node ?? photoOverlayNodesRef.current[overlayIndex];
      if (overlayNode) {
        if (overlayNode.hasPointerCapture(pointerId)) {
          overlayNode.releasePointerCapture(pointerId);
        }
        overlayNode.dataset.photoOverlayDragging = "false";
        overlayNode.style.cursor = "grab";
        overlayNode.style.zIndex = `${2 + overlayIndex}`;
      }
      photoOverlayDragStateRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (!enabled || !hasAmbientOverlayMotion) return;

    const handleGlobalPointerEnd = (event: PointerEvent) => {
      const dragState = photoOverlayDragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      releasePhotoOverlayDrag(dragState.overlayIndex, event.pointerId);
    };
    const handleWindowBlur = () => {
      const dragState = photoOverlayDragStateRef.current;
      if (!dragState) return;
      releasePhotoOverlayDrag(dragState.overlayIndex, dragState.pointerId);
    };

    window.addEventListener("pointerup", handleGlobalPointerEnd, true);
    window.addEventListener("pointercancel", handleGlobalPointerEnd, true);
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("pointerup", handleGlobalPointerEnd, true);
      window.removeEventListener("pointercancel", handleGlobalPointerEnd, true);
      window.removeEventListener("blur", handleWindowBlur);
      handleWindowBlur();
    };
  }, [enabled, hasAmbientOverlayMotion, releasePhotoOverlayDrag]);

  const handlePhotoOverlayPointerDown = useCallback(
    (overlayIndex: number, event: React.PointerEvent<HTMLDivElement>) => {
      const overlay = captureOverlays[overlayIndex];
      const state = liveOverlayStatesRef.current[overlayIndex];
      if (
        !overlay?.motion?.draggable ||
        !state ||
        hasCaptured ||
        isCaptureInFlightRef.current ||
        !captureImageMetrics ||
        (event.pointerType === "mouse" && event.button !== 0)
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      state.isDragging = true;
      photoOverlayDragStateRef.current = {
        overlayIndex,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startRectXNormalized: state.rectNormalized.x,
        startRectYNormalized: state.rectNormalized.y,
      };
      event.currentTarget.dataset.photoOverlayDragging = "true";
      event.currentTarget.style.cursor = "grabbing";
      event.currentTarget.style.zIndex = "8";
    },
    [captureImageMetrics, captureOverlays, hasCaptured],
  );

  const handlePhotoOverlayPointerMove = useCallback(
    (overlayIndex: number, event: React.PointerEvent<HTMLDivElement>) => {
      const dragState = photoOverlayDragStateRef.current;
      const overlay = captureOverlays[overlayIndex];
      const state = liveOverlayStatesRef.current[overlayIndex];
      if (
        !dragState ||
        dragState.overlayIndex !== overlayIndex ||
        dragState.pointerId !== event.pointerId ||
        !overlay?.motion ||
        !state ||
        !captureImageMetrics
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const rangeX = Math.max(0, overlay.motion.dragRangeXNormalized ?? 0.12);
      const rangeY = Math.max(0, overlay.motion.dragRangeYNormalized ?? 0.08);
      const nextX = clamp(
        dragState.startRectXNormalized +
          (event.clientX - dragState.startClientX) / captureImageMetrics.renderedWidth,
        overlay.rectNormalized.x - rangeX,
        overlay.rectNormalized.x + rangeX,
      );
      const nextY = clamp(
        dragState.startRectYNormalized +
          (event.clientY - dragState.startClientY) / captureImageMetrics.renderedHeight,
        overlay.rectNormalized.y - rangeY,
        overlay.rectNormalized.y + rangeY,
      );
      state.rectNormalized = { ...overlay.rectNormalized, x: nextX, y: nextY };
      state.dragOffsetXNormalized =
        nextX - overlay.rectNormalized.x - state.orbitOffsetXNormalized;
      state.dragOffsetYNormalized =
        nextY - overlay.rectNormalized.y - state.orbitOffsetYNormalized;
    },
    [captureImageMetrics, captureOverlays],
  );

  const handlePhotoOverlayPointerEnd = useCallback(
    (overlayIndex: number, event: React.PointerEvent<HTMLDivElement>) => {
      const dragState = photoOverlayDragStateRef.current;
      if (
        !dragState ||
        dragState.overlayIndex !== overlayIndex ||
        dragState.pointerId !== event.pointerId
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      releasePhotoOverlayDrag(overlayIndex, event.pointerId, event.currentTarget);
    },
    [releasePhotoOverlayDrag],
  );

  const handlePhotoOverlayKeyDown = useCallback(
    (overlayIndex: number, event: React.KeyboardEvent<HTMLDivElement>) => {
      const overlay = captureOverlays[overlayIndex];
      const state = liveOverlayStatesRef.current[overlayIndex];
      if (!overlay?.motion?.draggable || !state) return;

      const step = event.shiftKey ? 0.025 : 0.012;
      const delta =
        event.key === "ArrowLeft"
          ? { x: -step, y: 0 }
          : event.key === "ArrowRight"
            ? { x: step, y: 0 }
            : event.key === "ArrowUp"
              ? { x: 0, y: -step }
              : event.key === "ArrowDown"
                ? { x: 0, y: step }
                : null;
      if (!delta) return;

      event.preventDefault();
      event.stopPropagation();
      const rangeX = Math.max(0, overlay.motion.dragRangeXNormalized ?? 0.12);
      const rangeY = Math.max(0, overlay.motion.dragRangeYNormalized ?? 0.08);
      const nextX = clamp(
        state.rectNormalized.x + delta.x,
        overlay.rectNormalized.x - rangeX,
        overlay.rectNormalized.x + rangeX,
      );
      const nextY = clamp(
        state.rectNormalized.y + delta.y,
        overlay.rectNormalized.y - rangeY,
        overlay.rectNormalized.y + rangeY,
      );
      state.dragOffsetXNormalized =
        nextX - overlay.rectNormalized.x - state.orbitOffsetXNormalized;
      state.dragOffsetYNormalized =
        nextY - overlay.rectNormalized.y - state.orbitOffsetYNormalized;
    },
    [captureOverlays],
  );

  useEffect(() => {
    if (
      !hasDvdBounceTarget ||
      !enabled ||
      isCaptureLockedByTutorial ||
      hasCaptured ||
      !containerSize ||
      !captureImageMetrics ||
      !renderedOverlayMetrics[0]
    ) {
      return;
    }

    let frameId: number | null = null;
    const baseOverlay = renderedOverlayMetrics[0];
    const edgeInset = Math.max(0, targetMotion?.edgeInsetPx ?? 8);
    const maximumSize = Math.max(
      44,
      Math.min(containerSize.width - edgeInset * 2, containerSize.height - edgeInset * 2),
    );
    const targetSize = clamp(
      targetMotion?.sizePx ?? Math.min(baseOverlay.width, baseOverlay.height),
      44,
      maximumSize,
    );
    const speed = Math.max(40, targetMotion?.speedPxPerSecond ?? 160);
    const directionX = targetMotion?.initialDirection?.x ?? 1;
    const directionY = targetMotion?.initialDirection?.y ?? 0.72;
    const directionMagnitude = Math.max(0.001, Math.hypot(directionX, directionY));
    const minimumX = edgeInset;
    const minimumY = edgeInset;
    const maximumX = Math.max(minimumX, containerSize.width - targetSize - edgeInset);
    const maximumY = Math.max(minimumY, containerSize.height - targetSize - edgeInset);

    if (!dvdBounceStateRef.current) {
      dvdBounceStateRef.current = {
        x: clamp(baseOverlay.left + baseOverlay.width / 2 - targetSize / 2, minimumX, maximumX),
        y: clamp(baseOverlay.top + baseOverlay.height / 2 - targetSize / 2, minimumY, maximumY),
        velocityX: (directionX / directionMagnitude) * speed,
        velocityY: (directionY / directionMagnitude) * speed,
        width: targetSize,
        height: targetSize,
        lastFrameAt: performance.now(),
      };
    } else {
      dvdBounceStateRef.current.width = targetSize;
      dvdBounceStateRef.current.height = targetSize;
      dvdBounceStateRef.current.x = clamp(dvdBounceStateRef.current.x, minimumX, maximumX);
      dvdBounceStateRef.current.y = clamp(dvdBounceStateRef.current.y, minimumY, maximumY);
      dvdBounceStateRef.current.lastFrameAt = performance.now();
    }

    const targetOverlayNode = animatedTargetOverlayRef.current;
    if (targetOverlayNode) {
      targetOverlayNode.style.width = `${targetSize}px`;
      targetOverlayNode.style.height = `${targetSize}px`;
    }

    const tick = (now: number) => {
      const state = dvdBounceStateRef.current;
      if (!state) return;

      if (!isCaptureInFlightRef.current) {
        const elapsedSeconds = Math.min(0.05, Math.max(0, (now - state.lastFrameAt) / 1000));
        let nextX = state.x + state.velocityX * elapsedSeconds;
        let nextY = state.y + state.velocityY * elapsedSeconds;
        let hitBoundary = false;

        if (nextX <= minimumX && state.velocityX < 0) {
          nextX = minimumX;
          state.velocityX = Math.abs(state.velocityX);
          hitBoundary = true;
        } else if (nextX >= maximumX && state.velocityX > 0) {
          nextX = maximumX;
          state.velocityX = -Math.abs(state.velocityX);
          hitBoundary = true;
        }

        if (nextY <= minimumY && state.velocityY < 0) {
          nextY = minimumY;
          state.velocityY = Math.abs(state.velocityY);
          hitBoundary = true;
        } else if (nextY >= maximumY && state.velocityY > 0) {
          nextY = maximumY;
          state.velocityY = -Math.abs(state.velocityY);
          hitBoundary = true;
        }

        state.x = nextX;
        state.y = nextY;
        if (hitBoundary && targetMotion?.edgeHitSfxId) {
          playGameSfx(targetMotion.edgeHitSfxId);
        }
      }
      state.lastFrameAt = now;

      const normalizedWidth = state.width / captureImageMetrics.renderedWidth;
      const normalizedHeight = state.height / captureImageMetrics.renderedHeight;
      liveTargetRectNormalizedRef.current = {
        x: clamp(
          (state.x - captureImageMetrics.offsetX) / captureImageMetrics.renderedWidth,
          0,
          Math.max(0, 1 - normalizedWidth),
        ),
        y: clamp(
          (state.y - captureImageMetrics.offsetY) / captureImageMetrics.renderedHeight,
          0,
          Math.max(0, 1 - normalizedHeight),
        ),
        width: normalizedWidth,
        height: normalizedHeight,
      };

      const imageDirection = getDvdBounceImageDirection(
        state.velocityX,
        state.velocityY,
      );
      liveTargetTransformRef.current = {
        rotateDegrees: imageDirection.rotateDegrees,
        flipX: imageDirection.flipX,
      };
      const overlayNode = animatedTargetOverlayRef.current;
      if (overlayNode) {
        const translateX = state.x - baseOverlay.left;
        const translateY = state.y - baseOverlay.top;
        overlayNode.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) rotate(${imageDirection.rotateDegrees}deg) scaleX(${imageDirection.flipX ? -1 : 1})`;
        overlayNode.dataset.photoTargetFacing = imageDirection.label;
      }
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, [
    captureImageMetrics,
    containerSize,
    enabled,
    hasCaptured,
    hasDvdBounceTarget,
    isCaptureLockedByTutorial,
    renderedOverlayMetrics,
    targetMotion?.edgeHitSfxId,
    targetMotion?.edgeInsetPx,
    targetMotion?.initialDirection?.x,
    targetMotion?.initialDirection?.y,
    targetMotion?.sizePx,
    targetMotion?.speedPxPerSecond,
  ]);

  const handleShutterClick = useCallback(() => {
    if (
      !enabled ||
      isCaptureLockedByTutorial ||
      isCapturing ||
      isCaptureInFlightRef.current ||
      hasCaptured ||
      !backgroundRef.current ||
      !cameraFrameRef.current ||
      !naturalImageSize
    ) return;
    const shouldContinueCapture = onBeforeCapture?.();
    if (shouldContinueCapture === false) return;
    playPhotoShutterSound();
    const capturedBackgroundRect = backgroundRef.current.getBoundingClientRect();
    const capturedFrameRect = cameraFrameRef.current.getBoundingClientRect();
    const capturedFrameInContainer: CropRect = {
      x: capturedFrameRect.left - capturedBackgroundRect.left,
      y: capturedFrameRect.top - capturedBackgroundRect.top,
      width: capturedFrameRect.width,
      height: capturedFrameRect.height,
    };
    const capturedBackgroundScaleMultiplier = movingBackgroundScaleMultiplier;
    const capturedBackgroundOffsetX = isMovingBackgroundEnabled
      ? movingBackgroundPanOffsetXRef.current
      : 0;
    const capturedTargetRectNormalized = hasLivePhotoTarget
      ? { ...liveTargetRectNormalizedRef.current }
      : targetRectNormalized;
    const capturedTargetTransform = hasDvdBounceTarget
      ? { ...liveTargetTransformRef.current }
      : undefined;
    const capturedOverlays = captureOverlays.map((overlay, index) => {
      const liveOverlay = hasAmbientOverlayMotion
        ? liveOverlayStatesRef.current[index]
        : null;
      if (hasDvdBounceTarget && index === 0) {
        return {
          ...overlay,
          imageSrc: liveOverlay?.imageSrc ?? overlay.imageSrc,
          rectNormalized: capturedTargetRectNormalized,
          transform: capturedTargetTransform,
        };
      }
      return {
        ...overlay,
        imageSrc: liveOverlay?.imageSrc ?? overlay.imageSrc,
        rectNormalized: liveOverlay?.rectNormalized ?? overlay.rectNormalized,
      };
    });
    isCaptureInFlightRef.current = true;
    const runCapture = async () => {
      try {
        setIsCapturing(true);
        const captureStartedAt = window.performance.now();
        if (shutterFlashTimerRef.current !== null) {
          window.clearTimeout(shutterFlashTimerRef.current);
        }
        setIsShutterFlashing(true);
        shutterFlashTimerRef.current = window.setTimeout(() => {
          setIsShutterFlashing(false);
          shutterFlashTimerRef.current = null;
        }, SHUTTER_FLASH_DURATION_MS);
        await new Promise<void>((resolve) => {
          window.setTimeout(() => resolve(), 120);
        });
        const cropRect = toImageCropRect({
          frameInContainer: capturedFrameInContainer,
          containerWidth: capturedBackgroundRect.width,
          containerHeight: capturedBackgroundRect.height,
          natural: naturalImageSize,
          targetRatio: POLAROID_TARGET_RATIO,
          fitMode,
          imageScaleMultiplier: capturedBackgroundScaleMultiplier,
          imageOffsetX: capturedBackgroundOffsetX,
          imageClampToContainer: isMovingBackgroundEnabled,
        });
        const cameraFrameMappedRect = toImageCropRect({
          frameInContainer: capturedFrameInContainer,
          containerWidth: capturedBackgroundRect.width,
          containerHeight: capturedBackgroundRect.height,
          natural: naturalImageSize,
          targetRatio: CAMERA_FRAME_WIDTH / CAMERA_FRAME_HEIGHT,
          fitMode,
          imageScaleMultiplier: capturedBackgroundScaleMultiplier,
          imageOffsetX: capturedBackgroundOffsetX,
          imageClampToContainer: isMovingBackgroundEnabled,
        });
        const targetRect: CropRect = {
          x: naturalImageSize.width * capturedTargetRectNormalized.x,
          y: naturalImageSize.height * capturedTargetRectNormalized.y,
          width: naturalImageSize.width * capturedTargetRectNormalized.width,
          height: naturalImageSize.height * capturedTargetRectNormalized.height,
        };
        const score = calculateCameraFrameScore(cameraFrameMappedRect, targetRect);
        const capturedImageUrl = await renderCropToDataUrl(
          backgroundImageSrc,
          cropRect,
          640,
          640,
          capturedOverlays,
        );
        const result: PhotoCaptureResult = {
          score,
          polaroidUrl: capturedImageUrl,
          sourceImage: backgroundImageSrc,
          normalizedCameraFrameRect: {
            x: Math.max(0, Math.min(1, cameraFrameMappedRect.x / naturalImageSize.width)),
            y: Math.max(0, Math.min(1, cameraFrameMappedRect.y / naturalImageSize.height)),
            width: Math.max(0, Math.min(1, cameraFrameMappedRect.width / naturalImageSize.width)),
            height: Math.max(0, Math.min(1, cameraFrameMappedRect.height / naturalImageSize.height)),
          },
          normalizedCroppedRect: {
            x: Math.max(0, Math.min(1, cropRect.x / naturalImageSize.width)),
            y: Math.max(0, Math.min(1, cropRect.y / naturalImageSize.height)),
            width: Math.max(0, Math.min(1, cropRect.width / naturalImageSize.width)),
            height: Math.max(0, Math.min(1, cropRect.height / naturalImageSize.height)),
          },
          framePreviewUrl: capturedImageUrl,
        };
        const resultRevealDelay = Math.max(
          0,
          CAPTURE_RESULT_REVEAL_DELAY_MS - (window.performance.now() - captureStartedAt),
        );
        if (resultRevealDelay > 0) {
          await new Promise<void>((resolve) => {
            window.setTimeout(() => resolve(), resultRevealDelay);
          });
        }
        playGameSfx(score < passScore ? "photoResultNegative" : "photoResultNormal");
        setCaptureResult(result);
        setCaptureScore(score);
        setCapturedPolaroidUrl(capturedImageUrl);
      } finally {
        isCaptureInFlightRef.current = false;
        setIsCapturing(false);
      }
    };
    void runCapture();
  }, [
    backgroundImageSrc,
    backgroundRef,
    captureOverlays,
    enabled,
    fitMode,
    hasAmbientOverlayMotion,
    hasCaptured,
    hasDvdBounceTarget,
    hasLivePhotoTarget,
    isCaptureLockedByTutorial,
    isCapturing,
    isMovingBackgroundEnabled,
    movingBackgroundScaleMultiplier,
    naturalImageSize,
    onBeforeCapture,
    passScore,
    targetRectNormalized,
  ]);

  useEffect(() => {
    if (
      captureTriggerMode === "shutter-only" ||
      !enabled ||
      isCaptureLockedByTutorial ||
      hasCaptured ||
      !backgroundRef.current
    ) return;
    const backgroundNode = backgroundRef.current;

    const markMultiPointer = () => {
      if (captureTapCandidateRef.current) {
        captureTapCandidateRef.current.hadMultiPointer = true;
      }
    };

    const clearTapCandidate = () => {
      captureTapCandidateRef.current = null;
      captureTapActivePointerIdsRef.current.clear();
    };

    const handleTapPointerDown = (event: PointerEvent) => {
      if (isPhotoControlTarget(event.target)) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

      captureTapActivePointerIdsRef.current.add(event.pointerId);
      if (captureTapActivePointerIdsRef.current.size > 1) {
        markMultiPointer();
        return;
      }

      captureTapCandidateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startedAt: performance.now(),
        hadMultiPointer: false,
        moved: false,
      };
    };

    const handleTapPointerMove = (event: PointerEvent) => {
      const candidate = captureTapCandidateRef.current;
      if (!candidate) return;
      if (captureTapActivePointerIdsRef.current.size > 1) {
        candidate.hadMultiPointer = true;
      }
      if (candidate.pointerId !== event.pointerId) {
        candidate.hadMultiPointer = true;
        return;
      }
      const distance = Math.hypot(event.clientX - candidate.startX, event.clientY - candidate.startY);
      if (distance > TAP_CAPTURE_MAX_MOVE_PX) {
        candidate.moved = true;
      }
    };

    const handleTapPointerUp = (event: PointerEvent) => {
      const activePointerCount = captureTapActivePointerIdsRef.current.size;
      const candidate = captureTapCandidateRef.current;
      if (activePointerCount > 1) {
        markMultiPointer();
      }
      captureTapActivePointerIdsRef.current.delete(event.pointerId);

      if (!candidate || candidate.pointerId !== event.pointerId) {
        if (captureTapActivePointerIdsRef.current.size === 0 && !candidate) {
          captureTapCandidateRef.current = null;
        }
        return;
      }

      const distance = Math.hypot(event.clientX - candidate.startX, event.clientY - candidate.startY);
      const elapsed = performance.now() - candidate.startedAt;
      const shouldCapture =
        activePointerCount <= 1 &&
        !candidate.hadMultiPointer &&
        !candidate.moved &&
        distance <= TAP_CAPTURE_MAX_MOVE_PX &&
        elapsed <= TAP_CAPTURE_MAX_DURATION_MS &&
        !isPhotoControlTarget(event.target);

      captureTapCandidateRef.current = null;
      if (shouldCapture) {
        event.preventDefault();
        handleShutterClick();
      }
    };

    backgroundNode.addEventListener("pointerdown", handleTapPointerDown);
    backgroundNode.addEventListener("pointermove", handleTapPointerMove);
    backgroundNode.addEventListener("pointerup", handleTapPointerUp);
    backgroundNode.addEventListener("pointercancel", clearTapCandidate);

    return () => {
      backgroundNode.removeEventListener("pointerdown", handleTapPointerDown);
      backgroundNode.removeEventListener("pointermove", handleTapPointerMove);
      backgroundNode.removeEventListener("pointerup", handleTapPointerUp);
      backgroundNode.removeEventListener("pointercancel", clearTapCandidate);
      captureTapCandidateRef.current = null;
      captureTapActivePointerIdsRef.current.clear();
    };
  }, [
    backgroundRef,
    captureTriggerMode,
    enabled,
    handleShutterClick,
    hasCaptured,
    isCaptureLockedByTutorial,
  ]);

  useEffect(() => {
    if (
      captureTriggerMode === "shutter-only" ||
      !enabled ||
      isCaptureLockedByTutorial ||
      hasCaptured
    ) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || isEditableTarget(event.target)) return;
      if (event.code !== "Space" && event.key !== " ") return;

      event.preventDefault();
      handleShutterClick();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    captureTriggerMode,
    enabled,
    handleShutterClick,
    hasCaptured,
    isCaptureLockedByTutorial,
  ]);

  const handleRetakePhoto = () => {
    setCapturedPolaroidUrl(null);
    setCaptureScore(null);
    setCaptureResult(null);
  };

  const handleUseFreeRetake = () => {
    if (captureResult) {
      setFreeRetakeOriginalResult(captureResult);
    }
    setHasUsedFreeRetakeOffer(true);
    handleRetakePhoto();
  };

  const handleChoosePhoto = (result: PhotoCaptureResult) => {
    playGameSfx("photoKeep");
    onConfirm(result);
    setCapturedPolaroidUrl(null);
    setCaptureScore(null);
    setCaptureResult(null);
    setFreeRetakeOriginalResult(null);
  };

  const handleConfirmPhoto = () => {
    if (!captureResult || !hasPassedPhotoCheck) return;
    playGameSfx("photoKeep");
    onConfirm(captureResult);
    setCapturedPolaroidUrl(null);
    setCaptureScore(null);
    setCaptureResult(null);
  };

  const handleTutorialConfirm = () => {
    playGameSfx("uiDialogContinue");
    if (isMovingBackgroundEnabled && movingBackgroundMode === "responsive") {
      const orientationEvent = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<"granted" | "denied">;
      };
      if (typeof orientationEvent?.requestPermission === "function") {
        void orientationEvent.requestPermission().catch(() => undefined);
      }
    }
    setIsTutorialOpen(false);
  };

  if (!enabled) return null;

  return (
    <>
      {movingBackgroundMetrics ? (
        <img
          src={backgroundImageSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            position: "absolute",
            left: `${movingBackgroundMetrics.offsetX}px`,
            top: `${movingBackgroundMetrics.offsetY}px`,
            width: `${movingBackgroundMetrics.renderedWidth}px`,
            height: "auto",
            maxWidth: "none",
            display: "block",
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 1,
          }}
        />
      ) : null}

      {renderedOverlayMetrics.map((overlay, index) => {
        const overlayConfig = captureOverlays[index];
        const isDraggable = Boolean(overlayConfig?.motion?.draggable);
        const frameSources = overlayConfig?.frameSources?.length
          ? overlayConfig.frameSources
          : [overlay.imageSrc];
        return (
          <div
            key={overlay.id}
            ref={(node) => {
              photoOverlayNodesRef.current[index] = node;
              if (index === 0 && hasDvdBounceTarget) {
                animatedTargetOverlayRef.current = node;
              }
            }}
            data-photo-capture-overlay="true"
            data-photo-control={isDraggable ? "true" : undefined}
            data-photo-overlay-draggable={isDraggable ? "true" : undefined}
            data-photo-overlay-id={overlayConfig?.id}
            data-photo-target-motion={
              index === 0 && hasDvdBounceTarget ? "dvd-bounce" : overlayConfig?.motion?.preset
            }
            role={isDraggable ? "button" : undefined}
            aria-label={isDraggable ? overlayConfig?.ariaLabel : undefined}
            aria-hidden={isDraggable ? undefined : "true"}
            tabIndex={isDraggable ? 0 : undefined}
            onPointerDown={
              isDraggable
                ? (event) => handlePhotoOverlayPointerDown(index, event)
                : undefined
            }
            onPointerMove={
              isDraggable
                ? (event) => handlePhotoOverlayPointerMove(index, event)
                : undefined
            }
            onPointerUp={
              isDraggable
                ? (event) => handlePhotoOverlayPointerEnd(index, event)
                : undefined
            }
            onPointerCancel={
              isDraggable
                ? (event) => handlePhotoOverlayPointerEnd(index, event)
                : undefined
            }
            onLostPointerCapture={
              isDraggable
                ? (event) => handlePhotoOverlayPointerEnd(index, event)
                : undefined
            }
            onKeyDown={
              isDraggable
                ? (event) => handlePhotoOverlayKeyDown(index, event)
                : undefined
            }
            style={{
              position: "absolute",
              left: `${overlay.left}px`,
              top: `${overlay.top}px`,
              width: `${overlay.width}px`,
              height: `${overlay.height}px`,
              maxWidth: "none",
              display: "block",
              pointerEvents: isDraggable ? "auto" : "none",
              touchAction: isDraggable ? "none" : undefined,
              cursor: isDraggable ? "grab" : undefined,
              userSelect: "none",
              transformOrigin: "center center",
              clipPath: overlayConfig?.interactionClipPath,
              filter: isDraggable
                ? "drop-shadow(0 4px 3px rgba(58, 43, 34, 0.2))"
                : undefined,
              willChange:
                overlayConfig?.motion || (index === 0 && hasDvdBounceTarget)
                  ? "transform"
                  : undefined,
              opacity: overlay.opacity,
              zIndex: 2 + index,
            }}
          >
            {frameSources.map((frameSrc, frameIndex) => (
              <img
                key={frameSrc}
                ref={(node) => {
                  if (!photoOverlayFrameNodesRef.current[index]) {
                    photoOverlayFrameNodesRef.current[index] = [];
                  }
                  photoOverlayFrameNodesRef.current[index][frameIndex] = node;
                }}
                src={frameSrc}
                alt=""
                aria-hidden="true"
                draggable={false}
                loading="eager"
                decoding="sync"
                data-photo-overlay-frame-src={frameSrc}
                data-photo-overlay-frame-active={frameIndex === 0 ? "true" : "false"}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  maxWidth: "none",
                  objectFit: "contain",
                  display: "block",
                  pointerEvents: "none",
                  userSelect: "none",
                  opacity: frameIndex === 0 ? 1 : 0,
                }}
              />
            ))}
          </div>
        );
      })}

      {isCaptureLockedByTutorial ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={18}
          data-photo-control="true"
          bgColor="rgba(36,28,22,0.58)"
          backdropFilter="blur(2px)"
          alignItems="center"
          justifyContent="center"
          p={{ base: "16px", sm: "24px" }}
          pointerEvents="auto"
          overflowY="auto"
          onPointerDown={(event) => event.stopPropagation()}
          onPointerMove={(event) => event.stopPropagation()}
        >
          <Flex
            w="100%"
            maxW="602px"
            maxH="100%"
            borderRadius={{ base: "20px", sm: "24px" }}
            bgColor={PHOTO_TUTORIAL_COLOR.surface}
            boxShadow="0 20px 48px rgba(52,37,26,0.28)"
            p={{ base: "20px", sm: "28px" }}
            direction="column"
            gap={{ base: "16px", sm: "20px" }}
            overflowY="auto"
            style={{ containerType: "inline-size" }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <Flex direction="column" gap={{ base: "12px", sm: "16px" }}>
              <Text
                color={PHOTO_TUTORIAL_COLOR.accent}
                fontSize="clamp(22px, 5.3cqi, 32px)"
                fontWeight="700"
                lineHeight="1.25"
                textAlign="center"
              >
                {tutorialTitle ?? "拍照教學"}
              </Text>
              {tutorialDemoImageSrc ? (
                <Flex
                  position="relative"
                  w="100%"
                  h="154px"
                  minH="154px"
                  borderRadius={{ base: "18px", sm: "24px" }}
                  overflow="hidden"
                  alignItems="center"
                  justifyContent="center"
                  bgColor={PHOTO_TUTORIAL_COLOR.preview}
                  bgImage={`url('${PHOTO_TUTORIAL_DOTS_IMAGE}')`}
                  bgSize="calc(100% + 13px) auto"
                  backgroundPosition="center 52%"
                  bgRepeat="no-repeat"
                >
                  <ChakraImage
                    src={tutorialDemoImageSrc}
                    alt={tutorialDemoImageAlt}
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    w="clamp(116px, 44%, 240px)"
                    h="clamp(116px, 74%, 240px)"
                    objectFit="contain"
                  />
                  <Flex
                    position="absolute"
                    left="50%"
                    top="50%"
                    w="104px"
                    h="84px"
                    borderRadius="12px"
                    border="3px solid rgba(255,255,255,0.96)"
                    boxShadow="0 3px 12px rgba(36,50,46,0.3)"
                    animation={`${tutorialFrameSweep} 2400ms ease-in-out infinite`}
                  />
                  <Flex
                    position="absolute"
                    left="50%"
                    top="17px"
                    w="104px"
                    h="84px"
                    ml="-52px"
                    borderRadius="12px"
                    border="3px solid #FFE276"
                    boxShadow="0 0 0 3px rgba(255,226,118,0.22), 0 0 18px rgba(255,226,118,0.72)"
                    animation={`${tutorialTargetLock} 2400ms ease-in-out infinite`}
                  />
                  <Flex
                    position="absolute"
                    right={{ base: "12px", sm: "18px" }}
                    bottom={{ base: "12px", sm: "16px" }}
                    w="clamp(48px, 15%, 82px)"
                    h="clamp(48px, 15%, 82px)"
                    borderRadius="999px"
                    bgColor={PHOTO_TUTORIAL_COLOR.accent}
                    color="white"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 7px 16px rgba(75,50,32,0.24)"
                    animation={`${tutorialShutterTap} 2400ms ease-in-out infinite`}
                  >
                    <ChakraImage
                      src={PHOTO_TUTORIAL_CAMERA_IMAGE}
                      alt=""
                      aria-hidden="true"
                      w="58.5%"
                      h="58.5%"
                      objectFit="contain"
                    />
                  </Flex>
                  <Box
                    position="absolute"
                    inset="0"
                    bgColor="white"
                    pointerEvents="none"
                    animation={`${tutorialShutterFlash} 2400ms ease-in-out infinite`}
                  />
                </Flex>
              ) : null}
              {!hideTutorialLines ? (
                <Flex direction="column" gap="9px">
                  {(tutorialLines.length > 0
                    ? tutorialLines
                    : ["等取景框掃到小日獸身上時按下快門。", "拍得越準，之後能得到的回饋越好。"]
                  ).map((line, index) => {
                    const highlightStart = tutorialHighlightText
                      ? line.indexOf(tutorialHighlightText)
                      : -1;
                    const hasHighlight = highlightStart >= 0 && tutorialHighlightText;
                    const beforeHighlight = hasHighlight ? line.slice(0, highlightStart) : "";
                    const afterHighlight = hasHighlight
                      ? line.slice(highlightStart + tutorialHighlightText.length)
                      : "";

                    return (
                      <Text
                        key={`${line}-${index}`}
                        color={PHOTO_TUTORIAL_COLOR.copy}
                        fontSize={hasHighlight ? "16px" : "15px"}
                        fontWeight="700"
                        lineHeight="1.55"
                        textAlign="center"
                      >
                        {hasHighlight ? (
                          <>
                            {beforeHighlight}
                            <Text
                              as="span"
                              color="#5D3C22"
                              fontWeight="900"
                              bgColor={PHOTO_TUTORIAL_COLOR.highlight}
                              borderRadius="7px"
                              px="5px"
                              py="1px"
                              boxDecorationBreak="clone"
                            >
                              {tutorialHighlightText}
                            </Text>
                            {afterHighlight}
                          </>
                        ) : (
                          line
                        )}
                      </Text>
                    );
                  })}
                </Flex>
              ) : null}
            </Flex>
            <Flex
              as="button"
              w="100%"
              minH={{ base: "56px", sm: "68px" }}
              px="24px"
              borderRadius="50px"
              bgColor={PHOTO_TUTORIAL_COLOR.accent}
              color="white"
              alignItems="center"
              justifyContent="center"
              fontSize="clamp(20px, 4.7cqi, 32px)"
              fontWeight="500"
              lineHeight="1"
              boxShadow="none"
              cursor="pointer"
              transition="transform 140ms ease, background-color 140ms ease"
              _hover={{ bgColor: "#8F6A50" }}
              _active={{ transform: "scale(0.985)", bgColor: "#856248" }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                handleTutorialConfirm();
              }}
            >
              {tutorialConfirmLabel}
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {!hasCaptured && !isCaptureLockedByTutorial ? (
        <Flex
          pointerEvents="none"
          position="absolute"
          inset="0"
          zIndex={6}
          justifyContent={isHorizontalSweep ? "flex-start" : "center"}
          overflow="hidden"
        >
          <Flex
            ref={cameraFrameRef}
            data-photo-camera-frame="true"
            position="absolute"
            left={isHorizontalSweep ? "0" : "50%"}
            top={isHorizontalSweep ? "50%" : "0"}
            w={`${cameraFrameSizePx ?? CAMERA_FRAME_WIDTH}px`}
            h={`${cameraFrameSizePx ?? CAMERA_FRAME_HEIGHT}px`}
            borderRadius="14px"
            animation={`${cameraFrameSweep} 2.2s ease-in-out infinite`}
            transform={isHorizontalSweep ? "translateY(-50%)" : "translateX(-50%)"}
            willChange="transform"
          >
            {cameraFrameImageSrc ? (
              <ChakraImage
                src={cameraFrameImageSrc}
                alt=""
                aria-hidden="true"
                position="absolute"
                inset="0"
                w="100%"
                h="100%"
                objectFit="contain"
                pointerEvents="none"
                userSelect="none"
              />
            ) : (
              <Flex
                position="absolute"
                inset="0"
                borderRadius="14px"
                boxShadow="0 0 0 2px rgba(44,31,20,0.22), 0 10px 24px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.14)"
                opacity={0.78}
              >
                <Flex position="absolute" top="0" left="0" w="26px" h="26px" borderTop="4px solid rgba(255,255,255,0.95)" borderLeft="4px solid rgba(255,255,255,0.95)" borderTopLeftRadius="12px" />
                <Flex position="absolute" top="0" right="0" w="26px" h="26px" borderTop="4px solid rgba(255,255,255,0.95)" borderRight="4px solid rgba(255,255,255,0.95)" borderTopRightRadius="12px" />
                <Flex position="absolute" bottom="0" left="0" w="26px" h="26px" borderBottom="4px solid rgba(255,255,255,0.95)" borderLeft="4px solid rgba(255,255,255,0.95)" borderBottomLeftRadius="12px" />
                <Flex position="absolute" bottom="0" right="0" w="26px" h="26px" borderBottom="4px solid rgba(255,255,255,0.95)" borderRight="4px solid rgba(255,255,255,0.95)" borderBottomRightRadius="12px" />
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
                <Flex position="absolute" left="10px" right="10px" top="8px" h="2px" bgColor="rgba(255,255,255,0.86)" />
              </Flex>
            )}
          </Flex>
        </Flex>
      ) : null}

      {shouldShowRetakeChoice && freeRetakeOriginalResult && captureResult ? (
        <Flex pointerEvents="none" position="absolute" inset="0" zIndex={14} alignItems="center" justifyContent="center" px="18px">
          <Flex
            w="100%"
            maxW="340px"
            borderRadius="18px"
            bgColor="rgba(255,250,240,0.96)"
            boxShadow="0 18px 42px rgba(0,0,0,0.36)"
            border="1px solid rgba(125,98,70,0.28)"
            p="16px"
            direction="column"
            gap="13px"
            pointerEvents="auto"
          >
            <Text color="#5D4634" fontSize="17px" fontWeight="900" textAlign="center">
              {EXHIBITION_UI_COPY.choosePhoto[locale]}
            </Text>
            <Flex gap="10px" alignItems="stretch">
              {[
                { label: EXHIBITION_UI_COPY.firstPhoto[locale], result: freeRetakeOriginalResult },
                { label: EXHIBITION_UI_COPY.retakenPhoto[locale], result: captureResult },
              ].map((item) => (
                <Flex key={item.label} flex="1" direction="column" gap="8px" alignItems="center">
                  <Flex
                    w="100%"
                    aspectRatio="1"
                    borderRadius="8px"
                    overflow="hidden"
                    bgImage={`url('${item.result.polaroidUrl}')`}
                    bgSize="cover"
                    backgroundPosition="center"
                    border="1px solid rgba(130,112,90,0.35)"
                  />
                  <Text color="#6E5A47" fontSize="12px" fontWeight="800">
                    {item.label} {item.result.score}%
                  </Text>
                  <Flex
                    as="button"
                    h="38px"
                    w="100%"
                    borderRadius="999px"
                    bgColor="#8D694C"
                    color="white"
                    alignItems="center"
                    justifyContent="center"
                    fontWeight="900"
                    fontSize="13px"
                    onClick={() => handleChoosePhoto(item.result)}
                  >
                    留下這張
                  </Flex>
                </Flex>
              ))}
            </Flex>
          </Flex>
        </Flex>
      ) : hasCaptured && capturedPolaroidUrl ? (
        <Flex pointerEvents="none" position="absolute" inset="0" zIndex={14} alignItems="center" justifyContent="center">
          <Flex
            data-photo-capture-result="true"
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
            animation={`${capturedPhotoDevelop} 460ms cubic-bezier(0.2, 0.78, 0.24, 1) both`}
          >
            <Flex
              position="relative"
              w={`${POLAROID_PHOTO_SIZE}px`}
              h={`${POLAROID_PHOTO_SIZE}px`}
              borderRadius="4px"
              overflow="hidden"
              boxShadow="inset 0 0 0 1px rgba(130,112,90,0.35)"
              bgImage={`url('${capturedPolaroidUrl}')`}
              bgSize="cover"
              backgroundPosition="center"
              bgRepeat="no-repeat"
            >
              <Box
                data-photo-light-sweep="true"
                position="absolute"
                top="-84px"
                left="-185px"
                w="96px"
                h="360px"
                pointerEvents="none"
                bg="linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.94) 18%, #FFFFFF 42%, #FFFFFF 66%, rgba(255,255,255,0.88) 82%, transparent 100%)"
                boxShadow="0 0 18px rgba(255,255,255,0.72)"
                animation={`${capturedPhotoLightSweep} 720ms 200ms cubic-bezier(0.22, 0.68, 0.3, 1) both`}
              />
            </Flex>
            <Text color="#6E5A47" fontSize="13px" fontWeight="700">
              {EXHIBITION_UI_COPY.photoAccuracy[locale]} {captureScore ?? 0}%
            </Text>
            {(captureScore ?? 0) < passScore ? (
              <Text color="#A14F3F" fontSize="12px" fontWeight="700">
                {EXHIBITION_UI_COPY.minimumScore[locale]} {passScore}%
              </Text>
            ) : null}
            {shouldShowFreeRetakeOffer ? (
              <Text color="#7A5D45" fontSize="12px" fontWeight="800" textAlign="center" lineHeight="1.45">
                {freeRetakeOfferText}
              </Text>
            ) : null}
          </Flex>
        </Flex>
      ) : null}

      {isShutterFlashing ? (
        <Flex
          data-photo-shutter-flash="true"
          position="absolute"
          inset="0"
          zIndex={20}
          pointerEvents="none"
          bgColor="white"
          boxShadow="inset 0 0 120px rgba(255,255,255,0.96)"
          animation={`${shutterFlash} ${SHUTTER_FLASH_DURATION_MS}ms cubic-bezier(0.12, 0.62, 0.24, 1) both`}
        />
      ) : null}

      {!isCaptureLockedByTutorial ? (
        <Flex
          position="absolute"
          left={shouldUseWideShutter ? "0" : "50%"}
          right={shouldUseWideShutter ? "0" : undefined}
          bottom={shouldUseWideShutter ? "0" : hasCaptured ? "30px" : "34px"}
          transform={shouldUseWideShutter ? "none" : "translateX(-50%)"}
          zIndex={16}
          data-photo-control="true"
          direction="column"
          alignItems="center"
          gap={hasCaptured ? "8px" : "10px"}
          w={shouldUseWideShutter || shouldShowFreeRetakeOffer ? "100%" : undefined}
          px={
            shouldUseWideShutter
              ? "0"
              : shouldShowFreeRetakeOffer
                ? "16px"
                : undefined
          }
          onPointerDown={(event) => event.stopPropagation()}
          onPointerMove={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onWheel={(event) => event.stopPropagation()}
        >
          {!hideHintText && !shouldShowRetakeChoice && (!hasCaptured || hasPassedPhotoCheck) ? (
            <Text color="white" fontSize={hasCaptured ? "13px" : "14px"} fontWeight={hasCaptured ? "400" : "700"} textShadow="0 2px 6px rgba(0,0,0,0.45)">
              {hasCaptured ? EXHIBITION_UI_COPY.framingComplete[locale] : hintText}
            </Text>
          ) : null}
          {!shouldShowRetakeChoice ? (
            <Flex
              position="relative"
              alignItems="center"
              justifyContent="center"
              w={shouldUseWideShutter || shouldShowFreeRetakeOffer ? "100%" : undefined}
            >
            {shouldShowShutterPointer ? (
              <ChakraImage
                src="/images/pointer_up.png"
                alt=""
                aria-hidden="true"
                position="absolute"
                right="calc(100% + 20px)"
                top="50%"
                w="54px"
                h="54px"
                objectFit="contain"
                pointerEvents="none"
                animation={`${pointerNudgeRight} 1.55s ease-in-out infinite`}
                transform="translateY(-50%) rotate(90deg)"
                transformOrigin="50% 50%"
              />
            ) : null}
            {shouldShowFreeRetakeOffer ? (
              <Flex
                w="100%"
                maxW="360px"
                gap="10px"
                alignItems="stretch"
              >
                <Flex
                  as="button"
                  flex="1 1 0"
                  minW="0"
                  minH="52px"
                  h="auto"
                  px="10px"
                  py="8px"
                  borderRadius="999px"
                  bgColor="rgba(255,245,240,0.95)"
                  border="2px solid #7C6751"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  boxShadow="0 8px 20px rgba(0,0,0,0.28)"
                  onClick={handleUseFreeRetake}
                >
                  <Text
                    w="100%"
                    color="#5F4C3B"
                    fontWeight="800"
                    fontSize="13px"
                    lineHeight="1.25"
                    textAlign="center"
                    whiteSpace="normal"
                    overflowWrap="anywhere"
                  >
                    {freeRetakeButtonLabel}
                  </Text>
                </Flex>
                <Flex
                  as="button"
                  flex="1 1 0"
                  minW="0"
                  minH="52px"
                  h="auto"
                  px="10px"
                  py="8px"
                  borderRadius="999px"
                  bgColor="rgba(255,255,255,0.94)"
                  border="2px solid #7C6751"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  boxShadow="0 8px 20px rgba(0,0,0,0.28)"
                  onClick={handleConfirmPhoto}
                >
                  <Text
                    w="100%"
                    color="#5F4C3B"
                    fontWeight="800"
                    fontSize="13px"
                    lineHeight="1.25"
                    textAlign="center"
                    whiteSpace="normal"
                    overflowWrap="anywhere"
                  >
                    {keepPhotoButtonLabel}
                  </Text>
                </Flex>
              </Flex>
            ) : (
              <Flex
                as="button"
                aria-label={
                  hasCaptured
                    ? hasPassedPhotoCheck
                      ? EXHIBITION_UI_COPY.keepPhoto[locale]
                      : EXHIBITION_UI_COPY.retake[locale]
                    : EXHIBITION_UI_COPY.takePhoto[locale]
                }
                w={hasCaptured ? "132px" : shouldUseWideShutter ? "100%" : "76px"}
                minW={hasCaptured ? undefined : shouldUseWideShutter ? "100%" : "76px"}
                h={hasCaptured ? "42px" : shouldUseWideShutter ? "76px" : "76px"}
                borderRadius={shouldUseWideShutter && !hasCaptured ? "0" : "999px"}
                bgColor={hasCaptured ? (hasPassedPhotoCheck ? "rgba(255,255,255,0.92)" : "rgba(255,245,240,0.95)") : shouldUseWideShutter ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.9)"}
                border={hasCaptured ? "2px solid #7C6751" : shouldUseWideShutter ? "0" : "4px solid #7C6751"}
                borderTop={shouldUseWideShutter && !hasCaptured ? "3px solid #7C6751" : undefined}
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                boxShadow={shouldUseWideShutter && !hasCaptured ? "0 -8px 22px rgba(0,0,0,0.28)" : "0 8px 20px rgba(0,0,0,0.35)"}
                onPointerDown={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  if (hasCaptured) {
                    if (hasPassedPhotoCheck) {
                      handleConfirmPhoto();
                    } else {
                      handleRetakePhoto();
                    }
                    return;
                  }
                  handleShutterClick();
                }}
                opacity={isCapturing ? 0.7 : 1}
              >
                {hasCaptured ? (
                  <Text color="#5F4C3B" fontWeight="700">
                    {hasPassedPhotoCheck
                      ? EXHIBITION_UI_COPY.keepPhoto[locale]
                      : EXHIBITION_UI_COPY.retake[locale]}
                  </Text>
                ) : shouldUseWideShutter ? (
                  <Flex alignItems="center" justifyContent="center" gap="9px">
                    <FaCamera size={22} color="#6B5947" />
                    <Text color="#5F4C3B" fontWeight="900" fontSize="18px" lineHeight="1">
                      {EXHIBITION_UI_COPY.takePhoto[locale]}
                    </Text>
                  </Flex>
                ) : (
                  <FaCamera size={30} color="#6B5947" />
                )}
              </Flex>
            )}
          </Flex>
          ) : null}
        </Flex>
      ) : null}
    </>
  );
}
