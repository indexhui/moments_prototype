export const GAME_WORK_MINIGAME_CHEAT_TRIGGER = "game:work-minigame-cheat-trigger";
export const WORK_MINIGAME_CHEAT_KIND_STORAGE_KEY = "game:work-minigame-cheat-kind";

export type WorkMinigameCheatKind = "sticky-notes" | "stamp-documents";

export type WorkMinigameCheatPayload = {
  kind?: WorkMinigameCheatKind;
};
