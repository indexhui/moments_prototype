"use client";

import { useCallback, useEffect, useState } from "react";
import { GameFrame } from "@/components/game/GameFrame";
import { GameSceneView } from "@/components/game/GameSceneView";
import type { GameScene } from "@/lib/game/scenes";
import { ROUTES } from "@/lib/routes";
import {
  getCurrentRunArrangeRouteAttempt,
  INITIAL_PLAYER_PROGRESS,
  loadPlayerProgress,
  resetPlayerProgress,
  type PlayerProgress,
} from "@/lib/game/playerProgress";

export function GameSceneStageClient({ scene }: { scene: GameScene }) {
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress>(INITIAL_PLAYER_PROGRESS);
  const [isOffworkRewardModal, setIsOffworkRewardModal] = useState(false);

  useEffect(() => {
    setPlayerProgress(loadPlayerProgress());
  }, [scene.id]);

  const handleOffworkRewardOpenChange = useCallback((open: boolean) => {
    setIsOffworkRewardModal(open);
  }, []);

  const attempt = getCurrentRunArrangeRouteAttempt(playerProgress);

  return (
    <GameFrame
      scene={scene}
      playerStatus={playerProgress.status}
      rewardPlaceTiles={playerProgress.rewardPlaceTiles}
      inventoryItems={playerProgress.inventoryItems}
      workShiftCount={playerProgress.workShiftCount}
      arrangeRouteAttempt={attempt}
      hasPassedThroughStreet={playerProgress.hasPassedThroughStreet}
      isOffworkRewardModal={isOffworkRewardModal}
      onResetProgress={() => {
        resetPlayerProgress();
        setPlayerProgress(INITIAL_PLAYER_PROGRESS);
        if (typeof window !== "undefined") {
          window.location.assign(ROUTES.gameRoot);
        }
      }}
    >
      <GameSceneView
        scene={scene}
        onOffworkRewardOpenChange={handleOffworkRewardOpenChange}
      />
    </GameFrame>
  );
}
