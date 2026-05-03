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
  frameSweepFromY?: number;
  frameSweepToY?: number;
  targetFadeLeadPx?: number;
  tutorialTitle?: string;
  tutorialLines?: string[];
  tutorialConfirmLabel?: string;
  freeRetakeOfferText?: string;
  freeRetakeButtonLabel?: string;
  keepPhotoButtonLabel?: string;
  onConfirm: (result: PhotoCaptureResult) => void;
};

function buildCameraFrameSweep(fromY: number, toY: number) {
  return keyframes`
  0% { transform: translate(-50%, ${fromY}px); }
  100% { transform: translate(-50%, ${toY}px); }
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
}) {
  const { containerWidth, containerHeight, natural, fitMode } = params;
  const scale =
    fitMode === "contain"
      ? Math.min(containerWidth / natural.width, containerHeight / natural.height)
      : Math.max(containerWidth / natural.width, containerHeight / natural.height);
  const renderedWidth = natural.width * scale;
  const renderedHeight = natural.height * scale;
  return {
    scale,
    renderedWidth,
    renderedHeight,
    offsetX: (containerWidth - renderedWidth) / 2,
    offsetY: (containerHeight - renderedHeight) / 2,
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
}): CropRect {
  const { frameInContainer, containerWidth, containerHeight, natural, targetRatio, fitMode } = params;
  const { offsetX, offsetY, scale } = getRenderedImageMetrics({
    containerWidth,
    containerHeight,
    natural,
    fitMode,
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
  frameSweepFromY = -130,
  frameSweepToY = 360,
  targetFadeLeadPx = 50,
  tutorialTitle,
  tutorialLines = [],
  tutorialConfirmLabel = "我知道了",
  freeRetakeOfferText,
  freeRetakeButtonLabel = "再拍一次",
  keepPhotoButtonLabel = "收下照片",
  onConfirm,
}: EventPhotoCaptureLayerProps) {
  const cameraFrameRef = useRef<HTMLDivElement | null>(null);
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
  const cameraFrameSweep = useMemo(
    () => buildCameraFrameSweep(frameSweepFromY, frameSweepToY),
    [frameSweepFromY, frameSweepToY],
  );
  const hasCaptured = Boolean(capturedPolaroidUrl);
  const hasPassedPhotoCheck = (captureScore ?? 0) >= passScore;
  const isCaptureLockedByTutorial = hasTutorial && isTutorialOpen && !hasCaptured;
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
        });
        const cameraFrameMappedRect = toImageCropRect({
          frameInContainer,
          containerWidth: backgroundRect.width,
          containerHeight: backgroundRect.height,
          natural: naturalImageSize,
          targetRatio: CAMERA_FRAME_WIDTH / CAMERA_FRAME_HEIGHT,
          fitMode,
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

  if (!enabled) return null;

  return (
    <>
      {isCaptureLockedByTutorial ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={18}
          bgColor="rgba(20,18,16,0.68)"
          alignItems="center"
          justifyContent="center"
          p="24px"
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
          >
            <Flex direction="column" gap="8px">
              <Text color="#5D4634" fontSize="20px" fontWeight="800" lineHeight="1.35">
                {tutorialTitle ?? "拍照教學"}
              </Text>
              <Flex direction="column" gap="7px">
                {(tutorialLines.length > 0
                  ? tutorialLines
                  : ["等取景框掃到小日獸身上時按下快門。", "拍得越準，之後能得到的回饋越好。"]
                ).map((line) => (
                  <Text key={line} color="#725844" fontSize="14px" fontWeight="700" lineHeight="1.55">
                    {line}
                  </Text>
                ))}
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
              onClick={() => setIsTutorialOpen(false)}
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
            animation={`${cameraFrameSweep} 2.2s ease-in-out infinite`}
            transform="translateX(-50%)"
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
        <Flex position="absolute" inset="0" bgColor="white" animation={`${shutterFlash} 260ms ease-out 1`} />
      ) : null}

      {!isCaptureLockedByTutorial ? (
        <Flex position="absolute" left="50%" bottom={hasCaptured ? "30px" : "34px"} transform="translateX(-50%)" zIndex={16} direction="column" alignItems="center" gap={hasCaptured ? "8px" : "10px"}>
          {!shouldShowRetakeChoice ? (
            <Text color="white" fontSize={hasCaptured ? "13px" : "14px"} fontWeight={hasCaptured ? "400" : "700"} textShadow="0 2px 6px rgba(0,0,0,0.45)">
              {hasCaptured ? (hasPassedPhotoCheck ? "取景完成" : "取景偏離，請重拍") : hintText}
            </Text>
          ) : null}
          {!shouldShowRetakeChoice ? (
            <Flex position="relative" alignItems="center" justifyContent="center">
            {!hasCaptured && hasTutorial ? (
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
                w={hasCaptured ? "132px" : "76px"}
                minW={hasCaptured ? undefined : "76px"}
                h={hasCaptured ? "42px" : "76px"}
                borderRadius="999px"
                bgColor={hasCaptured ? (hasPassedPhotoCheck ? "rgba(255,255,255,0.92)" : "rgba(255,245,240,0.95)") : "rgba(255,255,255,0.9)"}
                border={hasCaptured ? "2px solid #7C6751" : "4px solid #7C6751"}
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                boxShadow="0 8px 20px rgba(0,0,0,0.35)"
                onClick={hasCaptured ? (hasPassedPhotoCheck ? handleConfirmPhoto : handleRetakePhoto) : handleShutterClick}
                opacity={isCapturing ? 0.7 : 1}
              >
                {hasCaptured ? (
                  <Text color="#5F4C3B" fontWeight="700">
                    {hasPassedPhotoCheck ? "收下照片" : "重拍"}
                  </Text>
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
