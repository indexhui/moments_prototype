"use client";

import { useEffect, useState, type SetStateAction } from "react";
import { usePathname } from "next/navigation";
import { ArrangeRouteView } from "@/components/game/ArrangeRouteView";
import { GameFrame } from "@/components/game/GameFrame";
import type { GameScene } from "@/lib/game/scenes";
import { ROUTES } from "@/lib/routes";
import {
  INITIAL_PLAYER_PROGRESS,
  loadPlayerProgress,
  resetPlayerProgress,
  savePlayerProgress,
  type PlayerProgress,
} from "@/lib/game/playerProgress";

export function ArrangeRouteStageClient({ scene }: { scene: GameScene }) {
  const pathname = usePathname();
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress>(INITIAL_PLAYER_PROGRESS);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const persisted = loadPlayerProgress();
    setPlayerProgress(persisted);
    setIsHydrated(true);
  }, []);

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
    setPlayerProgress(loadPlayerProgress());
  }, [pathname]);

  const handleResetProgress = () => {
    setPlayerProgress(INITIAL_PLAYER_PROGRESS);
    resetPlayerProgress();
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
      arrangeRouteAttempt={playerProgress.offworkRewardClaimCount + 1}
      hasPassedThroughStreet={playerProgress.hasPassedThroughStreet}
      onResetProgress={handleResetProgress}
    >
      <ArrangeRouteView
        playerStatus={playerProgress.status}
        rewardPlaceTiles={playerProgress.rewardPlaceTiles}
        offworkRewardClaimCount={playerProgress.offworkRewardClaimCount}
        hasPassedThroughStreet={playerProgress.hasPassedThroughStreet}
        onPlayerStatusChange={handlePlayerStatusChange}
        onProgressSaved={() => setPlayerProgress(loadPlayerProgress())}
      />
    </GameFrame>
  );
}
