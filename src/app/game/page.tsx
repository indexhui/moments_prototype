import { GameSceneStageClient } from "@/components/game/GameSceneStageClient";
import { FIRST_SCENE_ID, GAME_SCENES } from "@/lib/game/scenes";

export default function GamePage() {
  const scene = GAME_SCENES[FIRST_SCENE_ID];

  return <GameSceneStageClient scene={scene} />;
}
