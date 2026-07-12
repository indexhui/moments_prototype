"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

export const DEPARTURE_TRANSITION_DURATION_MS = 2300;

type DepartureTransitionMapPoint = {
  key: string;
  visual: {
    label: string;
    iconPath: string;
  };
  positionPercent: number;
};

type DepartureTransitionUnlockCue = {
  badge: string;
  title: string;
  description: string;
};

const departureLogoFloatUp = keyframes`
  0%, 100% { transform: translateY(0px) rotate(-0.4deg); }
  18% { transform: translateY(-4px) rotate(0.2deg); }
  46% { transform: translateY(-7px) rotate(0.6deg); }
  72% { transform: translateY(-2px) rotate(-0.2deg); }
`;

const departureLogoFloatDown = keyframes`
  0%, 100% { transform: translateY(-5px) rotate(0.5deg); }
  22% { transform: translateY(-1px) rotate(-0.2deg); }
  54% { transform: translateY(3px) rotate(-0.7deg); }
  78% { transform: translateY(-3px) rotate(0.2deg); }
`;

const departureMrtPan = keyframes`
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-460px, 0, 0); }
`;

const departureMaiIconTilt = keyframes`
  0%, 100% { transform: rotate(-8deg); }
  50% { transform: rotate(10deg); }
`;

export function DepartureTransitionOverlay({
  mapPoints,
  mapStartPercent,
  mapEndPercent,
  travelProgress,
  unlockCue,
  onFinish,
}: {
  mapPoints: readonly DepartureTransitionMapPoint[];
  mapStartPercent: number;
  mapEndPercent: number;
  travelProgress?: number;
  unlockCue?: DepartureTransitionUnlockCue;
  onFinish?: () => void;
}) {
  const [localTravelProgress, setLocalTravelProgress] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const finishCalledRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  const runsIndependently = travelProgress === undefined;
  const resolvedTravelProgress = travelProgress ?? localTravelProgress;
  const maiMapLeftPercent =
    mapStartPercent + (mapEndPercent - mapStartPercent) * resolvedTravelProgress;

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    if (!runsIndependently) return;

    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / DEPARTURE_TRANSITION_DURATION_MS);
      setLocalTravelProgress(progress);
      if (progress >= 1) {
        animationFrameRef.current = null;
        if (!finishCalledRef.current) {
          finishCalledRef.current = true;
          onFinishRef.current?.();
        }
        return;
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [runsIndependently]);

  return (
    <Flex position="absolute" inset="0" zIndex={90} pointerEvents="none" overflow="hidden" bg="#F7F0E6">
      <Box
        position="absolute"
        left="-452px"
        top="-25px"
        w="2568px"
        h="723px"
        animation={`${departureMrtPan} ${DEPARTURE_TRANSITION_DURATION_MS}ms linear both`}
      >
        <img
          src="/images/loading/wake_up.jpg"
          alt=""
          aria-hidden="true"
          style={{ width: "100%", height: "100%", objectFit: "fill", display: "block" }}
        />
      </Box>

      <Flex
        position="absolute"
        right="18px"
        top="33px"
        w="126px"
        h="39px"
        align="flex-start"
        overflow="visible"
        filter="drop-shadow(0 3px 0 rgba(255,255,255,0.85))"
        aria-label="走走小日"
      >
        {[0, 1, 2, 3].map((index) => (
          <Box
            key={index}
            position="relative"
            w={index === 3 ? "28px" : "33px"}
            h="39px"
            overflow="hidden"
            animation={`${
              index % 2 === 0 ? departureLogoFloatUp : departureLogoFloatDown
            } ${index === 1 ? 1.34 : index === 2 ? 1.18 : index === 3 ? 1.42 : 1.26}s cubic-bezier(0.45, 0, 0.25, 1) infinite`}
            style={{ animationDelay: `${index * -0.18}s` }}
          >
            <img
              src="/images/logo/logo_svg.svg"
              alt=""
              aria-hidden="true"
              style={{
                position: "absolute",
                left: `${index * -33}px`,
                top: 0,
                width: "132px",
                height: "40px",
                maxWidth: "none",
              }}
            />
          </Box>
        ))}
      </Flex>

      {unlockCue ? (
        <Flex
          position="absolute"
          left="50%"
          top="92px"
          transform="translateX(-50%)"
          w="calc(100% - 44px)"
          maxW="306px"
          direction="column"
          gap="6px"
          px="14px"
          py="11px"
          borderRadius="14px"
          bg="rgba(249,244,235,0.94)"
          border="1px solid #D9B996"
          boxShadow="0 10px 20px rgba(92, 65, 42, 0.16), inset 0 1px 0 rgba(255,255,255,0.72)"
        >
          <Box position="absolute" left="11px" right="11px" top="6px" h="1px" bg="rgba(178,141,105,0.34)" />
          <Flex align="center" justify="space-between" gap="10px">
            <Flex direction="column" gap="4px" minW="0">
              <Text color="#B28D69" fontSize="10px" fontWeight="900" letterSpacing="0.12em" lineHeight="1">
                ROUTE CLUE
              </Text>
              <Text color="#6D4B1F" fontSize="15px" fontWeight="900" lineHeight="1.2">
                {unlockCue.title}
              </Text>
            </Flex>
            <Flex minW="46px" h="28px" px="9px" borderRadius="8px" align="center" justify="center" bg="#FFF0A8" border="1px solid #C3A580" color="#7F6441" transform="rotate(2deg)">
              <Text fontSize="12px" fontWeight="900" lineHeight="1">
                {unlockCue.badge}
              </Text>
            </Flex>
          </Flex>
          <Text color="#7F6441" fontSize="12px" fontWeight="700" lineHeight="1.5">
            {unlockCue.description}
          </Text>
        </Flex>
      ) : null}

      <Box position="absolute" left="50%" bottom="172px" transform="translateX(-50%)">
        <img
          src="/images/mai/walk.gif"
          alt="小麥走路"
          style={{
            height: "276px",
            width: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 6px 9px rgba(72,54,38,0.16))",
          }}
        />
      </Box>

      <Box position="absolute" left="0" right="0" bottom="0" h="156px" bg="#F9F4EB" borderTop="1px solid #D9B996" overflow="hidden">
        {mapPoints.map((point, index) => {
          const isMiddlePoint = index > 0 && index < mapPoints.length - 1;
          return (
            <Box
              key={point.key}
              position="absolute"
              left={`${point.positionPercent}%`}
              top={isMiddlePoint ? "23px" : "29px"}
              w={isMiddlePoint ? "42px" : "45px"}
              h={isMiddlePoint ? "42px" : "45px"}
              transform="translateX(-50%)"
              zIndex={2}
            >
              <Image src={point.visual.iconPath} alt={point.visual.label} w="100%" h="100%" objectFit="contain" />
            </Box>
          );
        })}
        <Box position="absolute" left="17px" right="17px" bottom="45px" h="15px" bg="#D2BA9D" border="1px solid #C3A580" borderRadius="999px" zIndex={1}>
          <Flex position="absolute" inset="0" px="9px" align="center" justify="space-between">
            {[0, 0.25, 0.5, 0.75, 1].map((point, index) => (
              <Box
                key={point}
                w={index === 0 || index === 2 || index === 4 ? "11px" : "5px"}
                h={index === 0 || index === 2 || index === 4 ? "11px" : "5px"}
                borderRadius="999px"
                bg={resolvedTravelProgress >= point ? "#FFF0A8" : "#F8E8AF"}
                border={index === 0 || index === 2 || index === 4 ? "1px solid #B28D69" : "0"}
              />
            ))}
          </Flex>
        </Box>
        <Box position="absolute" left={`${maiMapLeftPercent}%`} top="76px" w="48px" h="38px" transform="translateX(-50%)" filter="drop-shadow(0 2px 0 rgba(255,255,255,0.55))" zIndex={3}>
          <Image
            src="/images/icon/icon_mai.png"
            alt="小麥目前位置"
            w="100%"
            h="100%"
            objectFit="contain"
            animation={`${departureMaiIconTilt} 0.72s ease-in-out infinite`}
            transformOrigin="50% 80%"
          />
        </Box>
      </Box>
    </Flex>
  );
}
