import { ArrangeRouteStageClient } from "@/components/game/ArrangeRouteStageClient";
import { FIRST_SCENE_ID, GAME_SCENES } from "@/lib/game/scenes";
import { parseTrialProfilePreference } from "@/lib/game/demoBuild";

export default async function ArrangeRoutePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const scene = GAME_SCENES[FIRST_SCENE_ID];
  const resolvedSearchParams = (await searchParams) ?? {};
  const tutorialParam = resolvedSearchParams.tutorial;
  const streetExploreParam = resolvedSearchParams.streetExplore;
  const trialParam = resolvedSearchParams.trial;
  const isStoryTutorialArrange =
    (Array.isArray(tutorialParam) ? tutorialParam[0] : tutorialParam) === "story41";
  const initialStreetExplore =
    (Array.isArray(streetExploreParam) ? streetExploreParam[0] : streetExploreParam) === "1";
  const initialTrialProfile = parseTrialProfilePreference(trialParam);

  return (
    <ArrangeRouteStageClient
      scene={scene}
      isStoryTutorialArrange={isStoryTutorialArrange}
      initialStreetExplore={initialStreetExplore}
      initialTrialProfile={initialTrialProfile}
    />
  );
}
