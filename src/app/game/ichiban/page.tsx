import type { Metadata } from "next";
import { ExhibitionIchibanView } from "@/components/game/ExhibitionIchibanView";

export const metadata: Metadata = {
  title: "小日獸一番賞｜MOMENT 展覽版",
  description: "MOMENT 展覽用互動一番賞體驗。",
};

export default function ExhibitionIchibanPage() {
  return <ExhibitionIchibanView />;
}
