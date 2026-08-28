# 拍照教學 Modal：Unity 移植規格

本規格對應 Figma `走走小日 2026` 節點 `12494:1824`，Web 實作位於
`src/components/game/events/EventPhotoCaptureLayer.tsx`。

## 容器與視覺

- Modal 參考尺寸：`602 × 576 px`
- 外層圓角：`24 px`
- Modal 底色：`#FFFDF9`
- 預覽區底色：`#FCF7EC`
- 主色（標題、快門、CTA）：`#9C775C`
- 內文：`#725844`
- Figma 預覽區參考尺寸：`547 × 321 px`
- Prototype 動態區高度：固定 `154 px`
- 預覽區圓角：`24 px`
- CTA 參考尺寸：`547 × 82 px`，圓角 `50 px`

Web 版會依舞台尺寸縮放；Unity 建議以 `602 × 576` 為 CanvasScaler 的參考比例，
寬度不足時整組等比縮放並保留至少 `16 px` 的畫面邊距。

目前文字配置為：標題顯示「對準，按下快門！」，動態區下方不再重複顯示說明文字。

## 可直接移植的素材

- `public/images/figma/photo-tutorial/dots.png`
  - Figma 原始點點背景，`786 × 1704 px`、RGBA PNG。
  - Web 預覽區以寬度略大於容器、Y 軸約 `52%` 的位置裁切。
  - Unity 可設為 Sprite (2D and UI)，放在 `Image` 並使用 `Mask` / `RectMask2D` 裁切。
- `public/images/figma/photo-tutorial/camera-solid.svg`
  - Figma 原始白色相機圖示，viewBox `48 × 48`。
- `public/images/figma/photo-tutorial/camera-solid@2x.png`
  - Unity 不使用 Vector Graphics package 時可直接用的 `96 × 96 px` RGBA PNG。

## 刻意不移植成靜態素材的部分

- 黃金獵犬／其他小日獸：沿用各事件傳入的目標圖，不綁死在 modal 背景。
- 白色移動取景框、鎖定框、快門縮放與閃白：沿用既有動態與時間軸。
- 正式拍照階段的掃框、計分、快門與拍立得結果：不屬於這次 Figma 視覺調整。

## 動態時間

- 教學循環：`2400 ms`，`ease-in-out`，無限循環。
- 取景框：沿用既有 `tutorialFrameSweep`。
- 目標鎖定：沿用既有 `tutorialTargetLock`。
- 快門提示：沿用既有 `tutorialShutterTap`。
- 閃白：沿用既有 `tutorialShutterFlash`。
