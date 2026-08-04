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
  | "work-arrival"
  | "box-game"
  | "home-search"
  | "vacuum-game"
  | "diary-restore"
  | "bai-change-first"
  | "bai-after-flashback"
  | "morning-route-intro"
  | "morning-route"
  | "street-flyer"
  | "convenience-clerk"
  | "work-return"
  | "work-value"
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
  | "work-arrival"
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
    motionId?: "jump-once";
  };
  showLightOrb?: boolean;
  clueText?: string;
  flashback?: boolean;
  isInnerThought?: boolean;
  comicPresentation?: "fall-double" | "door-close-single" | "beigo-book-single";
};

const METRO_DOG_BACKGROUND = "/images/428出圖/追加作畫/黃金獵犬/黃金獵犬_背景.jpg";
const HOME_LANE_DAY_BACKGROUND = "/images/428出圖/背景/家門口巷弄_白天.jpg";
const MRT_PLATFORM_BACKGROUND = "/images/departure/mrt_platform_pan.png";
const MRT_INTERIOR_BACKGROUND = "/images/428出圖/背景/捷運.png";
const OFFICE_DAY_BACKGROUND = "/images/428出圖/背景/公司_白天.jpg";
const OFFICE_DUSK_BACKGROUND = "/images/428出圖/背景/公司_黃昏.jpg";
const STREET_DUSK_BACKGROUND = "/images/428出圖/背景/公司附近街道_黃昏.jpg";
const LIVING_ROOM_NIGHT_BACKGROUND = "/images/428出圖/背景/客廳_晚上.jpg";
const BAI_ROOM_BACKGROUND = "/images/428出圖/背景/小白房間_開燈.jpg";
const BAI_GLOW_BACKGROUND = "/images/428出圖/背景/發光小白２.png";
const DOORSTEP_DAY_BACKGROUND = "/images/outside/Doorstep_Day.png";

export const EXHIBITION_NARRATIVE_LINES: Record<
  ExhibitionNarrativePhase,
  readonly ExhibitionNarrativeLine[]
> = {
  "departure-opening": [
    {
      id: "EX-DEPART-01",
      speaker: "小麥",
      text: "在空想也不是辦法……",
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
      avatar: { spriteId: "mai", frameIndex: 5 },
    },
  ],
  "departure-plan": [
    {
      id: "EX-DEPART-03",
      speaker: "小麥",
      text: "今天就去剩餘日記中有提到的捷運上看看好了。",
      sceneLabel: "早晨・家門口",
      backgroundImage: HOME_LANE_DAY_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 5 },
    },
  ],
  "metro-arrival": [
    {
      id: "EX-METRO-01",
      speaker: "小麥",
      text: "昨天發生的事情……小白的沉默到底是怎麼回事……",
      sceneLabel: "早晨・捷運站",
      backgroundImage: MRT_PLATFORM_BACKGROUND,
      backgroundPosition: "center",
      backgroundSize: "auto 100%",
      avatar: { spriteId: "mai", frameIndex: 27 },
      comicPresentation: "beigo-book-single",
    },
    {
      id: "EX-METRO-02",
      speaker: "小麥",
      text: "啊啊！得趕緊上車！",
      sceneLabel: "早晨・捷運站",
      backgroundImage: MRT_PLATFORM_BACKGROUND,
      backgroundPosition: "center",
      backgroundSize: "auto 100%",
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
    },
    {
      id: "EX-02",
      speaker: "小麥",
      text: "那邊是……？",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 34 },
    },
    {
      id: "EX-03",
      speaker: "旁白",
      text: "警示聲正要結束，一道金色的影子突然衝進車廂。",
      sceneLabel: "早晨・捷運",
      backgroundImage: METRO_DOG_BACKGROUND,
    },
  ],
  "work-arrival": [
    {
      id: "EX-08",
      speaker: "旁白",
      text: "到站後，小麥只來得及把缺一格的日記闔上。",
      sceneLabel: "上午・公司",
      backgroundImage: OFFICE_DAY_BACKGROUND,
    },
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
      text: "好，先把眼前的工作處理完。相片的事……回家再找。",
      sceneLabel: "上午・公司",
      backgroundImage: OFFICE_DAY_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 5 },
    },
  ],
  "home-search": [
    {
      id: "EX-11",
      speaker: "旁白",
      text: "下班回到家，日記裡的問號仍停在原位。",
      sceneLabel: "晚上・家",
      backgroundImage: LIVING_ROOM_NIGHT_BACKGROUND,
      clueText: "缺少的相片，也許還在家裡",
    },
    {
      id: "EX-12",
      speaker: "小麥",
      text: "小白以前常把相片隨手夾進書或塞在沙發旁……先從客廳找起。",
      sceneLabel: "晚上・家",
      backgroundImage: LIVING_ROOM_NIGHT_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 36 },
    },
    {
      id: "EX-13",
      speaker: "小貝狗",
      text: "嗷！一邊打掃，一邊找！",
      sceneLabel: "晚上・家",
      backgroundImage: LIVING_ROOM_NIGHT_BACKGROUND,
      avatar: { spriteId: "beigo", frameIndex: 2, motionId: "jump-once" },
    },
  ],
  "bai-change-first": [
    {
      id: "EX-14",
      speaker: "旁白",
      text: "枕頭下的相片補進缺口，直太郎與日記的內容終於完整。",
      sceneLabel: "小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      showLightOrb: true,
    },
    {
      id: "EX-15",
      speaker: "旁白",
      text: "日記上的光飄向小白。她垂在身側的手指，輕輕動了一下。",
      sceneLabel: "小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      showLightOrb: true,
    },
    {
      id: "EX-16",
      speaker: "小麥",
      text: "小白……妳真的有聽見嗎？",
      sceneLabel: "小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 28 },
    },
    {
      id: "EX-17",
      speaker: "小麥",
      text: "這張相片……我想起來了。前天早上，日記就是那時候弄濕、摔散的。",
      sceneLabel: "小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 37 },
      isInnerThought: true,
    },
  ],
  "bai-after-flashback": [
    {
      id: "EX-NOW-01",
      speaker: "旁白",
      text: "關門聲散去，小麥回過神。眼前的小白仍漂浮在光裡，指尖停在剛才的位置。",
      sceneLabel: "現在・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      showLightOrb: true,
    },
    {
      id: "EX-NOW-02",
      speaker: "小麥",
      text: "那天我說的是氣話。對不起……等妳醒來，我會好好說清楚。",
      sceneLabel: "現在・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 28 },
      showLightOrb: true,
    },
    {
      id: "EX-NOW-03",
      speaker: "小貝狗",
      text: "嗷……日記又亮起來了！",
      sceneLabel: "現在・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      avatar: { spriteId: "beigo", frameIndex: 1 },
      showLightOrb: true,
    },
    {
      id: "EX-NOW-04",
      speaker: "小貝狗",
      text: "下一篇浮出來了——『搬家那天……便利商店的飲料……』",
      sceneLabel: "現在・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      avatar: { spriteId: "beigo", frameIndex: 2, motionId: "jump-once" },
      clueText: "搬家那天……便利商店的飲料……",
      showLightOrb: true,
    },
  ],
  "morning-route-intro": [
    {
      id: "EX-18",
      speaker: "旁白",
      text: "隔天早上，小麥把殘篇攤在玄關。線索指向公司附近的街道與便利商店。",
      sceneLabel: "隔天早上・玄關",
      backgroundImage: DOORSTEP_DAY_BACKGROUND,
      clueText: "先經過街道，再到便利商店",
    },
    {
      id: "EX-19",
      speaker: "小麥",
      text: "把路線排好，照這兩個地方走一趟吧。",
      sceneLabel: "隔天早上・玄關",
      backgroundImage: DOORSTEP_DAY_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 5 },
    },
  ],
  "work-return": [
    {
      id: "EX-20",
      speaker: "旁白",
      text: "傳單與涼麵的小插曲結束後，小麥回到辦公室。",
      sceneLabel: "下午・公司",
      backgroundImage: OFFICE_DAY_BACKGROUND,
    },
    {
      id: "EX-21",
      speaker: "小麥",
      text: "日記的線索還連不起來。先把今天的工作值做完，才有時間繼續追。",
      sceneLabel: "下午・公司",
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
      text: "拍到青蛙後，小麥再次回到小白房間。日記的光比昨天更亮。",
      sceneLabel: "深夜・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      showLightOrb: true,
    },
    {
      id: "EX-25",
      speaker: "旁白",
      text: "小白的手指又動了一下，像是努力想抓住什麼。",
      sceneLabel: "深夜・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      showLightOrb: true,
    },
    {
      id: "EX-26",
      speaker: "小麥",
      text: "我記得了，也不會再逃開。等妳醒來，我們一起把那天沒說完的話說完。",
      sceneLabel: "深夜・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 18 },
    },
  ],
  "argument-flashback": [
    {
      id: "EX-FB-01",
      speaker: "旁白",
      text: "前天早上。小麥在客廳踩到小白隨手放著的模型，帶著火氣走進她的房間。",
      sceneLabel: "前天・小白房間",
      backgroundImage: BAI_ROOM_BACKGROUND,
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
  "work-arrival": "box-game",
  "home-search": "vacuum-game",
  "bai-change-first": "argument-flashback",
  "bai-after-flashback": "morning-route-intro",
  "morning-route-intro": "morning-route",
  "work-return": "work-value",
  "dessert-transition": "frog-dessert",
  "home-final": "complete",
  "argument-flashback": "bai-after-flashback",
};

export const EXHIBITION_DIARY_READ_LINES = [
  {
    speaker: "小麥" as const,
    text: "枕頭下的相片……剛好就是缺少的那一格。",
    spriteId: "mai" as const,
    frameIndex: 34,
  },
  {
    speaker: "小麥" as const,
    text: "小白趕著去練團，吉他袋卻被捷運門夾住。直太郎帶回的是這段記憶。",
    spriteId: "mai" as const,
    frameIndex: 18,
  },
  {
    speaker: "小貝狗" as const,
    text: "嗷！這次真的完整了！",
    spriteId: "beigo" as const,
    frameIndex: 2,
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
  "dog-photo-diary",
  "diary-incomplete",
  "work-arrival",
  "box-game",
  "home-search",
  "vacuum-game",
  "diary-restore",
  "bai-change-first",
  "bai-after-flashback",
  "morning-route-intro",
  "morning-route",
  "street-flyer",
  "convenience-clerk",
  "work-return",
  "work-value",
  "dessert-transition",
  "frog-dessert",
  "home-final",
  "argument-flashback",
  "complete",
];

export function isExhibitionPhase(value: string | null): value is ExhibitionPhase {
  return Boolean(value && EXHIBITION_PHASES.includes(value as ExhibitionPhase));
}
