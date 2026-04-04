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
  [0, 0, 1],
  [0, 1, 0],
  [0, 1, 0],
];

export const FIRST_STREET_REWARD_PATTERNS: TilePattern3x3[] = [
  [
    [1, 1, 1],
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [1, 1, 1],
    [0, 1, 0],
    [0, 1, 0],
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
export type DiaryEntryId = "bai-entry-1";
export type StickerId = "naotaro-basic" | "naotaro-smile" | "naotaro-rare";
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
  consumedPlaceTileInstanceIds: string[];
  offworkRewardClaimCount: number;
  workShiftCount: number;
  rewardPlaceTiles: RewardPlaceTile[];
  inventoryItems: InventoryItemId[];
  unlockedDiaryEntryIds: DiaryEntryId[];
  stickerCollection: StickerId[];
  lastPhotoScore: number | null;
  lastDogPhotoCapture: PhotoCaptureSnapshot | null;
  hasSeenDiaryFirstReveal: boolean;
  /** 是否曾在「安排路線」中出發且路線經過街道（用於解鎖第 3 次拼圖池） */
  hasPassedThroughStreet: boolean;
  /** 曾經在安排路線中經過街道的次數（用於特殊事件觸發） */
  streetPassCount: number;
  /** 是否已觸發過「忘記便當／便利商店青蛙」事件 */
  hasTriggeredStreetForgotLunchEvent: boolean;
  /** 首次進入下班獎勵階段的教學是否已看過 */
  hasSeenOffworkRewardTutorial: boolean;
  /** 是否已看過小白第一次登場介紹 */
  hasSeenBaiFirstEncounterIntro: boolean;
  /** 是否已看過第 2 次安排路線的路徑拼圖教學 */
  hasSeenArrangeRouteTileTutorial: boolean;
  /** 是否已看過「小日獸 tab」首次可用引導 */
  hasSeenNaotaroPetTabGuide: boolean;
  /** 是否已看過首次經過街道提示 */
  hasSeenStreetPassUnlockFeedback: boolean;
  /** 是否已看過拼圖池首次開啟提示 */
  hasSeenRewardPoolUnlockFeedback: boolean;
  /** 今日是否發生過負面事件（影響玩家數值變不好） */
  hasNegativeEventToday: boolean;
  /** 昨日是否發生過負面事件（影響玩家數值變不好） */
  hasNegativeEventYesterday: boolean;
  /** 今日上班是否達到加班判定 */
  hadOvertimeToday: boolean;
  /** 昨日是否達到加班判定 */
  hadOvertimeYesterday: boolean;
  /** 是否已觸發過「捷運山羊小日獸」事件 */
  hasTriggeredMetroSunbeastGoatEvent: boolean;
  /** 是否已觸發過「雞前置：公車旋律」事件 */
  hasTriggeredBusMelodyChickenPrelude1: boolean;
  /** 是否已觸發過「雞前置：便利商店旋律」事件 */
  hasTriggeredMartMelodyChickenPrelude2: boolean;
  /** 是否已觸發過「雞前置：街道旋律」事件 */
  hasTriggeredStreetMelodyChickenPrelude3: boolean;
  /** 是否已觸發過「辦公室：小日獸雞」事件 */
  hasTriggeredOfficeSunbeastChickenEvent: boolean;
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
const ARRANGE_ROUTE_LOGIC_TUTORIAL_SEEN_KEY = "moment:arrange-route-logic-tutorial-seen";
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
  consumedPlaceTileInstanceIds: [],
  offworkRewardClaimCount: 0,
  workShiftCount: 0,
  rewardPlaceTiles: [],
  inventoryItems: [],
  unlockedDiaryEntryIds: [],
  stickerCollection: [],
  lastPhotoScore: null,
  lastDogPhotoCapture: null,
  hasSeenDiaryFirstReveal: false,
  hasPassedThroughStreet: false,
  streetPassCount: 0,
  hasTriggeredStreetForgotLunchEvent: false,
  hasSeenOffworkRewardTutorial: false,
  hasSeenBaiFirstEncounterIntro: false,
  hasSeenArrangeRouteTileTutorial: false,
  hasSeenNaotaroPetTabGuide: false,
  hasSeenStreetPassUnlockFeedback: false,
  hasSeenRewardPoolUnlockFeedback: false,
  hasNegativeEventToday: false,
  hasNegativeEventYesterday: false,
  hadOvertimeToday: false,
  hadOvertimeYesterday: false,
  hasTriggeredMetroSunbeastGoatEvent: false,
  hasTriggeredBusMelodyChickenPrelude1: false,
  hasTriggeredMartMelodyChickenPrelude2: false,
  hasTriggeredStreetMelodyChickenPrelude3: false,
  hasTriggeredOfficeSunbeastChickenEvent: false,
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
const VALID_DIARY_ENTRY_IDS: DiaryEntryId[] = ["bai-entry-1"];
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
      return {
        instanceId:
          typeof obj.instanceId === "string" && obj.instanceId.length > 0
            ? obj.instanceId
            : `${sourceId}-legacy-${index}`,
        sourceId,
        label: typeof obj.label === "string" && obj.label.length > 0 ? obj.label : defaultTileLabel(sourceId),
        category:
          obj.category === "place" || obj.category === "route"
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
    hasSeenDiaryFirstReveal: Boolean((raw as Partial<PlayerProgress>).hasSeenDiaryFirstReveal),
    hasPassedThroughStreet: Boolean((raw as Partial<PlayerProgress>).hasPassedThroughStreet),
    streetPassCount:
      Number.isFinite((raw as Partial<PlayerProgress>).streetPassCount) &&
      (raw as Partial<PlayerProgress>).streetPassCount! >= 0
        ? Math.floor((raw as Partial<PlayerProgress>).streetPassCount!)
        : 0,
    hasTriggeredStreetForgotLunchEvent: Boolean(
      (raw as Partial<PlayerProgress>).hasTriggeredStreetForgotLunchEvent,
    ),
    hasSeenOffworkRewardTutorial: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenOffworkRewardTutorial,
    ),
    hasSeenBaiFirstEncounterIntro: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenBaiFirstEncounterIntro,
    ),
    hasSeenArrangeRouteTileTutorial: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenArrangeRouteTileTutorial,
    ),
    hasSeenNaotaroPetTabGuide: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenNaotaroPetTabGuide,
    ),
    hasSeenStreetPassUnlockFeedback: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenStreetPassUnlockFeedback,
    ),
    hasSeenRewardPoolUnlockFeedback: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenRewardPoolUnlockFeedback,
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
    hasTriggeredMetroSunbeastGoatEvent: Boolean(
      (raw as Partial<PlayerProgress>).hasTriggeredMetroSunbeastGoatEvent,
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
  window.localStorage.setItem(
    PLAYER_PROGRESS_STORAGE_KEY,
    JSON.stringify(normalizeProgress(progress)),
  );
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
}

export function recordArrangeRouteDeparture() {
  const current = loadPlayerProgress();
  savePlayerProgress({
    ...current,
    arrangeRouteDepartureCount: current.arrangeRouteDepartureCount + 1,
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
    if (!nextOwned.includes(reward.tileId)) nextOwned.push(reward.tileId);
    return {
      instanceId: `${reward.tileId}-reward-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      sourceId: reward.tileId,
      category:
        reward.options?.category ??
        (reward.tileId === "metro-station" ? "place" : "route"),
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

export function markMetroSunbeastGoatEventTriggered() {
  const current = loadPlayerProgress();
  if (current.hasTriggeredMetroSunbeastGoatEvent) return;
  savePlayerProgress({
    ...current,
    hasTriggeredMetroSunbeastGoatEvent: true,
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
  savePlayerProgress({
    ...current,
    lastPhotoScore: safeScore,
    hasSeenDiaryFirstReveal: false,
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
  savePlayerProgress({
    ...current,
    lastPhotoScore: normalizedSnapshot.dogCoveragePercent,
    lastDogPhotoCapture: normalizedSnapshot,
    hasSeenDiaryFirstReveal: false,
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
  if (current.hasSeenDiaryFirstReveal) return null;
  if (!current.unlockedDiaryEntryIds.includes("bai-entry-1")) return null;
  const score = current.lastPhotoScore ?? 30;
  const stickerId = pickStickerByScore(score);
  const isNewSticker = !current.stickerCollection.includes(stickerId);
  const nextStickers = isNewSticker ? [...current.stickerCollection, stickerId] : current.stickerCollection;
  savePlayerProgress({
    ...current,
    stickerCollection: nextStickers,
    hasSeenDiaryFirstReveal: true,
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
    hasSeenDiaryFirstReveal: true,
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
