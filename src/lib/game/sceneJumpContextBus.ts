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

export function dispatchSceneJumpContextChange(payload: SceneJumpContextPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(GAME_SCENE_JUMP_CONTEXT_CHANGE_EVENT, { detail: payload }));
}
