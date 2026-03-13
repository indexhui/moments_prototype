import { ArrangeRouteStageClient } from "@/components/game/ArrangeRouteStageClient";
import { FIRST_SCENE_ID, GAME_SCENES } from "@/lib/game/scenes";

export default function ArrangeRoutePage() {
  const scene = GAME_SCENES[FIRST_SCENE_ID];

  return <ArrangeRouteStageClient scene={scene} />;
}

