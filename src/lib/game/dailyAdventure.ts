import type { PlayerProgress, PlaceTileId } from "@/lib/game/playerProgress";
import { loadPlayerProgress, savePlayerProgress } from "@/lib/game/playerProgress";
import type { SunbeastId } from "@/lib/game/sunbeastRegistry";
import { SUNBEAST_REGISTRY } from "@/lib/game/sunbeastRegistry";

export type DailyAdventureModeId = "route-width" | "infinite-corner" | "metro-exit";
export type DailyAdventureCompanionId = "beigo" | SunbeastId;
export type DailyAdventureRecordKind = "text" | "comic" | "photo";
export type DailyAdventureLocationId = PlaceTileId;
export type DailyAdventureEdgeWidth = "narrow" | "wide";
export type DailyAdventureRouteWidthVariant =
  | "straight"
  | "wide-to-narrow"
  | "narrow-to-wide"
  | "wide-to-wide";
export type DailyAdventureRouteTileId =
  `${DailyAdventureLocationId}:${DailyAdventureRouteWidthVariant}`;

export type DailyAdventureRouteTile = {
  id: DailyAdventureRouteTileId;
  locationId: DailyAdventureLocationId;
  variant: DailyAdventureRouteWidthVariant;
  variantLabel: string;
  imagePath: string;
  topEdge: DailyAdventureEdgeWidth;
  bottomEdge: DailyAdventureEdgeWidth;
};

export type DailyAdventureLocation = {
  id: DailyAdventureLocationId;
  name: string;
  shortDescription: string;
  imagePath: string;
  tileImagePath: string;
  iconPath: string;
  accent: string;
};

export type DailyAdventureCompanion = {
  id: DailyAdventureCompanionId;
  name: string;
  role: string;
  imagePath: string;
  accent: string;
};

export type DailyAdventureStage = {
  id: number;
  title: string;
  subtitle: string;
  mode: DailyAdventureModeId;
  modeLabel: string;
  actionCost: number;
  slotCount: 1 | 2;
  startEdge: DailyAdventureEdgeWidth;
  endEdge: DailyAdventureEdgeWidth;
  firstClearRouteTileRewardId?: DailyAdventureRouteTileId;
  status: "ready" | "development";
};

export type DailyAdventureCollectedRecord = {
  id: string;
  kind: DailyAdventureRecordKind;
  title: string;
  description: string;
  locationId: DailyAdventureLocationId;
  companionId: DailyAdventureCompanionId;
  imagePath: string;
  collectedAt: string;
};

export type DailyAdventureRun = {
  stageId: number;
  companionId: DailyAdventureCompanionId;
  locationIds: DailyAdventureLocationId[];
  routeTileIds: DailyAdventureRouteTileId[];
  startedAt: string;
};

export type DailyAdventureResult = {
  stageId: number;
  record: DailyAdventureCollectedRecord;
  isNewRecord: boolean;
  coins: number;
  unlockedRouteTileId: DailyAdventureRouteTileId | null;
  completedAt: string;
};

export type DailyAdventureState = {
  version: 3;
  selectedCompanionId: DailyAdventureCompanionId;
  selectedLocationIds: DailyAdventureLocationId[];
  highestUnlockedStage: number;
  completedStageIds: number[];
  collectedRouteTileIds: DailyAdventureRouteTileId[];
  collectedRecords: DailyAdventureCollectedRecord[];
  runCount: number;
  activeRun: DailyAdventureRun | null;
  lastResult: DailyAdventureResult | null;
};

export const DAILY_ADVENTURE_STATE_CHANGE_EVENT = "moment:daily-adventure-state-change";
const DAILY_ADVENTURE_STORAGE_KEY = "moment:daily-adventure:v3";
const DAILY_ADVENTURE_ONBOARDING_SEEN_KEY = "moment:daily-adventure:onboarding-seen-v1";
const DAILY_ADVENTURE_CAPTURED_PHOTO_RECORD_PREFIX = "photo-capture:";
export const DAILY_ADVENTURE_TEST_ACTION_POWER = 100;

export const DAILY_ADVENTURE_ROUTE_WIDTH_IMAGES: Record<
  DailyAdventureLocationId,
  Partial<Record<DailyAdventureRouteWidthVariant, string>>
> = {
  street: {
    straight: "/images/route/route_new/straight_街道.png",
    "wide-to-narrow": "/images/route/route_new/wide_to_narrow_街道.png",
    "narrow-to-wide": "/images/route/route_new/narrow_to_wide_街道.png",
    "wide-to-wide": "/images/route/route_new/wide_to_wide_街道.png",
  },
  "metro-station": {
    straight: "/images/route/route_new/straight_捷運.png",
    "wide-to-narrow": "/images/route/route_new/wide_to_narrow_捷運.png",
    "narrow-to-wide": "/images/route/route_new/narrow_to_wide_捷運.png",
    "wide-to-wide": "/images/route/route_new/wide_to_wide_捷運.png",
  },
  "convenience-store": {
    straight: "/images/route/route_new/straight_超商.png",
    "wide-to-narrow": "/images/route/route_new/wide_to_narrow_超商.png",
    "narrow-to-wide": "/images/route/route_new/narrow_to_wide_超商.png",
    "wide-to-wide": "/images/route/route_new/wide_to_wide_超商.png",
  },
  "breakfast-shop": {
    straight: "/images/route/route_new/straight_早餐店.png",
    "wide-to-narrow": "/images/route/route_new/wide_to_narrow_早餐店.png",
    "narrow-to-wide": "/images/route/route_new/narrow_to_wide_早餐店.png",
    "wide-to-wide": "/images/route/route_new/wide_to_wide_早餐店.png",
  },
  park: {},
  "bus-stop": {
    straight: "/images/route/route_new/straight_公車.png",
  },
};

const DAILY_ADVENTURE_ROUTE_VARIANT_META: Record<
  DailyAdventureRouteWidthVariant,
  {
    label: string;
    topEdge: DailyAdventureEdgeWidth;
    bottomEdge: DailyAdventureEdgeWidth;
  }
> = {
  straight: { label: "直路", topEdge: "narrow", bottomEdge: "narrow" },
  "wide-to-narrow": { label: "寬轉窄", topEdge: "wide", bottomEdge: "narrow" },
  "narrow-to-wide": { label: "窄轉寬", topEdge: "narrow", bottomEdge: "wide" },
  "wide-to-wide": { label: "寬路", topEdge: "wide", bottomEdge: "wide" },
};

export const DAILY_ADVENTURE_ROUTE_TILES = Object.fromEntries(
  (Object.entries(DAILY_ADVENTURE_ROUTE_WIDTH_IMAGES) as Array<[
    DailyAdventureLocationId,
    Partial<Record<DailyAdventureRouteWidthVariant, string>>,
  ]>).flatMap(([locationId, images]) =>
    (Object.entries(images) as Array<[DailyAdventureRouteWidthVariant, string]>).map(
      ([variant, imagePath]) => {
        const id = `${locationId}:${variant}` as DailyAdventureRouteTileId;
        const meta = DAILY_ADVENTURE_ROUTE_VARIANT_META[variant];
        return [
          id,
          {
            id,
            locationId,
            variant,
            variantLabel: meta.label,
            imagePath,
            topEdge: meta.topEdge,
            bottomEdge: meta.bottomEdge,
          } satisfies DailyAdventureRouteTile,
        ];
      },
    ),
  ),
) as Partial<Record<DailyAdventureRouteTileId, DailyAdventureRouteTile>>;

export const DAILY_ADVENTURE_ROUTE_TILE_IDS = Object.keys(
  DAILY_ADVENTURE_ROUTE_TILES,
) as DailyAdventureRouteTileId[];

export const DAILY_ADVENTURE_ONBOARDING_ROUTE_TILE_IDS = [
  "metro-station:straight",
  "convenience-store:wide-to-narrow",
  "street:narrow-to-wide",
] as const satisfies readonly DailyAdventureRouteTileId[];

export const DAILY_ADVENTURE_STARTER_ROUTE_TILE_IDS = [
  ...DAILY_ADVENTURE_ONBOARDING_ROUTE_TILE_IDS,
] as const satisfies readonly DailyAdventureRouteTileId[];

export function getDailyAdventureRouteTilesForLocation(
  locationId: DailyAdventureLocationId,
  collectedRouteTileIds?: DailyAdventureRouteTileId[],
) {
  return DAILY_ADVENTURE_ROUTE_TILE_IDS
    .filter((id) => !collectedRouteTileIds || collectedRouteTileIds.includes(id))
    .map((id) => DAILY_ADVENTURE_ROUTE_TILES[id])
    .filter(
      (tile): tile is DailyAdventureRouteTile =>
        Boolean(tile && tile.locationId === locationId),
    );
}

export const DAILY_ADVENTURE_LOCATIONS: Record<
  DailyAdventureLocationId,
  DailyAdventureLocation
> = {
  street: {
    id: "street",
    name: "街道",
    shortDescription: "風聲、路人與意外的小插曲。",
    imagePath: "/images/street.jpg",
    tileImagePath: "/images/route/route_new/straight_街道.png",
    iconPath: "/images/icon/street.png",
    accent: "#D89A61",
  },
  "metro-station": {
    id: "metro-station",
    name: "捷運",
    shortDescription: "匆忙的腳步裡藏著不同相遇。",
    imagePath: "/images/mrt_01.jpg",
    tileImagePath: "/images/route/route_new/straight_捷運.png",
    iconPath: "/images/icon/mrt.png",
    accent: "#6F8F91",
  },
  "convenience-store": {
    id: "convenience-store",
    name: "便利商店",
    shortDescription: "買東西時總會聽見一些日常對話。",
    imagePath: "/images/outside/mart.jpg",
    tileImagePath: "/images/route/route_new/straight_超商.png",
    iconPath: "/images/icon/mart.png",
    accent: "#C27D5C",
  },
  "breakfast-shop": {
    id: "breakfast-shop",
    name: "早餐店",
    shortDescription: "熟客、香味和還沒說完的故事。",
    imagePath: "/images/breakfast.jpg",
    tileImagePath: "/images/route/route_new/straight_早餐店.png",
    iconPath: "/images/icon/breakfast.png",
    accent: "#DEA956",
  },
  park: {
    id: "park",
    name: "公園",
    shortDescription: "適合散步，也適合觀察小日獸。",
    imagePath: "/images/park.jpg",
    tileImagePath: "/images/route/mrt_exit/exit3_place_park.png",
    iconPath: "/images/icon/park.png",
    accent: "#759C72",
  },
  "bus-stop": {
    id: "bus-stop",
    name: "公車站",
    shortDescription: "短暫等待的人，各自有不同目的地。",
    imagePath: "/images/outside/bus.jpg",
    tileImagePath: "/images/route/route_new/straight_公車.png",
    iconPath: "/images/icon/road.png",
    accent: "#7587A2",
  },
};

export const DAILY_ADVENTURE_COMPANIONS: Record<
  DailyAdventureCompanionId,
  DailyAdventureCompanion
> = {
  beigo: {
    id: "beigo",
    name: "小貝狗",
    role: "總是願意陪你出門",
    imagePath: "/images/lobby/beigo_idle.png",
    accent: "#E3A177",
  },
  naotaro: {
    id: "naotaro",
    name: SUNBEAST_REGISTRY.naotaro.name,
    role: "容易遇見熱鬧的照片時刻",
    imagePath: SUNBEAST_REGISTRY.naotaro.imagePath,
    accent: "#E8B45B",
  },
  frog: {
    id: "frog",
    name: "雨呱",
    role: "常在尷尬的小事裡發現線索",
    imagePath: SUNBEAST_REGISTRY.frog.imagePath,
    accent: "#7AA97B",
  },
  koala: {
    id: "koala",
    name: "瓦那",
    role: "更容易遇見需要幫忙的人",
    imagePath: SUNBEAST_REGISTRY.koala.imagePath,
    accent: "#8E9C89",
  },
  chicken: {
    id: "chicken",
    name: "公雞小日獸",
    role: "會注意到城市裡細小的聲音",
    imagePath: SUNBEAST_REGISTRY.chicken.imagePath,
    accent: "#C97B62",
  },
  cat: {
    id: "cat",
    name: "貓小日獸",
    role: "喜歡繞去安靜又意外的角落",
    imagePath: SUNBEAST_REGISTRY.cat.imagePath,
    accent: "#8E829F",
  },
};

export const DAILY_ADVENTURE_STAGES: DailyAdventureStage[] = [
  {
    id: 1,
    title: "寬窄第一步",
    subtitle: "三個地點的接頭不同，選一塊接上起點與終點。",
    mode: "route-width",
    modeLabel: "寬窄接路",
    actionCost: 1,
    slotCount: 1,
    startEdge: "narrow",
    endEdge: "wide",
    firstClearRouteTileRewardId: "street:straight",
    status: "ready",
  },
  {
    id: 2,
    title: "街角第一步",
    subtitle: "讓相鄰轉彎一起旋轉，接上想去的地點。",
    mode: "route-width",
    modeLabel: "旋轉接路",
    actionCost: 1,
    slotCount: 1,
    startEdge: "narrow",
    endEdge: "wide",
    firstClearRouteTileRewardId: "convenience-store:straight",
    status: "ready",
  },
  {
    id: 3,
    title: "兩個停靠點",
    subtitle: "把收集到的地點排進同一趟冒險。",
    mode: "route-width",
    modeLabel: "寬窄接路",
    actionCost: 1,
    slotCount: 2,
    startEdge: "narrow",
    endEdge: "wide",
    firstClearRouteTileRewardId: "breakfast-shop:wide-to-narrow",
    status: "ready",
  },
  {
    id: 4,
    title: "回家的窄路",
    subtitle: "路線的方向改變了，重新安排地點順序。",
    mode: "route-width",
    modeLabel: "寬窄接路",
    actionCost: 1,
    slotCount: 2,
    startEdge: "wide",
    endEdge: "narrow",
    firstClearRouteTileRewardId: "street:narrow-to-wide",
    status: "ready",
  },
  {
    id: 5,
    title: "重複的轉角",
    subtitle: "同一塊轉彎拼圖可以一直使用，但旋轉有限。",
    mode: "infinite-corner",
    modeLabel: "無限轉彎",
    actionCost: 1,
    slotCount: 2,
    startEdge: "narrow",
    endEdge: "narrow",
    firstClearRouteTileRewardId: "bus-stop:straight",
    status: "ready",
  },
  {
    id: 6,
    title: "河畔前一站",
    subtitle: "用有限的旋轉次數找到另一條轉彎路線。",
    mode: "infinite-corner",
    modeLabel: "無限轉彎",
    actionCost: 1,
    slotCount: 2,
    startEdge: "narrow",
    endEdge: "narrow",
    firstClearRouteTileRewardId: "convenience-store:wide-to-narrow",
    status: "ready",
  },
  {
    id: 7,
    title: "捷運出口",
    subtitle: "接通機關與不同出口的探索型路網。",
    mode: "metro-exit",
    modeLabel: "捷運出口",
    actionCost: 1,
    slotCount: 2,
    startEdge: "narrow",
    endEdge: "narrow",
    status: "development",
  },
];

export const INITIAL_DAILY_ADVENTURE_STATE: DailyAdventureState = {
  version: 3,
  selectedCompanionId: "beigo",
  selectedLocationIds: ["metro-station"],
  highestUnlockedStage: 1,
  completedStageIds: [],
  collectedRouteTileIds: [...DAILY_ADVENTURE_STARTER_ROUTE_TILE_IDS],
  collectedRecords: [],
  runCount: 0,
  activeRun: null,
  lastResult: null,
};

const VALID_LOCATION_IDS = Object.keys(DAILY_ADVENTURE_LOCATIONS) as DailyAdventureLocationId[];
const VALID_COMPANION_IDS = Object.keys(DAILY_ADVENTURE_COMPANIONS) as DailyAdventureCompanionId[];
const VALID_RECORD_KINDS: DailyAdventureRecordKind[] = ["text", "comic", "photo"];

function uniqueValidLocations(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.filter(
        (item): item is DailyAdventureLocationId =>
          typeof item === "string" && VALID_LOCATION_IDS.includes(item as DailyAdventureLocationId),
      ),
    ),
  );
}

function uniqueValidRouteTileIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.filter(
        (item): item is DailyAdventureRouteTileId =>
          typeof item === "string" &&
          DAILY_ADVENTURE_ROUTE_TILE_IDS.includes(item as DailyAdventureRouteTileId),
      ),
    ),
  );
}

function normalizeRecord(value: unknown): DailyAdventureCollectedRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<DailyAdventureCollectedRecord>;
  if (
    typeof record.id !== "string" ||
    !record.kind ||
    !VALID_RECORD_KINDS.includes(record.kind) ||
    !record.locationId ||
    !VALID_LOCATION_IDS.includes(record.locationId) ||
    !record.companionId ||
    !VALID_COMPANION_IDS.includes(record.companionId) ||
    typeof record.title !== "string" ||
    typeof record.description !== "string" ||
    typeof record.imagePath !== "string"
  ) {
    return null;
  }
  return {
    id: record.id,
    kind: record.kind,
    title: record.title,
    description: record.description,
    locationId: record.locationId,
    companionId: record.companionId,
    imagePath: record.imagePath,
    collectedAt: typeof record.collectedAt === "string" ? record.collectedAt : new Date(0).toISOString(),
  };
}

function normalizeState(value: unknown): DailyAdventureState {
  if (!value || typeof value !== "object") return INITIAL_DAILY_ADVENTURE_STATE;
  const state = value as Partial<DailyAdventureState>;
  const selectedCompanionId =
    state.selectedCompanionId && VALID_COMPANION_IDS.includes(state.selectedCompanionId)
      ? state.selectedCompanionId
      : "beigo";
  const collectedRouteTileIds = uniqueValidRouteTileIds(state.collectedRouteTileIds);
  INITIAL_DAILY_ADVENTURE_STATE.collectedRouteTileIds.forEach((id) => {
    if (!collectedRouteTileIds.includes(id)) collectedRouteTileIds.push(id);
  });
  const availableLocationIds = new Set(
    collectedRouteTileIds.flatMap((id) => {
      const tile = DAILY_ADVENTURE_ROUTE_TILES[id];
      return tile ? [tile.locationId] : [];
    }),
  );
  const selectedLocationIds = uniqueValidLocations(state.selectedLocationIds)
    .filter((id) => availableLocationIds.has(id))
    .slice(0, 2);
  const completedStageIds = Array.isArray(state.completedStageIds)
    ? Array.from(
        new Set(
          state.completedStageIds.filter(
            (id): id is number => Number.isInteger(id) && DAILY_ADVENTURE_STAGES.some((stage) => stage.id === id),
          ),
        ),
      )
    : [];
  const collectedRecords = Array.isArray(state.collectedRecords)
    ? state.collectedRecords
        .map(normalizeRecord)
        .filter((record): record is DailyAdventureCollectedRecord => record !== null)
    : [];
  const activeRun = (() => {
    if (!state.activeRun || typeof state.activeRun !== "object") return null;
    const run = state.activeRun as Partial<DailyAdventureRun>;
    if (
      !Number.isInteger(run.stageId) ||
      !DAILY_ADVENTURE_STAGES.some((stage) => stage.id === run.stageId) ||
      !run.companionId ||
      !VALID_COMPANION_IDS.includes(run.companionId)
    ) {
      return null;
    }
    const locationIds = uniqueValidLocations(run.locationIds);
    if (locationIds.length === 0) return null;
    const routeTileIds = uniqueValidRouteTileIds(run.routeTileIds).filter((id) => {
      const tile = DAILY_ADVENTURE_ROUTE_TILES[id];
      return Boolean(tile && locationIds.includes(tile.locationId));
    });
    if (routeTileIds.length === 0) return null;
    return {
      stageId: run.stageId!,
      companionId: run.companionId,
      locationIds,
      routeTileIds,
      startedAt: typeof run.startedAt === "string" ? run.startedAt : new Date().toISOString(),
    };
  })();

  return {
    version: 3,
    selectedCompanionId,
    selectedLocationIds: selectedLocationIds.length > 0 ? selectedLocationIds : ["metro-station"],
    highestUnlockedStage: Math.max(
      1,
      Math.min(
        DAILY_ADVENTURE_STAGES.length,
        Number.isFinite(state.highestUnlockedStage) ? Math.floor(state.highestUnlockedStage!) : 1,
      ),
    ),
    completedStageIds,
    collectedRouteTileIds,
    collectedRecords,
    runCount: Number.isFinite(state.runCount) ? Math.max(0, Math.floor(state.runCount!)) : 0,
    activeRun,
    lastResult: state.lastResult && typeof state.lastResult === "object"
      ? (state.lastResult as DailyAdventureResult)
      : null,
  };
}

export function loadDailyAdventureState(): DailyAdventureState {
  if (typeof window === "undefined") return INITIAL_DAILY_ADVENTURE_STATE;
  try {
    const raw = window.localStorage.getItem(DAILY_ADVENTURE_STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : INITIAL_DAILY_ADVENTURE_STATE;
  } catch {
    return INITIAL_DAILY_ADVENTURE_STATE;
  }
}

export function saveDailyAdventureState(state: DailyAdventureState) {
  if (typeof window === "undefined") return;
  const normalized = normalizeState(state);
  window.localStorage.setItem(DAILY_ADVENTURE_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(
    new CustomEvent(DAILY_ADVENTURE_STATE_CHANGE_EVENT, { detail: normalized }),
  );
}

export function grantDailyAdventureTestActionPower() {
  const progress = loadPlayerProgress();
  if (progress.status.actionPower >= DAILY_ADVENTURE_TEST_ACTION_POWER) return progress;
  const next: PlayerProgress = {
    ...progress,
    status: {
      ...progress.status,
      actionPower: DAILY_ADVENTURE_TEST_ACTION_POWER,
    },
  };
  savePlayerProgress(next);
  return next;
}

export function hasSeenDailyAdventureOnboarding() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(DAILY_ADVENTURE_ONBOARDING_SEEN_KEY) === "1";
}

export function markDailyAdventureOnboardingSeen() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DAILY_ADVENTURE_ONBOARDING_SEEN_KEY, "1");
}

function routeWidthVariantForEdges(
  topEdge: DailyAdventureEdgeWidth,
  bottomEdge: DailyAdventureEdgeWidth,
): DailyAdventureRouteWidthVariant {
  if (topEdge === "wide" && bottomEdge === "narrow") return "wide-to-narrow";
  if (topEdge === "narrow" && bottomEdge === "wide") return "narrow-to-wide";
  if (topEdge === "wide" && bottomEdge === "wide") return "wide-to-wide";
  return "straight";
}

export function canUseDailyAdventureLocationsInStage(
  stage: DailyAdventureStage,
  locationIds: DailyAdventureLocationId[],
  collectedRouteTileIds: DailyAdventureRouteTileId[],
) {
  if (stage.mode !== "route-width") return true;
  const usableTiles = collectedRouteTileIds
    .map((id) => DAILY_ADVENTURE_ROUTE_TILES[id])
    .filter(
      (tile): tile is DailyAdventureRouteTile =>
        Boolean(tile && locationIds.includes(tile.locationId)),
    );
  const effectiveSlotCount = Math.max(stage.slotCount, locationIds.length);
  if (effectiveSlotCount > 1) {
    return usableTiles.length > 0;
  }
  const requiredVariant = routeWidthVariantForEdges(stage.endEdge, stage.startEdge);
  return usableTiles.some((tile) => tile.variant === requiredVariant);
}

export function getDailyAdventureAvailableLocationIds(
  state: DailyAdventureState,
) {
  return Array.from(
    new Set<DailyAdventureLocationId>(
      state.collectedRouteTileIds.flatMap((id) => {
        const tile = DAILY_ADVENTURE_ROUTE_TILES[id];
        return tile ? [tile.locationId] : [];
      }),
    ),
  );
}

export function isDailyAdventureCompanionUnlocked(
  companionId: DailyAdventureCompanionId,
  progress: PlayerProgress,
) {
  if (companionId === "beigo") return true;
  if (progress.sunbeastPhotoCapturesById[companionId]?.length) return true;
  if (companionId === "naotaro") {
    return progress.hasSeenSunbeastFirstReveal || progress.lastDogPhotoCapture !== null;
  }
  if (companionId === "frog") {
    return progress.streetForgotLunchFrogPhotoAttemptCount > 0;
  }
  if (companionId === "koala") return progress.hasTriggeredOfficeSunbeastKoalaEvent;
  if (companionId === "chicken") return progress.hasTriggeredOfficeSunbeastChickenEvent;
  return progress.hasTriggeredBusSunbeastCatEvent;
}

export function updateDailyAdventureSelection(updates: {
  companionId?: DailyAdventureCompanionId;
  locationIds?: DailyAdventureLocationId[];
}) {
  const current = loadDailyAdventureState();
  const next: DailyAdventureState = {
    ...current,
    selectedCompanionId: updates.companionId ?? current.selectedCompanionId,
    selectedLocationIds: updates.locationIds
      ? uniqueValidLocations(updates.locationIds).slice(0, 2)
      : current.selectedLocationIds,
  };
  saveDailyAdventureState(next);
  return next;
}

export function beginDailyAdventureStage(stageId: number) {
  const state = loadDailyAdventureState();
  const stage = DAILY_ADVENTURE_STAGES.find((candidate) => candidate.id === stageId);
  if (!stage) return { ok: false as const, reason: "找不到這個冒險關卡。" };
  if (stage.status === "development") {
    return { ok: false as const, reason: "捷運出口模式仍在開發設計中。" };
  }
  if (stage.id > state.highestUnlockedStage) {
    return { ok: false as const, reason: "先完成前一個冒險關卡。" };
  }
  if (state.selectedLocationIds.length === 0) {
    return { ok: false as const, reason: "至少帶上一塊地點拼圖。" };
  }
  const runLocationIds =
    stage.id <= 2
      ? Array.from(
          new Set<DailyAdventureLocationId>(
            DAILY_ADVENTURE_ONBOARDING_ROUTE_TILE_IDS.flatMap((id) => {
              if (!state.collectedRouteTileIds.includes(id)) return [];
              const tile = DAILY_ADVENTURE_ROUTE_TILES[id];
              return tile ? [tile.locationId] : [];
            }),
          ),
        )
      : state.selectedLocationIds;
  const routeTileIds = state.collectedRouteTileIds.filter((id) => {
    const tile = DAILY_ADVENTURE_ROUTE_TILES[id];
    return Boolean(tile && runLocationIds.includes(tile.locationId));
  });
  if (
    !canUseDailyAdventureLocationsInStage(
      stage,
      runLocationIds,
      routeTileIds,
    )
  ) {
    return {
      ok: false as const,
      reason: "你收集的拼圖裡沒有這關需要的接頭，請更換地點或先收集其他拼圖。",
    };
  }
  if (state.activeRun?.stageId === stageId) {
    return { ok: true as const, state };
  }
  const progress = loadPlayerProgress();
  if (progress.status.actionPower < stage.actionCost) {
    return { ok: false as const, reason: "今天的體力不夠了。" };
  }
  savePlayerProgress({
    ...progress,
    status: {
      ...progress.status,
      actionPower: Math.max(0, progress.status.actionPower - stage.actionCost),
    },
  });
  const next: DailyAdventureState = {
    ...state,
    activeRun: {
      stageId,
      companionId: state.selectedCompanionId,
      locationIds: runLocationIds,
      routeTileIds,
      startedAt: new Date().toISOString(),
    },
    lastResult: null,
  };
  saveDailyAdventureState(next);
  return { ok: true as const, state: next };
}

const RECORD_COPY: Record<
  DailyAdventureLocationId,
  Record<DailyAdventureRecordKind, { title: string; description: string; imagePath?: string }>
> = {
  street: {
    text: { title: "風把招牌吹歪了", description: "你們停下來幫忙扶正，順便聽見店員今天的煩惱。" },
    comic: { title: "街角的三秒鐘", description: "一個差點錯過彼此的瞬間，被留在日常漫畫裡。", imagePath: "/images/comic/comic_market_street.png" },
    photo: { title: "街道散步照", description: "熟悉的街道因為同行的小日獸，留下了新的表情。" },
  },
  "metro-station": {
    text: { title: "下一班車", description: "等待的幾分鐘裡，你們猜起每個人正要去哪裡。" },
    comic: { title: "差點關上的車門", description: "匆忙又有點好笑的一幕，被畫成今天的漫畫格。", imagePath: "/images/mrt_01.jpg" },
    photo: { title: "月台紀念照", description: "列車進站前，剛好拍下了小日獸期待的樣子。" },
  },
  "convenience-store": {
    text: { title: "要不要加熱？", description: "一句普通的詢問，意外發展成有點尷尬的短對話。" },
    comic: { title: "找不到的零錢", description: "大家一起低頭找零錢的畫面，看起來像排練好的喜劇。", imagePath: "/images/outside/mart.jpg" },
    photo: { title: "便利商店門口", description: "提著小袋子的小日獸，在門口留下今天的合照。" },
  },
  "breakfast-shop": {
    text: { title: "老闆記得你", description: "老闆娘不只記得餐點，也記得你上次帶來的小日獸。" },
    comic: { title: "早餐香味的方向", description: "小日獸一路循著香味前進，形成一格完整的小故事。", imagePath: "/images/breakfast.jpg" },
    photo: { title: "早餐還沒涼", description: "趁餐點還熱著，先拍下今天一起吃早餐的證明。" },
  },
  park: {
    text: { title: "長椅另一端", description: "坐下休息後，一個陌生人分享了最近常來公園的理由。" },
    comic: { title: "追著葉子跑", description: "一片落葉讓小日獸繞了半座公園，成為今天的漫畫。", imagePath: "/images/park.jpg" },
    photo: { title: "公園的光", description: "樹影剛好落在身旁，拍出一張很像旅行紀念的照片。" },
  },
  "bus-stop": {
    text: { title: "還沒來的公車", description: "等待變得有點久，你們開始替經過的車取名字。" },
    comic: { title: "揮錯手了", description: "小日獸把路過的車當成公車，留下有點害羞的四格瞬間。", imagePath: "/images/outside/bus.jpg" },
    photo: { title: "站牌下的合照", description: "公車到站以前，風替照片加上了剛好的動態。" },
  },
};

function buildRecord(
  kind: DailyAdventureRecordKind,
  locationId: DailyAdventureLocationId,
  companionId: DailyAdventureCompanionId,
) {
  const copy = RECORD_COPY[locationId][kind];
  const companion = DAILY_ADVENTURE_COMPANIONS[companionId];
  return {
    id: kind === "photo" ? `${kind}:${locationId}:${companionId}` : `${kind}:${locationId}`,
    kind,
    title: copy.title,
    description:
      kind === "photo" ? `${copy.description} 同行的是${companion.name}。` : copy.description,
    locationId,
    companionId,
    imagePath: copy.imagePath ?? companion.imagePath,
    collectedAt: new Date().toISOString(),
  } satisfies DailyAdventureCollectedRecord;
}

export function isDailyAdventureCapturedPhotoRecord(record: DailyAdventureCollectedRecord) {
  return record.kind === "photo" && record.id.startsWith(DAILY_ADVENTURE_CAPTURED_PHOTO_RECORD_PREFIX);
}

export function recordDailyAdventureBeigoPhotoCapture(imagePath: string) {
  const state = loadDailyAdventureState();
  const result = state.lastResult;
  if (!result || result.stageId !== 1 || result.record.companionId !== "beigo") return result;
  const location = DAILY_ADVENTURE_LOCATIONS[result.record.locationId];
  const capturedAt = new Date().toISOString();
  const record: DailyAdventureCollectedRecord = {
    id: `${DAILY_ADVENTURE_CAPTURED_PHOTO_RECORD_PREFIX}${result.stageId}:${result.record.locationId}:beigo:${result.completedAt}`,
    kind: "photo",
    title: `${location.name}的小貝狗照片`,
    description: `在${location.name}的日常冒險場景裡，替小貝狗拍下今天一起走走的表情。`,
    locationId: result.record.locationId,
    companionId: "beigo",
    imagePath,
    collectedAt: capturedAt,
  };
  const existingRecordIndex = state.collectedRecords.findIndex((item) => item.id === record.id);
  const collectedRecords =
    existingRecordIndex >= 0
      ? state.collectedRecords.map((item, index) => (index === existingRecordIndex ? record : item))
      : [...state.collectedRecords, record];
  const updatedResult: DailyAdventureResult = {
    ...result,
    record,
    isNewRecord: existingRecordIndex < 0,
  };
  saveDailyAdventureState({
    ...state,
    collectedRecords,
    lastResult: updatedResult,
  });
  return updatedResult;
}

function weightedRecordKind() {
  const roll = Math.random();
  if (roll < 0.2) return "photo" as const;
  if (roll < 0.45) return "comic" as const;
  return "text" as const;
}

export function completeDailyAdventureRun(
  visitedLocationIds?: DailyAdventureLocationId[],
) {
  const state = loadDailyAdventureState();
  const run = state.activeRun;
  if (!run) return null;
  const stage = DAILY_ADVENTURE_STAGES.find((candidate) => candidate.id === run.stageId);
  if (!stage) return null;
  const validVisitedLocationIds = uniqueValidLocations(visitedLocationIds).filter((id) =>
    run.locationIds.includes(id),
  );
  const outcomeLocationIds =
    validVisitedLocationIds.length > 0 ? validVisitedLocationIds : run.locationIds;
  const locationId = outcomeLocationIds[state.runCount % outcomeLocationIds.length] ?? "street";
  const preferredKind = weightedRecordKind();
  const kinds: DailyAdventureRecordKind[] = [preferredKind, "photo", "comic", "text"];
  const uniqueKinds = Array.from(new Set(kinds));
  const record =
    uniqueKinds
      .map((kind) => buildRecord(kind, locationId, run.companionId))
      .find((candidate) => !state.collectedRecords.some((recordItem) => recordItem.id === candidate.id)) ??
    buildRecord(preferredKind, locationId, run.companionId);
  const isNewRecord = !state.collectedRecords.some((item) => item.id === record.id);
  const isFirstClear = !state.completedStageIds.includes(stage.id);
  const fixedFirstClearTileId =
    isFirstClear &&
    stage.firstClearRouteTileRewardId &&
    !state.collectedRouteTileIds.includes(stage.firstClearRouteTileRewardId)
      ? stage.firstClearRouteTileRewardId
      : null;
  const repeatDropCandidates = DAILY_ADVENTURE_ROUTE_TILE_IDS.filter((id) => {
    const tile = DAILY_ADVENTURE_ROUTE_TILES[id];
    return Boolean(
      tile &&
      run.locationIds.includes(tile.locationId) &&
      !state.collectedRouteTileIds.includes(id),
    );
  });
  const unlockedRouteTileId =
    fixedFirstClearTileId ??
    repeatDropCandidates[state.runCount % Math.max(1, repeatDropCandidates.length)] ??
    null;
  const coins = 18 + stage.id * 2;
  const completedAt = new Date().toISOString();
  const result: DailyAdventureResult = {
    stageId: stage.id,
    record,
    isNewRecord,
    coins,
    unlockedRouteTileId,
    completedAt,
  };
  const next: DailyAdventureState = {
    ...state,
    highestUnlockedStage: Math.min(
      DAILY_ADVENTURE_STAGES.length,
      Math.max(state.highestUnlockedStage, stage.id + 1),
    ),
    completedStageIds: Array.from(new Set([...state.completedStageIds, stage.id])),
    collectedRouteTileIds: unlockedRouteTileId
      ? Array.from(new Set([...state.collectedRouteTileIds, unlockedRouteTileId]))
      : state.collectedRouteTileIds,
    selectedLocationIds: state.selectedLocationIds,
    collectedRecords: isNewRecord ? [...state.collectedRecords, record] : state.collectedRecords,
    runCount: state.runCount + 1,
    activeRun: null,
    lastResult: result,
  };
  saveDailyAdventureState(next);
  const progress = loadPlayerProgress();
  savePlayerProgress({
    ...progress,
    status: {
      ...progress.status,
      savings: progress.status.savings + coins,
    },
  });
  return result;
}
