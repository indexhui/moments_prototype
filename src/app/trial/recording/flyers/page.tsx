import type { Metadata } from "next";
import { FlyerTrailerStudio } from "@/components/game/FlyerTrailerStudio";

export const metadata: Metadata = {
  title: "日記完成 → 撿傳單 | 預告演出",
  robots: { index: false, follow: false },
};

export default function FlyerTrailerPage() {
  return <FlyerTrailerStudio />;
}
