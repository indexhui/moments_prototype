"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Flex, Grid, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useRouter } from "next/navigation";
import { IoClose } from "react-icons/io5";
import { FaMusic } from "react-icons/fa";
import {
  FaCoins,
  FaCommentDots,
  FaDoorOpen,
  FaDroplet,
  FaMoon,
} from "react-icons/fa6";
import { ROUTES } from "@/lib/routes";
import {
  AFTER_REWARD_SCENE_ID,
  getChapterScenesUntilScene,
  type GameScene,
  type StoryComicImageId,
  type StoryComicOverlay,
} from "@/lib/game/scenes";
import { StoryDialogPanel } from "@/components/game/StoryDialogPanel";
import { NarrativeFocusLayer } from "@/components/game/NarrativeFocusLayer";
import { DiaryOverlay, type DiaryOverlayMode } from "@/components/game/DiaryOverlay";
import { DialogQuickActions } from "@/components/game/events/DialogQuickActions";
import { EventHistoryOverlay } from "@/components/game/events/EventHistoryOverlay";
import { EventBackgroundFxLayer } from "@/components/game/events/EventBackgroundFxLayer";
import { useBackgroundShake } from "@/components/game/events/useBackgroundShake";
import { WorkMinigameTestModal } from "@/components/game/events/WorkMinigameTestModal";
import { WorkStampMinigameModal } from "@/components/game/events/WorkStampMinigameModal";
import { WorkTransitionModal } from "@/components/game/events/WorkTransitionModal";
import { ReturnHomeTransitionOverlay } from "@/components/game/events/ReturnHomeTransitionOverlay";
import {
  EventDialogPanel,
  EVENT_DIALOG_HEIGHT,
} from "@/components/game/events/EventDialogPanel";
import {
  EventPhotoCaptureLayer,
  type NaturalImageSize,
  type PhotoCaptureResult,
} from "@/components/game/events/EventPhotoCaptureLayer";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import { SceneLocationDiscoveryBanner } from "@/components/game/SceneLocationDiscoveryBanner";
import { ArrangeRouteMapOverlay } from "@/components/game/ArrangeRouteMapOverlay";
import {
  UnlockFeedbackOverlay,
  type UnlockFeedbackItem,
} from "@/components/game/UnlockFeedbackOverlay";
import { type PlayerStatus } from "@/lib/game/playerStatus";
import {
  GAME_AVATAR_EXPRESSION_TRIGGER,
  GAME_AVATAR_MOTION_TRIGGER,
} from "@/lib/game/avatarCheatBus";
import { GAME_BACKGROUND_SHAKE_TRIGGER } from "@/lib/game/backgroundShakeBus";
import {
  GAME_SCENE_TRANSITION_TRIGGER,
  type SceneTransitionPayload,
} from "@/lib/game/sceneTransitionBus";
import {
  claimOffworkRewardBatch,
  FIRST_OFFWORK_REWARD_PATTERN,
  FIRST_STREET_REWARD_PATTERNS,
  generateOffworkRewardPattern,
  getPlaceUnlockSnapshot,
  loadPlayerProgress,
  markDiaryFirstRevealSeen,
  rolloverDailyEventFlags,
  savePlayerProgress,
  saveWorkTaskProgress,
  setEncounteredCharacter,
  unlockDiaryEntry,
  recordPhotoCapture,
  recordWorkShiftResult,
  type PlaceTileId,
  type RewardPlaceTile,
  type TilePattern3x3,
} from "@/lib/game/playerProgress";
import {
  getWorkMinigameKindForSceneId,
  isWorkTransitionSceneId,
  DEFAULT_WORK_TRANSITION_FATIGUE_INCREASE_TOTAL,
  shouldOpenWorkMinigameForSceneId,
  type WorkMinigameKind,
} from "@/lib/game/workTransition";
import {
  GAME_WORK_MINIGAME_CHEAT_TRIGGER,
  WORK_MINIGAME_CHEAT_KIND_STORAGE_KEY,
  type WorkMinigameCheatPayload,
} from "@/lib/game/workMinigameCheatBus";
import {
  GAME_DIALOG_TYPING_MODE_CHANGE,
  loadDialogTypingMode,
  saveDialogTypingMode,
  type DialogTypingMode,
} from "@/lib/game/dialogTyping";
import { AVATAR_MOTION_DURATION_MS } from "@/lib/game/avatarPerformance";
import {
  shouldShowNarrativeFocus,
  shouldUseNarrativePauseTyping,
} from "@/lib/game/narrativeMode";

const GAME_COMIC_CHEAT_TRIGGER = "moment:comic-cheat-trigger";
const ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_SEEN_KEY = "moment:arrange-route-place-mission-tutorial-seen";
const LEGACY_ROUTE_TUTORIAL_SCENE_ID = "__legacy-scene-41";
const LEGACY_QA_SCENE_ID = "__legacy-scene-44";
const LEGACY_NIGHT_HUB_SCENE_ID = "scene-night-hub";
const NAOTARO_STICKER_IDS = new Set(["naotaro-basic", "naotaro-smile", "naotaro-rare"]);
const FIRST_STREET_REWARD_LABELS = ["巷口街道", "騎樓街道", "轉角街道"] as const;

function hasFirstStreetRewardPatterns(rewardTiles: RewardPlaceTile[]) {
  const existingPatternKeys = new Set(
    rewardTiles
      .filter((tile) => tile.category === "place" && tile.sourceId === "street")
      .map((tile) => tilePatternKey(tile.pattern)),
  );
  return FIRST_STREET_REWARD_PATTERNS.every((pattern) =>
    existingPatternKeys.has(tilePatternKey(pattern)),
  );
}

function hasCollectedFirstSunbeast(progress: ReturnType<typeof loadPlayerProgress>) {
  return (
    progress.hasSeenSunbeastFirstReveal ||
    progress.lastDogPhotoCapture !== null ||
    progress.stickerCollection.some((stickerId) => NAOTARO_STICKER_IDS.has(stickerId))
  );
}

function shouldShowFirstSunbeastNightHubGuide(progress: ReturnType<typeof loadPlayerProgress>) {
  return (
    hasCollectedFirstSunbeast(progress) &&
    (progress.hasPendingFirstSunbeastNightHubGuide ||
      !progress.hasSeenFirstSunbeastNightHubGuideV3)
  );
}
const DIARY_CONVERSATION_SCENE_IDS = new Set([
  "scene-89",
  "scene-90",
  "scene-91",
  "scene-92",
  "scene-93",
  "scene-94",
  "scene-95",
  "scene-96",
]);
const METRO_DOG_TARGET_RECT_NORMALIZED = {
  x: 0.29,
  y: 0.51,
  width: 0.58,
  height: 0.2,
};

const COMIC_IMAGE_BY_ID = {
  freshen: "/images/comic/freshen.jpg",
  puppet: "/images/428出圖/漫畫格/第一章/掉在地上的人偶.png",
  book: "/images/428出圖/漫畫格/第一章/地上的筆記本.png",
  diaryInBag: "/images/428出圖/漫畫格/第一章/袋子裡的日記本.png",
  throwBook: "/images/comic/throw_book.png",
  alarmRinging: "/images/428出圖/漫畫格/第一章/響了的鬧鐘.png",
  diaryThrownOnFloor: "/images/428出圖/漫畫格/第一章/隨手扔在地上的日記本.png",
  diarySmashedOnWall: "/images/428出圖/漫畫格/第一章/被摔到牆上的日記本.png",
  diaryDroppedOnGround: "/images/428出圖/漫畫格/第一章/掉落在地上的日記本.png",
  mysteryCreatureFlash: "/images/428出圖/漫畫格/第一章/一閃而過的神秘生物.png",
  mysteryCreatureFlashBaiRoom: "/images/428出圖/漫畫格/第一章/一閃而過的神秘生物_小白房間.png",
  beigoJumpBed: "/images/comic/beigoJumpBed.jpg",
  beigoBag01: "/images/428出圖/漫畫格/第一章/蠕動的袋子.png",
  beigoBag02: "/images/428出圖/漫畫格/第一章/探頭的小貝狗１.png",
  beigoBag03: "/images/428出圖/漫畫格/第一章/探頭的小貝狗２.png",
  comicCamera: "/images/428出圖/漫畫格/第一章/相機.png",
  diaryDemo: "/images/diary/diary_demo.jpg",
} satisfies Record<StoryComicImageId, string>;

const WORK_MINIGAME_COIN_REWARD = 10;
type WorkPostSuccessStep = "dialogue" | "dusk-transition" | "settlement" | null;

const WORK_MINIGAME_CONFIG: Record<
  WorkMinigameKind,
  {
    taskId: string;
    successProgress: number;
    skipProgress: number;
    skipFatigue: number;
    preludeVariant: "sticky-prelude" | "stamp-prelude";
    postSuccessLine: string;
  }
> = {
  "sticky-notes": {
    taskId: "workdesk-sticky-notes",
    successProgress: 100,
    skipProgress: 20,
    skipFatigue: DEFAULT_WORK_TRANSITION_FATIGUE_INCREASE_TOTAL + 8,
    preludeVariant: "sticky-prelude",
    postSuccessLine: "太好了，這個搞定後，處理後續的專案會比較順利，今天應該能準時下班了。",
  },
  "stamp-documents": {
    taskId: "workdesk-document-stamp",
    successProgress: 100,
    skipProgress: 25,
    skipFatigue: DEFAULT_WORK_TRANSITION_FATIGUE_INCREASE_TOTAL + 7,
    preludeVariant: "stamp-prelude",
    postSuccessLine: "呼，這批文件總算都跑完簽核了，剩下的收尾應該能順順做完。",
  },
};

function normalizeForcedWorkMinigameKind(kind: string | null | undefined): WorkMinigameKind | null {
  if (kind === "sticky" || kind === "sticky-notes") return "sticky-notes";
  if (kind === "stamp" || kind === "stamp-documents") return "stamp-documents";
  return null;
}

function getForcedWorkMinigameKindFromSearch(search: string): WorkMinigameKind | null {
  return normalizeForcedWorkMinigameKind(new URLSearchParams(search).get("workMinigame"));
}

const settlementStripeDrift = keyframes`
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(72.75px, 42px, 0);
  }
`;

function WorkStripeBackground() {
  return (
    <Flex
      position="absolute"
      inset="-18%"
      pointerEvents="none"
      bgColor="#F6EDDC"
      bgImage="repeating-linear-gradient(120deg, #F6EDDC 0 42px, #F1DFC0 42px 84px)"
      animation={`${settlementStripeDrift} 3.6s linear infinite`}
      willChange="transform"
      style={{
        backfaceVisibility: "hidden",
        transform: "translate3d(0, 0, 0)",
      }}
    />
  );
}

function WorkSettlementOverlay({
  onShown,
  onFinish,
}: {
  onShown?: () => void;
  onFinish: () => void;
}) {
  useEffect(() => {
    onShown?.();
  }, [onShown]);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={73}
      align="center"
      justify="center"
      overflow="hidden"
      bgColor="#F6EDDC"
    >
      <WorkStripeBackground />
      <Flex position="relative" zIndex={1} direction="column" align="center" gap="22px" transform="translateY(-16px)">
        <Text color="#A37A54" fontSize="28px" fontWeight="700" lineHeight="1">
          今日
        </Text>
        <Text color="#A37A54" fontSize="28px" fontWeight="700" lineHeight="1.2">
          完成一件工作
        </Text>
        <Text color="#A37A54" fontSize="24px" fontWeight="700" lineHeight="1">
          疲勞值+10
        </Text>
        <Flex
          mt="18px"
          minW="148px"
          h="58px"
          px="36px"
          borderRadius="999px"
          bgColor="#9F7047"
          align="center"
          justify="center"
          cursor="pointer"
          onClick={onFinish}
        >
          <Text color="white" fontSize="20px" fontWeight="700" lineHeight="1">
            繼續
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

type WorkRewardGridCell = {
  id: string;
  label?: string;
  sublabel?: string;
  icon?: string;
  isCenter?: boolean;
  isHidden?: boolean;
};

const rewardCellPulse = keyframes`
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(247, 232, 171, 0.0);
  }
  50% {
    transform: scale(1.03);
    box-shadow: 0 0 0 6px rgba(247, 232, 171, 0.22);
  }
`;

function WorkRewardGridOverlay({
  onFinish,
}: {
  onFinish: () => void;
}) {
  const hiddenRewards = [
    { label: "小日幣", icon: "💰" },
    { label: "拼圖", icon: "🧩" },
    { label: "扭蛋卷", icon: "🎟️" },
    { label: "早餐券", icon: "🥪" },
    { label: "小屋", icon: "🏠" },
  ];
  const rewardCycleOrder = ["coin", "hidden-1", "hidden-2", "house", "breakfast", "gacha", "hidden-4", "hidden-3"];
  const rewardRollTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [hiddenSeed, setHiddenSeed] = useState(0);
  const [activeRewardId, setActiveRewardId] = useState<string>(rewardCycleOrder[0]);
  const [isRewardRolling, setIsRewardRolling] = useState(false);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [hasRewardRolled, setHasRewardRolled] = useState(false);

  const cells = useMemo<WorkRewardGridCell[]>(() => {
    const offset = hiddenRewards.length === 0 ? 0 : hiddenSeed % hiddenRewards.length;
    const pickHidden = (index: number) => hiddenRewards[(index + offset) % hiddenRewards.length];
    return [
      {
        id: "coin",
        icon: "💰",
      },
      {
        id: "hidden-1",
        icon: pickHidden(0).icon,
        label: pickHidden(0).label,
        isHidden: true,
      },
      {
        id: "hidden-2",
        icon: pickHidden(1).icon,
        label: pickHidden(1).label,
        isHidden: true,
      },
      {
        id: "hidden-3",
        icon: pickHidden(2).icon,
        label: pickHidden(2).label,
        isHidden: true,
      },
      {
        id: "center",
        isCenter: true,
      },
      {
        id: "house",
        icon: "🏠",
      },
      {
        id: "hidden-4",
        icon: pickHidden(3).icon,
        label: pickHidden(3).label,
        isHidden: true,
      },
      {
        id: "gacha",
        label: "扭蛋卷",
      },
      {
        id: "breakfast",
        label: "早餐券",
      },
    ];
  }, [hiddenSeed]);

  const selectedRewardLabel = useMemo(() => {
    const selected = cells.find((cell) => cell.id === selectedRewardId);
    if (!selected) return "";
    return selected.label ?? "小日幣";
  }, [cells, selectedRewardId]);

  const clearRewardRollTimers = () => {
    rewardRollTimersRef.current.forEach((timer) => clearTimeout(timer));
    rewardRollTimersRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearRewardRollTimers();
    };
  }, []);

  const startRewardRoll = () => {
    if (isRewardRolling) return;
    clearRewardRollTimers();
    const nextSeed = hiddenSeed + 1;
    const nextOffset = hiddenRewards.length === 0 ? 0 : nextSeed % hiddenRewards.length;
    const startIndex = Math.max(0, rewardCycleOrder.indexOf(activeRewardId));
    const targetIndex = Math.floor(Math.random() * rewardCycleOrder.length);
    const lapCount = 2 + Math.floor(Math.random() * 2);
    const stepsToTarget =
      lapCount * rewardCycleOrder.length + ((targetIndex - startIndex + rewardCycleOrder.length) % rewardCycleOrder.length);
    let elapsed = 0;

    setHiddenSeed(nextSeed);
    setIsRewardRolling(true);
    setSelectedRewardId(null);
    setHasRewardRolled(true);

    for (let step = 1; step <= stepsToTarget; step += 1) {
      const delay =
        step <= stepsToTarget - 6
          ? 68
          : 68 + (step - (stepsToTarget - 6)) * 30;
      elapsed += delay;
      const cycleIndex = (startIndex + step) % rewardCycleOrder.length;
      const rewardId = rewardCycleOrder[cycleIndex];
      rewardRollTimersRef.current.push(
        setTimeout(() => {
          setActiveRewardId(rewardId);
          if (step === stepsToTarget) {
            setIsRewardRolling(false);
            setSelectedRewardId(rewardId);
          }
        }, elapsed),
      );
    }
  };

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={74}
      align="center"
      justify="center"
      overflow="hidden"
      bgColor="#F6EDDC"
      px="20px"
      py="40px"
    >
      <WorkStripeBackground />
      <Flex
        position="relative"
        zIndex={1}
        w="100%"
        h="100%"
        direction="column"
        align="center"
        justify="center"
        gap="24px"
      >
        <Text color="#A37A54" fontSize="34px" fontWeight="700" lineHeight="1">
          下班獎勵
        </Text>
        <Grid
          w="100%"
          maxW="300px"
          templateColumns="repeat(3, minmax(0, 1fr))"
          border="4px solid #9E734C"
          borderRadius="8px"
          overflow="hidden"
          bgColor="#9E734C"
          gap="4px"
        >
          {cells.map((cell) => (
            <Flex
              key={cell.id}
              minH="96px"
              bgColor={
                cell.isCenter
                  ? "#9E734C"
                  : activeRewardId === cell.id
                    ? "#F5E6A9"
                    : "#E8CDB4"
              }
              align="center"
              justify="center"
              direction="column"
              gap="8px"
              px="8px"
              py="10px"
              transition="background-color 120ms ease, transform 120ms ease"
              animation={activeRewardId === cell.id ? `${rewardCellPulse} 360ms ease infinite` : undefined}
            >
              {cell.isCenter ? (
                <img
                  src="/images/bai/bai_fly.png"
                  alt="下班獎勵吉祥物"
                  style={{
                    width: "58px",
                    height: "58px",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              ) : cell.isHidden ? (
                <Text color={activeRewardId === cell.id ? "#7B5638" : "white"} fontSize="34px" lineHeight="1">
                  🧩
                </Text>
              ) : cell.icon ? (
                <Text color={activeRewardId === cell.id ? "#7B5638" : "white"} fontSize="34px" lineHeight="1">
                  {cell.icon}
                </Text>
              ) : null}
              {cell.label ? (
                <Text
                  color={
                    activeRewardId === cell.id
                      ? "#7B5638"
                      : cell.isHidden
                        ? "rgba(255,255,255,0.92)"
                        : "#18120D"
                  }
                  fontSize={cell.label.length >= 4 ? "16px" : "18px"}
                  fontWeight="700"
                  lineHeight="1.1"
                  textAlign="center"
                >
                  {cell.label}
                </Text>
              ) : null}
              {cell.sublabel ? (
                <Text color="#2B2118" fontSize="12px" lineHeight="1" textAlign="center">
                  {cell.sublabel}
                </Text>
              ) : null}
            </Flex>
          ))}
        </Grid>
        <Flex minH="28px" align="center" justify="center" mt="-4px">
          <Text color="#8F6A46" fontSize="18px" fontWeight="700" lineHeight="1" textAlign="center">
            {isRewardRolling
              ? "抽獎中..."
              : selectedRewardLabel
                ? `抽中 ${selectedRewardLabel}`
                : "按下抽獎開始抽取下班獎勵"}
          </Text>
        </Flex>
        <Flex direction="column" w="100%" maxW="286px" gap="16px" mt="4px">
          <Flex
            h="56px"
            borderRadius="999px"
            bgColor={isRewardRolling ? "#B89C82" : "#9F7047"}
            align="center"
            justify="center"
            cursor={isRewardRolling ? "default" : "pointer"}
            onClick={startRewardRoll}
          >
            <Text color="white" fontSize="18px" fontWeight="700" lineHeight="1">
              {isRewardRolling ? "抽獎中..." : hasRewardRolled ? "再抽一次" : "抽獎"}
            </Text>
          </Flex>
          <Flex
            h="56px"
            borderRadius="999px"
            bgColor={isRewardRolling ? "#B89C82" : "#9F7047"}
            align="center"
            justify="center"
            cursor={isRewardRolling ? "default" : "pointer"}
            onClick={() => {
              if (isRewardRolling) return;
              onFinish();
            }}
          >
            <Text color="white" fontSize="18px" fontWeight="700" lineHeight="1">
              打卡下班
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

type OffworkRewardOption = {
  id: PlaceTileId;
  title: string;
  icon: string;
  subtitle: string;
};

type WeekendDestinationOption = {
  id: PlaceTileId;
  title: string;
  icon: string;
  subtitle: string;
  effectLabel: string;
  resultText: string;
  applyStatus: (status: PlayerStatus) => PlayerStatus;
};

type EndDaySummaryContent = {
  title: string;
  body: string;
  chips: [string, string];
};

type CharacterIntroCard = {
  sceneId: string;
  name: string;
  englishName: string;
  descriptionLines: [string, string];
  spriteSheetPath: string;
  spriteCols: number;
  spriteRows: number;
  spriteFrameIndex: number;
  theme: {
    topBar: string;
    band: string;
    bandBorder: string;
    button: string;
    buttonText: string;
  };
};

const STREET_OPTION: OffworkRewardOption = {
  id: "street",
  title: "街道",
  icon: "💡",
  subtitle: "熟悉路線",
};

const METRO_OPTION: OffworkRewardOption = {
  id: "metro-station",
  title: "捷運",
  icon: "🚉",
  subtitle: "通勤節點",
};

const OFFWORK_REWARD_OPTION_BY_PLACE_ID: Record<PlaceTileId, OffworkRewardOption> = {
  "metro-station": METRO_OPTION,
  street: STREET_OPTION,
  "convenience-store": { id: "convenience-store", title: "便利商店", icon: "🏪", subtitle: "補給路線" },
  "breakfast-shop": { id: "breakfast-shop", title: "早餐店", icon: "🥪", subtitle: "早晨線索" },
  park: { id: "park", title: "公園", icon: "🌳", subtitle: "散步岔路" },
  "bus-stop": { id: "bus-stop", title: "公車站", icon: "🚏", subtitle: "轉乘節點" },
};
const FIRST_NON_CORE_PLACE_PATTERN: TilePattern3x3 = [
  [0, 0, 0],
  [0, 1, 1],
  [0, 1, 0],
];
const SECOND_NON_CORE_PLACE_PATTERN: TilePattern3x3 = [
  [0, 1, 0],
  [1, 1, 0],
  [0, 0, 0],
];
const SCENE_TRANSITION_STORAGE_KEY = "moment:scene-transition";
const fadeOutToBlack = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;
const fadeInFromBlack = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;
const fadeOutInBlack = keyframes`
  0% { opacity: 0; }
  45% { opacity: 1; }
  55% { opacity: 1; }
  100% { opacity: 0; }
`;
const summaryCardIn = keyframes`
  0% { opacity: 0; transform: translateY(10px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;
const summaryCardOut = keyframes`
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-6px) scale(0.99); }
`;
const dayDateOldFadeOut = keyframes`
  0% { opacity: 1; transform: translateY(0); }
  42% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-8px); }
`;
const dayDateNewFadeIn = keyframes`
  0% { opacity: 0; transform: translateY(8px); }
  42% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
`;
const characterIntroBgFadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;
const characterIntroBandSlideIn = keyframes`
  0% { opacity: 0; transform: translateX(120%) rotate(-16deg); }
  100% { opacity: 1; transform: translateX(0) rotate(-16deg); }
`;
const characterIntroTextFadeIn = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;
const characterIntroAvatarRise = keyframes`
  0% { opacity: 0; transform: translateX(-50%) translateY(16px) scale(0.94); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
`;
const characterIntroGlowPulse = keyframes`
  0%, 100% { opacity: 0.28; transform: translateX(-50%) scale(1); }
  50% { opacity: 0.45; transform: translateX(-50%) scale(1.05); }
`;
const characterIntroOkPulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(77,120,133,0.3); }
  50% { transform: scale(1.02); box-shadow: 0 0 0 8px rgba(77,120,133,0.0); }
`;
const scene5OutfitPanelFadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;
const storyComicPanelFadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;
const storyComicPanelSmashIn = keyframes`
  0% { opacity: 0; transform: translateX(-50%) translate(34px, -30px) scale(0.92); }
  100% { opacity: 1; transform: translateX(-50%) translate(0, 0) scale(1.15); }
`;
const scene32MemoryWash = keyframes`
  0% { opacity: 0; }
  32% { opacity: 1; }
  100% { opacity: 1; }
`;
const scene32LeftCurtainReveal = keyframes`
  0% { transform: translateX(0) skewX(-18deg); }
  18% { transform: translateX(0) skewX(-18deg); }
  100% { transform: translateX(-58%) skewX(-18deg); }
`;
const scene32RightCurtainReveal = keyframes`
  0% { transform: translateX(0) skewX(-18deg); }
  18% { transform: translateX(0) skewX(-18deg); }
  100% { transform: translateX(58%) skewX(-18deg); }
`;
const scene47LeftCurtainReveal = keyframes`
  0% { transform: translateX(0); }
  12% { transform: translateX(0); }
  42% { transform: translateX(-18%); }
  100% { transform: translateX(-104%); }
`;
const scene47DoorLightReveal = keyframes`
  0% { opacity: 0; transform: scaleY(0.94); }
  12% { opacity: 0.75; transform: scaleY(0.94); }
  44% { opacity: 1; transform: scaleY(1); }
  100% { opacity: 0.28; transform: scaleY(1); }
`;
const scene32CluePanelReveal = keyframes`
  0% { opacity: 0; transform: translateX(-50%) translateY(14px) rotate(-2deg) scale(0.94); filter: brightness(1.18) blur(1px); }
  24% { opacity: 0; transform: translateX(-50%) translateY(14px) rotate(-2deg) scale(0.94); filter: brightness(1.18) blur(1px); }
  50% { opacity: 1; transform: translateX(-50%) translateY(0) rotate(-2deg) scale(1.03); filter: brightness(1.08) blur(0); }
  60% { opacity: 1; transform: translateX(calc(-50% - 10px)) translateY(0) rotate(-4deg) scale(1.02); filter: brightness(1.06) blur(0); }
  70% { opacity: 1; transform: translateX(calc(-50% + 9px)) translateY(0) rotate(1deg) scale(1.01); filter: brightness(1.03) blur(0); }
  80% { opacity: 1; transform: translateX(calc(-50% - 5px)) translateY(0) rotate(-3deg) scale(1); filter: brightness(1); }
  90% { opacity: 1; transform: translateX(calc(-50% + 3px)) translateY(0) rotate(-1deg) scale(1); filter: brightness(1); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0) rotate(-2deg) scale(1); filter: brightness(1); }
`;
const scene32ClueGlow = keyframes`
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.68); }
  36% { opacity: 0.38; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0.16; transform: translate(-50%, -50%) scale(1.24); }
`;
const scene5HappyAvatarFadeIn = keyframes`
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
`;
const scene6SpeechBubbleFloat = keyframes`
  0%, 100% { transform: translateY(0) rotate(-3deg); }
  50% { transform: translateY(-6px) rotate(1deg); }
`;
const scene6MusicIconSwing = keyframes`
  0%, 100% { transform: rotate(-10deg) translateY(0); }
  50% { transform: rotate(8deg) translateY(-1px); }
`;
const scene20DropletFall = keyframes`
  0% { opacity: 0; transform: translateY(-8px) scale(0.88); }
  20% { opacity: 1; transform: translateY(-2px) scale(1); }
  78% { opacity: 1; transform: translateY(9px) scale(0.98); }
  100% { opacity: 0; transform: translateY(14px) scale(0.92); }
`;
const creatureFlashBy = keyframes`
  0% { opacity: 0; transform: translateX(52px) scale(0.82); filter: blur(5px); }
  18% { opacity: 0.92; transform: translateX(6px) scale(0.96); filter: blur(2px); }
  78% { opacity: 0.92; transform: translateX(-88px) scale(1.02); filter: blur(1px); }
  100% { opacity: 0; transform: translateX(-132px) scale(1.04); filter: blur(6px); }
`;
const floatingBaiDrift = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.02); }
`;
const floatingBaiGlow = keyframes`
  0%, 100% { opacity: 0.5; transform: scale(0.98); }
  50% { opacity: 0.92; transform: scale(1.08); }
`;
const glowingBookPulse = keyframes`
  0% { opacity: 0; transform: translate(-50%, 8px) scale(0.92); }
  18% { opacity: 1; transform: translate(-50%, 0) scale(1); }
  72% { opacity: 1; transform: translate(-50%, -2px) scale(1.03); }
  100% { opacity: 0; transform: translate(-50%, -10px) scale(1.08); }
`;
const glowingBookRay = keyframes`
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
  22% { opacity: 0.9; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.28); }
`;
const nightHubSunbeastPointerNudge = keyframes`
  0% { opacity: 0.78; transform: translateX(-5px) rotate(90deg); }
  50% { opacity: 1; transform: translateX(7px) rotate(90deg); }
  100% { opacity: 0.78; transform: translateX(-5px) rotate(90deg); }
`;

const CHARACTER_INTRO_BY_SCENE_ID: Record<string, CharacterIntroCard> = {
  "scene-3": {
    sceneId: "scene-3",
    name: "小麥",
    englishName: "MUGI",
    descriptionLines: [
      "剛出社會兩年的職場新鮮人",
      "平時省吃儉用，但看到喜歡的東西還是會手滑的平凡女孩",
    ],
    spriteSheetPath: "/images/mai/Mai_Spirt.png",
    spriteCols: 6,
    spriteRows: 3,
    spriteFrameIndex: 13,
    theme: {
      topBar: "rgba(220, 193, 178, 0.92)",
      band: "rgba(183, 141, 128, 0.94)",
      bandBorder: "rgba(139, 94, 82, 0.76)",
      button: "#A86E61",
      buttonText: "#FFF4F0",
    },
  },
  "scene-13": {
    sceneId: "scene-13",
    name: "小白",
    englishName: "SHIRO",
    descriptionLines: [
      "小麥的現任室友兼大學好友",
      "自由接案的動畫師，時常燃燒生命趕稿",
    ],
    spriteSheetPath: "/images/bai/Bai_Spirt.png",
    spriteCols: 7,
    spriteRows: 1,
    spriteFrameIndex: 2,
    theme: {
      topBar: "rgba(181, 208, 214, 0.9)",
      band: "rgba(131, 170, 179, 0.94)",
      bandBorder: "rgba(84,127,137,0.74)",
      button: "#4D7885",
      buttonText: "#EFF8FB",
    },
  },
};

type PendingSceneTransitionPayload = {
  toSceneId: string;
  preset: "fade-black" | "next-day";
  durationMs: number;
  createdAt: number;
};

type Scene4FreshenPhase = "idle" | "avatar-exit" | "comic-visible" | "comic-fade" | "done";
type Scene5OutfitRevealPhase = "hidden" | "modal-enter" | "pose-rise" | "modal-exit" | "dialog";
type Scene9PuppetRevealPhase = "hidden" | "prop" | "dialog";
type Scene10ExitPhase = "idle" | "exiting";
type Scene14PuppetPhase = "hidden" | "visible";
type Scene47RevealPhase = "revealing" | "dialog";
type Scene55BookPhase = "glow" | "dialog";
type ComicCheatId = keyof typeof COMIC_IMAGE_BY_ID;
type StoryComicId = keyof typeof COMIC_IMAGE_BY_ID;

function StoryComicOverlayPanel({
  sceneId,
  overlay,
  index,
  isVisible,
  onSequenceComplete,
}: {
  sceneId: string;
  overlay: StoryComicOverlay;
  index: number;
  isVisible: boolean;
  onSequenceComplete?: (index: number) => void;
}) {
  const finalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasReportedCompleteRef = useRef(false);
  const [showFinalFrame, setShowFinalFrame] = useState(false);
  const hiddenTransform =
    overlay.enterFrom === "left"
      ? "translateX(-72px)"
      : overlay.enterFrom === "right"
        ? "translateX(72px)"
        : overlay.enterFrom === "bottom"
          ? "translateY(32px)"
          : "translate(0, 0)";

  useEffect(() => {
    setShowFinalFrame(false);
    hasReportedCompleteRef.current = false;
    if (finalTimerRef.current) {
      clearTimeout(finalTimerRef.current);
      finalTimerRef.current = null;
    }
    if (finalFadeTimerRef.current) {
      clearTimeout(finalFadeTimerRef.current);
      finalFadeTimerRef.current = null;
    }
    return () => {
      if (finalTimerRef.current) {
        clearTimeout(finalTimerRef.current);
        finalTimerRef.current = null;
      }
      if (finalFadeTimerRef.current) {
        clearTimeout(finalFadeTimerRef.current);
        finalFadeTimerRef.current = null;
      }
    };
  }, [sceneId, index, overlay.imageId, overlay.finalImageId]);

  useEffect(() => {
    if (!isVisible || !overlay.finalImageId) return;
    const fallbackTimer = setTimeout(() => {
      scheduleFinalFrame();
    }, overlay.enterDurationMs ?? 360);
    return () => clearTimeout(fallbackTimer);
  }, [isVisible, overlay.finalImageId, overlay.enterDurationMs]);

  const scheduleFinalFrame = () => {
    if (!overlay.finalImageId || showFinalFrame || finalTimerRef.current) return;
    finalTimerRef.current = setTimeout(() => {
      setShowFinalFrame(true);
      finalTimerRef.current = null;
      if (!hasReportedCompleteRef.current) {
        finalFadeTimerRef.current = setTimeout(() => {
          hasReportedCompleteRef.current = true;
          finalFadeTimerRef.current = null;
          onSequenceComplete?.(index);
        }, overlay.finalFadeDurationMs ?? 240);
      }
    }, overlay.finalDelayAfterEnterMs ?? 0);
  };

  return (
    <Flex
      position="absolute"
      top={overlay.top}
      left={overlay.left}
      right={overlay.right}
      zIndex={overlay.zIndex ?? 7}
      w={overlay.width}
      h={overlay.height}
      maxW={overlay.maxWidth}
      pointerEvents="none"
      opacity={isVisible ? 1 : 0}
      transform={isVisible ? "translate(0, 0)" : hiddenTransform}
      transition={`opacity ${overlay.enterDurationMs ?? 360}ms ease, transform ${overlay.enterDurationMs ?? 360}ms ease`}
      overflow="hidden"
      onTransitionEnd={(event) => {
        if (!isVisible || event.currentTarget !== event.target || event.propertyName !== "transform") return;
        scheduleFinalFrame();
      }}
    >
      {overlay.finalImageId ? (
        <>
          <img
            src={COMIC_IMAGE_BY_ID[overlay.imageId]}
            alt={overlay.alt}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
          <img
            src={COMIC_IMAGE_BY_ID[overlay.finalImageId]}
            alt=""
            aria-hidden="true"
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              position: "absolute",
              inset: 0,
              opacity: showFinalFrame ? 1 : 0,
              transition: `opacity ${overlay.finalFadeDurationMs ?? 240}ms ease`,
            }}
          />
        </>
      ) : (
        <img
          src={COMIC_IMAGE_BY_ID[overlay.imageId]}
          alt={overlay.alt}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      )}
    </Flex>
  );
}

function areStoryComicOverlaysEquivalent(
  left: StoryComicOverlay,
  right: StoryComicOverlay,
) {
  return (
    left.imageId === right.imageId &&
    left.alt === right.alt &&
    left.top === right.top &&
    left.left === right.left &&
    left.right === right.right &&
    left.width === right.width &&
    left.height === right.height &&
    left.maxWidth === right.maxWidth &&
    left.zIndex === right.zIndex &&
    left.finalImageId === right.finalImageId &&
    left.finalDelayAfterEnterMs === right.finalDelayAfterEnterMs &&
    left.finalFadeDurationMs === right.finalFadeDurationMs
  );
}

function pickTwoRandomFromPool(pool: OffworkRewardOption[]): OffworkRewardOption[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 2);
}

function pickOffworkRewardOptions(
  progress: ReturnType<typeof loadPlayerProgress>,
): OffworkRewardOption[] {
  const unlockedOptions = progress.ownedPlaceTileIds
    .map((id) => OFFWORK_REWARD_OPTION_BY_PLACE_ID[id])
    .filter((option): option is OffworkRewardOption => Boolean(option));
  const uniqueOptions = Array.from(
    new Map(unlockedOptions.map((option) => [option.id, option])).values(),
  );
  if (uniqueOptions.length <= 0) return [METRO_OPTION];
  if (uniqueOptions.length <= 3) return uniqueOptions;
  return pickTwoRandomFromPool(uniqueOptions);
}

const IN_GAME_CALENDAR_BASE = new Date(2024, 2, 11); // 星期一 3/11
const WEEKDAY_LABELS = ["星期天", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"] as const;

function formatInGameDateLabel(day: number): string {
  const safeDay = Number.isFinite(day) && day >= 1 ? Math.floor(day) : 1;
  const date = new Date(IN_GAME_CALENDAR_BASE);
  date.setDate(IN_GAME_CALENDAR_BASE.getDate() + safeDay - 1);
  const weekday = WEEKDAY_LABELS[date.getDay()];
  const month = date.getMonth() + 1;
  const dateNumber = date.getDate();
  return `${weekday} ${month}/${dateNumber}`;
}

function getInGameWeekday(day: number) {
  const safeDay = Number.isFinite(day) && day >= 1 ? Math.floor(day) : 1;
  const date = new Date(IN_GAME_CALENDAR_BASE);
  date.setDate(IN_GAME_CALENDAR_BASE.getDate() + safeDay - 1);
  return date.getDay();
}

function isWeekendInGameDay(day: number) {
  const weekday = getInGameWeekday(day);
  return weekday === 0 || weekday === 6;
}

function buildWeekendDestinationOptions(progress: ReturnType<typeof loadPlayerProgress>): WeekendDestinationOption[] {
  const unlockedPlaceIds = new Set(progress.ownedPlaceTileIds);
  const options: WeekendDestinationOption[] = [
    {
      id: "metro-station",
      title: "捷運站",
      icon: "🚉",
      subtitle: "去熟悉的地方走走",
      effectLabel: "行動力 +1 / 疲勞 -4",
      resultText: "你搭著熟悉的路線晃了一圈，沒有趕時間的通勤變得輕鬆許多，心情也慢慢放鬆。",
      applyStatus: (status) => ({
        ...status,
        actionPower: Math.min(6, status.actionPower + 1),
        fatigue: Math.max(0, status.fatigue - 4),
      }),
    },
  ];

  if (progress.hasPassedThroughStreet || unlockedPlaceIds.has("street")) {
    options.push({
      id: "street",
      title: "街道",
      icon: "💡",
      subtitle: "隨意散步看看",
      effectLabel: "疲勞 -6",
      resultText: "你在街道上慢慢散步，邊走邊看著周圍小店與行人，腦袋裡悶住的感覺淡了一些。",
      applyStatus: (status) => ({
        ...status,
        fatigue: Math.max(0, status.fatigue - 6),
      }),
    });
  }

  if (unlockedPlaceIds.has("park")) {
    options.push({
      id: "park",
      title: "公園",
      icon: "🌳",
      subtitle: "去透透氣",
      effectLabel: "疲勞 -10",
      resultText: "你在公園找了個舒服角落坐下來，吹著風發呆了一陣子，整個人都鬆開了些。",
      applyStatus: (status) => ({
        ...status,
        fatigue: Math.max(0, status.fatigue - 10),
      }),
    });
  }

  if (unlockedPlaceIds.has("breakfast-shop")) {
    options.push({
      id: "breakfast-shop",
      title: "早餐店",
      icon: "🥪",
      subtitle: "慢慢吃一頓",
      effectLabel: "儲蓄 -1 / 行動力 +1 / 疲勞 -8",
      resultText: "你點了一份喜歡的早餐坐著慢慢吃，週末的節奏讓這頓飯比平常更有安定感。",
      applyStatus: (status) => ({
        ...status,
        savings: Math.max(0, status.savings - 1),
        actionPower: Math.min(6, status.actionPower + 1),
        fatigue: Math.max(0, status.fatigue - 8),
      }),
    });
  }

  if (unlockedPlaceIds.has("convenience-store")) {
    options.push({
      id: "convenience-store",
      title: "便利商店",
      icon: "🏪",
      subtitle: "買點小東西",
      effectLabel: "儲蓄 -1 / 行動力 +1",
      resultText: "你在便利商店裡慢慢晃，挑了點喜歡的小東西，覺得今天有一種被自己照顧到的感覺。",
      applyStatus: (status) => ({
        ...status,
        savings: Math.max(0, status.savings - 1),
        actionPower: Math.min(6, status.actionPower + 1),
      }),
    });
  }

  if (unlockedPlaceIds.has("bus-stop")) {
    options.push({
      id: "bus-stop",
      title: "公車站",
      icon: "🚌",
      subtitle: "換個方向晃晃",
      effectLabel: "行動力 +1 / 疲勞 -5",
      resultText: "你在公車站隨興搭了一小段，看看不熟悉的街景，像替這週留了一個空白又舒服的句點。",
      applyStatus: (status) => ({
        ...status,
        actionPower: Math.min(6, status.actionPower + 1),
        fatigue: Math.max(0, status.fatigue - 5),
      }),
    });
  }

  return options.slice(0, 3);
}

function tilePatternKey(pattern: TilePattern3x3): string {
  return pattern.map((row) => row.map((value) => (value ? "1" : "0")).join("")).join("_");
}

function tileSourceLabel(sourceId: PlaceTileId): string {
  if (sourceId === "metro-station") return "捷運";
  if (sourceId === "street") return "街道";
  if (sourceId === "breakfast-shop") return "早餐店";
  if (sourceId === "park") return "公園";
  return "公車站";
}

const INVENTORY_ROUTE_IMAGE_BY_PATTERN_KEY: Record<string, string> = {
  "010_010_010": "/images/route/rt_010_010_010.png",
  "010_110_000": "/images/route/rt_010_110_000.jpg",
  "000_011_010": "/images/route/rt_000_011_010.jpg",
  "100_010_001": "/images/route/rt_100_010_001.jpg",
  "100_010_010": "/images/route/rt_100_010_010.jpg",
  "111_010_010": "/images/route/rt_1111_010_010.jpg",
  "111_100_100": "/images/route/rt_1111_100_100.jpg",
};

function resolveInventoryTileImagePath(params: {
  category: "place" | "route";
  pattern: TilePattern3x3;
  sourceId?: PlaceTileId;
}) {
  const key = tilePatternKey(params.pattern);
  if (params.category === "place" && params.sourceId === "metro-station") {
    return "/images/route/rt_MRT_111_010_111.png";
  }
  return INVENTORY_ROUTE_IMAGE_BY_PATTERN_KEY[key];
}

export function GameSceneView({
  scene,
  workShiftCount = 0,
  onOffworkRewardOpenChange,
}: {
  scene: GameScene;
  workShiftCount?: number;
  onOffworkRewardOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const {
    animation: backgroundShakeAnimation,
    effectNonce,
    activeEffectId,
  } = useBackgroundShake();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSceneMenuOpen, setIsSceneMenuOpen] = useState(false);
  const [dialogTypingMode, setDialogTypingMode] = useState<DialogTypingMode>(() => loadDialogTypingMode());
  const historyScenes = getChapterScenesUntilScene(scene);
  const historyLines = useMemo(
    () =>
      historyScenes.map((item) => ({
        id: item.id,
        speaker: item.characterName,
        text: item.dialogue,
      })),
    [historyScenes],
  );
  const isImageOnlyScene = scene.showDialogueUI === false;
  const previousHistoryScene = historyScenes.length >= 2 ? historyScenes[historyScenes.length - 2] : null;
  const isOffworkScene = scene.id === "scene-offwork";
  const isWorkTransitionScene = isWorkTransitionSceneId(scene.id);
  const isStoryTaxiWorkScene = scene.id === "scene-36";
  const shouldOpenWorkMinigame = shouldOpenWorkMinigameForSceneId(scene.id);
  const shouldOpenPlayableWorkMinigame = shouldOpenWorkMinigame && !isStoryTaxiWorkScene;
  const shouldShowNarrativeFocusLayer = shouldShowNarrativeFocus(scene.narrativeMode);
  const didPreviousSceneShowNarrativeFocus = shouldShowNarrativeFocus(previousHistoryScene?.narrativeMode);
  const shouldUseNarrativePause = shouldUseNarrativePauseTyping(scene.narrativeMode);
  const [forcedWorkMinigameKind, setForcedWorkMinigameKind] = useState<WorkMinigameKind | null>(null);
  const workMinigameKind =
    forcedWorkMinigameKind ?? getWorkMinigameKindForSceneId(scene.id, workShiftCount);
  const activeWorkMinigameConfig = workMinigameKind ? WORK_MINIGAME_CONFIG[workMinigameKind] : null;
  const [isOffworkLabelVisible, setIsOffworkLabelVisible] = useState(isOffworkScene);
  const [isWorkMinigameOpen, setIsWorkMinigameOpen] = useState(false);
  const [isOffworkRewardOpen, setIsOffworkRewardOpen] = useState(false);
  const [selectedRewardId, setSelectedRewardId] = useState<PlaceTileId | null>(null);
  const [offworkRewardChoices, setOffworkRewardChoices] = useState<OffworkRewardOption[]>(
    [METRO_OPTION, STREET_OPTION],
  );
  const [nonCorePlaceRewardClaimCount, setNonCorePlaceRewardClaimCount] = useState(0);
  const [placeRewardCostError, setPlaceRewardCostError] = useState("");
  const [offworkRewardPattern, setOffworkRewardPattern] = useState<TilePattern3x3>(
    FIRST_OFFWORK_REWARD_PATTERN,
  );
  const storyComicTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const storyComicOverlayTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const previousStoryComicOverlaysRef = useRef<StoryComicOverlay[]>([]);
  const completedStoryComicOverlayIndexesRef = useRef<Set<number>>(new Set());
  const pendingFinalStoryComicOverlayCountRef = useRef(0);
  const sceneBackgroundRef = useRef<HTMLDivElement | null>(null);
  const [activeStoryComicId, setActiveStoryComicId] = useState<StoryComicId | null>(null);
  const [isStoryComicVisible, setIsStoryComicVisible] = useState(false);
  const [isStoryComicFading, setIsStoryComicFading] = useState(false);
  const [visibleStoryComicOverlayCount, setVisibleStoryComicOverlayCount] = useState(0);
  const [areStoryComicOverlaysComplete, setAreStoryComicOverlaysComplete] = useState(true);
  const [scenePhotoNaturalImageSize, setScenePhotoNaturalImageSize] = useState<NaturalImageSize | null>(
    null,
  );
  const scene4SequenceTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [scene4FreshenPhase, setScene4FreshenPhase] = useState<Scene4FreshenPhase>("idle");
  const scene5RevealTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [scene5OutfitRevealPhase, setScene5OutfitRevealPhase] =
    useState<Scene5OutfitRevealPhase>("hidden");
  const scene9RevealTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [scene9PuppetRevealPhase, setScene9PuppetRevealPhase] =
    useState<Scene9PuppetRevealPhase>("hidden");
  const scene10ExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scene10ExitPhase, setScene10ExitPhase] = useState<Scene10ExitPhase>("idle");
  const continueExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isContinueExitActive, setIsContinueExitActive] = useState(false);
  const scene14PuppetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scene14PuppetPhase, setScene14PuppetPhase] = useState<Scene14PuppetPhase>("hidden");
  const scene47RevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scene47RevealPhase, setScene47RevealPhase] = useState<Scene47RevealPhase>("dialog");
  const scene55BookTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scene55BookPhase, setScene55BookPhase] = useState<Scene55BookPhase>("dialog");
  const comicCheatTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [activeComicCheatId, setActiveComicCheatId] = useState<ComicCheatId | null>(null);
  const [isComicCheatVisible, setIsComicCheatVisible] = useState(false);
  const [isComicCheatFading, setIsComicCheatFading] = useState(false);
  const diaryOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nightHubStreetUnlockGuideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workTransitionDoneRef = useRef(false);
  const [workPostMinigameStep, setWorkPostMinigameStep] = useState<WorkPostSuccessStep>(null);
  const [workMinigameRewardSavingsTotal, setWorkMinigameRewardSavingsTotal] = useState<number | null>(null);
  const workSettlementAppliedRef = useRef(false);
  const [doorTransitionPhase, setDoorTransitionPhase] = useState<"closed-start" | "opened" | "closed-end">(
    scene.id === LEGACY_NIGHT_HUB_SCENE_ID ? "closed-start" : "closed-end",
  );
  const [isDoorTransitionVisible, setIsDoorTransitionVisible] = useState(
    scene.id === LEGACY_NIGHT_HUB_SCENE_ID,
  );
  const [outgoingTransition, setOutgoingTransition] = useState<{
    preset: "fade-black" | "next-day";
    durationMs: number;
  } | null>(null);
  const [incomingTransition, setIncomingTransition] = useState<{
    preset: "fade-black" | "next-day";
    durationMs: number;
  } | null>(null);
  const [previewTransitionDurationMs, setPreviewTransitionDurationMs] = useState<number | null>(null);
  const [previewTransitionNonce, setPreviewTransitionNonce] = useState(0);
  const [scene44Step, setScene44Step] = useState<"intro" | "choose" | "qa" | "final">("intro");
  const [scene44Asked, setScene44Asked] = useState<{ metro: boolean; dog: boolean }>({
    metro: false,
    dog: false,
  });
  const [scene44Topic, setScene44Topic] = useState<"metro" | "dog" | null>(null);
  const [scene44QATurn, setScene44QATurn] = useState<0 | 1>(0);
  const [scene44FinalTurn, setScene44FinalTurn] = useState<0 | 1>(0);
  const [nightHubStep, setNightHubStep] = useState<"choose" | "chat-select" | "talk">("choose");
  const [nightHubAsked, setNightHubAsked] = useState<{ bai: boolean; beigo: boolean }>({
    bai: false,
    beigo: false,
  });
  const [nightHubTopic, setNightHubTopic] = useState<"bai" | "beigo" | null>(null);
  const [nightHubSunbeastFollowupIndex, setNightHubSunbeastFollowupIndex] = useState<number | null>(null);
  const [nightHubGuideStep, setNightHubGuideStep] = useState<
    "sunbeast-dialog" | "sunbeast-pointer" | "place-pointer" | "mission-pointer" | null
  >(null);
  const [isNightHubMode, setIsNightHubMode] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [weekendDestinationOptions, setWeekendDestinationOptions] = useState<WeekendDestinationOption[]>([]);
  const [weekendSelectedDestination, setWeekendSelectedDestination] = useState<WeekendDestinationOption | null>(null);
  const [endDaySequencePhase, setEndDaySequencePhase] = useState<"none" | "black" | "summary">("none");
  const [isEndDaySummaryLeaving, setIsEndDaySummaryLeaving] = useState(false);
  const [endDayTransitionText, setEndDayTransitionText] = useState<{
    toDayLabel: string;
    fromDateLabel: string;
    toDateLabel: string;
  } | null>(null);
  const [endDaySummaryContent, setEndDaySummaryContent] = useState<EndDaySummaryContent | null>(null);
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [diaryOverlayMode, setDiaryOverlayMode] = useState<DiaryOverlayMode>("default");
  const [pendingDiaryNextSceneId, setPendingDiaryNextSceneId] = useState<string | null>(null);
  const [unlockedDiaryEntryIds, setUnlockedDiaryEntryIds] = useState<string[]>([]);
  const [isNightHubPlaceMapOpen, setIsNightHubPlaceMapOpen] = useState(false);
  const [nightHubStreetUnlockGuideStep, setNightHubStreetUnlockGuideStep] =
    useState<
      | "unlocking-street"
      | "beigo-street"
      | "mai-street"
      | "beigo-shop"
      | "shop-condition"
      | null
    >(null);
  const [isNightHubMissionOpen, setIsNightHubMissionOpen] = useState(false);
  const [isNightHubMissionIntroOpen, setIsNightHubMissionIntroOpen] = useState(false);
  const [isRewardInventoryOpen, setIsRewardInventoryOpen] = useState(false);
  const [rewardInventoryTiles, setRewardInventoryTiles] = useState<RewardPlaceTile[]>([]);
  const [unlockFeedbackItems, setUnlockFeedbackItems] = useState<UnlockFeedbackItem[]>([]);
  const [isReturnHomeTransitionOpen, setIsReturnHomeTransitionOpen] = useState(false);
  const [isCharacterIntroOpen, setIsCharacterIntroOpen] = useState(false);
  const [characterIntroNonce, setCharacterIntroNonce] = useState(0);
  const [isCharacterIntroPending, setIsCharacterIntroPending] = useState(false);
  const [isScene68LocationDiscoveryVisible, setIsScene68LocationDiscoveryVisible] = useState(false);
  const transitionTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasTriggeredCharacterIntroRef = useRef(false);
  const unlockFeedbackTimerRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const forcedFromSearch = getForcedWorkMinigameKindFromSearch(window.location.search);
    const forcedFromStorage = normalizeForcedWorkMinigameKind(
      window.sessionStorage.getItem(WORK_MINIGAME_CHEAT_KIND_STORAGE_KEY),
    );
    if (forcedFromStorage) {
      window.sessionStorage.removeItem(WORK_MINIGAME_CHEAT_KIND_STORAGE_KEY);
    }
    setForcedWorkMinigameKind(forcedFromStorage ?? forcedFromSearch);
  }, [scene.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleWorkMinigameCheatTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<WorkMinigameCheatPayload>;
      const forcedKind = normalizeForcedWorkMinigameKind(customEvent.detail?.kind);
      if (!forcedKind) return;
      setForcedWorkMinigameKind(forcedKind);
      workTransitionDoneRef.current = false;
      setWorkPostMinigameStep(null);
      setWorkMinigameRewardSavingsTotal(null);
      setIsWorkMinigameOpen(true);
    };
    window.addEventListener(GAME_WORK_MINIGAME_CHEAT_TRIGGER, handleWorkMinigameCheatTrigger);
    return () => {
      window.removeEventListener(GAME_WORK_MINIGAME_CHEAT_TRIGGER, handleWorkMinigameCheatTrigger);
    };
  }, []);

  const playStoryComic = (
    comicId: StoryComicId,
    timings: { fadeAtMs: number; hideAtMs: number },
  ) => {
    storyComicTimerRefs.current.forEach((timer) => clearTimeout(timer));
    storyComicTimerRefs.current = [];
    setActiveStoryComicId(comicId);
    setIsStoryComicVisible(true);
    setIsStoryComicFading(false);
    storyComicTimerRefs.current = [
      setTimeout(() => setIsStoryComicFading(true), timings.fadeAtMs),
      setTimeout(() => {
        setIsStoryComicVisible(false);
        setIsStoryComicFading(false);
        setActiveStoryComicId(null);
      }, timings.hideAtMs),
    ];
  };

  const grantWorkMinigameCoinReward = () => {
    const latestProgress = loadPlayerProgress();
    const nextProgress = {
      ...latestProgress,
      status: {
        ...latestProgress.status,
        savings: latestProgress.status.savings + WORK_MINIGAME_COIN_REWARD,
      },
    };
    savePlayerProgress(nextProgress);
    setWorkMinigameRewardSavingsTotal(nextProgress.status.savings);
  };

  const applyWorkSettlement = () => {
    if (workSettlementAppliedRef.current) return;
    workSettlementAppliedRef.current = true;
    recordWorkShiftResult(DEFAULT_WORK_TRANSITION_FATIGUE_INCREASE_TOTAL);
  };

  const pushUnlockFeedback = (items: UnlockFeedbackItem[]) => {
    if (items.length <= 0) return;
    setUnlockFeedbackItems((prev) => [...prev, ...items]);
    items.forEach((item) => {
      if (unlockFeedbackTimerRefs.current[item.id]) {
        clearTimeout(unlockFeedbackTimerRefs.current[item.id]);
      }
      unlockFeedbackTimerRefs.current[item.id] = setTimeout(() => {
        setUnlockFeedbackItems((prev) => prev.filter((entry) => entry.id !== item.id));
        delete unlockFeedbackTimerRefs.current[item.id];
      }, 2800);
    });
  };

  useEffect(() => {
    setIsScene68LocationDiscoveryVisible(false);
  }, [scene.id]);

  const groupedRewardInventory = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        label: string;
        category: "place" | "route";
        pattern: TilePattern3x3;
        count: number;
        sourceId?: PlaceTileId;
      }
    >();
    rewardInventoryTiles.forEach((tile) => {
      const labelPrefix = tile.label?.trim().length ? tile.label.trim() : tileSourceLabel(tile.sourceId);
      const key = `${tile.category}::${labelPrefix}::${tilePatternKey(tile.pattern)}`;
      const exists = map.get(key);
      if (exists) {
        exists.count += 1;
        return;
      }
      map.set(key, {
        key,
        label: labelPrefix,
        category: tile.category,
        pattern: tile.pattern,
        count: 1,
        sourceId: tile.sourceId,
      });
    });
    return Array.from(map.values());
  }, [rewardInventoryTiles]);

  const ownedPlaceGroups = useMemo(
    () => groupedRewardInventory.filter((item) => item.category === "place"),
    [groupedRewardInventory],
  );
  const ownedRouteGroups = useMemo(
    () => groupedRewardInventory.filter((item) => item.category === "route"),
    [groupedRewardInventory],
  );

  useEffect(() => {
    workTransitionDoneRef.current = false;
    workSettlementAppliedRef.current = false;
    setWorkPostMinigameStep(null);
    setWorkMinigameRewardSavingsTotal(null);
    setOutgoingTransition(null);
    setEndDaySequencePhase("none");
    setIsEndDaySummaryLeaving(false);
    setEndDayTransitionText(null);
    setIsSceneMenuOpen(false);
    setIsNightHubMode(false);
    transitionTimersRef.current.forEach((timer) => clearTimeout(timer));
    transitionTimersRef.current = [];
    setIncomingTransition(null);
    setIsReturnHomeTransitionOpen(false);

    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(SCENE_TRANSITION_STORAGE_KEY);
    if (!raw) return;

    try {
      const payload = JSON.parse(raw) as PendingSceneTransitionPayload;
      const isExpired = Date.now() - payload.createdAt > payload.durationMs + 800;
      if (payload.toSceneId !== scene.id || isExpired) {
        window.sessionStorage.removeItem(SCENE_TRANSITION_STORAGE_KEY);
        return;
      }
      window.sessionStorage.removeItem(SCENE_TRANSITION_STORAGE_KEY);
      setIncomingTransition({ preset: payload.preset, durationMs: payload.durationMs });
      const clearTimer = setTimeout(() => {
        setIncomingTransition(null);
      }, payload.durationMs);
      transitionTimersRef.current.push(clearTimer);
    } catch {
      window.sessionStorage.removeItem(SCENE_TRANSITION_STORAGE_KEY);
    }
  }, [scene.id]);

  useEffect(() => {
    scene5RevealTimerRefs.current.forEach((timer) => clearTimeout(timer));
    scene5RevealTimerRefs.current = [];

    if (scene.scenePresentation !== "outfit-reveal") {
      setScene5OutfitRevealPhase("hidden");
      return () => {
        scene5RevealTimerRefs.current.forEach((timer) => clearTimeout(timer));
        scene5RevealTimerRefs.current = [];
      };
    }

    setScene5OutfitRevealPhase("hidden");
    scene5RevealTimerRefs.current = [
      setTimeout(() => {
        setScene5OutfitRevealPhase("modal-enter");
      }, 40),
      setTimeout(() => {
        setScene5OutfitRevealPhase("pose-rise");
      }, 260),
      setTimeout(() => {
        setScene5OutfitRevealPhase("modal-exit");
      }, 2080),
      setTimeout(() => {
        setScene5OutfitRevealPhase("dialog");
      }, 2460),
    ];

    return () => {
      scene5RevealTimerRefs.current.forEach((timer) => clearTimeout(timer));
      scene5RevealTimerRefs.current = [];
    };
  }, [scene.id, scene.scenePresentation]);

  useEffect(() => {
    setUnlockedDiaryEntryIds(loadPlayerProgress().unlockedDiaryEntryIds);
    const progress = loadPlayerProgress();
    setCurrentDay(Math.max(1, Math.floor(progress.currentDay || 1)));
    setWeekendDestinationOptions(buildWeekendDestinationOptions(progress));
    setWeekendSelectedDestination(null);
  }, [scene.id]);

  useEffect(() => {
    if (scene.characterName === "小麥") {
      setEncounteredCharacter("mai", true);
      return;
    }
    if (scene.characterName === "小白") {
      setEncounteredCharacter("bai", true);
      return;
    }
    if (scene.characterName === "小貝狗") {
      setEncounteredCharacter("beigo", true);
    }
  }, [scene.characterName, scene.id]);

  useEffect(() => {
    if (diaryOpenTimerRef.current) {
      clearTimeout(diaryOpenTimerRef.current);
      diaryOpenTimerRef.current = null;
    }
    if (nightHubStreetUnlockGuideTimerRef.current) {
      clearTimeout(nightHubStreetUnlockGuideTimerRef.current);
      nightHubStreetUnlockGuideTimerRef.current = null;
    }
    if (scene.id !== LEGACY_NIGHT_HUB_SCENE_ID) {
      setIsDiaryOpen(false);
      setDiaryOverlayMode("default");
      setPendingDiaryNextSceneId(null);
      setNightHubGuideStep(null);
      setNightHubStreetUnlockGuideStep(null);
      setIsNightHubMissionIntroOpen(false);
      setIsNightHubMissionOpen(false);
      return;
    }
    // 保障 legacy 夜間 hub 線到達該節點時一定可看到第一篇解鎖日記。
    unlockDiaryEntry("bai-entry-1");
    const latestProgress = loadPlayerProgress();
    setUnlockedDiaryEntryIds(latestProgress.unlockedDiaryEntryIds);
    setIsNightHubMode(true);
    if (shouldShowFirstSunbeastNightHubGuide(latestProgress)) {
      setNightHubGuideStep("sunbeast-dialog");
    }
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== LEGACY_NIGHT_HUB_SCENE_ID) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("diary") !== "1") return;
    const latestProgress = loadPlayerProgress();
    setUnlockedDiaryEntryIds(latestProgress.unlockedDiaryEntryIds);
    setDiaryOverlayMode(params.get("tab") === "sunbeast" ? "sunbeast" : "default");
    setIsDiaryOpen(true);
    setIsSceneMenuOpen(false);
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== LEGACY_QA_SCENE_ID) return;
    setScene44Step("intro");
    setScene44Asked({ metro: false, dog: false });
    setScene44Topic(null);
    setScene44QATurn(0);
    setScene44FinalTurn(0);
  }, [scene.id]);

  useEffect(() => {
    if (scene55BookTimerRef.current) {
      clearTimeout(scene55BookTimerRef.current);
      scene55BookTimerRef.current = null;
    }
    if (scene.id !== "scene-55") {
      setScene55BookPhase("dialog");
      return;
    }
    setScene55BookPhase("glow");
    scene55BookTimerRef.current = setTimeout(() => {
      setScene55BookPhase("dialog");
      scene55BookTimerRef.current = null;
    }, 980);
    return () => {
      if (scene55BookTimerRef.current) {
        clearTimeout(scene55BookTimerRef.current);
        scene55BookTimerRef.current = null;
      }
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene47RevealTimerRef.current) {
      clearTimeout(scene47RevealTimerRef.current);
      scene47RevealTimerRef.current = null;
    }
    if (scene.id !== "scene-47") {
      setScene47RevealPhase("dialog");
      return;
    }
    setScene47RevealPhase("revealing");
    scene47RevealTimerRef.current = setTimeout(() => {
      setScene47RevealPhase("dialog");
      scene47RevealTimerRef.current = null;
    }, 1380);
    return () => {
      if (scene47RevealTimerRef.current) {
        clearTimeout(scene47RevealTimerRef.current);
        scene47RevealTimerRef.current = null;
      }
    };
  }, [scene.id]);

  useEffect(() => {
    const characterIntro = CHARACTER_INTRO_BY_SCENE_ID[scene.id];
    if (!characterIntro) {
      setIsCharacterIntroOpen(false);
      setIsCharacterIntroPending(false);
      hasTriggeredCharacterIntroRef.current = false;
      return;
    }
    if (hasTriggeredCharacterIntroRef.current) return;
    hasTriggeredCharacterIntroRef.current = true;
    if (scene.autoOpenCharacterIntro) {
      setIsCharacterIntroPending(false);
      setIsCharacterIntroOpen(true);
      setCharacterIntroNonce((prev) => prev + 1);
      return;
    }
    setIsCharacterIntroPending(true);
  }, [scene.id]);

  const handleCloseCharacterIntro = () => {
    setIsCharacterIntroOpen(false);
    setIsCharacterIntroPending(false);
    if (scene.advanceAfterCharacterIntro && scene.nextSceneId) {
      router.push(ROUTES.gameScene(scene.nextSceneId));
    }
  };

  useEffect(() => {
    if (!isCharacterIntroOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      event.preventDefault();
      handleCloseCharacterIntro();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCharacterIntroOpen, scene.advanceAfterCharacterIntro, scene.nextSceneId]);

  useEffect(() => {
    if (scene.id !== LEGACY_NIGHT_HUB_SCENE_ID || !isNightHubMode) return;
    if (nightHubSunbeastFollowupIndex !== null) return;
    if (nightHubGuideStep !== null) return;
    setNightHubStep("choose");
    setNightHubAsked({ bai: false, beigo: false });
    setNightHubTopic(null);
  }, [scene.id, isNightHubMode, nightHubGuideStep, nightHubSunbeastFollowupIndex]);

  useEffect(() => {
    const isDoorTransitionScene = scene.id === "scene-40" || scene.id === LEGACY_NIGHT_HUB_SCENE_ID;
    if (!isDoorTransitionScene) {
      setDoorTransitionPhase("closed-end");
      setIsDoorTransitionVisible(false);
      return;
    }
    setDoorTransitionPhase("closed-start");
    setIsDoorTransitionVisible(true);
    const openDoorTimer = setTimeout(() => {
      setDoorTransitionPhase("opened");
    }, 180);
    const closeDoorTimer = setTimeout(() => {
      setDoorTransitionPhase("closed-end");
    }, scene.id === LEGACY_NIGHT_HUB_SCENE_ID ? 760 : 420);
    const showDialogTimer =
      scene.id === LEGACY_NIGHT_HUB_SCENE_ID
        ? setTimeout(() => {
            setIsDoorTransitionVisible(false);
          }, 1080)
        : null;
    return () => {
      clearTimeout(openDoorTimer);
      clearTimeout(closeDoorTimer);
      if (showDialogTimer) clearTimeout(showDialogTimer);
    };
  }, [scene.id]);

  useEffect(() => {
    return () => {
      transitionTimersRef.current.forEach((timer) => clearTimeout(timer));
      transitionTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const handleTransitionPreview = (event: Event) => {
      const customEvent = event as CustomEvent<SceneTransitionPayload>;
      const preset = customEvent.detail?.preset;
      if (preset !== "fade-black") return;
      const durationMs = customEvent.detail?.durationMs ?? 380;
      setPreviewTransitionDurationMs(durationMs);
      setPreviewTransitionNonce((prev) => prev + 1);
      const clearTimer = setTimeout(() => {
        setPreviewTransitionDurationMs(null);
      }, durationMs * 2 + 40);
      transitionTimersRef.current.push(clearTimer);
    };
    window.addEventListener(GAME_SCENE_TRANSITION_TRIGGER, handleTransitionPreview);
    return () => {
      window.removeEventListener(GAME_SCENE_TRANSITION_TRIGGER, handleTransitionPreview);
    };
  }, []);

  useEffect(() => {
    if (isWorkTransitionScene) return;
    if (!scene.autoAdvanceMs || !scene.nextSceneId) return;
    const timer = setTimeout(() => {
      router.push(ROUTES.gameScene(scene.nextSceneId!));
    }, scene.autoAdvanceMs);
    return () => clearTimeout(timer);
  }, [isWorkTransitionScene, router, scene.autoAdvanceMs, scene.nextSceneId]);

  useEffect(() => {
    if (!isOffworkRewardOpen) {
      setIsRewardInventoryOpen(false);
      return;
    }
    if (isRewardInventoryOpen) {
      setRewardInventoryTiles(loadPlayerProgress().rewardPlaceTiles);
    }
  }, [isOffworkRewardOpen, isRewardInventoryOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleTypingModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ mode?: DialogTypingMode }>;
      if (!customEvent.detail?.mode) return;
      setDialogTypingMode(customEvent.detail.mode);
    };
    window.addEventListener(GAME_DIALOG_TYPING_MODE_CHANGE, handleTypingModeChange);
    return () => {
      window.removeEventListener(GAME_DIALOG_TYPING_MODE_CHANGE, handleTypingModeChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleComicCheat = (event: Event) => {
      const customEvent = event as CustomEvent<{ comicId?: ComicCheatId }>;
      const comicId = customEvent.detail?.comicId;
      if (!comicId || !(comicId in COMIC_IMAGE_BY_ID)) return;
      comicCheatTimerRefs.current.forEach((timer) => clearTimeout(timer));
      comicCheatTimerRefs.current = [];
      setActiveComicCheatId(comicId);
      setIsComicCheatVisible(true);
      setIsComicCheatFading(false);
      comicCheatTimerRefs.current = [
        setTimeout(() => setIsComicCheatFading(true), 980),
        setTimeout(() => {
          setIsComicCheatVisible(false);
          setIsComicCheatFading(false);
          setActiveComicCheatId(null);
        }, 1360),
      ];
    };
    window.addEventListener(GAME_COMIC_CHEAT_TRIGGER, handleComicCheat);
    return () => {
      window.removeEventListener(GAME_COMIC_CHEAT_TRIGGER, handleComicCheat);
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(unlockFeedbackTimerRefs.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (!isOffworkScene) {
      setIsOffworkLabelVisible(false);
      setIsOffworkRewardOpen(false);
      setSelectedRewardId(null);
      return;
    }

    setIsOffworkLabelVisible(true);
    setIsOffworkRewardOpen(false);
    setSelectedRewardId(null);
    const progress = loadPlayerProgress();
    setNonCorePlaceRewardClaimCount(
      progress.rewardPlaceTiles.filter(
        (tile) =>
          tile.category === "place" &&
          tile.sourceId !== "metro-station" &&
          tile.sourceId !== "street",
      ).length,
    );
    setOffworkRewardChoices(pickOffworkRewardOptions(progress));
    setPlaceRewardCostError("");
    setOffworkRewardPattern(
      generateOffworkRewardPattern(progress.offworkRewardClaimCount === 0, progress.rewardPlaceTiles),
    );

    const labelTimer = setTimeout(() => {
      setIsOffworkLabelVisible(false);
    }, 900);
    const modalTimer = setTimeout(() => {
      setIsOffworkRewardOpen(true);
    }, 1200);

    return () => {
      clearTimeout(labelTimer);
      clearTimeout(modalTimer);
    };
  }, [isOffworkScene, scene.id]);

  useEffect(() => {
    onOffworkRewardOpenChange?.(isOffworkRewardOpen);
    return () => onOffworkRewardOpenChange?.(false);
  }, [isOffworkRewardOpen, onOffworkRewardOpenChange]);

  useEffect(() => {
    if (scene.id !== "scene-7") return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // 第 7 格跌倒演出：先慌張擔心，再左倒消失爬起，最後停在痛。
    timers.push(
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(GAME_AVATAR_EXPRESSION_TRIGGER, { detail: { frameIndex: 13 } }),
        );
      }, 320),
    );
    timers.push(
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(GAME_AVATAR_MOTION_TRIGGER, {
            detail: { motionId: "fall-left-recover" },
          }),
        );
        window.dispatchEvent(
          new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
            detail: { shakeId: "shake-strong" },
          }),
        );
      }, 560),
    );
    // 爬起後切到痛（index 10）。
    timers.push(
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(GAME_AVATAR_EXPRESSION_TRIGGER, { detail: { frameIndex: 10 } }),
        );
      }, 1380),
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [scene.id]);

  useEffect(() => {
    scene9RevealTimerRefs.current.forEach((timer) => clearTimeout(timer));
    scene9RevealTimerRefs.current = [];

    if (scene.id !== "scene-9") {
      setScene9PuppetRevealPhase("hidden");
      return;
    }

    setScene9PuppetRevealPhase("hidden");
    scene9RevealTimerRefs.current = [
      setTimeout(() => {
        setScene9PuppetRevealPhase("prop");
      }, 120),
      setTimeout(() => {
        setScene9PuppetRevealPhase("dialog");
      }, 560),
    ];

    return () => {
      scene9RevealTimerRefs.current.forEach((timer) => clearTimeout(timer));
      scene9RevealTimerRefs.current = [];
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-85" || !scene.backgroundImage) {
      setScenePhotoNaturalImageSize(null);
      return;
    }
    const image = new Image();
    image.src = scene.backgroundImage;
    image.onload = () => {
      setScenePhotoNaturalImageSize({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
  }, [scene.backgroundImage, scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-30") return;
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
          detail: { shakeId: "shake-weak" },
        }),
      );
    }, 80);
    return () => {
      clearTimeout(timer);
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-75") return;
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
          detail: { shakeId: "shake-weak" },
        }),
      );
    }, 60);
    return () => {
      clearTimeout(timer);
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-43" && scene.id !== "scene-49") return;
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
          detail: { shakeId: "shake-weak" },
        }),
      );
    }, 60);
    return () => {
      clearTimeout(timer);
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-84") return;
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
          detail: { shakeId: "flash-white" },
        }),
      );
    }, 60);
    return () => {
      clearTimeout(timer);
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-64") return;
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
          detail: { shakeId: "shake-weak" },
        }),
      );
    }, 60);
    return () => {
      clearTimeout(timer);
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene10ExitTimerRef.current) {
      clearTimeout(scene10ExitTimerRef.current);
      scene10ExitTimerRef.current = null;
    }
    setScene10ExitPhase("idle");
  }, [scene.id]);

  useEffect(() => {
    if (scene14PuppetTimerRef.current) {
      clearTimeout(scene14PuppetTimerRef.current);
      scene14PuppetTimerRef.current = null;
    }
    setScene14PuppetPhase("hidden");
  }, [scene.id]);

  useEffect(() => {
    storyComicTimerRefs.current.forEach((timer) => clearTimeout(timer));
    storyComicTimerRefs.current = [];
    setActiveStoryComicId(null);
    setIsStoryComicVisible(false);
    setIsStoryComicFading(false);
    storyComicOverlayTimerRefs.current.forEach((timer) => clearTimeout(timer));
    storyComicOverlayTimerRefs.current = [];
    setScene4FreshenPhase("idle");
    scene4SequenceTimerRefs.current.forEach((timer) => clearTimeout(timer));
    scene4SequenceTimerRefs.current = [];
    comicCheatTimerRefs.current.forEach((timer) => clearTimeout(timer));
    comicCheatTimerRefs.current = [];
    setActiveComicCheatId(null);
    setIsComicCheatVisible(false);
    setIsComicCheatFading(false);
    setIsContinueExitActive(false);
    if (continueExitTimerRef.current) {
      clearTimeout(continueExitTimerRef.current);
      continueExitTimerRef.current = null;
    }
  }, [scene.id]);

  useLayoutEffect(() => {
    storyComicOverlayTimerRefs.current.forEach((timer) => clearTimeout(timer));
    storyComicOverlayTimerRefs.current = [];
    completedStoryComicOverlayIndexesRef.current = new Set();
    const previousOverlays = previousStoryComicOverlaysRef.current ?? [];
    const nextOverlays = scene.storyComicOverlays ?? [];

    let preservedCount = 0;
    while (
      preservedCount < previousOverlays.length &&
      preservedCount < nextOverlays.length &&
      areStoryComicOverlaysEquivalent(previousOverlays[preservedCount], nextOverlays[preservedCount])
    ) {
      preservedCount += 1;
    }

    setVisibleStoryComicOverlayCount(preservedCount);
    previousStoryComicOverlaysRef.current = nextOverlays;

    if (nextOverlays.length === 0) {
      pendingFinalStoryComicOverlayCountRef.current = 0;
      setAreStoryComicOverlaysComplete(true);
      return;
    }

    pendingFinalStoryComicOverlayCountRef.current = nextOverlays.filter((overlay) => overlay.finalImageId).length;
    setAreStoryComicOverlaysComplete(pendingFinalStoryComicOverlayCountRef.current === 0);

    nextOverlays.forEach((overlay, index) => {
      if (index < preservedCount) return;
      storyComicOverlayTimerRefs.current.push(
        setTimeout(() => {
          setVisibleStoryComicOverlayCount((current) => Math.max(current, index + 1));
        }, overlay.enterDelayMs ?? 0),
      );
    });

    return () => {
      storyComicOverlayTimerRefs.current.forEach((timer) => clearTimeout(timer));
      storyComicOverlayTimerRefs.current = [];
    };
  }, [scene.id, scene.storyComicOverlays]);

  const handleStoryComicOverlaySequenceComplete = useCallback((index: number) => {
    if (!scene.storyComicOverlays?.[index]?.finalImageId) {
      return;
    }
    if (completedStoryComicOverlayIndexesRef.current.has(index)) {
      return;
    }
    completedStoryComicOverlayIndexesRef.current.add(index);
    if (completedStoryComicOverlayIndexesRef.current.size >= pendingFinalStoryComicOverlayCountRef.current) {
      setAreStoryComicOverlaysComplete(true);
    }
  }, [scene.storyComicOverlays]);

  useEffect(() => {
    return () => {
      storyComicTimerRefs.current.forEach((timer) => clearTimeout(timer));
      storyComicOverlayTimerRefs.current.forEach((timer) => clearTimeout(timer));
      scene4SequenceTimerRefs.current.forEach((timer) => clearTimeout(timer));
      comicCheatTimerRefs.current.forEach((timer) => clearTimeout(timer));
      if (continueExitTimerRef.current) {
        clearTimeout(continueExitTimerRef.current);
        continueExitTimerRef.current = null;
      }
      if (scene55BookTimerRef.current) {
        clearTimeout(scene55BookTimerRef.current);
        scene55BookTimerRef.current = null;
      }
      if (diaryOpenTimerRef.current) {
        clearTimeout(diaryOpenTimerRef.current);
        diaryOpenTimerRef.current = null;
      }
    };
  }, []);

  const selectedReward = offworkRewardChoices.find((item) => item.id === selectedRewardId) ?? null;
  const selectedPlaceRewardPattern = useMemo<TilePattern3x3>(() => {
    const isNonCorePlace =
      selectedReward?.id &&
      selectedReward.id !== "street" &&
      selectedReward.id !== "metro-station";
    if (isNonCorePlace && nonCorePlaceRewardClaimCount === 0) {
      return FIRST_NON_CORE_PLACE_PATTERN;
    }
    if (isNonCorePlace && nonCorePlaceRewardClaimCount === 1) {
      return SECOND_NON_CORE_PLACE_PATTERN;
    }
    return offworkRewardPattern;
  }, [
    nonCorePlaceRewardClaimCount,
    offworkRewardPattern,
    selectedReward?.id,
  ]);
  const selectedPlaceRewardBatchPatterns = useMemo<TilePattern3x3[]>(
    () => [selectedPlaceRewardPattern],
    [selectedPlaceRewardPattern],
  );

  const startSceneTransition = (
    nextSceneId: string,
    preset: "fade-black" | "next-day" = "fade-black",
    durationMs = 420,
  ) => {
    if (outgoingTransition) return;
    setOutgoingTransition({ preset, durationMs });

    if (typeof window !== "undefined") {
      const payload: PendingSceneTransitionPayload = {
        toSceneId: nextSceneId,
        preset,
        durationMs,
        createdAt: Date.now(),
      };
      window.sessionStorage.setItem(SCENE_TRANSITION_STORAGE_KEY, JSON.stringify(payload));
    }

    const pushTimer = setTimeout(() => {
      router.push(ROUTES.gameScene(nextSceneId));
    }, durationMs);
    transitionTimersRef.current.push(pushTimer);
  };

  const startPathTransition = (
    nextPath: string,
    preset: "fade-black" | "next-day" = "fade-black",
    durationMs = 420,
  ) => {
    if (outgoingTransition) return;
    setOutgoingTransition({ preset, durationMs });
    const pushTimer = setTimeout(() => {
      router.push(nextPath);
    }, durationMs);
    transitionTimersRef.current.push(pushTimer);
  };

  const handleStoryRequestNext = (nextSceneId: string) => {
    if (CHARACTER_INTRO_BY_SCENE_ID[scene.id] && isCharacterIntroPending) {
      setIsCharacterIntroOpen(true);
      setCharacterIntroNonce((prev) => prev + 1);
      return;
    }
    if (scene.id === LEGACY_ROUTE_TUTORIAL_SCENE_ID) {
      router.push(`${ROUTES.gameArrangeRoute}?tutorial=story41`);
      return;
    }
    if (scene.id === "scene-68") {
      if (!isScene68LocationDiscoveryVisible) {
        setIsScene68LocationDiscoveryVisible(true);
        return;
      }
      startPathTransition(`${ROUTES.gameArrangeRoute}?tutorial=story41`, "fade-black", 420);
      return;
    }
    if (scene.id === "scene-88") {
      unlockDiaryEntry("bai-entry-1");
      markDiaryFirstRevealSeen();
      setUnlockedDiaryEntryIds(loadPlayerProgress().unlockedDiaryEntryIds);
      setDiaryOverlayMode("first-photo-diary-reveal");
      setPendingDiaryNextSceneId("scene-97");
      setIsDiaryOpen(true);
      return;
    }
    if (scene.id === LEGACY_NIGHT_HUB_SCENE_ID) {
      const latestProgress = loadPlayerProgress();
      setIsNightHubMode(true);
      if (shouldShowFirstSunbeastNightHubGuide(latestProgress)) {
        setNightHubGuideStep("sunbeast-dialog");
      }
      return;
    }
    if (scene.id === "scene-10") {
      if (scene10ExitPhase === "exiting") return;
      setScene10ExitPhase("exiting");
      scene10ExitTimerRef.current = setTimeout(() => {
        router.push(ROUTES.gameScene(nextSceneId));
      }, 420);
      return;
    }
    if (scene.continueExitMotionId) {
      if (isContinueExitActive) return;
      setIsContinueExitActive(true);
      const durationMs =
        scene.continueExitDurationMs ?? AVATAR_MOTION_DURATION_MS[scene.continueExitMotionId] ?? 420;
      continueExitTimerRef.current = setTimeout(() => {
        router.push(ROUTES.gameScene(nextSceneId));
      }, durationMs);
      return;
    }
    const transition = scene.nextSceneTransition;
    if (!transition) {
      router.push(ROUTES.gameScene(nextSceneId));
      return;
    }
    const durationMs = transition.durationMs ?? (transition.preset === "next-day" ? 920 : 420);
    startSceneTransition(nextSceneId, transition.preset, durationMs);
  };

  const displayedBackgroundImage = scene.backgroundImage;
  const isScene44Interactive = scene.id === LEGACY_QA_SCENE_ID;
  const isNightHubScene = scene.id === LEGACY_NIGHT_HUB_SCENE_ID;
  const nightHubProgress = isNightHubScene ? loadPlayerProgress() : null;
  const nightHubPlaceUnlockSnapshot = nightHubProgress
    ? getPlaceUnlockSnapshot(nightHubProgress)
    : null;
  const hasCollectedFirstSunbeastForNightHub = nightHubProgress
    ? hasCollectedFirstSunbeast(nightHubProgress)
    : false;
  const shouldStartFirstSunbeastNightHubGuide = nightHubProgress
    ? shouldShowFirstSunbeastNightHubGuide(nightHubProgress)
    : false;
  const effectiveNightHubGuideStep =
    nightHubGuideStep ?? (shouldStartFirstSunbeastNightHubGuide ? "sunbeast-dialog" : null);
  const isNightHubInteractive = isNightHubScene;
  const isMorningHubInteractive = scene.id === "scene-morning-hub";
  const afterOffworkRewardSceneId = hasCollectedFirstSunbeast(nightHubProgress ?? loadPlayerProgress())
    ? LEGACY_NIGHT_HUB_SCENE_ID
    : AFTER_REWARD_SCENE_ID;
  const isScene44InnerThought =
    scene.id === LEGACY_QA_SCENE_ID && (scene44Step === "intro" || scene44Step === "choose");
  const isInnerThoughtScene = isScene44InnerThought;
  const allScene44Asked = scene44Asked.metro && scene44Asked.dog;
  const scene44QAPack = {
    metro: {
      question: "早上怎麼知道小日獸會出現在捷運站",
      answer:
        "一整晚很擔心的待在小白旁邊，忽然感覺到一股能量，感應到那邊有我最熟悉的小日獸",
    },
    dog: {
      question: "黃金獵犬拍攝到後回到日記上？",
      answer: "對是直太郎，他最親近了",
    },
  } as const;
  const scene44FinalPack = {
    question: "那交換日記跟小白昏迷的關係嗎",
    answer: "突然有股能量將我和小日獸從日記中擠出來，那些日記片段也都消失了",
  } as const;
  const scene44Speaker =
    scene44Step === "intro"
      ? "小麥（心裡話）"
      : scene44Step === "choose"
        ? "小麥（心裡話）"
        : scene44Step === "qa"
          ? scene44QATurn === 0
            ? "小麥"
            : "小貝狗"
          : scene44FinalTurn === 0
            ? "小麥"
            : "小貝狗";
  const scene44Text =
    scene44Step === "intro"
      ? scene.dialogue
      : scene44Step === "choose"
        ? allScene44Asked
          ? "線索都問到了，最後再確認一件事..."
          : "先問問小貝狗，釐清目前的線索。"
        : scene44Step === "qa"
          ? scene44Topic
            ? scene44QATurn === 0
              ? scene44QAPack[scene44Topic].question
              : scene44QAPack[scene44Topic].answer
            : ""
          : scene44FinalTurn === 0
            ? scene44FinalPack.question
            : scene44FinalPack.answer;

  const nightHubSpeaker =
    nightHubStep === "talk" ? (nightHubTopic === "beigo" ? "小貝狗" : "小麥") : "小麥";
  const nightHubText =
    nightHubStep === "choose"
      ? "要做什麼呢？"
      : nightHubStep === "chat-select"
        ? "想先和誰聊聊呢？"
      : nightHubTopic === "bai"
        ? "先去門口看了一下，小白房間還是安安靜靜的……先讓她休息吧。"
        : "我會陪著妳，我們明天再一起找線索，嗷。";
  const nightHubSunbeastFollowupLines = [
    {
      speaker: "小麥",
      text: "原來不只直太郎……現在連街道也解鎖了，其他小日獸怎麼出現，好像也開始有方向了。",
      spriteId: "mai" as const,
      frameIndex: 0,
    },
    {
      speaker: "小貝狗",
      text: "嗷，線索都浮上來了！只要照著那些條件繼續遇到牠們，消失的日記內容說不定就會一點一點回來。",
      spriteId: "beigo" as const,
      frameIndex: 1,
    },
    {
      speaker: "小麥",
      text: "那我們就繼續去找牠們吧。把小日獸一隻一隻遇回來，看看能不能把日記慢慢復原。",
      spriteId: "mai" as const,
      frameIndex: 1,
    },
  ] as const;
  const activeNightHubSunbeastFollowupLine =
    nightHubSunbeastFollowupIndex !== null
      ? nightHubSunbeastFollowupLines[nightHubSunbeastFollowupIndex]
      : null;
  const shouldHideNightHubIconsForGuide = effectiveNightHubGuideStep === "sunbeast-dialog";
  const shouldShowNightHubSunbeastPointer = effectiveNightHubGuideStep === "sunbeast-pointer";
  const shouldShowNightHubPlacePointer = effectiveNightHubGuideStep === "place-pointer";
  const shouldShowNightHubMissionPointer = effectiveNightHubGuideStep === "mission-pointer";
  const shouldFocusNightHubSunbeastButton = shouldShowNightHubSunbeastPointer;
  const shouldFocusNightHubPlaceButton = shouldShowNightHubPlacePointer;
  const shouldFocusNightHubMissionButton = shouldShowNightHubMissionPointer;
  const shouldFocusNightHubIconRail =
    shouldFocusNightHubSunbeastButton ||
    shouldFocusNightHubPlaceButton ||
    shouldFocusNightHubMissionButton;
  const shouldBlockNightHubIconRail = shouldFocusNightHubSunbeastButton;
  const shouldShowNightHubMission =
    Boolean(nightHubProgress?.ownedPlaceTileIds.includes("street")) ||
    Boolean(nightHubProgress && hasFirstStreetRewardPatterns(nightHubProgress.rewardPlaceTiles)) ||
    Boolean((nightHubProgress?.streetPassCount ?? 0) > 0);
  const isNightHubMissionPanelOpen = isNightHubMissionOpen;

  const handleNightHubSelectTopic = (topic: "bai" | "beigo") => {
    setNightHubGuideStep(null);
    setNightHubTopic(topic);
    setNightHubStep("talk");
  };

  const handleNightHubEnterChat = () => {
    setNightHubGuideStep(null);
    setNightHubStep("chat-select");
    setNightHubTopic(null);
  };

  const handleNightHubBackToMenu = () => {
    setNightHubStep("choose");
    setNightHubTopic(null);
  };

  const handleOpenDiary = (entry: "journal" | "sunbeast" = "journal") => {
    setNightHubGuideStep(null);
    const latestProgress = loadPlayerProgress();
    const latestUnlocked = latestProgress.unlockedDiaryEntryIds;
    setUnlockedDiaryEntryIds(latestUnlocked);
    if (scene.id === LEGACY_NIGHT_HUB_SCENE_ID && !hasCollectedFirstSunbeast(latestProgress)) {
      setDiaryOverlayMode("sunbeast-reveal");
    } else if (entry === "sunbeast") {
      setDiaryOverlayMode("sunbeast");
    } else {
      setDiaryOverlayMode("default");
    }
    setIsDiaryOpen(true);
    setIsSceneMenuOpen(false);
  };

  const unlockStreetFromNightHubGuide = () => {
    const current = loadPlayerProgress();
    if (hasFirstStreetRewardPatterns(current.rewardPlaceTiles)) return current;
    const nextStreetTiles: RewardPlaceTile[] = FIRST_STREET_REWARD_PATTERNS.filter(
      (pattern) =>
        !current.rewardPlaceTiles.some(
          (tile) =>
            tile.category === "place" &&
            tile.sourceId === "street" &&
            tilePatternKey(tile.pattern) === tilePatternKey(pattern),
        ),
    ).map((pattern, index) => ({
      instanceId: `street-night-hub-${tilePatternKey(pattern)}-${index}`,
      sourceId: "street",
      category: "place",
      label: FIRST_STREET_REWARD_LABELS[index] ?? `街道 ${index + 1}`,
      centerEmoji: "💡",
      pattern,
    }));
    const next = {
      ...current,
      ownedPlaceTileIds: current.ownedPlaceTileIds.includes("street")
        ? current.ownedPlaceTileIds
        : [...current.ownedPlaceTileIds, "street" as PlaceTileId],
      rewardPlaceTiles: [...current.rewardPlaceTiles, ...nextStreetTiles],
    };
    savePlayerProgress(next);
    return next;
  };

  const handleOpenPlaceMap = () => {
    const shouldPlayStreetUnlockGuide =
      effectiveNightHubGuideStep === "place-pointer" &&
      hasCollectedFirstSunbeast(loadPlayerProgress());
    if (shouldPlayStreetUnlockGuide) {
      unlockStreetFromNightHubGuide();
      setNightHubStreetUnlockGuideStep("unlocking-street");
      if (nightHubStreetUnlockGuideTimerRef.current) {
        clearTimeout(nightHubStreetUnlockGuideTimerRef.current);
      }
      nightHubStreetUnlockGuideTimerRef.current = setTimeout(() => {
        setNightHubStreetUnlockGuideStep("beigo-street");
        nightHubStreetUnlockGuideTimerRef.current = null;
      }, 980);
    }
    setNightHubGuideStep(null);
    setIsNightHubPlaceMapOpen(true);
    setIsSceneMenuOpen(false);
  };

  const handleNightHubStreetUnlockGuideContinue = () => {
    if (nightHubStreetUnlockGuideStep === "beigo-street") {
      setNightHubStreetUnlockGuideStep("mai-street");
      return;
    }
    if (nightHubStreetUnlockGuideStep === "mai-street") {
      setNightHubStreetUnlockGuideStep("beigo-shop");
      return;
    }
    if (nightHubStreetUnlockGuideStep === "beigo-shop") {
      setNightHubStreetUnlockGuideStep("shop-condition");
      return;
    }
    if (nightHubStreetUnlockGuideStep === "shop-condition") {
      setIsNightHubPlaceMapOpen(false);
      setNightHubStreetUnlockGuideStep(null);
      setNightHubGuideStep("mission-pointer");
      return;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_SEEN_KEY, "1");
    }
    setNightHubStreetUnlockGuideStep(null);
  };

  const handleCloseNightHubMission = () => {
    setIsNightHubMissionOpen(false);
    setIsNightHubMissionIntroOpen(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_SEEN_KEY, "1");
    }
    setNightHubGuideStep((prev) => (prev === "mission-pointer" ? null : prev));
    setNightHubStreetUnlockGuideStep(null);
  };

  const handleOpenNightHubMission = () => {
    if (!shouldShowNightHubMission) return;
    if (effectiveNightHubGuideStep === "mission-pointer") {
      setIsNightHubMissionIntroOpen(true);
      setNightHubGuideStep(null);
    } else {
      setIsNightHubMissionOpen(true);
    }
    setIsSceneMenuOpen(false);
  };

  const handleNightHubMissionIntroContinue = () => {
    setIsNightHubMissionIntroOpen(false);
    setIsNightHubMissionOpen(true);
  };

  const handleNightHubContinue = () => {
    if (nightHubStep !== "talk" || !nightHubTopic) return;
    setNightHubAsked((prev) => ({ ...prev, [nightHubTopic]: true }));
    setNightHubStep("choose");
    setNightHubTopic(null);
  };

  const handleNightHubSunbeastFollowupContinue = () => {
    if (nightHubSunbeastFollowupIndex === null) return;
    if (nightHubSunbeastFollowupIndex >= nightHubSunbeastFollowupLines.length - 1) {
      setNightHubSunbeastFollowupIndex(null);
      setNightHubStep("choose");
      return;
    }
    setNightHubSunbeastFollowupIndex((prev) => (prev === null ? prev : prev + 1));
  };

  const handleNightHubGuideContinue = () => {
    if (effectiveNightHubGuideStep !== "sunbeast-dialog") return;
    const latestProgress = loadPlayerProgress();
    if (shouldShowFirstSunbeastNightHubGuide(latestProgress)) {
      savePlayerProgress({
        ...latestProgress,
        hasSeenFirstSunbeastNightHubGuide: true,
        hasSeenFirstSunbeastNightHubGuideV2: true,
        hasSeenFirstSunbeastNightHubGuideV3: true,
        hasPendingFirstSunbeastNightHubGuide: false,
      });
    }
    setNightHubGuideStep("sunbeast-pointer");
    setIsNightHubMode(true);
    setNightHubStep("choose");
    setNightHubTopic(null);
  };

  const advanceToNextDay = (summaryOverride?: EndDaySummaryContent) => {
    if (endDaySequencePhase !== "none") return;
    const latestProgress = loadPlayerProgress();
    const currentDay = Math.max(1, Math.floor(latestProgress.currentDay || 1));
    const nextDay = currentDay + 1;
    savePlayerProgress({
      ...latestProgress,
      currentDay: nextDay,
      status: {
        ...latestProgress.status,
        fatigue: Math.max(0, latestProgress.status.fatigue - 20),
        actionPower: Math.max(0, Math.min(6, latestProgress.status.actionPower + 1)),
      },
    });
    rolloverDailyEventFlags();
    setCurrentDay(nextDay);
    setWeekendDestinationOptions(buildWeekendDestinationOptions(loadPlayerProgress()));
    setWeekendSelectedDestination(null);
    setEndDayTransitionText({
      toDayLabel: `第${nextDay}天`,
      fromDateLabel: formatInGameDateLabel(currentDay),
      toDateLabel: formatInGameDateLabel(nextDay),
    });
    setEndDaySummaryContent(
      summaryOverride ?? {
        title: "今天先告一段落",
        body: "回到家後好好休息了一下，把今天的疲累慢慢放下，準備迎接明天。",
        chips: ["疲勞 -20", "行動力 +1"],
      },
    );

    setIsEndDaySummaryLeaving(false);
    setEndDaySequencePhase("summary");
    const leaveSummaryTimer = setTimeout(() => {
      setIsEndDaySummaryLeaving(true);
    }, 2100);
    const showDay2Timer = setTimeout(() => {
      setEndDaySequencePhase("black");
      setIsEndDaySummaryLeaving(false);
    }, 2520);
    const nextMorningTimer = setTimeout(() => {
      if (scene.id === "scene-morning-hub") {
        setEndDaySequencePhase("none");
        setIsEndDaySummaryLeaving(false);
        setEndDayTransitionText(null);
        setEndDaySummaryContent(null);
        return;
      }
      router.push(ROUTES.gameScene("scene-morning-hub"));
    }, 4300);
    transitionTimersRef.current.push(leaveSummaryTimer, showDay2Timer, nextMorningTimer);
  };

  const handleNightHubSleep = () => {
    setNightHubGuideStep(null);
    advanceToNextDay();
  };

  const handleWeekendDestinationSelect = (destination: WeekendDestinationOption) => {
    const latestProgress = loadPlayerProgress();
    const nextStatus = destination.applyStatus(latestProgress.status);
    savePlayerProgress({
      ...latestProgress,
      status: nextStatus,
    });
    setWeekendSelectedDestination(destination);
  };

  const handleWeekendEndDay = () => {
    if (!weekendSelectedDestination) return;
    advanceToNextDay({
      title: `${weekendSelectedDestination.title}的小旅行結束了`,
      body: weekendSelectedDestination.resultText,
      chips: [weekendSelectedDestination.effectLabel, "今晚早點休息"],
    });
  };

  const handleScene44Continue = () => {
    if (scene44Step === "intro") {
      setScene44Step("choose");
      return;
    }
    if (scene44Step === "qa") {
      if (scene44QATurn === 0) {
        setScene44QATurn(1);
        return;
      }
      if (scene44Topic) {
        setScene44Asked((prev) => ({ ...prev, [scene44Topic]: true }));
      }
      if (allScene44Asked || (scene44Topic === "metro" && scene44Asked.dog) || (scene44Topic === "dog" && scene44Asked.metro)) {
        setScene44Step("final");
        setScene44FinalTurn(0);
        return;
      }
      setScene44Step("choose");
      setScene44Topic(null);
      setScene44QATurn(0);
      return;
    }
    if (scene44Step === "final") {
      if (scene44FinalTurn === 0) {
        setScene44FinalTurn(1);
        return;
      }
      router.push(ROUTES.gameScene("scene-45"));
    }
  };

  const handleScene44SelectTopic = (topic: "metro" | "dog") => {
    setScene44Topic(topic);
    setScene44QATurn(0);
    setScene44Step("qa");
  };
  const isWeekendMorningHub = isMorningHubInteractive && isWeekendInGameDay(currentDay);
  const isScene5OutfitReveal = scene.scenePresentation === "outfit-reveal";
  const isScene47Revealing = scene.id === "scene-47" && scene47RevealPhase === "revealing";
  const shouldHideDialogByDoorTransition =
    (scene.id === LEGACY_NIGHT_HUB_SCENE_ID && isDoorTransitionVisible) ||
    isScene47Revealing ||
    (scene.id === "scene-55" && scene55BookPhase !== "dialog") ||
    (isScene5OutfitReveal && scene5OutfitRevealPhase !== "dialog") ||
    scene.autoOpenCharacterIntro === true ||
    isCharacterIntroOpen;
  const shouldShowSceneDialogPanel = !shouldHideDialogByDoorTransition;
  const shouldShowSceneQuickActions = !shouldHideDialogByDoorTransition;
  const isMetroDogPhotoCaptureScene = scene.id === "scene-85";
  const isDiaryConversationScene = DIARY_CONVERSATION_SCENE_IDS.has(scene.id);
  const isDiaryPageConversationActive = isDiaryConversationScene;

  const handleMetroDogPhotoConfirm = (capture: PhotoCaptureResult) => {
    recordPhotoCapture({
      sourceImage: capture.sourceImage,
      previewImage: capture.framePreviewUrl,
      dogCoveragePercent: capture.score,
      cameraFrameRect: capture.normalizedCameraFrameRect,
      capturedRect: capture.normalizedCroppedRect,
    });
    if (!scene.nextSceneId) return;
    router.push(ROUTES.gameScene(scene.nextSceneId));
  };

  return (
    <Flex w={{ base: "100vw", sm: "393px" }} maxW="393px" h={{ base: "100dvh", sm: "852px" }} maxH="852px" position="relative">
      <Flex
        ref={sceneBackgroundRef}
        w="100%"
        h="100%"
        bgColor={scene.backgroundColor ?? "#D6D4B9"}
        position="relative"
        borderRadius={{ base: "0", sm: "20px" }}
        overflow="hidden"
        boxShadow={{ base: "none", sm: "0 10px 30px rgba(0, 0, 0, 0.12)" }}
        direction="column"
        backgroundImage={displayedBackgroundImage ? `url('${displayedBackgroundImage}')` : undefined}
        backgroundSize={isMetroDogPhotoCaptureScene ? "contain" : "cover"}
        backgroundPosition={isMetroDogPhotoCaptureScene ? "center center" : "center bottom"}
        backgroundRepeat="no-repeat"
        animation={backgroundShakeAnimation}
      >
        <EventBackgroundFxLayer effectId={activeEffectId} effectNonce={effectNonce} />
        {scene.id === "scene-32" ? (
          <>
            <Flex
              position="absolute"
              inset="0"
              zIndex={3}
              pointerEvents="none"
              bg="linear-gradient(180deg, rgba(3,3,4,0.18), rgba(3,3,4,0.48)), radial-gradient(circle at 56% 32%, rgba(255,232,162,0.08), transparent 42%)"
              animation={`${scene32MemoryWash} 520ms ease-out both`}
            />
            <Flex
              position="absolute"
              top="-120px"
              left="-220px"
              w="520px"
              h="1160px"
              zIndex={8}
              pointerEvents="none"
              bg="linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(7,6,6,0.98) 72%, rgba(0,0,0,0.82) 100%)"
              transformOrigin="center"
              animation={`${scene32LeftCurtainReveal} 880ms cubic-bezier(0.2, 0.82, 0.22, 1) both`}
            />
            <Flex
              position="absolute"
              top="-120px"
              right="-220px"
              w="520px"
              h="1160px"
              zIndex={8}
              pointerEvents="none"
              bg="linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(7,6,6,0.98) 28%, rgba(0,0,0,1) 100%)"
              transformOrigin="center"
              animation={`${scene32RightCurtainReveal} 880ms cubic-bezier(0.2, 0.82, 0.22, 1) both`}
            />
            <Flex
              position="absolute"
              left="50%"
              top="300px"
              w="300px"
              h="230px"
              zIndex={6}
              pointerEvents="none"
              borderRadius="999px"
              bg="radial-gradient(circle, rgba(255, 226, 148, 0.34) 0%, rgba(255, 226, 148, 0.14) 40%, transparent 72%)"
              animation={`${scene32ClueGlow} 980ms ease-out 140ms both`}
            />
          </>
        ) : null}
        {isScene47Revealing ? (
          <>
            <Flex
              position="absolute"
              inset="0"
              zIndex={17}
              pointerEvents="none"
              bg="radial-gradient(circle at 50% 36%, rgba(255,232,170,0.12), transparent 42%), rgba(0,0,0,0.08)"
            />
            <Flex
              position="absolute"
              top="0"
              bottom="0"
              left="0"
              w="108%"
              zIndex={18}
              pointerEvents="none"
              overflow="visible"
              bg="linear-gradient(90deg, #010101 0%, #020202 86%, #080706 96%, rgba(0,0,0,0.9) 100%)"
              boxShadow="22px 0 34px rgba(0,0,0,0.52)"
              animation={`${scene47LeftCurtainReveal} 1360ms cubic-bezier(0.22, 0.74, 0.18, 1) both`}
            >
              <Flex
                position="absolute"
                top="0"
                right="-4px"
                bottom="0"
                w="10px"
                bg="linear-gradient(90deg, rgba(0,0,0,0.08), rgba(255,229,158,0.52), rgba(255,247,211,0.92))"
                filter="blur(0.4px)"
                animation={`${scene47DoorLightReveal} 1360ms ease-out both`}
              />
            </Flex>
          </>
        ) : null}
        {shouldShowNarrativeFocusLayer ? (
          <NarrativeFocusLayer animateIn={!didPreviousSceneShowNarrativeFocus} />
        ) : null}
        {isMetroDogPhotoCaptureScene && displayedBackgroundImage ? (
          <EventPhotoCaptureLayer
            enabled
            backgroundRef={sceneBackgroundRef}
            backgroundImageSrc={displayedBackgroundImage}
            naturalImageSize={scenePhotoNaturalImageSize}
            fitMode="contain"
            targetRectNormalized={METRO_DOG_TARGET_RECT_NORMALIZED}
            passScore={60}
            hintText="點擊快門捕捉小日獸"
            tutorialTitle="拍下小日獸"
            tutorialLines={[
              "等白色框框移到黃金獵犬身上。",
              "覺得位置差不多了，就按下快門！",
            ]}
            tutorialConfirmLabel="開始拍照"
            freeRetakeOfferText="第一次拍照可以免費重拍一次。要再試一次嗎？"
            freeRetakeButtonLabel="免費重拍"
            keepPhotoButtonLabel="收下這張"
            frameSweepFromY={20}
            frameSweepToY={604}
            targetFadeLeadPx={50}
            onConfirm={handleMetroDogPhotoConfirm}
          />
        ) : null}
        {scene.id === "scene-68" && isScene68LocationDiscoveryVisible ? (
          <SceneLocationDiscoveryBanner title="捷運" iconPath="/images/icon/mrt.png" />
        ) : null}
        <UnlockFeedbackOverlay items={unlockFeedbackItems} />
        {isInnerThoughtScene ? (
          <Flex pointerEvents="none" position="absolute" inset="0" zIndex={1}>
            <Flex
              position="absolute"
              inset="0"
              bg="linear-gradient(180deg, rgba(28,24,36,0.48) 0%, rgba(15,12,20,0.56) 100%)"
            />
            <Flex
              position="absolute"
              top="18px"
              right="18px"
              px="10px"
              py="4px"
              borderRadius="999px"
              bgColor="rgba(20,18,28,0.72)"
              border="1px solid rgba(255,255,255,0.22)"
            >
              <Text color="#E6DAFF" fontSize="12px" fontWeight="700" letterSpacing="0.04em">
                心裡話
              </Text>
            </Flex>
          </Flex>
        ) : null}
        {shouldShowNarrativeFocusLayer || isDiaryConversationScene || isScene47Revealing ? null : isImageOnlyScene ? (
          <>
            {scene.sceneLabel && (!isOffworkScene || isOffworkLabelVisible) ? (
              <Flex
                position="absolute"
                top="50%"
                left="0"
                right="0"
                transform="translateY(-50%)"
                bgColor="rgba(132, 104, 76, 0.92)"
                h="104px"
                alignItems="center"
                justifyContent="center"
                opacity={isOffworkScene && !isOffworkLabelVisible ? 0 : 1}
                transition="opacity 0.25s ease"
              >
                <Text color="white" fontSize="56px" fontWeight="700" letterSpacing="2px">
                  {scene.sceneLabel}
                </Text>
              </Flex>
            ) : null}
          </>
        ) : (
          <Flex position="absolute" top="18px" left="18px">
            <Text color="white" fontWeight="700" fontSize="24px" textShadow="0 2px 6px rgba(0,0,0,0.35)">
              {scene.sceneLabel ?? ""}
            </Text>
          </Flex>
        )}

        {scene.characterAvatar ? (
          <Flex position="absolute" top="140px" left="50%" transform="translateX(-50%)">
            <Flex
              w="88px"
              h="88px"
              borderRadius="999px"
              overflow="hidden"
              border="3px solid white"
              boxShadow="0 4px 14px rgba(0,0,0,0.25)"
              alignItems="center"
              justifyContent="center"
              bgColor="#E8E1D8"
            >
              <img
                src={scene.characterAvatar}
                alt={scene.characterName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Flex>
          </Flex>
        ) : null}

        {isCharacterIntroOpen ? (
          <Flex
            key={`character-intro-${scene.id}-${characterIntroNonce}`}
            position="absolute"
            inset="0"
            zIndex={76}
            onClick={handleCloseCharacterIntro}
            bg="linear-gradient(180deg, rgba(20,25,28,0.26) 0%, rgba(18,20,22,0.46) 100%)"
            animation={`${characterIntroBgFadeIn} 360ms ease-out`}
            overflow="hidden"
          >
            {(() => {
              const intro = CHARACTER_INTRO_BY_SCENE_ID[scene.id];
              if (!intro) return null;
              const spriteScale = 0.48;
              const spriteWidth = 500;
              const spriteHeight = 627;
              const spriteCol = intro.spriteFrameIndex % intro.spriteCols;
              const spriteRow = Math.floor(intro.spriteFrameIndex / intro.spriteCols);

              return (
                <>
                  <Flex
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    h="122px"
                    bgColor={intro.theme.topBar}
                    borderBottom="4px solid rgba(255,255,255,0.42)"
                  />
                  <Flex
                    position="absolute"
                    left="-32%"
                    top="31%"
                    w="175%"
                    h="228px"
                    bgColor={intro.theme.band}
                    borderTop={`6px solid ${intro.theme.bandBorder}`}
                    borderBottom={`6px solid ${intro.theme.bandBorder}`}
                    transform="rotate(-16deg)"
                    transformOrigin="center"
                    animation={`${characterIntroBandSlideIn} 520ms cubic-bezier(0.2, 0.8, 0.2, 1)`}
                  />
                  <Flex
                    pointerEvents="none"
                    position="absolute"
                    left="40px"
                    top="244px"
                    zIndex={3}
                    direction="column"
                    gap="5px"
                    animation={`${characterIntroTextFadeIn} 380ms ease-out 110ms both`}
                  >
                    <Text color="white" fontSize="43px" fontWeight="800" lineHeight="1">
                      {intro.name}
                    </Text>
                    <Text color="rgba(255,255,255,0.95)" fontSize="34px" fontWeight="800" lineHeight="1.1" letterSpacing="0.05em">
                      {intro.englishName}
                    </Text>
                    <Text color="white" fontSize="17px" lineHeight="1.5" fontWeight="600">
                      {intro.descriptionLines[0]}
                      <br />
                      {intro.descriptionLines[1]}
                    </Text>
                  </Flex>
                  <Flex
                    pointerEvents="none"
                    position="absolute"
                    right="20px"
                    top="226px"
                    zIndex={3}
                    transform="rotate(90deg)"
                    transformOrigin="center"
                    animation={`${characterIntroTextFadeIn} 380ms ease-out 180ms both`}
                  >
                    <Text color="rgba(255,255,255,0.96)" fontSize="16px" fontWeight="800" letterSpacing="0.2em">
                      {intro.englishName}
                    </Text>
                  </Flex>
                  <Flex
                    pointerEvents="none"
                    position="absolute"
                    left="50%"
                    bottom="152px"
                    w="220px"
                    h="46px"
                    borderRadius="999px"
                    bgColor="rgba(255,255,255,0.82)"
                    filter="blur(6px)"
                    transform="translateX(-50%)"
                    animation={`${characterIntroGlowPulse} 1.7s ease-in-out infinite`}
                  />
                  <Flex
                    pointerEvents="none"
                    position="absolute"
                    left="50%"
                    bottom="20px"
                    zIndex={4}
                    w="238px"
                    h="300px"
                    transform="translateX(-50%)"
                    animation={`${characterIntroAvatarRise} 500ms ease-out 120ms both`}
                    overflow="hidden"
                  >
                    <img
                      src={intro.spriteSheetPath}
                      alt={`${intro.name} intro sprite`}
                      style={{
                        width: `${spriteWidth * intro.spriteCols * spriteScale}px`,
                        height: `${spriteHeight * intro.spriteRows * spriteScale}px`,
                        transform: `translate(${-spriteCol * spriteWidth * spriteScale}px, -${spriteRow * spriteHeight * spriteScale}px)`,
                        display: "block",
                        maxWidth: "none",
                      }}
                    />
                  </Flex>
                  <Flex
                    position="absolute"
                    right="30px"
                    top="466px"
                    zIndex={5}
                    h="42px"
                    minW="116px"
                    px="18px"
                    borderRadius="999px"
                    border="2px solid rgba(255,255,255,0.5)"
                    bgColor={intro.theme.button}
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    animation={`${characterIntroOkPulse} 1.4s ease-in-out infinite`}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCloseCharacterIntro();
                    }}
                  >
                    <Text color={intro.theme.buttonText} fontSize="24px" fontWeight="800" letterSpacing="0.16em" ml="4px">
                      OK
                    </Text>
                  </Flex>
                  <Flex
                    position="absolute"
                    bottom="0"
                    left="0"
                    right="0"
                    h="108px"
                    bgColor={intro.theme.topBar}
                    borderTop="4px solid rgba(255,255,255,0.42)"
                  />
                  <Flex position="absolute" inset="0" onClick={handleCloseCharacterIntro} />
                </>
              );
            })()}
          </Flex>
        ) : null}

	        {isImageOnlyScene ||
	        isDiaryConversationScene ||
	        !shouldShowSceneQuickActions ||
	        (isNightHubInteractive && shouldHideNightHubIconsForGuide) ? null : (
	          <DialogQuickActions
	            onOpenHistory={() => setIsHistoryOpen(true)}
	            onOpenOptions={() => setIsSceneMenuOpen(true)}
	            placement={isNightHubInteractive ? "top-right" : "dialog"}
	            onOpenDiary={
	              scene.id === LEGACY_NIGHT_HUB_SCENE_ID && !isNightHubInteractive
	                ? () => {
	                  handleOpenDiary();
	                }
                : undefined
            }
          />
        )}

        {isSceneMenuOpen ? (
          <Flex
            position="absolute"
            inset="0"
            zIndex={72}
            bgColor="rgba(18,14,10,0.52)"
            alignItems="center"
            justifyContent="center"
            p="24px"
            onClick={() => setIsSceneMenuOpen(false)}
          >
            <Flex
              w="100%"
              maxW="280px"
              borderRadius="14px"
              border="2px solid rgba(255,255,255,0.3)"
              bgColor="rgba(95,74,56,0.96)"
              boxShadow="0 14px 30px rgba(0,0,0,0.35)"
              p="14px"
              direction="column"
              gap="10px"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <Text color="#FFF2E3" fontSize="15px" fontWeight="700" px="6px">
                選單
              </Text>
              <Flex
                h="40px"
                borderRadius="10px"
                bgColor={
                  scene.id === LEGACY_NIGHT_HUB_SCENE_ID && isNightHubMode
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(255,255,255,0.18)"
                }
                border="1px solid rgba(255,255,255,0.26)"
                alignItems="center"
                justifyContent="center"
                cursor={scene.id === LEGACY_NIGHT_HUB_SCENE_ID && isNightHubMode ? "default" : "pointer"}
                onClick={() => {
                  if (scene.id === LEGACY_NIGHT_HUB_SCENE_ID && isNightHubMode) return;
                  setIsSceneMenuOpen(false);
                  if (scene.id === LEGACY_NIGHT_HUB_SCENE_ID) {
                    const latestProgress = loadPlayerProgress();
                    if (!latestProgress.hasSeenSunbeastFirstReveal) {
                      handleOpenDiary();
                      return;
                    }
                    setIsNightHubMode(true);
                    return;
                  }
                  router.push(ROUTES.gameScene(LEGACY_NIGHT_HUB_SCENE_ID));
                }}
              >
                <Text color="white" fontSize="14px" fontWeight="700">
                  {scene.id === LEGACY_NIGHT_HUB_SCENE_ID && isNightHubMode ? "目前已在夜間 Hub" : "前往夜間 Hub"}
                </Text>
              </Flex>
              <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="8px">
                <Flex
                  h="40px"
                  borderRadius="10px"
                  bgColor={
                    unlockedDiaryEntryIds.length > 0 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)"
                  }
                  border="1px solid rgba(255,255,255,0.26)"
                  alignItems="center"
                  justifyContent="center"
                  cursor={unlockedDiaryEntryIds.length > 0 ? "pointer" : "default"}
                  onClick={() => {
                    if (unlockedDiaryEntryIds.length <= 0) return;
                    handleOpenDiary("journal");
                  }}
                >
                  <Text color="white" fontSize="14px" fontWeight="700">
                    {unlockedDiaryEntryIds.length > 0 ? "交換日記" : "日記未解鎖"}
                  </Text>
                </Flex>
                <Flex
                  h="40px"
                  borderRadius="10px"
                  bgColor={
                    unlockedDiaryEntryIds.length > 0 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)"
                  }
                  border="1px solid rgba(255,255,255,0.26)"
                  alignItems="center"
                  justifyContent="center"
                  cursor={unlockedDiaryEntryIds.length > 0 ? "pointer" : "default"}
                  onClick={() => {
                    if (unlockedDiaryEntryIds.length <= 0) return;
                    handleOpenDiary("sunbeast");
                  }}
                >
                  <Text color="white" fontSize="14px" fontWeight="700">
                    {unlockedDiaryEntryIds.length > 0 ? "小日獸圖鑑" : "圖鑑未解鎖"}
                  </Text>
                </Flex>
              </Grid>
              <Flex direction="column" gap="6px" px="4px" py="2px">
                <Text color="#FCECDD" fontSize="12px" fontWeight="700">
                  對話速度
                </Text>
                <Grid templateColumns="repeat(4, minmax(0, 1fr))" gap="6px">
                  {([
                    { key: "char", label: "逐字" },
                    { key: "double-char", label: "雙字" },
                    { key: "punctuated", label: "標點" },
                    { key: "pause", label: "停頓" },
                  ] as Array<{ key: DialogTypingMode; label: string }>).map((mode) => (
                    <Flex
                      key={mode.key}
                      h="28px"
                      borderRadius="999px"
                      border="1px solid rgba(255,255,255,0.26)"
                      bgColor={
                        dialogTypingMode === mode.key
                          ? "rgba(255,255,255,0.26)"
                          : "rgba(255,255,255,0.08)"
                      }
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      onClick={() => {
                        setDialogTypingMode(mode.key);
                        saveDialogTypingMode(mode.key);
                      }}
                    >
                      <Text color="white" fontSize="11px" fontWeight="700">
                        {mode.label}
                      </Text>
                    </Flex>
                  ))}
                </Grid>
              </Flex>
              <Flex
                h="36px"
                borderRadius="999px"
                bgColor="rgba(255,255,255,0.12)"
                border="1px solid rgba(255,255,255,0.22)"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                onClick={() => setIsSceneMenuOpen(false)}
              >
                <Text color="#FCECDD" fontSize="13px" fontWeight="700">
                  關閉
                </Text>
              </Flex>
            </Flex>
          </Flex>
        ) : null}

        {scene.id === "scene-4" ? (
          <Flex
            position="absolute"
            top="142px"
            left="50%"
            transform={isStoryComicVisible ? "translate(-50%, 0)" : "translate(-50%, 8px)"}
            zIndex={7}
            w="80%"
            maxW="290px"
            pointerEvents="none"
            opacity={scene4FreshenPhase === "comic-visible" ? 1 : scene4FreshenPhase === "comic-fade" ? 0 : 0}
            transition="opacity 320ms ease, transform 320ms ease"
          >
            <img
              src={COMIC_IMAGE_BY_ID.freshen}
              alt="freshen comic"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        {scene.storySingleComicPanel ? (
          <Flex
            position="absolute"
            top={scene.storySingleComicPanel.top}
            left={scene.storySingleComicPanel.centered ? "50%" : scene.storySingleComicPanel.left}
            right={scene.storySingleComicPanel.right}
            zIndex={scene.storySingleComicPanel.zIndex ?? 7}
            w={scene.storySingleComicPanel.width}
            h={scene.storySingleComicPanel.height}
            maxW={scene.storySingleComicPanel.maxWidth}
            pointerEvents="none"
            transform={scene.storySingleComicPanel.centered ? "translateX(-50%)" : undefined}
            animation={
              scene.id === "scene-1"
                ? `${storyComicPanelFadeIn} 320ms ease-out 0.5s both`
                : scene.id === "scene-22"
                  ? `${storyComicPanelFadeIn} 320ms ease-out both`
                  : scene.id === "scene-30"
                    ? `${storyComicPanelSmashIn} 260ms ease-out both`
                  : scene.id === "scene-32"
                    ? `${scene32CluePanelReveal} 820ms cubic-bezier(0.2, 0.9, 0.2, 1) both`
                  : undefined
            }
          >
            <img
              src={COMIC_IMAGE_BY_ID[scene.storySingleComicPanel.imageId]}
              alt={scene.storySingleComicPanel.alt}
              style={{
                width: "100%",
                height: scene.storySingleComicPanel.height ? "100%" : "auto",
                display: "block",
              }}
            />
          </Flex>
        ) : null}

        {scene.storyComicOverlays?.map((overlay, index) => {
          const isVisible = visibleStoryComicOverlayCount > index;
          return (
            <StoryComicOverlayPanel
              key={`${scene.id}-${overlay.imageId}-${index}`}
              sceneId={scene.id}
              overlay={overlay}
              index={index}
              isVisible={isVisible}
              onSequenceComplete={handleStoryComicOverlaySequenceComplete}
            />
          );
        })}

        {isScene5OutfitReveal &&
        scene5OutfitRevealPhase !== "hidden" &&
        scene5OutfitRevealPhase !== "dialog" ? (
          <Flex
            position="absolute"
            inset="0"
            zIndex={18}
            pointerEvents="none"
            alignItems="center"
            justifyContent="center"
            opacity={scene5OutfitRevealPhase === "modal-exit" ? 0 : 1}
            transition="opacity 360ms ease"
            bg="rgba(35, 27, 20, 0.46)"
          >
            <Flex
              w="84%"
              maxW="310px"
              h="63%"
              maxH="540px"
              minH="420px"
              position="relative"
              overflow="hidden"
              borderRadius="16px"
              border="3px solid rgba(148, 116, 87, 0.94)"
              boxShadow="0 18px 34px rgba(32, 22, 16, 0.24)"
              bgColor="#E6DFC3"
              backgroundImage={`
                radial-gradient(circle, rgba(192, 156, 118, 0.9) 0 2.5px, transparent 2.6px),
                linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(219,208,176,0.12) 100%)
              `}
              backgroundSize="38px 38px, 100% 100%"
              backgroundPosition="19px 19px, 0 0"
              animation={`${scene5OutfitPanelFadeIn} 180ms ease-out`}
            >
              <Flex
                position="absolute"
                inset="0"
                bg="linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 100%)"
              />
              <Flex
                position="absolute"
                left="50%"
                bottom="-8px"
                w="74%"
                maxW="228px"
                transform={
                  scene5OutfitRevealPhase === "modal-enter"
                    ? "translateX(-50%) translateY(-58%)"
                    : "translateX(-50%) translateY(100px)"
                }
                transition="transform 980ms linear"
                filter="drop-shadow(0 10px 22px rgba(105, 76, 54, 0.14))"
              >
                <img
                  src="/images/mai/mai_pose.png"
                  alt="小麥穿搭站姿"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </Flex>
            </Flex>
          </Flex>
        ) : null}

        {isScene5OutfitReveal && scene5OutfitRevealPhase === "dialog" ? (
          <Flex
            position="absolute"
            left="14px"
            bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
            zIndex={6}
            pointerEvents="none"
            animation={`${scene5HappyAvatarFadeIn} 420ms ease-out`}
          >
            <EventAvatarSprite
              spriteId="mai"
              frameIndex={scene.dialogAvatarFrameIndex ?? 1}
            />
          </Flex>
        ) : null}

        {scene.id === "scene-6" ? (
          <Flex
            position="absolute"
            left="140px"
            bottom={`calc(${EVENT_DIALOG_HEIGHT} + 130px)`}
            zIndex={7}
            w="72px"
            pointerEvents="none"
            animation={`${scene6SpeechBubbleFloat} 1.8s ease-in-out infinite`}
            filter="drop-shadow(0 4px 10px rgba(92, 70, 53, 0.12))"
          >
            <img
              src="/images/UI/speechBubble.png"
              alt="開心哼歌泡泡"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <Flex
              position="absolute"
              inset="0"
              alignItems="center"
              justifyContent="center"
              pb="2px"
            >
              <Flex
                position="relative"
                w="20px"
                h="20px"
                alignItems="center"
                justifyContent="center"
                animation={`${scene6MusicIconSwing} 1.1s ease-in-out infinite`}
              >
                <FaMusic color="#8B6C54" size={20} />
              </Flex>
            </Flex>
          </Flex>
        ) : null}

        {scene.id === "scene-14" ? (
          <>
            <Flex
              position="absolute"
              top="142px"
              left="50%"
              transform={
                scene14PuppetPhase === "visible" ? "translate(-50%, 0)" : "translate(-50%, 8px)"
              }
              zIndex={7}
              w="80%"
              maxW="290px"
              pointerEvents="none"
              opacity={scene14PuppetPhase === "visible" ? 1 : 0}
              transition="opacity 260ms ease, transform 320ms ease"
            >
              <img
                src={COMIC_IMAGE_BY_ID.puppet}
                alt="人偶漫畫格"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Flex>
          <Flex
            position="absolute"
            left="138px"
            bottom={`calc(${EVENT_DIALOG_HEIGHT} + 132px)`}
            zIndex={7}
            w="72px"
            pointerEvents="none"
            animation={`${scene6SpeechBubbleFloat} 1.8s ease-in-out infinite`}
            filter="drop-shadow(0 4px 10px rgba(92, 70, 53, 0.12))"
          >
            <img
              src="/images/UI/speechBubble.png"
              alt="生氣泡泡"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <Flex
              position="absolute"
              inset="0"
              alignItems="center"
              justifyContent="center"
              pb="4px"
            >
              <Text color="#D95B17" fontSize="24px" lineHeight="1">
                💢
              </Text>
            </Flex>
          </Flex>
          </>
        ) : null}

        {scene.id === "scene-20" ? (
          <Flex
            position="absolute"
            left="138px"
            bottom={`calc(${EVENT_DIALOG_HEIGHT} + 132px)`}
            zIndex={7}
            w="72px"
            pointerEvents="none"
            animation={`${scene6SpeechBubbleFloat} 1.8s ease-in-out infinite`}
            filter="drop-shadow(0 4px 10px rgba(92, 70, 53, 0.12))"
          >
            <img
              src="/images/UI/speechBubble.png"
              alt="雨滴泡泡"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <Flex
              position="absolute"
              inset="0"
              alignItems="center"
              justifyContent="center"
              pb="2px"
            >
              <Flex animation={`${scene20DropletFall} 1.05s ease-in infinite`}>
                <FaDroplet color="#4C8CCF" size={18} />
              </Flex>
            </Flex>
          </Flex>
        ) : null}

        {scene.id === "scene-31" ? (
          <Flex
            position="absolute"
            top="142px"
            left="50%"
            transform="translate(-50%, 0)"
            zIndex={7}
            w="80%"
            maxW="290px"
            pointerEvents="none"
          >
            <img
              src={COMIC_IMAGE_BY_ID.book}
              alt="book comic"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        {scene.id === "scene-49" && !scene.storySingleComicPanel ? (
          <Flex
            position="absolute"
            right="36px"
            top="248px"
            zIndex={12}
            pointerEvents="none"
            animation={`${creatureFlashBy} 460ms ease-out 1`}
          >
            <Flex
              transform="scale(0.9)"
              opacity={0.94}
              filter="drop-shadow(0 0 12px rgba(255,255,255,0.28))"
            >
              <EventAvatarSprite spriteId="beigo" frameIndex={0} />
            </Flex>
          </Flex>
        ) : null}

        {scene.id === "scene-52" ? (
          <Flex
            position="absolute"
            top="142px"
            left="50%"
            transform="translate(-50%, 0)"
            zIndex={7}
            w="80%"
            maxW="290px"
            pointerEvents="none"
          >
            <img
              src={COMIC_IMAGE_BY_ID.diaryDroppedOnGround}
              alt="掉在地上的日記本"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        {scene.id === "scene-64" ? (
          <Flex
            position="absolute"
            top="142px"
            left="50%"
            transform="translate(-50%, 0)"
            zIndex={7}
            w="80%"
            maxW="290px"
            pointerEvents="none"
          >
            <img
              src={COMIC_IMAGE_BY_ID.beigoJumpBed}
              alt="小貝狗撲到床上"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        {scene.id === "scene-55" ? (
          <Flex position="absolute" inset="0" zIndex={14} pointerEvents="none">
            {scene55BookPhase === "glow" ? (
              <Flex
                position="absolute"
                left="50%"
                top="142px"
                w="250px"
                h="250px"
                transform="translate(-50%, -18%)"
                bg="radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(187,233,255,0.56) 32%, rgba(255,255,255,0) 72%)"
                animation={`${glowingBookRay} 920ms ease-out 1`}
              />
            ) : null}
            <Flex
              position="absolute"
              top="142px"
              left="50%"
              w="80%"
              maxW="290px"
              transform="translate(-50%, 0)"
              animation={scene55BookPhase === "glow" ? `${glowingBookPulse} 920ms ease-out 1` : undefined}
              filter={
                scene55BookPhase === "glow"
                  ? "drop-shadow(0 0 26px rgba(255,255,255,0.62))"
                  : "drop-shadow(0 6px 12px rgba(0,0,0,0.18))"
              }
            >
              <img
                src={COMIC_IMAGE_BY_ID.book}
                alt="發光的筆記本"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Flex>
          </Flex>
        ) : null}

        {scene.id === "scene-57" ? (
          <Flex
            position="absolute"
            top="142px"
            left="50%"
            transform="translate(-50%, 0)"
            zIndex={7}
            w="80%"
            maxW="290px"
            pointerEvents="none"
            filter="grayscale(0.92) brightness(1.16)"
          >
            <Flex position="relative" w="100%">
              <img
                src={COMIC_IMAGE_BY_ID.book}
                alt="內頁空白的筆記本"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
              <Flex
                position="absolute"
                inset="16% 18% 20% 18%"
                bg="rgba(255,255,255,0.74)"
                borderRadius="10px"
                boxShadow="inset 0 0 0 1px rgba(255,255,255,0.88)"
              />
            </Flex>
          </Flex>
        ) : null}

        {scene.id === "scene-9" ? (
          <Flex
            position="absolute"
            top="142px"
            left="50%"
            transform={
              scene9PuppetRevealPhase === "hidden"
                ? "translate(-50%, 8px)"
                : "translate(-50%, 0)"
            }
            zIndex={7}
            w="80%"
            maxW="290px"
            pointerEvents="none"
            opacity={scene9PuppetRevealPhase === "hidden" ? 0 : 1}
            transition="opacity 260ms ease, transform 320ms ease"
          >
            <img
              src={COMIC_IMAGE_BY_ID.puppet}
              alt="掉落在地上的人偶"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        {activeComicCheatId ? (
          <Flex
            position="absolute"
            top="142px"
            left="50%"
            transform={isComicCheatVisible ? "translate(-50%, 0)" : "translate(-50%, 8px)"}
            zIndex={7}
            w="80%"
            maxW="290px"
            pointerEvents="none"
            opacity={isComicCheatVisible ? (isComicCheatFading ? 0 : 1) : 0}
            transition="opacity 320ms ease, transform 320ms ease"
          >
            <img
              src={COMIC_IMAGE_BY_ID[activeComicCheatId]}
              alt={`${activeComicCheatId} comic`}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        {(scene.id === "scene-40" || scene.id === LEGACY_NIGHT_HUB_SCENE_ID) && isDoorTransitionVisible ? (
          <Flex
            pointerEvents="none"
            position="absolute"
            inset="0"
            zIndex={20}
            bgColor="rgba(14,14,18,0.92)"
            alignItems="center"
            justifyContent="center"
          >
            <Flex
              w="82%"
              maxW="320px"
              borderRadius="12px"
              overflow="hidden"
              border="2px solid rgba(255,255,255,0.28)"
              boxShadow="0 10px 24px rgba(0,0,0,0.38)"
            >
              <img
                src={
                  doorTransitionPhase === "opened"
                    ? "/images/背景/玄關_開門.jpg"
                    : "/images/背景/玄關_關門.jpg"
                }
                alt="door-transition"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Flex>
          </Flex>
        ) : null}

        {isDiaryPageConversationActive ? (
          <Flex position="absolute" inset="0" zIndex={25} overflow="hidden" bgColor="#F7F0E4">
            <Flex
              position="absolute"
              inset="0"
              bg="repeating-linear-gradient(116deg, #F7F0E4 0px, #F7F0E4 28px, #EEE2D0 28px, #EEE2D0 50px)"
            />
            <Flex
              position="absolute"
              right="0"
              bottom="0"
              w="90%"
              h="calc(100% - 64px)"
              overflow="hidden"
              pointerEvents="none"
            >
              <img
                src="/images/diary/diary_bg.png"
                alt="日記背景"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  objectPosition: "left bottom",
                  opacity: 0.98,
                }}
              />
            </Flex>
            <Flex position="relative" zIndex={1} flex="1" minH="0" direction="column" mr="0" mt="8px">
              <Flex justifyContent="space-between" alignItems="center" pb="10px">
                <Flex w="86px" h="38px" />
                <Flex
                  minW="132px"
                  h="40px"
                  px="20px"
                  borderRadius="8px"
                  bgColor="#A57C58"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="white" fontSize="16px" fontWeight="400">
                    交換日記
                  </Text>
                </Flex>
              </Flex>

              <Flex position="relative" flex="1" minH="0" overflow="hidden" ml="10%" mt="12px">
                <Flex position="absolute" left="48px" right="16px" top="50px" bottom="0" direction="column">
                  <Text color="#151515" fontSize="16px" fontWeight="400" lineHeight="1.5" mb="20px">
                    XX年X月X日 天氣陰
                  </Text>
                  <Flex
                    h="178px"
                    borderRadius="8px"
                    bgColor="#FAF3E7"
                    px="18px"
                    py="16px"
                    alignItems="flex-end"
                  >
                    <Text color="#C0A38A" fontSize="13px" fontWeight="400" lineHeight="1.6">
                      軟體閃退，小白一臉悲痛的日記插圖，
                      <br />
                      旁邊畫了一隻黃金獵犬
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
              {scene.nextSceneId ? (
                <Flex position="absolute" inset="0" zIndex={20} pointerEvents="none">
                  <Flex
                    position="absolute"
                    left="36px"
                    bottom={`calc(${EVENT_DIALOG_HEIGHT} + 8px)`}
                    zIndex={21}
                    pointerEvents="none"
                  >
                    <EventAvatarSprite
                      spriteId={scene.dialogAvatarSpriteId ?? "mai"}
                      frameIndex={scene.dialogAvatarFrameIndex}
                    />
                  </Flex>
                  <Flex
                    position="absolute"
                    left="0"
                    right="0"
                    bottom="0"
                    pointerEvents="auto"
                  >
                    <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
                      <Text color="white" fontWeight="700">
                        {scene.characterName}
                      </Text>
                      <Flex flex="1" minH="0" direction="column" justifyContent="center">
                        <Text color="white" fontSize="16px" lineHeight="1.5" whiteSpace="pre-line">
                          {scene.dialogue}
                        </Text>
                      </Flex>
                      <EventContinueAction
                        onClick={() => {
                          handleStoryRequestNext(scene.nextSceneId!);
                        }}
                      />
                    </EventDialogPanel>
                  </Flex>
                </Flex>
              ) : null}
            </Flex>
          </Flex>
        ) : null}

        {isImageOnlyScene || isDiaryConversationScene || !shouldShowSceneDialogPanel ? null : isScene44Interactive ? (
          <Flex mt="auto" w="100%" position="relative">
            <Flex
              position="absolute"
              left="14px"
              bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
              zIndex={6}
              pointerEvents="none"
            >
              <EventAvatarSprite
                spriteId="mai-beigo"
                frameIndex={scene44Speaker === "小貝狗" ? 1 : 0}
              />
            </Flex>
            <EventDialogPanel w="100%">
              <Text color="white" fontWeight="700">
                {scene44Speaker}
              </Text>
              <Flex flex="1" minH="0" direction="column" justifyContent="center" gap="8px">
                <Text color="white" fontSize="16px" lineHeight="1.5">
                  {scene44Text}
                </Text>
                {scene44Step === "choose" ? (
                  <Flex direction="column" gap="8px">
                    <Flex
                      h="34px"
                      borderRadius="8px"
                      bgColor={scene44Asked.metro ? "rgba(140,140,140,0.38)" : "rgba(255,255,255,0.14)"}
                      border="1px solid rgba(255,255,255,0.26)"
                      alignItems="center"
                      justifyContent="center"
                      cursor={scene44Asked.metro ? "default" : "pointer"}
                      onClick={() => {
                        if (scene44Asked.metro) return;
                        handleScene44SelectTopic("metro");
                      }}
                    >
                      <Text color="white" fontSize="13px" fontWeight="700">
                        捷運站 {scene44Asked.metro ? "（已詢問）" : ""}
                      </Text>
                    </Flex>
                    <Flex
                      h="34px"
                      borderRadius="8px"
                      bgColor={scene44Asked.dog ? "rgba(140,140,140,0.38)" : "rgba(255,255,255,0.14)"}
                      border="1px solid rgba(255,255,255,0.26)"
                      alignItems="center"
                      justifyContent="center"
                      cursor={scene44Asked.dog ? "default" : "pointer"}
                      onClick={() => {
                        if (scene44Asked.dog) return;
                        handleScene44SelectTopic("dog");
                      }}
                    >
                      <Text color="white" fontSize="13px" fontWeight="700">
                        黃金獵犬 {scene44Asked.dog ? "（已詢問）" : ""}
                      </Text>
                    </Flex>
                    {allScene44Asked ? (
                      <Flex
                        h="34px"
                        borderRadius="999px"
                        bgColor="rgba(255,255,255,0.9)"
                        alignItems="center"
                        justifyContent="center"
                        cursor="pointer"
                        onClick={() => {
                          setScene44Step("final");
                          setScene44FinalTurn(0);
                        }}
                      >
                        <Text color="#5F4C3B" fontSize="13px" fontWeight="700">
                          問交換日記
                        </Text>
                      </Flex>
                    ) : null}
                  </Flex>
                ) : null}
              </Flex>
              {scene44Step === "intro" || scene44Step === "qa" || scene44Step === "final" ? (
                <EventContinueAction onClick={handleScene44Continue} />
              ) : null}
            </EventDialogPanel>
          </Flex>
	        ) : isNightHubInteractive ? (
	          <Flex position="absolute" inset="0" w="100%" h="100%" zIndex={8} direction="column" justifyContent="flex-end">
	            {nightHubSunbeastFollowupIndex !== null && activeNightHubSunbeastFollowupLine ? (
              <EventDialogPanel w="100%">
                <Text color="white" fontWeight="700">
                  {activeNightHubSunbeastFollowupLine.speaker}
                </Text>
                <Flex flex="1" minH="0" direction="column" justifyContent="center" gap="8px">
                  <Text color="white" fontSize="16px" lineHeight="1.5">
                    {activeNightHubSunbeastFollowupLine.text}
                  </Text>
                </Flex>
                <EventContinueAction onClick={handleNightHubSunbeastFollowupContinue} />
              </EventDialogPanel>
            ) : nightHubStep === "talk" ? (
              <EventDialogPanel w="100%">
                <Text color="white" fontWeight="700">
                  {nightHubSpeaker}
                </Text>
                <Flex flex="1" minH="0" direction="column" justifyContent="center" gap="8px">
                  <Text color="white" fontSize="16px" lineHeight="1.5">
                    {nightHubText}
                  </Text>
                </Flex>
                <EventContinueAction onClick={handleNightHubContinue} />
              </EventDialogPanel>
	            ) : (
	              <Flex position="absolute" inset="0" overflow="hidden">
	                <Flex position="absolute" inset="0">
	                  <img
	                    src="/images/428出圖/背景/房間_開燈.jpg"
	                    alt=""
	                    aria-hidden="true"
	                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center bottom", display: "block" }}
	                  />
	                </Flex>

		                {!shouldHideNightHubIconsForGuide ? (
		                  <>
		                <Flex position="absolute" left="26px" top="64px" gap="16px" alignItems="center">
	                  <Flex
	                    w="80px"
	                    h="72px"
	                    borderRadius="8px"
	                    bgColor="rgba(157,120,89,0.82)"
	                    direction="column"
	                    alignItems="center"
	                    justifyContent="center"
	                    gap="4px"
	                    color="#FFFFFF"
	                    boxShadow="0 4px 10px rgba(77,55,37,0.12)"
	                  >
	                    <Flex w="42px" h="32px" overflow="hidden" alignItems="center" justifyContent="center">
	                      <img
	                        src="/images/icon/icon_mai.png"
	                        alt=""
	                        aria-hidden="true"
	                        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
	                      />
	                    </Flex>
	                    <Text color="#FFFFFF" fontSize="16px" fontWeight="500" lineHeight="1">
	                      小麥
	                    </Text>
	                  </Flex>
	                  <Flex
	                    h="36px"
	                    minW="82px"
	                    px="12px"
	                    borderRadius="999px"
	                    bgColor="#AC8C6F"
	                    alignItems="center"
	                    justifyContent="center"
	                    gap="8px"
	                    color="#FFFFFF"
	                    boxShadow="0 3px 8px rgba(77,55,37,0.12)"
	                  >
	                    <FaCoins size={20} color="#F6D66D" />
	                    <Text color="#FFFFFF" fontSize="15px" fontWeight="500" lineHeight="1">
	                      {loadPlayerProgress().status.savings}
	                    </Text>
	                  </Flex>
	                </Flex>

	                <Flex position="absolute" left="16px" bottom="28px" direction="column" gap="10px">
	                  <Flex
	                    as="button"
	                    w="72px"
	                    h="72px"
	                    borderRadius="8px"
	                    bg="linear-gradient(180deg, #9596C0 0%, #5E61AB 100%)"
	                    border="2px solid rgba(255,255,255,0.9)"
	                    direction="column"
	                    alignItems="center"
	                    justifyContent="center"
	                    gap="6px"
	                    color="#FFFFFF"
	                    boxShadow="0 4px 10px rgba(55,48,82,0.18)"
	                    cursor={nightHubAsked.bai ? "default" : "pointer"}
	                    opacity={nightHubAsked.bai ? 0.68 : 1}
	                    onClick={() => {
	                      if (nightHubAsked.bai) return;
	                      handleNightHubSelectTopic("bai");
	                    }}
	                  >
	                    <FaDoorOpen size={25} />
	                    <Text color="#FFFFFF" fontSize="15px" fontWeight="500" lineHeight="1">
	                      小白
	                    </Text>
	                  </Flex>
	                  <Flex
	                    as="button"
	                    w="72px"
	                    h="72px"
	                    borderRadius="8px"
	                    bg="linear-gradient(180deg, #9596C0 0%, #5E61AB 100%)"
	                    border="2px solid rgba(255,255,255,0.9)"
	                    direction="column"
	                    alignItems="center"
	                    justifyContent="center"
	                    gap="6px"
	                    color="#FFFFFF"
	                    boxShadow="0 4px 10px rgba(55,48,82,0.18)"
	                    cursor="pointer"
	                    onClick={handleNightHubEnterChat}
	                  >
	                    <FaCommentDots size={25} />
	                    <Text color="#FFFFFF" fontSize="15px" fontWeight="500" lineHeight="1">
	                      聊天
	                    </Text>
	                  </Flex>
	                  <Flex
	                    as="button"
	                    w="72px"
	                    h="72px"
	                    borderRadius="8px"
	                    bg="linear-gradient(180deg, #9596C0 0%, #5E61AB 100%)"
	                    border="2px solid rgba(255,255,255,0.9)"
	                    direction="column"
	                    alignItems="center"
	                    justifyContent="center"
	                    gap="6px"
	                    color="#FFFFFF"
	                    boxShadow="0 4px 10px rgba(55,48,82,0.18)"
	                    cursor="pointer"
	                    onClick={handleNightHubSleep}
	                  >
	                    <FaMoon size={25} />
	                    <Text color="#FFFFFF" fontSize="15px" fontWeight="500" lineHeight="1">
	                      睡覺
	                    </Text>
	                  </Flex>
	                </Flex>

	                <Flex
	                  position="absolute"
	                  right="18px"
	                  bottom="24px"
	                  w="104px"
	                  py="12px"
		                  borderRadius="10px"
		                  bgColor="rgba(157,120,89,0.8)"
		                  direction="column"
		                  alignItems="center"
		                  gap="10px"
		                  zIndex={shouldFocusNightHubIconRail ? 18 : undefined}
		                >
		                  <Flex as="button" position="relative" w="72px" h="72px" borderRadius="8px" border="2px solid #FFFFFF" overflow="hidden" bgColor="#FFFFFF" cursor={shouldBlockNightHubIconRail ? "default" : "pointer"} pointerEvents={shouldBlockNightHubIconRail ? "none" : "auto"} onClick={() => handleOpenDiary("journal")}>
		                    <img src="/images/428出圖/漫畫格/第一章/地上的筆記本.png" alt="" aria-hidden="true" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
		                    <Flex position="absolute" left="-5px" right="-5px" bottom="-2px" h="30px" bgColor="rgba(128,159,140,0.9)" transform="rotate(-6deg)" alignItems="center" justifyContent="center">
		                      <Text color="#FFFFFF" fontSize="17px" fontWeight="500" transform="rotate(6deg)">日記</Text>
		                    </Flex>
		                  </Flex>
		                  <Flex as="button" position="relative" w="72px" h="72px" borderRadius="8px" border="2px solid #FFFFFF" overflow="hidden" bgColor="#FFFFFF" cursor="pointer" zIndex={shouldFocusNightHubSunbeastButton ? 20 : undefined} boxShadow={shouldFocusNightHubSunbeastButton ? "0 0 0 4px rgba(255,255,255,0.82), 0 12px 26px rgba(20,16,12,0.42)" : undefined} onClick={() => handleOpenDiary("sunbeast")}>
		                    <img src="/images/428出圖/漫畫格/第一章/探頭的小貝狗２.png" alt="" aria-hidden="true" style={{ width: "120%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
		                    <Flex position="absolute" left="-5px" right="-5px" bottom="-2px" h="30px" bgColor="rgba(128,159,140,0.9)" transform="rotate(-6deg)" alignItems="center" justifyContent="center">
		                      <Text color="#FFFFFF" fontSize="17px" fontWeight="500" transform="rotate(6deg)">小日獸</Text>
		                    </Flex>
		                  </Flex>
		                  <Flex as="button" position="relative" w="72px" h="72px" borderRadius="8px" border="2px solid #FFFFFF" overflow="hidden" bgColor="#FFFFFF" opacity={1} pointerEvents={shouldBlockNightHubIconRail ? "none" : "auto"} zIndex={shouldFocusNightHubPlaceButton ? 20 : undefined} boxShadow={shouldFocusNightHubPlaceButton ? "0 0 0 4px rgba(255,255,255,0.82), 0 12px 26px rgba(20,16,12,0.42)" : undefined} cursor="pointer" onClick={handleOpenPlaceMap}>
		                    <img src="/images/428出圖/背景/捷運.png" alt="" aria-hidden="true" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
		                    <Flex position="absolute" left="-5px" right="-5px" bottom="-2px" h="30px" bgColor="rgba(128,159,140,0.9)" transform="rotate(-6deg)" alignItems="center" justifyContent="center">
		                      <Text color="#FFFFFF" fontSize="17px" fontWeight="500" transform="rotate(6deg)">地點</Text>
		                    </Flex>
		                  </Flex>
		                  <Flex
		                    as="button"
		                    position="relative"
		                    w="72px"
		                    h="72px"
		                    borderRadius="8px"
		                    border="2px solid #FFFFFF"
		                    overflow="hidden"
		                    bgColor="#FFFFFF"
		                    opacity={shouldShowNightHubMission ? 1 : 0.72}
		                    pointerEvents={shouldBlockNightHubIconRail ? "none" : "auto"}
		                    zIndex={shouldFocusNightHubMissionButton ? 20 : undefined}
		                    boxShadow={shouldFocusNightHubMissionButton ? "0 0 0 4px rgba(255,255,255,0.82), 0 12px 26px rgba(20,16,12,0.42)" : undefined}
		                    cursor={shouldShowNightHubMission ? "pointer" : "default"}
		                    onClick={handleOpenNightHubMission}
		                  >
		                    <img src="/images/428出圖/漫畫格/第一章/相機.png" alt="" aria-hidden="true" style={{ width: "145%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
		                    <Flex position="absolute" left="-5px" right="-5px" bottom="-2px" h="30px" bgColor="rgba(128,159,140,0.9)" transform="rotate(-6deg)" alignItems="center" justifyContent="center">
		                      <Text color="#FFFFFF" fontSize="17px" fontWeight="500" transform="rotate(6deg)">任務</Text>
		                    </Flex>
	                  </Flex>
	                </Flex>

	                {shouldBlockNightHubIconRail ? (
	                  <Flex
	                    position="absolute"
	                    inset="0"
	                    zIndex={16}
	                    bgColor="rgba(22,18,14,0.58)"
	                    pointerEvents="auto"
	                    onClick={(event) => {
	                      event.preventDefault();
	                      event.stopPropagation();
	                    }}
	                  />
	                ) : null}

	                {shouldShowNightHubSunbeastPointer || shouldShowNightHubPlacePointer || shouldShowNightHubMissionPointer ? (
	                  <Flex
	                    position="absolute"
	                    right="126px"
	                    bottom={
	                      shouldShowNightHubMissionPointer
	                        ? "39px"
	                        : shouldShowNightHubPlacePointer
	                          ? "121px"
	                          : "203px"
	                    }
	                    zIndex={21}
	                    alignItems="center"
	                    pointerEvents="none"
	                    animation={`${nightHubSunbeastPointerNudge} 0.82s ease-in-out infinite`}
	                  >
	                    <img
	                      src="/images/pointer_up.png"
	                      alt=""
	                      aria-hidden="true"
	                      style={{
	                        width: "54px",
	                        height: "54px",
	                        objectFit: "contain",
	                        display: "block",
	                        filter: "drop-shadow(0 3px 7px rgba(72, 52, 36, 0.28))",
	                      }}
	                    />
	                  </Flex>
	                ) : null}

		                {nightHubStep === "chat-select" ? (
	                  <Flex position="absolute" left="102px" bottom="122px" right="118px" direction="column" gap="8px">
	                    <Text color="#6B543E" fontSize="14px" fontWeight="700" textShadow="0 1px 0 rgba(255,255,255,0.7)">
	                      想先和誰聊聊呢？
	                    </Text>
	                    <Flex gap="8px">
	                      <Flex as="button" flex="1" h="44px" borderRadius="8px" bgColor={nightHubAsked.beigo ? "rgba(120,95,70,0.72)" : "#8E6D52"} alignItems="center" justifyContent="center" opacity={nightHubAsked.beigo ? 0.68 : 1} cursor={nightHubAsked.beigo ? "default" : "pointer"} onClick={() => {
	                        if (nightHubAsked.beigo) return;
	                        handleNightHubSelectTopic("beigo");
	                      }}>
	                        <Text color="#FFFFFF" fontSize="14px" fontWeight="700">小貝狗</Text>
	                      </Flex>
	                      <Flex as="button" flex="1" h="44px" borderRadius="8px" bgColor="rgba(255,255,255,0.86)" alignItems="center" justifyContent="center" cursor="pointer" onClick={handleNightHubBackToMenu}>
	                        <Text color="#806248" fontSize="14px" fontWeight="700">返回</Text>
	                      </Flex>
	                    </Flex>
	                  </Flex>
		                ) : null}
		                  </>
		                ) : null}
	                {effectiveNightHubGuideStep === "sunbeast-dialog" ? (
	                  <>
	                    <Flex
	                      position="absolute"
	                      left="14px"
	                      bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
	                      zIndex={15}
	                      pointerEvents="none"
	                    >
	                      <EventAvatarSprite
	                        spriteId="mai"
	                        frameIndex={36}
	                        motionId="slide-in-left"
	                      />
	                    </Flex>
	                    <Flex position="absolute" left="0" right="0" bottom="0" zIndex={16}>
	                      <EventDialogPanel w="100%">
	                        <Text color="white" fontWeight="700">
	                          小麥
	                        </Text>
	                        <Flex flex="1" minH="0" direction="column" justifyContent="center" gap="8px">
	                          <Text color="white" fontSize="16px" lineHeight="1.5">
	                            忙了一天終於到家了，來好好想想。
	                            <br />
	                            除了直太郎，那其他小日獸呢？
	                          </Text>
	                        </Flex>
	                        <EventContinueAction onClick={handleNightHubGuideContinue} />
	                      </EventDialogPanel>
	                    </Flex>
	                  </>
	                ) : null}
		              </Flex>
	            )}
          </Flex>
        ) : isMorningHubInteractive ? (
          isWeekendMorningHub ? (
            <Flex mt="auto" w="100%" position="relative">
              <Flex
                position="absolute"
                left="14px"
                bottom="316px"
                zIndex={6}
                pointerEvents="none"
              >
                <EventAvatarSprite spriteId="mai" frameIndex={0} />
              </Flex>
              <Flex
                w="100%"
                minH="316px"
                bg="linear-gradient(180deg, rgba(142,109,82,0.95) 0%, rgba(130,98,73,0.98) 100%)"
                borderTopRadius="22px"
                px="16px"
                pt="16px"
                pb="18px"
                direction="column"
                gap="12px"
                position="relative"
                zIndex={8}
                boxShadow="0 -10px 24px rgba(36,24,16,0.22)"
              >
                <Text color="white" fontWeight="700">
                  小麥
                </Text>
                <Flex flex="1" minH="0" direction="column" gap="10px">
                  <Text color="white" fontSize="18px" lineHeight="1.55">
                    {weekendSelectedDestination
                      ? `${weekendSelectedDestination.title}已經決定好了，今天就照自己的步調過吧。`
                      : "今天是自由安排日，不用趕著上班。想去哪裡走走呢？"}
                  </Text>
                  {weekendSelectedDestination ? (
                    <>
                      <Flex
                        flex="1"
                        borderRadius="16px"
                        bgColor="rgba(255,255,255,0.14)"
                        border="1px solid rgba(255,255,255,0.22)"
                        px="14px"
                        py="12px"
                        direction="column"
                        gap="8px"
                        justifyContent="center"
                      >
                        <Text color="#FFF3E3" fontSize="18px" fontWeight="700">
                          {weekendSelectedDestination.icon} {weekendSelectedDestination.title}
                        </Text>
                        <Text color="#F6E8D5" fontSize="14px" lineHeight="1.6">
                          {weekendSelectedDestination.resultText}
                        </Text>
                        <Text color="#FDE8C4" fontSize="13px" fontWeight="700">
                          {weekendSelectedDestination.effectLabel}
                        </Text>
                      </Flex>
                      <Flex
                        h="46px"
                        borderRadius="999px"
                        bgColor="rgba(255,255,255,0.92)"
                        alignItems="center"
                        justifyContent="center"
                        cursor="pointer"
                        onClick={handleWeekendEndDay}
                      >
                        <Text color="#5F4C3B" fontSize="15px" fontWeight="700">
                          今天就先這樣，回家休息
                        </Text>
                      </Flex>
                    </>
                  ) : (
                    <>
                      <Text color="#EEDFCB" fontSize="13px" fontWeight="700">
                        {formatInGameDateLabel(currentDay)} ・ 週末自由安排日
                      </Text>
                      <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="12px">
                        {weekendDestinationOptions.map((option, index) => (
                          <Flex
                            key={option.id}
                            minH="158px"
                            borderRadius="18px"
                            bgColor="rgba(255,255,255,0.14)"
                            border="1px solid rgba(255,255,255,0.22)"
                            px="14px"
                            py="14px"
                            direction="column"
                            alignItems="center"
                            justifyContent="space-between"
                            textAlign="center"
                            cursor="pointer"
                            gridColumn={
                              weekendDestinationOptions.length % 2 === 1 &&
                              index === weekendDestinationOptions.length - 1
                                ? "span 2"
                                : undefined
                            }
                            onClick={() => handleWeekendDestinationSelect(option)}
                          >
                            <Text color="#FFF2E0" fontSize="34px" lineHeight="1">
                              {option.icon}
                            </Text>
                            <Text color="white" fontSize="18px" fontWeight="700" lineHeight="1.2">
                              {option.title}
                            </Text>
                            <Text color="#EEDFCB" fontSize="13px" lineHeight="1.4">
                              {option.subtitle}
                            </Text>
                            <Text color="#FDE8C4" fontSize="12px" fontWeight="700" lineHeight="1.4">
                              {option.effectLabel}
                            </Text>
                          </Flex>
                        ))}
                      </Grid>
                    </>
                  )}
                </Flex>
              </Flex>
            </Flex>
          ) : (
            <Flex mt="auto" w="100%" position="relative">
              <Flex
                position="absolute"
                left="14px"
                bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                zIndex={6}
                pointerEvents="none"
              >
                <EventAvatarSprite spriteId="mai" frameIndex={0} />
              </Flex>
              <EventDialogPanel w="100%">
                <Text color="white" fontWeight="700">
                  小麥
                </Text>
                <Flex flex="1" minH="0" direction="column" justifyContent="center" gap="8px">
                  <Text color="white" fontSize="16px" lineHeight="1.5">
                    時間差不多了
                  </Text>
                  <Flex
                    h="38px"
                    borderRadius="999px"
                    bgColor="rgba(255,255,255,0.9)"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    onClick={() => {
                      startPathTransition(`${ROUTES.gameArrangeRoute}?day=next`, "fade-black", 420);
                    }}
                  >
                    <Text color="#5F4C3B" fontSize="14px" fontWeight="700">
                      出門安排通勤路線
                    </Text>
                  </Flex>
                </Flex>
              </EventDialogPanel>
            </Flex>
          )
        ) : (
          <StoryDialogPanel
            characterName={scene.characterName}
            dialogue={scene.dialogue}
            nextSceneId={scene.nextSceneId}
            onRequestNextScene={handleStoryRequestNext}
            showAvatarSprite={scene.showDialogAvatar ?? true}
            showCharacterName={scene.showCharacterName ?? true}
            avatarFrameIndex={scene.dialogAvatarFrameIndex}
            avatarSpriteId={scene.dialogAvatarSpriteId ?? "mai"}
            avatarMotionId={
              isContinueExitActive && scene.continueExitMotionId
                ? scene.continueExitMotionId
                : scene.dialogAvatarMotionId
            }
            avatarMotionLoop={scene.dialogAvatarMotionLoop ?? false}
            avatarTransform={
              scene.id === "scene-4"
                ? scene4FreshenPhase !== "idle"
                  ? "translateX(120px)"
                  : undefined
                : scene.id === "scene-10"
                  ? scene10ExitPhase === "exiting"
                    ? "translateX(120px)"
                    : undefined
                  : undefined
            }
            avatarOpacity={
              scene.id === "scene-4"
                ? scene4FreshenPhase !== "idle"
                  ? 0
                  : 1
                : scene.id === "scene-10"
                  ? scene10ExitPhase === "exiting"
                    ? 0
                    : 1
                : scene.id === "scene-9"
                  ? scene9PuppetRevealPhase === "dialog"
                    ? 1
                    : 0
                  : 1
            }
            avatarTransition={
              scene.id === "scene-4" ||
              scene.id === "scene-9" ||
              scene.id === "scene-10"
                ? "transform 680ms ease, opacity 680ms ease"
                : undefined
            }
            panelOpacity={
              scene.id === "scene-9"
                ? scene9PuppetRevealPhase === "dialog"
                  ? 1
                  : 0
                : scene.id === "scene-10"
                  ? scene10ExitPhase === "exiting"
                    ? 0
                    : 1
                  : 1
            }
            panelTransition={
              scene.id === "scene-9" || scene.id === "scene-10" ? "opacity 320ms ease" : undefined
            }
            showContinueAction={
              scene.id === "scene-4"
                ? scene4FreshenPhase === "done"
                : scene.id === "scene-9"
                  ? scene9PuppetRevealPhase === "dialog"
                  : scene.id === "scene-10"
                  ? scene10ExitPhase !== "exiting"
                  : scene.storyComicOverlays?.some((overlay) => overlay.finalImageId) && !areStoryComicOverlaysComplete
                    ? false
                  : isContinueExitActive
                    ? false
                  : true
            }
            narrativeMode={scene.narrativeMode}
            typingMode={shouldUseNarrativePause ? "pause" : dialogTypingMode}
            onTypingComplete={
              scene.id === "scene-4" ||
              scene.id === "scene-14" ||
              scene.id === "scene-29" ||
              scene.id === "scene-68"
                ? () => {
                    if (scene.id === "scene-4") {
                      setScene4FreshenPhase("avatar-exit");
                      scene4SequenceTimerRefs.current.forEach((timer) => clearTimeout(timer));
                      scene4SequenceTimerRefs.current = [
                        setTimeout(() => {
                          setScene4FreshenPhase("comic-visible");
                          playStoryComic("freshen", { fadeAtMs: 980, hideAtMs: 1360 });
                        }, 720),
                        setTimeout(() => {
                          setScene4FreshenPhase("comic-fade");
                        }, 1700),
                        setTimeout(() => {
                          setScene4FreshenPhase("done");
                        }, 2080),
                      ];
                    }
                    if (scene.id === "scene-14") {
                      if (scene14PuppetTimerRef.current) clearTimeout(scene14PuppetTimerRef.current);
                      scene14PuppetTimerRef.current = setTimeout(() => {
                        setScene14PuppetPhase("visible");
                        scene14PuppetTimerRef.current = null;
                      }, 120);
                    }
                    if (scene.id === "scene-29") {
                      window.dispatchEvent(
                        new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
                          detail: { shakeId: "flash-white" },
                        }),
                      );
                    }
                    if (scene.id === "scene-68") {
                      setIsScene68LocationDiscoveryVisible(true);
                    }
                  }
                : undefined
            }
          />
        )}
      </Flex>

      {isImageOnlyScene ? null : (
        <EventHistoryOverlay
          title="回顧"
          open={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          lines={historyLines}
        />
      )}
      <DiaryOverlay
        open={isDiaryOpen}
        mode={diaryOverlayMode}
        unlockedEntryIds={unlockedDiaryEntryIds}
        onDiaryRevealEntryComplete={() => {
          setIsDiaryOpen(false);
          setDiaryOverlayMode("default");
          setPendingDiaryNextSceneId(null);
          router.push(ROUTES.gameScene("scene-97"));
        }}
        onGuidedFlowComplete={() => {
          setIsDiaryOpen(false);
          if (
            (diaryOverlayMode === "diary-reveal" || diaryOverlayMode === "first-photo-diary-reveal") &&
            pendingDiaryNextSceneId
          ) {
            setDiaryOverlayMode("default");
            setPendingDiaryNextSceneId(null);
            router.push(ROUTES.gameScene("scene-97"));
            return;
          }
          if (diaryOverlayMode === "sunbeast-reveal") {
            setDiaryOverlayMode("default");
            setPendingDiaryNextSceneId(null);
            setIsNightHubMode(true);
            setNightHubStep("choose");
            setNightHubTopic(null);
            setNightHubSunbeastFollowupIndex(null);
            setNightHubGuideStep("sunbeast-dialog");
            return;
          }
          setDiaryOverlayMode("default");
          setPendingDiaryNextSceneId(null);
          setIsNightHubMode(true);
        }}
        onSunbeastHintGuideComplete={() => {
          setIsDiaryOpen(false);
          setDiaryOverlayMode("default");
          setPendingDiaryNextSceneId(null);
          setIsNightHubMode(true);
          setNightHubStep("choose");
          setNightHubTopic(null);
          setNightHubSunbeastFollowupIndex(null);
          setNightHubGuideStep("place-pointer");
        }}
        onClose={() => {
          setIsDiaryOpen(false);
          if (
            (diaryOverlayMode === "diary-reveal" || diaryOverlayMode === "first-photo-diary-reveal") &&
            pendingDiaryNextSceneId
          ) {
            setDiaryOverlayMode("default");
            setPendingDiaryNextSceneId(null);
            router.push(ROUTES.gameScene("scene-97"));
            return;
          }
          if (diaryOverlayMode === "sunbeast-reveal") {
            setDiaryOverlayMode("default");
            setPendingDiaryNextSceneId(null);
            setIsNightHubMode(true);
            setNightHubStep("choose");
            setNightHubTopic(null);
            setNightHubSunbeastFollowupIndex(null);
            setNightHubGuideStep("sunbeast-dialog");
            return;
          }
          setDiaryOverlayMode("default");
          setPendingDiaryNextSceneId(null);
        }}
      />

      {isNightHubPlaceMapOpen && nightHubProgress && nightHubPlaceUnlockSnapshot ? (
        <ArrangeRouteMapOverlay
          placeUnlockSnapshot={nightHubPlaceUnlockSnapshot}
          coinCount={nightHubProgress.status.savings}
          canRedeemStreet={hasCollectedFirstSunbeastForNightHub}
          isReadOnly
          highlightedPlaceId={
            nightHubStreetUnlockGuideStep === "shop-condition"
              ? "convenience-store"
              : nightHubStreetUnlockGuideStep &&
                  nightHubStreetUnlockGuideStep !== "unlocking-street"
                ? "street"
                : undefined
          }
          unlockingPlaceId={nightHubStreetUnlockGuideStep === "unlocking-street" ? "street" : undefined}
          onClose={() => {
            setIsNightHubPlaceMapOpen(false);
            setIsNightHubMissionOpen(false);
            setNightHubStreetUnlockGuideStep(null);
            if (nightHubStreetUnlockGuideTimerRef.current) {
              clearTimeout(nightHubStreetUnlockGuideTimerRef.current);
              nightHubStreetUnlockGuideTimerRef.current = null;
            }
          }}
        />
      ) : null}

      {isNightHubPlaceMapOpen &&
      nightHubStreetUnlockGuideStep &&
      nightHubStreetUnlockGuideStep !== "unlocking-street" ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={74}
          pointerEvents="none"
        >
          <Flex mt="auto" w="100%" position="relative" pointerEvents="auto">
            <Flex
              position="absolute"
              left="14px"
              bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
              zIndex={6}
              pointerEvents="none"
            >
              {nightHubStreetUnlockGuideStep === "shop-condition" ? null : (
                <EventAvatarSprite
                  spriteId={
                    nightHubStreetUnlockGuideStep === "beigo-street" ||
                    nightHubStreetUnlockGuideStep === "beigo-shop"
                      ? "beigo"
                      : "mai"
                  }
                  frameIndex={
                    nightHubStreetUnlockGuideStep === "beigo-street" ||
                    nightHubStreetUnlockGuideStep === "beigo-shop"
                      ? 2
                      : nightHubStreetUnlockGuideStep === "mai-street"
                        ? 18
                        : 36
                  }
                />
              )}
            </Flex>
            <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
              <Text color="white" fontWeight="700">
                {nightHubStreetUnlockGuideStep === "shop-condition"
                  ? "商店"
                  : nightHubStreetUnlockGuideStep === "beigo-street" ||
                      nightHubStreetUnlockGuideStep === "beigo-shop"
                    ? "小貝狗"
                    : "小麥"}
              </Text>
              <Flex flex="1" minH="0" direction="column" justifyContent="center">
                <Text color="white" fontSize="16px" lineHeight="1.6">
                  {nightHubStreetUnlockGuideStep === "beigo-street" ? (
                    <>
                      因為
                      <Text as="span" color="#F6D982" fontWeight="800">
                        直太郎
                      </Text>
                      的關係，新的地點
                      <Text as="span" color="#9DE0C3" fontWeight="800">
                        街道
                      </Text>
                      解鎖了。
                    </>
                  ) : nightHubStreetUnlockGuideStep === "mai-street" ? (
                    <>
                      下次可以經過
                      <Text as="span" color="#9DE0C3" fontWeight="800">
                        街道
                      </Text>
                      看看。那是不是只要能經過
                      <Text as="span" color="#F6D982" fontWeight="800">
                        商店
                      </Text>
                      ，就能遇到下一隻小日獸了？
                    </>
                  ) : nightHubStreetUnlockGuideStep === "beigo-shop" ? (
                    <>嗷</>
                  ) : (
                    <>
                      連續兩天的
                      <Text as="span" color="#F6D982" fontWeight="800">
                        行程安排
                      </Text>
                      經過
                      <Text as="span" color="#9DE0C3" fontWeight="800">
                        街道
                      </Text>
                      已解鎖
                    </>
                  )}
                </Text>
              </Flex>
              <EventContinueAction onClick={handleNightHubStreetUnlockGuideContinue} />
            </EventDialogPanel>
          </Flex>
        </Flex>
      ) : null}

      {isNightHubScene && shouldShowNightHubMission && isNightHubMissionIntroOpen ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={75}
          pointerEvents="none"
        >
          <Flex mt="auto" w="100%" position="relative" pointerEvents="auto">
            <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
              <Text color="white" fontWeight="700">
                任務
              </Text>
              <Flex flex="1" minH="0" direction="column" justifyContent="center">
                <Text color="white" fontSize="16px" lineHeight="1.6">
                  任務會把目前找到的線索整理成下一步目標。
                  <br />
                  完成任務後，可以推進小日獸線索、解鎖新的地點，也能獲得金幣獎勵。
                </Text>
              </Flex>
              <EventContinueAction onClick={handleNightHubMissionIntroContinue} />
            </EventDialogPanel>
          </Flex>
        </Flex>
      ) : null}

      {isNightHubScene && shouldShowNightHubMission && isNightHubMissionPanelOpen ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={76}
          bgColor="rgba(30, 23, 18, 0.46)"
          alignItems="center"
          justifyContent="center"
          px="18px"
          pointerEvents="auto"
        >
          <Flex
            w="100%"
            maxW="360px"
            maxH="calc(100% - 56px)"
            direction="column"
            borderRadius="16px"
            overflow="hidden"
            bgColor="#F6F2EC"
            border="3px solid #B88E6D"
            boxShadow="0 18px 38px rgba(64,44,28,0.28)"
          >
            <Flex
              minH="54px"
              px="18px"
              bgColor="#B88E6D"
              alignItems="center"
              justifyContent="space-between"
            >
              <Text color="white" fontSize="16px" fontWeight="800" lineHeight="1">
                任務版
              </Text>
              <Flex
                as="button"
                w="28px"
                h="28px"
                alignItems="center"
                justifyContent="center"
                color="white"
                cursor="pointer"
                aria-label="關閉任務"
                onClick={handleCloseNightHubMission}
              >
                <IoClose size={24} />
              </Flex>
            </Flex>
            <Flex
              direction="column"
              px="18px"
              pt="16px"
              pb="18px"
              gap="14px"
              bgColor="#FFFDF8"
            >
              <Flex direction="column" gap="10px">
                <Text color="#8F6A4D" fontSize="13px" fontWeight="900" lineHeight="1">
                  獲得第一個任務
                </Text>
                <Flex
                  minH="78px"
                  px="14px"
                  py="12px"
                  borderRadius="12px"
                  bgColor="rgba(246,242,236,0.94)"
                  border="2px solid rgba(184,142,109,0.5)"
                  alignItems="center"
                  justifyContent="space-between"
                  gap="12px"
                >
                  <Flex direction="column" gap="5px" minW="0">
                    <Text color="#8F6A4D" fontSize="12px" fontWeight="900" lineHeight="1">
                      01
                    </Text>
                    <Text color="#161616" fontSize="14px" fontWeight="900" lineHeight="1.35">
                      連續兩天有經過街道，解鎖商店 (0/2)
                    </Text>
                  </Flex>
                  <Text color="#B88E6D" fontSize="14px" fontWeight="900" whiteSpace="nowrap">
                    10金幣
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {endDaySequencePhase === "black" || endDaySequencePhase === "summary" ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={85}
          bgColor="rgba(12,10,14,0.96)"
          alignItems="center"
          justifyContent="center"
          px="24px"
        >
          {endDaySequencePhase === "black" ? (
            <Flex direction="column" alignItems="center" gap="8px">
              <Text color="#F7EEE0" fontSize="34px" fontWeight="700" letterSpacing="2px">
                {endDayTransitionText?.toDayLabel ?? "第二天"}
              </Text>
              <Flex
                position="relative"
                h="24px"
                minW="170px"
                justifyContent="center"
                alignItems="center"
                color="#EADBC8"
                fontSize="16px"
                fontWeight="700"
                letterSpacing="1px"
              >
                <Text animation={`${dayDateOldFadeOut} 1100ms ease forwards`}>
                  {endDayTransitionText?.fromDateLabel ?? "星期一 3/11"}
                </Text>
                <Flex
                  position="absolute"
                  alignItems="center"
                  animation={`${dayDateNewFadeIn} 1100ms ease forwards`}
                >
                  <Text>{endDayTransitionText?.toDateLabel ?? "星期二 3/12"}</Text>
                </Flex>
              </Flex>
            </Flex>
          ) : null}
          {endDaySequencePhase === "summary" ? (
            <Flex
              w="100%"
              maxW="320px"
              direction="column"
              gap="14px"
              borderRadius="16px"
              border="1px solid rgba(255,255,255,0.22)"
              bg="linear-gradient(180deg, rgba(72,56,44,0.88) 0%, rgba(49,38,30,0.9) 100%)"
              p="18px"
              boxShadow="0 12px 30px rgba(0,0,0,0.35)"
              animation={`${isEndDaySummaryLeaving ? summaryCardOut : summaryCardIn} ${isEndDaySummaryLeaving ? 320 : 380}ms ease forwards`}
            >
              <Flex alignItems="center" justifyContent="space-between">
                <Text color="#FCEEDC" fontSize="16px" fontWeight="700">
                  {endDaySummaryContent?.title ?? "今天先告一段落"}
                </Text>
                <Text color="#FDE8C4" fontSize="18px" lineHeight="1">
                  🌙
                </Text>
              </Flex>
              <Text color="#F6E8D5" fontSize="14px" lineHeight="1.65">
                {endDaySummaryContent?.body ??
                  "回到家後好好休息了一下，把今天的疲累慢慢放下，準備迎接明天。"}
              </Text>
              <Flex h="1px" bgColor="rgba(255,255,255,0.22)" />
              <Flex gap="10px">
                <Flex
                  flex="1"
                  h="34px"
                  borderRadius="999px"
                  bgColor="rgba(255,255,255,0.1)"
                  border="1px solid rgba(255,255,255,0.2)"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="#FFF4E6" fontSize="14px" fontWeight="700">
                    {endDaySummaryContent?.chips[0] ?? "疲勞 -20"}
                  </Text>
                </Flex>
                <Flex
                  flex="1"
                  h="34px"
                  borderRadius="999px"
                  bgColor="rgba(255,255,255,0.1)"
                  border="1px solid rgba(255,255,255,0.2)"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="#FFF4E6" fontSize="14px" fontWeight="700">
                    {endDaySummaryContent?.chips[1] ?? "行動力 +1"}
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          ) : null}
        </Flex>
      ) : null}

      {outgoingTransition ? (
        <Flex
          pointerEvents="none"
          position="absolute"
          inset="0"
          zIndex={40}
          bgColor="rgba(25,18,14,0.92)"
          animation={`${fadeOutToBlack} ${outgoingTransition.durationMs}ms ease forwards`}
          alignItems="center"
          justifyContent="center"
        >
          {outgoingTransition.preset === "next-day" ? (
            <Text color="#F7EEE0" fontSize="30px" fontWeight="700" letterSpacing="2px">
              隔天早晨
            </Text>
          ) : null}
        </Flex>
      ) : null}

      {incomingTransition ? (
        <Flex
          pointerEvents="none"
          position="absolute"
          inset="0"
          zIndex={39}
          bgColor="rgba(25,18,14,0.92)"
          animation={`${fadeInFromBlack} ${incomingTransition.durationMs}ms ease forwards`}
          alignItems="center"
          justifyContent="center"
        >
          {incomingTransition.preset === "next-day" ? (
            <Text color="#F7EEE0" fontSize="30px" fontWeight="700" letterSpacing="2px">
              隔天早晨
            </Text>
          ) : null}
        </Flex>
      ) : null}

      {previewTransitionDurationMs ? (
        <Flex
          key={`preview-transition-${previewTransitionNonce}`}
          pointerEvents="none"
          position="absolute"
          inset="0"
          zIndex={41}
          bgColor="rgba(25,18,14,0.92)"
          animation={`${fadeOutInBlack} ${previewTransitionDurationMs * 2}ms ease forwards`}
        />
      ) : null}

      {isWorkTransitionScene && !isWorkMinigameOpen && workPostMinigameStep === null ? (
        <WorkTransitionModal
          variant={
            shouldOpenPlayableWorkMinigame && activeWorkMinigameConfig
              ? activeWorkMinigameConfig.preludeVariant
              : "plain"
          }
          onFinish={() => {
            if (workTransitionDoneRef.current) return;
            if (!shouldOpenPlayableWorkMinigame) {
              workTransitionDoneRef.current = true;
              if (!isStoryTaxiWorkScene) {
                recordWorkShiftResult(0);
              }
              if (scene.nextSceneId) {
                router.push(ROUTES.gameScene(scene.nextSceneId));
              }
              return;
            }
            setIsWorkMinigameOpen(true);
          }}
        />
      ) : null}

      {isWorkTransitionScene &&
      shouldOpenPlayableWorkMinigame &&
      activeWorkMinigameConfig &&
      isWorkMinigameOpen &&
      workPostMinigameStep === null ? (
        workMinigameKind === "stamp-documents" ? (
          <WorkStampMinigameModal
            baseFatigue={0}
            onSkip={() => {
              if (workTransitionDoneRef.current) return;
              workTransitionDoneRef.current = true;
              saveWorkTaskProgress(activeWorkMinigameConfig.taskId, activeWorkMinigameConfig.skipProgress);
              setIsWorkMinigameOpen(false);
              recordWorkShiftResult(activeWorkMinigameConfig.skipFatigue);
              if (scene.nextSceneId) {
                router.push(ROUTES.gameScene(scene.nextSceneId));
              }
            }}
            onSolved={() => {
              if (workTransitionDoneRef.current) return;
              workTransitionDoneRef.current = true;
              saveWorkTaskProgress(
                activeWorkMinigameConfig.taskId,
                activeWorkMinigameConfig.successProgress,
              );
              grantWorkMinigameCoinReward();
            }}
            onComplete={() => {
              setIsWorkMinigameOpen(false);
              setWorkPostMinigameStep("dialogue");
            }}
            successSavingsTotal={workMinigameRewardSavingsTotal}
          />
        ) : (
        <WorkMinigameTestModal
          baseFatigue={0}
          onSkip={() => {
            if (workTransitionDoneRef.current) return;
            workTransitionDoneRef.current = true;
            saveWorkTaskProgress(activeWorkMinigameConfig.taskId, activeWorkMinigameConfig.skipProgress);
            setIsWorkMinigameOpen(false);
            recordWorkShiftResult(activeWorkMinigameConfig.skipFatigue);
            if (scene.nextSceneId) {
              router.push(ROUTES.gameScene(scene.nextSceneId));
            }
          }}
          onSolved={() => {
            if (workTransitionDoneRef.current) return;
            workTransitionDoneRef.current = true;
            saveWorkTaskProgress(
              activeWorkMinigameConfig.taskId,
              activeWorkMinigameConfig.successProgress,
            );
            grantWorkMinigameCoinReward();
          }}
          onComplete={() => {
            setIsWorkMinigameOpen(false);
            setWorkPostMinigameStep("dialogue");
          }}
          successSavingsTotal={workMinigameRewardSavingsTotal}
        />
        )
      ) : null}

      {isWorkTransitionScene && workPostMinigameStep === "dialogue" ? (
        <Flex position="absolute" inset="0" zIndex={72} direction="column">
          <img
            src="/images/work/Office_Work_Day_Phone.png"
            alt="整理便利貼後的辦公室"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          <Flex position="relative" zIndex={1} w="100%" h="100%" direction="column">
            <StoryDialogPanel
              characterName="小麥"
              dialogue={
                activeWorkMinigameConfig?.postSuccessLine ??
                "太好了，這個搞定後，處理後續的專案會比較順利，今天應該能準時下班了。"
              }
              onContinue={() => setWorkPostMinigameStep("dusk-transition")}
              showAvatarSprite
              avatarSpriteId="mai"
              avatarFrameIndex={0}
            />
          </Flex>
        </Flex>
      ) : null}

      {isWorkTransitionScene && workPostMinigameStep === "dusk-transition" ? (
        <WorkTransitionModal
          variant="dusk-plain"
          onFinish={() => {
            setWorkPostMinigameStep("settlement");
          }}
        />
      ) : null}

      {isWorkTransitionScene && workPostMinigameStep === "settlement" ? (
        <WorkSettlementOverlay
          onShown={applyWorkSettlement}
          onFinish={() => {
            if (scene.nextSceneId) {
              router.push(ROUTES.gameScene(scene.nextSceneId));
            }
          }}
        />
      ) : null}

      {isOffworkScene && isOffworkRewardOpen ? (
        <Flex position="absolute" inset="0" zIndex={50} bgColor="rgba(30,25,21,0.34)" alignItems="center" justifyContent="center" p="22px">
          <Flex
            w="100%"
            maxW="344px"
            minH="330px"
            bgColor="#FFF7EA"
            borderRadius="22px"
            border="2px solid rgba(186,145,105,0.48)"
            boxShadow="0 18px 46px rgba(46,35,25,0.28)"
            direction="column"
            alignItems="center"
            p="20px 16px 18px"
            gap="14px"
          >
            <Flex w="100%" direction="column" alignItems="center" gap="7px">
              <Text color="#9B7656" fontSize="16px" fontWeight="700" lineHeight="1">
                下班獎勵
              </Text>
              <Text color="#5F4736" fontSize="30px" fontWeight="700" lineHeight="1.05">
                選一塊拼圖
              </Text>
            </Flex>

            {selectedReward ? (
              <>
                <Flex
                  w="148px"
                  h="148px"
                  borderRadius="16px"
                  bgColor="#F7EFE3"
                  border="1px solid rgba(155,118,86,0.22)"
                  alignItems="center"
                  justifyContent="center"
                  direction="column"
                  gap="9px"
                  px="12px"
                  py="12px"
                  overflow="hidden"
                >
                  <Text color="#6A4F3D" fontSize="20px" fontWeight="700" lineHeight="1">
                    {selectedReward.title}
                  </Text>
                  <Flex gap="6px" wrap="wrap" justifyContent="center">
                    {selectedPlaceRewardBatchPatterns.map((pattern, patternIndex) => {
                      const imagePath = resolveInventoryTileImagePath({
                        category: "route",
                        pattern,
                        sourceId: selectedReward.id,
                      });
                      return imagePath ? (
                        <Flex
                          key={`${selectedReward.id}-${patternIndex}`}
                          w="76px"
                          h="76px"
                          borderRadius="12px"
                          overflow="hidden"
                          border="1px solid rgba(130,106,83,0.28)"
                          bgColor="#EFE7D9"
                        >
                          <img
                            src={imagePath}
                            alt={selectedReward.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        </Flex>
                      ) : (
                        <Grid
                          key={`${selectedReward.id}-${patternIndex}`}
                          templateColumns="repeat(3, 16px)"
                          templateRows="repeat(3, 16px)"
                          gap="3px"
                        >
                          {pattern.flat().map((cell, index) => (
                            <Flex
                              key={`${patternIndex}-${index}`}
                              w="16px"
                              h="16px"
                              borderRadius="4px"
                              bgColor={cell ? "#B48D6A" : "#E3D8C8"}
                            />
                          ))}
                        </Grid>
                      );
                    })}
                  </Flex>
                </Flex>
                <Text color="#8A6A50" fontSize="15px" fontWeight="700">
                  {selectedReward.subtitle}
                </Text>
                <Flex gap="10px">
                  <Flex
                    px="16px"
                    py="9px"
                    borderRadius="999px"
                    bgColor="#EDE2D3"
                    cursor="pointer"
                    onClick={() => {
                      setSelectedRewardId(null);
                      setPlaceRewardCostError("");
                    }}
                  >
                    <Text color="#6A4F3D" fontSize="14px" fontWeight="700">
                      返回
                    </Text>
                  </Flex>
                  <Flex
                    px="22px"
                    py="9px"
                    borderRadius="999px"
                    bgColor="#A8795A"
                    cursor="pointer"
	                    onClick={() => {
	                      if (!selectedReward) return;
	                      setPlaceRewardCostError("");
	                      claimOffworkRewardBatch([
                        {
                          tileId: selectedReward.id,
                          rewardPattern: selectedPlaceRewardPattern,
                          options: {
                            category: "route",
                            label: `${selectedReward.title}路線`,
                            centerEmoji: selectedReward.icon,
	                          },
	                        },
	                      ]);
	                      const latestProgress = loadPlayerProgress();
	                      if (hasCollectedFirstSunbeast(latestProgress) && !latestProgress.hasSeenFirstSunbeastNightHubGuideV3) {
	                        savePlayerProgress({
	                          ...latestProgress,
	                          hasPendingFirstSunbeastNightHubGuide: true,
	                        });
	                      }
	                      setIsOffworkRewardOpen(false);
	                      setIsReturnHomeTransitionOpen(true);
	                    }}
                  >
                    <Text color="white" fontSize="15px" fontWeight="700">
                      收下
                    </Text>
                  </Flex>
                </Flex>
                {placeRewardCostError ? (
                  <Text color="#B05D50" fontSize="12px" fontWeight="700">
                    {placeRewardCostError}
                  </Text>
                ) : null}
              </>
            ) : (
              <Grid w="100%" templateColumns="repeat(2, minmax(0, 1fr))" gap="10px">
                {offworkRewardChoices.map((item) => (
                  <Flex
                    key={item.id}
                    minH="136px"
                    borderRadius="16px"
                    bgColor="#F7EFE3"
                    border="1px solid rgba(155,118,86,0.22)"
                    direction="column"
                    alignItems="center"
                    justifyContent="center"
                    p="12px 8px"
                    cursor="pointer"
                    gap="10px"
                    onClick={() => {
                      setSelectedRewardId(item.id);
                      setPlaceRewardCostError("");
                    }}
                  >
                    <Text color="#5F4736" fontSize="32px" lineHeight="1">
                      {item.icon}
                    </Text>
                    <Flex direction="column" alignItems="center" gap="5px">
                      <Text color="#5F4736" fontSize="22px" fontWeight="700" lineHeight="1">
                        {item.title}
                      </Text>
                      <Text color="#9B7656" fontSize="13px" fontWeight="700" lineHeight="1">
                        {item.subtitle}
                      </Text>
                    </Flex>
                  </Flex>
                ))}
              </Grid>
            )}
          </Flex>
          <Flex
            position="absolute"
            left="50%"
            bottom="18px"
            transform="translateX(-50%)"
            zIndex={53}
            h="36px"
            px="14px"
            borderRadius="999px"
            bgColor="rgba(255,255,255,0.9)"
            border="1px solid rgba(120,95,70,0.25)"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            onClick={() => {
              setRewardInventoryTiles(loadPlayerProgress().rewardPlaceTiles);
              setIsRewardInventoryOpen(true);
            }}
          >
            <Text color="#6B5240" fontSize="13px" fontWeight="700">
              查看目前拼圖（地點 / 路徑）
            </Text>
          </Flex>
        </Flex>
      ) : null}

      {isOffworkScene && isOffworkRewardOpen && isRewardInventoryOpen ? (
            <Flex
              position="absolute"
              left="50%"
              bottom="64px"
              transform="translateX(-50%)"
              zIndex={54}
              alignItems="center"
              justifyContent="center"
              pointerEvents="none"
            >
                <Flex
                  w="100%"
                  maxW="330px"
                  maxH="46vh"
                  borderRadius="16px"
                  bgColor="#F3EEE4"
                  border="2px solid #D9C4A7"
                  boxShadow="0 12px 28px rgba(0,0,0,0.3)"
                  direction="column"
                  p="14px"
                  gap="14px"
                  overflow="hidden"
                  pointerEvents="auto"
                >
                  <Flex alignItems="center" justifyContent="center" position="relative">
                    <Text color="#6B5240" fontSize="20px" fontWeight="700" lineHeight="1">
                      目前持有拼圖
                    </Text>
                    <Flex
                      as="button"
                      position="absolute"
                      right="0"
                      top="0"
                      w="34px"
                      h="34px"
                      borderRadius="999px"
                      bgColor="#A27F5D"
                      alignItems="center"
                      justifyContent="center"
                      onClick={() => setIsRewardInventoryOpen(false)}
                    >
                      <IoClose color="white" size={20} />
                    </Flex>
                  </Flex>
                  <Flex direction="column" gap="10px" overflowY="auto" pr="2px">
                    <Text color="#7C6148" fontSize="16px" fontWeight="700" lineHeight="1">
                      地點拼圖
                    </Text>
                    <Grid
                      borderRadius="10px"
                      border="1px solid rgba(163,135,101,0.35)"
                      bgColor="white"
                      p="10px"
                      minH="118px"
                      templateColumns="repeat(4, 64px)"
                      gridAutoRows="64px"
                      justifyContent="start"
                      alignContent="start"
                      gap="8px"
                    >
                      {ownedPlaceGroups.length === 0 ? (
                        <Text color="#9B8A78" fontSize="12px">目前沒有地點拼圖</Text>
                      ) : (
                        ownedPlaceGroups.map((item) => {
                          const imagePath = resolveInventoryTileImagePath({
                            category: "place",
                            pattern: item.pattern,
                            sourceId: item.sourceId,
                          });
                          return (
                            <Flex
                              key={item.key}
                              w="64px"
                              h="64px"
                              borderRadius="8px"
                              overflow="hidden"
                              border="1px solid rgba(130,106,83,0.36)"
                              bgColor="#F7F3EA"
                              alignItems="center"
                              justifyContent="center"
                            >
                              {imagePath ? (
                                <img
                                  src={imagePath}
                                  alt={item.label}
                                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                />
                              ) : (
                                <Grid templateColumns="repeat(3, 1fr)" templateRows="repeat(3, 1fr)" w="100%" h="100%" gap="2px" p="4px">
                                  {item.pattern.flat().map((cell, index) => (
                                    <Flex
                                      key={`${item.key}-place-fallback-${index}`}
                                      borderRadius="2px"
                                      bgColor={cell ? "#A38765" : "#E2DBCF"}
                                    />
                                  ))}
                                </Grid>
                              )}
                            </Flex>
                          );
                        })
                      )}
                    </Grid>

                    <Text color="#7C6148" fontSize="16px" fontWeight="700" lineHeight="1" mt="2px">
                      路徑拼圖
                    </Text>
                    <Grid
                      borderRadius="10px"
                      border="1px solid rgba(163,135,101,0.35)"
                      bgColor="white"
                      p="10px"
                      minH="150px"
                      templateColumns="repeat(4, 64px)"
                      gridAutoRows="64px"
                      justifyContent="start"
                      alignContent="start"
                      gap="8px"
                    >
                      {ownedRouteGroups.length === 0 ? (
                        <Text color="#9B8A78" fontSize="12px">目前沒有路徑拼圖</Text>
                      ) : (
                        ownedRouteGroups.map((item) => {
                          const imagePath = resolveInventoryTileImagePath({
                            category: "route",
                            pattern: item.pattern,
                          });
                          return (
                            <Flex
                              key={item.key}
                              w="64px"
                              h="64px"
                              borderRadius="8px"
                              overflow="hidden"
                              border="1px solid rgba(130,106,83,0.36)"
                              bgColor="#F7F3EA"
                              alignItems="center"
                              justifyContent="center"
                            >
                              {imagePath ? (
                                <img
                                  src={imagePath}
                                  alt={item.label}
                                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                />
                              ) : (
                                <Grid templateColumns="repeat(3, 1fr)" templateRows="repeat(3, 1fr)" w="100%" h="100%" gap="2px" p="4px">
                                  {item.pattern.flat().map((cell, index) => (
                                    <Flex
                                      key={`${item.key}-route-fallback-${index}`}
                                      borderRadius="2px"
                                      bgColor={cell ? "#A38765" : "#E2DBCF"}
                                    />
                                  ))}
                                </Grid>
                              )}
                            </Flex>
                          );
                        })
                      )}
                    </Grid>
                  </Flex>
                </Flex>
        </Flex>
      ) : null}

      {isOffworkScene && isReturnHomeTransitionOpen ? (
        <ReturnHomeTransitionOverlay
          onFinish={() => {
            startSceneTransition(afterOffworkRewardSceneId, "fade-black", 420);
          }}
        />
      ) : null}

    </Flex>
  );
}
