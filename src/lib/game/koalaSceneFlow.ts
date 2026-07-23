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
  | { id: "koala-reveal"; kind: "koala-reveal" }
  | { id: "koala-photo"; kind: "koala-photo" };

export const KOALA_STORY_STEPS: readonly KoalaStoryStep[] = [
  {
    id: "thanks-0",
    kind: "dialog",
    speaker: "同事",
    text: "小麥，不好意思，可以再幫我一下嗎？",
    avatarSpriteId: "coworker",
    avatarFrameIndex: 1,
  },
  {
    id: "thanks-1",
    kind: "dialog",
    speaker: "小麥",
    text: "……今天的『一下』是不是特別多啊。",
    avatarSpriteId: "mai",
    avatarFrameIndex: 3,
  },
  {
    id: "thanks-2",
    kind: "dialog",
    speaker: "小麥",
    text: "……咦？剛才，同事背後是不是露出了一對耳朵？",
    innerThought: true,
    avatarSpriteId: "mai",
    avatarFrameIndex: 32,
  },
  { id: "koala-reveal", kind: "koala-reveal" },
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
    if (step.kind === "koala-reveal") {
      return [
        {
          id: step.id,
          kindLabel: "互動",
          text: "移開文件並調整同事角度，讓無尾熊完整現形",
        },
      ];
    }
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
