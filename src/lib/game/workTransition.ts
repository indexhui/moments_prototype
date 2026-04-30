import type { PlayerProgress } from "@/lib/game/playerProgress";

export const WORK_TRANSITION_SCENE_IDS = ["scene-21-work", "scene-36", "scene-98-work"] as const;
export const WORK_MINIGAME_SCENE_IDS = ["scene-98-work"] as const;
export type WorkMinigameKind = "sticky-notes" | "stamp-documents";

export const DEFAULT_WORK_TRANSITION_FATIGUE_INCREASE_TOTAL = 10;

const WORK_MINIGAME_ROTATION: readonly WorkMinigameKind[] = ["sticky-notes", "stamp-documents"] as const;

export function isWorkTransitionSceneId(sceneId: string): boolean {
  return (WORK_TRANSITION_SCENE_IDS as readonly string[]).includes(sceneId);
}

export function shouldOpenWorkMinigameForSceneId(sceneId: string): boolean {
  return (WORK_MINIGAME_SCENE_IDS as readonly string[]).includes(sceneId);
}

export function getWorkMinigameKindForSceneId(
  sceneId: string,
  completedWorkShiftCount = 0,
): WorkMinigameKind | null {
  if (!shouldOpenWorkMinigameForSceneId(sceneId)) return null;

  const playableWorkMinigameIndex = Math.max(0, Math.floor(completedWorkShiftCount) - 1);
  return WORK_MINIGAME_ROTATION[playableWorkMinigameIndex % WORK_MINIGAME_ROTATION.length] ?? null;
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
