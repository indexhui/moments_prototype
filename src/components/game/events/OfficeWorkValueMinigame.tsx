"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import {
  FiCheck,
  FiCommand,
  FiCpu,
  FiInbox,
  FiMousePointer,
  FiTrendingUp,
  FiX,
  FiZap,
} from "react-icons/fi";

type WorkPhase = "intro" | "playing" | "upgrade" | "complete";
type UpgradeId = "shortcut" | "automation" | "focus";
type ReviewTokenKind = "idea" | "noise";
type ReviewGesture = "tap" | "slash";
type ReviewTokenVariant = "file-courier" | "typo-bug" | "popup-slime" | "crash-cloud";

type ReviewToken = {
  id: number;
  kind: ReviewTokenKind;
  variant: ReviewTokenVariant;
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  motionPhase: number;
  destinationX: number;
  destinationY: number;
  retargetTicks: number;
  routeStep: number;
  rotation: number;
  scale: number;
  label: string;
  durability: number;
  maxDurability: number;
};

type Impact = {
  nonce: number;
  tokenId: number;
  x: number;
  y: number;
  amount: number;
  correct: boolean;
  gesture: ReviewGesture;
  variant: ReviewTokenVariant;
  remainingHits?: number;
};

type GestureState = {
  tokenId: number | null;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  lastClientX: number;
  lastClientY: number;
};

type GestureTrail = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

const WORK_MILESTONES = [
  { id: "sort", label: "完成第一輪判讀", target: 30 },
  { id: "train", label: "校準 AI 品味", target: 60 },
  { id: "ship", label: "送出今日成果", target: 90 },
] as const;

const TOKEN_SPAWN_POINTS = [
  { x: 2, y: 9 },
  { x: 38, y: 8 },
  { x: 75, y: 12 },
  { x: 4, y: 48 },
  { x: 39, y: 52 },
  { x: 74, y: 51 },
] as const;

const TOKEN_DEFINITIONS: Record<
  ReviewTokenVariant,
  {
    kind: ReviewTokenKind;
    label: string;
    durability: number;
    speed: number;
    scale: number;
    tagColor: string;
    shardColors: readonly [string, string, string];
  }
> = {
  "file-courier": {
    kind: "idea",
    label: "完成檔案",
    durability: 1,
    speed: 0.24,
    scale: 0.79,
    tagColor: "rgba(42,104,91,0.94)",
    shardColors: ["#FFD85A", "#FFF0A6", "#E58B4A"],
  },
  "typo-bug": {
    kind: "noise",
    label: "錯字蟲",
    durability: 1,
    speed: 0.32,
    scale: 0.72,
    tagColor: "rgba(183,75,66,0.95)",
    shardColors: ["#F06B5E", "#FFC5A9", "#263B59"],
  },
  "popup-slime": {
    kind: "noise",
    label: "彈窗怪",
    durability: 2,
    speed: 0.19,
    scale: 0.78,
    tagColor: "rgba(111,72,140,0.95)",
    shardColors: ["#9B73C8", "#D9C3F0", "#F28B6D"],
  },
  "crash-cloud": {
    kind: "noise",
    label: "當機雲",
    durability: 3,
    speed: 0.145,
    scale: 0.82,
    tagColor: "rgba(56,63,82,0.96)",
    shardColors: ["#35425E", "#77809B", "#F28B6D"],
  },
};

const INTRO_TOKEN_ORDER: ReviewTokenVariant[] = [
  "file-courier",
  "typo-bug",
  "popup-slime",
  "crash-cloud",
];
const SHARD_VECTORS = [
  { x: -58, y: -45, r: -140, size: 10 },
  { x: -34, y: -68, r: 100, size: 7 },
  { x: -12, y: -57, r: -80, size: 12 },
  { x: 16, y: -70, r: 160, size: 8 },
  { x: 45, y: -48, r: -120, size: 11 },
  { x: 63, y: -18, r: 95, size: 7 },
  { x: 52, y: 26, r: 150, size: 12 },
  { x: 27, y: 51, r: -110, size: 8 },
  { x: -4, y: 62, r: 130, size: 10 },
  { x: -35, y: 48, r: -165, size: 7 },
  { x: -59, y: 25, r: 105, size: 11 },
  { x: 9, y: 28, r: -75, size: 6 },
] as const;
const TAP_HAND_IMAGE = "/images/work/ai-review/tap-hand.png";
const SLASH_HAND_IMAGE = "/images/work/ai-review/slash-hand.png";

function PixelDesktopCharacter({
  variant,
  damage = 0,
  size = 72,
}: {
  variant: ReviewTokenVariant;
  damage?: number;
  size?: number;
}) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 64 64",
    "aria-hidden": true,
    focusable: false,
    style: { display: "block", imageRendering: "pixelated" as const },
  };

  if (variant === "file-courier") {
    return (
      <svg {...commonProps} shapeRendering="crispEdges">
        <rect x="13" y="48" width="10" height="9" fill="#263B59" />
        <rect x="42" y="48" width="10" height="9" fill="#263B59" />
        <rect x="4" y="27" width="8" height="13" fill="#F28B6D" />
        <rect x="52" y="25" width="8" height="13" fill="#F28B6D" />
        <path d="M8 15h18V9h14l7 6h9v36H8z" fill="#E89A24" />
        <path d="M11 18h42v30H11z" fill="#FFD34E" />
        <path d="M40 9v10h13z" fill="#FFF0A6" />
        <rect x="17" y="22" width="7" height="8" fill="#FFF7D5" />
        <rect x="40" y="22" width="7" height="8" fill="#FFF7D5" />
        <rect x="20" y="24" width="4" height="6" fill="#263B59" />
        <rect x="40" y="24" width="4" height="6" fill="#263B59" />
        <rect x="27" y="35" width="10" height="4" fill="#A94F3A" />
        <rect x="30" y="39" width="4" height="3" fill="#F28B6D" />
        <path d="M10 37h13v15H10z" fill="#F5E2B8" />
        <path d="M10 37h13l-6 6z" fill="#FFF5D6" />
        <rect x="13" y="46" width="7" height="2" fill="#B98453" />
      </svg>
    );
  }

  if (variant === "typo-bug") {
    return (
      <svg {...commonProps} shapeRendering="crispEdges">
        <path d="M19 16h26v5h7v7h5v20h-7v7H14v-7H7V28h5v-7h7z" fill="#D84F49" />
        <rect x="17" y="20" width="30" height="27" fill="#F06B5E" />
        <rect x="17" y="36" width="30" height="11" fill="#FFC5A9" />
        <rect x="20" y="23" width="10" height="10" fill="#FFF6DF" />
        <rect x="35" y="23" width="10" height="10" fill="#FFF6DF" />
        <rect x="25" y="26" width="4" height="5" fill="#263B59" />
        <rect x="35" y="26" width="4" height="5" fill="#263B59" />
        <rect x="29" y="35" width="7" height="5" fill="#9E3B42" />
        <rect x="16" y="7" width="5" height="11" fill="#F06B5E" />
        <rect x="14" y="5" width="8" height="5" fill="#263B59" />
        <rect x="42" y="7" width="5" height="11" fill="#F06B5E" />
        <rect x="41" y="5" width="8" height="5" fill="#263B59" />
        <rect x="7" y="51" width="13" height="5" fill="#263B59" />
        <rect x="44" y="51" width="13" height="5" fill="#263B59" />
        <path d="M51 37h8v5h-5v5h7" fill="none" stroke="#F06B5E" strokeWidth="5" />
      </svg>
    );
  }

  if (variant === "popup-slime") {
    return (
      <svg {...commonProps} shapeRendering="crispEdges">
        <rect x="15" y="7" width="43" height="35" fill="#7252A0" />
        <rect x="18" y="11" width="37" height="27" fill="#B89ADE" />
        <rect x="7" y="18" width="45" height="38" fill="#8160AD" />
        <rect x="10" y="22" width="39" height="30" fill="#CDB8E8" />
        <rect x="10" y="22" width="39" height="7" fill="#A17ACB" />
        <rect x="14" y="24" width="4" height="3" fill="#F28B6D" />
        <rect x="21" y="24" width="4" height="3" fill="#F0C35B" />
        <rect x="28" y="24" width="4" height="3" fill="#77B89F" />
        <rect x="16" y="34" width="6" height="7" fill="#FFF6DF" />
        <rect x="37" y="34" width="6" height="7" fill="#FFF6DF" />
        <rect x="18" y="36" width="4" height="5" fill="#35425E" />
        <rect x="37" y="36" width="4" height="5" fill="#35425E" />
        <path d="M26 44h5v3h5v-3h5" fill="none" stroke="#59447E" strokeWidth="3" />
        <rect x="2" y="34" width="8" height="11" fill="#F28B6D" />
        <rect x="49" y="32" width="9" height="12" fill="#F28B6D" />
        <rect x="14" y="55" width="10" height="5" fill="#35425E" />
        <rect x="39" y="55" width="10" height="5" fill="#35425E" />
        {damage > 0 ? <path d="M31 29l-4 7 5 4-4 9" fill="none" stroke="#FFF7E8" strokeWidth="3" /> : null}
      </svg>
    );
  }

  return (
    <svg {...commonProps} shapeRendering="crispEdges">
      <path d="M18 15h10V8h16v7h8v7h7v27h-7v7H13v-7H5V26h6v-7h7z" fill="#35425E" />
      <rect x="13" y="20" width="39" height="31" fill="#485570" />
      <rect x="18" y="27" width="10" height="9" fill="#FFF1D3" />
      <rect x="37" y="27" width="10" height="9" fill="#FFF1D3" />
      <rect x="21" y="30" width="7" height="6" fill="#202A3D" />
      <rect x="37" y="30" width="7" height="6" fill="#202A3D" />
      <path d="M25 43h5v-3h7v3h5" fill="none" stroke="#202A3D" strokeWidth="3" />
      <rect x="9" y="45" width="10" height="8" fill="#485570" />
      <rect x="47" y="43" width="10" height="9" fill="#485570" />
      <rect x="15" y="55" width="12" height="6" fill="#F06B5E" />
      <rect x="39" y="55" width="12" height="6" fill="#F06B5E" />
      <rect x="29" y="48" width="5" height="5" fill="#F0C35B" />
      <rect x="35" y="48" width="5" height="5" fill="#F06B5E" />
      <rect x="35" y="54" width="5" height="4" fill="#5AA6D6" />
      <rect x="29" y="54" width="5" height="4" fill="#FFF1D3" />
      {damage > 0 ? <path d="M31 18l-5 8 6 5-5 8" fill="none" stroke="#9DA6BE" strokeWidth="3" /> : null}
      {damage > 1 ? <path d="M45 18l-4 7 5 5-4 7" fill="none" stroke="#9DA6BE" strokeWidth="3" /> : null}
    </svg>
  );
}

const tokenIn = keyframes`
  from { opacity: 0; transform: translateY(-12px) scale(0.7); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const ideaBob = keyframes`
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-7px) rotate(3deg); }
`;

const noiseJitter = keyframes`
  0%, 100% { transform: translate(0, 0) rotate(-3deg); }
  28% { transform: translate(2px, -4px) rotate(1deg); }
  55% { transform: translate(-1px, -7px) rotate(3deg); }
  78% { transform: translate(-3px, -3px) rotate(-1deg); }
`;

const popupWobble = keyframes`
  0%, 100% { transform: translateY(0) rotate(-1deg) scaleY(1); }
  38% { transform: translateY(-4px) rotate(2deg) scaleY(0.96); }
  68% { transform: translateY(-1px) rotate(-2deg) scaleY(1.03); }
`;

const cloudTrudge = keyframes`
  0%, 100% { transform: translate(0, 0) rotate(-2deg); }
  34% { transform: translate(2px, -2px) rotate(1deg); }
  70% { transform: translate(-2px, 0) rotate(2deg); }
`;

const tapMotion = keyframes`
  0% { opacity: 0; transform: translate(54px, 62px) rotate(-9deg) scale(0.82); }
  25% { opacity: 1; transform: translate(24px, 25px) rotate(-4deg) scale(0.92); }
  55% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(0.96); }
  67% { opacity: 1; transform: translate(7px, -15px) rotate(-2deg) scale(0.94); }
  100% { opacity: 0; transform: translate(21px, -36px) rotate(-5deg) scale(0.9); }
`;

const slashMotion = keyframes`
  0% { opacity: 0; transform: translate(112px, 96px) rotate(8deg) scale(0.78); }
  20% { opacity: 1; transform: translate(70px, 58px) rotate(5deg) scale(0.9); }
  58% { opacity: 1; transform: translate(-44px, -39px) rotate(-4deg) scale(0.96); }
  100% { opacity: 0; transform: translate(-106px, -88px) rotate(-9deg) scale(0.9); }
`;

const slashStreak = keyframes`
  0% { opacity: 0; transform: translate(-50%, -50%) rotate(-40deg) scaleX(0.25); }
  34% { opacity: 1; transform: translate(-50%, -50%) rotate(-40deg) scaleX(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) rotate(-40deg) scaleX(1.28); }
`;

const hitRipple = keyframes`
  0% { opacity: 1; transform: translate(-50%, -50%) scale(0.25); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.8); }
`;

const valueBurst = keyframes`
  0% { opacity: 0; transform: translate(-50%, 8px) scale(0.72); }
  24% { opacity: 1; transform: translate(-50%, -4px) scale(1.12); }
  100% { opacity: 0; transform: translate(-50%, -60px) scale(0.95); }
`;

const particleFly = keyframes`
  0% { opacity: 1; transform: translateY(-3px) scale(1); }
  100% { opacity: 0; transform: translateY(-46px) scale(0.45); }
`;

const damageShock = keyframes`
  0% { filter: brightness(1); transform: translate(0, 0) scale(1); }
  18% { filter: brightness(1.8); transform: translate(-6px, 2px) scale(0.84, 1.1); }
  42% { filter: brightness(1.15); transform: translate(5px, -2px) scale(1.08, 0.92); }
  68% { transform: translate(-3px, 1px) scale(0.96, 1.03); }
  100% { filter: brightness(1); transform: translate(0, 0) scale(1); }
`;

const pixelShatter = keyframes`
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) translate(0, 0) rotate(0deg) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) translate(var(--shard-x), var(--shard-y)) rotate(var(--shard-r)) scale(0.25);
  }
`;

const panelIn = keyframes`
  from { opacity: 0; transform: translateY(14px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const completionGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 rgba(100, 219, 181, 0); }
  50% { box-shadow: 0 0 34px rgba(100, 219, 181, 0.42); }
`;

const UPGRADE_COPY: Record<UpgradeId, { title: string; detail: string; icon: typeof FiCommand }> = {
  shortcut: {
    title: "精準指尖",
    detail: "每次正確手勢，工作進度 +2",
    icon: FiCommand,
  },
  automation: {
    title: "AI 副手",
    detail: "每 3 秒自動處理一位桌面居民",
    icon: FiCpu,
  },
  focus: {
    title: "俐落手勢",
    detail: "手勢動作加快，正確命中進度 +1",
    icon: FiZap,
  },
};

function waypointFor(id: number, routeStep: number) {
  const xWave = 0.5 + 0.5 * Math.sin(id * 2.17 + routeStep * 1.63);
  const yWave = 0.5 + 0.5 * Math.cos(id * 1.31 + routeStep * 2.09);
  return {
    x: 2 + xWave * 75,
    y: 5 + yWave * 65,
  };
}

function variantForId(id: number): ReviewTokenVariant {
  const sequence: ReviewTokenVariant[] = [
    "file-courier",
    "typo-bug",
    "file-courier",
    "popup-slime",
    "file-courier",
    "crash-cloud",
    "typo-bug",
  ];
  return sequence[(id - 1) % sequence.length];
}

function createReviewToken(
  id: number,
  position: { x: number; y: number },
  forcedVariant?: ReviewTokenVariant,
): ReviewToken {
  const variant = forcedVariant ?? variantForId(id);
  const definition = TOKEN_DEFINITIONS[variant];
  const routeStep = 1;
  const destination = waypointFor(id, routeStep);
  const heading = Math.atan2((destination.y - position.y) * 0.72, destination.x - position.x);
  return {
    id,
    kind: definition.kind,
    variant,
    x: position.x,
    y: position.y,
    vx: Math.cos(heading) * definition.speed,
    vy: Math.sin(heading) * definition.speed * 0.72,
    heading,
    motionPhase: (id * 1.21) % (Math.PI * 2),
    destinationX: destination.x,
    destinationY: destination.y,
    retargetTicks: 100 + (id % 5) * 28,
    routeStep,
    rotation: ((id % 5) - 2) * 3,
    scale: definition.scale + (id % 3) * 0.025,
    label: definition.label,
    durability: definition.durability,
    maxDurability: definition.durability,
  };
}

const INITIAL_REVIEW_TOKENS: ReviewToken[] = [
  createReviewToken(1, TOKEN_SPAWN_POINTS[0], "file-courier"),
  createReviewToken(2, TOKEN_SPAWN_POINTS[1], "typo-bug"),
  createReviewToken(3, TOKEN_SPAWN_POINTS[2], "popup-slime"),
  createReviewToken(4, TOKEN_SPAWN_POINTS[3], "crash-cloud"),
];

export function OfficeWorkValueMinigame({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [phase, setPhase] = useState<WorkPhase>("intro");
  const [workValue, setWorkValue] = useState(0);
  const [milestoneIndex, setMilestoneIndex] = useState(0);
  const [reviewPower, setReviewPower] = useState(6);
  const [hasAiAssistant, setHasAiAssistant] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [reviewTokens, setReviewTokens] = useState<ReviewToken[]>(INITIAL_REVIEW_TOKENS);
  const [feedback, setFeedback] = useState("點完成檔案，劃過桌面小麻煩");
  const [feedbackTone, setFeedbackTone] = useState<"good" | "warn">("good");
  const [impact, setImpact] = useState<Impact | null>(null);
  const [gestureTrail, setGestureTrail] = useState<GestureTrail | null>(null);
  const [combo, setCombo] = useState(0);
  const [selectedUpgrades, setSelectedUpgrades] = useState<UpgradeId[]>([]);
  const tokenIdRef = useRef(5);
  const impactNonceRef = useRef(0);
  const reviewTokensRef = useRef<ReviewToken[]>(INITIAL_REVIEW_TOKENS);
  const gestureRef = useRef<GestureState | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const milestone = WORK_MILESTONES[Math.min(milestoneIndex, WORK_MILESTONES.length - 1)];
  const previousTarget = milestoneIndex <= 0 ? 0 : WORK_MILESTONES[milestoneIndex - 1]?.target ?? 0;
  const milestoneProgress = Math.max(
    0,
    Math.min(100, ((workValue - previousTarget) / Math.max(1, milestone.target - previousTarget)) * 100),
  );
  const totalProgress = Math.min(100, (workValue / WORK_MILESTONES.at(-1)!.target) * 100);
  const movementMultiplier = 1 + milestoneIndex * 0.12;
  const gestureDuration = selectedUpgrades.includes("focus") ? 360 : 500;
  const availableUpgrades = useMemo<UpgradeId[]>(
    () =>
      milestoneIndex === 0
        ? ["shortcut", "automation"]
        : selectedUpgrades.includes("automation")
          ? ["shortcut", "focus"]
          : ["automation", "focus"],
    [milestoneIndex, selectedUpgrades],
  );

  const showFeedback = useCallback((text: string, tone: "good" | "warn" = "good") => {
    setFeedback(text);
    setFeedbackTone(tone);
  }, []);

  const awardProgress = useCallback(
    (amount: number, message: string, countAsProcessed = true) => {
      setWorkValue((current) => current + amount);
      if (countAsProcessed) setProcessedCount((current) => current + 1);
      showFeedback(message);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(12);
    },
    [showFeedback],
  );

  const removeToken = useCallback((tokenId: number) => {
    reviewTokensRef.current = reviewTokensRef.current.filter((token) => token.id !== tokenId);
    setReviewTokens((current) => current.filter((token) => token.id !== tokenId));
  }, []);

  const damageToken = useCallback((tokenId: number) => {
    let damagedToken: ReviewToken | undefined;
    const nextTokens = reviewTokensRef.current.map((token) => {
      if (token.id !== tokenId) return token;
      const routeStep = token.routeStep + 2;
      const destination = waypointFor(token.id, routeStep);
      damagedToken = {
        ...token,
        durability: Math.max(1, token.durability - 1),
        heading: token.heading + Math.PI + (token.id % 2 === 0 ? 0.42 : -0.42),
        destinationX: destination.x,
        destinationY: destination.y,
        retargetTicks: 74,
        routeStep,
        rotation: token.rotation + (token.id % 2 === 0 ? 8 : -8),
      };
      return damagedToken;
    });
    reviewTokensRef.current = nextTokens;
    setReviewTokens(nextTokens);
    return damagedToken;
  }, []);

  useEffect(() => {
    reviewTokensRef.current = reviewTokens;
  }, [reviewTokens]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (workValue < milestone.target) return;
    setCombo(0);
    if (milestoneIndex >= WORK_MILESTONES.length - 1) {
      setPhase("complete");
      return;
    }
    setPhase("upgrade");
  }, [milestone.target, milestoneIndex, phase, workValue]);

  useEffect(() => {
    if (phase !== "playing") return;
    const movementTimer = window.setInterval(() => {
      setReviewTokens((current) => {
        const movedTokens = current.map((token) => {
          const definition = TOKEN_DEFINITIONS[token.variant];
          const motionPhase = token.motionPhase + 0.05;
          const distanceToDestination = Math.hypot(
            token.destinationX - token.x,
            (token.destinationY - token.y) * 0.72,
          );
          let routeStep = token.routeStep;
          let destinationX = token.destinationX;
          let destinationY = token.destinationY;
          let retargetTicks = token.retargetTicks - 1;
          if (retargetTicks <= 0 || distanceToDestination < 4.5) {
            routeStep += 1;
            const destination = waypointFor(token.id, routeStep);
            destinationX = destination.x;
            destinationY = destination.y;
            retargetTicks = 105 + ((token.id * 31 + routeStep * 17) % 125);
          }

          const desiredHeading = Math.atan2(
            (destinationY - token.y) * 0.72,
            destinationX - token.x,
          );
          const headingDelta = Math.atan2(
            Math.sin(desiredHeading - token.heading),
            Math.cos(desiredHeading - token.heading),
          );
          const steering = token.variant === "typo-bug" ? 0.14 : token.variant === "crash-cloud" ? 0.065 : 0.095;
          let heading =
            token.heading +
            headingDelta * steering +
            Math.sin(motionPhase * 0.82 + token.id * 0.73) * 0.012;
          const stride = 0.5 + 0.5 * Math.sin(motionPhase * (token.variant === "typo-bug" ? 1.8 : 1.05) + token.id);
          const naturalPause =
            token.variant === "crash-cloud"
              ? 0.43 + 0.57 * stride * stride
              : token.variant === "popup-slime"
                ? 0.58 + 0.42 * stride
                : 0.72 + 0.28 * stride;
          const speed = definition.speed * naturalPause * movementMultiplier;
          let vx = Math.cos(heading) * speed;
          let vy = Math.sin(heading) * speed * 0.72;
          let x = token.x + vx;
          let y = token.y + vy;
          if (x <= 1 || x >= 78) {
            x = Math.max(1, Math.min(78, x));
            heading = Math.PI - heading;
            vx = Math.cos(heading) * speed;
            retargetTicks = 0;
          }
          if (y <= 5 || y >= 71) {
            y = Math.max(5, Math.min(71, y));
            heading = -heading;
            vy = Math.sin(heading) * speed * 0.72;
            retargetTicks = 0;
          }
          const rotation = Math.max(-10, Math.min(10, vx * 27)) + Math.sin(motionPhase) * 1.8;
          return {
            ...token,
            x,
            y,
            vx,
            vy,
            heading,
            motionPhase,
            destinationX,
            destinationY,
            retargetTicks,
            routeStep,
            rotation,
          };
        });

        for (let firstIndex = 0; firstIndex < movedTokens.length; firstIndex += 1) {
          for (let secondIndex = firstIndex + 1; secondIndex < movedTokens.length; secondIndex += 1) {
            const first = movedTokens[firstIndex];
            const second = movedTokens[secondIndex];
            const dx = first.x - second.x;
            const dy = first.y - second.y;
            const distance = Math.max(0.01, Math.hypot(dx, dy));
            if (distance >= 14) continue;
            const push = (14 - distance) / 2;
            const pushX = (dx / distance) * push;
            const pushY = (dy / distance) * push;
            movedTokens[firstIndex] = {
              ...first,
              x: Math.max(1, Math.min(78, first.x + pushX)),
              y: Math.max(5, Math.min(71, first.y + pushY)),
              vx: -first.vx,
              vy: -first.vy,
              heading: first.heading + Math.PI,
              retargetTicks: Math.min(first.retargetTicks, 40),
            };
            movedTokens[secondIndex] = {
              ...second,
              x: Math.max(1, Math.min(78, second.x - pushX)),
              y: Math.max(5, Math.min(71, second.y - pushY)),
              vx: -second.vx,
              vy: -second.vy,
              heading: second.heading + Math.PI,
              retargetTicks: Math.min(second.retargetTicks, 40),
            };
          }
        }

        reviewTokensRef.current = movedTokens;
        return movedTokens;
      });
    }, 45);
    return () => window.clearInterval(movementTimer);
  }, [movementMultiplier, phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    const spawnTimer = window.setInterval(() => {
      setReviewTokens((current) => {
        if (current.length >= 6) return current;
        const position =
          TOKEN_SPAWN_POINTS.find((candidate) =>
            current.every((token) => Math.hypot(token.x - candidate.x, token.y - candidate.y) > 16),
          ) ?? TOKEN_SPAWN_POINTS[tokenIdRef.current % TOKEN_SPAWN_POINTS.length];
        const nextId = tokenIdRef.current;
        tokenIdRef.current += 1;
        return [...current, createReviewToken(nextId, position)];
      });
    }, 1150);
    return () => window.clearInterval(spawnTimer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing" || !hasAiAssistant) return;
    const assistantTimer = window.setInterval(() => {
      const token = reviewTokensRef.current[0];
      if (!token) return;
      const amount = Math.max(3, Math.floor(reviewPower / 2));
      removeToken(token.id);
      awardProgress(amount, `AI 副手已${token.kind === "idea" ? "採用" : "退件"}「${token.label}」`);
    }, 3000);
    return () => window.clearInterval(assistantTimer);
  }, [awardProgress, hasAiAssistant, phase, removeToken, reviewPower]);

  const registerImpact = useCallback(
    (
      token: ReviewToken,
      gesture: ReviewGesture,
      correct: boolean,
      amount: number,
      targetElement?: HTMLElement,
      remainingHits?: number,
    ) => {
      const stageRect = stageRef.current?.getBoundingClientRect();
      const targetRect = targetElement?.getBoundingClientRect();
      const x =
        stageRect && targetRect
          ? ((targetRect.left + targetRect.width / 2 - stageRect.left) / stageRect.width) * 100
          : token.x + 10;
      const y =
        stageRect && targetRect
          ? ((targetRect.top + targetRect.height / 2 - stageRect.top) / stageRect.height) * 100
          : token.y + 10;
      impactNonceRef.current += 1;
      setImpact({
        nonce: impactNonceRef.current,
        tokenId: token.id,
        x,
        y,
        amount,
        correct,
        gesture,
        variant: token.variant,
        remainingHits,
      });
    },
    [],
  );

  const resolveGesture = useCallback(
    (token: ReviewToken, gesture: ReviewGesture, targetElement?: HTMLElement) => {
      if (phase !== "playing") return;
      const correct =
        (gesture === "tap" && token.kind === "idea") ||
        (gesture === "slash" && token.kind === "noise");

      if (!correct) {
        registerImpact(token, gesture, false, 0, targetElement);
        setCombo(0);
        showFeedback(
          token.kind === "idea" ? "完成檔案只要點一下送出" : "桌面小麻煩要快速劃過",
          "warn",
        );
        if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([12, 28, 12]);
        return;
      }

      if (token.durability > 1) {
        const amount = Math.max(2, Math.floor(reviewPower / 2));
        const remainingHits = token.durability - 1;
        damageToken(token.id);
        registerImpact(token, gesture, true, amount, targetElement, remainingHits);
        setCombo((current) => current + 1);
        awardProgress(
          amount,
          `劃掉「${token.label}」一層，還要 ${remainingHits} 次`,
          false,
        );
        if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([16, 24, 10]);
        return;
      }

      const amount = reviewPower;
      registerImpact(token, gesture, true, amount, targetElement, 0);
      removeToken(token.id);
      setCombo((current) => current + 1);
      awardProgress(
        amount,
        gesture === "tap" ? `點一下送出「${token.label}」` : `處理完成「${token.label}」`,
      );
    },
    [awardProgress, damageToken, phase, registerImpact, removeToken, reviewPower, showFeedback],
  );

  const handleStagePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (phase !== "playing") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const tokenElement = (event.target as HTMLElement).closest<HTMLElement>("[data-review-token-id]");
    const parsedTokenId = Number(tokenElement?.dataset.reviewTokenId);
    gestureRef.current = {
      tokenId: Number.isFinite(parsedTokenId) ? parsedTokenId : null,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
    };
    setGestureTrail(null);
  };

  const handleStagePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gesture.lastClientX = event.clientX;
    gesture.lastClientY = event.clientY;
    const distance = Math.hypot(
      gesture.lastClientX - gesture.startClientX,
      gesture.lastClientY - gesture.startClientY,
    );
    const stageRect = stageRef.current?.getBoundingClientRect();
    if (!stageRect || distance < 7) return;
    setGestureTrail({
      startX: gesture.startClientX - stageRect.left,
      startY: gesture.startClientY - stageRect.top,
      endX: gesture.lastClientX - stageRect.left,
      endY: gesture.lastClientY - stageRect.top,
    });
  };

  const finishStageGesture = (event: ReactPointerEvent<HTMLElement>) => {
    const gestureState = gestureRef.current;
    if (!gestureState || gestureState.pointerId !== event.pointerId) return;
    const distance = Math.hypot(
      event.clientX - gestureState.startClientX,
      event.clientY - gestureState.startClientY,
    );
    gestureRef.current = null;
    setGestureTrail(null);
    const gesture: ReviewGesture = distance >= 34 ? "slash" : "tap";
    const stageElement = stageRef.current;
    if (!stageElement) return;

    let targetTokenId = gestureState.tokenId;
    let targetElement: HTMLElement | undefined;

    if (gesture === "slash") {
      const start = { x: gestureState.startClientX, y: gestureState.startClientY };
      const end = { x: event.clientX, y: event.clientY };
      const segmentLengthSquared = Math.max(1, (end.x - start.x) ** 2 + (end.y - start.y) ** 2);
      const crossedTokens = Array.from(
        stageElement.querySelectorAll<HTMLElement>("[data-review-token-id]"),
      )
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          const projection = Math.max(
            0,
            Math.min(
              1,
              ((center.x - start.x) * (end.x - start.x) +
                (center.y - start.y) * (end.y - start.y)) /
                segmentLengthSquared,
            ),
          );
          const closestPoint = {
            x: start.x + (end.x - start.x) * projection,
            y: start.y + (end.y - start.y) * projection,
          };
          const distanceToLine = Math.hypot(center.x - closestPoint.x, center.y - closestPoint.y);
          const id = Number(element.dataset.reviewTokenId);
          const token = reviewTokensRef.current.find((item) => item.id === id);
          return { element, token, distanceToLine };
        })
        .filter(
          (candidate): candidate is { element: HTMLElement; token: ReviewToken; distanceToLine: number } =>
            Boolean(candidate.token) && candidate.distanceToLine <= 43,
        )
        .sort((first, second) => {
          if (first.token.kind !== second.token.kind) return first.token.kind === "noise" ? -1 : 1;
          return first.distanceToLine - second.distanceToLine;
        });
      const crossedTarget = crossedTokens[0];
      targetTokenId = crossedTarget?.token.id ?? null;
      targetElement = crossedTarget?.element;
    } else if (targetTokenId !== null) {
      targetElement = stageElement.querySelector<HTMLElement>(
        `[data-review-token-id="${targetTokenId}"]`,
      ) ?? undefined;
    }

    if (targetTokenId === null) {
      showFeedback(gesture === "slash" ? "手勢有劃到，但還沒經過小麻煩" : "點到完成檔案才算送出", "warn");
      return;
    }
    const latestToken = reviewTokensRef.current.find((item) => item.id === targetTokenId);
    if (!latestToken) return;
    resolveGesture(latestToken, gesture, targetElement);
  };

  const cancelStageGesture = () => {
    gestureRef.current = null;
    setGestureTrail(null);
  };

  const handleTokenKeyDown = (
    event: ReactKeyboardEvent<HTMLElement>,
    token: ReviewToken,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    resolveGesture(token, token.kind === "idea" ? "tap" : "slash", event.currentTarget);
  };

  const chooseUpgrade = (upgradeId: UpgradeId) => {
    setSelectedUpgrades((current) => [...current, upgradeId]);
    if (upgradeId === "shortcut") setReviewPower((current) => current + 2);
    if (upgradeId === "automation") setHasAiAssistant(true);
    if (upgradeId === "focus") setReviewPower((current) => current + 1);
    setMilestoneIndex((current) => current + 1);
    showFeedback("新一批桌面居民出現了，繼續分流");
    setPhase("playing");
  };

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={76}
      direction="column"
      overflow="hidden"
      bgColor="#13202A"
      backgroundImage="radial-gradient(circle at 50% 5%, rgba(114,173,178,0.28), transparent 36%), linear-gradient(160deg, #20333D 0%, #111921 74%)"
      color="white"
      data-office-work-phase={phase}
      data-gesture-active={gestureRef.current ? "true" : "false"}
    >
      <Flex px="17px" pt="14px" pb="10px" direction="column" gap="8px" flexShrink={0}>
        <Flex alignItems="center" justifyContent="space-between" gap="10px">
          <Box minW="0">
            <Text color="#8ED7C1" fontSize="9px" fontWeight="900" letterSpacing="0.13em">
              工作者的 AI 電腦桌面
            </Text>
            <Text mt="1px" fontSize="20px" fontWeight="900" lineHeight="1.2">
              處理今天的桌面小居民
            </Text>
          </Box>
          <Flex
            flexShrink={0}
            alignItems="center"
            gap="6px"
            px="9px"
            py="6px"
            borderRadius="999px"
            bgColor="rgba(255,255,255,0.09)"
          >
            <FiCpu size={14} />
            <Text fontSize="11px" fontWeight="900">AI 生成中</Text>
          </Flex>
        </Flex>

        <Box h="7px" borderRadius="999px" overflow="hidden" bgColor="rgba(255,255,255,0.1)">
          <Box
            h="100%"
            w={`${totalProgress}%`}
            bg="linear-gradient(90deg, #55B59B, #A6E6C8)"
            transition="width 180ms ease"
          />
        </Box>
      </Flex>

      <Flex flex="1" minH="0" direction="column" px="13px" pb="13px" gap="8px">
        <Flex gap="6px" flexShrink={0}>
          {WORK_MILESTONES.map((item, index) => {
            const done = workValue >= item.target;
            const active = index === milestoneIndex && phase !== "complete";
            return (
              <Flex
                key={item.id}
                flex="1"
                minW="0"
                direction="column"
                px="8px"
                py="6px"
                borderRadius="9px"
                border={active ? "1px solid rgba(142,215,193,0.72)" : "1px solid rgba(255,255,255,0.08)"}
                bgColor={done ? "rgba(77,153,128,0.3)" : "rgba(255,255,255,0.055)"}
              >
                <Text color={done ? "#A7E8CE" : "rgba(255,255,255,0.58)"} fontSize="8px" fontWeight="900">
                  {done ? "完成" : `${item.target} 進度`}
                </Text>
                <Text mt="1px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" fontSize="9px" fontWeight="800">
                  {item.label}
                </Text>
              </Flex>
            );
          })}
        </Flex>

        <Flex
          flex="1"
          minH="0"
          direction="column"
          position="relative"
          borderRadius="17px"
          border="5px solid #29343A"
          bgColor="#DCE4DF"
          boxShadow="inset 0 0 0 1px rgba(255,255,255,0.16), 0 14px 30px rgba(0,0,0,0.28)"
          overflow="hidden"
        >
          <Flex
            h="31px"
            flexShrink={0}
            px="10px"
            alignItems="center"
            justifyContent="space-between"
            bgColor="#31464C"
            color="#DDEEE8"
            borderBottom="1px solid rgba(0,0,0,0.22)"
          >
            <Flex alignItems="center" gap="6px">
              <Flex gap="4px" aria-hidden="true">
                <Box w="6px" h="6px" borderRadius="50%" bgColor="#DB8377" />
                <Box w="6px" h="6px" borderRadius="50%" bgColor="#E1BD71" />
                <Box w="6px" h="6px" borderRadius="50%" bgColor="#74B69A" />
              </Flex>
              <Text fontSize="8px" fontWeight="900" letterSpacing="0.08em">DESKTOP_INBOX</Text>
            </Flex>
            <Flex alignItems="center" gap="4px">
              <FiInbox size={11} />
              <Text fontSize="9px" fontWeight="900">{reviewTokens.length}</Text>
            </Flex>
          </Flex>

          <Box
            ref={stageRef}
            flex="1"
            minH="0"
            position="relative"
            backgroundImage="radial-gradient(circle at 18% 14%, rgba(255,255,255,0.62), transparent 22%), linear-gradient(150deg, #BFD4CF 0%, #8FB2B0 50%, #6D9497 100%)"
            overflow="hidden"
            touchAction="none"
            onPointerDown={handleStagePointerDown}
            onPointerMove={handleStagePointerMove}
            onPointerUp={finishStageGesture}
            onPointerCancel={cancelStageGesture}
          >
            <Flex
              position="absolute"
              top="8px"
              left="50%"
              transform="translateX(-50%)"
              zIndex={30}
              maxW="88%"
              px="10px"
              py="5px"
              alignItems="center"
              gap="6px"
              borderRadius="999px"
              bgColor={feedbackTone === "good" ? "rgba(37,77,75,0.86)" : "rgba(126,63,79,0.9)"}
              boxShadow="0 5px 14px rgba(25,50,53,0.2)"
              pointerEvents="none"
            >
              {feedbackTone === "good" ? <FiCheck size={11} /> : <FiX size={11} />}
              <Text overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" fontSize="9px" fontWeight="800">
                {feedback}
              </Text>
            </Flex>

            {combo >= 2 ? (
              <Flex
                position="absolute"
                top="42px"
                right="9px"
                zIndex={24}
                px="8px"
                py="4px"
                borderRadius="999px"
                bgColor="rgba(255,238,166,0.9)"
                color="#69551E"
                pointerEvents="none"
              >
                <Text fontSize="9px" fontWeight="900">連續命中 ×{combo}</Text>
              </Flex>
            ) : null}

            {reviewTokens.map((token) => {
              const definition = TOKEN_DEFINITIONS[token.variant];
              const characterAnimation =
                token.variant === "file-courier"
                  ? `${ideaBob} 900ms ease-in-out infinite`
                  : token.variant === "typo-bug"
                    ? `${noiseJitter} 620ms ease-in-out infinite`
                    : token.variant === "popup-slime"
                      ? `${popupWobble} 1180ms ease-in-out infinite`
                      : `${cloudTrudge} 1480ms ease-in-out infinite`;
              return (
                <Flex
                  as="button"
                  key={token.id}
                  aria-label={`${token.kind === "idea" ? "點擊採用" : "劃切退件"}${token.label}`}
                  data-review-token-id={token.id}
                  data-review-token-variant={token.variant}
                  data-review-token-durability={token.durability}
                  data-review-token-max-durability={token.maxDurability}
                  position="absolute"
                  left={`${token.x}%`}
                  top={`${token.y}%`}
                  zIndex={8}
                  w="78px"
                  h="83px"
                  direction="column"
                  alignItems="center"
                  justifyContent="center"
                  cursor={phase === "playing" ? "crosshair" : "default"}
                  transform={`rotate(${token.rotation}deg) scale(${token.scale})`}
                  transformOrigin="center"
                  transition="left 70ms linear, top 70ms linear, filter 140ms ease"
                  animation={`${tokenIn} 260ms ease both`}
                  filter={token.kind === "idea" ? "drop-shadow(0 0 7px rgba(255,226,105,0.56)) drop-shadow(0 8px 7px rgba(31,64,66,0.28))" : "drop-shadow(0 8px 7px rgba(31,64,66,0.28))"}
                  touchAction="none"
                  userSelect="none"
                  outline="none"
                  _focusVisible={{ boxShadow: "0 0 0 3px rgba(255,245,190,0.9)", borderRadius: "50%" }}
                  onKeyDown={(event) => handleTokenKeyDown(event, token)}
                >
                  <Flex
                    direction="column"
                    alignItems="center"
                    justifyContent="center"
                    animation={characterAnimation}
                    pointerEvents="none"
                  >
                    {token.maxDurability > 1 ? (
                      <Flex mb="-2px" gap="3px" px="5px" py="3px" borderRadius="999px" bgColor="rgba(250,247,238,0.92)" boxShadow="0 3px 8px rgba(34,52,57,0.18)">
                        {Array.from({ length: token.maxDurability }, (_, index) => (
                          <Box
                            key={index}
                            w="12px"
                            h="5px"
                            borderRadius="999px"
                            bgColor={index < token.durability ? "#F28B6D" : "rgba(65,77,84,0.2)"}
                          />
                        ))}
                      </Flex>
                    ) : null}
                    <Box
                      key={`${token.id}-${token.durability}`}
                      animation={token.durability < token.maxDurability ? `${damageShock} 420ms steps(4, end) both` : undefined}
                    >
                      <PixelDesktopCharacter
                        variant={token.variant}
                        damage={token.maxDurability - token.durability}
                      />
                    </Box>
                    <Text
                      mt="-10px"
                      px="7px"
                      py="2px"
                      borderRadius="999px"
                      bgColor={definition.tagColor}
                      color="white"
                      fontSize="8px"
                      fontWeight="900"
                      whiteSpace="nowrap"
                    >
                      {token.label}
                    </Text>
                  </Flex>
                </Flex>
              );
            })}

            {gestureTrail ? (
              <Box
                position="absolute"
                left={`${gestureTrail.startX}px`}
                top={`${gestureTrail.startY}px`}
                zIndex={42}
                w={`${Math.hypot(gestureTrail.endX - gestureTrail.startX, gestureTrail.endY - gestureTrail.startY)}px`}
                h="9px"
                borderRadius="999px"
                transform={`rotate(${Math.atan2(gestureTrail.endY - gestureTrail.startY, gestureTrail.endX - gestureTrail.startX) * (180 / Math.PI)}deg)`}
                transformOrigin="0 50%"
                bg="linear-gradient(90deg, rgba(223,190,255,0.18), rgba(234,210,255,0.96), rgba(255,255,255,0.28))"
                boxShadow="0 0 13px rgba(211,168,244,0.82)"
                pointerEvents="none"
              />
            ) : null}

            {impact ? (
              <Box
                key={impact.nonce}
                position="absolute"
                left={`${impact.x}%`}
                top={`${impact.y}%`}
                zIndex={50}
                w="1px"
                h="1px"
                pointerEvents="none"
              >
                <Box
                  position="absolute"
                  left="0"
                  top="0"
                  w="58px"
                  h="58px"
                  borderRadius="50%"
                  border={`5px solid ${impact.correct ? (impact.gesture === "tap" ? "#FFF2A8" : "#D7A8FF") : "#F48E9F"}`}
                  animation={`${hitRipple} 420ms ease-out both`}
                />

                {impact.gesture === "slash" ? (
                  <Box
                    position="absolute"
                    left="0"
                    top="0"
                    w="150px"
                    h="10px"
                    borderRadius="999px"
                    transformOrigin="center"
                    bg="linear-gradient(90deg, transparent, #EBD3FF 18%, white 52%, #B77DDD 82%, transparent)"
                    boxShadow="0 0 15px rgba(208,157,245,0.85)"
                    animation={`${slashStreak} 470ms ease-out both`}
                  />
                ) : null}

                {impact.correct
                  ? SHARD_VECTORS.slice(
                      0,
                      impact.remainingHits && impact.remainingHits > 0
                        ? 7
                        : SHARD_VECTORS.length,
                    ).map((shard, index) => (
                      <Box
                        key={`shard-${index}`}
                        position="absolute"
                        left="0"
                        top="0"
                        zIndex={51}
                        w={`${shard.size}px`}
                        h={`${Math.max(5, shard.size - (index % 3) * 2)}px`}
                        bgColor={TOKEN_DEFINITIONS[impact.variant].shardColors[index % 3]}
                        boxShadow="0 2px 0 rgba(30,40,50,0.2)"
                        animation={`${pixelShatter} ${impact.remainingHits && impact.remainingHits > 0 ? 520 : 720}ms steps(7, end) both`}
                        style={
                          {
                            "--shard-x": `${shard.x}px`,
                            "--shard-y": `${shard.y}px`,
                            "--shard-r": `${shard.r}deg`,
                          } as CSSProperties
                        }
                      />
                    ))
                  : null}

                {impact.correct
                  ? [0, 60, 120, 180, 240, 300].map((angle) => (
                      <Box
                        key={angle}
                        position="absolute"
                        left="-3px"
                        top="-4px"
                        transform={`rotate(${angle}deg)`}
                        transformOrigin="3px 4px"
                      >
                        <Box
                          w="6px"
                          h="13px"
                          borderRadius="999px"
                          bgColor={impact.gesture === "tap" ? "#FFF0A0" : "#C899F0"}
                          animation={`${particleFly} 470ms ease-out both`}
                        />
                      </Box>
                    ))
                  : null}

                <Box
                  position="absolute"
                  left={impact.gesture === "tap" ? "-47px" : "-70px"}
                  top={impact.gesture === "tap" ? "-170px" : "-90px"}
                  w={impact.gesture === "tap" ? "220px" : "230px"}
                  transformOrigin={impact.gesture === "tap" ? "47px 170px" : "80px 90px"}
                  animation={`${impact.gesture === "tap" ? tapMotion : slashMotion} ${gestureDuration}ms cubic-bezier(.2,.78,.24,1) both`}
                  filter="drop-shadow(0 12px 12px rgba(28,44,50,0.35))"
                >
                  <img
                    src={impact.gesture === "tap" ? TAP_HAND_IMAGE : SLASH_HAND_IMAGE}
                    alt=""
                    draggable={false}
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                </Box>

                <Flex
                  position="absolute"
                  left="0"
                  top="-8px"
                  w="27px"
                  h="27px"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="50%"
                  transform="translate(-50%, -50%)"
                  bgColor={impact.correct ? (impact.gesture === "tap" ? "#4E9B84" : "#75518B") : "#B55468"}
                  color="white"
                  boxShadow="0 5px 12px rgba(31,64,66,0.32)"
                >
                  {impact.correct ? <FiCheck size={15} /> : <FiX size={15} />}
                </Flex>

                <Text
                  position="absolute"
                  left="0"
                  top="-12px"
                  zIndex={52}
                  color={impact.correct ? "#FFF2A8" : "#FFD1D8"}
                  fontSize="22px"
                  fontWeight="900"
                  textShadow="0 3px 10px rgba(31,64,66,0.62)"
                  whiteSpace="nowrap"
                  animation={`${valueBurst} 690ms ease-out both`}
                >
                  {impact.correct
                    ? impact.remainingHits && impact.remainingHits > 0
                      ? `還有 ${impact.remainingHits}`
                      : `+${impact.amount}`
                    : impact.gesture === "tap"
                      ? "劃一下！"
                      : "點一下！"}
                </Text>
              </Box>
            ) : null}

            <Flex
              position="absolute"
              left="9px"
              right="9px"
              bottom="9px"
              zIndex={19}
              direction="column"
              gap="5px"
              px="9px"
              py="7px"
              borderRadius="12px"
              bgColor="rgba(235,244,239,0.91)"
              color="#345451"
              boxShadow="0 6px 15px rgba(31,64,66,0.18)"
              pointerEvents="none"
            >
              <Flex alignItems="center" justifyContent="space-between" gap="6px">
                <Text fontSize="8px" fontWeight="900">{milestone.label}</Text>
                <Text color="#397664" fontSize="9px" fontWeight="900">{Math.min(workValue, milestone.target)} / {milestone.target}</Text>
              </Flex>
              <Box h="5px" borderRadius="999px" overflow="hidden" bgColor="rgba(48,83,79,0.14)">
                <Box h="100%" w={`${milestoneProgress}%`} bgColor="#63B198" transition="width 140ms ease" />
              </Box>
            </Flex>
          </Box>

          <Flex
            h="55px"
            flexShrink={0}
            px="8px"
            alignItems="center"
            gap="7px"
            bgColor="#EAE6D9"
            color="#5D5B52"
            borderTop="1px solid rgba(71,82,76,0.14)"
          >
            <Flex
              flex="1"
              h="39px"
              alignItems="center"
              justifyContent="center"
              gap="7px"
              borderRadius="11px"
              border="1px solid #B7CEC4"
              bgColor="#E0EEE7"
              color="#3F7668"
            >
              <Flex w="21px" h="21px" borderRadius="7px" alignItems="center" justifyContent="center" bgColor="rgba(78,155,132,0.16)"><FiMousePointer size={13} /></Flex>
              <Text fontSize="10px" fontWeight="900">完成檔案：點一下</Text>
            </Flex>
            <Flex
              flex="1"
              h="39px"
              alignItems="center"
              justifyContent="center"
              gap="7px"
              borderRadius="11px"
              border="1px solid #CCB9D5"
              bgColor="#EEE5F1"
              color="#6E4A80"
            >
              <Flex w="21px" h="21px" borderRadius="7px" alignItems="center" justifyContent="center" bgColor="rgba(117,81,139,0.14)"><FiZap size={13} /></Flex>
              <Text fontSize="10px" fontWeight="900">小麻煩：劃過去</Text>
            </Flex>
          </Flex>
        </Flex>

        <Flex flexShrink={0} alignItems="center" justifyContent="space-between" px="4px">
          <Flex alignItems="center" gap="5px" color="rgba(255,255,255,0.62)">
            <FiMousePointer size={11} />
            <Text fontSize="9px" fontWeight="800">已處理 {processedCount} 位桌面居民</Text>
          </Flex>
          <Text color="#A7E8CE" fontSize="10px" fontWeight="900">
            工作進度 {Math.floor(workValue)} / 90
          </Text>
        </Flex>
      </Flex>

      {phase === "intro" ? (
        <Flex position="absolute" inset="0" zIndex={60} px="18px" alignItems="center" justifyContent="center" bgColor="rgba(7,11,15,0.78)" backdropFilter="blur(5px)">
          <Flex w="100%" direction="column" gap="10px" p="17px" borderRadius="18px" bgColor="#F7F2E8" color="#3D3732" boxShadow="0 24px 48px rgba(0,0,0,0.4)" animation={`${panelIn} 260ms ease both`}>
            <Flex alignItems="center" gap="10px">
              <Flex w="44px" h="44px" flexShrink={0} borderRadius="13px" bgColor="#4E8D7C" color="white" alignItems="center" justifyContent="center"><FiTrendingUp size={22} /></Flex>
              <Box>
                <Text color="#4E8D7C" fontSize="9px" fontWeight="900" letterSpacing="0.12em">電腦桌面開始熱鬧了</Text>
                <Text fontSize="19px" fontWeight="900">幫桌面居民分流</Text>
              </Box>
            </Flex>
            <Text color="#71665C" fontSize="11px" fontWeight="700" lineHeight="1.55">
              角色會自己找路、停頓和逃跑。不用切換工具：完成檔案用點的；錯字、彈窗和當機用劃的。
            </Text>
            <Flex flexWrap="wrap" gap="8px">
              {INTRO_TOKEN_ORDER.map((variant) => {
                const definition = TOKEN_DEFINITIONS[variant];
                const instruction =
                  variant === "file-courier" ? "點一下送出" : `劃 ${definition.durability} 次`;
                return (
                  <Flex
                    key={variant}
                    w="calc(50% - 4px)"
                    minW="0"
                    h="82px"
                    alignItems="center"
                    gap="5px"
                    px="7px"
                    borderRadius="12px"
                    bgColor={definition.kind === "idea" ? "#E3EFE6" : "#ECE3EF"}
                  >
                    <Box flexShrink={0} aria-label={definition.label}>
                      <PixelDesktopCharacter variant={variant} size={48} />
                    </Box>
                    <Box minW="0">
                      <Text fontSize="10px" fontWeight="900" whiteSpace="nowrap">{definition.label}</Text>
                      <Text mt="2px" color={definition.kind === "idea" ? "#3E7C6C" : "#725086"} fontSize="9px" fontWeight="900">{instruction}</Text>
                    </Box>
                  </Flex>
                );
              })}
            </Flex>
            <Flex as="button" h="45px" borderRadius="12px" bgColor="#4E8D7C" color="white" alignItems="center" justifyContent="center" onClick={() => setPhase("playing")}>
              <Text fontSize="14px" fontWeight="900">開始整理電腦桌面</Text>
            </Flex>
            <Text as="button" color="#9A8B7D" fontSize="11px" fontWeight="800" onClick={onSkip}>略過工作小遊戲</Text>
          </Flex>
        </Flex>
      ) : null}

      {phase === "upgrade" ? (
        <Flex position="absolute" inset="0" zIndex={60} px="20px" alignItems="center" justifyContent="center" bgColor="rgba(7,11,15,0.78)" backdropFilter="blur(5px)">
          <Flex w="100%" direction="column" gap="13px" p="20px" borderRadius="18px" bgColor="#F7F2E8" color="#3D3732" boxShadow="0 24px 48px rgba(0,0,0,0.4)" animation={`${panelIn} 260ms ease both`}>
            <Box>
              <Text color="#4E8D7C" fontSize="10px" fontWeight="900" letterSpacing="0.13em">本輪判讀完成</Text>
              <Text mt="4px" fontSize="22px" fontWeight="900">替你的手勢選一項增益</Text>
            </Box>
            {availableUpgrades.map((upgradeId) => {
              const copy = UPGRADE_COPY[upgradeId];
              const Icon = copy.icon;
              return (
                <Flex key={upgradeId} as="button" minH="68px" p="12px" borderRadius="13px" alignItems="center" gap="12px" textAlign="left" bgColor="#E9E1D4" border="1px solid #D7C9B6" onClick={() => chooseUpgrade(upgradeId)}>
                  <Flex w="42px" h="42px" borderRadius="12px" flexShrink={0} bgColor="#4E8D7C" color="white" alignItems="center" justifyContent="center"><Icon size={20} /></Flex>
                  <Box>
                    <Text fontSize="15px" fontWeight="900">{copy.title}</Text>
                    <Text mt="2px" color="#796C60" fontSize="12px" fontWeight="700">{copy.detail}</Text>
                  </Box>
                </Flex>
              );
            })}
          </Flex>
        </Flex>
      ) : null}

      {phase === "complete" ? (
        <Flex position="absolute" inset="0" zIndex={62} px="24px" alignItems="center" justifyContent="center" bgColor="rgba(7,11,15,0.82)" backdropFilter="blur(6px)">
          <Flex w="100%" direction="column" alignItems="center" textAlign="center" gap="12px" p="24px" borderRadius="20px" bgColor="#EFF8F4" color="#2F433D" animation={`${panelIn} 260ms ease both, ${completionGlow} 2200ms ease-in-out infinite`}>
            <Flex w="70px" h="70px" borderRadius="50%" bgColor="#4E9B84" color="white" alignItems="center" justifyContent="center"><FiCheck size={31} /></Flex>
            <Text mt="4px" fontSize="25px" fontWeight="900">今日 AI 判讀完成</Text>
            <Text color="#64756F" fontSize="13px" fontWeight="700" lineHeight="1.65">
              你用手勢處理了 {processedCount} 位桌面居民，工作進度達到 {Math.floor(workValue)}。完成檔案都送出了。
            </Text>
            <Flex as="button" mt="7px" w="100%" h="48px" borderRadius="13px" bgColor="#4E8D7C" color="white" alignItems="center" justifyContent="center" onClick={onComplete}>
              <Text fontSize="14px" fontWeight="900">送出成果，前往便利商店</Text>
            </Flex>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}
