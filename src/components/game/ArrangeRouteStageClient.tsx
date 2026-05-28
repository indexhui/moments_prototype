"use client";

import { useEffect, useState, type SetStateAction } from "react";
import { usePathname } from "next/navigation";
import { ArrangeRouteView } from "@/components/game/ArrangeRouteView";
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

type ArrangeRouteQueryOptions = {
  isStoryTutorialArrange: boolean;
  initialStreetExplore: boolean;
  initialEventId?: GameEventId;
};

function getArrangeRouteQueryOptions(fallback: ArrangeRouteQueryOptions): ArrangeRouteQueryOptions {
  if (typeof window === "undefined") return fallback;

  const params = new URLSearchParams(window.location.search);

  return {
    isStoryTutorialArrange: params.get("tutorial") === "story41" || fallback.isStoryTutorialArrange,
    initialStreetExplore: params.get("streetExplore") === "1" || fallback.initialStreetExplore,
    initialEventId:
      params.get("event") === "street-vision-expo-promo"
        ? "street-vision-expo-promo"
        : fallback.initialEventId,
  };
}

export function ArrangeRouteStageClient({
  scene,
  isStoryTutorialArrange = false,
  initialStreetExplore = false,
  initialEventId,
  initialTrialProfile = null,
}: {
  scene: GameScene;
  isStoryTutorialArrange?: boolean;
  initialStreetExplore?: boolean;
  initialEventId?: GameEventId;
  initialTrialProfile?: TrialProfilePreference | null;
}) {
  const pathname = usePathname();
  const [routeOptions, setRouteOptions] = useState<ArrangeRouteQueryOptions>(() => ({
    isStoryTutorialArrange,
    initialStreetExplore,
    initialEventId,
  }));
  const effectiveIsStoryTutorialArrange = routeOptions.isStoryTutorialArrange;
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress>(INITIAL_PLAYER_PROGRESS);
  const [isHydrated, setIsHydrated] = useState(false);
  const [arrangeRouteAttempt, setArrangeRouteAttempt] = useState(() =>
    getArrangeRouteAttempt(INITIAL_PLAYER_PROGRESS, {
      forceStoryTutorial: effectiveIsStoryTutorialArrange,
    }),
  );

  useEffect(() => {
    const fallback = {
      isStoryTutorialArrange,
      initialStreetExplore,
      initialEventId,
    };
    const syncRouteOptions = () => setRouteOptions(getArrangeRouteQueryOptions(fallback));

    syncRouteOptions();
    window.addEventListener("popstate", syncRouteOptions);
    window.addEventListener("pageshow", syncRouteOptions);

    return () => {
      window.removeEventListener("popstate", syncRouteOptions);
      window.removeEventListener("pageshow", syncRouteOptions);
    };
  }, [initialEventId, initialStreetExplore, isStoryTutorialArrange, pathname]);

  useEffect(() => {
    const persisted = syncDerivedPlaceUnlocks();
    setPlayerProgress(persisted);
    setArrangeRouteAttempt(
      getArrangeRouteAttempt(persisted, {
        forceStoryTutorial: effectiveIsStoryTutorialArrange,
      }),
    );
    setIsHydrated(true);
  }, [effectiveIsStoryTutorialArrange]);

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
        forceStoryTutorial: effectiveIsStoryTutorialArrange,
      }),
    );
  }, [effectiveIsStoryTutorialArrange, pathname]);

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

  return (
    <ArrangeRouteView
      arrangeRouteAttempt={arrangeRouteAttempt}
      isStoryTutorialArrange={effectiveIsStoryTutorialArrange}
      initialStreetExplore={routeOptions.initialStreetExplore}
      initialEventId={routeOptions.initialEventId}
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
      hasUnlockedSpecialMap={playerProgress.hasUnlockedSpecialMap}
      hasAvailableSpecialMapPuzzle={playerProgress.hasAvailableSpecialMapPuzzle}
      hasSeenSpecialMapGuide={playerProgress.hasSeenSpecialMapGuide}
      hasSeenSpecialMapRotationGuide={playerProgress.hasSeenSpecialMapRotationGuide}
      hasSeenSunbeastFirstReveal={playerProgress.hasSeenSunbeastFirstReveal}
      unlockedDiaryEntryIds={playerProgress.unlockedDiaryEntryIds}
      placeUnlockSnapshot={getPlaceUnlockSnapshot(playerProgress)}
      onPlayerStatusChange={handlePlayerStatusChange}
      onProgressSaved={() => setPlayerProgress(syncDerivedPlaceUnlocks())}
    />
  );
}
