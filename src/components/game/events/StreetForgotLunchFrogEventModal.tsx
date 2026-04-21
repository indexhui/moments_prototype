"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { STREET_FORGOT_LUNCH_FROG_EVENT_COPY } from "@/lib/game/events";
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

type Phase =
  | "street-0"
  | "street-1"
  | "street-2"
  | "street-3"
  | "street-4"
  | "work-half"
  | "office"
  | "mart-0"
  | "mart-1"
  | "mart-2"
  | "mart-3"
  | "mart-4"
  | "mart-5"
  | "mart-6"
  | "photo"
  | "post-0"
  | "post-1"
  | "post-2";

const hintFadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;
const workWave = keyframes`
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`;
const PHASE_ORDER: Phase[] = [
  "street-0",
  "street-1",
  "street-2",
  "street-3",
  "street-4",
  "work-half",
  "office",
  "mart-0",
  "mart-1",
  "mart-2",
  "mart-3",
  "mart-4",
  "mart-5",
  "mart-6",
  "photo",
  "post-0",
  "post-1",
  "post-2",
];

function nextPhase(current: Phase): Phase | null {
  const index = PHASE_ORDER.indexOf(current);
  if (index < 0 || index >= PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[index + 1];
}

function getSceneMeta(phase: Phase) {
  if (phase.startsWith("street")) return { title: "街道", bgImage: "/images/street.jpg" };
  if (phase === "office" || phase === "work-half") return { title: "辦公室", bgImage: "/images/office.jpg" };
  if (phase === "mart-6" || phase === "photo") return { title: "便利商店", bgImage: "/images/CH/mart_frog.jpg" };
  if (phase.startsWith("mart") || phase.startsWith("post")) {
    return { title: "便利商店", bgImage: "/images/outside/mart.jpg" };
  }
  return { title: "街道", bgImage: "/images/street.jpg" };
}

function getPhaseLine(phase: Phase): { speaker: string; text: string } | null {
  if (phase === "street-0") return STREET_FORGOT_LUNCH_FROG_EVENT_COPY.streetLines[0];
  if (phase === "street-1") return STREET_FORGOT_LUNCH_FROG_EVENT_COPY.streetLines[1];
  if (phase === "street-2") return STREET_FORGOT_LUNCH_FROG_EVENT_COPY.streetLines[2];
  if (phase === "street-3") return STREET_FORGOT_LUNCH_FROG_EVENT_COPY.streetLines[3];
  if (phase === "street-4") return STREET_FORGOT_LUNCH_FROG_EVENT_COPY.streetLines[4];
  if (phase === "office") return STREET_FORGOT_LUNCH_FROG_EVENT_COPY.officeLine;
  if (phase === "mart-0") return STREET_FORGOT_LUNCH_FROG_EVENT_COPY.martLines[0];
  if (phase === "mart-1") return STREET_FORGOT_LUNCH_FROG_EVENT_COPY.martLines[1];
  if (phase === "mart-2") return STREET_FORGOT_LUNCH_FROG_EVENT_COPY.martLines[2];
  if (phase === "mart-3") return STREET_FORGOT_LUNCH_FROG_EVENT_COPY.martLines[3];
  if (phase === "mart-4") return STREET_FORGOT_LUNCH_FROG_EVENT_COPY.martLines[4];
  if (phase === "mart-5") return STREET_FORGOT_LUNCH_FROG_EVENT_COPY.martLines[5];
  if (phase === "mart-6") return STREET_FORGOT_LUNCH_FROG_EVENT_COPY.martLines[6];
  if (phase === "post-0") return STREET_FORGOT_LUNCH_FROG_EVENT_COPY.postPhotoLines[0];
  if (phase === "post-1") return STREET_FORGOT_LUNCH_FROG_EVENT_COPY.postPhotoLines[1];
  if (phase === "post-2") return STREET_FORGOT_LUNCH_FROG_EVENT_COPY.postPhotoLines[2];
  return null;
}

type StreetForgotLunchFrogEventModalProps = {
  onFinish: () => void;
  onUnlockConvenienceStore: () => void;
  savings: number;
  actionPower: number;
  fatigue: number;
};

export function StreetForgotLunchFrogEventModal({
  onFinish,
  onUnlockConvenienceStore,
  savings,
  actionPower,
  fatigue,
}: StreetForgotLunchFrogEventModalProps) {
  const [phase, setPhase] = useState<Phase>("street-0");
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [photoResetNonce, setPhotoResetNonce] = useState(0);
  const [naturalImageSize, setNaturalImageSize] = useState<NaturalImageSize | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unlockedRef = useRef(false);
  const backgroundRef = useRef<HTMLDivElement | null>(null);

  const typingMode = loadDialogTypingMode();
  const sceneMeta = getSceneMeta(phase);
  const line = getPhaseLine(phase);
  const sourceText = line?.text ?? "";
  const isTypingComplete = phase === "work-half" || phase === "photo" || displayText === sourceText;
  const isPhotoMode = phase === "photo";
  const avatarSpriteId: AvatarSpriteId = line?.speaker === "小貝狗" ? "beigo" : "mai";
  const avatarFrameIndex = useMemo(() => {
    if (phase === "mart-0") return 1; // 表情2
    if (phase === "mart-5") return 4; // 表情5
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
    PHASE_ORDER.forEach((item) => {
      if (item === "work-half" || item === "photo") return;
      const phaseLine = getPhaseLine(item);
      if (!phaseLine) return;
      if (PHASE_ORDER.indexOf(item) <= PHASE_ORDER.indexOf(phase)) {
        lines.push({ id: item, speaker: phaseLine.speaker, text: phaseLine.text });
      }
    });
    return lines;
  }, [phase]);

  useEffect(() => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (phase !== "work-half") return;
    transitionTimerRef.current = setTimeout(() => {
      setPhase("office");
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

  const handleConfirmPolaroid = () => {
    setPhase("post-0");
  };

  const handleContinue = () => {
    if (phase === "work-half") return;
    if (phase === "photo") return;
    if (sourceText && displayText !== sourceText) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setDisplayText(sourceText);
      return;
    }
    if (phase === "street-4") {
      if (!unlockedRef.current) {
        onUnlockConvenienceStore();
        unlockedRef.current = true;
      }
      setPhase("work-half");
      return;
    }
    if (phase === "mart-6") {
      setPhotoResetNonce((value) => value + 1);
    }
    const next = nextPhase(phase);
    if (!next) {
      onFinish();
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
        flex="1"
        bgImage={`url('${sceneMeta.bgImage}')`}
        bgSize={isPhotoMode ? "contain" : "cover"}
        backgroundPosition="center center"
        bgRepeat="no-repeat"
        bgColor={isPhotoMode ? "#1B1A18" : "transparent"}
        position="relative"
        justifyContent="center"
        alignItems="flex-start"
        pt="18px"
      >
        <Text color="#F5EFE5" fontSize="12px" textShadow="0 2px 6px rgba(0,0,0,0.45)">
          {sceneMeta.title}
        </Text>

        {phase === "work-half" ? (
          <Flex position="absolute" inset="0" bgColor="rgba(25,21,17,0.32)" alignItems="center" justifyContent="center">
            <Text color="white" fontSize="28px" fontWeight="800" textShadow="0 4px 10px rgba(0,0,0,0.35)">
              {"上班中...".split("").map((char, index) => (
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
          fitMode="contain"
          targetRectNormalized={{ x: 0.44, y: 0.13, width: 0.22, height: 0.24 }}
          passScore={30}
          hintText="點擊快門捕捉小日獸"
          onConfirm={handleConfirmPolaroid}
        />

        {phase === "street-4" &&
        displayText === sourceText &&
        Boolean((STREET_FORGOT_LUNCH_FROG_EVENT_COPY as { unlockEffect?: string }).unlockEffect) ? (
          <Flex
            position="absolute"
            top="18px"
            left="50%"
            transform="translateX(-50%)"
            px="12px"
            py="7px"
            borderRadius="999px"
            bgColor="rgba(57,44,31,0.84)"
            border="1px solid rgba(255,255,255,0.24)"
            boxShadow="0 6px 14px rgba(0,0,0,0.28)"
            animation={`${hintFadeIn} 220ms ease-out`}
          >
            <Text color="#FFE8A9" fontSize="12px" fontWeight="700" whiteSpace="nowrap">
              {(STREET_FORGOT_LUNCH_FROG_EVENT_COPY as { unlockEffect?: string }).unlockEffect}
            </Text>
          </Flex>
        ) : null}
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
              上班中
            </Text>
          )}
          <Flex flex="1" minH="0" direction="column">
            <Text color="white" fontSize="16px" lineHeight="1.5">
              {phase === "work-half" ? "（中午時分）" : displayText}
            </Text>
            {phase === "street-4" &&
            displayText === sourceText &&
            Boolean((STREET_FORGOT_LUNCH_FROG_EVENT_COPY as { unlockEffect?: string }).unlockEffect) ? (
              <Text
                color="#F9E17D"
                fontSize="14px"
                fontWeight="700"
                mt="8px"
                animation={`${hintFadeIn} 220ms ease-out`}
              >
                {(STREET_FORGOT_LUNCH_FROG_EVENT_COPY as { unlockEffect?: string }).unlockEffect}
              </Text>
            ) : null}
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
