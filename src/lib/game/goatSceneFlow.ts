import type { SceneJumpContextStep } from "@/lib/game/sceneJumpContextBus";

export const GOAT_STORY_SCENE_ID = "scene-goat-commute-work";

export const GOAT_SCENE_JUMP_OPTION_ID = "goat-scene-commute-work";

export const GOAT_SCENE_JUMP_STEPS: SceneJumpContextStep[] = [
  {
    id: "goat-metro-intro",
    kindLabel: "捷運",
    speaker: "小麥",
    text: "在捷運上打開筆電，繼續趕昨天沒完成的工作。",
  },
  {
    id: "goat-metro-game-1",
    kindLabel: "小遊戲",
    text: "在捷運座位上收集文件，將工作進度從 30% 推進到 45%。",
  },
  {
    id: "goat-seat-choice",
    kindLabel: "選項",
    speaker: "阿伯",
    text: "讓座並停在 45%，或繼續工作把進度推進到 60%。",
  },
  {
    id: "goat-metro-game-2",
    kindLabel: "小遊戲",
    text: "不讓座支線：沿用剩餘秒數，繼續收集文件到 60%。",
  },
  {
    id: "goat-elevator-choice",
    kindLabel: "選項",
    speaker: "電梯裡的女生",
    text: "搭下一班或不妥協；這次選擇不進遊戲，只改變最終剩餘秒數。",
  },
  {
    id: "goat-office-game-75",
    kindLabel: "小遊戲",
    text: "從 75% 與較少剩餘秒數開始，完成最後的工作文件。",
  },
  {
    id: "goat-office-game-90",
    kindLabel: "小遊戲",
    text: "從 90% 與較多剩餘秒數開始，完成最後的工作文件。",
  },
  {
    id: "goat-trigger",
    kindLabel: "劇情",
    speaker: "小麥",
    text: "拒絕同事無理的請託，並在下班後看見山羊小日獸。",
  },
  {
    id: "goat-photo",
    kindLabel: "拍照",
    text: "在街道上拍下山羊小日獸。",
  },
  {
    id: "goat-collected",
    kindLabel: "收服",
    text: "山羊收錄進小日獸圖鑑。",
  },
];

export function isGoatSceneJumpStepId(stepId: string | null | undefined) {
  return GOAT_SCENE_JUMP_STEPS.some((step) => step.id === stepId);
}
