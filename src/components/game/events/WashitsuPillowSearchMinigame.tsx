"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

type WashitsuPillowSearchMinigameProps = {
  onComplete: () => void;
  onSkip?: () => void;
};

type PillowId = "cream" | "leaf" | "blush" | "stripe" | "round";
type SearchPhase = "searching" | "found";

type PillowDefinition = {
  id: PillowId;
  name: string;
  reaction: string;
  left: string;
  top: string;
  width: string;
  height: string;
  rotate: number;
  exitX: number;
  exitY: number;
  color: string;
  accent: string;
  radius: string;
  pattern?: string;
};

const BACKGROUND_IMAGE = "/images/animals/seal/washitsu-search-bg.svg";
const SLEEPING_SEAL_IMAGE = "/images/animals/seal/seal_02.png";
const FOUND_SEAL_IMAGE = "/images/animals/seal/seal_01.png";

const PILLOWS: PillowDefinition[] = [
  {
    id: "cream",
    name: "米白靠枕",
    reaction: "不是這顆，下面只有幾枚零錢。",
    left: "8%",
    top: "49%",
    width: "46%",
    height: "12%",
    rotate: -13,
    exitX: -260,
    exitY: -72,
    color: "#F2E6C9",
    accent: "#BCA77E",
    radius: "24% 18% 24% 18%",
  },
  {
    id: "leaf",
    name: "草綠方枕",
    reaction: "遙控器！原來一直卡在這裡。",
    left: "48%",
    top: "51%",
    width: "43%",
    height: "12%",
    rotate: 11,
    exitX: 250,
    exitY: -54,
    color: "#AEB18A",
    accent: "#737958",
    radius: "18%",
    pattern: "radial-gradient(circle at 26% 38%, rgba(255,255,255,0.32) 0 7px, transparent 8px)",
  },
  {
    id: "blush",
    name: "粉橘長枕",
    reaction: "這裡只有一條充電線……吸頭到底在哪？",
    left: "2%",
    top: "60%",
    width: "52%",
    height: "11%",
    rotate: 8,
    exitX: -250,
    exitY: 34,
    color: "#D8AA91",
    accent: "#9E705E",
    radius: "999px",
  },
  {
    id: "stripe",
    name: "條紋靠枕",
    reaction: "怎麼還有一隻襪子？小白真是的……",
    left: "46%",
    top: "62%",
    width: "49%",
    height: "12%",
    rotate: -8,
    exitX: 258,
    exitY: 48,
    color: "#D8CFB0",
    accent: "#8C876D",
    radius: "22%",
    pattern: "repeating-linear-gradient(90deg, transparent 0 20px, rgba(112,112,84,0.18) 21px 31px)",
  },
  {
    id: "round",
    name: "圓滾滾抱枕",
    reaction: "咦？這顆枕頭下面好像還藏著什麼。",
    left: "22%",
    top: "69%",
    width: "56%",
    height: "13%",
    rotate: 3,
    exitX: 18,
    exitY: 260,
    color: "#C7B5A6",
    accent: "#887669",
    radius: "48%",
  },
];

const sealReveal = keyframes`
  0% { opacity: 0.15; transform: translateX(-50%) translateY(26px) scale(0.9); }
  72% { opacity: 1; transform: translateX(-50%) translateY(-7px) scale(1.04); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
`;

const foundBurst = keyframes`
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
  55% { opacity: 0.72; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.55); }
`;

function triggerHaptic(pattern: number | number[]) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(pattern);
}

export function WashitsuPillowSearchMinigame({
  onComplete,
  onSkip,
}: WashitsuPillowSearchMinigameProps) {
  const foundTimerRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<SearchPhase>("searching");
  const [openedIds, setOpenedIds] = useState<PillowId[]>([]);
  const [reaction, setReaction] = useState("點擊枕頭，把它們一顆一顆挖開來。");

  const openedSet = useMemo(() => new Set(openedIds), [openedIds]);
  const openedCount = openedIds.length;

  useEffect(
    () => () => {
      if (foundTimerRef.current !== null) {
        window.clearTimeout(foundTimerRef.current);
      }
    },
    [],
  );

  const handlePillowClick = useCallback(
    (pillow: PillowDefinition) => {
      if (phase !== "searching" || openedSet.has(pillow.id)) return;
      const nextOpenedIds = [...openedIds, pillow.id];
      setOpenedIds(nextOpenedIds);
      triggerHaptic(12);

      if (nextOpenedIds.length === PILLOWS.length) {
        setReaction("等等……這坨枕頭怎麼會呼吸？");
        foundTimerRef.current = window.setTimeout(() => {
          setPhase("found");
          setReaction("這不是枕頭是海豹");
          triggerHaptic([18, 34, 56]);
          foundTimerRef.current = null;
        }, 520);
        return;
      }

      if (nextOpenedIds.length === PILLOWS.length - 1) {
        setReaction("奇怪，最後這一堆怎麼還在動……？");
        return;
      }

      setReaction(pillow.reaction);
    },
    [openedIds, openedSet, phase],
  );

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={72}
      overflow="hidden"
      bgColor="#E8DEC9"
      userSelect="none"
      touchAction="manipulation"
      data-washitsu-pillow-search
      data-phase={phase}
      data-opened-count={openedCount}
    >
      <Image
        src={BACKGROUND_IMAGE}
        alt=""
        position="absolute"
        inset="0"
        w="100%"
        h="100%"
        maxW="none"
        objectFit="cover"
        pointerEvents="none"
      />

      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(180deg, rgba(71,54,39,0.18) 0%, transparent 22%, transparent 72%, rgba(48,39,32,0.14) 100%)"
        pointerEvents="none"
      />

      <Flex
        position="absolute"
        top="22px"
        left="20px"
        right="20px"
        zIndex={20}
        alignItems="flex-start"
        justifyContent="space-between"
        pointerEvents="none"
      >
        <Flex
          direction="column"
          gap="4px"
          px="15px"
          py="11px"
          borderRadius="16px"
          bgColor="rgba(255,250,239,0.92)"
          border="1px solid rgba(112,88,62,0.22)"
          boxShadow="0 10px 24px rgba(70,52,39,0.16)"
        >
          <Text color="#624C39" fontSize="18px" fontWeight="900" lineHeight="1.2">
            小和室尋物
          </Text>
          <Text color="#846B55" fontSize="12px" fontWeight="800">
            已翻開 {openedCount}／{PILLOWS.length}
          </Text>
        </Flex>

        {onSkip ? (
          <Flex
            as="button"
            pointerEvents="auto"
            h="38px"
            px="15px"
            borderRadius="999px"
            alignItems="center"
            justifyContent="center"
            bgColor="rgba(74,59,45,0.72)"
            color="white"
            fontSize="13px"
            fontWeight="900"
            onClick={onSkip}
          >
            略過
          </Flex>
        ) : null}
      </Flex>

      <Image
        src={phase === "found" ? FOUND_SEAL_IMAGE : SLEEPING_SEAL_IMAGE}
        alt={phase === "found" ? "從枕頭堆裡冒出的胖海豹" : "被枕頭堆蓋住的胖海豹"}
        position="absolute"
        left="50%"
        top="57%"
        zIndex={6}
        w={phase === "found" ? "88%" : "82%"}
        maxW="none"
        opacity={1}
        pointerEvents="none"
        filter="drop-shadow(0 16px 15px rgba(76,59,43,0.24))"
        transform="translateX(-50%)"
        animation={
          phase === "found"
            ? `${sealReveal} 620ms cubic-bezier(0.18, 0.82, 0.2, 1) both`
            : undefined
        }
      />

      {phase === "found" ? (
        <Box
          position="absolute"
          left="50%"
          top="66%"
          zIndex={5}
          w="320px"
          h="320px"
          borderRadius="999px"
          border="10px solid rgba(255,245,190,0.84)"
          boxShadow="0 0 52px rgba(255,239,164,0.72)"
          pointerEvents="none"
          animation={`${foundBurst} 920ms ease-out both`}
        />
      ) : null}

      {PILLOWS.map((pillow, index) => {
        const isOpened = openedSet.has(pillow.id);
        return (
          <Box
            key={pillow.id}
            as="button"
            aria-label={`翻開${pillow.name}`}
            data-pillow-id={pillow.id}
            data-opened={isOpened ? "true" : "false"}
            position="absolute"
            left={pillow.left}
            top={pillow.top}
            zIndex={10 + index}
            w={pillow.width}
            h={pillow.height}
            borderRadius={pillow.radius}
            bgColor={pillow.color}
            backgroundImage={pillow.pattern}
            border={`4px solid ${pillow.accent}`}
            boxShadow="0 13px 18px rgba(70,51,37,0.24), inset 0 7px 0 rgba(255,255,255,0.2)"
            cursor={isOpened ? "default" : "pointer"}
            pointerEvents={isOpened ? "none" : "auto"}
            transform={
              isOpened
                ? `translate(${pillow.exitX}px, ${pillow.exitY}px) rotate(${pillow.rotate * 2}deg) scale(0.72)`
                : `rotate(${pillow.rotate}deg)`
            }
            opacity={isOpened ? 0 : 1}
            transition="transform 460ms cubic-bezier(0.22, 0.78, 0.2, 1), opacity 360ms ease"
            onClick={(event) => {
              event.currentTarget.blur();
              handlePillowClick(pillow);
            }}
          >
            <Box
              position="absolute"
              inset="12%"
              borderRadius="inherit"
              border="2px dashed rgba(90,70,53,0.22)"
              pointerEvents="none"
            />
          </Box>
        );
      })}

      <Flex
        position="absolute"
        left="18px"
        right="18px"
        bottom={phase === "found" ? "92px" : "28px"}
        zIndex={24}
        minH="64px"
        px="18px"
        py="13px"
        borderRadius="18px"
        alignItems="center"
        justifyContent="center"
        bgColor="rgba(255,250,239,0.95)"
        border="1px solid rgba(112,88,62,0.24)"
        boxShadow="0 13px 30px rgba(65,48,34,0.2)"
        transition="bottom 280ms ease"
        pointerEvents="none"
      >
        <Text color="#624C39" fontSize="15px" fontWeight="900" lineHeight="1.55" textAlign="center">
          {reaction}
        </Text>
      </Flex>

      {phase === "found" ? (
        <Flex
          as="button"
          aria-label="準備拍下海豹"
          position="absolute"
          left="22px"
          right="22px"
          bottom="26px"
          zIndex={25}
          h="52px"
          borderRadius="999px"
          alignItems="center"
          justifyContent="center"
          bgColor="#8F6D50"
          color="white"
          fontSize="16px"
          fontWeight="900"
          boxShadow="0 12px 24px rgba(70,48,31,0.28)"
          onClick={onComplete}
        >
          趁現在拍下牠
        </Flex>
      ) : null}
    </Flex>
  );
}
