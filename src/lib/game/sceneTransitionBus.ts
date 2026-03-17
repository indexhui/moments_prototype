export const GAME_SCENE_TRANSITION_TRIGGER = "moment:scene-transition-trigger";

export type SceneTransitionPresetId = "fade-black";

export type SceneTransitionPayload = {
  preset: SceneTransitionPresetId;
  durationMs?: number;
};
