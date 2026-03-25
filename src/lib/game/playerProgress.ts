import { INITIAL_PLAYER_STATUS, type PlayerStatus } from "@/lib/game/playerStatus";

export type PlaceTileId =
  | "metro-station"
  | "street"
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

export type RewardPlaceTile = {
  instanceId: string;
  sourceId: PlaceTileId;
  category: "place" | "route";
  label: string;
  centerEmoji: string;
  pattern: TilePattern3x3;
};

export type InventoryItemId = "cat-grass" | "cat-treat" | "puzzle-fragment";
export type DiaryEntryId = "bai-entry-1";
export type StickerId = "naotaro-basic" | "naotaro-smile" | "naotaro-rare";
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
  /** 首次進入下班獎勵階段的教學是否已看過 */
  hasSeenOffworkRewardTutorial: boolean;
};

const PLAYER_PROGRESS_STORAGE_KEY = "moment:player-progress";
const VALID_PLACE_TILE_IDS: PlaceTileId[] = [
  "metro-station",
  "street",
  "breakfast-shop",
  "park",
  "bus-stop",
];

function defaultTileLabel(tileId: PlaceTileId) {
  if (tileId === "street") return "街道";
  if (tileId === "metro-station") return "捷運";
  if (tileId === "breakfast-shop") return "早餐店";
  if (tileId === "park") return "公園";
  return "公車站";
}

function defaultTileEmoji(tileId: PlaceTileId) {
  if (tileId === "street") return "💡";
  if (tileId === "metro-station") return "🚋";
  if (tileId === "breakfast-shop") return "🥪";
  if (tileId === "park") return "🌳";
  return "🚌";
}

export const INITIAL_PLAYER_PROGRESS: PlayerProgress = {
  currentDay: 1,
  status: INITIAL_PLAYER_STATUS,
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
  hasSeenOffworkRewardTutorial: false,
};

const VALID_INVENTORY_ITEM_IDS: InventoryItemId[] = ["cat-grass", "cat-treat", "puzzle-fragment"];
const VALID_DIARY_ENTRY_IDS: DiaryEntryId[] = ["bai-entry-1"];
const VALID_STICKER_IDS: StickerId[] = ["naotaro-basic", "naotaro-smile", "naotaro-rare"];

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
    hasSeenOffworkRewardTutorial: Boolean(
      (raw as Partial<PlayerProgress>).hasSeenOffworkRewardTutorial,
    ),
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

export function generateOffworkRewardPattern(isFirstClaim: boolean): TilePattern3x3 {
  if (isFirstClaim) return FIRST_OFFWORK_REWARD_PATTERN;
  // 現階段禁止地點拼圖在起點/終點出現分岔：上、下列固定為單一路口。
  return buildNonBranchPattern3x3();
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

export function incrementWorkShiftCount() {
  const current = loadPlayerProgress();
  savePlayerProgress({
    ...current,
    workShiftCount: current.workShiftCount + 1,
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
