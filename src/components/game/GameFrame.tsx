"use client";

import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FIRST_SCENE_ID, GAME_SCENES, SCENE_ORDER, type GameScene } from "@/lib/game/scenes";
import { ROUTES } from "@/lib/routes";
import { useEffect, useState } from "react";
import { GAME_EVENT_LIST, type GameEventId } from "@/lib/game/events";
import { SUNBEAST_EVENT_VARIANT, SUNBEAST_EVENT_VERSION_LABEL } from "@/lib/game/sunbeastVariant";
import { GAME_EVENT_CHEAT_TRIGGER } from "@/lib/game/eventCheatBus";
import { GAME_WORK_CHEAT_TRIGGER } from "@/lib/game/workCheatBus";
import {
  AVATAR_EXPRESSION_OPTIONS_BY_TARGET,
  AVATAR_MOTION_LIST,
  type AvatarMotionId,
} from "@/lib/game/avatarPerformance";
import {
  GAME_AVATAR_EXPRESSION_TRIGGER,
  GAME_AVATAR_MOTION_TRIGGER,
  type AvatarTargetId,
} from "@/lib/game/avatarCheatBus";
import type { AvatarSpriteId } from "@/components/game/events/EventAvatarSprite";
import { INITIAL_PLAYER_STATUS, type PlayerStatus } from "@/lib/game/playerStatus";
import type { RewardPlaceTile } from "@/lib/game/playerProgress";
import { GAME_EMOTION_CUE_TRIGGER, type EmotionCueId } from "@/lib/game/emotionCueBus";
import {
  GAME_BACKGROUND_SHAKE_TRIGGER,
  type BackgroundShakeId,
} from "@/lib/game/backgroundShakeBus";
import {
  GAME_SCENE_TRANSITION_TRIGGER,
  type SceneTransitionPresetId,
} from "@/lib/game/sceneTransitionBus";
import {
  getCurrentFlowStage,
  getUnifiedExpansionTracks,
  type UnifiedExpansionItem,
} from "@/lib/game/gameFlow";
import type { InventoryItemId } from "@/lib/game/playerProgress";
import {
  ARRANGE_ROUTE_DEBUG_PRESETS,
  FIRST_STREET_REWARD_PATTERNS,
  INITIAL_PLAYER_PROGRESS,
  PLAYER_PROGRESS_CHANGE_EVENT,
  applyArrangeRouteDebugPreset,
  getArrangeRouteAttempt,
  type ArrangeRouteDebugPresetId,
  type DiaryEntryId,
  loadPlayerProgress,
  resetPlayerProgress,
  savePlayerProgress,
  type PlaceTileId,
  type PlayerProgress,
  type StickerId,
} from "@/lib/game/playerProgress";
import {
  SHOULD_SHOW_GAME_DEBUG_TOOLS,
  STANDARD_TRIAL_PROFILE_VALUE,
  TRIAL_BUILD_LABEL,
  getActiveTrialProfile,
  parseTrialProfilePreference,
  setStoredTrialProfile,
  withTrialProfileSearch,
  type TrialProfileId,
  type TrialProfilePreference,
} from "@/lib/game/demoBuild";
import {
  VISION_FEEDBACK_QR_SRC,
  VISION_RECRUIT_QR_SRC,
  VisionLogoMark,
  VisionQrPanel,
} from "@/components/game/VisionQrPanel";
import { prepareVisionNaotaroOffworkProgress } from "@/lib/game/visionTrialProgress";

const GAME_COMIC_CHEAT_TRIGGER = "moment:comic-cheat-trigger";
const STREET_EXPLORE_CHEAT_TRIGGER = "moment:street-explore-cheat-trigger";
const GAME_PROTOTYPE_CURSOR = "url('/images/pointer_up_cursor.png') 14 2, pointer";
const GAME_PROTOTYPE_ACTIVE_CURSOR = "url('/images/pointer_down_cursor.png') 15 4, pointer";

function resolveGameFrameScene(pathname: string | null) {
  if (!pathname || pathname === ROUTES.gameRoot) return GAME_SCENES[FIRST_SCENE_ID];
  if (pathname === ROUTES.gameArrangeRoute) return GAME_SCENES[FIRST_SCENE_ID];

  const scenePrefix = `${ROUTES.gameRoot}/`;
  if (!pathname.startsWith(scenePrefix)) return GAME_SCENES[FIRST_SCENE_ID];

  const sceneId = decodeURIComponent(pathname.slice(scenePrefix.length).split("/")[0] ?? "");
  return GAME_SCENES[sceneId] ?? GAME_SCENES[FIRST_SCENE_ID];
}

function ExpansionItemCard({ item }: { item: UnifiedExpansionItem }) {
  const triggered = item.triggered;
  const statusLabel =
    item.type === "milestone"
      ? item.status === "completed"
        ? "已完成"
        : item.status === "current"
          ? "進行中"
          : "未開始"
      : item.status === "triggered"
        ? "已觸發"
        : "未觸發";
  const bgColor =
    item.type === "milestone"
      ? item.status === "current"
        ? "rgba(157,120,89,0.2)"
        : item.status === "completed"
          ? "rgba(108,142,94,0.18)"
          : "rgba(255,255,255,0.32)"
      : triggered
        ? "rgba(108,142,94,0.18)"
        : "rgba(255,255,255,0.32)";

  return (
    <Flex
      direction="column"
      gap="2px"
      borderRadius="8px"
      px="8px"
      py="6px"
      bgColor={bgColor}
    >
      <Flex align="center" justify="space-between" gap="8px">
        <Text color="#5A5648" fontSize="13px" fontWeight="700">
          {item.title}
        </Text>
        <Text
          color={triggered ? "#4E7A52" : item.type === "milestone" && item.status === "current" ? "#9D7859" : "#7C7666"}
          fontSize="11px"
          fontWeight="700"
        >
          {statusLabel}
        </Text>
      </Flex>
      {item.type === "milestone" ? (
        <Text color="#6E6A58" fontSize="12px">
          獎勵：{item.rewards}
        </Text>
      ) : (
        <>
          <Text color="#6E6A58" fontSize="12px">
            條件：{item.condition}
          </Text>
          <Text color="#6E6A58" fontSize="12px">
            變化：{item.effect}
          </Text>
        </>
      )}
    </Flex>
  );
}

const EVENT_CHEAT_SHORTCUTS: Array<{ id: GameEventId; title: string }> = GAME_EVENT_LIST
  .filter((event) => event.cheatShortcut)
  .map((event) => ({
    id: event.id,
    title: event.title,
  }));
type EventCheatGroupId = "metro" | "bus" | "breakfast" | "mart" | "park" | "street";
type ComicCheatId = "freshen" | "puppet";

const COMIC_CHEAT_OPTIONS: Array<{ id: ComicCheatId; label: string }> = [
  { id: "freshen", label: "freshen" },
  { id: "puppet", label: "puppet" },
];

const EVENT_CHEAT_GROUPS: Array<{
  id: EventCheatGroupId;
  placeholder: string;
  events: Array<{ id: GameEventId; title: string }>;
}> = [
  {
    id: "metro",
    placeholder: "請選擇捷運事件",
    events: EVENT_CHEAT_SHORTCUTS.filter((event) => event.id.startsWith("metro-")),
  },
  {
    id: "bus",
    placeholder: "請選擇公車事件",
    events: EVENT_CHEAT_SHORTCUTS.filter((event) => event.id.startsWith("bus-")),
  },
  {
    id: "breakfast",
    placeholder: "請選擇早餐店事件",
    events: EVENT_CHEAT_SHORTCUTS.filter((event) => event.id.startsWith("breakfast-")),
  },
  {
    id: "mart",
    placeholder: "請選擇便利商店事件",
    events: EVENT_CHEAT_SHORTCUTS.filter(
      (event) =>
        event.id.startsWith("mart-") ||
        event.id.startsWith("convenience-store-"),
    ),
  },
  {
    id: "park",
    placeholder: "請選擇公園事件",
    events: EVENT_CHEAT_SHORTCUTS.filter((event) => event.id.startsWith("park-")),
  },
  {
    id: "street",
    placeholder: "請選擇街道事件",
    events: EVENT_CHEAT_SHORTCUTS.filter((event) => event.id.startsWith("street-")),
  },
];
type EventCheatGroup = (typeof EVENT_CHEAT_GROUPS)[number];

const EVENT_CHEAT_SELECT_STYLE = {
  height: "32px",
  width: "100%",
  borderRadius: "8px",
  border: "1px solid rgba(95,91,73,0.24)",
  backgroundColor: "rgba(255,255,255,0.72)",
  color: "#4F4B3F",
  fontSize: "12px",
  padding: "0 8px",
  outline: "none",
};

function EventCheatSelect({
  group,
  value,
  onSelect,
}: {
  group: EventCheatGroup;
  value: string;
  onSelect: (groupId: EventCheatGroupId, eventId: GameEventId) => void;
}) {
  return (
    <select
      aria-label={group.placeholder}
      value={value}
      onChange={(event) => {
        const selectedEventId = event.target.value as GameEventId;
        if (!selectedEventId) return;
        onSelect(group.id, selectedEventId);
      }}
      style={EVENT_CHEAT_SELECT_STYLE}
    >
      <option value="">{group.placeholder}</option>
      {group.events.map((event) => (
        <option key={event.id} value={event.id}>
          {event.title}
        </option>
      ))}
    </select>
  );
}

const SPRITE_FRAME_WIDTH = 500;
const SPRITE_FRAME_HEIGHT = 627;
const PREVIEW_SCALE = 0.14;
const MAI_428_FRAME_PATHS = [
  "/images/428出圖/立繪/小麥/1_一般.png",
  "/images/428出圖/立繪/小麥/2_一般（小貝狗）.png",
  "/images/428出圖/立繪/小麥/3_無表情.png",
  "/images/428出圖/立繪/小麥/4_無奈困擾.png",
  "/images/428出圖/立繪/小麥/5_無奈（小貝狗）.png",
  "/images/428出圖/立繪/小麥/6_擔心.png",
  "/images/428出圖/立繪/小麥/7_開心.png",
  "/images/428出圖/立繪/小麥/8_誒？.png",
  "/images/428出圖/立繪/小麥/9_擔心２.png",
  "/images/428出圖/立繪/小麥/10_慌亂2閉眼.png",
  "/images/428出圖/立繪/小麥/11_痛！.png",
  "/images/428出圖/立繪/小麥/12_生氣.png",
  "/images/428出圖/立繪/小麥/13_開心２.png",
  "/images/428出圖/立繪/小麥/14_慌張擔心.png",
  "/images/428出圖/立繪/小麥/15_問號.png",
  "/images/428出圖/立繪/小麥/16_問號（小貝狗）.png",
  "/images/428出圖/立繪/小麥/17_睡衣.png",
  "/images/428出圖/立繪/小麥/18_睡衣（小貝狗）.png",
  "/images/428出圖/立繪/小麥/19_釋懷.png",
  "/images/428出圖/立繪/小麥/20_釋懷（小貝狗）.png",
  "/images/428出圖/立繪/小麥/21_生氣（閉口）.png",
  "/images/428出圖/立繪/小麥/22_生氣（開口）.png",
  "/images/428出圖/立繪/小麥/23_嚴肅（開口）.png",
  "/images/428出圖/立繪/小麥/24_嚴肅（閉口）.png",
  "/images/428出圖/立繪/小麥/25_嘆氣.png",
  "/images/428出圖/立繪/小麥/26_驚嚇.png",
  "/images/428出圖/立繪/小麥/27_驚魂未定.png",
  "/images/428出圖/立繪/小麥/28_慌亂.png",
  "/images/428出圖/立繪/小麥/29_慌亂2.png",
  "/images/428出圖/立繪/小麥/30_驚嚇_小貝狗.png",
  "/images/428出圖/立繪/小麥/31_錯愕_小貝狗.png",
  "/images/428出圖/立繪/小麥/32_嘆氣_小貝狗_睡衣.png",
  "/images/428出圖/立繪/小麥/33_疑問.png",
  "/images/428出圖/立繪/小麥/34_疑問.png",
  "/images/428出圖/立繪/小麥/35_驚訝.png",
  "/images/428出圖/立繪/小麥/36_驚訝.png",
  "/images/428出圖/立繪/小麥/37_思考1.png",
  "/images/428出圖/立繪/小麥/38_思考2.png",
  "/images/428出圖/立繪/小麥/39_恍然大悟.png",
];
const BAI_428_FRAME_PATHS = [
  "/images/428出圖/立繪/小白/1_一般.png",
  "/images/428出圖/立繪/小白/2_開心.png",
  "/images/428出圖/立繪/小白/3_委屈心虛.png",
  "/images/428出圖/立繪/小白/4_難過.png",
  "/images/428出圖/立繪/小白/5_開心２.png",
  "/images/428出圖/立繪/小白/6_裝傻心虛.png",
  "/images/428出圖/立繪/小白/7_熬夜一般.png",
  "/images/428出圖/立繪/小白/8_熬夜一般2.png",
  "/images/428出圖/立繪/小白/9_熬夜疑惑.png",
  "/images/428出圖/立繪/小白/10_熬夜委屈心虛.png",
  "/images/428出圖/立繪/小白/11_熬夜抱歉.png",
  "/images/428出圖/立繪/小白/12_熬夜難過.png",
];
const BEIGO_428_FRAME_PATHS = [
  "/images/428出圖/立繪/小貝狗/1_一般.png",
  "/images/428出圖/立繪/小貝狗/2_擔心.png",
  "/images/428出圖/立繪/小貝狗/3_開心.png",
];
const AVATAR_SPRITE_META: Record<
  AvatarTargetId | "mai-beigo",
  { imagePath: string; cols: number; rows: number; framePaths?: string[] }
> = {
  mai: { imagePath: "/images/mai/Mai_Spirt.png", cols: 6, rows: 3, framePaths: MAI_428_FRAME_PATHS },
  "mai-beigo": { imagePath: "/images/mai/mai&beigo_spirt.png", cols: 5, rows: 1 },
  bai: { imagePath: "/images/bai/Bai_Spirt.png", cols: 7, rows: 1, framePaths: BAI_428_FRAME_PATHS },
  beigo: { imagePath: "/images/beigo/Beigo_Spirt.png", cols: 2, rows: 1, framePaths: BEIGO_428_FRAME_PATHS },
};

export function GameFrame({
  children,
  scene: sceneProp,
  playerStatus,
  onResetProgress,
  rewardPlaceTiles,
  inventoryItems,
  workShiftCount,
  arrangeRouteAttempt,
  isOffworkRewardModal,
  hasPassedThroughStreet,
  initialTrialProfile,
}: {
  children: React.ReactNode;
  scene?: GameScene;
  playerStatus?: PlayerStatus;
  onResetProgress?: () => void;
  rewardPlaceTiles?: RewardPlaceTile[];
  inventoryItems?: InventoryItemId[];
  workShiftCount?: number;
  arrangeRouteAttempt?: number;
  /** 是否曾在安排路線中出發且路線經過街道（解鎖第 3 次拼圖池） */
  hasPassedThroughStreet?: boolean;
  /** 是否正在顯示下班獎勵選擇 modal（用於流程階段顯示） */
  isOffworkRewardModal?: boolean;
  initialTrialProfile?: TrialProfilePreference | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const scene = sceneProp ?? resolveGameFrameScene(pathname);
  const [frameProgress, setFrameProgress] = useState<PlayerProgress>(INITIAL_PLAYER_PROGRESS);
  const [activeTrialProfile, setActiveTrialProfile] = useState<TrialProfileId | null>(() =>
    initialTrialProfile === STANDARD_TRIAL_PROFILE_VALUE
      ? null
      : initialTrialProfile ?? getActiveTrialProfile(),
  );
  const effectiveTrialProfile = activeTrialProfile;
  const isGameWorksTrialProfile = effectiveTrialProfile === "gameworks";
  const isVisionTrialProfile = effectiveTrialProfile === "vision";
  const isExternalTrialProfile = isGameWorksTrialProfile || isVisionTrialProfile;
  const isDevTrialProfile = effectiveTrialProfile === "dev";
  const showDebugTools = isDevTrialProfile || (SHOULD_SHOW_GAME_DEBUG_TOOLS && !isExternalTrialProfile);
  const [isBackgroundFxOpen, setIsBackgroundFxOpen] = useState(false);
  const [isEmotionCueOpen, setIsEmotionCueOpen] = useState(false);
  const [isComicCheatOpen, setIsComicCheatOpen] = useState(false);
  const [isAvatarMotionOpen, setIsAvatarMotionOpen] = useState(false);
  const [isAvatarExpressionOpen, setIsAvatarExpressionOpen] = useState(false);
  const [expansionTab, setExpansionTab] = useState<"all" | "triggered" | "waiting">("all");
  const [expressionCheatTab, setExpressionCheatTab] = useState<AvatarTargetId>("mai");
  const [eventCheatValues, setEventCheatValues] = useState<Record<EventCheatGroupId, string>>({
    metro: "",
    bus: "",
    breakfast: "",
    mart: "",
    park: "",
    street: "",
  });
  const [arrangeRouteDebugPresetId, setArrangeRouteDebugPresetId] =
    useState<ArrangeRouteDebugPresetId>("post-naotaro-first-arrange");
  const [isStatusSummaryOpen, setIsStatusSummaryOpen] = useState(false);
  const [hoveredExpression, setHoveredExpression] = useState<{
    frameIndex: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    setFrameProgress(loadPlayerProgress());
  }, [pathname]);

  useEffect(() => {
    if (initialTrialProfile) {
      setStoredTrialProfile(initialTrialProfile);
      setActiveTrialProfile(initialTrialProfile === STANDARD_TRIAL_PROFILE_VALUE ? null : initialTrialProfile);
    }
  }, [initialTrialProfile]);

  useEffect(() => {
    const syncTrialProfile = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const trialProfileFromSearch = parseTrialProfilePreference(searchParams.get("trial") ?? undefined);
      if (trialProfileFromSearch) {
        setStoredTrialProfile(trialProfileFromSearch);
        setActiveTrialProfile(
          trialProfileFromSearch === STANDARD_TRIAL_PROFILE_VALUE ? null : trialProfileFromSearch,
        );
        return;
      }
      setActiveTrialProfile(getActiveTrialProfile());
    };
    syncTrialProfile();
    window.addEventListener("storage", syncTrialProfile);
    window.addEventListener("focus", syncTrialProfile);
    return () => {
      window.removeEventListener("storage", syncTrialProfile);
      window.removeEventListener("focus", syncTrialProfile);
    };
  }, [pathname]);

  useEffect(() => {
    const syncProgress = () => setFrameProgress(loadPlayerProgress());
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") syncProgress();
    };

    window.addEventListener(PLAYER_PROGRESS_CHANGE_EVENT, syncProgress);
    window.addEventListener("storage", syncProgress);
    window.addEventListener("focus", syncProgress);
    window.addEventListener("pageshow", syncProgress);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener(PLAYER_PROGRESS_CHANGE_EVENT, syncProgress);
      window.removeEventListener("storage", syncProgress);
      window.removeEventListener("focus", syncProgress);
      window.removeEventListener("pageshow", syncProgress);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const triggerEventCheat = (eventId: string) => {
    window.dispatchEvent(
      new CustomEvent(GAME_EVENT_CHEAT_TRIGGER, { detail: { eventId } }),
    );
  };
  const handleEventCheatSelect = (groupId: EventCheatGroupId, eventId: GameEventId) => {
    triggerEventCheat(eventId);
    setEventCheatValues((prev) => ({
      ...prev,
      [groupId]: "",
    }));
  };
  const triggerWorkCheat = () => {
    window.dispatchEvent(new CustomEvent(GAME_WORK_CHEAT_TRIGGER));
  };
  const triggerAvatarMotion = (motionId: AvatarMotionId) => {
    window.dispatchEvent(
      new CustomEvent(GAME_AVATAR_MOTION_TRIGGER, { detail: { motionId } }),
    );
  };
  const triggerAvatarExpression = (frameIndex: number, targetSpriteId: AvatarTargetId) => {
    window.dispatchEvent(
      new CustomEvent(GAME_AVATAR_EXPRESSION_TRIGGER, {
        detail: { frameIndex, targetSpriteId },
      }),
    );
  };
  const triggerEmotionCue = (cueId: EmotionCueId) => {
    window.dispatchEvent(
      new CustomEvent(GAME_EMOTION_CUE_TRIGGER, { detail: { cueId } }),
    );
  };
  const triggerBackgroundShake = (shakeId: BackgroundShakeId) => {
    window.dispatchEvent(
      new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, { detail: { shakeId } }),
    );
  };
  const triggerSceneTransition = (preset: SceneTransitionPresetId, durationMs = 380) => {
    window.dispatchEvent(
      new CustomEvent(GAME_SCENE_TRANSITION_TRIGGER, { detail: { preset, durationMs } }),
    );
  };
  const triggerComicCheat = (comicId: ComicCheatId) => {
    window.dispatchEvent(
      new CustomEvent(GAME_COMIC_CHEAT_TRIGGER, { detail: { comicId } }),
    );
  };

  const triggerChapterOneFastComplete = () => {
    const current = loadPlayerProgress();
    const now = Date.now();
    const ensureTile = (
      tiles: RewardPlaceTile[],
      sourceId: RewardPlaceTile["sourceId"],
      category: RewardPlaceTile["category"],
      pattern: RewardPlaceTile["pattern"],
      label: string,
      centerEmoji: string,
    ) => {
      const exists = tiles.some(
        (tile) =>
          tile.sourceId === sourceId &&
          tile.category === category &&
          JSON.stringify(tile.pattern) === JSON.stringify(pattern),
      );
      if (exists) return tiles;
      return [
        ...tiles,
        {
          instanceId: `${sourceId}-quick-${now}-${tiles.length + 1}`,
          sourceId,
          category,
          label,
          centerEmoji,
          pattern,
        },
      ];
    };
    const ensureStreetTileCount = (
      tiles: RewardPlaceTile[],
      pattern: RewardPlaceTile["pattern"],
      index: number,
    ) => {
      const requiredCount = FIRST_STREET_REWARD_PATTERNS.slice(0, index + 1).filter(
        (rewardPattern) => JSON.stringify(rewardPattern) === JSON.stringify(pattern),
      ).length;
      const existingCount = tiles.filter(
        (tile) =>
          tile.sourceId === "street" &&
          tile.category === "place" &&
          JSON.stringify(tile.pattern) === JSON.stringify(pattern),
      ).length;
      if (existingCount >= requiredCount) return tiles;
      return [
        ...tiles,
        {
          instanceId: `street-quick-${now}-${tiles.length + 1}`,
          sourceId: "street" as const,
          category: "place" as const,
          label: `街道 ${index + 1}`,
          centerEmoji: "💡",
          pattern,
        },
      ];
    };
    const nextRewardTiles = FIRST_STREET_REWARD_PATTERNS.reduce(
      (tiles, pattern, index) => ensureStreetTileCount(tiles, pattern, index),
      ensureTile(
        current.rewardPlaceTiles,
        "metro-station",
        "place",
        [
          [1, 1, 1],
          [0, 1, 0],
          [1, 1, 1],
        ],
        "捷運",
        "🚋",
      ),
    );
    const nextOwnedPlaceIds = Array.from(
      new Set([...current.ownedPlaceTileIds, "metro-station", "street"]),
    ) as PlaceTileId[];
    const nextStickerCollection = current.stickerCollection.includes("naotaro-basic")
      ? current.stickerCollection
      : [...current.stickerCollection, "naotaro-basic"];
    const nextUnlockedDiaryIds = current.unlockedDiaryEntryIds.includes("bai-entry-1")
      ? current.unlockedDiaryEntryIds
      : [...current.unlockedDiaryEntryIds, "bai-entry-1"];
    const nextProgress: PlayerProgress = {
      ...current,
      currentDay: Math.max(1, current.currentDay),
      offworkRewardClaimCount: Math.max(1, current.offworkRewardClaimCount),
      workShiftCount: Math.max(1, current.workShiftCount),
      hasPassedThroughStreet: true,
      hasSeenDiaryFirstReveal: true,
      hasSeenSunbeastFirstReveal: true,
      hasSeenBaiFirstEncounterIntro: true,
      ownedPlaceTileIds: nextOwnedPlaceIds,
      rewardPlaceTiles: nextRewardTiles,
      unlockedDiaryEntryIds: nextUnlockedDiaryIds as DiaryEntryId[],
      stickerCollection: nextStickerCollection as StickerId[],
      lastPhotoScore: current.lastPhotoScore ?? 90,
      lastDogPhotoCapture: current.lastDogPhotoCapture ?? {
        sourceImage: "/images/428出圖/動物事件/黃金獵犬１.png",
        previewImage: "/images/428出圖/動物事件/黃金獵犬１.png",
        dogCoveragePercent: 90,
        cameraFrameRect: { x: 0.18, y: 0.51, width: 0.63, height: 0.2 },
        capturedRect: { x: 0.29, y: 0.51, width: 0.43, height: 0.2 },
        capturedAt: new Date().toISOString(),
      },
    };
    savePlayerProgress(nextProgress);

    const target = `${ROUTES.gameScene("scene-46")}?hub=1&quick=ch1`;
    if (typeof window !== "undefined") {
      window.location.assign(target);
      return;
    }
    router.push(target);
  };

  const triggerNaotaroReadyOffwork = () => {
    prepareVisionNaotaroOffworkProgress();

    const target = withTrialProfileSearch(ROUTES.gameScene("scene-offwork"), effectiveTrialProfile);
    if (typeof window !== "undefined") {
      window.location.assign(target);
      return;
    }
    router.push(target);
  };

  const handleArrangeRouteDebugPresetApply = () => {
    applyArrangeRouteDebugPreset(arrangeRouteDebugPresetId);
    const target = `${ROUTES.gameArrangeRoute}?debugPreset=${arrangeRouteDebugPresetId}`;
    if (typeof window !== "undefined") {
      window.location.assign(target);
      return;
    }
    router.push(target);
  };
  const handleStreetExploreDebugApply = () => {
    const presetId: ArrangeRouteDebugPresetId = "post-convenience-unlock-arrange";
    applyArrangeRouteDebugPreset(presetId);
    if (pathname === ROUTES.gameArrangeRoute) {
      window.dispatchEvent(new CustomEvent(STREET_EXPLORE_CHEAT_TRIGGER));
      return;
    }
    const target = `${ROUTES.gameArrangeRoute}?debugPreset=${presetId}&streetExplore=1`;
    if (typeof window !== "undefined") {
      window.location.assign(target);
      return;
    }
    router.push(target);
  };

  const handleVisionPromoEntry = () => {
    if (pathname === ROUTES.gameArrangeRoute) {
      triggerEventCheat("street-vision-expo-promo");
      return;
    }
    const presetId: ArrangeRouteDebugPresetId = "post-convenience-unlock-arrange";
    applyArrangeRouteDebugPreset(presetId);
    router.push(`${ROUTES.gameArrangeRoute}?event=street-vision-expo-promo`);
  };

  const handleVisionHomeClick = () => {
    router.push(ROUTES.visionTrial);
  };

  const effectiveOnResetProgress = onResetProgress ?? (() => {
    resetPlayerProgress();
    setFrameProgress(INITIAL_PLAYER_PROGRESS);
    if (typeof window !== "undefined") {
      window.location.assign(withTrialProfileSearch(ROUTES.gameRoot, effectiveTrialProfile));
    }
  });
  const progressSnapshot = frameProgress;
  const frameRewardPlaceTiles = rewardPlaceTiles ?? progressSnapshot.rewardPlaceTiles;
  const currentStatus = playerStatus ?? progressSnapshot.status ?? INITIAL_PLAYER_STATUS;
  const totalRewardTiles = frameRewardPlaceTiles.length;
  const routeRewardTiles = frameRewardPlaceTiles.filter((tile) => tile.category === "route").length;
  const placeRewardTiles = frameRewardPlaceTiles.filter((tile) => tile.category === "place").length;
  const inventoryItemList = inventoryItems ?? progressSnapshot.inventoryItems;
  const totalWorkShifts = workShiftCount ?? progressSnapshot.workShiftCount;
  const passedStreet = hasPassedThroughStreet ?? progressSnapshot.hasPassedThroughStreet;
  const attempt =
    typeof arrangeRouteAttempt === "number"
      ? arrangeRouteAttempt
      : getArrangeRouteAttempt(progressSnapshot, {
          forceStoryTutorial:
            typeof window !== "undefined" &&
            new URLSearchParams(window.location.search).get("tutorial") === "story41",
        });
  const inventorySummary = Object.entries(
    inventoryItemList.reduce<Record<string, number>>((acc, itemId) => {
      acc[itemId] = (acc[itemId] ?? 0) + 1;
      return acc;
    }, {}),
  );

  const currentFlowStageId = getCurrentFlowStage(
    pathname ?? "",
    scene.id,
    isOffworkRewardModal,
  );
  const completedArrangeAttemptCount = Math.max(0, progressSnapshot.arrangeRouteDepartureCount ?? 0);
  const isArrangeRouteStage = currentFlowStageId === "arrange-route";
  const unlockedPlaceLabelMap: Partial<Record<PlaceTileId, string>> = {
    "metro-station": "捷運",
    street: "街道",
    "convenience-store": "便利商店",
    park: "公園",
    "breakfast-shop": "早餐店",
    "bus-stop": "公車站",
  };
  const unlockedPlaceIds = Array.from(
    new Set<PlaceTileId>([
      ...progressSnapshot.ownedPlaceTileIds,
      ...frameRewardPlaceTiles
        .filter((tile) => tile.category === "place")
        .map((tile) => tile.sourceId),
    ]),
  );
  const unlockedPlaceLabels = unlockedPlaceIds
    .map((id) => unlockedPlaceLabelMap[id] ?? id)
    .sort((a, b) => a.localeCompare(b, "zh-Hant"));
  const expressionSpriteMeta = AVATAR_SPRITE_META[expressionCheatTab];
  const expressionFrameCount =
    expressionSpriteMeta.framePaths?.length ?? expressionSpriteMeta.cols * expressionSpriteMeta.rows;
  const expressionOptions = AVATAR_EXPRESSION_OPTIONS_BY_TARGET[expressionCheatTab]
    .slice(0, expressionFrameCount)
    .filter((expression) => !expression.title.startsWith("保留"));
  const previewFrame =
    hoveredExpression === null
      ? null
      : Math.max(0, Math.min(expressionFrameCount - 1, hoveredExpression.frameIndex));
  const previewExpressionTitle =
    previewFrame === null
      ? null
      : (
          expressionOptions.find((expression) => expression.frameIndex === previewFrame)?.title ??
          `表情 ${previewFrame + 1}`
        );
  const previewCol = previewFrame === null ? 0 : previewFrame % expressionSpriteMeta.cols;
  const previewRow =
    previewFrame === null ? 0 : Math.floor(previewFrame / expressionSpriteMeta.cols);
  const previewWidth = SPRITE_FRAME_WIDTH * PREVIEW_SCALE;
  const previewHeight = SPRITE_FRAME_HEIGHT * PREVIEW_SCALE;
  const previewSheetWidth = SPRITE_FRAME_WIDTH * expressionSpriteMeta.cols * PREVIEW_SCALE;
  const previewSheetHeight = SPRITE_FRAME_HEIGHT * expressionSpriteMeta.rows * PREVIEW_SCALE;
  const previewFramePath = previewFrame === null ? null : expressionSpriteMeta.framePaths?.[previewFrame];
  const tooltipOffset = 14;
  const tooltipEstimatedWidth = previewWidth + 110;
  const tooltipEstimatedHeight = Math.max(previewHeight + 16, 56);
  const viewportWidth = typeof window === "undefined" ? 1440 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 900 : window.innerHeight;
  const tooltipLeft =
    hoveredExpression === null
      ? 0
      : Math.max(
          8,
          Math.min(
            hoveredExpression.x + tooltipOffset,
            viewportWidth - tooltipEstimatedWidth - 8,
          ),
        );
  const tooltipTop =
    hoveredExpression === null
      ? 0
      : Math.max(
          8,
          Math.min(
            hoveredExpression.y + tooltipOffset,
            viewportHeight - tooltipEstimatedHeight - 8,
          ),
        );
  const allExpansionItems = getUnifiedExpansionTracks({
    completedAttemptCount: completedArrangeAttemptCount,
    currentAttempt: attempt,
    isArrangeRouteStage,
    hasPassedThroughStreet: passedStreet,
  });
  const expansionItems =
    expansionTab === "all"
      ? allExpansionItems
      : expansionTab === "triggered"
        ? allExpansionItems.filter((x) => x.triggered)
        : allExpansionItems.filter((x) => !x.triggered);
  const storySceneOptions = SCENE_ORDER.filter((id) => id !== "scene-offwork").map((id) => {
    const item = GAME_SCENES[id];
    const shortDialogue = item.dialogue.length > 14 ? `${item.dialogue.slice(0, 14)}…` : item.dialogue;
    return {
      id,
      path: ROUTES.gameScene(id),
      label: `${id}｜${item.sceneLabel ?? "未命名"}｜${item.characterName}${shortDialogue ? `｜${shortDialogue}` : ""}`,
    };
  });
  const sceneJumpOptions = [
    ...storySceneOptions,
    {
      id: "night-hub",
      path: `${ROUTES.gameScene("scene-46")}?hub=1`,
      label: "night-hub｜晚上客廳｜Night Hub",
    },
  ];
  const selectedArrangeRouteDebugPreset =
    ARRANGE_ROUTE_DEBUG_PRESETS.find((preset) => preset.id === arrangeRouteDebugPresetId) ??
    ARRANGE_ROUTE_DEBUG_PRESETS[0];
  const trialModeLabel = isGameWorksTrialProfile
    ? "GameWork 試玩版"
    : isVisionTrialProfile
      ? "放視大賞特別版"
      : TRIAL_BUILD_LABEL;
  const metroEventCheatGroup = EVENT_CHEAT_GROUPS.find((group) => group.id === "metro");

  return (
    <Flex minH="100dvh" bgColor="#F2F1E7" alignItems="center" justifyContent="center">
      <Flex
        w="100%"
        maxW="1800px"
        px={{ base: "0", lg: "16px", xl: "32px" }}
        py={{ base: "0", lg: "16px", xl: "24px" }}
        gap={{ base: "0", lg: "12px", xl: "24px" }}
        alignItems="center"
        justifyContent="center"
      >
        <Flex
          display={{ base: "none", lg: "flex" }}
          flex="1"
          minW="240px"
          maxW="360px"
          h="852px"
          bgColor={isVisionTrialProfile ? "#DDE8DD" : "#E4E2C8"}
          borderRadius="16px"
          p={isVisionTrialProfile ? "36px 26px 24px" : "20px"}
          alignItems="flex-start"
        >
          <Flex direction="column" w="100%" h="100%" justifyContent="space-between">
            {isVisionTrialProfile ? (
              <>
                <VisionQrPanel
                  title="試玩回饋"
                  imageSrc={VISION_FEEDBACK_QR_SRC}
                  alt="放視大賞試玩回饋 QR code"
                  footer={
                    <Flex direction="column" gap="8px" w="100%">
                      <Flex
                        as="button"
                        w="100%"
                        h="38px"
                        alignItems="center"
                        justifyContent="center"
                        color="#4F765D"
                        fontSize="12px"
                        fontWeight="900"
                        bgColor="rgba(255,255,255,0.72)"
                        border="1px solid rgba(79,118,93,0.18)"
                        borderRadius="10px"
                        cursor="pointer"
                        onClick={handleVisionHomeClick}
                      >
                        回到首頁
                      </Flex>
                      <Flex
                        as="button"
                        w="100%"
                        h="38px"
                        alignItems="center"
                        justifyContent="center"
                        color="white"
                        fontSize="12px"
                        fontWeight="800"
                        bgColor="#7F5A5A"
                        border="0"
                        borderRadius="10px"
                        cursor="pointer"
                        onClick={effectiveOnResetProgress}
                        opacity={1}
                        pointerEvents="auto"
                      >
                        重新開始
                      </Flex>
                    </Flex>
                  }
                >
                  <Flex direction="column" gap="18px" mt="10px">
                    <select
                      defaultValue=""
                      onChange={(event) => {
                        const nextPath = event.currentTarget.value;
                        if (!nextPath) return;
                        window.location.assign(withTrialProfileSearch(nextPath, "vision"));
                      }}
                      style={{
                        height: "44px",
                        width: "100%",
                        backgroundColor: "rgba(255,255,255,0.46)",
                        border: 0,
                        borderRadius: "10px",
                        color: "#5D7165",
                        fontSize: "13px",
                        fontWeight: 800,
                        padding: "0 12px",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="">scene 選擇</option>
                      {sceneJumpOptions.map((option) => (
                        <option key={option.id} value={option.path}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <Flex
                      as="button"
                      h="44px"
                      w="100%"
                      bgColor="#4F765D"
                      color="white"
                      border="0"
                      borderRadius="10px"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      fontSize="13px"
                      fontWeight="900"
                      onClick={triggerNaotaroReadyOffwork}
                    >
                      收集到直太郎回到家
                    </Flex>
                  </Flex>
                </VisionQrPanel>
              </>
            ) : isGameWorksTrialProfile ? (
              <>
                <Flex direction="column" gap="14px" w="100%">
                  <Flex direction="column" gap="6px">
                    <Text color="#5F5B49" fontSize="13px" fontWeight="800">
                      GameWork 試玩資訊
                    </Text>
                    <Text color="#3D3A32" fontSize="22px" fontWeight="900" lineHeight="1.15">
                      通勤日常的一天
                    </Text>
                    <Text color="#6E6A58" fontSize="13px" lineHeight="1.7">
                      跟著小麥從早晨出門，安排路線、遇見事件，並在下班後透過日記和小日獸收集推進故事。
                    </Text>
                  </Flex>
                  <Flex direction="column" gap="8px" p="10px" borderRadius="10px" bgColor="rgba(255,255,255,0.34)">
                    <Flex align="center" justify="space-between">
                      <Text color="#5F5B49" fontSize="14px" fontWeight="800">
                        目前進度
                      </Text>
                      <Text color="#6E6A58" fontSize="12px" fontWeight="800">
                        第 {Math.max(1, progressSnapshot.currentDay)} 天
                      </Text>
                    </Flex>
                    <Text color="#6E6A58" fontSize="13px" lineHeight="1.45">
                      {isArrangeRouteStage
                        ? `正在進行第 ${attempt} 次路線安排`
                        : `已完成 ${completedArrangeAttemptCount} 次路線出發`}
                    </Text>
                  </Flex>
                  <Flex direction="column" gap="8px">
                    {[
                      "完成第一章開場，進入通勤循環",
                      "用拼圖把家、捷運與新地點接起來",
                      "嘗試觸發街道與便利商店事件",
                      "下班後查看日記與小日獸紀錄",
                    ].map((label) => (
                      <Flex
                        key={label}
                        borderRadius="10px"
                        bgColor="rgba(255,255,255,0.38)"
                        px="12px"
                        py="10px"
                      >
                        <Text color="#6E6A58" fontSize="13px" fontWeight="700" lineHeight="1.45">
                          {label}
                        </Text>
                      </Flex>
                    ))}
                  </Flex>
                </Flex>
                <Flex>
                  <Flex
                    w="100%"
                    px="10px"
                    bgColor="#7F5A5A"
                    color="white"
                    h="38px"
                    borderRadius="10px"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    onClick={effectiveOnResetProgress}
                    opacity={1}
                    pointerEvents="auto"
                    fontSize="12px"
                    fontWeight="700"
                    textAlign="center"
                  >
                    重新開始
                  </Flex>
                </Flex>
              </>
            ) : (
              <>
            <Flex direction="column" gap="14px" w="100%">
              <Flex align="baseline" justify="space-between" gap="8px" wrap="wrap">
                <Text color="#5F5B49" fontWeight="700" fontSize="18px">
                  進程與擴展
                </Text>
                <Text color="#6E6A58" fontSize="13px">
                  {isArrangeRouteStage
                    ? `目前：第 ${attempt} 次安排路線`
                    : `已完成：第 ${Math.max(1, completedArrangeAttemptCount)} 次安排路線`}
                </Text>
              </Flex>
              <Flex gap="6px" mb="6px">
                {(["all", "triggered", "waiting"] as const).map((tab) => (
                  <Flex
                    key={tab}
                    flex="1"
                    h="28px"
                    borderRadius="6px"
                    bgColor={expansionTab === tab ? "rgba(157,120,89,0.35)" : "rgba(255,255,255,0.4)"}
                    align="center"
                    justify="center"
                    cursor="pointer"
                    onClick={() => setExpansionTab(tab)}
                  >
                    <Text
                      color={expansionTab === tab ? "#3D3A32" : "#6E6A58"}
                      fontSize="12px"
                      fontWeight={expansionTab === tab ? "700" : "500"}
                    >
                      {tab === "all" ? "全部" : tab === "triggered" ? "已觸發" : "未觸發"}
                    </Text>
                  </Flex>
                ))}
              </Flex>
              <Box
                h="120px"
                overflowY="auto"
                overflowX="hidden"
                borderRadius="8px"
                css={{ scrollbarWidth: "thin" }}
              >
                <Flex direction="column" gap="6px">
                  {expansionItems.map((item) => (
                    <ExpansionItemCard key={item.id} item={item} />
                  ))}
                </Flex>
              </Box>

              <Flex direction="column" gap="4px" p="6px 8px" borderRadius="8px" bgColor="rgba(255,255,255,0.28)">
                <Flex
                  align="center"
                  justify="space-between"
                  cursor="pointer"
                  onClick={() => setIsStatusSummaryOpen((prev) => !prev)}
                >
                  <Text color="#5F5B49" fontSize="12px" fontWeight="700">
                    目前狀態
                  </Text>
                  <Text color="#6E6A58" fontSize="11px" fontWeight="700">
                    {isStatusSummaryOpen ? "收合 ▲" : "展開 ▼"}
                  </Text>
                </Flex>
                {isStatusSummaryOpen ? (
                  <Flex direction="column" gap="3px">
                    <Text color="#6E6A58" fontSize="12px" lineHeight="1.35">
                      場景：{scene.sceneLabel ?? "未命名"} · 角色：{scene.characterName} · {scene.id}
                    </Text>
                    <Text color="#6E6A58" fontSize="12px" lineHeight="1.35">
                      儲蓄：{currentStatus.savings} · 行動力：{currentStatus.actionPower} · 疲勞：{currentStatus.fatigue}
                    </Text>
                    <Text color="#6E6A58" fontSize="12px" lineHeight="1.35">
                      上班次數：{totalWorkShifts}
                    </Text>
                    <Text color="#6E6A58" fontSize="11px" mt="2px" lineHeight="1.35">
                      獎勵拼圖 總數：{totalRewardTiles}（一般 {routeRewardTiles} / 地點 {placeRewardTiles}）
                    </Text>
                  </Flex>
                ) : null}
              </Flex>
              <Flex direction="column" gap="6px" p="8px" borderRadius="8px" bgColor="rgba(255,255,255,0.32)">
                <Text color="#5F5B49" fontSize="13px" fontWeight="700">
                  已解鎖地點
                </Text>
                {unlockedPlaceLabels.length === 0 ? (
                  <Text color="#6E6A58" fontSize="12px">
                    尚未解鎖
                  </Text>
                ) : (
                  <Flex wrap="wrap" gap="6px">
                    {unlockedPlaceLabels.map((label) => (
                      <Flex
                        key={label}
                        px="8px"
                        h="24px"
                        borderRadius="999px"
                        alignItems="center"
                        bgColor="rgba(157,120,89,0.2)"
                      >
                        <Text color="#6E6A58" fontSize="12px" fontWeight="600">
                          {label}
                        </Text>
                      </Flex>
                    ))}
                  </Flex>
                )}
              </Flex>
              <Flex direction="column" gap="6px" mt="4px">
                {showDebugTools ? (
                  <select
                    value={scene.id}
                    onChange={(event) => {
                      const selectedId = event.target.value;
                      if (!selectedId) return;
                      const nextOption = sceneJumpOptions.find((item) => item.id === selectedId);
                      if (!nextOption) return;
                      if (nextOption.path === pathname) return;
                      router.push(nextOption.path);
                    }}
                    style={{
                      height: "34px",
                      width: "100%",
                      borderRadius: "8px",
                      border: "1px solid rgba(95,91,73,0.24)",
                      backgroundColor: "rgba(255,255,255,0.68)",
                      color: "#4F4B3F",
                      fontSize: "12px",
                      padding: "0 8px",
                      outline: "none",
                    }}
                  >
                    {sceneJumpOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                ) : null}
                <Text color="#5F5B49" fontWeight="700" fontSize="18px">
                  物品欄
                </Text>
                <Flex direction="column" gap="6px" p="8px" borderRadius="8px" bgColor="rgba(255,255,255,0.32)">
                  {inventorySummary.length === 0 ? (
                    <Text color="#6E6A58" fontSize="12px">
                      目前尚無道具
                    </Text>
                  ) : (
                    <>
                      {inventorySummary.map(([itemId, count]) => (
                        <Flex key={itemId} align="center" justify="space-between" gap="8px">
                          <Text color="#6E6A58" fontSize="13px">
                            {itemId === "cat-grass"
                              ? "🌿 貓草"
                              : itemId === "cat-treat"
                                ? "🐟 貓肉泥"
                                : itemId === "puzzle-fragment"
                                  ? "🧩 拼圖碎片"
                                  : itemId === "melody-fragment"
                                    ? "🎵 一段旋律"
                                    : itemId === "yarn"
                                      ? "🧶 毛線"
                                      : itemId === "coffee"
                                        ? "☕ 咖啡"
                                        : itemId === "milk-tea"
                                          ? "🧋 奶茶"
                                          : itemId === "energy-drink"
                                            ? "⚡ 能量飲料"
                                : itemId}
                          </Text>
                          <Text color="#5A5648" fontSize="12px" fontWeight="700">
                            x{count}
                          </Text>
                        </Flex>
                      ))}
                    </>
                  )}
                </Flex>
              </Flex>
            </Flex>
            {showDebugTools ? (
              <>
                <Flex wrap="wrap" gap="8px">
                  <Flex
                    flex="1 1 calc(50% - 4px)"
                    minW="0"
                    px="10px"
                    bgColor="#4D7B6F"
                    color="white"
                    h="38px"
                    borderRadius="10px"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    fontSize="12px"
                    fontWeight="600"
                    textAlign="center"
                    lineHeight="1.2"
                    onClick={triggerChapterOneFastComplete}
                  >
                    金手指：第一章完成
                  </Flex>
                  <NextLink
                    href={ROUTES.gameArrangeRoute}
                    style={{ flex: "1 1 calc(50% - 4px)", minWidth: 0, textDecoration: "none" }}
                  >
                    <Flex
                      w="100%"
                      px="10px"
                      bgColor="#6C8E5E"
                      color="white"
                      h="38px"
                      borderRadius="10px"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      fontSize="12px"
                      fontWeight="600"
                      textAlign="center"
                      lineHeight="1.2"
                    >
                      金手指：安排路線
                    </Flex>
                  </NextLink>
                  <NextLink
                    href={ROUTES.gameRoot}
                    style={{ flex: "1 1 calc(50% - 4px)", minWidth: 0, textDecoration: "none" }}
                  >
                    <Flex
                      w="100%"
                      px="10px"
                      bgColor="#9D7859"
                      color="white"
                      h="38px"
                      borderRadius="10px"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      fontSize="12px"
                      fontWeight="600"
                      textAlign="center"
                      lineHeight="1.2"
                    >
                      重新開始
                    </Flex>
                  </NextLink>
                  <Flex
                    flex="1 1 calc(50% - 4px)"
                    minW="0"
                    px="10px"
                    bgColor="#7F5A5A"
                    color="white"
                    h="38px"
                    borderRadius="10px"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    onClick={effectiveOnResetProgress}
                    opacity={1}
                    pointerEvents="auto"
                    fontSize="12px"
                    fontWeight="600"
                    textAlign="center"
                    lineHeight="1.2"
                  >
                    重置玩家資料
                  </Flex>
                </Flex>
                <Flex direction="column" gap="8px" p="10px" borderRadius="10px" bgColor="rgba(255,255,255,0.32)">
                  <Text color="#5F5B49" fontSize="13px" fontWeight="700">
                    安排行程測試捷徑
                  </Text>
                  <select
                    value={arrangeRouteDebugPresetId}
                    onChange={(event) =>
                      setArrangeRouteDebugPresetId(event.target.value as ArrangeRouteDebugPresetId)
                    }
                    style={{
                      height: "34px",
                      width: "100%",
                      borderRadius: "8px",
                      border: "1px solid rgba(95,91,73,0.24)",
                      backgroundColor: "rgba(255,255,255,0.86)",
                      color: "#4F4B3F",
                      fontSize: "12px",
                      padding: "0 8px",
                      outline: "none",
                    }}
                  >
                    {ARRANGE_ROUTE_DEBUG_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <Text color="#6E6A58" fontSize="12px" lineHeight="1.5">
                    {selectedArrangeRouteDebugPreset.description}
                  </Text>
                  <Flex
                    h="34px"
                    borderRadius="8px"
                    bgColor="#5E7D91"
                    color="white"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    fontSize="12px"
                    fontWeight="700"
                    onClick={handleArrangeRouteDebugPresetApply}
                  >
                    套用進度並前往安排
                  </Flex>
                </Flex>
              </>
            ) : (
              <Flex wrap="wrap" gap="8px">
                <NextLink
                  href={ROUTES.home}
                  style={{ flex: "1 1 calc(50% - 4px)", minWidth: 0, textDecoration: "none" }}
                >
                  <Flex
                    w="100%"
                    px="10px"
                    bgColor="#6C8E5E"
                    color="white"
                    h="38px"
                    borderRadius="10px"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    fontSize="12px"
                    fontWeight="700"
                    textAlign="center"
                  >
                    回到標題
                  </Flex>
                </NextLink>
                <Flex
                  flex="1 1 calc(50% - 4px)"
                  minW="0"
                  px="10px"
                  bgColor="#7F5A5A"
                  color="white"
                  h="38px"
                  borderRadius="10px"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  onClick={effectiveOnResetProgress}
                  opacity={1}
                  pointerEvents="auto"
                  fontSize="12px"
                  fontWeight="700"
                  textAlign="center"
                >
                  重置進度
                </Flex>
              </Flex>
            )}
              </>
            )}
          </Flex>
        </Flex>

        <Flex
          w={{ base: "100vw", lg: "393px" }}
          justifyContent="center"
          cursor={GAME_PROTOTYPE_CURSOR}
          css={{
            "& *": {
              cursor: `${GAME_PROTOTYPE_CURSOR} !important`,
            },
            "&:active, &:active *": {
              cursor: `${GAME_PROTOTYPE_ACTIVE_CURSOR} !important`,
            },
          }}
        >
          {children}
        </Flex>

        <Flex
          display={{ base: "none", lg: "flex" }}
          flex="1"
          minW="240px"
          maxW="360px"
          h="852px"
          bgColor={isVisionTrialProfile ? "#DDE8DD" : "#E4E2C8"}
          borderRadius="16px"
          p={isVisionTrialProfile ? "36px 26px 24px" : "20px"}
          alignItems="flex-start"
        >
          <Flex direction="column" w="100%" h="100%" gap="10px">
            {showDebugTools ? (
              <>
            <Flex
              w="100%"
              minH="48px"
              borderRadius="12px"
              bgColor={SUNBEAST_EVENT_VARIANT === "B" ? "#2F6F59" : "#7A6751"}
              border="1px solid rgba(255,255,255,0.42)"
              boxShadow="0 8px 18px rgba(66,60,44,0.12)"
              px="14px"
              py="10px"
              direction="column"
              justifyContent="center"
            >
              <Text color="rgba(255,255,255,0.74)" fontSize="11px" fontWeight="800" lineHeight="1">
                目前版本
              </Text>
              <Text color="white" fontSize="18px" fontWeight="900" lineHeight="1.25">
                {SUNBEAST_EVENT_VERSION_LABEL}
              </Text>
            </Flex>
            <Text color="#5F5B49" fontWeight="700" fontSize="20px">
              事件金手指
            </Text>
            <Text color="#7A7462" fontSize="12px">
              以場景入口為主（公園可選休息/探索）
            </Text>
            <Flex
              h="30px"
              borderRadius="8px"
              bgColor="#6C8E5E"
              color="white"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              fontSize="12px"
              fontWeight="700"
              onClick={triggerWorkCheat}
            >
              金手指：直接上班
            </Flex>
            <NextLink
              href={`${ROUTES.gameScene("scene-98-work")}?workMinigame=pdf&workMinigameDirect=1`}
              style={{ textDecoration: "none" }}
            >
              <Flex
                h="30px"
                borderRadius="8px"
                bgColor="#5E7D91"
                color="white"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                fontSize="12px"
                fontWeight="700"
              >
                金手指：PDF 匯出
              </Flex>
            </NextLink>
            <NextLink
              href={`${ROUTES.gameScene("scene-98-work")}?workMinigame=chicken&workMinigameDirect=1`}
              style={{ textDecoration: "none" }}
            >
              <Flex
                h="30px"
                borderRadius="8px"
                bgColor="#8E6D52"
                color="white"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                fontSize="12px"
                fontWeight="700"
              >
                金手指：辦公室公雞
              </Flex>
            </NextLink>
            <NextLink
              href={`${ROUTES.gameScene("scene-98-work")}?workMinigame=ostrich&workMinigameDirect=1`}
              style={{ textDecoration: "none" }}
            >
              <Flex
                h="30px"
                borderRadius="8px"
                bgColor="#667A42"
                color="white"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                fontSize="12px"
                fontWeight="700"
              >
                金手指：公園鴕鳥
              </Flex>
            </NextLink>
            <Flex
              h="30px"
              borderRadius="8px"
              bgColor="#9A7A52"
              color="white"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              fontSize="12px"
              fontWeight="700"
              onClick={handleStreetExploreDebugApply}
            >
              測試：街道選項
            </Flex>
            <Flex
              h="34px"
              borderRadius="9px"
              bgColor="#5E7D91"
              color="white"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              fontSize="12px"
              fontWeight="800"
              onClick={handleVisionPromoEntry}
            >
              行銷素材：放視大賞
            </Flex>
            <Flex
              h="30px"
              borderRadius="8px"
              bgColor="#B47A58"
              color="white"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              fontSize="12px"
              fontWeight="700"
              onClick={triggerNaotaroReadyOffwork}
            >
              測試：拍到直太郎準備下班
            </Flex>
            <NextLink
              href={`${ROUTES.gameScene("scene-night-hub")}?diary=1`}
              style={{ textDecoration: "none" }}
            >
              <Flex
                h="30px"
                borderRadius="8px"
                bgColor="#8B6A4E"
                color="white"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                fontSize="12px"
                fontWeight="700"
              >
                金手指：交換日記
              </Flex>
            </NextLink>
            <NextLink
              href={`${ROUTES.gameScene("scene-night-hub")}?diary=1&tab=sunbeast`}
              style={{ textDecoration: "none" }}
            >
              <Flex
                h="30px"
                borderRadius="8px"
                bgColor="#6F7E8B"
                color="white"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                fontSize="12px"
                fontWeight="700"
              >
                金手指：小日獸圖鑑
              </Flex>
            </NextLink>
            <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="6px">
              {EVENT_CHEAT_GROUPS.map((group) => (
                <EventCheatSelect
                  key={group.id}
                  group={group}
                  value={eventCheatValues[group.id]}
                  onSelect={handleEventCheatSelect}
                />
              ))}
            </Grid>
            <Flex
              h="28px"
              borderRadius="8px"
              bgColor="rgba(157,120,89,0.18)"
              color="#5F5B49"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              fontSize="11px"
              fontWeight="700"
              onClick={() => setIsEmotionCueOpen((prev) => !prev)}
            >
              {isEmotionCueOpen ? "收合表情符號 ▲" : "展開表情符號 ▼"}
            </Flex>
            {isEmotionCueOpen ? (
              <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap="6px">
                {[
                  { id: "alert", label: "驚嘆號" },
                  { id: "droplet", label: "雨滴" },
                  { id: "question", label: "疑問" },
                  { id: "heart", label: "愛心" },
                  { id: "anger", label: "火氣" },
                  { id: "dizzy", label: "眩暈" },
                ].map((cue) => (
                  <Flex
                    key={cue.id}
                    h="30px"
                    borderRadius="8px"
                    bgColor="#9D7859"
                    color="white"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    fontSize="11px"
                    onClick={() => triggerEmotionCue(cue.id as Parameters<typeof triggerEmotionCue>[0])}
                  >
                    {cue.label}
                  </Flex>
                ))}
              </Grid>
            ) : null}
            <Grid templateColumns="repeat(1, minmax(0, 1fr))" gap="6px">
              <Flex
                h="30px"
                borderRadius="8px"
                bgColor="#7E6A5A"
                color="white"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                fontSize="11px"
                onClick={() => triggerSceneTransition("fade-black", 380)}
              >
                黑幕淡入淡出
              </Flex>
            </Grid>
            <Flex
              h="28px"
              borderRadius="8px"
              bgColor="rgba(157,120,89,0.18)"
              color="#5F5B49"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              fontSize="11px"
              fontWeight="700"
              onClick={() => setIsComicCheatOpen((prev) => !prev)}
            >
              {isComicCheatOpen ? "收合漫畫格 ▲" : "展開漫畫格 ▼"}
            </Flex>
            {isComicCheatOpen ? (
              <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="6px">
                {COMIC_CHEAT_OPTIONS.map((comic) => (
                  <Flex
                    key={comic.id}
                    h="30px"
                    borderRadius="8px"
                    bgColor="#7E6A5A"
                    color="white"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    fontSize="11px"
                    onClick={() => triggerComicCheat(comic.id)}
                  >
                    {comic.label}
                  </Flex>
                ))}
              </Grid>
            ) : null}
            <Flex
              h="28px"
              borderRadius="8px"
              bgColor="rgba(157,120,89,0.18)"
              color="#5F5B49"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              fontSize="11px"
              fontWeight="700"
              onClick={() => setIsBackgroundFxOpen((prev) => !prev)}
            >
              {isBackgroundFxOpen ? "收合背景特效 ▲" : "展開背景特效 ▼"}
            </Flex>
            {isBackgroundFxOpen ? (
              <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="6px">
                {[
                  { id: "shake-weak", label: "震動（弱）" },
                  { id: "shake-strong", label: "震動（強）" },
                  { id: "flash-white", label: "閃白" },
                  { id: "vignette-dark", label: "漸暗" },
                  { id: "cool-filter", label: "冷色濾鏡" },
                  { id: "border-pulse", label: "邊框脈衝" },
                ].map((fx) => (
                  <Flex
                    key={fx.id}
                    h="30px"
                    borderRadius="8px"
                    bgColor="#9D7859"
                    color="white"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    fontSize="11px"
                    onClick={() => triggerBackgroundShake(fx.id as BackgroundShakeId)}
                  >
                    {fx.label}
                  </Flex>
                ))}
              </Grid>
            ) : null}
            <Box h="1px" bgColor="rgba(90,86,72,0.25)" my="6px" />
            <Flex
              h="28px"
              borderRadius="8px"
              bgColor="rgba(139,106,78,0.2)"
              color="#5F5B49"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              fontSize="12px"
              fontWeight="700"
              onClick={() => setIsAvatarMotionOpen((prev) => !prev)}
            >
              {isAvatarMotionOpen ? "收合頭像動作金手指 ▲" : "展開頭像動作金手指 ▼"}
            </Flex>
            {isAvatarMotionOpen ? (
              <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="6px">
                {AVATAR_MOTION_LIST.map((motion) => (
                  <Flex
                    key={motion.id}
                    h="30px"
                    borderRadius="8px"
                    bgColor="#8B6A4E"
                    color="white"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    fontSize="11px"
                    px="6px"
                    textAlign="center"
                    onClick={() => triggerAvatarMotion(motion.id)}
                  >
                    {motion.title}
                  </Flex>
                ))}
              </Grid>
            ) : null}
            <Box h="1px" bgColor="rgba(90,86,72,0.25)" my="6px" />
            <Flex
              h="28px"
              borderRadius="8px"
              bgColor="rgba(111,126,139,0.2)"
              color="#5F5B49"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              fontSize="12px"
              fontWeight="700"
              onClick={() => {
                setIsAvatarExpressionOpen((prev) => !prev);
                setHoveredExpression(null);
              }}
            >
              {isAvatarExpressionOpen ? "收合角色表情金手指 ▲" : "展開角色表情金手指 ▼"}
            </Flex>
            {isAvatarExpressionOpen ? (
              <>
                <Flex gap="6px" mb="2px">
                  {([
                    { id: "mai", label: "小麥" },
                    { id: "bai", label: "小白" },
                    { id: "beigo", label: "小貝狗" },
                  ] as const).map((tab) => (
                    <Flex
                      key={tab.id}
                      flex="1"
                      h="28px"
                      borderRadius="8px"
                      bgColor={expressionCheatTab === tab.id ? "#6F7E8B" : "rgba(255,255,255,0.34)"}
                      color={expressionCheatTab === tab.id ? "white" : "#5F5B49"}
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      fontSize="12px"
                      fontWeight="700"
                      onClick={() => {
                        setExpressionCheatTab(tab.id);
                        setHoveredExpression(null);
                      }}
                    >
                      {tab.label}
                    </Flex>
                  ))}
                </Flex>
                <Flex wrap="wrap" gap="6px">
                  {expressionOptions.map((expression) => (
                    <Flex
                      key={expression.id}
                      minW="64px"
                      h="30px"
                      px="8px"
                      borderRadius="6px"
                      bgColor="#6F7E8B"
                      color="white"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      fontSize="12px"
                      onMouseEnter={(event) =>
                        setHoveredExpression({
                          frameIndex: expression.frameIndex,
                          x: event.clientX,
                          y: event.clientY,
                        })
                      }
                      onMouseMove={(event) =>
                        setHoveredExpression({
                          frameIndex: expression.frameIndex,
                          x: event.clientX,
                          y: event.clientY,
                        })
                      }
                      onMouseLeave={() => setHoveredExpression(null)}
                      onClick={() =>
                        triggerAvatarExpression(expression.frameIndex, expressionCheatTab)
                      }
                    >
                      {expression.title}
                    </Flex>
                  ))}
                </Flex>
              </>
            ) : null}
            {previewFrame !== null && hoveredExpression ? (
              <Flex
                position="fixed"
                left={`${tooltipLeft}px`}
                top={`${tooltipTop}px`}
                zIndex={2000}
                px="8px"
                py="8px"
                borderRadius="8px"
                bgColor="rgba(58,56,49,0.96)"
                border="1px solid rgba(255,255,255,0.18)"
                boxShadow="0 8px 18px rgba(0,0,0,0.25)"
                pointerEvents="none"
                alignItems="center"
                gap="8px"
              >
                <Flex
                  w={`${previewWidth}px`}
                  h={`${previewHeight}px`}
                  borderRadius="6px"
                  border="1px solid rgba(255,255,255,0.24)"
                  backgroundImage={
                    previewFramePath
                      ? `url('${previewFramePath}')`
                      : `url('${expressionSpriteMeta.imagePath}')`
                  }
                  bgRepeat="no-repeat"
                  backgroundSize={
                    previewFramePath ? "contain" : `${previewSheetWidth}px ${previewSheetHeight}px`
                  }
                  backgroundPosition={
                    previewFramePath
                      ? "center"
                      : `-${previewCol * SPRITE_FRAME_WIDTH * PREVIEW_SCALE}px -${previewRow * SPRITE_FRAME_HEIGHT * PREVIEW_SCALE}px`
                  }
                />
                <Text color="white" fontSize="11px" whiteSpace="nowrap">
                  {expressionCheatTab === "mai"
                    ? "小麥"
                    : expressionCheatTab === "bai"
                      ? "小白"
                      : "小貝狗"}{" "}
                  · {previewExpressionTitle}
                </Text>
              </Flex>
            ) : null}
              </>
            ) : isVisionTrialProfile ? (
              <Flex direction="column" w="100%" h="100%" gap="14px">
                {metroEventCheatGroup ? (
                  <Flex
                    direction="column"
                    gap="8px"
                    p="10px"
                    borderRadius="10px"
                    bgColor="rgba(255,255,255,0.36)"
                    border="1px solid rgba(255,255,255,0.44)"
                    flexShrink={0}
                  >
                    <Text color="#13261D" fontSize="13px" fontWeight="900">
                      捷運事件選單
                    </Text>
                    <EventCheatSelect
                      group={metroEventCheatGroup}
                      value={eventCheatValues.metro}
                      onSelect={handleEventCheatSelect}
                    />
                  </Flex>
                ) : null}
                <Box flex="1" minH="0" w="100%">
                  <VisionQrPanel
                    title="早期玩家募集"
                    imageSrc={VISION_RECRUIT_QR_SRC}
                    alt="早起玩家招募 QR code"
                    header={<VisionLogoMark />}
                  />
                </Box>
              </Flex>
            ) : (
              <>
                <Flex
                  w="100%"
                  minH="72px"
                  borderRadius="12px"
                  bgColor="#6C8E5E"
                  border="1px solid rgba(255,255,255,0.42)"
                  boxShadow="0 8px 18px rgba(66,60,44,0.12)"
                  px="14px"
                  py="12px"
                  direction="column"
                  justifyContent="center"
                >
                  <Text color="rgba(255,255,255,0.76)" fontSize="11px" fontWeight="800" lineHeight="1">
                    {trialModeLabel}
                  </Text>
                  <Text color="white" fontSize="20px" fontWeight="900" lineHeight="1.35">
                    走走小日
                  </Text>
                </Flex>
              </>
            )}
          </Flex>
        </Flex>
      </Flex>

    </Flex>
  );
}
