import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import { HOME_PETS, type CareAction, type HomePetId } from "@/lib/game/petHome";
import type { DecorId, ForestState } from "@/lib/game/petForest";
import { fromRoomPoint, toRoomPoint } from "@/lib/game/petRoomLayout";
import { ACTIVITY_DURATION, activityPose, advancePetStroke, decorActivity, idlePetPoint, isOnFloor, keepOnFloor, type RoomActivity, type RoomPoint } from "@/lib/game/petRoomInteraction";

export type RoomTool = "feed" | "play";
export type RoomFeedback = {id:number;pet:HomePetId;text:string;at:number};
type Props={forest:ForestState;pets:HomePetId[];now:number;height:number;svg:RefObject<SVGSVGElement|null>;enabled:boolean;onCare:(pet:HomePetId,action:CareAction)=>boolean;onMemory:(pet:HomePetId,id:DecorId)=>void};

export function useRoomPlay({forest,pets,now,height,svg,enabled,onCare,onMemory}:Props) {
  const [tool,setTool]=useState<RoomTool|null>(null);
  const [activity,setActivity]=useState<RoomActivity|null>(null);
  const activityRef=useRef<RoomActivity|null>(null);
  const [strokes,setStrokes]=useState<(ReturnType<typeof advancePetStroke>&{point:RoomPoint})|null>(null);
  const strokeRef=useRef<typeof strokes>(null);
  const [feedback,setFeedback]=useState<RoomFeedback|null>(null);
  const [hint,setHint]=useState("摸摸夥伴，或把點心拖給牠");
  const [dragItem,setDragItem]=useState<{kind:RoomTool;x:number;y:number}|null>(null);
  const [dropPet,setDropPet]=useState<HomePetId|null>(null);
  const dragging=useRef<{kind:RoomTool;pointer:number;startX:number;startY:number;moved:boolean}|null>(null);
  const rubbing=useRef<{pet:HomePetId;x:number;y:number;at:number}|null>(null);
  const suppressUntil=useRef(0);
  const callbacks=useRef({onCare,onMemory});callbacks.current={onCare,onMemory};
  const counter=useRef(0);
  const logicalPoint=(clientX:number,clientY:number)=>{
    const scene=svg.current;const matrix=scene?.getScreenCTM();if(!scene||!matrix)return null;
    const point=scene.createSVGPoint();point.x=clientX;point.y=clientY;
    const local=point.matrixTransform(matrix.inverse());return fromRoomPoint(local.x,local.y,height);
  };
  const currentPoint=(pet:HomePetId):RoomPoint=>{
    const node=svg.current?.querySelector<SVGGElement>(`[data-resident="${pet}"]`);
    const matrix=node?.getScreenCTM();
    if(matrix){const point=logicalPoint(matrix.e,matrix.f);if(point)return point;}
    return idlePetPoint(pet,pets.indexOf(pet),forest,Date.now());
  };
  const petAt=(x:number,y:number)=>{
    let nearest:HomePetId|null=null;let distance=Infinity;
    svg.current?.querySelectorAll<SVGGraphicsElement>('[data-pet-hit]').forEach(node=>{
      const r=node.getBoundingClientRect();const dx=x-(r.left+r.width/2),dy=y-(r.top+r.height/2);
      const d=Math.hypot(dx,dy);if(d<Math.max(r.width,r.height)/2+18&&d<distance){nearest=node.getAttribute('data-pet-hit') as HomePetId;distance=d;}
    });
    return nearest;
  };
  const begin=(pet:HomePetId,kind:RoomActivity['kind'],to:RoomPoint,decor?:DecorId)=>{
    if(!pets.includes(pet)||activityRef.current)return;
    const next={pet,kind,to:keepOnFloor(to),from:currentPoint(pet),startedAt:Date.now(),decor};
    activityRef.current=next;setActivity(next);setTool(null);setFeedback(null);strokeRef.current=null;setStrokes(null);
    const name=HOME_PETS.find(item=>item.id===pet)!.name;
    setHint(kind==="feed"?`${name}聞到點心的香味了…`:kind==="play"?`${name}追著皮球跑過來了！`:kind==="pet"?`${name}舒服地瞇起眼睛`:kind==="rest"?`${name}窩在懶骨頭，慢慢休息`:kind==="splash"?`${name}噗通跳進小池裡`:`${name}正在探索這個角落`);
  };
  useEffect(()=>{
    const active=activityRef.current;
    if(active&&activityPose(active,now).done){
      // Clear before applying the reward: rerenders and double input cannot finish twice.
      activityRef.current=null;setActivity(null);
      const care=active.kind==="pet"||active.kind==="feed"||active.kind==="play";
      const earned=care&&callbacks.current.onCare(active.pet,active.kind as CareAction);
      if(active.decor)callbacks.current.onMemory(active.pet,active.decor);
      const text=earned?"♥ +3 · 親密 +8":active.kind==="rest"?"這裡好舒服…":active.kind==="splash"?"噗通！":care?"好喜歡和你在一起":"發現喜歡的小角落";
      setFeedback({id:++counter.current,pet:active.pet,text,at:now});setHint("也可以點點家具，看看牠會怎麼玩");
    }
    if(strokeRef.current&&now-strokeRef.current.at>4500){strokeRef.current=null;setStrokes(null);if(!active)setHint("摸摸夥伴，或把點心拖給牠");}
    if(feedback&&now-feedback.at>2600)setFeedback(null);
  },[now,feedback]);
  useEffect(()=>{if(!enabled){setTool(null);setDragItem(null);setDropPet(null);dragging.current=null;rubbing.current=null;strokeRef.current=null;setStrokes(null);}},[enabled]);
  const stroke=(pet:HomePetId)=>{
    if(activityRef.current)return;
    const previous=strokeRef.current;const next={...advancePetStroke(previous,pet,Date.now()),point:previous?.pet===pet&&Date.now()-previous.at<4500?previous.point:currentPoint(pet)};strokeRef.current=next;setStrokes(next);
    setHint(next.count<3?`再摸摸 ${3-next.count} 下，也可以用手指來回輕撫`:"舒服得想打個盹…");
    if(next.count===3){strokeRef.current=null;setStrokes(null);begin(pet,"pet",currentPoint(pet));}
  };
  const petTap=(pet:HomePetId)=>{
    if(Date.now()<suppressUntil.current)return;
    if(tool)begin(pet,tool,{...currentPoint(pet),x:currentPoint(pet).x+7});else stroke(pet);
  };
  const wishTap=(pet:HomePetId,action:CareAction)=>{
    if(activityRef.current)return;
    if(action==="pet"){setTool(null);stroke(pet);}else{setTool(action);setHint(action==="feed"?"把點心拖到牠身上，也可以直接點牠":"把皮球拖到地板，和牠一起玩");}
  };
  const selectTool=(kind:RoomTool)=>{setTool(current=>current===kind?null:kind);setHint(kind==="feed"?"把點心拖到夥伴身上；也可以選好後點牠":"把皮球拖到地板，夥伴就會追過去");};
  const drop=(kind:RoomTool,point:RoomPoint,pet:HomePetId|null)=>{
    if(activityRef.current){setHint("等牠玩完這一下，再一起玩吧");return;}
    if(kind==="feed"){
      if(pet)begin(pet,"feed",{...currentPoint(pet),x:currentPoint(pet).x+5});else setHint("點心要放到夥伴身上喔");
    }else if(isOnFloor(point)){
      const nearest=pet??pets.reduce((best,id)=>{const a=currentPoint(id),b=currentPoint(best);return Math.hypot(a.x-point.x,(a.y-point.y)/2)<Math.hypot(b.x-point.x,(b.y-point.y)/2)?id:best;},pets[0]);
      if(nearest)begin(nearest,"play",point);
    }else setHint("把皮球放在小屋的地板上吧");
  };
  const toolDown=(event:PointerEvent<HTMLButtonElement>,kind:RoomTool)=>{
    if(!enabled||activityRef.current)return;
    event.preventDefault();strokeRef.current=null;setStrokes(null);event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current={kind,pointer:event.pointerId,startX:event.clientX,startY:event.clientY,moved:false};
  };
  const toolMove=(event:PointerEvent<HTMLButtonElement>)=>{
    const drag=dragging.current;if(!drag||drag.pointer!==event.pointerId)return;
    if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>6)drag.moved=true;
    const point=logicalPoint(event.clientX,event.clientY);if(!drag.moved||!point)return;
    setDragItem({kind:drag.kind,...toRoomPoint(point.x,point.y,height)});setDropPet(petAt(event.clientX,event.clientY));
    setHint(drag.kind==="feed"?"放開手指，把點心交給牠":"放在地板上，讓牠追過去");
  };
  const toolUp=(event:PointerEvent<HTMLButtonElement>)=>{
    const drag=dragging.current;if(!drag||drag.pointer!==event.pointerId)return;
    dragging.current=null;setDragItem(null);setDropPet(null);
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
    if(event.type==="pointercancel")return;
    if(!drag.moved){selectTool(drag.kind);return;}
    const point=logicalPoint(event.clientX,event.clientY);if(point)drop(drag.kind,point,petAt(event.clientX,event.clientY));setTool(null);suppressUntil.current=Date.now()+300;
  };
  const decorTap=(id:DecorId,preferredPet?:HomePetId)=>{
    if(Date.now()<suppressUntil.current||activityRef.current)return;
    const item=forest.decorations.find(entry=>entry.id===id);if(!item)return;
    const pet=preferredPet&&pets.includes(preferredPet)?preferredPet:pets.find(id=>HOME_PETS.find(entry=>entry.id===id)!.favorite===item.id)??pets[0];
    if(pet)begin(pet,decorActivity(id),{x:item.x,y:item.y+3},id);
  };
  const floorTap=(event:PointerEvent|React.MouseEvent)=>{
    if(!tool||Date.now()<suppressUntil.current||(event.target as Element).closest('[role="button"]'))return;
    const point=logicalPoint(event.clientX,event.clientY);if(point)drop(tool,point,null);
  };
  const rubDown=(event:PointerEvent)=>{
    const target=(event.target as Element).closest('[data-pet-hit]');if(!target||tool||activityRef.current)return;
    rubbing.current={pet:target.getAttribute('data-pet-hit') as HomePetId,x:event.clientX,y:event.clientY,at:Date.now()};
  };
  const rubMove=(event:PointerEvent)=>{
    const rub=rubbing.current;if(!rub||Date.now()-rub.at<110)return;
    if(Math.hypot(event.clientX-rub.x,event.clientY-rub.y)<14)return;
    if(petAt(event.clientX,event.clientY)!==rub.pet)return;
    stroke(rub.pet);rub.x=event.clientX;rub.y=event.clientY;rub.at=Date.now();suppressUntil.current=Date.now()+400;
  };
  return {tool,activity,strokes,feedback,hint,dragItem,dropPet,setHint,petTap,wishTap,selectTool,toolDown,toolMove,toolUp,decorTap,floorTap,rubDown,rubMove,rubUp:()=>{rubbing.current=null;},busy:!!activity,activityDuration:activity?ACTIVITY_DURATION[activity.kind]:0};
}
