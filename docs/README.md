# Moments Web – Project Overview

本文件為目前專案的正式說明。先前舊專案的文件已不再適用，請以此為準。

## 技術堆疊
- Framework: Next.js (App Router)
- UI: Chakra UI v3
- 動畫: Framer Motion
- 手機輪播: Swiper（僅 Podcast 手機版）
- 語言: TypeScript / React 19

## 設計語言與配色
- 主要色（咖啡系）
  - brand/brown: `#987455`（主要 CTA、重點元素）
  - brown-deep: `#72543B`（深色正文/標題）
  - accent-title: `#A9886C`（章節大標題）
- 中性色
  - white: `#FFFFFF`
  - border: `#EDE7E1`
  - text-dark: `#2B2B2B`
  - text-gray: `#4A4A4A`
- 圓角：容器 `20px`、卡片多用 `16px/10px`

## 主要元件與區塊
- `src/components/ui/section.tsx`
  - 區塊標準容器（白底、圓角 20px、含 Title）。
  - 進場動畫：容器由下往上且淡入；Title 輕微上移＋淡入。
  - 未進入視窗前保持可見（不再把 opacity 設為 0）。

- Sections 概述
  - Hero：桌面有滑鼠移動視差；行動裝置停用滑鼠互動與位移。
  - Feature / Stories / Teams / Video / Introduce / Partner：統一使用 `Section`。
  - Podcast：手機使用 Swiper（只顯示分頁點）；桌面為 3 欄 Grid。

- Slot（`src/components/ui/slot.tsx`）
  - 三格 60x60，初始 `public/slot/question.png`。
  - 僅三種動物圖片（預設：`/slot/golden.png`、`/slot/penquien.png`、`/slot/capybara.png`）。
  - 三個轉輪速度與停止時間獨立；以位移對齊展示結果。
  - `onResult` 回傳最終三格；按鈕文案「拉霸雞」。

## 動畫與互動規範
- 全站原則：避免過度動畫。
  - 允許：容器進場（由下往上＋淡入）、Title 進場（輕微上移＋淡入）。
  - 禁止：在 Section 內部再加多餘進場動畫（除非明確需求）。
- Hero：僅桌面啟用滑鼠視差；手機停用事件與 transform。
- Podcast（手機）：僅顯示分頁點，點點顏色 `#987455`，位置略下移。

## 響應式慣例
- Chakra 斷點：base / sm / md / lg
- 範例：
  - Teams：base=2 欄、md=3 欄、lg=4 欄
  - Section Title 在 base/md 調整字級與 top 偏移
  - Podcast 外層 padding：base=24px、md=80px

## 可近用與效能
- 以背景圖呈現時，關鍵訊息請在鄰近提供文字。
- 可點擊元素需有清楚 hover/active 狀態（CTA 已有）。
- Hero 的 mousemove 僅在桌面且動畫完成後綁定。
- Swiper 僅手機斷點且 mounted 後載入，避免 SSR/hydration 問題。

## 開發約定
- 新增色彩請同步更新本文件。
- 新增區塊請使用 `Section` 以維持統一動畫與 Title。
- 手機端互動採「必要才啟用」策略，盡量少用全域監聽。

## 可考慮的後續項目
- Slot：開始按鈕視覺改為「手把」造型、加入音效與中獎特效。
- 影像資源最佳化與統一目錄：`public/slot/`、`public/hero/` 等。

—
本文件將持續更新，若有規格變動，請以此為準。 
