import { residentPets, ownsFurniture, type FurnitureId, type HomePetId, type PetHomeState } from "./petHome";
import type { PlayerProgress } from "./playerProgress";

export const FOREST_KEY = "moment:pet-forest:v2";
export const FOREST_EVENT = "moment:pet-forest-changed";
export const MAX_OFFLINE_MS = 2 * 60 * 60 * 1000;
export const FOREST_STATIONS = [
  { id: "soup", name: "咕嘟蔬菜湯", product: "暖暖蔬菜湯", pet: "beigo", interval: 10000, value: 6, cost: 0, image: "/images/pet-home/soup-v3.png", description: "小貝狗慢慢攪拌，把今天的陽光煮進湯裡。" },
  { id: "tea", name: "花香茶屋", product: "蜂蜜花草茶", pet: "naotaro", interval: 14000, value: 10, cost: 80, image: "/images/pet-home/tea-v3.png", description: "黃金獵犬的拿手花草茶，配上一點點蜂蜜。" },
] as const;
export type StationId = (typeof FOREST_STATIONS)[number]["id"];
export type DecorId = FurnitureId | "rest";
export type ForestPlacement = { id: DecorId; x: number; y: number };
export type ForestStation = { level: number; collectedAt: number; x: number; y: number };
export type ForestState = {
  version: 2; coins: number; sold: number; collected: number;
  stations: Record<StationId, ForestStation>; decorations: ForestPlacement[];
  claimedTasks: string[];
};
export const FOREST_TASKS = [
  { id: "first-soup", title: "第一碗，暖暖的", detail: "領取一次料理收入", reward: 20 },
  { id: "upgrade", title: "讓香氣多留一會", detail: "將湯鍋升到 Lv.2", reward: 35 },
  { id: "tea-time", title: "多一位，好熱鬧", detail: "建造花香茶屋", reward: 50 },
] as const;
export function createForest(now = Date.now()): ForestState {
  return { version: 2, coins: 40, sold: 0, collected: 0, claimedTasks: [],
    stations: { soup: { level: 1, collectedAt: now, x: 34, y: 39 }, tea: { level: 0, collectedAt: now, x: 71, y: 53 } },
    decorations: [{ id: "rest", x: 40, y: 70 }, { id: "plant", x: 74, y: 30 }, { id: "bowl", x: 20, y: 56 }],
  };
}
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const number = (n: unknown, fallback: number, min: number, max: number) => typeof n === "number" && Number.isFinite(n) ? clamp(n, min, max) : fallback;
const decorIds: DecorId[] = ["rest", "cushion", "bowl", "plant", "books", "lamp", "mat", "ball", "pond"];
export function normalizeForest(raw: unknown, now = Date.now()): ForestState {
  const initial = createForest(now);
  if (!raw || typeof raw !== "object" || (raw as ForestState).version !== 2) return initial;
  const value = raw as Partial<ForestState>;
  const state = { ...initial, coins: Math.floor(number(value.coins, 40, 0, 999999)), sold: Math.floor(number(value.sold, 0, 0, 9999999)), collected: Math.floor(number(value.collected, 0, 0, 999999)) };
  for (const { id } of FOREST_STATIONS) {
    const station = value.stations?.[id];
    state.stations[id] = { level: Math.floor(number(station?.level, initial.stations[id].level, id === "soup" ? 1 : 0, 5)), collectedAt: number(station?.collectedAt, now, 0, now), x: number(station?.x, initial.stations[id].x, 18, 82), y: number(station?.y, initial.stations[id].y, 30, 75) };
  }
  if (Array.isArray(value.decorations)) {
    const ids = new Set<DecorId>();
    state.decorations = value.decorations.filter(item => item && decorIds.includes(item.id) && !ids.has(item.id) && !!ids.add(item.id)).slice(0, 6).map(item => ({ id: item.id, x: number(item.x, 50, 15, 85), y: number(item.y, 65, 28, 79) }));
  }
  state.claimedTasks = Array.isArray(value.claimedTasks) ? [...new Set(value.claimedTasks.filter(id => FOREST_TASKS.some(task => task.id === id)))] : [];
  return state;
}
export function readForest(): ForestState {
  try { return normalizeForest(JSON.parse(localStorage.getItem(FOREST_KEY) ?? "null")); }
  catch { return createForest(); }
}
export function saveForest(state: ForestState): boolean {
  try { localStorage.setItem(FOREST_KEY, JSON.stringify(state)); window.dispatchEvent(new Event(FOREST_EVENT)); return true; }
  catch { return false; }
}
export function stationYield(station: ForestStation, id: StationId, now: number) {
  const definition = FOREST_STATIONS.find(item => item.id === id)!;
  const elapsed = Math.min(MAX_OFFLINE_MS, Math.max(0, now - station.collectedAt));
  const count = station.level ? Math.floor(elapsed / definition.interval) : 0;
  return { count, coins: count * definition.value * station.level, progress: elapsed % definition.interval / definition.interval, seconds: Math.ceil((definition.interval - elapsed % definition.interval) / 1000) };
}
export const upgradeCost = (level: number) => 40 * level * level;
export const canUseDecoration = (home: PetHomeState, story: PlayerProgress, id: DecorId) => id === "rest" || ownsFurniture(home, story, id);
export function taskComplete(state: ForestState, id: string) {
  return id === "first-soup" ? state.collected > 0 : id === "upgrade" ? state.stations.soup.level >= 2 : id === "tea-time" && state.stations.tea.level > 0;
}
export type ForestAction =
  | { type: "collect"; id: StationId; now: number }
  | { type: "build"; id: StationId; now: number }
  | { type: "upgrade"; id: StationId; now: number }
  | { type: "task"; id: string }
  | { type: "place"; id: DecorId }
  | { type: "remove"; id: DecorId }
  | { type: "move"; id: DecorId | StationId; kind: "station" | "decoration"; x: number; y: number };
export function applyForest(state: ForestState, home: PetHomeState, story: PlayerProgress, action: ForestAction): { ok: boolean; state: ForestState; message: string } {
  const reject = (message: string) => ({ ok: false, state, message });
  const accept = (next: ForestState, message: string) => ({ ok: true, state: next, message });
  if (action.type === "collect" || action.type === "build" || action.type === "upgrade") {
    const definition = FOREST_STATIONS.find(item => item.id === action.id)!;
    const station = state.stations[action.id];
    if (!Number.isFinite(action.now) || action.now < station.collectedAt) return reject("讓料理慢慢準備一下。");
    if (!residentPets(home, story).includes(definition.pet as HomePetId)) return reject("先在入住簿迎接這位夥伴，牠會帶來新料理。");
    if (action.type === "build") {
      if (station.level) return reject("這個設施已經蓋好了。");
      if (state.coins < definition.cost) return reject("再賣一些料理，就能建造了。");
      return accept({ ...state, coins: state.coins - definition.cost, stations: { ...state.stations, [action.id]: { ...station, level: 1, collectedAt: action.now } } }, `${definition.name}開張了！`);
    }
    if (!station.level) return reject("先建造這個設施。");
    const output = stationYield(station, action.id, action.now);
    if (action.type === "collect") {
      if (!output.count) return reject("香氣正在慢慢醞釀，再等一下就好。");
      const nextTime = action.now - ((action.now - station.collectedAt) % definition.interval);
      return accept({ ...state, coins: Math.min(999999, state.coins + output.coins), sold: state.sold + output.count, collected: state.collected + 1, stations: { ...state.stations, [action.id]: { ...station, collectedAt: nextTime } } }, `送出 ${output.count} 份料理 · 小日幣 +${output.coins}`);
    }
    if (station.level >= 5) return reject("設施已經升到最高等級。");
    if (state.coins < upgradeCost(station.level)) return reject("小日幣還不夠，先收下料理收入吧。");
    // Settle accumulated dishes at the OLD value, then start the upgraded cycle.
    return accept({ ...state, coins: Math.min(999999, state.coins - upgradeCost(station.level) + output.coins), sold: state.sold + output.count, stations: { ...state.stations, [action.id]: { ...station, level: station.level + 1, collectedAt: action.now } } }, `升到 Lv.${station.level + 1} · 每份收入提高了${output.coins ? `，並收下 ${output.coins} 小日幣` : ""}`);
  }
  if (action.type === "task") {
    const task = FOREST_TASKS.find(item => item.id === action.id);
    if (!task || !taskComplete(state, action.id) || state.claimedTasks.includes(action.id)) return reject("這一頁還沒有新的獎勵。");
    return accept({ ...state, coins: Math.min(999999, state.coins + task.reward), claimedTasks: [...state.claimedTasks, action.id] }, `留下一頁日常 · 小日幣 +${task.reward}`);
  }
  if (action.type === "place") {
    if (!canUseDecoration(home, story, action.id)) return reject("先取得這件收藏。");
    if (state.decorations.some(item => item.id === action.id)) return reject("已經在小屋裡了。");
    if (state.decorations.length >= 6) return reject("先收起一件，留些空間給夥伴散步吧。");
    return accept({ ...state, decorations: [...state.decorations, { id: action.id, x: 60, y: 68 }] }, "擺好了，夥伴會過來看看。");
  }
  if (action.type === "remove") return accept({ ...state, decorations: state.decorations.filter(item => item.id !== action.id) }, "收進收藏裡了。");
  if (!Number.isFinite(action.x) || !Number.isFinite(action.y)) return reject("請放在地板上。");
  const position = { x: clamp(action.x, 18, 82), y: clamp(action.y, 30, 76) };
  if (action.kind === "station") {
    const id = action.id as StationId;
    if (!state.stations[id]?.level) return reject("先建造設施。");
    return accept({ ...state, stations: { ...state.stations, [id]: { ...state.stations[id], ...position } } }, "新的位置，新的風景。");
  }
  return accept({ ...state, decorations: state.decorations.map(item => item.id === action.id ? { ...item, ...position } : item) }, "新的位置，新的風景。");
}
