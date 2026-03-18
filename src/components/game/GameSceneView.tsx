"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Grid, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import {
  AFTER_REWARD_SCENE_ID,
  getChapterScenesUntilScene,
  type GameScene,
} from "@/lib/game/scenes";
import { StoryDialogPanel } from "@/components/game/StoryDialogPanel";
import { DiaryOverlay } from "@/components/game/DiaryOverlay";
import { DialogQuickActions } from "@/components/game/events/DialogQuickActions";
import { EventHistoryOverlay } from "@/components/game/events/EventHistoryOverlay";
import { EventBackgroundFxLayer } from "@/components/game/events/EventBackgroundFxLayer";
import { useBackgroundShake } from "@/components/game/events/useBackgroundShake";
import { WorkTransitionModal } from "@/components/game/events/WorkTransitionModal";
import {
  EventDialogPanel,
  EVENT_DIALOG_HEIGHT,
} from "@/components/game/events/EventDialogPanel";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import { INITIAL_PLAYER_STATUS, type PlayerStatus } from "@/lib/game/playerStatus";
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
  claimOffworkReward,
  FIRST_OFFWORK_REWARD_PATTERN,
  generateOffworkRewardPattern,
  loadPlayerProgress,
  savePlayerProgress,
  unlockDiaryEntry,
  type PlaceTileId,
  type TilePattern3x3,
} from "@/lib/game/playerProgress";

type OffworkRewardOption = {
  id: PlaceTileId;
  title: string;
  icon: string;
  subtitle: string;
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

const REWARD_POOL_OPTIONS: OffworkRewardOption[] = [
  { id: "park", title: "公園", icon: "🌳", subtitle: "喘口氣" },
  STREET_OPTION,
  METRO_OPTION,
  { id: "breakfast-shop", title: "早餐店", icon: "🥪", subtitle: "補充元氣" },
];
const SCENE5_COMIC_IMAGE = "/images/comic/comic_%20puppet.png";
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

type PendingSceneTransitionPayload = {
  toSceneId: string;
  preset: "fade-black" | "next-day";
  durationMs: number;
  createdAt: number;
};

function pickTwoRandomFromPool(pool: OffworkRewardOption[]): OffworkRewardOption[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 2);
}

function pickOffworkRewardOptions(
  offworkRewardClaimCount: number,
  hasPassedThroughStreet: boolean,
): OffworkRewardOption[] {
  const attempt = offworkRewardClaimCount + 1;
  if (attempt === 1) return [METRO_OPTION, STREET_OPTION];
  if (attempt === 2) return [METRO_OPTION, STREET_OPTION];
  if (attempt >= 3 && !hasPassedThroughStreet) return [METRO_OPTION, STREET_OPTION];
  if (attempt >= 3) return pickTwoRandomFromPool(REWARD_POOL_OPTIONS);
  return [METRO_OPTION, STREET_OPTION];
}
type CustomRouteStep = "size" | "entry" | "exit" | "result";
type CustomRouteSize = "1x1" | "2x1";

const ENTRY_PATTERN_OPTIONS_6: number[][] = [
  [1, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0],
  [0, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 1],
  [1, 1, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0],
  [0, 0, 0, 0, 1, 1],
];

const ENTRY_PATTERN_OPTIONS_3: number[][] = [
  [1, 1, 1],
  [1, 1, 0],
  [0, 1, 1],
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

function normalizeEdgePatternToWidth(pattern: number[], width: 3 | 6): number[] {
  const normalized = pattern.map((cell) => (cell ? 1 : 0));
  if (normalized.length === width) return normalized;
  if (normalized.length === 6 && width === 3) {
    return [
      normalized[0] || normalized[1] ? 1 : 0,
      normalized[2] || normalized[3] ? 1 : 0,
      normalized[4] || normalized[5] ? 1 : 0,
    ];
  }
  if (normalized.length === 3 && width === 6) {
    return [normalized[0], normalized[0], normalized[1], normalized[1], normalized[2], normalized[2]];
  }
  return [
    normalized[0] ? 1 : 0,
    normalized[1] ? 1 : 0,
    normalized[2] ? 1 : 0,
  ];
}

function buildCustomRoutePattern(
  size: CustomRouteSize,
  entryPattern6: number[],
  exitPattern6: number[],
): number[][] {
  const width = size === "2x1" ? 6 : 3;
  const pattern = Array.from({ length: 3 }, () => Array.from({ length: width }, () => 0));
  const normalizedEntry = normalizeEdgePatternToWidth(entryPattern6, width as 3 | 6);
  const normalizedExit = normalizeEdgePatternToWidth(exitPattern6, width as 3 | 6);
  normalizedEntry.forEach((cell, index) => {
    pattern[0][index] = cell ? 1 : 0;
  });
  normalizedExit.forEach((cell, index) => {
    pattern[2][index] = cell ? 1 : 0;
  });

  const entryIndexes = normalizedEntry
    .map((cell, index) => (cell ? index : -1))
    .filter((index) => index >= 0);
  const exitIndexes = normalizedExit
    .map((cell, index) => (cell ? index : -1))
    .filter((index) => index >= 0);

  let entryAnchor = Math.floor((width - 1) / 2);
  let exitAnchor = Math.floor((width - 1) / 2);
  if (entryIndexes.length > 0) entryAnchor = entryIndexes[0];
  if (exitIndexes.length > 0) exitAnchor = exitIndexes[0];
  if (entryIndexes.length > 0 && exitIndexes.length > 0) {
    let bestPair: [number, number] = [entryIndexes[0], exitIndexes[0]];
    let bestDistance = Math.abs(bestPair[0] - bestPair[1]);
    entryIndexes.forEach((entryIndex) => {
      exitIndexes.forEach((exitIndex) => {
        const distance = Math.abs(entryIndex - exitIndex);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestPair = [entryIndex, exitIndex];
        }
      });
    });
    [entryAnchor, exitAnchor] = bestPair;
  }

  const start = Math.min(entryAnchor, exitAnchor);
  const end = Math.max(entryAnchor, exitAnchor);
  for (let col = start; col <= end; col += 1) {
    pattern[1][col] = 1;
  }

  // Ensure every chosen inlet/outlet column is connected into the center row,
  // while keeping top/bottom rows exactly as selected by the player.
  entryIndexes.forEach((index) => {
    pattern[1][index] = 1;
  });
  exitIndexes.forEach((index) => {
    pattern[1][index] = 1;
  });

  return pattern;
}

function toPattern3x3(pattern: number[][]): TilePattern3x3 {
  return [
    [pattern[0][0] ? 1 : 0, pattern[0][1] ? 1 : 0, pattern[0][2] ? 1 : 0],
    [pattern[1][0] ? 1 : 0, pattern[1][1] ? 1 : 0, pattern[1][2] ? 1 : 0],
    [pattern[2][0] ? 1 : 0, pattern[2][1] ? 1 : 0, pattern[2][2] ? 1 : 0],
  ];
}
export function GameSceneView({
  scene,
  onOffworkRewardOpenChange,
}: {
  scene: GameScene;
  onOffworkRewardOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const {
    animation: backgroundShakeAnimation,
    effectNonce,
    activeEffectId,
  } = useBackgroundShake();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
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
  const isOffworkScene = scene.id === "scene-offwork";
  const isWorkTransitionScene = scene.id === "scene-21-work";
  const [isOffworkLabelVisible, setIsOffworkLabelVisible] = useState(isOffworkScene);
  const [isOffworkRewardOpen, setIsOffworkRewardOpen] = useState(false);
  const [selectedRewardId, setSelectedRewardId] = useState<PlaceTileId | null>(null);
  const [selectedRewardActionCost, setSelectedRewardActionCost] = useState<0 | 1>(0);
  const [isFirstStreetPlaceReward, setIsFirstStreetPlaceReward] = useState(false);
  const [offworkRewardChoices, setOffworkRewardChoices] = useState<OffworkRewardOption[]>(
    [METRO_OPTION, STREET_OPTION],
  );
  const [offworkRewardClaimCount, setOffworkRewardClaimCount] = useState(0);
  const [offworkModalStatus, setOffworkModalStatus] = useState<PlayerStatus>(INITIAL_PLAYER_STATUS);
  const [customRouteCostError, setCustomRouteCostError] = useState("");
  const [placeRewardCostError, setPlaceRewardCostError] = useState("");
  const [offworkRewardPattern, setOffworkRewardPattern] = useState<TilePattern3x3>(
    FIRST_OFFWORK_REWARD_PATTERN,
  );
  const [customRouteStep, setCustomRouteStep] = useState<CustomRouteStep | null>(null);
  const [customRouteSize, setCustomRouteSize] = useState<CustomRouteSize>("1x1");
  const [customRouteEntryPattern, setCustomRouteEntryPattern] = useState<number[] | null>(null);
  const [customRouteExitPattern, setCustomRouteExitPattern] = useState<number[] | null>(null);
  const [isSceneComicVisible, setIsSceneComicVisible] = useState(false);
  const comicTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const diaryOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workTransitionDoneRef = useRef(false);
  const [scene23DoorPhase, setScene23DoorPhase] = useState<"closed-start" | "opened" | "closed-end">(
    "closed-end",
  );
  const [isScene23DialogVisible, setIsScene23DialogVisible] = useState(true);
  const [scene46DoorPhase, setScene46DoorPhase] = useState<"closed-start" | "opened" | "closed-end">(
    "closed-end",
  );
  const [isScene46DialogVisible, setIsScene46DialogVisible] = useState(true);
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
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [unlockedDiaryEntryIds, setUnlockedDiaryEntryIds] = useState<string[]>([]);
  const transitionTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    workTransitionDoneRef.current = false;
    setOutgoingTransition(null);
    transitionTimersRef.current.forEach((timer) => clearTimeout(timer));
    transitionTimersRef.current = [];
    setIncomingTransition(null);

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
    if (diaryOpenTimerRef.current) {
      clearTimeout(diaryOpenTimerRef.current);
      diaryOpenTimerRef.current = null;
    }
    if (scene.id !== "scene-46") {
      setIsDiaryOpen(false);
      return;
    }
    // 保障 story 線到達 scene-46 時一定可看到第一篇解鎖日記。
    unlockDiaryEntry("bai-entry-1");
    setUnlockedDiaryEntryIds(loadPlayerProgress().unlockedDiaryEntryIds);
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-44") return;
    setScene44Step("intro");
    setScene44Asked({ metro: false, dog: false });
    setScene44Topic(null);
    setScene44QATurn(0);
    setScene44FinalTurn(0);
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-23") {
      setScene23DoorPhase("closed-end");
      setIsScene23DialogVisible(true);
      return;
    }
    setScene23DoorPhase("closed-start");
    setIsScene23DialogVisible(false);
    const openDoorTimer = setTimeout(() => {
      setScene23DoorPhase("opened");
    }, 200);
    const closeDoorTimer = setTimeout(() => {
      setScene23DoorPhase("closed-end");
    }, 420);
    const showDialogTimer = setTimeout(() => {
      setIsScene23DialogVisible(true);
    }, 520);
    return () => {
      clearTimeout(openDoorTimer);
      clearTimeout(closeDoorTimer);
      clearTimeout(showDialogTimer);
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-46") {
      setScene46DoorPhase("closed-end");
      setIsScene46DialogVisible(true);
      return;
    }
    setScene46DoorPhase("closed-start");
    setIsScene46DialogVisible(false);
    const openDoorTimer = setTimeout(() => {
      setScene46DoorPhase("opened");
    }, 180);
    const closeDoorTimer = setTimeout(() => {
      setScene46DoorPhase("closed-end");
    }, 420);
    const showDialogTimer = setTimeout(() => {
      setIsScene46DialogVisible(true);
    }, 620);
    return () => {
      clearTimeout(openDoorTimer);
      clearTimeout(closeDoorTimer);
      clearTimeout(showDialogTimer);
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
    if (!scene.autoAdvanceMs || !scene.nextSceneId) return;
    const timer = setTimeout(() => {
      router.push(ROUTES.gameScene(scene.nextSceneId!));
    }, scene.autoAdvanceMs);
    return () => clearTimeout(timer);
  }, [router, scene.autoAdvanceMs, scene.nextSceneId]);

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
    setSelectedRewardActionCost(0);
    const progress = loadPlayerProgress();
    setOffworkRewardClaimCount(progress.offworkRewardClaimCount);
    setOffworkModalStatus(progress.status);
    setIsFirstStreetPlaceReward(
      !progress.rewardPlaceTiles.some(
        (tile) => tile.category === "place" && tile.sourceId === "street",
      ),
    );
    setOffworkRewardChoices(
      pickOffworkRewardOptions(progress.offworkRewardClaimCount, progress.hasPassedThroughStreet),
    );
    setCustomRouteCostError("");
    setPlaceRewardCostError("");
    setOffworkRewardPattern(
      generateOffworkRewardPattern(progress.offworkRewardClaimCount === 0),
    );
    setCustomRouteStep(null);
    setCustomRouteSize("1x1");
    setCustomRouteEntryPattern(null);
    setCustomRouteExitPattern(null);

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
    if (scene.id !== "scene-4") return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // 先給子元件監聽器掛載時間，再按順序觸發：表情 11 -> 左倒消失再爬起 -> 表情 6。
    timers.push(
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(GAME_AVATAR_EXPRESSION_TRIGGER, { detail: { frameIndex: 10 } }),
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
    // 爬起後切回表情 6（index 5）。
    timers.push(
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(GAME_AVATAR_EXPRESSION_TRIGGER, { detail: { frameIndex: 5 } }),
        );
      }, 1380),
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [scene.id]);

  useEffect(() => {
    setIsSceneComicVisible(false);
    if (comicTimerRef.current) {
      clearTimeout(comicTimerRef.current);
      comicTimerRef.current = null;
    }
  }, [scene.id]);

  useEffect(() => {
    return () => {
      if (diaryOpenTimerRef.current) {
        clearTimeout(diaryOpenTimerRef.current);
        diaryOpenTimerRef.current = null;
      }
    };
  }, []);

  const selectedReward = offworkRewardChoices.find((item) => item.id === selectedRewardId) ?? null;
  const selectedPlaceRewardPattern = useMemo<TilePattern3x3>(() => {
    if (selectedReward?.id === "street" && isFirstStreetPlaceReward) {
      return FIRST_OFFWORK_REWARD_PATTERN;
    }
    return offworkRewardPattern;
  }, [isFirstStreetPlaceReward, offworkRewardPattern, selectedReward?.id]);
  const edgePatternOptions = customRouteSize === "2x1" ? ENTRY_PATTERN_OPTIONS_6 : ENTRY_PATTERN_OPTIONS_3;
  const edgePatternWidth = customRouteSize === "2x1" ? 6 : 3;
  const edgePatternColumns = customRouteSize === "2x1" ? 4 : 3;
  const customRouteCost = 2;
  const customRouteCostLabel = "本次花費：2";
  const customRoutePattern = useMemo<number[][]>(() => {
    if (customRouteEntryPattern === null || customRouteExitPattern === null) {
      return FIRST_OFFWORK_REWARD_PATTERN;
    }
    return buildCustomRoutePattern(customRouteSize, customRouteEntryPattern, customRouteExitPattern);
  }, [customRouteEntryPattern, customRouteExitPattern, customRouteSize]);

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

  const handleStoryRequestNext = (nextSceneId: string) => {
    if (scene.id === "scene-41") {
      router.push(`${ROUTES.gameArrangeRoute}?tutorial=story41`);
      return;
    }
    if (scene.id === "scene-46") {
      router.push(ROUTES.gameArrangeRoute);
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

  const displayedBackgroundImage =
    scene.id === "scene-23"
      ? scene23DoorPhase === "opened"
        ? "/images/outside/Home_EnterWay_Open.png"
        : "/images/outside/Home_EnterWay.png"
      : scene.backgroundImage;
  const isScene44Interactive = scene.id === "scene-44";
  const isScene44InnerThought = scene.id === "scene-44" && (scene44Step === "intro" || scene44Step === "choose");
  const isInnerThoughtScene = scene.id === "scene-38" || isScene44InnerThought;
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
  const shouldHideDialogByDoorTransition =
    (scene.id === "scene-23" && !isScene23DialogVisible) ||
    (scene.id === "scene-46" && !isScene46DialogVisible);
  const shouldShowSceneDialogPanel = !shouldHideDialogByDoorTransition;
  const shouldShowSceneQuickActions = !shouldHideDialogByDoorTransition;

  return (
    <Flex w={{ base: "100vw", sm: "393px" }} maxW="393px" h={{ base: "100dvh", sm: "852px" }} maxH="852px" position="relative">
      <Flex
        w="100%"
        h="100%"
        bgColor={scene.backgroundColor ?? "#D6D4B9"}
        position="relative"
        borderRadius={{ base: "0", sm: "20px" }}
        overflow="hidden"
        boxShadow={{ base: "none", sm: "0 10px 30px rgba(0, 0, 0, 0.12)" }}
        direction="column"
        backgroundImage={displayedBackgroundImage ? `url('${displayedBackgroundImage}')` : undefined}
        backgroundSize="cover"
        backgroundPosition="center bottom"
        backgroundRepeat="no-repeat"
        animation={backgroundShakeAnimation}
      >
        <EventBackgroundFxLayer effectId={activeEffectId} effectNonce={effectNonce} />
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
        {isImageOnlyScene ? (
          <>
            <Text position="absolute" top="18px" left="18px" color="#252525" fontSize="34px" fontWeight="700">
              back
            </Text>
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

        {isImageOnlyScene || !shouldShowSceneQuickActions ? null : (
          <DialogQuickActions
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenOptions={() => {}}
          />
        )}
        {scene.id === "scene-46" && shouldShowSceneQuickActions ? (
          <Flex position="absolute" top="18px" right="96px" zIndex={9}>
            <Flex
              as="button"
              h="46px"
              px="14px"
              borderRadius="12px"
              bgColor="rgba(124, 90, 60, 0.82)"
              border="1px solid rgba(255,255,255,0.26)"
              color="white"
              fontSize="14px"
              fontWeight="700"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              onClick={() => setIsDiaryOpen(true)}
            >
              日記
            </Flex>
          </Flex>
        ) : null}

        {scene.id === "scene-5" ? (
          <Flex
            position="absolute"
            top="118px"
            left="50%"
            transform={isSceneComicVisible ? "translate(-50%, 0)" : "translate(-50%, 8px)"}
            zIndex={7}
            w="80%"
            maxW="290px"
            pointerEvents="none"
            opacity={isSceneComicVisible ? 1 : 0}
            transition="opacity 320ms ease, transform 320ms ease"
          >
            <img
              src={SCENE5_COMIC_IMAGE}
              alt="comic"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        {scene.id === "scene-46" && !isScene46DialogVisible ? (
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
                  scene46DoorPhase === "opened"
                    ? "/images/outside/Home_EnterWay_Open.png"
                    : "/images/outside/Home_EnterWay.png"
                }
                alt="door-transition"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Flex>
          </Flex>
        ) : null}

        {isImageOnlyScene || !shouldShowSceneDialogPanel ? null : isScene44Interactive ? (
          <Flex mt="auto" w="100%" position="relative">
            <Flex
              position="absolute"
              left="14px"
              bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
              zIndex={6}
              pointerEvents="none"
            >
              <EventAvatarSprite
                spriteId={scene44Speaker === "小貝狗" ? "beigo" : "mai"}
                frameIndex={scene44Speaker === "小貝狗" ? 2 : 8}
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
            onTypingComplete={
              scene.id === "scene-5" || scene.id === "scene-46"
                ? () => {
                    if (scene.id === "scene-5") {
                      if (comicTimerRef.current) clearTimeout(comicTimerRef.current);
                      comicTimerRef.current = setTimeout(() => {
                        setIsSceneComicVisible(true);
                      }, 260);
                    }
                    if (scene.id === "scene-46") {
                      if (diaryOpenTimerRef.current) clearTimeout(diaryOpenTimerRef.current);
                      diaryOpenTimerRef.current = setTimeout(() => {
                        setIsDiaryOpen(true);
                        diaryOpenTimerRef.current = null;
                      }, 180);
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
        unlockedEntryIds={unlockedDiaryEntryIds}
        onClose={() => {
          setIsDiaryOpen(false);
        }}
      />

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

      {isWorkTransitionScene ? (
        <WorkTransitionModal
          baseFatigue={0}
          fatigueIncreaseTotal={10}
          onFinish={() => {
            if (workTransitionDoneRef.current) return;
            workTransitionDoneRef.current = true;
            const progress = loadPlayerProgress();
            savePlayerProgress({
              ...progress,
              status: {
                ...progress.status,
                fatigue: 10,
              },
            });
            if (scene.nextSceneId) {
              router.push(ROUTES.gameScene(scene.nextSceneId));
            }
          }}
        />
      ) : null}

      {isOffworkScene && isOffworkRewardOpen ? (
        <Flex position="absolute" inset="0" zIndex={50} bgColor="rgba(0,0,0,0.38)" alignItems="center" justifyContent="center" p="22px">
          <Flex
            w="100%"
            maxW="340px"
            minH="350px"
            bgColor="#A27F5D"
            borderRadius="12px"
            border="3px solid #D9C4A7"
            boxShadow="0 12px 26px rgba(0,0,0,0.25)"
            direction="column"
            alignItems="center"
            p="20px 16px 18px"
            gap="14px"
          >
            <Text color="white" fontSize="22px" lineHeight="1">
              下班獎勵
            </Text>
            <Text color="white" fontSize="32px" lineHeight="1">
              挑選一個
            </Text>
            <Flex
              w="100%"
              borderRadius="10px"
              bgColor="rgba(255,255,255,0.2)"
              px="10px"
              py="8px"
              justifyContent="space-between"
              gap="8px"
            >
              <Text color="#F9F0E2" fontSize="13px">
                儲蓄：{offworkModalStatus.savings}
              </Text>
              <Text color="#F9F0E2" fontSize="13px">
                行動力：{offworkModalStatus.actionPower}
              </Text>
              <Text color="#F9F0E2" fontSize="13px">
                疲勞值：{offworkModalStatus.fatigue}
              </Text>
            </Flex>
            {offworkRewardClaimCount >= 1 ? (
              <Text color="#F8EACD" fontSize="12px" fontWeight="700">
                自組路徑：{customRouteCostLabel}
              </Text>
            ) : null}

            {customRouteStep ? (
              <>
                <Text color="white" fontSize="24px" lineHeight="1">
                  一組路徑拼圖
                </Text>
                {customRouteStep === "size" ? (
                  <Flex w="100%" justifyContent="center" gap="12px">
                    {(["1x1", "2x1"] as const).map((sizeOption) => (
                      <Flex
                        key={sizeOption}
                        w="132px"
                        h="132px"
                        borderRadius="12px"
                        bgColor="#ECECEC"
                        border={customRouteSize === sizeOption ? "2px solid #4FAE87" : "2px solid transparent"}
                        direction="column"
                        alignItems="center"
                        justifyContent="center"
                        gap="14px"
                        cursor="pointer"
                        onClick={() => {
                          setCustomRouteSize(sizeOption);
                          setCustomRouteEntryPattern(null);
                          setCustomRouteExitPattern(null);
                          setCustomRouteCostError("");
                          setCustomRouteStep("entry");
                        }}
                      >
                        <Flex
                          w={sizeOption === "1x1" ? "58px" : "96px"}
                          h="58px"
                          borderRadius="8px"
                          border="3px solid #B38C5C"
                          bgColor="#DCD3C1"
                        />
                        <Text color="#6B5240" fontSize="34px" fontWeight="700" lineHeight="1">
                          {sizeOption}
                        </Text>
                      </Flex>
                    ))}
                  </Flex>
                ) : null}
                {customRouteStep === "entry" ? (
                  <Flex w="100%" direction="column" alignItems="center" gap="10px">
                    <Text color="#F8EACD" fontSize="18px" fontWeight="700">
                      選擇入口（上排）
                    </Text>
                    <Grid templateColumns={`repeat(${edgePatternColumns}, minmax(0, 1fr))`} gap="8px" w="100%">
                      {edgePatternOptions.map((entryPattern, optionIndex) => (
                        <Flex
                          key={`entry-pattern-${optionIndex}`}
                          h="54px"
                          borderRadius="10px"
                          bgColor="#ECECEC"
                          border="2px solid rgba(163,135,101,0.35)"
                          alignItems="center"
                          justifyContent="center"
                          cursor="pointer"
                          onClick={() => {
                            setCustomRouteEntryPattern(entryPattern);
                            setCustomRouteStep("exit");
                          }}
                        >
                          <Grid
                            templateColumns={`repeat(${edgePatternWidth}, 6px)`}
                            templateRows="repeat(3, 6px)"
                            gap="2px"
                          >
                            {Array.from({ length: edgePatternWidth * 3 }).map((_, index) => {
                              const isTopRow = index < edgePatternWidth;
                              const cellIndex = index % edgePatternWidth;
                              const isFilled = isTopRow ? entryPattern[cellIndex] === 1 : false;
                              return (
                              <Flex
                                key={`entry-cell-${optionIndex}-${index}`}
                                w="6px"
                                h="6px"
                                borderRadius="2px"
                                bgColor={isFilled ? "#A38765" : "#DADADA"}
                              />
                            );
                            })}
                          </Grid>
                        </Flex>
                      ))}
                    </Grid>
                  </Flex>
                ) : null}
                {customRouteStep === "exit" ? (
                  <Flex w="100%" direction="column" alignItems="center" gap="10px">
                    <Text color="#F8EACD" fontSize="18px" fontWeight="700">
                      選擇出口（下排）
                    </Text>
                    <Grid templateColumns={`repeat(${edgePatternColumns}, minmax(0, 1fr))`} gap="8px" w="100%">
                      {edgePatternOptions.map((exitPattern, optionIndex) => (
                        <Flex
                          key={`exit-pattern-${optionIndex}`}
                          h="54px"
                          borderRadius="10px"
                          bgColor="#ECECEC"
                          border="2px solid rgba(163,135,101,0.35)"
                          alignItems="center"
                          justifyContent="center"
                          cursor="pointer"
                          onClick={() => {
                            setCustomRouteExitPattern(exitPattern);
                            setCustomRouteStep("result");
                          }}
                        >
                          <Grid
                            templateColumns={`repeat(${edgePatternWidth}, 6px)`}
                            templateRows="repeat(3, 6px)"
                            gap="2px"
                          >
                            {Array.from({ length: edgePatternWidth * 3 }).map((_, index) => {
                              const isBottomRow = index >= edgePatternWidth * 2;
                              const cellIndex = index % edgePatternWidth;
                              const isFilled = isBottomRow ? exitPattern[cellIndex] === 1 : false;
                              return (
                              <Flex
                                key={`exit-cell-${optionIndex}-${index}`}
                                w="6px"
                                h="6px"
                                borderRadius="2px"
                                bgColor={isFilled ? "#A38765" : "#DADADA"}
                              />
                            );
                            })}
                          </Grid>
                        </Flex>
                      ))}
                    </Grid>
                  </Flex>
                ) : null}
                {customRouteStep === "result" ? (
                  <>
                    <Text color="#F8EACD" fontSize="20px" fontWeight="700">
                      獲得路徑拼圖
                    </Text>
                    <Flex
                      w="130px"
                      h="130px"
                      borderRadius="8px"
                      bgColor="#E8E8E8"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Grid
                        templateColumns={`repeat(${customRouteSize === "2x1" ? 6 : 3}, 16px)`}
                        templateRows="repeat(3, 16px)"
                        gap="2px"
                      >
                        {customRoutePattern.flat().map((cell, index) => (
                          <Flex
                            key={index}
                            w="16px"
                            h="16px"
                            borderRadius="3px"
                            bgColor={cell ? "#A38765" : "#DADADA"}
                          />
                        ))}
                      </Grid>
                    </Flex>
                    <Flex
                      mt="2px"
                      px="18px"
                      py="8px"
                      borderRadius="999px"
                      bgColor="#6F533A"
                      cursor="pointer"
                      onClick={() => {
                        const latestProgress = loadPlayerProgress();
                        if (latestProgress.status.savings < customRouteCost) {
                          setCustomRouteCostError("儲蓄不足，需要 2 才能購買自組路徑");
                          return;
                        }
                        const nextProgress = {
                          ...latestProgress,
                          status: {
                            ...latestProgress.status,
                            savings: latestProgress.status.savings - customRouteCost,
                          },
                        };
                        savePlayerProgress(nextProgress);
                        setOffworkModalStatus(nextProgress.status);
                        setCustomRouteCostError("");
                        if (customRouteSize === "2x1") {
                          claimOffworkRewardBatch([
                            {
                              tileId: "street",
                              rewardPattern: toPattern3x3(customRoutePattern.map((row) => row.slice(0, 3))),
                              options: { label: "自組路徑A", centerEmoji: "🧩", category: "route" },
                            },
                            {
                              tileId: "street",
                              rewardPattern: toPattern3x3(customRoutePattern.map((row) => row.slice(3, 6))),
                              options: { label: "自組路徑B", centerEmoji: "🧩", category: "route" },
                            },
                          ]);
                        } else {
                          claimOffworkReward("street", toPattern3x3(customRoutePattern), {
                            label: "自組路徑",
                            centerEmoji: "🧩",
                            category: "route",
                          });
                        }
                        setIsOffworkRewardOpen(false);
                        startSceneTransition(AFTER_REWARD_SCENE_ID, "fade-black", 420);
                      }}
                    >
                      <Text color="white" fontSize="18px" fontWeight="700">
                        收下
                      </Text>
                    </Flex>
                    <Text color={offworkRewardClaimCount === 0 ? "#F8EACD" : "#FFD8A8"} fontSize="13px" fontWeight="700">
                      {customRouteCostLabel}
                    </Text>
                    {customRouteCostError ? (
                      <Text color="#FFE1E1" fontSize="12px" fontWeight="700">
                        {customRouteCostError}
                      </Text>
                    ) : null}
                  </>
                ) : null}
                {customRouteStep !== "size" ? (
                  <Flex
                    px="14px"
                    py="6px"
                    borderRadius="999px"
                    bgColor="rgba(111,83,58,0.6)"
                    cursor="pointer"
                    onClick={() => {
                      if (customRouteStep === "entry") setCustomRouteStep("size");
                      if (customRouteStep === "exit") setCustomRouteStep("entry");
                      if (customRouteStep === "result") setCustomRouteStep("exit");
                    }}
                  >
                    <Text color="white" fontSize="14px">
                      返回上一步
                    </Text>
                  </Flex>
                ) : null}
              </>
            ) : selectedReward ? (
              <>
                <Flex
                  w="130px"
                  h="130px"
                  borderRadius="8px"
                  bgColor="#E8E8E8"
                  alignItems="center"
                  justifyContent="center"
                  direction="column"
                  gap="8px"
                >
                  <Text color="#7A6048" fontSize="22px" fontWeight="700" lineHeight="1">
                    {selectedReward.title}
                  </Text>
                  <Grid templateColumns="repeat(3, 18px)" templateRows="repeat(3, 18px)" gap="2px">
                    {selectedPlaceRewardPattern.flat().map((cell, index) => (
                      <Flex
                        key={index}
                        w="18px"
                        h="18px"
                        borderRadius="3px"
                        bgColor={cell ? "#A38765" : "#DADADA"}
                      />
                    ))}
                  </Grid>
                </Flex>
                <Text color="#F8EACD" fontSize="20px" fontWeight="700">
                  已獲得地點拼圖
                </Text>
                <Flex
                  mt="2px"
                  px="18px"
                  py="8px"
                  borderRadius="999px"
                  bgColor="#6F533A"
                  cursor="pointer"
                  onClick={() => {
                    if (!selectedReward) return;
                    const latestProgress = loadPlayerProgress();
                    if (selectedRewardActionCost > 0 && latestProgress.status.actionPower < selectedRewardActionCost) {
                      setPlaceRewardCostError("行動力不足，需要 1 才能選擇這個地點");
                      return;
                    }
                    if (selectedRewardActionCost > 0) {
                      const nextProgress = {
                        ...latestProgress,
                        status: {
                          ...latestProgress.status,
                          actionPower: latestProgress.status.actionPower - selectedRewardActionCost,
                        },
                      };
                      savePlayerProgress(nextProgress);
                      setOffworkModalStatus(nextProgress.status);
                    }
                    setPlaceRewardCostError("");
                    claimOffworkReward(selectedReward.id, selectedPlaceRewardPattern, {
                      category: "place",
                      label: selectedReward.title,
                      centerEmoji: selectedReward.icon,
                    });
                    setIsOffworkRewardOpen(false);
                    startSceneTransition(AFTER_REWARD_SCENE_ID, "fade-black", 420);
                  }}
                >
                  <Text color="white" fontSize="18px" fontWeight="700">
                    收下
                  </Text>
                </Flex>
                {placeRewardCostError ? (
                  <Text color="#FFE1E1" fontSize="12px" fontWeight="700">
                    {placeRewardCostError}
                  </Text>
                ) : null}
              </>
            ) : (
              <Flex w="100%" justifyContent="center" gap="12px">
                {offworkRewardChoices.map((item, optionIndex) => (
                  <Flex
                    key={item.id}
                    w="132px"
                    h="156px"
                    borderRadius="12px"
                    bgColor="#ECECEC"
                    direction="column"
                    alignItems="center"
                    justifyContent="space-between"
                    p="10px 8px 8px"
                    cursor="pointer"
                    position="relative"
                    onClick={() => {
                      setCustomRouteStep(null);
                      setSelectedRewardId(item.id);
                      setSelectedRewardActionCost(optionIndex === 0 ? 0 : 1);
                      setPlaceRewardCostError("");
                    }}
                  >
                    <Text color="#6B5240" fontSize="30px" lineHeight="1">
                      {item.icon}
                    </Text>
                    <Text color="#6B5240" fontSize="24px" fontWeight="700" lineHeight="1">
                      {item.title}
                    </Text>
                    <Text color="#8E6D52" fontSize="16px" lineHeight="1">
                      {item.subtitle}
                    </Text>
                    <Text
                      color={optionIndex === 0 ? "#5F9C64" : "#B06A2A"}
                      fontSize="11px"
                      fontWeight="700"
                      lineHeight="1"
                    >
                      {optionIndex === 0 ? "免費" : "行動力 -1"}
                    </Text>
                  </Flex>
                ))}
                {offworkRewardClaimCount >= 1 ? (
                  <Flex
                    w="132px"
                    h="156px"
                    borderRadius="12px"
                    bgColor="#ECECEC"
                    direction="column"
                    alignItems="center"
                    justifyContent="space-between"
                    p="10px 8px 8px"
                    cursor="pointer"
                    onClick={() => {
                      setSelectedRewardId(null);
                      setCustomRouteStep("size");
                    }}
                  >
                    <Text color="#6B5240" fontSize="30px" lineHeight="1">
                      🧩
                    </Text>
                    <Text color="#6B5240" fontSize="24px" fontWeight="700" lineHeight="1">
                      自組
                    </Text>
                    <Text color="#8E6D52" fontSize="14px" lineHeight="1">
                      自訂路徑
                    </Text>
                    <Text
                      color="#B06A2A"
                      fontSize="11px"
                      fontWeight="700"
                      lineHeight="1"
                    >
                      儲蓄 -2
                    </Text>
                  </Flex>
                ) : null}
              </Flex>
            )}
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}
