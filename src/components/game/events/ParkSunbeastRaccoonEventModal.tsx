"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { DialogQuickActions } from "@/components/game/events/DialogQuickActions";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import {
  EventDialogPanel,
  EVENT_DIALOG_HEIGHT,
} from "@/components/game/events/EventDialogPanel";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { EventHistoryOverlay } from "@/components/game/events/EventHistoryOverlay";
import {
  EventPhotoCaptureLayer,
  type NaturalImageSize,
  type PhotoCaptureResult,
} from "@/components/game/events/EventPhotoCaptureLayer";
import {
  recordPhotoCapture,
  recordSunbeastPhotoCapture,
  unlockDiaryEntry,
} from "@/lib/game/playerProgress";
import { SUNBEAST_RETAKE_CAPTURE_PROPS } from "@/lib/game/sunbeastRegistry";

const PARK_BACKGROUND_IMAGE = "/images/背景/公園.png";
const RACCOON_IMAGE = "/images/animals/放視大賞 5/無尾熊替身.png";

const RACCOON_CAPTURE_RECT = {
  x: 0.39,
  y: 0.28,
  width: 0.4,
  height: 0.4,
} as const;

const RACCOON_TARGET_RECT = {
  x: 0.47,
  y: 0.34,
  width: 0.24,
  height: 0.29,
} as const;

const PARK_TALK_LINES = [
  {
    speaker: "小貝狗",
    text: "嗷！先把漢堡放在長椅上，我們躲遠一點。",
    spriteId: "beigo" as const,
    frameIndex: 2,
  },
  {
    speaker: "旁白",
    text: "漢堡的香味慢慢飄開。沒多久，樹叢裡傳來一陣窸窸窣窣的聲音。",
  },
  {
    speaker: "小麥",
    text: "出現了！牠真的抱走漢堡了！",
    spriteId: "mai" as const,
    frameIndex: 34,
  },
  {
    speaker: "小貝狗",
    text: "就是現在，快拍下牠！",
    spriteId: "beigo" as const,
    frameIndex: 1,
  },
] as const;

type RaccoonPhase = `line-${0 | 1 | 2 | 3}` | "photo";

const PHASE_ORDER: RaccoonPhase[] = [
  "line-0",
  "line-1",
  "line-2",
  "line-3",
  "photo",
];

function getLine(phase: RaccoonPhase) {
  if (!phase.startsWith("line-")) return null;
  const lineIndex = Number(phase.replace("line-", ""));
  return PARK_TALK_LINES[lineIndex] ?? null;
}

export function ParkSunbeastRaccoonEventModal({
  onFinish,
}: {
  onFinish: () => void;
}) {
  const [phase, setPhase] = useState<RaccoonPhase>("line-0");
  const [photoResetNonce, setPhotoResetNonce] = useState(0);
  const [naturalImageSize, setNaturalImageSize] =
    useState<NaturalImageSize | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const hasFinishedRef = useRef(false);
  const isPhotoMode = phase === "photo";
  const line = getLine(phase);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      setNaturalImageSize({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
    image.src = PARK_BACKGROUND_IMAGE;
    return () => {
      cancelled = true;
    };
  }, []);

  const historyLines = useMemo(
    () =>
      PARK_TALK_LINES.slice(
        0,
        Math.min(PARK_TALK_LINES.length, PHASE_ORDER.indexOf(phase) + 1),
      ).map((item, index) => ({
          id: `raccoon-park-${index}`,
          speaker: item.speaker,
          text: item.text,
        })),
    [phase],
  );

  const advanceDialogue = () => {
    const currentIndex = PHASE_ORDER.indexOf(phase);
    const nextPhase = PHASE_ORDER[currentIndex + 1];
    if (!nextPhase) return;
    if (nextPhase === "photo") {
      setPhotoResetNonce((value) => value + 1);
    }
    setPhase(nextPhase);
  };

  const confirmPhoto = (capture: PhotoCaptureResult) => {
    const snapshot = {
      sourceImage: capture.sourceImage,
      previewImage: capture.framePreviewUrl,
      dogCoveragePercent: capture.score,
      cameraFrameRect: capture.normalizedCameraFrameRect,
      capturedRect: capture.normalizedCroppedRect,
    };
    recordPhotoCapture(snapshot);
    recordSunbeastPhotoCapture("raccoon", snapshot, { maxCaptures: 1 });
    unlockDiaryEntry("bai-entry-7");
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    onFinish();
  };

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={52}
      direction="column"
      overflow="hidden"
      bgColor="#B8D5A5"
      data-raccoon-event-phase={phase}
    >
      <Flex
        ref={backgroundRef}
        position="absolute"
        inset="0"
        bgImage={`url('${PARK_BACKGROUND_IMAGE}')`}
        bgSize="contain"
        backgroundPosition="center"
        bgRepeat="no-repeat"
        bgColor="#B8D5A5"
      />

      {!isPhotoMode && PHASE_ORDER.indexOf(phase) >= 2 ? (
        <Flex
          position="absolute"
          left="50%"
          top="23%"
          zIndex={3}
          w="46%"
          maxW="320px"
          transform="translateX(-50%)"
          pointerEvents="none"
          filter="drop-shadow(0 12px 16px rgba(58,48,36,0.2))"
        >
          <img
            src={RACCOON_IMAGE}
            alt="抱著漢堡的浣熊小日獸"
            style={{
              width: "100%",
              height: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        </Flex>
      ) : null}

      <EventPhotoCaptureLayer
        enabled={isPhotoMode}
        resetNonce={photoResetNonce}
        backgroundRef={backgroundRef}
        backgroundImageSrc={PARK_BACKGROUND_IMAGE}
        naturalImageSize={naturalImageSize}
        fitMode="contain"
        targetRectNormalized={RACCOON_TARGET_RECT}
        captureOverlays={[
          {
            imageSrc: RACCOON_IMAGE,
            rectNormalized: RACCOON_CAPTURE_RECT,
          },
        ]}
        passScore={60}
        hintText="點擊畫面或空白鍵捕捉浣熊小日獸"
        tutorialTitle="拍下浣熊小日獸"
        tutorialLines={[
          "等浣熊抱著漢堡進到取景框中央時按下快門。",
          "拍完後可以免費重拍一次，再選擇要留下哪張照片。",
        ]}
        tutorialConfirmLabel="開始拍照"
        {...SUNBEAST_RETAKE_CAPTURE_PROPS}
        onConfirm={confirmPhoto}
      />

      {!isPhotoMode && line ? (
        <>
          <DialogQuickActions
            onOpenOptions={() => {}}
            onOpenHistory={() => setIsHistoryOpen(true)}
          />
          {"spriteId" in line ? (
            <Flex
              position="absolute"
              left="14px"
              bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
              zIndex={5}
              pointerEvents="none"
            >
              <EventAvatarSprite
                spriteId={line.spriteId}
                frameIndex={line.frameIndex}
              />
            </Flex>
          ) : null}
          <EventDialogPanel
            position="absolute"
            left="0"
            right="0"
            bottom="0"
            zIndex={8}
            w="100%"
            borderRadius="0"
            cursor="pointer"
            onClick={advanceDialogue}
          >
            <Text color="#FFFFFF" fontWeight="700">
              {line.speaker}
            </Text>
            <Flex flex="1" minH="0" direction="column" justifyContent="center">
              <Text color="#FFFFFF" fontSize="16px" lineHeight="1.55">
                {line.text}
              </Text>
            </Flex>
            <EventContinueAction
              label="點擊繼續"
              onClick={advanceDialogue}
            />
          </EventDialogPanel>
          <EventHistoryOverlay
            title="浣熊篇回顧"
            open={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            lines={historyLines}
          />
        </>
      ) : null}
    </Flex>
  );
}
