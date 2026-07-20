import type { SceneJumpContextStep } from "@/lib/game/sceneJumpContextBus";

export type KoalaDialogSpeaker = "小麥" | "小貝狗" | "同事";

export type KoalaStoryStep =
  | {
      id: string;
      kind: "dialog";
      speaker: KoalaDialogSpeaker;
      text: string;
      innerThought?: boolean;
      avatarSpriteId?: "mai" | "beigo" | "coworker";
      avatarFrameIndex?: number;
      showKoala?: boolean;
    }
  | { id: "koala-photo"; kind: "koala-photo" };

export const KOALA_STORY_STEPS: readonly KoalaStoryStep[] = [
  {
    id: "thanks-0",
    kind: "dialog",
    speaker: "同事",
    text: "小麥，真的太謝謝你了。沒有你我完全不知道今天該怎麼辦。",
    avatarSpriteId: "coworker",
    avatarFrameIndex: 1,
  },
  {
    id: "thanks-1",
    kind: "dialog",
    speaker: "小麥",
    text: "沒事，文件有趕上就好。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 0,
  },
  {
    id: "thanks-2",
    kind: "dialog",
    speaker: "小麥",
    text: "最近好像一直在幫他救火。明明不是討厭幫忙，可是心裡總有點沉沉的。",
    innerThought: true,
    avatarSpriteId: "mai",
    avatarFrameIndex: 36,
  },
  {
    id: "appear-0",
    kind: "dialog",
    speaker: "小貝狗",
    text: "嗷，小麥，你看同事旁邊。",
    avatarSpriteId: "beigo",
    avatarFrameIndex: 1,
    showKoala: true,
  },
  {
    id: "appear-1",
    kind: "dialog",
    speaker: "小麥",
    text: "咦？那隻抱著文件不放的無尾熊……是小白日記裡畫的那種感覺。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 34,
    showKoala: true,
  },
  {
    id: "appear-2",
    kind: "dialog",
    speaker: "小麥",
    text: "先拍下來。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 0,
    showKoala: true,
  },
  { id: "koala-photo", kind: "koala-photo" },
  {
    id: "post-0",
    kind: "dialog",
    speaker: "小貝狗",
    text: "嗷，拍到了。這隻無尾熊黏在需要被照顧的人身邊，像是在等誰安排好一切。",
    avatarSpriteId: "beigo",
    avatarFrameIndex: 1,
    showKoala: true,
  },
  {
    id: "post-1",
    kind: "dialog",
    speaker: "小麥",
    text: "小白的日記裡，應該還藏著下一個線索。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 36,
    showKoala: true,
  },
] as const;

export const KOALA_DIARY_SCENE_JUMP_STEPS: readonly SceneJumpContextStep[] = [
  {
    id: "koala-diary-photo-slide",
    kindLabel: "日記",
    text: "無尾熊照片飛入交換日記",
  },
  {
    id: "koala-diary-collection",
    kindLabel: "小日獸",
    text: "無尾熊收錄進小日獸圖鑑",
  },
  {
    id: "koala-diary-restore",
    kindLabel: "日記",
    text: "還原《無尾熊的晚餐》",
  },
  {
    id: "koala-diary-entry",
    kindLabel: "日記",
    text: "閱讀《無尾熊的晚餐》完整內容",
  },
] as const;

export const KOALA_SCENE_JUMP_STEPS: readonly SceneJumpContextStep[] =
  KOALA_STORY_STEPS.flatMap((step) => {
    if (step.kind === "koala-photo") {
      return [
        {
          id: step.id,
          kindLabel: "拍照",
          text: "拍下無尾熊小日獸",
        },
        ...KOALA_DIARY_SCENE_JUMP_STEPS,
      ];
    }
    return [
      {
        id: step.id,
        kindLabel: "對話",
        speaker: step.speaker,
        text: step.text,
      },
    ];
  });

export function isKoalaDiarySceneJumpStepId(stepId: string | null | undefined) {
  return Boolean(stepId && KOALA_DIARY_SCENE_JUMP_STEPS.some((step) => step.id === stepId));
}

export function isKoalaPostPhotoSceneJumpStepId(stepId: string | null | undefined) {
  return Boolean(
    stepId &&
      (isKoalaDiarySceneJumpStepId(stepId) ||
        KOALA_STORY_STEPS.some(
          (step) => step.kind === "dialog" && step.id === stepId && step.id.startsWith("post-"),
        )),
  );
}

export function getInitialKoalaStoryStepIndex(stepId: string | null | undefined) {
  if (!stepId || isKoalaDiarySceneJumpStepId(stepId)) return 0;
  const index = KOALA_STORY_STEPS.findIndex((step) => step.id === stepId);
  return index >= 0 ? index : 0;
}
