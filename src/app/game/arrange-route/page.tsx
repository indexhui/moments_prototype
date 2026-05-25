import { ArrangeRouteStageClient } from "@/components/game/ArrangeRouteStageClient";
import { FIRST_SCENE_ID, GAME_SCENES } from "@/lib/game/scenes";
import type { GameEventId } from "@/lib/game/events";

export default async function ArrangeRoutePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const scene = GAME_SCENES[FIRST_SCENE_ID];
  const resolvedSearchParams = (await searchParams) ?? {};
  const tutorialParam = resolvedSearchParams.tutorial;
  const eventParam = resolvedSearchParams.event;
  const streetExploreParam = resolvedSearchParams.streetExplore;
  const trialParam = resolvedSearchParams.trial;
  const isStoryTutorialArrange =
    (Array.isArray(tutorialParam) ? tutorialParam[0] : tutorialParam) === "story41";
  const initialStreetExplore =
    (Array.isArray(streetExploreParam) ? streetExploreParam[0] : streetExploreParam) === "1";
  const initialTrialProfile =
    (Array.isArray(trialParam) ? trialParam[0] : trialParam) === "gameworks"
      ? "gameworks"
      : null;
  const initialEventId =
    (Array.isArray(eventParam) ? eventParam[0] : eventParam) === "street-vision-expo-promo"
      ? ("street-vision-expo-promo" as GameEventId)
      : undefined;

  return (
    <ArrangeRouteStageClient
      scene={scene}
      isStoryTutorialArrange={isStoryTutorialArrange}
      initialStreetExplore={initialStreetExplore}
      initialEventId={initialEventId}
      initialTrialProfile={initialTrialProfile}
    />
  );
}
