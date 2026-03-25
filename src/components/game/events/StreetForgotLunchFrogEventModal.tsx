"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FaCamera } from "react-icons/fa6";
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

const cameraFrameSweep = keyframes`
  0% { transform: translate(-50%, -130px); opacity: 0; }
  10% { opacity: 1; }
  84% { opacity: 1; }
  100% { transform: translate(-50%, 360px); opacity: 0; }
`;
const shutterFlash = keyframes`
  0% { opacity: 0; }
  16% { opacity: 0.92; }
  100% { opacity: 0; }
`;
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
  if (phase === "mart-6") return { title: "便利商店", bgImage: "/images/mart_frog.jpg" };
  if (phase.startsWith("mart") || phase === "photo" || phase.startsWith("post")) {
    return { title: "便利商店", bgImage: "/images/mart.jpg" };
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
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unlockedRef = useRef(false);

  const typingMode = loadDialogTypingMode();
  const sceneMeta = getSceneMeta(phase);
  const line = getPhaseLine(phase);
  const sourceText = line?.text ?? "";
  const isTypingComplete = phase === "work-half" || phase === "photo" || displayText === sourceText;

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

  const handleContinue = () => {
    if (phase === "work-half") return;
    if (phase === "photo") {
      setIsShutterFlashing(true);
      setTimeout(() => {
        setIsShutterFlashing(false);
        setPhase("post-0");
      }, 260);
      return;
    }
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
    const next = nextPhase(phase);
    if (!next) {
      onFinish();
      return;
    }
    setPhase(next);
  };

  return (
    <Flex position="absolute" inset="0" zIndex={50} direction="column" bgColor="#EDE7DE">
      <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />
      <Flex
        flex="1"
        bgImage={`url('${sceneMeta.bgImage}')`}
        bgSize="cover"
        backgroundPosition="center"
        bgRepeat="no-repeat"
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

        {phase === "photo" ? (
          <Flex position="absolute" inset="0" direction="column" alignItems="center" justifyContent="center">
            <Flex
              position="absolute"
              top="16px"
              left="0"
              right="0"
              justifyContent="center"
              pointerEvents="none"
            >
              <Text color="white" fontSize="14px" fontWeight="700" textShadow="0 2px 8px rgba(0,0,0,0.5)">
                拍照階段
              </Text>
            </Flex>
            <Flex
              position="relative"
              w="252px"
              h="176px"
              border="2px solid rgba(255,255,255,0.86)"
              borderRadius="10px"
              boxShadow="inset 0 0 0 1px rgba(0,0,0,0.15)"
            >
              <Flex position="absolute" top="-2px" left="-2px" w="20px" h="20px" borderTop="4px solid #FFF" borderLeft="4px solid #FFF" />
              <Flex position="absolute" top="-2px" right="-2px" w="20px" h="20px" borderTop="4px solid #FFF" borderRight="4px solid #FFF" />
              <Flex position="absolute" bottom="-2px" left="-2px" w="20px" h="20px" borderBottom="4px solid #FFF" borderLeft="4px solid #FFF" />
              <Flex position="absolute" bottom="-2px" right="-2px" w="20px" h="20px" borderBottom="4px solid #FFF" borderRight="4px solid #FFF" />
              <Flex
                position="absolute"
                left="50%"
                top="0"
                w="90%"
                h="2px"
                bgColor="rgba(255,255,255,0.95)"
                transform="translateX(-50%)"
                animation={`${cameraFrameSweep} 2.2s ease-in-out infinite`}
              />
            </Flex>
            <Flex
              mt="20px"
              w="84px"
              h="84px"
              borderRadius="999px"
              bgColor="rgba(255,255,255,0.88)"
              border="2px solid #8D6444"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              onClick={handleContinue}
            >
              <FaCamera color="#8D6444" size={28} />
            </Flex>
            <Text mt="8px" color="white" fontSize="13px" fontWeight="700" textShadow="0 2px 8px rgba(0,0,0,0.5)">
              點擊快門捕捉青蛙小日獸
            </Text>
          </Flex>
        ) : null}

        {phase === "photo" && isShutterFlashing ? (
          <Flex position="absolute" inset="0" bgColor="white" animation={`${shutterFlash} 260ms ease-out 1`} />
        ) : null}

        {phase === "street-4" && displayText === sourceText ? (
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
              {STREET_FORGOT_LUNCH_FROG_EVENT_COPY.unlockEffect}
            </Text>
          </Flex>
        ) : null}
      </Flex>

      <Flex
        position="absolute"
        left="14px"
        bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
        transform="none"
        zIndex={4}
        pointerEvents="none"
      >
        <EventAvatarSprite />
      </Flex>

      <DialogQuickActions onOpenOptions={() => {}} onOpenHistory={() => setIsHistoryOpen(true)} />

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
          {phase === "street-4" && displayText === sourceText ? (
            <Text
              color="#F9E17D"
              fontSize="14px"
              fontWeight="700"
              mt="8px"
              animation={`${hintFadeIn} 220ms ease-out`}
            >
              {STREET_FORGOT_LUNCH_FROG_EVENT_COPY.unlockEffect}
            </Text>
          ) : null}
        </Flex>
        <EventContinueAction enabled={isTypingComplete} onClick={handleContinue} />
      </EventDialogPanel>

      <EventHistoryOverlay
        title="事件回顧"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        lines={historyLines}
      />
    </Flex>
  );
}
