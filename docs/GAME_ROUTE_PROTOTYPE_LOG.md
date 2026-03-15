# Moment Prototype - Game Route Prototype Log

本文件記錄 **moment_prototype** 模擬遊戲原型的功能與實作邏輯，並隨開發持續更新。

## Scope

- 故事場景流程、回顧 modal
- 「安排路線」拼圖階段、路徑/地點拼圖、拖放與驗證
- 玩家進度與持久化、下班獎勵與擴展條件
- 左側進程與觸發條件追蹤、事件與演出

## Current Feature Summary

### 1) Entry and Stage Flow

- Home page provides a central mobile canvas (393x852 style target).
- "開始遊戲" now goes to the arrange-route stage first.
- Arrange route stage "出發" then enters story scene flow.

Related routes:

- `/` (home)
- `/game/arrange-route` (route arrangement stage)
- `/game` (first story scene)
- `/game/[sceneId]` (dynamic scene)

---

### 2) Scene System (Data Driven)

Scenes are defined in `src/lib/game/scenes.ts`.

Each scene supports:

- `sceneLabel`
- `backgroundImage` / `backgroundColor`
- `characterName` / `characterAvatar`
- `dialogue`
- `nextSceneId`
- chapter association for history scope

Scene rendering uses:

- `GameSceneView` for center mobile screen
- `GameFrame` as desktop shell (left/right info sidebars + centered phone canvas)

---

### 3) In-Page History (回顧) Modal

- Triggered by the second icon in scene UI.
- Implemented as full-screen overlay modal in the same page (no route jump).
- Includes fade/slide motion.
- Only displays dialogues up to current scene progress in the same chapter.

---

### 4) Left Sidebar：進程與擴展（單一區塊 + Tab）

左側欄 (`GameFrame`) 已整併為：

- **進程與擴展**（單一區塊）
  - 標題、目前第 N 次安排路線
  - **Tab**：全部 / 已觸發 / 未觸發（依 `triggered` 篩選）
  - **固定高度 320px、可捲動**，方便之後條件增多時測試與研發
- 列表項目來源：`getUnifiedExpansionTracks(currentAttempt, hasPassedThroughStreet)`（見 `src/lib/game/gameFlow.ts`）
  - **進程 (milestone)**：第 1 次、第 2 次安排路線（獎勵內容 + 狀態：已完成/進行中/未開始）
  - **解鎖條件 (unlock)**：街道條件、起點變化（條件 + 變化 + 已觸發/未觸發）
- **玩家進度**：場景·角色·ID、儲蓄·行動力·疲勞、獎勵拼圖總數、劇情進度條
- 操作：金手指跳安排路線、重新開始、重置玩家資料

---

### 5) Arrange Route Stage (Core Puzzle)

Implemented in `src/components/game/ArrangeRouteView.tsx`.

Current interactions:

- route tiles can be dragged from bottom palette to board cells
- placed tiles can be dragged to another board cell (reposition)
- placed tiles can be dragged back to bottom palette (recall/remove)
- tile palette is horizontally scrollable (avoids tile deformation)

Board concepts:

- fixed start cell (home) and end cell (company)；起點依進度可改為右上格（需第 4 次且已觸發街道條件）
- route tile 為 3x3 pattern；支援 2x1（橫跨兩格）自組路徑，視為單一單位
- 地點拼圖來自下班獎勵，預設盤面僅含捷運；其餘由獎勵與自組取得
- connectors 由 pattern 邊緣計算，相鄰格需完全匹配才視為連通

---

## Progression, Rewards & Unlock Conditions

資料與邏輯集中於 `src/lib/game/gameFlow.ts`，左側欄依此顯示。

### 進程（固定）

- **第 1 次安排路線**：獎勵 捷運、街燈（無自組）
- **第 2 次安排路線**：獎勵 捷運、街道、自組

### 解鎖條件（觸發後才生效）

- **街道條件**
  - 條件：在安排路線中出發且經過街道
  - 變化：第 3 次起可切換為拼圖池獎勵（公園/街道/捷運/早餐店 隨機 + 自組）
- **起點變化**
  - 條件：安排路線達第 4 次，**且**曾在路線中經過街道
  - 變化：家的起點改為右上格

觸發狀態由 `hasPassedThroughStreet`（玩家進度）與 `currentAttempt`（第 N 次）計算；起點是否改為右上格在 `ArrangeRouteView` 中依相同條件判斷。

---

## Player Progress & Persistence

- **儲存**：`localStorage`，key `moment:player-progress`
- **型別**：`PlayerProgress`（`src/lib/game/playerProgress.ts`）
  - `status`：儲蓄、行動力、疲勞值
  - `ownedPlaceTileIds`：已擁有地點 ID 列表
  - `offworkRewardClaimCount`：已領取下班獎勵次數（第 N 次 = 此值 + 1）
  - `rewardPlaceTiles`：獎勵拼圖實例（含地點/路徑、自組 2x1 等）
  - **`hasPassedThroughStreet`**：是否曾在「安排路線」中出發且路線經過街道（用於解鎖拼圖池與起點變化）

**何時寫入「經過街道」**：玩家在安排路線按下「出發」且該次路線有放置街道格時，寫入 `hasPassedThroughStreet: true` 並呼叫 `onProgressSaved` 讓左側即時更新。

### 下班獎勵規則（依次數與條件）

- 第 1 次：捷運（免費）、街燈（右格 1 行動力）
- 第 2 次：捷運、街道、自組（自組花 2 儲蓄）
- 第 3 次起：若 **已觸發街道條件** → 拼圖池隨機 2 格 + 自組；否則維持 捷運、街道、自組
- 地點獎勵：左格免費、右格 1 行動力；自組第一塊免費，之後 2 儲蓄

---

## Events & Presentation

- **事件**：捷運座位、街道餅乾推銷、街道無選項（今日風很舒服 / 天氣好濕悶）等，定義於 `src/lib/game/events.ts`，右側有事件金手指可強制觸發
- **演出**：共用的 `EventDialogPanel`、頭像雪碧圖、表情符號金手指、背景震動/閃白/漸暗等金手指
- **打字機**：逐字、雙字、標點、停頓等模式可選
- 上班過場（office + mai_work）→ 約 2 秒後進入下班場景 → 下班獎勵 modal（選地點或自組路徑）→ 可循環回安排路線

---

## Validation and Connection Logic

### 1) Tile Model

Each tile is modeled with:

- `id`
- `label`
- `pattern: number[3][3]` (1 = road path, 0 = empty)

Edge connectors are computed from pattern:

- top/bottom can be multi-slot
- left/right currently use the center side slot rule to avoid corner ambiguity

### 2) Start/End Connector Rules

Start and end use explicit connector definitions (level-tunable):

- start currently uses full-width style exit (`[0,1,2]` semantics)
- end uses a constrained receive slot setup

### 3) Match Rule

Neighbor edges use strict equality matching of slot arrays.

Meaning:

- `0-3` must connect to `0-3`
- `0-1` cannot connect to `0-3`

### 4) Whole-Route Connectivity

Global connectivity is checked with BFS:

- search starts from start cell
- traversal only follows exact connector matches
- route is valid if end cell is reachable

---

## Placement Failure UX (Current Behavior)

The current UX intentionally supports player learning:

1. Early exploration can place imperfect tiles.
2. Once both key gate cells are filled (after-start and before-end), stricter checks are applied.
3. If invalid:
   - tile is shown as placed first
   - error toast/notice appears: `路線銜接不起來`
   - then rollback happens
4. Rollback targets are based on endpoint-neighbor mismatch checks (not blindly "latest tile" only).

The error notice:

- absolute overlay
- fade in/out
- non-layout-shifting

---

## Notable Stability Fixes

- Chakra provider uses `@chakra-ui/next-js` cache provider to reduce hydration mismatch risk.
- `GameFrame` uses mounted-guard strategy to avoid server/client first-render mismatch in this prototype stage.
- **上班 → 下班轉場防閃爍重點**：
  - 問題：若在 `router.push()` 前先把上班過場 modal 關掉，會短暫露出安排路線頁底層，玩家會感覺「閃一下」。
  - 解法：過場結束後直接 `router.push("/game/scene-offwork")`，**不要先關 modal**，讓過場持續覆蓋直到路由切換完成。
  - 實作位置：`src/components/game/ArrangeRouteView.tsx`（`WorkTransitionModal` 的 `onFinish`）。

---

## Recent Additions and Adjustments（紀錄用）

- **左側欄整併**：「進程與擴展」與「安排路線觸發條件」合併為單一區塊；Tab 篩選「全部 / 已觸發 / 未觸發」；區塊固定高度 320px 可捲動，方便之後擴充條件
- **第 3 次拼圖池**：僅在「街道條件」一處說明，進程列表只保留第 1、2 次，避免與街道條件重複描述
- **經過街道**：解鎖拼圖池與起點變化皆依「曾在安排路線中出發且經過街道」(`hasPassedThroughStreet`)，不再以「持有街道拼圖」為準
- **起點變化**：條件改為「安排路線達第 4 次**且**曾在路線中經過街道」；`ArrangeRouteView` 起點格與 `gameFlow` 觸發狀態皆依此判斷
- **Git**：移除舊專案歷史，以目前專案內容建立新 repo，單一初始 commit（mooment_prototype baseline）

---

## Suggested Next Refactor

`ArrangeRouteView.tsx` 體積較大，可考慮拆分以利維護：

- `route-tiles.ts`（拼圖定義）
- `route-logic.ts`（connector、BFS、驗證輔助）
- `ArrangeRouteBoard.tsx`（棋盤與放置邏輯）
- `ArrangeRoutePalette.tsx`（拼圖盤與滑動/分頁）
- `ArrangeRouteNotifications.tsx`（錯誤提示）

有助於後續新增拼圖類型與關卡變體。
