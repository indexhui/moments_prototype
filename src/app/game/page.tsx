import { GameSceneStageClient } from "@/components/game/GameSceneStageClient";
import { FIRST_SCENE_ID, GAME_SCENES } from "@/lib/game/scenes";
import { parseTrialProfilePreference } from "@/lib/game/demoBuild";

export default async function GamePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const scene = GAME_SCENES[FIRST_SCENE_ID];
  const resolvedSearchParams = (await searchParams) ?? {};
  const trialParam = resolvedSearchParams.trial;
  const initialTrialProfile = parseTrialProfilePreference(trialParam);

  return <GameSceneStageClient scene={scene} initialTrialProfile={initialTrialProfile} />;
}
