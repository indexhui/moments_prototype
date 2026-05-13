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
  const isStoryTutorialArrange =
    (Array.isArray(tutorialParam) ? tutorialParam[0] : tutorialParam) === "story41";
  const initialEventId =
    (Array.isArray(eventParam) ? eventParam[0] : eventParam) === "street-vision-expo-promo"
      ? ("street-vision-expo-promo" as GameEventId)
      : undefined;

  return (
    <ArrangeRouteStageClient
      scene={scene}
      isStoryTutorialArrange={isStoryTutorialArrange}
      initialEventId={initialEventId}
    />
  );
}
