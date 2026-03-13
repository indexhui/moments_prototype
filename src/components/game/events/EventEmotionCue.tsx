"use client";

import { keyframes } from "@emotion/react";
import { Box, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { IoAlert } from "react-icons/io5";
import { FaDroplet } from "react-icons/fa6";
import {
  GAME_EMOTION_CUE_TRIGGER,
  type EmotionCueId,
  type EmotionCuePayload,
} from "@/lib/game/emotionCueBus";

type CueType = EmotionCueId | null;

const alertFlash = keyframes`
  0% { opacity: 0; transform: translateY(0) scale(0.9); }
  18% { opacity: 1; transform: translateY(-2px) scale(1); }
  36% { opacity: 0; transform: translateY(0) scale(0.95); }
  54% { opacity: 1; transform: translateY(-2px) scale(1); }
  100% { opacity: 0; transform: translateY(0) scale(0.95); }
`;

const dropletFall = keyframes`
  0% { opacity: 0; transform: translateY(-6px) translateX(0) scale(0.9); }
  20% { opacity: 1; transform: translateY(0) translateX(0) scale(1); }
  100% { opacity: 0; transform: translateY(36px) translateX(-2px) scale(0.9); }
`;

const questionPop = keyframes`
  0% { opacity: 0; transform: translateY(8px) scale(0.7); }
  35% { opacity: 1; transform: translateY(-2px) scale(1); }
  100% { opacity: 0; transform: translateY(-12px) scale(0.9); }
`;

const heartFloat = keyframes`
  0% { opacity: 0; transform: translateY(4px) scale(0.8); }
  25% { opacity: 1; transform: translateY(-2px) scale(1); }
  100% { opacity: 0; transform: translateY(-26px) scale(1.05); }
`;

const angerPunch = keyframes`
  0% { opacity: 0; transform: translateX(-4px) scale(0.85); }
  25% { opacity: 1; transform: translateX(2px) scale(1); }
  60% { opacity: 1; transform: translateX(-2px) scale(1.05); }
  100% { opacity: 0; transform: translateX(0) scale(0.9); }
`;

const dizzySpin = keyframes`
  0% { opacity: 0; transform: rotate(0deg) scale(0.75); }
  20% { opacity: 1; transform: rotate(90deg) scale(1); }
  100% { opacity: 0; transform: rotate(360deg) scale(0.85); }
`;

export function EventEmotionCue() {
  const [cueType, setCueType] = useState<CueType>(null);
  const [cueNonce, setCueNonce] = useState(0);

  useEffect(() => {
    const handleCueTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<EmotionCuePayload>;
      const nextCue = customEvent.detail?.cueId;
      if (!nextCue) return;
      setCueType(nextCue);
      setCueNonce((prev) => prev + 1);
    };
    window.addEventListener(GAME_EMOTION_CUE_TRIGGER, handleCueTrigger);
    return () => {
      window.removeEventListener(GAME_EMOTION_CUE_TRIGGER, handleCueTrigger);
    };
  }, []);

  useEffect(() => {
    if (!cueType) return;
    const hideMs = cueType === "alert" ? 900 : 1000;
    const timer = setTimeout(() => {
      setCueType(null);
    }, hideMs);
    return () => clearTimeout(timer);
  }, [cueNonce, cueType]);

  if (!cueType) return null;

  return (
    <Box
      position="absolute"
      top="20px"
      right="16px"
      zIndex={40}
      pointerEvents="none"
    >
      {cueType === "alert" ? (
        <Box
          key={`alert-${cueNonce}`}
          color="#E64545"
          animation={`${alertFlash} 900ms ease-out 1`}
        >
          <IoAlert size={28} />
        </Box>
      ) : null}
      {cueType === "droplet" ? (
        <Box
          key={`droplet-${cueNonce}`}
          color="#3C8BDA"
          animation={`${dropletFall} 1000ms ease-out 1`}
        >
          <FaDroplet size={22} />
        </Box>
      ) : null}
      {cueType === "question" ? (
        <Box
          key={`question-${cueNonce}`}
          color="#8A7BEF"
          animation={`${questionPop} 900ms ease-out 1`}
        >
          <Text fontSize="28px" fontWeight="700" lineHeight="1">？</Text>
        </Box>
      ) : null}
      {cueType === "heart" ? (
        <Box
          key={`heart-${cueNonce}`}
          color="#F06595"
          animation={`${heartFloat} 1000ms ease-out 1`}
        >
          <Text fontSize="26px" lineHeight="1">❤</Text>
        </Box>
      ) : null}
      {cueType === "anger" ? (
        <Box
          key={`anger-${cueNonce}`}
          color="#E65100"
          animation={`${angerPunch} 900ms ease-out 1`}
        >
          <Text fontSize="24px" lineHeight="1">💢</Text>
        </Box>
      ) : null}
      {cueType === "dizzy" ? (
        <Box
          key={`dizzy-${cueNonce}`}
          color="#5C6BC0"
          animation={`${dizzySpin} 1000ms linear 1`}
        >
          <Text fontSize="24px" lineHeight="1">🌀</Text>
        </Box>
      ) : null}
    </Box>
  );
}
