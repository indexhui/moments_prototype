import type { SceneJumpContextStep } from "@/lib/game/sceneJumpContextBus";

export type FrogDiaryClueRouteTileId = "shop" | "street" | "restaurant";

export type FrogDiaryClueEventId =
  | "frog-clue-shop-cold-noodles"
  | "frog-clue-street-flyer"
  | "frog-clue-dessert-shop-birthday-cake";

export type FrogDiaryClueLine = {
  speaker: string;
  text: string;
  isItalic?: boolean;
  isInnerThought?: boolean;
  sceneTitle?: string;
  sceneImage?: string;
  sceneColor?: string;
  sceneBackgroundSize?: string;
};

export type FrogDiaryClueStage = {
  id: "shop-cold-noodles" | "street-flyer" | "dessert-shop-birthday-cake";
  eventId: FrogDiaryClueEventId;
  routeTileId: FrogDiaryClueRouteTileId;
  placeLabel: string;
  title: string;
  routeHint: string;
  sceneTitle: string;
  sceneImage: string;
  sceneColor: string;
  sceneBackgroundSize?: string;
  introTitleCard?: string;
  introTitleCardDurationMs?: number;
  frogTargetRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lines: readonly FrogDiaryClueLine[];
};

export const FROG_POUNCE_IMAGE_PATH = "/images/animals/青蛙_撲.png";

export const STREET_FLYER_WIND_MINIGAME_AFTER_LINE_INDEX = 2;

export const FIRST_FROG_CLUE_ESCAPE_LINE: FrogDiaryClueLine = {
  speaker: "旁白",
  text: "青蛙發現被拍下後直接跳走了。",
};

export const FIRST_FROG_CLUE_WORK_LUNCH_RETURN_LINES: readonly FrogDiaryClueLine[] = [
  { speaker: "小麥", text: "真是小確信，居然遇到小日獸，只可惜場面太慌亂了，沒有拍到正臉" },
  { speaker: "小麥", text: "趕緊回到公司享用涼麵吧。" },
] as const;

export function getFrogDiaryCluePostPhotoLines(
  photoAttemptNumber: number,
  requiredPhotoAttempts: number,
): readonly FrogDiaryClueLine[] {
  if (photoAttemptNumber >= requiredPhotoAttempts) {
    return [
      { speaker: "小麥", text: "收集到了……青蛙小日獸！" },
      { speaker: "小貝狗", text: "嗷嗷！日記本的空白頁也亮起來了！" },
    ] as const;
  }
  if (photoAttemptNumber <= 1) {
    return [
      { speaker: "小麥", text: "拍到了……可是照片裡只有一團青蛙的影子。" },
      { speaker: "小貝狗", text: "嗷！日記只回來了一小角，還要再找到下一段線索！" },
    ] as const;
  }
  return [] as const;
}

function buildFrogDiaryOverlaySceneJumpSteps(
  photoAttemptNumber: number,
  requiredPhotoAttempts: number,
): SceneJumpContextStep[] {
  const safeAttemptNumber = Math.max(1, Math.min(requiredPhotoAttempts, photoAttemptNumber));
  const isFinalAttempt = safeAttemptNumber >= requiredPhotoAttempts;
  const steps: SceneJumpContextStep[] = [
    {
      id: "diary-photo-slide",
      kindLabel: "日記",
      text: isFinalAttempt ? "第三張青蛙照片貼進日記" : "青蛙照片貼進日記",
    },
    {
      id: "frog-match-progress",
      kindLabel: "日記",
      text: isFinalAttempt
        ? `青蛙符合度 ${safeAttemptNumber - 1}/${requiredPhotoAttempts} -> 3/3`
        : `青蛙符合度 ${safeAttemptNumber - 1}/${requiredPhotoAttempts} -> ${safeAttemptNumber}/${requiredPhotoAttempts}`,
    },
    {
      id: "diary-fragment-updated",
      kindLabel: "日記",
      text: isFinalAttempt ? "搬家日記完整浮現" : "搬家日記碎片更新",
    },
    {
      id: "diary-fragment-enter",
      kindLabel: "日記",
      text: "打開搬家日記碎片頁",
    },
    {
      id: "diary-fragment-first",
      kindLabel: "日記",
      text: "第一片日記碎片貼回頁面",
    },
  ];

  if (safeAttemptNumber >= 2) {
    steps.push({
      id: "diary-fragment-second",
      kindLabel: "日記",
      text: "第二片日記碎片貼回頁面",
    });
  }

  if (isFinalAttempt) {
    steps.push({
      id: "frog-diary-collected",
      kindLabel: "收錄",
      text: "青蛙小日獸收錄進日記",
    });
  }

  steps.push({
    id: "diary-fragment-ready",
    kindLabel: "日記",
    text: isFinalAttempt ? "搬家日記完整可閱讀" : "搬家日記碎片可閱讀",
  });

  return steps;
}

export function buildFrogDiaryClueSceneJumpSteps({
  stage,
  photoAttemptNumber,
  requiredPhotoAttempts,
}: {
  stage: FrogDiaryClueStage;
  photoAttemptNumber: number;
  requiredPhotoAttempts: number;
}): SceneJumpContextStep[] {
  const steps: SceneJumpContextStep[] = stage.lines.map((line, index) => ({
    id: `line-${index}`,
    kindLabel: "對話",
    speaker: line.speaker,
    text: line.text,
  }));

  if (stage.introTitleCard) {
    steps.unshift({
      id: "intro-title-card",
      kindLabel: "過場",
      text: stage.introTitleCard,
    });
  }

  if (stage.id === "street-flyer") {
    const introStepCount = stage.introTitleCard ? 1 : 0;
    steps.splice(STREET_FLYER_WIND_MINIGAME_AFTER_LINE_INDEX + 1 + introStepCount, 0, {
      id: "flyer-wind-minigame",
      kindLabel: "小遊戲",
      text: "傳單被風吹散了",
    });
  }

  steps.push({
    id: "photo",
    kindLabel: "拍照",
    text: photoAttemptNumber >= requiredPhotoAttempts ? "拍下青蛙小日獸" : "拍下青蛙線索",
  });

  if (photoAttemptNumber <= 1) {
    steps.push({
      id: "escape-line",
      kindLabel: "對話",
      speaker: FIRST_FROG_CLUE_ESCAPE_LINE.speaker,
      text: FIRST_FROG_CLUE_ESCAPE_LINE.text,
    });
    steps.push({
      id: "waiting-diary",
      kindLabel: "日記",
      text: "日記本亮起，準備收進青蛙線索",
    });
    steps.push(
      ...buildFrogDiaryOverlaySceneJumpSteps(photoAttemptNumber, requiredPhotoAttempts),
    );
    FIRST_FROG_CLUE_WORK_LUNCH_RETURN_LINES.forEach((line, index) => {
      steps.push({
        id: `work-lunch-return-${index}`,
        kindLabel: "對話",
        speaker: line.speaker,
        text: line.text,
      });
    });
    return steps;
  }

  steps.push(...buildFrogDiaryOverlaySceneJumpSteps(photoAttemptNumber, requiredPhotoAttempts));

  if (photoAttemptNumber >= requiredPhotoAttempts) {
    steps.push(
      {
        id: "frog-diary-reaction",
        kindLabel: "對話",
        speaker: "小麥",
        text: "讀完搬家日記後想起小白，也決定買甜點帶回家",
      },
      {
        id: "next-diary-catalog",
        kindLabel: "日記",
        text: "下一篇《無尾熊的晚餐》浮現在交換日記目錄",
      },
      {
        id: "next-diary-puzzle",
        kindLabel: "日記拼圖",
        text: "拼回《無尾熊的晚餐》，發現內容被便利貼擋住",
      },
      {
        id: "next-diary-blocked-reaction-mai",
        kindLabel: "對話",
        speaker: "小麥",
        text: "有一些內容被擋住了。",
      },
      {
        id: "coworker-request-mission",
        kindLabel: "對話",
        speaker: "小貝狗",
        text: "有任務要完成，那些便利貼才會掉下來。",
      },
      {
        id: "dessert-shop-birthday-found",
        kindLabel: "對話",
        speaker: "同事",
        text: "買完後，同事也找到男友的生日",
      },
      {
        id: "frog-diary-return-home",
        kindLabel: "過場",
        text: "買完甜點後回家",
      },
    );
  }

  return steps;
}

const FROG_DIARY_REVEAL_SCENE_JUMP_STEP_IDS = new Set([
  "diary-photo-slide",
  "frog-match-progress",
  "diary-fragment-updated",
  "diary-fragment-enter",
  "diary-fragment-first",
  "diary-fragment-second",
  "frog-diary-collected",
  "diary-fragment-ready",
  "frog-diary-reaction",
  "next-diary-catalog",
  "next-diary-puzzle",
  "next-diary-blocked-reaction-mai",
  "coworker-request-mission",
]);

const KOALA_CHAPTER_SCENE_JUMP_STEP_IDS = new Set([
  "next-diary-catalog",
  "next-diary-puzzle",
  "next-diary-blocked-reaction-mai",
  "coworker-request-mission",
  "dessert-shop-birthday-found",
  "frog-diary-return-home",
]);

export function isFrogDiaryRevealSceneJumpStepId(stepId: string | null | undefined) {
  return Boolean(stepId && FROG_DIARY_REVEAL_SCENE_JUMP_STEP_IDS.has(stepId));
}

export function isFrogDessertAfterDiarySceneJumpStepId(stepId: string | null | undefined) {
  return stepId === "dessert-shop-birthday-found" || stepId === "frog-diary-return-home";
}

export function isKoalaChapterSceneJumpStepId(stepId: string | null | undefined) {
  return Boolean(stepId && KOALA_CHAPTER_SCENE_JUMP_STEP_IDS.has(stepId));
}

export function isFrogPostPhotoSceneJumpStepId(stepId: string | null | undefined) {
  return (
    isFrogDiaryRevealSceneJumpStepId(stepId) ||
    isFrogDessertAfterDiarySceneJumpStepId(stepId)
  );
}

export const FROG_MOVING_DIARY_FRAGMENT = {
  title: "搬家",
  openingText:
    "今天和小麥請搬家公司搬家。\n整理到一半，客廳出現幾瓶便利商店飲料，\n我以為是小麥買的，就很自然地全部喝掉了。",
  revealText:
    "但小白的表情一臉問號的看著我。\n外面有一陣騷動打亂我的不安....",
  firstText:
    "今天和小麥請搬家公司搬家。\n整理到一半，客廳出現幾瓶便利商店飲料，\n我以為是小麥買的，就很自然地全部喝掉了。\n但小白的表情一臉問號的看著我。\n外面有一陣騷動打亂我的不安....",
  secondPuzzlePromptText:
    "跑出去看，才發現＿＿亂成一團。\n原來有人在玩球，撞到了正在發傳單的人。",
  secondOpeningText:
    "跑出去看，才發現街道亂成一團。",
  secondRevealText:
    "原來有人在玩球，撞到了正在發傳單的人。",
  secondPuzzleText:
    "跑出去看，才發現街道亂成一團。\n原來有人在玩球，撞到了正在發傳單的人。",
  secondPreviewText:
    "跑出去看，才發現街道亂成一團。\n原來有人在玩球，撞到了正在發傳單的人。",
  thirdPuzzlePromptText:
    "忙完了一天，終於能繼續搬家。\n才發現原來下午喝到的飲料，是搬家工人的。\n我就帶著小麥去最近新開的＿＿＿，\n買了布丁和紅茶當作賠罪，也順便感謝今天的幫忙。",
  thirdPuzzleText:
    "忙完了一天，終於能繼續搬家。\n才發現原來下午喝到的飲料，是搬家工人的。\n我就帶著小麥去最近新開的甜點店，\n買了布丁和紅茶當作賠罪，也順便感謝今天的幫忙。",
  thirdOpeningText:
    "忙完了一天，終於能繼續搬家。\n才發現原來下午喝到的飲料，是搬家工人的。\n我就帶著小麥去最近新開的甜點店，",
  thirdRevealText:
    "買了布丁和紅茶當作賠罪，也順便感謝今天的幫忙。",
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
    introTitleCard: "街道上",
    introTitleCardDurationMs: 1700,
    frogTargetRect: FROG_DEFAULT_TARGET_RECT,
    lines: [
      {
        speaker: "旁白",
        text: "工讀生追著被風吹來吹去的傳單跑",
      },
      { speaker: "小貝狗", text: "嗷 風好大 傳單飛來飛去" },
      { speaker: "小麥", text: "好慘喔，來幫幫他好了" },
      { speaker: "工讀生", text: "嗚嗚，太感謝妳了，原本都不知道怎麼辦，很慌張。" },
      { speaker: "旁白", text: "在傳單的箱裡，跑出來了青蛙。" },
      { speaker: "小貝狗", text: "小麥，妳看！" },
      { speaker: "小麥", text: "是小日獸！" },
    ],
  },
  {
    id: "dessert-shop-birthday-cake",
    eventId: "frog-clue-dessert-shop-birthday-cake",
    routeTileId: "restaurant",
    placeLabel: "甜點店",
    title: "甜點店：生日蛋糕",
    routeHint: "小麥記得甜點店就在附近。",
    sceneTitle: "甜點店",
    sceneImage: "/images/events/frog-dessert-shop/dessert-shop-cake-bag.png",
    sceneColor: "#D9B18B",
    frogTargetRect: {
      x: 0.52,
      y: 0.22,
      width: 0.27,
      height: 0.21,
    },
    lines: [
      {
        speaker: "旁白",
        text: "最後一塊道路拼圖滑到定位後，熟悉的甜點店終於出現在街角。",
        sceneImage: "/images/events/frog-dessert-shop/dessert-shop-interior.png",
      },
      {
        speaker: "同事",
        text: "找到了！原來藏在這麼裡面，難怪剛剛一直沒看到。",
        sceneImage: "/images/events/frog-dessert-shop/dessert-shop-interior.png",
      },
      {
        speaker: "同事",
        text: "我去問問生日蛋糕，妳等我一下喔。",
        sceneImage: "/images/events/frog-dessert-shop/dessert-shop-interior.png",
      },
      {
        speaker: "小麥",
        text: "上次來這裡，原來是小白帶我來的。",
        isInnerThought: true,
        sceneImage: "/images/events/frog-dessert-shop/dessert-shop-interior.png",
      },
      {
        speaker: "旁白",
        text: "過了一會兒，同事提著蛋糕紙袋走回來，表情卻有些僵硬。",
      },
      { speaker: "小麥", text: "妳怎麼了？蛋糕不是買到了嗎？" },
      {
        speaker: "同事",
        text: "店員問我要幾歲的蠟燭，我卻突然想不起來我男朋友幾歲……真的超尷尬。",
      },
      { speaker: "小麥", text: "等等，妳的蛋糕紙袋好像在動……" },
      { speaker: "旁白", text: "蛋糕紙袋的袋口一陣窸窣，一隻青蛙突然鑽了出來。" },
      { speaker: "小貝狗", text: "嗷嗷！小日獸！快拍照！" },
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

export function getFrogDiaryClueAttemptNumberByEventId(eventId: string | null | undefined) {
  const stageIndex = FROG_DIARY_CLUE_STAGES.findIndex((stage) => stage.eventId === eventId);
  return stageIndex >= 0 ? stageIndex + 1 : null;
}

export function getFrogDiaryClueRouteTileId(photoAttemptCount: number) {
  return getFrogDiaryClueStageByAttempt(photoAttemptCount).routeTileId;
}

export function getFrogDiaryClueRouteHint(photoAttemptCount: number) {
  return getFrogDiaryClueStageByAttempt(photoAttemptCount).routeHint;
}
