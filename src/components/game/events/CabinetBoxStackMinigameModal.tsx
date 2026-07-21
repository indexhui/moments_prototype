"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiRefreshCw } from "react-icons/fi";

type BoxDefinition = {
  id: string;
  label: string;
  code: string;
  category: string;
  color: string;
  topColor: string;
  sideColor: string;
  edgeColor: string;
  tapeColor: string;
};

type MoveAxis = "x" | "z";
type TowerPhase = "preparing" | "moving" | "placing" | "miss" | "game-over" | "success";

type TowerBlock = {
  id: string;
  definition: BoxDefinition;
  width: number;
  depth: number;
  x: number;
  z: number;
  level: number;
  isBase?: boolean;
};

type ActiveTowerBlock = TowerBlock & {
  axis: MoveAxis;
  definitionIndex: number;
};

type FallingPiece = TowerBlock & {
  direction: -1 | 1;
};

type PlacementEffect = {
  id: number;
  blockId: string;
  x: number;
  z: number;
  level: number;
  perfect: boolean;
};

type StageSize = { width: number; height: number };

const BOX_HEIGHT = 46;
const BASE_HEIGHT = 20;
const START_WIDTH = 154;
const START_DEPTH = 72;
const DEPTH_X_FACTOR = 0.5;
const DEPTH_Y_FACTOR = 0.28;
const PASS_LAYER_COUNT = 7;
const TWO_STAR_LAYER_COUNT = 10;
const THREE_STAR_LAYER_COUNT = 14;
const SPEED_STEP_PER_LAYER = 0.18;
const PERFECT_TOLERANCE = 6;
const FAILURE_OVERLAP_EPSILON = 0.5;
const TUTORIAL_KEY = "moment:cabinet-tower-blocks-tutorial-v3";

const BOXES: BoxDefinition[] = [
  {
    id: "archive-a",
    label: "專案資料 A",
    code: "PRJ-A",
    category: "PROJECT FILE",
    color: "#C99A61",
    topColor: "#E5BD83",
    sideColor: "#9A6B3E",
    edgeColor: "#765236",
    tapeColor: "#4F7780",
  },
  {
    id: "archive-b",
    label: "專案資料 B",
    code: "PRJ-B",
    category: "PROJECT FILE",
    color: "#D2A369",
    topColor: "#EDC78E",
    sideColor: "#A27648",
    edgeColor: "#79583A",
    tapeColor: "#68805A",
  },
  {
    id: "receipts",
    label: "收據備份",
    code: "ACC-24",
    category: "ACCOUNTING",
    color: "#BF9168",
    topColor: "#DDB58F",
    sideColor: "#8E6349",
    edgeColor: "#704D3A",
    tapeColor: "#9A5B52",
  },
  {
    id: "meeting",
    label: "會議附件",
    code: "MTG-07",
    category: "MEETING DOCS",
    color: "#CDA273",
    topColor: "#E7C294",
    sideColor: "#987046",
    edgeColor: "#73563C",
    tapeColor: "#596F8C",
  },
  {
    id: "samples",
    label: "樣品小物",
    code: "SMP-12",
    category: "OFFICE SAMPLE",
    color: "#BF9778",
    topColor: "#DBB79C",
    sideColor: "#8B6650",
    edgeColor: "#6F5040",
    tapeColor: "#87658A",
  },
  {
    id: "stationery",
    label: "備用文具",
    code: "ST-03",
    category: "STATIONERY",
    color: "#D2A368",
    topColor: "#EDC88F",
    sideColor: "#9E7042",
    edgeColor: "#765438",
    tapeColor: "#A66B45",
  },
];

const BASE_DEFINITION: BoxDefinition = {
  id: "cabinet-shelf",
  label: "文件櫃層板",
  code: "03",
  category: "ARCHIVE SHELF",
  color: "#68797C",
  topColor: "#AEB8B6",
  sideColor: "#4A5C60",
  edgeColor: "#35474B",
  tapeColor: "#7D8B8C",
};

const BASE_BLOCK: TowerBlock = {
  id: "cabinet-shelf-base",
  definition: BASE_DEFINITION,
  width: START_WIDTH,
  depth: START_DEPTH,
  x: 0,
  z: 0,
  level: 0,
  isBase: true,
};

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const feedbackPop = keyframes`
  0% { opacity: 0; transform: translate(-50%, 8px) scale(0.82); }
  28% { opacity: 1; transform: translate(-50%, 0) scale(1.08); }
  100% { opacity: 0; transform: translate(-50%, -22px) scale(1); }
`;

const placementSquash = keyframes`
  0% { transform: scale(1); }
  20% { transform: scale(1.055, 0.86); }
  48% { transform: scale(0.985, 1.045); }
  72% { transform: scale(1.012, 0.985); }
  100% { transform: scale(1); }
`;

const perfectFlash = keyframes`
  0% { opacity: 0; transform: scale(0.35, 0.22); }
  24% { opacity: 1; transform: scale(0.82, 0.58); }
  100% { opacity: 0; transform: scale(1.5, 1.08); }
`;

const sceneKick = keyframes`
  0% { transform: translateY(0); }
  18% { transform: translateY(4px); }
  42% { transform: translateY(-2px); }
  70% { transform: translateY(1px); }
  100% { transform: translateY(0); }
`;

const fallLeft = keyframes`
  0% { opacity: 1; transform: translate(0, 0) rotate(0deg); }
  18% { opacity: 1; transform: translate(-10px, 3px) rotate(-4deg); }
  100% { opacity: 0; transform: translate(-126px, 210px) rotate(-42deg); }
`;

const fallRight = keyframes`
  0% { opacity: 1; transform: translate(0, 0) rotate(0deg); }
  18% { opacity: 1; transform: translate(10px, 3px) rotate(4deg); }
  100% { opacity: 0; transform: translate(126px, 210px) rotate(42deg); }
`;

const leftDoorClose = keyframes`
  from { transform: translateX(-104%); }
  to { transform: translateX(0); }
`;

const rightDoorClose = keyframes`
  from { transform: translateX(104%); }
  to { transform: translateX(0); }
`;

const successTextIn = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getStarCount(layerCount: number) {
  if (layerCount >= THREE_STAR_LAYER_COUNT) return 3;
  if (layerCount >= TWO_STAR_LAYER_COUNT) return 2;
  if (layerCount >= PASS_LAYER_COUNT) return 1;
  return 0;
}

function triggerHaptic(pattern: number | number[]) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  navigator.vibrate(pattern);
}

function getBlockHeight(block: TowerBlock) {
  return block.isBase ? BASE_HEIGHT : BOX_HEIGHT;
}

function projectBlock(block: TowerBlock, stageSize: StageSize, cameraLift: number) {
  const depthX = block.depth * DEPTH_X_FACTOR;
  const depthY = block.depth * DEPTH_Y_FACTOR;
  const blockHeight = getBlockHeight(block);
  const stageBaseY = stageSize.height - 78;
  const projectedCenterX = stageSize.width / 2 + block.x + block.z * DEPTH_X_FACTOR;
  const top =
    stageBaseY -
    BASE_HEIGHT -
    block.level * BOX_HEIGHT -
    block.z * DEPTH_Y_FACTOR -
    depthY / 2 +
    cameraLift;

  return {
    left: projectedCenterX - (block.width + depthX) / 2,
    top,
    depthX,
    depthY,
    height: blockHeight,
  };
}

function OfficeBoxPrism({
  block,
  showLabel = true,
}: {
  block: TowerBlock;
  showLabel?: boolean;
}) {
  const depthX = block.depth * DEPTH_X_FACTOR;
  const depthY = block.depth * DEPTH_Y_FACTOR;
  const height = getBlockHeight(block);
  const { definition } = block;

  return (
    <Box
      position="relative"
      w={`${block.width + depthX}px`}
      h={`${height + depthY}px`}
      filter="drop-shadow(5px 9px 7px rgba(42,46,43,0.24))"
      userSelect="none"
    >
      <Box
        position="absolute"
        left="0"
        top="0"
        w="100%"
        h={`${depthY}px`}
        bg={`linear-gradient(180deg, rgba(255,255,255,0.3), transparent), ${definition.topColor}`}
        clipPath={`polygon(0 100%, ${depthX}px 0, 100% 0, calc(100% - ${depthX}px) 100%)`}
        boxShadow={`inset 0 0 0 2px ${definition.edgeColor}, inset 0 -2px rgba(255,255,255,0.22)`}
      >
        <Box
          position="absolute"
          left="32%"
          right="20%"
          top="48%"
          borderTop={`1px solid ${definition.edgeColor}`}
          opacity={0.5}
          transform="skewX(-28deg)"
        />
      </Box>

      <Box
        position="absolute"
        left={`${block.width}px`}
        top="0"
        w={`${depthX}px`}
        h={`${height + depthY}px`}
        bg={`linear-gradient(90deg, rgba(255,255,255,0.08), rgba(45,31,22,0.28)), ${definition.sideColor}`}
        clipPath={`polygon(0 ${depthY}px, 100% 0, 100% ${height}px, 0 100%)`}
        boxShadow={`inset 0 0 0 2px ${definition.edgeColor}`}
      />

      <Box
        position="absolute"
        left="0"
        top={`${depthY}px`}
        w={`${block.width}px`}
        h={`${height}px`}
        overflow="hidden"
        border={`3px solid ${definition.edgeColor}`}
        borderRadius="2px"
        bg={`linear-gradient(100deg, rgba(255,255,255,0.14), transparent 28%, rgba(68,43,26,0.08)), ${definition.color}`}
      >
        {block.isBase ? (
          <Flex position="absolute" inset="0" align="center" justify="center">
            <Box w="62%" h="4px" borderRadius="999px" bgColor="rgba(223,230,226,0.4)" />
          </Flex>
        ) : (
          <>
            <Box
              position="absolute"
              left="0"
              top="0"
              bottom="0"
              w="9px"
              bgColor={definition.tapeColor}
              borderRight="1px solid rgba(55,48,39,0.25)"
            />
            <Box
              position="absolute"
              top="4px"
              right="9px"
              w="21px"
              h="6px"
              border={`1px solid ${definition.edgeColor}`}
              borderRadius="999px"
              bgColor="rgba(83,58,39,0.13)"
            />
            {showLabel ? (
              <Flex
                position="absolute"
                left="14px"
                right="10px"
                bottom="5px"
                h="29px"
                px="6px"
                py="3px"
                borderRadius="2px"
                border="1px solid rgba(72,70,61,0.38)"
                bgColor="rgba(250,248,231,0.96)"
                direction="column"
                justify="space-between"
                overflow="hidden"
              >
                <Flex justify="space-between" gap="4px">
                  <Text color={definition.tapeColor} fontSize="6px" fontWeight="900" lineHeight="1">
                    {definition.category}
                  </Text>
                  <Text color="#595B55" fontSize="6px" fontWeight="900" lineHeight="1">
                    {definition.code}
                  </Text>
                </Flex>
                <Text
                  color="#3F443D"
                  fontSize="9px"
                  fontWeight="900"
                  lineHeight="1"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {definition.label}
                </Text>
                <Flex h="3px" gap="2px" align="center">
                  <Box h="1px" flex="1" bgColor="rgba(57,61,55,0.34)" />
                  <Box w="13px" h="3px" backgroundImage="repeating-linear-gradient(90deg, #676A63 0 1px, transparent 1px 2px)" />
                </Flex>
              </Flex>
            ) : null}
          </>
        )}
      </Box>
    </Box>
  );
}

export function CabinetBoxStackMinigameModal({
  onSkip,
  onSolved,
  onComplete,
  title = "整理櫃子",
  successRewardHeading = "同事的請託",
  successRewardLabel = "櫃子整理完成",
  successFootnote = "箱子整齊收進櫃子，之後找資料方便多了",
}: {
  baseFatigue: number;
  onSkip: () => void;
  onSolved?: () => void;
  onComplete?: () => void;
  title?: string;
  successRewardHeading?: string;
  successRewardLabel?: string | null;
  successFootnote?: string;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<ActiveTowerBlock | null>(null);
  const placedRef = useRef<TowerBlock[]>([BASE_BLOCK]);
  const phaseRef = useRef<TowerPhase>("preparing");
  const directionRef = useRef<1 | -1>(1);
  const motionOffsetRef = useRef(0);
  const motionRangeRef = useRef(100);
  const lastFrameRef = useRef(0);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const solvedNotifiedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const onSolvedRef = useRef(onSolved);
  const onCompleteRef = useRef(onComplete);

  const [stageSize, setStageSize] = useState<StageSize>({ width: 0, height: 0 });
  const [placedBlocks, setPlacedBlocks] = useState<TowerBlock[]>([BASE_BLOCK]);
  const [activeBlock, setActiveBlock] = useState<ActiveTowerBlock | null>(null);
  const [motionOffset, setMotionOffset] = useState(0);
  const [phase, setPhase] = useState<TowerPhase>("preparing");
  const [cameraLift, setCameraLift] = useState(0);
  const [fallingPiece, setFallingPiece] = useState<FallingPiece | null>(null);
  const [placementEffect, setPlacementEffect] = useState<PlacementEffect | null>(null);
  const [feedback, setFeedback] = useState<{ id: number; text: string; perfect?: boolean } | null>(null);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const isInteractionBlocked = isHintOpen || isTutorialOpen;
  const completedCount = placedBlocks.length - 1;
  const speedMultiplier = 1 + completedCount * SPEED_STEP_PER_LAYER;
  const earnedStars = getStarCount(completedCount);

  useEffect(() => {
    onSolvedRef.current = onSolved;
  }, [onSolved]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const setGamePhase = useCallback((nextPhase: TowerPhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const clearTransitionTimer = useCallback(() => {
    if (!transitionTimerRef.current) return;
    clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = null;
  }, []);

  const primeAudio = useCallback(() => {
    if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return null;
    try {
      const context = audioContextRef.current ?? new window.AudioContext();
      audioContextRef.current = context;
      if (context.state === "suspended") void context.resume();
      return context;
    } catch {
      return null;
    }
  }, []);

  const playPlacementSound = useCallback(
    (perfect: boolean, missed = false) => {
      const context = primeAudio();
      if (!context || context.state === "closed") return;
      const startedAt = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = missed ? "sawtooth" : perfect ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(missed ? 105 : perfect ? 190 : 128, startedAt);
      oscillator.frequency.exponentialRampToValueAtTime(
        missed ? 48 : perfect ? 104 : 62,
        startedAt + (perfect ? 0.16 : 0.11),
      );
      gain.gain.setValueAtTime(missed ? 0.11 : perfect ? 0.14 : 0.12, startedAt);
      gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + (perfect ? 0.18 : 0.13));
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startedAt);
      oscillator.stop(startedAt + 0.19);
    },
    [primeAudio],
  );

  const spawnActive = useCallback(
    (definitionIndex: number, target: TowerBlock) => {
      const definition = BOXES[definitionIndex % BOXES.length];
      if (!definition) return;
      const axis: MoveAxis = definitionIndex % 2 === 0 ? "x" : "z";
      const range =
        axis === "x"
          ? Math.max(118, target.width + 32)
          : Math.max(118, target.depth + 70);
      const startSide: 1 | -1 = definitionIndex % 4 < 2 ? -1 : 1;
      const nextActive: ActiveTowerBlock = {
        id: `active-${definition.id}-${Date.now()}`,
        definition,
        definitionIndex,
        width: target.width,
        depth: target.depth,
        x: target.x,
        z: target.z,
        level: target.level + 1,
        axis,
      };
      activeRef.current = nextActive;
      motionRangeRef.current = range;
      motionOffsetRef.current = range * startSide;
      directionRef.current = startSide === -1 ? 1 : -1;
      lastFrameRef.current = 0;
      setMotionOffset(motionOffsetRef.current);
      setActiveBlock(nextActive);
      setFallingPiece(null);
      setPlacementEffect(null);
      setGamePhase("moving");
    },
    [setGamePhase],
  );

  const resetGame = useCallback(() => {
    clearTransitionTimer();
    placedRef.current = [BASE_BLOCK];
    activeRef.current = null;
    solvedNotifiedRef.current = false;
    setPlacedBlocks([BASE_BLOCK]);
    setActiveBlock(null);
    setCameraLift(0);
    setFallingPiece(null);
    setPlacementEffect(null);
    setFeedback(null);
    setGamePhase("preparing");
    transitionTimerRef.current = setTimeout(() => {
      transitionTimerRef.current = null;
      spawnActive(0, BASE_BLOCK);
    }, 90);
  }, [clearTransitionTimer, setGamePhase, spawnActive]);

  useEffect(() => {
    resetGame();
    return clearTransitionTimer;
  }, [clearTransitionTimer, resetGame]);

  useEffect(() => {
    if (window.localStorage.getItem(TUTORIAL_KEY) === "1") return;
    setIsTutorialOpen(true);
  }, []);

  const closeTutorial = useCallback(() => {
    window.localStorage.setItem(TUTORIAL_KEY, "1");
    setIsTutorialOpen(false);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const updateSize = () => {
      const rect = stage.getBoundingClientRect();
      setStageSize({
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let animationFrame = 0;
    const animate = (now: number) => {
      if (phaseRef.current === "moving" && activeRef.current) {
        const previous = lastFrameRef.current || now;
        const deltaMs = clamp(now - previous, 0, 34);
        lastFrameRef.current = now;
        const levelSpeedMultiplier =
          1 + activeRef.current.definitionIndex * SPEED_STEP_PER_LAYER;
        const speed =
          (activeRef.current.axis === "x" ? 0.16 : 0.23) * levelSpeedMultiplier;
        let nextOffset = motionOffsetRef.current + directionRef.current * speed * deltaMs;
        const range = motionRangeRef.current;
        if (nextOffset >= range) {
          nextOffset = range;
          directionRef.current = -1;
        } else if (nextOffset <= -range) {
          nextOffset = -range;
          directionRef.current = 1;
        }
        motionOffsetRef.current = nextOffset;
        setMotionOffset(nextOffset);
      } else {
        lastFrameRef.current = now;
      }
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(
    () => () => {
      const context = audioContextRef.current;
      audioContextRef.current = null;
      if (context && context.state !== "closed") void context.close();
    },
    [],
  );

  const completeRun = useCallback(() => {
    activeRef.current = null;
    setActiveBlock(null);
    setFallingPiece(null);
    setGamePhase("success");
    if (!solvedNotifiedRef.current) {
      solvedNotifiedRef.current = true;
      onSolvedRef.current?.();
    }
  }, [setGamePhase]);

  const finishQualifiedRun = useCallback(() => {
    if (phaseRef.current !== "moving") return;
    if (placedRef.current.length - 1 < PASS_LAYER_COUNT) return;
    clearTransitionTimer();
    completeRun();
  }, [clearTransitionTimer, completeRun]);

  const placeActiveBlock = useCallback(() => {
    if (phaseRef.current !== "moving" || isInteractionBlocked) return;
    const active = activeRef.current;
    const target = placedRef.current[placedRef.current.length - 1];
    if (!active || !target) return;

    primeAudio();
    setGamePhase("placing");
    activeRef.current = null;

    const currentX = active.x + (active.axis === "x" ? motionOffsetRef.current : 0);
    const currentZ = active.z + (active.axis === "z" ? motionOffsetRef.current : 0);
    const targetCoordinate = active.axis === "x" ? target.x : target.z;
    const currentCoordinate = active.axis === "x" ? currentX : currentZ;
    const delta = currentCoordinate - targetCoordinate;
    const targetDimension = active.axis === "x" ? target.width : target.depth;
    const overlap = targetDimension - Math.abs(delta);
    const direction: -1 | 1 = delta < 0 ? -1 : 1;

    if (overlap <= FAILURE_OVERLAP_EPSILON) {
      const missedPiece: FallingPiece = {
        ...active,
        id: `missed-${active.definition.id}-${Date.now()}`,
        x: currentX,
        z: currentZ,
        direction,
      };
      setActiveBlock(null);
      setFallingPiece(missedPiece);
      const alreadyQualified = active.definitionIndex >= PASS_LAYER_COUNT;
      setFeedback({
        id: Date.now(),
        text: alreadyQualified ? "挑戰結束，成績保留！" : "完全落空！",
      });
      setGamePhase("miss");
      playPlacementSound(false, true);
      triggerHaptic([58, 30, 58]);
      clearTransitionTimer();
      transitionTimerRef.current = setTimeout(() => {
        transitionTimerRef.current = null;
        setFallingPiece(null);
        if (alreadyQualified) {
          completeRun();
          return;
        }
        setGamePhase("game-over");
      }, 820);
      return;
    }

    const perfect = Math.abs(delta) <= PERFECT_TOLERANCE;
    const placed: TowerBlock = {
      ...active,
      id: `placed-${active.definition.id}-${Date.now()}`,
      x: perfect || active.axis === "z" ? target.x : target.x + delta / 2,
      z: perfect || active.axis === "x" ? target.z : target.z + delta / 2,
      width: active.axis === "x" ? (perfect ? target.width : overlap) : target.width,
      depth: active.axis === "z" ? (perfect ? target.depth : overlap) : target.depth,
    };

    let chopped: FallingPiece | null = null;
    if (!perfect) {
      const choppedDimension = Math.abs(delta);
      chopped = {
        ...active,
        id: `trimmed-${active.definition.id}-${Date.now()}`,
        width: active.axis === "x" ? choppedDimension : target.width,
        depth: active.axis === "z" ? choppedDimension : target.depth,
        x:
          active.axis === "x"
            ? target.x + direction * (target.width / 2 + choppedDimension / 2)
            : target.x,
        z:
          active.axis === "z"
            ? target.z + direction * (target.depth / 2 + choppedDimension / 2)
            : target.z,
        direction,
      };
    }

    const nextPlacedBlocks = [...placedRef.current, placed];
    const nextCount = nextPlacedBlocks.length - 1;
    placedRef.current = nextPlacedBlocks;
    setPlacedBlocks(nextPlacedBlocks);
    setActiveBlock(null);
    setFallingPiece(chopped);
    setPlacementEffect({
      id: Date.now(),
      blockId: placed.id,
      x: placed.x,
      z: placed.z,
      level: placed.level,
      perfect,
    });
    const isPassMilestone = nextCount === PASS_LAYER_COUNT;
    const isTwoStarMilestone = nextCount === TWO_STAR_LAYER_COUNT;
    const isThreeStarMilestone = nextCount === THREE_STAR_LAYER_COUNT;
    setFeedback({
      id: Date.now(),
      text: isThreeStarMilestone
        ? "★★★ 三星達成！"
        : isTwoStarMilestone
          ? "★★ 兩星達成！"
          : isPassMilestone
            ? "通關！繼續挑戰三星"
            : perfect
              ? "完美貼合！"
              : "切齊！",
      perfect: perfect || isPassMilestone || isTwoStarMilestone || isThreeStarMilestone,
    });
    playPlacementSound(perfect);
    triggerHaptic(perfect ? [20, 18, 34] : [22, 18, 24]);

    clearTransitionTimer();
    transitionTimerRef.current = setTimeout(() => {
      transitionTimerRef.current = null;
      setFallingPiece(null);
      setCameraLift(Math.max(0, nextCount - 2) * 28);
      if (nextCount >= THREE_STAR_LAYER_COUNT) {
        completeRun();
        return;
      }
      spawnActive(nextCount, placed);
    }, perfect ? 360 : 430);
  }, [
    clearTransitionTimer,
    completeRun,
    isInteractionBlocked,
    playPlacementSound,
    primeAudio,
    setGamePhase,
    spawnActive,
  ]);

  useEffect(() => {
    if (phase !== "success") return;
    clearTransitionTimer();
    transitionTimerRef.current = setTimeout(() => {
      transitionTimerRef.current = null;
      onCompleteRef.current?.();
    }, 3000);
    return clearTransitionTimer;
  }, [clearTransitionTimer, phase]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (isTutorialOpen) {
          closeTutorial();
          return;
        }
        if (isHintOpen) {
          setIsHintOpen(false);
          return;
        }
        onSkip();
        return;
      }
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      placeActiveBlock();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeTutorial, isHintOpen, isTutorialOpen, onSkip, placeActiveBlock]);

  const targetBlock = placedBlocks[placedBlocks.length - 1] ?? BASE_BLOCK;
  const displayedActive: TowerBlock | null = activeBlock
    ? {
        ...activeBlock,
        x: activeBlock.x + (activeBlock.axis === "x" ? motionOffset : 0),
        z: activeBlock.z + (activeBlock.axis === "z" ? motionOffset : 0),
      }
    : null;
  const activeAxis = activeBlock?.axis ?? (completedCount % 2 === 0 ? "x" : "z");

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={70}
      direction="column"
      overflow="hidden"
      bgColor="#D3D4CC"
      backgroundImage="linear-gradient(180deg, #ECEAE0 0%, #C6CECB 100%)"
    >
      <Flex h="58px" flexShrink={0} px="14px" align="center" justify="space-between" zIndex={5}>
        <Flex
          as="button"
          aria-label="重新開始"
          onClick={resetGame}
          w="34px"
          h="34px"
          borderRadius="999px"
          bgColor="rgba(255,251,242,0.94)"
          color="#745338"
          align="center"
          justify="center"
          boxShadow="0 4px 12px rgba(75,52,34,0.15)"
        >
          <FiRefreshCw size={16} />
        </Flex>

        <Flex direction="column" align="center" gap="1px">
          <Text color="#35464A" fontSize="18px" fontWeight="900" lineHeight="1.1">
            {title}
          </Text>
          <Text color="#657479" fontSize="11px" fontWeight="800">
            {completedCount}/{THREE_STAR_LAYER_COUNT} 層 · {PASS_LAYER_COUNT} 層通關
          </Text>
        </Flex>

        <Flex gap="7px">
          <Flex
            as="button"
            onClick={() => setIsHintOpen(true)}
            minW="52px"
            h="32px"
            px="10px"
            borderRadius="999px"
            bgColor="rgba(61,80,84,0.14)"
            color="#40565A"
            align="center"
            justify="center"
            fontSize="11px"
            fontWeight="800"
          >
            提示
          </Flex>
          <Flex
            as="button"
            onClick={onSkip}
            minW="68px"
            h="32px"
            px="10px"
            borderRadius="999px"
            bgColor="rgba(61,80,84,0.14)"
            color="#40565A"
            align="center"
            justify="center"
            fontSize="11px"
            fontWeight="800"
          >
            稍後再做
          </Flex>
        </Flex>
      </Flex>

      <Flex flex="1" minH="0" px="13px" pb="10px">
        <Box
          position="relative"
          flex="1"
          minH="0"
          p="12px 10px 10px"
          borderRadius="8px 8px 4px 4px"
          bgColor="#68777B"
          border="2px solid #46575C"
          boxShadow="0 12px 26px rgba(45,57,59,0.28), inset 0 1px rgba(255,255,255,0.22)"
          overflow="hidden"
        >
          <Flex
            position="absolute"
            top="2px"
            left="50%"
            zIndex={4}
            transform="translateX(-50%)"
            h="18px"
            px="12px"
            borderRadius="2px"
            bgColor="#ECE9D8"
            border="1px solid #526165"
            color="#45575B"
            align="center"
            fontSize="7px"
            fontWeight="900"
            letterSpacing="0.12em"
          >
            ARCHIVE 03 · 文件櫃
          </Flex>

          <Box
            ref={stageRef}
            role="button"
            aria-label="移動中的箱子，點擊放置"
            tabIndex={0}
            onPointerDown={(event) => {
              event.preventDefault();
              placeActiveBlock();
            }}
            position="relative"
            w="100%"
            h="100%"
            overflow="hidden"
            border="2px solid #39494C"
            borderRadius="3px"
            bgColor="#C9C7BC"
            backgroundImage="linear-gradient(180deg, #AAAFA9 0%, #D1CEC2 34%, #B9B9AE 100%)"
            boxShadow="inset 0 0 34px rgba(35,45,46,0.3)"
            cursor={phase === "moving" ? "pointer" : "default"}
            touchAction="none"
            outline="none"
          >
            <Box
              position="absolute"
              inset="0"
              backgroundImage="linear-gradient(90deg, rgba(72,80,77,0.08) 1px, transparent 1px), linear-gradient(rgba(72,80,77,0.07) 1px, transparent 1px)"
              backgroundSize="24px 24px"
              pointerEvents="none"
            />
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              h="66px"
              bg="linear-gradient(180deg, #657174 0%, rgba(125,137,136,0.84) 42%, transparent 100%)"
              clipPath="polygon(0 0, 100% 0, 91% 100%, 9% 100%)"
              pointerEvents="none"
            />
            <Box
              position="absolute"
              insetY="0"
              left="0"
              w="33px"
              bg="linear-gradient(90deg, #59676B, rgba(104,119,119,0.8), transparent)"
              clipPath="polygon(0 0, 100% 9%, 100% 91%, 0 100%)"
              pointerEvents="none"
            />
            <Box
              position="absolute"
              insetY="0"
              right="0"
              w="33px"
              bg="linear-gradient(270deg, #59676B, rgba(104,119,119,0.8), transparent)"
              clipPath="polygon(0 9%, 100% 0, 100% 100%, 0 91%)"
              pointerEvents="none"
            />

            <Flex
              position="absolute"
              top="38px"
              right="12px"
              zIndex={260}
              w="38px"
              h="38px"
              borderRadius="999px"
              bgColor="rgba(54,69,70,0.7)"
              border="1px solid rgba(255,255,255,0.32)"
              color="#FFF8EA"
              align="center"
              justify="center"
              fontSize={activeAxis === "x" ? "23px" : "20px"}
              fontWeight="900"
              lineHeight="1"
              aria-label={activeAxis === "x" ? "左右方向移動" : "斜向深度移動"}
              pointerEvents="none"
            >
              {activeAxis === "x" ? "↔" : "↗"}
            </Flex>

            <Flex
              position="absolute"
              top="40px"
              left="12px"
              zIndex={260}
              gap="5px"
              px="9px"
              py="6px"
              borderRadius="999px"
              bgColor="rgba(54,69,70,0.76)"
              border="1px solid rgba(255,255,255,0.24)"
              color="#FFF8EA"
              align="center"
              pointerEvents="none"
              data-speed-multiplier={speedMultiplier.toFixed(2)}
            >
              <Text fontSize="8px" fontWeight="900" letterSpacing="0.12em" lineHeight="1">
                速度
              </Text>
              <Text fontSize="13px" fontWeight="900" lineHeight="1">
                ×{speedMultiplier.toFixed(1)}
              </Text>
            </Flex>

            <Box
              key={`tower-scene-${placementEffect?.id ?? "idle"}`}
              position="absolute"
              inset="0"
              animation={placementEffect ? `${sceneKick} 240ms ease-out both` : undefined}
              pointerEvents="none"
            >
              {placedBlocks.map((block) => {
                const projected = projectBlock(block, stageSize, cameraLift);
                const isImpactBlock = placementEffect?.blockId === block.id;
                return (
                  <Box
                    key={block.id}
                    data-tower-block={block.definition.id}
                    data-block-role={block.isBase ? "base" : "placed"}
                    position="absolute"
                    left={`${projected.left}px`}
                    top={`${projected.top}px`}
                    zIndex={100 + block.level}
                    transition="left 300ms ease, top 300ms ease"
                  >
                    <Box
                      key={`${block.id}-${isImpactBlock ? placementEffect.id : "idle"}`}
                      transformOrigin="50% 100%"
                      animation={
                        isImpactBlock
                          ? `${placementSquash} 270ms cubic-bezier(0.16,0.82,0.24,1) both`
                          : undefined
                      }
                    >
                      <OfficeBoxPrism block={block} />
                    </Box>
                  </Box>
                );
              })}

              {displayedActive ? (() => {
                const projected = projectBlock(displayedActive, stageSize, cameraLift);
                return (
                  <Box
                    data-tower-block={displayedActive.definition.id}
                    data-block-role="active"
                    data-move-axis={activeBlock?.axis}
                    data-motion-offset={motionOffset.toFixed(2)}
                    position="absolute"
                    left={`${projected.left}px`}
                    top={`${projected.top}px`}
                    zIndex={220}
                    willChange="left, top"
                  >
                    <OfficeBoxPrism block={displayedActive} />
                  </Box>
                );
              })() : null}

              {fallingPiece ? (() => {
                const projected = projectBlock(fallingPiece, stageSize, cameraLift);
                return (
                  <Box
                    key={fallingPiece.id}
                    data-falling-piece="true"
                    position="absolute"
                    left={`${projected.left}px`}
                    top={`${projected.top}px`}
                    zIndex={230}
                    animation={`${fallingPiece.direction < 0 ? fallLeft : fallRight} 780ms cubic-bezier(0.35,0.08,0.72,0.28) both`}
                  >
                    <OfficeBoxPrism block={fallingPiece} showLabel={false} />
                  </Box>
                );
              })() : null}

              {placementEffect ? (() => {
                const effectBlock: TowerBlock = {
                  id: "placement-effect-anchor",
                  definition: BASE_DEFINITION,
                  width: targetBlock.width,
                  depth: targetBlock.depth,
                  x: placementEffect.x,
                  z: placementEffect.z,
                  level: placementEffect.level,
                };
                const projected = projectBlock(effectBlock, stageSize, cameraLift);
                return (
                  <Box
                    key={placementEffect.id}
                    data-placement-impact={placementEffect.perfect ? "perfect" : "trimmed"}
                    position="absolute"
                    left={`${projected.left + targetBlock.width * 0.1}px`}
                    top={`${projected.top + BOX_HEIGHT - 3}px`}
                    w={`${Math.max(52, targetBlock.width * 0.8)}px`}
                    h="18px"
                    zIndex={240}
                    borderRadius="50%"
                    border={`3px solid ${placementEffect.perfect ? "#FFF1A3" : "#F4D199"}`}
                    boxShadow="0 0 18px rgba(255,236,164,0.92)"
                    animation={`${perfectFlash} 420ms cubic-bezier(0.12,0.72,0.2,1) both`}
                  />
                );
              })() : null}
            </Box>

            <Box
              position="absolute"
              left="0"
              right="0"
              bottom="0"
              h="34px"
              zIndex={245}
              bg="linear-gradient(180deg, #849294 0%, #536669 100%)"
              borderTop="4px solid #3D4D50"
              clipPath="polygon(0 0, 100% 0, 94% 100%, 6% 100%)"
              boxShadow="0 -8px 14px rgba(39,51,52,0.26), inset 0 2px rgba(255,255,255,0.16)"
              pointerEvents="none"
            />

            {feedback ? (
              <Text
                key={feedback.id}
                position="absolute"
                left="50%"
                top="34%"
                zIndex={270}
                color={feedback.perfect ? "#FFF1A3" : phase === "miss" ? "#9D3F35" : "#FFF8E8"}
                fontSize="20px"
                fontWeight="900"
                textShadow={
                  phase === "miss"
                    ? "0 2px 0 rgba(255,244,226,0.72)"
                    : "0 2px 6px rgba(62,43,29,0.48)"
                }
                animation={`${feedbackPop} 820ms ease both`}
                pointerEvents="none"
              >
                {feedback.text}
              </Text>
            ) : null}

            {phase === "game-over" ? (
              <Flex
                position="absolute"
                inset="0"
                zIndex={300}
                bgColor="rgba(50,34,23,0.72)"
                align="center"
                justify="center"
                px="24px"
              >
                <Flex
                  w="100%"
                  maxW="286px"
                  borderRadius="14px"
                  bgColor="#FFF7E9"
                  direction="column"
                  align="center"
                  gap="10px"
                  p="20px"
                  boxShadow="0 16px 32px rgba(32,21,14,0.3)"
                  animation={`${fadeUp} 220ms ease both`}
                >
                  <Text color="#65462F" fontSize="20px" fontWeight="900">
                    箱子完全落空
                  </Text>
                  <Text color="#8A674D" fontSize="13px" lineHeight="1.6" textAlign="center">
                    通關前只要完全沒有重疊，整箱就會掉出櫃外並失敗。先疊穩 7 層，再挑戰更高星等。
                  </Text>
                  <Flex gap="9px" mt="4px">
                    <Flex
                      as="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSkip();
                      }}
                      h="38px"
                      px="15px"
                      borderRadius="999px"
                      bgColor="#E9DDCD"
                      color="#76583F"
                      align="center"
                      justify="center"
                      fontSize="12px"
                      fontWeight="800"
                    >
                      稍後再做
                    </Flex>
                    <Flex
                      as="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        resetGame();
                      }}
                      h="38px"
                      px="18px"
                      borderRadius="999px"
                      bgColor="#8A5D39"
                      color="white"
                      align="center"
                      justify="center"
                      fontSize="12px"
                      fontWeight="900"
                    >
                      再試一次
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>
            ) : null}

            {phase === "success" ? (
              <Flex position="absolute" inset="0" zIndex={310} pointerEvents="none">
                <Box
                  position="absolute"
                  insetY="0"
                  left="0"
                  w="50.4%"
                  bgColor="#718084"
                  borderRight="3px solid #3E4E52"
                  boxShadow="inset -8px 0 16px rgba(31,43,46,0.2)"
                  animation={`${leftDoorClose} 620ms cubic-bezier(0.2,0.84,0.25,1) both`}
                />
                <Box
                  position="absolute"
                  insetY="0"
                  right="0"
                  w="50.4%"
                  bgColor="#718084"
                  borderLeft="3px solid #3E4E52"
                  boxShadow="inset 8px 0 16px rgba(31,43,46,0.2)"
                  animation={`${rightDoorClose} 620ms cubic-bezier(0.2,0.84,0.25,1) both`}
                />
                <Flex
                  position="absolute"
                  inset="0"
                  direction="column"
                  align="center"
                  justify="center"
                  gap="7px"
                  px="26px"
                  opacity={0}
                  animation={`${successTextIn} 300ms ease 860ms both`}
                >
                  <Text color="#FFF7E8" fontSize="24px" fontWeight="900" textShadow="0 2px 6px rgba(52,34,22,0.35)">
                    {earnedStars === 3 ? "三星完成！" : "整理完成！"}
                  </Text>
                  <Flex aria-label={`${earnedStars} 顆星`} gap="5px" mb="1px">
                    {Array.from({ length: 3 }, (_, index) => (
                      <Text
                        key={`result-star-${index}`}
                        color={index < earnedStars ? "#FFD66B" : "rgba(255,255,255,0.24)"}
                        fontSize="25px"
                        lineHeight="1"
                        textShadow={index < earnedStars ? "0 2px 8px rgba(255,197,61,0.34)" : undefined}
                      >
                        ★
                      </Text>
                    ))}
                  </Flex>
                  <Text color="#FFF7E8" fontSize="12px" fontWeight="800">
                    本次成績：{completedCount} 層
                  </Text>
                  {successRewardLabel !== null ? (
                    <>
                      <Text color="#D8E1DE" fontSize="13px" fontWeight="800">
                        {successRewardHeading}
                      </Text>
                      <Text color="white" fontSize="17px" fontWeight="900">
                        {successRewardLabel}
                      </Text>
                    </>
                  ) : null}
                  {successFootnote ? (
                    <Text maxW="260px" color="rgba(255,247,232,0.82)" fontSize="11px" lineHeight="1.55" fontWeight="700" textAlign="center">
                      {successFootnote}
                    </Text>
                  ) : null}
                </Flex>
              </Flex>
            ) : null}
          </Box>
        </Box>
      </Flex>

      <Flex h="76px" flexShrink={0} px="18px" pb="14px" align="center" justify="center" gap="8px">
        {phase === "moving" && completedCount >= PASS_LAYER_COUNT ? (
          <Flex
            as="button"
            onClick={(event) => {
              event.stopPropagation();
              finishQualifiedRun();
            }}
            h="48px"
            px="15px"
            flexShrink={0}
            borderRadius="999px"
            bgColor="#E8D7B8"
            color="#6D4A30"
            align="center"
            justify="center"
            fontSize="12px"
            fontWeight="900"
            boxShadow="0 7px 16px rgba(63,46,32,0.18)"
          >
            完成 {"★".repeat(earnedStars)}
          </Flex>
        ) : null}
        <Flex
          as="button"
          onPointerDown={(event) => {
            event.stopPropagation();
            placeActiveBlock();
          }}
          aria-disabled={phase !== "moving" || isInteractionBlocked}
          w="100%"
          maxW={completedCount >= PASS_LAYER_COUNT ? "210px" : "300px"}
          h="48px"
          borderRadius="999px"
          bgColor={phase === "moving" ? "#4D666B" : "#8A9694"}
          color="white"
          align="center"
          justify="center"
          fontSize="15px"
          fontWeight="900"
          letterSpacing="0.08em"
          boxShadow="0 8px 18px rgba(48,64,67,0.24)"
          _active={phase === "moving" ? { transform: "translateY(2px)" } : undefined}
        >
          {phase === "moving"
            ? completedCount >= PASS_LAYER_COUNT
              ? "繼續挑戰"
              : "放置箱子"
            : phase === "placing"
              ? "切齊中⋯⋯"
              : phase === "miss"
                ? "箱子掉落中⋯⋯"
                : "整理中⋯⋯"}
        </Flex>
      </Flex>

      {isHintOpen ? (
        <Flex position="absolute" inset="0" zIndex={400} bgColor="rgba(49,33,23,0.52)" align="center" justify="center" p="24px">
          <Flex w="100%" maxW="300px" borderRadius="14px" bgColor="#FFF7E9" direction="column" p="20px" gap="12px" boxShadow="0 16px 34px rgba(34,22,14,0.3)" animation={`${fadeUp} 220ms ease both`}>
            <Text color="#65462F" fontSize="19px" fontWeight="900">
              堆箱提示
            </Text>
            <Text color="#7D5C43" fontSize="14px" lineHeight="1.7">
              箱子會輪流沿左右與斜向深度移動，而且每疊一層都會加速。疊穩 7 層即可通關並選擇完成；繼續到 10 層是兩星，14 層可獲得三星。
            </Text>
            <Flex justify="flex-end">
              <Flex as="button" onClick={() => setIsHintOpen(false)} h="36px" px="18px" borderRadius="999px" bgColor="#845839" color="white" align="center" justify="center" fontSize="12px" fontWeight="900">
                知道了
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {isTutorialOpen ? (
        <Flex position="absolute" inset="0" zIndex={410} bgColor="rgba(49,33,23,0.56)" align="center" justify="center" p="22px">
          <Flex w="100%" maxW="312px" borderRadius="16px" overflow="hidden" bgColor="#FFF7E9" boxShadow="0 18px 36px rgba(33,21,14,0.34)" direction="column" animation={`${fadeUp} 240ms ease both`}>
            <Flex h="154px" position="relative" bg="linear-gradient(180deg, #B8BCB5, #D5CEC1)" overflow="hidden" align="center" justify="center">
              <Box position="absolute" left="45px" top="82px">
                <OfficeBoxPrism block={{ ...BASE_BLOCK, width: 128, depth: 58 }} />
              </Box>
              <Box position="absolute" left="89px" top="28px">
                <OfficeBoxPrism block={{ ...BASE_BLOCK, id: "tutorial-box", definition: BOXES[0], width: 128, depth: 58, level: 1, isBase: false }} />
              </Box>
              <Text position="absolute" left="24px" top="42px" color="#41575A" fontSize="26px" fontWeight="900">
                ↔
              </Text>
              <Text position="absolute" right="25px" top="42px" color="#41575A" fontSize="23px" fontWeight="900">
                ↗
              </Text>
            </Flex>
            <Flex p="19px" direction="column" gap="10px">
              <Text color="#60422D" fontSize="20px" fontWeight="900">
                看準位置，切齊箱子
              </Text>
              <Text color="#7A5941" fontSize="13px" lineHeight="1.65">
                箱子會像 Tower Blocks 一樣，輪流沿兩個方向移動。點擊櫃子或「放置箱子」就會立即定格。
              </Text>
              <Text color="#7A5941" fontSize="13px" lineHeight="1.65">
                箱子來源會循環出現，每成功一層速度都會提高。超出的紙箱會被切下；先疊穩 7 層通關，繼續到 14 層可獲得三星。
              </Text>
              <Flex justify="flex-end" mt="4px">
                <Flex as="button" onClick={closeTutorial} h="38px" px="20px" borderRadius="999px" bgColor="#845839" color="white" align="center" justify="center" fontSize="13px" fontWeight="900">
                  開始整理
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}
