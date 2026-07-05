import type { GameEventId } from "@/lib/game/events";

export const GAME_SCENE_JUMP_CONTEXT_CHANGE_EVENT = "moment:scene-jump-context-change";

export type SceneJumpContextStep = {
  id: string;
  kindLabel: string;
  speaker?: string;
  text: string;
};

export type SceneJumpContextPayload = {
  eventId?: GameEventId;
  optionId?: string;
  kindLabel?: string;
  speaker?: string;
  text?: string;
  steps?: SceneJumpContextStep[];
  currentStepId?: string;
  clear?: boolean;
};

let latestSceneJumpContextPayload: SceneJumpContextPayload | null = null;

export function getSceneJumpContextSnapshot() {
  return latestSceneJumpContextPayload;
}

export function dispatchSceneJumpContextChange(payload: SceneJumpContextPayload) {
  if (payload.clear) {
    if (!payload.eventId || latestSceneJumpContextPayload?.eventId === payload.eventId) {
      latestSceneJumpContextPayload = null;
    }
  } else {
    latestSceneJumpContextPayload = payload;
  }

  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(GAME_SCENE_JUMP_CONTEXT_CHANGE_EVENT, { detail: payload }));
}
