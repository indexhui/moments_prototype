import { ArrangeRouteStageClient } from "@/components/game/ArrangeRouteStageClient";
import { GAME_EVENT_LIST, type GameEventId } from "@/lib/game/events";
import { FIRST_SCENE_ID, GAME_SCENES } from "@/lib/game/scenes";
import { parseTrialProfilePreference } from "@/lib/game/demoBuild";

export default async function ArrangeRoutePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const scene = GAME_SCENES[FIRST_SCENE_ID];
  const resolvedSearchParams = (await searchParams) ?? {};
  const streetExploreParam = resolvedSearchParams.streetExplore;
  const storyRouteParam = resolvedSearchParams.storyRoute;
  const eventIdParam = resolvedSearchParams.eventId;
  const frogReturnParam = resolvedSearchParams.frogReturn;
  const sceneStepParam = resolvedSearchParams.sceneStep;
  const frogLunchReturnParam = resolvedSearchParams.frogLunchReturn;
  const trialParam = resolvedSearchParams.trial;
  const isStoryTutorialArrange = false;
  const initialStreetExplore =
    (Array.isArray(streetExploreParam) ? streetExploreParam[0] : streetExploreParam) === "1";
  const rawStoryRouteMode = Array.isArray(storyRouteParam) ? storyRouteParam[0] : storyRouteParam;
  const storyRouteMode =
    rawStoryRouteMode === "simple-metro" ||
    rawStoryRouteMode === "frog-clue" ||
    rawStoryRouteMode === "work-lunch-convenience" ||
    rawStoryRouteMode === "metro-exit"
      ? rawStoryRouteMode
      : null;
  const rawEventId = Array.isArray(eventIdParam) ? eventIdParam[0] : eventIdParam;
  const rawFrogReturn = Array.isArray(frogReturnParam) ? frogReturnParam[0] : frogReturnParam;
  const initialFrogSceneJumpStepId = Array.isArray(sceneStepParam) ? sceneStepParam[0] : sceneStepParam;
  const rawFrogLunchReturn = Array.isArray(frogLunchReturnParam) ? frogLunchReturnParam[0] : frogLunchReturnParam;
  const initialEventId: GameEventId | undefined =
    GAME_EVENT_LIST.some((event) => event.id === rawEventId) ? (rawEventId as GameEventId) : undefined;
  const initialFrogRouteReturnMode = rawFrogReturn === "offwork" ? "offwork" : null;
  const initialFrogLunchReturn = rawFrogLunchReturn === "1";
  const initialTrialProfile = parseTrialProfilePreference(trialParam);

  return (
    <ArrangeRouteStageClient
      scene={scene}
      isStoryTutorialArrange={isStoryTutorialArrange}
      storyRouteMode={storyRouteMode}
      initialStreetExplore={initialStreetExplore}
      initialEventId={initialEventId}
      initialFrogRouteReturnMode={initialFrogRouteReturnMode}
      initialFrogSceneJumpStepId={initialFrogSceneJumpStepId}
      initialFrogLunchReturn={initialFrogLunchReturn}
      initialTrialProfile={initialTrialProfile}
    />
  );
}
