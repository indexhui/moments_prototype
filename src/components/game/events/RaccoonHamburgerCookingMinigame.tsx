"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

type CookingPhase = "grill" | "sauce" | "assemble" | "complete";
type BurgerLayerId =
  | "bottom-bun"
  | "lettuce"
  | "tomato"
  | "sauce"
  | "patty"
  | "top-bun";

type BurgerLayerDefinition = {
  id: BurgerLayerId;
  name: string;
  shortName: string;
  color: string;
};

const BURGER_ORDER: BurgerLayerDefinition[] = [
  {
    id: "bottom-bun",
    name: "底層麵包",
    shortName: "底層麵包",
    color: "#E7A84F",
  },
  {
    id: "lettuce",
    name: "爽脆生菜",
    shortName: "生菜",
    color: "#79A94F",
  },
  {
    id: "tomato",
    name: "番茄切片",
    shortName: "番茄",
    color: "#D85B4D",
  },
  {
    id: "sauce",
    name: "特製醬料",
    shortName: "醬料",
    color: "#F5D36B",
  },
  {
    id: "patty",
    name: "漢堡排",
    shortName: "漢堡排",
    color: "#704534",
  },
  {
    id: "top-bun",
    name: "上層麵包",
    shortName: "上層麵包",
    color: "#E7A84F",
  },
];

const ASSEMBLY_TRAY_ORDER: BurgerLayerId[] = [
  "patty",
  "lettuce",
  "top-bun",
  "tomato",
  "bottom-bun",
  "sauce",
];

const sauceTargetStart = 24;
const sauceTargetEnd = 76;

const floatSteam = keyframes`
  0% { opacity: 0; transform: translateY(8px) scale(0.92); }
  42% { opacity: 0.72; }
  100% { opacity: 0; transform: translateY(-30px) scale(1.08); }
`;

const pattySizzle = keyframes`
  0%, 100% { transform: translate(-50%, -50%) rotate(-1deg) scale(1); }
  50% { transform: translate(-50%, -50%) rotate(1deg) scale(1.015); }
`;

const layerPop = keyframes`
  from { opacity: 0; transform: translateY(-16px) scale(0.88); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const successBounce = keyframes`
  0% { transform: translateY(8px) scale(0.9); opacity: 0; }
  64% { transform: translateY(-7px) scale(1.04); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
`;

function triggerHaptic(pattern: number | number[]) {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    navigator.vibrate(pattern);
  }
}

function BurgerLayer({
  layerId,
  compact = false,
}: {
  layerId: BurgerLayerId;
  compact?: boolean;
}) {
  const commonProps = {
    position: "relative" as const,
    w: compact ? "102px" : "168px",
    mx: "auto",
    flexShrink: 0,
    boxShadow: compact
      ? "0 3px 5px rgba(75,43,26,0.17)"
      : "0 5px 8px rgba(75,43,26,0.18)",
  };

  if (layerId === "bottom-bun") {
    return (
      <Box
        {...commonProps}
        h={compact ? "18px" : "27px"}
        borderRadius="5px 5px 18px 18px"
        bg="linear-gradient(180deg, #F0BB63 0%, #D9903C 100%)"
        border="2px solid #B87535"
      />
    );
  }

  if (layerId === "top-bun") {
    return (
      <Box
        {...commonProps}
        h={compact ? "34px" : "51px"}
        borderRadius="999px 999px 8px 8px"
        bg="linear-gradient(180deg, #F5C66E 0%, #DC963E 100%)"
        border="2px solid #B87535"
      >
        {[24, 43, 62, 76].map((left, index) => (
          <Box
            key={left}
            position="absolute"
            left={`${left}%`}
            top={index % 2 === 0 ? "25%" : "45%"}
            w={compact ? "3px" : "5px"}
            h={compact ? "2px" : "3px"}
            borderRadius="999px"
            bgColor="#FFF0B5"
            transform="rotate(-20deg)"
          />
        ))}
      </Box>
    );
  }

  if (layerId === "lettuce") {
    return (
      <Box
        {...commonProps}
        w={compact ? "108px" : "180px"}
        h={compact ? "14px" : "20px"}
        borderRadius="45% 55% 48% 52%"
        bg="linear-gradient(180deg, #9AC766 0%, #66993F 100%)"
        border="2px solid #568436"
        transform="rotate(-1deg)"
      />
    );
  }

  if (layerId === "tomato") {
    return (
      <Box
        {...commonProps}
        w={compact ? "96px" : "158px"}
        h={compact ? "13px" : "19px"}
        borderRadius="999px"
        bg="linear-gradient(180deg, #F07160 0%, #BE4037 100%)"
        border="2px solid #A93431"
      />
    );
  }

  if (layerId === "sauce") {
    return (
      <Box
        {...commonProps}
        w={compact ? "90px" : "148px"}
        h={compact ? "9px" : "13px"}
        borderRadius="999px"
        bg="linear-gradient(90deg, #F2C95A 0%, #FFF0A2 48%, #E9B945 100%)"
        border="1px solid #D4A538"
      />
    );
  }

  return (
    <Box
      {...commonProps}
      w={compact ? "99px" : "164px"}
      h={compact ? "24px" : "35px"}
      borderRadius="42% 46% 40% 44%"
      bg="linear-gradient(180deg, #865640 0%, #563326 100%)"
      border="2px solid #43271E"
    />
  );
}

function CookingHeader({
  phase,
  onSkip,
}: {
  phase: CookingPhase;
  onSkip?: () => void;
}) {
  const step =
    phase === "grill" ? 1 : phase === "sauce" ? 2 : phase === "assemble" ? 3 : 3;

  return (
    <Flex
      w="100%"
      alignItems="flex-start"
      justifyContent="space-between"
      gap="12px"
    >
      <Flex
        direction="column"
        gap="7px"
        px="15px"
        py="11px"
        borderRadius="18px"
        bgColor="rgba(255,251,241,0.94)"
        border="1px solid rgba(116,74,43,0.2)"
        boxShadow="0 10px 26px rgba(93,57,34,0.14)"
      >
        <Text color="#6D432D" fontSize="18px" fontWeight="900" lineHeight="1.1">
          在家做漢堡
        </Text>
        <Flex gap="6px" alignItems="center">
          {[1, 2, 3].map((item) => (
            <Box
              key={item}
              w={item === step ? "24px" : "8px"}
              h="8px"
              borderRadius="999px"
              bgColor={item <= step ? "#D97745" : "#D9C9B6"}
              transition="all 240ms ease"
            />
          ))}
          <Text ml="2px" color="#94735E" fontSize="11px" fontWeight="900">
            {step}／3
          </Text>
        </Flex>
      </Flex>

      {onSkip ? (
        <Flex
          as="button"
          aria-label="略過漢堡料理遊戲"
          h="38px"
          px="15px"
          flexShrink={0}
          borderRadius="999px"
          alignItems="center"
          justifyContent="center"
          bgColor="rgba(86,61,45,0.76)"
          color="white"
          fontSize="13px"
          fontWeight="900"
          onClick={onSkip}
        >
          略過
        </Flex>
      ) : null}
    </Flex>
  );
}

function ActionButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Flex
      as="button"
      aria-label={label}
      w="100%"
      h="54px"
      flexShrink={0}
      borderRadius="999px"
      alignItems="center"
      justifyContent="center"
      bgColor={disabled ? "#C8B9AA" : "#C9653B"}
      color="white"
      fontSize="17px"
      fontWeight="900"
      letterSpacing="0.04em"
      boxShadow={
        disabled
          ? "none"
          : "0 11px 22px rgba(153,75,41,0.25), inset 0 -3px 0 rgba(108,47,27,0.18)"
      }
      cursor={disabled ? "default" : "pointer"}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) onClick();
      }}
    >
      {label}
    </Flex>
  );
}

export function RaccoonHamburgerCookingMinigame({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip?: () => void;
}) {
  const phaseTimerRef = useRef<number | null>(null);
  const sauceDirectionRef = useRef<1 | -1>(1);
  const [phase, setPhase] = useState<CookingPhase>("grill");
  const [grillSide, setGrillSide] = useState<1 | 2>(1);
  const [isGrilling, setIsGrilling] = useState(false);
  const [doneness, setDoneness] = useState(0);
  const [saucePosition, setSaucePosition] = useState(10);
  const [sauceDots, setSauceDots] = useState<number[]>([]);
  const [assembledLayers, setAssembledLayers] = useState<BurgerLayerId[]>([]);
  const [feedback, setFeedback] = useState(
    "先把第一面煎到金黃區，再按下翻面。",
  );

  const assembledSet = useMemo(
    () => new Set(assembledLayers),
    [assembledLayers],
  );

  useEffect(
    () => () => {
      if (phaseTimerRef.current !== null) {
        window.clearTimeout(phaseTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (phase !== "grill" || !isGrilling) return;
    const timerId = window.setInterval(() => {
      setDoneness((value) => Math.min(100, value + 0.8));
    }, 80);
    return () => window.clearInterval(timerId);
  }, [isGrilling, phase]);

  useEffect(() => {
    if (phase !== "grill" || !isGrilling || doneness < 96) return;
    setIsGrilling(false);
    setDoneness(0);
    setFeedback("糟糕，漢堡排焦掉了！換一塊再試一次。");
    triggerHaptic([38, 30, 38]);
  }, [doneness, isGrilling, phase]);

  useEffect(() => {
    if (phase !== "sauce") return;
    const timerId = window.setInterval(() => {
      setSaucePosition((value) => {
        let next = value + sauceDirectionRef.current * 1.05;
        if (next >= 92) {
          next = 92;
          sauceDirectionRef.current = -1;
        } else if (next <= 8) {
          next = 8;
          sauceDirectionRef.current = 1;
        }
        return next;
      });
    }, 32);
    return () => window.clearInterval(timerId);
  }, [phase]);

  const handleGrillAction = useCallback(() => {
    if (!isGrilling) {
      setDoneness(0);
      setIsGrilling(true);
      setFeedback(
        grillSide === 1
          ? "注意熟度，指針進入金黃區就翻面！"
          : "第二面也要剛剛好，別讓它烤焦了！",
      );
      return;
    }

    if (doneness < 54) {
      setIsGrilling(false);
      setDoneness(0);
      setFeedback("裡面還是生的，再多煎一下才行。");
      triggerHaptic(28);
      return;
    }

    if (doneness > 82) {
      setIsGrilling(false);
      setDoneness(0);
      setFeedback("表面太焦了！換一塊重新掌握火候。");
      triggerHaptic([32, 22, 32]);
      return;
    }

    setIsGrilling(false);
    setDoneness(0);
    triggerHaptic([14, 24, 38]);

    if (grillSide === 1) {
      setGrillSide(2);
      setFeedback("第一面金黃酥香！翻面，再完成第二面。");
      return;
    }

    setPhase("sauce");
    setFeedback("肉排完成！趁噴嘴對準漢堡時，精準擠三道醬。");
  }, [doneness, grillSide, isGrilling]);

  const handleSauceAction = useCallback(() => {
    if (phase !== "sauce" || phaseTimerRef.current !== null) return;

    if (
      saucePosition < sauceTargetStart ||
      saucePosition > sauceTargetEnd
    ) {
      setSauceDots([]);
      setFeedback("醬汁滴到漢堡外面了！擦乾淨，重新擠三道。");
      triggerHaptic([34, 20, 34]);
      return;
    }

    const nextDots = [...sauceDots, saucePosition];
    setSauceDots(nextDots);
    triggerHaptic(12);

    if (nextDots.length < 3) {
      setFeedback(`漂亮！再擠 ${3 - nextDots.length} 道醬。`);
      return;
    }

    setFeedback("三道醬都留在漢堡裡，完成！");
    triggerHaptic([14, 24, 42]);
    phaseTimerRef.current = window.setTimeout(() => {
      setPhase("assemble");
      setFeedback("從底層麵包開始，依正確順序把漢堡疊起來。");
      phaseTimerRef.current = null;
    }, 520);
  }, [phase, sauceDots, saucePosition]);

  const handleLayerAction = useCallback(
    (layerId: BurgerLayerId) => {
      if (phase !== "assemble" || assembledSet.has(layerId)) return;
      const expectedLayer = BURGER_ORDER[assembledLayers.length];

      if (expectedLayer.id !== layerId) {
        setFeedback(`順序不對喔！下一層應該放「${expectedLayer.name}」。`);
        triggerHaptic(24);
        return;
      }

      const nextLayers = [...assembledLayers, layerId];
      setAssembledLayers(nextLayers);
      triggerHaptic(12);

      if (nextLayers.length < BURGER_ORDER.length) {
        setFeedback(
          `放好了！下一層是「${BURGER_ORDER[nextLayers.length].name}」。`,
        );
        return;
      }

      setFeedback("漢堡完成！把它裝好，準備去公園找浣熊。");
      triggerHaptic([16, 24, 48]);
      phaseTimerRef.current = window.setTimeout(() => {
        setPhase("complete");
        phaseTimerRef.current = null;
      }, 480);
    },
    [assembledLayers, assembledSet, phase],
  );

  const grillButtonLabel = !isGrilling
    ? grillSide === 1
      ? "開始煎第一面"
      : "開始煎第二面"
    : grillSide === 1
      ? "現在翻面！"
      : "現在起鍋！";

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={72}
      direction="column"
      overflow="hidden"
      px="18px"
      pt="20px"
      pb="24px"
      bg="linear-gradient(180deg, #F7E8D0 0%, #F0D6B7 100%)"
      userSelect="none"
      touchAction="manipulation"
      data-raccoon-hamburger-game
      data-phase={phase}
      data-grill-side={grillSide}
      data-doneness={Math.round(doneness)}
      data-sauce-position={Math.round(saucePosition)}
      data-sauce-count={sauceDots.length}
      data-layer-count={assembledLayers.length}
    >
      <Box
        position="absolute"
        inset="0"
        opacity={0.24}
        backgroundImage="linear-gradient(rgba(139,96,61,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(139,96,61,0.13) 1px, transparent 1px)"
        backgroundSize="36px 36px"
        pointerEvents="none"
      />

      <Box position="relative" zIndex={2}>
        <CookingHeader phase={phase} onSkip={onSkip} />
      </Box>

      <Flex
        position="relative"
        zIndex={2}
        flex="1"
        minH={0}
        direction="column"
        alignItems="center"
        justifyContent="center"
        py="14px"
      >
        {phase === "grill" ? (
          <Flex
            w="100%"
            h="100%"
            maxH="650px"
            direction="column"
            alignItems="center"
            gap="12px"
          >
            <Flex
              direction="column"
              alignItems="center"
              gap="2px"
              flexShrink={0}
            >
              <Text color="#71462F" fontSize="19px" fontWeight="900">
                烤漢堡排・第 {grillSide} 面
              </Text>
              <Text color="#96715B" fontSize="12px" fontWeight="800">
                指針停在金黃色區域才不會烤焦
              </Text>
            </Flex>

            <Flex
              position="relative"
              flex="1"
              minH="220px"
              w="100%"
              alignItems="center"
              justifyContent="center"
            >
              <Box
                position="absolute"
                left="50%"
                top="50%"
                w="238px"
                h="238px"
                borderRadius="999px"
                bg="radial-gradient(circle at 42% 38%, #51545A 0%, #24272C 64%, #15171A 100%)"
                border="9px solid #383B40"
                boxShadow="0 24px 34px rgba(77,48,31,0.28), inset 0 0 0 5px rgba(255,255,255,0.05)"
                transform="translate(-50%, -50%)"
              >
                <Box
                  position="absolute"
                  left="100%"
                  top="45%"
                  w="96px"
                  h="29px"
                  borderRadius="0 999px 999px 0"
                  bg="linear-gradient(180deg, #4C4C4D 0%, #252527 100%)"
                  border="4px solid #303033"
                  transform="rotate(12deg)"
                  transformOrigin="left center"
                />

                {isGrilling
                  ? [33, 50, 67].map((left, index) => (
                      <Text
                        key={left}
                        position="absolute"
                        left={`${left}%`}
                        top="14%"
                        color="rgba(255,255,255,0.78)"
                        fontSize="29px"
                        lineHeight="1"
                        animation={`${floatSteam} 1.3s ease-out ${index * 180}ms infinite`}
                      >
                        〰
                      </Text>
                    ))
                  : null}

                <Box
                  position="absolute"
                  left="50%"
                  top="53%"
                  w="142px"
                  h="126px"
                  borderRadius="46% 50% 43% 48%"
                  bg={`linear-gradient(145deg, hsl(${28 - doneness * 0.1} 40% ${Math.max(
                    24,
                    56 - doneness * 0.28,
                  )}%) 0%, hsl(22 41% ${Math.max(
                    18,
                    40 - doneness * 0.19,
                  )}%) 100%)`}
                  border="5px solid rgba(61,33,24,0.62)"
                  boxShadow="0 13px 18px rgba(0,0,0,0.32), inset 0 8px 0 rgba(255,255,255,0.1)"
                  transform="translate(-50%, -50%)"
                  animation={
                    isGrilling ? `${pattySizzle} 170ms ease-in-out infinite` : undefined
                  }
                >
                  {[24, 43, 62].map((top) => (
                    <Box
                      key={top}
                      position="absolute"
                      left="19%"
                      right="19%"
                      top={`${top}%`}
                      h="3px"
                      borderRadius="999px"
                      bgColor="rgba(53,29,22,0.35)"
                      transform="rotate(-14deg)"
                    />
                  ))}
                </Box>
              </Box>
            </Flex>

            <Box w="100%" flexShrink={0}>
              <Flex mb="5px" justifyContent="space-between">
                <Text color="#9B765F" fontSize="11px" fontWeight="900">
                  生
                </Text>
                <Text color="#A46728" fontSize="11px" fontWeight="900">
                  金黃
                </Text>
                <Text color="#6B4033" fontSize="11px" fontWeight="900">
                  焦
                </Text>
              </Flex>
              <Box
                position="relative"
                h="18px"
                overflow="hidden"
                borderRadius="999px"
                bg="linear-gradient(90deg, #E8A38B 0% 53%, #E8B953 54% 82%, #664134 83% 100%)"
                border="3px solid rgba(99,65,46,0.2)"
              >
                <Box
                  position="absolute"
                  left={`calc(${doneness}% - 3px)`}
                  top="-4px"
                  w="7px"
                  h="22px"
                  borderRadius="999px"
                  bgColor="#FFFDF2"
                  boxShadow="0 0 0 2px #754731, 0 2px 5px rgba(0,0,0,0.28)"
                  transition="left 60ms linear"
                />
              </Box>
            </Box>

            <Flex
              minH="48px"
              px="14px"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Text
                color="#6F4A37"
                fontSize="14px"
                fontWeight="900"
                lineHeight="1.45"
                textAlign="center"
              >
                {feedback}
              </Text>
            </Flex>

            <ActionButton label={grillButtonLabel} onClick={handleGrillAction} />
          </Flex>
        ) : null}

        {phase === "sauce" ? (
          <Flex
            w="100%"
            h="100%"
            maxH="650px"
            direction="column"
            alignItems="center"
            gap="12px"
          >
            <Flex
              direction="column"
              alignItems="center"
              gap="2px"
              flexShrink={0}
            >
              <Text color="#71462F" fontSize="19px" fontWeight="900">
                精準擠醬
              </Text>
              <Text color="#96715B" fontSize="12px" fontWeight="800">
                對準肉排，連續成功三次
              </Text>
            </Flex>

            <Flex
              position="relative"
              flex="1"
              minH="245px"
              w="100%"
              alignItems="center"
              justifyContent="center"
            >
              <Box
                position="absolute"
                left="7%"
                right="7%"
                top="42px"
                h="7px"
                borderRadius="999px"
                bgColor="rgba(117,75,48,0.2)"
              >
                <Box
                  position="absolute"
                  left={`${saucePosition}%`}
                  top="-37px"
                  w="36px"
                  h="60px"
                  borderRadius="9px 9px 15px 15px"
                  bg="linear-gradient(90deg, #E8C44F 0%, #FFE57E 55%, #D6AA32 100%)"
                  border="3px solid #A9852E"
                  boxShadow="0 8px 12px rgba(91,59,35,0.2)"
                  transform="translateX(-50%)"
                >
                  <Box
                    position="absolute"
                    left="50%"
                    top="100%"
                    w="9px"
                    h="18px"
                    borderRadius="0 0 8px 8px"
                    bgColor="#F5D55C"
                    border="2px solid #A9852E"
                    borderTop="0"
                    transform="translateX(-50%)"
                  />
                </Box>
              </Box>

              <Box
                position="absolute"
                left="50%"
                top="60%"
                w="276px"
                h="196px"
                borderRadius="45%"
                bg="radial-gradient(ellipse at center, #86563D 0% 54%, #5B3429 55% 62%, #E3B45C 63% 70%, #C88739 71% 100%)"
                border="5px solid rgba(112,69,38,0.35)"
                boxShadow="0 22px 30px rgba(92,55,32,0.22)"
                transform="translate(-50%, -50%)"
              >
                <Box
                  position="absolute"
                  left={`${sauceTargetStart}%`}
                  right={`${100 - sauceTargetEnd}%`}
                  top="11%"
                  bottom="11%"
                  borderRadius="45%"
                  border="3px dashed rgba(255,240,164,0.7)"
                  bgColor="rgba(255,230,126,0.08)"
                />
                {sauceDots.map((left, index) => (
                  <Box
                    key={`${left}-${index}`}
                    position="absolute"
                    left={`${left}%`}
                    top={`${34 + index * 15}%`}
                    w="36px"
                    h="13px"
                    borderRadius="999px"
                    bg="linear-gradient(180deg, #FFE87C 0%, #E4B43C 100%)"
                    border="2px solid rgba(135,95,28,0.55)"
                    boxShadow="0 3px 4px rgba(61,36,23,0.24)"
                    transform="translate(-50%, -50%) rotate(-8deg)"
                    animation={`${layerPop} 180ms ease-out both`}
                  />
                ))}
              </Box>

              <Flex
                position="absolute"
                bottom="8px"
                gap="8px"
                alignItems="center"
              >
                {[0, 1, 2].map((index) => (
                  <Box
                    key={index}
                    w="12px"
                    h="12px"
                    borderRadius="999px"
                    bgColor={index < sauceDots.length ? "#D3A337" : "#DDCBB4"}
                    border="2px solid rgba(111,74,48,0.2)"
                  />
                ))}
              </Flex>
            </Flex>

            <Flex
              minH="48px"
              px="14px"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Text
                color="#6F4A37"
                fontSize="14px"
                fontWeight="900"
                lineHeight="1.45"
                textAlign="center"
              >
                {feedback}
              </Text>
            </Flex>

            <ActionButton
              label={`擠醬（${sauceDots.length}／3）`}
              onClick={handleSauceAction}
              disabled={phaseTimerRef.current !== null}
            />
          </Flex>
        ) : null}

        {phase === "assemble" ? (
          <Flex
            w="100%"
            h="100%"
            maxH="650px"
            direction="column"
            alignItems="center"
            gap="10px"
          >
            <Flex
              direction="column"
              alignItems="center"
              gap="2px"
              flexShrink={0}
            >
              <Text color="#71462F" fontSize="19px" fontWeight="900">
                依序組裝
              </Text>
              <Text color="#96715B" fontSize="12px" fontWeight="800">
                從最底層開始點選食材
              </Text>
            </Flex>

            <Flex
              flex="1"
              minH="175px"
              w="100%"
              direction="column"
              alignItems="center"
              justifyContent="flex-end"
              pb="12px"
            >
              <Flex
                minH="139px"
                direction="column-reverse"
                alignItems="center"
                justifyContent="flex-start"
                gap="0"
              >
                {assembledLayers.map((layerId) => (
                  <Box
                    key={layerId}
                    mt="-1px"
                    animation={`${layerPop} 210ms cubic-bezier(0.2, 0.82, 0.2, 1) both`}
                  >
                    <BurgerLayer layerId={layerId} />
                  </Box>
                ))}
              </Flex>
              <Box
                w="232px"
                h="17px"
                mt="-1px"
                borderRadius="50%"
                bg="linear-gradient(180deg, #E7D2B3 0%, #C9A87E 100%)"
                border="2px solid #AA8663"
                boxShadow="0 10px 16px rgba(86,54,34,0.2)"
              />
            </Flex>

            <Grid
              w="100%"
              templateColumns="repeat(3, minmax(0, 1fr))"
              gap="8px"
              flexShrink={0}
            >
              {ASSEMBLY_TRAY_ORDER.map((layerId) => {
                const layer = BURGER_ORDER.find((item) => item.id === layerId)!;
                const isUsed = assembledSet.has(layerId);
                return (
                  <Flex
                    key={layerId}
                    as="button"
                    aria-label={`放上${layer.name}`}
                    h="58px"
                    px="5px"
                    direction="column"
                    gap="5px"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="14px"
                    bgColor={isUsed ? "rgba(204,190,173,0.55)" : "#FFFAED"}
                    border={`2px solid ${
                      isUsed ? "rgba(139,111,87,0.18)" : layer.color
                    }`}
                    color={isUsed ? "#A89684" : "#714833"}
                    boxShadow={
                      isUsed ? "none" : "0 6px 12px rgba(94,59,35,0.11)"
                    }
                    opacity={isUsed ? 0.55 : 1}
                    aria-disabled={isUsed}
                    onClick={() => {
                      if (!isUsed) handleLayerAction(layerId);
                    }}
                  >
                    <Box
                      w="50px"
                      h="10px"
                      borderRadius={
                        layerId.includes("bun") ? "999px 999px 5px 5px" : "999px"
                      }
                      bgColor={layer.color}
                      border="1px solid rgba(82,51,35,0.22)"
                    />
                    <Text fontSize="11px" fontWeight="900" lineHeight="1">
                      {layer.shortName}
                    </Text>
                  </Flex>
                );
              })}
            </Grid>

            <Flex
              minH="48px"
              px="12px"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Text
                color="#6F4A37"
                fontSize="13px"
                fontWeight="900"
                lineHeight="1.42"
                textAlign="center"
              >
                {feedback}
              </Text>
            </Flex>
          </Flex>
        ) : null}

        {phase === "complete" ? (
          <Flex
            w="100%"
            h="100%"
            maxH="650px"
            direction="column"
            alignItems="center"
            justifyContent="center"
            gap="20px"
            animation={`${successBounce} 520ms cubic-bezier(0.18, 0.82, 0.2, 1) both`}
          >
            <Flex direction="column" alignItems="center" gap="5px">
              <Text color="#71462F" fontSize="27px" fontWeight="900">
                漢堡完成！
              </Text>
              <Text color="#96715B" fontSize="14px" fontWeight="800">
                香噴噴的誘餌準備好了
              </Text>
            </Flex>

            <Flex
              position="relative"
              w="286px"
              h="285px"
              direction="column-reverse"
              alignItems="center"
              justifyContent="center"
              borderRadius="50%"
              bg="radial-gradient(circle, rgba(255,244,184,0.95) 0%, rgba(255,221,128,0.4) 54%, transparent 72%)"
            >
              {BURGER_ORDER.map((layer) => (
                <Box key={layer.id} mt="-1px">
                  <BurgerLayer layerId={layer.id} />
                </Box>
              ))}
              {["✦", "✧", "✦"].map((sparkle, index) => (
                <Text
                  key={`${sparkle}-${index}`}
                  position="absolute"
                  left={index === 0 ? "11%" : index === 1 ? "80%" : "17%"}
                  top={index === 0 ? "24%" : index === 1 ? "38%" : "67%"}
                  color="#E6A730"
                  fontSize={index === 1 ? "28px" : "22px"}
                  fontWeight="900"
                >
                  {sparkle}
                </Text>
              ))}
            </Flex>

            <Text
              maxW="290px"
              color="#6F4A37"
              fontSize="15px"
              fontWeight="900"
              lineHeight="1.55"
              textAlign="center"
            >
              烤得剛好、醬料也沒有漏出去，快帶去公園找浣熊吧！
            </Text>

            <ActionButton
              label="帶上漢堡，準備出發"
              onClick={onComplete}
            />
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  );
}
