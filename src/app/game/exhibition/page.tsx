import { ExhibitionExperienceView } from "@/components/game/ExhibitionExperienceView";
import { isExhibitionPhase } from "@/lib/game/exhibitionFlow";

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ExhibitionPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const requestedPreview = firstSearchParam(resolvedSearchParams.preview) ?? null;
  const initialPreview = isExhibitionPhase(requestedPreview) ? requestedPreview : null;
  const initialSceneStep = firstSearchParam(resolvedSearchParams.sceneStep) ?? null;

  return (
    <ExhibitionExperienceView
      initialPreview={initialPreview}
      initialSceneStep={initialSceneStep}
    />
  );
}
