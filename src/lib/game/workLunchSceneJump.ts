import type { SceneJumpContextStep } from "@/lib/game/sceneJumpContextBus";

export const WORK_LUNCH_SCENE_JUMP_OPTION_ID = "frog-scene-1-store-route";

/**
 * The midday convenience-store sequence is rendered across the work scene and
 * route puzzle. Keep this list shared so QA's scene selector always mirrors
 * the dialogue currently on screen.
 */
export const WORK_LUNCH_SCENE_JUMP_STEPS: SceneJumpContextStep[] = [
  { id: "noon", kindLabel: "對話", speaker: "旁白", text: "中午時間。" },
  {
    id: "forgot",
    kindLabel: "對話",
    speaker: "小麥",
    text: "糟糕，早上急著出門，忘記帶便當了⋯⋯",
  },
  { id: "beigo-worry", kindLabel: "對話", speaker: "小貝狗", text: "嗷，怎麼辦？" },
  {
    id: "depart",
    kindLabel: "對話",
    speaker: "小麥",
    text: "沒關係，那就去便利商店買午餐好了。",
  },
  { id: "beigo-cheer", kindLabel: "對話", speaker: "小貝狗", text: "嗷！" },
  { id: "route", kindLabel: "安排路徑", text: "公司 → 便利商店" },
];

export function getWorkLunchSceneJumpStep(stepId: string | null | undefined) {
  return WORK_LUNCH_SCENE_JUMP_STEPS.find((step) => step.id === stepId) ?? null;
}
