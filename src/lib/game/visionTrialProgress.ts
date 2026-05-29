import {
  INITIAL_PLAYER_PROGRESS,
  savePlayerProgress,
  type DiaryEntryId,
  type PlayerProgress,
  type StickerId,
} from "@/lib/game/playerProgress";

const ARRANGE_ROUTE_LOGIC_TUTORIAL_SEEN_KEY = "moment:arrange-route-logic-tutorial-seen-v2";
const ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_SEEN_KEY = "moment:arrange-route-place-mission-tutorial-seen";
const ARRANGE_ROUTE_CONVENIENCE_TUTORIAL_SEEN_KEY = "moment:arrange-route-convenience-tutorial-seen";

export function prepareVisionNaotaroOffworkProgress() {
  const dogPhotoCapture = {
    sourceImage: "/images/428出圖/動物事件/黃金獵犬１.png",
    previewImage: "/images/428出圖/動物事件/黃金獵犬１.png",
    dogCoveragePercent: 90,
    cameraFrameRect: { x: 0.18, y: 0.51, width: 0.63, height: 0.2 },
    capturedRect: { x: 0.29, y: 0.51, width: 0.43, height: 0.2 },
    capturedAt: new Date().toISOString(),
  };
  const nextProgress: PlayerProgress = {
    ...INITIAL_PLAYER_PROGRESS,
    currentDay: 1,
    status: {
      ...INITIAL_PLAYER_PROGRESS.status,
      savings: 12,
      actionPower: 1,
    },
    arrangeRouteDepartureCount: 1,
    workShiftCount: 1,
    offworkRewardClaimCount: 0,
    ownedPlaceTileIds: ["metro-station"],
    pendingPlaceUnlockIntroIds: [],
    claimedPlaceUnlockIntroRewardIds: [],
    rewardPlaceTiles: [],
    consumedPlaceTileInstanceIds: [],
    unlockedDiaryEntryIds: ["bai-entry-1"] as DiaryEntryId[],
    stickerCollection: ["naotaro-basic"] as StickerId[],
    lastPhotoScore: 90,
    lastDogPhotoCapture: dogPhotoCapture,
    hasSeenDiaryFirstReveal: true,
    hasSeenSunbeastFirstReveal: true,
    hasSeenFirstSunbeastNightHubGuide: false,
    hasSeenFirstSunbeastNightHubGuideV2: false,
    hasSeenFirstSunbeastNightHubGuideV3: false,
    hasPendingFirstSunbeastNightHubGuide: true,
    hasSeenSunbeastShadowGuide: false,
    hasSeenBaiFirstEncounterIntro: true,
    encounteredCharacterIds: ["mai", "beigo"],
  };

  savePlayerProgress(nextProgress);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(ARRANGE_ROUTE_LOGIC_TUTORIAL_SEEN_KEY, "1");
    window.localStorage.setItem(ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_SEEN_KEY, "1");
    window.localStorage.setItem(ARRANGE_ROUTE_CONVENIENCE_TUTORIAL_SEEN_KEY, "1");
  }

  return nextProgress;
}
