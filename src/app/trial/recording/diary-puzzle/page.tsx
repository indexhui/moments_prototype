import type { Metadata } from "next";
import { DiaryPuzzleTrailerStudio } from "@/components/game/DiaryPuzzleTrailerStudio";

export const metadata: Metadata = {
  title: "搬家日記・自動拼圖 | 預告演出",
  robots: { index: false, follow: false },
};

export default function DiaryPuzzleTrailerPage() {
  return <DiaryPuzzleTrailerStudio />;
}
