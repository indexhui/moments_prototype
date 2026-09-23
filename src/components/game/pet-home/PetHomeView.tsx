"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { IoArrowBack, IoArrowForward, IoCameraOutline, IoCheckmark, IoClose, IoFlowerOutline, IoGiftOutline, IoHeart, IoLockClosedOutline, IoMoonOutline, IoMoveOutline, IoPawOutline, IoSunnyOutline, IoBookOutline, IoChevronForward, IoKeyOutline, IoMailOutline } from "react-icons/io5";
import { INITIAL_PLAYER_PROGRESS, loadPlayerProgress, PLAYER_PROGRESS_CHANGE_EVENT, type PlayerProgress } from "@/lib/game/playerProgress";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import { ROUTES } from "@/lib/routes";
import { applyHomeAction, canInvitePet, createPetHomeState, HOME_FURNITURE, HOME_PETS, residentPets, MAX_HOME_PHOTOS, PET_HOME_CHANGE_EVENT, readPetHome, savePetHome, type CareAction, type HomeAction, type HomePetId, type HomePhoto, type PetHomeState } from "@/lib/game/petHome";
import { applyForest, canUseDecoration, createForest, FOREST_EVENT, FOREST_KEY, FOREST_STATIONS, FOREST_TASKS, readForest, saveForest, stationYield, taskComplete, upgradeCost, type DecorId, type ForestAction, type ForestState, type StationId } from "@/lib/game/petForest";
import { fromRoomPoint, toRoomPoint, ROOM_HEIGHT, ROOM_WIDTH } from "@/lib/game/petRoomLayout";
import { applyResidence, residenceStatus, residentRequest, recordResidentMoment, type ResidenceAction, type RequestStep } from "@/lib/game/petResidence";
import { ResidencePanel } from "./ResidencePanel";
import { petWish } from "@/lib/game/petRoomInteraction";
import { useRoomPlay } from "./useRoomPlay";
import { RoomItem } from "./RoomItems";
import { FurnitureThumbnail } from "./PetHomeArtwork";
import { captureForest, decorationName, FOREST_DECOR_ART, ForestScene, PetPortrait, type ForestSelection } from "./ForestScene";
import styles from "./ForestView.module.css";

type Panel = "build" | "pets" | "journal" | "shop" | "station" | "pet" | "decor" | "welcome" | null;
const NAV = [{id:"build",label:"玩具箱"},{id:"journal",label:"小日手帳"},{id:"pets",label:"入住簿"}] as const;
function NavArt({id}:{id:typeof NAV[number]["id"]}) {
  return <svg viewBox="0 0 64 56" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {id==="build"?<><path d="m10 24 23-8 21 10-1 22-23 5-20-9zM10 24l20 9 24-7M30 33v20M11 34l19 8 23-6M17 40l7 3M37 45l8-2"/><path d="M21 23c-8-11-2-16 3-12l5 5c7-14 15-4 8 5M40 22l5-9 8 4-5 8"/><path d="m12 27 17 7 22-6" opacity=".35"/></>:id==="journal"?<><path d="M31 14C23 8 11 8 4 11l4 34c8-4 17-3 24 2 7-6 17-7 25-4l3-34c-11-1-22 1-29 5zM31 14l1 33M7 16l4 26c7-2 13-1 18 2M35 43c6-3 12-5 18-3M35 17c5-3 11-4 18-4"/><path d="m3 15 5 33c8-3 15-3 24 1 8-5 17-7 27-4l2-29" opacity=".4"/></>:<><path d="M18 12c-7 0-9 10-4 13 4 3 8-6 4-13zM30 6c-6-2-9 10-4 13 6 3 9-10 4-13zM42 9c-6-1-9 11-4 13 6 2 9-11 4-13zM52 20c-5-2-12 6-8 10 5 4 13-7 8-10zM23 30c-5 3-11 10-7 16 4 5 9 0 15 0s11 3 14-3c3-7-7-17-13-18-4 0-6 2-9 5z"/><path d="M20 47c5 2 8-3 13-1" opacity=".4"/></>}
  </svg>;
}

const DECOR: DecorId[] = ["rest",...HOME_FURNITURE.map(item=>item.id)];
const coin = (value: number) => value > 9999 ? `${(value/1000).toFixed(1)}k` : value.toLocaleString("en-US");
function Coin({small=false}:{small?:boolean}) { return <span className={small ? styles.coinSmall : styles.coin} aria-hidden="true">✦</span>; }
function DecorImage({id}:{id:DecorId}) { const art=FOREST_DECOR_ART[id]; return art ? <img src={art.src} alt=""/> : id!=="rest" ? <FurnitureThumbnail id={id}/> : null; }

export function PetHomeView() {
  const router = useRouter();
  const [home,setHome] = useState<PetHomeState>(createPetHomeState);
  const [forest,setForest] = useState<ForestState>(()=>createForest(0));
  const [story,setStory] = useState<PlayerProgress>(INITIAL_PLAYER_PROGRESS);
  const [ready,setReady] = useState(false);
  const [now,setNow] = useState(0);
  const [panel,setPanel] = useState<Panel>(null);
  const [residenceTab,setResidenceTab] = useState<"residents"|"requests">("residents");
  const [preparingPet,setPreparingPet] = useState<HomePetId|null>(null);
  const [buildTab,setBuildTab] = useState("station");
  const [journalTab,setJournalTab] = useState("tasks");
  const [stationId,setStationId] = useState<StationId>("soup");
  const [petId,setPetId] = useState<HomePetId>("beigo");
  const [decorId,setDecorId] = useState<DecorId>("rest");
  const [product,setProduct] = useState<"story"|"bundle"|null>(null);
  const [photo,setPhoto] = useState<HomePhoto|null>(null);
  const [confirmDelete,setConfirmDelete] = useState(false);
  const [editing,setEditing] = useState(false);
  const [selected,setSelected] = useState<ForestSelection|null>(null);
  const [preview,setPreview] = useState<ForestState|null>(null);
  const [toast,setToast] = useState("");
  const [collectFx,setCollectFx] = useState<{key:number;x:number;y:number;coins:number}|null>(null);
  const [evening,setEvening] = useState(false);
  const [takingPhoto,setTakingPhoto] = useState(false);
  const [flash,setFlash] = useState(0);
  const worldRef = useRef<HTMLDivElement>(null);
  const [sceneHeight,setSceneHeight] = useState(ROOM_HEIGHT);
  const svgRef = useRef<SVGSVGElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const holdRef=useRef<{timer:ReturnType<typeof setTimeout>;x:number;y:number}|null>(null);
  const suppressWorldClick=useRef(0);
  const dragRef = useRef<{ selection:ForestSelection; pointer:number; offsetX:number; offsetY:number; x:number; y:number; moved:boolean }|null>(null);
  const pets = residentPets(home,story);
  const pendingPet = HOME_PETS.find(pet=>!pets.includes(pet.id)&&canInvitePet(home,story,pet.id)&&home.invitations[pet.id]!==undefined)?.id;
  const pending = pendingPet ? residenceStatus(home,forest,story,pendingPet,now) : null;
  const requestRewards = pets.filter(id=>residentRequest(home,id,now).complete);
  const visibleForest = { ...(preview??forest), decorations:(preview??forest).decorations.filter(item=>canUseDecoration(home,story,item.id)) };
  const chosenStation = FOREST_STATIONS.find(item=>item.id===stationId)!;
  const chosenPet = HOME_PETS.find(item=>item.id===petId)!;
  const headerPet = HOME_PETS.find(item=>item.id===(pets.includes(petId)?petId:"beigo"))!;
  const hasTaskReward = FOREST_TASKS.some(task=>!forest.claimedTasks.includes(task.id)&&taskComplete(forest,task.id));
  const close = useCallback(()=>{ setPanel(null); setProduct(null); setPhoto(null); setConfirmDelete(false); },[]);
  const notify = useCallback((text:string)=>{ if (!text) return; setToast(text); if(toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current=setTimeout(()=>setToast(""),3500); },[]);
  const homeAction = useCallback((action:HomeAction,silent=false)=>{
    const result=applyHomeAction(readPetHome(),loadPlayerProgress(),action);
    if(!result.ok){ if(!silent) notify(result.message); return false; }
    if(!savePetHome(result.state)){notify("無法保存這次變更，請檢查瀏覽器儲存空間。");return false;}
    setHome(result.state); if(!silent)notify(result.message); return true;
  },[notify]);
  const forestAction = useCallback((action:ForestAction,silent=false)=>{
    const result=applyForest(readForest(),readPetHome(),loadPlayerProgress(),action);
    if(!result.ok){if(!silent)notify(result.message);return false;}
    if(!saveForest(result.state)){notify("無法保存這次變更，請檢查瀏覽器儲存空間。");return false;}
    setForest(result.state);setNow(Date.now()); if(!silent)notify(result.message);return true;
  },[notify]);
  useEffect(()=>{
    const sync=()=>{setHome(readPetHome());setForest(readForest());setStory(loadPlayerProgress());};
    const savedHome=readPetHome();
    if(savedHome.residents===null)savePetHome({...savedHome,residents:residentPets(savedHome,loadPlayerProgress())});
    const initial=readForest();
    try { if(!localStorage.getItem(FOREST_KEY) && !saveForest(initial)) notify("目前無法保存小屋進度。"); } catch { notify("目前無法保存小屋進度。"); }
    sync();setNow(Date.now());setReady(true);
    if(Date.now()-initial.stations.soup.collectedAt>120000) notify("歡迎回來，夥伴幫你準備了一些料理。點點做好的料理就能收下。");
    const onStorage=(event:StorageEvent)=>{if(!event.key||[FOREST_KEY,"moment:pet-home:v1","moment:player-progress"].includes(event.key))sync();};
    window.addEventListener(FOREST_EVENT,sync);window.addEventListener(PET_HOME_CHANGE_EVENT,sync);window.addEventListener(PLAYER_PROGRESS_CHANGE_EVENT,sync);window.addEventListener("storage",onStorage);window.addEventListener("focus",sync);
    const clock=setInterval(()=>setNow(Date.now()),100);
    return ()=>{clearInterval(clock);window.removeEventListener(FOREST_EVENT,sync);window.removeEventListener(PET_HOME_CHANGE_EVENT,sync);window.removeEventListener(PLAYER_PROGRESS_CHANGE_EVENT,sync);window.removeEventListener("storage",onStorage);window.removeEventListener("focus",sync);if(toastTimer.current)clearTimeout(toastTimer.current);if(holdRef.current)clearTimeout(holdRef.current.timer);};
  },[notify]);
  useEffect(()=>{
    const world=worldRef.current;if(!world)return;
    const resize=()=>{const {width,height}=world.getBoundingClientRect();if(width>0)setSceneHeight(height/width*ROOM_WIDTH);};
    resize();const observer=new ResizeObserver(resize);observer.observe(world);return ()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(!panel)return;
    const previous=document.activeElement as HTMLElement|null;
    const nodes=()=>Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')??[]);
    nodes()[0]?.focus({preventScroll:true});
    const key=(event:KeyboardEvent)=>{if(event.key==="Escape")close();if(event.key!=="Tab")return;const all=nodes();const first=all[0];const last=all[all.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}};
    window.addEventListener("keydown",key);return ()=>{window.removeEventListener("keydown",key);previous?.focus({preventScroll:true});};
  },[panel,close]);
  const residenceAction=(action:ResidenceAction)=>{
    const result=applyResidence(readPetHome(),readForest(),loadPlayerProgress(),action);
    if(!result.ok){notify(result.message);return false;}
    if(!savePetHome(result.state)){notify("無法保存這次入住進度。");return false;}
    setHome(result.state);setNow(Date.now());notify(result.message);return true;
  };
  const completeCare=(pet:HomePetId,action:CareAction)=>{
    const progress=loadPlayerProgress();const current=readPetHome();
    const invited=applyHomeAction(current,progress,{type:"invite",pet});
    if(!invited.ok)return false;
    const result=applyHomeAction(invited.state,progress,{type:"care",action,now:Date.now()});
    const next=recordResidentMoment(result.state,progress,pet,action,Date.now());
    if(!result.ok&&next===result.state)return false;
    if(!savePetHome(next)){notify("無法保存這次陪伴。");return false;}
    setHome(next);setPetId(pet);setNow(Date.now());return result.ok;
  };
  const play=useRoomPlay({forest:visibleForest,pets,now,height:sceneHeight,svg:svgRef,enabled:ready&&!editing&&!panel,onCare:completeCare,onMemory:(pet,id)=>{
    const current=readPetHome();const next=recordResidentMoment(current,loadPlayerProgress(),pet,`decor:${id}`,Date.now());
    if(next!==current){if(!savePetHome(next)){notify("無法保存這次小約定。");return;}setHome(next);}
    homeAction({type:"memory",id:`forest:${pet}:${id}`},true);
  }});
  const collect=(id:StationId)=>{
    const current=readForest();const yieldNow=stationYield(current.stations[id],id,Date.now());
    if(!yieldNow.count){play.setHint("香氣正在慢慢醞釀，等等就有新料理了");return;}
    if(forestAction({type:"collect",id,now:Date.now()},true)){
      const position=toRoomPoint(current.stations[id].x,current.stations[id].y,sceneHeight);
      setCollectFx({key:Date.now(),x:Math.min(350,position.x+51),y:position.y-115,coins:yieldNow.coins});
      play.setHint(`送出 ${yieldNow.count} 份料理 · 收下 ${yieldNow.coins} 小日幣`);
    }
  };
  const openStation=(id:StationId)=>{
    if(editing){setSelected({kind:"station",id});return;}
    if(forest.stations[id].level){collect(id);return;}
    setStationId(id);setPanel("station");
  };
  const openPet=(id:HomePetId)=>{setPetId(id);setPanel("pet");};
  const prepareRoom=(id:HomePetId,decor:DecorId)=>{
    if(!forestAction({type:"place",id:decor},true))return;
    close();setPreparingPet(id);setEditing(true);setSelected({kind:"decoration",id:decor});
    notify("拖曳到喜歡的位置，再完成佈置。");
  };
  const guideRequest=(id:HomePetId,step?:RequestStep)=>{
    if(play.busy){notify("等夥伴完成這個動作，再一起做下一件事。");return;}
    setPetId(id);close();
    if(step?.startsWith("decor:")){
      const decor=step.slice(6) as DecorId;
      if(!forest.decorations.some(item=>item.id===decor)){prepareRoom(id,decor);return;}
      play.decorTap(decor,id);
    }else if(step==="feed"||step==="play")play.wishTap(id,step);
    else play.setHint(`在小屋裡摸摸${HOME_PETS.find(p=>p.id===id)!.name}三下，也可以用手指輕撫`);
  };
  const openDecor=(id:DecorId)=>{if(editing){setSelected({kind:"decoration",id});return;}play.decorTap(id);};
  const takePhoto=async()=>{
    if(!ready||!svgRef.current||takingPhoto)return;
    if(home.photos.length>=MAX_HOME_PHOTOS){setJournalTab("album");setPanel("journal");notify("相簿滿了，先移除一張照片吧。");return;}
    setTakingPhoto(true);
    try{const image=await captureForest(svgRef.current);if(homeAction({type:"photo",photo:{id:crypto.randomUUID(),petId:"beigo",createdAt:Date.now(),caption:`${evening?"暮色裡":"陽光下"}的小日之家 · ${pets.length} 位夥伴`,image}})){setFlash(value=>value+1);}}
    catch{notify("照片沒有拍好，請再試一次。");}finally{setTakingPhoto(false);}
  };
  const point=(event:PointerEvent)=>{const svg=svgRef.current;const matrix=svg?.getScreenCTM();if(!svg||!matrix)return null;const p=svg.createSVGPoint();p.x=event.clientX;p.y=event.clientY;const local=p.matrixTransform(matrix.inverse());return fromRoomPoint(local.x,local.y,sceneHeight);};
  const cancelHold=()=>{if(holdRef.current){clearTimeout(holdRef.current.timer);holdRef.current=null;}};
  const pointerDown=(event:PointerEvent<HTMLDivElement>)=>{
    if(!editing)play.rubDown(event);
    const target=(event.target as Element).closest("[data-place]");const position=point(event);if(!target||!position)return;
    const id=target.getAttribute("data-place")!;const kind=target.getAttribute("data-kind") as "station"|"decoration";
    const item=kind==="station"?forest.stations[id as StationId]:forest.decorations.find(entry=>entry.id===id);if(!item||kind==="station"&&!forest.stations[id as StationId].level)return;
    const selection={kind,id} as ForestSelection;const element=event.currentTarget;const pointer=event.pointerId;
    const beginDrag=()=>{setSelected(selection);element.setPointerCapture(pointer);dragRef.current={selection,pointer,offsetX:position.x-item.x,offsetY:position.y-item.y,x:item.x,y:item.y,moved:false};};
    if(editing){event.preventDefault();beginDrag();return;}
    if(play.busy||play.tool)return;
    cancelHold();holdRef.current={x:event.clientX,y:event.clientY,timer:setTimeout(()=>{holdRef.current=null;suppressWorldClick.current=Date.now()+1000;setEditing(true);beginDrag();},480)};
  };
  const pointerMove=(event:PointerEvent<HTMLDivElement>)=>{
    if(holdRef.current&&Math.hypot(event.clientX-holdRef.current.x,event.clientY-holdRef.current.y)>9)cancelHold();
    if(!editing)play.rubMove(event);
    const drag=dragRef.current;const p=point(event);if(!drag||!p||drag.pointer!==event.pointerId)return;
    const x=Math.max(18,Math.min(82,p.x-drag.offsetX));const y=Math.max(30,Math.min(76,p.y-drag.offsetY));
    if(Math.abs(x-drag.x)+Math.abs(y-drag.y)>1)drag.moved=true;
    drag.x=x;drag.y=y;setPreview(applyForest(forest,home,story,{type:"move",...drag.selection,x,y}).state);
  };
  const pointerUp=(event:PointerEvent<HTMLDivElement>)=>{
    cancelHold();play.rubUp();const drag=dragRef.current;if(!drag||drag.pointer!==event.pointerId)return;
    if(drag.moved&&event.type!=="pointercancel")forestAction({type:"move",...drag.selection,x:drag.x,y:drag.y},true);
    suppressWorldClick.current=Date.now()+400;dragRef.current=null;setPreview(null);
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const moveSelected=(x:number,y:number)=>{if(!selected)return;const item=selected.kind==="station"?forest.stations[selected.id]:forest.decorations.find(item=>item.id===selected.id);if(item)forestAction({type:"move",...selected,x:item.x+x,y:item.y+y},true);};
  const startEditing=(selection?:ForestSelection)=>{close();setPreparingPet(null);setEditing(true);setSelected(selection??null);};
  const panelTitle = panel==="build"?"小屋裡的玩具箱":panel==="pets"?"小日入住簿":panel==="welcome"?"歡迎，回到小日之家":panel==="journal"?"我的小日手帳":panel==="shop"?product?"確認這份小心意":"把故事，帶回日常":panel==="station"?chosenStation.name:panel==="pet"?chosenPet.name:decorationName(decorId);

  return <main className={styles.screen} data-game-viewport="true" data-evening={evening}>
    <div className={styles.worldLayer} inert={!!panel}>
      <div ref={worldRef} className={styles.world} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onClickCapture={event=>{if(Date.now()<suppressWorldClick.current){event.stopPropagation();event.preventDefault();}}} onClick={event=>{if(!editing)play.floorTap(event);}}>
        <ForestScene ref={svgRef} height={sceneHeight} state={visibleForest} now={now} pets={pets} editing={editing} selected={selected} reaction={null} evening={evening} onStation={openStation} onCollect={collect} onPet={id=>{setPetId(id);play.petTap(id);}} onDecor={openDecor}
          activity={play.activity} strokes={play.strokes} feedback={play.feedback} wishes={Object.fromEntries(pets.map(id=>{const request=residentRequest(home,id,now);return [id,!request.seconds&&!request.complete&&request.next?request.next.id:petWish(home,id,now)];}))}
          arriving={pending?.arrived?pendingPet:undefined} requestReady={requestRewards} onArrival={id=>{setPetId(id);setPanel("welcome");}} onRequestClaim={id=>residenceAction({type:"claim-request",pet:id,now:Date.now()})} tool={play.tool} dropPet={play.dropPet} dragItem={play.dragItem}
          onWish={(id,action)=>{setPetId(id);if(action.startsWith("decor:"))guideRequest(id,action as RequestStep);else play.wishTap(id,action as CareAction);}}/>
      </div>
      <header className={styles.header}>
        <h1 className={styles.srOnly}>小日之家</h1>
        <div className={styles.topLine}>
          <button className={styles.back} aria-label="回到大廳" onClick={()=>router.push(withTrialProfileSearch(ROUTES.gameLobby))}><IoArrowBack/></button>
          <button className={styles.nameplate} onClick={()=>openPet(headerPet.id)} aria-label={`查看${headerPet.name}的親密度`}>
            <svg viewBox="0 0 48 48" className={styles.portrait}><PetPortrait id={headerPet.id}/></svg>
            <span>{headerPet.name}</span><small>Lv.{1+Math.floor(home.bonds[headerPet.id]/20)}</small>
          </button>
        </div>
        <div className={styles.balances}><div aria-label={`小日幣 ${forest.coins}`}><Coin/>{coin(forest.coins)}</div><div aria-label={`心意 ${home.hearts}`}><IoHeart/>{home.hearts}</div><span>{pets.length} 位夥伴的小屋</span></div>
      </header>
      {!editing&&<>
        <div className={styles.receptionTools}>
          <button className={styles.receptionSign} onClick={()=>{if(pendingPet&&pending?.arrived){setPetId(pendingPet);setPanel("welcome");}else{setResidenceTab("residents");setPanel("pets");}}}><IoKeyOutline/><span><strong>{pending?.arrived?"叩叩，朋友來了！":"小日入住簿"}</strong><small>{pending?.arrived?"去門口迎接牠":pending?.invited?`新朋友正在過來 · ${pending.seconds}s`:`${pets.length}/3 個溫暖的角落`}</small></span>{pending?.arrived?<i/>:<IoChevronForward/>}</button>
          <button className={styles.requestSign} onClick={()=>{setResidenceTab("requests");setPanel("pets");}}><IoMailOutline/>{requestRewards.length?`${requestRewards.length} 份夥伴的謝禮`:"今天，想一起做什麼？"}{requestRewards.length>0&&<i/>}</button>
        </div>
        <div className={styles.tools}>
          <button className={styles.circle} aria-label="拍下小屋日常" disabled={!ready||takingPhoto} onClick={takePhoto}><IoCameraOutline/></button>
          <button className={styles.circle} aria-label="佈置小屋" onClick={()=>startEditing()}><IoMoveOutline/></button>
          <button className={styles.circle} aria-label="切換晨光與暮色" onClick={()=>setEvening(value=>!value)}>{evening?<IoSunnyOutline/>:<IoMoonOutline/>}</button>
          <button className={styles.circle} aria-label="禮包" onClick={()=>setPanel("shop")}><IoGiftOutline/></button>
        </div>
        <div className={styles.playDock}>
          <p className={styles.playHint} role="status">{play.hint}</p>
          <div className={styles.playTools}>
            <span className={styles.touchHint}><RoomItem kind="pet"/><small>輕摸夥伴</small></span>
            {(["feed","play"] as const).map(kind=><button key={kind} className={styles.playTool} aria-label={kind==="feed"?"拿起點心":"拿起皮球"} aria-pressed={play.tool===kind} disabled={!ready||play.busy}
              onPointerDown={event=>play.toolDown(event,kind)} onPointerMove={play.toolMove} onPointerUp={play.toolUp} onPointerCancel={play.toolUp} onClick={event=>{if(event.detail===0)play.selectTool(kind);}}>
              <RoomItem kind={kind}/><span>{kind==="feed"?"餵點心":"玩皮球"}</span>
            </button>)}
          </div>
        </div>
      </>}
      {editing&&<><div className={styles.editBanner}><IoMoveOutline/><span>拖曳設施或擺飾，安排喜歡的位置</span></div><div className={styles.editDock}>{selected?<><strong>{selected.kind==="station"?FOREST_STATIONS.find(item=>item.id===selected.id)!.name:decorationName(selected.id)}</strong><div className={styles.arrows}>{[["←",-3,0],["↑",0,-3],["↓",0,3],["→",3,0]].map(([label,x,y])=><button key={label} aria-label={`移動${label}`} onClick={()=>moveSelected(Number(x),Number(y))}>{label}</button>)}</div></>:<span>點一下想移動的設施或擺飾</span>}<button className={styles.greenButton} onClick={()=>{setEditing(false);setSelected(null);if(preparingPet){openPet(preparingPet);setPreparingPet(null);}}}>{preparingPet?pets.includes(preparingPet)?"完成佈置，回到小約定":"完成佈置，繼續邀請":"完成佈置"} <IoCheckmark/></button></div></>}
      <nav className={styles.nav} aria-label="小日之家功能">{NAV.map(item=><button key={item.id} className={item.id==="journal"?styles.diaryNav:undefined} aria-current={item.id===panel?"page":undefined} onClick={()=>{setEditing(false);setPanel(item.id);if(item.id==="pets")setResidenceTab("residents");setToast("");}}><span>{item.label}</span><NavArt id={item.id}/>{item.id==="journal"&&hasTaskReward&&<i/>}</button>)}</nav>
    </div>
    {collectFx&&<div key={collectFx.key} className={styles.collectFx} aria-hidden="true" style={{left:`${collectFx.x/ROOM_WIDTH*100}%`,top:`${collectFx.y/sceneHeight*100}%`,"--coin-dx":`${58-collectFx.x*(worldRef.current?.clientWidth??393)/393}px`,"--coin-dy":`${88-collectFx.y*(worldRef.current?.clientWidth??393)/393}px`} as CSSProperties} onAnimationEnd={()=>setCollectFx(null)}><Coin/><strong>+{coin(collectFx.coins)}</strong></div>}
    {flash>0&&<div key={flash} className={styles.flash}/>}
    {toast&&<div className={styles.toast} role="status">{toast}</div>}
    {panel&&<div className={styles.scrim} onClick={event=>{if(event.target===event.currentTarget)close();}}><section ref={dialogRef} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="forest-panel-title">
      <div className={styles.handle}/><header className={styles.sheetHeader}><div><small>走走小日 · 小屋日常</small><h2 id="forest-panel-title">{panelTitle}</h2></div><button className={styles.close} onClick={close} aria-label="關閉面板"><IoClose/></button></header>
      <div className={styles.sheetBody}>
        {panel==="station"&&(()=>{const current=forest.stations[stationId];const unlocked=pets.includes(chosenStation.pet);const yieldNow=stationYield(current,stationId,now);return <>
          <div className={styles.stationHero}><img src={chosenStation.image} alt={chosenStation.name}/><div><span className={styles.tag}>{current.level?`Lv.${current.level} · 製作設施`:"小屋裡的新香氣"}</span><p>{chosenStation.description}</p><div className={styles.outputStat}><Coin small/>{chosenStation.value*Math.max(1,current.level)} <small>/ 份 · 每 {chosenStation.interval/1000} 秒</small></div></div></div>
          {current.level?<><div className={styles.receipt}><span>已準備的料理<small>離開時也會累積，最多保留 2 小時</small></span><strong>{yieldNow.count} 份</strong><button disabled={!yieldNow.count||!unlocked} onClick={()=>forestAction({type:"collect",id:stationId,now:Date.now()})}>領取 {coin(yieldNow.coins)}</button></div><button className={styles.greenButton} disabled={current.level>=5||forest.coins<upgradeCost(current.level)||!unlocked} onClick={()=>forestAction({type:"upgrade",id:stationId,now:Date.now()})}>{current.level>=5?"已達最高等級":<>升到 Lv.{current.level+1}<span><Coin small/>{upgradeCost(current.level)}</span></>}</button><p className={styles.note}>升級後每份 +{chosenStation.value} 小日幣 · 已完成料理會先按原價結算</p><button className={styles.textButton} onClick={()=>startEditing({kind:"station",id:stationId})}><IoMoveOutline/>換個位置</button></>:<><button className={styles.greenButton} disabled={unlocked&&forest.coins<chosenStation.cost} onClick={()=>{if(!unlocked){openPet(chosenStation.pet);return;}if(forestAction({type:"build",id:stationId,now:Date.now()}))close();}}>{unlocked?<>建造茶屋<span><Coin small/>{chosenStation.cost}</span></>:<><IoLockClosedOutline/>先邀請黃金獵犬</>}</button><p className={styles.note}>{unlocked?"建造後夥伴會自動開始準備花草茶。":"透過主線收藏或生活大禮包，把夥伴帶回小屋。"}</p></>}
        </>;})()}
        {panel==="build"&&<><div className={styles.segment}><button aria-pressed={buildTab==="station"} onClick={()=>setBuildTab("station")}>製作設施</button><button aria-pressed={buildTab==="decor"} onClick={()=>setBuildTab("decor")}>生活佈置</button></div>
          {buildTab==="station"?<><p className={styles.intro}>一點點香氣，一點點熱鬧。讓夥伴把日子過起來。</p>{FOREST_STATIONS.map(item=><button key={item.id} className={styles.facilityRow} onClick={()=>{setStationId(item.id);setPanel("station");}}><img src={item.image} alt=""/><span><strong>{item.name}</strong><small>{forest.stations[item.id].level?`Lv.${forest.stations[item.id].level} · 正在準備料理`:pets.includes(item.pet)?`建造需要 ${item.cost} 小日幣`:"隨黃金獵犬解鎖"}</small></span><IoChevronForward/></button>)}</>:<><p className={styles.intro}>喜歡的東西擺進來，夥伴會自己來坐坐。{visibleForest.decorations.length}/6 件</p><div className={styles.itemGrid}>{DECOR.map(id=>{const owned=canUseDecoration(home,story,id);const placed=forest.decorations.some(item=>item.id===id);const definition=HOME_FURNITURE.find(item=>item.id===id);const canBuy=definition?.source==="hearts"&&home.purchases.story;return <article className={styles.decorCard} key={id}><div className={styles.decorArt}><DecorImage id={id}/></div><strong>{decorationName(id)}</strong><small>{placed?"已在小屋裡":owned?"已收藏":canBuy?`心意 ${definition!.price}`:"主線收藏 / 大禮包"}</small><button onClick={()=>{if(placed){setDecorId(id);setPanel("decor");}else if(owned){if(forestAction({type:"place",id}))startEditing({kind:"decoration",id});}else if(canBuy&&id!=="rest"){homeAction({type:"buy-furniture",id});}else{setPanel("shop");}}}>{placed?"調整":owned?"擺進小屋":canBuy?"用心意添置":"查看收藏"}</button></article>;})}</div></>}
        </>}
        {panel==="decor"&&<><div className={styles.decorHero}><DecorImage id={decorId}/></div><p className={styles.intro}>{decorId==="rest"?"陽光落下來的時候，夥伴會到這裡歇一會。":"留一個喜歡的角落，等待夥伴來發現。"}</p><button className={styles.greenButton} onClick={()=>startEditing({kind:"decoration",id:decorId})}><IoMoveOutline/>移動位置</button><button className={styles.textButton} onClick={()=>{if(forestAction({type:"remove",id:decorId}))close();}}>收進收藏</button></>}
        {(panel==="pets"||panel==="pet"||panel==="welcome")&&<ResidencePanel view={panel==="pets"?"list":panel==="welcome"?"welcome":"detail"} tab={residenceTab} pet={petId} home={home} forest={forest} story={story} now={now} onTab={setResidenceTab} onPet={openPet} onPrepare={prepareRoom}
          onInvite={id=>{if(residenceAction({type:"send-invitation",pet:id,now:Date.now()})){close();play.setHint("邀請已寄出，門口有消息時記得來迎接牠");}}}
          onWelcome={id=>{setPetId(id);setPanel("welcome");}} onCheckIn={id=>{if(residenceAction({type:"check-in",pet:id,now:Date.now()})){close();play.setHint("新夥伴入住了！點頭上的心願，開始一起生活吧");}}}
          onShop={()=>setPanel("shop")} onStory={()=>router.push(withTrialProfileSearch(ROUTES.gameLobby))} onClaim={id=>residenceAction({type:"claim-request",pet:id,now:Date.now()})} onPlay={guideRequest}/>}
        {panel==="journal"&&<><div className={styles.segment}><button aria-pressed={journalTab==="tasks"} onClick={()=>{setJournalTab("tasks");setPhoto(null);}}>小心願</button><button aria-pressed={journalTab==="album"} onClick={()=>setJournalTab("album")}>相簿 · {home.photos.length}</button></div>{journalTab==="tasks"?<><p className={styles.intro}>把小事做好，日子就慢慢長成喜歡的樣子。</p>{FOREST_TASKS.map((task,index)=>{const claimed=forest.claimedTasks.includes(task.id);const complete=taskComplete(forest,task.id);return <div className={styles.task} key={task.id}><span className={styles.taskNumber}>{claimed?<IoCheckmark/>:`0${index+1}`}</span><div><strong>{task.title}</strong><small>{task.detail}</small></div><button disabled={!complete||claimed} aria-label={`領取${task.title}獎勵`} onClick={()=>forestAction({type:"task",id:task.id})}>{claimed?"已收下":<><Coin small/>{task.reward}</>}</button></div>;})}<div className={styles.journalFoot}><IoFlowerOutline/>已經送出 {forest.sold} 份溫暖的料理</div></>:photo?<><img className={styles.photoDetail} src={photo.image} alt={photo.caption}/><p className={styles.intro}>{photo.caption}</p>{confirmDelete?<><button className={styles.greenButton} onClick={()=>{if(homeAction({type:"delete-photo",id:photo.id})){setPhoto(null);setConfirmDelete(false);}}}>確認移除照片</button><button className={styles.textButton} onClick={()=>setConfirmDelete(false)}>留下這張</button></>:<><a className={styles.greenButton} href={photo.image} download={`小日之家-${photo.id}.jpg`}>下載照片</a><div className={styles.photoActions}><button onClick={()=>setConfirmDelete(true)}>移除照片</button><button onClick={()=>setPhoto(null)}>回到相簿</button></div></>}</>:home.photos.length?<div className={styles.photos}>{home.photos.map(entry=><button key={entry.id} onClick={()=>{setPhoto(entry);setConfirmDelete(false);}}><img src={entry.image} alt={entry.caption}/><span>{entry.caption}</span></button>)}</div>:<div className={styles.empty}><IoCameraOutline/><h3>這一頁，留給喜歡的風景</h3><p>關閉手帳，按小屋右側的相機，<br/>留下夥伴的第一張日常。</p></div>}</>}
        {panel==="shop"&&(product?<><div className={styles.purchaseIcon}><IoGiftOutline/></div><h3 className={styles.purchaseTitle}>{product==="story"?"主線收藏權":"小日生活大禮包"}</h3><p className={styles.intro}>{product==="story"?"隨故事收集黃金獵犬與雨呱，讓牠們入住小屋；開放用心意添置生活收藏。":"取得黃金獵犬與雨呱的邀請資格、收藏全部 8 件家具。準備好角落、迎接入住後，就能一起生活。"}</p><p className={styles.purchaseNote}>這是原型的購買體驗，不會收費。<br/>不會改寫主線的故事或收集紀錄。</p><button className={styles.greenButton} onClick={()=>{if(homeAction({type:"purchase",product})){setProduct(null);setPanel("pets");}}}>確認模擬購買</button><button className={styles.textButton} onClick={()=>setProduct(null)}>再想一想</button></>:<><p className={styles.intro}>故事裡的相遇，成為小屋裡的陪伴。</p><article className={styles.product}><div className={styles.productArt}><img src={HOME_PETS[1].image} alt=""/><IoBookOutline/></div><span className={styles.tag}>跟著故事，慢慢相遇</span><h3>主線收藏權</h3><p>主線收集後入住夥伴、開放專屬收藏，<br/>再用心意與料理收入打造日常。</p><button className={styles.greenButton} disabled={home.purchases.story} onClick={()=>setProduct("story")}>{home.purchases.story?"已擁有":"模擬購買主線收藏權"}<IoArrowForward/></button></article><article className={`${styles.product} ${styles.bundle}`}><div className={styles.productArt}>{HOME_PETS.map(pet=><img key={pet.id} src={pet.image} alt=""/>)}</div><span className={styles.tag}>讓小屋，現在就熱鬧起來</span><h3>小日生活大禮包</h3><p>3 位夥伴的入住資格・8 件家具全部收藏。<br/>多一位小廚師，也多一點日常的香氣。</p><button className={styles.greenButton} disabled={home.purchases.bundle} onClick={()=>setProduct("bundle")}>{home.purchases.bundle?"已擁有":"模擬購買生活大禮包"}<IoArrowForward/></button></article><p className={styles.note}>目前購買不收費，正式售價尚未設定。</p></>)}
      </div>
    </section></div>}
  </main>;
}
