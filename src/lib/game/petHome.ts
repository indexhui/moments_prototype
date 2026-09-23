import type { PlayerProgress } from "./playerProgress";

// Deliberately separate from story saves, inventory, currency and chapter completion.
export const PET_HOME_STORAGE_KEY = "moment:pet-home:v1";
export const PET_HOME_CHANGE_EVENT = "moment:pet-home-changed";
export const PET_HOME_PATH = "/game/pet-home";
export const CARE_COOLDOWN = 20_000;
export const MAX_HOME_PHOTOS = 12;

export const HOME_PETS = [
  { id: "beigo", name: "小貝狗", image: "/images/lobby/beigo_idle.png", description: "只要待在一起，就是很好的日子。", chapter: "初始夥伴", favorite: "cushion" },
  { id: "naotaro", name: "黃金獵犬", image: "/images/428出圖/拍照動物/黃金獵犬.png", description: "看到喜歡的東西，尾巴總是先回答。", chapter: "黃金獵犬篇", favorite: "ball" },
  { id: "frog", name: "雨呱", image: "/images/animals/青蛙.png", description: "找到一小片水，就能待上整個下午。", chapter: "青蛙篇", favorite: "pond" },
] as const;
export type HomePetId = (typeof HOME_PETS)[number]["id"];
export type HomePose = "idle" | "pet" | "feed" | "play" | "rest" | "sniff";
export type CareAction = "pet" | "feed" | "play";

export const HOME_FURNITURE = [
  { id: "cushion", name: "奶油坐墊", note: "軟軟的，剛好窩成一團。", price: 0, source: "starter", x: 29, y: 76, pose: "rest" },
  { id: "bowl", name: "小花食盆", note: "一起慢慢吃點心。", price: 0, source: "starter", x: 72, y: 85, pose: "feed" },
  { id: "plant", name: "窗邊綠意", note: "湊近聞聞今天的陽光。", price: 0, source: "starter", x: 84, y: 61, pose: "sniff" },
  { id: "books", name: "午後繪本", note: "翻到有你的那一頁。", price: 20, source: "hearts", x: 19, y: 60, pose: "rest" },
  { id: "lamp", name: "晚安小燈", note: "為晚歸的你留一盞燈。", price: 35, source: "hearts", x: 77, y: 58, pose: "rest" },
  { id: "mat", name: "野餐小毯", note: "在家也能過一個小週末。", price: 25, source: "hearts", x: 51, y: 81, pose: "play" },
  { id: "ball", name: "獵犬的皮球", note: "黃金獵犬篇收藏，或生活大禮包。", price: 0, source: "naotaro", x: 58, y: 72, pose: "play" },
  { id: "pond", name: "雨呱的小池", note: "青蛙篇收藏，或生活大禮包。", price: 0, source: "frog", x: 35, y: 83, pose: "sniff" },
] as const;
export type FurnitureId = (typeof HOME_FURNITURE)[number]["id"];
export type HomePlacement = { id: FurnitureId; x: number; y: number };
export type HomePhoto = { id: string; petId: HomePetId; caption: string; createdAt: number; image: string };
export type PetHomeState = {
  version: 1;
  selectedPet: HomePetId;
  hearts: number;
  purchases: { story: boolean; bundle: boolean };
  ownedFurniture: FurnitureId[];
  placements: HomePlacement[];
  bonds: Record<HomePetId, number>;
  careAt: Partial<Record<`${HomePetId}:${CareAction}`, number>>;
  photos: HomePhoto[];
  memories: string[];
  // null denotes a legacy save: preserve its previously visible companions.
  residents: HomePetId[] | null;
  invitations: Partial<Record<HomePetId, number>>;
  requests: Partial<Record<HomePetId, { done: string[]; round: number; claimedAt: number }>>;
};

export function createPetHomeState(): PetHomeState {
  return {
    version: 1, selectedPet: "beigo", hearts: 30,
    purchases: { story: false, bundle: false },
    ownedFurniture: ["cushion", "bowl", "plant"],
    placements: HOME_FURNITURE.filter((item) => item.source === "starter").map(({ id, x, y }) => ({ id, x, y })),
    bonds: { beigo: 0, naotaro: 0, frog: 0 }, careAt: {}, photos: [], memories: [],
    residents: ["beigo"], invitations: {}, requests: {},
  };
}

export function hasStoryPet(progress: PlayerProgress, id: HomePetId): boolean {
  if (id === "beigo") return true;
  if (id === "naotaro") {
    return progress.hasSeenSunbeastFirstReveal || progress.lastDogPhotoCapture !== null ||
      (progress.sunbeastPhotoCapturesById.naotaro?.length ?? 0) >= 1;
  }
  // A clue photo is not the same as having collected the frog.
  return (progress.sunbeastPhotoCapturesById.frog?.length ?? 0) >= 3 ||
    (progress.hasCompletedStreetForgotLunchFrogEvent && progress.unlockedDiaryEntryIds.includes("bai-entry-2"));
}

export function canInvitePet(state: PetHomeState, progress: PlayerProgress, id: HomePetId): boolean {
  return id === "beigo" || state.purchases.bundle || (state.purchases.story && hasStoryPet(progress, id));
}

export function residentPets(state: PetHomeState, progress: PlayerProgress): HomePetId[] {
  return HOME_PETS.filter(pet => (state.residents === null || state.residents.includes(pet.id)) && canInvitePet(state, progress, pet.id)).map(pet => pet.id);
}

export function ownsFurniture(state: PetHomeState, progress: PlayerProgress, id: FurnitureId): boolean {
  const item = HOME_FURNITURE.find((entry) => entry.id === id)!;
  if (item.source === "naotaro" || item.source === "frog") return canInvitePet(state, progress, item.source);
  return state.purchases.bundle || item.source === "starter" || (state.purchases.story && state.ownedFurniture.includes(id));
}

export function homePetLockReason(state: PetHomeState, progress: PlayerProgress, id: HomePetId): string {
  if (canInvitePet(state, progress, id)) return state.purchases.bundle && id !== "beigo" ? "生活大禮包" : id === "beigo" ? "一直陪著你" : "主線收藏";
  if (state.purchases.story) return "在主線中完成收集後入住";
  return hasStoryPet(progress, id) ? "已在主線遇見・需主線收藏權" : "主線收集，或生活大禮包";
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const validPet = (id: unknown): id is HomePetId => HOME_PETS.some((pet) => pet.id === id);
const validFurniture = (id: unknown): id is FurnitureId => HOME_FURNITURE.some((item) => item.id === id);

export function normalizePetHome(value: unknown): PetHomeState {
  const initial = createPetHomeState();
  if (!value || typeof value !== "object" || Array.isArray(value)) return initial;
  const raw = value as Partial<PetHomeState>;
  if (raw.version !== 1) return initial;
  const state: PetHomeState = {
    ...initial,
    selectedPet: validPet(raw.selectedPet) ? raw.selectedPet : "beigo",
    hearts: typeof raw.hearts === "number" && Number.isFinite(raw.hearts) ? clamp(Math.floor(raw.hearts), 0, 9999) : initial.hearts,
    purchases: { story: raw.purchases?.story === true, bundle: raw.purchases?.bundle === true },
    ownedFurniture: [...new Set([...initial.ownedFurniture, ...(Array.isArray(raw.ownedFurniture) ? raw.ownedFurniture.filter(validFurniture) : [])])],
    placements: [],
    photos: Array.isArray(raw.photos) ? raw.photos.filter((photo) => photo && typeof photo.id === "string" && validPet(photo.petId) && typeof photo.caption === "string" && Number.isFinite(photo.createdAt) && typeof photo.image === "string" && photo.image.startsWith("data:image/jpeg;base64,") && photo.image.length < 220000).slice(0, MAX_HOME_PHOTOS) : [],
    memories: Array.isArray(raw.memories) ? [...new Set(raw.memories.filter((entry): entry is string => typeof entry === "string"))].slice(0, 100) : [],
    residents: Array.isArray(raw.residents) ? [...new Set<HomePetId>(["beigo", ...raw.residents.filter(validPet)])] : null,
    invitations: {}, requests: {},
  };
  for (const pet of HOME_PETS) {
    const invitation = raw.invitations?.[pet.id];
    if (typeof invitation === "number" && Number.isFinite(invitation) && invitation >= 0) state.invitations[pet.id] = invitation;
    const request = raw.requests?.[pet.id];
    if (request && Array.isArray(request.done)) state.requests[pet.id] = {
      done: [...new Set(request.done.filter((id): id is string => typeof id === "string" && /^(pet|feed|play|decor:(rest|pond))$/.test(id)))],
      round: Number.isFinite(request.round) ? clamp(Math.floor(request.round), 0, 9999) : 0,
      claimedAt: Number.isFinite(request.claimedAt) ? Math.max(0, request.claimedAt) : 0,
    };
    const bond = raw.bonds?.[pet.id];
    state.bonds[pet.id] = typeof bond === "number" && Number.isFinite(bond) ? clamp(bond, 0, 100) : 0;
    for (const action of ["pet", "feed", "play"] as const) {
      const key = `${pet.id}:${action}` as const;
      const time = raw.careAt?.[key];
      if (typeof time === "number" && Number.isFinite(time) && time >= 0) state.careAt[key] = time;
    }
  }
  if (Array.isArray(raw.placements)) {
    for (const item of raw.placements) {
      if (item && validFurniture(item.id) && Number.isFinite(item.x) && Number.isFinite(item.y) && !state.placements.some((entry) => entry.id === item.id)) {
        state.placements.push({ id: item.id, x: clamp(item.x, 13, 87), y: clamp(item.y, 55, 89) });
      }
    }
  } else state.placements = initial.placements;
  state.placements = state.placements.slice(0, 5);
  return state;
}

export function readPetHome(): PetHomeState {
  try { return normalizePetHome(JSON.parse(window.localStorage.getItem(PET_HOME_STORAGE_KEY) ?? "null")); }
  catch { return createPetHomeState(); }
}

export function savePetHome(state: PetHomeState): boolean {
  try {
    window.localStorage.setItem(PET_HOME_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(PET_HOME_CHANGE_EVENT));
    return true;
  } catch { return false; }
}

export type HomeAction =
  | { type: "purchase"; product: "story" | "bundle" }
  | { type: "invite"; pet: HomePetId }
  | { type: "care"; action: CareAction; now: number }
  | { type: "buy-furniture"; id: FurnitureId }
  | { type: "place"; id: FurnitureId }
  | { type: "move"; id: FurnitureId; x: number; y: number }
  | { type: "remove"; id: FurnitureId }
  | { type: "photo"; photo: HomePhoto }
  | { type: "delete-photo"; id: string }
  | { type: "memory"; id: string };

export function applyHomeAction(state: PetHomeState, progress: PlayerProgress, action: HomeAction): { state: PetHomeState; message: string; ok: boolean } {
  if (state.residents === null) state = { ...state, residents: residentPets(state, progress) };
  const reject = (message: string) => ({ state, message, ok: false });
  const accept = (next: PetHomeState, message: string) => ({ state: next, message, ok: true });
  switch (action.type) {
    case "purchase":
      if (state.purchases[action.product]) return reject("已經擁有這份內容了。");
      return accept({ ...state, purchases: { ...state.purchases, [action.product]: true } }, "收藏權已開啟，到入住簿替新夥伴準備喜歡的角落吧。");
    case "invite":
      if (!residentPets(state, progress).includes(action.pet)) return reject("先在入住簿迎接這位夥伴。");
      return accept({ ...state, selectedPet: action.pet }, "今天就一起待在家吧。");
    case "care": {
      if (!residentPets(state, progress).includes(state.selectedPet)) return reject("先邀請已解鎖的夥伴入住。");
      const key = `${state.selectedPet}:${action.action}` as const;
      if (!Number.isFinite(action.now) || action.now - (state.careAt[key] ?? 0) < CARE_COOLDOWN) return reject("剛剛的心意收到了，讓牠慢慢享受一下。");
      return accept({ ...state, hearts: Math.min(9999, state.hearts + 3), bonds: { ...state.bonds, [state.selectedPet]: Math.min(100, state.bonds[state.selectedPet] + 8) }, careAt: { ...state.careAt, [key]: action.now } }, "親密度 +8 · 心意 +3");
    }
    case "buy-furniture": {
      const item = HOME_FURNITURE.find((entry) => entry.id === action.id)!;
      if (ownsFurniture(state, progress, action.id)) return reject("這件家具已經在你的收藏裡。");
      if (item.source !== "hearts") return reject("這是主線收藏或生活大禮包的家具。");
      if (!state.purchases.story) return reject("取得主線收藏權後，就能用心意添置；大禮包也包含這件家具。");
      if (state.hearts < item.price) return reject("心意還不夠，和夥伴相處就能慢慢累積。");
      return accept({ ...state, hearts: state.hearts - item.price, ownedFurniture: [...state.ownedFurniture, action.id] }, `收下了${item.name}，把它放進家裡吧。`);
    }
    case "place": {
      if (!ownsFurniture(state, progress, action.id)) return reject("先取得這件家具。");
      if (state.placements.some((item) => item.id === action.id)) return reject("已經擺好了，可以拖曳換個位置。");
      if (state.placements.length >= 5) return reject("房間先放五件就好，收起一件再試試。");
      const { id, x, y } = HOME_FURNITURE.find((item) => item.id === action.id)!;
      return accept({ ...state, placements: [...state.placements, { id, x, y }] }, "擺好了！點家具，看看夥伴會怎麼用。");
    }
    case "move":
      if (!Number.isFinite(action.x) || !Number.isFinite(action.y)) return reject("請把家具放在房間裡。");
      return accept({ ...state, placements: state.placements.map((item) => item.id === action.id ? { ...item, x: clamp(action.x, 13, 87), y: clamp(action.y, 55, 89) } : item) }, "換個位置，也換個心情。");
    case "remove": return accept({ ...state, placements: state.placements.filter((item) => item.id !== action.id) }, "收到家具收藏裡了。");
    case "photo":
      if (state.photos.length >= MAX_HOME_PHOTOS) return reject("相簿已滿，先刪除一張再拍吧。");
      if (!canInvitePet(state, progress, action.photo.petId) || !action.photo.image.startsWith("data:image/jpeg;base64,")) return reject("照片還沒準備好，再試一次。");
      return accept({ ...state, photos: [action.photo, ...state.photos] }, "這個小日常，留在相簿裡了。");
    case "delete-photo": return accept({ ...state, photos: state.photos.filter((photo) => photo.id !== action.id) }, "照片已從相簿移除。");
    case "memory":
      if (state.memories.includes(action.id)) return reject("");
      return accept({ ...state, memories: [...state.memories, action.id].slice(-100), hearts: Math.min(9999, state.hearts + 5) }, "發現新的生活片刻 · 心意 +5");
  }
}
