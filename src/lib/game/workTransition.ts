import type { PlayerProgress } from "@/lib/game/playerProgress";

export const WORK_TRANSITION_SCENE_IDS = ["scene-21-work", "scene-36", "scene-98-work"] as const;
export const WORK_MINIGAME_SCENE_IDS = ["scene-36", "scene-98-work"] as const;

export const DEFAULT_WORK_TRANSITION_FATIGUE_INCREASE_TOTAL = 10;

export function isWorkTransitionSceneId(sceneId: string): boolean {
  return (WORK_TRANSITION_SCENE_IDS as readonly string[]).includes(sceneId);
}

export function shouldOpenWorkMinigameForSceneId(sceneId: string): boolean {
  return (WORK_MINIGAME_SCENE_IDS as readonly string[]).includes(sceneId);
}

export function applyWorkTransitionFatigue(
  progress: PlayerProgress,
  fatigueIncrease: number,
): PlayerProgress {
  return {
    ...progress,
    status: {
      ...progress.status,
      fatigue: Math.max(0, progress.status.fatigue + fatigueIncrease),
    },
  };
}
