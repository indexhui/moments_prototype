import { ROUTES } from "@/lib/routes";

export type MarketingMaterialItem = {
  id: string;
  category: "社群素材" | "Thread 素材";
  title: string;
  description: string;
  href: string;
  previewImage: string;
  accent: string;
};

export const MARKETING_MATERIALS: readonly MarketingMaterialItem[] = [
  {
    id: "summer-commute",
    category: "社群素材",
    title: "夏天通勤共同話題",
    description: "對話式互動短素材，不寫入主線進度。",
    href: ROUTES.gameMarketingSocialSummerCommute,
    previewImage: "/images/social/summer-commute/bike-heat.jpg",
    accent: "#7D6B9A",
  },
  {
    id: "diary-thread",
    category: "Thread 素材",
    title: "日記 Thread",
    description: "交換日記錄影與截圖專用入口。",
    href: ROUTES.gameMarketingDiaryThread,
    previewImage: "/images/diary/diary_thread.jpg",
    accent: "#6C8E5E",
  },
] as const;
