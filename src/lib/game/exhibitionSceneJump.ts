import {
  EXHIBITION_DIARY_READ_LINES,
  EXHIBITION_FORGOT_LUNCH_LINES,
  EXHIBITION_METRO_COMIC_NARRATION,
  EXHIBITION_METRO_DOG_AFTER_PHOTO,
  EXHIBITION_METRO_DOG_BEFORE_PHOTO,
  EXHIBITION_NARRATIVE_LINES,
  type ExhibitionNarrativePhase,
  type ExhibitionPhase,
} from "@/lib/game/exhibitionFlow";
import {
  FIRST_FROG_CLUE_ESCAPE_LINE,
  STREET_FLYER_WIND_MINIGAME_AFTER_LINE_INDEX,
  buildFrogDiaryClueSceneJumpSteps,
  getFrogDiaryCluePostPhotoLines,
  isFrogDiaryRevealSceneJumpStepId,
  type FrogDiaryClueStage,
} from "@/lib/game/frogDiaryClueFlow";
import type { SceneJumpContextStep } from "@/lib/game/sceneJumpContextBus";
import { EXHIBITION_STREET_FLYER_STAGE } from "@/lib/game/exhibitionFrogStreetFlow";
import { EXHIBITION_CONVENIENCE_FROG_STAGE } from "@/lib/game/exhibitionFrogConvenienceFlow";
import { EXHIBITION_DESSERT_FROG_STAGE } from "@/lib/game/exhibitionFrogDessertFlow";

const LEGACY_HIDDEN_PHASES = new Set<ExhibitionPhase>([
  "argument-flashback",
  "post-flashback-diary",
  "post-flashback-metro",
]);

export function isExhibitionMenuPhase(phase: ExhibitionPhase) {
  return !LEGACY_HIDDEN_PHASES.has(phase);
}

function interaction(id: string, kindLabel: string, text: string): SceneJumpContextStep {
  return { id, kindLabel, text };
}

function narrativeSteps(phase: ExhibitionNarrativePhase): SceneJumpContextStep[] {
  return EXHIBITION_NARRATIVE_LINES[phase].map((line) => ({
    id: line.id,
    kindLabel: "對話",
    speaker: line.speaker,
    text: line.text,
  }));
}

function buildFrogEventSteps({
  stage,
  photoAttemptNumber,
  requiredPhotoAttempts = 3,
  includePostPhotoLines = true,
}: {
  stage: FrogDiaryClueStage;
  photoAttemptNumber: number;
  requiredPhotoAttempts?: number;
  includePostPhotoLines?: boolean;
}): SceneJumpContextStep[] {
  const steps: SceneJumpContextStep[] = stage.lines.map((line, index) => ({
    id: `line-${index}`,
    kindLabel: "對話",
    speaker: line.speaker,
    text: line.text,
  }));

  if (stage.introTitleCard) {
    steps.unshift(interaction("intro-title-card", "過場", stage.introTitleCard));
  }

  if (stage.id === "street-flyer") {
    const introStepCount = stage.introTitleCard ? 1 : 0;
    const windMinigameAfterLineIndex =
      stage.windMinigameAfterLineIndex ?? STREET_FLYER_WIND_MINIGAME_AFTER_LINE_INDEX;
    steps.splice(
      windMinigameAfterLineIndex + 1 + introStepCount,
      0,
      interaction("flyer-wind-minigame", "小遊戲", "把被風吹散的傳單撿回來"),
    );
  }

  steps.push(
    interaction(
      "photo",
      "拍照",
      photoAttemptNumber >= requiredPhotoAttempts ? "拍下青蛙小日獸" : "拍下青蛙線索",
    ),
  );

  if (includePostPhotoLines && photoAttemptNumber <= 1) {
    const escapeLine = stage.escapeLine ?? FIRST_FROG_CLUE_ESCAPE_LINE;
    steps.push({
      id: "escape-line",
      kindLabel: "對話",
      speaker: escapeLine.speaker,
      text: escapeLine.text,
    });
    (
      stage.postPhotoLines ??
      getFrogDiaryCluePostPhotoLines(photoAttemptNumber, requiredPhotoAttempts)
    ).forEach(
      (line, index) => {
        steps.push({
          id: `post-photo-${index}`,
          kindLabel: "對話",
          speaker: line.speaker,
          text: line.text,
        });
      },
    );
  }

  return steps;
}

function buildFrogDiarySteps({
  stage,
  photoAttemptNumber,
  requiredPhotoAttempts = 3,
  locationOrder = "default",
}: {
  stage: FrogDiaryClueStage;
  photoAttemptNumber: number;
  requiredPhotoAttempts?: number;
  locationOrder?: "default" | "street-first";
}) {
  let steps = buildFrogDiaryClueSceneJumpSteps({
    stage,
    photoAttemptNumber,
    requiredPhotoAttempts,
  }).filter(
    (step) =>
      isFrogDiaryRevealSceneJumpStepId(step.id) &&
      ![
        "frog-diary-reaction",
        "next-diary-catalog",
        "next-diary-puzzle",
        "next-diary-blocked-reaction-mai",
        "coworker-request-mission",
      ].includes(step.id),
  );

  if (locationOrder === "street-first") {
    const currentLocation =
      photoAttemptNumber >= requiredPhotoAttempts
        ? "甜點店"
        : photoAttemptNumber === 1
          ? "街道"
          : "便利商店";
    const nextLocation = photoAttemptNumber === 1 ? "便利商店" : "甜點店";
    steps = steps.map((step) => {
      if (step.id === "diary-photo-slide") {
        return { ...step, text: `${currentLocation}拍到的青蛙照片貼進日記` };
      }
      if (step.id === "diary-fragment-updated") {
        return { ...step, text: `${currentLocation}日記頁更新` };
      }
      if (step.id === "diary-fragment-enter") {
        return { ...step, text: `打開${currentLocation}日記頁` };
      }
      if (step.id === "diary-fragment-ready" && photoAttemptNumber < requiredPhotoAttempts) {
        return { ...step, text: `${currentLocation}日記完成，取得${nextLocation}提示` };
      }
      if (step.id === "diary-fragment-ready") {
        return { ...step, text: "甜點店日記完成，可閱讀完整搬家日記" };
      }
      return step;
    });
  }

  if (photoAttemptNumber >= requiredPhotoAttempts) {
    steps.push(
      ...EXHIBITION_FROG_COMPLETE_READ_LINES.map((line, index) => ({
        id: `diary-read-${index}`,
        kindLabel: "對話",
        speaker: line.speaker,
        text: line.text,
      })),
    );
  }

  return steps;
}

export const EXHIBITION_FROG_COMPLETE_READ_LINES: readonly {
  speaker: "小麥";
  text: string;
}[] = [];

const streetFlyerStage = EXHIBITION_STREET_FLYER_STAGE;
const convenienceStage = EXHIBITION_CONVENIENCE_FROG_STAGE;
const dessertStage = EXHIBITION_DESSERT_FROG_STAGE;

const metroDogSteps: SceneJumpContextStep[] = [
  ...EXHIBITION_METRO_DOG_BEFORE_PHOTO.map((line, index) => ({
    id: `before-${index}`,
    kindLabel: "對話",
    speaker: line.speaker,
    text: line.text,
  })),
  interaction("photo", "拍照", "把白框對準黃金獵犬並按下快門"),
  ...EXHIBITION_METRO_DOG_AFTER_PHOTO.map((line, index) => ({
    id: `after-${index}`,
    kindLabel: "對話",
    speaker: line.speaker,
    text: line.text,
  })),
];

const forgottenLunchSteps: SceneJumpContextStep[] = EXHIBITION_FORGOT_LUNCH_LINES.map(
  (line, index) => ({
    id: `intro-${index}`,
    kindLabel: "對話",
    speaker: line.speaker,
    text: line.text,
  }),
);

export const EXHIBITION_SCENE_JUMP_STEPS: Record<
  ExhibitionPhase,
  readonly SceneJumpContextStep[]
> = {
  "departure-opening": narrativeSteps("departure-opening"),
  "mai-intro": [interaction("intro-card", "玩家操作", "閱讀小麥角色介紹並點擊繼續")],
  "departure-plan": narrativeSteps("departure-plan"),
  "departure-route": [interaction("route-transition", "過場", "從家前往捷運站")],
  "metro-opening": narrativeSteps("metro-opening"),
  "metro-comic": [
    {
      id: "comic-dialogue",
      kindLabel: "對話／漫畫",
      speaker: "旁白",
      text: EXHIBITION_METRO_COMIC_NARRATION,
    },
  ],
  "metro-dog": metroDogSteps,
  "dog-photo-diary": [
    interaction("book", "玩家操作", "拿起日記並翻開"),
    interaction("photo-slide", "日記演出", "黃金獵犬照片滑入日記"),
    interaction("photo-detail", "玩家操作", "查看直太郎照片並點擊繼續"),
    interaction("diary-unlock", "玩家操作", "確認直太郎日記解鎖"),
  ],
  "diary-incomplete": [
    interaction("diary-puzzle", "日記拼圖", "排列直太郎日記碎片並完成修復"),
  ],
  "post-puzzle-metro": narrativeSteps("post-puzzle-metro"),
  "post-flashback-diary": narrativeSteps("post-flashback-diary"),
  "post-flashback-metro": narrativeSteps("post-flashback-metro"),
  "metro-to-company": [interaction("route-transition", "過場", "從捷運站前往公司")],
  "office-opening": [interaction("office-opening", "玩家操作", "觀看公司開場並點擊繼續")],
  "work-arrival": narrativeSteps("work-arrival"),
  "box-game": [interaction("box-game", "小遊戲", "幫同事把資料箱疊進櫃子")],
  "work-complete": narrativeSteps("work-complete"),
  "work-dusk": [interaction("work-dusk", "過場", "小麥繼續工作，辦公室進入黃昏")],
  "work-leave": narrativeSteps("work-leave"),
  "home-search": narrativeSteps("home-search"),
  "diary-restore": [
    interaction("book", "玩家操作", "拿起並翻開已修復的日記"),
    interaction("restoration", "日記演出", "查看直太郎日記恢復"),
    ...EXHIBITION_DIARY_READ_LINES.map((line, index) => ({
      id: `read-${index}`,
      kindLabel: "對話",
      speaker: line.speaker,
      text: line.text,
    })),
  ],
  "bai-change-first": narrativeSteps("bai-change-first"),
  "bai-after-flashback": narrativeSteps("bai-after-flashback"),
  "frog-diary-fragment": [
    interaction("book", "玩家操作", "拿起日記並翻開"),
    interaction("catalog", "玩家操作", "從目錄查看新的青蛙殘篇"),
    interaction("fragment-puzzle", "日記拼圖", "選擇街道紙膠帶並完成殘篇線索"),
  ],
  "day-one-rest": [
    interaction("rest-transition", "跨日轉場", "第一天結束，休息"),
    interaction("wake-up", "玩家操作", "以小麥視角起床並關掉鬧鐘"),
  ],
  "morning-route-intro": narrativeSteps("morning-route-intro"),
  "morning-route": [
    interaction("route-game", "路線拼圖", "用街道、捷運與商店安排今天的上班路線"),
    interaction("open-diary", "玩家操作", "從右側打開日記回顧街道線索"),
  ],
  "no-sunbeast-workday": [
    interaction("workday-fast-forward", "快速過場", "快速帶過上班到下班的一天"),
  ],
  "no-sunbeast-summary": narrativeSteps("no-sunbeast-summary"),
  "street-flyer": [
    ...buildFrogEventSteps({
      stage: streetFlyerStage,
      photoAttemptNumber: 1,
      includePostPhotoLines: false,
    }),
    ...buildFrogDiarySteps({
      stage: streetFlyerStage,
      photoAttemptNumber: 1,
      locationOrder: "street-first",
    }),
  ],
  "convenience-clerk": [
    ...forgottenLunchSteps,
    interaction("route", "路線拼圖", "排列公司到便利商店的午餐路線"),
    ...buildFrogEventSteps({ stage: convenienceStage, photoAttemptNumber: 2 }),
    ...buildFrogDiarySteps({
      stage: convenienceStage,
      photoAttemptNumber: 2,
      locationOrder: "street-first",
    }),
  ],
  "convenience-photo-return": narrativeSteps("convenience-photo-return"),
  "convenience-to-company": [
    interaction("route-transition", "前往轉場", "拍照後從便利商店返回公司"),
  ],
  "convenience-work-resume": [
    interaction("work-resume", "工作過場", "回到公司座位繼續工作至下班"),
  ],
  "work-return": narrativeSteps("work-return"),
  "street-to-company": [
    interaction("route-transition", "前往轉場", "行程結束後從街道前往公司"),
  ],
  "street-office-arrival": [
    interaction("office-seat-arrival", "公司進場", "抵達公司並走到座位"),
  ],
  "work-value": [interaction("work-value", "工作遊戲", "完成當日急件")],
  "work-todo": [interaction("work-todo", "工作遊戲", "操作 Todo List 完成工作")],
  "work-pack": [interaction("work-pack", "工作遊戲", "照交付單整理資料箱")],
  "work-social": [interaction("work-social", "工作遊戲", "用有限預算完成社群貼文")],
  "work-files": [interaction("work-files", "工作遊戲", "整理並壓縮三份文件")],
  "work-flow": [interaction("work-flow", "工作遊戲", "操作輸送帶資料工廠")],
  "work-clicker": [interaction("work-clicker", "工作遊戲", "製作素材並發布人氣貼文")],
  "dessert-transition": narrativeSteps("dessert-transition"),
  "dessert-route": [interaction("route-game", "小遊戲", "尋找甜點店")],
  "frog-dessert": [
    ...buildFrogEventSteps({
      stage: dessertStage,
      photoAttemptNumber: 3,
      requiredPhotoAttempts: 3,
    }),
    ...buildFrogDiarySteps({
      stage: dessertStage,
      photoAttemptNumber: 3,
      requiredPhotoAttempts: 3,
      locationOrder: "street-first",
    }),
  ],
  "home-final": narrativeSteps("home-final"),
  "argument-flashback": narrativeSteps("argument-flashback"),
  "complete": [
    interaction("complete", "結尾", "查看展覽版完成畫面"),
    interaction("restart", "玩家操作", "重新體驗展覽版本"),
  ],
};

export function getExhibitionSceneJumpSteps(phase: ExhibitionPhase) {
  return EXHIBITION_SCENE_JUMP_STEPS[phase];
}

export function getDefaultExhibitionSceneStepId(phase: ExhibitionPhase) {
  return EXHIBITION_SCENE_JUMP_STEPS[phase][0]?.id;
}

export function isExhibitionSceneStep(phase: ExhibitionPhase, stepId: string | null | undefined) {
  return Boolean(
    stepId && EXHIBITION_SCENE_JUMP_STEPS[phase].some((step) => step.id === stepId),
  );
}

export function isExhibitionFrogDiaryStep(stepId: string | null | undefined) {
  return Boolean(
    isFrogDiaryRevealSceneJumpStepId(stepId) || stepId?.match(/^diary-read-\d+$/),
  );
}

export function getExhibitionForgotLunchLineIndex(stepId: string | null | undefined) {
  const match = stepId?.match(/^intro-(\d+)$/);
  if (!match) return 0;
  const index = Number(match[1]);
  return Number.isInteger(index) && index >= 0 && index < EXHIBITION_FORGOT_LUNCH_LINES.length
    ? index
    : 0;
}

export function getExhibitionDiaryReadLineIndex(stepId: string | null | undefined) {
  const match = stepId?.match(/^read-(\d+)$/);
  if (!match) return null;
  const index = Number(match[1]);
  return Number.isInteger(index) && index >= 0 && index < EXHIBITION_DIARY_READ_LINES.length
    ? index
    : null;
}

export function getExhibitionFrogReadLineIndex(stepId: string | null | undefined) {
  const match = stepId?.match(/^diary-read-(\d+)$/);
  if (!match) return null;
  const index = Number(match[1]);
  return Number.isInteger(index) &&
    index >= 0 &&
    index < EXHIBITION_FROG_COMPLETE_READ_LINES.length
    ? index
    : null;
}
