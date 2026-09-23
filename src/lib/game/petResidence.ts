import { canInvitePet, HOME_PETS, residentPets, type HomePetId, type PetHomeState } from "./petHome";
import { canUseDecoration, type DecorId, type ForestState } from "./petForest";
import type { PlayerProgress } from "./playerProgress";

export const ARRIVAL_DELAY = 8_000;
export const REQUEST_BREAK = 60_000;
export const RESIDENCE = {
  beigo: { room: "陽光小角落", number: "01", note: "有你在，這裡就是家。", benefit: "一起煮蔬菜湯、收集相處的心意", needs: ["rest", "bowl"] },
  naotaro: { room: "暖暖午睡角", number: "02", note: "想帶著皮球，來你家住一陣子。", benefit: "入住後可經營花香茶屋", needs: ["rest", "ball"] },
  frog: { room: "窗邊水庭院", number: "03", note: "如果有小池和植物，我想留下來。", benefit: "水邊玩耍、專屬生活小約定", needs: ["plant", "pond"] },
} as const;
export type RequestStep = "feed" | "pet" | "play" | "decor:rest" | "decor:pond";
export const RESIDENT_REQUESTS: Record<HomePetId, { title: string; note: string; steps: { id: RequestStep; label: string }[] }> = {
  beigo: { title: "暖暖的午後", note: "吃一口點心，再靠著你待一下。", steps: [{ id: "feed", label: "餵一口點心" }, { id: "pet", label: "摸摸頭" }] },
  naotaro: { title: "跑累了就一起休息", note: "陪我玩球，再到懶骨頭窩一下吧。", steps: [{ id: "play", label: "一起玩皮球" }, { id: "decor:rest", label: "到懶骨頭休息" }] },
  frog: { title: "噗通，水邊下午茶", note: "先玩一下水，再吃喜歡的小點心。", steps: [{ id: "decor:pond", label: "到小池玩水" }, { id: "feed", label: "餵一口點心" }] },
};
export function residenceStatus(home: PetHomeState, forest: ForestState, story: PlayerProgress, pet: HomePetId, now: number) {
  const resident = residentPets(home, story).includes(pet);
  const unlocked = canInvitePet(home, story, pet);
  const needs = RESIDENCE[pet].needs.map(id => ({ id: id as DecorId, placed: forest.decorations.some(item => item.id === id) && canUseDecoration(home, story, id) }));
  const invitedAt = home.invitations[pet];
  const invited = typeof invitedAt === "number";
  const seconds = invited ? Math.max(0, Math.ceil((invitedAt + ARRIVAL_DELAY - now) / 1000)) : 0;
  return { resident, unlocked, needs, prepared: needs.every(item => item.placed), invited, seconds, arrived: invited && seconds === 0 };
}
export function residentRequest(home: PetHomeState, pet: HomePetId, now: number) {
  const definition = RESIDENT_REQUESTS[pet];
  const saved = home.requests[pet] ?? { done: [], round: 0, claimedAt: 0 };
  const seconds = saved.round ? Math.max(0, Math.ceil((saved.claimedAt + REQUEST_BREAK - now) / 1000)) : 0;
  const done = definition.steps.filter(step => saved.done.includes(step.id));
  return { ...definition, ...saved, seconds, complete: done.length === definition.steps.length, count: done.length, next: definition.steps.find(step => !saved.done.includes(step.id)) };
}
// Called only once an on-screen interaction has finished, never on its initial tap.
export function recordResidentMoment(home: PetHomeState, story: PlayerProgress, pet: HomePetId, step: string, now: number): PetHomeState {
  const request = residentRequest(home, pet, now);
  if (!residentPets(home, story).includes(pet) || !Number.isFinite(now) || request.seconds || request.done.includes(step) || !request.steps.some(item => item.id === step)) return home;
  return { ...home, requests: { ...home.requests, [pet]: { done: [...request.done, step], round: request.round, claimedAt: request.claimedAt } } };
}
export type ResidenceAction = { type: "send-invitation" | "check-in" | "claim-request"; pet: HomePetId; now: number };
export function applyResidence(home: PetHomeState, forest: ForestState, story: PlayerProgress, action: ResidenceAction): { ok: boolean; state: PetHomeState; message: string } {
  const reject = (message: string) => ({ ok: false, state: home, message });
  const accept = (state: PetHomeState, message: string) => ({ ok: true, state, message });
  if (!Number.isFinite(action.now) || action.now < 0) return reject("等一下再試試。");
  const status = residenceStatus(home, forest, story, action.pet, action.now);
  const name = HOME_PETS.find(pet => pet.id === action.pet)!.name;
  if (!status.unlocked) return reject("完成主線收集並擁有主線收藏權，或透過生活大禮包邀請。");
  if (action.type === "claim-request") {
    const request = residentRequest(home, action.pet, action.now);
    if (!status.resident || !request.complete || request.seconds) return reject("陪夥伴完成小約定，再來收下謝禮吧。");
    return accept({ ...home, hearts: Math.min(9999, home.hearts + 8), bonds: { ...home.bonds, [action.pet]: Math.min(100, home.bonds[action.pet] + 4) }, requests: { ...home.requests, [action.pet]: { done: [], round: request.round + 1, claimedAt: action.now } } }, `${name}的謝禮 · 心意 +8 · 親密 +4`);
  }
  if (status.resident) return reject("這位夥伴已經入住了。");
  if (!status.prepared) return reject("先把牠喜歡的東西擺進小屋，再迎接牠吧。");
  if (action.type === "send-invitation") {
    if (status.invited) return reject("邀請已經送到了，牠正在過來。");
    return accept({ ...home, residents: residentPets(home, story), invitations: { ...home.invitations, [action.pet]: action.now } }, `邀請已寄出，${name}準備來你家了。`);
  }
  if (!status.arrived) return reject("夥伴還在路上，稍等一下。");
  const invitations = { ...home.invitations }; delete invitations[action.pet];
  return accept({ ...home, residents: [...residentPets(home, story), action.pet], invitations, selectedPet: action.pet, memories: [...new Set([...home.memories, `welcome:${action.pet}`])].slice(-100) }, `${name}入住了！從今天起，一起過小日子。`);
}
