export type AvatarMotionId =
  | "slide-in-left"
  | "sway-horizontal"
  | "pop-scale"
  | "nod-down"
  | "tremble"
  | "jump-once"
  | "fall-left-recover";

export type AvatarMotionOption = {
  id: AvatarMotionId;
  title: string;
};

export const AVATAR_MOTION_LIST: AvatarMotionOption[] = [
  { id: "slide-in-left", title: "從左邊滑入" },
  { id: "sway-horizontal", title: "左右晃動" },
  { id: "pop-scale", title: "放大縮回" },
  { id: "nod-down", title: "點頭一下" },
  { id: "tremble", title: "快速抖動" },
  { id: "jump-once", title: "跳一下" },
  { id: "fall-left-recover", title: "左倒消失再爬起" },
];

export type AvatarExpressionOption = {
  id: string;
  title: string;
  frameIndex: number;
};

export const AVATAR_EXPRESSION_LIST: AvatarExpressionOption[] = Array.from(
  { length: 12 },
  (_, index) => ({
    id: `expr-${index + 1}`,
    title: `表情 ${index + 1}`,
    frameIndex: index,
  }),
);
