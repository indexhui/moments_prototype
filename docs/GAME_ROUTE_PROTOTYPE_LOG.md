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

## Story Scene Entry FX Checklist（進場演出注意事項）

當我們在「進到某幕」時要同時做：**表情變化、頭像動作、背景更換、背景特效/震動**，請遵守以下規則，避免閃爍、漏觸發、重複觸發。

### 1) 不要用 `key` 讓整個場景容器重掛

- 問題：若把故事容器綁 `key={effectNonce}`（或任何每次特效會變的 key），背景特效觸發時會整棵重掛。
- 後果：頭像表情狀態會被重置（曾出現短暫跳回表情 1）。
- 建議：背景特效層獨立更新即可，主容器不要因特效 nonce 重掛。

### 2) 進場事件要有「監聽器掛載緩衝」

- 問題：scene 一切換就立刻 dispatch 動作/表情，可能早於 `EventAvatarSprite` 完成監聽註冊。
- 後果：偶發「明明有送事件但看不到動作」。
- 建議：在 scene-specific `useEffect` 內，先延遲約 `200~350ms` 再送第一個事件。

### 3) 單一演出只送一次，不要補打第二次

- 問題：為防漏接而重送同一動作，容易造成肉眼看起來像「重播兩次」。
- 建議：先把時序與掛載緩衝調穩，再維持「一次演出 = 一次動作事件」。

### 4) 建議的進場時序（故事幕）

- `t+0ms`：scene 載入
- `t+300ms`：送初始表情（如表情 11）
- `t+550ms`：送頭像動作（如 `fall-left-recover`）+ 背景震動
- `t+1350ms`：切到收尾表情（如表情 6）

以上是穩定參考值，可視單幕美術與節奏微調。

### 5) 背景切換閃爍的最小化做法

- 在故事對話 panel 預抓下一幕路由：`router.prefetch(nextSceneRoute)`。
- 避免在 route 切換前插入臨時全畫面 fallback（尤其是全屏背景圖 fallback）。
- 若仍有感，可再加短淡入（120~180ms）做視覺平滑。

### 6) Scene 資料建議欄位（可控演出）

為了讓每幕能獨立調整，建議 scene data 保持這些開關：

- `showDialogueUI`
- `showDialogAvatar`
- `showCharacterName`

例：鬧鐘聲幕（非角色說話）應設定「無角色、無名字」。

---

## Recent Additions and Adjustments（紀錄用）

- **左側欄整併**：「進程與擴展」與「安排路線觸發條件」合併為單一區塊；Tab 篩選「全部 / 已觸發 / 未觸發」；區塊固定高度 320px 可捲動，方便之後擴充條件
- **第 3 次拼圖池**：僅在「街道條件」一處說明，進程列表只保留第 1、2 次，避免與街道條件重複描述
- **經過街道**：解鎖拼圖池與起點變化皆依「曾在安排路線中出發且經過街道」(`hasPassedThroughStreet`)，不再以「持有街道拼圖」為準
- **起點變化**：條件改為「安排路線達第 4 次**且**曾在路線中經過街道」；`ArrangeRouteView` 起點格與 `gameFlow` 觸發狀態皆依此判斷
- **Git**：移除舊專案歷史，以目前專案內容建立新 repo，單一初始 commit（mooment_prototype baseline）

---

## Milestone：第一次收集小日獸流程（序章 1/2）

本段為目前已完成的「第一次收集小日獸（直太郎）」流程與技術落地，供下次接續「日記解鎖流程深化」與 UI polish。

### 1) 玩家流程（目前版本）

1. 劇情到捷運站事件，進入拍照模式（黃金獵犬）。
2. 玩家按快門後，計算拍攝精準度；低於門檻需重拍（教學關卡）。
3. 進入日記首次揭露流程頁（白底）：先顯示「拍到的照片」。
4. 顯示精準度 → 轉換成點數 → 點數抽獎提示 → 抽獎演出 → 貼紙結果。
5. 玩家按「收藏」後，才真正寫入收藏，並切到「小日獸」分頁。
6. 播放首次對話（小麥 → 小貝狗），再引導回「日記頁」。

### 2) 關鍵技術（資料與狀態）

- 進度儲存集中在 `src/lib/game/playerProgress.ts`
  - `lastDogPhotoCapture`: 儲存拍照快照（來源圖、預覽圖、精準度、取景框與實際捕捉區）
  - `lastPhotoScore`: 最近拍照精準度
  - `stickerCollection`: 已收藏貼紙
  - `hasSeenDiaryFirstReveal`: 是否看過首次揭露流程（避免重播）
  - `unlockedDiaryEntryIds`: 已解鎖日記頁（目前含 `bai-entry-1`）
- 首次揭露流程 UI 在 `src/components/game/DiaryOverlay.tsx`
  - 內部 stage 狀態機：`photo -> score -> points -> gacha -> result`
  - `collect` 才呼叫 `finalizeDiaryFirstRevealReward` 寫入貼紙收藏（符合「先看結果，再按收藏才入庫」）
- 劇情接點在 `src/components/game/GameSceneView.tsx`
  - scene-46 確保第一篇日記解鎖（`unlockDiaryEntry("bai-entry-1")`）
  - scene-46 打字完成後延遲開啟 `DiaryOverlay`

### 3) 精準度與抽獎規則（目前實作）

- 點數換算：`convertPhotoScoreToPoints(score)`，目前係數為 `round(score * 0.22)`，最低 1 點（例：68% -> 15 點）
- 抽獎權重：`getStickerRollWeightsByPoints(points)`
  - `>= 18`: `basic 50 / smile 35 / rare 15`
  - `>= 12`: `basic 50 / smile 45 / rare 5`
  - `< 12`: `basic 70 / smile 30 / rare 0`
- 抽獎執行：`rollStickerByPoints(points)`；收藏落地：`finalizeDiaryFirstRevealReward(stickerId)`

### 4) 對話與演出統一（本次已對齊）

- 日記首次對話改用事件同系元件：
  - `EventDialogPanel`
  - `EventContinueAction`
  - `EventAvatarSprite`
- 對話框橫向滿版（對齊故事/事件視覺語言），裝置圓角裁切保留。
- 角色演出指定：
  - 「黃金獵犬出現在日記上了...」：表情 2
  - 「沒錯，是我最好的夥伴...」：表情 2 + 愛心 cue（一次性觸發）

### 5) 影像還原（拍照 -> 日記顯示）

- 拍照事件中會記錄 camera frame 與 capture rect，並產生 preview（base64）。
- 日記揭露頁目前以拍照 preview 為主，已可讓玩家看到「當下拍到」的結果。
- 後續可再強化：把取景框與最終展示的映射再進一步精確化（目前已可用，仍有優化空間）。

### 6) 下次開發建議（已排程）

- 擴充「交換日記」：從單篇解鎖走向多篇解鎖節奏（條件、頁面、敘事回收）。
- 強化抽獎演出與回饋（動效節奏、文案、稀有度呈現）。
- 草稿視覺精緻化：
  - 日記頁與小日獸頁版面細節（間距、標籤、卡片層次）
  - 首次揭露流程中的過場節奏（淡入/停留/切換）

---

## Update：日記閱讀模式（漫畫）與讀後對話

本次把「第一篇日記」從靜態入口，延伸為可讀取的漫畫流程，並接上讀完後的角色對話。

### 1) 閱讀模式行為

- 入口：第一篇日記卡解鎖後可點擊進入，並可按「觀看故事回放」切入漫畫閱讀模式
- 素材：`public/images/diary/diary_demo_01.png`、`diary_demo_02.png`、`diary_demo_03.png`
- 閱讀互動：
  - 可上下滑動閱讀
  - 輔助 UI（頁碼、左右切頁、結束閱讀）預設隱藏
  - 點中間區域可叫回輔助 UI
  - 滑到接近最底時，輔助 UI 會自動浮出

### 2) 滿版沉浸式規格

- 進入漫畫閱讀時：
  - 隱藏上方導覽列（返回 / 交換日記）
  - 隱藏 tab 列（日記頁 / 小日獸）
  - 內容區改為滿版顯示（黑底，圖片 `object-fit: contain`）
- 重點：對話與操作 panel 一律採用滿版事件元件寬度，避免局部寬度跑版

### 3) 讀後對話觸發（同頁內）

- 條件：玩家在最後一頁按「結束閱讀」
- 觸發位置：仍停留在漫畫閱讀頁內，不先跳回外層
- 對話：跑完「小麥 / 小貝狗 / 旁白停拍」序列後，才退出閱讀模式
- 對話 UI：沿用事件元件
  - `EventDialogPanel`
  - `EventContinueAction`
  - `EventAvatarSprite`

### 4) 技術實作細節（DiaryOverlay）

- 新增狀態：
  - `isComicReadMode`
  - `isComicControlsVisible`
  - `comicPageIndex`
  - `isDiaryReadTalkVisible`
  - `diaryReadTalkIndex`
- 頁碼判斷：
  - 用實際滾動值計算目前頁數（`scrollTop / clientHeight`）
  - 結束閱讀時以當下 scroll 位置判斷是否最後一頁，避免 state 延遲漏觸發
- 解鎖演出：
  - 第一篇日記卡加入「鎖住 -> 解鎖中 -> 已解鎖」動態流程

---

## Suggested Next Refactor

`ArrangeRouteView.tsx` 體積較大，可考慮拆分以利維護：

- `route-tiles.ts`（拼圖定義）
- `route-logic.ts`（connector、BFS、驗證輔助）
- `ArrangeRouteBoard.tsx`（棋盤與放置邏輯）
- `ArrangeRoutePalette.tsx`（拼圖盤與滑動/分頁）
- `ArrangeRouteNotifications.tsx`（錯誤提示）

有助於後續新增拼圖類型與關卡變體。

---

## Update：2026-03-20 分流修正 + 風險巡檢

### A) 本次已完成進度

- 修正「下班獎勵收下後」分流：
  - 首次收獎勵：維持走 `scene-42`（主線首次回家對話）
  - 非首次收獎勵：直接回家 Hub（`scene-47`）
- 實作位置：
  - `src/components/game/GameSceneView.tsx:677`
  - `src/components/game/GameSceneView.tsx:1660`
  - `src/components/game/GameSceneView.tsx:1758`

### B) 針對你提的兩類問題，專案巡檢結果

#### 1) 「用計數值當劇情旗標」的類似狀況

已找到 3 類：

- **類型 1：可運作但語意不精準（需改）**
  - `offworkRewardClaimCount === 0` 被用來判斷「是否播首段回家劇情」
  - 位置：`GameSceneView.tsx:677`
  - 風險：這個欄位語意是「領過幾次獎勵」，不是「是否播過某段故事」

- **類型 2：計數推導進度（中風險）**
  - `arrangeRouteAttempt = offworkRewardClaimCount + 1`
  - 位置：
    - `GameSceneStageClient.tsx:26`
    - `ArrangeRouteStageClient.tsx:85`
  - 風險：未來若發生「有一天沒領獎勵但天數照樣前進」，第 N 次安排路線會漂移

- **類型 3：計數驅動規則（目前合理）**
  - 例如首次獎勵樣式、獎勵池條件切換
  - 位置：`GameSceneView.tsx:512`、`pickOffworkRewardOptions(...)`
  - 判斷：這類屬於「獎勵系統內規則」，可保留

#### 2) 「Hub 與單一 scene 強耦合」的類似狀況

已找到 5 個：

- `scene-47` 被當成夜間 Hub 的實作入口（互動、睡覺、聊天）
  - 位置：`GameSceneView.tsx:675`、`734-771`
- 日記導引完成後直接硬跳 `scene-47`
  - 位置：`GameSceneView.tsx:1218-1221`
- 睡覺後硬跳 `scene-morning-hub`
  - 位置：`GameSceneView.tsx:768`
- `handleStoryRequestNext` 以特定 scene id 寫死分流
  - 位置：`GameSceneView.tsx:650-657`
- 流程階段判定把 `/game/*` 幾乎都歸到 `depart-events`
  - 位置：`src/lib/game/gameFlow.ts:44-48`
  - 風險：未來加入更多 Hub / 閱讀態 / 調查態，左側流程顯示容易失真

### C) 建議的最小重構順序（不破壞現有內容）

1. 在 `PlayerProgress` 新增明確旗標：
   - `hasPlayedOffworkReturnIntro: boolean`
   - 用它取代 `offworkRewardClaimCount === 0` 的劇情判斷
2. 新增 Hub 導航 helper（例如 `getNextHomeHubSceneId(progress)`）
   - 集中 `scene-47` / `scene-morning-hub` 分流，避免散落在多個 callback
3. 將「流程階段」從 route/scene-id 猜測，改為可選的 scene metadata
   - 例如 `flowStageOverride`，讓 Hub / 日記 / 特殊演出不被誤判成一般劇情

### D) 目前結論

- 這次修正先把體感錯誤（重播 `scene-42`）止血，行為已符合需求。
- 但你提出的兩個疑慮都成立，確實有「語意耦合」和「節點耦合」的技術債。
- 建議下一次改動就先做上面 A/B 的最小重構，能避免後續章節擴寫時反覆踩雷。
