import { ExhibitionExperienceGate } from "@/components/game/ExhibitionExperienceGate";
import { isExhibitionPhase } from "@/lib/game/exhibitionFlow";
import { parseExhibitionLocale } from "@/lib/game/exhibitionI18n";
import { parseCabinetBoxMotionVariant } from "@/lib/game/cabinetBoxMotion";

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
  const initialLocale = parseExhibitionLocale(firstSearchParam(resolvedSearchParams.lang));
  const initialBoxMotionVariant = parseCabinetBoxMotionVariant(
    firstSearchParam(resolvedSearchParams.boxMotion),
  );

  return (
    <ExhibitionExperienceGate
      initialPreview={initialPreview}
      initialSceneStep={initialSceneStep}
      initialLocale={initialLocale}
      initialBoxMotionVariant={initialBoxMotionVariant}
    />
  );
}
