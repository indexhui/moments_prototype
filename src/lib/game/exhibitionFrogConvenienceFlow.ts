import {
  FROG_DIARY_CLUE_STAGES,
  type FrogDiaryClueLine,
  type FrogDiaryClueStage,
} from "@/lib/game/frogDiaryClueFlow";
export { CONVENIENCE_STORE_HOP_DURATION_MS, CONVENIENCE_STORE_HOP_KEYFRAMES } from "@/lib/game/convenienceStorePhotoMotion";

const CONVENIENCE_STORE_BACKGROUND = "/images/store/便利商店_抽獎箱.jpg";
export const CONVENIENCE_STORE_PHOTO_BACKGROUND = "/images/store/便利商店_無店員.jpg";
export const CONVENIENCE_STORE_COMIC_FRAMES = [1, 2, 3, 4].map(
  (frame) => `/images/store/抽獎箱${frame}.png`,
);
export const CONVENIENCE_STORE_FROG_FRAMES = [1, 2, 3, 4, 5, 6].map(
  (frame) => `/images/store/青蛙${frame}.png`,
);
export const CONVENIENCE_STORE_TICKET_FRAMES = [1, 2, 3, 4, 5].map(
  (frame) => `/images/store/抽獎卷${frame}.png`,
);
export const CONVENIENCE_STORE_TICKET_ICON = "/images/ticket/ticekt_icon.png";

/**
 * Exhibition-only convenience-store script.
 *
 * Black parenthetical rows in the writer sheet are stage directions, so they
 * are represented by the store background, clerk avatar and frog reveal rather
 * than rendered as dialogue. Green parenthetical character rows are inner
 * thoughts and are displayed without their screenplay parentheses.
 */
const EXHIBITION_CONVENIENCE_FROG_LINES: readonly FrogDiaryClueLine[] = [
  {
    speaker: "小麥",
    text: "涼麵在特價耶！今天的午餐就吃涼麵吧～♫",
    avatar: { spriteId: "mai", frameIndex: 6, motionId: "slide-in-left" },
    gameSfxId: "convenienceEntranceChime",
  },
  {
    speaker: "店員",
    text: "這樣是108元，涼麵需要微波嗎？",
    avatar: { spriteId: "convenience-clerk", frameIndex: 0 },
  },
  {
    speaker: "小麥",
    text: "欸……可是涼麵微波了，就不涼了餒……",
    avatar: { spriteId: "mai", frameIndex: 7 },
  },
  {
    speaker: "店員",
    text: "我、我是說，涼麵需要餐具嗎？",
    avatar: { spriteId: "convenience-clerk", frameIndex: 1 },
  },
  {
    speaker: "小麥",
    text: "沒關係，不用餐具。",
    avatar: { spriteId: "mai", frameIndex: 6 },
  },
  {
    speaker: "小麥",
    text: "嘻嘻，他剛剛講錯話後，滿臉都紅了耶——",
    isInnerThought: true,
    avatar: { spriteId: "mai", frameIndex: 18 },
  },
  {
    speaker: "店員",
    text: "滿額可以抽一張抽獎券",
    avatar: { spriteId: "convenience-clerk", frameIndex: 0 },
  },
  {
    speaker: "小麥",
    text: "好",
    avatar: { spriteId: "mai", frameIndex: 6 },
  },
];

export const EXHIBITION_CONVENIENCE_FROG_RETURN_LINES = [
  {
    speaker: "小麥",
    text: "可惡……怎麼捕捉一隻小日獸這麼難？",
    avatar: { spriteId: "mai", frameIndex: 5 },
  },
  {
    speaker: "小麥",
    text: "怎麼辦，還會再次遇到那隻青蛙嗎……？",
    avatar: { spriteId: "mai", frameIndex: 3 },
  },
  {
    speaker: "小貝狗",
    text: "嗷～說不定那隻小日獸有想去的地方～",
    rewardCue: "raffle-ticket",
    avatar: { spriteId: "beigo", frameIndex: 0 },
  },
] as const satisfies readonly FrogDiaryClueLine[];

export const EXHIBITION_CONVENIENCE_FROG_STAGE: FrogDiaryClueStage = {
  ...FROG_DIARY_CLUE_STAGES[0],
  sceneTitle: "便利商店",
  sceneImage: CONVENIENCE_STORE_BACKGROUND,
  frogRevealLineIndex: EXHIBITION_CONVENIENCE_FROG_LINES.length,
  photoComicFrames: CONVENIENCE_STORE_COMIC_FRAMES,
  photoSceneImage: CONVENIENCE_STORE_PHOTO_BACKGROUND,
  photoOverlayPreset: "store-lottery",
  photoTargetMotion: undefined,
  lines: EXHIBITION_CONVENIENCE_FROG_LINES,
};
