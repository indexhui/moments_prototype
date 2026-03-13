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

export type PlayerProgress = {
  status: PlayerStatus;
  ownedPlaceTileIds: PlaceTileId[];
  offworkRewardClaimCount: number;
  rewardPlaceTiles: RewardPlaceTile[];
  /** 是否曾在「安排路線」中出發且路線經過街道（用於解鎖第 3 次拼圖池） */
  hasPassedThroughStreet: boolean;
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
  status: INITIAL_PLAYER_STATUS,
  ownedPlaceTileIds: [],
  offworkRewardClaimCount: 0,
  rewardPlaceTiles: [],
  hasPassedThroughStreet: false,
};

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
    status: {
      savings: Number.isFinite(raw.status.savings) ? raw.status.savings : INITIAL_PLAYER_STATUS.savings,
      actionPower: Number.isFinite(raw.status.actionPower)
        ? raw.status.actionPower
        : INITIAL_PLAYER_STATUS.actionPower,
      fatigue: Number.isFinite(raw.status.fatigue) ? raw.status.fatigue : INITIAL_PLAYER_STATUS.fatigue,
    },
    ownedPlaceTileIds: validOwnedIds,
    offworkRewardClaimCount:
      Number.isFinite(raw.offworkRewardClaimCount) && raw.offworkRewardClaimCount >= 0
        ? Math.floor(raw.offworkRewardClaimCount)
        : 0,
    rewardPlaceTiles: migratedRewardTiles,
    hasPassedThroughStreet: Boolean((raw as Partial<PlayerProgress>).hasPassedThroughStreet),
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

function randomRoadRow(): [number, number, number] {
  const row: [number, number, number] = [
    Math.random() > 0.5 ? 1 : 0,
    Math.random() > 0.5 ? 1 : 0,
    Math.random() > 0.5 ? 1 : 0,
  ];
  if (row[0] + row[1] + row[2] === 0) {
    const forcedIndex = Math.floor(Math.random() * 3);
    row[forcedIndex] = 1;
  }
  return row;
}

function randomAnyRow(): [number, number, number] {
  return [
    Math.random() > 0.5 ? 1 : 0,
    Math.random() > 0.5 ? 1 : 0,
    Math.random() > 0.5 ? 1 : 0,
  ];
}

export function generateOffworkRewardPattern(isFirstClaim: boolean): TilePattern3x3 {
  if (isFirstClaim) return FIRST_OFFWORK_REWARD_PATTERN;
  // Requirement: row 1 and row 3 must contain road cells.
  return [randomRoadRow(), randomAnyRow(), randomRoadRow()];
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

