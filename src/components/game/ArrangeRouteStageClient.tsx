"use client";

import { useEffect, useState, type SetStateAction } from "react";
import { usePathname } from "next/navigation";
import { ArrangeRouteView } from "@/components/game/ArrangeRouteView";
import {
  StorySimpleMetroRouteView,
  type StoryRouteMode,
} from "@/components/game/StorySimpleMetroRouteView";
import type { GameScene } from "@/lib/game/scenes";
import type { GameEventId } from "@/lib/game/events";
import { ROUTES } from "@/lib/routes";
import type { TrialProfilePreference } from "@/lib/game/demoBuild";
import {
  INITIAL_PLAYER_PROGRESS,
  getArrangeRouteAttempt,
  getPlaceUnlockSnapshot,
  loadPlayerProgress,
  savePlayerProgress,
  syncDerivedPlaceUnlocks,
  type PlayerProgress,
} from "@/lib/game/playerProgress";

export function ArrangeRouteStageClient({
  scene,
  isStoryTutorialArrange = false,
  storyRouteMode = null,
  initialStreetExplore = false,
  initialEventId,
  initialFrogRouteReturnMode = null,
  initialTrialProfile = null,
}: {
  scene: GameScene;
  isStoryTutorialArrange?: boolean;
  storyRouteMode?: StoryRouteMode | null;
  initialStreetExplore?: boolean;
  initialEventId?: GameEventId;
  initialFrogRouteReturnMode?: "offwork" | null;
  initialTrialProfile?: TrialProfilePreference | null;
}) {
  const pathname = usePathname();
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress>(INITIAL_PLAYER_PROGRESS);
  const [isHydrated, setIsHydrated] = useState(false);
  const [arrangeRouteAttempt, setArrangeRouteAttempt] = useState(() =>
    getArrangeRouteAttempt(INITIAL_PLAYER_PROGRESS, {
      forceStoryTutorial: isStoryTutorialArrange,
    }),
  );

  useEffect(() => {
    const persisted = syncDerivedPlaceUnlocks();
    setPlayerProgress(persisted);
    setArrangeRouteAttempt(
      getArrangeRouteAttempt(persisted, {
        forceStoryTutorial: isStoryTutorialArrange,
      }),
    );
    setIsHydrated(true);
  }, [isStoryTutorialArrange]);

  useEffect(() => {
    const syncFromStorage = () => {
      setPlayerProgress(syncDerivedPlaceUnlocks());
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncFromStorage();
      }
    };

    window.addEventListener("focus", syncFromStorage);
    window.addEventListener("pageshow", syncFromStorage);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", syncFromStorage);
      window.removeEventListener("pageshow", syncFromStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (pathname !== ROUTES.gameArrangeRoute) return;
    const persisted = syncDerivedPlaceUnlocks();
    setPlayerProgress(persisted);
    setArrangeRouteAttempt(
      getArrangeRouteAttempt(persisted, {
        forceStoryTutorial: isStoryTutorialArrange,
      }),
    );
  }, [isStoryTutorialArrange, pathname]);

  const handlePlayerStatusChange = (
    updater: SetStateAction<PlayerProgress["status"]>,
  ) => {
    setPlayerProgress((prev) => {
      // Always merge status into the latest persisted progress to avoid
      // overwriting rewards granted by event helpers in parallel flows.
      const base = isHydrated ? loadPlayerProgress() : prev;
      const next = {
        ...base,
        status:
          typeof updater === "function"
            ? (updater as (prevState: PlayerProgress["status"]) => PlayerProgress["status"])(
              base.status,
            )
            : updater,
      };
      if (isHydrated) savePlayerProgress(next);
      return next;
    });
  };

  const handleProgressSaved = () => {
    setPlayerProgress(syncDerivedPlaceUnlocks());
  };

  if (storyRouteMode) {
    return (
      <StorySimpleMetroRouteView
        mode={storyRouteMode}
        onProgressSaved={handleProgressSaved}
      />
    );
  }

  return (
    <ArrangeRouteView
      arrangeRouteAttempt={arrangeRouteAttempt}
      isStoryTutorialArrange={isStoryTutorialArrange}
      initialStreetExplore={initialStreetExplore}
      initialEventId={initialEventId}
      initialFrogRouteReturnMode={initialFrogRouteReturnMode}
      workShiftCount={playerProgress.workShiftCount}
      playerStatus={playerProgress.status}
      rewardPlaceTiles={playerProgress.rewardPlaceTiles}
      offworkRewardClaimCount={playerProgress.offworkRewardClaimCount}
      hasPassedThroughStreet={playerProgress.hasPassedThroughStreet}
      hasUnlockedConvenienceStore={
        playerProgress.ownedPlaceTileIds.includes("convenience-store")
      }
      hasCompletedStreetForgotLunchFrogEvent={
        playerProgress.hasCompletedStreetForgotLunchFrogEvent
      }
      hasLearnedBaiSecretBaseHeban={playerProgress.hasLearnedBaiSecretBaseHeban}
      hasUnlockedSpecialMap={playerProgress.hasUnlockedSpecialMap}
      hasAvailableSpecialMapPuzzle={playerProgress.hasAvailableSpecialMapPuzzle}
      hasSeenSpecialMapGuide={playerProgress.hasSeenSpecialMapGuide}
      hasSeenSpecialMapRotationGuide={playerProgress.hasSeenSpecialMapRotationGuide}
      hasSeenSunbeastFirstReveal={playerProgress.hasSeenSunbeastFirstReveal}
      unlockedDiaryEntryIds={playerProgress.unlockedDiaryEntryIds}
      placeUnlockSnapshot={getPlaceUnlockSnapshot(playerProgress)}
      onPlayerStatusChange={handlePlayerStatusChange}
      onProgressSaved={handleProgressSaved}
    />
  );
}
