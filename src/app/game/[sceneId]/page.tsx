import { notFound } from "next/navigation";
import { GameSceneStageClient } from "@/components/game/GameSceneStageClient";
import { GAME_SCENES } from "@/lib/game/scenes";

type GameScenePageProps = {
  params: Promise<{ sceneId: string }>;
};

export function generateStaticParams() {
  return Object.keys(GAME_SCENES).map((sceneId) => ({ sceneId }));
}

export default async function GameScenePage({ params }: GameScenePageProps) {
  const { sceneId } = await params;
  const scene = GAME_SCENES[sceneId];

  if (!scene) {
    notFound();
  }

  return <GameSceneStageClient scene={scene} />;
}

