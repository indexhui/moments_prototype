"use client";

import { useEffect, useId, useRef } from "react";
import { Box, Button, Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import type { ExhibitionLocale } from "@/lib/game/exhibitionI18n";
import { playFmodGameEvent } from "@/lib/game/fmodWeb";

const COPY = {
  zh: {
    move: "將路徑拼圖移上去",
    connected: "寬度一樣，可以接通",
    start: "開始",
  },
  ja: {
    move: "ルートのピースを上へ動かそう",
    connected: "幅が同じなら、つながる",
    start: "はじめる",
  },
  en: {
    move: "Move a route tile into the slot",
    connected: "Matching widths connect",
    start: "Start",
  },
} as const;

const ART = {
  narrowToWide: "/images/route/route_new/narrow_to_wide.png",
  straight: "/images/route/route_new/straight.png",
  wideToNarrow: "/images/route/route_new/wide_to_narrow.png",
  connected: "/images/figma/route-tutorial/connected.svg",
  mismatch: "/images/figma/route-tutorial/mismatch.svg",
  mismatchSeam: "/images/figma/route-tutorial/mismatch-seam.svg",
} as const;

// One shared 8-second loop; each upward move is one uninterrupted 800 ms glide.
// Translation percentages use each moving tile's 140 × 140 reference box.
const LOOP_DURATION = "8s";
const MOVE_EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const moveMatchingTile = keyframes`
  0%, 8%, 44%, 100% { transform: translate(0, 0) scale(1); }
  18%, 36% { transform: translate(111.8%, -260.7%) scale(1.17857); }
`;
const moveMismatchingTile = keyframes`
  0%, 58%, 94%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
  68% { transform: translate(1.8%, -260.7%) scale(1.17857) rotate(0deg); }
  70%, 74% { transform: translate(-0.7%, -260.7%) scale(1.17857) rotate(-1deg); }
  72% { transform: translate(4.3%, -260.7%) scale(1.17857) rotate(1deg); }
  76%, 86% { transform: translate(1.8%, -260.7%) scale(1.17857) rotate(0deg); }
`;
const tileLift = keyframes`
  0%, 8%, 18%, 36%, 44%, 100% { box-shadow: 0 2px 3px #79573C1A; }
  13%, 40% { box-shadow: 0 7px 10px #79573C30; }
`;
const joinRoad = keyframes`
  0%, 17%, 39%, 100% { transform: translateY(0); }
  20%, 36% { transform: translateY(-3%); }
`;
const showConnected = keyframes`
  0%, 18%, 38%, 100% { opacity: 0; transform: scale(0.8); }
  21% { opacity: 1; transform: scale(1.12); }
  24%, 35% { opacity: 1; transform: scale(1); }
`;
const showMismatch = keyframes`
  0%, 68%, 89%, 100% { opacity: 0; transform: scale(0.9); }
  71%, 86% { opacity: 1; transform: scale(1); }
`;
const moveTitle = keyframes`
  0%, 17%, 40%, 100% { opacity: 1; }
  20%, 37% { opacity: 0; }
`;
const connectedTitle = keyframes`
  0%, 17%, 40%, 100% { opacity: 0; }
  20%, 36% { opacity: 1; }
`;
const enterModal = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const loop = (animation: ReturnType<typeof keyframes>) =>
  `${animation} ${LOOP_DURATION} ${MOVE_EASING} infinite`;

function RouteTile({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt=""
      draggable={false}
      w="100%"
      h="100%"
      objectFit="cover"
      borderRadius="0.5cqw"
    />
  );
}

function RouteDemo() {
  return (
    <Box
      position="absolute"
      left="3.987%"
      top="12.117%"
      w="92.027%"
      h="71.556%"
      bg="#FCF7EC"
      borderRadius="3.322cqw"
      overflow="hidden"
      aria-hidden="true"
      pointerEvents="none"
    >
      <Box position="absolute" left="2.527%" top="65.954%" w="95.307%" h="31.016%" bg="#F5EEE0" borderRadius="3.322cqw" />
      <Box position="absolute" left="35.018%" top="3.03%" w="29.964%" h="30.303%" bg="white" border="0.498cqw dashed #D3C1AE" borderRadius="1.329cqw" />
      <Box
        position="absolute" left="35.199%" top="34.225%" w="29.783%" aspectRatio="1"
        animation={loop(joinRoad)} data-route-demo-fixed="true"
      >
        <RouteTile src={ART.wideToNarrow} />
      </Box>
      {[
        { id: "matching", src: ART.narrowToWide, left: "6.859%", motion: moveMatchingTile },
        { id: "mismatching", src: ART.straight, left: "34.657%", motion: moveMismatchingTile },
      ].map(({ id, src, left, motion }) => (
        <Box
          key={id}
          position="absolute" left={left} top="68.984%" w="25.271%" aspectRatio="1"
          transformOrigin="top left" animation={loop(motion)} willChange="transform"
          data-route-demo-tile={id}
        >
          <Box
            w="100%" h="100%" borderRadius="0.5cqw"
            animation={loop(tileLift)}
            animationDelay={id === "mismatching" ? "-4s" : undefined}
            data-route-demo-shadow="true"
          >
            <RouteTile src={src} />
          </Box>
        </Box>
      ))}
      <Image
        src={ART.connected} alt="" position="absolute"
        left="73.105%" top="29.768%" w="9.025%" h="8.913%"
        animation={loop(showConnected)} data-route-demo-feedback="connected"
      />
      <Box position="absolute" inset="0" animation={loop(showMismatch)} data-route-demo-feedback="mismatch">
        <Image src={ART.mismatchSeam} alt="" position="absolute" left="35.199%" top="32.62%" w="29.603%" h="0.713%" />
        <Image src={ART.mismatch} alt="" position="absolute" left="70.758%" top="30.66%" w="7.104%" h="6.9%" />
      </Box>
    </Box>
  );
}

export function ExhibitionRouteTutorialModal({ locale, onClose }: {
  locale: ExhibitionLocale;
  onClose: () => void;
}) {
  const copy = COPY[locale];
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    dialogRef.current?.focus({ preventScroll: true });
    return () => {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <Flex
      position="absolute" inset="0" zIndex={1650}
      bg="rgba(49, 36, 24, 0.46)" align="center" justify="center"
      css={{ containerType: "size" }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        } else if (event.key === "Tab") {
          event.preventDefault();
          primaryRef.current?.focus({ preventScroll: true });
        }
      }}
    >
      <Box
        ref={dialogRef} tabIndex={-1} outline="none"
        role="dialog" aria-modal="true" aria-labelledby={titleId}
        position="relative" w="min(301px, calc(100cqw - 32px), calc((100cqh - 32px) * 602 / 784))"
        aspectRatio="602 / 784" bg="#FFFDF9" borderRadius="10px" overflow="hidden"
        animation={`${enterModal} 260ms ease-out both`}
        data-figma-node-id="12894:14545"
        css={{
          containerType: "inline-size",
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
            "& *": { animation: "none !important", willChange: "auto !important" },
            '& [data-route-demo-tile="matching"]': { transform: "translate(111.8%, -260.7%) scale(1.17857)" },
            "& [data-route-demo-fixed]": { transform: "translateY(-3%)" },
            '& [data-route-demo-feedback="mismatch"], & [data-route-demo-title="move"]': { opacity: 0 },
            '& [data-route-demo-feedback="connected"], & [data-route-demo-title="connected"]': { opacity: 1 },
          },
        }}
      >
        <Box
          id={titleId} role="heading" aria-level={2}
          aria-label={`${copy.move}。${copy.connected}`}
          position="absolute" left="3.987%" top="4.082%" w="92.027%" h="5.102%"
          color="#9C775C" fontSize={locale === "zh" ? "5.3156cqw" : "4.65cqw"}
          fontWeight="600" lineHeight="1.25" textAlign="center" whiteSpace="nowrap"
        >
          <Text position="absolute" inset="0" animation={loop(moveTitle)} aria-hidden="true" data-route-demo-title="move">{copy.move}</Text>
          <Text position="absolute" inset="0" animation={loop(connectedTitle)} aria-hidden="true" data-route-demo-title="connected">{copy.connected}</Text>
        </Box>
        <RouteDemo />
        <Button
          ref={primaryRef} position="absolute" left="3.987%" top="85.459%" w="92.027%" h="10.459%"
          minW="0" px="0" borderRadius="6.645cqw" bg="#9C775C" color="white"
          fontSize="5.98cqw" fontWeight="400"
          _hover={{ bg: "#8B684F" }} _active={{ transform: "scale(0.98)" }}
          _focusVisible={{ outline: "2px solid #C7A86D", outlineOffset: "3px" }}
          transition="background-color 150ms, transform 150ms"
          onClick={() => { playFmodGameEvent("dialogueClick"); onClose(); }}
        >
          {copy.start}
        </Button>
      </Box>
    </Flex>
  );
}
