"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Image as ChakraImage, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FaCamera } from "react-icons/fa6";

type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

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
  enabled: boolean;
  backgroundRef: React.RefObject<HTMLDivElement | null>;
  backgroundImageSrc: string;
  naturalImageSize: NaturalImageSize | null;
  targetRectNormalized: CropRect;
  passScore?: number;
  hintText?: string;
  fitMode?: "cover" | "contain";
  resetNonce?: number;
  frameSweepAxis?: "vertical" | "horizontal";
  frameSweepFromY?: number;
  frameSweepToY?: number;
  targetFadeLeadPx?: number;
  tutorialTitle?: string;
  tutorialLines?: string[];
  tutorialHighlightText?: string;
  tutorialConfirmLabel?: string;
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
  16% { opacity: 0.92; }
  100% { opacity: 0; }
`;

const pointerNudgeRight = keyframes`
  0%, 18%, 100% { right: calc(100% + 16px); }
  44% { right: calc(100% + 8px); }
  58% { right: calc(100% + 10px); }
  76% { right: calc(100% + 16px); }
`;

const CAMERA_FRAME_WIDTH = 248;
const CAMERA_FRAME_HEIGHT = 248;
const POLAROID_CARD_WIDTH = 236;
const POLAROID_CARD_HEIGHT = 286;
const POLAROID_PHOTO_SIZE = 192;
const POLAROID_TARGET_RATIO = 1;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

async function renderCropToDataUrl(
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

export function EventPhotoCaptureLayer({
  enabled,
  backgroundRef,
  backgroundImageSrc,
  naturalImageSize,
  targetRectNormalized,
  passScore = 60,
  hintText = "點擊快門捕捉小日獸",
  fitMode = "contain",
  resetNonce = 0,
  frameSweepAxis = "vertical",
  frameSweepFromY = -130,
  frameSweepToY = 360,
  targetFadeLeadPx = 50,
  tutorialTitle,
  tutorialLines = [],
  tutorialHighlightText,
  tutorialConfirmLabel = "我知道了",
  freeRetakeOfferText,
  freeRetakeButtonLabel = "再拍一次",
  keepPhotoButtonLabel = "收下照片",
  movingBackground,
  onBeforeCapture,
  onConfirm,
}: EventPhotoCaptureLayerProps) {
  const cameraFrameRef = useRef<HTMLDivElement | null>(null);
  const movingBackgroundPanOffsetXRef = useRef(0);
  const movingBackgroundTargetOffsetXRef = useRef(0);
  const movingBackgroundZoomMultiplierRef = useRef(1);
  const movingBackgroundActivePointersRef = useRef(new Map<number, { x: number; y: number }>());
  const movingBackgroundPinchDistanceRef = useRef<number | null>(null);
  const movingBackgroundPinchStartZoomRef = useRef(1);
  const lastPointerPanAtRef = useRef(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);
  const [capturedPolaroidUrl, setCapturedPolaroidUrl] = useState<string | null>(null);
  const [captureScore, setCaptureScore] = useState<number | null>(null);
  const [captureResult, setCaptureResult] = useState<PhotoCaptureResult | null>(null);
  const hasTutorial = Boolean(tutorialTitle || tutorialLines.length > 0);
  const [isTutorialOpen, setIsTutorialOpen] = useState(hasTutorial);
  const [hasUsedFreeRetakeOffer, setHasUsedFreeRetakeOffer] = useState(false);
  const [freeRetakeOriginalResult, setFreeRetakeOriginalResult] = useState<PhotoCaptureResult | null>(null);
  const [containerSize, setContainerSize] = useState<NaturalImageSize | null>(null);
  const [cameraFrameOpacity, setCameraFrameOpacity] = useState(0.92);
  const [movingBackgroundPanOffsetX, setMovingBackgroundPanOffsetX] = useState(0);
  const [movingBackgroundZoomMultiplier, setMovingBackgroundZoomMultiplier] = useState(1);
  const cameraFrameSweep = useMemo(
    () => buildCameraFrameSweep(frameSweepFromY, frameSweepToY, frameSweepAxis),
    [frameSweepAxis, frameSweepFromY, frameSweepToY],
  );
  const isHorizontalSweep = frameSweepAxis === "horizontal";
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
    setIsCapturing(false);
    setIsShutterFlashing(false);
    setCapturedPolaroidUrl(null);
    setCaptureScore(null);
    setCaptureResult(null);
    setIsTutorialOpen(hasTutorial);
    setHasUsedFreeRetakeOffer(false);
    setFreeRetakeOriginalResult(null);
  }, [enabled, resetNonce, backgroundImageSrc, hasTutorial]);

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
      if (event.target instanceof HTMLElement && event.target.closest("[data-photo-control='true']")) return;
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
        event.target instanceof HTMLElement &&
        event.target.closest("[data-photo-control='true']") &&
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
      if (event.target instanceof HTMLElement && event.target.closest("[data-photo-control='true']")) return;
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

  useEffect(() => {
    if (!enabled || isCaptureLockedByTutorial || hasCaptured) {
      setCameraFrameOpacity(0.92);
      return;
    }

    let frameId: number | null = null;
    const minOpacity = 0.2;
    const maxOpacity = 0.92;

    const calculateOpacity = () => {
      const backgroundRect = backgroundRef.current?.getBoundingClientRect();
      const frameRect = cameraFrameRef.current?.getBoundingClientRect();
      if (!backgroundRect || !frameRect || !naturalImageSize) {
        setCameraFrameOpacity(maxOpacity);
        frameId = window.requestAnimationFrame(calculateOpacity);
        return;
      }

      const metrics = getRenderedImageMetrics({
        containerWidth: backgroundRect.width,
        containerHeight: backgroundRect.height,
        natural: naturalImageSize,
        fitMode,
        scaleMultiplier: movingBackgroundScaleMultiplier,
      offsetX: isMovingBackgroundEnabled ? movingBackgroundPanOffsetXRef.current : 0,
      clampToContainer: isMovingBackgroundEnabled,
    });
      const targetTop = metrics.offsetY + metrics.renderedHeight * targetRectNormalized.y;
      const targetBottom = metrics.offsetY + metrics.renderedHeight * (targetRectNormalized.y + targetRectNormalized.height);
      const frameBottom = frameRect.bottom - backgroundRect.top;
      const fadeStart = targetTop - targetFadeLeadPx;
      const fadeFull = targetTop - targetFadeLeadPx * 0.35;
      const restoreStart = targetBottom + 24;
      const restoreEnd = targetBottom + 142;

      let nextOpacity = maxOpacity;
      if (frameBottom >= fadeStart && frameBottom < fadeFull) {
        const progress = clamp((frameBottom - fadeStart) / Math.max(1, fadeFull - fadeStart), 0, 1);
        nextOpacity = maxOpacity - (maxOpacity - minOpacity) * progress;
      } else if (frameBottom >= fadeFull && frameBottom <= restoreStart) {
        nextOpacity = minOpacity;
      } else if (frameBottom > restoreStart && frameBottom < restoreEnd) {
        const progress = clamp((frameBottom - restoreStart) / Math.max(1, restoreEnd - restoreStart), 0, 1);
        nextOpacity = minOpacity + (maxOpacity - minOpacity) * progress;
      }

      setCameraFrameOpacity(nextOpacity);
      frameId = window.requestAnimationFrame(calculateOpacity);
    };

    frameId = window.requestAnimationFrame(calculateOpacity);
    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [
    backgroundRef,
    enabled,
    fitMode,
    hasCaptured,
    isCaptureLockedByTutorial,
    naturalImageSize,
    isMovingBackgroundEnabled,
    movingBackgroundScaleMultiplier,
    targetFadeLeadPx,
    targetRectNormalized.height,
    targetRectNormalized.y,
  ]);

  const handleShutterClick = () => {
    if (
      !enabled ||
      isCaptureLockedByTutorial ||
      isCapturing ||
      hasCaptured ||
      !backgroundRef.current ||
      !cameraFrameRef.current ||
      !naturalImageSize
    ) return;
    const shouldContinueCapture = onBeforeCapture?.();
    if (shouldContinueCapture === false) return;
    const runCapture = async () => {
      try {
        setIsCapturing(true);
        setIsShutterFlashing(true);
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
          fitMode,
          imageScaleMultiplier: movingBackgroundScaleMultiplier,
          imageOffsetX: isMovingBackgroundEnabled ? movingBackgroundPanOffsetXRef.current : 0,
          imageClampToContainer: isMovingBackgroundEnabled,
        });
        const cameraFrameMappedRect = toImageCropRect({
          frameInContainer,
          containerWidth: backgroundRect.width,
          containerHeight: backgroundRect.height,
          natural: naturalImageSize,
          targetRatio: CAMERA_FRAME_WIDTH / CAMERA_FRAME_HEIGHT,
          fitMode,
          imageScaleMultiplier: movingBackgroundScaleMultiplier,
          imageOffsetX: isMovingBackgroundEnabled ? movingBackgroundPanOffsetXRef.current : 0,
          imageClampToContainer: isMovingBackgroundEnabled,
        });
        const targetRect: CropRect = {
          x: naturalImageSize.width * targetRectNormalized.x,
          y: naturalImageSize.height * targetRectNormalized.y,
          width: naturalImageSize.width * targetRectNormalized.width,
          height: naturalImageSize.height * targetRectNormalized.height,
        };
        const score = calculateCameraFrameScore(cameraFrameMappedRect, targetRect);
        const polaroidUrl = await renderCropToDataUrl(backgroundImageSrc, cropRect, 620, 620);
        const framePreviewWidth = 900;
        const framePreviewHeight = Math.max(
          1,
          Math.round(framePreviewWidth * (cameraFrameMappedRect.height / cameraFrameMappedRect.width)),
        );
        const framePreviewUrl = await renderCropToDataUrl(
          backgroundImageSrc,
          cameraFrameMappedRect,
          framePreviewWidth,
          framePreviewHeight,
        );
        const result: PhotoCaptureResult = {
          score,
          polaroidUrl,
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
          framePreviewUrl,
        };
        setCaptureResult(result);
        setCaptureScore(score);
        setCapturedPolaroidUrl(polaroidUrl);
      } finally {
        setIsCapturing(false);
        window.setTimeout(() => setIsShutterFlashing(false), 80);
      }
    };
    void runCapture();
  };

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
    onConfirm(result);
    setCapturedPolaroidUrl(null);
    setCaptureScore(null);
    setCaptureResult(null);
    setFreeRetakeOriginalResult(null);
  };

  const handleConfirmPhoto = () => {
    if (!captureResult || !hasPassedPhotoCheck) return;
    onConfirm(captureResult);
    setCapturedPolaroidUrl(null);
    setCaptureScore(null);
    setCaptureResult(null);
  };

  const handleTutorialConfirm = () => {
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

      {isCaptureLockedByTutorial ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={18}
          data-photo-control="true"
          bgColor="rgba(20,18,16,0.68)"
          alignItems="center"
          justifyContent="center"
          p="24px"
          pointerEvents="auto"
          onPointerDown={(event) => event.stopPropagation()}
          onPointerMove={(event) => event.stopPropagation()}
        >
          <Flex
            w="100%"
            maxW="320px"
            borderRadius="20px"
            bgColor="rgba(255,250,240,0.96)"
            boxShadow="0 18px 42px rgba(0,0,0,0.34)"
            border="1px solid rgba(125,98,70,0.28)"
            p="22px"
            direction="column"
            gap="16px"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <Flex direction="column" gap="8px">
              <Text color="#5D4634" fontSize="20px" fontWeight="800" lineHeight="1.35">
                {tutorialTitle ?? "拍照教學"}
              </Text>
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
                      color="#725844"
                      fontSize={hasHighlight ? "15px" : "14px"}
                      fontWeight="700"
                      lineHeight="1.6"
                    >
                      {hasHighlight ? (
                        <>
                          {beforeHighlight}
                          <Text
                            as="span"
                            color="#5D3C22"
                            fontWeight="900"
                            bgColor="#FFE7A3"
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
            </Flex>
            <Flex
              as="button"
              h="44px"
              borderRadius="999px"
              bgColor="#8D694C"
              color="white"
              alignItems="center"
              justifyContent="center"
              fontWeight="800"
              boxShadow="0 10px 22px rgba(105,75,48,0.24)"
              cursor="pointer"
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
            position="absolute"
            left={isHorizontalSweep ? "0" : "50%"}
            top={isHorizontalSweep ? "50%" : "0"}
            w={`${CAMERA_FRAME_WIDTH}px`}
            h={`${CAMERA_FRAME_HEIGHT}px`}
            borderRadius="14px"
            animation={`${cameraFrameSweep} 2.2s ease-in-out infinite`}
            transform={isHorizontalSweep ? "translateY(-50%)" : "translateX(-50%)"}
          >
            <Flex
              position="absolute"
              inset="0"
              borderRadius="14px"
              boxShadow="0 0 0 2px rgba(44,31,20,0.22), 0 10px 24px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.14)"
              opacity={cameraFrameOpacity}
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
              要留下哪一張照片？
            </Text>
            <Flex gap="10px" alignItems="stretch">
              {[
                { label: "第一張", result: freeRetakeOriginalResult },
                { label: "重拍這張", result: captureResult },
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
            {(captureScore ?? 0) < passScore ? (
              <Text color="#A14F3F" fontSize="12px" fontWeight="700">
                教學提示：需要至少 {passScore}% 才能通過，請重拍
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
          position="absolute"
          inset="0"
          zIndex={20}
          pointerEvents="none"
          bgColor="white"
          animation={`${shutterFlash} 260ms ease-out 1`}
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
          px={shouldUseWideShutter ? "0" : undefined}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerMove={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onWheel={(event) => event.stopPropagation()}
        >
          {!shouldShowRetakeChoice ? (
            <Text color="white" fontSize={hasCaptured ? "13px" : "14px"} fontWeight={hasCaptured ? "400" : "700"} textShadow="0 2px 6px rgba(0,0,0,0.45)">
              {hasCaptured ? (hasPassedPhotoCheck ? "取景完成" : "取景偏離，請重拍") : hintText}
            </Text>
          ) : null}
          {!shouldShowRetakeChoice ? (
            <Flex
              position="relative"
              alignItems="center"
              justifyContent="center"
              w={shouldUseWideShutter ? "100%" : undefined}
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
              <Flex gap="8px">
                <Flex
                  as="button"
                  h="42px"
                  px="15px"
                  borderRadius="999px"
                  bgColor="rgba(255,245,240,0.95)"
                  border="2px solid #7C6751"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  boxShadow="0 8px 20px rgba(0,0,0,0.28)"
                  onClick={handleUseFreeRetake}
                >
                  <Text color="#5F4C3B" fontWeight="800" fontSize="14px">
                    {freeRetakeButtonLabel}
                  </Text>
                </Flex>
                <Flex
                  as="button"
                  h="42px"
                  px="15px"
                  borderRadius="999px"
                  bgColor="rgba(255,255,255,0.94)"
                  border="2px solid #7C6751"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  boxShadow="0 8px 20px rgba(0,0,0,0.28)"
                  onClick={handleConfirmPhoto}
                >
                  <Text color="#5F4C3B" fontWeight="800" fontSize="14px">
                    {keepPhotoButtonLabel}
                  </Text>
                </Flex>
              </Flex>
            ) : (
              <Flex
                as="button"
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
                    {hasPassedPhotoCheck ? "收下照片" : "重拍"}
                  </Text>
                ) : shouldUseWideShutter ? (
                  <Flex alignItems="center" justifyContent="center" gap="9px">
                    <FaCamera size={22} color="#6B5947" />
                    <Text color="#5F4C3B" fontWeight="900" fontSize="18px" lineHeight="1">
                      拍照
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
