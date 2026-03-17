export const GAME_PHOTO_CHEAT_TRIGGER = "moment:photo-cheat-trigger";

export type PhotoCheatAction = "enter-photo-mode" | "retake-photo";

export type PhotoCheatPayload = {
  action: PhotoCheatAction;
};
