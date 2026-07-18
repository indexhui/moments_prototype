"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { StoryDialogPanel } from "@/components/game/StoryDialogPanel";
import { EVENT_DIALOG_HEIGHT } from "@/components/game/events/EventDialogPanel";

type SocialBeat = "intro" | "choice" | "relief" | "outro";
type PortraitMotion = "hot-enter" | "hot-exit" | "relief-enter";

const BIKE_HEAT_IMAGE = "/images/social/summer-commute/bike-heat.jpg";
const BIKE_SHADE_IMAGE = "/images/social/summer-commute/bike-shade.jpg";
const CHOICE_PATTERN_IMAGE = "/images/social/summer-commute/choice-pattern.png";
const MAI_HOT_IMAGE = "/images/428出圖/立繪/小麥/11_痛！.png";
const MAI_RELIEF_IMAGE = "/images/428出圖/立繪/小麥/7_開心.png";
const RELIEF_TRANSITION_DURATION_MS = 440;
const MOMENT_LOGO_VIEWBOX_WIDTH = 416;

const LOGO_GLYPHS = [
  {
    id: "walk-one",
    x: 0,
    width: 101,
    enterY: 28,
    enterRotate: -4,
    idleY: -3,
    idleRotate: -0.65,
    delayMs: 410,
    idleDurationMs: 2550,
  },
  {
    id: "walk-two",
    x: 99.5,
    width: 103.5,
    enterY: -24,
    enterRotate: 3.5,
    idleY: -5,
    idleRotate: 0.7,
    delayMs: 505,
    idleDurationMs: 2320,
  },
  {
    id: "little",
    x: 201.5,
    width: 110,
    enterY: 32,
    enterRotate: -3,
    idleY: -4,
    idleRotate: -0.55,
    delayMs: 600,
    idleDurationMs: 2760,
  },
  {
    id: "day",
    x: 305,
    width: 111,
    enterY: -27,
    enterRotate: 4,
    idleY: -3,
    idleRotate: 0.5,
    delayMs: 695,
    idleDurationMs: 2460,
  },
] as const;

const BRAND_ACCENT_DOTS = [
  { id: "a", left: "5%", top: "9%", size: 30, driftY: -12, scale: 1.16, duration: 3100, delay: 40 },
  { id: "b", left: "80%", top: "14%", size: 46, driftY: 11, scale: 0.86, duration: 3700, delay: 460 },
  { id: "c", left: "14%", top: "33%", size: 23, driftY: -10, scale: 1.2, duration: 2850, delay: 820 },
  { id: "d", left: "71%", top: "38%", size: 36, driftY: -14, scale: 1.12, duration: 3350, delay: 240 },
  { id: "e", left: "7%", top: "68%", size: 52, driftY: 12, scale: 0.88, duration: 3900, delay: 660 },
  { id: "f", left: "86%", top: "73%", size: 27, driftY: -11, scale: 1.2, duration: 3000, delay: 120 },
  { id: "g", left: "27%", top: "86%", size: 37, driftY: -13, scale: 1.14, duration: 3500, delay: 980 },
  { id: "h", left: "59%", top: "6%", size: 24, driftY: 10, scale: 0.88, duration: 3200, delay: 540 },
] as const;

const heatSceneIn = keyframes`
  0% {
    transform: translate3d(0, -10px, 0) scale(1.055);
    filter: brightness(1.08) saturate(0.92);
  }
  68% {
    transform: translate3d(-2px, 1px, 0) scale(1.012);
    filter: brightness(1.02) saturate(0.98);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
    filter: brightness(1) saturate(1);
  }
`;

const heatSceneDrift = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(-3px, 4px, 0) scale(1.018); }
`;

const heatHaze = keyframes`
  0%, 100% { opacity: 0.05; transform: translate3d(-30%, 0, 0) skewX(-10deg); }
  50% { opacity: 0.17; transform: translate3d(32%, -2%, 0) skewX(-10deg); }
`;

const portraitHotEnter = keyframes`
  0% { opacity: 0; transform: translate3d(-30px, 42px, 0) scale(0.9) rotate(-3deg); }
  58% { opacity: 1; transform: translate3d(5px, -5px, 0) scale(1.025) rotate(0.8deg); }
  78% { transform: translate3d(-2px, 2px, 0) scale(0.992) rotate(-0.3deg); }
  100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1) rotate(0); }
`;

const portraitHotExit = keyframes`
  0% { opacity: 1; transform: translate3d(0, 0, 0) scale(1) rotate(0); }
  28% { opacity: 1; transform: translate3d(6px, -3px, 0) scale(1.012) rotate(0.8deg); }
  100% { opacity: 0; transform: translate3d(-38px, 18px, 0) scale(0.94) rotate(-4deg); }
`;

const portraitReliefEnter = keyframes`
  0% { opacity: 0; transform: translate3d(-20px, 48px, 0) scale(0.88) rotate(-4deg); }
  52% { opacity: 1; transform: translate3d(5px, -7px, 0) scale(1.04) rotate(1deg); }
  74% { transform: translate3d(-2px, 3px, 0) scale(0.985) rotate(-0.4deg); }
  100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1) rotate(0); }
`;

const portraitHotIdle = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0); }
  48% { transform: translate3d(0, -3px, 0) rotate(-0.45deg); }
`;

const portraitReliefIdle = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0); }
  42% { transform: translate3d(0, -5px, 0) rotate(0.7deg); }
  72% { transform: translate3d(0, -2px, 0) rotate(-0.35deg); }
`;

const choicePanelIn = keyframes`
  0% { opacity: 0; transform: translate3d(0, 30px, 0) scale(0.94); filter: blur(3px); }
  62% { opacity: 1; transform: translate3d(0, -4px, 0) scale(1.012); filter: blur(0); }
  82% { transform: translate3d(0, 2px, 0) scale(0.996); }
  100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
`;

const choicePanelOut = keyframes`
  0% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
  30% { opacity: 1; transform: translate3d(0, 3px, 0) scale(0.985); }
  100% { opacity: 0; transform: translate3d(0, -22px, 0) scale(0.94); }
`;

const choiceButtonIn = keyframes`
  0% { opacity: 0; transform: translate3d(18px, 0, 0); }
  100% { opacity: 1; transform: translate3d(0, 0, 0); }
`;

const shadeSceneReveal = keyframes`
  0% { clip-path: polygon(0 0, 0 0, 0 100%, 0 100%); }
  55% { clip-path: polygon(0 0, 72% 0, 60% 100%, 0 100%); }
  100% { clip-path: polygon(0 0, 112% 0, 100% 100%, 0 100%); }
`;

const shadeSceneSettle = keyframes`
  0% { transform: translate3d(10px, 0, 0) scale(1.035); filter: brightness(1.06); }
  100% { transform: translate3d(0, 0, 0) scale(1); filter: brightness(1); }
`;

const shadeLightSweep = keyframes`
  0% { opacity: 0; transform: translate3d(-125%, 0, 0) skewX(-18deg); }
  26% { opacity: 0.16; }
  100% { opacity: 0; transform: translate3d(130%, 0, 0) skewX(-18deg); }
`;

const dialoguePanelExit = keyframes`
  0% { opacity: 1; transform: translate3d(0, 0, 0); }
  28% { opacity: 1; transform: translate3d(0, 8px, 0); }
  100% { opacity: 0; transform: translate3d(0, 104%, 0); }
`;

const dialoguePanelEnter = keyframes`
  0% { opacity: 0; transform: translate3d(0, 104%, 0); }
  68% { opacity: 1; transform: translate3d(0, -5px, 0); }
  84% { transform: translate3d(0, 2px, 0); }
  100% { opacity: 1; transform: translate3d(0, 0, 0); }
`;

const brandWipeIn = keyframes`
  0% { clip-path: polygon(0 100%, 100% 86%, 100% 100%, 0 100%); }
  68% { clip-path: polygon(0 10%, 100% 0, 100% 100%, 0 100%); }
  100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
`;

const brandAccentSweep = keyframes`
  0% { opacity: 0; transform: translate3d(-130%, 0, 0) rotate(-7deg); }
  22% { opacity: 0.28; }
  100% { opacity: 0; transform: translate3d(130%, 0, 0) rotate(-7deg); }
`;

const logoGlyphEnter = keyframes`
  0% {
    opacity: 0;
    transform: translate3d(0, var(--glyph-enter-y), 0) scale(0.76) rotate(var(--glyph-enter-rotate));
  }
  54% {
    opacity: 1;
    transform: translate3d(0, -7px, 0) scale(1.07) rotate(0.6deg);
  }
  76% { transform: translate3d(0, 3px, 0) scale(0.975) rotate(0.2deg); }
  100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1) rotate(0); }
`;

const logoGlyphIdle = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  46% {
    transform: translate3d(0, var(--glyph-idle-y), 0) scale(1.018) rotate(var(--glyph-idle-rotate));
  }
  72% { transform: translate3d(0, -1px, 0) scale(0.996) rotate(0); }
`;

const dotFieldDriftSmall = keyframes`
  from { background-position: 0 0; }
  to { background-position: 92px 128px; }
`;

const dotFieldDriftMedium = keyframes`
  from { background-position: 42px 58px; }
  to { background-position: -146px 188px; }
`;

const brandDotFloat = keyframes`
  0% { opacity: 0; transform: translate3d(0, 4px, 0) scale(0.72); }
  18% { opacity: 0.34; }
  52% {
    opacity: 0.58;
    transform: translate3d(0, var(--dot-drift-y), 0) scale(var(--dot-scale));
  }
  100% { opacity: 0.34; transform: translate3d(0, 4px, 0) scale(0.72); }
`;

function useReducedMotionPreference() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

function HeatBackground() {
  return (
    <Box position="absolute" inset="0" overflow="hidden">
      <Image
        data-social-motion="true"
        src={BIKE_HEAT_IMAGE}
        alt="炎熱夏日裡，從 YouBike 騎士視角看見前方道路與樹蔭"
        position="absolute"
        left="-17.94%"
        top="-15.67%"
        w="149.49%"
        h="91.96%"
        maxW="none"
        objectFit="cover"
        pointerEvents="none"
        userSelect="none"
        draggable={false}
        willChange="transform, filter"
        animation={`${heatSceneIn} 900ms cubic-bezier(0.2, 0.72, 0.18, 1) both, ${heatSceneDrift} 8s ease-in-out 900ms infinite`}
      />
      <Box
        data-social-motion="true"
        aria-hidden="true"
        position="absolute"
        top="0"
        bottom={EVENT_DIALOG_HEIGHT}
        left="-30%"
        w="48%"
        bg="linear-gradient(90deg, transparent, rgba(255,238,195,0.5), transparent)"
        mixBlendMode="screen"
        pointerEvents="none"
        animation={`${heatHaze} 4.8s ease-in-out infinite`}
      />
    </Box>
  );
}

function ShadeBackground() {
  return (
    <Box
      data-social-motion="true"
      position="absolute"
      inset="0"
      zIndex="2"
      overflow="hidden"
      willChange="clip-path"
      animation={`${shadeSceneReveal} ${RELIEF_TRANSITION_DURATION_MS + 120}ms cubic-bezier(0.65, 0, 0.16, 1) both`}
    >
      <Image
        data-social-motion="true"
        src={BIKE_SHADE_IMAGE}
        alt="騎進樹蔭後的 YouBike 騎士視角"
        position="absolute"
        inset="0"
        w="100%"
        h="100%"
        maxW="none"
        objectFit="cover"
        pointerEvents="none"
        userSelect="none"
        draggable={false}
        willChange="transform, filter"
        animation={`${shadeSceneSettle} 820ms cubic-bezier(0.2, 0.72, 0.18, 1) both`}
      />
      <Box
        data-social-motion="true"
        aria-hidden="true"
        position="absolute"
        inset="-10% -35%"
        w="45%"
        bg="linear-gradient(90deg, transparent, rgba(255,255,255,0.72), transparent)"
        mixBlendMode="screen"
        pointerEvents="none"
        animation={`${shadeLightSweep} 780ms ease-out 120ms both`}
      />
    </Box>
  );
}

function MaiPortrait({
  src,
  alt,
  motion,
}: {
  src: string;
  alt: string;
  motion: PortraitMotion;
}) {
  const outerAnimation =
    motion === "hot-enter"
      ? `${portraitHotEnter} 620ms cubic-bezier(0.2, 0.82, 0.2, 1) 90ms both`
      : motion === "hot-exit"
        ? `${portraitHotExit} 340ms cubic-bezier(0.55, 0, 0.8, 0.3) both`
        : `${portraitReliefEnter} 680ms cubic-bezier(0.2, 0.82, 0.2, 1) 70ms both`;
  const idleAnimation =
    motion === "hot-enter"
      ? `${portraitHotIdle} 2.7s ease-in-out 760ms infinite`
      : motion === "relief-enter"
        ? `${portraitReliefIdle} 2.35s ease-in-out 760ms infinite`
        : undefined;

  return (
    <Box
      data-social-motion="true"
      position="absolute"
      left="0"
      bottom={EVENT_DIALOG_HEIGHT}
      w="197px"
      h="247px"
      zIndex="4"
      pointerEvents="none"
      willChange="transform, opacity"
      animation={outerAnimation}
    >
      <Image
        data-social-motion="true"
        src={src}
        alt={alt}
        w="100%"
        h="100%"
        maxW="none"
        objectFit="cover"
        objectPosition="center"
        userSelect="none"
        draggable={false}
        animation={idleAnimation}
      />
    </Box>
  );
}

function ChoiceButton({
  children,
  onClick,
  delayMs,
  disabled,
}: {
  children: string;
  onClick: () => void;
  delayMs: number;
  disabled: boolean;
}) {
  return (
    <Flex
      data-social-motion="true"
      as="button"
      w="100%"
      h="45px"
      border="0"
      borderRadius="10px"
      bgColor="#907054"
      color="white"
      alignItems="center"
      justifyContent="center"
      cursor={disabled ? "default" : "pointer"}
      aria-disabled={disabled}
      pointerEvents={disabled ? "none" : "auto"}
      transition="background-color 150ms ease, transform 150ms ease"
      opacity="0"
      animation={`${choiceButtonIn} 360ms ease-out ${delayMs}ms both`}
      onClick={() => {
        if (!disabled) onClick();
      }}
      _hover={disabled ? undefined : { bgColor: "#7F6049", transform: "translateY(-1px)" }}
      _active={disabled ? undefined : { transform: "translateY(2px) scale(0.985)" }}
      _focusVisible={{ outline: "3px solid #D8B692", outlineOffset: "2px" }}
    >
      <Text
        color="white"
        fontFamily="'TaiwanPearl', 'Noto Sans TC', sans-serif"
        fontSize="20px"
        fontWeight="600"
        lineHeight="1"
      >
        {children}
      </Text>
    </Flex>
  );
}

function CommuteChoice({
  onChoose,
  isExiting,
}: {
  onChoose: () => void;
  isExiting: boolean;
}) {
  return (
    <Flex
      data-social-motion="true"
      role="dialog"
      aria-label="前方有樹蔭"
      position="absolute"
      left="8.02%"
      top="16.26%"
      w="83.97%"
      h="214.5px"
      px="20px"
      pt="34px"
      pb="22px"
      border="2px solid #A9886C"
      borderRadius="3px"
      backgroundColor="rgba(255, 255, 255, 0.94)"
      backgroundImage={`url('${CHOICE_PATTERN_IMAGE}')`}
      backgroundSize="25px 25px"
      direction="column"
      gap="12px"
      color="#644C3B"
      zIndex="10"
      willChange="transform, opacity, filter"
      animation={
        isExiting
          ? `${choicePanelOut} 360ms cubic-bezier(0.55, 0, 0.8, 0.3) both`
          : `${choicePanelIn} 520ms cubic-bezier(0.2, 0.82, 0.2, 1) both`
      }
    >
      <Text
        color="#644C3B"
        fontFamily="'TaiwanPearl', 'Noto Sans TC', sans-serif"
        fontSize="20px"
        fontWeight="600"
        lineHeight="1.35"
        mb="2px"
      >
        前方有樹蔭
      </Text>
      <ChoiceButton onClick={onChoose} delayMs={110} disabled={isExiting}>
        往前騎
      </ChoiceButton>
      <ChoiceButton onClick={onChoose} delayMs={175} disabled={isExiting}>
        待在原位
      </ChoiceButton>
    </Flex>
  );
}

function BrandDotPattern() {
  return (
    <Box aria-hidden="true" position="absolute" inset="0" zIndex="0" pointerEvents="none">
      <Box
        data-social-motion="true"
        position="absolute"
        inset="0"
        backgroundImage="radial-gradient(circle, rgba(77,177,199,0.11) 6px, transparent 6.5px)"
        backgroundSize="92px 92px"
        animation={`${dotFieldDriftSmall} 9s linear infinite`}
      />
      <Box
        data-social-motion="true"
        position="absolute"
        inset="0"
        backgroundImage="radial-gradient(circle, rgba(131,204,210,0.12) 13px, transparent 13.5px)"
        backgroundSize="188px 188px"
        backgroundPosition="42px 58px"
        animation={`${dotFieldDriftMedium} 13s linear infinite`}
      />
      {BRAND_ACCENT_DOTS.map((dot) => {
        const style = {
          "--dot-drift-y": `${dot.driftY}px`,
          "--dot-scale": dot.scale,
        } as CSSProperties;

        return (
          <Box
            key={dot.id}
            data-social-motion="true"
            position="absolute"
            left={dot.left}
            top={dot.top}
            w={`${dot.size}px`}
            h={`${dot.size}px`}
            borderRadius="50%"
            bgColor="rgba(77,177,199,0.16)"
            boxShadow="0 0 0 6px rgba(131,204,210,0.05)"
            style={style}
            willChange="transform, opacity"
            animation={`${brandDotFloat} ${dot.duration}ms ease-in-out ${720 + dot.delay}ms infinite both`}
          />
        );
      })}
    </Box>
  );
}

function AnimatedMomentLogo() {
  return (
    <Box
      role="img"
      aria-label="走走小日"
      position="relative"
      zIndex="2"
      w="83.46%"
      maxW="328px"
      aspectRatio={`${MOMENT_LOGO_VIEWBOX_WIDTH} / 126`}
      filter="drop-shadow(0 8px 12px rgba(76, 177, 199, 0.12))"
      pointerEvents="none"
    >
      {LOGO_GLYPHS.map((glyph) => {
        const entryStyle = {
          "--glyph-enter-y": `${glyph.enterY}px`,
          "--glyph-enter-rotate": `${glyph.enterRotate}deg`,
        } as CSSProperties;
        const idleStyle = {
          "--glyph-idle-y": `${glyph.idleY}px`,
          "--glyph-idle-rotate": `${glyph.idleRotate}deg`,
        } as CSSProperties;

        return (
          <Box
            key={glyph.id}
            data-social-motion="true"
            position="absolute"
            left={`${(glyph.x / MOMENT_LOGO_VIEWBOX_WIDTH) * 100}%`}
            top="0"
            w={`${(glyph.width / MOMENT_LOGO_VIEWBOX_WIDTH) * 100}%`}
            h="100%"
            style={entryStyle}
            transformOrigin="50% 58%"
            willChange="transform, opacity"
            animation={`${logoGlyphEnter} 740ms cubic-bezier(0.2, 0.82, 0.2, 1) ${glyph.delayMs}ms both`}
          >
            <Box
              data-social-motion="true"
              position="relative"
              w="100%"
              h="100%"
              overflow="hidden"
              style={idleStyle}
              transformOrigin="50% 58%"
              animation={`${logoGlyphIdle} ${glyph.idleDurationMs}ms ease-in-out ${glyph.delayMs + 760}ms infinite`}
            >
              <Image
                src="/images/logo/logo_svg.svg"
                alt=""
                aria-hidden="true"
                position="absolute"
                top="0"
                left={`${(-glyph.x / glyph.width) * 100}%`}
                w={`${(MOMENT_LOGO_VIEWBOX_WIDTH / glyph.width) * 100}%`}
                h="100%"
                maxW="none"
                userSelect="none"
                draggable={false}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function BrandOutro({ onReplay }: { onReplay: () => void }) {
  return (
    <Flex
      data-social-motion="true"
      as="button"
      aria-label="重新播放夏天通勤社群素材"
      position="absolute"
      inset="0"
      zIndex="50"
      border="0"
      bgColor="white"
      animation={`${brandWipeIn} 720ms cubic-bezier(0.65, 0, 0.16, 1) both`}
      alignItems="center"
      justifyContent="center"
      cursor="pointer"
      overflow="hidden"
      onClick={onReplay}
      _focusVisible={{ outline: "3px solid #83CCD2", outlineOffset: "-6px" }}
    >
      <BrandDotPattern />
      <Box
        data-social-motion="true"
        aria-hidden="true"
        position="absolute"
        top="-20%"
        bottom="-20%"
        left="-35%"
        w="42%"
        zIndex="1"
        bg="linear-gradient(90deg, transparent, rgba(77,177,199,0.2), transparent)"
        pointerEvents="none"
        animation={`${brandAccentSweep} 940ms ease-out 380ms both`}
      />
      <AnimatedMomentLogo />
    </Flex>
  );
}

export function SocialSummerCommuteView() {
  const [beat, setBeat] = useState<SocialBeat>("intro");
  const [isReliefTransitioning, setIsReliefTransitioning] = useState(false);
  const prefersReducedMotion = useReducedMotionPreference();
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  const restart = useCallback(() => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = null;
    setIsReliefTransitioning(false);
    setBeat("intro");
  }, []);

  const startReliefTransition = useCallback(() => {
    if (isReliefTransitioning) return;
    setIsReliefTransitioning(true);

    transitionTimerRef.current = setTimeout(
      () => {
        setBeat("relief");
        setIsReliefTransitioning(false);
        transitionTimerRef.current = null;
      },
      prefersReducedMotion ? 0 : RELIEF_TRANSITION_DURATION_MS,
    );
  }, [isReliefTransitioning, prefersReducedMotion]);

  const dialogue =
    beat === "relief"
      ? "呼……還好有樹蔭，再曬下去真的要融化了。"
      : "今天好熱呀....";
  const showShadeScene = isReliefTransitioning || beat === "relief";

  return (
    <Box
      data-social-material="summer-commute"
      position="relative"
      w="100%"
      h={{ base: "100dvh", lg: "852px" }}
      minH="640px"
      maxW="393px"
      bgColor="#D7D2C7"
      overflow="hidden"
      color="white"
      css={{
        touchAction: "manipulation",
        "@media (prefers-reduced-motion: reduce)": {
          "& [data-social-motion='true']": {
            animationDuration: "1ms !important",
            animationDelay: "0ms !important",
            animationIterationCount: "1 !important",
            transitionDuration: "1ms !important",
          },
        },
      }}
    >
      <HeatBackground />

      {showShadeScene ? <ShadeBackground /> : null}

      {beat === "intro" ? (
        <MaiPortrait
          key="mai-hot"
          src={MAI_HOT_IMAGE}
          alt="熱得滿頭汗的小麥"
          motion="hot-enter"
        />
      ) : null}
      {beat === "choice" ? (
        <MaiPortrait
          key="mai-hot"
          src={MAI_HOT_IMAGE}
          alt="熱得滿頭汗的小麥"
          motion="hot-exit"
        />
      ) : null}
      {beat === "relief" ? (
        <MaiPortrait
          key="mai-relief"
          src={MAI_RELIEF_IMAGE}
          alt="進入樹蔭後開心的小麥"
          motion="relief-enter"
        />
      ) : null}

      {beat === "choice" ? (
        <CommuteChoice
          onChoose={startReliefTransition}
          isExiting={isReliefTransitioning}
        />
      ) : null}

      {beat !== "outro" ? (
        <Flex
          data-social-motion="true"
          position="absolute"
          inset="0"
          zIndex="8"
          direction="column"
          willChange="transform, opacity"
          animation={
            isReliefTransitioning
              ? `${dialoguePanelExit} 360ms cubic-bezier(0.55, 0, 0.8, 0.3) both`
              : beat === "relief"
                ? `${dialoguePanelEnter} 460ms cubic-bezier(0.2, 0.82, 0.2, 1) 40ms both`
                : undefined
          }
        >
          <StoryDialogPanel
            key={dialogue}
            characterName="小麥"
            dialogue={dialogue}
            dialogueFontSize="18px"
            showAvatarSprite={false}
            lockAfterContinue={false}
            onContinue={() => {
              if (beat === "intro") setBeat("choice");
              if (beat === "choice") startReliefTransition();
              if (beat === "relief") setBeat("outro");
            }}
          />
        </Flex>
      ) : null}

      {beat === "outro" ? <BrandOutro onReplay={restart} /> : null}
    </Box>
  );
}
