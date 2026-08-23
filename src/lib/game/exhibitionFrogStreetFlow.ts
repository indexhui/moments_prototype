import {
  FROG_DIARY_CLUE_STAGES,
  type FrogDiaryClueLine,
  type FrogDiaryClueStage,
} from "@/lib/game/frogDiaryClueFlow";

const STREET_BACKGROUND = "/images/428出圖/背景/公司附近街道_白天.jpg";

const EXHIBITION_STREET_FLYER_LINES: readonly FrogDiaryClueLine[] = [
  {
    speaker: "小麥",
    text: "嗯～偶爾走路上班，感覺也不錯呢！",
    avatar: { spriteId: "mai", frameIndex: 0, motionId: "slide-in-left" },
  },
  {
    speaker: "小麥",
    text: "唔——好強的風！",
    avatar: { spriteId: "mai", frameIndex: 27, motionId: "tremble" },
    gameSfxId: "streetStrongWind",
  },
  {
    speaker: "小麥",
    text: "嗯？這個飛過來的傳單是……？",
    avatar: { spriteId: "mai", frameIndex: 14 },
  },
  {
    speaker: "旁白",
    text: "一名年輕的工讀生，正在不遠處慌忙撿拾被吹得四散的傳單。",
    isItalic: true,
  },
  {
    speaker: "小麥",
    text: "哇——好可憐，幫他撿一下好了",
    avatar: { spriteId: "mai", frameIndex: 18 },
  },
  {
    speaker: "小麥",
    text: "哈囉～這些傳單給你～",
    avatar: { spriteId: "mai", frameIndex: 0 },
  },
  {
    speaker: "工讀生",
    text: "謝謝妳，幫了大忙！如果是我一個人，不知道要撿到什麼時候……",
  },
  {
    speaker: "小麥",
    text: "哇——！怎麼會有青蛙躲在傳單裡！",
    avatar: { spriteId: "mai", frameIndex: 26 },
    gameSfxId: "frogJump",
  },
  {
    speaker: "小貝狗",
    text: "嗷嗷！小日獸！小日獸！",
    avatar: { spriteId: "beigo", frameIndex: 0 },
  },
  {
    speaker: "小麥",
    text: "欸！？那也是小日獸嗎？",
    avatar: { spriteId: "mai", frameIndex: 34 },
  },
];

export const EXHIBITION_STREET_FLYER_RETURN_LINES = [
  {
    speaker: "小麥",
    text: "咦！那隻青蛙小日獸怎麼逃走了！？",
    avatar: { spriteId: "mai", frameIndex: 34 },
  },
  {
    speaker: "小貝狗",
    text: "嗷嗷！有些小日獸捕捉難度比較高！但是不要氣餒～只要多試幾次，總會成功的！嗷嗷！",
    avatar: { spriteId: "beigo", frameIndex: 0 },
  },
  {
    speaker: "小麥",
    text: "可惡……希望下班時，還能遇到那隻青蛙，把牠抓起來！",
    avatar: { spriteId: "mai", frameIndex: 22 },
  },
] as const satisfies readonly FrogDiaryClueLine[];

export const EXHIBITION_STREET_FLYER_STAGE: FrogDiaryClueStage = {
  ...FROG_DIARY_CLUE_STAGES[1],
  sceneTitle: "公司附近街道",
  sceneImage: STREET_BACKGROUND,
  introTitleCard: undefined,
  windMinigameAfterLineIndex: 4,
  frogRevealLineIndex: 7,
  lines: EXHIBITION_STREET_FLYER_LINES,
};
