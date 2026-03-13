export type EmotionCueId =
  | "alert"
  | "droplet"
  | "question"
  | "heart"
  | "anger"
  | "dizzy";

export const GAME_EMOTION_CUE_TRIGGER = "moment:emotion-cue-trigger";

export type EmotionCuePayload = {
  cueId: EmotionCueId;
};
