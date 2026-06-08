export type FrogDiaryClueRouteTileId = "shop" | "street" | "restaurant";

export type FrogDiaryClueEventId =
  | "frog-clue-shop-cold-noodles"
  | "frog-clue-street-flyer"
  | "frog-clue-restaurant-wrong-order";

export type FrogDiaryClueLine = {
  speaker: string;
  text: string;
  isItalic?: boolean;
  sceneTitle?: string;
  sceneImage?: string;
  sceneColor?: string;
  sceneBackgroundSize?: string;
};

export type FrogDiaryClueStage = {
  id: "shop-cold-noodles" | "street-flyer" | "restaurant-wrong-order";
  eventId: FrogDiaryClueEventId;
  routeTileId: FrogDiaryClueRouteTileId;
  placeLabel: string;
  title: string;
  routeHint: string;
  sceneTitle: string;
  sceneImage: string;
  sceneColor: string;
  sceneBackgroundSize?: string;
  frogTargetRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lines: readonly FrogDiaryClueLine[];
};

export const FROG_POUNCE_IMAGE_PATH = "/images/animals/青蛙_撲.png";

export const FROG_MOVING_DIARY_FRAGMENT = {
  title: "搬家",
  firstText:
    "搬家那天，家裡亂成一團。\n紙箱堆得比我還高。坐一下下，看到客廳桌上有一杯便利商店買回來的手搖。\n我還轉頭對小麥說：\n「這杯也太好喝了吧！妳怎麼知道我想喝這個？」小麥一臉疑惑地看著我...",
  secondPreviewText: "正當她要開口，突然聽到外面街道上有小孩哭鬧的聲音...",
} as const;

const FROG_DEFAULT_TARGET_RECT = {
  x: 0.33,
  y: 0.39,
  width: 0.34,
  height: 0.255,
} as const;

const FROG_SHOP_TARGET_RECT = {
  x: 0.33,
  y: 0.23,
  width: 0.34,
  height: 0.255,
} as const;

export const FROG_DIARY_CLUE_STAGES: readonly FrogDiaryClueStage[] = [
  {
    id: "shop-cold-noodles",
    eventId: "frog-clue-shop-cold-noodles",
    routeTileId: "shop",
    placeLabel: "商店",
    title: "便利商店：微波涼麵",
    routeHint: "日記線索指向商店。",
    sceneTitle: "便利商店",
    sceneImage: "/images/outside/mart.jpg",
    sceneColor: "#D8C4AB",
    frogTargetRect: FROG_SHOP_TARGET_RECT,
    lines: [
      { speaker: "旁白", text: "小麥走進便利商店，拿起一盒涼麵。" },
      { speaker: "小麥", text: "涼麵有新口味耶，今天就吃這個吧。" },
      { speaker: "店員", text: "好的，涼麵一份。請問要幫您微波嗎？" },
      { speaker: "店員", text: "啊……抱歉，我剛剛說錯了。" },
      { speaker: "旁白", text: "店員尷尬地紅了臉，櫃台旁忽然傳來呱呱聲。" },
      { speaker: "小麥", text: "等等，店員頭上那一團影子是……" },
      { speaker: "小貝狗", text: "嗷嗷！小日獸！拍照！" },
    ],
  },
  {
    id: "street-flyer",
    eventId: "frog-clue-street-flyer",
    routeTileId: "street",
    placeLabel: "街道",
    title: "街道：傳單吹走",
    routeHint: "日記線索指向街道。",
    sceneTitle: "街道",
    sceneImage: "/images/428出圖/背景/公司附近街道_白天.jpg",
    sceneColor: "#C8D5D2",
    frogTargetRect: FROG_DEFAULT_TARGET_RECT,
    lines: [
      { speaker: "旁白", text: "小麥走在街道上，看見推銷路人抱著一疊快被風吹散的傳單。" },
      { speaker: "推銷路人", text: "不好意思，可以幫我撿一下嗎？風一變大，傳單就全飛走了！" },
      { speaker: "小貝狗", text: "嗷！風會像節奏一樣連續變向，我先把六拍預測排出來！" },
      { speaker: "小麥", text: "先照風向預測撿，應該追得上。" },
      { speaker: "旁白", text: "小麥照著風向預測穿過人行道，把一張張傳單撿回來。" },
      { speaker: "推銷路人", text: "太好了，差點全都飛到馬路上。真的謝謝妳！" },
      { speaker: "旁白", text: "其中一張傳單背後，傳來熟悉的呱呱聲。" },
      { speaker: "小麥", text: "這個聲音……" },
      { speaker: "小貝狗", text: "嗷！拍照！" },
    ],
  },
  {
    id: "restaurant-wrong-order",
    eventId: "frog-clue-restaurant-wrong-order",
    routeTileId: "restaurant",
    placeLabel: "餐廳",
    title: "餐廳：送錯餐",
    routeHint: "日記線索指向餐廳。",
    sceneTitle: "餐廳",
    sceneImage: "/images/breakfast.jpg",
    sceneColor: "#C6A383",
    frogTargetRect: FROG_DEFAULT_TARGET_RECT,
    lines: [
      { speaker: "旁白", text: "小麥在餐廳坐下，店員送來一盤餐點。" },
      { speaker: "店員", text: "您的餐點來了。" },
      { speaker: "小麥", text: "咦？這好像不是我點的……" },
      { speaker: "店員", text: "啊！抱歉，我送錯桌了。" },
      { speaker: "旁白", text: "店員慌張地把餐點端起來，盤子旁邊卻跳出一團青蛙影子。" },
      { speaker: "小貝狗", text: "嗷嗷！這次不要讓牠跑掉！" },
    ],
  },
] as const;

const FROG_DIARY_CLUE_STAGE_BY_EVENT_ID = new Map<FrogDiaryClueEventId, FrogDiaryClueStage>(
  FROG_DIARY_CLUE_STAGES.map((stage) => [stage.eventId, stage]),
);

export function getFrogDiaryClueStageIndex(photoAttemptCount: number) {
  if (photoAttemptCount <= 0) return 0;
  if (photoAttemptCount === 1) return 1;
  return 2;
}

export function getFrogDiaryClueStageByAttempt(photoAttemptCount: number) {
  return FROG_DIARY_CLUE_STAGES[getFrogDiaryClueStageIndex(photoAttemptCount)];
}

export function isFrogDiaryClueEventId(eventId: string | null | undefined): eventId is FrogDiaryClueEventId {
  return Boolean(eventId && FROG_DIARY_CLUE_STAGE_BY_EVENT_ID.has(eventId as FrogDiaryClueEventId));
}

export function getFrogDiaryClueStageByEventId(eventId: string | null | undefined) {
  if (!isFrogDiaryClueEventId(eventId)) return null;
  return FROG_DIARY_CLUE_STAGE_BY_EVENT_ID.get(eventId) ?? null;
}

export function getFrogDiaryClueRouteTileId(photoAttemptCount: number) {
  return getFrogDiaryClueStageByAttempt(photoAttemptCount).routeTileId;
}

export function getFrogDiaryClueRouteHint(photoAttemptCount: number) {
  return getFrogDiaryClueStageByAttempt(photoAttemptCount).routeHint;
}
