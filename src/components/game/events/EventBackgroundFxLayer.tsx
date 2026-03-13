"use client";

import { keyframes } from "@emotion/react";
import { Box } from "@chakra-ui/react";
import type { BackgroundShakeId } from "@/lib/game/backgroundShakeBus";

const flashWhite = keyframes`
  0% { opacity: 0; }
  15% { opacity: 0.95; }
  100% { opacity: 0; }
`;

const vignetteDark = keyframes`
  0% { opacity: 0; }
  30% { opacity: 0.52; }
  100% { opacity: 0; }
`;

const coolFilter = keyframes`
  0% { opacity: 0; }
  35% { opacity: 0.42; }
  100% { opacity: 0; }
`;

const borderPulse = keyframes`
  0% { opacity: 0; box-shadow: inset 0 0 0 0 rgba(255, 92, 92, 0.0); }
  30% { opacity: 1; box-shadow: inset 0 0 0 3px rgba(255, 92, 92, 0.85); }
  100% { opacity: 0; box-shadow: inset 0 0 0 0 rgba(255, 92, 92, 0.0); }
`;

export function EventBackgroundFxLayer({
  effectId,
  effectNonce,
}: {
  effectId: BackgroundShakeId | null;
  effectNonce: number;
}) {
  if (!effectId) return null;
  if (effectId === "flash-white") {
    return (
      <Box
        key={`fx-flash-${effectNonce}`}
        position="absolute"
        inset="0"
        bgColor="rgba(255,255,255,0.95)"
        animation={`${flashWhite} 420ms ease-out 1`}
        pointerEvents="none"
      />
    );
  }
  if (effectId === "vignette-dark") {
    return (
      <Box
        key={`fx-vignette-${effectNonce}`}
        position="absolute"
        inset="0"
        backgroundImage="radial-gradient(circle at center, rgba(0,0,0,0) 18%, rgba(0,0,0,0.65) 100%)"
        animation={`${vignetteDark} 900ms ease-out 1`}
        pointerEvents="none"
      />
    );
  }
  if (effectId === "cool-filter") {
    return (
      <Box
        key={`fx-cool-${effectNonce}`}
        position="absolute"
        inset="0"
        bgColor="rgba(78, 124, 173, 0.42)"
        animation={`${coolFilter} 900ms ease-out 1`}
        pointerEvents="none"
      />
    );
  }
  if (effectId === "border-pulse") {
    return (
      <Box
        key={`fx-border-${effectNonce}`}
        position="absolute"
        inset="0"
        animation={`${borderPulse} 760ms ease-out 1`}
        pointerEvents="none"
      />
    );
  }
  return null;
}
