/** The first moving-house diary uses two transparent layers, each split into a 2 × 2 grid. */
export const MOVING_DIARY_FIRST_LAYERS = [
  { imagePath: "/images/diary/frog-panorama/frog_diary_01_1.png", label: "背景層", tintColor: "#A7B883" },
  { imagePath: "/images/diary/frog-panorama/frog_diary_01_2.png", label: "人物層", tintColor: "#927A63" },
] as const;

export const MOVING_DIARY_FIRST_INITIAL_ORDERS = [[2, 3, 0, 1], [3, 0, 1, 2]] as const;
