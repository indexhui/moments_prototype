import { CARE_COOLDOWN, HOME_PETS, type CareAction, type HomePetId, type PetHomeState } from "./petHome";
import type { DecorId, ForestState } from "./petForest";

export type RoomPoint = { x: number; y: number };
export type RoomActivityKind = CareAction | "rest" | "sniff" | "splash";
export type RoomActivity = {
  pet: HomePetId; kind: RoomActivityKind; startedAt: number;
  from: RoomPoint; to: RoomPoint; decor?: DecorId;
};
export const ACTIVITY_DURATION: Record<RoomActivityKind, number> = {
  pet: 1100, feed: 3600, play: 4500, rest: 5200, sniff: 3800, splash: 4400,
};
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export const keepOnFloor = (point: RoomPoint): RoomPoint => ({ x: clamp(point.x, 18, 82), y: clamp(point.y, 30, 76) });
export const isOnFloor = (point: RoomPoint) => Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 10 && point.x <= 90 && point.y >= 26 && point.y <= 82;
export function petWish(home: PetHomeState, pet: HomePetId, now: number): CareAction | null {
  const actions: CareAction[] = ["feed", "pet", "play"];
  const offset = Math.floor(home.bonds[pet] / 8) % actions.length;
  for (let i=0;i<actions.length;i++) {
    const action=actions[(i+offset)%actions.length];
    if (now-(home.careAt[`${pet}:${action}`]??0)>=CARE_COOLDOWN) return action;
  }
  return null;
}
export function idlePetPoint(pet: HomePetId, index: number, forest: ForestState, now: number) {
  const station=forest.stations[pet === "beigo" ? "soup" : "tea"];
  const rest=forest.decorations.find(item=>item.id===HOME_PETS.find(item=>item.id===pet)!.favorite)
    ?? forest.decorations.find(item=>item.id==="rest") ?? {x:50,y:67};
  const phase=Math.floor(now/12000+index*2)%5;
  const resting=pet==="frog"||!station.level||phase>=3;
  return { ...keepOnFloor(resting?{x:rest.x+(index-1)*10,y:rest.y+2}:{x:station.x-15,y:station.y+6}), resting };
}
export function activityPose(activity: RoomActivity, now: number) {
  const elapsed=Math.max(0,now-activity.startedAt);
  const travel=activity.kind==="pet"?0:1100;
  const ratio=travel ? clamp(elapsed/travel,0,1) : 1;
  const eased=ratio*ratio*(3-2*ratio);
  const point={x:activity.from.x+(activity.to.x-activity.from.x)*eased,y:activity.from.y+(activity.to.y-activity.from.y)*eased};
  return {point,arrived:elapsed>=travel,done:elapsed>=ACTIVITY_DURATION[activity.kind],progress:clamp(elapsed/ACTIVITY_DURATION[activity.kind],0,1)};
}
export function decorActivity(id: DecorId): RoomActivityKind {
  return id==="bowl"?"feed":id==="ball"||id==="mat"?"play":id==="pond"?"splash":id==="plant"?"sniff":"rest";
}
export function advancePetStroke(previous:{pet:HomePetId;count:number;at:number}|null,pet:HomePetId,now:number) {
  const count=previous?.pet===pet && now-previous.at<4500 ? previous.count+1 : 1;
  return {pet,count:Math.min(3,count),at:now};
}
