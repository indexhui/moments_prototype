import type { Metadata } from "next";
import { SunbeastTrailerStudio } from "@/components/game/SunbeastTrailerStudio";

export const metadata: Metadata = {
  title: "黃金獵犬 × 青蛙 | 預告拍照演出",
  robots: { index: false, follow: false },
};

export default function SunbeastTrailerPage() {
  return <SunbeastTrailerStudio />;
}
