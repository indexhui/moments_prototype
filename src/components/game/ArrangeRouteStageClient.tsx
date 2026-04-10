"use client";

import { useEffect, useState, type SetStateAction } from "react";
import { usePathname } from "next/navigation";
import { ArrangeRouteView } from "@/components/game/ArrangeRouteView";
import { GameFrame } from "@/components/game/GameFrame";
import type { GameScene } from "@/lib/game/scenes";
import { ROUTES } from "@/lib/routes";
import {
  INITIAL_PLAYER_PROGRESS,
  getArrangeRouteAttempt,
  loadPlayerProgress,
  resetPlayerProgress,
  savePlayerProgress,
  type PlayerProgress,
} from "@/lib/game/playerProgress";

export function ArrangeRouteStageClient({
  scene,
  isStoryTutorialArrange = false,
}: {
  scene: GameScene;
  isStoryTutorialArrange?: boolean;
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
    const persisted = loadPlayerProgress();
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
      setPlayerProgress(loadPlayerProgress());
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
    const persisted = loadPlayerProgress();
    setPlayerProgress(persisted);
    setArrangeRouteAttempt(
      getArrangeRouteAttempt(persisted, {
        forceStoryTutorial: isStoryTutorialArrange,
      }),
    );
  }, [isStoryTutorialArrange, pathname]);

  const handleResetProgress = () => {
    setPlayerProgress(INITIAL_PLAYER_PROGRESS);
    resetPlayerProgress();
    if (typeof window !== "undefined") {
      window.location.assign(ROUTES.gameRoot);
    }
  };

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
    <GameFrame
      scene={scene}
      playerStatus={playerProgress.status}
      rewardPlaceTiles={playerProgress.rewardPlaceTiles}
      inventoryItems={playerProgress.inventoryItems}
      workShiftCount={playerProgress.workShiftCount}
      arrangeRouteAttempt={arrangeRouteAttempt}
      hasPassedThroughStreet={playerProgress.hasPassedThroughStreet}
      onResetProgress={handleResetProgress}
    >
      <ArrangeRouteView
        arrangeRouteAttempt={arrangeRouteAttempt}
        isStoryTutorialArrange={isStoryTutorialArrange}
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
        onPlayerStatusChange={handlePlayerStatusChange}
        onProgressSaved={() => setPlayerProgress(loadPlayerProgress())}
      />
    </GameFrame>
  );
}
