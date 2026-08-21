export type ExhibitionPhase =
  | "departure-opening"
  | "mai-intro"
  | "departure-plan"
  | "departure-route"
  | "metro-arrival"
  | "metro-opening"
  | "metro-comic"
  | "metro-dog"
  | "dog-photo-diary"
  | "diary-incomplete"
  | "post-puzzle-metro"
  | "post-flashback-diary"
  | "post-flashback-metro"
  | "metro-to-company"
  | "office-opening"
  | "work-arrival"
  | "box-game"
  | "work-complete"
  | "work-dusk"
  | "work-leave"
  | "home-search"
  | "diary-restore"
  | "bai-change-first"
  | "bai-after-flashback"
  | "frog-diary-fragment"
  | "morning-route-intro"
  | "morning-route"
  | "street-flyer"
  | "convenience-clerk"
  | "work-return"
  | "work-value"
  | "work-todo"
  | "work-pack"
  | "work-social"
  | "work-files"
  | "work-flow"
  | "work-clicker"
  | "dessert-transition"
  | "frog-dessert"
  | "home-final"
  | "argument-flashback"
  | "complete";

export type ExhibitionNarrativePhase =
  | "departure-opening"
  | "departure-plan"
  | "metro-arrival"
  | "metro-opening"
  | "post-puzzle-metro"
  | "post-flashback-diary"
  | "post-flashback-metro"
  | "work-arrival"
  | "work-complete"
  | "work-leave"
  | "home-search"
  | "bai-change-first"
  | "bai-after-flashback"
  | "morning-route-intro"
  | "work-return"
  | "dessert-transition"
  | "home-final"
  | "argument-flashback";

export type ExhibitionNarrativeLine = {
  id: string;
  speaker: "旁白" | "小麥" | "小貝狗" | "小白" | "同事";
  text: string;
  sceneLabel: string;
  backgroundImage: string;
  backgroundPosition?: string;
  backgroundSize?: string;
  avatar?: {
    spriteId: "mai" | "beigo" | "bai" | "coworker";
    frameIndex: number;
    frameSequence?: readonly number[];
    frameDurationMs?: number;
    motionId?: "jump-once" | "slide-in-left" | "sway-horizontal";
  };
  locationTransition?: {
    title: string;
    subtitle?: string;
  };
  automaticDoorTransition?: boolean;
  doorSwipeInteraction?: {
    openImage: string;
    instruction?: string;
    promptDelayMs?: number;
    advanceDelayMs?: number;
  };
  showLightOrb?: boolean;
  diaryLightTransfer?: "page" | "flying" | "absorbed";
  clueText?: string;
  flashback?: boolean;
  floatingDiaryPages?: boolean;
  baiRoomFullImageIntro?: boolean;
  beigoDiaryRevealSequence?: boolean;
  beigoRushComicEnter?: boolean;
  isInnerThought?: boolean;
  hideBackgroundShade?: boolean;
  comicPresentation?:
    | "fall-double"
    | "door-close-single"
    | "beigo-rush-single"
    | "blank-diary-single";
};

const METRO_DOG_BACKGROUND = "/images/428出圖/追加作畫/黃金獵犬/黃金獵犬_背景.jpg";
const HOME_LANE_DAY_BACKGROUND = "/images/428出圖/背景/家門口巷弄_白天.jpg";
const MRT_DOOR_BACKGROUND = "/images/428出圖/暫時/mrt_door.png";
const MRT_DOOR_OPEN_BACKGROUND = "/images/428出圖/暫時/mrt_door_open.png";
const MRT_INTERIOR_BACKGROUND = "/images/428出圖/背景/捷運.png";
const OFFICE_DAY_BACKGROUND = "/images/428出圖/背景/公司_白天.jpg";
const OFFICE_DUSK_BACKGROUND = "/images/428出圖/背景/公司_黃昏.jpg";
const STREET_DUSK_BACKGROUND = "/images/428出圖/背景/公司附近街道_黃昏.jpg";
const ENTRANCE_NIGHT_BACKGROUND = "/images/428出圖/背景/玄關_關燈_關門.png";
const LIVING_ROOM_NIGHT_BACKGROUND = "/images/428出圖/背景/客廳_晚上.jpg";
const BAI_ROOM_BACKGROUND = "/images/428出圖/背景/小白房間_開燈.jpg";
const BAI_ROOM_DOOR_CLOSED_BACKGROUND = "/images/428出圖/背景/關門_工作中.jpg";
const BAI_ROOM_DOOR_OPEN_GLOW_BACKGROUND = "/images/428出圖/背景/小白房門_發光.png";
const BAI_FLOATING_DIARY_PAGES_BACKGROUND =
  "/images/428出圖/追加作畫/發光小白拆解/背景.png";
const BAI_GLOW_BACKGROUND = "/images/428出圖/背景/發光小白２.png";
const BEIGO_REVEAL_BACKGROUND = "/images/428出圖/特別演出/Beigo_Reveal_Bg.png";
const DOORSTEP_DAY_BACKGROUND = "/images/outside/Doorstep_Day.png";

export const EXHIBITION_NARRATIVE_LINES: Record<
  ExhibitionNarrativePhase,
  readonly ExhibitionNarrativeLine[]
> = {
  "departure-opening": [
    {
      id: "EX-DEPART-00",
      speaker: "旁白",
      text: "上班族的小麥，最近遇到了一個煩惱⋯⋯",
      sceneLabel: "早晨・家門口",
      backgroundImage: HOME_LANE_DAY_BACKGROUND,
    },
  ],
  "departure-plan": [
    {
      id: "EX-DEPART-01",
      speaker: "小麥",
      text: "繼續空想也不是辦法",
      sceneLabel: "早晨・家門口",
      backgroundImage: HOME_LANE_DAY_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 5 },
    },
    {
      id: "EX-DEPART-02",
      speaker: "小麥",
      text: "時間差不多要出門去上班了……",
      sceneLabel: "早晨・家門口",
      backgroundImage: HOME_LANE_DAY_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 18 },
    },
    {
      id: "EX-DEPART-03",
      speaker: "小麥",
      text: "今天就搭捷運上班好了... 畢竟殘存的日記有提到",
      sceneLabel: "早晨・家門口",
      backgroundImage: HOME_LANE_DAY_BACKGROUND,
      avatar: {
        spriteId: "mai",
        frameIndex: 36,
        frameSequence: [36, 37],
        frameDurationMs: 680,
      },
    },
  ],
  "metro-arrival": [
    {
      id: "EX-METRO-01A",
      speaker: "小麥",
      text: "小白不知道為什麼漂浮著陷入沈睡，還有奇怪的生物....",
      sceneLabel: "早晨・捷運站",
      backgroundImage: MRT_DOOR_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 24 },
      locationTransition: {
        title: "捷運站",
        subtitle: "早晨",
      },
    },
    {
      id: "EX-METRO-01B",
      speaker: "小麥",
      text: "真是不知道該怎麼辦",
      sceneLabel: "早晨・捷運站",
      backgroundImage: MRT_DOOR_OPEN_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 24 },
    },
    {
      id: "EX-METRO-01C",
      speaker: "旁白",
      text: "叮咚、叮咚——嘟嘟嘟嘟！",
      sceneLabel: "早晨・捷運站",
      backgroundImage: MRT_DOOR_OPEN_BACKGROUND,
    },
    {
      id: "EX-METRO-02",
      speaker: "小麥",
      text: "啊啊！要上車了！",
      sceneLabel: "早晨・捷運站",
      backgroundImage: MRT_DOOR_OPEN_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 27 },
    },
  ],
  "metro-opening": [
    {
      id: "EX-01",
      speaker: "小麥",
      text: "呼……差點沒上到車。",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 13 },
      hideBackgroundShade: true,
    },
    {
      id: "EX-02",
      speaker: "小麥",
      text: "那邊是……？",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 34 },
      hideBackgroundShade: true,
    },
    {
      id: "EX-03",
      speaker: "旁白",
      text: "警示聲正要結束，一道金色的影子突然衝進車廂。",
      sceneLabel: "早晨・捷運",
      backgroundImage: METRO_DOG_BACKGROUND,
      hideBackgroundShade: true,
    },
  ],
  "post-puzzle-metro": [
    {
      id: "EX-DIARY-01",
      speaker: "小麥",
      text: "消失的日記逐漸出現文字了...",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 34 },
      hideBackgroundShade: true,
    },
    {
      id: "EX-DIARY-02",
      speaker: "小麥",
      text: "雖然還有很多內容沒有恢復，可是……",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 36 },
      hideBackgroundShade: true,
    },
    {
      id: "EX-DIARY-03",
      speaker: "小麥",
      text: "小貝狗說的是真的……拍下小日獸，日記就會恢復。",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 38 },
      hideBackgroundShade: true,
    },
  ],
  "post-flashback-diary": [
    {
      id: "EX-DIARY-FOUND-01",
      speaker: "小貝狗",
      text: "嗷嗷！日記！日記！",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "beigo", frameIndex: 2, motionId: "jump-once" },
      hideBackgroundShade: true,
    },
    {
      id: "EX-DIARY-FOUND-02",
      speaker: "小麥",
      text: "咦……？這是小白的日記？",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 34 },
      hideBackgroundShade: true,
    },
  ],
  "post-flashback-metro": [
    {
      id: "EX-METRO-03",
      speaker: "旁白",
      text: "叮咚、叮咚——ＸＸ站到了～ＸＸ站到了～",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      hideBackgroundShade: true,
    },
    {
      id: "EX-METRO-04",
      speaker: "小麥",
      text: "啊，已經到站了！先去公司，下班後再回家看看小白。",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 34 },
      hideBackgroundShade: true,
    },
  ],
  "work-arrival": [
    {
      id: "EX-09",
      speaker: "同事",
      text: "小麥，這批資料箱可以幫我疊進櫃子嗎？我等等急著找檔案。",
      sceneLabel: "上午・公司",
      backgroundImage: OFFICE_DAY_BACKGROUND,
      avatar: { spriteId: "coworker", frameIndex: 0 },
    },
    {
      id: "EX-10",
      speaker: "小麥",
      text: "好，交給我吧....",
      sceneLabel: "上午・公司",
      backgroundImage: OFFICE_DAY_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 5 },
    },
  ],
  "work-complete": [
    {
      id: "EX-WORK-00",
      speaker: "小麥",
      text: "資料箱都整理好了！",
      sceneLabel: "下午・公司",
      backgroundImage: OFFICE_DAY_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 6 },
    },
    {
      id: "EX-WORK-01",
      speaker: "同事",
      text: "感謝！小麥，你真是可靠！",
      sceneLabel: "下午・公司",
      backgroundImage: OFFICE_DAY_BACKGROUND,
      avatar: { spriteId: "coworker", frameIndex: 0 },
    },
  ],
  "work-leave": [
    {
      id: "EX-WORK-02",
      speaker: "小麥",
      text: "工作告一段落了，趕緊回家看看小白。",
      sceneLabel: "黃昏・公司",
      backgroundImage: OFFICE_DUSK_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 36 },
      isInnerThought: true,
    },
    {
      id: "EX-WORK-03",
      speaker: "旁白",
      text: "小麥離開公司，沿著黃昏的街道匆匆趕回家。",
      sceneLabel: "黃昏・下班途中",
      backgroundImage: STREET_DUSK_BACKGROUND,
    },
  ],
  "home-search": [
    {
      id: "EX-HOME-01",
      speaker: "小麥",
      text: "到家了。",
      sceneLabel: "晚上・玄關",
      backgroundImage: ENTRANCE_NIGHT_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 0 },
      automaticDoorTransition: true,
    },
    {
      id: "EX-HOME-02",
      speaker: "小麥",
      text: "黃金獵犬已經收集回來了……小白是不是也恢復了？",
      sceneLabel: "晚上・客廳",
      backgroundImage: LIVING_ROOM_NIGHT_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 37, motionId: "slide-in-left" },
      isInnerThought: true,
    },
    {
      id: "EX-HOME-03",
      speaker: "小麥",
      text: "我得趕快去小白房間看看。",
      sceneLabel: "晚上・客廳",
      backgroundImage: LIVING_ROOM_NIGHT_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 5 },
      isInnerThought: true,
    },
  ],
  "bai-change-first": [
    {
      id: "EX-14",
      speaker: "旁白",
      text: "小麥抓緊包包，立刻穿過客廳，往小白房間走去。",
      sceneLabel: "晚上・客廳",
      backgroundImage: LIVING_ROOM_NIGHT_BACKGROUND,
    },
    {
      id: "EX-15",
      speaker: "小麥",
      text: "小白？我進來囉。",
      sceneLabel: "晚上・小白房門",
      backgroundImage: BAI_ROOM_DOOR_CLOSED_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 5, motionId: "slide-in-left" },
      doorSwipeInteraction: {
        openImage: BAI_ROOM_DOOR_OPEN_GLOW_BACKGROUND,
        instruction: "往左滑開門",
        promptDelayMs: 420,
        advanceDelayMs: 620,
      },
    },
    {
      id: "EX-16",
      speaker: "旁白",
      text: "小白仍漂浮在原處，身上的灰白光芒沒有消失，也沒有醒來。",
      sceneLabel: "小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
    },
    {
      id: "EX-17",
      speaker: "小麥",
      text: "還是沒有恢復……",
      sceneLabel: "小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 28 },
    },
    {
      id: "EX-18",
      speaker: "小貝狗",
      text: "日記～嗷！",
      sceneLabel: "小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      avatar: { spriteId: "beigo", frameIndex: 2, motionId: "jump-once" },
    },
    {
      id: "EX-19",
      speaker: "小麥",
      text: "日記？要我把它拿出來嗎？",
      sceneLabel: "小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 36 },
    },
  ],
  "bai-after-flashback": [
    {
      id: "EX-NOW-01",
      speaker: "旁白",
      text: "小麥依言攤開日記。剛恢復的黃金獵犬那一格，開始透出柔和的光。",
      sceneLabel: "現在・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      diaryLightTransfer: "page",
    },
    {
      id: "EX-NOW-02",
      speaker: "旁白",
      text: "那一格從頁面浮起，化成一塊光，飛向小白。",
      sceneLabel: "現在・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      diaryLightTransfer: "flying",
    },
    {
      id: "EX-NOW-03",
      speaker: "旁白",
      text: "光格沒入小白胸前。她的指尖微微動了一下，卻仍沒有醒來。",
      sceneLabel: "現在・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      diaryLightTransfer: "absorbed",
    },
    {
      id: "EX-NOW-04",
      speaker: "小麥",
      text: "小白……妳還是沒有醒來……",
      sceneLabel: "現在・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 28 },
    },
    {
      id: "EX-NOW-05",
      speaker: "小貝狗",
      text: "下一篇日記！下一篇日記！",
      sceneLabel: "現在・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      avatar: { spriteId: "beigo", frameIndex: 2, motionId: "jump-once" },
    },
    {
      id: "EX-NOW-06",
      speaker: "小麥",
      text: "下一篇日記……？難道又有新的殘篇了？",
      sceneLabel: "現在・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 36 },
    },
  ],
  "morning-route-intro": [
    {
      id: "EX-18",
      speaker: "旁白",
      text: "小麥決定明天前往街道看看，今天就先休息。",
      sceneLabel: "夜晚・家中",
      backgroundImage: LIVING_ROOM_NIGHT_BACKGROUND,
      clueText: "街道",
    },
    {
      id: "EX-19",
      speaker: "旁白",
      text: "隔天早上，小麥帶著日記線索出門，準備前往街道。",
      sceneLabel: "隔天早上・玄關",
      backgroundImage: DOORSTEP_DAY_BACKGROUND,
      clueText: "街道",
      locationTransition: {
        title: "隔天早上",
        subtitle: "準備出門",
      },
    },
  ],
  "work-return": [
    {
      id: "EX-20",
      speaker: "旁白",
      text: "傳單任務與第一段日記完成後，小麥照原定行程來到公司上班。",
      sceneLabel: "上午・公司",
      backgroundImage: OFFICE_DAY_BACKGROUND,
    },
    {
      id: "EX-21",
      speaker: "小麥",
      text: "先把今天的工作完成吧，午休再想下一步。",
      sceneLabel: "上午・公司",
      backgroundImage: OFFICE_DAY_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 9 },
    },
  ],
  "dessert-transition": [
    {
      id: "EX-22",
      speaker: "同事",
      text: "終於下班了！陪我去甜點店拿生日蛋糕好不好？",
      sceneLabel: "傍晚・公司",
      backgroundImage: OFFICE_DUSK_BACKGROUND,
      avatar: { spriteId: "coworker", frameIndex: 0 },
    },
    {
      id: "EX-23",
      speaker: "小麥",
      text: "甜點店……殘篇裡好像也有類似的字。走吧。",
      sceneLabel: "前往甜點店",
      backgroundImage: STREET_DUSK_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 36 },
    },
  ],
  "home-final": [
    {
      id: "EX-24",
      speaker: "旁白",
      text: "完整拍下青蛙後，小麥帶著復原的日記回到家。日記的光比昨天更亮。",
      sceneLabel: "深夜・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      showLightOrb: true,
    },
    {
      id: "EX-25",
      speaker: "旁白",
      text: "這次，青蛙小日獸與搬家日記都完整回到了書頁裡。",
      sceneLabel: "深夜・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      showLightOrb: true,
    },
    {
      id: "EX-26",
      speaker: "小麥",
      text: "今天先到這裡。小白，等妳醒來，我再把找到的小日獸一隻一隻說給妳聽。",
      sceneLabel: "深夜・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 18 },
    },
  ],
  "argument-flashback": [
    {
      id: "EX-FB-01",
      speaker: "旁白",
      text: "小麥在客廳踩到小白隨手放著的模型，帶著火氣走進她的房間。",
      sceneLabel: "前天・小白房間",
      backgroundImage: BAI_ROOM_BACKGROUND,
      locationTransition: {
        title: "前天早上",
      },
      flashback: true,
    },
    {
      id: "EX-FB-02",
      speaker: "小麥",
      text: "我不是說過，公用空間不要亂放東西嗎？我差點跌倒。",
      sceneLabel: "前天・小白房間",
      backgroundImage: BAI_ROOM_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 21 },
      flashback: true,
    },
    {
      id: "EX-FB-03",
      speaker: "小白",
      text: "對不起……我昨晚在趕稿，拿回房間時忘記了。",
      sceneLabel: "前天・小白房間",
      backgroundImage: BAI_ROOM_BACKGROUND,
      avatar: { spriteId: "bai", frameIndex: 9 },
      flashback: true,
    },
    {
      id: "EX-FB-04",
      speaker: "小麥",
      text: "還有冰箱裡的蛋糕，再不吃就要壞了。妳有在聽嗎？",
      sceneLabel: "前天・小白房間",
      backgroundImage: BAI_ROOM_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 7 },
      flashback: true,
    },
    {
      id: "EX-FB-05",
      speaker: "小白",
      text: "嗯嗯，好啦……我先把這一段畫完。",
      sceneLabel: "前天・小白房間",
      backgroundImage: BAI_ROOM_BACKGROUND,
      avatar: { spriteId: "bai", frameIndex: 6 },
      flashback: true,
    },
    {
      id: "EX-FB-06",
      speaker: "旁白",
      text: "小麥轉身要走，又踩上地上的草稿。書本、水培植物和小白的日記一起被撞落，水灑了一地。",
      sceneLabel: "前天・小白房間",
      backgroundImage: BAI_ROOM_BACKGROUND,
      flashback: true,
      comicPresentation: "fall-double",
    },
    {
      id: "EX-FB-07",
      speaker: "小白",
      text: "本子都濕掉了……怎麼辦！",
      sceneLabel: "前天・小白房間",
      backgroundImage: BAI_ROOM_BACKGROUND,
      avatar: { spriteId: "bai", frameIndex: 11 },
      flashback: true,
    },
    {
      id: "EX-FB-08",
      speaker: "小麥",
      text: "可是，我是踩到妳的東西才跌倒的。妳都不先問我有沒有受傷嗎？",
      sceneLabel: "前天・小白房間",
      backgroundImage: BAI_ROOM_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 40 },
      flashback: true,
    },
    {
      id: "EX-FB-09",
      speaker: "小白",
      text: "欸？抱、抱歉！小麥，妳還好嗎？",
      sceneLabel: "前天・小白房間",
      backgroundImage: BAI_ROOM_BACKGROUND,
      avatar: { spriteId: "bai", frameIndex: 8 },
      flashback: true,
    },
    {
      id: "EX-FB-10",
      speaker: "小麥",
      text: "不太好。自從住在一起，家事、雜物、放到壞掉的東西……好像永遠都是我在收。",
      sceneLabel: "前天・小白房間",
      backgroundImage: BAI_ROOM_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 45 },
      flashback: true,
    },
    {
      id: "EX-FB-11",
      speaker: "小白",
      text: "對不起，是我最近工作太忙……",
      sceneLabel: "前天・小白房間",
      backgroundImage: BAI_ROOM_BACKGROUND,
      avatar: { spriteId: "bai", frameIndex: 10 },
      flashback: true,
    },
    {
      id: "EX-FB-12",
      speaker: "小麥",
      text: "我本來以為和好朋友一起住，日子會更好玩。",
      sceneLabel: "前天・小白房間",
      backgroundImage: BAI_ROOM_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 46 },
      flashback: true,
    },
    {
      id: "EX-FB-13",
      speaker: "小麥",
      text: "早知道一起生活會是這樣……不如當初不要當室友！",
      sceneLabel: "前天・小白房間",
      backgroundImage: BAI_ROOM_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 44 },
      flashback: true,
    },
    {
      id: "EX-FB-14",
      speaker: "小白",
      text: "等、等等，妳不是真心這樣想吧……",
      sceneLabel: "前天・小白房間",
      backgroundImage: BAI_ROOM_BACKGROUND,
      avatar: { spriteId: "bai", frameIndex: 8 },
      flashback: true,
    },
    {
      id: "EX-FB-15",
      speaker: "旁白",
      text: "碰！小麥沒有回答，門在她身後關上。",
      sceneLabel: "前天・小白房間",
      backgroundImage: BAI_ROOM_BACKGROUND,
      flashback: true,
      comicPresentation: "door-close-single",
    },
    {
      id: "EX-FB-16",
      speaker: "小白",
      text: "小麥她真的……很後悔跟我當室友嗎……",
      sceneLabel: "前天・小白房間",
      backgroundImage: BAI_ROOM_BACKGROUND,
      avatar: { spriteId: "bai", frameIndex: 3 },
      flashback: true,
      isInnerThought: true,
    },
    {
      id: "EX-FB-17",
      speaker: "旁白",
      text: "昨天晚上。小麥回到家，客廳安靜得不太對勁。",
      sceneLabel: "昨天・玄關",
      backgroundImage: ENTRANCE_NIGHT_BACKGROUND,
      flashback: true,
    },
    {
      id: "EX-FB-18",
      speaker: "小麥",
      text: "小白？妳在家嗎？",
      sceneLabel: "昨天・客廳",
      backgroundImage: LIVING_ROOM_NIGHT_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 5, motionId: "slide-in-left" },
      flashback: true,
    },
    {
      id: "EX-FB-20",
      speaker: "小麥",
      text: "嗚哇——！小、小白……！？",
      sceneLabel: "昨天・小白房間",
      backgroundImage: BAI_FLOATING_DIARY_PAGES_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 25 },
      flashback: true,
      floatingDiaryPages: true,
      baiRoomFullImageIntro: true,
    },
    {
      id: "EX-FB-21",
      speaker: "小麥",
      text: "小白……？妳聽得見我嗎？",
      sceneLabel: "昨天・小白房間",
      backgroundImage: BAI_FLOATING_DIARY_PAGES_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 28 },
      flashback: true,
      floatingDiaryPages: true,
    },
    {
      id: "EX-FB-21A",
      speaker: "小麥",
      text: "哇！",
      sceneLabel: "昨天・小白房間",
      backgroundImage: BAI_FLOATING_DIARY_PAGES_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 25, motionId: "sway-horizontal" },
      flashback: true,
      floatingDiaryPages: true,
      comicPresentation: "beigo-rush-single",
      beigoRushComicEnter: true,
    },
    {
      id: "EX-FB-21B",
      speaker: "小麥",
      text: "是、是剛剛在客廳的……？",
      sceneLabel: "昨天・小白房間",
      backgroundImage: BAI_FLOATING_DIARY_PAGES_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 25 },
      flashback: true,
      floatingDiaryPages: true,
      comicPresentation: "beigo-rush-single",
    },
    {
      id: "EX-FB-22",
      speaker: "小貝狗",
      text: "嗷嗷嗷嗷！",
      sceneLabel: "昨天・小白房間",
      backgroundImage: BAI_FLOATING_DIARY_PAGES_BACKGROUND,
      avatar: { spriteId: "beigo", frameIndex: 0, motionId: "jump-once" },
      flashback: true,
      floatingDiaryPages: true,
      beigoDiaryRevealSequence: true,
    },
    {
      id: "EX-FB-23",
      speaker: "旁白",
      text: "小貝狗踏上攤開的交換日記，原本飄在小白身邊的空白紙頁，一張張飛回本子裡。",
      sceneLabel: "昨天・小白房間",
      backgroundImage: BEIGO_REVEAL_BACKGROUND,
      flashback: true,
      hideBackgroundShade: true,
    },
    {
      id: "EX-FB-24",
      speaker: "旁白",
      text: "等空白紙頁全數飛回日記，小麥這才把它拿了起來。",
      sceneLabel: "昨天・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      flashback: true,
      comicPresentation: "blank-diary-single",
    },
    {
      id: "EX-FB-25",
      speaker: "小麥",
      text: "這是……我和小白的交換日記？",
      sceneLabel: "昨天・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 34 },
      flashback: true,
      comicPresentation: "blank-diary-single",
    },
    {
      id: "EX-FB-26",
      speaker: "旁白",
      text: "她一頁一頁翻過去，過去寫下的日記全都變成了一片空白。",
      sceneLabel: "昨天・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      flashback: true,
      comicPresentation: "blank-diary-single",
    },
    {
      id: "EX-FB-27",
      speaker: "小麥",
      text: "只剩下一頁不完整的日記……寫著「捷運」。",
      sceneLabel: "昨天・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 36 },
      flashback: true,
      comicPresentation: "blank-diary-single",
    },
    {
      id: "EX-FB-28",
      speaker: "小貝狗",
      text: "捷運！捷運！嗷！",
      sceneLabel: "昨天・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      avatar: { spriteId: "beigo", frameIndex: 0, motionId: "jump-once" },
      flashback: true,
    },
  ],
};

export const EXHIBITION_NARRATIVE_NEXT_PHASE: Record<
  ExhibitionNarrativePhase,
  ExhibitionPhase
> = {
  "departure-opening": "mai-intro",
  "departure-plan": "departure-route",
  "metro-arrival": "metro-opening",
  "metro-opening": "metro-comic",
  "post-puzzle-metro": "post-flashback-metro",
  "post-flashback-diary": "dog-photo-diary",
  "post-flashback-metro": "metro-to-company",
  "work-arrival": "box-game",
  "work-complete": "work-dusk",
  "work-leave": "home-search",
  "home-search": "bai-change-first",
  "bai-change-first": "bai-after-flashback",
  "bai-after-flashback": "frog-diary-fragment",
  "morning-route-intro": "morning-route",
  "work-return": "work-value",
  "dessert-transition": "frog-dessert",
  "home-final": "complete",
  "argument-flashback": "post-flashback-diary",
};

export const EXHIBITION_DIARY_READ_LINES = [
  {
    speaker: "旁白" as const,
    text: "小麥讀著日記，回想起傻乎乎的黃金獵犬，覺得牠與小白很相像。",
    showName: false,
  },
  {
    speaker: "旁白" as const,
    text: "小貝狗拍打著日記本上的黃金獵犬，重複著「小日獸」這個詞。",
    showName: false,
  },
  {
    speaker: "小貝狗" as const,
    text: "小日獸！小日獸！",
    spriteId: "beigo" as const,
    frameIndex: 0,
  },
  {
    speaker: "小麥" as const,
    text: "所以，這隻黃金獵犬就是你說的小日獸。",
    spriteId: "mai" as const,
    frameIndex: 36,
  },
  {
    speaker: "小麥" as const,
    text: "果然，只要找回小日獸，消失的日記內容就會慢慢恢復。",
    spriteId: "mai" as const,
    frameIndex: 38,
  },
  {
    speaker: "小麥" as const,
    text: "這篇日記已經復原了……小白那邊呢？",
    spriteId: "mai" as const,
    frameIndex: 8,
  },
];

const EXHIBITION_PHASES: ExhibitionPhase[] = [
  "departure-opening",
  "mai-intro",
  "departure-plan",
  "departure-route",
  "metro-arrival",
  "metro-opening",
  "metro-comic",
  "metro-dog",
  "argument-flashback",
  "post-flashback-diary",
  "dog-photo-diary",
  "diary-incomplete",
  "post-puzzle-metro",
  "post-flashback-metro",
  "metro-to-company",
  "office-opening",
  "work-arrival",
  "box-game",
  "work-complete",
  "work-dusk",
  "work-leave",
  "home-search",
  "diary-restore",
  "bai-change-first",
  "bai-after-flashback",
  "frog-diary-fragment",
  "morning-route-intro",
  "morning-route",
  "street-flyer",
  "convenience-clerk",
  "work-return",
  "work-value",
  "work-todo",
  "work-pack",
  "work-social",
  "work-files",
  "work-flow",
  "work-clicker",
  "dessert-transition",
  "frog-dessert",
  "home-final",
  "complete",
];

export function isExhibitionPhase(value: string | null): value is ExhibitionPhase {
  return Boolean(value && EXHIBITION_PHASES.includes(value as ExhibitionPhase));
}
