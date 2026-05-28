import type { Metadata } from "next";
import { VisionTrialKiosk } from "@/components/game/VisionTrialKiosk";

export const metadata: Metadata = {
  title: "走走小日 | 放視大賞特別入口",
  description: "給放視大賞現場體驗的走走小日特別版本。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function VisionTrialPage() {
  return <VisionTrialKiosk />;
}
