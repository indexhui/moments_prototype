import { notFound } from "next/navigation";
import { GameSceneStageClient } from "@/components/game/GameSceneStageClient";
import { GAME_SCENES } from "@/lib/game/scenes";
import { parseTrialProfilePreference } from "@/lib/game/demoBuild";

type GameScenePageProps = {
  params: Promise<{ sceneId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GameScenePage({ params, searchParams }: GameScenePageProps) {
  const { sceneId } = await params;
  const scene = GAME_SCENES[sceneId];
  const resolvedSearchParams = (await searchParams) ?? {};
  const trialParam = resolvedSearchParams.trial;
  const initialTrialProfile = parseTrialProfilePreference(trialParam);

  if (!scene) {
    notFound();
  }

  return <GameSceneStageClient scene={scene} initialTrialProfile={initialTrialProfile} />;
}
