import {
  FROG_DIARY_CLUE_STAGES,
  type FrogDiaryClueLine,
  type FrogDiaryClueStage,
} from "@/lib/game/frogDiaryClueFlow";

const CONVENIENCE_STORE_BACKGROUND = "/images/outside/mart.jpg";

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
    speaker: "小貝狗",
    text: "嗷嗷！快看快看！",
    avatar: { spriteId: "beigo", frameIndex: 0, motionId: "jump-once" },
  },
  {
    speaker: "小麥",
    text: "咦？那個是！？",
    isInnerThought: true,
    avatar: { spriteId: "mai", frameIndex: 14 },
  },
  {
    speaker: "小麥",
    text: "是小日獸！快點！相機！",
    isInnerThought: true,
    avatar: { spriteId: "mai", frameIndex: 34 },
    gameSfxId: "frogJump",
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
    avatar: { spriteId: "beigo", frameIndex: 0 },
  },
] as const satisfies readonly FrogDiaryClueLine[];

export const EXHIBITION_CONVENIENCE_FROG_STAGE: FrogDiaryClueStage = {
  ...FROG_DIARY_CLUE_STAGES[0],
  sceneTitle: "便利商店",
  sceneImage: CONVENIENCE_STORE_BACKGROUND,
  frogRevealLineIndex: 8,
  lines: EXHIBITION_CONVENIENCE_FROG_LINES,
};
