"use client";

import {
  Fragment,
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IoArrowBack,
  IoClose,
  IoGridOutline,
} from "react-icons/io5";
import { FaMusic } from "react-icons/fa";
import {
  FaCoins,
  FaDroplet,
  FaMoon,
} from "react-icons/fa6";
import { ROUTES } from "@/lib/routes";
import {
  BAI_ROOM_GLOW_1_BACKGROUND_IMAGE,
  BAI_ROOM_GLOW_1_BACKGROUND_LAYERS,
  FIRST_FROG_RETURN_HOME_DOOR_SCENE_ID,
  FIRST_FROG_RETURN_HOME_SCENE_ID,
  FIRST_SCENE_ID,
  GAME_SCENES,
  getChapterScenesUntilScene,
  type GameScene,
  type StoryChoice,
  type StoryComicImageId,
  type StoryComicOverlay,
} from "@/lib/game/scenes";
import { preloadGameImage } from "@/lib/game/preloadAssets";
import {
  STORY_DIALOG_SCREEN_CONTINUE_TRIGGER,
  StoryDialogPanel,
} from "@/components/game/StoryDialogPanel";
import { DiaryOverlay, type DiaryOverlayMode } from "@/components/game/DiaryOverlay";
import { DialogQuickActions } from "@/components/game/events/DialogQuickActions";
import { EventHistoryOverlay } from "@/components/game/events/EventHistoryOverlay";
import { EventBackgroundFxLayer } from "@/components/game/events/EventBackgroundFxLayer";
import { useBackgroundShake } from "@/components/game/events/useBackgroundShake";
import { WorkMinigameTestModal } from "@/components/game/events/WorkMinigameTestModal";
import { CabinetBoxStackMinigameModal } from "@/components/game/events/CabinetBoxStackMinigameModal";
import { DocumentColorSortMinigameModal } from "@/components/game/events/DocumentColorSortMinigameModal";
import { ShreddedDocumentMinigameModal } from "@/components/game/events/ShreddedDocumentMinigameModal";
import { WorkStampMinigameModal } from "@/components/game/events/WorkStampMinigameModal";
import { WorkPdfExportMinigameModal } from "@/components/game/events/WorkPdfExportMinigameModal";
import { OfficeChickenFocusMinigameModal } from "@/components/game/events/OfficeChickenFocusMinigameModal";
import { ParkOstrichTickleMinigameModal } from "@/components/game/events/ParkOstrichTickleMinigameModal";
import { WorkTransitionModal } from "@/components/game/events/WorkTransitionModal";
import { ReturnHomeTransitionOverlay } from "@/components/game/events/ReturnHomeTransitionOverlay";
import { DepartureTransitionOverlay } from "@/components/game/events/DepartureTransitionOverlay";
import { OfficeSunbeastKoalaEventModal } from "@/components/game/events/OfficeSunbeastKoalaEventModal";
import {
  EventDialogPanel,
  EVENT_DIALOG_HEIGHT,
} from "@/components/game/events/EventDialogPanel";
import {
  EventPhotoCaptureLayer,
  type NaturalImageSize,
  type PhotoCaptureResult,
} from "@/components/game/events/EventPhotoCaptureLayer";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import { SceneLocationDiscoveryBanner } from "@/components/game/SceneLocationDiscoveryBanner";
import { ChapterCompletionLobbyGuide } from "@/components/game/ChapterCompletionLobbyGuide";
import { ArrangeRouteMapOverlay } from "@/components/game/ArrangeRouteMapOverlay";
import {
  UnlockFeedbackOverlay,
  type UnlockFeedbackItem,
} from "@/components/game/UnlockFeedbackOverlay";
import { type PlayerStatus } from "@/lib/game/playerStatus";
import {
  GAME_AVATAR_EXPRESSION_TRIGGER,
  GAME_AVATAR_MOTION_TRIGGER,
} from "@/lib/game/avatarCheatBus";
import { GAME_BACKGROUND_SHAKE_TRIGGER } from "@/lib/game/backgroundShakeBus";
import {
  GAME_SCENE_TRANSITION_TRIGGER,
  type SceneTransitionPayload,
} from "@/lib/game/sceneTransitionBus";
import {
  claimOffworkRewardBatch,
  clearFrogDiaryFragmentHubGuide,
  clearFrogDiarySleepGuide,
  clearFrogReturnHomeDiaryGuide,
  FIRST_OFFWORK_REWARD_PATTERNS,
  FIRST_STREET_REWARD_PATTERNS,
  ensureDailyAdventureMainStoryReturnRouteProgress,
  getPlaceUnlockSnapshot,
  loadPlayerProgress,
  markFirstFrogReturnHomeSceneSeen,
  markGameLobbyGuideSeen,
  markFirstHomeHubFeatureGuideSeen,
  markDiaryFirstRevealSeen,
  prepareChapterCompletionGuideFromSceneJump,
  queueFrogDiaryFragmentHubGuide,
  queueFrogDiarySleepGuide,
  rolloverDailyEventFlags,
  savePlayerProgress,
  saveWorkTaskProgress,
  setEncounteredCharacter,
  skipOffworkRewardCycle,
  markOfficeSunbeastKoalaEventTriggered,
  unlockDiaryEntry,
  recordPhotoCapture,
  recordSunbeastPhotoCapture,
  recordDependentCoworkerRequestCompleted,
  recordWorkShiftResult,
  shouldTriggerOfficeSunbeastKoalaEvent,
  syncDerivedPlaceUnlocks,
  type PlaceTileId,
  type RewardPlaceTile,
  type TilePattern3x3,
} from "@/lib/game/playerProgress";
import { SUNBEAST_RETAKE_CAPTURE_PROPS } from "@/lib/game/sunbeastRegistry";
import {
  getWorkMinigameKindForSceneId,
  isWorkTransitionSceneId,
  DEFAULT_WORK_TRANSITION_FATIGUE_INCREASE_TOTAL,
  ENABLE_DEPENDENT_COWORKER_REQUEST_WORK_FLOW,
  type WorkMinigameKind,
} from "@/lib/game/workTransition";
import {
  GAME_WORK_MINIGAME_CHEAT_TRIGGER,
  WORK_MINIGAME_CHEAT_KIND_STORAGE_KEY,
  type WorkMinigameCheatPayload,
} from "@/lib/game/workMinigameCheatBus";
import {
  GAME_DIALOG_TYPING_MODE_CHANGE,
  loadDialogTypingMode,
  saveDialogTypingMode,
  type DialogTypingMode,
} from "@/lib/game/dialogTyping";
import { AVATAR_MOTION_DURATION_MS } from "@/lib/game/avatarPerformance";
import { shouldUseNarrativePauseTyping } from "@/lib/game/narrativeMode";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import { dispatchSceneJumpContextChange } from "@/lib/game/sceneJumpContextBus";
import {
  getWorkLunchSceneJumpStep,
  WORK_LUNCH_SCENE_JUMP_OPTION_ID,
  WORK_LUNCH_SCENE_JUMP_STEPS,
} from "@/lib/game/workLunchSceneJump";

const GAME_COMIC_CHEAT_TRIGGER = "moment:comic-cheat-trigger";
const ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_SEEN_KEY = "moment:arrange-route-place-mission-tutorial-seen";
const LEGACY_ROUTE_TUTORIAL_SCENE_ID = "__legacy-scene-41";
const LEGACY_QA_SCENE_ID = "__legacy-scene-44";
const LEGACY_NIGHT_HUB_SCENE_ID = "scene-night-hub";
const NAOTARO_STICKER_IDS = new Set(["naotaro-basic", "naotaro-smile", "naotaro-rare"]);
const FIRST_STREET_REWARD_LABELS = ["巷口街道", "騎樓街道", "轉角街道"] as const;
const METRO_TO_COMPANY_TRANSITION_POINTS = [
  {
    key: "home",
    visual: { label: "家", iconPath: "/images/icon/house.png" },
    positionPercent: 9,
  },
  {
    key: "metro-station",
    visual: { label: "捷運", iconPath: "/images/icon/mrt.png" },
    positionPercent: 50,
  },
  {
    key: "company",
    visual: { label: "公司", iconPath: "/images/icon/company.png" },
    positionPercent: 91,
  },
] as const;
const DOOR_SWIPE_THRESHOLD_PX = 74;
const DOOR_SWIPE_MAX_DISTANCE_PX = 128;
const ENABLE_LOCATION_DISCOVERY_BANNER = false;
const ENABLE_NIGHT_HUB_GUIDANCE_SYSTEM = false;

function hasFirstStreetRewardPatterns(rewardTiles: RewardPlaceTile[]) {
  const existingPatternKeys = new Set(
    rewardTiles
      .filter((tile) => tile.category === "place" && tile.sourceId === "street")
      .map((tile) => tilePatternKey(tile.pattern)),
  );
  return FIRST_STREET_REWARD_PATTERNS.every((pattern) =>
    existingPatternKeys.has(tilePatternKey(pattern)),
  );
}

function hasCollectedFirstSunbeast(progress: ReturnType<typeof loadPlayerProgress>) {
  return (
    progress.hasSeenSunbeastFirstReveal ||
    progress.lastDogPhotoCapture !== null ||
    progress.stickerCollection.some((stickerId) => NAOTARO_STICKER_IDS.has(stickerId))
  );
}

function shouldShowFirstSunbeastNightHubGuide(progress: ReturnType<typeof loadPlayerProgress>) {
  return (
    ENABLE_NIGHT_HUB_GUIDANCE_SYSTEM &&
    hasCollectedFirstSunbeast(progress) &&
    (progress.hasPendingFirstSunbeastNightHubGuide ||
      !progress.hasSeenFirstSunbeastNightHubGuideV3)
  );
}

function shouldShowFirstHomeHubFeatureGuide(progress: ReturnType<typeof loadPlayerProgress>) {
  return (
    !progress.hasSeenFirstHomeHubFeatureGuide &&
    progress.unlockedDiaryEntryIds.includes("bai-entry-1") &&
    (hasCollectedFirstSunbeast(progress) || progress.hasPendingFirstSunbeastNightHubGuide)
  );
}

function shouldShowFrogDiaryFragmentHubGuide(progress: ReturnType<typeof loadPlayerProgress>) {
  return (
    progress.hasPendingFrogDiaryFragmentHubGuide &&
    progress.unlockedDiaryEntryIds.includes("bai-entry-1") &&
    !progress.unlockedDiaryEntryIds.includes("bai-entry-2") &&
    !progress.hasCompletedStreetForgotLunchFrogEvent
  );
}

function shouldShowFrogDiarySleepGuide(progress: ReturnType<typeof loadPlayerProgress>) {
  return (
    progress.hasPendingFrogDiarySleepGuide &&
    progress.unlockedDiaryEntryIds.includes("bai-entry-1") &&
    !progress.hasCompletedStreetForgotLunchFrogEvent
  );
}

function shouldShowFrogReturnHomeDiaryGuide(progress: ReturnType<typeof loadPlayerProgress>) {
  return (
    progress.hasPendingFrogReturnHomeDiaryGuide &&
    progress.hasCompletedStreetForgotLunchFrogEvent &&
    progress.unlockedDiaryEntryIds.includes("bai-entry-2") &&
    progress.unlockedDiaryEntryIds.includes("bai-entry-5")
  );
}

function shouldShowFrogDessertShopOffworkClue(progress: ReturnType<typeof loadPlayerProgress>) {
  return (
    progress.unlockedDiaryEntryIds.includes("bai-entry-1") &&
    !progress.unlockedDiaryEntryIds.includes("bai-entry-2") &&
    !progress.hasCompletedStreetForgotLunchFrogEvent &&
    progress.streetForgotLunchFrogPhotoAttemptCount >= 2
  );
}

function shouldShowFirstFrogReturnHomeScene(progress: ReturnType<typeof loadPlayerProgress>) {
  return (
    hasCollectedFirstSunbeast(progress) &&
    progress.unlockedDiaryEntryIds.includes("bai-entry-1") &&
    progress.streetForgotLunchFrogPhotoAttemptCount === 1 &&
    !progress.hasCompletedStreetForgotLunchFrogEvent &&
    !progress.hasSeenFirstFrogReturnHomeScene
  );
}
const DIARY_CONVERSATION_SCENE_IDS = new Set([
  "scene-90",
  "scene-91",
  "scene-92",
  "scene-93",
  "scene-94",
  "scene-95",
  "scene-96",
]);
const METRO_DOG_TARGET_RECT_NORMALIZED = {
  x: 0.29,
  y: 0.51,
  width: 0.58,
  height: 0.2,
};
const BEIGO_IDENTITY_CHOICE_SCENE_ID = "scene-60b";
const BEIGO_OBSERVATION_SCENE_ID = "scene-60d";

type BeigoObservationOptionId = "sleepingBai" | "beigo" | "diary";
type RequiredBeigoObservationOptionId = Exclude<BeigoObservationOptionId, "diary">;

const BEIGO_OBSERVATION_REQUIRED_OPTION_IDS: RequiredBeigoObservationOptionId[] = [
  "sleepingBai",
  "beigo",
];

type BeigoObservationDialogueLine = {
  characterName: string;
  dialogue: string;
  showAvatarSprite: boolean;
  showCharacterName?: boolean;
  avatarSpriteId?: "mai" | "mai-beigo" | "bai" | "beigo" | "clock";
  avatarFrameIndex?: number;
};

const BEIGO_OBSERVATION_RESULT_BY_ID: Record<
  BeigoObservationOptionId,
  {
    label: string;
    characterName: string;
    dialogue: string;
    showAvatarSprite: boolean;
    showCharacterName?: boolean;
    avatarSpriteId?: "mai" | "mai-beigo" | "bai" | "beigo" | "clock";
    avatarFrameIndex?: number;
    dialogueSequence?: BeigoObservationDialogueLine[];
  }
> = {
  sleepingBai: {
    label: "沈睡的小白",
    characterName: "小麥",
    dialogue: "停在空中⋯⋯像是被按下暫停鍵。觸碰小白也沒有反應。",
    showAvatarSprite: true,
    avatarSpriteId: "mai",
    avatarFrameIndex: 36,
  },
  beigo: {
    label: "小貝狗",
    characterName: "小麥",
    dialogue: "是小白的自創角色。是很可愛，但為什麼會出現⋯⋯",
    showAvatarSprite: true,
    avatarSpriteId: "mai",
    avatarFrameIndex: 36,
  },
  diary: {
    label: "地上的日記",
    characterName: "小麥",
    dialogue: "我記得日記是寫滿的呀",
    showAvatarSprite: true,
    avatarSpriteId: "mai",
    avatarFrameIndex: 36,
    dialogueSequence: [
      {
        characterName: "小麥",
        dialogue: "我記得日記是寫滿的呀",
        showAvatarSprite: true,
        avatarSpriteId: "mai",
        avatarFrameIndex: 36,
      },
      {
        characterName: "小麥",
        dialogue: "怎麼只剩下一篇，還不完整",
        showAvatarSprite: true,
        avatarSpriteId: "mai",
        avatarFrameIndex: 36,
      },
      {
        characterName: "",
        dialogue: "小貝狗來回蹭著日記本，似乎想示意什麼。",
        showAvatarSprite: false,
        showCharacterName: false,
      },
      {
        characterName: "小麥",
        dialogue: "妳是要我打開日記看看嗎？",
        showAvatarSprite: true,
        avatarSpriteId: "mai",
        avatarFrameIndex: 35,
      },
      {
        characterName: "小貝狗",
        dialogue: "嗷",
        showAvatarSprite: true,
        avatarSpriteId: "beigo",
        avatarFrameIndex: 0,
      },
    ],
  },
};

function createInitialBeigoObservationCompleted() {
  return {
    sleepingBai: false,
    beigo: false,
    diary: false,
  } satisfies Record<BeigoObservationOptionId, boolean>;
}

function isBeigoObservationOptionId(value: string | null): value is BeigoObservationOptionId {
  return value === "sleepingBai" || value === "beigo" || value === "diary";
}

const COMIC_IMAGE_BY_ID = {
  freshen: "/images/comic/freshen.jpg",
  puppet: "/images/428出圖/漫畫格/第一章/掉在地上的人偶.png",
  book: "/images/428出圖/追加作畫/漫畫格/地上日記本1.png",
  bookGlow: "/images/428出圖/追加作畫/漫畫格/地上日記本2.png",
  diaryInBag: "/images/428出圖/漫畫格/第一章/袋子裡的日記本.png",
  throwBook: "/images/comic/throw_book.png",
  alarmRinging: "/images/428出圖/漫畫格/第一章/響了的鬧鐘.png",
  diaryThrownOnFloor: "/images/428出圖/漫畫格/第一章/隨手扔在地上的日記本.png",
  diarySmashedOnWall: "/images/428出圖/漫畫格/第一章/被摔到牆上的日記本.png",
  diaryDroppedOnGround: "/images/428出圖/漫畫格/第一章/掉落在地上的日記本.png",
  doorClose: "/images/428出圖/追加作畫/漫畫格/關門.png",
  mysteryCreatureFlash: "/images/428出圖/漫畫格/第一章/一閃而過的神秘生物.png",
  mysteryCreatureFlashBaiRoom: "/images/428出圖/漫畫格/第一章/一閃而過的神秘生物_小白房間.png",
  ch01Step2: "/images/428出圖/追加作畫/漫畫格/踩到.png",
  ch01Fall2: "/images/428出圖/追加作畫/漫畫格/跌倒.png",
  mrtDoorOpen02: "/images/428出圖/捷運跑進來/MRT_Door_Open_02 1.png",
  mrtDoorOpen03: "/images/428出圖/捷運跑進來/MRT_Door_Open_03 1.png",
  ch01DogRun: "/images/428出圖/捷運跑進來/CH01_SC04_Dog_Run 1.png",
  goldenRetrieverMetroDoor01:
    "/images/428出圖/追加作畫/黃金獵犬/漫畫格_捷運１.png",
  goldenRetrieverMetroDoor02:
    "/images/428出圖/追加作畫/黃金獵犬/漫畫格_捷運２.png",
  goldenRetrieverMetroDoor03:
    "/images/428出圖/追加作畫/黃金獵犬/漫畫格_捷運3.png",
  goldenRetrieverRunComic:
    "/images/428出圖/追加作畫/黃金獵犬/漫畫格_黃金獵犬.png",
  beigoJumpBed: "/images/comic/beigoJumpBed.jpg",
  beigoBag01: "/images/428出圖/漫畫格/第一章/蠕動的袋子.png",
  beigoBag02: "/images/428出圖/漫畫格/第一章/探頭的小貝狗１.png",
  beigoBag03: "/images/428出圖/漫畫格/第一章/探頭的小貝狗２.png",
  beigoRevealBook: "/images/428出圖/特別演出/CH01_SC03_SE03_Book.png",
  beigoRevealStandBook: "/images/428出圖/特別演出/CH01_SC02_SE03_Beigo_Stand_Book.png",
  beigoRevealComic01: "/images/428出圖/特別演出/Comic_Beigo_Reveal_01.png",
  beigoRevealComic02: "/images/428出圖/特別演出/Comic_Beigo_Reveal_02.png",
  beigoRevealComic03: "/images/428出圖/特別演出/Comic_Beigo_Reveal_03.png",
  beigoRevealComic04: "/images/428出圖/特別演出/Comic_Beigo_Reveal_04.png",
  comicCamera: "/images/428出圖/漫畫格/第一章/相機.png",
  transitBrakeFall: "/images/428出圖/日常事件漫畫格/捷運公車_煞車跌倒.png",
  diaryDemo: "/images/diary/diary_demo.jpg",
} satisfies Record<StoryComicImageId, string>;

const BEIGO_REVEAL_SPECIAL_IMAGES = {
  pageBehind: "/images/428出圖/特別演出/Beigo_Reveal_Page_Behind.png",
  page01: "/images/428出圖/特別演出/Beigo_Reveal_Page_01.png",
  page02: "/images/428出圖/特別演出/Beigo_Reveal_Page_02.png",
  page03: "/images/428出圖/特別演出/Beigo_Reveal_Page_03.png",
  stars: "/images/428出圖/特別演出/Beigo_Reveal_Star.png",
} as const;

const BEIGO_REVEAL_SPECIAL_IMAGE_URLS = Object.values(BEIGO_REVEAL_SPECIAL_IMAGES);

const OPENING_CLOUD_IMAGES = {
  cloud01: "/images/cloud/cloud_01.png",
  cloud02: "/images/cloud/cloud_02.png",
  cloud03: "/images/cloud/cloude_03.png",
  cloud04: "/images/cloud/cloude_04.png",
} as const;

const OPENING_CLOUD_BURST_DURATION_MS = 1880;

type OpeningCloudLayer = {
  id: string;
  src: string;
  left: string;
  top: string;
  width: string;
  height?: string;
  imageWidth?: string;
  imageHeight?: string;
  imageRotate?: string;
  zIndex: number;
  delayMs: number;
  startScale: number;
  endX: string;
  endY: string;
  endScale: number;
  startRotate: string;
  endRotate: string;
};

const OPENING_CLOUD_LAYERS: OpeningCloudLayer[] = [
  {
    id: "bottom-left",
    src: OPENING_CLOUD_IMAGES.cloud01,
    left: "-107px",
    top: "490px",
    width: "471px",
    height: "362px",
    zIndex: 4,
    delayMs: 70,
    startScale: 1,
    endX: "-260px",
    endY: "180px",
    endScale: 1.08,
    startRotate: "0deg",
    endRotate: "-9deg",
  },
  {
    id: "top-blanket",
    src: OPENING_CLOUD_IMAGES.cloud01,
    left: "-15px",
    top: "-24px",
    width: "401px",
    height: "308px",
    zIndex: 3,
    delayMs: 0,
    startScale: 1,
    endX: "-26px",
    endY: "-310px",
    endScale: 1.06,
    startRotate: "180deg",
    endRotate: "176deg",
  },
  {
    id: "bottom-right",
    src: OPENING_CLOUD_IMAGES.cloud03,
    left: "197px",
    top: "643px",
    width: "320px",
    height: "246px",
    zIndex: 6,
    delayMs: 120,
    startScale: 1,
    endX: "210px",
    endY: "210px",
    endScale: 1.08,
    startRotate: "0deg",
    endRotate: "9deg",
  },
  {
    id: "middle-slant",
    src: OPENING_CLOUD_IMAGES.cloud02,
    left: "42px",
    top: "364px",
    width: "579px",
    height: "395px",
    imageWidth: "277px",
    imageHeight: "529px",
    imageRotate: "76.26deg",
    zIndex: 7,
    delayMs: 40,
    startScale: 1,
    endX: "270px",
    endY: "74px",
    endScale: 1.06,
    startRotate: "0deg",
    endRotate: "5deg",
  },
  {
    id: "left-upper-wall",
    src: OPENING_CLOUD_IMAGES.cloud02,
    left: "-48px",
    top: "33px",
    width: "277px",
    height: "529px",
    zIndex: 5,
    delayMs: 30,
    startScale: 1,
    endX: "-230px",
    endY: "-104px",
    endScale: 1.05,
    startRotate: "0deg",
    endRotate: "-5deg",
  },
  {
    id: "right-upper-wall",
    src: OPENING_CLOUD_IMAGES.cloud04,
    left: "129px",
    top: "-24px",
    width: "307px",
    height: "586px",
    zIndex: 8,
    delayMs: 10,
    startScale: 1,
    endX: "230px",
    endY: "-168px",
    endScale: 1.06,
    startRotate: "0deg",
    endRotate: "5deg",
  },
  {
    id: "left-lower-wall",
    src: OPENING_CLOUD_IMAGES.cloud02,
    left: "-31px",
    top: "308px",
    width: "277px",
    height: "529px",
    zIndex: 6,
    delayMs: 90,
    startScale: 1,
    endX: "-250px",
    endY: "120px",
    endScale: 1.06,
    startRotate: "0deg",
    endRotate: "-4deg",
  },
];

const WORK_MINIGAME_COIN_REWARD = 10;
type WorkPostSuccessStep = "dialogue" | "dusk-transition" | "settlement" | null;
type CabinetAftermathStep = "scream" | "coworker" | "mai" | "puzzle" | "completed" | null;
const CABINET_SHREDDER_DIALOGUE = {
  scream: {
    speaker: "同事",
    dialogue: "呀啊啊啊——！",
    avatarSpriteId: "coworker" as const,
    avatarFrameIndex: 1,
  },
  coworker: {
    speaker: "同事",
    dialogue: "我以為是結案的文件，就放進碎紙機了……",
    avatarSpriteId: "coworker" as const,
    avatarFrameIndex: 1,
  },
  mai: {
    speaker: "小麥",
    dialogue: "啊！這不是我客戶要用到的！",
    avatarSpriteId: "mai" as const,
    avatarFrameIndex: 25,
  },
} as const;
type WorkLunchForgotBentoStep =
  | "noon"
  | "forgot"
  | "beigo-worry"
  | "depart"
  | "beigo-cheer"
  | null;
const FROG_DESSERT_SHOP_OFFWORK_BACKGROUND_IMAGE = "/images/428出圖/背景/公司附近街道_黃昏.jpg";
const FROG_DESSERT_SHOP_OFFWORK_DIALOG_LINES = [
  {
    speaker: "同事",
    text: "小麥，妳之前推薦的甜點店在哪裡？我想去買生日蛋糕給男朋友。",
    spriteId: "coworker" as const,
    frameIndex: 0,
  },
  {
    speaker: "小麥",
    text: "我記得就在這附近。走吧，我帶妳去。",
    spriteId: "mai" as const,
    frameIndex: 0,
  },
  {
    speaker: "同事",
    text: "咦？我們是不是已經繞過這條街了？",
    spriteId: "coworker" as const,
    frameIndex: 0,
  },
  {
    speaker: "小麥",
    text: "奇怪，我明明記得就在附近……再轉幾個彎找找看！",
    spriteId: "mai" as const,
    frameIndex: 14,
  },
] as const;

function shouldTriggerWorkLunchForgotBento(
  progress: ReturnType<typeof loadPlayerProgress>,
) {
  return (
    progress.unlockedDiaryEntryIds.includes("bai-entry-1") &&
    !progress.unlockedDiaryEntryIds.includes("bai-entry-2") &&
    progress.streetForgotLunchFrogPhotoAttemptCount === 0 &&
    !progress.hasCompletedStreetForgotLunchFrogEvent &&
    !progress.hasTriggeredWorkLunchForgotBentoEvent
  );
}

const WORK_MINIGAME_CONFIG: Record<
  WorkMinigameKind,
  {
    taskId: string;
    successProgress: number;
    skipProgress: number;
    skipFatigue: number;
    preludeVariant:
      | "sticky-prelude"
      | "stamp-prelude"
      | "pdf-prelude"
      | "chicken-prelude"
      | "ostrich-prelude";
    postSuccessLine: string;
  }
> = {
  "cabinet-box-stack": {
    taskId: "dependent-coworker-cabinet",
    successProgress: 100,
    skipProgress: 20,
    skipFatigue: DEFAULT_WORK_TRANSITION_FATIGUE_INCREASE_TOTAL + 8,
    preludeVariant: "sticky-prelude",
    postSuccessLine:
      "櫃子裡的箱子終於疊得整整齊齊。同事鬆了一口氣，小麥也覺得今天的工作被多塞了一小塊進來。",
  },
  "document-color-sort": {
    taskId: "dependent-coworker-mixed-meeting-files",
    successProgress: 100,
    skipProgress: 20,
    skipFatigue: DEFAULT_WORK_TRANSITION_FATIGUE_INCREASE_TOTAL + 8,
    preludeVariant: "sticky-prelude",
    postSuccessLine:
      "明早會議的文件都完成四向分類了。同事終於鬆了一口氣，小麥也更確定，這已經不是偶爾幫一次忙而已。",
  },
  "sticky-notes": {
    taskId: "workdesk-sticky-notes",
    successProgress: 100,
    skipProgress: 20,
    skipFatigue: DEFAULT_WORK_TRANSITION_FATIGUE_INCREASE_TOTAL + 8,
    preludeVariant: "sticky-prelude",
    postSuccessLine: "太好了，這個搞定後，處理後續的專案會比較順利，今天應該能準時下班了。",
  },
  "stamp-documents": {
    taskId: "workdesk-document-stamp",
    successProgress: 100,
    skipProgress: 25,
    skipFatigue: DEFAULT_WORK_TRANSITION_FATIGUE_INCREASE_TOTAL + 7,
    preludeVariant: "stamp-prelude",
    postSuccessLine: "呼，這批文件總算都跑完簽核了，剩下的收尾應該能順順做完。",
  },
  "export-pdf": {
    taskId: "workdesk-export-pdf",
    successProgress: 100,
    skipProgress: 25,
    skipFatigue: DEFAULT_WORK_TRANSITION_FATIGUE_INCREASE_TOTAL + 8,
    preludeVariant: "pdf-prelude",
    postSuccessLine: "PDF 順利匯出了，沒有壞檔也沒有重傳，今天可以安心收工了。",
  },
  "office-chicken": {
    taskId: "workdesk-office-chicken",
    successProgress: 100,
    skipProgress: 20,
    skipFatigue: DEFAULT_WORK_TRANSITION_FATIGUE_INCREASE_TOTAL + 7,
    preludeVariant: "chicken-prelude",
    postSuccessLine: "公雞沒有被吵醒，辦公室也安靜下來了，今天的收尾意外地順利。",
  },
  "park-ostrich": {
    taskId: "park-ostrich-tickle",
    successProgress: 100,
    skipProgress: 20,
    skipFatigue: DEFAULT_WORK_TRANSITION_FATIGUE_INCREASE_TOTAL + 7,
    preludeVariant: "ostrich-prelude",
    postSuccessLine: "鴕鳥終於抬頭讓你拍到了，公園裡的小插曲也順利收尾了。",
  },
};

type WorkMinigameConfig = (typeof WORK_MINIGAME_CONFIG)[WorkMinigameKind];

type DependentCoworkerRequestConfig = {
  requestNumber: 1 | 2 | 3;
  taskId: string;
  preludeDialogue: string;
  minigameTitle: string;
  successRewardLabel: string;
  successFootnote: string;
  postSuccessLine: string;
};

const DEPENDENT_COWORKER_REQUESTS: DependentCoworkerRequestConfig[] = [
  {
    requestNumber: 1,
    taskId: "dependent-coworker-cabinet",
    preludeDialogue:
      "同事跑來拜託小麥整理櫃子，說只要把東西擺整齊，後面找資料就會快很多。",
    minigameTitle: "整理櫃子",
    successRewardLabel: "櫃子整理完成",
    successFootnote: "箱子整齊收進櫃子，之後找資料方便多了",
    postSuccessLine:
      "櫃子終於看起來有順序了。同事鬆了一口氣，小麥也覺得今天的工作被多塞了一小塊進來。",
  },
  {
    requestNumber: 2,
    taskId: "dependent-coworker-shredded-document",
    preludeDialogue:
      "同事不小心把重要公文丟進碎紙機，只好拜託小麥一起把文件拼回來。",
    minigameTitle: "拼回公文",
    successRewardLabel: "公文暫時拼回",
    successFootnote: "六條碎紙重新拼成可讀的客戶文件",
    postSuccessLine:
      "文件勉強拼回可讀的樣子。同事一直道謝，小麥卻開始擔心，這樣的救援是不是會越來越常發生。",
  },
  {
    requestNumber: 3,
    taskId: "dependent-coworker-mixed-meeting-files",
    preludeDialogue:
      "同事把明早會議的重要文件全混在一起，四種封面底色又和文件上的顏色標示對不上，只好再次拜託小麥幫忙分類。",
    minigameTitle: "重要文件分類",
    successRewardLabel: "重要文件分類完成",
    successFootnote: "依文件底色完成四向分流，沒有被標示文字騙到",
    postSuccessLine:
      "明早會議的文件都完成四向分類了。同事終於鬆了一口氣，小麥也更確定，這已經不是偶爾幫一次忙而已。",
  },
];

function getDependentCoworkerRequestConfig(
  progress: ReturnType<typeof loadPlayerProgress>,
) {
  if (!progress.hasCompletedStreetForgotLunchFrogEvent) return null;
  if (progress.hasPendingFrogReturnHomeDiaryGuide) return null;
  if (!progress.unlockedDiaryEntryIds.includes("bai-entry-5")) {
    return null;
  }
  return DEPENDENT_COWORKER_REQUESTS[progress.dependentCoworkerRequestCount] ?? null;
}

function buildDependentCoworkerWorkConfig(
  request: DependentCoworkerRequestConfig,
): WorkMinigameConfig {
  return {
    taskId: request.taskId,
    successProgress: 100,
    skipProgress: 20,
    skipFatigue: DEFAULT_WORK_TRANSITION_FATIGUE_INCREASE_TOTAL + 8,
    preludeVariant: "sticky-prelude",
    postSuccessLine: request.postSuccessLine,
  };
}

function normalizeForcedWorkMinigameKind(kind: string | null | undefined): WorkMinigameKind | null {
  if (kind === "cabinet" || kind === "cabinet-box-stack") return "cabinet-box-stack";
  if (kind === "document-color-sort" || kind === "color-sort" || kind === "files") {
    return "document-color-sort";
  }
  if (kind === "sticky" || kind === "sticky-notes") return "sticky-notes";
  if (kind === "stamp" || kind === "stamp-documents") return "stamp-documents";
  if (kind === "pdf" || kind === "export-pdf" || kind === "pdf-export") return "export-pdf";
  if (kind === "chicken" || kind === "office-chicken") return "office-chicken";
  if (kind === "ostrich" || kind === "park-ostrich") return "park-ostrich";
  return null;
}

function getForcedWorkMinigameKindFromSearch(search: string): WorkMinigameKind | null {
  return normalizeForcedWorkMinigameKind(new URLSearchParams(search).get("workMinigame"));
}

function shouldDirectOpenWorkMinigameFromSearch(search: string): boolean {
  return new URLSearchParams(search).get("workMinigameDirect") === "1";
}

const settlementStripeDrift = keyframes`
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(72.75px, 42px, 0);
  }
`;

function WorkStripeBackground() {
  return (
    <Flex
      position="absolute"
      inset="-18%"
      pointerEvents="none"
      bgColor="#F6EDDC"
      bgImage="repeating-linear-gradient(120deg, #F6EDDC 0 42px, #F1DFC0 42px 84px)"
      animation={`${settlementStripeDrift} 3.6s linear infinite`}
      willChange="transform"
      style={{
        backfaceVisibility: "hidden",
        transform: "translate3d(0, 0, 0)",
      }}
    />
  );
}

function WorkSettlementOverlay({
  onShown,
  onFinish,
}: {
  onShown?: () => void;
  onFinish: () => void;
}) {
  useEffect(() => {
    onShown?.();
  }, [onShown]);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={73}
      align="center"
      justify="center"
      overflow="hidden"
      bgColor="#F6EDDC"
    >
      <WorkStripeBackground />
      <Flex position="relative" zIndex={1} direction="column" align="center" gap="22px" transform="translateY(-16px)">
        <Text color="#A37A54" fontSize="28px" fontWeight="700" lineHeight="1">
          今日
        </Text>
        <Text color="#A37A54" fontSize="28px" fontWeight="700" lineHeight="1.2">
          完成一件工作
        </Text>
        <Text color="#A37A54" fontSize="24px" fontWeight="700" lineHeight="1">
          疲勞值+10
        </Text>
        <Flex
          mt="18px"
          minW="148px"
          h="58px"
          px="36px"
          borderRadius="999px"
          bgColor="#9F7047"
          align="center"
          justify="center"
          cursor="pointer"
          onClick={onFinish}
        >
          <Text color="white" fontSize="20px" fontWeight="700" lineHeight="1">
            繼續
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

const WORK_LUNCH_FORGOT_BENTO_LINES: Record<
  Exclude<WorkLunchForgotBentoStep, null>,
  {
    speaker: string;
    text: string;
    avatarSpriteId?: "mai" | "beigo";
    avatarFrameIndex?: number;
    avatarMotionId?: "sway-horizontal" | "jump-once";
  }
> = {
  noon: {
    speaker: "旁白",
    text: "中午時間。",
  },
  forgot: {
    speaker: "小麥",
    text: "糟糕，早上急著出門，忘記帶便當了⋯⋯",
    avatarSpriteId: "mai",
    avatarFrameIndex: 34,
  },
  "beigo-worry": {
    speaker: "小貝狗",
    text: "嗷，怎麼辦？",
    avatarSpriteId: "beigo",
    avatarFrameIndex: 1,
    avatarMotionId: "sway-horizontal",
  },
  depart: {
    speaker: "小麥",
    text: "沒關係，那就去便利商店買午餐好了。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 18,
  },
  "beigo-cheer": {
    speaker: "小貝狗",
    text: "嗷！",
    avatarSpriteId: "beigo",
    avatarFrameIndex: 2,
    avatarMotionId: "jump-once",
  },
};

const WORK_LUNCH_OFFICE_BACKGROUND_IMAGE = "/images/428出圖/背景/公司_白天.jpg";

function WorkLunchForgotBentoOverlay({
  step,
  onContinue,
}: {
  step: Exclude<WorkLunchForgotBentoStep, null>;
  onContinue: () => void;
}) {
  const line = WORK_LUNCH_FORGOT_BENTO_LINES[step];
  const showAvatar = Boolean(line.avatarSpriteId);

  return (
    <Flex position="absolute" inset="0" zIndex={72} direction="column" bgColor="#EDE7DE">
      <img
        src={WORK_LUNCH_OFFICE_BACKGROUND_IMAGE}
        alt="午休時間的辦公室"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
      <Flex position="relative" zIndex={1} w="100%" h="100%" direction="column">
        <StoryDialogPanel
          key={step}
          characterName={line.speaker}
          dialogue={line.text}
          onContinue={onContinue}
          showAvatarSprite={showAvatar}
          avatarSpriteId={line.avatarSpriteId}
          avatarFrameIndex={line.avatarFrameIndex}
          avatarMotionId={line.avatarMotionId}
        />
      </Flex>
    </Flex>
  );
}

type WorkRewardGridCell = {
  id: string;
  label?: string;
  sublabel?: string;
  icon?: string;
  isCenter?: boolean;
  isHidden?: boolean;
};

const rewardCellPulse = keyframes`
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(247, 232, 171, 0.0);
  }
  50% {
    transform: scale(1.03);
    box-shadow: 0 0 0 6px rgba(247, 232, 171, 0.22);
  }
`;

function WorkRewardGridOverlay({
  onFinish,
}: {
  onFinish: () => void;
}) {
  const hiddenRewards = [
    { label: "小日幣", icon: "💰" },
    { label: "拼圖", icon: "🧩" },
    { label: "扭蛋卷", icon: "🎟️" },
    { label: "早餐券", icon: "🥪" },
    { label: "小屋", icon: "🏠" },
  ];
  const rewardCycleOrder = ["coin", "hidden-1", "hidden-2", "house", "breakfast", "gacha", "hidden-4", "hidden-3"];
  const rewardRollTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [hiddenSeed, setHiddenSeed] = useState(0);
  const [activeRewardId, setActiveRewardId] = useState<string>(rewardCycleOrder[0]);
  const [isRewardRolling, setIsRewardRolling] = useState(false);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [hasRewardRolled, setHasRewardRolled] = useState(false);

  const cells = useMemo<WorkRewardGridCell[]>(() => {
    const offset = hiddenRewards.length === 0 ? 0 : hiddenSeed % hiddenRewards.length;
    const pickHidden = (index: number) => hiddenRewards[(index + offset) % hiddenRewards.length];
    return [
      {
        id: "coin",
        icon: "💰",
      },
      {
        id: "hidden-1",
        icon: pickHidden(0).icon,
        label: pickHidden(0).label,
        isHidden: true,
      },
      {
        id: "hidden-2",
        icon: pickHidden(1).icon,
        label: pickHidden(1).label,
        isHidden: true,
      },
      {
        id: "hidden-3",
        icon: pickHidden(2).icon,
        label: pickHidden(2).label,
        isHidden: true,
      },
      {
        id: "center",
        isCenter: true,
      },
      {
        id: "house",
        icon: "🏠",
      },
      {
        id: "hidden-4",
        icon: pickHidden(3).icon,
        label: pickHidden(3).label,
        isHidden: true,
      },
      {
        id: "gacha",
        label: "扭蛋卷",
      },
      {
        id: "breakfast",
        label: "早餐券",
      },
    ];
  }, [hiddenSeed]);

  const selectedRewardLabel = useMemo(() => {
    const selected = cells.find((cell) => cell.id === selectedRewardId);
    if (!selected) return "";
    return selected.label ?? "小日幣";
  }, [cells, selectedRewardId]);

  const clearRewardRollTimers = () => {
    rewardRollTimersRef.current.forEach((timer) => clearTimeout(timer));
    rewardRollTimersRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearRewardRollTimers();
    };
  }, []);

  const startRewardRoll = () => {
    if (isRewardRolling) return;
    clearRewardRollTimers();
    const nextSeed = hiddenSeed + 1;
    const nextOffset = hiddenRewards.length === 0 ? 0 : nextSeed % hiddenRewards.length;
    const startIndex = Math.max(0, rewardCycleOrder.indexOf(activeRewardId));
    const targetIndex = Math.floor(Math.random() * rewardCycleOrder.length);
    const lapCount = 2 + Math.floor(Math.random() * 2);
    const stepsToTarget =
      lapCount * rewardCycleOrder.length + ((targetIndex - startIndex + rewardCycleOrder.length) % rewardCycleOrder.length);
    let elapsed = 0;

    setHiddenSeed(nextSeed);
    setIsRewardRolling(true);
    setSelectedRewardId(null);
    setHasRewardRolled(true);

    for (let step = 1; step <= stepsToTarget; step += 1) {
      const delay =
        step <= stepsToTarget - 6
          ? 68
          : 68 + (step - (stepsToTarget - 6)) * 30;
      elapsed += delay;
      const cycleIndex = (startIndex + step) % rewardCycleOrder.length;
      const rewardId = rewardCycleOrder[cycleIndex];
      rewardRollTimersRef.current.push(
        setTimeout(() => {
          setActiveRewardId(rewardId);
          if (step === stepsToTarget) {
            setIsRewardRolling(false);
            setSelectedRewardId(rewardId);
          }
        }, elapsed),
      );
    }
  };

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={74}
      align="center"
      justify="center"
      overflow="hidden"
      bgColor="#F6EDDC"
      px="20px"
      py="40px"
    >
      <WorkStripeBackground />
      <Flex
        position="relative"
        zIndex={1}
        w="100%"
        h="100%"
        direction="column"
        align="center"
        justify="center"
        gap="24px"
      >
        <Text color="#A37A54" fontSize="34px" fontWeight="700" lineHeight="1">
          下班獎勵
        </Text>
        <Grid
          w="100%"
          maxW="300px"
          templateColumns="repeat(3, minmax(0, 1fr))"
          border="4px solid #9E734C"
          borderRadius="8px"
          overflow="hidden"
          bgColor="#9E734C"
          gap="4px"
        >
          {cells.map((cell) => (
            <Flex
              key={cell.id}
              minH="96px"
              bgColor={
                cell.isCenter
                  ? "#9E734C"
                  : activeRewardId === cell.id
                    ? "#F5E6A9"
                    : "#E8CDB4"
              }
              align="center"
              justify="center"
              direction="column"
              gap="8px"
              px="8px"
              py="10px"
              transition="background-color 120ms ease, transform 120ms ease"
              animation={activeRewardId === cell.id ? `${rewardCellPulse} 360ms ease infinite` : undefined}
            >
              {cell.isCenter ? (
                <img
                  src="/images/bai/bai_fly.png"
                  alt="下班獎勵吉祥物"
                  style={{
                    width: "58px",
                    height: "58px",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              ) : cell.isHidden ? (
                <Text color={activeRewardId === cell.id ? "#7B5638" : "white"} fontSize="34px" lineHeight="1">
                  🧩
                </Text>
              ) : cell.icon ? (
                <Text color={activeRewardId === cell.id ? "#7B5638" : "white"} fontSize="34px" lineHeight="1">
                  {cell.icon}
                </Text>
              ) : null}
              {cell.label ? (
                <Text
                  color={
                    activeRewardId === cell.id
                      ? "#7B5638"
                      : cell.isHidden
                        ? "rgba(255,255,255,0.92)"
                        : "#18120D"
                  }
                  fontSize={cell.label.length >= 4 ? "16px" : "18px"}
                  fontWeight="700"
                  lineHeight="1.1"
                  textAlign="center"
                >
                  {cell.label}
                </Text>
              ) : null}
              {cell.sublabel ? (
                <Text color="#2B2118" fontSize="12px" lineHeight="1" textAlign="center">
                  {cell.sublabel}
                </Text>
              ) : null}
            </Flex>
          ))}
        </Grid>
        <Flex minH="28px" align="center" justify="center" mt="-4px">
          <Text color="#8F6A46" fontSize="18px" fontWeight="700" lineHeight="1" textAlign="center">
            {isRewardRolling
              ? "抽獎中..."
              : selectedRewardLabel
                ? `抽中 ${selectedRewardLabel}`
                : "按下抽獎開始抽取下班獎勵"}
          </Text>
        </Flex>
        <Flex direction="column" w="100%" maxW="286px" gap="16px" mt="4px">
          <Flex
            h="56px"
            borderRadius="999px"
            bgColor={isRewardRolling ? "#B89C82" : "#9F7047"}
            align="center"
            justify="center"
            cursor={isRewardRolling ? "default" : "pointer"}
            onClick={startRewardRoll}
          >
            <Text color="white" fontSize="18px" fontWeight="700" lineHeight="1">
              {isRewardRolling ? "抽獎中..." : hasRewardRolled ? "再抽一次" : "抽獎"}
            </Text>
          </Flex>
          <Flex
            h="56px"
            borderRadius="999px"
            bgColor={isRewardRolling ? "#B89C82" : "#9F7047"}
            align="center"
            justify="center"
            cursor={isRewardRolling ? "default" : "pointer"}
            onClick={() => {
              if (isRewardRolling) return;
              onFinish();
            }}
          >
            <Text color="white" fontSize="18px" fontWeight="700" lineHeight="1">
              打卡下班
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

type OffworkRouteRewardOption = {
  id: string;
  shapeId: "first-offwork" | "wide-narrow" | "narrow-wide" | "narrow-narrow";
  title: string;
  pattern: TilePattern3x3;
  sourceId: PlaceTileId;
};

type WeekendDestinationOption = {
  id: PlaceTileId;
  title: string;
  icon: string;
  subtitle: string;
  effectLabel: string;
  resultText: string;
  applyStatus: (status: PlayerStatus) => PlayerStatus;
};

type EndDaySummaryContent = {
  title: string;
  body: string;
  chips: [string, string];
};

type CharacterIntroCard = {
  sceneId: string;
  name: string;
  englishName: string;
  descriptionLines: string[];
  spriteSheetPath: string;
  spriteCols: number;
  spriteRows: number;
  spriteFrameIndex: number;
  theme: {
    topBar: string;
    band: string;
    bandBorder: string;
    button: string;
    buttonText: string;
  };
};

const OFFWORK_ROUTE_REWARD_SHAPES: Array<
  Omit<OffworkRouteRewardOption, "id" | "sourceId">
> = [
  {
    shapeId: "wide-narrow",
    title: "寬窄",
    pattern: [
      [1, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
  },
  {
    shapeId: "narrow-wide",
    title: "窄寬",
    pattern: [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 1],
    ],
  },
  {
    shapeId: "narrow-narrow",
    title: "窄窄",
    pattern: [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
  },
];
const INITIAL_METRO_INVENTORY_TILES: RewardPlaceTile[] = [
  {
    instanceId: "base-metro-111-010-111",
    sourceId: "metro-station",
    category: "place",
    label: "捷運拼圖",
    centerEmoji: "🚋",
    pattern: [
      [1, 1, 1],
      [0, 1, 0],
      [1, 1, 1],
    ],
  },
  {
    instanceId: "base-metro-111-010-010",
    sourceId: "metro-station",
    category: "place",
    label: "捷運拼圖",
    centerEmoji: "🚋",
    pattern: [
      [1, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
  },
  {
    instanceId: "base-metro-010-010-111",
    sourceId: "metro-station",
    category: "place",
    label: "捷運拼圖",
    centerEmoji: "🚋",
    pattern: [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 1],
    ],
  },
];
const SCENE_TRANSITION_STORAGE_KEY = "moment:scene-transition";
type SceneTransitionPreset = "fade-black" | "next-day" | "mai-sleep" | "sleep-wake-cue";
const SLEEP_WAKE_EYE_CLOSE_MS = 520;
const SLEEP_WAKE_CUE_IN_DURATION_MS = 1100;
const VISUAL_NOVEL_ALARM_EXIT_DURATION_MS = 970;
const VISUAL_NOVEL_ALARM_EXIT_PRESS_MS = 360;
const VISUAL_NOVEL_ALARM_EXIT_HOLD_MS = 240;
const VISUAL_NOVEL_ALARM_EXIT_SLIDE_DELAY_MS =
  VISUAL_NOVEL_ALARM_EXIT_PRESS_MS + VISUAL_NOVEL_ALARM_EXIT_HOLD_MS;
const VISUAL_NOVEL_ALARM_EXIT_SLIDE_MS =
  VISUAL_NOVEL_ALARM_EXIT_DURATION_MS - VISUAL_NOVEL_ALARM_EXIT_SLIDE_DELAY_MS;
const fadeOutToBlack = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;
const fadeInFromBlack = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;
const fadeOutInBlack = keyframes`
  0% { opacity: 0; }
  45% { opacity: 1; }
  55% { opacity: 1; }
  100% { opacity: 0; }
`;
const maiSleepDimIn = keyframes`
  0% { opacity: 0; }
  38% { opacity: 0.22; }
  100% { opacity: 0.7; }
`;
const maiSleepVignetteIn = keyframes`
  0% { opacity: 0; transform: scale(1.16); }
  48% { opacity: 0.58; transform: scale(1.06); }
  100% { opacity: 0.92; transform: scale(1); }
`;
const maiSleepTopLidClose = keyframes`
  0% { transform: translateY(-92%); }
  18% { transform: translateY(-84%); }
  70% { transform: translateY(-28%); }
  100% { transform: translateY(0); }
`;
const maiSleepBottomLidClose = keyframes`
  0% { transform: translateY(92%); }
  18% { transform: translateY(84%); }
  70% { transform: translateY(28%); }
  100% { transform: translateY(0); }
`;
const sleepWakeDarkenHold = keyframes`
  0% { opacity: 0; }
  22% { opacity: 1; }
  100% { opacity: 1; }
`;
const sleepWakeZzzFloat = keyframes`
  0% { opacity: 0; transform: translateX(-50%) translate3d(0, 8px, 0); filter: blur(8px); }
  18% { opacity: 0.5; transform: translateX(-50%) translate3d(0, 0, 0); filter: blur(2.5px); }
  72% { opacity: 0.42; transform: translateX(-50%) translate3d(0, -5px, 0); filter: blur(3.5px); }
  100% { opacity: 0; transform: translateX(-50%) translate3d(0, -12px, 0); filter: blur(9px); }
`;
const sleepWakeCueBlur = keyframes`
  0% { opacity: 0; transform: translateX(-50%) translate3d(0, 14px, 0) scale(0.98); filter: blur(14px); }
  14% { opacity: 0; transform: translateX(-50%) translate3d(0, 14px, 0) scale(0.98); filter: blur(14px); }
  34% { opacity: 0.78; transform: translateX(-50%) translate3d(0, 0, 0) scale(1); filter: blur(8px); }
  52% { opacity: 0.78; transform: translateX(-50%) translate3d(0, -2px, 0) scale(1); filter: blur(8px); }
  72% { opacity: 0; transform: translateX(-50%) translate3d(0, -10px, 0) scale(1.03); filter: blur(16px); }
  100% { opacity: 0; transform: translateX(-50%) translate3d(0, -10px, 0) scale(1.03); filter: blur(16px); }
`;
const sleepWakeBlackBaseOpen = keyframes`
  0% { opacity: 1; }
  46% { opacity: 1; }
  58% { opacity: 0; }
  100% { opacity: 0; }
`;
const sleepWakeTopLidOpen = keyframes`
  0% { transform: translateY(0); }
  44% { transform: translateY(0); }
  100% { transform: translateY(-108%); }
`;
const sleepWakeBottomLidOpen = keyframes`
  0% { transform: translateY(0); }
  44% { transform: translateY(0); }
  100% { transform: translateY(108%); }
`;
const summaryCardIn = keyframes`
  0% { opacity: 0; transform: translateY(10px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;
const summaryCardOut = keyframes`
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-6px) scale(0.99); }
`;
const dayDateOldFadeOut = keyframes`
  0% { opacity: 1; transform: translateY(0); }
  42% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-8px); }
`;
const dayDateNewFadeIn = keyframes`
  0% { opacity: 0; transform: translateY(8px); }
  42% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
`;
const characterIntroBgFadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;
const characterIntroBandSlideIn = keyframes`
  0% { opacity: 0; transform: translateX(120%) rotate(-16deg); }
  100% { opacity: 1; transform: translateX(0) rotate(-16deg); }
`;
const characterIntroTextFadeIn = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;
const characterIntroAvatarRise = keyframes`
  0% { opacity: 0; transform: translateX(-50%) translateY(16px) scale(0.94); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
`;
const characterIntroGlowPulse = keyframes`
  0%, 100% { opacity: 0.28; transform: translateX(-50%) scale(1); }
  50% { opacity: 0.45; transform: translateX(-50%) scale(1.05); }
`;
const characterIntroOkPulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(77,120,133,0.3); }
  50% { transform: scale(1.02); box-shadow: 0 0 0 8px rgba(77,120,133,0.0); }
`;

function SceneTransitionContent({ preset }: { preset: SceneTransitionPreset }) {
  if (preset === "next-day") {
    return (
      <Text color="#F7EEE0" fontSize="30px" fontWeight="700" letterSpacing="2px">
        隔天早晨
      </Text>
    );
  }

  return null;
}

function getIncomingSceneTransitionDurationMs(preset: SceneTransitionPreset, durationMs: number) {
  if (preset === "sleep-wake-cue") return SLEEP_WAKE_CUE_IN_DURATION_MS;
  return durationMs;
}

function MaiSleepEyeClosingOverlay({ durationMs }: { durationMs: number }) {
  const lidAnimation = `${durationMs}ms cubic-bezier(0.45, 0, 0.18, 1) forwards`;

  return (
    <>
      <Box
        position="absolute"
        inset="0"
        bgColor="#111018"
        opacity={0}
        animation={`${maiSleepDimIn} ${durationMs}ms ease forwards`}
      />
      <Box
        position="absolute"
        inset="-12%"
        bgImage="radial-gradient(ellipse 82% 42% at 50% 47%, transparent 0 42%, rgba(17,16,24,0.5) 64%, rgba(17,16,24,0.96) 100%)"
        opacity={0}
        animation={`${maiSleepVignetteIn} ${durationMs}ms ease forwards`}
      />
      <Box
        position="absolute"
        left="-8%"
        right="-8%"
        top="-4%"
        h="58%"
        bgColor="#090910"
        clipPath="ellipse(88% 100% at 50% 0%)"
        animation={`${maiSleepTopLidClose} ${lidAnimation}`}
        boxShadow="0 18px 46px rgba(9,9,16,0.68)"
      />
      <Box
        position="absolute"
        left="-8%"
        right="-8%"
        bottom="-4%"
        h="58%"
        bgColor="#090910"
        clipPath="ellipse(88% 100% at 50% 100%)"
        animation={`${maiSleepBottomLidClose} ${lidAnimation}`}
        boxShadow="0 -18px 46px rgba(9,9,16,0.68)"
      />
    </>
  );
}

function SleepWakeDarkHoldOverlay({ durationMs }: { durationMs: number }) {
  const sleepDurationMs = Math.max(0, durationMs - SLEEP_WAKE_EYE_CLOSE_MS);
  const lidAnimation = `${SLEEP_WAKE_EYE_CLOSE_MS}ms cubic-bezier(0.45, 0, 0.18, 1) forwards`;

  return (
    <>
      <Box
        position="absolute"
        inset="0"
        bgColor="#090910"
        opacity={0}
        animation={`${sleepWakeDarkenHold} ${durationMs}ms ease forwards`}
      />
      <Box
        position="absolute"
        left="-8%"
        right="-8%"
        top="-4%"
        h="58%"
        bgColor="#090910"
        clipPath="ellipse(88% 100% at 50% 0%)"
        animation={`${maiSleepTopLidClose} ${lidAnimation}`}
        boxShadow="0 18px 46px rgba(9,9,16,0.74)"
      />
      <Box
        position="absolute"
        left="-8%"
        right="-8%"
        bottom="-4%"
        h="58%"
        bgColor="#090910"
        clipPath="ellipse(88% 100% at 50% 100%)"
        animation={`${maiSleepBottomLidClose} ${lidAnimation}`}
        boxShadow="0 -18px 46px rgba(9,9,16,0.74)"
      />
      <Text
        position="absolute"
        left="50%"
        top="46%"
        zIndex={2}
        transform="translateX(-50%)"
        color="rgba(247, 238, 224, 0.7)"
        fontSize="22px"
        fontWeight="800"
        letterSpacing="0"
        lineHeight="1"
        opacity={0}
        animation={`${sleepWakeZzzFloat} ${sleepDurationMs}ms ease-out ${SLEEP_WAKE_EYE_CLOSE_MS}ms forwards`}
      >
        Zzz...
      </Text>
    </>
  );
}

function SleepWakeEyeOpenOverlay({
  durationMs,
  wakeCueText = "嗷！",
}: {
  durationMs: number;
  wakeCueText?: string;
}) {
  const lidAnimation = `${durationMs}ms cubic-bezier(0.24, 0.74, 0.22, 1) forwards`;

  return (
    <>
      <Box
        position="absolute"
        inset="0"
        bgColor="#090910"
        animation={`${sleepWakeBlackBaseOpen} ${durationMs}ms ease forwards`}
      />
      <Text
        position="absolute"
        left="50%"
        top="57%"
        transform="translateX(-50%)"
        zIndex={2}
        color="rgba(247, 238, 224, 0.84)"
        fontSize="34px"
        fontWeight="900"
        letterSpacing="0"
        lineHeight="1"
        textShadow="0 0 24px rgba(247,238,224,0.34)"
        opacity={0}
        animation={`${sleepWakeCueBlur} ${durationMs}ms ease-out forwards`}
      >
        {wakeCueText}
      </Text>
      <Box
        position="absolute"
        left="-8%"
        right="-8%"
        top="-4%"
        h="58%"
        bgColor="#090910"
        clipPath="ellipse(88% 100% at 50% 0%)"
        animation={`${sleepWakeTopLidOpen} ${lidAnimation}`}
        boxShadow="0 18px 46px rgba(9,9,16,0.74)"
      />
      <Box
        position="absolute"
        left="-8%"
        right="-8%"
        bottom="-4%"
        h="58%"
        bgColor="#090910"
        clipPath="ellipse(88% 100% at 50% 100%)"
        animation={`${sleepWakeBottomLidOpen} ${lidAnimation}`}
        boxShadow="0 -18px 46px rgba(9,9,16,0.74)"
      />
    </>
  );
}

const scene5OutfitPanelFadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;
const storyComicPanelFadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;
const storyComicPanelSlideInFromRight = keyframes`
  0% { opacity: 0; transform: translateX(72px); }
  100% { opacity: 1; transform: translateX(0); }
`;
const storyComicPanelSlideInFromRightCentered = keyframes`
  0% { opacity: 0; transform: translateX(calc(-50% + 72px)); }
  100% { opacity: 1; transform: translateX(-50%); }
`;
const storySingleComicImageSlideInFromLeft = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(0); }
`;
const storySingleComicImageSlideInFromRight = keyframes`
  0% { transform: translateX(96%) rotateY(-10deg); filter: brightness(1.04); }
  72% { transform: translateX(-2%) rotateY(2deg); filter: brightness(1.01); }
  100% { transform: translateX(0) rotateY(0deg); filter: brightness(1); }
`;
const storySingleComicImageSlideInFromBottom = keyframes`
  0% { transform: translateY(100%); }
  100% { transform: translateY(0); }
`;
const openingCloudVeilFade = keyframes`
  0% { opacity: 1; }
  22% { opacity: 1; }
  70% { opacity: 0.18; }
  100% { opacity: 0; }
`;
const openingCloudMistDrift = keyframes`
  0% { opacity: 0.92; transform: translate3d(0, 0, 0) scale(1); }
  45% { opacity: 0.58; transform: translate3d(0, -12px, 0) scale(1.04); }
  100% { opacity: 0; transform: translate3d(0, -28px, 0) scale(1.1); }
`;
const openingCloudScatter = keyframes`
  0% {
    opacity: 1;
    transform:
      translate3d(0, 0, 0)
      scale(var(--cloud-start-scale))
      rotate(var(--cloud-start-rotate));
    filter: brightness(1.03) blur(0);
  }
  18% {
    opacity: 1;
    transform:
      translate3d(0, 0, 0)
      scale(calc(var(--cloud-start-scale) * 1.03))
      rotate(var(--cloud-start-rotate));
    filter: brightness(1.06) blur(0);
  }
  100% {
    opacity: 0;
    transform:
      translate3d(var(--cloud-end-x), var(--cloud-end-y), 0)
      scale(var(--cloud-end-scale))
      rotate(var(--cloud-end-rotate));
    filter: brightness(1.05) blur(1.2px);
  }
`;
const visualNovelAlarmSceneIn = keyframes`
  from { opacity: 0; filter: blur(3px); }
  to { opacity: 1; filter: blur(0); }
`;
const visualNovelAlarmPressExit = keyframes`
  0% { transform: translate(-50%, -50%) translateY(0) scale(1); }
  34% { transform: translate(-50%, -50%) translateY(36px) scale(0.94); }
  62% { transform: translate(-50%, -50%) translateY(-6px) scale(1.02); }
  82%, 100% { transform: translate(-50%, -50%) translateY(0) scale(1); }
`;
const sceneBackgroundZoomIn = keyframes`
  0% {
    transform:
      translate3d(0, var(--scene-bg-translate-y-from), 0)
      scale(var(--scene-bg-zoom-from));
    filter:
      brightness(var(--scene-bg-brightness-from))
      blur(var(--scene-bg-blur-from));
  }
  100% {
    transform:
      translate3d(0, var(--scene-bg-translate-y-to), 0)
      scale(var(--scene-bg-zoom-to));
    filter:
      brightness(var(--scene-bg-brightness-to))
      blur(var(--scene-bg-blur-to));
  }
`;
const visualNovelAlarmRing = keyframes`
  0% { transform: rotate(0deg); }
  8% { transform: rotate(-7deg); }
  16% { transform: rotate(7deg); }
  24% { transform: rotate(-5deg); }
  32% { transform: rotate(5deg); }
  42%, 100% { transform: rotate(0deg); }
`;
const storyComicPanelSmashIn = keyframes`
  0% { opacity: 0; transform: translateX(-50%) translate(34px, -30px) scale(0.92); }
  100% { opacity: 1; transform: translateX(-50%) translate(0, 0) scale(1.15); }
`;
const scene32MemoryWash = keyframes`
  0% { opacity: 0; }
  32% { opacity: 1; }
  100% { opacity: 1; }
`;
const scene32LeftCurtainReveal = keyframes`
  0% { transform: translateX(0) skewX(-18deg); }
  18% { transform: translateX(0) skewX(-18deg); }
  100% { transform: translateX(-58%) skewX(-18deg); }
`;
const scene32RightCurtainReveal = keyframes`
  0% { transform: translateX(0) skewX(-18deg); }
  18% { transform: translateX(0) skewX(-18deg); }
  100% { transform: translateX(58%) skewX(-18deg); }
`;
const scene47LeftCurtainReveal = keyframes`
  0% { transform: translateX(0); }
  12% { transform: translateX(0); }
  42% { transform: translateX(-18%); }
  100% { transform: translateX(-104%); }
`;
const scene47DoorLightReveal = keyframes`
  0% { opacity: 0; transform: scaleY(0.94); }
  12% { opacity: 0.75; transform: scaleY(0.94); }
  44% { opacity: 1; transform: scaleY(1); }
  100% { opacity: 0.28; transform: scaleY(1); }
`;
const scene32CluePanelReveal = keyframes`
  0% { opacity: 0; transform: translateX(-50%) translateY(14px) rotate(-2deg) scale(0.94); filter: brightness(1.18) blur(1px); }
  24% { opacity: 0; transform: translateX(-50%) translateY(14px) rotate(-2deg) scale(0.94); filter: brightness(1.18) blur(1px); }
  50% { opacity: 1; transform: translateX(-50%) translateY(0) rotate(-2deg) scale(1.03); filter: brightness(1.08) blur(0); }
  60% { opacity: 1; transform: translateX(calc(-50% - 10px)) translateY(0) rotate(-4deg) scale(1.02); filter: brightness(1.06) blur(0); }
  70% { opacity: 1; transform: translateX(calc(-50% + 9px)) translateY(0) rotate(1deg) scale(1.01); filter: brightness(1.03) blur(0); }
  80% { opacity: 1; transform: translateX(calc(-50% - 5px)) translateY(0) rotate(-3deg) scale(1); filter: brightness(1); }
  90% { opacity: 1; transform: translateX(calc(-50% + 3px)) translateY(0) rotate(-1deg) scale(1); filter: brightness(1); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0) rotate(-2deg) scale(1); filter: brightness(1); }
`;
const scene32ClueGlow = keyframes`
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.68); }
  36% { opacity: 0.38; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0.16; transform: translate(-50%, -50%) scale(1.24); }
`;

const getStorySingleComicPanelAnimation = (scene: GameScene) => {
  const panel = scene.storySingleComicPanel;
  if (panel?.enterFrom === "right") {
    const animationName = panel.centered
      ? storyComicPanelSlideInFromRightCentered
      : storyComicPanelSlideInFromRight;
    return `${animationName} ${panel.enterDurationMs ?? 420}ms cubic-bezier(0.2, 0.78, 0.22, 1) ${panel.enterDelayMs ?? 0}ms both`;
  }

  if (scene.id === "scene-1") return `${storyComicPanelFadeIn} 320ms ease-out 0.5s both`;
  if (scene.id === "scene-22") return `${storyComicPanelFadeIn} 320ms ease-out both`;
  if (scene.id === "scene-30") return `${storyComicPanelSmashIn} 260ms ease-out both`;
  if (scene.id === "scene-32") return `${scene32CluePanelReveal} 820ms cubic-bezier(0.2, 0.9, 0.2, 1) both`;

  return undefined;
};

const getStorySingleComicPanelImageAnimation = (scene: GameScene) => {
  const panel = scene.storySingleComicPanel;
  if (!panel?.imageEnterFrom || panel.imageEnterFrom === "none") return undefined;

  const animationName =
    panel.imageEnterFrom === "right"
      ? storySingleComicImageSlideInFromRight
      : panel.imageEnterFrom === "bottom"
        ? storySingleComicImageSlideInFromBottom
        : storySingleComicImageSlideInFromLeft;

  return `${animationName} ${panel.imageEnterDurationMs ?? 420}ms cubic-bezier(0.18, 0.72, 0.18, 1) ${panel.imageEnterDelayMs ?? 0}ms both`;
};

const getSceneBackgroundMotionAnimation = (scene: GameScene) => {
  const motion = scene.backgroundMotion;
  if (motion?.preset !== "zoom-in") return undefined;
  return `${sceneBackgroundZoomIn} ${motion.durationMs ?? 720}ms cubic-bezier(0.18, 0.72, 0.18, 1) both`;
};

const scene5HappyAvatarFadeIn = keyframes`
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
`;
const scene6SpeechBubbleFloat = keyframes`
  0%, 100% { transform: translateY(0) rotate(-3deg); }
  50% { transform: translateY(-6px) rotate(1deg); }
`;
const scene6MusicIconSwing = keyframes`
  0%, 100% { transform: rotate(-10deg) translateY(0); }
  50% { transform: rotate(8deg) translateY(-1px); }
`;
const scene20DropletFall = keyframes`
  0% { opacity: 0; transform: translateY(-8px) scale(0.88); }
  20% { opacity: 1; transform: translateY(-2px) scale(1); }
  78% { opacity: 1; transform: translateY(9px) scale(0.98); }
  100% { opacity: 0; transform: translateY(14px) scale(0.92); }
`;
const creatureFlashBy = keyframes`
  0% { opacity: 0; transform: translateX(52px) scale(0.82); filter: blur(5px); }
  18% { opacity: 0.92; transform: translateX(6px) scale(0.96); filter: blur(2px); }
  78% { opacity: 0.92; transform: translateX(-88px) scale(1.02); filter: blur(1px); }
  100% { opacity: 0; transform: translateX(-132px) scale(1.04); filter: blur(6px); }
`;
const floatingBaiDrift = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.02); }
`;
const floatingBaiGlow = keyframes`
  0%, 100% { opacity: 0.76; transform: scale(0.995); }
  50% { opacity: 1; transform: scale(1.015); }
`;
const floatingDiaryPageBack = keyframes`
  0%, 100% { transform: translateY(2px); }
  50% { transform: translateY(-5px); }
`;
const floatingDiaryPageMiddle = keyframes`
  0%, 100% { transform: translateY(-3px); }
  50% { transform: translateY(6px); }
`;
const floatingDiaryPageFront = keyframes`
  0%, 100% { transform: translateY(3px); }
  50% { transform: translateY(-7px); }
`;
const getBaiGlowLayerAnimation = (
  layer: (typeof BAI_ROOM_GLOW_1_BACKGROUND_LAYERS)[number],
  index: number,
) => {
  const animationName =
    layer.motion === "glow"
      ? floatingBaiGlow
      : layer.motion === "float-bai"
        ? floatingBaiDrift
        : layer.motion === "float-back"
          ? floatingDiaryPageBack
          : layer.motion === "float-middle"
            ? floatingDiaryPageMiddle
            : floatingDiaryPageFront;
  return `${animationName} ${layer.durationMs}ms ease-in-out ${index * -370}ms infinite both`;
};
const beigoRevealWhiteBurst = keyframes`
  0% { opacity: 0.96; }
  18% { opacity: 0.9; }
  64% { opacity: 0.18; }
  100% { opacity: 0; }
`;
const beigoRevealLightBloom = keyframes`
  0% { opacity: 0.95; transform: translate(-50%, -50%) scale(0.58); filter: blur(2px); }
  32% { opacity: 0.86; transform: translate(-50%, -50%) scale(1); filter: blur(1px); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.68); filter: blur(8px); }
`;
const beigoRevealPagesSweep = keyframes`
  0% { opacity: 1; transform: translateY(-18px) scale(1.06); filter: brightness(1.3) blur(0.8px); }
  42% { opacity: 1; transform: translateY(-8px) scale(1.02); filter: brightness(1.12) blur(0); }
  100% { opacity: 0; transform: translateY(18px) scale(0.97); filter: brightness(1) blur(0); }
`;
const beigoRevealPagesSettle = keyframes`
  0% { opacity: 1; transform: translateY(-26px) scale(1.08) rotate(-1deg); filter: brightness(1.24) blur(0.8px); }
  48% { opacity: 0.92; transform: translateY(-8px) scale(1.02) rotate(0deg); filter: brightness(1.1) blur(0); }
  100% { opacity: 0; transform: translateY(20px) scale(0.98) rotate(1deg); filter: brightness(1) blur(0); }
`;
const beigoRevealStarsTwinkle = keyframes`
  0% { opacity: 0; transform: translateY(8px) scale(0.94); filter: brightness(1.35); }
  28% { opacity: 0.88; transform: translateY(0) scale(1); filter: brightness(1.5); }
  72% { opacity: 0.66; transform: translateY(-5px) scale(1.02); filter: brightness(1.24); }
  100% { opacity: 0.28; transform: translateY(-10px) scale(1.04); filter: brightness(1); }
`;
const nightHubSunbeastPointerNudge = keyframes`
  0% { opacity: 0.78; transform: translateX(-5px) rotate(90deg); }
  50% { opacity: 1; transform: translateX(7px) rotate(90deg); }
  100% { opacity: 0.78; transform: translateX(-5px) rotate(90deg); }
`;
const nightHubSleepPointerNudge = keyframes`
  0% { opacity: 0.78; transform: translateX(7px) rotate(-90deg); }
  50% { opacity: 1; transform: translateX(-5px) rotate(-90deg); }
  100% { opacity: 0.78; transform: translateX(7px) rotate(-90deg); }
`;
const doorSwipeArrowNudge = keyframes`
  0%, 100% { transform: translateX(5px); }
  50% { transform: translateX(-7px); }
`;
const doorSwipePromptFloat = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`;

function OpeningCloudBurstOverlay() {
  return (
    <Flex
      aria-hidden="true"
      position="absolute"
      inset="0"
      zIndex={82}
      pointerEvents="none"
      overflow="hidden"
      bgColor="#F0F0EA"
      animation={`${openingCloudVeilFade} ${OPENING_CLOUD_BURST_DURATION_MS}ms ease-out both`}
    >
      <Flex
        position="absolute"
        inset="-18%"
        bg="radial-gradient(circle at 50% 46%, rgba(255,255,255,0.42) 0%, rgba(248,248,238,0.28) 38%, rgba(232,236,224,0) 78%)"
        animation={`${openingCloudMistDrift} ${OPENING_CLOUD_BURST_DURATION_MS}ms ease-out both`}
      />
      {OPENING_CLOUD_LAYERS.map((cloud) => {
        const cloudStyle = {
          "--cloud-start-scale": `${cloud.startScale}`,
          "--cloud-start-rotate": cloud.startRotate,
          "--cloud-end-x": cloud.endX,
          "--cloud-end-y": cloud.endY,
          "--cloud-end-scale": `${cloud.endScale}`,
          "--cloud-end-rotate": cloud.endRotate,
          willChange: "transform, opacity, filter",
        } as CSSProperties;
        const cloudImageStyle = {
          width: cloud.imageWidth ?? "100%",
          height: cloud.imageHeight ?? (cloud.height ? "100%" : "auto"),
          display: "block",
          maxWidth: "none",
          userSelect: "none",
          transform: cloud.imageRotate ? `rotate(${cloud.imageRotate})` : undefined,
          transformOrigin: "center",
        } as CSSProperties;

        return (
          <Flex
            key={cloud.id}
            position="absolute"
            left={cloud.left}
            top={cloud.top}
            w={cloud.width}
            h={cloud.height}
            zIndex={cloud.zIndex}
            alignItems="center"
            justifyContent="center"
            overflow="visible"
            style={cloudStyle}
            animation={`${openingCloudScatter} ${OPENING_CLOUD_BURST_DURATION_MS}ms cubic-bezier(0.18, 0.76, 0.2, 1) ${cloud.delayMs}ms both`}
          >
            <img
              src={cloud.src}
              alt=""
              draggable={false}
              style={cloudImageStyle}
            />
          </Flex>
        );
      })}
    </Flex>
  );
}

const CHARACTER_INTRO_BY_SCENE_ID: Record<string, CharacterIntroCard> = {
  "scene-3": {
    sceneId: "scene-3",
    name: "小麥",
    englishName: "MUGI",
    descriptionLines: [
      "剛出社會兩年的職場新鮮人",
      "平時省吃儉用，但看到喜歡的東西還是會手滑的平凡女孩",
    ],
    spriteSheetPath: "/images/mai/Mai_Spirt.png",
    spriteCols: 6,
    spriteRows: 3,
    spriteFrameIndex: 13,
    theme: {
      topBar: "rgba(220, 193, 178, 0.92)",
      band: "rgba(183, 141, 128, 0.94)",
      bandBorder: "rgba(139, 94, 82, 0.76)",
      button: "#A86E61",
      buttonText: "#FFF4F0",
    },
  },
  "scene-13": {
    sceneId: "scene-13",
    name: "小白",
    englishName: "SHIRO",
    descriptionLines: [
      "小麥的現任室友兼大學好友",
      "自由接案的動畫師，時常燃燒生命趕稿",
      "成為室友的第二個月",
    ],
    spriteSheetPath: "/images/bai/Bai_Spirt.png",
    spriteCols: 7,
    spriteRows: 1,
    spriteFrameIndex: 2,
    theme: {
      topBar: "rgba(181, 208, 214, 0.9)",
      band: "rgba(131, 170, 179, 0.94)",
      bandBorder: "rgba(84,127,137,0.74)",
      button: "#4D7885",
      buttonText: "#EFF8FB",
    },
  },
};

type PendingSceneTransitionPayload = {
  toSceneId: string;
  preset: SceneTransitionPreset;
  durationMs: number;
  wakeCueText?: string;
  createdAt: number;
};

type Scene4ExitPhase = "idle" | "avatar-exit";
type Scene5OutfitRevealPhase =
  | "hidden"
  | "modal-enter"
  | "pose-rise"
  | "modal-exit"
  | "dialog"
  | "avatar-exit";
type Scene9PuppetRevealPhase = "hidden" | "prop" | "dialog";
type Scene10ExitPhase = "idle" | "exiting";
type Scene14PuppetPhase = "hidden" | "visible";
type Scene47RevealPhase = "revealing" | "dialog";
type Scene51BeigoRevealPhase = "revealing" | "dialog";
type DoorSwipePhase = "dialog" | "prompt" | "opened";
type ComicCheatId = keyof typeof COMIC_IMAGE_BY_ID;
type StoryComicId = keyof typeof COMIC_IMAGE_BY_ID;
type NightHubGuideStep =
  | "first-home-journal-pointer"
  | "first-home-sunbeast-pointer"
  | "first-home-sleep-pointer"
  | "sunbeast-dialog"
  | "sunbeast-pointer"
  | "frog-diary-pointer"
  | "frog-return-home-diary-pointer"
  | "place-pointer"
  | "mission-pointer"
  | "sleep-pointer"
  | null;

function getStoryComicOverlaySequenceFrameIds(overlay: StoryComicOverlay) {
  if (overlay.sequenceFrameIds?.length) return overlay.sequenceFrameIds;
  return overlay.finalImageId ? [overlay.finalImageId] : [];
}

function StoryComicOverlayPanel({
  sceneId,
  overlay,
  index,
  isVisible,
  onSequenceComplete,
}: {
  sceneId: string;
  overlay: StoryComicOverlay;
  index: number;
  isVisible: boolean;
  onSequenceComplete?: (index: number) => void;
}) {
  const sequenceTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasStartedSequenceRef = useRef(false);
  const hasReportedCompleteRef = useRef(false);
  const [visibleSequenceFrameCount, setVisibleSequenceFrameCount] = useState(0);
  const sequenceFrameIds = getStoryComicOverlaySequenceFrameIds(overlay);
  const sequenceFrameKey = sequenceFrameIds.join("|");
  const hiddenTransform =
    overlay.enterFrom === "left"
      ? "translateX(-72px)"
      : overlay.enterFrom === "right"
        ? "translateX(72px)"
        : overlay.enterFrom === "bottom"
          ? "translateY(32px)"
          : "translate(0, 0)";

  const scheduleSequence = () => {
    if (
      sequenceFrameIds.length === 0 ||
      hasStartedSequenceRef.current
    ) {
      return;
    }
    hasStartedSequenceRef.current = true;
    let elapsedMs = overlay.finalDelayAfterEnterMs ?? 0;
    sequenceFrameIds.forEach((_, frameIndex) => {
      if (frameIndex > 0) {
        elapsedMs += overlay.sequenceFrameIntervalMs ?? 220;
      }
      sequenceTimerRefs.current.push(
        setTimeout(() => {
          setVisibleSequenceFrameCount(frameIndex + 1);
        }, elapsedMs),
      );
    });
    sequenceTimerRefs.current.push(
      setTimeout(() => {
        if (hasReportedCompleteRef.current) return;
        hasReportedCompleteRef.current = true;
        onSequenceComplete?.(index);
      }, elapsedMs + (overlay.finalFadeDurationMs ?? 240)),
    );
  };

  useEffect(() => {
    setVisibleSequenceFrameCount(0);
    hasStartedSequenceRef.current = false;
    hasReportedCompleteRef.current = false;
    sequenceTimerRefs.current.forEach((timer) => clearTimeout(timer));
    sequenceTimerRefs.current = [];
    return () => {
      sequenceTimerRefs.current.forEach((timer) => clearTimeout(timer));
      sequenceTimerRefs.current = [];
    };
  }, [sceneId, index, overlay.imageId, overlay.finalImageId, sequenceFrameKey]);

  useEffect(() => {
    if (!isVisible || sequenceFrameIds.length === 0) return;
    const fallbackTimer = setTimeout(() => {
      scheduleSequence();
    }, overlay.enterDurationMs ?? 360);
    return () => clearTimeout(fallbackTimer);
  }, [isVisible, overlay.enterDurationMs, sequenceFrameKey]);

  return (
    <Flex
      position="absolute"
      top={overlay.top}
      left={overlay.left}
      right={overlay.right}
      zIndex={overlay.zIndex ?? 7}
      w={overlay.width}
      h={overlay.height}
      maxW={overlay.maxWidth}
      pointerEvents="none"
      opacity={isVisible ? 1 : 0}
      transform={isVisible ? "translate(0, 0)" : hiddenTransform}
      transition={`opacity ${overlay.enterDurationMs ?? 360}ms ease, transform ${overlay.enterDurationMs ?? 360}ms ease`}
      overflow="hidden"
      onTransitionEnd={(event) => {
        if (!isVisible || event.currentTarget !== event.target || event.propertyName !== "transform") return;
        scheduleSequence();
      }}
    >
      {sequenceFrameIds.length > 0 ? (
        <>
          <img
            src={COMIC_IMAGE_BY_ID[overlay.imageId]}
            alt={overlay.alt}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
          {sequenceFrameIds.map((frameId, frameIndex) => (
            <img
              key={`${frameId}-${frameIndex}`}
              src={COMIC_IMAGE_BY_ID[frameId]}
              alt=""
              aria-hidden="true"
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                position: "absolute",
                inset: 0,
                opacity: visibleSequenceFrameCount > frameIndex ? 1 : 0,
                transition: `opacity ${overlay.finalFadeDurationMs ?? 240}ms ease`,
              }}
            />
          ))}
        </>
      ) : (
        <img
          src={COMIC_IMAGE_BY_ID[overlay.imageId]}
          alt={overlay.alt}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      )}
    </Flex>
  );
}

function areStoryComicOverlaysEquivalent(
  left: StoryComicOverlay,
  right: StoryComicOverlay,
) {
  return (
    left.imageId === right.imageId &&
    left.alt === right.alt &&
    left.top === right.top &&
    left.left === right.left &&
    left.right === right.right &&
    left.width === right.width &&
    left.height === right.height &&
    left.maxWidth === right.maxWidth &&
    left.zIndex === right.zIndex &&
    left.finalImageId === right.finalImageId &&
    left.finalDelayAfterEnterMs === right.finalDelayAfterEnterMs &&
    left.finalFadeDurationMs === right.finalFadeDurationMs &&
    left.sequenceFrameIntervalMs === right.sequenceFrameIntervalMs &&
    getStoryComicOverlaySequenceFrameIds(left).join("|") ===
      getStoryComicOverlaySequenceFrameIds(right).join("|")
  );
}

function buildOffworkRouteRewardPool(
  progress: ReturnType<typeof loadPlayerProgress>,
): OffworkRouteRewardOption[] {
  const sourceIds = progress.ownedPlaceTileIds.length > 0
    ? progress.ownedPlaceTileIds
    : (["metro-station"] satisfies PlaceTileId[]);
  const uniqueSourceIds = Array.from(new Set(sourceIds));

  return uniqueSourceIds.flatMap((sourceId) =>
    OFFWORK_ROUTE_REWARD_SHAPES.map((shape) => ({
      ...shape,
      sourceId,
      id: `${sourceId}-${shape.shapeId}`,
    })),
  );
}

function pickOffworkRouteRewardChoices(
  progress: ReturnType<typeof loadPlayerProgress>,
): OffworkRouteRewardOption[] {
  if (progress.offworkRewardClaimCount === 0) {
    const firstRewardTitles = ["寬窄", "窄寬"] as const;
    const firstRewardShapeIds = ["wide-narrow", "narrow-wide"] as const;
    return FIRST_OFFWORK_REWARD_PATTERNS.map((pattern, index) => ({
      id: `metro-station-first-offwork-${index + 1}`,
      shapeId: firstRewardShapeIds[index] ?? "wide-narrow",
      title: firstRewardTitles[index] ?? `形狀 ${index + 1}`,
      pattern,
      sourceId: "metro-station",
    }));
  }

  const pool = buildOffworkRouteRewardPool(progress);
  if (pool.length <= 0) return [];

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const choices: OffworkRouteRewardOption[] = [];
  for (let index = 0; choices.length < 4; index += 1) {
    const source = shuffled[index % shuffled.length];
    const cycle = Math.floor(index / shuffled.length);
    choices.push({
      ...source,
      id: cycle > 0 ? `${source.id}-${cycle}` : source.id,
    });
  }
  return choices;
}

function buildRewardInventoryTiles(
  progress: ReturnType<typeof loadPlayerProgress>,
): RewardPlaceTile[] {
  const shouldIncludeBaseMetro =
    progress.ownedPlaceTileIds.length === 0 ||
    progress.ownedPlaceTileIds.includes("metro-station");
  return [
    ...(shouldIncludeBaseMetro ? INITIAL_METRO_INVENTORY_TILES : []),
    ...progress.rewardPlaceTiles,
  ];
}

const IN_GAME_CALENDAR_BASE = new Date(2024, 2, 11); // 星期一 3/11
const WEEKDAY_LABELS = ["星期天", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"] as const;

function formatInGameDateLabel(day: number): string {
  const safeDay = Number.isFinite(day) && day >= 1 ? Math.floor(day) : 1;
  const date = new Date(IN_GAME_CALENDAR_BASE);
  date.setDate(IN_GAME_CALENDAR_BASE.getDate() + safeDay - 1);
  const weekday = WEEKDAY_LABELS[date.getDay()];
  const month = date.getMonth() + 1;
  const dateNumber = date.getDate();
  return `${weekday} ${month}/${dateNumber}`;
}

function getInGameWeekday(day: number) {
  const safeDay = Number.isFinite(day) && day >= 1 ? Math.floor(day) : 1;
  const date = new Date(IN_GAME_CALENDAR_BASE);
  date.setDate(IN_GAME_CALENDAR_BASE.getDate() + safeDay - 1);
  return date.getDay();
}

function isWeekendInGameDay(day: number) {
  const weekday = getInGameWeekday(day);
  return weekday === 0 || weekday === 6;
}

function buildWeekendDestinationOptions(progress: ReturnType<typeof loadPlayerProgress>): WeekendDestinationOption[] {
  const unlockedPlaceIds = new Set(progress.ownedPlaceTileIds);
  const options: WeekendDestinationOption[] = [
    {
      id: "metro-station",
      title: "捷運站",
      icon: "🚉",
      subtitle: "去熟悉的地方走走",
      effectLabel: "行動力 +1 / 疲勞 -4",
      resultText: "你搭著熟悉的路線晃了一圈，沒有趕時間的通勤變得輕鬆許多，心情也慢慢放鬆。",
      applyStatus: (status) => ({
        ...status,
        actionPower: Math.min(6, status.actionPower + 1),
        fatigue: Math.max(0, status.fatigue - 4),
      }),
    },
  ];

  if (progress.hasPassedThroughStreet || unlockedPlaceIds.has("street")) {
    options.push({
      id: "street",
      title: "街道",
      icon: "💡",
      subtitle: "隨意散步看看",
      effectLabel: "疲勞 -6",
      resultText: "你在街道上慢慢散步，邊走邊看著周圍小店與行人，腦袋裡悶住的感覺淡了一些。",
      applyStatus: (status) => ({
        ...status,
        fatigue: Math.max(0, status.fatigue - 6),
      }),
    });
  }

  if (unlockedPlaceIds.has("park")) {
    options.push({
      id: "park",
      title: "公園",
      icon: "🌳",
      subtitle: "去透透氣",
      effectLabel: "疲勞 -10",
      resultText: "你在公園找了個舒服角落坐下來，吹著風發呆了一陣子，整個人都鬆開了些。",
      applyStatus: (status) => ({
        ...status,
        fatigue: Math.max(0, status.fatigue - 10),
      }),
    });
  }

  if (unlockedPlaceIds.has("breakfast-shop")) {
    options.push({
      id: "breakfast-shop",
      title: "早餐店",
      icon: "🥪",
      subtitle: "慢慢吃一頓",
      effectLabel: "儲蓄 -1 / 行動力 +1 / 疲勞 -8",
      resultText: "你點了一份喜歡的早餐坐著慢慢吃，週末的節奏讓這頓飯比平常更有安定感。",
      applyStatus: (status) => ({
        ...status,
        savings: Math.max(0, status.savings - 1),
        actionPower: Math.min(6, status.actionPower + 1),
        fatigue: Math.max(0, status.fatigue - 8),
      }),
    });
  }

  if (unlockedPlaceIds.has("convenience-store")) {
    options.push({
      id: "convenience-store",
      title: "便利商店",
      icon: "🏪",
      subtitle: "買點小東西",
      effectLabel: "儲蓄 -1 / 行動力 +1",
      resultText: "你在便利商店裡慢慢晃，挑了點喜歡的小東西，覺得今天有一種被自己照顧到的感覺。",
      applyStatus: (status) => ({
        ...status,
        savings: Math.max(0, status.savings - 1),
        actionPower: Math.min(6, status.actionPower + 1),
      }),
    });
  }

  if (unlockedPlaceIds.has("bus-stop")) {
    options.push({
      id: "bus-stop",
      title: "公車站",
      icon: "🚌",
      subtitle: "換個方向晃晃",
      effectLabel: "行動力 +1 / 疲勞 -5",
      resultText: "你在公車站隨興搭了一小段，看看不熟悉的街景，像替這週留了一個空白又舒服的句點。",
      applyStatus: (status) => ({
        ...status,
        actionPower: Math.min(6, status.actionPower + 1),
        fatigue: Math.max(0, status.fatigue - 5),
      }),
    });
  }

  return options.slice(0, 3);
}

function tilePatternKey(pattern: TilePattern3x3): string {
  return pattern.map((row) => row.map((value) => (value ? "1" : "0")).join("")).join("_");
}

function tileSourceLabel(sourceId: PlaceTileId): string {
  if (sourceId === "metro-station") return "捷運";
  if (sourceId === "street") return "街道";
  if (sourceId === "convenience-store") return "便利商店";
  if (sourceId === "breakfast-shop") return "早餐店";
  if (sourceId === "park") return "公園";
  if (sourceId === "bus-stop") return "公車站";
  return "地點";
}

function tileSourceIconPath(sourceId: PlaceTileId): string {
  if (sourceId === "metro-station") return "/images/icon/mrt.png";
  if (sourceId === "street") return "/images/icon/street.png";
  if (sourceId === "convenience-store") return "/images/icon/mart.png";
  if (sourceId === "breakfast-shop") return "/images/icon/breakfast.png";
  if (sourceId === "park") return "/images/icon/park.png";
  return "/images/icon/road.png";
}

const INVENTORY_ROUTE_IMAGE_BY_PATTERN_KEY: Record<string, string> = {
  "010_010_010": "/images/route/rt_010_010_010.png",
  "010_010_111": "/images/route/rt_010_010_111.jpg",
  "010_110_000": "/images/route/rt_010_110_000.jpg",
  "000_011_010": "/images/route/rt_000_011_010.jpg",
  "000_110_010": "/images/route/rt_000_110_010.jpg",
  "010_011_000": "/images/route/rt_010_011_000.jpg",
  "100_010_001": "/images/route/rt_100_010_001.jpg",
  "100_010_010": "/images/route/rt_100_010_010.jpg",
  "111_010_010": "/images/route/rt_1111_010_010.jpg",
  "111_010_111": "/images/route/rt_111_010_111.jpg",
  "111_100_100": "/images/route/rt_1111_100_100.jpg",
};
const INVENTORY_ROUTE_NEW_PLACE_IMAGE_BY_SOURCE_AND_PATTERN_KEY: Partial<
  Record<PlaceTileId, Partial<Record<string, string>>>
> = {
  "metro-station": {
    "111_010_010": "/images/route/route_new/wide_to_narrow_捷運.png",
    "010_010_010": "/images/route/route_new/straight_捷運.png",
    "111_010_111": "/images/route/route_new/wide_to_wide_捷運.png",
    "010_010_111": "/images/route/route_new/narrow_to_wide_捷運.png",
  },
  "convenience-store": {
    "111_010_010": "/images/route/route_new/wide_to_narrow_超商.png",
    "010_010_010": "/images/route/route_new/straight_超商.png",
    "111_010_111": "/images/route/route_new/wide_to_wide_超商.png",
    "010_010_111": "/images/route/route_new/narrow_to_wide_超商.png",
  },
  street: {
    "111_010_010": "/images/route/route_new/wide_to_narrow_街道.png",
    "010_010_010": "/images/route/route_new/straight_街道.png",
    "111_010_111": "/images/route/route_new/wide_to_wide_街道.png",
    "010_010_111": "/images/route/route_new/narrow_to_wide_街道.png",
  },
};
const INVENTORY_ROUTE_NEW_PLACE_SOURCE_IDS = new Set<PlaceTileId>([
  "metro-station",
  "convenience-store",
  "street",
]);
const INVENTORY_LEGACY_METRO_IMAGE_BY_PATTERN_KEY: Record<string, string> = {
  "111_010_111": "/images/route/rt_MRT_111_010_111.png",
  "111_010_010": "/images/route/rt_MRT_111_010_010.jpg",
  "010_010_111": "/images/route/rt_MRT_010_010_111.jpg",
};
const INVENTORY_METRO_IMAGE_BY_PATTERN_KEY: Record<string, string> = {
  "111_010_111": "/images/route/route_new/wide_to_wide_捷運.png",
  "111_010_010": "/images/route/rt_MRT_111_010_010.jpg",
  "010_010_111": "/images/route/rt_MRT_010_010_111.jpg",
};

function resolveInventoryPlaceTileEmbeddedImagePath(params: {
  pattern: TilePattern3x3;
  sourceId?: PlaceTileId;
}) {
  if (!params.sourceId) return undefined;
  const key = tilePatternKey(params.pattern);
  const routeNewImagePath =
    INVENTORY_ROUTE_NEW_PLACE_IMAGE_BY_SOURCE_AND_PATTERN_KEY[params.sourceId]?.[key];
  if (routeNewImagePath) return routeNewImagePath;

  if (params.sourceId === "metro-station") {
    return INVENTORY_METRO_IMAGE_BY_PATTERN_KEY[key] ?? "/images/route/rt_MRT_111_010_111.png";
  }
  if (params.sourceId === "convenience-store" && key === "010_010_010") {
    return "/images/route/straight_v1_mart.png";
  }
  if (params.sourceId === "convenience-store" && key === "010_110_000") {
    return "/images/route/rt_store_010,110,000.jpg";
  }
  return undefined;
}

function resolveInventoryLegacyPlaceTileImagePath(params: {
  pattern: TilePattern3x3;
  sourceId?: PlaceTileId;
}) {
  const key = tilePatternKey(params.pattern);
  if (params.sourceId === "metro-station") {
    return INVENTORY_LEGACY_METRO_IMAGE_BY_PATTERN_KEY[key] ?? INVENTORY_ROUTE_IMAGE_BY_PATTERN_KEY[key];
  }
  if (params.sourceId === "convenience-store" && key === "010_010_010") {
    return "/images/route/straight_v1_mart.png";
  }
  if (params.sourceId === "convenience-store" && key === "010_110_000") {
    return "/images/route/rt_store_010,110,000.jpg";
  }
  return INVENTORY_ROUTE_IMAGE_BY_PATTERN_KEY[key];
}

function resolveInventoryPlaceTileImageFallbackPath(params: {
  pattern: TilePattern3x3;
  sourceId?: PlaceTileId;
}) {
  if (!params.sourceId || !INVENTORY_ROUTE_NEW_PLACE_SOURCE_IDS.has(params.sourceId)) return undefined;
  return resolveInventoryLegacyPlaceTileImagePath(params);
}

function hasInventoryPlaceTileEmbeddedIcon(params: {
  pattern: TilePattern3x3;
  sourceId?: PlaceTileId;
}) {
  return Boolean(params.sourceId && INVENTORY_ROUTE_NEW_PLACE_SOURCE_IDS.has(params.sourceId));
}

function resolveInventoryTileImagePath(params: {
  category: "place" | "route";
  pattern: TilePattern3x3;
  sourceId?: PlaceTileId;
}) {
  const key = tilePatternKey(params.pattern);
  if (params.category === "place") {
    const embeddedImagePath = resolveInventoryPlaceTileEmbeddedImagePath(params);
    if (embeddedImagePath) return embeddedImagePath;
  }
  return INVENTORY_ROUTE_IMAGE_BY_PATTERN_KEY[key];
}

export function GameSceneView({
  scene,
  workShiftCount = 0,
  onOffworkRewardOpenChange,
}: {
  scene: GameScene;
  workShiftCount?: number;
  onOffworkRewardOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamSignature = searchParams.toString();
  const {
    animation: backgroundShakeAnimation,
    effectNonce,
    activeEffectId,
  } = useBackgroundShake();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSceneMenuOpen, setIsSceneMenuOpen] = useState(false);
  const shouldShowOpeningCloudBurstOnEntry =
    scene.id === FIRST_SCENE_ID ||
    new URLSearchParams(searchParamSignature).get("openingCloud") === "1";
  const [isOpeningCloudBurstVisible, setIsOpeningCloudBurstVisible] = useState(
    shouldShowOpeningCloudBurstOnEntry,
  );
  const [dialogTypingMode, setDialogTypingMode] = useState<DialogTypingMode>(() => loadDialogTypingMode());
  const historyScenes = getChapterScenesUntilScene(scene);
  const historyLines = useMemo(
    () =>
      historyScenes.map((item) => ({
        id: item.id,
        speaker: item.characterName,
        text: item.dialogue,
      })),
    [historyScenes],
  );
  const isImageOnlyScene = scene.showDialogueUI === false;
  const isOffworkScene = scene.id === "scene-offwork";
  const isShreddedDocumentReturnHomeScene = scene.id === "scene-shred-return-home";
  const isWorkTransitionScene = isWorkTransitionSceneId(scene.id);
  const isStoryTaxiWorkScene = scene.id === "scene-36";
  const shouldShowNarrativeFocusLayer = false;
  const shouldUseNarrativePause = shouldUseNarrativePauseTyping(scene.narrativeMode);
  const [forcedWorkMinigameKind, setForcedWorkMinigameKind] = useState<WorkMinigameKind | null>(null);
  const [lockedDependentCoworkerRequest, setLockedDependentCoworkerRequest] =
    useState<DependentCoworkerRequestConfig | null>(null);
  const baseWorkMinigameKind =
    forcedWorkMinigameKind ?? getWorkMinigameKindForSceneId(scene.id, workShiftCount);
  const pendingDependentCoworkerRequest =
    ENABLE_DEPENDENT_COWORKER_REQUEST_WORK_FLOW && isWorkTransitionScene && !forcedWorkMinigameKind
      ? getDependentCoworkerRequestConfig(loadPlayerProgress())
      : null;
  const activeDependentCoworkerRequest =
    lockedDependentCoworkerRequest ?? pendingDependentCoworkerRequest;
  const workMinigameKind: WorkMinigameKind | null = activeDependentCoworkerRequest
    ? activeDependentCoworkerRequest.requestNumber === 1
      ? "cabinet-box-stack"
      : activeDependentCoworkerRequest.requestNumber === 3
        ? "document-color-sort"
        : "sticky-notes"
    : baseWorkMinigameKind;
  const activeWorkMinigameConfig: WorkMinigameConfig | null = activeDependentCoworkerRequest
    ? buildDependentCoworkerWorkConfig(activeDependentCoworkerRequest)
    : workMinigameKind
      ? WORK_MINIGAME_CONFIG[workMinigameKind]
      : null;
  const shouldOpenPlayableWorkMinigame =
    !isStoryTaxiWorkScene && Boolean(activeWorkMinigameConfig);
  const [isOffworkLabelVisible, setIsOffworkLabelVisible] = useState(isOffworkScene);
  const [isWorkMinigameOpen, setIsWorkMinigameOpen] = useState(false);
  const [isOffworkRewardOpen, setIsOffworkRewardOpen] = useState(false);
  const [offworkRouteRewardChoices, setOffworkRouteRewardChoices] = useState<OffworkRouteRewardOption[]>([]);
  const skippedOffworkRewardSceneRef = useRef<string | null>(null);
  const [isStoryDialogContinueReady, setIsStoryDialogContinueReady] = useState(false);
  const [isImageOnlyContinueReady, setIsImageOnlyContinueReady] = useState(false);
  const [isImageOnlyContinuePromptReady, setIsImageOnlyContinuePromptReady] = useState(false);
  const [isVisualNovelAlarmExitActive, setIsVisualNovelAlarmExitActive] = useState(false);
  const visualNovelAlarmExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storyComicTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const storyComicOverlayTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const previousStoryComicOverlaysRef = useRef<StoryComicOverlay[]>([]);
  const completedStoryComicOverlayIndexesRef = useRef<Set<number>>(new Set());
  const pendingFinalStoryComicOverlayCountRef = useRef(0);
  const sceneBackgroundRef = useRef<HTMLDivElement | null>(null);
  const [activeStoryComicId, setActiveStoryComicId] = useState<StoryComicId | null>(null);
  const [isStoryComicVisible, setIsStoryComicVisible] = useState(false);
  const [isStoryComicFading, setIsStoryComicFading] = useState(false);
  const [visibleStoryComicOverlayCount, setVisibleStoryComicOverlayCount] = useState(0);
  const visibleStoryComicOverlayCountRef = useRef(0);
  const [areStoryComicOverlaysComplete, setAreStoryComicOverlaysComplete] = useState(true);
  const [scenePhotoNaturalImageSize, setScenePhotoNaturalImageSize] = useState<NaturalImageSize | null>(
    null,
  );
  const [displayedBackgroundImage, setDisplayedBackgroundImage] = useState(scene.backgroundImage);
  const [backgroundOverlayFrameIndex, setBackgroundOverlayFrameIndex] = useState(0);
  const scene4ExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scene4ExitPhase, setScene4ExitPhase] = useState<Scene4ExitPhase>("idle");
  const scene5RevealTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [scene5OutfitRevealPhase, setScene5OutfitRevealPhase] =
    useState<Scene5OutfitRevealPhase>("hidden");
  const scene9RevealTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [scene9PuppetRevealPhase, setScene9PuppetRevealPhase] =
    useState<Scene9PuppetRevealPhase>("hidden");
  const scene10ExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scene10ExitPhase, setScene10ExitPhase] = useState<Scene10ExitPhase>("idle");
  const continueExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isContinueExitActive, setIsContinueExitActive] = useState(false);
  const scene14PuppetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scene14PuppetPhase, setScene14PuppetPhase] = useState<Scene14PuppetPhase>("hidden");
  const scene47RevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scene47RevealPhase, setScene47RevealPhase] = useState<Scene47RevealPhase>("dialog");
  const scene51BeigoRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scene51BeigoRevealPhase, setScene51BeigoRevealPhase] =
    useState<Scene51BeigoRevealPhase>("dialog");
  const comicCheatTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [activeComicCheatId, setActiveComicCheatId] = useState<ComicCheatId | null>(null);
  const [isComicCheatVisible, setIsComicCheatVisible] = useState(false);
  const [isComicCheatFading, setIsComicCheatFading] = useState(false);
  const diaryOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nightHubStreetUnlockGuideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workTransitionDoneRef = useRef(false);
  const [workPostMinigameStep, setWorkPostMinigameStep] = useState<WorkPostSuccessStep>(null);
  const [cabinetAftermathStep, setCabinetAftermathStep] = useState<CabinetAftermathStep>(null);
  const cabinetShredderSolvedRef = useRef(false);
  const [isOfficeSunbeastKoalaEventOpen, setIsOfficeSunbeastKoalaEventOpen] = useState(false);
  const officeSunbeastKoalaResumeRef = useRef<"post-minigame" | "next-scene">("post-minigame");
  const officeSunbeastKoalaDiaryContinueRef = useRef<(() => void) | null>(null);
  const [workLunchForgotBentoStep, setWorkLunchForgotBentoStep] =
    useState<WorkLunchForgotBentoStep>(null);
  const [isWorkLunchPreludePlaying, setIsWorkLunchPreludePlaying] = useState(false);
  const requestedWorkLunchSceneJumpStep =
    searchParams.get("frogJourney") === "work-lunch"
      ? getWorkLunchSceneJumpStep(searchParams.get("sceneStep"))
      : null;
  const requestedWorkLunchDialogueStep =
    requestedWorkLunchSceneJumpStep?.id === "route" ? null : requestedWorkLunchSceneJumpStep;
  const shouldPlayWorkLunchPrelude =
    isWorkTransitionScene &&
    workLunchForgotBentoStep === null &&
    !requestedWorkLunchDialogueStep &&
    (isWorkLunchPreludePlaying || shouldTriggerWorkLunchForgotBento(loadPlayerProgress()));
  const [isFrogDessertShopOffworkDialogActive, setIsFrogDessertShopOffworkDialogActive] =
    useState(false);
  const [frogDessertShopOffworkLineIndex, setFrogDessertShopOffworkLineIndex] = useState(0);
  const [workMinigameRewardSavingsTotal, setWorkMinigameRewardSavingsTotal] = useState<number | null>(null);
  const workSettlementAppliedRef = useRef(false);
  const [doorTransitionPhase, setDoorTransitionPhase] = useState<"closed-start" | "opened" | "closed-end">(
    "closed-end",
  );
  const [isDoorTransitionVisible, setIsDoorTransitionVisible] = useState(
    false,
  );
  const [doorSwipePhase, setDoorSwipePhase] = useState<DoorSwipePhase>("dialog");
  const [doorSwipeDragDistance, setDoorSwipeDragDistance] = useState(0);
  const doorSwipePointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const doorSwipeCompletedRef = useRef(false);
  const doorSwipePromptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doorSwipeAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [outgoingTransition, setOutgoingTransition] = useState<{
    preset: SceneTransitionPreset;
    durationMs: number;
    wakeCueText?: string;
  } | null>(null);
  const [incomingTransition, setIncomingTransition] = useState<{
    preset: SceneTransitionPreset;
    durationMs: number;
    wakeCueText?: string;
  } | null>(null);
  const [previewTransitionDurationMs, setPreviewTransitionDurationMs] = useState<number | null>(null);
  const [previewTransitionNonce, setPreviewTransitionNonce] = useState(0);
  const [scene44Step, setScene44Step] = useState<"intro" | "choose" | "qa" | "final">("intro");
  const [scene44Asked, setScene44Asked] = useState<{ metro: boolean; dog: boolean }>({
    metro: false,
    dog: false,
  });
  const [scene44Topic, setScene44Topic] = useState<"metro" | "dog" | null>(null);
  const [scene44QATurn, setScene44QATurn] = useState<0 | 1>(0);
  const [scene44FinalTurn, setScene44FinalTurn] = useState<0 | 1>(0);
  const [nightHubStep, setNightHubStep] = useState<"choose" | "chat-select" | "talk">("choose");
  const [nightHubAsked, setNightHubAsked] = useState<{ bai: boolean; beigo: boolean }>({
    bai: false,
    beigo: false,
  });
  const [nightHubTopic, setNightHubTopic] = useState<"bai" | "beigo" | null>(null);
  const [nightHubSunbeastFollowupIndex, setNightHubSunbeastFollowupIndex] = useState<number | null>(null);
  const [nightHubResourceInfo, setNightHubResourceInfo] = useState<"coins" | "fatigue" | null>(null);
  const [nightHubGuideStep, setNightHubGuideStep] = useState<NightHubGuideStep>(null);
  const [isGameLobbyGuideDismissed, setIsGameLobbyGuideDismissed] = useState(false);
  const [shouldPromptNightHubSleepAfterMission, setShouldPromptNightHubSleepAfterMission] = useState(false);
  const [isTrialCompletionThanksOpen, setIsTrialCompletionThanksOpen] = useState(false);
  const [isNightHubMode, setIsNightHubMode] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [weekendDestinationOptions, setWeekendDestinationOptions] = useState<WeekendDestinationOption[]>([]);
  const [weekendSelectedDestination, setWeekendSelectedDestination] = useState<WeekendDestinationOption | null>(null);
  const [endDaySequencePhase, setEndDaySequencePhase] = useState<"none" | "black" | "summary">("none");
  const [isEndDaySummaryLeaving, setIsEndDaySummaryLeaving] = useState(false);
  const [endDayTransitionText, setEndDayTransitionText] = useState<{
    toDayLabel: string;
    fromDateLabel: string;
    toDateLabel: string;
  } | null>(null);
  const [endDaySummaryContent, setEndDaySummaryContent] = useState<EndDaySummaryContent | null>(null);
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [diaryOverlayMode, setDiaryOverlayMode] = useState<DiaryOverlayMode>("default");
  const [pendingDiaryNextSceneId, setPendingDiaryNextSceneId] = useState<string | null>(null);
  const [pendingStoryChoiceNextSceneId, setPendingStoryChoiceNextSceneId] = useState<string | null>(null);
  const [completedStoryChoiceKeys, setCompletedStoryChoiceKeys] = useState<Record<string, boolean>>({});
  const [beigoObservationCompleted, setBeigoObservationCompleted] = useState<Record<BeigoObservationOptionId, boolean>>(
    createInitialBeigoObservationCompleted,
  );
  const [activeBeigoObservationOptionId, setActiveBeigoObservationOptionId] =
    useState<BeigoObservationOptionId | null>(null);
  const [activeBeigoObservationDialogueIndex, setActiveBeigoObservationDialogueIndex] = useState(0);
  const [unlockedDiaryEntryIds, setUnlockedDiaryEntryIds] = useState<string[]>([]);
  const [isNightHubPlaceMapOpen, setIsNightHubPlaceMapOpen] = useState(false);
  const [nightHubStreetUnlockGuideStep, setNightHubStreetUnlockGuideStep] =
    useState<
      | "unlocking-street"
      | "beigo-street"
      | "mai-street"
      | "beigo-shop"
      | "shop-condition"
      | null
    >(null);
  const [isNightHubMissionOpen, setIsNightHubMissionOpen] = useState(false);
  const [isNightHubMissionIntroOpen, setIsNightHubMissionIntroOpen] = useState(false);
  const [isRewardInventoryOpen, setIsRewardInventoryOpen] = useState(false);
  const [rewardInventoryTiles, setRewardInventoryTiles] = useState<RewardPlaceTile[]>([]);
  const [unlockFeedbackItems, setUnlockFeedbackItems] = useState<UnlockFeedbackItem[]>([]);
  const [isReturnHomeTransitionOpen, setIsReturnHomeTransitionOpen] = useState(false);
  const [isCharacterIntroOpen, setIsCharacterIntroOpen] = useState(false);
  const [characterIntroNonce, setCharacterIntroNonce] = useState(0);
  const [isCharacterIntroPending, setIsCharacterIntroPending] = useState(false);
  const [isScene68LocationDiscoveryVisible, setIsScene68LocationDiscoveryVisible] = useState(false);
  const transitionTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scriptedNextDayAppliedRef = useRef(false);
  const hasTriggeredCharacterIntroRef = useRef(false);
  const unlockFeedbackTimerRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!shouldShowOpeningCloudBurstOnEntry) {
      setIsOpeningCloudBurstVisible(false);
      return;
    }

    setIsOpeningCloudBurstVisible(true);
    const cloudBurstTimer = setTimeout(() => {
      setIsOpeningCloudBurstVisible(false);
    }, OPENING_CLOUD_BURST_DURATION_MS + 180);

    return () => {
      clearTimeout(cloudBurstTimer);
    };
  }, [scene.id, shouldShowOpeningCloudBurstOnEntry]);

  useEffect(() => {
    setLockedDependentCoworkerRequest(null);
    setIsOfficeSunbeastKoalaEventOpen(false);
    officeSunbeastKoalaResumeRef.current = "post-minigame";
    if (typeof window === "undefined") return;
    const forcedFromSearch = getForcedWorkMinigameKindFromSearch(window.location.search);
    const forcedFromStorage = normalizeForcedWorkMinigameKind(
      window.sessionStorage.getItem(WORK_MINIGAME_CHEAT_KIND_STORAGE_KEY),
    );
    if (forcedFromStorage) {
      window.sessionStorage.removeItem(WORK_MINIGAME_CHEAT_KIND_STORAGE_KEY);
    }
    const forcedKind = forcedFromStorage ?? forcedFromSearch;
    setForcedWorkMinigameKind(forcedKind);
    if (forcedKind && shouldDirectOpenWorkMinigameFromSearch(window.location.search)) {
      workTransitionDoneRef.current = false;
      setWorkPostMinigameStep(null);
      setCabinetAftermathStep(null);
      cabinetShredderSolvedRef.current = false;
      setWorkMinigameRewardSavingsTotal(null);
      setIsWorkMinigameOpen(true);
    }
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-98-work") {
      setWorkLunchForgotBentoStep(null);
      setIsWorkLunchPreludePlaying(false);
      return;
    }
    const progress = loadPlayerProgress();
    setWorkLunchForgotBentoStep(
      (requestedWorkLunchDialogueStep?.id as WorkLunchForgotBentoStep) ?? null,
    );
    setIsWorkLunchPreludePlaying(
      !requestedWorkLunchDialogueStep && shouldTriggerWorkLunchForgotBento(progress),
    );
  }, [requestedWorkLunchDialogueStep, scene.id, searchParamSignature]);

  useEffect(() => {
    const activeStep = getWorkLunchSceneJumpStep(workLunchForgotBentoStep);
    if (!activeStep) return;

    dispatchSceneJumpContextChange({
      optionId: WORK_LUNCH_SCENE_JUMP_OPTION_ID,
      kindLabel: activeStep.kindLabel,
      speaker: activeStep.speaker,
      text: activeStep.text,
      steps: WORK_LUNCH_SCENE_JUMP_STEPS,
      currentStepId: activeStep.id,
    });

    return () => {
      dispatchSceneJumpContextChange({ clear: true });
    };
  }, [workLunchForgotBentoStep]);

  useEffect(() => {
    if (!isOffworkScene) {
      setIsFrogDessertShopOffworkDialogActive(false);
      setFrogDessertShopOffworkLineIndex(0);
      return;
    }

    const progress = loadPlayerProgress();
    setIsFrogDessertShopOffworkDialogActive(shouldShowFrogDessertShopOffworkClue(progress));
    setFrogDessertShopOffworkLineIndex(0);
  }, [isOffworkScene, scene.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleWorkMinigameCheatTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<WorkMinigameCheatPayload>;
      const forcedKind = normalizeForcedWorkMinigameKind(customEvent.detail?.kind);
      if (!forcedKind) return;
      setForcedWorkMinigameKind(forcedKind);
      workTransitionDoneRef.current = false;
      setWorkPostMinigameStep(null);
      setWorkMinigameRewardSavingsTotal(null);
      setIsWorkMinigameOpen(true);
    };
    window.addEventListener(GAME_WORK_MINIGAME_CHEAT_TRIGGER, handleWorkMinigameCheatTrigger);
    return () => {
      window.removeEventListener(GAME_WORK_MINIGAME_CHEAT_TRIGGER, handleWorkMinigameCheatTrigger);
    };
  }, []);

  useEffect(() => {
    if (cabinetAftermathStep !== "scream") return;
    window.dispatchEvent(
      new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
        detail: { shakeId: "shake-strong" },
      }),
    );
  }, [cabinetAftermathStep]);

  const playStoryComic = (
    comicId: StoryComicId,
    timings: { fadeAtMs: number; hideAtMs: number },
  ) => {
    storyComicTimerRefs.current.forEach((timer) => clearTimeout(timer));
    storyComicTimerRefs.current = [];
    setActiveStoryComicId(comicId);
    setIsStoryComicVisible(true);
    setIsStoryComicFading(false);
    storyComicTimerRefs.current = [
      setTimeout(() => setIsStoryComicFading(true), timings.fadeAtMs),
      setTimeout(() => {
        setIsStoryComicVisible(false);
        setIsStoryComicFading(false);
        setActiveStoryComicId(null);
      }, timings.hideAtMs),
    ];
  };

  const grantWorkMinigameCoinReward = () => {
    const latestProgress = loadPlayerProgress();
    const nextProgress = {
      ...latestProgress,
      status: {
        ...latestProgress.status,
        savings: latestProgress.status.savings + WORK_MINIGAME_COIN_REWARD,
      },
    };
    savePlayerProgress(nextProgress);
    setWorkMinigameRewardSavingsTotal(nextProgress.status.savings);
  };

  const applyWorkSettlement = () => {
    if (workSettlementAppliedRef.current) return;
    workSettlementAppliedRef.current = true;
    recordWorkShiftResult(DEFAULT_WORK_TRANSITION_FATIGUE_INCREASE_TOTAL);
  };

  const pushUnlockFeedback = (items: UnlockFeedbackItem[]) => {
    if (items.length <= 0) return;
    setUnlockFeedbackItems((prev) => [...prev, ...items]);
    items.forEach((item) => {
      if (unlockFeedbackTimerRefs.current[item.id]) {
        clearTimeout(unlockFeedbackTimerRefs.current[item.id]);
      }
      unlockFeedbackTimerRefs.current[item.id] = setTimeout(() => {
        setUnlockFeedbackItems((prev) => prev.filter((entry) => entry.id !== item.id));
        delete unlockFeedbackTimerRefs.current[item.id];
      }, 2800);
    });
  };

  useEffect(() => {
    setIsScene68LocationDiscoveryVisible(false);
  }, [scene.id]);

  const groupedRewardInventory = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        label: string;
        category: "place" | "route";
        pattern: TilePattern3x3;
        count: number;
        sourceId?: PlaceTileId;
      }
    >();
    rewardInventoryTiles.forEach((tile) => {
      const labelPrefix = tile.label?.trim().length ? tile.label.trim() : tileSourceLabel(tile.sourceId);
      const key = `${tile.category}::${labelPrefix}::${tilePatternKey(tile.pattern)}`;
      const exists = map.get(key);
      if (exists) {
        exists.count += 1;
        return;
      }
      map.set(key, {
        key,
        label: labelPrefix,
        category: tile.category,
        pattern: tile.pattern,
        count: 1,
        sourceId: tile.sourceId,
      });
    });
    return Array.from(map.values());
  }, [rewardInventoryTiles]);

  const ownedPlaceGroups = useMemo(
    () => groupedRewardInventory.filter((item) => item.category === "place"),
    [groupedRewardInventory],
  );
  const ownedRouteGroups = useMemo(
    () => groupedRewardInventory.filter((item) => item.category === "route"),
    [groupedRewardInventory],
  );

  useLayoutEffect(() => {
    workTransitionDoneRef.current = false;
    workSettlementAppliedRef.current = false;
    scriptedNextDayAppliedRef.current = false;
    setWorkPostMinigameStep(null);
    setWorkMinigameRewardSavingsTotal(null);
    setOutgoingTransition(null);
    setIsVisualNovelAlarmExitActive(false);
    if (visualNovelAlarmExitTimerRef.current) {
      clearTimeout(visualNovelAlarmExitTimerRef.current);
      visualNovelAlarmExitTimerRef.current = null;
    }
    setEndDaySequencePhase("none");
    setIsEndDaySummaryLeaving(false);
    setEndDayTransitionText(null);
    setIsSceneMenuOpen(false);
    setIsNightHubMode(false);
    setIsGameLobbyGuideDismissed(false);
    transitionTimersRef.current.forEach((timer) => clearTimeout(timer));
    transitionTimersRef.current = [];
    setIncomingTransition(null);
    setIsReturnHomeTransitionOpen(false);
    setDoorSwipePhase("dialog");
    setDoorSwipeDragDistance(0);
    doorSwipePointerStartRef.current = null;
    doorSwipeCompletedRef.current = false;
    if (doorSwipePromptTimerRef.current) {
      clearTimeout(doorSwipePromptTimerRef.current);
      doorSwipePromptTimerRef.current = null;
    }
    if (doorSwipeAdvanceTimerRef.current) {
      clearTimeout(doorSwipeAdvanceTimerRef.current);
      doorSwipeAdvanceTimerRef.current = null;
    }

    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(SCENE_TRANSITION_STORAGE_KEY);
    if (!raw) return;

    try {
      const payload = JSON.parse(raw) as PendingSceneTransitionPayload;
      const isExpired = Date.now() - payload.createdAt > payload.durationMs + 800;
      if (payload.toSceneId !== scene.id || isExpired) {
        window.sessionStorage.removeItem(SCENE_TRANSITION_STORAGE_KEY);
        return;
      }
      window.sessionStorage.removeItem(SCENE_TRANSITION_STORAGE_KEY);
      const incomingDurationMs = getIncomingSceneTransitionDurationMs(payload.preset, payload.durationMs);
      setIncomingTransition({
        preset: payload.preset,
        durationMs: incomingDurationMs,
        wakeCueText: payload.wakeCueText,
      });
      const clearTimer = setTimeout(() => {
        setIncomingTransition(null);
      }, incomingDurationMs);
      transitionTimersRef.current.push(clearTimer);
    } catch {
      window.sessionStorage.removeItem(SCENE_TRANSITION_STORAGE_KEY);
    }
  }, [scene.id]);

  useEffect(() => {
    let cancelled = false;

    if (!scene.backgroundImage) {
      setDisplayedBackgroundImage(undefined);
      return;
    }

    const backgroundImages = [
      scene.backgroundImage,
      ...(scene.backgroundImage === BAI_ROOM_GLOW_1_BACKGROUND_IMAGE
        ? BAI_ROOM_GLOW_1_BACKGROUND_LAYERS.map((layer) => layer.image)
        : []),
    ];

    Promise.all(backgroundImages.map((url) => preloadGameImage(url).catch(() => undefined)))
      .finally(() => {
        if (!cancelled) setDisplayedBackgroundImage(scene.backgroundImage);
      });

    return () => {
      cancelled = true;
    };
  }, [scene.backgroundImage]);

  useEffect(() => {
    const animation = scene.backgroundOverlayAnimation;
    setBackgroundOverlayFrameIndex(0);
    if (!animation?.frameImages.length) return;

    animation.frameImages.forEach((url) => {
      void preloadGameImage(url).catch(() => undefined);
    });
    if (animation.frameImages.length <= 1) return;

    const interval = setInterval(() => {
      setBackgroundOverlayFrameIndex(
        (current) => (current + 1) % animation.frameImages.length,
      );
    }, animation.frameDurationMs ?? 520);
    return () => clearInterval(interval);
  }, [scene.backgroundOverlayAnimation, scene.id]);

  useEffect(() => {
    const preloadUrls = new Set<string>();
    if (scene.backgroundImage) preloadUrls.add(scene.backgroundImage);
    if (scene.backgroundImage === BAI_ROOM_GLOW_1_BACKGROUND_IMAGE) {
      BAI_ROOM_GLOW_1_BACKGROUND_LAYERS.forEach((layer) => preloadUrls.add(layer.image));
    }
    if (scene.characterAvatar) preloadUrls.add(scene.characterAvatar);
    if (scene.doorSwipeInteraction?.openImage) {
      preloadUrls.add(scene.doorSwipeInteraction.openImage);
    }
    scene.backgroundOverlayAnimation?.frameImages.forEach((url) => preloadUrls.add(url));

    const nextScene = scene.nextSceneId ? GAME_SCENES[scene.nextSceneId] : null;
    if (nextScene?.backgroundImage) preloadUrls.add(nextScene.backgroundImage);
    if (nextScene?.backgroundImage === BAI_ROOM_GLOW_1_BACKGROUND_IMAGE) {
      BAI_ROOM_GLOW_1_BACKGROUND_LAYERS.forEach((layer) => preloadUrls.add(layer.image));
    }
    if (nextScene?.characterAvatar) preloadUrls.add(nextScene.characterAvatar);
    nextScene?.backgroundOverlayAnimation?.frameImages.forEach((url) => preloadUrls.add(url));
    if (scene.scenePresentation === "beigo-reveal" || nextScene?.scenePresentation === "beigo-reveal") {
      BEIGO_REVEAL_SPECIAL_IMAGE_URLS.forEach((url) => preloadUrls.add(url));
    }

    preloadUrls.forEach((url) => {
      void preloadGameImage(url).catch(() => undefined);
    });
  }, [
    scene.backgroundImage,
    scene.backgroundOverlayAnimation,
    scene.characterAvatar,
    scene.doorSwipeInteraction?.openImage,
    scene.nextSceneId,
    scene.scenePresentation,
  ]);

  useEffect(() => {
    scene5RevealTimerRefs.current.forEach((timer) => clearTimeout(timer));
    scene5RevealTimerRefs.current = [];

    if (scene.scenePresentation !== "outfit-reveal") {
      setScene5OutfitRevealPhase("hidden");
      return () => {
        scene5RevealTimerRefs.current.forEach((timer) => clearTimeout(timer));
        scene5RevealTimerRefs.current = [];
      };
    }

    setScene5OutfitRevealPhase("hidden");
    scene5RevealTimerRefs.current = [
      setTimeout(() => {
        setScene5OutfitRevealPhase("modal-enter");
      }, 40),
      setTimeout(() => {
        setScene5OutfitRevealPhase("pose-rise");
      }, 260),
      setTimeout(() => {
        setScene5OutfitRevealPhase("modal-exit");
      }, 2080),
      setTimeout(() => {
        setScene5OutfitRevealPhase("dialog");
      }, 2460),
    ];

    return () => {
      scene5RevealTimerRefs.current.forEach((timer) => clearTimeout(timer));
      scene5RevealTimerRefs.current = [];
    };
  }, [scene.id, scene.scenePresentation]);

  useEffect(() => {
    setUnlockedDiaryEntryIds(loadPlayerProgress().unlockedDiaryEntryIds);
    const progress = loadPlayerProgress();
    setCurrentDay(Math.max(1, Math.floor(progress.currentDay || 1)));
    setWeekendDestinationOptions(buildWeekendDestinationOptions(progress));
    setWeekendSelectedDestination(null);
  }, [scene.id]);

  useEffect(() => {
    if (scene.characterName === "小麥") {
      setEncounteredCharacter("mai", true);
      return;
    }
    if (scene.characterName === "小白") {
      setEncounteredCharacter("bai", true);
      return;
    }
    if (scene.characterName === "小貝狗") {
      setEncounteredCharacter("beigo", true);
    }
  }, [scene.characterName, scene.id]);

  useEffect(() => {
    if (diaryOpenTimerRef.current) {
      clearTimeout(diaryOpenTimerRef.current);
      diaryOpenTimerRef.current = null;
    }
    if (nightHubStreetUnlockGuideTimerRef.current) {
      clearTimeout(nightHubStreetUnlockGuideTimerRef.current);
      nightHubStreetUnlockGuideTimerRef.current = null;
    }
    if (scene.id !== LEGACY_NIGHT_HUB_SCENE_ID) {
      setIsDiaryOpen(false);
      setDiaryOverlayMode("default");
      setPendingDiaryNextSceneId(null);
      setNightHubGuideStep(null);
      setNightHubStreetUnlockGuideStep(null);
      setIsNightHubMissionIntroOpen(false);
      setIsNightHubMissionOpen(false);
      setIsTrialCompletionThanksOpen(false);
      return;
    }
    // 保障 legacy 夜間 hub 線到達該節點時一定可看到第一篇解鎖日記。
    const shouldForceChapterCompletionGuide =
      searchParams.get("completionGuide") === "1" || searchParams.get("hubGuide") === "1";
    if (!shouldForceChapterCompletionGuide) {
      unlockDiaryEntry("bai-entry-1");
    }
    const latestProgress = shouldForceChapterCompletionGuide
      ? prepareChapterCompletionGuideFromSceneJump()
      : loadPlayerProgress();
    setUnlockedDiaryEntryIds(latestProgress.unlockedDiaryEntryIds);
    setIsNightHubMode(true);
    if (shouldForceChapterCompletionGuide) {
      setNightHubGuideStep(null);
    } else if (shouldShowFirstHomeHubFeatureGuide(latestProgress)) {
      setNightHubGuideStep("first-home-journal-pointer");
    } else if (shouldShowFrogReturnHomeDiaryGuide(latestProgress)) {
      setNightHubGuideStep("frog-return-home-diary-pointer");
    } else if (shouldShowFrogDiaryFragmentHubGuide(latestProgress)) {
      setNightHubGuideStep("frog-diary-pointer");
    } else if (shouldShowFrogDiarySleepGuide(latestProgress)) {
      setNightHubGuideStep("sleep-pointer");
    } else if (shouldShowFirstSunbeastNightHubGuide(latestProgress)) {
      setNightHubGuideStep("sunbeast-dialog");
    }
    if (
      latestProgress.hasCompletedStreetForgotLunchFrogEvent &&
      latestProgress.hasTriggeredOfficeSunbeastChickenEvent &&
      !latestProgress.hasSeenTrialCompletionThanks
    ) {
      setIsTrialCompletionThanksOpen(true);
    }
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== LEGACY_NIGHT_HUB_SCENE_ID) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const diaryParam = params.get("diary");
    if (diaryParam !== "1") return;
    const latestProgress = loadPlayerProgress();
    setUnlockedDiaryEntryIds(latestProgress.unlockedDiaryEntryIds);
    setDiaryOverlayMode(params.get("tab") === "sunbeast" ? "sunbeast" : "default");
    setIsDiaryOpen(true);
    setIsSceneMenuOpen(false);
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== LEGACY_QA_SCENE_ID) return;
    setScene44Step("intro");
    setScene44Asked({ metro: false, dog: false });
    setScene44Topic(null);
    setScene44QATurn(0);
    setScene44FinalTurn(0);
  }, [scene.id]);

  useEffect(() => {
    if (scene51BeigoRevealTimerRef.current) {
      clearTimeout(scene51BeigoRevealTimerRef.current);
      scene51BeigoRevealTimerRef.current = null;
    }
    if (scene.scenePresentation !== "beigo-reveal") {
      setScene51BeigoRevealPhase("dialog");
      return;
    }
    setScene51BeigoRevealPhase("revealing");
    scene51BeigoRevealTimerRef.current = setTimeout(() => {
      setScene51BeigoRevealPhase("dialog");
      scene51BeigoRevealTimerRef.current = null;
    }, 1500);
    return () => {
      if (scene51BeigoRevealTimerRef.current) {
        clearTimeout(scene51BeigoRevealTimerRef.current);
        scene51BeigoRevealTimerRef.current = null;
      }
    };
  }, [scene.id, scene.scenePresentation]);

  useEffect(() => {
    if (scene47RevealTimerRef.current) {
      clearTimeout(scene47RevealTimerRef.current);
      scene47RevealTimerRef.current = null;
    }
    if (scene.id !== "scene-47") {
      setScene47RevealPhase("dialog");
      return;
    }
    setScene47RevealPhase("revealing");
    scene47RevealTimerRef.current = setTimeout(() => {
      setScene47RevealPhase("dialog");
      scene47RevealTimerRef.current = null;
    }, 1380);
    return () => {
      if (scene47RevealTimerRef.current) {
        clearTimeout(scene47RevealTimerRef.current);
        scene47RevealTimerRef.current = null;
      }
    };
  }, [scene.id]);

  useEffect(() => {
    const characterIntro = CHARACTER_INTRO_BY_SCENE_ID[scene.id];
    if (!characterIntro) {
      setIsCharacterIntroOpen(false);
      setIsCharacterIntroPending(false);
      hasTriggeredCharacterIntroRef.current = false;
      return;
    }
    if (hasTriggeredCharacterIntroRef.current) return;
    hasTriggeredCharacterIntroRef.current = true;
    if (scene.autoOpenCharacterIntro) {
      setIsCharacterIntroPending(false);
      setIsCharacterIntroOpen(true);
      setCharacterIntroNonce((prev) => prev + 1);
      return;
    }
    setIsCharacterIntroPending(true);
  }, [scene.id]);

  const handleCloseCharacterIntro = () => {
    setIsCharacterIntroOpen(false);
    setIsCharacterIntroPending(false);
    if (scene.advanceAfterCharacterIntro && scene.nextSceneId) {
      router.push(withTrialProfileSearch(ROUTES.gameScene(scene.nextSceneId)));
    }
  };

  useEffect(() => {
    if (!isCharacterIntroOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      event.preventDefault();
      handleCloseCharacterIntro();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCharacterIntroOpen, scene.advanceAfterCharacterIntro, scene.nextSceneId]);

  useEffect(() => {
    if (scene.id !== LEGACY_NIGHT_HUB_SCENE_ID || !isNightHubMode) return;
    if (nightHubSunbeastFollowupIndex !== null) return;
    if (nightHubGuideStep !== null) return;
    setNightHubStep("choose");
    setNightHubAsked({ bai: false, beigo: false });
    setNightHubTopic(null);
  }, [scene.id, isNightHubMode, nightHubGuideStep, nightHubSunbeastFollowupIndex]);

  useEffect(() => {
    const isDoorTransitionScene =
      scene.id === "scene-40" ||
      scene.id === FIRST_FROG_RETURN_HOME_DOOR_SCENE_ID;
    if (!isDoorTransitionScene) {
      setDoorTransitionPhase("closed-end");
      setIsDoorTransitionVisible(false);
      return;
    }
    setDoorTransitionPhase("closed-start");
    setIsDoorTransitionVisible(true);
    const openDoorTimer = setTimeout(() => {
      setDoorTransitionPhase("opened");
    }, 180);
    const closeDoorTimer = setTimeout(() => {
      setDoorTransitionPhase("closed-end");
    }, 420);
    return () => {
      clearTimeout(openDoorTimer);
      clearTimeout(closeDoorTimer);
    };
  }, [scene.id]);

  useEffect(() => {
    return () => {
      transitionTimersRef.current.forEach((timer) => clearTimeout(timer));
      transitionTimersRef.current = [];
      if (visualNovelAlarmExitTimerRef.current) {
        clearTimeout(visualNovelAlarmExitTimerRef.current);
        visualNovelAlarmExitTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleTransitionPreview = (event: Event) => {
      const customEvent = event as CustomEvent<SceneTransitionPayload>;
      const preset = customEvent.detail?.preset;
      if (preset !== "fade-black") return;
      const durationMs = customEvent.detail?.durationMs ?? 380;
      setPreviewTransitionDurationMs(durationMs);
      setPreviewTransitionNonce((prev) => prev + 1);
      const clearTimer = setTimeout(() => {
        setPreviewTransitionDurationMs(null);
      }, durationMs * 2 + 40);
      transitionTimersRef.current.push(clearTimer);
    };
    window.addEventListener(GAME_SCENE_TRANSITION_TRIGGER, handleTransitionPreview);
    return () => {
      window.removeEventListener(GAME_SCENE_TRANSITION_TRIGGER, handleTransitionPreview);
    };
  }, []);

  useEffect(() => {
    if (isWorkTransitionScene) return;
    if (!scene.autoAdvanceMs || !scene.nextSceneId) return;
    const timer = setTimeout(() => {
      if (scene.continueExitMotionId) {
        setIsContinueExitActive(true);
        const durationMs =
          scene.continueExitDurationMs ?? AVATAR_MOTION_DURATION_MS[scene.continueExitMotionId] ?? 420;
        continueExitTimerRef.current = setTimeout(() => {
          router.push(withTrialProfileSearch(ROUTES.gameScene(scene.nextSceneId!)));
        }, durationMs);
        return;
      }
      router.push(withTrialProfileSearch(ROUTES.gameScene(scene.nextSceneId!)));
    }, scene.autoAdvanceMs);
    return () => {
      clearTimeout(timer);
      if (continueExitTimerRef.current) {
        clearTimeout(continueExitTimerRef.current);
        continueExitTimerRef.current = null;
      }
    };
  }, [
    isWorkTransitionScene,
    router,
    scene.autoAdvanceMs,
    scene.continueExitDurationMs,
    scene.continueExitMotionId,
    scene.nextSceneId,
  ]);

  useEffect(() => {
    setIsImageOnlyContinueReady(false);
    if (!isImageOnlyScene || !scene.nextSceneId || scene.imageOnlyContinueDelayMs === undefined) {
      return;
    }
    const timer = setTimeout(() => {
      setIsImageOnlyContinueReady(true);
    }, Math.max(0, scene.imageOnlyContinueDelayMs));
    return () => clearTimeout(timer);
  }, [isImageOnlyScene, scene.id, scene.imageOnlyContinueDelayMs, scene.nextSceneId]);

  useEffect(() => {
    setIsImageOnlyContinuePromptReady(false);
    if (!isImageOnlyScene || !scene.imageOnlyContinuePrompt) {
      return;
    }
    const delayMs =
      scene.imageOnlyContinuePromptDelayMs ?? scene.imageOnlyContinueDelayMs ?? 0;
    const timer = setTimeout(() => {
      setIsImageOnlyContinuePromptReady(true);
    }, Math.max(0, delayMs));
    return () => clearTimeout(timer);
  }, [
    isImageOnlyScene,
    scene.id,
    scene.imageOnlyContinueDelayMs,
    scene.imageOnlyContinuePrompt,
    scene.imageOnlyContinuePromptDelayMs,
  ]);

  useEffect(() => {
    if (!isOffworkRewardOpen) {
      setIsRewardInventoryOpen(false);
      return;
    }
    if (isRewardInventoryOpen) {
      setRewardInventoryTiles(buildRewardInventoryTiles(loadPlayerProgress()));
    }
  }, [isOffworkRewardOpen, isRewardInventoryOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleTypingModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ mode?: DialogTypingMode }>;
      if (!customEvent.detail?.mode) return;
      setDialogTypingMode(customEvent.detail.mode);
    };
    window.addEventListener(GAME_DIALOG_TYPING_MODE_CHANGE, handleTypingModeChange);
    return () => {
      window.removeEventListener(GAME_DIALOG_TYPING_MODE_CHANGE, handleTypingModeChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleComicCheat = (event: Event) => {
      const customEvent = event as CustomEvent<{ comicId?: ComicCheatId }>;
      const comicId = customEvent.detail?.comicId;
      if (!comicId || !(comicId in COMIC_IMAGE_BY_ID)) return;
      comicCheatTimerRefs.current.forEach((timer) => clearTimeout(timer));
      comicCheatTimerRefs.current = [];
      setActiveComicCheatId(comicId);
      setIsComicCheatVisible(true);
      setIsComicCheatFading(false);
      comicCheatTimerRefs.current = [
        setTimeout(() => setIsComicCheatFading(true), 980),
        setTimeout(() => {
          setIsComicCheatVisible(false);
          setIsComicCheatFading(false);
          setActiveComicCheatId(null);
        }, 1360),
      ];
    };
    window.addEventListener(GAME_COMIC_CHEAT_TRIGGER, handleComicCheat);
    return () => {
      window.removeEventListener(GAME_COMIC_CHEAT_TRIGGER, handleComicCheat);
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(unlockFeedbackTimerRefs.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (!isOffworkScene) {
      setIsOffworkLabelVisible(false);
      setIsOffworkRewardOpen(false);
      setOffworkRouteRewardChoices([]);
      setIsReturnHomeTransitionOpen(false);
      skippedOffworkRewardSceneRef.current = null;
      return;
    }

    setIsOffworkLabelVisible(true);
    setIsOffworkRewardOpen(false);
    setOffworkRouteRewardChoices([]);
    setIsReturnHomeTransitionOpen(false);

    const labelTimer = setTimeout(() => {
      setIsOffworkLabelVisible(false);
    }, 900);
    const progress = loadPlayerProgress();
    if (shouldShowFrogDessertShopOffworkClue(progress)) {
      return () => {
        clearTimeout(labelTimer);
      };
    }

    const returnHomeTimer = setTimeout(() => {
      if (skippedOffworkRewardSceneRef.current !== scene.id) {
        skipOffworkRewardCycle();
        skippedOffworkRewardSceneRef.current = scene.id;
      }
      const latestProgress = loadPlayerProgress();
      if (
        ENABLE_NIGHT_HUB_GUIDANCE_SYSTEM &&
        hasCollectedFirstSunbeast(latestProgress) &&
        !latestProgress.hasSeenFirstSunbeastNightHubGuideV3
      ) {
        savePlayerProgress({
          ...latestProgress,
          hasPendingFirstSunbeastNightHubGuide: true,
        });
      }
      setIsReturnHomeTransitionOpen(true);
    }, 1200);

    return () => {
      clearTimeout(labelTimer);
      clearTimeout(returnHomeTimer);
    };
  }, [isOffworkScene, scene.id]);

  useEffect(() => {
    onOffworkRewardOpenChange?.(isOffworkRewardOpen);
    return () => onOffworkRewardOpenChange?.(false);
  }, [isOffworkRewardOpen, onOffworkRewardOpenChange]);

  useEffect(() => {
    if (scene.id !== "scene-7") return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // 跌倒演出：先慌張擔心，再倒地消失爬起，最後停在痛。
    timers.push(
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(GAME_AVATAR_EXPRESSION_TRIGGER, { detail: { frameIndex: 13 } }),
        );
      }, 320),
    );
    timers.push(
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(GAME_AVATAR_MOTION_TRIGGER, {
            detail: { motionId: "fall-left-recover" },
          }),
        );
        window.dispatchEvent(
          new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
            detail: { shakeId: "shake-strong" },
          }),
        );
      }, 560),
    );
    // 爬起後切到痛（index 10）。
    timers.push(
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(GAME_AVATAR_EXPRESSION_TRIGGER, { detail: { frameIndex: 10 } }),
        );
      }, 1380),
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [scene.id]);

  useEffect(() => {
    scene9RevealTimerRefs.current.forEach((timer) => clearTimeout(timer));
    scene9RevealTimerRefs.current = [];

    if (scene.id !== "scene-9") {
      setScene9PuppetRevealPhase("hidden");
      return;
    }

    setScene9PuppetRevealPhase("hidden");
    scene9RevealTimerRefs.current = [
      setTimeout(() => {
        setScene9PuppetRevealPhase("prop");
      }, 120),
      setTimeout(() => {
        setScene9PuppetRevealPhase("dialog");
      }, 560),
    ];

    return () => {
      scene9RevealTimerRefs.current.forEach((timer) => clearTimeout(timer));
      scene9RevealTimerRefs.current = [];
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-85" || !scene.backgroundImage) {
      setScenePhotoNaturalImageSize(null);
      return;
    }
    const image = new Image();
    image.src = scene.backgroundImage;
    image.onload = () => {
      setScenePhotoNaturalImageSize({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
  }, [scene.backgroundImage, scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-30") return;
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
          detail: { shakeId: "shake-weak" },
        }),
      );
    }, 80);
    return () => {
      clearTimeout(timer);
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-75") return;
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
          detail: { shakeId: "shake-weak" },
        }),
      );
    }, 60);
    return () => {
      clearTimeout(timer);
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-shred-metro-brake") return;
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
          detail: { shakeId: "shake-weak" },
        }),
      );
    }, 60);
    return () => {
      clearTimeout(timer);
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-43" && scene.id !== "scene-49b") return;
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
          detail: { shakeId: "shake-weak" },
        }),
      );
    }, 60);
    return () => {
      clearTimeout(timer);
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-84") return;
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
          detail: { shakeId: "flash-white" },
        }),
      );
    }, 60);
    return () => {
      clearTimeout(timer);
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene.id === BEIGO_OBSERVATION_SCENE_ID) return;
    setBeigoObservationCompleted(createInitialBeigoObservationCompleted());
    setActiveBeigoObservationOptionId(null);
    setActiveBeigoObservationDialogueIndex(0);
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-64") return;
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
          detail: { shakeId: "shake-weak" },
        }),
      );
    }, 60);
    return () => {
      clearTimeout(timer);
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene10ExitTimerRef.current) {
      clearTimeout(scene10ExitTimerRef.current);
      scene10ExitTimerRef.current = null;
    }
    setScene10ExitPhase("idle");
  }, [scene.id]);

  useEffect(() => {
    if (scene14PuppetTimerRef.current) {
      clearTimeout(scene14PuppetTimerRef.current);
      scene14PuppetTimerRef.current = null;
    }
    setScene14PuppetPhase("hidden");
  }, [scene.id]);

  useEffect(() => {
    storyComicTimerRefs.current.forEach((timer) => clearTimeout(timer));
    storyComicTimerRefs.current = [];
    setActiveStoryComicId(null);
    setIsStoryComicVisible(false);
    setIsStoryComicFading(false);
    setScene4ExitPhase("idle");
    if (scene4ExitTimerRef.current) {
      clearTimeout(scene4ExitTimerRef.current);
      scene4ExitTimerRef.current = null;
    }
    comicCheatTimerRefs.current.forEach((timer) => clearTimeout(timer));
    comicCheatTimerRefs.current = [];
    setActiveComicCheatId(null);
    setIsComicCheatVisible(false);
    setIsComicCheatFading(false);
    setIsContinueExitActive(false);
    setIsStoryDialogContinueReady(false);
    if (continueExitTimerRef.current) {
      clearTimeout(continueExitTimerRef.current);
      continueExitTimerRef.current = null;
    }
  }, [scene.id]);

  useLayoutEffect(() => {
    storyComicOverlayTimerRefs.current.forEach((timer) => clearTimeout(timer));
    storyComicOverlayTimerRefs.current = [];
    completedStoryComicOverlayIndexesRef.current = new Set();
    const previousOverlays = previousStoryComicOverlaysRef.current ?? [];
    const nextOverlays = scene.storyComicOverlays ?? [];

    let preservedCount = 0;
    while (
      preservedCount < previousOverlays.length &&
      preservedCount < nextOverlays.length &&
      areStoryComicOverlaysEquivalent(previousOverlays[preservedCount], nextOverlays[preservedCount])
    ) {
      preservedCount += 1;
    }

    preservedCount = Math.min(preservedCount, visibleStoryComicOverlayCountRef.current);
    visibleStoryComicOverlayCountRef.current = preservedCount;
    setVisibleStoryComicOverlayCount(preservedCount);
    previousStoryComicOverlaysRef.current = nextOverlays;

    if (nextOverlays.length === 0) {
      pendingFinalStoryComicOverlayCountRef.current = 0;
      setAreStoryComicOverlaysComplete(true);
      return;
    }

    pendingFinalStoryComicOverlayCountRef.current = nextOverlays.filter(
      (overlay) => getStoryComicOverlaySequenceFrameIds(overlay).length > 0,
    ).length;
    setAreStoryComicOverlaysComplete(pendingFinalStoryComicOverlayCountRef.current === 0);

    if (pendingFinalStoryComicOverlayCountRef.current > 0) {
      const maxSequenceMs = Math.max(
        ...nextOverlays
          .filter((overlay) => getStoryComicOverlaySequenceFrameIds(overlay).length > 0)
          .map(
            (overlay) =>
              (overlay.enterDelayMs ?? 0) +
              (overlay.enterDurationMs ?? 360) +
              (overlay.finalDelayAfterEnterMs ?? 0) +
              Math.max(
                0,
                getStoryComicOverlaySequenceFrameIds(overlay).length - 1,
              ) *
                (overlay.sequenceFrameIntervalMs ?? 220) +
              (overlay.finalFadeDurationMs ?? 240),
          ),
      );
      storyComicOverlayTimerRefs.current.push(
        setTimeout(() => {
          setAreStoryComicOverlaysComplete(true);
        }, maxSequenceMs + 900),
      );
    }

    let immediatelyVisibleCount = preservedCount;
    nextOverlays.forEach((overlay, index) => {
      if (index < preservedCount) return;
      const enterDelayMs = overlay.enterDelayMs ?? 0;
      if (enterDelayMs <= 0) {
        immediatelyVisibleCount = Math.max(immediatelyVisibleCount, index + 1);
        return;
      }
      storyComicOverlayTimerRefs.current.push(
        setTimeout(() => {
          setVisibleStoryComicOverlayCount((current) => {
            const nextCount = Math.max(current, index + 1);
            visibleStoryComicOverlayCountRef.current = nextCount;
            return nextCount;
          });
        }, enterDelayMs),
      );
    });
    if (immediatelyVisibleCount !== preservedCount) {
      visibleStoryComicOverlayCountRef.current = immediatelyVisibleCount;
      setVisibleStoryComicOverlayCount(immediatelyVisibleCount);
    }

    return () => {
      storyComicOverlayTimerRefs.current.forEach((timer) => clearTimeout(timer));
      storyComicOverlayTimerRefs.current = [];
    };
  }, [scene.id, scene.storyComicOverlays]);

  const handleStoryComicOverlaySequenceComplete = useCallback((index: number) => {
    const overlay = scene.storyComicOverlays?.[index];
    if (!overlay || getStoryComicOverlaySequenceFrameIds(overlay).length === 0) {
      return;
    }
    if (completedStoryComicOverlayIndexesRef.current.has(index)) {
      return;
    }
    completedStoryComicOverlayIndexesRef.current.add(index);
    if (completedStoryComicOverlayIndexesRef.current.size >= pendingFinalStoryComicOverlayCountRef.current) {
      setAreStoryComicOverlaysComplete(true);
    }
  }, [scene.storyComicOverlays]);

  useEffect(() => {
    return () => {
      storyComicTimerRefs.current.forEach((timer) => clearTimeout(timer));
      storyComicOverlayTimerRefs.current.forEach((timer) => clearTimeout(timer));
      if (scene4ExitTimerRef.current) clearTimeout(scene4ExitTimerRef.current);
      comicCheatTimerRefs.current.forEach((timer) => clearTimeout(timer));
      if (continueExitTimerRef.current) {
        clearTimeout(continueExitTimerRef.current);
        continueExitTimerRef.current = null;
      }
      if (scene51BeigoRevealTimerRef.current) {
        clearTimeout(scene51BeigoRevealTimerRef.current);
        scene51BeigoRevealTimerRef.current = null;
      }
      if (diaryOpenTimerRef.current) {
        clearTimeout(diaryOpenTimerRef.current);
        diaryOpenTimerRef.current = null;
      }
      if (doorSwipePromptTimerRef.current) {
        clearTimeout(doorSwipePromptTimerRef.current);
        doorSwipePromptTimerRef.current = null;
      }
      if (doorSwipeAdvanceTimerRef.current) {
        clearTimeout(doorSwipeAdvanceTimerRef.current);
        doorSwipeAdvanceTimerRef.current = null;
      }
    };
  }, []);

  const claimOffworkRouteReward = (reward: OffworkRouteRewardOption) => {
    claimOffworkRewardBatch([
      {
        tileId: reward.sourceId,
        rewardPattern: reward.pattern,
        options: {
          category: "place",
          label: tileSourceLabel(reward.sourceId),
        },
      },
    ]);
    const latestProgress = loadPlayerProgress();
    if (
      ENABLE_NIGHT_HUB_GUIDANCE_SYSTEM &&
      hasCollectedFirstSunbeast(latestProgress) &&
      !latestProgress.hasSeenFirstSunbeastNightHubGuideV3
    ) {
      savePlayerProgress({
        ...latestProgress,
        hasPendingFirstSunbeastNightHubGuide: true,
      });
    }
    setIsOffworkRewardOpen(false);
    setIsReturnHomeTransitionOpen(true);
  };

  const startSceneTransition = (
    nextSceneId: string,
    preset: SceneTransitionPreset = "fade-black",
    durationMs = 420,
    wakeCueText?: string,
  ) => {
    if (outgoingTransition) return;
    setOutgoingTransition({ preset, durationMs, wakeCueText });

    if (typeof window !== "undefined") {
      const payload: PendingSceneTransitionPayload = {
        toSceneId: nextSceneId,
        preset,
        durationMs,
        wakeCueText,
        createdAt: Date.now(),
      };
      window.sessionStorage.setItem(SCENE_TRANSITION_STORAGE_KEY, JSON.stringify(payload));
    }

    const pushTimer = setTimeout(() => {
      router.push(withTrialProfileSearch(ROUTES.gameScene(nextSceneId)));
    }, durationMs);
    transitionTimersRef.current.push(pushTimer);
  };

  const startPathTransition = (
    nextPath: string,
    preset: SceneTransitionPreset = "fade-black",
    durationMs = 420,
  ) => {
    if (outgoingTransition) return;
    setOutgoingTransition({ preset, durationMs });
    const pushTimer = setTimeout(() => {
      router.push(withTrialProfileSearch(nextPath));
    }, durationMs);
    transitionTimersRef.current.push(pushTimer);
  };

  const handleWorkLunchForgotBentoContinue = () => {
    if (workLunchForgotBentoStep === "noon") {
      setWorkLunchForgotBentoStep("forgot");
      return;
    }
    if (workLunchForgotBentoStep === "forgot") {
      setWorkLunchForgotBentoStep("beigo-worry");
      return;
    }
    if (workLunchForgotBentoStep === "beigo-worry") {
      setWorkLunchForgotBentoStep("depart");
      return;
    }
    if (workLunchForgotBentoStep === "depart") {
      setWorkLunchForgotBentoStep("beigo-cheer");
      return;
    }
    if (workLunchForgotBentoStep === "beigo-cheer") {
      startPathTransition(
        `${ROUTES.gameArrangeRoute}?storyRoute=work-lunch-convenience`,
        "fade-black",
        420,
      );
    }
  };

  const activeDoorSwipeInteraction = scene.doorSwipeInteraction;
  const isDoorSwipeInteractionVisible =
    Boolean(activeDoorSwipeInteraction) && doorSwipePhase !== "dialog";
  const doorSwipeProgress =
    doorSwipePhase === "opened"
      ? 1
      : Math.min(1, doorSwipeDragDistance / DOOR_SWIPE_THRESHOLD_PX);

  const revealDoorSwipePrompt = useCallback(() => {
    if (!activeDoorSwipeInteraction || doorSwipePhase !== "dialog") return;
    if (doorSwipePromptTimerRef.current) {
      clearTimeout(doorSwipePromptTimerRef.current);
      doorSwipePromptTimerRef.current = null;
    }
    setDoorSwipeDragDistance(0);
    setDoorSwipePhase("prompt");
  }, [activeDoorSwipeInteraction, doorSwipePhase]);

  const scheduleDoorSwipePrompt = useCallback(() => {
    if (!activeDoorSwipeInteraction || doorSwipePhase !== "dialog") return;
    if (doorSwipePromptTimerRef.current) {
      clearTimeout(doorSwipePromptTimerRef.current);
    }
    doorSwipePromptTimerRef.current = setTimeout(() => {
      doorSwipePromptTimerRef.current = null;
      setDoorSwipeDragDistance(0);
      setDoorSwipePhase("prompt");
    }, activeDoorSwipeInteraction.promptDelayMs ?? 520);
  }, [activeDoorSwipeInteraction, doorSwipePhase]);

  const completeDoorSwipe = useCallback(() => {
    if (!activeDoorSwipeInteraction || !scene.nextSceneId || doorSwipeCompletedRef.current) {
      return;
    }
    doorSwipeCompletedRef.current = true;
    setDoorSwipeDragDistance(DOOR_SWIPE_THRESHOLD_PX);
    setDoorSwipePhase("opened");
    if (doorSwipeAdvanceTimerRef.current) {
      clearTimeout(doorSwipeAdvanceTimerRef.current);
    }
    doorSwipeAdvanceTimerRef.current = setTimeout(() => {
      router.push(withTrialProfileSearch(ROUTES.gameScene(scene.nextSceneId!)));
      doorSwipeAdvanceTimerRef.current = null;
    }, activeDoorSwipeInteraction.advanceDelayMs ?? 560);
  }, [activeDoorSwipeInteraction, router, scene.nextSceneId]);

  const handleDoorSwipePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!activeDoorSwipeInteraction || doorSwipePhase !== "prompt") return;
      event.preventDefault();
      doorSwipePointerStartRef.current = { x: event.clientX, y: event.clientY };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [activeDoorSwipeInteraction, doorSwipePhase],
  );

  const handleDoorSwipePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!activeDoorSwipeInteraction || doorSwipePhase !== "prompt") return;
      const start = doorSwipePointerStartRef.current;
      if (!start) return;
      event.preventDefault();
      const nextDistance = Math.min(
        DOOR_SWIPE_MAX_DISTANCE_PX,
        Math.max(0, start.x - event.clientX),
      );
      setDoorSwipeDragDistance(nextDistance);
    },
    [activeDoorSwipeInteraction, doorSwipePhase],
  );

  const handleDoorSwipePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!activeDoorSwipeInteraction || doorSwipePhase !== "prompt") return;
      const start = doorSwipePointerStartRef.current;
      if (!start) return;
      const finalDistance = Math.min(
        DOOR_SWIPE_MAX_DISTANCE_PX,
        Math.max(0, start.x - event.clientX),
      );
      doorSwipePointerStartRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      if (finalDistance >= DOOR_SWIPE_THRESHOLD_PX) {
        completeDoorSwipe();
        return;
      }
      setDoorSwipeDragDistance(0);
    },
    [activeDoorSwipeInteraction, completeDoorSwipe, doorSwipePhase],
  );

  const handleDoorSwipeKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!activeDoorSwipeInteraction || doorSwipePhase !== "prompt") return;
      if (event.key !== "ArrowLeft" && event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      completeDoorSwipe();
    },
    [activeDoorSwipeInteraction, completeDoorSwipe, doorSwipePhase],
  );

  const handleStoryRequestNext = (nextSceneId: string) => {
    if (scene.storyComicOverlays?.length && !areStoryComicOverlaysReady) {
      return;
    }
    if (CHARACTER_INTRO_BY_SCENE_ID[scene.id] && isCharacterIntroPending) {
      setIsCharacterIntroOpen(true);
      setCharacterIntroNonce((prev) => prev + 1);
      return;
    }
    if (scene.id === LEGACY_ROUTE_TUTORIAL_SCENE_ID) {
      router.push(withTrialProfileSearch(`${ROUTES.gameArrangeRoute}?storyRoute=simple-metro`));
      return;
    }
    if (scene.id === "scene-68a") {
      if (ENABLE_LOCATION_DISCOVERY_BANNER && !isScene68LocationDiscoveryVisible) {
        setIsScene68LocationDiscoveryVisible(true);
        return;
      }
      startPathTransition(`${ROUTES.gameArrangeRoute}?storyRoute=simple-metro`, "fade-black", 420);
      return;
    }
    if (scene.id === "scene-88") {
      unlockDiaryEntry("bai-entry-1");
      markDiaryFirstRevealSeen();
      setUnlockedDiaryEntryIds(loadPlayerProgress().unlockedDiaryEntryIds);
      setDiaryOverlayMode("first-photo-diary-reveal");
      setPendingDiaryNextSceneId("scene-97");
      setIsDiaryOpen(true);
      return;
    }
    if (scene.id === LEGACY_NIGHT_HUB_SCENE_ID) {
      const latestProgress = loadPlayerProgress();
      setIsNightHubMode(true);
      if (shouldShowFirstHomeHubFeatureGuide(latestProgress)) {
        setNightHubGuideStep("first-home-journal-pointer");
      } else if (shouldShowFrogReturnHomeDiaryGuide(latestProgress)) {
        setNightHubGuideStep("frog-return-home-diary-pointer");
      } else if (shouldShowFrogDiaryFragmentHubGuide(latestProgress)) {
        setNightHubGuideStep("frog-diary-pointer");
      } else if (shouldShowFrogDiarySleepGuide(latestProgress)) {
        setNightHubGuideStep("sleep-pointer");
      } else if (shouldShowFirstSunbeastNightHubGuide(latestProgress)) {
        setNightHubGuideStep("sunbeast-dialog");
      }
      return;
    }
    if (scene.scenePresentation === "visual-novel-alarm") {
      if (isVisualNovelAlarmExitActive) return;
      setIsVisualNovelAlarmExitActive(true);
      visualNovelAlarmExitTimerRef.current = setTimeout(() => {
        router.push(withTrialProfileSearch(ROUTES.gameScene(nextSceneId)));
        visualNovelAlarmExitTimerRef.current = null;
      }, VISUAL_NOVEL_ALARM_EXIT_DURATION_MS);
      return;
    }
    if (scene.id === "scene-4d") {
      if (scene4ExitPhase === "avatar-exit") return;
      setScene4ExitPhase("avatar-exit");
      scene4ExitTimerRef.current = setTimeout(() => {
        router.push(withTrialProfileSearch(ROUTES.gameScene(nextSceneId)));
        scene4ExitTimerRef.current = null;
      }, 680);
      return;
    }
    if (scene.id === "scene-5") {
      if (scene5OutfitRevealPhase === "avatar-exit") return;
      setScene5OutfitRevealPhase("avatar-exit");
      scene5RevealTimerRefs.current.push(
        setTimeout(() => {
          router.push(withTrialProfileSearch(ROUTES.gameScene(nextSceneId)));
        }, 420),
      );
      return;
    }
    if (scene.id === "scene-10a") {
      if (scene10ExitPhase === "exiting") return;
      setScene10ExitPhase("exiting");
      scene10ExitTimerRef.current = setTimeout(() => {
        router.push(withTrialProfileSearch(ROUTES.gameScene(nextSceneId)));
      }, 420);
      return;
    }
    if (activeDoorSwipeInteraction) {
      revealDoorSwipePrompt();
      return;
    }
    if (scene.continueExitMotionId) {
      if (isContinueExitActive) return;
      setIsContinueExitActive(true);
      const durationMs =
        scene.continueExitDurationMs ?? AVATAR_MOTION_DURATION_MS[scene.continueExitMotionId] ?? 420;
      continueExitTimerRef.current = setTimeout(() => {
        router.push(withTrialProfileSearch(ROUTES.gameScene(nextSceneId)));
      }, durationMs);
      return;
    }
    if (scene.id === "scene-shred-home-lights-off" && !scriptedNextDayAppliedRef.current) {
      scriptedNextDayAppliedRef.current = true;
      const latestProgress = loadPlayerProgress();
      const currentDay = Math.max(1, Math.floor(latestProgress.currentDay || 1));
      savePlayerProgress({
        ...latestProgress,
        currentDay: currentDay + 1,
        status: {
          ...latestProgress.status,
          fatigue: Math.max(0, latestProgress.status.fatigue - 20),
          actionPower: Math.max(0, Math.min(6, latestProgress.status.actionPower + 1)),
        },
      });
      rolloverDailyEventFlags();
    }
    const transition = scene.nextSceneTransition;
    if (!transition) {
      router.push(withTrialProfileSearch(ROUTES.gameScene(nextSceneId)));
      return;
    }
    const durationMs =
      transition.durationMs ??
      (transition.preset === "sleep-wake-cue"
        ? 1400
        : transition.preset === "mai-sleep"
          ? 2200
          : transition.preset === "next-day"
            ? 920
            : 420);
    startSceneTransition(nextSceneId, transition.preset, durationMs, transition.wakeCueText);
  };

  const handleStoryChoiceSelect = (choice: StoryChoice) => {
    if (choice.action === "open-beigo-profile") {
      setPendingStoryChoiceNextSceneId(null);
      setDiaryOverlayMode("beigo-profile");
      setIsDiaryOpen(true);
      setIsSceneMenuOpen(false);
      return;
    }
    if (choice.action === "open-fragmented-diary") {
      setPendingStoryChoiceNextSceneId(choice.nextSceneId ?? null);
      setDiaryOverlayMode("fragmented-diary");
      setIsDiaryOpen(true);
      setIsSceneMenuOpen(false);
      return;
    }
    if (choice.nextSceneId) {
      handleStoryRequestNext(choice.nextSceneId);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(searchParamSignature);
    const beigoObservationParam = params.get("beigoObservation");
    if (scene.id === BEIGO_OBSERVATION_SCENE_ID && isBeigoObservationOptionId(beigoObservationParam)) {
      setBeigoObservationCompleted({
        sleepingBai: beigoObservationParam === "sleepingBai" || beigoObservationParam === "diary",
        beigo: beigoObservationParam === "beigo" || beigoObservationParam === "diary",
        diary: false,
      });
      setActiveBeigoObservationOptionId(beigoObservationParam);
      setActiveBeigoObservationDialogueIndex(0);
      setIsDiaryOpen(false);
      setDiaryOverlayMode("default");
      setPendingStoryChoiceNextSceneId(null);
      setIsSceneMenuOpen(false);
      return;
    }

  }, [scene.id, searchParamSignature]);

  const handleBeigoObservationSelect = (optionId: BeigoObservationOptionId) => {
    setBeigoObservationCompleted((prev) => ({
      ...prev,
      [optionId]: true,
    }));
    setActiveBeigoObservationOptionId(optionId);
    setActiveBeigoObservationDialogueIndex(0);
  };

  const handleBeigoObservationContinue = () => {
    if (activeBeigoObservationOptionId === "diary") {
      const dialogueSequence = BEIGO_OBSERVATION_RESULT_BY_ID.diary.dialogueSequence ?? [];
      if (activeBeigoObservationDialogueIndex < dialogueSequence.length - 1) {
        setActiveBeigoObservationDialogueIndex((index) => index + 1);
        return;
      }
      setActiveBeigoObservationOptionId(null);
      setActiveBeigoObservationDialogueIndex(0);
      setPendingStoryChoiceNextSceneId("scene-61");
      setDiaryOverlayMode("fragmented-diary");
      setIsDiaryOpen(true);
      setIsSceneMenuOpen(false);
      return;
    }
    setActiveBeigoObservationOptionId(null);
    setActiveBeigoObservationDialogueIndex(0);
  };

  const isScene44Interactive = scene.id === LEGACY_QA_SCENE_ID;
  const isNightHubScene = scene.id === LEGACY_NIGHT_HUB_SCENE_ID;
  const nightHubProgress = isNightHubScene ? loadPlayerProgress() : null;
  const nightHubPlaceUnlockSnapshot = nightHubProgress
    ? getPlaceUnlockSnapshot(nightHubProgress)
    : null;
  const hasCollectedFirstSunbeastForNightHub = nightHubProgress
    ? hasCollectedFirstSunbeast(nightHubProgress)
    : false;
  const shouldStartFirstSunbeastNightHubGuide = nightHubProgress
    ? shouldShowFirstSunbeastNightHubGuide(nightHubProgress)
    : false;
  const shouldStartFirstHomeHubFeatureGuide = nightHubProgress
    ? shouldShowFirstHomeHubFeatureGuide(nightHubProgress)
    : false;
  const shouldStartFrogDiaryFragmentHubGuide = nightHubProgress
    ? shouldShowFrogDiaryFragmentHubGuide(nightHubProgress)
    : false;
  const shouldStartFrogDiarySleepGuide = nightHubProgress
    ? shouldShowFrogDiarySleepGuide(nightHubProgress)
    : false;
  const shouldStartFrogReturnHomeDiaryGuide = nightHubProgress
    ? shouldShowFrogReturnHomeDiaryGuide(nightHubProgress)
    : false;
  const effectiveNightHubGuideStep: NightHubGuideStep =
    nightHubGuideStep ??
    (shouldStartFirstHomeHubFeatureGuide
      ? "first-home-journal-pointer"
      : shouldStartFrogReturnHomeDiaryGuide
        ? "frog-return-home-diary-pointer"
      : shouldStartFrogDiaryFragmentHubGuide
        ? "frog-diary-pointer"
        : shouldStartFrogDiarySleepGuide
          ? "sleep-pointer"
          : ENABLE_NIGHT_HUB_GUIDANCE_SYSTEM && shouldStartFirstSunbeastNightHubGuide
            ? "sunbeast-dialog"
            : null);
  const isNightHubInteractive = isNightHubScene;
  const isMorningHubInteractive = scene.id === "scene-morning-hub";
  const hasStoryComicOverlays = Boolean(scene.storyComicOverlays?.length);
  const areStoryComicOverlaysReady =
    !hasStoryComicOverlays ||
    (visibleStoryComicOverlayCount >= (scene.storyComicOverlays?.length ?? 0) &&
      areStoryComicOverlaysComplete);
  const shouldShowStandardStoryContinueAction =
    scene.id === "scene-4d"
      ? scene4ExitPhase === "idle"
      : scene.id === "scene-5"
        ? scene5OutfitRevealPhase === "dialog"
      : scene.id === "scene-9"
        ? scene9PuppetRevealPhase === "dialog"
        : scene.id === "scene-10a"
        ? scene10ExitPhase !== "exiting"
        : activeDoorSwipeInteraction
          ? false
        : !areStoryComicOverlaysReady
          ? false
        : isContinueExitActive
          ? false
        : scene.autoAdvanceMs
          ? false
        : true;
  const getAfterOffworkRewardSceneId = () => {
    const latestProgress = loadPlayerProgress();
    if (shouldShowFirstFrogReturnHomeScene(latestProgress)) {
      return FIRST_FROG_RETURN_HOME_SCENE_ID;
    }
    return LEGACY_NIGHT_HUB_SCENE_ID;
  };
  const isScene44InnerThought =
    scene.id === LEGACY_QA_SCENE_ID && (scene44Step === "intro" || scene44Step === "choose");
  const isInnerThoughtScene = isScene44InnerThought || scene.isInnerThought === true;
  const allScene44Asked = scene44Asked.metro && scene44Asked.dog;
  const scene44QAPack = {
    metro: {
      question: "早上怎麼知道小日獸會出現在捷運站",
      answer:
        "一整晚很擔心的待在小白旁邊，忽然感覺到一股能量，感應到那邊有我最熟悉的小日獸",
    },
    dog: {
      question: "黃金獵犬拍攝到後回到日記上？",
      answer: "對是直太郎，他最親近了",
    },
  } as const;
  const scene44FinalPack = {
    question: "那交換日記跟小白昏迷的關係嗎",
    answer: "突然有股能量將我和小日獸從日記中擠出來，那些日記片段也都消失了",
  } as const;
  const scene44Speaker =
    scene44Step === "intro"
      ? "小麥（心裡話）"
      : scene44Step === "choose"
        ? "小麥（心裡話）"
        : scene44Step === "qa"
          ? scene44QATurn === 0
            ? "小麥"
            : "小貝狗"
          : scene44FinalTurn === 0
            ? "小麥"
            : "小貝狗";
  const scene44Text =
    scene44Step === "intro"
      ? scene.dialogue
      : scene44Step === "choose"
        ? allScene44Asked
          ? "線索都問到了，最後再確認一件事..."
          : "先問問小貝狗，釐清目前的線索。"
        : scene44Step === "qa"
          ? scene44Topic
            ? scene44QATurn === 0
              ? scene44QAPack[scene44Topic].question
              : scene44QAPack[scene44Topic].answer
            : ""
          : scene44FinalTurn === 0
            ? scene44FinalPack.question
            : scene44FinalPack.answer;

  const nightHubSpeaker =
    nightHubStep === "talk" ? (nightHubTopic === "beigo" ? "小貝狗" : "小麥") : "小麥";
  const nightHubText =
    nightHubStep === "choose"
      ? "要做什麼呢？"
      : nightHubStep === "chat-select"
        ? "想先和誰聊聊呢？"
      : nightHubTopic === "bai"
        ? "先去門口看了一下，小白房間還是安安靜靜的……先讓她休息吧。"
        : "我會陪著妳，我們明天再一起找線索，嗷。";
  const nightHubResourceInfoContent =
    nightHubResourceInfo === "coins"
      ? { title: "金幣", description: "可以購買已解鎖的地點的拼圖" }
      : nightHubResourceInfo === "fatigue"
        ? { title: "疲勞", description: "要注意健康，太疲勞會生病" }
        : null;
  const nightHubSunbeastFollowupLines = [
    {
      speaker: "小麥",
      text: "原來不只直太郎……現在連街道也解鎖了，其他小日獸怎麼出現，好像也開始有方向了。",
      spriteId: "mai" as const,
      frameIndex: 0,
    },
    {
      speaker: "小貝狗",
      text: "嗷，線索都浮上來了！只要照著那些條件繼續遇到牠們，消失的日記內容說不定就會一點一點回來。",
      spriteId: "beigo" as const,
      frameIndex: 1,
    },
    {
      speaker: "小麥",
      text: "那我們就繼續去找牠們吧。把小日獸一隻一隻遇回來，看看能不能把日記慢慢復原。",
      spriteId: "mai" as const,
      frameIndex: 1,
    },
  ] as const;
  const activeNightHubSunbeastFollowupLine =
    nightHubSunbeastFollowupIndex !== null
      ? nightHubSunbeastFollowupLines[nightHubSunbeastFollowupIndex]
      : null;
  const firstHomeHubGuideBubbles = {
    "first-home-journal-pointer": {
      text: "日記可以查看交換日記，也能找到小日獸的線索。",
      right: "94px",
      bottom: "178px",
      maxW: "230px",
      arrowRight: "-7px",
      arrowTop: "50%",
      arrowTransform: "translateY(-50%) rotate(45deg)",
    },
    "first-home-sunbeast-pointer": {
      text: "小日獸裡可以查看直太郎，還有日記裡出現過的相關小日獸線索。",
      right: "94px",
      bottom: "88px",
      maxW: "238px",
      arrowRight: "-7px",
      arrowTop: "50%",
      arrowTransform: "translateY(-50%) rotate(45deg)",
    },
    "first-home-sleep-pointer": {
      text: "睡覺來休息一下，準備明天的行程吧。",
      left: "88px",
      bottom: "112px",
      maxW: "212px",
      arrowLeft: "-7px",
      arrowTop: "calc(100% - 22px)",
      arrowTransform: "rotate(45deg)",
    },
  } as const;
  const activeFirstHomeHubGuideBubble =
    effectiveNightHubGuideStep === "first-home-journal-pointer" ||
    effectiveNightHubGuideStep === "first-home-sunbeast-pointer" ||
    effectiveNightHubGuideStep === "first-home-sleep-pointer"
      ? firstHomeHubGuideBubbles[effectiveNightHubGuideStep]
      : null;
  const isFirstHomeHubGuideStep = activeFirstHomeHubGuideBubble !== null;
  const shouldHideNightHubIconsForGuide = effectiveNightHubGuideStep === "sunbeast-dialog";
  const shouldShowNightHubJournalPointer =
    effectiveNightHubGuideStep === "frog-return-home-diary-pointer" ||
    effectiveNightHubGuideStep === "frog-diary-pointer" ||
    effectiveNightHubGuideStep === "first-home-journal-pointer";
  const shouldShowNightHubSunbeastPointer =
    effectiveNightHubGuideStep === "sunbeast-pointer" ||
    effectiveNightHubGuideStep === "first-home-sunbeast-pointer";
  const shouldShowNightHubPlacePointer = effectiveNightHubGuideStep === "place-pointer";
  const shouldShowNightHubMissionPointer = effectiveNightHubGuideStep === "mission-pointer";
  const shouldShowNightHubSleepPointer =
    effectiveNightHubGuideStep === "sleep-pointer" ||
    effectiveNightHubGuideStep === "first-home-sleep-pointer";
  const shouldFocusNightHubJournalButton = shouldShowNightHubJournalPointer;
  const shouldFocusNightHubSunbeastButton = shouldShowNightHubSunbeastPointer;
  const shouldFocusNightHubPlaceButton = shouldShowNightHubPlacePointer;
  const shouldFocusNightHubMissionButton = shouldShowNightHubMissionPointer;
  const shouldFocusNightHubSleepButton = shouldShowNightHubSleepPointer;
  const shouldFocusNightHubIconRail =
    shouldFocusNightHubJournalButton ||
    shouldFocusNightHubSunbeastButton ||
    shouldFocusNightHubPlaceButton ||
    shouldFocusNightHubMissionButton;
  const shouldBlockNightHubIconRail = shouldFocusNightHubSunbeastButton || isFirstHomeHubGuideStep;
  const shouldBlockNightHubSleepButton = isFirstHomeHubGuideStep;
  const shouldShowNightHubDiaryNewBadge = Boolean(
    nightHubProgress && shouldShowFrogReturnHomeDiaryGuide(nightHubProgress),
  );
  const shouldShowNightHubBaiRoomOption = Boolean(
    nightHubProgress?.hasCompletedStreetForgotLunchFrogEvent && !nightHubAsked.bai,
  );
  const shouldForceChapterCompletionGuide =
    isNightHubScene &&
    (searchParams.get("completionGuide") === "1" || searchParams.get("hubGuide") === "1");
  const shouldShowNightHubLobbyGuide = Boolean(
    isNightHubScene &&
      isNightHubMode &&
      !isFirstHomeHubGuideStep &&
      !isGameLobbyGuideDismissed &&
      (shouldForceChapterCompletionGuide ||
        (nightHubProgress && !nightHubProgress.hasSeenGameLobbyGuide)),
  );
  const shouldShowNightHubMission =
    ENABLE_NIGHT_HUB_GUIDANCE_SYSTEM &&
    (Boolean(nightHubProgress?.ownedPlaceTileIds.includes("street")) ||
      Boolean(nightHubProgress && hasFirstStreetRewardPatterns(nightHubProgress.rewardPlaceTiles)) ||
      Boolean((nightHubProgress?.streetPassCount ?? 0) > 0));
  const isNightHubMissionPanelOpen = isNightHubMissionOpen;

  const handleNightHubSelectTopic = (topic: "bai" | "beigo") => {
    setNightHubGuideStep(null);
    setNightHubTopic(topic);
    setNightHubStep("talk");
  };

  const handleNightHubBackToMenu = () => {
    setNightHubStep("choose");
    setNightHubTopic(null);
  };

  const handleOpenDiary = (entry: "journal" | "sunbeast" = "journal") => {
    if (isFirstHomeHubGuideStep) return;
    setNightHubGuideStep(null);
    const latestProgress = loadPlayerProgress();
    const latestUnlocked = latestProgress.unlockedDiaryEntryIds;
    setUnlockedDiaryEntryIds(latestUnlocked);
    if (
      scene.id === LEGACY_NIGHT_HUB_SCENE_ID &&
      entry === "journal" &&
      shouldShowFrogReturnHomeDiaryGuide(latestProgress)
    ) {
      setDiaryOverlayMode("frog-return-home-diary-guide");
    } else if (
      scene.id === LEGACY_NIGHT_HUB_SCENE_ID &&
      entry === "journal" &&
      shouldShowFrogDiaryFragmentHubGuide(latestProgress)
    ) {
      clearFrogDiaryFragmentHubGuide();
      setDiaryOverlayMode("frog-diary-catalog-guide");
    } else if (scene.id === LEGACY_NIGHT_HUB_SCENE_ID && !hasCollectedFirstSunbeast(latestProgress)) {
      setDiaryOverlayMode("sunbeast-reveal");
    } else if (entry === "sunbeast") {
      setDiaryOverlayMode("sunbeast");
    } else {
      setDiaryOverlayMode("default");
    }
    setIsDiaryOpen(true);
    setIsSceneMenuOpen(false);
  };

  const unlockStreetFromNightHubGuide = () => {
    const current = loadPlayerProgress();
    if (hasFirstStreetRewardPatterns(current.rewardPlaceTiles)) return current;
    const nextStreetTiles: RewardPlaceTile[] = FIRST_STREET_REWARD_PATTERNS.filter(
      (pattern) =>
        !current.rewardPlaceTiles.some(
          (tile) =>
            tile.category === "place" &&
            tile.sourceId === "street" &&
            tilePatternKey(tile.pattern) === tilePatternKey(pattern),
        ),
    ).map((pattern, index) => ({
      instanceId: `street-night-hub-${tilePatternKey(pattern)}-${index}`,
      sourceId: "street",
      category: "place",
      label: FIRST_STREET_REWARD_LABELS[index] ?? `街道 ${index + 1}`,
      centerEmoji: "💡",
      pattern,
    }));
    const next = {
      ...current,
      ownedPlaceTileIds: current.ownedPlaceTileIds.includes("street")
        ? current.ownedPlaceTileIds
        : [...current.ownedPlaceTileIds, "street" as PlaceTileId],
      rewardPlaceTiles: [...current.rewardPlaceTiles, ...nextStreetTiles],
    };
    savePlayerProgress(next);
    return next;
  };

  const handleOpenPlaceMap = () => {
    if (!ENABLE_NIGHT_HUB_GUIDANCE_SYSTEM) return;
    const shouldPlayStreetUnlockGuide =
      effectiveNightHubGuideStep === "place-pointer" &&
      hasCollectedFirstSunbeast(loadPlayerProgress());
    if (shouldPlayStreetUnlockGuide) {
      unlockStreetFromNightHubGuide();
      setNightHubStreetUnlockGuideStep("unlocking-street");
      if (nightHubStreetUnlockGuideTimerRef.current) {
        clearTimeout(nightHubStreetUnlockGuideTimerRef.current);
      }
      nightHubStreetUnlockGuideTimerRef.current = setTimeout(() => {
        setNightHubStreetUnlockGuideStep("beigo-street");
        nightHubStreetUnlockGuideTimerRef.current = null;
      }, 980);
    }
    setNightHubGuideStep(null);
    setIsNightHubPlaceMapOpen(true);
    setIsSceneMenuOpen(false);
  };

  const handleNightHubStreetUnlockGuideContinue = () => {
    if (nightHubStreetUnlockGuideStep === "beigo-street") {
      setNightHubStreetUnlockGuideStep("mai-street");
      return;
    }
    if (nightHubStreetUnlockGuideStep === "mai-street") {
      setNightHubStreetUnlockGuideStep("beigo-shop");
      return;
    }
    if (nightHubStreetUnlockGuideStep === "beigo-shop") {
      setNightHubStreetUnlockGuideStep("shop-condition");
      return;
    }
    if (nightHubStreetUnlockGuideStep === "shop-condition") {
      setIsNightHubPlaceMapOpen(false);
      setNightHubStreetUnlockGuideStep(null);
      setNightHubGuideStep("mission-pointer");
      return;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_SEEN_KEY, "1");
    }
    setNightHubStreetUnlockGuideStep(null);
  };

  const handleCloseNightHubMission = () => {
    setIsNightHubMissionOpen(false);
    setIsNightHubMissionIntroOpen(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_SEEN_KEY, "1");
    }
    if (shouldPromptNightHubSleepAfterMission) {
      setNightHubGuideStep("sleep-pointer");
      setShouldPromptNightHubSleepAfterMission(false);
    } else {
      setNightHubGuideStep((prev) => (prev === "mission-pointer" ? null : prev));
    }
    setNightHubStreetUnlockGuideStep(null);
  };

  const handleOpenNightHubMission = () => {
    if (!shouldShowNightHubMission) return;
    if (effectiveNightHubGuideStep === "mission-pointer") {
      setIsNightHubMissionIntroOpen(true);
      setNightHubGuideStep(null);
      setShouldPromptNightHubSleepAfterMission(true);
    } else {
      setIsNightHubMissionOpen(true);
      setShouldPromptNightHubSleepAfterMission(false);
    }
    setIsSceneMenuOpen(false);
  };

  const handleOpenGameLobby = () => {
    markGameLobbyGuideSeen();
    setIsGameLobbyGuideDismissed(true);
    setNightHubGuideStep(null);
    setShouldPromptNightHubSleepAfterMission(false);
    setIsSceneMenuOpen(false);
    startPathTransition(ROUTES.gameLobby, "fade-black", 360);
  };

  const handleNightHubMissionIntroContinue = () => {
    setIsNightHubMissionIntroOpen(false);
    if (shouldPromptNightHubSleepAfterMission) {
      setIsNightHubMissionOpen(false);
      setNightHubGuideStep("sleep-pointer");
      setShouldPromptNightHubSleepAfterMission(false);
      return;
    }
    setIsNightHubMissionOpen(true);
  };

  const handleNightHubContinue = () => {
    if (nightHubStep !== "talk" || !nightHubTopic) return;
    setNightHubAsked((prev) => ({ ...prev, [nightHubTopic]: true }));
    setNightHubStep("choose");
    setNightHubTopic(null);
  };

  const handleNightHubSunbeastFollowupContinue = () => {
    if (nightHubSunbeastFollowupIndex === null) return;
    if (nightHubSunbeastFollowupIndex >= nightHubSunbeastFollowupLines.length - 1) {
      setNightHubSunbeastFollowupIndex(null);
      setNightHubStep("choose");
      return;
    }
    setNightHubSunbeastFollowupIndex((prev) => (prev === null ? prev : prev + 1));
  };

  const handleNightHubGuideContinue = () => {
    if (effectiveNightHubGuideStep === "first-home-journal-pointer") {
      setNightHubGuideStep("first-home-sunbeast-pointer");
      setIsNightHubMode(true);
      setNightHubStep("choose");
      setNightHubTopic(null);
      return;
    }
    if (effectiveNightHubGuideStep === "first-home-sunbeast-pointer") {
      setNightHubGuideStep("first-home-sleep-pointer");
      setIsNightHubMode(true);
      setNightHubStep("choose");
      setNightHubTopic(null);
      return;
    }
    if (effectiveNightHubGuideStep === "first-home-sleep-pointer") {
      markFirstHomeHubFeatureGuideSeen();
      const latestProgress = loadPlayerProgress();
      if (shouldShowFrogReturnHomeDiaryGuide(latestProgress)) {
        setNightHubGuideStep("frog-return-home-diary-pointer");
      } else if (shouldShowFrogDiaryFragmentHubGuide(latestProgress)) {
        setNightHubGuideStep("frog-diary-pointer");
      } else if (shouldShowFrogDiarySleepGuide(latestProgress)) {
        setNightHubGuideStep("sleep-pointer");
      } else if (shouldShowFirstSunbeastNightHubGuide(latestProgress)) {
        setNightHubGuideStep("sunbeast-dialog");
      } else {
        setNightHubGuideStep(null);
      }
      setIsNightHubMode(true);
      setNightHubStep("choose");
      setNightHubTopic(null);
      return;
    }
    if (effectiveNightHubGuideStep !== "sunbeast-dialog") return;
    const latestProgress = loadPlayerProgress();
    if (shouldShowFirstSunbeastNightHubGuide(latestProgress)) {
      savePlayerProgress({
        ...latestProgress,
        hasSeenFirstSunbeastNightHubGuide: true,
        hasSeenFirstSunbeastNightHubGuideV2: true,
        hasSeenFirstSunbeastNightHubGuideV3: true,
        hasPendingFirstSunbeastNightHubGuide: false,
      });
    }
    setNightHubGuideStep("sunbeast-pointer");
    setIsNightHubMode(true);
    setNightHubStep("choose");
    setNightHubTopic(null);
  };

  const handleTrialCompletionThanksClose = () => {
    const latestProgress = loadPlayerProgress();
    if (!latestProgress.hasSeenTrialCompletionThanks) {
      savePlayerProgress({
        ...latestProgress,
        hasSeenTrialCompletionThanks: true,
      });
    }
    setIsTrialCompletionThanksOpen(false);
  };

  const advanceToNextDay = (summaryOverride?: EndDaySummaryContent) => {
    if (endDaySequencePhase !== "none") return;
    const latestProgress = loadPlayerProgress();
    const currentDay = Math.max(1, Math.floor(latestProgress.currentDay || 1));
    const nextDay = currentDay + 1;
    savePlayerProgress({
      ...latestProgress,
      currentDay: nextDay,
      status: {
        ...latestProgress.status,
        fatigue: Math.max(0, latestProgress.status.fatigue - 20),
        actionPower: Math.max(0, Math.min(6, latestProgress.status.actionPower + 1)),
      },
    });
    rolloverDailyEventFlags();
    setCurrentDay(nextDay);
    setWeekendDestinationOptions(buildWeekendDestinationOptions(loadPlayerProgress()));
    setWeekendSelectedDestination(null);
    setEndDayTransitionText({
      toDayLabel: `第${nextDay}天`,
      fromDateLabel: formatInGameDateLabel(currentDay),
      toDateLabel: formatInGameDateLabel(nextDay),
    });
    setEndDaySummaryContent(
      summaryOverride ?? {
        title: "今天先告一段落",
        body: "回到家後好好休息了一下，把今天的疲累慢慢放下，準備迎接明天。",
        chips: ["疲勞 -20", "行動力 +1"],
      },
    );

    setIsEndDaySummaryLeaving(false);
    setEndDaySequencePhase("summary");
    const leaveSummaryTimer = setTimeout(() => {
      setIsEndDaySummaryLeaving(true);
    }, 2100);
    const showDay2Timer = setTimeout(() => {
      setEndDaySequencePhase("black");
      setIsEndDaySummaryLeaving(false);
    }, 2520);
    const nextMorningTimer = setTimeout(() => {
      if (scene.id === "scene-morning-hub") {
        setEndDaySequencePhase("none");
        setIsEndDaySummaryLeaving(false);
        setEndDayTransitionText(null);
        setEndDaySummaryContent(null);
        return;
      }
      router.push(withTrialProfileSearch(ROUTES.gameScene("scene-morning-hub")));
    }, 4300);
    transitionTimersRef.current.push(leaveSummaryTimer, showDay2Timer, nextMorningTimer);
  };

  const handleNightHubSleep = () => {
    if (isFirstHomeHubGuideStep) return;
    setNightHubGuideStep(null);
    setShouldPromptNightHubSleepAfterMission(false);
    clearFrogDiarySleepGuide();
    advanceToNextDay();
  };

  const handleWeekendDestinationSelect = (destination: WeekendDestinationOption) => {
    const latestProgress = loadPlayerProgress();
    const nextStatus = destination.applyStatus(latestProgress.status);
    savePlayerProgress({
      ...latestProgress,
      status: nextStatus,
    });
    setWeekendSelectedDestination(destination);
  };

  const handleWeekendEndDay = () => {
    if (!weekendSelectedDestination) return;
    advanceToNextDay({
      title: `${weekendSelectedDestination.title}的小旅行結束了`,
      body: weekendSelectedDestination.resultText,
      chips: [weekendSelectedDestination.effectLabel, "今晚早點休息"],
    });
  };

  const handleScene44Continue = () => {
    if (scene44Step === "intro") {
      setScene44Step("choose");
      return;
    }
    if (scene44Step === "qa") {
      if (scene44QATurn === 0) {
        setScene44QATurn(1);
        return;
      }
      if (scene44Topic) {
        setScene44Asked((prev) => ({ ...prev, [scene44Topic]: true }));
      }
      if (allScene44Asked || (scene44Topic === "metro" && scene44Asked.dog) || (scene44Topic === "dog" && scene44Asked.metro)) {
        setScene44Step("final");
        setScene44FinalTurn(0);
        return;
      }
      setScene44Step("choose");
      setScene44Topic(null);
      setScene44QATurn(0);
      return;
    }
    if (scene44Step === "final") {
      if (scene44FinalTurn === 0) {
        setScene44FinalTurn(1);
        return;
      }
      router.push(withTrialProfileSearch(ROUTES.gameScene("scene-45")));
    }
  };

  const handleScene44SelectTopic = (topic: "metro" | "dog") => {
    setScene44Topic(topic);
    setScene44QATurn(0);
    setScene44Step("qa");
  };
  const isWeekendMorningHub = isMorningHubInteractive && isWeekendInGameDay(currentDay);
  const isScene5OutfitReveal = scene.scenePresentation === "outfit-reveal";
  const shouldShowScene5OutfitRevealOverlay =
    isScene5OutfitReveal &&
    (scene5OutfitRevealPhase === "modal-enter" ||
      scene5OutfitRevealPhase === "pose-rise" ||
      scene5OutfitRevealPhase === "modal-exit");
  const isScene47Revealing = scene.id === "scene-47" && scene47RevealPhase === "revealing";
  const isScene51BeigoRevealing =
    scene.scenePresentation === "beigo-reveal" && scene51BeigoRevealPhase === "revealing";
  const isVisualNovelAlarmScene = scene.scenePresentation === "visual-novel-alarm";
  const isBeigoIdentityChoiceScene = scene.id === BEIGO_IDENTITY_CHOICE_SCENE_ID;
  const isBeigoObservationScene = scene.id === BEIGO_OBSERVATION_SCENE_ID;
  const hasCompletedRequiredBeigoObservations = BEIGO_OBSERVATION_REQUIRED_OPTION_IDS.every(
    (optionId) => beigoObservationCompleted[optionId],
  );
  const beigoObservationOptionIds: BeigoObservationOptionId[] =
    hasCompletedRequiredBeigoObservations
      ? ["sleepingBai", "beigo", "diary"]
      : ["sleepingBai", "beigo"];
  const activeBeigoObservationResult = activeBeigoObservationOptionId
    ? BEIGO_OBSERVATION_RESULT_BY_ID[activeBeigoObservationOptionId]
    : null;
  const activeBeigoObservationDialogue = activeBeigoObservationResult
    ? (activeBeigoObservationResult.dialogueSequence?.[activeBeigoObservationDialogueIndex] ??
      activeBeigoObservationResult)
    : null;
  const shouldHideDialogByDoorTransition =
    (scene.id === LEGACY_NIGHT_HUB_SCENE_ID && isDoorTransitionVisible) ||
    isDoorSwipeInteractionVisible ||
    isScene47Revealing ||
    isScene51BeigoRevealing ||
    (isScene5OutfitReveal && scene5OutfitRevealPhase !== "dialog") ||
    scene.autoOpenCharacterIntro === true ||
    isCharacterIntroOpen;
  const shouldShowSceneDialogPanel = !shouldHideDialogByDoorTransition;
  const shouldShowSceneQuickActions = !shouldHideDialogByDoorTransition;
  const isMetroDogPhotoCaptureScene = scene.id === "scene-85";
  const isDiaryConversationScene = DIARY_CONVERSATION_SCENE_IDS.has(scene.id);
  const isDiaryPageConversationActive = isDiaryConversationScene;
  const shouldUseStandardStoryDialog =
    !isImageOnlyScene &&
    !isDiaryConversationScene &&
    shouldShowSceneDialogPanel &&
    !isScene44Interactive &&
    !isNightHubInteractive &&
    !isMorningHubInteractive;
  const canAdvanceStandardStoryFromScreen =
    shouldUseStandardStoryDialog &&
    shouldShowStandardStoryContinueAction &&
    isStoryDialogContinueReady &&
    Boolean(scene.nextSceneId);
  const canAdvanceImageOnlyFromScreen =
    isImageOnlyScene &&
    isImageOnlyContinueReady &&
    Boolean(scene.nextSceneId) &&
    !isVisualNovelAlarmExitActive;

  const handleMetroDogPhotoConfirm = (capture: PhotoCaptureResult) => {
    const photoSnapshot = {
      sourceImage: capture.sourceImage,
      previewImage: capture.framePreviewUrl,
      dogCoveragePercent: capture.score,
      cameraFrameRect: capture.normalizedCameraFrameRect,
      capturedRect: capture.normalizedCroppedRect,
    };
    recordPhotoCapture(photoSnapshot);
    recordSunbeastPhotoCapture("naotaro", photoSnapshot, { maxCaptures: 1 });
    if (!scene.nextSceneId) return;
    router.push(withTrialProfileSearch(ROUTES.gameScene(scene.nextSceneId)));
  };

  const handleStandardStoryScreenClick = (event: MouseEvent<HTMLDivElement>) => {
    if (canAdvanceImageOnlyFromScreen) {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          "button, a, input, select, textarea, [role='button'], [data-no-story-advance='true']",
        )
      ) {
        return;
      }
      handleStoryRequestNext(scene.nextSceneId!);
      return;
    }
    if (!canAdvanceStandardStoryFromScreen) return;
    const target = event.target as HTMLElement | null;
    if (
      target?.closest(
        "button, a, input, select, textarea, [role='button'], [data-no-story-advance='true']",
      )
    ) {
      return;
    }
    window.dispatchEvent(new CustomEvent(STORY_DIALOG_SCREEN_CONTINUE_TRIGGER));
  };

  const activeFrogDessertShopOffworkLine = isFrogDessertShopOffworkDialogActive
    ? FROG_DESSERT_SHOP_OFFWORK_DIALOG_LINES[
        Math.min(
          frogDessertShopOffworkLineIndex,
          FROG_DESSERT_SHOP_OFFWORK_DIALOG_LINES.length - 1,
        )
      ]
    : null;
  const isFrogDessertShopOffworkFinalLine =
    Boolean(activeFrogDessertShopOffworkLine) &&
    frogDessertShopOffworkLineIndex >= FROG_DESSERT_SHOP_OFFWORK_DIALOG_LINES.length - 1;
  const shouldHideImageOnlySceneDialogPanel =
    isImageOnlyScene && !activeFrogDessertShopOffworkLine;
  const activeBackgroundImage = isFrogDessertShopOffworkDialogActive
    ? FROG_DESSERT_SHOP_OFFWORK_BACKGROUND_IMAGE
    : displayedBackgroundImage;
  const activeBackgroundColor = isFrogDessertShopOffworkDialogActive
    ? "#CFC7A9"
    : scene.backgroundColor ?? "#D6D4B9";
  const sceneBackgroundImageStyle = activeBackgroundImage
    ? `url('${activeBackgroundImage}')`
    : undefined;
  const sceneBackgroundSize = isMetroDogPhotoCaptureScene ? "contain" : "cover";
  const sceneBackgroundPosition = isMetroDogPhotoCaptureScene
    ? "center center"
    : "center bottom";
  const activeBackgroundOverlayImage =
    scene.backgroundOverlayAnimation?.frameImages[backgroundOverlayFrameIndex];
  const activeBaiGlowLayers =
    activeBackgroundImage === BAI_ROOM_GLOW_1_BACKGROUND_IMAGE
      ? BAI_ROOM_GLOW_1_BACKGROUND_LAYERS
      : null;
  const hasAnimatedSceneBackground = Boolean(activeBackgroundImage && scene.backgroundMotion);
  const sceneBackgroundMotionStyle = scene.backgroundMotion
    ? ({
        "--scene-bg-zoom-from": String(scene.backgroundMotion.fromScale ?? 1),
        "--scene-bg-zoom-to": String(scene.backgroundMotion.toScale ?? 1.08),
        "--scene-bg-translate-y-from": scene.backgroundMotion.fromTranslateY ?? "0px",
        "--scene-bg-translate-y-to": scene.backgroundMotion.toTranslateY ?? "0px",
        "--scene-bg-brightness-from": String(scene.backgroundMotion.fromBrightness ?? 1),
        "--scene-bg-brightness-to": String(scene.backgroundMotion.toBrightness ?? 1),
        "--scene-bg-blur-from": `${scene.backgroundMotion.fromBlurPx ?? 0}px`,
        "--scene-bg-blur-to": `${scene.backgroundMotion.toBlurPx ?? 0}px`,
      } as CSSProperties)
    : undefined;

  return (
    <Flex w={{ base: "100vw", sm: "393px" }} maxW="393px" h={{ base: "100dvh", sm: "852px" }} maxH="852px" position="relative">
      <Flex
        ref={sceneBackgroundRef}
        w="100%"
        h="100%"
        bgColor={activeBackgroundColor}
        position="relative"
        borderRadius={{ base: "0", sm: "20px" }}
        overflow="hidden"
        boxShadow={{ base: "none", sm: "0 10px 30px rgba(0, 0, 0, 0.12)" }}
        direction="column"
        backgroundImage={hasAnimatedSceneBackground ? undefined : sceneBackgroundImageStyle}
        backgroundSize={sceneBackgroundSize}
        backgroundPosition={sceneBackgroundPosition}
        backgroundRepeat="no-repeat"
        animation={backgroundShakeAnimation}
        cursor={canAdvanceImageOnlyFromScreen ? "pointer" : undefined}
        onClick={handleStandardStoryScreenClick}
      >
        {hasAnimatedSceneBackground ? (
          <Flex
            position="absolute"
            inset="0"
            zIndex={0}
            pointerEvents="none"
            backgroundImage={sceneBackgroundImageStyle}
            backgroundSize={sceneBackgroundSize}
            backgroundPosition={sceneBackgroundPosition}
            backgroundRepeat="no-repeat"
            transformOrigin={scene.backgroundMotion?.transformOrigin ?? "50% 50%"}
            animation={getSceneBackgroundMotionAnimation(scene)}
            style={sceneBackgroundMotionStyle}
          />
        ) : null}
        {activeBaiGlowLayers ? (
          <Flex
            position="absolute"
            inset="0"
            zIndex={0}
            pointerEvents="none"
            transformOrigin={scene.backgroundMotion?.transformOrigin ?? "50% 50%"}
            animation={getSceneBackgroundMotionAnimation(scene)}
            style={sceneBackgroundMotionStyle}
          >
            {activeBaiGlowLayers.map((layer, index) => (
              <Box
                key={layer.image}
                position="absolute"
                inset="0"
                animation={getBaiGlowLayerAnimation(layer, index)}
                willChange="transform, opacity"
              >
                <img
                  src={layer.image}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    maxWidth: "none",
                    objectFit: sceneBackgroundSize,
                    objectPosition: sceneBackgroundPosition,
                    display: "block",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                />
              </Box>
            ))}
          </Flex>
        ) : null}
        {activeBackgroundOverlayImage && !isMetroDogPhotoCaptureScene ? (
          <img
            src={activeBackgroundOverlayImage}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              maxWidth: "none",
              objectFit: sceneBackgroundSize,
              objectPosition: sceneBackgroundPosition,
              display: "block",
              pointerEvents: "none",
              userSelect: "none",
              zIndex: 0,
            }}
          />
        ) : null}
        <EventBackgroundFxLayer effectId={activeEffectId} effectNonce={effectNonce} />
        {isOpeningCloudBurstVisible ? <OpeningCloudBurstOverlay /> : null}
        {isVisualNovelAlarmScene ? (
          <Flex
            position="absolute"
            inset="0"
            zIndex={12}
            pointerEvents="none"
            overflow="hidden"
          >
            <Flex
              position="absolute"
              left={isVisualNovelAlarmExitActive ? "-44%" : "50%"}
              top="50%"
              zIndex={1}
              transform="translate(-50%, -50%)"
              w="292px"
              maxW="calc(100% - 56px)"
              alignItems="center"
              justifyContent="center"
              transition={`left ${VISUAL_NOVEL_ALARM_EXIT_SLIDE_MS}ms cubic-bezier(0.2, 0.72, 0.18, 1) ${VISUAL_NOVEL_ALARM_EXIT_SLIDE_DELAY_MS}ms`}
              animation={
                isVisualNovelAlarmExitActive
                  ? `${visualNovelAlarmPressExit} ${VISUAL_NOVEL_ALARM_EXIT_PRESS_MS}ms cubic-bezier(0.2, 0.78, 0.2, 1) both`
                  : `${visualNovelAlarmSceneIn} 520ms ease-out both`
              }
            >
              <Flex
                w="100%"
                boxShadow="0 18px 42px rgba(0,0,0,0.42), 0 0 34px rgba(255,224,150,0.18)"
                animation={`${visualNovelAlarmRing} 980ms ease-in-out infinite`}
                transformOrigin="50% 80%"
              >
                <img
                  src={COMIC_IMAGE_BY_ID.alarmRinging}
                  alt="響鈴的鬧鐘"
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
              </Flex>
            </Flex>
          </Flex>
        ) : null}
        {scene.id === "scene-32" ? (
          <>
            <Flex
              position="absolute"
              inset="0"
              zIndex={3}
              pointerEvents="none"
              bg="linear-gradient(180deg, rgba(3,3,4,0.18), rgba(3,3,4,0.48)), radial-gradient(circle at 56% 32%, rgba(255,232,162,0.08), transparent 42%)"
              animation={`${scene32MemoryWash} 520ms ease-out both`}
            />
            <Flex
              position="absolute"
              top="-120px"
              left="-220px"
              w="520px"
              h="1160px"
              zIndex={8}
              pointerEvents="none"
              bg="linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(7,6,6,0.98) 72%, rgba(0,0,0,0.82) 100%)"
              transformOrigin="center"
              animation={`${scene32LeftCurtainReveal} 880ms cubic-bezier(0.2, 0.82, 0.22, 1) both`}
            />
            <Flex
              position="absolute"
              top="-120px"
              right="-220px"
              w="520px"
              h="1160px"
              zIndex={8}
              pointerEvents="none"
              bg="linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(7,6,6,0.98) 28%, rgba(0,0,0,1) 100%)"
              transformOrigin="center"
              animation={`${scene32RightCurtainReveal} 880ms cubic-bezier(0.2, 0.82, 0.22, 1) both`}
            />
            <Flex
              position="absolute"
              left="50%"
              top="300px"
              w="300px"
              h="230px"
              zIndex={6}
              pointerEvents="none"
              borderRadius="999px"
              bg="radial-gradient(circle, rgba(255, 226, 148, 0.34) 0%, rgba(255, 226, 148, 0.14) 40%, transparent 72%)"
              animation={`${scene32ClueGlow} 980ms ease-out 140ms both`}
            />
            {scene.dialogue ? (
              <Flex
                position="absolute"
                inset="0"
                zIndex={9}
                pointerEvents="none"
                alignItems="center"
                justifyContent="center"
                px="42px"
              >
                <Text
                  color="rgba(255, 244, 214, 0.94)"
                  fontSize="17px"
                  fontWeight="700"
                  lineHeight="1.7"
                  textAlign="center"
                  textShadow="0 2px 12px rgba(0,0,0,0.62)"
                  animation={`${storyComicPanelFadeIn} 360ms ease-out 560ms both`}
                >
                  [{scene.dialogue}]
                </Text>
              </Flex>
            ) : null}
          </>
        ) : null}
        {isScene47Revealing ? (
          <>
            <Flex
              position="absolute"
              inset="0"
              zIndex={17}
              pointerEvents="none"
              bg="radial-gradient(circle at 50% 36%, rgba(255,232,170,0.12), transparent 42%), rgba(0,0,0,0.08)"
            />
            <Flex
              position="absolute"
              top="0"
              bottom="0"
              left="0"
              w="108%"
              zIndex={18}
              pointerEvents="none"
              overflow="visible"
              bg="linear-gradient(90deg, #010101 0%, #020202 86%, #080706 96%, rgba(0,0,0,0.9) 100%)"
              boxShadow="22px 0 34px rgba(0,0,0,0.52)"
              animation={`${scene47LeftCurtainReveal} 1360ms cubic-bezier(0.22, 0.74, 0.18, 1) both`}
            >
              <Flex
                position="absolute"
                top="0"
                right="-4px"
                bottom="0"
                w="10px"
                bg="linear-gradient(90deg, rgba(0,0,0,0.08), rgba(255,229,158,0.52), rgba(255,247,211,0.92))"
                filter="blur(0.4px)"
                animation={`${scene47DoorLightReveal} 1360ms ease-out both`}
              />
            </Flex>
          </>
        ) : null}
        {scene.scenePresentation === "beigo-reveal" && scene51BeigoRevealPhase === "revealing" ? (
          <Flex position="absolute" inset="0" zIndex={15} pointerEvents="none" overflow="hidden">
            <Flex
              position="absolute"
              inset="0"
              zIndex={1}
              animation={`${beigoRevealStarsTwinkle} 1500ms ease-out both`}
            >
              <img
                src={BEIGO_REVEAL_SPECIAL_IMAGES.stars}
                alt=""
                aria-hidden="true"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </Flex>
            <Flex
              position="absolute"
              inset="0"
              zIndex={2}
              animation={`${beigoRevealPagesSweep} 1320ms cubic-bezier(0.2, 0.78, 0.24, 1) both`}
            >
              <img
                src={BEIGO_REVEAL_SPECIAL_IMAGES.pageBehind}
                alt=""
                aria-hidden="true"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </Flex>
            <Flex
              position="absolute"
              inset="0"
              zIndex={3}
              animation={`${beigoRevealPagesSettle} 1420ms cubic-bezier(0.18, 0.76, 0.22, 1) both`}
            >
              <img
                src={BEIGO_REVEAL_SPECIAL_IMAGES.page01}
                alt=""
                aria-hidden="true"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </Flex>
            <Flex
              position="absolute"
              inset="0"
              zIndex={4}
              animation={`${beigoRevealPagesSweep} 1380ms cubic-bezier(0.18, 0.76, 0.22, 1) 60ms both`}
            >
              <img
                src={BEIGO_REVEAL_SPECIAL_IMAGES.page02}
                alt=""
                aria-hidden="true"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </Flex>
            <Flex
              position="absolute"
              inset="0"
              zIndex={5}
              animation={`${beigoRevealPagesSettle} 1340ms cubic-bezier(0.18, 0.76, 0.22, 1) 120ms both`}
            >
              <img
                src={BEIGO_REVEAL_SPECIAL_IMAGES.page03}
                alt=""
                aria-hidden="true"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </Flex>
            <Flex
              position="absolute"
              inset="0"
              zIndex={6}
              bg="rgba(255,255,255,0.94)"
              mixBlendMode="screen"
              animation={`${beigoRevealWhiteBurst} 980ms ease-out both`}
            />
            <Flex
              position="absolute"
              left="50%"
              top="56%"
              w="520px"
              h="520px"
              zIndex={7}
              transform="translate(-50%, -50%)"
              bg="radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(188,226,255,0.74) 26%, rgba(125,152,255,0.26) 48%, rgba(255,255,255,0) 74%)"
              mixBlendMode="screen"
              animation={`${beigoRevealLightBloom} 1320ms ease-out both`}
            />
          </Flex>
        ) : null}
        {isMetroDogPhotoCaptureScene && displayedBackgroundImage ? (
          <EventPhotoCaptureLayer
            enabled
            backgroundRef={sceneBackgroundRef}
            backgroundImageSrc={displayedBackgroundImage}
            naturalImageSize={scenePhotoNaturalImageSize}
            fitMode="contain"
            captureOverlays={
              activeBackgroundOverlayImage
                ? [
                    {
                      imageSrc: activeBackgroundOverlayImage,
                      rectNormalized: { x: 0, y: 0, width: 1, height: 1 },
                    },
                  ]
                : undefined
            }
            targetRectNormalized={METRO_DOG_TARGET_RECT_NORMALIZED}
            passScore={60}
            hintText="點擊快門捕捉小日獸"
            tutorialTitle="拍下小日獸"
            tutorialLines={[
              "等白色框框移到黃金獵犬身上。",
              "覺得位置差不多了，就按下快門！",
            ]}
            tutorialConfirmLabel="開始拍照"
            {...SUNBEAST_RETAKE_CAPTURE_PROPS}
            frameSweepFromY={20}
            frameSweepToY={604}
            targetFadeLeadPx={50}
            onConfirm={handleMetroDogPhotoConfirm}
          />
        ) : null}
        {ENABLE_LOCATION_DISCOVERY_BANNER && scene.id === "scene-68a" && isScene68LocationDiscoveryVisible ? (
          <SceneLocationDiscoveryBanner title="捷運" iconPath="/images/icon/mrt.png" />
        ) : null}
        <UnlockFeedbackOverlay items={unlockFeedbackItems} />
        {isInnerThoughtScene ? (
          <Flex pointerEvents="none" position="absolute" inset="0" zIndex={1}>
            <Flex
              position="absolute"
              inset="0"
              bgImage="url(&quot;data:image/svg+xml;utf8,<svg viewBox='0 0 784 1300' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%25' width='100%25' fill='url(%23grad)' opacity='0.6000000238418579'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(52.4 -55.1 33.23 31.601 28.5 1316)'><stop stop-color='rgba(33,33,33,0.2)' offset='0'/><stop stop-color='rgba(33,33,33,1)' offset='1'/></radialGradient></defs></svg>&quot;)"
              bgSize="100% 100%"
            />
          </Flex>
        ) : null}
        {shouldShowNarrativeFocusLayer || isDiaryConversationScene || isScene47Revealing ? null : isImageOnlyScene ? (
          <>
            {scene.sceneLabel && !isVisualNovelAlarmScene && (!isOffworkScene || isOffworkLabelVisible) ? (
              <Flex
                position="absolute"
                top="50%"
                left="0"
                right="0"
                transform="translateY(-50%)"
                bgColor="rgba(132, 104, 76, 0.92)"
                h="104px"
                alignItems="center"
                justifyContent="center"
                opacity={isOffworkScene && !isOffworkLabelVisible ? 0 : 1}
                transition="opacity 0.25s ease"
              >
                <Text color="white" fontSize="56px" fontWeight="700" letterSpacing="2px">
                  {scene.sceneLabel}
                </Text>
              </Flex>
            ) : null}
            {scene.imageOnlyContinuePrompt && isImageOnlyContinuePromptReady && !isVisualNovelAlarmExitActive ? (
              <Flex
                position="absolute"
                left="0"
                right="0"
                top={isVisualNovelAlarmScene ? "calc(50% + 128px)" : undefined}
                bottom={isVisualNovelAlarmScene ? undefined : "42px"}
                zIndex={18}
                pointerEvents="none"
                justifyContent="center"
                px="24px"
                animation={`${storyComicPanelFadeIn} 320ms ease-out both`}
              >
                <Text
                  color="rgba(255,255,255,0.94)"
                  fontSize="14px"
                  fontWeight="700"
                  letterSpacing="0"
                  lineHeight="1.2"
                  textAlign="center"
                  px="18px"
                  py="8px"
                  borderRadius="999px"
                  border="1px solid rgba(255,255,255,0.32)"
                  bgColor="rgba(0,0,0,0.28)"
                  textShadow="0 2px 10px rgba(0,0,0,0.72)"
                >
                  {scene.imageOnlyContinuePrompt}
                </Text>
              </Flex>
            ) : null}
          </>
        ) : null}

        {scene.characterAvatar ? (
          <Flex position="absolute" top="140px" left="50%" transform="translateX(-50%)">
            <Flex
              w="88px"
              h="88px"
              borderRadius="999px"
              overflow="hidden"
              border="3px solid white"
              boxShadow="0 4px 14px rgba(0,0,0,0.25)"
              alignItems="center"
              justifyContent="center"
              bgColor="#E8E1D8"
            >
              <img
                src={scene.characterAvatar}
                alt={scene.characterName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Flex>
          </Flex>
        ) : null}

        {isCharacterIntroOpen ? (
          <Flex
            key={`character-intro-${scene.id}-${characterIntroNonce}`}
            position="absolute"
            inset="0"
            zIndex={76}
            onClick={handleCloseCharacterIntro}
            bg="linear-gradient(180deg, rgba(20,25,28,0.26) 0%, rgba(18,20,22,0.46) 100%)"
            animation={`${characterIntroBgFadeIn} 360ms ease-out`}
            overflow="hidden"
          >
            {(() => {
              const intro = CHARACTER_INTRO_BY_SCENE_ID[scene.id];
              if (!intro) return null;
              const spriteScale = 0.48;
              const spriteWidth = 500;
              const spriteHeight = 627;
              const spriteCol = intro.spriteFrameIndex % intro.spriteCols;
              const spriteRow = Math.floor(intro.spriteFrameIndex / intro.spriteCols);

              return (
                <>
                  <Flex
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    h="122px"
                    bgColor={intro.theme.topBar}
                    borderBottom="4px solid rgba(255,255,255,0.42)"
                  />
                  <Flex
                    position="absolute"
                    left="-32%"
                    top="31%"
                    w="175%"
                    h="228px"
                    bgColor={intro.theme.band}
                    borderTop={`6px solid ${intro.theme.bandBorder}`}
                    borderBottom={`6px solid ${intro.theme.bandBorder}`}
                    transform="rotate(-16deg)"
                    transformOrigin="center"
                    animation={`${characterIntroBandSlideIn} 520ms cubic-bezier(0.2, 0.8, 0.2, 1)`}
                  />
                  <Flex
                    pointerEvents="none"
                    position="absolute"
                    left="40px"
                    top="244px"
                    zIndex={3}
                    direction="column"
                    gap="5px"
                    animation={`${characterIntroTextFadeIn} 380ms ease-out 110ms both`}
                  >
                    <Text color="white" fontSize="43px" fontWeight="800" lineHeight="1">
                      {intro.name}
                    </Text>
                    <Text color="rgba(255,255,255,0.95)" fontSize="34px" fontWeight="800" lineHeight="1.1" letterSpacing="0.05em">
                      {intro.englishName}
                    </Text>
                    <Text color="white" fontSize="17px" lineHeight="1.5" fontWeight="600">
                      {intro.descriptionLines.map((line, index) => (
                        <Fragment key={`${intro.sceneId}-description-${line}`}>
                          {index > 0 ? <br /> : null}
                          {line}
                        </Fragment>
                      ))}
                    </Text>
                  </Flex>
                  <Flex
                    pointerEvents="none"
                    position="absolute"
                    right="20px"
                    top="226px"
                    zIndex={3}
                    transform="rotate(90deg)"
                    transformOrigin="center"
                    animation={`${characterIntroTextFadeIn} 380ms ease-out 180ms both`}
                  >
                    <Text color="rgba(255,255,255,0.96)" fontSize="16px" fontWeight="800" letterSpacing="0.2em">
                      {intro.englishName}
                    </Text>
                  </Flex>
                  <Flex
                    pointerEvents="none"
                    position="absolute"
                    left="50%"
                    bottom="152px"
                    w="220px"
                    h="46px"
                    borderRadius="999px"
                    bgColor="rgba(255,255,255,0.82)"
                    filter="blur(6px)"
                    transform="translateX(-50%)"
                    animation={`${characterIntroGlowPulse} 1.7s ease-in-out infinite`}
                  />
                  <Flex
                    pointerEvents="none"
                    position="absolute"
                    left="50%"
                    bottom="20px"
                    zIndex={4}
                    w="238px"
                    h="300px"
                    transform="translateX(-50%)"
                    animation={`${characterIntroAvatarRise} 500ms ease-out 120ms both`}
                    overflow="hidden"
                  >
                    <img
                      src={intro.spriteSheetPath}
                      alt={`${intro.name} intro sprite`}
                      style={{
                        width: `${spriteWidth * intro.spriteCols * spriteScale}px`,
                        height: `${spriteHeight * intro.spriteRows * spriteScale}px`,
                        transform: `translate(${-spriteCol * spriteWidth * spriteScale}px, -${spriteRow * spriteHeight * spriteScale}px)`,
                        display: "block",
                        maxWidth: "none",
                      }}
                    />
                  </Flex>
                  <Flex
                    position="absolute"
                    right="30px"
                    top="466px"
                    zIndex={5}
                    h="42px"
                    minW="116px"
                    px="18px"
                    borderRadius="999px"
                    border="2px solid rgba(255,255,255,0.5)"
                    bgColor={intro.theme.button}
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    animation={`${characterIntroOkPulse} 1.4s ease-in-out infinite`}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCloseCharacterIntro();
                    }}
                  >
                    <Text color={intro.theme.buttonText} fontSize="24px" fontWeight="800" letterSpacing="0.16em" ml="4px">
                      OK
                    </Text>
                  </Flex>
                  <Flex
                    position="absolute"
                    bottom="0"
                    left="0"
                    right="0"
                    h="108px"
                    bgColor={intro.theme.topBar}
                    borderTop="4px solid rgba(255,255,255,0.42)"
                  />
                  <Flex position="absolute" inset="0" onClick={handleCloseCharacterIntro} />
                </>
              );
            })()}
          </Flex>
        ) : null}

	        {isImageOnlyScene ||
	        isDiaryConversationScene ||
	        !shouldShowSceneQuickActions ||
	        (isNightHubInteractive && shouldHideNightHubIconsForGuide) ? null : (
	          <DialogQuickActions
	            onOpenHistory={() => setIsHistoryOpen(true)}
	            onOpenOptions={() => setIsSceneMenuOpen(true)}
	            placement={isNightHubInteractive ? "top-right" : "dialog"}
	            onOpenDiary={
	              scene.id === LEGACY_NIGHT_HUB_SCENE_ID && !isNightHubInteractive
	                ? () => {
	                  handleOpenDiary();
	                }
                : undefined
            }
          />
        )}

        {isSceneMenuOpen ? (
          <Flex
            position="absolute"
            inset="0"
            zIndex={72}
            bgColor="rgba(18,14,10,0.52)"
            alignItems="center"
            justifyContent="center"
            p="24px"
            onClick={() => setIsSceneMenuOpen(false)}
          >
            <Flex
              w="100%"
              maxW="280px"
              borderRadius="14px"
              border="2px solid rgba(255,255,255,0.3)"
              bgColor="rgba(95,74,56,0.96)"
              boxShadow="0 14px 30px rgba(0,0,0,0.35)"
              p="14px"
              direction="column"
              gap="10px"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <Text color="#FFF2E3" fontSize="15px" fontWeight="700" px="6px">
                選單
              </Text>
              <Flex
                h="40px"
                borderRadius="10px"
                bgColor={
                  scene.id === LEGACY_NIGHT_HUB_SCENE_ID && isNightHubMode
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(255,255,255,0.18)"
                }
                border="1px solid rgba(255,255,255,0.26)"
                alignItems="center"
                justifyContent="center"
                cursor={scene.id === LEGACY_NIGHT_HUB_SCENE_ID && isNightHubMode ? "default" : "pointer"}
                onClick={() => {
                  if (scene.id === LEGACY_NIGHT_HUB_SCENE_ID && isNightHubMode) return;
                  setIsSceneMenuOpen(false);
                  if (scene.id === LEGACY_NIGHT_HUB_SCENE_ID) {
                    const latestProgress = loadPlayerProgress();
                    if (!latestProgress.hasSeenSunbeastFirstReveal) {
                      handleOpenDiary();
                      return;
                    }
                    setIsNightHubMode(true);
                    return;
                  }
                  router.push(withTrialProfileSearch(ROUTES.gameScene(LEGACY_NIGHT_HUB_SCENE_ID)));
                }}
              >
                <Text color="white" fontSize="14px" fontWeight="700">
                  {scene.id === LEGACY_NIGHT_HUB_SCENE_ID && isNightHubMode ? "目前已在夜間 Hub" : "前往夜間 Hub"}
                </Text>
              </Flex>
              <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="8px">
                <Flex
                  h="40px"
                  borderRadius="10px"
                  bgColor={
                    unlockedDiaryEntryIds.length > 0 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)"
                  }
                  border="1px solid rgba(255,255,255,0.26)"
                  alignItems="center"
                  justifyContent="center"
                  cursor={unlockedDiaryEntryIds.length > 0 ? "pointer" : "default"}
                  onClick={() => {
                    if (unlockedDiaryEntryIds.length <= 0) return;
                    handleOpenDiary("journal");
                  }}
                >
                  <Text color="white" fontSize="14px" fontWeight="700">
                    {unlockedDiaryEntryIds.length > 0 ? "交換日記" : "日記未解鎖"}
                  </Text>
                </Flex>
                <Flex
                  h="40px"
                  borderRadius="10px"
                  bgColor={
                    unlockedDiaryEntryIds.length > 0 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)"
                  }
                  border="1px solid rgba(255,255,255,0.26)"
                  alignItems="center"
                  justifyContent="center"
                  cursor={unlockedDiaryEntryIds.length > 0 ? "pointer" : "default"}
                  onClick={() => {
                    if (unlockedDiaryEntryIds.length <= 0) return;
                    handleOpenDiary("sunbeast");
                  }}
                >
                  <Text color="white" fontSize="14px" fontWeight="700">
                    {unlockedDiaryEntryIds.length > 0 ? "小日獸圖鑑" : "圖鑑未解鎖"}
                  </Text>
                </Flex>
              </Grid>
              <Flex direction="column" gap="6px" px="4px" py="2px">
                <Text color="#FCECDD" fontSize="12px" fontWeight="700">
                  對話速度
                </Text>
                <Grid templateColumns="repeat(4, minmax(0, 1fr))" gap="6px">
                  {([
                    { key: "char", label: "逐字" },
                    { key: "double-char", label: "雙字" },
                    { key: "punctuated", label: "標點" },
                    { key: "pause", label: "停頓" },
                  ] as Array<{ key: DialogTypingMode; label: string }>).map((mode) => (
                    <Flex
                      key={mode.key}
                      h="28px"
                      borderRadius="999px"
                      border="1px solid rgba(255,255,255,0.26)"
                      bgColor={
                        dialogTypingMode === mode.key
                          ? "rgba(255,255,255,0.26)"
                          : "rgba(255,255,255,0.08)"
                      }
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      onClick={() => {
                        setDialogTypingMode(mode.key);
                        saveDialogTypingMode(mode.key);
                      }}
                    >
                      <Text color="white" fontSize="11px" fontWeight="700">
                        {mode.label}
                      </Text>
                    </Flex>
                  ))}
                </Grid>
              </Flex>
              <Flex
                h="36px"
                borderRadius="999px"
                bgColor="rgba(255,255,255,0.12)"
                border="1px solid rgba(255,255,255,0.22)"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                onClick={() => setIsSceneMenuOpen(false)}
              >
                <Text color="#FCECDD" fontSize="13px" fontWeight="700">
                  關閉
                </Text>
              </Flex>
            </Flex>
          </Flex>
        ) : null}

        {activeBeigoObservationOptionId === "diary" && !isDiaryOpen ? (
          <Flex
            position="absolute"
            top="142px"
            left="50%"
            zIndex={8}
            w="82%"
            maxW="320px"
            pointerEvents="none"
            transform="translateX(-50%)"
            animation={`${storyComicPanelFadeIn} 320ms ease-out both`}
            filter="drop-shadow(0 8px 14px rgba(33, 26, 22, 0.22))"
          >
            <img
              src={COMIC_IMAGE_BY_ID.book}
              alt="日記本漫畫格"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        {scene.storySingleComicPanel ? (
          <Flex
            position="absolute"
            top={scene.storySingleComicPanel.top}
            left={scene.storySingleComicPanel.centered ? "50%" : scene.storySingleComicPanel.left}
            right={scene.storySingleComicPanel.right}
            zIndex={scene.storySingleComicPanel.zIndex ?? 7}
            w={scene.storySingleComicPanel.width}
            h={scene.storySingleComicPanel.height}
            maxW={scene.storySingleComicPanel.maxWidth}
            pointerEvents="none"
            transform={scene.storySingleComicPanel.centered ? "translateX(-50%)" : undefined}
            animation={getStorySingleComicPanelAnimation(scene)}
            overflow={scene.storySingleComicPanel.imageEnterFrom ? "hidden" : undefined}
            borderRadius={scene.storySingleComicPanel.panelBorderRadius}
            style={scene.storySingleComicPanel.imageEnterFrom ? { perspective: "720px" } : undefined}
          >
            {scene.storySingleComicPanel.panelBackgroundColor ? (
              <Box
                position="absolute"
                inset={scene.storySingleComicPanel.panelBackgroundInset ?? "0"}
                bgColor={scene.storySingleComicPanel.panelBackgroundColor}
                borderRadius={scene.storySingleComicPanel.panelBorderRadius}
              />
            ) : null}
            <Box
              position="relative"
              zIndex={1}
              w="100%"
              h={scene.storySingleComicPanel.height ? "100%" : undefined}
              animation={getStorySingleComicPanelImageAnimation(scene)}
              transformOrigin={
                scene.storySingleComicPanel.imageEnterFrom === "right"
                  ? "right center"
                  : scene.storySingleComicPanel.imageEnterFrom === "left"
                    ? "left center"
                    : "center bottom"
              }
              style={{ transformStyle: "preserve-3d" }}
            >
              <img
                src={COMIC_IMAGE_BY_ID[scene.storySingleComicPanel.imageId]}
                alt={scene.storySingleComicPanel.alt}
                style={{
                  width: "100%",
                  height: scene.storySingleComicPanel.height ? "100%" : "auto",
                  display: "block",
                }}
              />
            </Box>
          </Flex>
        ) : null}

        {scene.storyComicOverlays?.map((overlay, index) => {
          const isVisible = visibleStoryComicOverlayCount > index;
          return (
            <StoryComicOverlayPanel
              key={`${scene.id}-${overlay.imageId}-${index}`}
              sceneId={scene.id}
              overlay={overlay}
              index={index}
              isVisible={isVisible}
              onSequenceComplete={handleStoryComicOverlaySequenceComplete}
            />
          );
        })}

        {shouldShowScene5OutfitRevealOverlay ? (
          <Flex
            position="absolute"
            inset="0"
            zIndex={18}
            pointerEvents="none"
            alignItems="center"
            justifyContent="center"
            opacity={scene5OutfitRevealPhase === "modal-exit" ? 0 : 1}
            transition="opacity 360ms ease"
            bg="rgba(35, 27, 20, 0.46)"
          >
            <Flex
              w="84%"
              maxW="310px"
              h="63%"
              maxH="540px"
              minH="420px"
              position="relative"
              overflow="hidden"
              borderRadius="16px"
              border="3px solid rgba(148, 116, 87, 0.94)"
              boxShadow="0 18px 34px rgba(32, 22, 16, 0.24)"
              bgColor="#E6DFC3"
              backgroundImage={`
                radial-gradient(circle, rgba(192, 156, 118, 0.9) 0 2.5px, transparent 2.6px),
                linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(219,208,176,0.12) 100%)
              `}
              backgroundSize="38px 38px, 100% 100%"
              backgroundPosition="19px 19px, 0 0"
              animation={`${scene5OutfitPanelFadeIn} 180ms ease-out`}
            >
              <Flex
                position="absolute"
                inset="0"
                bg="linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 100%)"
              />
              <Flex
                position="absolute"
                left="50%"
                bottom="-8px"
                w="74%"
                maxW="228px"
                transform={
                  scene5OutfitRevealPhase === "modal-enter"
                    ? "translateX(-50%) translateY(-58%)"
                    : "translateX(-50%) translateY(100px)"
                }
                transition="transform 980ms linear"
                filter="drop-shadow(0 10px 22px rgba(105, 76, 54, 0.14))"
              >
                <img
                  src="/images/mai/mai_pose.png"
                  alt="小麥穿搭站姿"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </Flex>
            </Flex>
          </Flex>
        ) : null}

        {isScene5OutfitReveal &&
        (scene5OutfitRevealPhase === "dialog" || scene5OutfitRevealPhase === "avatar-exit") ? (
          <Flex
            position="absolute"
            left="14px"
            bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
            zIndex={6}
            pointerEvents="none"
            opacity={scene5OutfitRevealPhase === "avatar-exit" ? 0 : 1}
            transform={scene5OutfitRevealPhase === "avatar-exit" ? "translateX(120px)" : undefined}
            transition="opacity 420ms ease, transform 420ms ease"
            animation={scene5OutfitRevealPhase === "dialog" ? `${scene5HappyAvatarFadeIn} 420ms ease-out` : undefined}
          >
            <EventAvatarSprite
              spriteId="mai"
              frameIndex={scene.dialogAvatarFrameIndex ?? 1}
            />
          </Flex>
        ) : null}

        {scene.id === "scene-6" ? (
          <Flex
            position="absolute"
            left="140px"
            bottom={`calc(${EVENT_DIALOG_HEIGHT} + 130px)`}
            zIndex={7}
            w="72px"
            pointerEvents="none"
            animation={`${scene6SpeechBubbleFloat} 1.8s ease-in-out infinite`}
            filter="drop-shadow(0 4px 10px rgba(92, 70, 53, 0.12))"
          >
            <img
              src="/images/UI/speechBubble.png"
              alt="開心哼歌泡泡"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <Flex
              position="absolute"
              inset="0"
              alignItems="center"
              justifyContent="center"
              pb="2px"
            >
              <Flex
                position="relative"
                w="20px"
                h="20px"
                alignItems="center"
                justifyContent="center"
                animation={`${scene6MusicIconSwing} 1.1s ease-in-out infinite`}
              >
                <FaMusic color="#8B6C54" size={20} />
              </Flex>
            </Flex>
          </Flex>
        ) : null}

        {scene.id === "scene-14" ? (
          <>
            <Flex
              position="absolute"
              top="142px"
              left="50%"
              transform={
                scene14PuppetPhase === "visible" ? "translate(-50%, 0)" : "translate(-50%, 8px)"
              }
              zIndex={7}
              w="80%"
              maxW="290px"
              pointerEvents="none"
              opacity={scene14PuppetPhase === "visible" ? 1 : 0}
              transition="opacity 260ms ease, transform 320ms ease"
            >
              <img
                src={COMIC_IMAGE_BY_ID.puppet}
                alt="人偶漫畫格"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Flex>
          <Flex
            position="absolute"
            left="138px"
            bottom={`calc(${EVENT_DIALOG_HEIGHT} + 132px)`}
            zIndex={7}
            w="72px"
            pointerEvents="none"
            animation={`${scene6SpeechBubbleFloat} 1.8s ease-in-out infinite`}
            filter="drop-shadow(0 4px 10px rgba(92, 70, 53, 0.12))"
          >
            <img
              src="/images/UI/speechBubble.png"
              alt="生氣泡泡"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <Flex
              position="absolute"
              inset="0"
              alignItems="center"
              justifyContent="center"
              pb="4px"
            >
              <Text color="#D95B17" fontSize="24px" lineHeight="1">
                💢
              </Text>
            </Flex>
          </Flex>
          </>
        ) : null}

        {scene.id === "scene-20" ? (
          <Flex
            position="absolute"
            left="138px"
            bottom={`calc(${EVENT_DIALOG_HEIGHT} + 132px)`}
            zIndex={7}
            w="72px"
            pointerEvents="none"
            animation={`${scene6SpeechBubbleFloat} 1.8s ease-in-out infinite`}
            filter="drop-shadow(0 4px 10px rgba(92, 70, 53, 0.12))"
          >
            <img
              src="/images/UI/speechBubble.png"
              alt="雨滴泡泡"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <Flex
              position="absolute"
              inset="0"
              alignItems="center"
              justifyContent="center"
              pb="2px"
            >
              <Flex animation={`${scene20DropletFall} 1.05s ease-in infinite`}>
                <FaDroplet color="#4C8CCF" size={18} />
              </Flex>
            </Flex>
          </Flex>
        ) : null}

        {scene.id === "scene-9" ? (
          <Flex
            position="absolute"
            top="142px"
            left="50%"
            transform={
              scene9PuppetRevealPhase === "hidden"
                ? "translate(-50%, 8px)"
                : "translate(-50%, 0)"
            }
            zIndex={7}
            w="80%"
            maxW="290px"
            pointerEvents="none"
            opacity={scene9PuppetRevealPhase === "hidden" ? 0 : 1}
            transition="opacity 260ms ease, transform 320ms ease"
          >
            <img
              src={COMIC_IMAGE_BY_ID.puppet}
              alt="掉落在地上的人偶"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        {activeComicCheatId ? (
          <Flex
            position="absolute"
            top="142px"
            left="50%"
            transform={isComicCheatVisible ? "translate(-50%, 0)" : "translate(-50%, 8px)"}
            zIndex={7}
            w="80%"
            maxW="290px"
            pointerEvents="none"
            opacity={isComicCheatVisible ? (isComicCheatFading ? 0 : 1) : 0}
            transition="opacity 320ms ease, transform 320ms ease"
          >
            <img
              src={COMIC_IMAGE_BY_ID[activeComicCheatId]}
              alt={`${activeComicCheatId} comic`}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        {(scene.id === "scene-40" ||
          scene.id === FIRST_FROG_RETURN_HOME_DOOR_SCENE_ID) && isDoorTransitionVisible ? (
          <Flex
            pointerEvents="none"
            position="absolute"
            inset="0"
            zIndex={20}
            bgColor="rgba(14,14,18,0.92)"
            alignItems="center"
            justifyContent="center"
          >
            <Flex
              w="82%"
              maxW="320px"
              borderRadius="12px"
              overflow="hidden"
              border="2px solid rgba(255,255,255,0.28)"
              boxShadow="0 10px 24px rgba(0,0,0,0.38)"
            >
              <img
                src={
                  doorTransitionPhase === "opened"
                    ? "/images/背景/玄關_開門.jpg"
                    : "/images/背景/玄關_關門.jpg"
                }
                alt="door-transition"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Flex>
          </Flex>
        ) : null}

        {activeDoorSwipeInteraction && isDoorSwipeInteractionVisible ? (
          <Flex
            position="absolute"
            inset="0"
            zIndex={24}
            role="button"
            tabIndex={doorSwipePhase === "prompt" ? 0 : -1}
            aria-label={activeDoorSwipeInteraction.instruction ?? "往左滑開門"}
            data-no-story-advance="true"
            cursor={doorSwipePhase === "prompt" ? "grab" : "default"}
            touchAction="none"
            outline="none"
            onPointerDown={handleDoorSwipePointerDown}
            onPointerMove={handleDoorSwipePointerMove}
            onPointerUp={handleDoorSwipePointerEnd}
            onPointerCancel={handleDoorSwipePointerEnd}
            onKeyDown={handleDoorSwipeKeyDown}
            _active={{ cursor: doorSwipePhase === "prompt" ? "grabbing" : "default" }}
          >
            <Flex
              position="absolute"
              inset="0"
              pointerEvents="none"
              backgroundImage={`url('${activeDoorSwipeInteraction.openImage}')`}
              backgroundSize="cover"
              backgroundPosition="center bottom"
              backgroundRepeat="no-repeat"
              opacity={doorSwipeProgress}
              transition={
                doorSwipePhase === "opened" || doorSwipeDragDistance === 0
                  ? "opacity 180ms ease-out"
                  : "none"
              }
            />
            <Flex
              position="absolute"
              inset="0"
              pointerEvents="none"
              bg="linear-gradient(180deg, rgba(21,17,14,0.08), rgba(21,17,14,0.36))"
              opacity={doorSwipePhase === "opened" ? 0 : Math.max(0.16, 0.42 - doorSwipeProgress * 0.22)}
              transition="opacity 180ms ease"
            />
            <Flex
              position="absolute"
              left="0"
              right="0"
              top="calc(52% + 40px)"
              zIndex={1}
              pointerEvents="none"
              alignItems="center"
              justifyContent="center"
              opacity={doorSwipePhase === "prompt" ? Math.max(0.18, 1 - doorSwipeProgress * 1.2) : 0}
              transform={`translate(-${Math.min(34, doorSwipeDragDistance * 0.38)}px, -50%)`}
              transition={
                doorSwipeDragDistance === 0
                  ? "opacity 180ms ease, transform 220ms ease"
                  : "opacity 180ms ease"
              }
            >
              <Flex
                h="48px"
                px="18px"
                borderRadius="999px"
                bgColor="rgba(60, 44, 34, 0.82)"
                border="1px solid rgba(255, 244, 230, 0.4)"
                boxShadow="0 12px 26px rgba(32, 22, 16, 0.22)"
                alignItems="center"
                gap="10px"
                animation={`${doorSwipePromptFloat} 1.8s ease-in-out infinite`}
              >
                <Flex
                  w="30px"
                  h="30px"
                  borderRadius="999px"
                  bgColor="rgba(255, 244, 230, 0.18)"
                  alignItems="center"
                  justifyContent="center"
                  animation={`${doorSwipeArrowNudge} 1.05s ease-in-out infinite`}
                >
                  <IoArrowBack color="#FFF4E6" size={22} />
                </Flex>
                <Text color="#FFF4E6" fontSize="15px" fontWeight="800" lineHeight="1">
                  {activeDoorSwipeInteraction.instruction ?? "往左滑開門"}
                </Text>
              </Flex>
            </Flex>
            <Flex
              position="absolute"
              left="0"
              right="0"
              top="calc(52% + 78px)"
              zIndex={1}
              pointerEvents="none"
              alignItems="center"
              justifyContent="center"
              opacity={doorSwipePhase === "prompt" ? Math.max(0.16, 0.76 - doorSwipeProgress * 0.7) : 0}
              transition="opacity 180ms ease"
            >
              <Flex
                w="154px"
                h="4px"
                borderRadius="999px"
                bgColor="rgba(255, 244, 230, 0.28)"
                overflow="hidden"
              >
                <Flex
                  h="100%"
                  w={`${Math.max(18, doorSwipeProgress * 154)}px`}
                  borderRadius="999px"
                  bgColor="#FFF4E6"
                  transition={doorSwipeDragDistance === 0 ? "width 180ms ease" : "none"}
                />
              </Flex>
            </Flex>
          </Flex>
        ) : null}

        {isDiaryPageConversationActive ? (
          <Flex position="absolute" inset="0" zIndex={25} overflow="hidden" bgColor="#F7F0E4">
            <Flex
              position="absolute"
              inset="0"
              bg="repeating-linear-gradient(116deg, #F7F0E4 0px, #F7F0E4 28px, #EEE2D0 28px, #EEE2D0 50px)"
            />
            <Flex
              position="absolute"
              right="0"
              bottom="0"
              w="90%"
              h="calc(100% - 64px)"
              overflow="hidden"
              pointerEvents="none"
            >
              <img
                src="/images/diary/diary_bg.png"
                alt="日記背景"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  objectPosition: "left bottom",
                  opacity: 0.98,
                }}
              />
            </Flex>
            <Flex position="relative" zIndex={1} flex="1" minH="0" direction="column" mr="0" mt="8px">
              <Flex justifyContent="space-between" alignItems="center" pb="10px">
                <Flex w="86px" h="38px" />
                <Flex
                  minW="132px"
                  h="40px"
                  px="20px"
                  borderRadius="8px"
                  bgColor="#A57C58"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="white" fontSize="16px" fontWeight="400">
                    交換日記
                  </Text>
                </Flex>
              </Flex>

              <Flex position="relative" flex="1" minH="0" overflow="hidden" ml="10%" mt="12px">
                <Flex position="absolute" left="48px" right="16px" top="50px" bottom="0" direction="column">
                  <Text color="#151515" fontSize="16px" fontWeight="400" lineHeight="1.5" mb="20px">
                    XX年X月X日 練團那天
                  </Text>
                  <Flex
                    h="178px"
                    borderRadius="8px"
                    bgColor="#FAF3E7"
                    px="18px"
                    py="16px"
                    alignItems="flex-end"
                  >
                    <Text color="#C0A38A" fontSize="13px" fontWeight="400" lineHeight="1.6">
                      趕上捷運後，小白一臉困惑的日記插圖，
                      <br />
                      旁邊畫了一隻黃金獵犬
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
              {scene.nextSceneId ? (
                <Flex
                  position="absolute"
                  inset="0"
                  zIndex={20}
                  pointerEvents="auto"
                  cursor="pointer"
                  onClick={() => {
                    handleStoryRequestNext(scene.nextSceneId!);
                  }}
                >
                  <Flex
                    position="absolute"
                    left="36px"
                    bottom={`calc(${EVENT_DIALOG_HEIGHT} + 8px)`}
                    zIndex={21}
                    pointerEvents="none"
                  >
                    <EventAvatarSprite
                      spriteId={scene.dialogAvatarSpriteId ?? "mai"}
                      frameIndex={scene.dialogAvatarFrameIndex}
                    />
                  </Flex>
                  <Flex
                    position="absolute"
                    left="0"
                    right="0"
                    bottom="0"
                    pointerEvents="auto"
                  >
                    <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
                      <Text color="white" fontWeight="700">
                        {scene.characterName}
                      </Text>
                      <Flex flex="1" minH="0" direction="column" justifyContent="center">
                        <Text color="white" fontSize="16px" lineHeight="1.5" whiteSpace="pre-line">
                          {scene.dialogue}
                        </Text>
                      </Flex>
                      <EventContinueAction
                        onClick={() => {
                          handleStoryRequestNext(scene.nextSceneId!);
                        }}
                      />
                    </EventDialogPanel>
                  </Flex>
                </Flex>
              ) : null}
            </Flex>
          </Flex>
        ) : null}

        {shouldHideImageOnlySceneDialogPanel || isDiaryConversationScene || !shouldShowSceneDialogPanel ? null : isScene44Interactive ? (
          <Flex mt="auto" w="100%" position="relative">
            <Flex
              position="absolute"
              left="14px"
              bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
              zIndex={6}
              pointerEvents="none"
            >
              <EventAvatarSprite
                spriteId="mai-beigo"
                frameIndex={scene44Speaker === "小貝狗" ? 1 : 0}
              />
            </Flex>
            <EventDialogPanel w="100%">
              <Text color="white" fontWeight="700">
                {scene44Speaker}
              </Text>
              <Flex flex="1" minH="0" direction="column" justifyContent="center" gap="8px">
                <Text color="white" fontSize="16px" lineHeight="1.5">
                  {scene44Text}
                </Text>
                {scene44Step === "choose" ? (
                  <Flex direction="column" gap="8px">
                    <Flex
                      h="34px"
                      borderRadius="8px"
                      bgColor={scene44Asked.metro ? "rgba(140,140,140,0.38)" : "rgba(255,255,255,0.14)"}
                      border="1px solid rgba(255,255,255,0.26)"
                      alignItems="center"
                      justifyContent="center"
                      cursor={scene44Asked.metro ? "default" : "pointer"}
                      onClick={() => {
                        if (scene44Asked.metro) return;
                        handleScene44SelectTopic("metro");
                      }}
                    >
                      <Text color="white" fontSize="13px" fontWeight="700">
                        捷運站 {scene44Asked.metro ? "（已詢問）" : ""}
                      </Text>
                    </Flex>
                    <Flex
                      h="34px"
                      borderRadius="8px"
                      bgColor={scene44Asked.dog ? "rgba(140,140,140,0.38)" : "rgba(255,255,255,0.14)"}
                      border="1px solid rgba(255,255,255,0.26)"
                      alignItems="center"
                      justifyContent="center"
                      cursor={scene44Asked.dog ? "default" : "pointer"}
                      onClick={() => {
                        if (scene44Asked.dog) return;
                        handleScene44SelectTopic("dog");
                      }}
                    >
                      <Text color="white" fontSize="13px" fontWeight="700">
                        黃金獵犬 {scene44Asked.dog ? "（已詢問）" : ""}
                      </Text>
                    </Flex>
                    {allScene44Asked ? (
                      <Flex
                        h="34px"
                        borderRadius="999px"
                        bgColor="rgba(255,255,255,0.9)"
                        alignItems="center"
                        justifyContent="center"
                        cursor="pointer"
                        onClick={() => {
                          setScene44Step("final");
                          setScene44FinalTurn(0);
                        }}
                      >
                        <Text color="#5F4C3B" fontSize="13px" fontWeight="700">
                          問交換日記
                        </Text>
                      </Flex>
                    ) : null}
                  </Flex>
                ) : null}
              </Flex>
              {scene44Step === "intro" || scene44Step === "qa" || scene44Step === "final" ? (
                <EventContinueAction onClick={handleScene44Continue} />
              ) : null}
            </EventDialogPanel>
          </Flex>
	        ) : isNightHubInteractive ? (
	          <Flex position="absolute" inset="0" w="100%" h="100%" zIndex={8} direction="column" justifyContent="flex-end">
	            {nightHubSunbeastFollowupIndex !== null && activeNightHubSunbeastFollowupLine ? (
              <EventDialogPanel w="100%">
                <Text color="white" fontWeight="700">
                  {activeNightHubSunbeastFollowupLine.speaker}
                </Text>
                <Flex flex="1" minH="0" direction="column" justifyContent="center" gap="8px">
                  <Text color="white" fontSize="16px" lineHeight="1.5">
                    {activeNightHubSunbeastFollowupLine.text}
                  </Text>
                </Flex>
                <EventContinueAction onClick={handleNightHubSunbeastFollowupContinue} />
              </EventDialogPanel>
            ) : nightHubStep === "talk" ? (
              <EventDialogPanel w="100%">
                <Text color="white" fontWeight="700">
                  {nightHubSpeaker}
                </Text>
                <Flex flex="1" minH="0" direction="column" justifyContent="center" gap="8px">
                  <Text color="white" fontSize="16px" lineHeight="1.5">
                    {nightHubText}
                  </Text>
                </Flex>
                <EventContinueAction onClick={handleNightHubContinue} />
              </EventDialogPanel>
	            ) : (
	              <Flex position="absolute" inset="0" overflow="hidden">
	                <Flex position="absolute" inset="0">
	                  <img
	                    src="/images/428出圖/背景/房間_開燈.jpg"
	                    alt=""
	                    aria-hidden="true"
	                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center bottom", display: "block" }}
	                  />
	                </Flex>

		                {!shouldHideNightHubIconsForGuide ? (
		                  <>
		                <Flex position="absolute" left="26px" top="64px" gap="16px" alignItems="center">
	                  <Flex
	                    w="80px"
	                    h="72px"
	                    borderRadius="8px"
	                    bgColor="rgba(157,120,89,0.82)"
	                    direction="column"
	                    alignItems="center"
	                    justifyContent="center"
	                    gap="4px"
	                    color="#FFFFFF"
	                    boxShadow="0 4px 10px rgba(77,55,37,0.12)"
	                  >
	                    <Flex w="42px" h="32px" overflow="hidden" alignItems="center" justifyContent="center">
	                      <img
	                        src="/images/icon/icon_mai.png"
	                        alt=""
	                        aria-hidden="true"
	                        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
	                      />
	                    </Flex>
	                    <Text color="#FFFFFF" fontSize="16px" fontWeight="500" lineHeight="1">
	                      小麥
	                    </Text>
	                  </Flex>
	                  <Flex gap="8px" alignItems="center">
	                    <Flex
	                      as="button"
	                      h="36px"
	                      minW="82px"
	                      px="12px"
	                      border="0"
	                      borderRadius="999px"
	                      bgColor="#AC8C6F"
	                      alignItems="center"
	                      justifyContent="center"
	                      gap="8px"
	                      color="#FFFFFF"
	                      boxShadow="0 3px 8px rgba(77,55,37,0.12)"
	                      cursor="pointer"
	                      aria-label="查看金幣說明"
	                      _hover={{ bgColor: "#9C7B5E" }}
	                      onClick={() => setNightHubResourceInfo("coins")}
	                    >
	                      <FaCoins size={20} color="#F6D66D" />
	                      <Text color="#FFFFFF" fontSize="15px" fontWeight="500" lineHeight="1">
	                        {nightHubProgress?.status.savings ?? 0}
	                      </Text>
	                    </Flex>
	                    <Flex
	                      as="button"
	                      h="36px"
	                      minW="82px"
	                      px="12px"
	                      border="0"
	                      borderRadius="999px"
	                      bgColor="rgba(87, 116, 144, 0.88)"
	                      alignItems="center"
	                      justifyContent="center"
	                      gap="8px"
	                      color="#FFFFFF"
	                      boxShadow="0 3px 8px rgba(77,55,37,0.12)"
	                      cursor="pointer"
	                      aria-label="查看疲勞說明"
	                      _hover={{ bgColor: "rgba(72, 100, 130, 0.95)" }}
	                      onClick={() => setNightHubResourceInfo("fatigue")}
	                    >
	                      <FaDroplet size={18} color="#CFE8FF" />
	                      <Text color="#FFFFFF" fontSize="15px" fontWeight="500" lineHeight="1">
	                        {nightHubProgress?.status.fatigue ?? 0}
	                      </Text>
	                    </Flex>
	                  </Flex>
	                </Flex>

	                <Flex
	                  as="button"
	                  position="absolute"
	                  right="64px"
	                  top="24px"
	                  h="38px"
	                  minW="82px"
	                  px="12px"
	                  border="0"
	                  borderRadius="999px"
	                  bgColor="rgba(255,255,255,0.9)"
	                  alignItems="center"
	                  justifyContent="center"
	                  gap="7px"
	                  color="#7B6049"
	                  boxShadow="0 6px 14px rgba(77,55,37,0.16)"
	                  cursor="pointer"
	                  aria-label="前往大廳"
	                  onClick={handleOpenGameLobby}
	                >
	                  <IoGridOutline size={18} />
	                  <Text color="#7B6049" fontSize="13px" fontWeight="900" lineHeight="1">
	                    大廳
	                  </Text>
	                </Flex>

	                <Flex
	                  position="absolute"
	                  left="16px"
	                  bottom="28px"
	                  direction="column"
	                  gap="10px"
	                  zIndex={shouldFocusNightHubSleepButton ? 22 : undefined}
	                >
	                  {shouldShowNightHubBaiRoomOption ? (
	                    <Flex
	                      as="button"
	                      h="48px"
	                      minW="176px"
	                      px="18px"
	                      borderRadius="8px"
	                      bgColor="rgba(142, 109, 82, 0.94)"
	                      border="2px solid rgba(255,255,255,0.92)"
	                      alignItems="center"
	                      justifyContent="center"
	                      color="#FFFFFF"
	                      boxShadow="0 6px 14px rgba(77,55,37,0.2)"
	                      cursor="pointer"
	                      aria-label="去小白房間瞧瞧"
	                      onClick={() => handleNightHubSelectTopic("bai")}
	                    >
	                      <Text color="#FFFFFF" fontSize="15px" fontWeight="700" lineHeight="1">
	                        去小白房間瞧瞧
	                      </Text>
	                    </Flex>
	                  ) : null}
	                  <Flex
	                    as="button"
	                    w="72px"
	                    h="72px"
	                    borderRadius="8px"
	                    bg="linear-gradient(180deg, #9596C0 0%, #5E61AB 100%)"
	                    border="2px solid rgba(255,255,255,0.9)"
	                    direction="column"
	                    alignItems="center"
	                    justifyContent="center"
	                    gap="6px"
	                    color="#FFFFFF"
	                    boxShadow={
	                      shouldFocusNightHubSleepButton
	                        ? "0 0 0 4px rgba(255,255,255,0.82), 0 12px 26px rgba(20,16,12,0.42)"
	                        : "0 4px 10px rgba(55,48,82,0.18)"
	                    }
	                    cursor={shouldBlockNightHubSleepButton ? "default" : "pointer"}
	                    pointerEvents={shouldBlockNightHubSleepButton ? "none" : "auto"}
	                    aria-label="睡覺"
	                    onClick={handleNightHubSleep}
	                  >
	                    <FaMoon size={25} />
	                    <Text color="#FFFFFF" fontSize="15px" fontWeight="500" lineHeight="1">
	                      睡覺
	                    </Text>
	                  </Flex>
	                </Flex>

	                <Flex
	                  position="absolute"
	                  right="18px"
	                  bottom="24px"
	                  w="104px"
	                  py="12px"
		                  borderRadius="10px"
		                  bgColor="rgba(157,120,89,0.8)"
		                  direction="column"
		                  alignItems="center"
		                  gap="10px"
		                  zIndex={shouldFocusNightHubIconRail ? 18 : undefined}
		                >
		                  <Flex as="button" position="relative" w="72px" h="72px" borderRadius="8px" border="2px solid #FFFFFF" overflow="visible" bgColor="#FFFFFF" cursor={shouldBlockNightHubIconRail ? "default" : "pointer"} pointerEvents={shouldBlockNightHubIconRail ? "none" : "auto"} zIndex={shouldFocusNightHubJournalButton ? 20 : undefined} boxShadow={shouldFocusNightHubJournalButton ? "0 0 0 4px rgba(255,255,255,0.82), 0 12px 26px rgba(20,16,12,0.42)" : undefined} onClick={() => handleOpenDiary("journal")}>
		                    <Flex position="absolute" inset="0" overflow="hidden" borderRadius="6px">
		                    <img src="/images/428出圖/追加作畫/漫畫格/地上日記本1.png" alt="" aria-hidden="true" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
		                    <Flex position="absolute" left="-5px" right="-5px" bottom="-2px" h="30px" bgColor="rgba(128,159,140,0.9)" transform="rotate(-6deg)" alignItems="center" justifyContent="center">
		                      <Text color="#FFFFFF" fontSize="17px" fontWeight="500" transform="rotate(6deg)">日記</Text>
		                    </Flex>
		                    </Flex>
		                    {shouldShowNightHubDiaryNewBadge ? (
		                      <Flex
		                        position="absolute"
		                        right="-10px"
		                        top="-10px"
		                        h="24px"
		                        minW="46px"
		                        px="8px"
		                        borderRadius="999px"
		                        bgColor="#FF5C3D"
		                        border="2px solid #FFFFFF"
		                        alignItems="center"
		                        justifyContent="center"
		                        boxShadow="0 4px 10px rgba(72, 52, 36, 0.24)"
		                        pointerEvents="none"
		                      >
		                        <Text color="#FFFFFF" fontSize="11px" fontWeight="900" lineHeight="1" letterSpacing="0">
		                          NEW
		                        </Text>
		                      </Flex>
		                    ) : null}
		                  </Flex>
		                  <Flex as="button" position="relative" w="72px" h="72px" borderRadius="8px" border="2px solid #FFFFFF" overflow="hidden" bgColor="#FFFFFF" cursor={shouldBlockNightHubIconRail ? "default" : "pointer"} pointerEvents={shouldBlockNightHubIconRail ? "none" : "auto"} zIndex={shouldFocusNightHubSunbeastButton ? 20 : undefined} boxShadow={shouldFocusNightHubSunbeastButton ? "0 0 0 4px rgba(255,255,255,0.82), 0 12px 26px rgba(20,16,12,0.42)" : undefined} onClick={() => handleOpenDiary("sunbeast")}>
		                    <img src="/images/428出圖/漫畫格/第一章/探頭的小貝狗２.png" alt="" aria-hidden="true" style={{ width: "120%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
		                    <Flex position="absolute" left="-5px" right="-5px" bottom="-2px" h="30px" bgColor="rgba(128,159,140,0.9)" transform="rotate(-6deg)" alignItems="center" justifyContent="center">
		                      <Text color="#FFFFFF" fontSize="17px" fontWeight="500" transform="rotate(6deg)">小日獸</Text>
		                    </Flex>
		                  </Flex>
		                  {ENABLE_NIGHT_HUB_GUIDANCE_SYSTEM ? (
		                    <Flex as="button" position="relative" w="72px" h="72px" borderRadius="8px" border="2px solid #FFFFFF" overflow="hidden" bgColor="#FFFFFF" opacity={1} pointerEvents={shouldBlockNightHubIconRail ? "none" : "auto"} zIndex={shouldFocusNightHubPlaceButton ? 20 : undefined} boxShadow={shouldFocusNightHubPlaceButton ? "0 0 0 4px rgba(255,255,255,0.82), 0 12px 26px rgba(20,16,12,0.42)" : undefined} cursor="pointer" onClick={handleOpenPlaceMap}>
		                      <img src="/images/428出圖/背景/捷運.png" alt="" aria-hidden="true" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
		                      <Flex position="absolute" left="-5px" right="-5px" bottom="-2px" h="30px" bgColor="rgba(128,159,140,0.9)" transform="rotate(-6deg)" alignItems="center" justifyContent="center">
		                        <Text color="#FFFFFF" fontSize="17px" fontWeight="500" transform="rotate(6deg)">地點</Text>
		                      </Flex>
		                    </Flex>
		                  ) : null}
		                  {ENABLE_NIGHT_HUB_GUIDANCE_SYSTEM ? (
		                    <Flex
		                      as="button"
		                      position="relative"
		                      w="72px"
		                      h="72px"
		                      borderRadius="8px"
		                      border="2px solid #FFFFFF"
		                      overflow="hidden"
		                      bgColor="#FFFFFF"
		                      opacity={shouldShowNightHubMission ? 1 : 0.72}
		                      pointerEvents={shouldBlockNightHubIconRail ? "none" : "auto"}
		                      zIndex={shouldFocusNightHubMissionButton ? 20 : undefined}
		                      boxShadow={shouldFocusNightHubMissionButton ? "0 0 0 4px rgba(255,255,255,0.82), 0 12px 26px rgba(20,16,12,0.42)" : undefined}
		                      cursor={shouldShowNightHubMission ? "pointer" : "default"}
		                      onClick={handleOpenNightHubMission}
		                    >
		                      <img src="/images/428出圖/漫畫格/第一章/相機.png" alt="" aria-hidden="true" style={{ width: "145%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
		                      <Flex position="absolute" left="-5px" right="-5px" bottom="-2px" h="30px" bgColor="rgba(128,159,140,0.9)" transform="rotate(-6deg)" alignItems="center" justifyContent="center">
		                        <Text color="#FFFFFF" fontSize="17px" fontWeight="500" transform="rotate(6deg)">任務</Text>
		                      </Flex>
	                     </Flex>
		                  ) : null}
	                </Flex>

	                {nightHubResourceInfoContent ? (
	                  <Flex
	                    position="absolute"
	                    inset="0"
	                    zIndex={42}
	                    bgColor="rgba(24, 18, 14, 0.48)"
	                    alignItems="center"
	                    justifyContent="center"
	                    px="24px"
	                    onClick={() => setNightHubResourceInfo(null)}
	                  >
	                    <Flex
	                      w="min(318px, 100%)"
	                      borderRadius="8px"
	                      bgColor="#FFF7EC"
	                      border="2px solid rgba(255,255,255,0.92)"
	                      boxShadow="0 18px 38px rgba(38, 27, 18, 0.32)"
	                      direction="column"
	                      alignItems="center"
	                      gap="14px"
	                      px="22px"
	                      py="22px"
	                      textAlign="center"
	                      onClick={(event) => event.stopPropagation()}
	                    >
	                      <Text color="#6F543D" fontSize="22px" fontWeight="700" lineHeight="1.2">
	                        {nightHubResourceInfoContent.title}
	                      </Text>
	                      <Text color="#7B6049" fontSize="16px" fontWeight="500" lineHeight="1.6">
	                        {nightHubResourceInfoContent.description}
	                      </Text>
	                      <Flex
	                        as="button"
	                        h="40px"
	                        minW="116px"
	                        px="22px"
	                        border="0"
	                        borderRadius="8px"
	                        bgColor="#8E6D52"
	                        alignItems="center"
	                        justifyContent="center"
	                        cursor="pointer"
	                        _hover={{ bgColor: "#7E5E45" }}
	                        onClick={() => setNightHubResourceInfo(null)}
	                      >
	                        <Text color="#FFFFFF" fontSize="15px" fontWeight="700" lineHeight="1">
	                          知道了
	                        </Text>
	                      </Flex>
	                    </Flex>
	                  </Flex>
	                ) : null}

	                {shouldBlockNightHubIconRail ? (
	                  <Flex
	                    position="absolute"
	                    inset="0"
	                    zIndex={16}
	                    bgColor="rgba(22,18,14,0.58)"
	                    pointerEvents="auto"
	                    onClick={(event) => {
	                      event.preventDefault();
	                      event.stopPropagation();
	                    }}
	                  />
	                ) : null}

	                {shouldShowNightHubJournalPointer || shouldShowNightHubSunbeastPointer || shouldShowNightHubPlacePointer || shouldShowNightHubMissionPointer ? (
	                  <Flex
	                    position="absolute"
	                    right="126px"
	                    bottom={
	                      shouldShowNightHubJournalPointer
	                        ? ENABLE_NIGHT_HUB_GUIDANCE_SYSTEM
	                          ? "285px"
	                          : "121px"
	                        : effectiveNightHubGuideStep === "first-home-sunbeast-pointer"
	                          ? ENABLE_NIGHT_HUB_GUIDANCE_SYSTEM
	                            ? "203px"
	                            : "39px"
	                        : shouldShowNightHubMissionPointer
	                        ? "39px"
	                        : shouldShowNightHubPlacePointer
	                          ? "121px"
	                          : "203px"
	                    }
	                    zIndex={21}
	                    alignItems="center"
	                    pointerEvents="none"
	                    animation={`${nightHubSunbeastPointerNudge} 0.82s ease-in-out infinite`}
	                  >
	                    <img
	                      src="/images/pointer_up.png"
	                      alt=""
	                      aria-hidden="true"
	                      style={{
	                        width: "54px",
	                        height: "54px",
	                        objectFit: "contain",
	                        display: "block",
	                        filter: "drop-shadow(0 3px 7px rgba(72, 52, 36, 0.28))",
	                      }}
	                    />
	                  </Flex>
	                ) : null}

	                {shouldShowNightHubSleepPointer ? (
	                  <Flex
	                    position="absolute"
	                    left="92px"
	                    bottom="37px"
	                    zIndex={23}
	                    alignItems="center"
	                    pointerEvents="none"
	                    animation={`${nightHubSleepPointerNudge} 0.82s ease-in-out infinite`}
	                  >
	                    <img
	                      src="/images/pointer_up.png"
	                      alt=""
	                      aria-hidden="true"
	                      style={{
	                        width: "54px",
	                        height: "54px",
	                        objectFit: "contain",
	                        display: "block",
	                        filter: "drop-shadow(0 3px 7px rgba(72, 52, 36, 0.28))",
	                      }}
	                    />
	                  </Flex>
	                ) : null}

		                {nightHubStep === "chat-select" ? (
	                  <Flex position="absolute" left="102px" bottom="122px" right="118px" direction="column" gap="8px">
	                    <Text color="#6B543E" fontSize="14px" fontWeight="700" textShadow="0 1px 0 rgba(255,255,255,0.7)">
	                      想先和誰聊聊呢？
	                    </Text>
	                    <Flex gap="8px">
	                      <Flex as="button" flex="1" h="44px" borderRadius="8px" bgColor={nightHubAsked.beigo ? "rgba(120,95,70,0.72)" : "#8E6D52"} alignItems="center" justifyContent="center" opacity={nightHubAsked.beigo ? 0.68 : 1} cursor={nightHubAsked.beigo ? "default" : "pointer"} onClick={() => {
	                        if (nightHubAsked.beigo) return;
	                        handleNightHubSelectTopic("beigo");
	                      }}>
	                        <Text color="#FFFFFF" fontSize="14px" fontWeight="700">小貝狗</Text>
	                      </Flex>
	                      <Flex as="button" flex="1" h="44px" borderRadius="8px" bgColor="rgba(255,255,255,0.86)" alignItems="center" justifyContent="center" cursor="pointer" onClick={handleNightHubBackToMenu}>
	                        <Text color="#806248" fontSize="14px" fontWeight="700">返回</Text>
	                      </Flex>
	                    </Flex>
	                  </Flex>
		                ) : null}
		                  </>
		                ) : null}
	                {activeFirstHomeHubGuideBubble ? (
	                  <Flex
	                    position="absolute"
	                    inset="0"
	                    zIndex={28}
	                    cursor="pointer"
	                    onClick={handleNightHubGuideContinue}
	                  >
	                    <Flex
	                      position="absolute"
	                      left={"left" in activeFirstHomeHubGuideBubble ? activeFirstHomeHubGuideBubble.left : undefined}
	                      right={"right" in activeFirstHomeHubGuideBubble ? activeFirstHomeHubGuideBubble.right : undefined}
	                      bottom={activeFirstHomeHubGuideBubble.bottom}
	                      maxW={activeFirstHomeHubGuideBubble.maxW}
	                      px="13px"
	                      py="10px"
	                      borderRadius="14px"
	                      bgColor="rgba(255, 250, 235, 0.98)"
	                      border="2px solid #B98A62"
	                      boxShadow="0 10px 20px rgba(86, 58, 35, 0.22)"
	                      alignItems="center"
	                      pointerEvents="auto"
	                      onClick={(event) => {
	                        event.stopPropagation();
	                        handleNightHubGuideContinue();
	                      }}
	                    >
	                      <Flex
	                        position="absolute"
	                        left={"arrowLeft" in activeFirstHomeHubGuideBubble ? activeFirstHomeHubGuideBubble.arrowLeft : undefined}
	                        right={"arrowRight" in activeFirstHomeHubGuideBubble ? activeFirstHomeHubGuideBubble.arrowRight : undefined}
	                        top={activeFirstHomeHubGuideBubble.arrowTop}
	                        transform={activeFirstHomeHubGuideBubble.arrowTransform}
	                        w="12px"
	                        h="12px"
	                        bgColor="rgba(255, 250, 235, 0.98)"
	                        borderLeft={"arrowLeft" in activeFirstHomeHubGuideBubble ? "2px solid #B98A62" : undefined}
	                        borderBottom="2px solid #B98A62"
	                        borderRight={"arrowRight" in activeFirstHomeHubGuideBubble ? "2px solid #B98A62" : undefined}
	                      />
	                      <Text color="#7B5C43" fontSize="14px" fontWeight="900" lineHeight="1.45">
	                        {activeFirstHomeHubGuideBubble.text}
	                      </Text>
	                    </Flex>
	                  </Flex>
	                ) : null}
	                {shouldShowNightHubLobbyGuide ? (
	                  <ChapterCompletionLobbyGuide onGoToLobby={handleOpenGameLobby} />
	                ) : null}
	                {effectiveNightHubGuideStep === "sunbeast-dialog" ? (
	                  <>
	                    <Flex
	                      position="absolute"
	                      left="14px"
	                      bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
	                      zIndex={15}
	                      pointerEvents="none"
	                    >
	                      <EventAvatarSprite
	                        spriteId="mai"
	                        frameIndex={36}
	                        motionId="slide-in-left"
	                      />
	                    </Flex>
	                    <Flex
	                      position="absolute"
	                      inset="0"
	                      zIndex={16}
	                      direction="column"
	                      justifyContent="flex-end"
	                      cursor="pointer"
	                      onClick={handleNightHubGuideContinue}
	                    >
	                      <EventDialogPanel w="100%">
	                        <Text color="white" fontWeight="700">
	                          小麥
	                        </Text>
	                        <Flex flex="1" minH="0" direction="column" justifyContent="center" gap="8px">
	                          <Text color="white" fontSize="16px" lineHeight="1.5">
	                            忙了一天終於到家了，來好好想想。
	                            <br />
	                            除了直太郎，那其他小日獸呢？
	                          </Text>
	                        </Flex>
	                        <EventContinueAction onClick={handleNightHubGuideContinue} />
	                      </EventDialogPanel>
	                    </Flex>
	                  </>
	                ) : null}
		              </Flex>
	            )}
          </Flex>
        ) : isMorningHubInteractive ? (
          isWeekendMorningHub ? (
            <Flex mt="auto" w="100%" position="relative">
              <Flex
                position="absolute"
                left="14px"
                bottom="316px"
                zIndex={6}
                pointerEvents="none"
              >
                <EventAvatarSprite spriteId="mai" frameIndex={0} />
              </Flex>
              <Flex
                w="100%"
                minH="316px"
                bg="linear-gradient(180deg, rgba(142,109,82,0.95) 0%, rgba(130,98,73,0.98) 100%)"
                borderTopRadius="22px"
                px="16px"
                pt="16px"
                pb="18px"
                direction="column"
                gap="12px"
                position="relative"
                zIndex={8}
                boxShadow="0 -10px 24px rgba(36,24,16,0.22)"
              >
                <Text color="white" fontWeight="700">
                  小麥
                </Text>
                <Flex flex="1" minH="0" direction="column" gap="10px">
                  <Text color="white" fontSize="18px" lineHeight="1.55">
                    {weekendSelectedDestination
                      ? `${weekendSelectedDestination.title}已經決定好了，今天就照自己的步調過吧。`
                      : "今天是自由安排日，不用趕著上班。想去哪裡走走呢？"}
                  </Text>
                  {weekendSelectedDestination ? (
                    <>
                      <Flex
                        flex="1"
                        borderRadius="16px"
                        bgColor="rgba(255,255,255,0.14)"
                        border="1px solid rgba(255,255,255,0.22)"
                        px="14px"
                        py="12px"
                        direction="column"
                        gap="8px"
                        justifyContent="center"
                      >
                        <Text color="#FFF3E3" fontSize="18px" fontWeight="700">
                          {weekendSelectedDestination.icon} {weekendSelectedDestination.title}
                        </Text>
                        <Text color="#F6E8D5" fontSize="14px" lineHeight="1.6">
                          {weekendSelectedDestination.resultText}
                        </Text>
                        <Text color="#FDE8C4" fontSize="13px" fontWeight="700">
                          {weekendSelectedDestination.effectLabel}
                        </Text>
                      </Flex>
                      <Flex
                        h="46px"
                        borderRadius="999px"
                        bgColor="rgba(255,255,255,0.92)"
                        alignItems="center"
                        justifyContent="center"
                        cursor="pointer"
                        onClick={handleWeekendEndDay}
                      >
                        <Text color="#5F4C3B" fontSize="15px" fontWeight="700">
                          今天就先這樣，回家休息
                        </Text>
                      </Flex>
                    </>
                  ) : (
                    <>
                      <Text color="#EEDFCB" fontSize="13px" fontWeight="700">
                        {formatInGameDateLabel(currentDay)} ・ 週末自由安排日
                      </Text>
                      <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="12px">
                        {weekendDestinationOptions.map((option, index) => (
                          <Flex
                            key={option.id}
                            minH="158px"
                            borderRadius="18px"
                            bgColor="rgba(255,255,255,0.14)"
                            border="1px solid rgba(255,255,255,0.22)"
                            px="14px"
                            py="14px"
                            direction="column"
                            alignItems="center"
                            justifyContent="space-between"
                            textAlign="center"
                            cursor="pointer"
                            gridColumn={
                              weekendDestinationOptions.length % 2 === 1 &&
                              index === weekendDestinationOptions.length - 1
                                ? "span 2"
                                : undefined
                            }
                            onClick={() => handleWeekendDestinationSelect(option)}
                          >
                            <Text color="#FFF2E0" fontSize="34px" lineHeight="1">
                              {option.icon}
                            </Text>
                            <Text color="white" fontSize="18px" fontWeight="700" lineHeight="1.2">
                              {option.title}
                            </Text>
                            <Text color="#EEDFCB" fontSize="13px" lineHeight="1.4">
                              {option.subtitle}
                            </Text>
                            <Text color="#FDE8C4" fontSize="12px" fontWeight="700" lineHeight="1.4">
                              {option.effectLabel}
                            </Text>
                          </Flex>
                        ))}
                      </Grid>
                    </>
                  )}
                </Flex>
              </Flex>
            </Flex>
          ) : (
            <Flex mt="auto" w="100%" position="relative">
              <Flex
                position="absolute"
                left="14px"
                bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                zIndex={6}
                pointerEvents="none"
              >
                <EventAvatarSprite
                  spriteId="mai"
                  frameIndex={0}
                />
              </Flex>
              <EventDialogPanel w="100%">
                <Text color="white" fontWeight="700">
                  小麥
                </Text>
                <Flex flex="1" minH="0" direction="column" justifyContent="center" gap="8px">
                  <Text color="white" fontSize="16px" lineHeight="1.5">
                    時間差不多了
                  </Text>
                  <Flex
                    h="38px"
                    borderRadius="999px"
                    bgColor="rgba(255,255,255,0.9)"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    onClick={() => {
                      const latestProgress = ensureDailyAdventureMainStoryReturnRouteProgress();
                      const shouldUseLegacyFrogClueRoute =
                        latestProgress.unlockedDiaryEntryIds.includes("bai-entry-1") &&
                        !latestProgress.unlockedDiaryEntryIds.includes("bai-entry-2") &&
                        !latestProgress.hasCompletedStreetForgotLunchFrogEvent &&
                        latestProgress.streetForgotLunchFrogPhotoAttemptCount > 0;
                      const shouldUseKoalaArrangeRoute =
                        latestProgress.hasCompletedStreetForgotLunchFrogEvent &&
                        latestProgress.unlockedDiaryEntryIds.includes("bai-entry-5") &&
                        latestProgress.dependentCoworkerRequestCount < 3;
                      startPathTransition(
                        shouldUseLegacyFrogClueRoute
                          ? `${ROUTES.gameArrangeRoute}?storyRoute=frog-clue`
                          : shouldUseKoalaArrangeRoute
                            ? `${ROUTES.gameArrangeRoute}?storyRoute=koala-work`
                            : `${ROUTES.gameArrangeRoute}?day=next`,
                        "fade-black",
                        420,
                      );
                    }}
                  >
                    <Text color="#5F4C3B" fontSize="14px" fontWeight="700">
                      出門安排通勤路線
                    </Text>
                  </Flex>
                </Flex>
              </EventDialogPanel>
            </Flex>
          )
        ) : activeFrogDessertShopOffworkLine ? (
          <Flex mt="auto" w="100%" position="relative">
            <Flex
              position="absolute"
              left="14px"
              bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
              zIndex={6}
              pointerEvents="none"
            >
              <EventAvatarSprite
                spriteId={activeFrogDessertShopOffworkLine.spriteId}
                frameIndex={activeFrogDessertShopOffworkLine.frameIndex}
              />
            </Flex>
            <EventDialogPanel w="100%">
              <Text color="white" fontWeight="700">
                {activeFrogDessertShopOffworkLine.speaker}
              </Text>
              <Flex flex="1" minH="0" direction="column" justifyContent="center" gap="8px">
                <Text color="white" fontSize="16px" lineHeight="1.5">
                  {activeFrogDessertShopOffworkLine.text}
                </Text>
                <Flex
                  as="button"
                  h="38px"
                  borderRadius="999px"
                  bgColor="rgba(255,255,255,0.9)"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  onClick={() => {
                    if (!isFrogDessertShopOffworkFinalLine) {
                      setFrogDessertShopOffworkLineIndex((current) =>
                        Math.min(current + 1, FROG_DESSERT_SHOP_OFFWORK_DIALOG_LINES.length - 1),
                      );
                      return;
                    }
                    startPathTransition(`${ROUTES.gameArrangeRoute}?storyRoute=frog-clue`, "fade-black", 420);
                  }}
                >
                  <Text color="#5F4C3B" fontSize="14px" fontWeight="700">
                    {isFrogDessertShopOffworkFinalLine ? "開始尋找甜點店" : "繼續"}
                  </Text>
                </Flex>
              </Flex>
            </EventDialogPanel>
          </Flex>
        ) : isBeigoObservationScene ? (
          isDiaryOpen ? null : activeBeigoObservationDialogue ? (
            <StoryDialogPanel
              key={`beigo-observation-${activeBeigoObservationOptionId}-${activeBeigoObservationDialogueIndex}`}
              characterName={activeBeigoObservationDialogue.characterName}
              dialogue={activeBeigoObservationDialogue.dialogue}
              onContinue={handleBeigoObservationContinue}
              showAvatarSprite={activeBeigoObservationDialogue.showAvatarSprite}
              showCharacterName={
                activeBeigoObservationDialogue.showCharacterName ??
                Boolean(activeBeigoObservationDialogue.characterName)
              }
              avatarSpriteId={activeBeigoObservationDialogue.avatarSpriteId ?? "mai"}
              avatarFrameIndex={activeBeigoObservationDialogue.avatarFrameIndex}
              narrativeMode={scene.narrativeMode}
              typingMode={shouldUseNarrativePause ? "pause" : dialogTypingMode}
            />
          ) : (
            <>
              <Flex
                position="absolute"
                left="32px"
                top="138px"
                w="330px"
                maxW="calc(100% - 64px)"
                h={hasCompletedRequiredBeigoObservations ? "274px" : "215px"}
                zIndex={14}
                direction="column"
                alignItems="center"
                borderRadius="4px"
                border="2px solid rgba(169, 136, 108, 0.96)"
                bgColor="rgba(247, 246, 239, 0.96)"
                bgImage="radial-gradient(circle, rgba(210, 171, 120, 0.5) 1.1px, transparent 1.3px)"
                backgroundSize="13px 13px"
                boxShadow="0 10px 26px rgba(61, 47, 38, 0.12)"
                backdropFilter="blur(1px)"
                data-no-story-advance="true"
              >
                <Text
                  alignSelf="flex-start"
                  mt="37px"
                  ml="28px"
                  color="#5F4B3E"
                  fontSize="20px"
                  fontWeight="700"
                  lineHeight="1.2"
                  letterSpacing="0"
                >
                  觀察四周圍
                </Text>
                <Flex w="calc(100% - 44px)" mt="12px" direction="column" gap="14px">
                  {beigoObservationOptionIds.map((optionId) => {
                    const option = BEIGO_OBSERVATION_RESULT_BY_ID[optionId];
                    const isViewed = beigoObservationCompleted[optionId];
                    return (
                      <Flex
                        as="button"
                        key={`beigo-observation-option-${optionId}`}
                        h="45px"
                        w="100%"
                        border="0"
                        borderRadius="10px"
                        bgColor="#9D7859"
                        alignItems="center"
                        justifyContent="center"
                        cursor="pointer"
                        boxShadow="0 4px 10px rgba(73, 51, 34, 0.12)"
                        _hover={{
                          bgColor: "#8F6D50",
                          transform: "translateY(-1px)",
                        }}
                        _active={{ transform: "translateY(0)" }}
                        transition="background 160ms ease, transform 160ms ease"
                        aria-label={isViewed ? `${option.label}，已查看` : option.label}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleBeigoObservationSelect(optionId);
                        }}
                      >
                        <Text
                          color={isViewed ? "rgba(255, 255, 255, 0.55)" : "#FFFFFF"}
                          fontSize="20px"
                          fontWeight="800"
                          lineHeight="1"
                          letterSpacing="0"
                          whiteSpace="nowrap"
                        >
                          {isViewed ? `${option.label}（已查看）` : option.label}
                        </Text>
                      </Flex>
                    );
                  })}
                </Flex>
              </Flex>
              <StoryDialogPanel
                characterName={scene.characterName}
                dialogue={scene.dialogue}
                dialogueItalicPrefix={scene.dialogueItalicPrefix}
                showAvatarSprite={scene.showDialogAvatar ?? true}
                showCharacterName={scene.showCharacterName ?? true}
                avatarFrameIndex={scene.dialogAvatarFrameIndex}
                avatarSpriteId={scene.dialogAvatarSpriteId ?? "mai"}
                avatarMotionId={scene.dialogAvatarMotionId}
                avatarMotionLoop={scene.dialogAvatarMotionLoop ?? false}
                avatarFlipX={scene.dialogAvatarFlipX ?? false}
                isInnerThought={isInnerThoughtScene}
                showContinueAction={false}
                narrativeMode={scene.narrativeMode}
                typingMode={shouldUseNarrativePause ? "pause" : dialogTypingMode}
              />
            </>
          )
        ) : isBeigoIdentityChoiceScene && scene.choices?.length ? (
          <>
            <Flex
              position="absolute"
              left="32px"
              top="138px"
              w="330px"
              maxW="calc(100% - 64px)"
              h="215px"
              zIndex={14}
              direction="column"
              alignItems="center"
              borderRadius="4px"
              border="2px solid rgba(169, 136, 108, 0.96)"
              bgColor="rgba(247, 246, 239, 0.88)"
              bgImage="radial-gradient(circle, rgba(210, 171, 120, 0.72) 1.1px, transparent 1.3px), linear-gradient(16deg, transparent 0 46%, rgba(172, 163, 138, 0.2) 47%, rgba(172, 163, 138, 0.2) 49%, transparent 50% 100%)"
              backgroundSize="13px 13px, 82px 48px"
              boxShadow="0 10px 26px rgba(61, 47, 38, 0.12)"
              backdropFilter="blur(1px)"
              data-no-story-advance="true"
            >
              <Text
                alignSelf="flex-start"
                mt="38px"
                ml="28px"
                color="#5F4B3E"
                fontSize="20px"
                fontWeight="700"
                lineHeight="1.2"
                letterSpacing="0"
              >
                小貝狗是
              </Text>
              <Flex w="calc(100% - 44px)" mt="12px" direction="column" gap="14px">
                {scene.choices.map((choice) => (
                  <Flex
                    as="button"
                    key={`${scene.id}-${choice.label}`}
                    h="45px"
                    w="100%"
                    border="0"
                    borderRadius="10px"
                    bgColor="#9D7859"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    boxShadow="0 4px 10px rgba(73, 51, 34, 0.12)"
                    _hover={{ bgColor: "#8F6D50", transform: "translateY(-1px)" }}
                    _active={{ transform: "translateY(0)" }}
                    transition="background 160ms ease, transform 160ms ease"
                    aria-label={choice.label}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleStoryChoiceSelect(choice);
                    }}
                  >
                    <Text
                      color="#FFFFFF"
                      fontSize="20px"
                      fontWeight="800"
                      lineHeight="1"
                      letterSpacing="0"
                    >
                      {choice.label}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Flex>
            <StoryDialogPanel
              characterName={scene.characterName}
              dialogue={scene.dialogue}
              dialogueItalicPrefix={scene.dialogueItalicPrefix}
              showAvatarSprite={scene.showDialogAvatar ?? true}
              showCharacterName={scene.showCharacterName ?? true}
              avatarFrameIndex={scene.dialogAvatarFrameIndex}
              avatarSpriteId={scene.dialogAvatarSpriteId ?? "mai"}
              avatarMotionId={scene.dialogAvatarMotionId}
              avatarMotionLoop={scene.dialogAvatarMotionLoop ?? false}
              avatarFlipX={scene.dialogAvatarFlipX ?? false}
              isInnerThought={isInnerThoughtScene}
              showContinueAction={false}
              narrativeMode={scene.narrativeMode}
              typingMode={shouldUseNarrativePause ? "pause" : dialogTypingMode}
            />
          </>
        ) : scene.choices?.length ? (
          <Flex mt="auto" w="100%" position="relative">
            {scene.showDialogAvatar ? (
              <Flex
                position="absolute"
                left="14px"
                bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                zIndex={6}
                pointerEvents="none"
              >
                <EventAvatarSprite
                  spriteId={scene.dialogAvatarSpriteId ?? "mai"}
                  frameIndex={scene.dialogAvatarFrameIndex ?? 0}
                  motionId={scene.dialogAvatarMotionId}
                  motionLoop={scene.dialogAvatarMotionLoop ?? false}
                  flipX={scene.dialogAvatarFlipX ?? false}
                />
              </Flex>
            ) : null}
            <EventDialogPanel w="100%" pb="14px" gap="10px">
              {(scene.showCharacterName ?? true) && scene.characterName ? (
                <Text color="white" fontWeight="700">
                  {scene.characterName}
                </Text>
              ) : null}
              <Flex flex="1" minH="0" direction="column" justifyContent="center" gap="10px">
                {scene.dialogue ? (
                  <Text color="white" fontSize="16px" lineHeight="1.5">
                    {scene.dialogue}
                  </Text>
                ) : null}
                <Flex direction="column" gap="9px" w="100%">
                  {scene.choices.map((choice) => {
                    const isChoiceCompleted = choice.completionKey
                      ? Boolean(completedStoryChoiceKeys[choice.completionKey])
                      : false;
                    return (
                      <Flex
                        as="button"
                        key={`${scene.id}-${choice.label}`}
                        minH="44px"
                        w="100%"
                        borderRadius="8px"
                        border="1px solid rgba(255,255,255,0.28)"
                        bgColor={isChoiceCompleted ? "#FFF8EE" : "rgba(255,255,255,0.92)"}
                        alignItems="center"
                        justifyContent="space-between"
                        gap="10px"
                        px="14px"
                        cursor="pointer"
                        boxShadow="0 6px 14px rgba(71,45,28,0.18)"
                        _hover={{ bgColor: "#FFF8EE", transform: "translateY(-1px)" }}
                        _active={{ transform: "translateY(0px)" }}
                        transition="background 160ms ease, transform 160ms ease"
                        aria-label={isChoiceCompleted ? `${choice.label}，已完成` : choice.label}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleStoryChoiceSelect(choice);
                        }}
                      >
                        <Text color="#5F4C3B" fontSize="15px" fontWeight="800" lineHeight="1.2">
                          {choice.label}
                        </Text>
                        {isChoiceCompleted ? (
                          <Flex
                            h="24px"
                            px="10px"
                            borderRadius="999px"
                            bgColor="#806248"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            <Text color="#FFFFFF" fontSize="12px" fontWeight="800" lineHeight="1">
                              已完成
                            </Text>
                          </Flex>
                        ) : null}
                      </Flex>
                    );
                  })}
                </Flex>
              </Flex>
            </EventDialogPanel>
          </Flex>
        ) : (
          <StoryDialogPanel
            characterName={scene.characterName}
            dialogue={scene.dialogue}
            dialogueItalicPrefix={scene.dialogueItalicPrefix}
            nextSceneId={scene.nextSceneId}
            onRequestNextScene={handleStoryRequestNext}
            showAvatarSprite={scene.showDialogAvatar ?? true}
            showCharacterName={scene.showCharacterName ?? true}
            avatarFrameIndex={scene.dialogAvatarFrameIndex}
            avatarSpriteId={scene.dialogAvatarSpriteId ?? "mai"}
            avatarMotionId={
              isContinueExitActive && scene.continueExitMotionId
                ? scene.continueExitMotionId
                : scene.dialogAvatarMotionId
            }
            avatarMotionLoop={scene.dialogAvatarMotionLoop ?? false}
            avatarFlipX={scene.dialogAvatarFlipX ?? false}
            avatarTransform={
              scene.id === "scene-4d"
                ? scene4ExitPhase === "avatar-exit"
                  ? "translateX(120px)"
                  : undefined
                : scene.id === "scene-10a"
                  ? scene10ExitPhase === "exiting"
                    ? "translateX(120px)"
                    : undefined
                  : undefined
            }
            avatarOpacity={
              scene.id === "scene-4d"
                ? scene4ExitPhase === "avatar-exit"
                  ? 0
                  : 1
                : scene.id === "scene-10a"
                  ? scene10ExitPhase === "exiting"
                    ? 0
                    : 1
                : scene.id === "scene-9"
                  ? scene9PuppetRevealPhase === "dialog"
                    ? 1
                    : 0
                  : 1
            }
            avatarTransition={
              scene.id === "scene-4d" ||
              scene.id === "scene-9" ||
              scene.id === "scene-10a"
                ? "transform 680ms ease, opacity 680ms ease"
                : undefined
            }
            panelOpacity={
              scene.id === "scene-9"
                ? scene9PuppetRevealPhase === "dialog"
                  ? 1
                  : 0
                : scene.id === "scene-10a"
                  ? scene10ExitPhase === "exiting"
                    ? 0
                    : 1
                  : 1
            }
            panelTransition={
              scene.id === "scene-9" || scene.id === "scene-10a" ? "opacity 320ms ease" : undefined
            }
            isInnerThought={isInnerThoughtScene}
            showContinueAction={shouldShowStandardStoryContinueAction}
            narrativeMode={scene.narrativeMode}
            typingMode={shouldUseNarrativePause ? "pause" : dialogTypingMode}
            enableScreenContinue
            onContinueReadyChange={setIsStoryDialogContinueReady}
            onTypingComplete={
              scene.id === "scene-14" ||
              scene.id === "scene-68a" ||
              activeDoorSwipeInteraction
                ? () => {
                    if (scene.id === "scene-14") {
                      if (scene14PuppetTimerRef.current) clearTimeout(scene14PuppetTimerRef.current);
                      scene14PuppetTimerRef.current = setTimeout(() => {
                        setScene14PuppetPhase("visible");
                        scene14PuppetTimerRef.current = null;
                      }, 120);
                    }
                    if (ENABLE_LOCATION_DISCOVERY_BANNER && scene.id === "scene-68a") {
                      setIsScene68LocationDiscoveryVisible(true);
                    }
                    if (activeDoorSwipeInteraction) {
                      scheduleDoorSwipePrompt();
                    }
                  }
                : undefined
            }
          />
        )}
      </Flex>

      {isImageOnlyScene ? null : (
        <EventHistoryOverlay
          title="回顧"
          open={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          lines={historyLines}
        />
      )}
      <DiaryOverlay
        open={isDiaryOpen}
        mode={diaryOverlayMode}
        unlockedEntryIds={unlockedDiaryEntryIds}
        revealEntryId={diaryOverlayMode === "sunbeast-koala-reveal" ? "bai-entry-5" : undefined}
        initialSunbeastCardId={diaryOverlayMode === "sunbeast-koala-reveal" ? "koala" : null}
        onBeigoProfileComplete={() => {
          setCompletedStoryChoiceKeys((prev) => ({ ...prev, beigoProfile: true }));
          setIsDiaryOpen(false);
          setDiaryOverlayMode("default");
          setPendingDiaryNextSceneId(null);
          setPendingStoryChoiceNextSceneId(null);
        }}
        onFragmentedDiaryComplete={() => {
          const nextSceneId = pendingStoryChoiceNextSceneId;
          const completedDiaryOverlayMode = diaryOverlayMode;
          setIsDiaryOpen(false);
          setDiaryOverlayMode("default");
          setPendingDiaryNextSceneId(null);
          setPendingStoryChoiceNextSceneId(null);
          if (
            scene.id === LEGACY_NIGHT_HUB_SCENE_ID &&
            (completedDiaryOverlayMode === "frog-fragmented-diary" ||
              completedDiaryOverlayMode === "frog-diary-catalog-guide")
          ) {
            queueFrogDiarySleepGuide();
            setIsNightHubMode(true);
            setNightHubStep("choose");
            setNightHubTopic(null);
            setNightHubSunbeastFollowupIndex(null);
            setNightHubGuideStep("sleep-pointer");
            return;
          }
          if (nextSceneId) {
            if (completedDiaryOverlayMode === "fragmented-diary") {
              startSceneTransition(nextSceneId, "fade-black", 420);
              return;
            }
            startSceneTransition(nextSceneId, "next-day", 980);
          }
        }}
        onFrogReturnHomeDiaryGuideComplete={() => {
          clearFrogReturnHomeDiaryGuide();
          const latestProgress = loadPlayerProgress();
          setUnlockedDiaryEntryIds(latestProgress.unlockedDiaryEntryIds);
          setNightHubGuideStep(null);
        }}
        onDiaryRevealEntryComplete={() => {
          if (diaryOverlayMode === "sunbeast-koala-reveal") {
            const continueKoalaEvent = officeSunbeastKoalaDiaryContinueRef.current;
            officeSunbeastKoalaDiaryContinueRef.current = null;
            setIsDiaryOpen(false);
            setDiaryOverlayMode("default");
            setPendingDiaryNextSceneId(null);
            continueKoalaEvent?.();
            return;
          }
          setIsDiaryOpen(false);
          setDiaryOverlayMode("default");
          setPendingDiaryNextSceneId(null);
          startSceneTransition("scene-97", "fade-black", 420);
        }}
        onGuidedFlowComplete={() => {
          if (diaryOverlayMode === "sunbeast-koala-reveal") {
            const continueKoalaEvent = officeSunbeastKoalaDiaryContinueRef.current;
            officeSunbeastKoalaDiaryContinueRef.current = null;
            setIsDiaryOpen(false);
            setDiaryOverlayMode("default");
            setPendingDiaryNextSceneId(null);
            continueKoalaEvent?.();
            return;
          }
          setIsDiaryOpen(false);
          if (
            (diaryOverlayMode === "diary-reveal" || diaryOverlayMode === "first-photo-diary-reveal") &&
            pendingDiaryNextSceneId
          ) {
            setDiaryOverlayMode("default");
            setPendingDiaryNextSceneId(null);
            setPendingStoryChoiceNextSceneId(null);
            startSceneTransition("scene-97", "fade-black", 420);
            return;
          }
          if (diaryOverlayMode === "sunbeast-reveal") {
            const latestProgress = loadPlayerProgress();
            setDiaryOverlayMode("default");
            setPendingDiaryNextSceneId(null);
            setPendingStoryChoiceNextSceneId(null);
            setIsNightHubMode(true);
            setNightHubStep("choose");
            setNightHubTopic(null);
            setNightHubSunbeastFollowupIndex(null);
            setNightHubGuideStep(
              shouldShowFirstHomeHubFeatureGuide(latestProgress)
                ? "first-home-journal-pointer"
                : ENABLE_NIGHT_HUB_GUIDANCE_SYSTEM
                  ? "sunbeast-dialog"
                  : null,
            );
            return;
          }
          setDiaryOverlayMode("default");
          setPendingDiaryNextSceneId(null);
          setIsNightHubMode(true);
        }}
        onSunbeastHintGuideComplete={() => {
          setIsDiaryOpen(false);
          setDiaryOverlayMode("default");
          setPendingDiaryNextSceneId(null);
          setIsNightHubMode(true);
          setNightHubStep("choose");
          setNightHubTopic(null);
          setNightHubSunbeastFollowupIndex(null);
          setNightHubGuideStep(ENABLE_NIGHT_HUB_GUIDANCE_SYSTEM ? "place-pointer" : null);
        }}
        onClose={() => {
          if (diaryOverlayMode === "sunbeast-koala-reveal") {
            const continueKoalaEvent = officeSunbeastKoalaDiaryContinueRef.current;
            officeSunbeastKoalaDiaryContinueRef.current = null;
            setIsDiaryOpen(false);
            setDiaryOverlayMode("default");
            setPendingDiaryNextSceneId(null);
            continueKoalaEvent?.();
            return;
          }
          setIsDiaryOpen(false);
          if (
            scene.id === LEGACY_NIGHT_HUB_SCENE_ID &&
            (diaryOverlayMode === "frog-fragmented-diary" ||
              diaryOverlayMode === "frog-diary-catalog-guide")
          ) {
            queueFrogDiaryFragmentHubGuide();
            setDiaryOverlayMode("default");
            setPendingDiaryNextSceneId(null);
            setPendingStoryChoiceNextSceneId(null);
            setIsNightHubMode(true);
            setNightHubStep("choose");
            setNightHubTopic(null);
            setNightHubSunbeastFollowupIndex(null);
            setNightHubGuideStep("frog-diary-pointer");
            return;
          }
          if (
            scene.id === LEGACY_NIGHT_HUB_SCENE_ID &&
            diaryOverlayMode === "frog-return-home-diary-guide"
          ) {
            const latestProgress = loadPlayerProgress();
            setDiaryOverlayMode("default");
            setPendingDiaryNextSceneId(null);
            setPendingStoryChoiceNextSceneId(null);
            setIsNightHubMode(true);
            setNightHubStep("choose");
            setNightHubTopic(null);
            setNightHubSunbeastFollowupIndex(null);
            setNightHubGuideStep(
              shouldShowFrogReturnHomeDiaryGuide(latestProgress)
                ? "frog-return-home-diary-pointer"
                : null,
            );
            return;
          }
          if (
            (diaryOverlayMode === "diary-reveal" || diaryOverlayMode === "first-photo-diary-reveal") &&
            pendingDiaryNextSceneId
          ) {
            setDiaryOverlayMode("default");
            setPendingDiaryNextSceneId(null);
            startSceneTransition("scene-97", "fade-black", 420);
            return;
          }
          if (diaryOverlayMode === "sunbeast-reveal") {
            const latestProgress = loadPlayerProgress();
            setDiaryOverlayMode("default");
            setPendingDiaryNextSceneId(null);
            setIsNightHubMode(true);
            setNightHubStep("choose");
            setNightHubTopic(null);
            setNightHubSunbeastFollowupIndex(null);
            setNightHubGuideStep(
              shouldShowFirstHomeHubFeatureGuide(latestProgress)
                ? "first-home-journal-pointer"
                : ENABLE_NIGHT_HUB_GUIDANCE_SYSTEM
                  ? "sunbeast-dialog"
                  : null,
            );
            return;
          }
          setDiaryOverlayMode("default");
          setPendingDiaryNextSceneId(null);
          setPendingStoryChoiceNextSceneId(null);
        }}
      />

      {ENABLE_NIGHT_HUB_GUIDANCE_SYSTEM && isNightHubPlaceMapOpen && nightHubProgress && nightHubPlaceUnlockSnapshot ? (
        <ArrangeRouteMapOverlay
          placeUnlockSnapshot={nightHubPlaceUnlockSnapshot}
          coinCount={nightHubProgress.status.savings}
          canRedeemStreet={hasCollectedFirstSunbeastForNightHub}
          isReadOnly
          highlightedPlaceId={
            nightHubStreetUnlockGuideStep === "shop-condition"
              ? "convenience-store"
              : nightHubStreetUnlockGuideStep &&
                  nightHubStreetUnlockGuideStep !== "unlocking-street"
                ? "street"
                : undefined
          }
          unlockingPlaceId={nightHubStreetUnlockGuideStep === "unlocking-street" ? "street" : undefined}
          onClose={() => {
            setIsNightHubPlaceMapOpen(false);
            setIsNightHubMissionOpen(false);
            setNightHubStreetUnlockGuideStep(null);
            if (nightHubStreetUnlockGuideTimerRef.current) {
              clearTimeout(nightHubStreetUnlockGuideTimerRef.current);
              nightHubStreetUnlockGuideTimerRef.current = null;
            }
          }}
        />
      ) : null}

      {ENABLE_NIGHT_HUB_GUIDANCE_SYSTEM &&
      isNightHubPlaceMapOpen &&
      nightHubStreetUnlockGuideStep &&
      nightHubStreetUnlockGuideStep !== "unlocking-street" ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={74}
          pointerEvents="auto"
          cursor="pointer"
          onClick={handleNightHubStreetUnlockGuideContinue}
        >
          <Flex mt="auto" w="100%" position="relative" pointerEvents="auto">
            <Flex
              position="absolute"
              left="14px"
              bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
              zIndex={6}
              pointerEvents="none"
            >
              {nightHubStreetUnlockGuideStep === "shop-condition" ? null : (
                <EventAvatarSprite
                  spriteId={
                    nightHubStreetUnlockGuideStep === "beigo-street" ||
                    nightHubStreetUnlockGuideStep === "beigo-shop"
                      ? "beigo"
                      : "mai"
                  }
                  frameIndex={
                    nightHubStreetUnlockGuideStep === "beigo-street" ||
                    nightHubStreetUnlockGuideStep === "beigo-shop"
                      ? 2
                      : nightHubStreetUnlockGuideStep === "mai-street"
                        ? 18
                        : 36
                  }
                />
              )}
            </Flex>
            <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
              <Text color="white" fontWeight="700">
                {nightHubStreetUnlockGuideStep === "shop-condition"
                  ? "商店"
                  : nightHubStreetUnlockGuideStep === "beigo-street" ||
                      nightHubStreetUnlockGuideStep === "beigo-shop"
                    ? "小貝狗"
                    : "小麥"}
              </Text>
              <Flex flex="1" minH="0" direction="column" justifyContent="center">
                <Text color="white" fontSize="16px" lineHeight="1.6">
                  {nightHubStreetUnlockGuideStep === "beigo-street" ? (
                    <>
                      因為
                      <Text as="span" color="#F6D982" fontWeight="800">
                        直太郎
                      </Text>
                      的關係，新的地點
                      <Text as="span" color="#9DE0C3" fontWeight="800">
                        街道
                      </Text>
                      解鎖了。
                    </>
                  ) : nightHubStreetUnlockGuideStep === "mai-street" ? (
                    <>
                      下次可以經過
                      <Text as="span" color="#9DE0C3" fontWeight="800">
                        街道
                      </Text>
                      看看。那是不是只要能經過
                      <Text as="span" color="#F6D982" fontWeight="800">
                        商店
                      </Text>
                      ，就能遇到下一隻小日獸了？
                    </>
                  ) : nightHubStreetUnlockGuideStep === "beigo-shop" ? (
                    <>嗷</>
                  ) : (
                    <>
                      同一次的
                      <Text as="span" color="#F6D982" fontWeight="800">
                        行程安排
                      </Text>
                      同時經過
                      <Text as="span" color="#F6D982" fontWeight="800">
                        捷運
                      </Text>
                      和
                      <Text as="span" color="#9DE0C3" fontWeight="800">
                        街道
                      </Text>
                      已解鎖
                    </>
                  )}
                </Text>
              </Flex>
              <EventContinueAction onClick={handleNightHubStreetUnlockGuideContinue} />
            </EventDialogPanel>
          </Flex>
        </Flex>
      ) : null}

      {isNightHubScene && shouldShowNightHubMission && isNightHubMissionIntroOpen ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={75}
          pointerEvents="auto"
          cursor="pointer"
          onClick={handleNightHubMissionIntroContinue}
        >
          <Flex mt="auto" w="100%" position="relative" pointerEvents="auto">
            <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
              <Text color="white" fontWeight="700">
                任務
              </Text>
              <Flex flex="1" minH="0" direction="column" justifyContent="center">
                <Text color="white" fontSize="16px" lineHeight="1.6">
                  獲得第一個任務：同時經過捷運和街道，解鎖商店。
                  <br />
                  任務會把目前找到的線索整理成下一步目標。
                  <br />
                  完成任務後，可以推進小日獸線索、解鎖新的地點，也能獲得金幣獎勵。
                </Text>
              </Flex>
              <EventContinueAction onClick={handleNightHubMissionIntroContinue} />
            </EventDialogPanel>
          </Flex>
        </Flex>
      ) : null}

      {isNightHubScene && shouldShowNightHubMission && isNightHubMissionPanelOpen ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={76}
          bgColor="rgba(30, 23, 18, 0.46)"
          alignItems="center"
          justifyContent="center"
          px="18px"
          pointerEvents="auto"
        >
          <Flex
            w="100%"
            maxW="360px"
            maxH="calc(100% - 56px)"
            direction="column"
            borderRadius="16px"
            overflow="hidden"
            bgColor="#F6F2EC"
            border="3px solid #B88E6D"
            boxShadow="0 18px 38px rgba(64,44,28,0.28)"
          >
            <Flex
              minH="54px"
              px="18px"
              bgColor="#B88E6D"
              alignItems="center"
              justifyContent="space-between"
            >
              <Text color="white" fontSize="16px" fontWeight="800" lineHeight="1">
                任務版
              </Text>
              <Flex
                as="button"
                w="28px"
                h="28px"
                alignItems="center"
                justifyContent="center"
                color="white"
                cursor="pointer"
                aria-label="關閉任務"
                onClick={handleCloseNightHubMission}
              >
                <IoClose size={24} />
              </Flex>
            </Flex>
            <Flex
              direction="column"
              px="18px"
              pt="16px"
              pb="18px"
              gap="14px"
              bgColor="#FFFDF8"
            >
              <Flex direction="column" gap="10px">
                <Text color="#8F6A4D" fontSize="13px" fontWeight="900" lineHeight="1">
                  獲得第一個任務
                </Text>
                <Flex
                  minH="78px"
                  px="14px"
                  py="12px"
                  borderRadius="12px"
                  bgColor="rgba(246,242,236,0.94)"
                  border="2px solid rgba(184,142,109,0.5)"
                  alignItems="center"
                  justifyContent="space-between"
                  gap="12px"
                >
                  <Flex direction="column" gap="5px" minW="0">
                    <Text color="#8F6A4D" fontSize="12px" fontWeight="900" lineHeight="1">
                      01
                    </Text>
                    <Text color="#161616" fontSize="14px" fontWeight="900" lineHeight="1.35">
                      同時經過捷運和街道，解鎖商店
                    </Text>
                  </Flex>
                  <Text color="#B88E6D" fontSize="14px" fontWeight="900" whiteSpace="nowrap">
                    10金幣
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {endDaySequencePhase === "black" || endDaySequencePhase === "summary" ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={85}
          bgColor="rgba(12,10,14,0.96)"
          alignItems="center"
          justifyContent="center"
          px="24px"
        >
          {endDaySequencePhase === "black" ? (
            <Flex direction="column" alignItems="center" gap="8px">
              <Text color="#F7EEE0" fontSize="34px" fontWeight="700" letterSpacing="2px">
                {endDayTransitionText?.toDayLabel ?? "第二天"}
              </Text>
              <Flex
                position="relative"
                h="24px"
                minW="170px"
                justifyContent="center"
                alignItems="center"
                color="#EADBC8"
                fontSize="16px"
                fontWeight="700"
                letterSpacing="1px"
              >
                <Text animation={`${dayDateOldFadeOut} 1100ms ease forwards`}>
                  {endDayTransitionText?.fromDateLabel ?? "星期一 3/11"}
                </Text>
                <Flex
                  position="absolute"
                  alignItems="center"
                  animation={`${dayDateNewFadeIn} 1100ms ease forwards`}
                >
                  <Text>{endDayTransitionText?.toDateLabel ?? "星期二 3/12"}</Text>
                </Flex>
              </Flex>
            </Flex>
          ) : null}
          {endDaySequencePhase === "summary" ? (
            <Flex
              w="100%"
              maxW="320px"
              direction="column"
              gap="14px"
              borderRadius="16px"
              border="1px solid rgba(255,255,255,0.22)"
              bg="linear-gradient(180deg, rgba(72,56,44,0.88) 0%, rgba(49,38,30,0.9) 100%)"
              p="18px"
              boxShadow="0 12px 30px rgba(0,0,0,0.35)"
              animation={`${isEndDaySummaryLeaving ? summaryCardOut : summaryCardIn} ${isEndDaySummaryLeaving ? 320 : 380}ms ease forwards`}
            >
              <Flex alignItems="center" justifyContent="space-between">
                <Text color="#FCEEDC" fontSize="16px" fontWeight="700">
                  {endDaySummaryContent?.title ?? "今天先告一段落"}
                </Text>
                <Text color="#FDE8C4" fontSize="18px" lineHeight="1">
                  🌙
                </Text>
              </Flex>
              <Text color="#F6E8D5" fontSize="14px" lineHeight="1.65">
                {endDaySummaryContent?.body ??
                  "回到家後好好休息了一下，把今天的疲累慢慢放下，準備迎接明天。"}
              </Text>
              <Flex h="1px" bgColor="rgba(255,255,255,0.22)" />
              <Flex gap="10px">
                <Flex
                  flex="1"
                  h="34px"
                  borderRadius="999px"
                  bgColor="rgba(255,255,255,0.1)"
                  border="1px solid rgba(255,255,255,0.2)"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="#FFF4E6" fontSize="14px" fontWeight="700">
                    {endDaySummaryContent?.chips[0] ?? "疲勞 -20"}
                  </Text>
                </Flex>
                <Flex
                  flex="1"
                  h="34px"
                  borderRadius="999px"
                  bgColor="rgba(255,255,255,0.1)"
                  border="1px solid rgba(255,255,255,0.2)"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="#FFF4E6" fontSize="14px" fontWeight="700">
                    {endDaySummaryContent?.chips[1] ?? "行動力 +1"}
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          ) : null}
        </Flex>
      ) : null}

      {outgoingTransition ? (
        <Flex
          pointerEvents="none"
          position="absolute"
          inset="0"
          zIndex={90}
          overflow="hidden"
          bgColor={
            outgoingTransition.preset === "mai-sleep" || outgoingTransition.preset === "sleep-wake-cue"
              ? "transparent"
              : "rgba(25,18,14,0.92)"
          }
          backdropFilter={outgoingTransition.preset === "mai-sleep" ? "blur(1.5px)" : undefined}
          animation={
            outgoingTransition.preset === "mai-sleep" || outgoingTransition.preset === "sleep-wake-cue"
              ? undefined
              : `${fadeOutToBlack} ${outgoingTransition.durationMs}ms ease forwards`
          }
          alignItems="center"
          justifyContent="center"
        >
          {outgoingTransition.preset === "mai-sleep" ? (
            <MaiSleepEyeClosingOverlay durationMs={outgoingTransition.durationMs} />
          ) : null}
          {outgoingTransition.preset === "sleep-wake-cue" ? (
            <SleepWakeDarkHoldOverlay durationMs={outgoingTransition.durationMs} />
          ) : null}
          <Box position="relative" zIndex={2}>
            <SceneTransitionContent preset={outgoingTransition.preset} />
          </Box>
        </Flex>
      ) : null}

      {incomingTransition ? (
        <Flex
          pointerEvents="none"
          position="absolute"
          inset="0"
          zIndex={89}
          bgColor={incomingTransition.preset === "sleep-wake-cue" ? "transparent" : "rgba(25,18,14,0.92)"}
          animation={
            incomingTransition.preset === "sleep-wake-cue"
              ? undefined
              : `${fadeInFromBlack} ${incomingTransition.durationMs}ms ease forwards`
          }
          alignItems="center"
          justifyContent="center"
        >
          {incomingTransition.preset === "sleep-wake-cue" ? (
            <SleepWakeEyeOpenOverlay
              durationMs={incomingTransition.durationMs}
              wakeCueText={incomingTransition.wakeCueText}
            />
          ) : null}
          <SceneTransitionContent preset={incomingTransition.preset} />
        </Flex>
      ) : null}

      {previewTransitionDurationMs ? (
        <Flex
          key={`preview-transition-${previewTransitionNonce}`}
          pointerEvents="none"
          position="absolute"
          inset="0"
          zIndex={91}
          bgColor="rgba(25,18,14,0.92)"
          animation={`${fadeOutInBlack} ${previewTransitionDurationMs * 2}ms ease forwards`}
        />
      ) : null}

      {workLunchForgotBentoStep ? (
        <WorkLunchForgotBentoOverlay
          step={workLunchForgotBentoStep}
          onContinue={handleWorkLunchForgotBentoContinue}
        />
      ) : null}

      {shouldPlayWorkLunchPrelude ? (
        <WorkTransitionModal
          durationMsOverride={2500}
          onFinish={() => {
            setIsWorkLunchPreludePlaying(false);
            setWorkLunchForgotBentoStep("noon");
          }}
        />
      ) : null}

      {isWorkTransitionScene &&
      !shouldPlayWorkLunchPrelude &&
      !workLunchForgotBentoStep &&
      !isWorkMinigameOpen &&
      cabinetAftermathStep === null &&
      workPostMinigameStep === null ? (
        <WorkTransitionModal
          variant={
            shouldOpenPlayableWorkMinigame && activeWorkMinigameConfig
              ? activeWorkMinigameConfig.preludeVariant
              : "plain"
          }
          preludeDialogueOverride={activeDependentCoworkerRequest?.preludeDialogue}
          preludeCharacterNameOverride={activeDependentCoworkerRequest ? "同事" : undefined}
          preludeAvatarSpriteIdOverride={activeDependentCoworkerRequest ? "coworker" : undefined}
          preludeAvatarFrameIndexOverride={activeDependentCoworkerRequest ? 1 : undefined}
          onFinish={() => {
            if (workTransitionDoneRef.current) return;
            if (shouldTriggerOfficeSunbeastKoalaEvent(loadPlayerProgress())) {
              workTransitionDoneRef.current = true;
              if (!isStoryTaxiWorkScene) {
                recordWorkShiftResult(0);
              }
              officeSunbeastKoalaResumeRef.current = "next-scene";
              setIsOfficeSunbeastKoalaEventOpen(true);
              return;
            }
            if (!shouldOpenPlayableWorkMinigame) {
              workTransitionDoneRef.current = true;
              if (!isStoryTaxiWorkScene) {
                recordWorkShiftResult(0);
              }
              if (scene.nextSceneId) {
                startSceneTransition(scene.nextSceneId, "fade-black", 420);
              }
              return;
            }
            if (activeDependentCoworkerRequest) {
              setLockedDependentCoworkerRequest(activeDependentCoworkerRequest);
            }
            setIsWorkMinigameOpen(true);
          }}
        />
      ) : null}

      {isWorkTransitionScene &&
      shouldOpenPlayableWorkMinigame &&
      activeWorkMinigameConfig &&
      isWorkMinigameOpen &&
      workPostMinigameStep === null ? (
        workMinigameKind === "cabinet-box-stack" ? (
          <CabinetBoxStackMinigameModal
            baseFatigue={0}
            onSkip={() => {
              if (workTransitionDoneRef.current) return;
              workTransitionDoneRef.current = true;
              saveWorkTaskProgress(activeWorkMinigameConfig.taskId, activeWorkMinigameConfig.skipProgress);
              setIsWorkMinigameOpen(false);
              recordWorkShiftResult(activeWorkMinigameConfig.skipFatigue);
              if (scene.nextSceneId) {
                router.push(withTrialProfileSearch(ROUTES.gameScene(scene.nextSceneId)));
              }
            }}
            onSolved={() => {
              if (workTransitionDoneRef.current) return;
              workTransitionDoneRef.current = true;
              saveWorkTaskProgress(
                activeWorkMinigameConfig.taskId,
                activeWorkMinigameConfig.successProgress,
              );
              if (activeDependentCoworkerRequest) {
                recordDependentCoworkerRequestCompleted();
                return;
              }
              grantWorkMinigameCoinReward();
            }}
            onComplete={() => {
              setIsWorkMinigameOpen(false);
              cabinetShredderSolvedRef.current = false;
              setCabinetAftermathStep("scream");
            }}
            title={activeDependentCoworkerRequest?.minigameTitle}
            successRewardHeading={activeDependentCoworkerRequest ? "同事的請託" : undefined}
            successRewardLabel={activeDependentCoworkerRequest?.successRewardLabel}
            successFootnote={activeDependentCoworkerRequest?.successFootnote}
          />
        ) : workMinigameKind === "document-color-sort" ? (
          <DocumentColorSortMinigameModal
            baseFatigue={0}
            onSkip={() => {
              if (workTransitionDoneRef.current) return;
              workTransitionDoneRef.current = true;
              saveWorkTaskProgress(activeWorkMinigameConfig.taskId, activeWorkMinigameConfig.skipProgress);
              setIsWorkMinigameOpen(false);
              recordWorkShiftResult(activeWorkMinigameConfig.skipFatigue);
              if (scene.nextSceneId) {
                router.push(withTrialProfileSearch(ROUTES.gameScene(scene.nextSceneId)));
              }
            }}
            onSolved={() => {
              if (workTransitionDoneRef.current) return;
              workTransitionDoneRef.current = true;
              saveWorkTaskProgress(
                activeWorkMinigameConfig.taskId,
                activeWorkMinigameConfig.successProgress,
              );
              if (activeDependentCoworkerRequest) {
                recordDependentCoworkerRequestCompleted();
                return;
              }
              grantWorkMinigameCoinReward();
            }}
            onComplete={() => {
              setIsWorkMinigameOpen(false);
              if (shouldTriggerOfficeSunbeastKoalaEvent(loadPlayerProgress())) {
                officeSunbeastKoalaResumeRef.current = "post-minigame";
                setIsOfficeSunbeastKoalaEventOpen(true);
                return;
              }
              setWorkPostMinigameStep("dialogue");
            }}
            title={activeDependentCoworkerRequest?.minigameTitle}
            successRewardHeading={activeDependentCoworkerRequest ? "同事的請託" : undefined}
            successRewardLabel={activeDependentCoworkerRequest?.successRewardLabel}
            successFootnote={activeDependentCoworkerRequest?.successFootnote}
          />
        ) : workMinigameKind === "park-ostrich" ? (
          <ParkOstrichTickleMinigameModal
            baseFatigue={0}
            onSkip={() => {
              if (workTransitionDoneRef.current) return;
              workTransitionDoneRef.current = true;
              saveWorkTaskProgress(activeWorkMinigameConfig.taskId, activeWorkMinigameConfig.skipProgress);
              setIsWorkMinigameOpen(false);
              recordWorkShiftResult(activeWorkMinigameConfig.skipFatigue);
              if (scene.nextSceneId) {
                router.push(withTrialProfileSearch(ROUTES.gameScene(scene.nextSceneId)));
              }
            }}
            onSolved={() => {
              if (workTransitionDoneRef.current) return;
              workTransitionDoneRef.current = true;
              saveWorkTaskProgress(
                activeWorkMinigameConfig.taskId,
                activeWorkMinigameConfig.successProgress,
              );
              grantWorkMinigameCoinReward();
            }}
            onComplete={() => {
              setIsWorkMinigameOpen(false);
              setWorkPostMinigameStep("dialogue");
            }}
            successSavingsTotal={workMinigameRewardSavingsTotal}
          />
        ) : workMinigameKind === "office-chicken" ? (
          <OfficeChickenFocusMinigameModal
            baseFatigue={0}
            onSkip={() => {
              if (workTransitionDoneRef.current) return;
              workTransitionDoneRef.current = true;
              saveWorkTaskProgress(activeWorkMinigameConfig.taskId, activeWorkMinigameConfig.skipProgress);
              setIsWorkMinigameOpen(false);
              recordWorkShiftResult(activeWorkMinigameConfig.skipFatigue);
              if (scene.nextSceneId) {
                router.push(withTrialProfileSearch(ROUTES.gameScene(scene.nextSceneId)));
              }
            }}
            onSolved={() => {
              if (workTransitionDoneRef.current) return;
              workTransitionDoneRef.current = true;
              saveWorkTaskProgress(
                activeWorkMinigameConfig.taskId,
                activeWorkMinigameConfig.successProgress,
              );
              grantWorkMinigameCoinReward();
            }}
            onComplete={() => {
              setIsWorkMinigameOpen(false);
              setWorkPostMinigameStep("dialogue");
            }}
            successSavingsTotal={workMinigameRewardSavingsTotal}
          />
        ) : workMinigameKind === "stamp-documents" ? (
          <WorkStampMinigameModal
            baseFatigue={0}
            onSkip={() => {
              if (workTransitionDoneRef.current) return;
              workTransitionDoneRef.current = true;
              saveWorkTaskProgress(activeWorkMinigameConfig.taskId, activeWorkMinigameConfig.skipProgress);
              setIsWorkMinigameOpen(false);
              recordWorkShiftResult(activeWorkMinigameConfig.skipFatigue);
              if (scene.nextSceneId) {
                router.push(withTrialProfileSearch(ROUTES.gameScene(scene.nextSceneId)));
              }
            }}
            onSolved={() => {
              if (workTransitionDoneRef.current) return;
              workTransitionDoneRef.current = true;
              saveWorkTaskProgress(
                activeWorkMinigameConfig.taskId,
                activeWorkMinigameConfig.successProgress,
              );
              grantWorkMinigameCoinReward();
            }}
            onComplete={() => {
              setIsWorkMinigameOpen(false);
              setWorkPostMinigameStep("dialogue");
            }}
            successSavingsTotal={workMinigameRewardSavingsTotal}
          />
        ) : workMinigameKind === "export-pdf" ? (
          <WorkPdfExportMinigameModal
            baseFatigue={0}
            onSkip={() => {
              if (workTransitionDoneRef.current) return;
              workTransitionDoneRef.current = true;
              saveWorkTaskProgress(activeWorkMinigameConfig.taskId, activeWorkMinigameConfig.skipProgress);
              setIsWorkMinigameOpen(false);
              recordWorkShiftResult(activeWorkMinigameConfig.skipFatigue);
              if (scene.nextSceneId) {
                router.push(withTrialProfileSearch(ROUTES.gameScene(scene.nextSceneId)));
              }
            }}
            onSolved={() => {
              if (workTransitionDoneRef.current) return;
              workTransitionDoneRef.current = true;
              saveWorkTaskProgress(
                activeWorkMinigameConfig.taskId,
                activeWorkMinigameConfig.successProgress,
              );
              grantWorkMinigameCoinReward();
            }}
            onComplete={() => {
              setIsWorkMinigameOpen(false);
              setWorkPostMinigameStep("dialogue");
            }}
            successSavingsTotal={workMinigameRewardSavingsTotal}
          />
        ) : (
        <WorkMinigameTestModal
          baseFatigue={0}
          onSkip={() => {
            if (workTransitionDoneRef.current) return;
            workTransitionDoneRef.current = true;
            saveWorkTaskProgress(activeWorkMinigameConfig.taskId, activeWorkMinigameConfig.skipProgress);
            setIsWorkMinigameOpen(false);
            recordWorkShiftResult(activeWorkMinigameConfig.skipFatigue);
            if (scene.nextSceneId) {
              router.push(withTrialProfileSearch(ROUTES.gameScene(scene.nextSceneId)));
            }
          }}
          onSolved={() => {
            if (workTransitionDoneRef.current) return;
            workTransitionDoneRef.current = true;
            saveWorkTaskProgress(
              activeWorkMinigameConfig.taskId,
              activeWorkMinigameConfig.successProgress,
            );
            if (activeDependentCoworkerRequest) {
              recordDependentCoworkerRequestCompleted();
              return;
            }
            grantWorkMinigameCoinReward();
          }}
          onComplete={() => {
            setIsWorkMinigameOpen(false);
            if (shouldTriggerOfficeSunbeastKoalaEvent(loadPlayerProgress())) {
              officeSunbeastKoalaResumeRef.current = "post-minigame";
              setIsOfficeSunbeastKoalaEventOpen(true);
              return;
            }
            setWorkPostMinigameStep("dialogue");
          }}
          successSavingsTotal={workMinigameRewardSavingsTotal}
          title={activeDependentCoworkerRequest?.minigameTitle}
          successRewardHeading={
            activeDependentCoworkerRequest ? "同事的請託" : undefined
          }
          successRewardLabel={activeDependentCoworkerRequest?.successRewardLabel}
          successFootnote={activeDependentCoworkerRequest?.successFootnote}
        />
        )
      ) : null}

      {cabinetAftermathStep === "scream" ||
      cabinetAftermathStep === "coworker" ||
      cabinetAftermathStep === "mai" ? (
        <Flex
          key={`cabinet-aftermath-${cabinetAftermathStep}`}
          data-cabinet-aftermath-dialogue={cabinetAftermathStep}
          position="absolute"
          inset="0"
          zIndex={74}
          direction="column"
          overflow="hidden"
          animation={backgroundShakeAnimation}
        >
          <img
            src="/images/work/Office_Work_Day_Look.png"
            alt="碎紙機事故發生的辦公室"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          {cabinetAftermathStep === "scream" ? (
            <Box
              position="absolute"
              inset="0"
              bg="radial-gradient(circle at 72% 50%, rgba(255,231,188,0.08), rgba(132,44,40,0.28))"
              pointerEvents="none"
            />
          ) : null}
          <Flex position="relative" zIndex={1} w="100%" h="100%" direction="column">
            <StoryDialogPanel
              characterName={CABINET_SHREDDER_DIALOGUE[cabinetAftermathStep].speaker}
              dialogue={CABINET_SHREDDER_DIALOGUE[cabinetAftermathStep].dialogue}
              onContinue={() => {
                if (cabinetAftermathStep === "scream") {
                  setCabinetAftermathStep("coworker");
                  return;
                }
                if (cabinetAftermathStep === "coworker") {
                  setCabinetAftermathStep("mai");
                  return;
                }
                setCabinetAftermathStep("puzzle");
              }}
              showAvatarSprite
              avatarSpriteId={CABINET_SHREDDER_DIALOGUE[cabinetAftermathStep].avatarSpriteId}
              avatarFrameIndex={CABINET_SHREDDER_DIALOGUE[cabinetAftermathStep].avatarFrameIndex}
            />
          </Flex>
        </Flex>
      ) : null}

      {cabinetAftermathStep === "puzzle" ? (
        <ShreddedDocumentMinigameModal
          onSkip={() => {
            setCabinetAftermathStep(null);
            setWorkPostMinigameStep("dialogue");
          }}
          onSolved={() => {
            if (cabinetShredderSolvedRef.current) return;
            cabinetShredderSolvedRef.current = true;
            saveWorkTaskProgress("dependent-coworker-shredded-document", 100);
            if (activeDependentCoworkerRequest?.requestNumber === 1) {
              recordDependentCoworkerRequestCompleted();
            }
          }}
          onComplete={() => {
            setCabinetAftermathStep("completed");
            if (shouldTriggerOfficeSunbeastKoalaEvent(loadPlayerProgress())) {
              officeSunbeastKoalaResumeRef.current = "post-minigame";
              setIsOfficeSunbeastKoalaEventOpen(true);
              return;
            }
            setWorkPostMinigameStep("dialogue");
          }}
        />
      ) : null}

      {isOfficeSunbeastKoalaEventOpen
        ? (() => {
            const progress = loadPlayerProgress();
            return (
              <OfficeSunbeastKoalaEventModal
                savings={progress.status.savings}
                actionPower={progress.status.actionPower}
                fatigue={progress.status.fatigue}
                onOpenDiary={(onContinue) => {
                  markOfficeSunbeastKoalaEventTriggered();
                  syncDerivedPlaceUnlocks();
                  const latestProgress = loadPlayerProgress();
                  setUnlockedDiaryEntryIds(latestProgress.unlockedDiaryEntryIds);
                  officeSunbeastKoalaDiaryContinueRef.current = onContinue;
                  setDiaryOverlayMode("sunbeast-koala-reveal");
                  setIsDiaryOpen(true);
                }}
                onFinish={() => {
                  const resumeMode = officeSunbeastKoalaResumeRef.current;
                  officeSunbeastKoalaResumeRef.current = "post-minigame";
                  setIsOfficeSunbeastKoalaEventOpen(false);
                  if (resumeMode === "post-minigame") {
                    setWorkPostMinigameStep("dialogue");
                    return;
                  }
                  if (scene.nextSceneId) {
                    router.push(withTrialProfileSearch(ROUTES.gameScene(scene.nextSceneId)));
                  }
                }}
              />
            );
          })()
        : null}

      {isWorkTransitionScene && workPostMinigameStep === "dialogue" ? (
        <Flex position="absolute" inset="0" zIndex={72} direction="column">
          <img
            src="/images/work/Office_Work_Day_Phone.png"
            alt="完成工作後的辦公室"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          <Flex position="relative" zIndex={1} w="100%" h="100%" direction="column">
            <StoryDialogPanel
              characterName="小麥"
              dialogue={
                cabinetAftermathStep === "completed"
                  ? DEPENDENT_COWORKER_REQUESTS[1].postSuccessLine
                  : activeWorkMinigameConfig?.postSuccessLine ??
                    "太好了，這個搞定後，處理後續的專案會比較順利，今天應該能準時下班了。"
              }
              onContinue={() => setWorkPostMinigameStep("dusk-transition")}
              showAvatarSprite
              avatarSpriteId="mai"
              avatarFrameIndex={0}
            />
          </Flex>
        </Flex>
      ) : null}

      {isWorkTransitionScene && workPostMinigameStep === "dusk-transition" ? (
        <WorkTransitionModal
          variant="dusk-plain"
          onFinish={() => {
            setWorkPostMinigameStep("settlement");
          }}
        />
      ) : null}

      {isWorkTransitionScene && workPostMinigameStep === "settlement" ? (
        <WorkSettlementOverlay
          onShown={applyWorkSettlement}
          onFinish={() => {
            const nextSceneId =
              cabinetAftermathStep === "completed"
                ? "scene-shred-work-evening-tired"
                : scene.nextSceneId;
            if (nextSceneId) {
              router.push(withTrialProfileSearch(ROUTES.gameScene(nextSceneId)));
            }
          }}
        />
      ) : null}

      {isOffworkScene && isOffworkRewardOpen ? (
        <Flex position="absolute" inset="0" zIndex={50} bgColor="rgba(30,25,21,0.34)" alignItems="center" justifyContent="center" p="22px">
          <Flex
            w="100%"
            maxW="360px"
            minH="438px"
            bgColor="#FFF7EA"
            borderRadius="22px"
            border="2px solid rgba(186,145,105,0.48)"
            boxShadow="0 18px 46px rgba(46,35,25,0.28)"
            direction="column"
            alignItems="center"
            p="20px 16px 18px"
            gap="14px"
          >
            <Flex w="100%" direction="column" alignItems="center" gap="7px">
              <Text color="#9B7656" fontSize="16px" fontWeight="700" lineHeight="1">
                下班獎勵
              </Text>
              <Text color="#5F4736" fontSize="30px" fontWeight="700" lineHeight="1.05">
                選一塊拼圖
              </Text>
            </Flex>

            <Grid w="100%" templateColumns="repeat(2, minmax(0, 1fr))" gap="12px">
              {offworkRouteRewardChoices.map((reward) => {
                const sourceLabel = tileSourceLabel(reward.sourceId);
                const sourceIconPath = tileSourceIconPath(reward.sourceId);
                const optionLabel =
                  reward.title === sourceLabel ? `${sourceLabel}拼圖` : `${sourceLabel}拼圖 ${reward.title}`;
                const imagePath = resolveInventoryTileImagePath({
                  category: "place",
                  pattern: reward.pattern,
                  sourceId: reward.sourceId,
                });
                const imageFallbackPath = resolveInventoryPlaceTileImageFallbackPath({
                  pattern: reward.pattern,
                  sourceId: reward.sourceId,
                });
                const hasEmbeddedPlaceIcon = hasInventoryPlaceTileEmbeddedIcon({
                  pattern: reward.pattern,
                  sourceId: reward.sourceId,
                });
                return (
                  <Flex
                    as="button"
                    key={reward.id}
                    aria-label={optionLabel}
                    aspectRatio="1 / 1"
                    borderRadius="16px"
                    bgColor="#F7EFE3"
                    border="1px solid rgba(155,118,86,0.22)"
                    alignItems="center"
                    justifyContent="center"
                    p="8px"
                    cursor="pointer"
                    position="relative"
                    boxShadow="0 7px 14px rgba(112,82,54,0.08)"
                    transition="transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease"
                    _hover={{
                      transform: "translateY(-1px)",
                      borderColor: "rgba(155,118,86,0.42)",
                      boxShadow: "0 10px 18px rgba(112,82,54,0.14)",
                    }}
                    _active={{ transform: "translateY(0)" }}
                    onClick={() => claimOffworkRouteReward(reward)}
                  >
                    <Flex
                      w="100%"
                      h="100%"
                      borderRadius="14px"
                      overflow="hidden"
                      border="1px solid rgba(130,106,83,0.28)"
                      bgColor="#EFE7D9"
                      position="relative"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {imagePath ? (
                        <img
                          src={imagePath}
                          alt={optionLabel}
                          onError={(event) => {
                            if (!imageFallbackPath) return;
                            const image = event.currentTarget;
                            if (image.src.includes(imageFallbackPath)) return;
                            image.src = imageFallbackPath;
                          }}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      ) : (
                        <Grid templateColumns="repeat(3, 1fr)" templateRows="repeat(3, 1fr)" w="100%" h="100%" gap="2px" p="5px">
                          {reward.pattern.flat().map((cell, index) => (
                            <Flex
                              key={`${reward.id}-${index}`}
                              borderRadius="3px"
                              bgColor={cell ? "#B48D6A" : "#E3D8C8"}
                            />
                          ))}
                        </Grid>
                      )}
                      {!hasEmbeddedPlaceIcon ? (
                        <Flex
                          position="absolute"
                          right="6px"
                          bottom="6px"
                          w="30px"
                          h="30px"
                          borderRadius="999px"
                          bgColor="rgba(255,255,255,0.92)"
                          border="1px solid rgba(120,95,70,0.22)"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow="0 4px 10px rgba(64,46,28,0.14)"
                        >
                          <img
                            src={sourceIconPath}
                            alt={`${sourceLabel}地點`}
                            style={{ width: "20px", height: "20px", objectFit: "contain", display: "block" }}
                          />
                        </Flex>
                      ) : null}
                    </Flex>
                  </Flex>
                );
              })}
            </Grid>
          </Flex>
          <Flex
            position="absolute"
            left="50%"
            bottom="18px"
            transform="translateX(-50%)"
            zIndex={53}
            h="36px"
            px="14px"
            borderRadius="999px"
            bgColor="rgba(255,255,255,0.9)"
            border="1px solid rgba(120,95,70,0.25)"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            onClick={() => {
              setRewardInventoryTiles(buildRewardInventoryTiles(loadPlayerProgress()));
              setIsRewardInventoryOpen(true);
            }}
          >
            <Text color="#6B5240" fontSize="13px" fontWeight="700">
              查看目前拼圖
            </Text>
          </Flex>
        </Flex>
      ) : null}

      {isOffworkScene && isOffworkRewardOpen && isRewardInventoryOpen ? (
        <Flex
          position="absolute"
              left="50%"
              bottom="64px"
              transform="translateX(-50%)"
              zIndex={54}
              alignItems="center"
              justifyContent="center"
              pointerEvents="none"
            >
                <Flex
                  w="100%"
                  maxW="330px"
                  maxH="46vh"
                  borderRadius="16px"
                  bgColor="#F3EEE4"
                  border="2px solid #D9C4A7"
                  boxShadow="0 12px 28px rgba(0,0,0,0.3)"
                  direction="column"
                  p="14px"
                  gap="14px"
                  overflow="hidden"
                  pointerEvents="auto"
                >
                  <Flex alignItems="center" justifyContent="center" position="relative">
                    <Text color="#6B5240" fontSize="20px" fontWeight="700" lineHeight="1">
                      目前持有拼圖
                    </Text>
                    <Flex
                      as="button"
                      position="absolute"
                      right="0"
                      top="0"
                      w="34px"
                      h="34px"
                      borderRadius="999px"
                      bgColor="#A27F5D"
                      alignItems="center"
                      justifyContent="center"
                      onClick={() => setIsRewardInventoryOpen(false)}
                    >
                      <IoClose color="white" size={20} />
                    </Flex>
                  </Flex>
                  <Flex direction="column" gap="10px" overflowY="auto" pr="2px">
                    <Text color="#7C6148" fontSize="16px" fontWeight="700" lineHeight="1">
                      地點拼圖
                    </Text>
                    <Grid
                      borderRadius="10px"
                      border="1px solid rgba(163,135,101,0.35)"
                      bgColor="white"
                      p="10px"
                      minH="118px"
                      templateColumns="repeat(4, 64px)"
                      gridAutoRows="64px"
                      justifyContent="start"
                      alignContent="start"
                      gap="8px"
                    >
                      {ownedPlaceGroups.length === 0 ? (
                        <Text color="#9B8A78" fontSize="12px">目前沒有地點拼圖</Text>
                      ) : (
                        ownedPlaceGroups.map((item) => {
                          const imagePath = resolveInventoryTileImagePath({
                            category: "place",
                            pattern: item.pattern,
                            sourceId: item.sourceId,
                          });
                          const imageFallbackPath = resolveInventoryPlaceTileImageFallbackPath({
                            pattern: item.pattern,
                            sourceId: item.sourceId,
                          });
                          const hasEmbeddedPlaceIcon = hasInventoryPlaceTileEmbeddedIcon({
                            pattern: item.pattern,
                            sourceId: item.sourceId,
                          });
                          const iconPath =
                            item.sourceId && !hasEmbeddedPlaceIcon ? tileSourceIconPath(item.sourceId) : null;
                          return (
                            <Flex
                              key={item.key}
                              w="64px"
                              h="64px"
                              borderRadius="8px"
                              overflow="hidden"
                              border="1px solid rgba(130,106,83,0.36)"
                              bgColor="#F7F3EA"
                              alignItems="center"
                              justifyContent="center"
                              position="relative"
                            >
                              {imagePath ? (
                                <img
                                  src={imagePath}
                                  alt={item.label}
                                  onError={(event) => {
                                    if (!imageFallbackPath) return;
                                    const image = event.currentTarget;
                                    if (image.src.includes(imageFallbackPath)) return;
                                    image.src = imageFallbackPath;
                                  }}
                                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                />
                              ) : (
                                <Grid templateColumns="repeat(3, 1fr)" templateRows="repeat(3, 1fr)" w="100%" h="100%" gap="2px" p="4px">
                                  {item.pattern.flat().map((cell, index) => (
                                    <Flex
                                      key={`${item.key}-place-fallback-${index}`}
                                      borderRadius="2px"
                                      bgColor={cell ? "#A38765" : "#E2DBCF"}
                                    />
                                  ))}
                                </Grid>
                              )}
                              {iconPath ? (
                                <Flex
                                  position="absolute"
                                  right="4px"
                                  bottom="4px"
                                  w="22px"
                                  h="22px"
                                  borderRadius="999px"
                                  bgColor="rgba(255,248,236,0.94)"
                                  border="1px solid rgba(104,79,56,0.22)"
                                  boxShadow="0 2px 5px rgba(72,50,32,0.16)"
                                  alignItems="center"
                                  justifyContent="center"
                                  p="3px"
                                >
                                  <img
                                    src={iconPath}
                                    alt=""
                                    aria-hidden="true"
                                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                                  />
                                </Flex>
                              ) : null}
                              {item.count > 1 ? (
                                <Flex
                                  position="absolute"
                                  right="4px"
                                  top="4px"
                                  h="18px"
                                  minW="22px"
                                  px="5px"
                                  borderRadius="999px"
                                  bgColor="#A8795A"
                                  alignItems="center"
                                  justifyContent="center"
                                >
                                  <Text color="white" fontSize="10px" fontWeight="700" lineHeight="1">
                                    x{item.count}
                                  </Text>
                                </Flex>
                              ) : null}
                            </Flex>
                          );
                        })
                      )}
                    </Grid>

                    <Text color="#7C6148" fontSize="16px" fontWeight="700" lineHeight="1" mt="2px">
                      一般
                    </Text>
                    <Grid
                      borderRadius="10px"
                      border="1px solid rgba(163,135,101,0.35)"
                      bgColor="white"
                      p="10px"
                      minH="150px"
                      templateColumns="repeat(4, 64px)"
                      gridAutoRows="64px"
                      justifyContent="start"
                      alignContent="start"
                      gap="8px"
                    >
                      {ownedRouteGroups.length === 0 ? (
                        <Text color="#9B8A78" fontSize="12px">目前沒有一般</Text>
                      ) : (
                        ownedRouteGroups.map((item) => {
                          const imagePath = resolveInventoryTileImagePath({
                            category: "route",
                            pattern: item.pattern,
                            sourceId: item.sourceId,
                          });
                          const iconPath = null;
                          return (
                            <Flex
                              key={item.key}
                              w="64px"
                              h="64px"
                              borderRadius="8px"
                              overflow="hidden"
                              border="1px solid rgba(130,106,83,0.36)"
                              bgColor="#F7F3EA"
                              alignItems="center"
                              justifyContent="center"
                              position="relative"
                            >
                              {imagePath ? (
                                <img
                                  src={imagePath}
                                  alt={item.label}
                                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                />
                              ) : (
                                <Grid templateColumns="repeat(3, 1fr)" templateRows="repeat(3, 1fr)" w="100%" h="100%" gap="2px" p="4px">
                                  {item.pattern.flat().map((cell, index) => (
                                    <Flex
                                      key={`${item.key}-route-fallback-${index}`}
                                      borderRadius="2px"
                                      bgColor={cell ? "#A38765" : "#E2DBCF"}
                                    />
                                  ))}
                                </Grid>
                              )}
                              {iconPath ? (
                                <Flex
                                  position="absolute"
                                  right="4px"
                                  bottom="4px"
                                  w="22px"
                                  h="22px"
                                  borderRadius="999px"
                                  bgColor="rgba(255,248,236,0.94)"
                                  border="1px solid rgba(104,79,56,0.22)"
                                  boxShadow="0 2px 5px rgba(72,50,32,0.16)"
                                  alignItems="center"
                                  justifyContent="center"
                                  p="3px"
                                >
                                  <img
                                    src={iconPath}
                                    alt=""
                                    aria-hidden="true"
                                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                                  />
                                </Flex>
                              ) : null}
                              {item.count > 1 ? (
                                <Flex
                                  position="absolute"
                                  right="4px"
                                  top="4px"
                                  h="18px"
                                  minW="22px"
                                  px="5px"
                                  borderRadius="999px"
                                  bgColor="#A8795A"
                                  alignItems="center"
                                  justifyContent="center"
                                >
                                  <Text color="white" fontSize="10px" fontWeight="700" lineHeight="1">
                                    x{item.count}
                                  </Text>
                                </Flex>
                              ) : null}
                            </Flex>
                          );
                        })
                      )}
                    </Grid>
                  </Flex>
                </Flex>
        </Flex>
      ) : null}

      {isNightHubScene && isTrialCompletionThanksOpen ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={86}
          bgColor="rgba(25,20,17,0.46)"
          alignItems="center"
          justifyContent="center"
          px="22px"
        >
          <Flex
            w="100%"
            maxW="340px"
            direction="column"
            borderRadius="20px"
            overflow="hidden"
            bgColor="#FFFDF8"
            border="2px solid #B99873"
            boxShadow="0 18px 42px rgba(42,31,23,0.34)"
          >
            <Flex h="62px" px="22px" bgColor="#9D7859" alignItems="center" justifyContent="space-between">
              <Text color="white" fontSize="19px" fontWeight="900" lineHeight="1">
                感謝試玩
              </Text>
              <Flex
                as="button"
                w="34px"
                h="34px"
                borderRadius="999px"
                bgColor="rgba(255,255,255,0.16)"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                onClick={handleTrialCompletionThanksClose}
                aria-label="關閉感謝試玩提示"
              >
                <IoClose size={22} color="white" />
              </Flex>
            </Flex>
            <Flex direction="column" px="24px" pt="24px" pb="22px" gap="18px">
              <Text color="#6D523D" fontSize="16px" fontWeight="800" lineHeight="1.8">
                謝謝你遊玩目前的試玩版本。更多劇情與小日獸都還在製作中
              </Text>
              <Flex
                as="button"
                alignSelf="stretch"
                h="46px"
                borderRadius="999px"
                bgColor="#9D7859"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                onClick={handleTrialCompletionThanksClose}
              >
                <Text color="#FFFFFF" fontSize="18px" fontWeight="900" lineHeight="1">
                  確定
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {(isOffworkScene && isReturnHomeTransitionOpen) || isShreddedDocumentReturnHomeScene ? (
        <ReturnHomeTransitionOverlay
          onFinish={() => {
            if (isShreddedDocumentReturnHomeScene && scene.nextSceneId) {
              startSceneTransition(scene.nextSceneId, "fade-black", 420);
              return;
            }
            const afterOffworkRewardSceneId = getAfterOffworkRewardSceneId();
            if (afterOffworkRewardSceneId === FIRST_FROG_RETURN_HOME_SCENE_ID) {
              markFirstFrogReturnHomeSceneSeen();
            }
            startSceneTransition(afterOffworkRewardSceneId, "fade-black", 420);
          }}
        />
      ) : null}

      {scene.id === "scene-98-to-company" ? (
        <DepartureTransitionOverlay
          mapPoints={METRO_TO_COMPANY_TRANSITION_POINTS}
          mapStartPercent={50}
          mapEndPercent={91}
          onFinish={() => {
            if (scene.nextSceneId) {
              startSceneTransition(scene.nextSceneId, "fade-black", 420);
            }
          }}
        />
      ) : null}

    </Flex>
  );
}
