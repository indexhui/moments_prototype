"use client";

import { keyframes } from "@emotion/react";
import { useEffect, useMemo, useState } from "react";
import { Box } from "@chakra-ui/react";
import {
  type AvatarMotionId,
  AVATAR_MOTION_DURATION_MS,
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
const DISPLAY_WIDTH = 160;
type SpriteMeta = {
  imagePath: string;
  cols: number;
  rows: number;
  framePaths?: string[];
  sourceFrameWidth?: number;
  sourceFrameHeight?: number;
  displayWidth?: number;
};

const MAI_428_FRAME_PATHS = Array.from(
  { length: 39 },
  (_, index) => `/images/428出圖/立繪/小麥/${index + 1}_`,
);

const BAI_428_FRAME_PATHS = Array.from(
  { length: 12 },
  (_, index) => `/images/428出圖/立繪/小白/${index + 1}_`,
);

const BEIGO_428_FRAME_PATHS = [
  "/images/428出圖/立繪/小貝狗/1_一般.png",
  "/images/428出圖/立繪/小貝狗/2_擔心.png",
  "/images/428出圖/立繪/小貝狗/3_開心.png",
];

const MAI_428_FRAME_BY_INDEX = [
  "一般.png",
  "一般（小貝狗）.png",
  "無表情.png",
  "無奈困擾.png",
  "無奈（小貝狗）.png",
  "擔心.png",
  "開心.png",
  "誒？.png",
  "擔心２.png",
  "慌亂2閉眼.png",
  "痛！.png",
  "生氣.png",
  "開心２.png",
  "慌張擔心.png",
  "問號.png",
  "問號（小貝狗）.png",
  "睡衣.png",
  "睡衣（小貝狗）.png",
  "釋懷.png",
  "釋懷（小貝狗）.png",
  "生氣（閉口）.png",
  "生氣（開口）.png",
  "嚴肅（開口）.png",
  "嚴肅（閉口）.png",
  "嘆氣.png",
  "驚嚇.png",
  "驚魂未定.png",
  "慌亂.png",
  "慌亂2.png",
  "驚嚇_小貝狗.png",
  "錯愕_小貝狗.png",
  "嘆氣_小貝狗_睡衣.png",
  "疑問.png",
  "疑問.png",
  "驚訝.png",
  "驚訝.png",
  "思考1.png",
  "思考2.png",
  "恍然大悟.png",
].map((suffix, index) => `${MAI_428_FRAME_PATHS[index]}${suffix}`);

const BAI_428_FRAME_BY_INDEX = [
  "一般.png",
  "開心.png",
  "委屈心虛.png",
  "難過.png",
  "開心２.png",
  "裝傻心虛.png",
  "熬夜一般.png",
  "熬夜一般2.png",
  "熬夜疑惑.png",
  "熬夜委屈心虛.png",
  "熬夜抱歉.png",
  "熬夜難過.png",
].map((suffix, index) => `${BAI_428_FRAME_PATHS[index]}${suffix}`);

const SPRITES: Record<string, SpriteMeta> = {
  mai: {
    imagePath: "/images/mai/Mai_Spirt.png",
    cols: 6,
    rows: 3,
    framePaths: MAI_428_FRAME_BY_INDEX,
  },
  "mai-beigo": {
    imagePath: "/images/mai/mai&beigo_spirt.png",
    cols: 5,
    rows: 1,
  },
  bai: {
    imagePath: "/images/bai/Bai_Spirt.png",
    cols: 7,
    rows: 1,
    framePaths: BAI_428_FRAME_BY_INDEX,
  },
  beigo: {
    imagePath: "/images/beigo/Beigo_Spirt.png",
    cols: 2,
    rows: 1,
    framePaths: BEIGO_428_FRAME_PATHS,
  },
  clock: {
    imagePath: "/images/clock/clock_7.png",
    cols: 1,
    rows: 1,
    sourceFrameWidth: 113,
    sourceFrameHeight: 117,
    displayWidth: 94,
  },
};
export type AvatarSpriteId = keyof typeof SPRITES;

type EventAvatarSpriteProps = {
  frameIndex?: number;
  spriteId?: AvatarSpriteId;
  motionId?: AvatarMotionId;
  motionLoop?: boolean;
};

const slideInLeft = keyframes`
  0% { transform: translateX(-42px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
`;

const fadeOutLeft = keyframes`
  0% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(-120px); opacity: 0; }
`;

const fadeOutRight = keyframes`
  0% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(120px); opacity: 0; }
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

const alarmRing = keyframes`
  0% { transform: translateX(0) rotate(0deg); }
  8% { transform: translateX(-6px) rotate(-7deg); }
  16% { transform: translateX(6px) rotate(7deg); }
  24% { transform: translateX(-5px) rotate(-6deg); }
  32% { transform: translateX(5px) rotate(6deg); }
  40% { transform: translateX(0) rotate(0deg); }
  100% { transform: translateX(0) rotate(0deg); }
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
  motionId: scriptedMotionId,
  motionLoop = false,
}: EventAvatarSpriteProps) {
  const [motionId, setMotionId] = useState<AvatarMotionId | null>(scriptedMotionId ?? null);
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
    setMotionId(scriptedMotionId ?? null);
    setMotionNonce((prev) => prev + 1);
  }, [scriptedMotionId, motionLoop]);

  useEffect(() => {
    // Follow scene/scripted avatar by default; cheat can still override during the line.
    setActiveSpriteId(spriteId);
  }, [spriteId]);

  const activeFrame = selectedExpressionFrameIndex;
  const sourceFrameWidth = sprite.sourceFrameWidth ?? SOURCE_FRAME_WIDTH;
  const sourceFrameHeight = sprite.sourceFrameHeight ?? SOURCE_FRAME_HEIGHT;
  const displayWidth = sprite.displayWidth ?? DISPLAY_WIDTH;
  const displayScale = displayWidth / sourceFrameWidth;

  const motionAnimation = useMemo(() => {
    const iteration = motionLoop ? "infinite" : "1";
    if (motionId === "slide-in-left")
      return `${slideInLeft} ${AVATAR_MOTION_DURATION_MS["slide-in-left"] ?? 420}ms ease-out ${iteration}`;
    if (motionId === "fade-out-left")
      return `${fadeOutLeft} ${AVATAR_MOTION_DURATION_MS["fade-out-left"] ?? 420}ms ease-in ${iteration}`;
    if (motionId === "fade-out-right")
      return `${fadeOutRight} ${AVATAR_MOTION_DURATION_MS["fade-out-right"] ?? 420}ms ease-in ${iteration}`;
    if (motionId === "sway-horizontal")
      return `${swayHorizontal} ${AVATAR_MOTION_DURATION_MS["sway-horizontal"] ?? 520}ms ease-in-out ${iteration}`;
    if (motionId === "pop-scale")
      return `${popScale} ${AVATAR_MOTION_DURATION_MS["pop-scale"] ?? 300}ms ease-out ${iteration}`;
    if (motionId === "nod-down")
      return `${nodDown} ${AVATAR_MOTION_DURATION_MS["nod-down"] ?? 360}ms ease-out ${iteration}`;
    if (motionId === "tremble")
      return `${tremble} ${AVATAR_MOTION_DURATION_MS.tremble ?? 380}ms linear ${iteration}`;
    if (motionId === "alarm-ring")
      return `${alarmRing} ${AVATAR_MOTION_DURATION_MS["alarm-ring"] ?? 980}ms ease-in-out ${iteration}`;
    if (motionId === "jump-once")
      return `${jumpOnce} ${AVATAR_MOTION_DURATION_MS["jump-once"] ?? 420}ms ease-out ${iteration}`;
    if (motionId === "fall-left-recover")
      return `${fallLeftRecover} ${AVATAR_MOTION_DURATION_MS["fall-left-recover"] ?? 860}ms ease-in-out ${iteration}`;
    return undefined;
  }, [motionId, motionLoop]);

  const totalFrames = sprite.framePaths?.length ?? sprite.cols * sprite.rows;
  const safeFrame = Math.max(0, Math.min(totalFrames - 1, activeFrame));
  const frameImagePath = sprite.framePaths?.[safeFrame];
  const col = safeFrame % sprite.cols;
  const row = Math.floor(safeFrame / sprite.cols);
  const displayFrameWidth = sourceFrameWidth * displayScale;
  const displayFrameHeight = sourceFrameHeight * displayScale;
  const scaledSheetWidth = sourceFrameWidth * sprite.cols * displayScale;
  const scaledSheetHeight = sourceFrameHeight * sprite.rows * displayScale;

  if (frameImagePath) {
    return (
      <Box
        key={`${motionId ?? "none"}-${motionNonce}`}
        position="relative"
        w={`${displayFrameWidth}px`}
        h={`${displayFrameHeight}px`}
        animation={motionAnimation}
        transformOrigin="50% 92%"
      >
        <img
          src={frameImagePath}
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
        <EventEmotionCue />
      </Box>
    );
  }

  return (
    <Box
      key={`${motionId ?? "none"}-${motionNonce}`}
      position="relative"
      w={`${displayFrameWidth}px`}
      h={`${displayFrameHeight}px`}
      backgroundImage={`url('${sprite.imagePath}')`}
      bgRepeat="no-repeat"
      backgroundSize={`${scaledSheetWidth}px ${scaledSheetHeight}px`}
      backgroundPosition={`-${col * sourceFrameWidth * displayScale}px -${row * sourceFrameHeight * displayScale}px`}
      imageRendering="auto"
      animation={motionAnimation}
      transformOrigin="50% 92%"
    >
      <EventEmotionCue />
    </Box>
  );
}
