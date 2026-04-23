# Moment Prototype - Game Route Prototype Log

本文件記錄 **moment_prototype** 模擬遊戲原型的功能與實作邏輯，並隨開發持續更新。

## Scope

- 故事場景流程、回顧 modal
- 「安排路線」拼圖階段、路徑/地點拼圖、拖放與驗證
- 玩家進度與持久化、下班獎勵與擴展條件
- 左側進程與觸發條件追蹤、事件與演出

## Latest Update (2026-04-22)

### 核心流程文件已依目前版本重寫

- 新增整理目前版本的核心機制與流程文件：
  - `docs/GAME_MECHANICS_CORE_FLOW.md`
- 這份文件現在重點記錄：
  - 安排行程真正的入口優先順序
  - 街道 / 便利商店 / 早餐店的解鎖規則
  - 青蛙事件改成由 `街道 -> 便利商店` 路線順序觸發
  - 青蛙捕捉後的 `日記揭露 -> 小麥對話 -> 回到主循環`
  - 地點介紹頁、地點拼圖發放、地點 overlay 的目前責任

### 目前重構方向明確化

- 這次文件整理也確認了目前最需要拆的耦合：
  - `ArrangeRouteView.tsx` 同時承擔太多流程控制
  - 部分邏輯仍殘留「第幾次安排」思維
  - 地點解鎖條件目前分散在 progress helper、overlay UI 與事件收尾
  - reveal 流程仍靠多個 callback/ref 串接，後續適合再收斂成單一 flow controller

## Latest Update (2026-04-21)

### 直太郎揭露後的安排行程調整

- 安排行程中的「街道解鎖 + 任務提示」不再依賴舊的第 3 次安排路線判斷。
- 現在改成：
  - 玩家完成直太郎揭露（`hasSeenSunbeastFirstReveal === true`）後
  - 下一次進入安排行程時，優先播放「新地點：街道」引導
  - 並補齊 3 個街道拼圖後，再開始當次安排
- 這樣可以對齊目前夜間 Hub / 小日獸揭露後的最新節奏，不再和舊版 attempt 流程錯位。

### 安排行程 header 入口調整

- `小日獸圖鑑` 改為可直接從安排行程 header 打開。
- 原本底部的 `地圖` 入口改移到 header。
- `任務` 也改為在 header 直接露出，不再只在舊的第 3 次安排中出現。

### 本次街道引導文案方向

- 解鎖文案改為「直太郎把新的地點帶回來了！」
- 街道拼圖提示文案改為「收下 3 個街道拼圖，今天開始可以把街道排進行程了。」
- 小貝狗說明文案改為：
  - 「先把這三塊街道拼圖收下嗷！巷口、騎樓、轉角都能排進今天的行程。」
- 任務文案改為：
  - 「收到任務：在接下來的安排行程中，前往街道兩次」

## Latest Update (2026-04-02)

### 安排行程新版 UI 與正式循環規則收斂

- 安排路線頁以新版 `安排行程` UI 為準。
- 舊版下半部 `place / route / pet` 面板視覺在目前版本棄用。
- 中間主操作區統一稱為 `路線棋盤`。
- 第 1 次安排路線為教學盤面 `1x3`。
- 完成第一輪劇本後，正式循環的第 2 次安排路線為 `1x4`。
- 第 2 次 `1x4` 狀態下，路線棋盤寬度為 `112px`。
- 小日獸能力目前先整體關閉。

### 目前預期循環

- 第一輪劇本完成後，玩家進入：
  - `安排路線 -> 遇到事件 -> 上班`
- 下一輪再回到安排路線，形成日常循環。

### 新版畫面結構

- 上方：棕色 header，標題 `安排行程`，顯示存款 / 行動力 / 疲勞度與教學按鈕。
- 中段：黃色背景上的直式 `路線棋盤`。
- 下方：白色 route tray，只顯示捷運 badge 與路徑拼圖。
- 底部：棕色 footer，中央白色圓角 `出發！` 按鈕。

### 實作備註

- 教學故事路線 `?tutorial=story41` 視為第 1 次安排路線。
- 正式循環的第 N 次安排路線，需同時參考劇本首輪完成狀態，不再只靠 `offworkRewardClaimCount + 1` 推導。
- route 拼圖素材需優先走圖片映射，不應退回為純 pattern 方格顯示。
- 下班獎勵後的分流不是固定回同一段：
  - 第一次領完獎勵：回第一輪主線
  - 第一輪完成後再次領獎勵：改進 `scene-night-hub`

## Latest Update (2026-03-30)

### 本輪方向：從「功能堆疊」轉成「可理解的第一章體驗」

- 這次不是單純新增事件，而是根據朋友實測後的回饋，開始做第一輪大改版準備。
- 核心觀察：
  - 玩家不容易理解玩法與操作切換
  - 地點探索動機不夠自然
  - 劇情、教學、系統訊息同時出現時理解成本太高
- 因此本輪先優先重整「第一章開場的敘事節拍、角色辨識與演出可讀性」，讓玩家先比較順地進入故事與角色狀態。

### 第一章前段文本與分鏡重排（scene-1 ~ scene-31）

- `src/lib/game/scenes.ts`
  - 依作家第一章稿，重新整理 scene-1 到 scene-31 的台詞內容與順序。
  - 將原本偏功能導向的舊文本，改成更貼近作家分鏡的版本。
  - 重新校正多個 scene 的背景、角色、表情 frame 與情緒方向。
  - 補回作家稿中的節拍，例如：
    - 吵架結尾的 `碰！`
    - 小白的「小、小麥……？」
    - 角色介紹卡插入點

- 目前狀態
  - 已完成第一輪「逐格對齊」
  - 但仍屬於迭代中版本，後續仍會繼續微調表情、背景資產與物件畫面

### 角色介紹演出共用化（小麥 / 小白）

- `src/components/game/GameSceneView.tsx`
  - 原本小白初登場的角色介紹卡，重構成可重用的 `CHARACTER_INTRO_BY_SCENE_ID` 設定。
  - 現在小麥與小白都能透過同一套演出進入正式介紹，不再是角色專用寫死邏輯。
  - 新增 scene 可控欄位：
    - `autoOpenCharacterIntro`
    - `advanceAfterCharacterIntro`

- 目前套用
  - 小麥：`scene-3`
  - 小白：依新版分鏡調整到較後段的首次正式介紹節點

### 鬧鐘物件 sprite 與物件型對話頭像支援

- `public/images/clock/clock_7.png`
- `src/components/game/events/EventAvatarSprite.tsx`
- `src/components/game/StoryDialogPanel.tsx`
- `src/lib/game/scenes.ts`

- 新增 `clock` 作為對話區旁的物件 sprite，讓故事可以不只顯示角色頭像，也能顯示鬧鐘這類物件演出。
- 同時補上場景可直接指定的頭像 motion：
  - `dialogAvatarMotionId`
  - `dialogAvatarMotionLoop`

- 新增 `alarm-ring` 動畫
  - 用於鬧鐘搖鈴
  - 節奏改為「晃一下、停一下、再晃」，避免原本連續震動太刺眼

### 第一章早晨刷牙洗漱段落：劇情演出整合

- `scene-4` 目前已改成一段完整 sequence，而不只是靜態一句話：
  - 小麥房間背景
  - 睡衣小麥說 `該起床準備上班了……`
  - 文案完成後，小麥往右滑出並淡出
  - 接著顯示 `freshen` 漫畫格
  - 漫畫格淡出後才出現繼續按鈕

- 這段用途
  - 將「刷牙洗漱」這種過程性動作改為分鏡演出，而不是只靠文字敘述
  - 降低玩家對抽象旁白的負擔，讓故事節拍更明顯

### 漫畫格系統：從寫死流程改為可測試、可擴充

- `src/components/game/GameSceneView.tsx`
- `src/components/game/GameFrame.tsx`
- `public/images/comic/freshen.jpg`

- 原本漫畫格顯示較偏寫死在特定 scene 上。
- 本輪拆成兩層：

- 1. 正式劇情漫畫格
  - 由 story scene 主動觸發
  - 用於 scene-4、scene-5 等正式流程
  - 現在已從單一共用旗標拆成獨立播放邏輯，避免和 cheat 測試互相污染

- 2. 漫畫格金手指
  - 右側新增 `展開漫畫格`
  - 會列出目前已有的漫畫格資產，可直接點選測試
  - 目前收錄：
    - `freshen`
    - `puppet`

- 這樣後續只要再新增漫畫圖，就能用同一套測試方式驗證演出，不用再為每張漫畫格額外補一顆按鈕。

### 角色表情金手指：名稱改成依實際 sprite 對齊

- `src/lib/game/avatarPerformance.ts`
- `src/components/game/GameFrame.tsx`

- 原本右側角色表情金手指是 `表情 1 / 表情 2 / 表情 3` 這種純編號，不利於和作家稿、繪師稿對照。
- 現在改成依角色分開顯示中文名稱。
- 調整方式不是依檔名猜，而是直接對照目前 repo 中實際使用的 sprite sheet 逐格命名。

- 已處理
  - 小麥：依 `Mai_Spirt.png` 重新命名
  - 小白：依 `Bai_Spirt.png` 重新命名

- 額外整理
  - 名稱為 `保留` 的格子直接從金手指隱藏，不再顯示
  - 右側不必要的標題文字已陸續移除，保留 toggle 與實際按鈕，節省空間

### 目前這輪重構的實際意義

- 這次更新代表專案已從「先把功能接起來」進入「根據測試修正玩家理解」的階段。
- 第一章現在更像是：
  - 角色介紹
  - 生活節拍
  - 室友衝突
  - 物件與漫畫格演出
  - 為後續玩法與探索鋪情緒基礎

- 這也代表後續文件與實作要注意兩件事：
  - 不只記錄機制規則，也要記錄敘事節拍與演出設計
  - 新增演出時，盡量走共用設定與可測試工具，不要再回到單次寫死

### 下一輪建議持續記錄的方向

- 第一章 1~31 格對照表：
  - 哪一格已完全對齊
  - 哪一格仍缺背景或物件資產
- 玩家測試回饋：
  - 哪些台詞與畫面讓人更能理解角色動機
  - 哪些玩法說明仍然不夠清楚
- 探索動機重整：
  - 為什麼要去不同地點
  - 劇情與玩法如何互相支持
- 教學優化：
  - 前 10 分鐘讓玩家先懂什麼
  - 哪些系統要延後揭露

## Previous Update (2026-03-26)

### 拍照機制共用化（黃金獵犬 / 青蛙）

- 本次把「黃金獵犬」與「青蛙」拍照事件從兩套分離邏輯，重構為一套共用模組：
  - 新增：`src/components/game/events/EventPhotoCaptureLayer.tsx`
  - 套用到：
    - `src/components/game/events/MetroFirstSunbeastDogEventModal.tsx`
    - `src/components/game/events/StreetForgotLunchFrogEventModal.tsx`

- 共用模組內容（兩事件一致）
  - 取景框掃描動畫（由上往下 loop）
  - 快門按鍵與白閃演出
  - 拍立得預覽卡（顯示拍攝精準度）
  - 精準度門檻判斷（未達門檻可重拍）
  - 收下照片後的回呼（事件各自決定後續劇情）

- 可配置參數（由事件端傳入）
  - `targetRectNormalized`：各事件目標偵測區（例如狗 / 青蛙不同）
  - `passScore`：通關門檻（目前為 30）
  - `backgroundImageSrc` / `naturalImageSize` / `fitMode`
  - `onConfirm`：通過後的事件回呼

- 拍照資料一致性
  - 黃金獵犬事件仍在 `onConfirm` 時使用 `recordPhotoCapture(...)` 寫入拍照紀錄，保留既有資料流。
  - 青蛙事件目前走同 UI/評分流程，通過後銜接既有劇情 phase（`post-0`）。

### 本次實作經驗與準則（之後新增小日獸可直接套）

- 若新事件要接拍照：
  - 優先使用 `EventPhotoCaptureLayer`，不要再複製一份拍照 UI/裁切邏輯。
  - 只在事件端維護「目標區」與「通過後行為」，其餘演出由共用層負責。
- Reset 策略：
  - 事件切入拍照時，透過 `resetNonce` 重置共用層狀態，避免殘留上次拍攝結果。
- 視覺一致策略：
  - 背景切 `contain`、對話列與狀態列淡出、快門/拍立得按鈕文案統一，降低玩家理解成本。
- 維護性提升：
  - 之後若要微調拍照手感（例如掃描速度、按鈕位置、閃白強度），只需改共用檔案一次。

### 街道第 2 次觸發：忘記便當 -> 便利商店青蛙事件（第一版）

- 新增事件流程：`street-forgot-lunch-frog`
  - 觸發條件：玩家在安排路線中「第 2 次經過街道」且尚未觸發過該事件。
  - 事件流程：
    - 街道對話（忘記便當）
    - toast 顯示「解鎖新地點：便利商店」
    - 上班過場中段插入（辦公室）
    - 轉場到便利商店（`mart.jpg`）
    - 店員失言後切換 `mart_frog.jpg`
    - 進入拍照階段（快門按鈕 + 閃白）
    - 拍照後收尾對話

- 新增玩家進度欄位（`src/lib/game/playerProgress.ts`）
  - `streetPassCount`：累計經過街道次數
  - `hasTriggeredStreetForgotLunchEvent`：是否已觸發忘記便當事件

- 新增地點 `convenience-store`
  - 納入 `PlaceTileId`、地點名稱與預設 emoji
  - 事件中解鎖後會寫入 `ownedPlaceTileIds`
  - 左側「已解鎖地點」可顯示「便利商店」

- 實作檔案
  - 新增 modal：`src/components/game/events/StreetForgotLunchFrogEventModal.tsx`
  - 觸發與串接：`src/components/game/ArrangeRouteView.tsx`
  - 事件文案與事件註冊：`src/lib/game/events.ts`
  - 資產預載：`src/lib/game/preloadAssets.ts`（`mart.jpg`、`mart_frog.jpg`）

- 目前狀態
  - 事件主流程可跑通，並可完成到「拍照後收尾」。
  - 已確認可編譯（`npm run build` pass）。

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

---

## Update：2026-04-23 上班小遊戲第二版接入與目前待微調點

### A) 這次已接入內容

- 新增第二個上班 mini game：文件跑簽核蓋章
  - 檔案：`src/components/game/events/WorkStampMinigameModal.tsx`
- 上班轉場現在可依 mini game 種類帶不同 prelude
  - `sticky-prelude`
  - `stamp-prelude`
- 工作事件的 mini game 改成依出現次序輪替：
  - 第一次：便利貼整理
  - 第二次：文件蓋章
  - 後續照 `sticky -> stamp` 循環
- 右側金手指已加入第二個上班 mini game 快速入口
- `shiro_portrait_white` 已改成使用 `bai_fly`

### B) 文件蓋章 mini game 目前設計狀態

- 開場先顯示教學 modal，使用 `stamp_example` 圖說明操作
- 文件採單張節奏式進出，不再是傳輸帶整排平移
- 目前路徑邏輯是：
  - 文件自畫面外進場
  - 掠過中央附近一段平滑滑行
  - 再離開畫面
- 點擊時的章固定以畫面中央為落點
- 只要中央壓到紙，就會在該紙面留下章
- 分數另外依是否壓中簽核框判定，畫面上半部顯示 `PERFECT / GOOD / OK / MISS`
- 舊的中央瞬間蓋章殘影已移除，只保留紙上的章

### C) 目前確認可用，但之後要回來微調的點

- 文件進出方向與中段滑行手感還需要再確認一次體感
  - 需求以「右進左出」為準
- 中段平滑移動的速度和節奏感仍可再微調
- 最後幾張文件接近中央時，仍要再檢查是否殘留「像在追簽核區」的視覺錯覺
- 這版先以可驗證、可迭代為主，後續再做手感 polish

### D) 本次涉及檔案

- `src/components/game/events/WorkStampMinigameModal.tsx`
- `src/components/game/events/WorkTransitionModal.tsx`
- `src/components/game/GameSceneView.tsx`
- `src/lib/game/workTransition.ts`
- `src/components/game/GameFrame.tsx`
