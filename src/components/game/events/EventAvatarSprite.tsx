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
const SPRITES = {
  mai: {
    imagePath: "/images/mai/Mai_Spirt.png",
    cols: 6,
    rows: 2,
  },
  bai: {
    imagePath: "/images/bai/Bai_Spirt.png",
    cols: 6,
    rows: 1,
  },
  beigo: {
    imagePath: "/images/beigo/Beigo_Spirt.png",
    cols: 3,
    rows: 1,
  },
} as const;
export type AvatarSpriteId = keyof typeof SPRITES;

type EventAvatarSpriteProps = {
  frameIndex?: number;
  spriteId?: AvatarSpriteId;
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

export function EventAvatarSprite({
  frameIndex,
  spriteId = "mai",
}: EventAvatarSpriteProps) {
  const [motionId, setMotionId] = useState<AvatarMotionId | null>(null);
  const [motionNonce, setMotionNonce] = useState(0);
  const [activeSpriteId, setActiveSpriteId] = useState<AvatarSpriteId>(spriteId);
  const [selectedExpressionFrameIndex, setSelectedExpressionFrameIndex] = useState(
    frameIndex ?? 0,
  );
  const sprite = SPRITES[activeSpriteId];

  useEffect(() => {
    const handleMotion = (event: Event) => {
      const customEvent = event as CustomEvent<AvatarMotionPayload>;
      const nextMotionId = customEvent.detail?.motionId;
      const targetSpriteId = customEvent.detail?.targetSpriteId;
      if (targetSpriteId) {
        setActiveSpriteId(targetSpriteId);
      }
      if (!nextMotionId) return;
      setMotionId(nextMotionId);
      setMotionNonce((prev) => prev + 1);
    };

    const handleExpression = (event: Event) => {
      const customEvent = event as CustomEvent<AvatarExpressionPayload>;
      const nextFrameIndex = customEvent.detail?.frameIndex;
      const targetSpriteId = customEvent.detail?.targetSpriteId;
      if (targetSpriteId) {
        setActiveSpriteId(targetSpriteId);
      }
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

  useEffect(() => {
    setSelectedExpressionFrameIndex(frameIndex ?? 0);
  }, [frameIndex, spriteId]);

  useEffect(() => {
    // Follow scene/scripted avatar by default; cheat can still override during the line.
    setActiveSpriteId(spriteId);
  }, [spriteId]);

  const activeFrame = selectedExpressionFrameIndex;

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

  const totalFrames = sprite.cols * sprite.rows;
  const safeFrame = Math.max(0, Math.min(totalFrames - 1, activeFrame));
  const col = safeFrame % sprite.cols;
  const row = Math.floor(safeFrame / sprite.cols);
  const displayFrameWidth = SOURCE_FRAME_WIDTH * DISPLAY_SCALE;
  const displayFrameHeight = SOURCE_FRAME_HEIGHT * DISPLAY_SCALE;
  const scaledSheetWidth = SOURCE_FRAME_WIDTH * sprite.cols * DISPLAY_SCALE;
  const scaledSheetHeight = SOURCE_FRAME_HEIGHT * sprite.rows * DISPLAY_SCALE;

  return (
    <Box
      key={`${motionId ?? "none"}-${motionNonce}`}
      position="relative"
      w={`${displayFrameWidth}px`}
      h={`${displayFrameHeight}px`}
      backgroundImage={`url('${sprite.imagePath}')`}
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
