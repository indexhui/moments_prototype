import { recordGameSfxTrigger } from "@/lib/game/audioStateMachine";

const GAME_SFX = {
  uiDialogContinue: {
    name: "對話繼續",
    src: "/sounds/game-sfx/ui-dialog-continue.ogg",
    volume: 0.16,
  },
  comicPanelPop: {
    name: "漫畫格彈出",
    src: "/sounds/game-sfx/comic-panel-bubble-pop.webm",
    volume: 0.28,
  },
  comicDoorClose: {
    name: "漫畫關門",
    src: "/sounds/game-sfx/comic-door-close.ogg",
    volume: 0.3,
  },
  cameraComicReveal: {
    name: "相機漫畫揭曉",
    src: "/sounds/game-sfx/camera-comic-reveal.webm",
    volume: 0.3,
  },
  photoResultNegative: {
    name: "拍照結果・失敗",
    src: "/sounds/game-sfx/photo-result-negative.ogg",
    volume: 0.3,
  },
  photoResultNormal: {
    name: "拍照結果・成功",
    src: "/sounds/game-sfx/photo-result-normal.ogg",
    volume: 0.28,
  },
  beigoDiaryReveal: {
    name: "小貝狗踏上日記・揭露",
    src: "/sounds/game-sfx/photo-result-normal.ogg",
    volume: 0.28,
  },
  cardDuelShuffle: {
    name: "牌局洗牌",
    src: "/sounds/game-sfx/card-duel-shuffle.ogg",
    volume: 0.32,
  },
  cardDuelDraftPick: {
    name: "牌局選牌",
    src: "/sounds/game-sfx/card-duel-draft-pick.ogg",
    volume: 0.3,
  },
  cardSlide: {
    name: "卡牌滑動",
    src: "/sounds/game-sfx/card-duel-draft-pick.ogg",
    volume: 0.3,
  },
  cardDuelPlay: {
    name: "牌局出牌",
    src: "/sounds/game-sfx/card-duel-play.ogg",
    volume: 0.34,
  },
  cardDuelReveal: {
    name: "牌局揭曉",
    src: "/sounds/game-sfx/card-duel-reveal.ogg",
    volume: 0.28,
  },
  wardrobePickUp: {
    name: "衣櫃拿取",
    src: "/sounds/game-sfx/wardrobe-pick-up.ogg",
    volume: 0.28,
  },
  wardrobeChange: {
    name: "衣櫃換裝",
    src: "/sounds/game-sfx/wardrobe-change.ogg",
    volume: 0.24,
  },
  diaryOpen: {
    name: "日記打開",
    src: "/sounds/game-sfx/diary-open.ogg",
    volume: 0.26,
  },
  diaryPageTurn: {
    name: "日記翻頁",
    src: "/sounds/game-sfx/diary-page-turn.ogg",
    volume: 0.22,
  },
  diaryPuzzlePickUp: {
    name: "日記拼圖片拿起",
    src: "/sounds/Audio_rpg/handleSmallLeather2.ogg",
    volume: 0.22,
  },
  diaryPuzzleMoveComplete: {
    name: "日記拼圖片移動完成",
    src: "/sounds/Audio_rpg/drawKnife1.ogg",
    volume: 0.24,
  },
  diaryWashiTapePeel: {
    name: "日記紙膠帶撕起",
    src: "/sounds/Audio_rpg/bookFlip3.ogg",
    volume: 0.2,
  },
  diaryWashiTapeAttach: {
    name: "日記紙膠帶貼上書籤",
    src: "/sounds/Audio_interface/drop_001.ogg",
    volume: 0.22,
  },
  diaryPuzzleSolved: {
    name: "日記拼圖完成",
    src: "/sounds/lolurio%20Free%20Cozy%20Game%20UI%20SFX%20Pack/WAV/UI%20SFX_InGameMenu_Open.wav",
    volume: 0.3,
  },
  sunbeastPhotoSlide: {
    name: "小日獸照片滑入日記",
    src: "/sounds/lolurio%20Free%20Cozy%20Game%20UI%20SFX%20Pack/OGG/UI%20SFX_MENU_Back.ogg",
    volume: 0.28,
  },
  cabinetBoxMiss: {
    name: "箱子完全落空",
    src: "/sounds/lolurio%20Free%20Cozy%20Game%20UI%20SFX%20Pack/OGG/UI%20SFX_FEEDBACK_Woom.ogg",
    volume: 0.28,
  },
  placeTileDrop: {
    name: "地點方塊放下",
    src: "/sounds/game-sfx/place-tile-drop.ogg",
    volume: 0.3,
  },
  placeTilePickUp: {
    name: "地點方塊拿起",
    src: "/sounds/game-sfx/place-tile-pick-up.ogg",
    volume: 0.28,
  },
  placeTileRemove: {
    name: "地點方塊移除",
    src: "/sounds/game-sfx/place-tile-remove.ogg",
    volume: 0.28,
  },
  routeDepart: {
    name: "路線出發",
    src: "/sounds/game-sfx/route-depart.ogg",
    volume: 0.3,
  },
  metroAnnouncement1: {
    name: "捷運提示音 1",
    src: "/sounds/Convenience Store Pack/SFX/Announcement 1.wav",
    volume: 0.6,
  },
  metroAnnouncement1End: {
    name: "捷運提示音 1・結尾",
    src: "/sounds/Convenience Store Pack/SFX/Announcement 1 End.wav",
    volume: 0.6,
  },
  metroAnnouncement2: {
    name: "捷運提示音 2",
    src: "/sounds/Convenience Store Pack/SFX/Announcement 2.wav",
    volume: 0.6,
  },
  frogJump: {
    name: "青蛙跳出",
    src: "/sounds/game-sfx/zapsplat_cartoon_frog_jump_26526.webm",
    volume: 0.32,
  },
} as const;

export type GameSfxId = keyof typeof GAME_SFX;

type PlayGameSfxOptions = {
  volumeScale?: number;
  playbackRate?: number;
};

const activeSounds = new Set<HTMLAudioElement>();

/**
 * Plays a short, fire-and-forget game sound. Playback remains non-blocking,
 * while its trigger and outcome are reported to the development audio panel.
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
  void audio.play().then(() => {
    recordGameSfxTrigger({
      id,
      name: definition.name,
      source: "音檔",
      path: definition.src,
    });
  }).catch(() => {
    recordGameSfxTrigger({
      id,
      name: definition.name,
      source: "音檔",
      path: definition.src,
      result: "blocked",
    });
    release();
  });

  return audio;
}

/**
 * Plays a list of sounds one after another. The returned cleanup stops the
 * active sound and prevents the rest of the sequence from starting.
 */
export function playGameSfxSequence(
  ids: readonly GameSfxId[],
  options: PlayGameSfxOptions = {},
) {
  if (typeof window === "undefined" || ids.length === 0) return () => undefined;

  let isStopped = false;
  let activeAudio: HTMLAudioElement | null = null;

  const playAt = (index: number) => {
    if (isStopped || index >= ids.length) return;

    const audio = playGameSfx(ids[index], options);
    if (!audio) return;
    activeAudio = audio;
    audio.addEventListener(
      "ended",
      () => {
        if (activeAudio === audio) activeAudio = null;
        playAt(index + 1);
      },
      { once: true },
    );
  };

  playAt(0);

  return () => {
    isStopped = true;
    if (!activeAudio) return;
    activeAudio.pause();
    try {
      activeAudio.currentTime = 0;
    } catch {
      // Some browsers reject seeking before audio metadata is available.
    }
    activeSounds.delete(activeAudio);
    activeAudio = null;
  };
}
