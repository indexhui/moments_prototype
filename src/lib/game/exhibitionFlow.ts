import type { GameSfxId } from "@/lib/game/soundEffects";
import { EXHIBITION_STREET_FLYER_RETURN_LINES } from "@/lib/game/exhibitionFrogStreetFlow";
import {
  EXHIBITION_CONVENIENCE_FROG_RETURN_LINES,
  EXHIBITION_CONVENIENCE_FROG_STAGE,
} from "@/lib/game/exhibitionFrogConvenienceFlow";

export type ExhibitionPhase =
  | "departure-opening"
  | "mai-intro"
  | "departure-plan"
  | "departure-route"
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
  | "day-one-rest"
  | "morning-route-intro"
  | "morning-route"
  | "no-sunbeast-workday"
  | "no-sunbeast-summary"
  | "street-flyer"
  | "convenience-clerk"
  | "convenience-photo-return"
  | "convenience-to-company"
  | "convenience-work-resume"
  | "work-return"
  | "street-to-company"
  | "street-office-arrival"
  | "work-value"
  | "work-todo"
  | "work-pack"
  | "work-social"
  | "work-files"
  | "work-flow"
  | "work-clicker"
  | "dessert-transition"
  | "dessert-route"
  | "frog-dessert"
  | "home-final"
  | "argument-flashback"
  | "complete";

export type ExhibitionNarrativePhase =
  | "departure-opening"
  | "departure-plan"
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
  | "no-sunbeast-summary"
  | "work-return"
  | "convenience-photo-return"
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
    exitMotionId?: "fade-out-right";
    exitDurationMs?: number;
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
  clueText?: string;
  flashback?: boolean;
  floatingDiaryPages?: boolean;
  baiRoomFullImageIntro?: boolean;
  baiDiaryPickupSequence?: boolean;
  beigoDiaryRevealSequence?: boolean;
  beigoBagRevealSequence?: boolean;
  beigoRushComicEnter?: boolean;
  isInnerThought?: boolean;
  hideBackgroundShade?: boolean;
  soundEffectId?: GameSfxId;
  comicPresentation?:
    | "fall-double"
    | "door-close-single"
    | "beigo-rush-single"
    | "blank-diary-single"
    | "diary-in-bag-single";
};

export type ExhibitionMetroDogLine = {
  speaker: "小麥" | "小貝狗";
  text: string;
  spriteId?: "mai" | "beigo";
  frameIndex?: number;
  motionId?: "jump-once" | "sway-horizontal" | "pop-scale";
  showCameraComic?: boolean;
  showDiaryInBagComic?: boolean;
};

export const EXHIBITION_METRO_COMIC_NARRATION =
  "順著小貝狗示意的方向看去，發現車廂裡有隻尾巴被門夾住的黃金獵犬。";

export const EXHIBITION_METRO_DOG_BEFORE_PHOTO: readonly ExhibitionMetroDogLine[] = [
  {
    speaker: "小麥",
    text: "呃！捷運上怎麼會有黃金獵犬？",
    spriteId: "mai",
    frameIndex: 32,
  },
  {
    speaker: "小貝狗",
    text: "那不是黃金獵犬！是一隻「小日獸」！",
    spriteId: "beigo",
    frameIndex: 0,
    motionId: "jump-once",
  },
  {
    speaker: "小貝狗",
    text: "嗷嗷！拍照！拍照！這個給妳！",
    spriteId: "beigo",
    frameIndex: 0,
    motionId: "sway-horizontal",
    showCameraComic: true,
  },
  {
    speaker: "小麥",
    text: "相機？好啦好啦，別催！用這個把牠拍下來就可以了吧？",
    spriteId: "mai",
    frameIndex: 21,
    showCameraComic: true,
  },
] as const;

export const EXHIBITION_METRO_DOG_AFTER_PHOTO: readonly ExhibitionMetroDogLine[] = [
  {
    speaker: "小麥",
    text: "咦？那隻「小日獸」去哪了？",
    spriteId: "mai",
    frameIndex: 35,
  },
  {
    speaker: "小貝狗",
    text: "嗷嗷！快看看日記！",
    spriteId: "beigo",
    frameIndex: 2,
    motionId: "jump-once",
    showDiaryInBagComic: true,
  },
  {
    speaker: "小麥",
    text: "日記……？啊！是指我早上隨手帶出門的小白日記本嗎……？",
    spriteId: "mai",
    frameIndex: 36,
    showDiaryInBagComic: true,
  },
] as const;

export const EXHIBITION_FORGOT_LUNCH_LINES = [
  {
    speaker: "小麥",
    text: "呼——來吃午餐吧！",
    spriteId: "mai" as const,
    frameIndex: 12,
    motionId: "slide-in-left" as const,
  },
  {
    speaker: "小麥",
    text: "啊！我居然忘記帶便當！",
    spriteId: "mai" as const,
    frameIndex: 34,
  },
  {
    speaker: "小麥",
    text: "只好去便利商店買了……",
    spriteId: "mai" as const,
    frameIndex: 24,
  },
  {
    speaker: "小貝狗",
    text: "嗷～～",
    spriteId: "beigo" as const,
    frameIndex: 0,
  },
] as const;

const METRO_DOG_BACKGROUND = "/images/428出圖/追加作畫/黃金獵犬/黃金獵犬_背景.jpg";
const HOME_LANE_DAY_BACKGROUND = "/images/428出圖/背景/家門口巷弄_白天.jpg";
const MRT_INTERIOR_BACKGROUND = "/images/428出圖/背景/捷運.png";
const OFFICE_DAY_BACKGROUND = "/images/428出圖/背景/公司_白天.jpg";
const OFFICE_DUSK_BACKGROUND = "/images/428出圖/背景/公司_黃昏.jpg";
const STREET_DAY_BACKGROUND = "/images/428出圖/背景/公司附近街道_白天.jpg";
const STREET_DUSK_BACKGROUND = "/images/428出圖/背景/公司附近街道_黃昏.jpg";
const STREET_NIGHT_BACKGROUND = "/images/428出圖/背景/公司附近街道_夜晚.jpg";
const ENTRANCE_NIGHT_BACKGROUND = "/images/428出圖/背景/玄關_關燈_關門.png";
const LIVING_ROOM_NIGHT_BACKGROUND = "/images/428出圖/背景/客廳_晚上.jpg";
const BAI_ROOM_BACKGROUND = "/images/428出圖/背景/小白房間_開燈.jpg";
const BAI_ROOM_DOOR_CLOSED_BACKGROUND = "/images/428出圖/背景/關門_工作中.jpg";
const BAI_ROOM_DOOR_OPEN_GLOW_BACKGROUND = "/images/428出圖/背景/小白房門_發光.png";
const BAI_FLOATING_DIARY_PAGES_BACKGROUND =
  "/images/428出圖/追加作畫/發光小白拆解/背景.png";
const BAI_GLOW_BACKGROUND = "/images/428出圖/背景/發光小白２.png";
const BAI_EXHIBITION_GLOW_BACKGROUND =
  "/images/428出圖/20260822/發光小白/發光小白_展覽1.png";
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
      text: "昨天晚上，究竟是怎麼回事？",
      sceneLabel: "白天・公司附近街道",
      backgroundImage: STREET_DAY_BACKGROUND,
      avatar: {
        spriteId: "mai",
        frameIndex: 24,
        motionId: "slide-in-left",
      },
    },
    {
      id: "EX-DEPART-02",
      speaker: "小麥",
      text: "怎麼會我和小白吵了一架，小白就變成了那樣子呢……",
      sceneLabel: "白天・公司附近街道",
      backgroundImage: STREET_DAY_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 24 },
    },
    {
      id: "EX-DEPART-03",
      speaker: "小麥",
      text: "我還記得，我在踩到小白的東西跌倒後很生氣……",
      sceneLabel: "回憶・小白房間",
      backgroundImage: BAI_ROOM_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 37 },
      flashback: true,
      comicPresentation: "fall-double",
    },
    {
      id: "EX-DEPART-04",
      speaker: "小麥",
      text: "對她說了一些非常過分的話……",
      sceneLabel: "回憶・小白房間",
      backgroundImage: BAI_ROOM_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 36 },
      flashback: true,
    },
    {
      id: "EX-DEPART-05",
      speaker: "小麥",
      text: "結果後來下班再回到家時，就看到了……",
      sceneLabel: "回憶・小白房門",
      backgroundImage: BAI_ROOM_DOOR_CLOSED_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 9 },
      flashback: true,
      doorSwipeInteraction: {
        openImage: BAI_ROOM_DOOR_OPEN_GLOW_BACKGROUND,
        instruction: "往左滑開門",
        promptDelayMs: 420,
        advanceDelayMs: 620,
      },
    },
    {
      id: "EX-DEPART-06",
      speaker: "小麥",
      text: "小白她……居然漂浮在空中！怎麼喊都沒有反應……",
      sceneLabel: "回憶・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      flashback: true,
    },
    {
      id: "EX-DEPART-07",
      speaker: "小麥",
      text: "地上還攤開著這本……變成一片空白的日記……",
      sceneLabel: "回憶・小白房間",
      backgroundImage: BAI_GLOW_BACKGROUND,
      flashback: true,
      comicPresentation: "blank-diary-single",
    },
    {
      id: "EX-DEPART-08",
      speaker: "小麥",
      text: "究竟這本日記，和小白的變化有什麼關係？還有這隻——",
      sceneLabel: "白天・公司附近街道",
      backgroundImage: STREET_DAY_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 3 },
    },
    {
      id: "EX-DEPART-09",
      speaker: "小貝狗",
      text: "嗷嗷嗷嗷！",
      sceneLabel: "白天・公司附近街道",
      backgroundImage: STREET_DAY_BACKGROUND,
      avatar: { spriteId: "beigo", frameIndex: 0, motionId: "jump-once" },
    },
    {
      id: "EX-DEPART-10",
      speaker: "小麥",
      text: "——跟著日記一起出現的奇怪生物，又是什麼？",
      sceneLabel: "白天・公司附近街道",
      backgroundImage: STREET_DAY_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 30 },
    },
    {
      id: "EX-DEPART-11",
      speaker: "小麥",
      text: "總之，只能先去上班，再來想辦法拯救小白了！",
      sceneLabel: "白天・公司附近街道",
      backgroundImage: STREET_DAY_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 36 },
    },
  ],
  "metro-opening": [
    {
      id: "EX-METRO-OPEN-00",
      speaker: "旁白",
      text: "電車進站——",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      hideBackgroundShade: true,
    },
    {
      id: "EX-METRO-OPEN-01",
      speaker: "小麥",
      text: "唉，如果小白一直恢復不了原樣，該怎麼辦……？",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 24, motionId: "slide-in-left" },
      hideBackgroundShade: true,
    },
    {
      id: "EX-METRO-OPEN-02",
      speaker: "小貝狗",
      text: "嗷嗷！是「小日獸」、「小日獸」！",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "beigo", frameIndex: 0, motionId: "jump-once" },
      hideBackgroundShade: true,
      beigoBagRevealSequence: true,
    },
    {
      id: "EX-METRO-OPEN-03",
      speaker: "小麥",
      text: "嗚啊！嚇我一跳！你怎麼躲在這裡！？",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 26 },
      hideBackgroundShade: true,
    },
    {
      id: "EX-METRO-OPEN-04",
      speaker: "小麥",
      text: "然後你說什麼？「小日獸」？",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 14 },
      hideBackgroundShade: true,
    },
  ],
  "post-puzzle-metro": [
    {
      id: "EX-DIARY-01",
      speaker: "小麥",
      text: "這是……！本來空白的頁數，浮現出了內容……！",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 38 },
      hideBackgroundShade: true,
    },
    {
      id: "EX-DIARY-02",
      speaker: "小貝狗",
      text: "沒錯！只要捕捉到小日獸，小白的日記就會浮現喲！",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "beigo", frameIndex: 0 },
      hideBackgroundShade: true,
    },
    {
      id: "EX-DIARY-03",
      speaker: "小麥",
      text: "確實，這篇日記裡的小白，跟那隻傻乎乎的黃金獵犬很像……",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 3 },
      hideBackgroundShade: true,
    },
    {
      id: "EX-DIARY-04",
      speaker: "小麥",
      text: "該不會……那些消失的日記內容，都變成了小日獸！？",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 22 },
      hideBackgroundShade: true,
    },
    {
      id: "EX-DIARY-05",
      speaker: "小貝狗",
      text: "嗷～嗷！賓果！",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "beigo", frameIndex: 0 },
      hideBackgroundShade: true,
    },
    {
      id: "EX-DIARY-06",
      speaker: "小麥",
      text: "那這樣的話，只要把小日獸們都抓回來，小白就可以……",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 38 },
      hideBackgroundShade: true,
    },
    {
      id: "EX-DIARY-07",
      speaker: "小麥",
      text: "糟糕，已經到站了！晚點再來思考吧！",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: {
        spriteId: "mai",
        frameIndex: 34,
        exitMotionId: "fade-out-right",
        exitDurationMs: 420,
      },
      hideBackgroundShade: true,
      soundEffectId: "metroAnnouncement1End",
    },
  ],
  "post-flashback-diary": [
    {
      id: "EX-DIARY-FOUND-01",
      speaker: "小貝狗",
      text: "嗷嗷！快看看日記！",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "beigo", frameIndex: 2, motionId: "jump-once" },
      hideBackgroundShade: true,
      comicPresentation: "diary-in-bag-single",
    },
    {
      id: "EX-DIARY-FOUND-02",
      speaker: "小麥",
      text: "日記……？啊！是指我早上隨手帶出門的小白日記本嗎……？",
      sceneLabel: "早晨・捷運",
      backgroundImage: MRT_INTERIOR_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 36 },
      hideBackgroundShade: true,
      comicPresentation: "diary-in-bag-single",
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
      text: "啊——終於下班了！",
      sceneLabel: "黃昏・公司",
      backgroundImage: OFFICE_DUSK_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 24 },
      isInnerThought: true,
    },
    {
      id: "EX-WORK-02B",
      speaker: "小麥",
      text: "趕快回家看看，小白醒來了沒有！",
      sceneLabel: "黃昏・公司",
      backgroundImage: OFFICE_DUSK_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 23 },
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
      id: "EX-16",
      speaker: "旁白",
      text: "小白仍漂浮在原處，身上的灰白光芒沒有消失，也沒有醒來。",
      sceneLabel: "小白房間",
      backgroundImage: BAI_EXHIBITION_GLOW_BACKGROUND,
      hideBackgroundShade: true,
    },
    {
      id: "EX-17",
      speaker: "小麥",
      text: "還是沒有恢復……",
      sceneLabel: "小白房間",
      backgroundImage: BAI_EXHIBITION_GLOW_BACKGROUND,
      hideBackgroundShade: true,
      avatar: { spriteId: "mai", frameIndex: 28 },
    },
    {
      id: "EX-18",
      speaker: "小貝狗",
      text: "日記～嗷！",
      sceneLabel: "小白房間",
      backgroundImage: BAI_EXHIBITION_GLOW_BACKGROUND,
      hideBackgroundShade: true,
      avatar: { spriteId: "beigo", frameIndex: 2, motionId: "jump-once" },
    },
    {
      id: "EX-19",
      speaker: "小麥",
      text: "日記？",
      sceneLabel: "小白房間",
      backgroundImage: BAI_EXHIBITION_GLOW_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 36 },
      hideBackgroundShade: true,
      baiDiaryPickupSequence: true,
    },
  ],
  "bai-after-flashback": [
    {
      id: "EX-NOW-04",
      speaker: "小麥",
      text: "怎麼會這樣？小白還是一點變化也沒有⋯⋯",
      sceneLabel: "現在・小白房間",
      backgroundImage: BAI_EXHIBITION_GLOW_BACKGROUND,
      hideBackgroundShade: true,
      avatar: { spriteId: "mai", frameIndex: 28 },
    },
    {
      id: "EX-NOW-05",
      speaker: "小貝狗",
      text: "嗷嗷！別氣餒！看！下一篇日記出現了，去捕捉更多小日獸吧～",
      sceneLabel: "現在・小白房間",
      backgroundImage: BAI_EXHIBITION_GLOW_BACKGROUND,
      hideBackgroundShade: true,
      avatar: { spriteId: "beigo", frameIndex: 2, motionId: "jump-once" },
    },
  ],
  "morning-route-intro": [
    {
      id: "EX-19",
      speaker: "小麥",
      text: "天氣晴朗，今天就走路去上班吧！",
      sceneLabel: "隔天早上・家門口",
      backgroundImage: DOORSTEP_DAY_BACKGROUND,
      isInnerThought: true,
      locationTransition: {
        title: "隔天早上",
        subtitle: "準備出門",
      },
    },
  ],
  "no-sunbeast-summary": [
    {
      id: "EX-NO-SUNBEAST-01",
      speaker: "小麥",
      text: "今天沒有遇到小日獸……",
      sceneLabel: "晚上・回家後",
      backgroundImage: LIVING_ROOM_NIGHT_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 24 },
    },
    {
      id: "EX-NO-SUNBEAST-02",
      speaker: "小貝狗",
      text: "再看看日記吧！",
      sceneLabel: "晚上・回家後",
      backgroundImage: LIVING_ROOM_NIGHT_BACKGROUND,
      avatar: { spriteId: "beigo", frameIndex: 0 },
    },
  ],
  "work-return": EXHIBITION_STREET_FLYER_RETURN_LINES.map((line, index) => ({
    id: `EX-STREET-RETURN-${String(index + 1).padStart(2, "0")}`,
    speaker: line.speaker,
    text: line.text,
    sceneLabel: "白天・公司附近街道",
    backgroundImage: STREET_DAY_BACKGROUND,
    avatar: line.avatar,
  })),
  "convenience-photo-return": EXHIBITION_CONVENIENCE_FROG_RETURN_LINES.map(
    (line, index) => ({
      id: `EX-CONVENIENCE-RETURN-${String(index + 1).padStart(2, "0")}`,
      speaker: line.speaker,
      text: line.text,
      sceneLabel: "白天・便利商店",
      backgroundImage: EXHIBITION_CONVENIENCE_FROG_STAGE.sceneImage,
      avatar: line.avatar,
    }),
  ),
  "dessert-transition": [
    {
      id: "EX-DESSERT-DEPART-01",
      speaker: "小麥",
      text: "嗯～要直接回家嗎？還是再去找找看那隻青蛙呢～？",
      sceneLabel: "傍晚・公司",
      backgroundImage: OFFICE_DUSK_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 36 },
      isInnerThought: true,
    },
    {
      id: "EX-DESSERT-DEPART-02",
      speaker: "同事",
      text: "小麥小麥，妳上次說好吃的蛋糕店是哪間啊？我想去幫我男友買生日蛋糕！",
      sceneLabel: "傍晚・公司",
      backgroundImage: OFFICE_DUSK_BACKGROUND,
      avatar: { spriteId: "coworker", frameIndex: 0 },
    },
    {
      id: "EX-DESSERT-DEPART-03",
      speaker: "小麥",
      text: "哦～那間蛋糕店就在公司附近！可是它有點難找……",
      sceneLabel: "傍晚・公司",
      backgroundImage: OFFICE_DUSK_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 0 },
    },
    {
      id: "EX-DESSERT-DEPART-04",
      speaker: "小麥",
      text: "不然我陪妳去好了！",
      sceneLabel: "傍晚・公司",
      backgroundImage: OFFICE_DUSK_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 0 },
    },
    {
      id: "EX-DESSERT-DEPART-05",
      speaker: "小麥",
      text: "嗯～我記得就在這裡呀，怎麼不見了……",
      sceneLabel: "下班・公司附近街道",
      backgroundImage: STREET_DUSK_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 36 },
      isInnerThought: true,
      locationTransition: {
        title: "公司附近街道",
        subtitle: "下班時間",
      },
    },
  ],
  "home-final": [
    {
      id: "EX-DESSERT-AFTER-01",
      speaker: "小麥",
      text: "我想起來了！上次會來這間蛋糕店，就是為了陪小白來買賠罪的小點心",
      sceneLabel: "夜晚・公司附近街道",
      backgroundImage: STREET_NIGHT_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 14 },
    },
    {
      id: "EX-DESSERT-AFTER-02",
      speaker: "小麥",
      text: "她喝錯飲料時，那尷尬的樣子，現在回想起來還是好好笑",
      sceneLabel: "夜晚・公司附近街道",
      backgroundImage: STREET_NIGHT_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 18 },
    },
    {
      id: "EX-DESSERT-AFTER-03",
      speaker: "小麥",
      text: "當時我們還約好，要再一起來這間蛋糕店買其他點心呢……",
      sceneLabel: "夜晚・公司附近街道",
      backgroundImage: STREET_NIGHT_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 18 },
    },
    {
      id: "EX-DESSERT-AFTER-04",
      speaker: "小貝狗",
      text: "嗷……",
      sceneLabel: "夜晚・公司附近街道",
      backgroundImage: STREET_NIGHT_BACKGROUND,
      avatar: { spriteId: "beigo", frameIndex: 0 },
    },
    {
      id: "EX-DESSERT-AFTER-05",
      speaker: "小麥",
      text: "沒關係，我不會氣餒的！",
      sceneLabel: "夜晚・公司附近街道",
      backgroundImage: STREET_NIGHT_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 0 },
    },
    {
      id: "EX-DESSERT-AFTER-06",
      speaker: "小麥",
      text: "我一定會把小日獸全部搜集完畢，將小白喚醒的！",
      sceneLabel: "夜晚・公司附近街道",
      backgroundImage: STREET_NIGHT_BACKGROUND,
      avatar: { spriteId: "mai", frameIndex: 0 },
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
  "metro-opening": "metro-comic",
  "post-puzzle-metro": "metro-to-company",
  "post-flashback-diary": "dog-photo-diary",
  "post-flashback-metro": "metro-to-company",
  "work-arrival": "box-game",
  "work-complete": "work-dusk",
  "work-leave": "home-search",
  "home-search": "bai-change-first",
  "bai-change-first": "bai-after-flashback",
  "bai-after-flashback": "frog-diary-fragment",
  "morning-route-intro": "morning-route",
  "no-sunbeast-summary": "morning-route",
  "work-return": "street-to-company",
  "convenience-photo-return": "convenience-to-company",
  "dessert-transition": "dessert-route",
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
  "day-one-rest",
  "morning-route-intro",
  "morning-route",
  "no-sunbeast-workday",
  "no-sunbeast-summary",
  "street-flyer",
  "work-return",
  "street-to-company",
  "street-office-arrival",
  "work-value",
  "work-todo",
  "work-pack",
  "work-social",
  "work-files",
  "work-flow",
  "work-clicker",
  "convenience-clerk",
  "convenience-photo-return",
  "convenience-to-company",
  "convenience-work-resume",
  "dessert-transition",
  "dessert-route",
  "frog-dessert",
  "home-final",
  "complete",
];

export function isExhibitionPhase(value: string | null): value is ExhibitionPhase {
  return Boolean(value && EXHIBITION_PHASES.includes(value as ExhibitionPhase));
}
