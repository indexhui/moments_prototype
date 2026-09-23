import { forwardRef, type KeyboardEvent } from "react";
import { HOME_FURNITURE, HOME_PETS, type HomePetId, type CareAction } from "@/lib/game/petHome";
import { FOREST_STATIONS, stationYield, type DecorId, type ForestState, type StationId } from "@/lib/game/petForest";
import { ROOM_HEIGHT, toRoomPoint } from "@/lib/game/petRoomLayout";
import { activityPose, idlePetPoint, type RoomActivity, type RoomPoint } from "@/lib/game/petRoomInteraction";
import { RoomItem } from "./RoomItems";
import type { RoomFeedback, RoomTool } from "./useRoomPlay";
import { FurnitureArt } from "./PetHomeArtwork";
import styles from "./ForestView.module.css";

export const FOREST_HEIGHT = ROOM_HEIGHT;
export const FOREST_DECOR_ART: Partial<Record<DecorId, { src: string; width: number; height: number }>> = {
  rest: { src: "/images/pet-home/rest-v3.png", width: 178, height: 156 },
  plant: { src: "/images/pet-home/plant-v3.png", width: 145, height: 190 },
  bowl: { src: "/images/pet-home/bowl-v3.png", width: 72, height: 64 },
  pond: { src: "/images/pet-home/pond-v3.png", width: 118, height: 92 },
  cushion: { src: "/images/pet-home/cushion-v3.png", width: 102, height: 78 },
};
export const decorationName = (id: DecorId) => id === "rest" ? "午後懶骨頭" : HOME_FURNITURE.find(item => item.id === id)!.name;
export type ForestSelection = { kind: "station"; id: StationId } | { kind: "decoration"; id: DecorId };
type RoomWish = CareAction | "decor:rest" | "decor:pond";
type Props = {
  height: number; state: ForestState; now: number; pets: HomePetId[]; editing: boolean;
  selected: ForestSelection | null; reaction: HomePetId | null; evening: boolean;
  activity:RoomActivity|null; strokes:{pet:HomePetId;count:number;point:RoomPoint}|null; feedback:RoomFeedback|null;
  wishes:Partial<Record<HomePetId,RoomWish|null>>; tool:RoomTool|null; dropPet:HomePetId|null;
  dragItem:{kind:RoomTool;x:number;y:number}|null;
  onWish:(id:HomePetId,action:RoomWish)=>void;
  arriving?:HomePetId; requestReady:HomePetId[]; onArrival:(id:HomePetId)=>void; onRequestClaim:(id:HomePetId)=>void;
  onStation: (id: StationId) => void; onCollect: (id: StationId) => void;
  onPet: (id: HomePetId) => void; onDecor: (id: DecorId) => void;
};
const activate = (event: KeyboardEvent, callback: () => void) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); callback(); } };

export const ForestScene = forwardRef<SVGSVGElement, Props>(function ForestScene({ height, state, now, pets, editing, selected, reaction, evening, onStation, onCollect, onPet, onDecor, activity, strokes, feedback, wishes, tool, dropPet, dragItem, onWish, arriving, requestReady, onArrival, onRequestClaim }, ref) {
  const objects: { key: string; y: number; node: React.ReactNode }[] = [];
  const products: React.ReactNode[] = [];
  for (const station of FOREST_STATIONS) {
    const item = state.stations[station.id];
    const { x, y } = toRoomPoint(item.x, item.y, height);
    const output = stationYield(item, station.id, now);
    const available = pets.includes(station.pet);
    objects.push({ key: station.id, y, node: <g transform={`translate(${x} ${y})`}>
      <g role="button" tabIndex={0} aria-label={`${item.level ? editing ? "移動" : "收下" : "建造"}${station.name}`} data-kind="station" data-place={station.id} onClick={() => onStation(station.id)} onKeyDown={event => activate(event, () => onStation(station.id))} className={styles.sceneTarget}>
        {item.level ? <>
          <ellipse cy="4" rx="61" ry="15" fill="#8b7159" opacity=".15"/>
          {editing && <ellipse cy="-12" rx="65" ry="30" fill="#fff9d530" stroke={selected?.id === station.id ? "#9a673e" : "#fffbe3"} strokeWidth="2" strokeDasharray="5 5"/>}
          <image href={station.image} x="-72" y="-126" width="144" height="144" pointerEvents="none"/>
          {!editing && available && <g className={styles.steam} fill="none" stroke="#fffef1" strokeWidth="3" opacity=".75"><path d="M-8-98q-10-10 0-20t0-18"/><path d="M6-102q10-10 0-20"/></g>}

        </> : <>
          <ellipse cy="-5" rx="43" ry="19" fill="#f8efd68c" stroke="#aaae7d" strokeWidth="1.5" strokeDasharray="4 5"/>
          <path d="M0-9v-34M-16-47l31 0v21h-31z" fill="#d3b185" stroke="#997951" strokeWidth="1.8" strokeLinejoin="round"/>
          <path d="M-5-36h9M0-41v10" stroke="#fff8dd" strokeWidth="2"/>
          <text y="29" textAnchor="middle" fontSize="10" fill="#8b7159">{available ? "蓋一間花香茶屋" : "等一位新朋友"}</text>
        </>}
        <rect x="-69" y={item.level ? -124 : -55} width="138" height={item.level ? 160 : 90} fill="transparent"/>
      </g>

    </g> });
    if (!editing && item.level>0 && output.count>0 && available) products.push(
      <g key={station.id} transform={`translate(${Math.min(350,x+51)} ${y-115})`} role="button" tabIndex={0} aria-label={`領取${station.name}收入`} onClick={()=>onCollect(station.id)} onKeyDown={event=>activate(event,()=>onCollect(station.id))} className={styles.productBubble} data-photo-hide="true">
        <path d="M-29-29q29-5 58 0v49q0 7-8 7H6L0 34l-6-7h-17q-8 0-8-7Z" fill="#fff6df" stroke="#aa8a61" strokeWidth="1.6"/>
        <svg x="-24" y="-27" width="48" height="43"><RoomItem kind={station.id}/></svg>
        <text y="22" textAnchor="middle" fill="#937451" fontSize="10">{output.count>99?"99+":output.count} 份</text>
      </g>);

  }
  for (const item of state.decorations) {
    const { x, y } = toRoomPoint(item.x, item.y, height);
    const art = FOREST_DECOR_ART[item.id];
    objects.push({ key: item.id, y, node: <g transform={`translate(${x} ${y})`} data-kind="decoration" data-place={item.id} role="button" tabIndex={0} aria-label={`小屋佈置：${decorationName(item.id)}`} className={styles.sceneTarget} onClick={() => onDecor(item.id)} onKeyDown={event => activate(event, () => onDecor(item.id))}>
      {editing && <ellipse cy="-8" rx={item.id === "rest" ? 66 : 40} ry="24" fill="#fff9d530" stroke={selected?.id === item.id ? "#9a673e" : "#fffbe3"} strokeWidth="2" strokeDasharray="5 5"/>}
      {art ? <image href={art.src} x={-art.width/2} y={-art.height*.8} width={art.width} height={art.height} pointerEvents="none"/> : item.id !== "rest" && <g transform="scale(.65)"><FurnitureArt id={item.id}/></g>}
      {art ? <rect x={-art.width/2} y={-art.height*.8} width={art.width} height={art.height} fill="transparent"/> : <ellipse cy="-13" rx="32" ry="32" fill="transparent"/>}
    </g> });
  }
  pets.forEach((id, index) => {
    const pet = HOME_PETS.find(item => item.id === id)!;
    const idle=idlePetPoint(id,index,state,now);
    const active=activity?.pet===id?activity:null;
    const pose=active?activityPose(active,now):null;
    const position=pose?.point??(strokes?.pet===id?strokes.point:idle);
    const {x,y}=toRoomPoint(position.x,position.y,height);
    const resting=idle.resting;
    const wish=wishes[id];
    const reacting=feedback?.pet===id || reaction===id;
    const animation=strokes?.pet===id?styles.petPetted:active?(pose?.arrived?(active.kind==="feed"?styles.petEating:active.kind==="play"?styles.petPlaying:active.kind==="rest"?styles.petSleeping:active.kind==="splash"?styles.petSplashing:active.kind==="sniff"?styles.petSniffing:styles.petPetted):styles.petWalking):reacting?styles.petHappy:resting?styles.petRest:styles.petWork;
    const petSize = id === "frog" ? 72 : id === "naotaro" ? 112 : 108;
    objects.push({ key: `pet-${id}`, y: height + index, node: <g data-resident={id} transform={`translate(${x} ${y})`} className={styles.resident} style={{ pointerEvents: editing ? "none" : "auto", transition: active ? "transform .1s linear" : undefined }}>
      <ellipse cy="-1" rx="23" ry="7" fill="#8b7159" opacity=".18"/>
      {(tool || dropPet===id) && !editing && <ellipse cy="-36" rx={petSize/2+8} ry={petSize/2+8} fill={dropPet===id?"#ffeac555":"none"} stroke="#fdf2d4" strokeWidth="3" strokeDasharray={dropPet===id?undefined:"4 5"} pointerEvents="none"/>}
      <g className={animation}>
        <PetPortrait id={id} x={-petSize/2} y={-petSize+6} size={petSize}/>
        <ellipse cy="-42" rx={petSize/2} ry={petSize/2} fill="transparent" role="button" tabIndex={editing ? -1 : 0} data-pet-hit={id} aria-label={`摸摸${pet.name}`} onClick={() => onPet(id)} onKeyDown={event => activate(event, () => onPet(id))} className={styles.sceneTarget}/>
        {reacting || active?.kind==="pet" ? <path d="M19-100c-12-12-16 7 0 15 16-8 12-27 0-15" fill="#d99178" stroke="#fff7df" strokeWidth="1.5"/> : <text x="28" y="-75" fontSize="13" fill="#fffbed" stroke="#847657" strokeWidth=".4">{resting ? "z z" : "♪"}</text>}
        {active?.kind==="feed"&&pose?.arrived&&<g className={styles.crumbs} fill="#d2a166" stroke="none"><circle cx="22" cy="-36" r="3"/><circle cx="32" cy="-28" r="2"/><circle cx="39" cy="-35" r="2"/></g>}
        {active?.kind==="splash"&&pose?.arrived&&<g className={styles.splash} stroke="#a6d4d8" strokeWidth="3" fill="none"><path d="M-36-13l-9-12M34-12l9-15M-39 0l-12 1M38 0l12 1"/></g>}
      </g>
      {strokes?.pet===id&&<g transform={`translate(0 ${-petSize-8})`} pointerEvents="none">{[0,1,2].map(i=><circle key={i} cx={(i-1)*13} cy="0" r="4" fill={i<strokes.count?"#d89b80":"#fff3dd"} stroke="#a68565" strokeWidth="1.3"/>)}</g>}
      {!editing&&!active&&!reacting&&!strokes&&!requestReady.includes(id)&&wish&&<g transform={`translate(26 ${-petSize-28})`} className={styles.wishBubble} role="button" tabIndex={0} aria-label={`${pet.name}${wish==="feed"?"想吃點心":wish==="play"?"想玩球":wish==="decor:pond"?"想玩水":wish==="decor:rest"?"想休息":"想被摸摸"}`} onClick={()=>onWish(id,wish)} onKeyDown={event=>activate(event,()=>onWish(id,wish))} data-photo-hide="true">
        <path d="M-22-19q22-7 44 0v31q0 6-6 6H5l-7 8-2-8h-13q-5 0-5-6Z" fill="#fff7e7" stroke="#a38b70" strokeWidth="1.5"/>
        <svg x="-17" y="-17" width="34" height="34">{wish==="decor:rest"||wish==="decor:pond"?<image href={FOREST_DECOR_ART[wish==="decor:rest"?"rest":"pond"]!.src} width="34" height="34"/>:<RoomItem kind={wish}/>}</svg>
      </g>}
      {!editing&&requestReady.includes(id)&&<g transform={`translate(26 ${-petSize-28})`} className={styles.wishBubble} role="button" tabIndex={0} aria-label={`收下${pet.name}的謝禮`} onClick={()=>onRequestClaim(id)} onKeyDown={event=>activate(event,()=>onRequestClaim(id))} data-photo-hide="true"><rect x="-24" y="-25" width="48" height="48" rx="15" fill="#fff4db" stroke="#b58967" strokeWidth="2"/><text y="-3" textAnchor="middle" fill="#ce947e" fontSize="22">♥</text><text y="14" textAnchor="middle" fontSize="11" fill="#936e51">+8</text></g>}
      {feedback?.pet===id&&<g key={feedback.id} className={styles.heartBurst} pointerEvents="none" data-photo-hide="true"><text y={-petSize-4} textAnchor="middle" fontSize="12" fill="#ae705c" stroke="#fff7e9" strokeWidth="3" paintOrder="stroke">{feedback.text}</text><text x="-29" y={-petSize+15} fontSize="18" fill="#d58d79">♥</text><text x="26" y={-petSize+8} fontSize="12" fill="#d58d79">♥</text></g>}

    </g> });
  });
  return <svg ref={ref} viewBox={`0 0 393 ${height}`} xmlns="http://www.w3.org/2000/svg" role="group" aria-label="小日之家生活場景" className={styles.scene} preserveAspectRatio="xMidYMid meet" style={{ touchAction: "none" }}>
    <image href="/images/pet-home/cabin-v3.png" width="393" height={height} preserveAspectRatio="none"/>
    {objects.sort((a,b) => a.y-b.y).map(item => <g key={item.key}>{item.node}</g>)}
    {activity&&(activity.kind==="feed"||activity.kind==="play")&&<g transform={`translate(${toRoomPoint(activity.to.x,activity.to.y,height).x+(activity.kind==="feed"?27:24)} ${toRoomPoint(activity.to.x,activity.to.y,height).y-(activity.kind==="feed"?37:12)})`} pointerEvents="none">
      <g className={activity.kind==="play"?styles.rollingBall:styles.snackBite}><svg x="-24" y="-31" width="48" height="48"><RoomItem kind={activity.kind}/></svg></g>
    </g>}
    {arriving&&!editing&&<g transform={`translate(328 ${toRoomPoint(83,76,height).y})`} className={styles.arrivingGuest} role="button" tabIndex={0} aria-label={`迎接${HOME_PETS.find(pet=>pet.id===arriving)!.name}入住`} onClick={()=>onArrival(arriving)} onKeyDown={event=>activate(event,()=>onArrival(arriving))}>
      <ellipse cy="0" rx="43" ry="13" fill="#b89a7544"/><path d="M-39 2q39-10 78 0v12q-39 8-78 0z" fill="#d7bb91" stroke="#a58a67" strokeWidth="1.5"/>
      <PetPortrait id={arriving} x={-43} y={-93} size={86}/><path d="M21-11v-22q0-3 4-3h17q4 0 4 3v22zM28-36v-6h10v6" fill="#ddb583" stroke="#9c7855" strokeWidth="2"/><path d="M28-35v24M39-35v24" stroke="#9c7855"/>
      <g data-photo-hide="true"><rect x="-29" y="-125" width="58" height="27" rx="8" fill="#fff5dc" stroke="#ab8b67" strokeWidth="1.5"/><text y="-107" textAnchor="middle" fill="#9e7657" fontSize="12">叩叩 ♪</text></g>
    </g>}
    {products}
    {dragItem&&<g transform={`translate(${dragItem.x} ${dragItem.y})`} pointerEvents="none" data-photo-hide="true"><ellipse cy="14" rx="23" ry="7" fill="#82674a33"/><svg x="-30" y="-43" width="60" height="60"><RoomItem kind={dragItem.kind}/></svg></g>}
    <g pointerEvents="none" className={styles.motes} fill={evening ? "#fff4a5" : "#ffffdf"} opacity=".8"><circle cx="80" cy="210" r="2"/><circle cx="283" cy="368" r="2.3"/><circle cx="66" cy="440" r="1.5"/><circle cx="248" cy="180" r="1.6"/><circle cx="228" cy="610" r="2"/></g>
    {evening && <rect width="393" height={height} fill="#343962" opacity=".25" pointerEvents="none"/>}
  </svg>;
});

// Crop transparent margins at render time, preserving the original character art.
const PET_CROP = {
  beigo: { viewBox: "74 241 377 322", width: 500, height: 627 },
  naotaro: { viewBox: "42 80 520 434", width: 600, height: 600 },
  frog: { viewBox: "63 63 379 395", width: 500, height: 500 },
} as const;
export function PetPortrait({id, x=0, y=0, size=48}:{id:HomePetId; x?:number; y?:number; size?:number}) {
  const crop=PET_CROP[id];
  return <svg x={x} y={y} width={size} height={size} viewBox={crop.viewBox} pointerEvents="none" aria-hidden="true">
    <image href={HOME_PETS.find(pet=>pet.id===id)!.image} width={crop.width} height={crop.height}/>
  </svg>;
}

const imageCache = new Map<string, Promise<string>>();
export async function captureForest(svg: SVGSVGElement) {
  const height = svg.viewBox.baseVal.height || FOREST_HEIGHT;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", "480"); clone.setAttribute("height", String(Math.round(480 * height / 393)));
  clone.removeAttribute("class");
  clone.querySelectorAll('[aria-label^="領取"], [data-photo-hide]').forEach(element => element.remove());
  await Promise.all(Array.from(clone.querySelectorAll("image")).map(async element => {
    const href = element.getAttribute("href")!;
    if (!imageCache.has(href)) imageCache.set(href, fetch(href).then(response => { if (!response.ok) throw new Error("Image unavailable"); return response.blob(); }).then(blob => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); })).catch(error => { imageCache.delete(href); throw error; }));
    element.setAttribute("href", await imageCache.get(href)!);
  }));
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image();
    await new Promise<void>((resolve,reject) => { image.onload = () => resolve(); image.onerror = reject; image.src = url; });
    const canvas = document.createElement("canvas"); canvas.width = 480; canvas.height = Math.round(480 * height / 393);
    const context = canvas.getContext("2d"); if (!context) throw new Error("Canvas unavailable");
    context.drawImage(image,0,0);
    return canvas.toDataURL("image/jpeg",.72);
  } finally { URL.revokeObjectURL(url); }
}
