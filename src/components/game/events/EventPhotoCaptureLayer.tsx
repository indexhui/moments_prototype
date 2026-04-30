"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
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
  onConfirm: (result: PhotoCaptureResult) => void;
};

function buildCameraFrameSweep(fromY: number, toY: number) {
  return keyframes`
  0% { transform: translate(-50%, ${fromY}px); opacity: 0; }
  10% { opacity: 1; }
  84% { opacity: 1; }
  100% { transform: translate(-50%, ${toY}px); opacity: 0; }
`;
}
const shutterFlash = keyframes`
  0% { opacity: 0; }
  16% { opacity: 0.92; }
  100% { opacity: 0; }
`;

const CAMERA_FRAME_WIDTH = 248;
const CAMERA_FRAME_HEIGHT = 168;
const POLAROID_CARD_WIDTH = 236;
const POLAROID_CARD_HEIGHT = 286;
const POLAROID_PHOTO_SIZE = 192;
const POLAROID_TARGET_RATIO = 1;

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
  onConfirm,
}: EventPhotoCaptureLayerProps) {
  const cameraFrameRef = useRef<HTMLDivElement | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);
  const [capturedPolaroidUrl, setCapturedPolaroidUrl] = useState<string | null>(null);
  const [captureScore, setCaptureScore] = useState<number | null>(null);
  const [captureResult, setCaptureResult] = useState<PhotoCaptureResult | null>(null);
  const cameraFrameSweep = useMemo(
    () => buildCameraFrameSweep(frameSweepFromY, frameSweepToY),
    [frameSweepFromY, frameSweepToY],
  );

  useEffect(() => {
    setIsCapturing(false);
    setIsShutterFlashing(false);
    setCapturedPolaroidUrl(null);
    setCaptureScore(null);
    setCaptureResult(null);
  }, [enabled, resetNonce, backgroundImageSrc]);

  const hasCaptured = Boolean(capturedPolaroidUrl);
  const hasPassedPhotoCheck = (captureScore ?? 0) >= passScore;

  const handleShutterClick = () => {
    if (!enabled || isCapturing || hasCaptured || !backgroundRef.current || !cameraFrameRef.current || !naturalImageSize) return;
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
      {!hasCaptured ? (
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
            transform="translateX(-50%)"
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
      ) : null}

      {hasCaptured && capturedPolaroidUrl ? (
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
          </Flex>
        </Flex>
      ) : null}

      {isShutterFlashing ? (
        <Flex position="absolute" inset="0" bgColor="white" animation={`${shutterFlash} 260ms ease-out 1`} />
      ) : null}

      <Flex position="absolute" left="50%" bottom={hasCaptured ? "30px" : "34px"} transform="translateX(-50%)" zIndex={16} direction="column" alignItems="center" gap={hasCaptured ? "8px" : "10px"}>
        <Text color="white" fontSize={hasCaptured ? "13px" : "14px"} fontWeight={hasCaptured ? "400" : "700"} textShadow="0 2px 6px rgba(0,0,0,0.45)">
          {hasCaptured ? (hasPassedPhotoCheck ? "取景完成" : "取景偏離，請重拍") : hintText}
        </Text>
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
      </Flex>
    </>
  );
}
