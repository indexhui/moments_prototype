import type { Metadata } from "next";
import DiaryPaperFrameClient from "./DiaryPaperFrameClient";

export const metadata: Metadata = {
  title: "日記頁背景實驗 | Moment Prototype",
  description: "在獨立測試頁比較原本日記圖片框與三片式手繪紙框。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DiaryPaperFrameTrialPage() {
  return <DiaryPaperFrameClient />;
}
