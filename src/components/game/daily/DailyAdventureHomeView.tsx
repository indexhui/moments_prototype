"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import {
  hasSeenDailyAdventureOnboarding,
  markDailyAdventureOnboardingSeen,
} from "@/lib/game/dailyAdventure";
import { loadDailyAdventureProfile } from "@/lib/game/dailyAdventureProfile";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import { DailyAdventureMapView } from "./DailyAdventureMapView";
import { DailyAdventureOnboardingModal } from "./DailyAdventureOnboardingModal";

export function DailyAdventureHomeView() {
  const router = useRouter();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    const isOnboardingPreview =
      new URLSearchParams(window.location.search).get("onboarding") === "1";
    if (
      isOnboardingPreview ||
      !hasSeenDailyAdventureOnboarding() ||
      !loadDailyAdventureProfile()
    ) {
      setIsOnboardingOpen(true);
    }
  }, []);

  return (
    <DailyAdventureMapView
      overlay={
        isOnboardingOpen ? (
          <DailyAdventureOnboardingModal
            onExit={() => router.push(withTrialProfileSearch(ROUTES.gameLobby))}
            onComplete={() => {
              markDailyAdventureOnboardingSeen();
              setIsOnboardingOpen(false);
            }}
          />
        ) : null
      }
    />
  );
}
