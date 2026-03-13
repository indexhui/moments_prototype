/**
 * 遊戲流程與規則定義
 * - 流程：安排路線 → 出發與事件 → 上班過場 → 下班 → 下班獎勵 → (循環)
 * - 規則：依「第 N 次」安排路線／領取下班獎勵次數而變動
 */

export const FLOW_STAGE_IDS = [
  "arrange-route",
  "depart-events",
  "work-transition",
  "offwork",
  "offwork-reward",
] as const;

export type FlowStageId = (typeof FLOW_STAGE_IDS)[number];

export type FlowStage = {
  id: FlowStageId;
  label: string;
  order: number;
};

/** 遊戲流程階段（一輪內順序） */
export const GAME_FLOW_STAGES: FlowStage[] = [
  { id: "arrange-route", label: "安排路線", order: 1 },
  { id: "depart-events", label: "出發與事件", order: 2 },
  { id: "work-transition", label: "上班過場", order: 3 },
  { id: "offwork", label: "下班", order: 4 },
  { id: "offwork-reward", label: "下班獎勵", order: 5 },
];

/**
 * 依目前 pathname 與 scene.id 判斷當前流程階段
 * - /game/arrange-route → 安排路線
 * - /game、/game/[sceneId] 且 scene 為早晨等 → 出發與事件 / 上班過場
 * - scene-offwork → 下班
 * - 下班獎勵為 modal 狀態，由各頁傳入或不明時不顯示
 */
export function getCurrentFlowStage(
  pathname: string,
  sceneId: string,
  isOffworkRewardModal?: boolean,
): FlowStageId {
  if (isOffworkRewardModal) return "offwork-reward";
  if (pathname.includes("arrange-route")) return "arrange-route";
  if (sceneId === "scene-offwork") return "offwork";
  if (pathname.startsWith("/game")) return "depart-events"; // 早晨劇情 or 上班過場
  return "arrange-route";
}

export type AttemptRewardTrack = {
  attempt: number;
  title: string;
  rewards: string;
  status: "completed" | "current" | "locked" | "pending";
};

export function getAttemptRewardTracks(currentAttempt: number): AttemptRewardTrack[] {
  const base: AttemptRewardTrack[] = [
    { attempt: 1, title: "第 1 次安排路線", rewards: "捷運、街燈", status: "locked" },
    { attempt: 2, title: "第 2 次安排路線", rewards: "捷運、街道、自組", status: "locked" },
  ];
  return base.map((item) => {
    if (currentAttempt > item.attempt) return { ...item, status: "completed" };
    if (currentAttempt === item.attempt) return { ...item, status: "current" };
    return { ...item, status: "locked" };
  });
}

export type ArrangeRouteChangeTrack = {
  id: "street-passed" | "start-cell-shift";
  title: string;
  condition: string;
  effect: string;
  status: "triggered" | "waiting";
};

export function getArrangeRouteChangeTracks(
  currentAttempt: number,
  hasPassedThroughStreet: boolean,
): ArrangeRouteChangeTrack[] {
  return [
    {
      id: "street-passed",
      title: "街道條件",
      condition: "在安排路線中出發且經過街道",
      effect: "第 3 次起可切換為拼圖池獎勵",
      status: hasPassedThroughStreet ? "triggered" : "waiting",
    },
    {
      id: "start-cell-shift",
      title: "起點變化",
      condition: "安排路線達第 4 次，且曾在路線中經過街道",
      effect: "家的起點改為右上格",
      status: currentAttempt >= 4 && hasPassedThroughStreet ? "triggered" : "waiting",
    },
  ];
}

/** 合併進程與觸發條件為單一列表，供左側一塊顯示 + Tab（全部/已觸發/未觸發）篩選 */
export type UnifiedExpansionItem =
  | {
      type: "milestone";
      id: string;
      title: string;
      rewards: string;
      status: "completed" | "current" | "locked";
      triggered: boolean;
    }
  | {
      type: "unlock";
      id: string;
      title: string;
      condition: string;
      effect: string;
      status: "triggered" | "waiting";
      triggered: boolean;
    };

export function getUnifiedExpansionTracks(
  currentAttempt: number,
  hasPassedThroughStreet: boolean,
): UnifiedExpansionItem[] {
  const milestones: UnifiedExpansionItem[] = [
    {
      type: "milestone",
      id: "attempt-1",
      title: "第 1 次安排路線",
      rewards: "捷運、街燈",
      status: currentAttempt > 1 ? "completed" : currentAttempt === 1 ? "current" : "locked",
      triggered: currentAttempt > 1,
    },
    {
      type: "milestone",
      id: "attempt-2",
      title: "第 2 次安排路線",
      rewards: "捷運、街道、自組",
      status: currentAttempt > 2 ? "completed" : currentAttempt === 2 ? "current" : "locked",
      triggered: currentAttempt > 2,
    },
  ];
  const unlocks: UnifiedExpansionItem[] = [
    {
      type: "unlock",
      id: "street-passed",
      title: "街道條件",
      condition: "在安排路線中出發且經過街道",
      effect: "第 3 次起可切換為拼圖池獎勵",
      status: hasPassedThroughStreet ? "triggered" : "waiting",
      triggered: hasPassedThroughStreet,
    },
    {
      type: "unlock",
      id: "start-cell-shift",
      title: "起點變化",
      condition: "安排路線達第 4 次，且曾在路線中經過街道",
      effect: "家的起點改為右上格",
      status: currentAttempt >= 4 && hasPassedThroughStreet ? "triggered" : "waiting",
      triggered: currentAttempt >= 4 && hasPassedThroughStreet,
    },
  ];
  return [...milestones, ...unlocks];
}
