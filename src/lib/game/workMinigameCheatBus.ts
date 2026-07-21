export const GAME_WORK_MINIGAME_CHEAT_TRIGGER = "game:work-minigame-cheat-trigger";
export const WORK_MINIGAME_CHEAT_KIND_STORAGE_KEY = "game:work-minigame-cheat-kind";

export type WorkMinigameCheatKind =
  | "cabinet-box-stack"
  | "sticky-notes"
  | "stamp-documents"
  | "export-pdf"
  | "office-chicken"
  | "park-ostrich";

export type WorkMinigameCheatPayload = {
  kind?: WorkMinigameCheatKind;
};
