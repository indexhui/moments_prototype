"use client";

export type GameMusicTrackId =
  | "themeMusic"
  | "mainTheme"
  | "exhibitionFlashback"
  | "flyerMinigame"
  | "convenienceStore"
  | "dessertShop";

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
  themeMusic: {
    name: "ThemeMusic",
    source: "音檔 · 展覽開始畫面",
  },
  mainTheme: {
    name: "主題段落音樂",
    source: "音檔 · ThemeMusic",
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
  dessertShop: {
    name: "Jazzy Shop",
    source: "音檔 · 甜點店",
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
  sfx: {
    muted: boolean;
    volume: number;
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
export const GAME_SFX_MUTED_CHANGE_EVENT = "moment:game-sfx-muted-change";
export const GAME_SFX_VOLUME_CHANGE_EVENT = "moment:game-sfx-volume-change";

const INTERACTION_CONTEXT_LIFETIME_MS = 1_600;
const GAME_SFX_MUTED_STORAGE_KEY = "moment:game-sfx-muted";
const GAME_SFX_VOLUME_STORAGE_KEY = "moment:game-sfx-volume";
const DEFAULT_GAME_SFX_VOLUME = 1;

function clampSfxVolume(volume: number) {
  return Math.max(
    0,
    Math.min(1, Number.isFinite(volume) ? volume : DEFAULT_GAME_SFX_VOLUME),
  );
}

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
  sfx: {
    muted: false,
    volume: DEFAULT_GAME_SFX_VOLUME,
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
  try {
    snapshot = {
      ...snapshot,
      sfx: {
        muted: window.localStorage.getItem(GAME_SFX_MUTED_STORAGE_KEY) === "true",
        volume: clampSfxVolume(
          Number.parseFloat(
            window.localStorage.getItem(GAME_SFX_VOLUME_STORAGE_KEY)
              ?? String(DEFAULT_GAME_SFX_VOLUME),
          ),
        ),
      },
    };
  } catch {
    // Storage can be unavailable in privacy-restricted exhibition browsers.
  }
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

export function setGameSfxMuted(muted: boolean) {
  if (typeof window === "undefined") {
    snapshot = {
      ...snapshot,
      revision: snapshot.revision + 1,
      sfx: { ...snapshot.sfx, muted },
    };
    return muted;
  }
  prepareGameAudioStateMachine();
  try {
    window.localStorage.setItem(GAME_SFX_MUTED_STORAGE_KEY, String(muted));
  } catch {
    // Keep the preference in memory when persistent storage is unavailable.
  }
  snapshot = {
    ...snapshot,
    revision: snapshot.revision + 1,
    sfx: { ...snapshot.sfx, muted },
  };
  window.dispatchEvent(
    new CustomEvent(GAME_SFX_MUTED_CHANGE_EVENT, {
      detail: { muted },
    }),
  );
  emitSnapshot();
  return muted;
}

export function setGameSfxVolume(volume: number) {
  const nextVolume = clampSfxVolume(volume);
  if (typeof window === "undefined") {
    snapshot = {
      ...snapshot,
      revision: snapshot.revision + 1,
      sfx: { ...snapshot.sfx, volume: nextVolume },
    };
    return nextVolume;
  }
  prepareGameAudioStateMachine();
  try {
    window.localStorage.setItem(GAME_SFX_VOLUME_STORAGE_KEY, String(nextVolume));
  } catch {
    // Keep the preference in memory when persistent storage is unavailable.
  }
  snapshot = {
    ...snapshot,
    revision: snapshot.revision + 1,
    sfx: { ...snapshot.sfx, volume: nextVolume },
  };
  window.dispatchEvent(
    new CustomEvent(GAME_SFX_VOLUME_CHANGE_EVENT, {
      detail: { volume: nextVolume },
    }),
  );
  emitSnapshot();
  return nextVolume;
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
