import type { Metadata } from "next";
import { BeigoPokerGame } from "@/components/game/BeigoPokerGame";

export const metadata: Metadata = {
  title: "小貝的怪手牌局｜Moment",
  description: "以四種花色能力組成 Combo，挑戰小貝的撲克牌小遊戲原型。",
};

export default function BeigoPokerPage() {
  return <BeigoPokerGame />;
}
