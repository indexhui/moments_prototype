"use client";

export type GameMusicTrackId =
  | "mainTheme"
  | "exhibitionFlashback"
  | "flyerMinigame"
  | "convenienceStore";

export type GameMusicPlaybackState =
  | "stopped"
  | "loading"
  | "playing"
  | "transitioning"
  | "blocked"
  | "error";

export type GameSfxPlaybackResult = "played" | "not-ready" | "blocked";

export const GAME_MUSIC_TRACKS: Record<
  GameMusicTrackId,
  { name: string; source: string }
> = {
  mainTheme: {
    name: "主題段落音樂",
    source: "FMOD · music_piece_main",
  },
  exhibitionFlashback: {
    name: "走走小日 demo 05",
    source: "音檔 · 回憶段落",
  },
  flyerMinigame: {
    name: "Poppy Shop",
    source: "音檔 · 撿傳單小遊戲",
  },
  convenienceStore: {
    name: "Quircky Shop",
    source: "音檔 · 便利商店",
  },
};

export type GameAudioStateSnapshot = {
  revision: number;
  music: {
    requested: boolean;
    trackId: GameMusicTrackId;
    playback: GameMusicPlaybackState;
    muted: boolean;
    volume: number;
    error: string | null;
  };
  lastSfx: {
    id: string;
    name: string;
    source: "FMOD" | "音檔";
    path: string;
    result: GameSfxPlaybackResult;
    trigger: {
      kind: "interaction" | "system";
      label: string;
    };
    occurredAt: number;
  } | null;
};

export const GAME_AUDIO_STATE_CHANGE_EVENT = "moment:game-audio-state-change";

const INTERACTION_CONTEXT_LIFETIME_MS = 1_600;

let snapshot: GameAudioStateSnapshot = {
  revision: 0,
  music: {
    requested: false,
    trackId: "mainTheme",
    playback: "stopped",
    muted: false,
    volume: 0.65,
    error: null,
  },
  lastSfx: null,
};

let interactionTrackingReady = false;
let latestInteraction: { label: string; occurredAt: number } | null = null;

function cleanLabel(value: string | null | undefined) {
  if (!value) return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  return cleaned.length > 38 ? `${cleaned.slice(0, 37)}…` : cleaned;
}

function describeInteractionTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return "未命名互動";

  const interactive = target.closest<HTMLElement>(
    "[data-audio-trigger-label], button, a, [role='button'], [aria-label], input, select, summary",
  );
  const element = interactive ?? target;
  const explicitLabel = cleanLabel(
    element.getAttribute("data-audio-trigger-label")
      ?? element.getAttribute("aria-label")
      ?? element.getAttribute("title"),
  );
  if (explicitLabel) return explicitLabel;

  if (element instanceof HTMLInputElement) {
    return cleanLabel(element.value) ?? cleanLabel(element.name) ?? "輸入欄位";
  }

  return cleanLabel(element.textContent)
    ?? cleanLabel(element.getAttribute("alt"))
    ?? "未命名互動";
}

function rememberInteraction(event: Event) {
  if (event instanceof KeyboardEvent && event.key !== "Enter" && event.key !== " ") {
    return;
  }
  latestInteraction = {
    label: describeInteractionTarget(event.target),
    occurredAt: Date.now(),
  };
}

export function prepareGameAudioStateMachine() {
  if (typeof window === "undefined" || interactionTrackingReady) return;
  interactionTrackingReady = true;
  window.addEventListener("pointerdown", rememberInteraction, true);
  window.addEventListener("keydown", rememberInteraction, true);
}

function emitSnapshot() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<GameAudioStateSnapshot>(GAME_AUDIO_STATE_CHANGE_EVENT, {
      detail: snapshot,
    }),
  );
}

export function getGameAudioStateSnapshot() {
  return snapshot;
}

export function updateGameMusicState(
  patch: Partial<GameAudioStateSnapshot["music"]>,
) {
  snapshot = {
    ...snapshot,
    revision: snapshot.revision + 1,
    music: {
      ...snapshot.music,
      ...patch,
    },
  };
  emitSnapshot();
}

export function recordGameSfxTrigger({
  id,
  name,
  source,
  path,
  result = "played",
}: {
  id: string;
  name: string;
  source: "FMOD" | "音檔";
  path: string;
  result?: GameSfxPlaybackResult;
}) {
  prepareGameAudioStateMachine();
  const now = Date.now();
  const isRecentInteraction = Boolean(
    latestInteraction
      && now - latestInteraction.occurredAt <= INTERACTION_CONTEXT_LIFETIME_MS,
  );

  snapshot = {
    ...snapshot,
    revision: snapshot.revision + 1,
    lastSfx: {
      id,
      name,
      source,
      path,
      result,
      trigger: isRecentInteraction && latestInteraction
        ? { kind: "interaction", label: latestInteraction.label }
        : { kind: "system", label: "場景／系統自動觸發" },
      occurredAt: now,
    },
  };
  emitSnapshot();
}

if (typeof window !== "undefined") {
  prepareGameAudioStateMachine();
}
