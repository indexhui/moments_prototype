"use client";

import {
  getGameAudioStateSnapshot,
  recordGameSfxTrigger,
  updateGameMusicState,
  type GameMusicTrackId,
} from "@/lib/game/audioStateMachine";

export type { GameMusicTrackId } from "@/lib/game/audioStateMachine";

export type FmodBankEvent = {
  path: string;
  name: string;
  category: "環境" | "音樂" | "物件" | "介面";
  use?: string;
};

export const FMOD_BANK_EVENTS: FmodBankEvent[] = [
  {
    path: "event:/ambience/amb_office_main",
    name: "辦公室環境音",
    category: "環境",
    use: "上班／辦公室段落",
  },
  { path: "event:/music/music_OP_menu", name: "開場選單音樂", category: "音樂" },
  { path: "event:/music/music_piece_main", name: "主題段落音樂", category: "音樂", use: "平常遊戲背景音樂" },
  { path: "event:/object/obj_char_fall", name: "角色跌落", category: "物件", use: "角色跌倒演出" },
  { path: "event:/object/obj_clock_alarm", name: "鬧鐘", category: "物件", use: "起床鬧鐘場景" },
  { path: "event:/object/obj_dice_drop", name: "骰子落下", category: "物件" },
  { path: "event:/object/obj_paper_scattered", name: "紙張散落", category: "物件" },
  { path: "event:/object/obj_room_door_close", name: "房門關閉", category: "物件", use: "玄關過場關門" },
  { path: "event:/object/obj_room_door_knock", name: "敲房門", category: "物件" },
  { path: "event:/object/obj_room_door_open", name: "房門打開", category: "物件", use: "滑動開門／玄關過場" },
  { path: "event:/object/obj_take_photo", name: "拍照", category: "物件", use: "相機快門" },
  { path: "event:/object/obj_take_photo_done", name: "拍照完成", category: "物件", use: "確認保留照片" },
  { path: "event:/ui/ui_choice_confirm", name: "選項確認", category: "介面", use: "主要劇情選項" },
  { path: "event:/ui/ui_dialogue_click", name: "對話點擊", category: "介面", use: "共用對話繼續" },
  { path: "event:/ui/ui_map_road_on", name: "地圖路線亮起", category: "介面", use: "路線接通／出發" },
  { path: "event:/ui/ui_start_game", name: "開始遊戲", category: "介面", use: "開始遊戲按鈕" },
];

export const FMOD_GAME_EVENTS = {
  officeAmbience: "event:/ambience/amb_office_main",
  mainTheme: "event:/music/music_piece_main",
  characterFall: "event:/object/obj_char_fall",
  clockAlarm: "event:/object/obj_clock_alarm",
  paperScattered: "event:/object/obj_paper_scattered",
  roomDoorClose: "event:/object/obj_room_door_close",
  roomDoorKnock: "event:/object/obj_room_door_knock",
  roomDoorOpen: "event:/object/obj_room_door_open",
  takePhoto: "event:/object/obj_take_photo",
  takePhotoDone: "event:/object/obj_take_photo_done",
  choiceConfirm: "event:/ui/ui_choice_confirm",
  dialogueClick: "event:/ui/ui_dialogue_click",
  mapRoadOn: "event:/ui/ui_map_road_on",
  startGame: "event:/ui/ui_start_game",
} as const;

export type FmodGameEventId = keyof typeof FMOD_GAME_EVENTS;

const FMOD_GAME_EVENT_MAX_DURATION_MS: Partial<Record<FmodGameEventId, number>> = {
  takePhoto: 220,
};

type FmodDynamicObject = Record<string, any>;
type FmodFactory = (configuration: FmodDynamicObject) => unknown;

declare global {
  interface Window {
    FMODModule?: FmodFactory;
  }
}

const RUNTIME_SCRIPT_URL = "/sounds/fmod-runtime/fmodstudio.js";
const RUNTIME_DIRECTORY = "/sounds/fmod-runtime/";
const BANK_DIRECTORY = "/sounds/Mobile/";
const MUSIC_VOLUME_STORAGE_KEY = "moment:fmod-music-volume";
const MUSIC_MUTED_STORAGE_KEY = "moment:fmod-music-muted";
const PHOTO_SHUTTER_SOUND_URL = "/sounds/game-sfx/photo-shutter.mp3";
const EXHIBITION_FLASHBACK_MUSIC_URL = "/sounds/music/走走小日demo_05.mp3";
const DEFAULT_MUSIC_VOLUME = 0.65;
const MUSIC_OUTPUT_GAIN = 0.82;
const MUSIC_CROSSFADE_DURATION_MS = 900;
export const FMOD_MUSIC_VOLUME_CHANGE_EVENT = "moment:fmod-music-volume-change";
export const FMOD_MUSIC_MUTED_CHANGE_EVENT = "moment:fmod-music-muted-change";

let photoShutterAudio: HTMLAudioElement | null = null;

function getPhotoShutterAudio() {
  if (typeof window === "undefined") return null;
  if (!photoShutterAudio) {
    photoShutterAudio = new Audio(PHOTO_SHUTTER_SOUND_URL);
    photoShutterAudio.preload = "auto";
  }
  return photoShutterAudio;
}

/** Preloads the standalone shutter sound used by the shared photo capture UI. */
export function preparePhotoShutterSound() {
  const audio = getPhotoShutterAudio();
  audio?.load();
}

/** Plays the replacement shutter file independently from the legacy FMOD bank event. */
export function playPhotoShutterSound() {
  const audio = getPhotoShutterAudio();
  if (!audio) return false;

  try {
    audio.currentTime = 0;
    void audio.play().then(() => {
      recordGameSfxTrigger({
        id: "photoShutter",
        name: "相機快門",
        source: "音檔",
        path: PHOTO_SHUTTER_SOUND_URL,
      });
    }).catch((error) => {
      recordGameSfxTrigger({
        id: "photoShutter",
        name: "相機快門",
        source: "音檔",
        path: PHOTO_SHUTTER_SOUND_URL,
        result: "blocked",
      });
      console.warn("Photo shutter sound failed:", error);
    });
    return true;
  } catch (error) {
    recordGameSfxTrigger({
      id: "photoShutter",
      name: "相機快門",
      source: "音檔",
      path: PHOTO_SHUTTER_SOUND_URL,
      result: "blocked",
    });
    console.warn("Photo shutter sound failed:", error);
    return false;
  }
}

function clampVolume(volume: number) {
  return Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : DEFAULT_MUSIC_VOLUME));
}

function getMusicOutputVolume(volume: number, muted = false) {
  return muted ? 0 : clampVolume(volume) * MUSIC_OUTPUT_GAIN;
}

export function getFmodGameMusicVolume() {
  if (typeof window === "undefined") return DEFAULT_MUSIC_VOLUME;
  try {
    const stored = window.localStorage.getItem(MUSIC_VOLUME_STORAGE_KEY);
    if (stored === null) return DEFAULT_MUSIC_VOLUME;
    return clampVolume(Number.parseFloat(stored));
  } catch {
    return DEFAULT_MUSIC_VOLUME;
  }
}

export function getFmodGameMusicMuted() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUSIC_MUTED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function describeFmodError(fmod: FmodDynamicObject, result: number) {
  try {
    return fmod.ErrorString(result);
  } catch {
    return `FMOD result ${result}`;
  }
}

function checkResult(
  fmod: FmodDynamicObject,
  result: number,
  operation: string,
) {
  if (result === fmod.OK) return;
  throw new Error(`${operation}：${describeFmodError(fmod, result)}`);
}

function loadRuntimeScript() {
  if (window.FMODModule) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RUNTIME_SCRIPT_URL}"]`,
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("FMOD Web runtime 載入失敗。")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = RUNTIME_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("FMOD Web runtime 載入失敗。"));
    document.head.appendChild(script);
  });
}

export class FmodWebController {
  private currentInstance: FmodDynamicObject | null = null;
  private currentEventStopTimer: number | null = null;
  private ambienceInstance: FmodDynamicObject | null = null;
  private ambiencePath: string | null = null;
  private musicInstance: FmodDynamicObject | null = null;
  private musicPath: string | null = null;
  private musicVolume = getFmodGameMusicVolume();
  private musicMuted = getFmodGameMusicMuted();
  private musicTransitionGain = 1;
  private audioResumed = false;
  private readonly updateTimer: number;

  constructor(
    private readonly fmod: FmodDynamicObject,
    private readonly system: FmodDynamicObject,
    private readonly coreSystem: FmodDynamicObject,
  ) {
    this.updateTimer = window.setInterval(() => {
      const result = this.system.update();
      if (result !== this.fmod.OK) {
        console.warn("FMOD update failed:", describeFmodError(this.fmod, result));
      }
    }, 20);
  }

  private isBrowserAudioRunning() {
    const audioContext = this.fmod.mContext ?? this.fmod.context;
    return !audioContext || audioContext.state === "running";
  }

  private resumeAudio() {
    if (this.isBrowserAudioRunning()) {
      this.audioResumed = true;
      return true;
    }

    this.audioResumed = false;

    checkResult(this.fmod, this.coreSystem.mixerSuspend(), "暫停 FMOD mixer");
    checkResult(this.fmod, this.coreSystem.mixerResume(), "啟動 FMOD mixer");
    this.audioResumed = this.isBrowserAudioRunning();
    return this.audioResumed;
  }

  resumeAudioFromUserGesture() {
    return this.resumeAudio();
  }

  playEvent(path: string, maxDurationMs?: number) {
    this.resumeAudio();
    this.stopCurrentEvent();

    const description: FmodDynamicObject = {};
    checkResult(this.fmod, this.system.getEvent(path, description), `取得 ${path}`);

    const instance: FmodDynamicObject = {};
    checkResult(
      this.fmod,
      description.val.createInstance(instance),
      `建立 ${path}`,
    );
    checkResult(this.fmod, instance.val.start(), `播放 ${path}`);
    this.currentInstance = instance.val;
    if (maxDurationMs && maxDurationMs > 0) {
      const startedInstance = instance.val;
      this.currentEventStopTimer = window.setTimeout(() => {
        if (this.currentInstance !== startedInstance) return;
        this.stopCurrentEvent(true);
      }, maxDurationMs);
    }
  }

  playMusic(path: string) {
    this.resumeAudio();
    if (this.musicInstance && this.musicPath === path) return;
    this.stopMusic();

    const description: FmodDynamicObject = {};
    checkResult(this.fmod, this.system.getEvent(path, description), `取得 ${path}`);

    const instance: FmodDynamicObject = {};
    checkResult(
      this.fmod,
      description.val.createInstance(instance),
      `建立 ${path}`,
    );
    checkResult(
      this.fmod,
      instance.val.setVolume(
        getMusicOutputVolume(this.musicVolume, this.musicMuted) * this.musicTransitionGain,
      ),
      "設定背景音樂音量",
    );
    checkResult(this.fmod, instance.val.start(), `播放 ${path}`);
    this.musicInstance = instance.val;
    this.musicPath = path;
  }

  playAmbience(path: string) {
    this.resumeAudio();
    if (this.ambienceInstance && this.ambiencePath === path) return;
    this.stopAmbience();

    const description: FmodDynamicObject = {};
    checkResult(this.fmod, this.system.getEvent(path, description), `取得 ${path}`);

    const instance: FmodDynamicObject = {};
    checkResult(
      this.fmod,
      description.val.createInstance(instance),
      `建立 ${path}`,
    );
    checkResult(
      this.fmod,
      instance.val.setVolume(
        getMusicOutputVolume(this.musicVolume, this.musicMuted),
      ),
      "設定環境音音量",
    );
    checkResult(this.fmod, instance.val.start(), `播放 ${path}`);
    this.ambienceInstance = instance.val;
    this.ambiencePath = path;
  }

  stopCurrentEvent(immediate = false) {
    if (this.currentEventStopTimer !== null) {
      window.clearTimeout(this.currentEventStopTimer);
      this.currentEventStopTimer = null;
    }
    if (!this.currentInstance) return;

    const stopMode = immediate
      ? this.fmod.STUDIO_STOP_IMMEDIATE
      : this.fmod.STUDIO_STOP_ALLOWFADEOUT ?? this.fmod.STUDIO_STOP_IMMEDIATE;
    const stopResult = this.currentInstance.stop(stopMode);
    if (stopResult !== this.fmod.OK) {
      console.warn("FMOD stop failed:", describeFmodError(this.fmod, stopResult));
    }

    const releaseResult = this.currentInstance.release();
    if (releaseResult !== this.fmod.OK) {
      console.warn(
        "FMOD release failed:",
        describeFmodError(this.fmod, releaseResult),
      );
    }
    this.currentInstance = null;
  }

  stopMusic() {
    if (!this.musicInstance) return;

    const stopMode =
      this.fmod.STUDIO_STOP_ALLOWFADEOUT ?? this.fmod.STUDIO_STOP_IMMEDIATE;
    const stopResult = this.musicInstance.stop(stopMode);
    if (stopResult !== this.fmod.OK) {
      console.warn("FMOD music stop failed:", describeFmodError(this.fmod, stopResult));
    }

    const releaseResult = this.musicInstance.release();
    if (releaseResult !== this.fmod.OK) {
      console.warn(
        "FMOD music release failed:",
        describeFmodError(this.fmod, releaseResult),
      );
    }
    this.musicInstance = null;
    this.musicPath = null;
  }

  stopAmbience() {
    if (!this.ambienceInstance) return;

    const stopMode =
      this.fmod.STUDIO_STOP_ALLOWFADEOUT ?? this.fmod.STUDIO_STOP_IMMEDIATE;
    const stopResult = this.ambienceInstance.stop(stopMode);
    if (stopResult !== this.fmod.OK) {
      console.warn("FMOD ambience stop failed:", describeFmodError(this.fmod, stopResult));
    }

    const releaseResult = this.ambienceInstance.release();
    if (releaseResult !== this.fmod.OK) {
      console.warn(
        "FMOD ambience release failed:",
        describeFmodError(this.fmod, releaseResult),
      );
    }
    this.ambienceInstance = null;
    this.ambiencePath = null;
  }

  setMusicVolume(volume: number) {
    this.musicVolume = clampVolume(volume);
    if (this.musicInstance) {
      const result = this.musicInstance.setVolume(
        getMusicOutputVolume(this.musicVolume, this.musicMuted) * this.musicTransitionGain,
      );
      if (result !== this.fmod.OK) {
        console.warn(
          "FMOD music volume failed:",
          describeFmodError(this.fmod, result),
        );
      }
    }
    if (this.ambienceInstance) {
      const result = this.ambienceInstance.setVolume(
        getMusicOutputVolume(this.musicVolume, this.musicMuted),
      );
      if (result !== this.fmod.OK) {
        console.warn(
          "FMOD ambience volume failed:",
          describeFmodError(this.fmod, result),
        );
      }
    }
  }

  setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    if (this.musicInstance) {
      const result = this.musicInstance.setVolume(
        getMusicOutputVolume(this.musicVolume, this.musicMuted) * this.musicTransitionGain,
      );
      if (result !== this.fmod.OK) {
        console.warn(
          "FMOD music mute failed:",
          describeFmodError(this.fmod, result),
        );
      }
    }
    if (this.ambienceInstance) {
      const result = this.ambienceInstance.setVolume(
        getMusicOutputVolume(this.musicVolume, this.musicMuted),
      );
      if (result !== this.fmod.OK) {
        console.warn(
          "FMOD ambience mute failed:",
          describeFmodError(this.fmod, result),
        );
      }
    }
  }

  setMusicTransitionGain(gain: number) {
    this.musicTransitionGain = Math.max(0, Math.min(1, gain));
    if (!this.musicInstance) return;
    const result = this.musicInstance.setVolume(
      getMusicOutputVolume(this.musicVolume, this.musicMuted) * this.musicTransitionGain,
    );
    if (result !== this.fmod.OK) {
      console.warn(
        "FMOD music transition gain failed:",
        describeFmodError(this.fmod, result),
      );
    }
  }

  dispose() {
    this.stopCurrentEvent();
    this.stopAmbience();
    this.stopMusic();
    window.clearInterval(this.updateTimer);
  }
}

let activeController: FmodWebController | null = null;
let initialization: Promise<FmodWebController> | null = null;
let isGameMusicRequested = false;
let isOfficeAmbienceRequested = false;
let requestedGameMusicTrack: GameMusicTrackId = "mainTheme";
let standaloneMusicAudio: HTMLAudioElement | null = null;
let standaloneMusicTransitionGain = 0;
let fmodMusicTransitionGain = 1;
let musicTransitionFrame: number | null = null;
let musicTransitionVersion = 0;
let isStandaloneMusicRetryListening = false;

function getStandaloneMusicAudio() {
  if (typeof window === "undefined") return null;
  if (!standaloneMusicAudio) {
    standaloneMusicAudio = new Audio(EXHIBITION_FLASHBACK_MUSIC_URL);
    standaloneMusicAudio.preload = "auto";
    standaloneMusicAudio.loop = true;
    standaloneMusicAudio.volume = 0;
  }
  return standaloneMusicAudio;
}

function applyStandaloneMusicVolume() {
  if (!standaloneMusicAudio) return;
  standaloneMusicAudio.volume =
    getMusicOutputVolume(getFmodGameMusicVolume(), getFmodGameMusicMuted())
    * standaloneMusicTransitionGain;
}

function setStandaloneMusicTransitionGain(gain: number) {
  standaloneMusicTransitionGain = Math.max(0, Math.min(1, gain));
  applyStandaloneMusicVolume();
}

function setFmodMusicTransitionGain(gain: number) {
  fmodMusicTransitionGain = Math.max(0, Math.min(1, gain));
  activeController?.setMusicTransitionGain(fmodMusicTransitionGain);
}

function cancelMusicTransition() {
  musicTransitionVersion += 1;
  if (musicTransitionFrame !== null) {
    window.cancelAnimationFrame(musicTransitionFrame);
    musicTransitionFrame = null;
  }
}

function removeStandaloneMusicRetryListeners() {
  if (!isStandaloneMusicRetryListening) return;
  window.removeEventListener("pointerdown", retryStandaloneMusicFromUserGesture, true);
  window.removeEventListener("keydown", retryStandaloneMusicFromUserGesture, true);
  isStandaloneMusicRetryListening = false;
}

function retryStandaloneMusicFromUserGesture() {
  if (!isGameMusicRequested || requestedGameMusicTrack !== "exhibitionFlashback") {
    removeStandaloneMusicRetryListeners();
    return;
  }
  startRequestedGameMusic();
}

function listenForStandaloneMusicRetry() {
  if (isStandaloneMusicRetryListening) return;
  window.addEventListener("pointerdown", retryStandaloneMusicFromUserGesture, true);
  window.addEventListener("keydown", retryStandaloneMusicFromUserGesture, true);
  isStandaloneMusicRetryListening = true;
}

function transitionMusicGains(
  targetFmodGain: number,
  targetStandaloneGain: number,
  onComplete?: () => void,
) {
  cancelMusicTransition();
  const transitionVersion = musicTransitionVersion;
  const startFmodGain = fmodMusicTransitionGain;
  const startStandaloneGain = standaloneMusicTransitionGain;
  const startedAt = window.performance.now();

  const tick = (now: number) => {
    if (transitionVersion !== musicTransitionVersion) return;
    const progress = Math.min(1, (now - startedAt) / MUSIC_CROSSFADE_DURATION_MS);
    const easedProgress = progress * progress * (3 - 2 * progress);
    setFmodMusicTransitionGain(
      startFmodGain + (targetFmodGain - startFmodGain) * easedProgress,
    );
    setStandaloneMusicTransitionGain(
      startStandaloneGain
      + (targetStandaloneGain - startStandaloneGain) * easedProgress,
    );

    if (progress < 1) {
      musicTransitionFrame = window.requestAnimationFrame(tick);
      return;
    }
    musicTransitionFrame = null;
    onComplete?.();
  };

  musicTransitionFrame = window.requestAnimationFrame(tick);
}

function startRequestedGameMusic() {
  if (!isGameMusicRequested) return false;

  updateGameMusicState({
    requested: true,
    trackId: requestedGameMusicTrack,
    playback: "loading",
    muted: getFmodGameMusicMuted(),
    volume: getFmodGameMusicVolume(),
    error: null,
  });

  if (requestedGameMusicTrack === "exhibitionFlashback") {
    const audio = getStandaloneMusicAudio();
    if (!audio) return false;
    if (!audio.paused) {
      removeStandaloneMusicRetryListeners();
      updateGameMusicState({ playback: "playing" });
      return true;
    }
    if (audio.paused && standaloneMusicTransitionGain === 0) audio.currentTime = 0;

    void audio.play().then(() => {
      removeStandaloneMusicRetryListeners();
      if (!isGameMusicRequested || requestedGameMusicTrack !== "exhibitionFlashback") {
        audio.pause();
        return;
      }
      updateGameMusicState({ playback: "transitioning" });
      transitionMusicGains(0, 1, () => {
        if (requestedGameMusicTrack !== "exhibitionFlashback") return;
        activeController?.stopMusic();
        setFmodMusicTransitionGain(1);
        updateGameMusicState({ playback: "playing" });
      });
    }).catch((error) => {
      updateGameMusicState({
        playback: "blocked",
        error: error instanceof Error ? error.message : String(error),
      });
      console.warn("Exhibition flashback music could not start:", error);
      listenForStandaloneMusicRetry();
    });
    return false;
  }

  removeStandaloneMusicRetryListeners();

  if (!activeController) {
    void prepareFmodGameAudio();
    return false;
  }

  try {
    const hasStandaloneMusic = Boolean(standaloneMusicAudio && !standaloneMusicAudio.paused);
    setFmodMusicTransitionGain(hasStandaloneMusic ? 0 : 1);
    activeController.playMusic(FMOD_GAME_EVENTS.mainTheme);
    if (!hasStandaloneMusic) {
      updateGameMusicState({ playback: "playing" });
      return true;
    }

    updateGameMusicState({ playback: "transitioning" });
    transitionMusicGains(1, 0, () => {
      if (requestedGameMusicTrack !== "mainTheme" || !standaloneMusicAudio) return;
      standaloneMusicAudio.pause();
      standaloneMusicAudio.currentTime = 0;
      updateGameMusicState({ playback: "playing" });
    });
    return true;
  } catch (error) {
    updateGameMusicState({
      playback: "error",
      error: error instanceof Error ? error.message : String(error),
    });
    console.warn("FMOD main theme failed:", error);
    return false;
  }
}

function startRequestedOfficeAmbience() {
  if (!isOfficeAmbienceRequested) return false;
  if (!activeController) {
    void prepareFmodGameAudio();
    return false;
  }

  try {
    activeController.playAmbience(FMOD_GAME_EVENTS.officeAmbience);
    return true;
  } catch (error) {
    console.warn("FMOD office ambience failed:", error);
    return false;
  }
}

function initializeSystem(fmod: FmodDynamicObject) {
  const output: FmodDynamicObject = {};
  checkResult(fmod, fmod.Studio_System_Create(output), "建立 FMOD Studio System");
  const system = output.val;

  checkResult(fmod, system.getCoreSystem(output), "取得 FMOD Core System");
  const coreSystem = output.val;
  checkResult(fmod, coreSystem.setDSPBufferSize(2048, 2), "設定 DSP buffer");

  const sampleRate: FmodDynamicObject = {};
  checkResult(
    fmod,
    coreSystem.getDriverInfo(0, null, null, sampleRate, null, null),
    "讀取音訊裝置",
  );
  checkResult(
    fmod,
    coreSystem.setSoftwareFormat(sampleRate.val, fmod.SPEAKERMODE_DEFAULT, 0),
    "設定混音取樣率",
  );

  checkResult(
    fmod,
    system.initialize(1024, fmod.STUDIO_INIT_NORMAL, fmod.INIT_NORMAL, null),
    "初始化 FMOD",
  );

  for (const bankName of ["Master.bank", "Master.strings.bank"]) {
    const bank: FmodDynamicObject = {};
    checkResult(
      fmod,
      system.loadBankFile(`/${bankName}`, fmod.STUDIO_LOAD_BANK_NORMAL, bank),
      `載入 ${bankName}`,
    );
  }

  return new FmodWebController(fmod, system, coreSystem);
}

async function createController() {
  await loadRuntimeScript();

  if (!window.FMODModule) {
    throw new Error("FMOD Web runtime 沒有提供 FMODModule。");
  }

  return new Promise<FmodWebController>((resolve, reject) => {
    let settled = false;
    const fail = (reason: unknown) => {
      if (settled) return;
      settled = true;
      reject(reason instanceof Error ? reason : new Error(String(reason)));
    };

    const fmod: FmodDynamicObject = {
      INITIAL_MEMORY: 128 * 1024 * 1024,
      locateFile: (filename: string) => `${RUNTIME_DIRECTORY}${filename}`,
    };

    fmod.preRun = () => {
      for (const filename of ["Master.bank", "Master.strings.bank"]) {
        fmod.FS_createPreloadedFile(
          "/",
          filename,
          `${BANK_DIRECTORY}${filename}`,
          true,
          false,
        );
      }
    };
    fmod.onAbort = (reason: unknown) => fail(new Error(`FMOD 中止：${reason}`));
    fmod.onRuntimeInitialized = () => {
      if (settled) return;
      try {
        const controller = initializeSystem(fmod);
        activeController = controller;
        settled = true;
        resolve(controller);
        if (isGameMusicRequested) {
          startRequestedGameMusic();
        }
        if (isOfficeAmbienceRequested) {
          startRequestedOfficeAmbience();
        }
      } catch (error) {
        fail(error);
      }
    };

    try {
      const result = window.FMODModule!(fmod);
      if (result && typeof (result as Promise<unknown>).catch === "function") {
        void (result as Promise<unknown>).catch(fail);
      }
    } catch (error) {
      fail(error);
    }
  });
}

export function initializeFmodWeb() {
  if (!initialization) {
    initialization = createController().catch((error) => {
      initialization = null;
      throw error;
    });
  }
  return initialization;
}

export function stopFmodWebEvent() {
  activeController?.stopCurrentEvent();
}

/** Starts loading FMOD without surfacing errors in normal gameplay. */
export function prepareFmodGameAudio() {
  updateGameMusicState({
    muted: getFmodGameMusicMuted(),
    volume: getFmodGameMusicVolume(),
  });
  return initializeFmodWeb().catch((error) => {
    if (getGameAudioStateSnapshot().music.requested) {
      updateGameMusicState({
        playback: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
    console.warn("FMOD game audio could not be prepared:", error);
    return null;
  });
}

/**
 * Plays immediately when the Bank is ready. If it is still loading, callers
 * can use the return value to play a lightweight fallback sound instead.
 */
export function playFmodGameEvent(id: FmodGameEventId) {
  const path = FMOD_GAME_EVENTS[id];
  const name = FMOD_BANK_EVENTS.find((event) => event.path === path)?.name ?? id;
  if (!activeController) {
    recordGameSfxTrigger({
      id,
      name,
      source: "FMOD",
      path,
      result: "not-ready",
    });
    void prepareFmodGameAudio();
    return false;
  }

  try {
    activeController.playEvent(
      path,
      FMOD_GAME_EVENT_MAX_DURATION_MS[id],
    );
    recordGameSfxTrigger({ id, name, source: "FMOD", path });
    return true;
  } catch (error) {
    recordGameSfxTrigger({
      id,
      name,
      source: "FMOD",
      path,
      result: "blocked",
    });
    console.warn(`FMOD game event ${id} failed:`, error);
    return false;
  }
}

export function startFmodGameMusic() {
  isGameMusicRequested = true;
  updateGameMusicState({
    requested: true,
    trackId: requestedGameMusicTrack,
    playback: "loading",
    muted: getFmodGameMusicMuted(),
    volume: getFmodGameMusicVolume(),
    error: null,
  });
  return startRequestedGameMusic();
}

export function stopFmodGameMusic() {
  isGameMusicRequested = false;
  requestedGameMusicTrack = "mainTheme";
  cancelMusicTransition();
  removeStandaloneMusicRetryListeners();
  activeController?.stopMusic();
  standaloneMusicAudio?.pause();
  if (standaloneMusicAudio) standaloneMusicAudio.currentTime = 0;
  setStandaloneMusicTransitionGain(0);
  setFmodMusicTransitionGain(1);
  updateGameMusicState({
    requested: false,
    trackId: "mainTheme",
    playback: "stopped",
    error: null,
  });
}

/** Keeps the looping office ambience separate from music and one-shot SFX. */
export function setFmodOfficeAmbienceActive(active: boolean) {
  isOfficeAmbienceRequested = active;
  if (!active) {
    activeController?.stopAmbience();
    return true;
  }
  return startRequestedOfficeAmbience();
}

export function setFmodGameMusicTrack(track: GameMusicTrackId) {
  requestedGameMusicTrack = track;
  updateGameMusicState({
    trackId: track,
    playback: isGameMusicRequested
      ? getGameAudioStateSnapshot().music.trackId === track
        ? getGameAudioStateSnapshot().music.playback
        : "transitioning"
      : "stopped",
    error: null,
  });
  if (track === "exhibitionFlashback") {
    prepareFmodGameMusicTrack(track);
  }
  if (!isGameMusicRequested) return false;
  return startRequestedGameMusic();
}

export function prepareFmodGameMusicTrack(track: GameMusicTrackId) {
  if (track !== "exhibitionFlashback") return;
  const audio = getStandaloneMusicAudio();
  if (audio?.networkState === HTMLMediaElement.NETWORK_EMPTY) audio.load();
}

/** Retries the browser audio unlock during a real pointer or keyboard gesture. */
export function resumeFmodGameAudio() {
  if (!activeController) {
    void prepareFmodGameAudio();
    return false;
  }

  try {
    const resumed = activeController.resumeAudioFromUserGesture();
    if (resumed && isOfficeAmbienceRequested) {
      startRequestedOfficeAmbience();
    }
    return resumed;
  } catch (error) {
    console.warn("FMOD browser audio resume failed:", error);
    return false;
  }
}

export function setFmodGameMusicVolume(volume: number) {
  const nextVolume = clampVolume(volume);
  try {
    window.localStorage.setItem(MUSIC_VOLUME_STORAGE_KEY, String(nextVolume));
  } catch {}
  activeController?.setMusicVolume(nextVolume);
  applyStandaloneMusicVolume();
  window.dispatchEvent(
    new CustomEvent(FMOD_MUSIC_VOLUME_CHANGE_EVENT, {
      detail: { volume: nextVolume },
    }),
  );
  updateGameMusicState({ volume: nextVolume });
  return nextVolume;
}

export function setFmodGameMusicMuted(muted: boolean) {
  try {
    window.localStorage.setItem(MUSIC_MUTED_STORAGE_KEY, String(muted));
  } catch {}
  activeController?.setMusicMuted(muted);
  applyStandaloneMusicVolume();
  window.dispatchEvent(
    new CustomEvent(FMOD_MUSIC_MUTED_CHANGE_EVENT, {
      detail: { muted },
    }),
  );
  updateGameMusicState({ muted });
  return muted;
}
