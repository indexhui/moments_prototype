"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
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
import { GAME_BACKGROUND_SHAKE_TRIGGER } from "@/lib/game/backgroundShakeBus";
import {
  EventPhotoCaptureLayer,
  type NaturalImageSize,
  type PhotoCaptureResult,
} from "@/components/game/events/EventPhotoCaptureLayer";
import {
  GAME_PHOTO_CHEAT_TRIGGER,
  type PhotoCheatPayload,
} from "@/lib/game/photoCheatBus";
import { recordPhotoCapture } from "@/lib/game/playerProgress";
import {
  getTypingAdvance,
  loadDialogTypingMode,
  saveDialogTypingMode,
  type DialogTypingMode,
} from "@/lib/game/dialogTyping";

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
  | "line-14"
  | "line-15"
  | "line-16"
  | "line-17"
  | "line-18"
  | "line-19";

type MetroFirstSunbeastDogEventModalProps = {
  onFinish: () => void;
  savings: number;
  actionPower: number;
  fatigue: number;
};

const METRO_DOG_TARGET_RECT_NORMALIZED = {
  x: 0.29,
  y: 0.51,
  width: 0.58,
  height: 0.2,
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
  "line-15",
  "line-16",
  "line-17",
  "line-18",
  "line-19",
];

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
  const [typingMode, setTypingMode] = useState<DialogTypingMode>(() => loadDialogTypingMode());
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPhotoMode, setIsPhotoMode] = useState(false);
  const [photoResetNonce, setPhotoResetNonce] = useState(0);
  const [naturalImageSize, setNaturalImageSize] = useState<NaturalImageSize | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);

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
    if (step === "line-14") return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line14;
    if (step === "line-15") return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line15;
    if (step === "line-16") return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line16;
    if (step === "line-17") return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line17;
    if (step === "line-18") return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line18;
    return METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line19;
  }, [step]);
  const isTypingComplete = !sourceText || displayText === sourceText;
  const historyLines = useMemo(() => {
    const lineMeta: Array<{ id: EventStep; speaker: string; text: string }> = [
      { id: "line-1", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line1 },
      { id: "line-2", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line2 },
      { id: "line-3", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line3 },
      { id: "line-4", speaker: "小貝狗", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line4 },
      { id: "line-5", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line5 },
      { id: "line-6", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line6 },
      { id: "line-7", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line7 },
      { id: "line-8", speaker: "小貝狗", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line8 },
      { id: "line-9", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line9 },
      { id: "line-10", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line10 },
      { id: "line-11", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line11 },
      { id: "line-12", speaker: "小貝狗", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line12 },
      { id: "line-13", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line13 },
      { id: "line-14", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line14 },
      { id: "line-15", speaker: "小貝狗", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line15 },
      { id: "line-16", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line16 },
      { id: "line-17", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line17 },
      { id: "line-18", speaker: "小貝狗", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line18 },
      { id: "line-19", speaker: "小麥", text: METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line19 },
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
      const previousChar = cursor > 0 ? sourceText[cursor - 1] : "";
      const { step: typeStep, delay } = getTypingAdvance(typingMode, previousChar);
      cursor = Math.min(sourceText.length, cursor + typeStep);
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

  const speaker = useMemo(() => {
    if (step === "line-4" || step === "line-8" || step === "line-12" || step === "line-15" || step === "line-18") return "小貝狗";
    return "小麥";
  }, [step]);

  const avatarSpriteId = useMemo(() => {
    if (step === "line-4" || step === "line-8" || step === "line-12" || step === "line-15" || step === "line-18") return "beigo";
    return "mai";
  }, [step]);
  const avatarFrameIndex = useMemo(() => {
    if (step === "line-1") return 13;
    if (step === "line-2") return 12;
    if (step === "line-3") return 12;
    if (step === "line-5") return 12;
    if (step === "line-6") return 9;
    if (step === "line-7") return 12;
    if (step === "line-9") return 11;
    if (step === "line-10") return 9;
    if (step === "line-11") return 12;
    if (step === "line-13") return 9;
    if (step === "line-14") return 11;
    if (step === "line-16") return 0;
    if (step === "line-17") return 4;
    if (step === "line-19") return 12;
    return 0;
  }, [step]);

  const backgroundImageSrc = useMemo(() => {
    if (
      step === "line-1" ||
      step === "line-2" ||
      step === "line-3" ||
      step === "line-4" ||
      step === "line-5" ||
      step === "line-6"
    ) {
      return "/images/428出圖/背景/捷運.png";
    }
    if (step === "line-17" || step === "line-18" || step === "line-19") {
      return "/images/428出圖/動物事件/黃金獵犬２.png";
    }
    return "/images/428出圖/動物事件/黃金獵犬１.png";
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
    if (step !== "line-7") return;
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
          detail: { shakeId: "shake-weak" },
        }),
      );
    }, 60);
    return () => {
      clearTimeout(timer);
    };
  }, [step]);

  useEffect(() => {
    const handlePhotoCheat = (event: Event) => {
      const customEvent = event as CustomEvent<PhotoCheatPayload>;
      const action = customEvent.detail?.action;
      if (!action) return;
      if (action === "enter-photo-mode") {
        setStep("line-16");
        setIsPhotoMode(true);
        setPhotoResetNonce((value) => value + 1);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        setDisplayText(METRO_FIRST_SUNBEAST_DOG_EVENT_COPY.line16);
        return;
      }
      if (action === "retake-photo") {
        setIsPhotoMode(true);
        setPhotoResetNonce((value) => value + 1);
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
    if (step === "line-16") {
      setIsPhotoMode(true);
      setPhotoResetNonce((value) => value + 1);
      return;
    }
    const currentIndex = EVENT_STEPS.indexOf(step);
    if (currentIndex < EVENT_STEPS.length - 1) {
      setStep(EVENT_STEPS[currentIndex + 1]);
      return;
    }
    onFinish();
  };
  const handleConfirmPolaroid = (capture: PhotoCaptureResult) => {
    recordPhotoCapture({
      sourceImage: capture.sourceImage,
      previewImage: capture.framePreviewUrl,
      dogCoveragePercent: capture.score,
      cameraFrameRect: capture.normalizedCameraFrameRect,
      capturedRect: capture.normalizedCroppedRect,
    });
    setIsPhotoMode(false);
    setStep("line-17");
  };
  const shouldShowAvatar = true;

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
        <EventPhotoCaptureLayer
          enabled={isPhotoMode}
          resetNonce={photoResetNonce}
          backgroundRef={backgroundRef}
          backgroundImageSrc={backgroundImageSrc}
          naturalImageSize={naturalImageSize}
          fitMode="contain"
          targetRectNormalized={METRO_DOG_TARGET_RECT_NORMALIZED}
          passScore={30}
          hintText="點擊快門捕捉小日獸"
          onConfirm={handleConfirmPolaroid}
        />
        {step === "line-2" ? (
          <Flex
            position="absolute"
            right="40px"
            bottom="110px"
            w="92px"
            h="72px"
            borderRadius="18px"
            bg="linear-gradient(180deg, rgba(119,83,60,0.96) 0%, rgba(84,57,40,0.98) 100%)"
            boxShadow="0 10px 18px rgba(0,0,0,0.28)"
          />
        ) : null}
        {step === "line-3" || step === "line-4" || step === "line-5" || step === "line-6" ? (
          <Flex position="absolute" right="32px" bottom="84px" w="118px" pointerEvents="none">
            <img
              src="/images/beigo/Beigo_Spirt.png"
              alt="從袋子裡探頭出來的小貝狗"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}
        {step === "line-18" || step === "line-19" ? (
          <Flex position="absolute" right="28px" bottom="92px" w="122px" pointerEvents="none">
            <img
              src="/images/diary/diary_demo.jpg"
              alt="袋子裡露出的日記本"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
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
            ] as Array<{ key: DialogTypingMode; label: string }>).map((mode) => (
              <Flex
                key={mode.key}
                px="8px"
                h="24px"
                borderRadius="999px"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                bgColor={typingMode === mode.key ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.1)"}
                onClick={() => {
                  setTypingMode(mode.key);
                  saveDialogTypingMode(mode.key);
                }}
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

      <EventHistoryOverlay
        title="事件回顧"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        lines={historyLines}
      />
    </Flex>
  );
}
