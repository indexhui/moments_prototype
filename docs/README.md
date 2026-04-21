# Docs – 專案總覽

本 repo 為 **moment_prototype** 模擬遊戲原型。若文件與程式碼有差異，請以程式碼為主，功能與流程說明以 **[GAME_ROUTE_PROTOTYPE_LOG.md](./GAME_ROUTE_PROTOTYPE_LOG.md)** 為主要依據。

## 目前可信文件

- `GAME_ROUTE_PROTOTYPE_LOG.md`：遊戲流程、拼圖規則、玩家進度、解鎖條件
- `GAME_MECHANICS_CORE_FLOW.md`：核心機制方法索引（下班獎勵/路徑生成/進度寫入）
- `SUNBEAST_REVEAL_AND_NIGHT_HUB_SPEC.md`：直太郎揭露、線索狀態、夜間 Hub 銜接與 follow-up 對話規格
- `FIGMA_UI_INTEGRATION_RULES.md`：Figma 設計稿如何正確落進遊戲 UI 容器與流程
- 本文件：專案結構、技術約定、閱讀入口
- `README.md`：快速啟動與高層摘要

## 專案定位

- 以手機直式遊玩體驗為核心
- 桌面版主要作為開發殼層，左右欄提供進程資訊與事件金手指
- 現階段重點在驗證路線拼圖、事件流程與循環式遊戲節奏
- 2026-04-02 起，安排路線頁以新版 `安排行程` UI 為準：
  - 上方棕色 header + 狀態 pill
  - 中段黃色背景上的直式路線棋盤
  - 下方白色 route tray + 底部 `出發！` footer
  - 舊版 `place / route / pet` 下方面板視覺視為棄用

## 技術堆疊

- Framework: Next.js App Router
- UI: Chakra UI v3
- Language: TypeScript / React 19
- State persistence: browser `localStorage`

## 實際目錄分工

- `src/app`
  - App Router 頁面、metadata、robots、sitemap
- `src/components/game`
  - 遊戲主畫面、安排路線、場景 UI、事件 modal、狀態列
- `src/components/ui`
  - Chakra provider
- `src/lib/game`
  - 場景資料、遊戲流程規則、玩家進度、事件常數、作弊事件 bus
- `public`
  - 場景背景、角色 sprite、拼圖與其他靜態素材

## 核心流程

1. 首頁 `/`
2. 安排路線 `/game/arrange-route`
   - 第 1 次教學盤面：`1x3`
   - 第 2 次正式循環盤面：`1x4`
3. 劇情場景 `/game` 與 `/game/[sceneId]`
4. 事件與過場
5. 下班獎勵
6. 回到下一輪安排路線

## 重要程式入口

- `src/app/page.tsx`：首頁與開始遊戲入口
- `src/components/game/ArrangeRouteView.tsx`：拼圖主邏輯、拖放、連通驗證
- `src/components/game/GameSceneView.tsx`：劇情畫面、歷史 modal、下班獎勵
- `src/components/game/GameFrame.tsx`：桌面外殼、側欄資訊、事件金手指
- `src/lib/game/playerProgress.ts`：玩家進度存取與獎勵拼圖資料
- `src/lib/game/gameFlow.ts`：流程階段與進程/解鎖規則

## 開發約定

- 需要瀏覽器 API 的檔案才使用 `"use client"`
- 玩家進度統一透過 `src/lib/game/playerProgress.ts` 的 helper 存取
- 跨元件觸發事件使用 `window` + `CustomEvent` bus
- 若要修改遊戲規則，先檢查 `playerProgress.ts`、`gameFlow.ts`、`scenes.ts` 是否需要同步調整
- 若需求來自 Figma，先判斷它是 page、手機舞台內容、overlay，還是小元件；不要先整張照搬

## 文件狀態

- `SEO_STATUS.md` 與 `SEO_ISSUES.md` 為舊網站階段留下的歷史文件
- 這兩份文件提到的 `sections`、`Hero.tsx`、`Podcast` 等結構，已不是目前專案主體
- 若未來要整理文件，建議優先維護 `README.md` 與 `GAME_ROUTE_PROTOTYPE_LOG.md`
