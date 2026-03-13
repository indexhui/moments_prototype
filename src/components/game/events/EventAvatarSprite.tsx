"use client";

import { keyframes } from "@emotion/react";
import { useEffect, useMemo, useState } from "react";
import { Box } from "@chakra-ui/react";
import {
  type AvatarMotionId,
} from "@/lib/game/avatarPerformance";
import {
  GAME_AVATAR_EXPRESSION_TRIGGER,
  GAME_AVATAR_MOTION_TRIGGER,
  type AvatarExpressionPayload,
  type AvatarMotionPayload,
} from "@/lib/game/avatarCheatBus";
import { EventEmotionCue } from "@/components/game/events/EventEmotionCue";

const SOURCE_FRAME_WIDTH = 500;
const SOURCE_FRAME_HEIGHT = 627;
const DISPLAY_WIDTH = 125;
const DISPLAY_SCALE = DISPLAY_WIDTH / SOURCE_FRAME_WIDTH;
const SPRITE_COLS = 6;
const SPRITE_ROWS = 2;
const TOTAL_FRAMES = SPRITE_COLS * SPRITE_ROWS;

type EventAvatarSpriteProps = {
  frameIndex?: number;
};

const slideInLeft = keyframes`
  0% { transform: translateX(-42px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
`;

const swayHorizontal = keyframes`
  0% { transform: translateX(0) rotate(0deg); }
  25% { transform: translateX(-8px) rotate(-2deg); }
  50% { transform: translateX(8px) rotate(2deg); }
  75% { transform: translateX(-6px) rotate(-1.5deg); }
  100% { transform: translateX(0) rotate(0deg); }
`;

const popScale = keyframes`
  0% { transform: scale(1); }
  45% { transform: scale(1.16); }
  100% { transform: scale(1); }
`;

const nodDown = keyframes`
  0% { transform: translateY(0) rotate(0deg); }
  35% { transform: translateY(8px) rotate(2deg); }
  60% { transform: translateY(10px) rotate(0deg); }
  100% { transform: translateY(0) rotate(0deg); }
`;

const tremble = keyframes`
  0% { transform: translateX(0); }
  10% { transform: translateX(-4px); }
  20% { transform: translateX(4px); }
  30% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  50% { transform: translateX(-4px); }
  60% { transform: translateX(4px); }
  70% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
  100% { transform: translateX(0); }
`;

const jumpOnce = keyframes`
  0% { transform: translateY(0) scale(1); }
  35% { transform: translateY(-18px) scale(1.02); }
  60% { transform: translateY(2px) scale(0.98); }
  100% { transform: translateY(0) scale(1); }
`;

const fallLeftRecover = keyframes`
  0% { transform: translateX(0) rotate(0deg); opacity: 1; }
  28% { transform: translateX(-16px) translateY(8px) rotate(-26deg); opacity: 1; }
  45% { transform: translateX(-22px) translateY(14px) rotate(-34deg); opacity: 0; }
  62% { transform: translateX(-8px) translateY(22px) rotate(-12deg); opacity: 0; }
  78% { transform: translateX(0) translateY(8px) rotate(4deg); opacity: 1; }
  100% { transform: translateX(0) translateY(0) rotate(0deg); opacity: 1; }
`;

export function EventAvatarSprite({ frameIndex }: EventAvatarSpriteProps) {
  const [motionId, setMotionId] = useState<AvatarMotionId | null>(null);
  const [motionNonce, setMotionNonce] = useState(0);
  const [selectedExpressionFrameIndex, setSelectedExpressionFrameIndex] = useState(0);

  useEffect(() => {
    const handleMotion = (event: Event) => {
      const customEvent = event as CustomEvent<AvatarMotionPayload>;
      const nextMotionId = customEvent.detail?.motionId;
      if (!nextMotionId) return;
      setMotionId(nextMotionId);
      setMotionNonce((prev) => prev + 1);
    };

    const handleExpression = (event: Event) => {
      const customEvent = event as CustomEvent<AvatarExpressionPayload>;
      const nextFrameIndex = customEvent.detail?.frameIndex;
      if (typeof nextFrameIndex !== "number") return;
      setSelectedExpressionFrameIndex(nextFrameIndex);
    };

    window.addEventListener(GAME_AVATAR_MOTION_TRIGGER, handleMotion);
    window.addEventListener(GAME_AVATAR_EXPRESSION_TRIGGER, handleExpression);

    return () => {
      window.removeEventListener(GAME_AVATAR_MOTION_TRIGGER, handleMotion);
      window.removeEventListener(GAME_AVATAR_EXPRESSION_TRIGGER, handleExpression);
    };
  }, []);

  const activeFrame = frameIndex ?? selectedExpressionFrameIndex;

  const motionAnimation = useMemo(() => {
    if (motionId === "slide-in-left") return `${slideInLeft} 420ms ease-out 1`;
    if (motionId === "sway-horizontal") return `${swayHorizontal} 520ms ease-in-out 1`;
    if (motionId === "pop-scale") return `${popScale} 300ms ease-out 1`;
    if (motionId === "nod-down") return `${nodDown} 360ms ease-out 1`;
    if (motionId === "tremble") return `${tremble} 380ms linear 1`;
    if (motionId === "jump-once") return `${jumpOnce} 420ms ease-out 1`;
    if (motionId === "fall-left-recover") return `${fallLeftRecover} 860ms ease-in-out 1`;
    return undefined;
  }, [motionId]);

  const safeFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, activeFrame));
  const col = safeFrame % SPRITE_COLS;
  const row = Math.floor(safeFrame / SPRITE_COLS);
  const displayFrameWidth = SOURCE_FRAME_WIDTH * DISPLAY_SCALE;
  const displayFrameHeight = SOURCE_FRAME_HEIGHT * DISPLAY_SCALE;
  const scaledSheetWidth = SOURCE_FRAME_WIDTH * SPRITE_COLS * DISPLAY_SCALE;
  const scaledSheetHeight = SOURCE_FRAME_HEIGHT * SPRITE_ROWS * DISPLAY_SCALE;

  return (
    <Box
      key={`${motionId ?? "none"}-${motionNonce}`}
      position="relative"
      w={`${displayFrameWidth}px`}
      h={`${displayFrameHeight}px`}
      backgroundImage="url('/images/mai/Mai_Spirt.png')"
      bgRepeat="no-repeat"
      backgroundSize={`${scaledSheetWidth}px ${scaledSheetHeight}px`}
      backgroundPosition={`-${col * SOURCE_FRAME_WIDTH * DISPLAY_SCALE}px -${row * SOURCE_FRAME_HEIGHT * DISPLAY_SCALE}px`}
      imageRendering="auto"
      animation={motionAnimation}
      transformOrigin="50% 92%"
    >
      <EventEmotionCue />
    </Box>
  );
}
