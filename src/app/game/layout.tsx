import { GameFrame } from "@/components/game/GameFrame";
import type { ReactNode } from "react";

export default function GameLayout({ children }: { children: ReactNode }) {
  return <GameFrame>{children}</GameFrame>;
}
