"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrangeRouteStageClient } from "@/components/game/ArrangeRouteStageClient";
import { FIRST_SCENE_ID, GAME_SCENES } from "@/lib/game/scenes";
import type { GameEventId } from "@/lib/game/events";

function ArrangeRouteContent() {
  const searchParams = useSearchParams();
  const scene = GAME_SCENES[FIRST_SCENE_ID];

  const isStoryTutorialArrange = searchParams.get("tutorial") === "story41";
  const initialStreetExplore = searchParams.get("streetExplore") === "1";
  const initialEventId =
    searchParams.get("event") === "street-vision-expo-promo"
      ? ("street-vision-expo-promo" as GameEventId)
      : undefined;

  return (
    <ArrangeRouteStageClient
      scene={scene}
      isStoryTutorialArrange={isStoryTutorialArrange}
      initialStreetExplore={initialStreetExplore}
      initialEventId={initialEventId}
    />
  );
}

export default function ArrangeRoutePage() {
  return (
    <Suspense fallback={null}>
      <ArrangeRouteContent />
    </Suspense>
  );
}
