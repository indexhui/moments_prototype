export type BackgroundShakeId =
  | "shake-weak"
  | "shake-strong"
  | "flash-white"
  | "vignette-dark"
  | "cool-filter"
  | "border-pulse";

export const GAME_BACKGROUND_SHAKE_TRIGGER = "moment:background-shake-trigger";

export type BackgroundShakePayload = {
  shakeId: BackgroundShakeId;
};
