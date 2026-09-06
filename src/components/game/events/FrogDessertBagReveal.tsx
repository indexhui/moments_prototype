"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import type { ExhibitionLocale } from "@/lib/game/exhibitionI18n";
import { preloadGameImage } from "@/lib/game/preloadAssets";
import { playGameSfx } from "@/lib/game/soundEffects";
import {
  DESSERT_BAG_EMPTY_FRAME,
  DESSERT_BAG_FRAMES,
  DESSERT_BAG_HIT_RECT,
  DESSERT_BAG_IDLE_BEATS,
  DESSERT_BAG_REVEAL_BEATS,
  DESSERT_FROG_IMAGE,
  DESSERT_FROG_LAYER_RECT,
  DESSERT_REVEAL_ASSETS,
  DESSERT_SHOP_BACKGROUND,
} from "@/lib/game/frogDessertReveal";

const frogLanding = keyframes`
  0% { opacity: 0; transform: translate(-28px, -44px) scale(1.04, 0.94); }
  18% { opacity: 1; }
  66% { transform: translate(0, 0) scale(1.1, 0.88); }
  84% { transform: translate(0, -3px) scale(0.97, 1.03); }
  100% { opacity: 1; transform: translate(0, 0) scale(1); }
`;
const hintEnter = keyframes`
  from { opacity: 0; transform: translate(-50%, 5px); }
  to { opacity: 1; transform: translate(-50%, 0); }
`;

/** Use the same cover geometry as the background, including on shorter screens. */
export function FrogDessertSceneArt({
  frame = 1,
  showBag = true,
  showFrog = false,
  landing = false,
  children,
}: {
  frame?: number;
  showBag?: boolean;
  showFrog?: boolean;
  landing?: boolean;
  children?: ReactNode;
}) {
  return (
    <Box position="absolute" inset="0" overflow="hidden" pointerEvents="none" style={{ containerType: "size" }}>
      <Box
        position="absolute" left="50%" top="50%"
        style={{
          width: "max(100cqw, calc(100cqh * 786 / 1704))",
          aspectRatio: "786 / 1704",
          transform: "translate(-50%, -50%)",
        }}
      >
        {showBag ? DESSERT_BAG_FRAMES.map((src, index) => (
          <img
            key={src} src={src} alt="" aria-hidden="true" draggable={false}
            data-dessert-bag-frame={index + 1}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", visibility: frame === index + 1 ? "visible" : "hidden" }}
          />
        )) : null}
        {showFrog ? (
          <Box
            data-dessert-cabinet-frog="true"
            position="absolute"
            left={`${DESSERT_FROG_LAYER_RECT.x * 100}%`}
            top={`${DESSERT_FROG_LAYER_RECT.y * 100}%`}
            w={`${DESSERT_FROG_LAYER_RECT.width * 100}%`}
            h={`${DESSERT_FROG_LAYER_RECT.height * 100}%`}
            transformOrigin="52% 63.44%"
            animation={landing ? `${frogLanding} 420ms ease-out both` : undefined}
          >
            <img src={DESSERT_FROG_IMAGE} alt="" aria-hidden="true" draggable={false} style={{ width: "100%", height: "100%" }} />
          </Box>
        ) : null}
        {children}
      </Box>
    </Box>
  );
}

export function FrogDessertBagReveal({
  locale = "zh",
  onComplete,
}: {
  locale?: ExhibitionLocale;
  onComplete: () => void;
}) {
  const copy = {
    zh: { open: "查看晃動的提袋", hint: "輕觸提袋", landed: "青蛙跳到展示櫃上了" },
    ja: { open: "動いている袋を調べる", hint: "袋をタップ", landed: "カエルがショーケースに飛び乗った" },
    en: { open: "Inspect the moving bag", hint: "Tap the bag", landed: "The frog hopped onto the display cabinet" },
  }[locale];
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<"watch" | "reveal" | "landed">("watch");
  const [frame, setFrame] = useState(1);
  const startedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(DESSERT_REVEAL_ASSETS.map((src) => preloadGameImage(src).catch(() => undefined)))
      .then(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || phase !== "watch") return;
    let index = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const beat = DESSERT_BAG_IDLE_BEATS[index];
      setFrame(beat.frame);
      index = (index + 1) % DESSERT_BAG_IDLE_BEATS.length;
      timer = setTimeout(tick, beat.durationMs);
    };
    tick();
    return () => clearTimeout(timer);
  }, [phase, ready]);

  useEffect(() => {
    if (phase !== "reveal") return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;
    DESSERT_BAG_REVEAL_BEATS.forEach((beat) => {
      timers.push(setTimeout(() => {
        setFrame(beat.frame);
        if (beat.frame === 8) playGameSfx("frogJump");
      }, elapsed));
      elapsed += beat.durationMs;
    });
    timers.push(setTimeout(() => { setFrame(DESSERT_BAG_EMPTY_FRAME); setPhase("landed"); }, elapsed));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  useEffect(() => {
    if (phase !== "landed") return;
    const timer = setTimeout(() => onCompleteRef.current(), 720);
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <Box
      position="absolute" inset="0" zIndex={50} overflow="hidden"
      bgColor="#D9B18B" bgImage={`url("${DESSERT_SHOP_BACKGROUND}")`}
      bgSize="cover" backgroundPosition="center" bgRepeat="no-repeat"
      data-frog-dessert-bag-search={phase}
      aria-busy={!ready || phase === "reveal"}
    >
      <FrogDessertSceneArt frame={frame} showFrog={phase === "landed"} landing>
        {phase === "watch" ? (
          <>
            <Box
              as="button" aria-label={copy.open} aria-disabled={!ready}
              position="absolute"
              left={`${DESSERT_BAG_HIT_RECT.x * 100}%`} top={`${DESSERT_BAG_HIT_RECT.y * 100}%`}
              w={`${DESSERT_BAG_HIT_RECT.width * 100}%`} h={`${DESSERT_BAG_HIT_RECT.height * 100}%`}
              border="0" borderRadius="18px" bg="transparent" cursor="pointer"
              pointerEvents="auto" touchAction="manipulation"
              _focusVisible={{ outline: "3px solid #FFF0B8", outlineOffset: "3px" }}
              onClick={() => {
                if (!ready || startedRef.current) return;
                startedRef.current = true;
                setPhase("reveal");
              }}
            />
            {ready ? (
              <Text
                position="absolute" left="53.5%" top="58.5%" whiteSpace="nowrap"
                px="12px" py="5px" borderRadius="999px"
                bg="rgba(75, 51, 33, 0.7)" color="#FFF8E8" fontSize="13px"
                animation={`${hintEnter} 400ms 2600ms ease-out both`}
              >{copy.hint}</Text>
            ) : null}
          </>
        ) : null}
      </FrogDessertSceneArt>
      <Box role="status" aria-live="polite" srOnly>{phase === "landed" ? copy.landed : ""}</Box>
    </Box>
  );
}
