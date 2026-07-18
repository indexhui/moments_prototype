import { MarketingMaterialsView } from "@/components/game/MarketingMaterialsView";
import { parseTrialProfilePreference } from "@/lib/game/demoBuild";

export default async function MarketingMaterialsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const trialPreference = parseTrialProfilePreference(resolvedSearchParams.trial);
  const trialProfile = trialPreference === "dev" ? trialPreference : null;

  return <MarketingMaterialsView trialProfile={trialProfile} />;
}
