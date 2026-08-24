import {
  GAME_SFX_MUTED_CHANGE_EVENT,
  getGameAudioStateSnapshot,
  recordGameSfxTrigger,
} from "@/lib/game/audioStateMachine";

// These are perceptual mix gains, not raw asset volumes. They compensate for
// the large RMS differences between source packs so equal numbers are not expected.
const GAME_SFX = {
  uiDialogContinue: {
    name: "對話繼續",
    src: "/sounds/game-sfx/ui-dialog-continue.ogg",
    volume: 0.28,
  },
  comicPanelPop: {
    name: "漫畫格彈出",
    src: "/sounds/game-sfx/comic-panel-bubble-pop.webm",
    volume: 0.12,
  },
  comicDoorClose: {
    name: "漫畫關門",
    src: "/sounds/game-sfx/comic-door-close.ogg",
    volume: 0.3,
  },
  cameraComicReveal: {
    name: "相機漫畫揭曉",
    src: "/sounds/game-sfx/camera-comic-reveal.webm",
    volume: 0.58,
  },
  photoResultNegative: {
    name: "拍照結果・失敗",
    src: "/sounds/game-sfx/photo-result-negative.ogg",
    volume: 0.56,
  },
  photoResultNormal: {
    name: "拍照結果・成功",
    src: "/sounds/game-sfx/photo-result-normal.ogg",
    volume: 0.85,
  },
  beigoDiaryReveal: {
    name: "小貝狗踏上日記・揭露",
    src: "/sounds/game-sfx/photo-result-normal.ogg",
    volume: 0.85,
  },
  cardDuelShuffle: {
    name: "牌局洗牌",
    src: "/sounds/game-sfx/card-duel-shuffle.ogg",
    volume: 1,
  },
  cardDuelDraftPick: {
    name: "牌局選牌",
    src: "/sounds/game-sfx/card-duel-draft-pick.ogg",
    volume: 0.43,
  },
  cardSlide: {
    name: "卡牌滑動",
    src: "/sounds/game-sfx/card-duel-draft-pick.ogg",
    volume: 0.43,
  },
  cardDuelPlay: {
    name: "牌局出牌",
    src: "/sounds/game-sfx/card-duel-play.ogg",
    volume: 1,
  },
  cardDuelReveal: {
    name: "牌局揭曉",
    src: "/sounds/game-sfx/card-duel-reveal.ogg",
    volume: 0.45,
  },
  wardrobePickUp: {
    name: "衣櫃拿取",
    src: "/sounds/game-sfx/wardrobe-pick-up.ogg",
    volume: 0.82,
  },
  wardrobeChange: {
    name: "衣櫃換裝",
    src: "/sounds/game-sfx/wardrobe-change.ogg",
    volume: 0.95,
  },
  diaryOpen: {
    name: "日記打開",
    src: "/sounds/game-sfx/diary-open.ogg",
    volume: 1,
  },
  diaryPageTurn: {
    name: "日記翻頁",
    src: "/sounds/Audio_rpg/bookFlip1.ogg",
    volume: 0.75,
  },
  diaryPuzzlePickUp: {
    name: "日記拼圖片拿起",
    src: "/sounds/Audio_rpg/handleSmallLeather.ogg",
    volume: 1,
  },
  diaryPuzzleMoveComplete: {
    name: "日記拼圖片移動完成",
    src: "/sounds/Audio_rpg/drawKnife3.ogg",
    volume: 1,
  },
  diaryWashiTapePeel: {
    name: "日記紙膠帶撕起",
    src: "/sounds/Audio_rpg/bookFlip3.ogg",
    volume: 1,
  },
  diaryWashiTapeAttach: {
    name: "日記紙膠帶貼上書籤",
    src: "/sounds/Audio_interface/drop_001.ogg",
    volume: 0.43,
  },
  diaryPuzzleSolved: {
    name: "日記拼圖完成",
    src: "/sounds/lolurio%20Free%20Cozy%20Game%20UI%20SFX%20Pack/WAV/UI%20SFX_InGameMenu_Open.wav",
    volume: 0.86,
  },
  sunbeastPhotoSlide: {
    name: "小日獸照片滑入日記",
    src: "/sounds/lolurio%20Free%20Cozy%20Game%20UI%20SFX%20Pack/OGG/UI%20SFX_MENU_Back.ogg",
    volume: 0.81,
  },
  cabinetBoxMiss: {
    name: "箱子完全落空",
    src: "/sounds/lolurio%20Free%20Cozy%20Game%20UI%20SFX%20Pack/OGG/UI%20SFX_FEEDBACK_Woom.ogg",
    volume: 0.72,
  },
  placeTileDrop: {
    name: "地點方塊放下",
    src: "/sounds/game-sfx/place-tile-drop.ogg",
    volume: 0.43,
  },
  placeTilePickUp: {
    name: "地點方塊拿起",
    src: "/sounds/game-sfx/place-tile-pick-up.ogg",
    volume: 0.36,
  },
  placeTileRemove: {
    name: "地點方塊移除",
    src: "/sounds/game-sfx/place-tile-remove.ogg",
    volume: 0.32,
  },
  routeDepart: {
    name: "路線出發",
    src: "/sounds/game-sfx/route-depart.ogg",
    volume: 0.28,
  },
  streetStrongWind: {
    name: "街道強風",
    src: "/sounds/find/dragon-studio-gust-of-wind-511325.mp3",
    volume: 0.2,
  },
  flyerCatchSuccess: {
    name: "傳單撿取成功",
    src: "/sounds/Audio_interface/error_004.ogg",
    volume: 0.28,
  },
  flyerMiss: {
    name: "傳單漏接",
    src: "/sounds/lolurio%20Free%20Cozy%20Game%20UI%20SFX%20Pack/OGG/UI%20SFX_FEEDBACK_Woom.ogg",
    volume: 0.65,
  },
  flyerRoundSuccess: {
    name: "傳單任務達標",
    src: "/sounds/Audio_interface/confirmation_001.ogg",
    volume: 0.15,
  },
  flyerRoundFail: {
    name: "傳單任務未達標",
    src: "/sounds/game-sfx/photo-result-negative.ogg",
    volume: 0.56,
  },
  flyerHandOff: {
    name: "傳單交還",
    src: "/sounds/Audio_rpg/bookPlace2.ogg",
    volume: 0.26,
  },
  convenienceEntranceChime: {
    name: "便利商店進門旋律鈴",
    src: "/sounds/find/mixkit-cartoon-door-melodic-bell-110.wav",
    volume: 0.2,
  },
  metroAnnouncement1: {
    name: "捷運提示音 1",
    src: "/sounds/Convenience Store Pack/SFX/Announcement 1.wav",
    volume: 0.3,
  },
  metroAnnouncement1End: {
    name: "捷運提示音 1・結尾",
    src: "/sounds/Convenience Store Pack/SFX/Announcement 1 End.wav",
    volume: 0.34,
  },
  metroAnnouncement2: {
    name: "捷運提示音 2",
    src: "/sounds/Convenience Store Pack/SFX/Announcement 2.wav",
    volume: 0.22,
  },
  frogJump: {
    name: "青蛙跳出",
    src: "/sounds/game-sfx/zapsplat_cartoon_frog_jump_26526.webm",
    volume: 0.2,
  },
  creatorStudioStart: {
    name: "創作者工作室・開始",
    src: "/sounds/Audio_interface/select_003.ogg",
    volume: 0.24,
  },
  creatorStudioWorkTap: {
    name: "創作者工作室・WORK 按鍵",
    src: "/sounds/find/dragon-studio-single-key-press-393908.mp3",
    volume: 0.6,
  },
  creatorStudioEnergyFull: {
    name: "創作者工作室・體力充滿",
    src: "/sounds/Audio_interface/maximize_006.ogg",
    volume: 0.19,
  },
  creatorStudioMaterialReady: {
    name: "創作者工作室・素材生成",
    src: "/sounds/Audio_interface/confirmation_003.ogg",
    volume: 0.22,
  },
  creatorStudioMaterialRare: {
    name: "創作者工作室・稀有素材",
    src: "/sounds/frog_sfx/reward_magic/zapsplat_multimedia_game_sound_synth_bright_pluck_digital_award_achievement_001_40711.webm",
    volume: 0.38,
  },
  creatorStudioMaterialFly: {
    name: "創作者工作室・素材飛行",
    src: "/sounds/frog_sfx/movement/zapsplat_cartoon_ascend_climb_med_mallet_003_45227.webm",
    volume: 0.16,
  },
  creatorStudioMaterialFiled: {
    name: "創作者工作室・素材收入資料夾",
    src: "/sounds/Audio_interface/drop_001.ogg",
    volume: 0.43,
  },
  creatorStudioPostSend: {
    name: "創作者工作室・發佈貼文",
    src: "/sounds/Audio_interface/confirmation_001.ogg",
    volume: 0.15,
  },
  creatorStudioPopularityGain: {
    name: "創作者工作室・人氣入帳",
    src: "/sounds/frog_sfx/reward_magic/zapsplat_multimedia_game_sound_synth_bright_pluck_digital_award_achievement_001_40711.webm",
    volume: 0.38,
  },
  creatorStudioSkillOpen: {
    name: "創作者工作室・開啟技能樹",
    src: "/sounds/Audio_interface/open_003.ogg",
    volume: 0.2,
  },
  creatorStudioSkillUpgrade: {
    name: "創作者工作室・技能升級",
    src: "/sounds/Audio_interface/maximize_006.ogg",
    volume: 0.19,
  },
  creatorStudioSupportArrive: {
    name: "創作者工作室・應援品出現",
    src: "/sounds/Audio_interface/pluck_002.ogg",
    volume: 0.35,
  },
  creatorStudioSupportClaim: {
    name: "創作者工作室・取得應援品",
    src: "/sounds/Audio_interface/confirmation_003.ogg",
    volume: 0.22,
  },
  creatorStudioCritical: {
    name: "創作者工作室・爆擊",
    src: "/sounds/Audio_interface/bong_001.ogg",
    volume: 0.26,
  },
  creatorStudioDenied: {
    name: "創作者工作室・操作未成立",
    src: "/sounds/Audio_interface/error_002.ogg",
    volume: 0.3,
  },
  creatorStudioKpiComplete: {
    name: "創作者工作室・本季達標",
    src: "/sounds/frog_sfx/reward_magic/zapsplat_multimedia_game_sound_synth_bright_pluck_digital_award_achievement_008_40718.webm",
    volume: 0.58,
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
  if (typeof window === "undefined" || getGameAudioStateSnapshot().sfx.muted) return;

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

if (typeof window !== "undefined") {
  window.addEventListener(GAME_SFX_MUTED_CHANGE_EVENT, (event) => {
    const muted = (event as CustomEvent<{ muted?: boolean }>).detail?.muted;
    if (!muted) return;
    activeSounds.forEach((audio) => {
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        // Some browsers reject seeking before audio metadata is available.
      }
    });
    activeSounds.clear();
  });
}
