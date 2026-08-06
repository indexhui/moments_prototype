"use client";

import type { CSSProperties } from "react";
import { Flex } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

type RainStreak = {
  left: number;
  top: number;
  length: number;
  width: number;
  opacity: number;
  durationMs: number;
  delayMs: number;
  driftPx: number;
  blurPx?: number;
};

type GlassDrop = {
  left: number;
  top: number;
  size: number;
  trail: number;
  opacity: number;
  durationMs: number;
  delayMs: number;
  driftPx: number;
};

const FAR_RAIN_STREAKS: RainStreak[] = [
  { left: 4, top: -8, length: 31, width: 1.1, opacity: 0.34, durationMs: 1780, delayMs: -620, driftPx: -5 },
  { left: 12, top: 18, length: 24, width: 1, opacity: 0.28, durationMs: 1920, delayMs: -1420, driftPx: -4 },
  { left: 21, top: 2, length: 35, width: 1.2, opacity: 0.3, durationMs: 1860, delayMs: -280, driftPx: -5 },
  { left: 30, top: 28, length: 27, width: 1, opacity: 0.24, durationMs: 2040, delayMs: -1660, driftPx: -4 },
  { left: 38, top: 8, length: 40, width: 1.2, opacity: 0.32, durationMs: 1740, delayMs: -920, driftPx: -5 },
  { left: 46, top: 37, length: 29, width: 1, opacity: 0.26, durationMs: 1960, delayMs: -1240, driftPx: -4 },
  { left: 54, top: -4, length: 34, width: 1.1, opacity: 0.28, durationMs: 1840, delayMs: -1520, driftPx: -5 },
  { left: 63, top: 22, length: 25, width: 1, opacity: 0.24, durationMs: 2100, delayMs: -480, driftPx: -4 },
  { left: 71, top: 4, length: 38, width: 1.2, opacity: 0.3, durationMs: 1800, delayMs: -1120, driftPx: -5 },
  { left: 79, top: 31, length: 30, width: 1, opacity: 0.25, durationMs: 2010, delayMs: -1740, driftPx: -4 },
  { left: 88, top: 11, length: 33, width: 1.1, opacity: 0.29, durationMs: 1880, delayMs: -760, driftPx: -5 },
  { left: 96, top: 43, length: 26, width: 1, opacity: 0.23, durationMs: 2160, delayMs: -1380, driftPx: -4 },
];

const NEAR_RAIN_STREAKS: RainStreak[] = [
  { left: 7, top: 46, length: 62, width: 1.8, opacity: 0.46, durationMs: 1280, delayMs: -980, driftPx: -8, blurPx: 0.15 },
  { left: 16, top: 67, length: 78, width: 2.2, opacity: 0.5, durationMs: 1160, delayMs: -320, driftPx: -9, blurPx: 0.25 },
  { left: 25, top: 38, length: 55, width: 1.7, opacity: 0.4, durationMs: 1390, delayMs: -1140, driftPx: -7, blurPx: 0.1 },
  { left: 35, top: 78, length: 84, width: 2.3, opacity: 0.52, durationMs: 1120, delayMs: -720, driftPx: -10, blurPx: 0.3 },
  { left: 43, top: 51, length: 66, width: 1.9, opacity: 0.45, durationMs: 1260, delayMs: -180, driftPx: -8, blurPx: 0.2 },
  { left: 53, top: 72, length: 74, width: 2.1, opacity: 0.48, durationMs: 1190, delayMs: -880, driftPx: -9, blurPx: 0.25 },
  { left: 61, top: 43, length: 58, width: 1.7, opacity: 0.39, durationMs: 1420, delayMs: -540, driftPx: -7, blurPx: 0.1 },
  { left: 70, top: 83, length: 86, width: 2.3, opacity: 0.5, durationMs: 1140, delayMs: -1060, driftPx: -10, blurPx: 0.3 },
  { left: 78, top: 57, length: 64, width: 1.9, opacity: 0.44, durationMs: 1310, delayMs: -420, driftPx: -8, blurPx: 0.2 },
  { left: 87, top: 75, length: 80, width: 2.2, opacity: 0.49, durationMs: 1170, delayMs: -820, driftPx: -9, blurPx: 0.25 },
  { left: 94, top: 49, length: 56, width: 1.7, opacity: 0.38, durationMs: 1450, delayMs: -1240, driftPx: -7, blurPx: 0.1 },
];

const GLASS_DROPS: GlassDrop[] = [
  { left: 8, top: 5, size: 5, trail: 29, opacity: 0.22, durationMs: 7200, delayMs: -1800, driftPx: -3 },
  { left: 19, top: 31, size: 3.5, trail: 20, opacity: 0.17, durationMs: 8300, delayMs: -6100, driftPx: 2 },
  { left: 46, top: 9, size: 4, trail: 25, opacity: 0.19, durationMs: 7800, delayMs: -4300, driftPx: -2 },
  { left: 67, top: 25, size: 5.5, trail: 34, opacity: 0.2, durationMs: 8800, delayMs: -2500, driftPx: 3 },
  { left: 89, top: 3, size: 3.5, trail: 22, opacity: 0.16, durationMs: 7600, delayMs: -5300, driftPx: -2 },
  { left: 96, top: 48, size: 5, trail: 31, opacity: 0.18, durationMs: 9200, delayMs: -1200, driftPx: 2 },
];

const rainyMorningStreakFall = keyframes`
  0% {
    opacity: 0;
    transform: translate3d(0, -44px, 0) rotate(3deg) scaleY(0.72);
  }
  16% { opacity: var(--rain-opacity); }
  72% { opacity: var(--rain-opacity); }
  100% {
    opacity: 0;
    transform: translate3d(var(--rain-drift), 172px, 0) rotate(3deg) scaleY(1.04);
  }
`;

const rainyMorningVeilBreathe = keyframes`
  0%, 100% { opacity: 0.08; }
  50% { opacity: 0.16; }
`;

const rainyMorningMistDrift = keyframes`
  0% { opacity: 0.05; transform: translate3d(-7%, 2px, 0) scale(1); }
  48% { opacity: 0.13; transform: translate3d(2%, -4px, 0) scale(1.06); }
  100% { opacity: 0.06; transform: translate3d(10%, 1px, 0) scale(1.02); }
`;

const rainyMorningCloudShadow = keyframes`
  0% { opacity: 0.08; transform: translate3d(-12%, 0, 0); }
  45% { opacity: 0.16; }
  100% { opacity: 0.06; transform: translate3d(15%, 0, 0); }
`;

const rainyMorningGlassDropSlide = keyframes`
  0% {
    opacity: 0;
    transform: translate3d(0, -18px, 0) scale(0.76);
  }
  16% { opacity: var(--glass-drop-opacity); }
  68% { opacity: calc(var(--glass-drop-opacity) * 0.8); }
  100% {
    opacity: 0;
    transform: translate3d(var(--glass-drop-drift), 118px, 0) scale(1.04);
  }
`;

const rainyMorningDawnGlow = keyframes`
  0%, 100% { opacity: 0.04; transform: translate3d(-5%, 0, 0); }
  50% { opacity: 0.11; transform: translate3d(4%, 0, 0); }
`;

function RainLayer({ streaks }: { streaks: RainStreak[] }) {
  return (
    <>
      {streaks.map((streak, index) => {
        const style = {
          "--rain-opacity": streak.opacity,
          "--rain-drift": `${streak.driftPx}px`,
        } as CSSProperties;

        return (
          <Flex
            key={`${streak.left}-${streak.top}-${index}`}
            data-rain-streak="true"
            position="absolute"
            left={`${streak.left}%`}
            top={`${streak.top}%`}
            w={`${streak.width}px`}
            h={`${streak.length}px`}
            borderRadius="999px 999px 70% 70%"
            bgImage="linear-gradient(180deg, rgba(246,248,237,0) 0%, rgba(246,248,237,0.9) 18%, rgba(235,242,232,0.78) 76%, rgba(235,242,232,0) 100%)"
            clipPath="polygon(34% 0%, 100% 7%, 68% 100%, 0% 91%)"
            filter={`blur(${streak.blurPx ?? 0}px)`}
            transformOrigin="50% 0%"
            willChange="transform, opacity"
            animation={`${rainyMorningStreakFall} ${streak.durationMs}ms linear ${streak.delayMs}ms infinite`}
            style={style}
          />
        );
      })}
    </>
  );
}

function GlassDroplets() {
  return (
    <>
      {GLASS_DROPS.map((drop, index) => {
        const style = {
          "--glass-drop-opacity": drop.opacity,
          "--glass-drop-drift": `${drop.driftPx}px`,
        } as CSSProperties;

        return (
          <Flex
            key={`${drop.left}-${drop.top}-${index}`}
            data-rain-glass-drop="true"
            position="absolute"
            left={`${drop.left}%`}
            top={`${drop.top}%`}
            w={`${drop.size}px`}
            h={`${drop.size + drop.trail}px`}
            direction="column"
            alignItems="center"
            filter="blur(0.35px)"
            opacity="0"
            willChange="transform, opacity"
            animation={`${rainyMorningGlassDropSlide} ${drop.durationMs}ms cubic-bezier(0.3, 0, 0.35, 1) ${drop.delayMs}ms infinite`}
            style={style}
          >
            <Flex
              flex="0 0 auto"
              w={`${drop.size}px`}
              h={`${drop.size}px`}
              border="1px solid rgba(242,248,239,0.46)"
              borderRadius="58% 42% 62% 38%"
              bgImage="radial-gradient(circle at 34% 26%, rgba(255,255,250,0.45), rgba(205,222,220,0.08) 58%, transparent 72%)"
              boxShadow="0 0 5px rgba(223,235,230,0.2)"
            />
            <Flex
              mt="-1px"
              w="1px"
              h={`${drop.trail}px`}
              bgImage="linear-gradient(180deg, rgba(236,244,238,0.36), rgba(230,239,234,0))"
            />
          </Flex>
        );
      })}
    </>
  );
}

export function RainyMorningAtmosphere() {
  return (
    <Flex
      aria-hidden="true"
      position="absolute"
      inset="0"
      zIndex={2}
      pointerEvents="none"
      overflow="hidden"
      css={{
        "@media (prefers-reduced-motion: reduce)": {
          "& [data-rain-streak='true']": { animation: "none", opacity: 0 },
          "& [data-rain-veil='true']": { animation: "none", opacity: 0.1 },
          "& [data-rain-mist='true']": { animation: "none", opacity: 0.08 },
          "& [data-rain-cloud-shadow='true']": { animation: "none", opacity: 0.08 },
          "& [data-rain-glass-drop='true']": { animation: "none", opacity: 0 },
          "& [data-rain-dawn-glow='true']": { animation: "none", opacity: 0.06 },
        },
      }}
    >
      <Flex
        position="absolute"
        inset="0"
        bgImage="radial-gradient(circle at 50% 40%, transparent 38%, rgba(34,48,55,0.08) 72%, rgba(24,35,41,0.24) 100%), linear-gradient(180deg, rgba(44,61,69,0.12), transparent 28%, rgba(26,38,43,0.13) 100%)"
      />
      <Flex
        data-rain-cloud-shadow="true"
        position="absolute"
        top="-8%"
        left="-30%"
        w="160%"
        h="62%"
        bgImage="radial-gradient(ellipse at center, rgba(39,58,68,0.34), rgba(66,87,94,0.11) 44%, transparent 72%)"
        filter="blur(24px)"
        mixBlendMode="multiply"
        animation={`${rainyMorningCloudShadow} 9800ms ease-in-out infinite alternate`}
      />
      <Flex
        data-rain-mist="true"
        position="absolute"
        top="22%"
        left="-28%"
        w="148%"
        h="25%"
        bgImage="radial-gradient(ellipse at center, rgba(216,230,226,0.62), rgba(193,214,215,0.17) 48%, transparent 76%)"
        filter="blur(25px)"
        mixBlendMode="screen"
        animation={`${rainyMorningMistDrift} 11200ms ease-in-out -3100ms infinite alternate`}
      />
      <Flex
        data-rain-mist="true"
        position="absolute"
        top="57%"
        left="-38%"
        w="152%"
        h="21%"
        bgImage="radial-gradient(ellipse at center, rgba(204,220,217,0.45), rgba(184,207,210,0.12) 48%, transparent 76%)"
        filter="blur(30px)"
        mixBlendMode="screen"
        animation={`${rainyMorningMistDrift} 13800ms ease-in-out -7600ms infinite alternate-reverse`}
      />
      <Flex
        data-rain-dawn-glow="true"
        position="absolute"
        top="-12%"
        right="-38%"
        w="118%"
        h="82%"
        bgImage="linear-gradient(126deg, transparent 28%, rgba(242,236,207,0.28) 48%, rgba(233,239,223,0.08) 60%, transparent 72%)"
        filter="blur(18px)"
        mixBlendMode="screen"
        animation={`${rainyMorningDawnGlow} 7600ms ease-in-out infinite`}
      />
      <Flex
        data-rain-veil="true"
        position="absolute"
        inset="0"
        bgImage="linear-gradient(108deg, rgba(178,203,211,0.18) 0%, transparent 32%, rgba(232,238,224,0.12) 68%, transparent 100%)"
        mixBlendMode="screen"
        animation={`${rainyMorningVeilBreathe} 5200ms ease-in-out infinite`}
      />
      <RainLayer streaks={FAR_RAIN_STREAKS} />
      <GlassDroplets />
      <RainLayer streaks={NEAR_RAIN_STREAKS} />
    </Flex>
  );
}
