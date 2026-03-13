import type { GameEventId } from "@/lib/game/events";

export const GAME_EVENT_CHEAT_TRIGGER = "moment:game-event-cheat-trigger";

export type GameEventCheatPayload = {
  eventId: GameEventId;
};

