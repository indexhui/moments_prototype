import type { Metadata } from "next";
import HibimonPlannerClient from "./HibimonPlannerClient";

export const metadata: Metadata = {
  title: "Hibimon 企劃表 | Moment Prototype",
  description: "小日獸劇情銜接、日記線索與關卡流程的可編輯企劃表。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function HibimonPlannerPage() {
  return <HibimonPlannerClient />;
}

