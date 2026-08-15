const GAME_SFX = {
  uiDialogContinue: {
    src: "/sounds/game-sfx/ui-dialog-continue.ogg",
    volume: 0.16,
  },
  cardDuelShuffle: {
    src: "/sounds/game-sfx/card-duel-shuffle.ogg",
    volume: 0.32,
  },
  cardDuelDraftPick: {
    src: "/sounds/game-sfx/card-duel-draft-pick.ogg",
    volume: 0.3,
  },
  cardDuelPlay: {
    src: "/sounds/game-sfx/card-duel-play.ogg",
    volume: 0.34,
  },
  cardDuelReveal: {
    src: "/sounds/game-sfx/card-duel-reveal.ogg",
    volume: 0.28,
  },
  wardrobePickUp: {
    src: "/sounds/game-sfx/wardrobe-pick-up.ogg",
    volume: 0.28,
  },
  wardrobeChange: {
    src: "/sounds/game-sfx/wardrobe-change.ogg",
    volume: 0.24,
  },
  diaryOpen: {
    src: "/sounds/game-sfx/diary-open.ogg",
    volume: 0.26,
  },
  diaryPageTurn: {
    src: "/sounds/game-sfx/diary-page-turn.ogg",
    volume: 0.22,
  },
  placeTileDrop: {
    src: "/sounds/game-sfx/place-tile-drop.ogg",
    volume: 0.3,
  },
  placeTilePickUp: {
    src: "/sounds/game-sfx/place-tile-pick-up.ogg",
    volume: 0.28,
  },
  placeTileRemove: {
    src: "/sounds/game-sfx/place-tile-remove.ogg",
    volume: 0.28,
  },
} as const;

export type GameSfxId = keyof typeof GAME_SFX;

type PlayGameSfxOptions = {
  volumeScale?: number;
  playbackRate?: number;
};

const activeSounds = new Set<HTMLAudioElement>();

/**
 * Plays a short, fire-and-forget game sound. Playback failures are deliberately
 * ignored because browsers may block audio until the first user interaction.
 */
export function playGameSfx(
  id: GameSfxId,
  { volumeScale = 1, playbackRate = 1 }: PlayGameSfxOptions = {},
) {
  if (typeof window === "undefined") return;

  const definition = GAME_SFX[id];
  const audio = new Audio(definition.src);
  audio.preload = "auto";
  audio.volume = Math.max(0, Math.min(1, definition.volume * volumeScale));
  audio.playbackRate = Math.max(0.5, Math.min(2, playbackRate));
  activeSounds.add(audio);

  const release = () => {
    activeSounds.delete(audio);
    audio.removeEventListener("ended", release);
    audio.removeEventListener("error", release);
  };

  audio.addEventListener("ended", release, { once: true });
  audio.addEventListener("error", release, { once: true });
  void audio.play().catch(release);
}
