import { IoArrowForward, IoCheckmark, IoHeart, IoKeyOutline, IoMailOutline, IoPawOutline } from "react-icons/io5";
import { HOME_PETS, homePetLockReason, residentPets, type HomePetId, type PetHomeState } from "@/lib/game/petHome";
import { RESIDENCE, residenceStatus, residentRequest, type RequestStep } from "@/lib/game/petResidence";
import type { DecorId, ForestState } from "@/lib/game/petForest";
import type { PlayerProgress } from "@/lib/game/playerProgress";
import { decorationName, FOREST_DECOR_ART, PetPortrait } from "./ForestScene";
import { FurnitureThumbnail } from "./PetHomeArtwork";
import styles from "./ForestView.module.css";

type Props = {
  view: "list" | "detail" | "welcome"; tab: "residents" | "requests"; pet: HomePetId;
  home: PetHomeState; forest: ForestState; story: PlayerProgress; now: number;
  onTab: (tab: "residents" | "requests") => void; onPet: (pet: HomePetId) => void;
  onPrepare: (pet: HomePetId, id: DecorId) => void; onInvite: (pet: HomePetId) => void;
  onWelcome: (pet: HomePetId) => void; onCheckIn: (pet: HomePetId) => void;
  onShop: () => void; onStory: () => void; onClaim: (pet: HomePetId) => void;
  onPlay: (pet: HomePetId, step?: RequestStep) => void;
};
function Portrait({ pet, size = 88 }: { pet: HomePetId; size?: number }) {
  return <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}><PetPortrait id={pet} size={size}/></svg>;
}
export function ResidencePanel(props: Props) {
  const { view, tab, pet, home, forest, story, now } = props;
  const chosen = HOME_PETS.find(item => item.id === pet)!;
  const info = RESIDENCE[pet];
  const state = residenceStatus(home, forest, story, pet, now);
  const requestCard = (id: HomePetId) => {
    const request = residentRequest(home, id, now);
    const name = HOME_PETS.find(item => item.id === id)!.name;
    return <article className={styles.requestCard} key={id}>
      <header><Portrait pet={id} size={52}/><div><small>{name}的小約定 · 已完成 {request.round} 次</small><h3>{request.title}</h3></div><span>{request.count}/2</span></header>
      <p>{request.seconds ? "心意收到了，夥伴正在享受這個片刻。" : request.note}</p>
      <div className={styles.requestSteps}>{request.steps.map(step => <button key={step.id} disabled={request.done.includes(step.id) || !!request.seconds} onClick={() => props.onPlay(id, step.id)}><i>{request.done.includes(step.id) ? <IoCheckmark/> : <IoPawOutline/>}</i>{step.label}<IoArrowForward/></button>)}</div>
      <footer><span><IoHeart/> 8 <small>＋ 親密 4</small></span>{request.complete ? <button onClick={() => props.onClaim(id)}>收下{name}的謝禮</button> : <small>{request.seconds ? `${request.seconds} 秒後再約` : "完成互動後，會在這裡蓋章"}</small>}</footer>
    </article>;
  };
  if (view === "list") return <>
    <div className={styles.segment}><button aria-pressed={tab === "residents"} onClick={() => props.onTab("residents")}>入住簿 · {residentPets(home, story).length}/3</button><button aria-pressed={tab === "requests"} onClick={() => props.onTab("requests")}>生活小約定</button></div>
    {tab === "requests" ? <><p className={styles.intro}>看看誰想一起做點什麼。回到小屋，把心意交到牠身邊。</p>{residentPets(home, story).map(requestCard)}</> : <>
      <div className={styles.registryIntro}><IoKeyOutline/><div><strong>為每一次相遇，留一個位置</strong><span>準備角落 → 寄出邀請 → 迎接入住</span></div></div>
      {HOME_PETS.map(item => {
        const s = residenceStatus(home, forest, story, item.id, now); const room = RESIDENCE[item.id];
        return <button className={styles.residenceCard} key={item.id} onClick={() => props.onPet(item.id)} aria-label={`查看${item.name}的入住卡`}>
          <div className={styles.roomNumber}><IoKeyOutline/>{room.number}</div><Portrait pet={item.id}/>
          <div className={styles.residenceInfo}><small>{room.room}</small><strong>{item.name}</strong><p>{s.resident ? room.benefit : room.note}</p><span className={styles.residenceStatus} data-ready={s.arrived || s.resident}>{s.resident ? "已入住" : s.arrived ? "在門口等你" : s.invited ? `正在過來 · ${s.seconds}s` : !s.unlocked ? "查看邀請條件" : s.prepared ? "可以寄出邀請" : `佈置準備 ${s.needs.filter(n => n.placed).length}/2`}</span></div><IoArrowForward/>
        </button>;
      })}
    </>}
  </>;
  if (view === "welcome" && state.arrived && !state.resident) return <div className={styles.welcomeCard}>
    <div className={styles.welcomePortrait}><Portrait pet={pet} size={142}/><IoKeyOutline/></div><small>叩叩，有一位熟悉的新朋友</small><h3>{chosen.name}來了！</h3><p>「{info.note}」</p><div className={styles.welcomeRoom}><IoKeyOutline/><span>入住 {info.number}<strong>{info.room}</strong></span><IoCheckmark/></div>
    <button className={styles.greenButton} disabled={!state.prepared} onClick={() => props.onCheckIn(pet)}>把鑰匙交給{chosen.name} <IoKeyOutline/></button>
    {!state.prepared && <button className={styles.textButton} onClick={() => props.onPet(pet)}>先補好牠的生活角落</button>}<p className={styles.note}>從此會留在小屋，和你一起生活。</p>
  </div>;
  return <>
    <div className={styles.residenceHero}><Portrait pet={pet} size={115}/><div><span className={styles.tag}>{info.number} · {info.room}</span><p>「{info.note}」</p><small>{info.benefit}</small></div></div>
    {state.resident ? <><div className={styles.residentBond}><IoHeart/><span>親密度 {home.bonds[pet]}/100</span><i><b style={{width:`${home.bonds[pet]}%`}}/></i></div>{requestCard(pet)}<button className={styles.textButton} onClick={() => props.onPlay(pet)}>回小屋找{chosen.name} <IoPawOutline/></button></> : <>
      <ol className={styles.arrivalSteps}><li data-done={state.unlocked}>01 相遇</li><li data-done={state.prepared && state.unlocked}>02 準備</li><li data-done={state.invited}>03 邀請</li></ol>
      {!state.unlocked && <div className={styles.unlockNote}><strong>{homePetLockReason(home, story, pet)}</strong><p>購買主線並完成{chosen.chapter}收集，<br/>或透過生活大禮包取得邀請資格與專屬家具。</p><button onClick={home.purchases.story ? props.onStory : props.onShop}>{home.purchases.story ? "回主線繼續收集" : "看看收藏方案"}<IoArrowForward/></button>{home.purchases.story && <button onClick={props.onShop}>看看生活大禮包</button>}</div>}
      <p className={styles.requirementTitle}>牠想帶來的小日常</p>
      {state.needs.map(need => <div className={styles.requirement} key={need.id}><div className={styles.requirementArt}>{FOREST_DECOR_ART[need.id] ? <img src={FOREST_DECOR_ART[need.id]!.src} alt=""/> : need.id !== "rest" && <FurnitureThumbnail id={need.id}/>}</div><span><strong>{decorationName(need.id)}</strong><small>{need.placed ? "已準備好了" : "擺進小屋，留一個牠喜歡的位置"}</small></span>{need.placed ? <IoCheckmark/> : <button disabled={!state.unlocked} onClick={() => props.onPrepare(pet, need.id)}>擺放</button>}</div>)}
      {state.unlocked && <button className={styles.greenButton} disabled={!state.prepared || (state.invited && !state.arrived)} onClick={() => state.arrived ? props.onWelcome(pet) : props.onInvite(pet)}>{state.arrived ? <>去門口迎接{chosen.name} <IoKeyOutline/></> : state.invited ? `邀請已送到 · ${state.seconds} 秒後抵達` : state.prepared ? <>寄出邀請 <IoMailOutline/></> : "先準備好上面的兩件物品"}</button>}
      <p className={styles.note}>{state.invited ? "離開畫面也沒關係，牠會在門口等你。" : "邀請沒有額外費用，準備好了就能出發。"}</p>
    </>}
  </>;
}
