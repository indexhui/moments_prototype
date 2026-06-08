import { INITIAL_PLAYER_STATUS, type PlayerStatus } from "@/lib/game/playerStatus";

export type PlaceTileId =
  | "metro-station"
  | "street"
  | "convenience-store"
  | "breakfast-shop"
  | "park"
  | "bus-stop";
export type TilePattern3x3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

export const FIRST_OFFWORK_REWARD_PATTERN: TilePattern3x3 = [
  [1, 1, 1],
  [0, 1, 0],
  [0, 1, 0],
];

export const FIRST_OFFWORK_REWARD_PATTERNS: TilePattern3x3[] = [
  FIRST_OFFWORK_REWARD_PATTERN,
  [
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 1],
  ],
];

export const FIRST_STREET_REWARD_PATTERNS: TilePattern3x3[] = [
  [
    [1, 1, 1],
    [0, 1, 0],
    [0, 1, 0],
  ],
  [
    [1, 1, 1],
    [0, 1, 0],
    [0, 1, 0],
  ],
  [
    [1, 1, 1],
    [0, 1, 0],
    [0, 1, 0],
  ],
  [
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
  ],
  [
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
  ],
  [
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 1],
  ],
];

const BASE_ROUTE_PATTERNS: TilePattern3x3[] = [
  [
    [1, 1, 1],
    [0, 1, 0],
    [0, 1, 0],
  ],
  [
    [1, 1, 1],
    [1, 0, 0],
    [1, 0, 0],
  ],
  [
    [0, 1, 0],
    [1, 1, 0],
    [0, 0, 0],
  ],
  [
    [0, 0, 0],
    [0, 1, 1],
    [0, 1, 0],
  ],
  [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  [
    [1, 0, 0],
    [0, 1, 0],
    [0, 1, 0],
  ],
];

export type RewardPlaceTile = {
  instanceId: string;
  sourceId: PlaceTileId;
  category: "place" | "route";
  label: string;
  centerEmoji: string;
  pattern: TilePattern3x3;
};

export type InventoryItemId =
  | "cat-grass"
  | "cat-treat"
  | "puzzle-fragment"
  | "melody-fragment"
  | "yarn"
  | "coffee"
  | "milk-tea"
  | "energy-drink";
export type DiaryEntryId = "bai-entry-1" | "bai-entry-2" | "bai-entry-3" | "bai-entry-4";
export type StickerId = "naotaro-basic" | "naotaro-smile" | "naotaro-rare";
export type ArrangeRouteDebugPresetId =
  | "post-naotaro-first-arrange"
  | "post-convenience-unlock-arrange";
export type EncounterCharacterId = "mai" | "bai" | "beigo";
export type StickerRollWeights = {
  basic: number;
  smile: number;
  rare: number;
};
export type PhotoCaptureFrameRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export type PhotoCaptureSnapshot = {
  sourceImage: string;
  previewImage: string;
  dogCoveragePercent: number;
  cameraFrameRect: PhotoCaptureFrameRect;
  capturedRect: PhotoCaptureFrameRect;
  capturedAt: string;
};

export type PlayerProgress = {
  currentDay: number;
  status: PlayerStatus;
  arrangeRouteDepartureCount: number;
  ownedPlaceTileIds: PlaceTileId[];
  pendingPlaceUnlockIntroIds: PlaceTileId[];
  claimedPlaceUnlockIntroRewardIds: PlaceTileId[];
  consumedPlaceTileInstanceIds: string[];
  offworkRewardClaimCount: number;
  workShiftCount: number;
  workTaskProgressById: Record<string, number>;
  rewardPlaceTiles: RewardPlaceTile[];
  inventoryItems: InventoryItemId[];
  unlockedDiaryEntryIds: DiaryEntryId[];
  stickerCollection: StickerId[];
  lastPhotoScore: number | null;
  lastDogPhotoCapture: PhotoCaptureSnapshot | null;
  streetForgotLunchFrogPhotoCaptures: PhotoCaptureSnapshot[];
  hasSeenDiaryFirstReveal: boolean;
  hasSeenSunbeastFirstReveal: boolean;
  hasSeenFirstSunbeastNightHubGuide: boolean;
  hasSeenFirstSunbeastNightHubGuideV2: boolean;
  hasSeenFirstSunbeastNightHubGuideV3: boolean;
  hasPendingFirstSunbeastNightHubGuide: boolean;
  hasSeenSunbeastShadowGuide: boolean;
  /** 是否曾在「安排路線」中出發且路線經過街道（用於解鎖第 3 次拼圖池） */
  hasPassedThroughStreet: boolean;
  /** 是否曾在同一次安排行程中經過捷運與街道（用於解鎖商店） */
  hasPassedThroughMetroAndStreet: boolean;
  /** 曾經在安排路線中經過街道的次數（用於特殊事件觸發） */
  streetPassCount: number;
  /** 是否已獲得商店街事件提供的特殊地圖 */
  hasUnlockedSpecialMap: boolean;
  /** 是否持有尚未使用的特殊地圖拼圖，可在安排行程中切換到特殊地圖 */
  hasAvailableSpecialMapPuzzle: boolean;
  /** 連續幾天在安排行程中經過街道 */
  streetVisitStreak: number;
  /** 上一次在安排行程中經過街道的遊戲日 */
  lastStreetVisitDay: number | null;
  /** 是否已觸發過舊版「忘記便當／便利商店青蛙」事件（保留給舊存檔相容） */
  hasTriggeredStreetForgotLunchEvent: boolean;
  /** 是否已在上班中午觸發過「忘記便當／便利商店青蛙」路線 */
  hasTriggeredWorkLunchForgotBentoEvent: boolean;
  /** 「日記線索引導」青蛙事件已完成幾次拍照嘗試，第三次才真正收集 */
  streetForgotLunchFrogPhotoAttemptCount: number;
  /** 是否已解鎖第二篇殘缺日記的第二格 */
  hasUnlockedBaiEntry2SecondFragment: boolean;
  /** 是否已完成青蛙日記線索三段事件 */
  hasCompletedStreetForgotLunchFrogEvent: boolean;
  /** 首次進入下班獎勵階段的教學是否已看過 */
  hasSeenOffworkRewardTutorial: boolean;
  /** 是否已看過小白第一次登場介紹 */
  hasSeenBaiFirstEncounterIntro: boolean;
  /** 是否等待在夜間 Hub 引導玩家打開第二篇殘缺日記 */
  hasPendingFrogDiaryFragmentHubGuide: boolean;
  /** 是否等待在第二篇殘缺日記讀完後引導玩家睡覺 */
  hasPendingFrogDiarySleepGuide: boolean;
  /** 是否已看過第 2 次安排路線的一般地圖教學 */
  hasSeenArrangeRouteTileTutorial: boolean;
  /** 是否已看過「小日獸 tab」首次可用引導 */
  hasSeenNaotaroPetTabGuide: boolean;
  /** 是否已看過直太郎收集後的拼圖類型 tab 引導 */
  hasSeenNaotaroPuzzleTypeTabGuide: boolean;
  /** 是否已看過首次經過街道提示 */
  hasSeenStreetPassUnlockFeedback: boolean;
  /** 是否已看過拼圖池首次開啟提示 */
  hasSeenRewardPoolUnlockFeedback: boolean;
  /** 是否已看過特殊地圖切換提示 */
  hasSeenSpecialMapGuide: boolean;
  /** 是否已看過特殊地圖旋轉挑戰玩法提示 */
  hasSeenSpecialMapRotationGuide: boolean;
  /** 今日是否發生過負面事件（影響玩家數值變不好） */
  hasNegativeEventToday: boolean;
  /** 昨日是否發生過負面事件（影響玩家數值變不好） */
  hasNegativeEventYesterday: boolean;
  /** 今日上班是否達到加班判定 */
  hadOvertimeToday: boolean;
  /** 昨日是否達到加班判定 */
  hadOvertimeYesterday: boolean;
  /** 是否已觸發過「捷運：山羊線索（電梯面對面）」前置事件 */
  hasTriggeredMetroElevatorGoatPrelude: boolean;
  /** 是否已觸發過優先捷運日常事件「雙腳大開」 */
  hasTriggeredMetroSeatSpreadEvent: boolean;
  /** 是否已觸發過優先捷運日常事件「包包甩到肩膀」 */
  hasTriggeredMetroBackpackHitEvent: boolean;
  /** 是否已觸發過「街道：山羊線索（走路閃人）」前置事件 */
  hasTriggeredStreetDodgeGoatPrelude: boolean;
  /** 是否已觸發過「便利商店：山羊線索（一塊錢結帳）」前置事件 */
  hasTriggeredMartOneDollarGoatPrelude: boolean;
  /** 是否已觸發過「公司：小日獸（山羊）」主事件 */
  hasTriggeredOfficeSunbeastGoatEvent: boolean;
  /** 是否已獲得青蛙小日獸線索 */
  hasUnlockedSunbeastFrogHint: boolean;
  /** 是否已獲得公雞小日獸線索 */
  hasUnlockedSunbeastChickenHint: boolean;
  /** 是否已觸發過「雞前置：公車旋律」事件 */
  hasTriggeredBusMelodyChickenPrelude1: boolean;
  /** 是否已觸發過「雞前置：便利商店旋律」事件 */
  hasTriggeredMartMelodyChickenPrelude2: boolean;
  /** 是否已觸發過「雞前置：街道旋律」事件 */
  hasTriggeredStreetMelodyChickenPrelude3: boolean;
  /** 是否已觸發過「辦公室：小日獸雞」事件 */
  hasTriggeredOfficeSunbeastChickenEvent: boolean;
  /** 是否已看過 GameWork 試玩版完成感謝提示 */
  hasSeenGameWorksTrialCompletionThanks: boolean;
  /** 是否已觸發過「公車：小日獸貓」事件 */
  hasTriggeredBusSunbeastCatEvent: boolean;
  /** 玩家目前已遇過的角色（可手動切換） */
  encounteredCharacterIds: EncounterCharacterId[];
};

export function getArrangeRouteAttempt(
  progress: Pick<PlayerProgress, "arrangeRouteDepartureCount">,
  options?: { forceStoryTutorial?: boolean },
) {
  if (options?.forceStoryTutorial) return 1;
  return Math.max(1, Math.floor(progress.arrangeRouteDepartureCount) + 1);
}

export function getCurrentRunArrangeRouteAttempt(
  progress: Pick<PlayerProgress, "arrangeRouteDepartureCount">,
) {
  return Math.max(1, Math.floor(progress.arrangeRouteDepartureCount));
}

const PLAYER_PROGRESS_STORAGE_KEY = "moment:player-progress";
export const PLAYER_PROGRESS_CHANGE_EVENT = "moment:player-progress-change";
const ARRANGE_ROUTE_LOGIC_TUTORIAL_SEEN_KEY = "moment:arrange-route-logic-tutorial-seen-v2";
const ARRANGE_ROUTE_TILE_TUTORIAL_SEEN_KEY = "moment:arrange-route-tile-tutorial-seen";
const ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_SEEN_KEY = "moment:arrange-route-place-mission-tutorial-seen";
const SCENE_TRANSITION_STORAGE_KEY = "moment:scene-transition";
const VALID_PLACE_TILE_IDS: PlaceTileId[] = [
  "metro-station",
  "street",
  "convenience-store",
  "breakfast-shop",
  "park",
  "bus-stop",
];
const TASK_UNLOCK_PLACE_IDS: PlaceTileId[] = ["convenience-store", "breakfast-shop"];
const DEBUG_SECOND_TUTORIAL_ROUTE_REWARDS: Array<{
  pattern: TilePattern3x3;
  label: string;
  centerEmoji: string;
}> = [
  {
    pattern: [
      [1, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    label: "一般 1",
    centerEmoji: "🛣️",
  },
  {
    pattern: [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 1],
    ],
    label: "一般 2",
    centerEmoji: "🛣️",
  },
  {
    pattern: [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
    label: "一般 3",
    centerEmoji: "🛣️",
  },
];
const ARRANGE_ROUTE_CONVENIENCE_TUTORIAL_SEEN_KEY = "moment:arrange-route-convenience-tutorial-seen";

export const ARRANGE_ROUTE_DEBUG_PRESETS: Array<{
  id: ArrangeRouteDebugPresetId;
  label: string;
  description: string;
}> = [
  {
    id: "post-naotaro-first-arrange",
    label: "直太郎後第一次安排",
    description: "已完成直太郎揭露，下一次進安排行程會先進街道解鎖與任務流程。",
  },
  {
    id: "post-convenience-unlock-arrange",
    label: "便利商店解鎖後安排",
    description: "已完成同趟經過捷運與街道並拿到便利商店拼圖，直接測第四次 1x4 安排行程。",
  },
] as const;

export const PLACE_UNLOCK_INTRO_REWARD_PATTERNS: Partial<Record<PlaceTileId, TilePattern3x3>> = {
  "convenience-store": [
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
  ],
  "breakfast-shop": [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  park: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
  ],
  "bus-stop": [
    [0, 0, 0],
    [1, 1, 1],
    [0, 1, 0],
  ],
};

function defaultTileLabel(tileId: PlaceTileId) {
  if (tileId === "street") return "街道";
  if (tileId === "metro-station") return "捷運";
  if (tileId === "convenience-store") return "便利商店";
  if (tileId === "breakfast-shop") return "早餐店";
  if (tileId === "park") return "公園";
  return "公車站";
}

function defaultTileEmoji(tileId: PlaceTileId) {
  if (tileId === "street") return "💡";
  if (tileId === "metro-station") return "🚋";
  if (tileId === "convenience-store") return "🏪";
  if (tileId === "breakfast-shop") return "🥪";
  if (tileId === "park") return "🌳";
  return "🚌";
}

export const INITIAL_PLAYER_PROGRESS: PlayerProgress = {
  currentDay: 1,
  status: INITIAL_PLAYER_STATUS,
  arrangeRouteDepartureCount: 0,
  ownedPlaceTileIds: [],
  pendingPlaceUnlockIntroIds: [],
  claimedPlaceUnlockIntroRewardIds: [],
  consumedPlaceTileInstanceIds: [],
  offworkRewardClaimCount: 0,
  workShiftCount: 0,
  workTaskProgressById: {},
  rewardPlaceTiles: [],
  inventoryItems: [],
  unlockedDiaryEntryIds: [],
  stickerCollection: [],
  lastPhotoScore: null,
  lastDogPhotoCapture: null,
  streetForgotLunchFrogPhotoCaptures: [],
  hasSeenDiaryFirstReveal: false,
  hasSeenSunbeastFirstReveal: false,
  hasSeenFirstSunbeastNightHubGuide: false,
  hasSeenFirstSunbeastNightHubGuideV2: false,
  hasSeenFirstSunbeastNightHubGuideV3: false,
  hasPendingFirstSunbeastNightHubGuide: false,
  hasSeenSunbeastShadowGuide: false,
  hasPassedThroughStreet: false,
  hasPassedThroughMetroAndStreet: false,
  streetPassCount: 0,
  hasUnlockedSpecialMap: false,
  hasAvailableSpecialMapPuzzle: false,
  streetVisitStreak: 0,
  lastStreetVisitDay: null,
  hasTriggeredStreetForgotLunchEvent: false,
  hasTriggeredWorkLunchForgotBentoEvent: false,
  streetForgotLunchFrogPhotoAttemptCount: 0,
  hasUnlockedBaiEntry2SecondFragment: false,
  hasCompletedStreetForgotLunchFrogEvent: false,
  hasSeenOffworkRewardTutorial: false,
  hasSeenBaiFirstEncounterIntro: false,
  hasPendingFrogDiaryFragmentHubGuide: false,
  hasPendingFrogDiarySleepGuide: false,
  hasSeenArrangeRouteTileTutorial: false,
  hasSeenNaotaroPetTabGuide: false,
  hasSeenNaotaroPuzzleTypeTabGuide: false,
  hasSeenStreetPassUnlockFeedback: false,
  hasSeenRewardPoolUnlockFeedback: false,
  hasSeenSpecialMapGuide: false,
  hasSeenSpecialMapRotationGuide: false,
  hasNegativeEventToday: false,
  hasNegativeEventYesterday: false,
  hadOvertimeToday: false,
  hadOvertimeYesterday: false,
  hasTriggeredMetroElevatorGoatPrelude: false,
  hasTriggeredMetroSeatSpreadEvent: false,
  hasTriggeredMetroBackpackHitEvent: false,
  hasTriggeredStreetDodgeGoatPrelude: false,
  hasTriggeredMartOneDollarGoatPrelude: false,
  hasTriggeredOfficeSunbeastGoatEvent: false,
  hasUnlockedSunbeastFrogHint: false,
  hasUnlockedSunbeastChickenHint: false,
  hasTriggeredBusMelodyChickenPrelude1: false,
  hasTriggeredMartMelodyChickenPrelude2: false,
  hasTriggeredStreetMelodyChickenPrelude3: false,
  hasTriggeredOfficeSunbeastChickenEvent: false,
  hasSeenGameWorksTrialCompletionThanks: false,
  hasTriggeredBusSunbeastCatEvent: false,
  encounteredCharacterIds: ["mai"],
};

const VALID_INVENTORY_ITEM_IDS: InventoryItemId[] = [
  "cat-grass",
  "cat-treat",
  "puzzle-fragment",
  "melody-fragment",
  "yarn",
  "coffee",
  "milk-tea",
  "energy-drink",
];
const VALID_DIARY_ENTRY_IDS: DiaryEntryId[] = ["bai-entry-1", "bai-entry-2", "bai-entry-3", "bai-entry-4"];
const VALID_STICKER_IDS: StickerId[] = ["naotaro-basic", "naotaro-smile", "naotaro-rare"];
const VALID_ENCOUNTER_CHARACTER_IDS: EncounterCharacterId[] = ["mai", "bai", "beigo"];

function normalizeUnitNumber(value: unknown): number {
  if (!Number.isFinite(value)) return 0;
  const safe = Number(value);
  return Math.max(0, Math.min(1, safe));
}

function normalizePercent(value: unknown): number {
  if (!Number.isFinite(value)) return 0;
  const safe = Math.floor(Number(value));
  return Math.max(0, Math.min(100, safe));
}

function normalizePhotoCaptureSnapshot(raw: unknown): PhotoCaptureSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Partial<PhotoCaptureSnapshot> & {
    frameRect?: Partial<PhotoCaptureFrameRect>;
    cameraFrameRect?: Partial<PhotoCaptureFrameRect>;
    capturedRect?: Partial<PhotoCaptureFrameRect>;
  };
  if (typeof obj.previewImage !== "string" || obj.previewImage.length === 0) return null;
  if (typeof obj.sourceImage !== "string" || obj.sourceImage.length === 0) return null;
  const legacyFrameRect = obj.frameRect;
  const cameraFrameRectRaw = obj.cameraFrameRect ?? legacyFrameRect;
  const capturedRectRaw = obj.capturedRect ?? legacyFrameRect;
  return {
    sourceImage: obj.sourceImage,
    previewImage: obj.previewImage,
    dogCoveragePercent: normalizePercent(obj.dogCoveragePercent),
    cameraFrameRect: {
      x: normalizeUnitNumber(cameraFrameRectRaw?.x),
      y: normalizeUnitNumber(cameraFrameRectRaw?.y),
      width: normalizeUnitNumber(cameraFrameRectRaw?.width),
      height: normalizeUnitNumber(cameraFrameRectRaw?.height),
    },
    capturedRect: {
      x: normalizeUnitNumber(capturedRectRaw?.x),
      y: normalizeUnitNumber(capturedRectRaw?.y),
      width: normalizeUnitNumber(capturedRectRaw?.width),
      height: normalizeUnitNumber(capturedRectRaw?.height),
    },
    capturedAt:
      typeof obj.capturedAt === "string" && obj.capturedAt.length > 0
        ? obj.capturedAt
        : new Date().toISOString(),
  };
}

function normalizePhotoCaptureSnapshots(raw: unknown, limit = 3): PhotoCaptureSnapshot[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizePhotoCaptureSnapshot(item))
    .filter((item): item is PhotoCaptureSnapshot => item !== null)
    .slice(0, limit);
}

function toRowPattern(values: number[]): [number, number, number] {
  return [
    values[0] === 1 ? 1 : 0,
    values[1] === 1 ? 1 : 0,
    values[2] === 1 ? 1 : 0,
  ];
}

function toPattern3x3(raw: unknown): TilePattern3x3 {
  if (!Array.isArray(raw) || raw.length !== 3) return FIRST_OFFWORK_REWARD_PATTERN;
  const rows = raw.map((row) => (Array.isArray(row) && row.length === 3 ? row : [0, 0, 0]));
  return [
    toRowPattern(rows[0] as number[]),
    toRowPattern(rows[1] as number[]),
    toRowPattern(rows[2] as number[]),
  ];
}

function normalizeRewardPlaceTiles(raw: unknown): RewardPlaceTile[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Partial<RewardPlaceTile>;
      const sourceId =
        obj.sourceId && VALID_PLACE_TILE_IDS.includes(obj.sourceId as PlaceTileId)
          ? (obj.sourceId as PlaceTileId)
          : null;
      if (!sourceId) return null;
      const instanceId =
        typeof obj.instanceId === "string" && obj.instanceId.length > 0
          ? obj.instanceId
          : `${sourceId}-legacy-${index}`;
      const legacyOffworkRouteReward =
        instanceId.includes("-reward-") && obj.category === "route";
      const rawLabel = typeof obj.label === "string" && obj.label.length > 0 ? obj.label : null;
      return {
        instanceId,
        sourceId,
        label:
          legacyOffworkRouteReward && (!rawLabel || rawLabel === "一般" || rawLabel === "一般地圖")
            ? defaultTileLabel(sourceId)
            : rawLabel ?? defaultTileLabel(sourceId),
        category:
          legacyOffworkRouteReward
            ? "place"
            : obj.category === "place" || obj.category === "route"
              ? obj.category
              : sourceId === "metro-station"
                ? "place"
                : "route",
        centerEmoji:
          typeof obj.centerEmoji === "string" && obj.centerEmoji.length > 0
            ? obj.centerEmoji
            : defaultTileEmoji(sourceId),
        pattern: toPattern3x3(obj.pattern),
      } satisfies RewardPlaceTile;
    })
    .filter((item): item is RewardPlaceTile => item !== null);
}

function normalizeProgress(raw: PlayerProgress): PlayerProgress {
  const validOwnedIds = Array.from(
    new Set(raw.ownedPlaceTileIds.filter((id): id is PlaceTileId => VALID_PLACE_TILE_IDS.includes(id))),
  );
  const validPendingPlaceUnlockIntroIds = Array.isArray(
    (raw as Partial<PlayerProgress>).pendingPlaceUnlockIntroIds,
  )
    ? Array.from(
        new Set(
          (raw as Partial<PlayerProgress>).pendingPlaceUnlockIntroIds!.filter(
            (id): id is PlaceTileId => VALID_PLACE_TILE_IDS.includes(id as PlaceTileId),
          ),
        ),
      )
    : [];
  const validClaimedPlaceUnlockIntroRewardIds = Array.isArray(
    (raw as Partial<PlayerProgress>).claimedPlaceUnlockIntroRewardIds,
  )
    ? Array.from(
        new Set(
          (raw as Partial<PlayerProgress>).claimedPlaceUnlockIntroRewardIds!.filter(
            (id): id is PlaceTileId => VALID_PLACE_TILE_IDS.includes(id as PlaceTileId),
          ),
        ),
      )
    : [];
  const validInventoryItems = Array.isArray((raw as Partial<PlayerProgress>).inventoryItems)
    ? (raw as Partial<PlayerProgress>).inventoryItems!.filter(
      (id): id is InventoryItemId => VALID_INVENTORY_ITEM_IDS.includes(id as InventoryItemId),
    )
    : [];
  const validUnlockedDiaryEntries = Array.isArray((raw as Partial<PlayerProgress>).unlockedDiaryEntryIds)
    ? (raw as Partial<PlayerProgress>).unlockedDiaryEntryIds!.filter(
      (id): id is DiaryEntryId => VALID_DIARY_ENTRY_IDS.includes(id as DiaryEntryId),
    )
    : [];
  const validStickerCollection = Array.isArray((raw as Partial<PlayerProgress>).stickerCollection)
    ? (raw as Partial<PlayerProgress>).stickerCollection!.filter(
      (id): id is StickerId => VALID_STICKER_IDS.includes(id as StickerId),
    )
    : [];
  const validEncounterCharacterIds = Array.isArray((raw as Partial<PlayerProgress>).encounteredCharacterIds)
    ? Array.from(
        new Set(
          (raw as Partial<PlayerProgress>).encounteredCharacterIds!.filter(
            (id): id is EncounterCharacterId =>
              VALID_ENCOUNTER_CHARACTER_IDS.includes(id as EncounterCharacterId),
          ),
        ),
      )
    : [];

  const normalizedRewardTiles = normalizeRewardPlaceTiles(raw.rewardPlaceTiles);
  const hasLegacyStreet = raw.ownedPlaceTileIds.includes("street");
  const migratedRewardTiles =
    normalizedRewardTiles.length > 0 || !hasLegacyStreet
      ? normalizedRewardTiles
      : [
          {
            instanceId: `street-legacy-${Date.now()}`,
            sourceId: "street",
            category: "place",
            label: "街道",
            centerEmoji: "💡",
            pattern: toPattern3x3((raw as { streetPattern?: unknown }).streetPattern),
          } satisfies RewardPlaceTile,
        ];
  const hasTriggeredStreetForgotLunchEvent = Boolean(
    (raw as Partial<PlayerProgress>).hasTriggeredStreetForgotLunchEvent,
  );
  const hasCompletedStreetForgotLunchFrogEvent =
    Boolean((raw as Partial<PlayerProgress>).hasCompletedStreetForgotLunchFrogEvent) &&
    (
      Boolean((raw as Partial<PlayerProgress>).hasUnlockedSunbeastFrogHint) ||
      validUnlockedDiaryEntries.includes("bai-entry-2")
    );
  const rawStreetForgotLunchFrogPhotoAttemptCount =
    Number.isFinite((raw as Partial<PlayerProgress>).streetForgotLunchFrogPhotoAttemptCount) &&
    (raw as Partial<PlayerProgress>).streetForgotLunchFrogPhotoAttemptCount! >= 0
      ? Math.min(3, Math.floor((raw as Partial<PlayerProgress>).streetForgotLunchFrogPhotoAttemptCount!))
      : 0;
  const hasUnlockedBaiEntry2SecondFragment =
    Boolean((raw as Partial<PlayerProgress>).hasUnlockedBaiEntry2SecondFragment) ||
    hasCompletedStreetForgotLunchFrogEvent ||
    rawStreetForgotLunchFrogPhotoAttemptCount >= 2;
  const streetForgotLunchFrogPhotoAttemptCount = hasCompletedStreetForgotLunchFrogEvent
    ? 3
    : rawStreetForgotLunchFrogPhotoAttemptCount;

  const validWorkTaskProgressById =
    raw.workTaskProgressById && typeof raw.workTaskProgressById === "object"
      ? Object.fromEntries(
          Object.entries(raw.workTaskProgressById).flatMap(([taskId, value]) =>
            typeof taskId === "string" &&
            taskId.length > 0 &&
            Number.isFinite(value) &&
            Number(value) >= 0
              ? [[taskId, Math.floor(Number(value))]]
              : [],
          ),
        )
      : {};

  return {
    currentDay:
      Number.isFinite((raw as Partial<PlayerProgress>).currentDay) &&
      (raw as Partial<PlayerProgress>).currentDay! >= 1
        ? Math.floor((raw as Partial<PlayerProgress>).currentDay!)
        : 1,
    status: {
      savings: Number.isFinite(raw.status.savings) ? raw.status.savings : INITIAL_PLAYER_STATUS.savings,
      actionPower: Number.isFinite(raw.status.actionPower)
        ? raw.status.actionPower
        : INITIAL_PLAYER_STATUS.actionPower,
      fatigue: Number.isFinite(raw.status.fatigue) ? raw.status.fatigue : INITIAL_PLAYER_STATUS.fatigue,
    },
    arrangeRouteDepartureCount:
      Number.isFinite((raw as Partial<PlayerProgress>).arrangeRouteDepartureCount) &&
      (raw as Partial<PlayerProgress>).arrangeRouteDepartureCount! >= 0
        ? Math.floor((raw as Partial<PlayerProgress>).arrangeRouteDepartureCount!)
        : Math.max(
            Number.isFinite(raw.offworkRewardClaimCount) && raw.offworkRewardClaimCount >= 0
              ? Math.floor(raw.offworkRewardClaimCount)
              : 0,
            Number.isFinite((raw as Partial<PlayerProgress>).workShiftCount) &&
              (raw as Partial<PlayerProgress>).workShiftCount! >= 0
              ? Math.floor((raw as Partial<PlayerProgress>).workShiftCount!)
              : 0,
            Boolean((raw as Partial<PlayerProgress>).hasPassedThroughStreet) ? 2 : 0,
          ),
    ownedPlaceTileIds: validOwnedIds,
    pendingPlaceUnlockIntroIds: validPendingPlaceUnlockIntroIds,
    claimedPlaceUnlockIntroRewardIds: validClaimedPlaceUnlockIntroRewardIds,
    consumedPlaceTileInstanceIds: Array.isArray((raw as Partial<PlayerProgress>).consumedPlaceTileInstanceIds)
      ? Array.from(
          new Set(
            (raw as Partial<PlayerProgress>).consumedPlaceTileInstanceIds!.filter(
              (id): id is string => typeof id === "string" && id.length > 0,
            ),
          ),
        )
      : [],
    offworkRewardClaimCount:
      Number.isFinite(raw.offworkRewardClaimCount) && raw.offworkRewardClaimCount >= 0
        ? Math.floor(raw.offworkRewardClaimCount)
        : 0,
    workShiftCount:
      Number.isFinite((raw as Partial<PlayerProgress>).workShiftCount) &&
      (raw as Partial<PlayerProgress>).workShiftCount! >= 0
        ? Math.floor((raw as Partial<PlayerProgress>).workShiftCount!)
        : 0,
    workTaskProgressById: validWorkTaskProgressById,
    rewardPlaceTiles: migratedRewardTiles,
    inventoryItems: validInventoryItems,
    unlockedDiaryEntryIds: validUnlockedDiaryEntries,
    stickerCollection: validStickerCollection,
    lastPhotoScore:
      Number.isFinite((raw as Partial<PlayerProgress>).lastPhotoScore) &&
      (raw as Partial<PlayerProgress>).lastPhotoScore !== null
        ? Math.max(0, Math.min(100, Math.floor((raw as Partial<PlayerProgress>).lastPhotoScore as number)))
        : null,
    lastDogPhotoCapture: normalizePhotoCaptureSnapshot(
      (raw as Partial<PlayerProgress>).lastDogPhotoCapture,
    ),
    streetForgotLunchFrogPhotoCaptures: normalizePhotoCaptureSnapshots(
      (raw as Partial<PlayerProgress>).streetForgotLunchFrogPhotoCaptures,
      3,
    ),
    hasSeenDiaryFirstReveal: Boolean((raw as Partial<PlayerProgress>).hasSeenDiaryFirstReveal),
    hasSeenSunbeastFirstReveal: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenSunbeastFirstReveal,
    ),
    hasSeenFirstSunbeastNightHubGuide: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenFirstSunbeastNightHubGuide,
    ),
    hasSeenFirstSunbeastNightHubGuideV2: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenFirstSunbeastNightHubGuideV2,
    ),
    hasSeenFirstSunbeastNightHubGuideV3: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenFirstSunbeastNightHubGuideV3,
    ),
    hasPendingFirstSunbeastNightHubGuide: Boolean(
      (raw as Partial<PlayerProgress>).hasPendingFirstSunbeastNightHubGuide,
    ),
    hasSeenSunbeastShadowGuide: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenSunbeastShadowGuide,
    ),
    hasPassedThroughStreet: Boolean((raw as Partial<PlayerProgress>).hasPassedThroughStreet),
    hasPassedThroughMetroAndStreet:
      Boolean((raw as Partial<PlayerProgress>).hasPassedThroughMetroAndStreet) ||
      validOwnedIds.includes("convenience-store"),
    streetPassCount:
      Number.isFinite((raw as Partial<PlayerProgress>).streetPassCount) &&
      (raw as Partial<PlayerProgress>).streetPassCount! >= 0
        ? Math.floor((raw as Partial<PlayerProgress>).streetPassCount!)
        : 0,
    hasUnlockedSpecialMap: Boolean(
      (raw as Partial<PlayerProgress>).hasUnlockedSpecialMap,
    ),
    hasAvailableSpecialMapPuzzle:
      Boolean((raw as Partial<PlayerProgress>).hasAvailableSpecialMapPuzzle) ||
      (
        Boolean((raw as Partial<PlayerProgress>).hasUnlockedSpecialMap) &&
        !Boolean((raw as Partial<PlayerProgress>).hasTriggeredOfficeSunbeastChickenEvent)
      ),
    streetVisitStreak:
      Number.isFinite((raw as Partial<PlayerProgress>).streetVisitStreak) &&
      (raw as Partial<PlayerProgress>).streetVisitStreak! >= 0
        ? Math.floor((raw as Partial<PlayerProgress>).streetVisitStreak!)
        : 0,
    lastStreetVisitDay:
      Number.isFinite((raw as Partial<PlayerProgress>).lastStreetVisitDay) &&
      (raw as Partial<PlayerProgress>).lastStreetVisitDay! >= 1
        ? Math.floor((raw as Partial<PlayerProgress>).lastStreetVisitDay!)
        : null,
    hasTriggeredStreetForgotLunchEvent,
    hasTriggeredWorkLunchForgotBentoEvent: Boolean(
      (raw as Partial<PlayerProgress>).hasTriggeredWorkLunchForgotBentoEvent,
    ),
    streetForgotLunchFrogPhotoAttemptCount,
    hasUnlockedBaiEntry2SecondFragment,
    hasCompletedStreetForgotLunchFrogEvent,
    hasSeenOffworkRewardTutorial: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenOffworkRewardTutorial,
    ),
    hasSeenBaiFirstEncounterIntro: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenBaiFirstEncounterIntro,
    ),
    hasPendingFrogDiaryFragmentHubGuide:
      Boolean((raw as Partial<PlayerProgress>).hasPendingFrogDiaryFragmentHubGuide) &&
      validUnlockedDiaryEntries.includes("bai-entry-1") &&
      !validUnlockedDiaryEntries.includes("bai-entry-2") &&
      !hasCompletedStreetForgotLunchFrogEvent,
    hasPendingFrogDiarySleepGuide:
      Boolean((raw as Partial<PlayerProgress>).hasPendingFrogDiarySleepGuide) &&
      validUnlockedDiaryEntries.includes("bai-entry-1") &&
      !hasCompletedStreetForgotLunchFrogEvent,
    hasSeenArrangeRouteTileTutorial: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenArrangeRouteTileTutorial,
    ),
    hasSeenNaotaroPetTabGuide: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenNaotaroPetTabGuide,
    ),
    hasSeenNaotaroPuzzleTypeTabGuide: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenNaotaroPuzzleTypeTabGuide,
    ),
    hasSeenStreetPassUnlockFeedback: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenStreetPassUnlockFeedback,
    ),
    hasSeenRewardPoolUnlockFeedback: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenRewardPoolUnlockFeedback,
    ),
    hasSeenSpecialMapGuide: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenSpecialMapGuide,
    ),
    hasSeenSpecialMapRotationGuide: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenSpecialMapRotationGuide,
    ),
    hasNegativeEventToday: Boolean(
      (raw as Partial<PlayerProgress>).hasNegativeEventToday,
    ),
    hasNegativeEventYesterday: Boolean(
      (raw as Partial<PlayerProgress>).hasNegativeEventYesterday,
    ),
    hadOvertimeToday: Boolean(
      (raw as Partial<PlayerProgress>).hadOvertimeToday,
    ),
    hadOvertimeYesterday: Boolean(
      (raw as Partial<PlayerProgress>).hadOvertimeYesterday,
    ),
    hasTriggeredMetroElevatorGoatPrelude: Boolean(
      (raw as Partial<PlayerProgress>).hasTriggeredMetroElevatorGoatPrelude,
    ),
    hasTriggeredMetroSeatSpreadEvent: Boolean(
      (raw as Partial<PlayerProgress>).hasTriggeredMetroSeatSpreadEvent,
    ),
    hasTriggeredMetroBackpackHitEvent: Boolean(
      (raw as Partial<PlayerProgress>).hasTriggeredMetroBackpackHitEvent,
    ),
    hasTriggeredStreetDodgeGoatPrelude: Boolean(
      (raw as Partial<PlayerProgress>).hasTriggeredStreetDodgeGoatPrelude,
    ),
    hasTriggeredMartOneDollarGoatPrelude: Boolean(
      (raw as Partial<PlayerProgress>).hasTriggeredMartOneDollarGoatPrelude,
    ),
    hasTriggeredOfficeSunbeastGoatEvent: Boolean(
      (raw as Partial<PlayerProgress>).hasTriggeredOfficeSunbeastGoatEvent,
    ),
    hasUnlockedSunbeastFrogHint: Boolean(
      (raw as Partial<PlayerProgress>).hasUnlockedSunbeastFrogHint,
    ),
    hasUnlockedSunbeastChickenHint: Boolean(
      (raw as Partial<PlayerProgress>).hasUnlockedSunbeastChickenHint,
    ),
    hasTriggeredBusMelodyChickenPrelude1: Boolean(
      (raw as Partial<PlayerProgress>).hasTriggeredBusMelodyChickenPrelude1,
    ),
    hasTriggeredMartMelodyChickenPrelude2: Boolean(
      (raw as Partial<PlayerProgress>).hasTriggeredMartMelodyChickenPrelude2,
    ),
    hasTriggeredStreetMelodyChickenPrelude3: Boolean(
      (raw as Partial<PlayerProgress>).hasTriggeredStreetMelodyChickenPrelude3,
    ),
    hasTriggeredOfficeSunbeastChickenEvent: Boolean(
      (raw as Partial<PlayerProgress>).hasTriggeredOfficeSunbeastChickenEvent,
    ),
    hasSeenGameWorksTrialCompletionThanks: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenGameWorksTrialCompletionThanks,
    ),
    hasTriggeredBusSunbeastCatEvent: Boolean(
      (raw as Partial<PlayerProgress>).hasTriggeredBusSunbeastCatEvent,
    ),
    encounteredCharacterIds:
      validEncounterCharacterIds.length > 0 ? validEncounterCharacterIds : ["mai"],
  };
}

export function loadPlayerProgress(): PlayerProgress {
  if (typeof window === "undefined") return INITIAL_PLAYER_PROGRESS;
  try {
    const raw = window.localStorage.getItem(PLAYER_PROGRESS_STORAGE_KEY);
    if (!raw) return INITIAL_PLAYER_PROGRESS;
    const parsed = JSON.parse(raw) as PlayerProgress;
    return normalizeProgress(parsed);
  } catch {
    return INITIAL_PLAYER_PROGRESS;
  }
}

export function savePlayerProgress(progress: PlayerProgress) {
  if (typeof window === "undefined") return;
  const normalizedProgress = normalizeProgress(progress);
  window.localStorage.setItem(
    PLAYER_PROGRESS_STORAGE_KEY,
    JSON.stringify(normalizedProgress),
  );
  window.dispatchEvent(
    new CustomEvent(PLAYER_PROGRESS_CHANGE_EVENT, { detail: normalizedProgress }),
  );
}

function buildDebugRewardTile(
  sourceId: PlaceTileId,
  category: "place" | "route",
  label: string,
  centerEmoji: string,
  pattern: TilePattern3x3,
  index: number,
): RewardPlaceTile {
  return {
    instanceId: `debug-${sourceId}-${index + 1}`,
    sourceId,
    category,
    label,
    centerEmoji,
    pattern,
  };
}

function buildBaseArrangeRouteDebugProgress() {
  const rewardTiles: RewardPlaceTile[] = [
    buildDebugRewardTile(
      "metro-station",
      "place",
      "捷運",
      "🚋",
      [
        [1, 1, 1],
        [0, 1, 0],
        [1, 1, 1],
      ],
      0,
    ),
    ...DEBUG_SECOND_TUTORIAL_ROUTE_REWARDS.map((tile, index) =>
      buildDebugRewardTile(
        "metro-station",
        "route",
        tile.label,
        tile.centerEmoji,
        tile.pattern,
        index + 1,
      ),
    ),
  ];

  return {
    ...INITIAL_PLAYER_PROGRESS,
    currentDay: 2,
    status: {
      savings: 40,
      actionPower: 2,
      fatigue: 20,
    },
    arrangeRouteDepartureCount: 1,
    offworkRewardClaimCount: 1,
    workShiftCount: 1,
    ownedPlaceTileIds: ["metro-station"] satisfies PlaceTileId[],
    rewardPlaceTiles: rewardTiles,
    unlockedDiaryEntryIds: ["bai-entry-1"] satisfies DiaryEntryId[],
    stickerCollection: ["naotaro-basic"] satisfies StickerId[],
    hasSeenDiaryFirstReveal: true,
    hasSeenSunbeastFirstReveal: true,
    hasSeenBaiFirstEncounterIntro: true,
    lastPhotoScore: 90,
    lastDogPhotoCapture: {
      sourceImage: "/images/428出圖/動物事件/黃金獵犬１.png",
      previewImage: "/images/428出圖/動物事件/黃金獵犬１.png",
      dogCoveragePercent: 90,
      cameraFrameRect: { x: 0.18, y: 0.51, width: 0.63, height: 0.2 },
      capturedRect: { x: 0.29, y: 0.51, width: 0.43, height: 0.2 },
      capturedAt: new Date().toISOString(),
    },
  } satisfies PlayerProgress;
}

function setArrangeRouteDebugTutorialProgress(presetId: ArrangeRouteDebugPresetId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ARRANGE_ROUTE_LOGIC_TUTORIAL_SEEN_KEY, "1");
  window.localStorage.setItem(ARRANGE_ROUTE_TILE_TUTORIAL_SEEN_KEY, "1");
  if (presetId === "post-naotaro-first-arrange") {
    window.localStorage.removeItem(ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_SEEN_KEY);
  } else {
    window.localStorage.setItem(ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_SEEN_KEY, "1");
  }
  window.localStorage.setItem(ARRANGE_ROUTE_CONVENIENCE_TUTORIAL_SEEN_KEY, "1");
}

export function applyArrangeRouteDebugPreset(presetId: ArrangeRouteDebugPresetId) {
  const base = buildBaseArrangeRouteDebugProgress();

  if (presetId === "post-naotaro-first-arrange") {
    const nextProgress: PlayerProgress = {
      ...base,
      currentDay: 2,
      arrangeRouteDepartureCount: 1,
      offworkRewardClaimCount: 1,
      workShiftCount: 1,
      hasPassedThroughStreet: false,
      hasPassedThroughMetroAndStreet: false,
      streetPassCount: 0,
      streetVisitStreak: 0,
      lastStreetVisitDay: null,
      ownedPlaceTileIds: ["metro-station"],
      pendingPlaceUnlockIntroIds: [],
      claimedPlaceUnlockIntroRewardIds: [],
    };
    savePlayerProgress(nextProgress);
    setArrangeRouteDebugTutorialProgress(presetId);
    return nextProgress;
  }

  const streetRewardTiles = FIRST_STREET_REWARD_PATTERNS.map((pattern, index) =>
    buildDebugRewardTile(
      "street",
      "place",
      index < 3
        ? `寬接窄街道 ${index + 1}`
        : index < 5
          ? `窄街道 ${index - 2}`
          : `窄接寬街道 ${index - 4}`,
      "💡",
      pattern,
      index + 20,
    ),
  );
  const convenienceRewardTile = buildDebugRewardTile(
    "convenience-store",
    "place",
    "便利商店",
    "🏪",
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
    40,
  );

  const nextProgress: PlayerProgress = {
    ...base,
    currentDay: 4,
    arrangeRouteDepartureCount: 3,
    offworkRewardClaimCount: 3,
    workShiftCount: 3,
    hasPassedThroughStreet: true,
    hasPassedThroughMetroAndStreet: true,
    streetPassCount: 2,
    streetVisitStreak: 2,
    lastStreetVisitDay: 3,
    ownedPlaceTileIds: ["metro-station", "street", "convenience-store"],
    claimedPlaceUnlockIntroRewardIds: ["convenience-store"],
    rewardPlaceTiles: [...base.rewardPlaceTiles, ...streetRewardTiles, convenienceRewardTile],
    pendingPlaceUnlockIntroIds: [],
    hasTriggeredStreetForgotLunchEvent: false,
    hasTriggeredWorkLunchForgotBentoEvent: false,
    streetForgotLunchFrogPhotoAttemptCount: 0,
    hasCompletedStreetForgotLunchFrogEvent: false,
    hasUnlockedSunbeastFrogHint: false,
  };
  savePlayerProgress(nextProgress);
  setArrangeRouteDebugTutorialProgress(presetId);
  return nextProgress;
}

export function countDiscoveredSunbeasts(
  progress: Pick<
    PlayerProgress,
    | "stickerCollection"
    | "hasCompletedStreetForgotLunchFrogEvent"
    | "hasTriggeredOfficeSunbeastChickenEvent"
    | "hasTriggeredOfficeSunbeastGoatEvent"
    | "hasTriggeredBusSunbeastCatEvent"
  >,
) {
  let count = 0;
  if (progress.stickerCollection.some((stickerId) => stickerId.startsWith("naotaro-"))) count += 1;
  if (progress.hasCompletedStreetForgotLunchFrogEvent) count += 1;
  if (progress.hasTriggeredOfficeSunbeastChickenEvent) count += 1;
  if (progress.hasTriggeredOfficeSunbeastGoatEvent) count += 1;
  if (progress.hasTriggeredBusSunbeastCatEvent) count += 1;
  return count;
}

export function getPlaceUnlockSnapshot(
  progress: Pick<
    PlayerProgress,
    | "ownedPlaceTileIds"
    | "hasPassedThroughMetroAndStreet"
    | "streetPassCount"
    | "streetVisitStreak"
    | "stickerCollection"
    | "hasCompletedStreetForgotLunchFrogEvent"
    | "hasTriggeredOfficeSunbeastChickenEvent"
    | "hasTriggeredOfficeSunbeastGoatEvent"
    | "hasTriggeredBusSunbeastCatEvent"
  >,
) {
  const discoveredSunbeastCount = countDiscoveredSunbeasts(progress);
  return {
    convenienceStore: {
      isUnlocked: progress.ownedPlaceTileIds.includes("convenience-store"),
      canUnlock: progress.hasPassedThroughMetroAndStreet,
      hasPassedThroughMetroAndStreet: progress.hasPassedThroughMetroAndStreet,
    },
    breakfastShop: {
      isUnlocked: progress.ownedPlaceTileIds.includes("breakfast-shop"),
      canUnlock: discoveredSunbeastCount >= 2,
      discoveredSunbeastCount,
    },
  };
}

export function syncDerivedPlaceUnlocks() {
  const current = loadPlayerProgress();
  const snapshot = getPlaceUnlockSnapshot(current);
  let nextOwnedPlaceTileIds = current.ownedPlaceTileIds;
  let nextPendingPlaceUnlockIntroIds: PlaceTileId[] = current.pendingPlaceUnlockIntroIds;
  let changed = false;

  if (!snapshot.convenienceStore.isUnlocked && snapshot.convenienceStore.canUnlock) {
    nextOwnedPlaceTileIds = Array.from(
      new Set([...nextOwnedPlaceTileIds, "convenience-store"]),
    ) as PlaceTileId[];
    nextPendingPlaceUnlockIntroIds = Array.from(
      new Set([...nextPendingPlaceUnlockIntroIds, "convenience-store"]),
    ) as PlaceTileId[];
    changed = true;
  }

  const shouldRepairPendingConvenienceStoreIntro =
    snapshot.convenienceStore.isUnlocked &&
    !current.pendingPlaceUnlockIntroIds.includes("convenience-store") &&
    !current.claimedPlaceUnlockIntroRewardIds.includes("convenience-store") &&
    !current.rewardPlaceTiles.some(
      (tile) => tile.sourceId === "convenience-store" && tile.category === "place",
    );
  if (shouldRepairPendingConvenienceStoreIntro) {
    nextPendingPlaceUnlockIntroIds = Array.from(
      new Set([...nextPendingPlaceUnlockIntroIds, "convenience-store"]),
    ) as PlaceTileId[];
    changed = true;
  }

  if (!snapshot.breakfastShop.isUnlocked && snapshot.breakfastShop.canUnlock) {
    nextOwnedPlaceTileIds = Array.from(
      new Set([...nextOwnedPlaceTileIds, "breakfast-shop"]),
    ) as PlaceTileId[];
    nextPendingPlaceUnlockIntroIds = Array.from(
      new Set([...nextPendingPlaceUnlockIntroIds, "breakfast-shop"]),
    ) as PlaceTileId[];
    changed = true;
  }

  if (!changed) return current;

  const nextProgress: PlayerProgress = {
    ...current,
    ownedPlaceTileIds: nextOwnedPlaceTileIds,
    pendingPlaceUnlockIntroIds: nextPendingPlaceUnlockIntroIds,
  };
  savePlayerProgress(nextProgress);
  return nextProgress;
}

export function claimPlaceUnlockIntroReward(tileId: PlaceTileId) {
  const current = loadPlayerProgress();
  const nextPendingPlaceUnlockIntroIds = current.pendingPlaceUnlockIntroIds.filter(
    (id) => id !== tileId,
  );
  const nextClaimedPlaceUnlockIntroRewardIds = current.claimedPlaceUnlockIntroRewardIds.includes(tileId)
    ? current.claimedPlaceUnlockIntroRewardIds
    : [...current.claimedPlaceUnlockIntroRewardIds, tileId];
  const shouldGrantRewardTile =
    TASK_UNLOCK_PLACE_IDS.includes(tileId) &&
    !current.claimedPlaceUnlockIntroRewardIds.includes(tileId) &&
    !current.rewardPlaceTiles.some(
      (tile) => tile.sourceId === tileId && tile.category === "place",
    );

  const rewardPattern =
    PLACE_UNLOCK_INTRO_REWARD_PATTERNS[tileId] ?? PLACE_UNLOCK_INTRO_REWARD_PATTERNS["convenience-store"];

  const nextRewardPlaceTiles = shouldGrantRewardTile
    ? [
        ...current.rewardPlaceTiles,
        {
          instanceId: `${tileId}-intro-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          sourceId: tileId,
          category: "place" as const,
          label: defaultTileLabel(tileId),
          centerEmoji: defaultTileEmoji(tileId),
          pattern: rewardPattern!,
        },
      ]
    : current.rewardPlaceTiles;

  const nextProgress: PlayerProgress = {
    ...current,
    pendingPlaceUnlockIntroIds: nextPendingPlaceUnlockIntroIds,
    claimedPlaceUnlockIntroRewardIds: nextClaimedPlaceUnlockIntroRewardIds,
    rewardPlaceTiles: nextRewardPlaceTiles,
  };
  savePlayerProgress(nextProgress);
  return nextProgress;
}

export function buildStreetVisitProgress(progress: PlayerProgress) {
  const currentDay = Math.max(1, Math.floor(progress.currentDay || 1));
  const isSameDayVisit = progress.lastStreetVisitDay === currentDay;
  const nextStreetVisitStreak = isSameDayVisit
    ? Math.max(1, progress.streetVisitStreak || 1)
    : progress.lastStreetVisitDay === currentDay - 1
      ? Math.max(1, progress.streetVisitStreak) + 1
      : 1;

  return {
    ...progress,
    hasPassedThroughStreet: true,
    streetPassCount: (progress.streetPassCount ?? 0) + 1,
    streetVisitStreak: nextStreetVisitStreak,
    lastStreetVisitDay: currentDay,
  };
}

export function resetPlayerProgress() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    PLAYER_PROGRESS_STORAGE_KEY,
    JSON.stringify(INITIAL_PLAYER_PROGRESS),
  );
  window.localStorage.removeItem(ARRANGE_ROUTE_LOGIC_TUTORIAL_SEEN_KEY);
  window.localStorage.removeItem(ARRANGE_ROUTE_TILE_TUTORIAL_SEEN_KEY);
  window.localStorage.removeItem(ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_SEEN_KEY);
  window.sessionStorage.removeItem(SCENE_TRANSITION_STORAGE_KEY);
  window.dispatchEvent(
    new CustomEvent(PLAYER_PROGRESS_CHANGE_EVENT, { detail: INITIAL_PLAYER_PROGRESS }),
  );
}

export function recordArrangeRouteDeparture(options?: { hasPassedThroughMetroAndStreet?: boolean }) {
  const current = loadPlayerProgress();
  savePlayerProgress({
    ...current,
    arrangeRouteDepartureCount: current.arrangeRouteDepartureCount + 1,
    hasPassedThroughMetroAndStreet:
      current.hasPassedThroughMetroAndStreet || Boolean(options?.hasPassedThroughMetroAndStreet),
  });
}

export function grantPlaceTile(tileId: PlaceTileId) {
  const current = loadPlayerProgress();
  if (current.ownedPlaceTileIds.includes(tileId)) return;
  savePlayerProgress({
    ...current,
    ownedPlaceTileIds: [...current.ownedPlaceTileIds, tileId],
  });
}

function buildNonBranchPattern3x3(): TilePattern3x3 {
  const topCol = Math.floor(Math.random() * 3);
  const bottomCol = Math.floor(Math.random() * 3);
  const top: [number, number, number] = [0, 0, 0];
  const middle: [number, number, number] = [0, 0, 0];
  const bottom: [number, number, number] = [0, 0, 0];

  top[topCol] = 1;
  bottom[bottomCol] = 1;

  if (topCol === bottomCol) {
    middle[topCol] = 1;
    return [top, middle, bottom];
  }

  const start = Math.min(topCol, bottomCol);
  const end = Math.max(topCol, bottomCol);
  for (let col = start; col <= end; col += 1) {
    middle[col] = 1;
  }
  return [top, middle, bottom];
}

function getRowOpenColumns(row: [number, number, number]): number[] {
  const cols: number[] = [];
  row.forEach((cell, index) => {
    if (cell === 1) cols.push(index);
  });
  return cols;
}

function hasColumnOpening(columns: number[], col: number) {
  return columns.includes(col);
}

function buildNonBranchPatternByCols(topCol: number, bottomCol: number): TilePattern3x3 {
  const top: [number, number, number] = [0, 0, 0];
  const middle: [number, number, number] = [0, 0, 0];
  const bottom: [number, number, number] = [0, 0, 0];
  top[topCol] = 1;
  bottom[bottomCol] = 1;

  if (topCol === bottomCol) {
    middle[topCol] = 1;
    return [top, middle, bottom];
  }

  const start = Math.min(topCol, bottomCol);
  const end = Math.max(topCol, bottomCol);
  for (let col = start; col <= end; col += 1) {
    middle[col] = 1;
  }
  return [top, middle, bottom];
}

function isEdgeSingleOpeningCol(col: number) {
  return col === 0 || col === 2;
}

export function generateOffworkRewardPattern(
  isFirstClaim: boolean,
  rewardTiles: RewardPlaceTile[] = [],
): TilePattern3x3 {
  if (isFirstClaim) return FIRST_OFFWORK_REWARD_PATTERN;
  // 現階段禁止地點拼圖在起點/終點出現分岔：上、下列固定為單一路口。
  const playerRoutePatterns = rewardTiles
    .filter((tile) => tile.category === "route")
    .map((tile) => tile.pattern);
  const routePatterns =
    playerRoutePatterns.length > 0
      ? [...playerRoutePatterns]
      : [...BASE_ROUTE_PATTERNS];
  const fallbackRoutePatterns = [...BASE_ROUTE_PATTERNS, ...playerRoutePatterns];
  if (routePatterns.length <= 0) return buildNonBranchPattern3x3();

  const buildConnectableCols = (patterns: TilePattern3x3[]) => {
    const connectableByTop = new Set<number>();
    const connectableByBottom = new Set<number>();
    patterns.forEach((pattern) => {
      const topCols = getRowOpenColumns(pattern[0]);
      const bottomCols = getRowOpenColumns(pattern[2]);
      [0, 1, 2].forEach((col) => {
        // 地點拼圖 top 要接上方鄰格 -> 鄰格 bottom 只要有對應缺口即可
        if (hasColumnOpening(bottomCols, col)) connectableByTop.add(col);
        // 地點拼圖 bottom 要接下方鄰格 -> 鄰格 top 只要有對應缺口即可
        if (hasColumnOpening(topCols, col)) connectableByBottom.add(col);
      });
    });
    return { connectableByTop, connectableByBottom };
  };

  const strictConnectable = buildConnectableCols(routePatterns);
  const fallbackConnectable = buildConnectableCols(fallbackRoutePatterns);

  const buildCandidates = (connectable: {
    connectableByTop: Set<number>;
    connectableByBottom: Set<number>;
  }) => {
    const candidates: TilePattern3x3[] = [];
    for (let topCol = 0; topCol <= 2; topCol += 1) {
      for (let bottomCol = 0; bottomCol <= 2; bottomCol += 1) {
        // 目前為了平衡前期難度，隨機生成的下班獎勵先不給左右邊單口，
        // 避免出現 [100] / [001] 這類太偏門的入口或出口。
        if (isEdgeSingleOpeningCol(topCol) || isEdgeSingleOpeningCol(bottomCol)) continue;
        const topConnectable = connectable.connectableByTop.has(topCol);
        const bottomConnectable = connectable.connectableByBottom.has(bottomCol);
        if (!topConnectable && !bottomConnectable) continue;
        candidates.push(buildNonBranchPatternByCols(topCol, bottomCol));
      }
    }
    return candidates;
  };

  const strictCandidates = buildCandidates(strictConnectable);
  const candidates = strictCandidates.length > 0 ? strictCandidates : buildCandidates(fallbackConnectable);
  if (candidates.length <= 0) return buildNonBranchPattern3x3();
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

export function claimOffworkReward(
  tileId: PlaceTileId,
  rewardPattern: TilePattern3x3,
  options?: { label?: string; centerEmoji?: string; category?: "place" | "route" },
) {
  claimOffworkRewardBatch([
    {
      tileId,
      rewardPattern,
      options,
    },
  ]);
}

export function grantEventRewardTile(
  tileId: PlaceTileId,
  rewardPattern: TilePattern3x3,
  options?: { label?: string; centerEmoji?: string; category?: "place" | "route" },
) {
  const current = loadPlayerProgress();
  const nextOwned = [...current.ownedPlaceTileIds];
  if (!nextOwned.includes(tileId)) nextOwned.push(tileId);

  const rewardTile: RewardPlaceTile = {
    instanceId: `${tileId}-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sourceId: tileId,
    category:
      options?.category ??
      (tileId === "metro-station" ? "place" : "route"),
    label: options?.label ?? defaultTileLabel(tileId),
    centerEmoji: options?.centerEmoji ?? defaultTileEmoji(tileId),
    pattern: rewardPattern,
  };

  savePlayerProgress({
    ...current,
    ownedPlaceTileIds: nextOwned,
    rewardPlaceTiles: [...current.rewardPlaceTiles, rewardTile],
  });
}

export function claimOffworkRewardBatch(
  rewards: Array<{
    tileId: PlaceTileId;
    rewardPattern: TilePattern3x3;
    options?: { label?: string; centerEmoji?: string; category?: "place" | "route" };
  }>,
) {
  const current = loadPlayerProgress();
  const nextOwned = [...current.ownedPlaceTileIds];
  const rewardTiles: RewardPlaceTile[] = rewards.map((reward, index) => {
    const category = reward.options?.category ?? "place";
    if (category === "place" && !nextOwned.includes(reward.tileId)) nextOwned.push(reward.tileId);
    return {
      instanceId: `${reward.tileId}-reward-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      sourceId: reward.tileId,
      category,
      label: reward.options?.label ?? defaultTileLabel(reward.tileId),
      centerEmoji: reward.options?.centerEmoji ?? defaultTileEmoji(reward.tileId),
      pattern: reward.rewardPattern,
    };
  });

  savePlayerProgress({
    ...current,
    status: {
      ...current.status,
      savings: current.status.savings + 2,
    },
    ownedPlaceTileIds: nextOwned,
    offworkRewardClaimCount: current.offworkRewardClaimCount + 1,
    rewardPlaceTiles: [...current.rewardPlaceTiles, ...rewardTiles],
  });
}

export function skipOffworkRewardCycle() {
  const current = loadPlayerProgress();
  savePlayerProgress({
    ...current,
    offworkRewardClaimCount: current.offworkRewardClaimCount + 1,
  });
}

export function grantInventoryItem(itemId: InventoryItemId) {
  const current = loadPlayerProgress();
  savePlayerProgress({
    ...current,
    inventoryItems: [...current.inventoryItems, itemId],
  });
}

export function consumeInventoryItems(itemId: InventoryItemId, count = 1) {
  if (count <= 0) return;
  const current = loadPlayerProgress();
  let remaining = count;
  const nextInventory = current.inventoryItems.filter((currentItemId) => {
    if (currentItemId !== itemId || remaining <= 0) return true;
    remaining -= 1;
    return false;
  });
  if (remaining === count) return;
  savePlayerProgress({
    ...current,
    inventoryItems: nextInventory,
  });
}

export function incrementWorkShiftCount() {
  const current = loadPlayerProgress();
  savePlayerProgress({
    ...current,
    workShiftCount: current.workShiftCount + 1,
  });
}

export function saveWorkTaskProgress(taskId: string, progress: number) {
  if (typeof taskId !== "string" || taskId.length === 0) return;
  if (!Number.isFinite(progress) || progress < 0) return;
  const current = loadPlayerProgress();
  savePlayerProgress({
    ...current,
    workTaskProgressById: {
      ...current.workTaskProgressById,
      [taskId]: Math.floor(progress),
    },
  });
}

export function markNegativeEventToday() {
  const current = loadPlayerProgress();
  if (current.hasNegativeEventToday) return;
  savePlayerProgress({
    ...current,
    hasNegativeEventToday: true,
  });
}

export function recordWorkShiftResult(
  fatigueIncrease: number,
  options?: { overtimeThreshold?: number },
) {
  const threshold = options?.overtimeThreshold ?? 30;
  const current = loadPlayerProgress();
  savePlayerProgress({
    ...current,
    status: {
      ...current.status,
      fatigue: Math.max(0, current.status.fatigue + Math.max(0, Math.floor(fatigueIncrease))),
    },
    workShiftCount: current.workShiftCount + 1,
    hadOvertimeToday:
      current.hadOvertimeToday || fatigueIncrease >= threshold,
  });
}

export function rolloverDailyEventFlags() {
  const current = loadPlayerProgress();
  savePlayerProgress({
    ...current,
    hasNegativeEventYesterday: current.hasNegativeEventToday,
    hasNegativeEventToday: false,
    hadOvertimeYesterday: current.hadOvertimeToday,
    hadOvertimeToday: false,
  });
}

export function markMetroElevatorGoatPreludeTriggered() {
  const current = loadPlayerProgress();
  if (current.hasTriggeredMetroElevatorGoatPrelude) return;
  savePlayerProgress({
    ...current,
    hasTriggeredMetroElevatorGoatPrelude: true,
  });
}

export function markMetroSeatSpreadEventTriggered() {
  const current = loadPlayerProgress();
  if (current.hasTriggeredMetroSeatSpreadEvent) return;
  savePlayerProgress({
    ...current,
    hasTriggeredMetroSeatSpreadEvent: true,
  });
}

export function markMetroBackpackHitEventTriggered() {
  const current = loadPlayerProgress();
  if (current.hasTriggeredMetroBackpackHitEvent) return;
  savePlayerProgress({
    ...current,
    hasTriggeredMetroBackpackHitEvent: true,
  });
}

export function markStreetDodgeGoatPreludeTriggered() {
  const current = loadPlayerProgress();
  if (current.hasTriggeredStreetDodgeGoatPrelude) return;
  savePlayerProgress({
    ...current,
    hasTriggeredStreetDodgeGoatPrelude: true,
  });
}

export function markMartOneDollarGoatPreludeTriggered() {
  const current = loadPlayerProgress();
  if (current.hasTriggeredMartOneDollarGoatPrelude) return;
  savePlayerProgress({
    ...current,
    hasTriggeredMartOneDollarGoatPrelude: true,
  });
}

export function markOfficeSunbeastGoatEventTriggered() {
  const current = loadPlayerProgress();
  if (current.hasTriggeredOfficeSunbeastGoatEvent) return;
  savePlayerProgress({
    ...current,
    hasTriggeredOfficeSunbeastGoatEvent: true,
  });
}

export function markBusMelodyChickenPrelude1Triggered() {
  const current = loadPlayerProgress();
  if (current.hasTriggeredBusMelodyChickenPrelude1) return;
  savePlayerProgress({
    ...current,
    hasTriggeredBusMelodyChickenPrelude1: true,
  });
}

export function markMartMelodyChickenPrelude2Triggered() {
  const current = loadPlayerProgress();
  if (current.hasTriggeredMartMelodyChickenPrelude2) return;
  savePlayerProgress({
    ...current,
    hasTriggeredMartMelodyChickenPrelude2: true,
  });
}

export function markStreetMelodyChickenPrelude3Triggered() {
  const current = loadPlayerProgress();
  if (current.hasTriggeredStreetMelodyChickenPrelude3) return;
  savePlayerProgress({
    ...current,
    hasTriggeredStreetMelodyChickenPrelude3: true,
  });
}

export function markOfficeSunbeastChickenEventTriggered() {
  const current = loadPlayerProgress();
  if (current.hasTriggeredOfficeSunbeastChickenEvent) return;
  savePlayerProgress({
    ...current,
    hasTriggeredOfficeSunbeastChickenEvent: true,
  });
}

export function markBusSunbeastCatEventTriggered() {
  const current = loadPlayerProgress();
  if (current.hasTriggeredBusSunbeastCatEvent) return;
  savePlayerProgress({
    ...current,
    hasTriggeredBusSunbeastCatEvent: true,
  });
}

export function markStreetForgotLunchFrogEventCompleted() {
  const current = loadPlayerProgress();
  if (current.hasCompletedStreetForgotLunchFrogEvent) return;
  savePlayerProgress({
    ...current,
    streetForgotLunchFrogPhotoAttemptCount: 3,
    hasUnlockedBaiEntry2SecondFragment: true,
    hasCompletedStreetForgotLunchFrogEvent: true,
    hasUnlockedSunbeastFrogHint: true,
  });
}

export function markWorkLunchForgotBentoEventTriggered() {
  const current = loadPlayerProgress();
  if (current.hasTriggeredWorkLunchForgotBentoEvent) return;
  savePlayerProgress({
    ...current,
    hasTriggeredWorkLunchForgotBentoEvent: true,
  });
}

export function recordStreetForgotLunchFrogPhotoAttempt() {
  const current = loadPlayerProgress();
  const nextCount = Math.min(3, current.streetForgotLunchFrogPhotoAttemptCount + 1);
  savePlayerProgress({
    ...current,
    streetForgotLunchFrogPhotoAttemptCount: nextCount,
  });
  return nextCount;
}

export function unlockBaiEntry2SecondFragment() {
  const current = loadPlayerProgress();
  if (current.hasUnlockedBaiEntry2SecondFragment) return;
  savePlayerProgress({
    ...current,
    hasUnlockedBaiEntry2SecondFragment: true,
  });
}

export function queueFrogDiaryFragmentHubGuide() {
  const current = loadPlayerProgress();
  if (
    !current.unlockedDiaryEntryIds.includes("bai-entry-1") ||
    current.unlockedDiaryEntryIds.includes("bai-entry-2") ||
    current.hasCompletedStreetForgotLunchFrogEvent
  ) {
    return;
  }
  savePlayerProgress({
    ...current,
    hasPendingFrogDiaryFragmentHubGuide: true,
    hasPendingFrogDiarySleepGuide: false,
  });
}

export function clearFrogDiaryFragmentHubGuide() {
  const current = loadPlayerProgress();
  if (!current.hasPendingFrogDiaryFragmentHubGuide) return;
  savePlayerProgress({
    ...current,
    hasPendingFrogDiaryFragmentHubGuide: false,
  });
}

export function queueFrogDiarySleepGuide() {
  const current = loadPlayerProgress();
  if (
    !current.unlockedDiaryEntryIds.includes("bai-entry-1") ||
    current.hasCompletedStreetForgotLunchFrogEvent
  ) {
    return;
  }
  savePlayerProgress({
    ...current,
    hasPendingFrogDiaryFragmentHubGuide: false,
    hasPendingFrogDiarySleepGuide: true,
  });
}

export function clearFrogDiarySleepGuide() {
  const current = loadPlayerProgress();
  if (!current.hasPendingFrogDiarySleepGuide) return;
  savePlayerProgress({
    ...current,
    hasPendingFrogDiarySleepGuide: false,
  });
}

export function unlockDiaryEntry(entryId: DiaryEntryId) {
  const current = loadPlayerProgress();
  if (current.unlockedDiaryEntryIds.includes(entryId)) return;
  savePlayerProgress({
    ...current,
    unlockedDiaryEntryIds: [...current.unlockedDiaryEntryIds, entryId],
  });
}

export function recordPhotoScore(score: number) {
  const current = loadPlayerProgress();
  const safeScore = Math.max(0, Math.min(100, Math.floor(score)));
  const shouldStartFirstSunbeastReveal =
    !current.hasSeenSunbeastFirstReveal &&
    current.lastDogPhotoCapture === null &&
    !current.stickerCollection.some((stickerId) => stickerId.startsWith("naotaro-"));
  savePlayerProgress({
    ...current,
    lastPhotoScore: safeScore,
    hasSeenDiaryFirstReveal: shouldStartFirstSunbeastReveal ? false : current.hasSeenDiaryFirstReveal,
    hasSeenSunbeastFirstReveal: shouldStartFirstSunbeastReveal ? false : current.hasSeenSunbeastFirstReveal,
    hasSeenFirstSunbeastNightHubGuide: shouldStartFirstSunbeastReveal ? false : current.hasSeenFirstSunbeastNightHubGuide,
    hasSeenFirstSunbeastNightHubGuideV2: shouldStartFirstSunbeastReveal ? false : current.hasSeenFirstSunbeastNightHubGuideV2,
    hasSeenFirstSunbeastNightHubGuideV3: shouldStartFirstSunbeastReveal ? false : current.hasSeenFirstSunbeastNightHubGuideV3,
    hasPendingFirstSunbeastNightHubGuide: shouldStartFirstSunbeastReveal
      ? true
      : current.hasPendingFirstSunbeastNightHubGuide,
    hasSeenSunbeastShadowGuide: shouldStartFirstSunbeastReveal ? false : current.hasSeenSunbeastShadowGuide,
  });
}

export function recordPhotoCapture(snapshot: {
  sourceImage: string;
  previewImage: string;
  dogCoveragePercent: number;
  cameraFrameRect: PhotoCaptureFrameRect;
  capturedRect: PhotoCaptureFrameRect;
}) {
  const current = loadPlayerProgress();
  const normalizedSnapshot = normalizePhotoCaptureSnapshot({
    sourceImage: snapshot.sourceImage,
    previewImage: snapshot.previewImage,
    dogCoveragePercent: snapshot.dogCoveragePercent,
    cameraFrameRect: snapshot.cameraFrameRect,
    capturedRect: snapshot.capturedRect,
    capturedAt: new Date().toISOString(),
  });
  if (!normalizedSnapshot) return;
  const shouldStartFirstSunbeastReveal =
    !current.hasSeenSunbeastFirstReveal &&
    current.lastDogPhotoCapture === null &&
    !current.stickerCollection.some((stickerId) => stickerId.startsWith("naotaro-"));
  savePlayerProgress({
    ...current,
    lastPhotoScore: normalizedSnapshot.dogCoveragePercent,
    lastDogPhotoCapture: normalizedSnapshot,
    hasSeenDiaryFirstReveal: shouldStartFirstSunbeastReveal ? false : current.hasSeenDiaryFirstReveal,
    hasSeenSunbeastFirstReveal: shouldStartFirstSunbeastReveal ? false : current.hasSeenSunbeastFirstReveal,
    hasSeenFirstSunbeastNightHubGuide: shouldStartFirstSunbeastReveal ? false : current.hasSeenFirstSunbeastNightHubGuide,
    hasSeenFirstSunbeastNightHubGuideV2: shouldStartFirstSunbeastReveal ? false : current.hasSeenFirstSunbeastNightHubGuideV2,
    hasSeenFirstSunbeastNightHubGuideV3: shouldStartFirstSunbeastReveal ? false : current.hasSeenFirstSunbeastNightHubGuideV3,
    hasPendingFirstSunbeastNightHubGuide: shouldStartFirstSunbeastReveal
      ? true
      : current.hasPendingFirstSunbeastNightHubGuide,
    hasSeenSunbeastShadowGuide: shouldStartFirstSunbeastReveal ? false : current.hasSeenSunbeastShadowGuide,
  });
}

export function recordStreetForgotLunchFrogPhotoCapture(
  photoAttemptNumber: number,
  snapshot: {
    sourceImage: string;
    previewImage: string;
    dogCoveragePercent: number;
    cameraFrameRect: PhotoCaptureFrameRect;
    capturedRect: PhotoCaptureFrameRect;
  },
) {
  const current = loadPlayerProgress();
  const normalizedSnapshot = normalizePhotoCaptureSnapshot({
    sourceImage: snapshot.sourceImage,
    previewImage: snapshot.previewImage,
    dogCoveragePercent: snapshot.dogCoveragePercent,
    cameraFrameRect: snapshot.cameraFrameRect,
    capturedRect: snapshot.capturedRect,
    capturedAt: new Date().toISOString(),
  });
  if (!normalizedSnapshot) return;

  const captureIndex = Math.max(0, Math.min(2, Math.floor(photoAttemptNumber) - 1));
  const nextCaptures = [...current.streetForgotLunchFrogPhotoCaptures];
  nextCaptures[captureIndex] = normalizedSnapshot;

  savePlayerProgress({
    ...current,
    streetForgotLunchFrogPhotoCaptures: nextCaptures.filter(
      (capture): capture is PhotoCaptureSnapshot => Boolean(capture),
    ),
  });
}

export function markDiaryFirstRevealSeen() {
  const current = loadPlayerProgress();
  if (current.hasSeenDiaryFirstReveal) return;
  savePlayerProgress({
    ...current,
    hasSeenDiaryFirstReveal: true,
  });
}

function pickStickerByScore(score: number): StickerId {
  const roll = Math.random();
  if (score >= 85) {
    if (roll < 0.5) return "naotaro-rare";
    return roll < 0.75 ? "naotaro-smile" : "naotaro-basic";
  }
  if (score >= 60) {
    return roll < 0.6 ? "naotaro-smile" : "naotaro-basic";
  }
  return "naotaro-basic";
}

export function settleDiaryFirstRevealReward():
  | { score: number; stickerId: StickerId; isNewSticker: boolean }
  | null {
  const current = loadPlayerProgress();
  if (current.hasSeenSunbeastFirstReveal) return null;
  if (!current.unlockedDiaryEntryIds.includes("bai-entry-1")) return null;
  const score = current.lastPhotoScore ?? 30;
  const stickerId = pickStickerByScore(score);
  const isNewSticker = !current.stickerCollection.includes(stickerId);
  const nextStickers = isNewSticker ? [...current.stickerCollection, stickerId] : current.stickerCollection;
  savePlayerProgress({
    ...current,
    stickerCollection: nextStickers,
    hasSeenSunbeastFirstReveal: true,
    hasPendingFirstSunbeastNightHubGuide: true,
    hasSeenSunbeastShadowGuide: false,
  });
  return { score, stickerId, isNewSticker };
}

export function convertPhotoScoreToPoints(score: number): number {
  const safeScore = Math.max(0, Math.min(100, Math.floor(score)));
  // 例：68% -> 15 點
  return Math.max(1, Math.round(safeScore * 0.22));
}

export function getStickerRollWeightsByPoints(points: number): StickerRollWeights {
  if (points >= 18) return { basic: 50, smile: 35, rare: 15 };
  if (points >= 12) return { basic: 50, smile: 45, rare: 5 };
  return { basic: 70, smile: 30, rare: 0 };
}

export function rollStickerByPoints(points: number): StickerId {
  const weights = getStickerRollWeightsByPoints(points);
  const roll = Math.random() * 100;
  if (roll < weights.rare) return "naotaro-rare";
  if (roll < weights.rare + weights.smile) return "naotaro-smile";
  return "naotaro-basic";
}

export function finalizeDiaryFirstRevealReward(stickerId: StickerId) {
  const current = loadPlayerProgress();
  const isNewSticker = !current.stickerCollection.includes(stickerId);
  const nextStickers = isNewSticker ? [...current.stickerCollection, stickerId] : current.stickerCollection;
  savePlayerProgress({
    ...current,
    stickerCollection: nextStickers,
    hasSeenSunbeastFirstReveal: true,
    hasPendingFirstSunbeastNightHubGuide: true,
    hasSeenSunbeastShadowGuide: false,
  });
  return { isNewSticker };
}

export function setEncounteredCharacter(characterId: EncounterCharacterId, seen: boolean) {
  const current = loadPlayerProgress();
  const exists = current.encounteredCharacterIds.includes(characterId);
  if (seen && exists) return;
  if (!seen && !exists) return;
  const nextIds = seen
    ? [...current.encounteredCharacterIds, characterId]
    : current.encounteredCharacterIds.filter((id) => id !== characterId);
  savePlayerProgress({
    ...current,
    encounteredCharacterIds: nextIds.length > 0 ? nextIds : ["mai"],
  });
}
