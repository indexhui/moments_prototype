import type { Metadata } from "next";
import { BaiDiaryTrailerStudio } from "@/components/game/BaiDiaryTrailerStudio";

export const metadata: Metadata = {
  title: "小白漂浮 × 發光日記 | 預告演出",
  robots: { index: false, follow: false },
};

export default function BaiDiaryTrailerPage() {
  return <BaiDiaryTrailerStudio />;
}
