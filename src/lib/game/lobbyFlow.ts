import { ROUTES } from "@/lib/routes";
import {
  DAILY_ADVENTURE_RETURN_HOME_SCENE_ID,
  FIRST_FROG_RETURN_HOME_SCENE_ID,
  FIRST_SCENE_ID,
} from "@/lib/game/scenes";
import type { PlayerProgress } from "@/lib/game/playerProgress";

const NAOTARO_STICKER_IDS = new Set(["naotaro-basic", "naotaro-smile", "naotaro-rare"]);

export type GameLobbyTarget = {
  path: string;
  title: string;
  description: string;
  actionLabel: string;
  badge: string;
};

export type GameDailyTask = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  rewardLabel: string;
  path: string;
  actionLabel: string;
  accentColor: string;
};

function hasCollectedNaotaro(progress: PlayerProgress) {
  return (
    progress.hasSeenSunbeastFirstReveal ||
    progress.lastDogPhotoCapture !== null ||
    progress.stickerCollection.some((stickerId) => NAOTARO_STICKER_IDS.has(stickerId))
  );
}

export function getGameLobbyMainStoryTarget(progress: PlayerProgress): GameLobbyTarget {
  const hasFirstDiary = progress.unlockedDiaryEntryIds.includes("bai-entry-1");

  if (
    progress.hasCompletedDailyAdventureLobbyGuideLevelOne &&
    !progress.hasSeenDailyAdventureMainStoryReturnGuide
  ) {
    return {
      path: ROUTES.gameScene(DAILY_ADVENTURE_RETURN_HOME_SCENE_ID),
      title: "回到小麥房間",
      description: "整理今天遇到的小日獸線索，睡一覺後準備隔天的路線。",
      actionLabel: "回到主線",
      badge: "主線",
    };
  }

  if (!hasCollectedNaotaro(progress) || !hasFirstDiary) {
    return {
      path: ROUTES.gameScene(FIRST_SCENE_ID),
      title: "第一天早晨",
      description: "從小白留下的交換日記開始，遇見第一隻小日獸。",
      actionLabel: "開始主線",
      badge: "主線",
    };
  }

  if (
    progress.streetForgotLunchFrogPhotoAttemptCount === 1 &&
    !progress.hasCompletedStreetForgotLunchFrogEvent &&
    !progress.hasSeenFirstFrogReturnHomeScene
  ) {
    return {
      path: ROUTES.gameScene(FIRST_FROG_RETURN_HOME_SCENE_ID),
      title: "第一次青蛙照片後",
      description: "回家確認小白的狀態，看看小日獸的光會發生什麼變化。",
      actionLabel: "回到家",
      badge: "新劇情",
    };
  }

  if (!progress.hasCompletedStreetForgotLunchFrogEvent) {
    const clueAttempt = Math.max(0, progress.streetForgotLunchFrogPhotoAttemptCount);
    return {
      path: `${ROUTES.gameArrangeRoute}?storyRoute=frog-clue`,
      title: clueAttempt > 0 ? "繼續追青蛙線索" : "尋找下一隻小日獸",
      description: "安排通勤路線，從日常事件裡找到和小白有關的線索。",
      actionLabel: "安排路線",
      badge: clueAttempt > 0 ? `線索 ${clueAttempt}/3` : "主線",
    };
  }

  if (!progress.hasTriggeredOfficeSunbeastKoalaEvent) {
    return {
      path: `${ROUTES.gameArrangeRoute}?eventId=office-sunbeast-koala`,
      title: "公司裡的新小日獸",
      description: "小白的光已經有反應了，下一個線索藏在工作日常裡。",
      actionLabel: "前往公司",
      badge: "主線",
    };
  }

  if (!progress.hasTriggeredOfficeSunbeastChickenEvent) {
    return {
      path: `${ROUTES.gameArrangeRoute}?eventId=office-sunbeast-chicken`,
      title: "旋律的來源",
      description: "整理目前收集到的聲音線索，追查下一隻小日獸。",
      actionLabel: "追查線索",
      badge: "主線",
    };
  }

  return {
    path: ROUTES.gameScene("scene-night-hub"),
    title: "夜晚整理線索",
    description: "目前主線已推進到試玩段落尾聲，可以回家查看日記與小日獸圖鑑。",
    actionLabel: "回夜晚 Hub",
    badge: "整理",
  };
}

export const GAME_DAILY_TASKS: GameDailyTask[] = [
  {
    id: "daily-route",
    eyebrow: "通勤",
    title: "今日路線",
    description: "安排今天要經過的地點，觸發日常事件與素材獎勵。",
    rewardLabel: "拼圖 / 金幣",
    path: ROUTES.gameArrangeRoute,
    actionLabel: "安排",
    accentColor: "#5F8D7A",
  },
  {
    id: "daily-work",
    eyebrow: "上班",
    title: "整理便利貼",
    description: "進入上班小遊戲，完成今天的工作整理。",
    rewardLabel: "金幣 / 疲勞",
    path: `${ROUTES.gameScene("scene-98-work")}?workMinigame=sticky-notes&workMinigameDirect=1`,
    actionLabel: "開始",
    accentColor: "#7B7FAE",
  },
  {
    id: "daily-sunbeast",
    eyebrow: "觀察",
    title: "街道小日獸線索",
    description: "去街道看看今天有沒有新的異常事件。",
    rewardLabel: "線索 / 日記光點",
    path: `${ROUTES.gameArrangeRoute}?eventId=frog-clue-street-flyer`,
    actionLabel: "前往",
    accentColor: "#B47458",
  },
];
