import type { Metadata } from "next";
import { MetroComicTrailerStudio } from "@/components/game/MetroComicTrailerStudio";

export const metadata: Metadata = {
  title: "捷運事件 × 小貝狗 | 預告漫畫演出",
  robots: { index: false, follow: false },
};

export default function MetroComicTrailerPage() {
  return <MetroComicTrailerStudio />;
}
