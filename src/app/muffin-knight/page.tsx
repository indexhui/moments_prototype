import type { Metadata } from "next";
import MuffinKnightGame from "@/components/game/muffin-knight/MuffinKnightGame";
export const metadata: Metadata = { title: "小日獸・點心大作戰 | 走走小日", description: "收集漢堡，變身小日獸，連擊突破敵群！走走小日的單畫面平台動作遊戲。" };
export default function MuffinKnightPage() { return <MuffinKnightGame />; }
