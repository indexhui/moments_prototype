export type AvatarMotionId =
  | "slide-in-left"
  | "fade-out-left"
  | "fade-out-right"
  | "sway-horizontal"
  | "pop-scale"
  | "nod-down"
  | "tremble"
  | "alarm-ring"
  | "jump-once"
  | "fall-left-recover";

export type AvatarMotionOption = {
  id: AvatarMotionId;
  title: string;
};

export const AVATAR_MOTION_LIST: AvatarMotionOption[] = [
  { id: "slide-in-left", title: "從左邊滑入" },
  { id: "fade-out-left", title: "點擊後往左滑走淡出換頁" },
  { id: "fade-out-right", title: "點擊後往右滑走淡出換頁" },
  { id: "sway-horizontal", title: "左右晃動" },
  { id: "pop-scale", title: "放大縮回" },
  { id: "nod-down", title: "點頭一下" },
  { id: "tremble", title: "快速抖動" },
  { id: "alarm-ring", title: "鬧鐘搖鈴" },
  { id: "jump-once", title: "跳一下" },
  { id: "fall-left-recover", title: "左倒消失再爬起" },
];

export const AVATAR_MOTION_DURATION_MS: Partial<Record<AvatarMotionId, number>> = {
  "slide-in-left": 420,
  "fade-out-left": 420,
  "fade-out-right": 420,
  "sway-horizontal": 520,
  "pop-scale": 300,
  "nod-down": 360,
  tremble: 380,
  "alarm-ring": 980,
  "jump-once": 420,
  "fall-left-recover": 860,
};

export type AvatarExpressionOption = {
  id: string;
  title: string;
  frameIndex: number;
};

const MAI_EXPRESSION_TITLES = [
  "一般",
  "開心",
  "開心 2",
  "笑著說話",
  "擔心",
  "擔心 2",
  "驚呼",
  "生氣",
  "無表情",
  "無奈困擾",
  "釋懷",
  "問號",
  "驚訝",
  "睡眼惺忪",
  "保留 15",
  "保留 16",
  "保留 17",
  "保留 18",
] as const;

const BAI_EXPRESSION_TITLES = [
  "一般",
  "開心 2",
  "開心",
  "委屈心虛",
  "裝傻心虛",
  "熬夜",
  "難過",
] as const;

const BEIGO_EXPRESSION_TITLES = ["一般", "擔心"] as const;

const makeExpressionOptions = (titles: readonly string[], prefix: string): AvatarExpressionOption[] =>
  titles.map((title, index) => ({
    id: `${prefix}-expr-${index + 1}`,
    title,
    frameIndex: index,
  }));

export const AVATAR_EXPRESSION_OPTIONS_BY_TARGET = {
  mai: makeExpressionOptions(MAI_EXPRESSION_TITLES, "mai"),
  bai: makeExpressionOptions(BAI_EXPRESSION_TITLES, "bai"),
  beigo: makeExpressionOptions(BEIGO_EXPRESSION_TITLES, "beigo"),
} as const;

export const AVATAR_EXPRESSION_LIST: AvatarExpressionOption[] =
  AVATAR_EXPRESSION_OPTIONS_BY_TARGET.mai;
