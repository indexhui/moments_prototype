import { ArrangeRouteStageClient } from "@/components/game/ArrangeRouteStageClient";
import { FIRST_SCENE_ID, GAME_SCENES } from "@/lib/game/scenes";

export default async function ArrangeRoutePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const scene = GAME_SCENES[FIRST_SCENE_ID];
  const resolvedSearchParams = (await searchParams) ?? {};
  const tutorialParam = resolvedSearchParams.tutorial;
  const isStoryTutorialArrange =
    (Array.isArray(tutorialParam) ? tutorialParam[0] : tutorialParam) === "story41";

  return (
    <ArrangeRouteStageClient
      scene={scene}
      isStoryTutorialArrange={isStoryTutorialArrange}
    />
  );
}
