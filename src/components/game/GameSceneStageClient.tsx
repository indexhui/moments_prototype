"use client";

import { useEffect, useState } from "react";
import { GameSceneView } from "@/components/game/GameSceneView";
import type { GameScene } from "@/lib/game/scenes";
import {
  INITIAL_PLAYER_PROGRESS,
  loadPlayerProgress,
  type PlayerProgress,
} from "@/lib/game/playerProgress";
import type { TrialProfilePreference } from "@/lib/game/demoBuild";

export function GameSceneStageClient({
  scene,
  initialTrialProfile = null,
}: {
  scene: GameScene;
  initialTrialProfile?: TrialProfilePreference | null;
}) {
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress>(INITIAL_PLAYER_PROGRESS);

  useEffect(() => {
    setPlayerProgress(loadPlayerProgress());
  }, [scene.id]);

  return (
    <GameSceneView
      scene={scene}
      workShiftCount={playerProgress.workShiftCount}
    />
  );
}
