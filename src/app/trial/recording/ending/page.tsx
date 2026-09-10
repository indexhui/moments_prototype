import type { Metadata } from "next";
import { EndingTrailerStudio } from "@/components/game/EndingTrailerStudio";

export const metadata: Metadata = {
  title: "街道青蛙 → 結尾標題 | 預告演出",
  robots: { index: false, follow: false },
};

export default function EndingTrailerPage() {
  return <EndingTrailerStudio />;
}
