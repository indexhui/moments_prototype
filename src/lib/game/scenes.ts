export type GameScene = {
  id: string;
  chapterId: string;
  sceneLabel?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  characterName: string;
  characterAvatar?: string;
  dialogue: string;
  nextSceneId?: string;
  autoAdvanceMs?: number;
  showDialogueUI?: boolean;
};

export const GAME_SCENES: Record<string, GameScene> = {
  "scene-1": {
    id: "scene-1",
    chapterId: "ch01",
    sceneLabel: "早晨",
    backgroundImage: "/images/wake_up.jpg",
    backgroundColor: "#D6D4B9",
    characterName: "小麥",
    dialogue: "恩...這是鬧鐘響聲。快，三聲內一定要關掉...！",
    nextSceneId: "scene-2",
  },
  "scene-2": {
    id: "scene-2",
    chapterId: "ch01",
    sceneLabel: "早晨",
    backgroundImage: "/images/wake_up.jpg",
    backgroundColor: "#CFC7A9",
    characterName: "小麥",
    dialogue: "呼～還好，絕對不能超過三聲，這是我一直堅持的習慣。",
    nextSceneId: "scene-3",
  },
  "scene-3": {
    id: "scene-3",
    chapterId: "ch01",
    sceneLabel: "早晨",
    backgroundImage: "/images/wake_up.jpg",
    backgroundColor: "#CFC7A9",
    characterName: "小麥",
    dialogue: "喜歡今天的穿搭",
  },
  "scene-offwork": {
    id: "scene-offwork",
    chapterId: "ch02",
    sceneLabel: "下班",
    backgroundImage: "/images/backHome.jpg",
    backgroundColor: "#8E8E8E",
    characterName: "小麥",
    dialogue: "",
    showDialogueUI: false,
  },
};

export const SCENE_ORDER = [
  "scene-1",
  "scene-2",
  "scene-3",
  "scene-offwork",
] as const;

export function getScenesByChapter(chapterId: string): GameScene[] {
  return SCENE_ORDER.map((id) => GAME_SCENES[id]).filter((scene) => scene.chapterId === chapterId);
}

export function getChapterScenesUntilScene(scene: GameScene): GameScene[] {
  const chapterScenes = getScenesByChapter(scene.chapterId);
  const currentIndex = chapterScenes.findIndex((item) => item.id === scene.id);
  if (currentIndex < 0) return [];
  return chapterScenes.slice(0, currentIndex + 1);
}

export const FIRST_SCENE_ID = "scene-1";
export const OFFWORK_SCENE_ID = "scene-offwork";
