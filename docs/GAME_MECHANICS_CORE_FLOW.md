# Game Mechanics Core Flow

這份文件專門整理「遊戲機制核心流程方法」，目標是讓下次調整規則時可以快速判讀：

- 入口在哪裡
- 會影響哪些資料
- 會連動哪些畫面

若文件與程式不同，請以程式碼為準。

---

## 1) 快速定位地圖（建議先看）

### A. 下班獎勵規則與路徑生成

- `src/components/game/GameSceneView.tsx`
  - `pickOffworkRewardOptions(...)`
  - `generateOffworkRewardPattern(...)` 呼叫點
  - 下班獎勵 modal 確認/領取流程
- `src/lib/game/playerProgress.ts`
  - `generateOffworkRewardPattern(...)`
  - `claimOffworkReward(...)`
  - `claimOffworkRewardBatch(...)`

### B. 安排路線盤面與能力實作

- `src/components/game/ArrangeRouteView.tsx`
  - 拖放與連通檢查
  - 起終點規則與第 N 次安排路線條件
  - 新版 `安排行程` UI（header / 路線棋盤 / route tray / 出發 footer）
  - 小日獸能力開關（目前預設關閉）

### C. 玩家持久化（localStorage）

- `src/lib/game/playerProgress.ts`
  - `loadPlayerProgress()`
  - `savePlayerProgress()`
  - `PlayerProgress` 型別與遷移/normalize

### D. 小日獸首次揭露 / 夜間 Hub follow-up

- `docs/SUNBEAST_REVEAL_AND_NIGHT_HUB_SPEC.md`
- `src/components/game/DiaryOverlay.tsx`
  - `sunbeast-reveal`
  - 直太郎揭露、日記/街道/線索解鎖
  - hint 狀態 UI 與可點互動
- `src/components/game/GameSceneView.tsx`
  - 夜間 Hub 從首次揭露回來後的 follow-up 對話
- `src/lib/game/playerProgress.ts`
  - 小日獸 hint 持久化欄位

---

## 2) 下班獎勵完整流程（由 UI 到資料）

1. 進入下班場景，`GameSceneView` 初始化獎勵 UI 狀態。
2. `pickOffworkRewardOptions(offworkRewardClaimCount, hasPassedThroughStreet)` 決定本輪可選地點。
3. `generateOffworkRewardPattern(isFirstClaim, rewardPlaceTiles)` 生成本輪地點拼圖 pattern。
4. 玩家在 modal 挑選獎勵後，呼叫 `claimOffworkReward(...)` 或 `claimOffworkRewardBatch(...)`。
5. `playerProgress` 更新：
   - `offworkRewardClaimCount + 1`
   - `rewardPlaceTiles` 新增實例
   - 必要時更新 `ownedPlaceTileIds`
6. 獎勵結束後依進度分流：
   - 若尚未完成第一輪主線，回第一輪 after-reward 主線段落
   - 若已完成第一輪主線，改進夜間 hub（`scene-night-hub`）
7. 下一輪回到安排路線，`ArrangeRouteView` 重新讀進度並顯示新拼圖。

---

## 3) `generateOffworkRewardPattern()` 核心機制

位置：`src/lib/game/playerProgress.ts`

### 輸入

- `isFirstClaim`: 是否第一次領下班獎勵
- `rewardTiles`: 玩家目前已持有的獎勵拼圖（含 route/place）

### 輸出

- 回傳 `TilePattern3x3`

### 主要邏輯

1. 若首輪，直接回傳 `FIRST_OFFWORK_REWARD_PATTERN`。
2. 蒐集玩家已擁有的 route pattern；若沒有就用 `BASE_ROUTE_PATTERNS`。
3. 建立「可銜接欄位集合」：
   - `connectableByTop`
   - `connectableByBottom`
4. 迭代 `topCol x bottomCol` 建候選 pattern。
5. 若 strict 候選為空，退回 fallback 候選。
6. 隨機挑一個候選。

### 目前調整中的難度限制（2026-03）

- 為平衡前期難度，隨機生成會先排除左右邊單口（例如 `[1,0,0]`、`[0,0,1]` 類型）。
- 這個限制目前放在 `generateOffworkRewardPattern()` 的候選過濾階段。

---

## 4) 常改規則與對應調整點

### 想改「第幾次給什麼獎勵」

- 改 `GameSceneView.tsx` 的 `pickOffworkRewardOptions(...)`
- 同時檢查是否要改文案（下班 modal 標題/提示）

### 想改「地點拼圖的形狀如何生成」

- 改 `playerProgress.ts` 的 `generateOffworkRewardPattern(...)`
- 如改到 pattern 格式，要同步確認：
  - `ArrangeRouteView.tsx` 的邊緣連接邏輯（`getEdgeSlots` / `isExactMatch`）
  - 對應圖片映射（若有）

### 想改「領獎是否扣資源或批次給獎」

- 改 `claimOffworkReward(...)` / `claimOffworkRewardBatch(...)`
- 確認 `playerStatus` 與 `rewardPlaceTiles` 都一致更新

### 想改「領完獎勵後接到哪段劇情」

- 改 `GameSceneView.tsx` 的 `afterOffworkRewardSceneId`
- 注意目前規則是：
  - 第一次領獎勵後走主線
  - 第一輪完成後的後續領獎改進夜間 hub

---

## 5) 連動風險清單（改之前先掃）

- `offworkRewardClaimCount` 同時被用來：
  - 控制第 N 次安排路線
  - 控制獎勵池
  - 部分劇情分支判斷
- `rewardPlaceTiles` 會直接影響：
  - 安排路線可拖曳拼圖數量
  - 地點/路徑 tab 顯示
  - 連接可行性與提示
- 若改 `PlayerProgress` 欄位，要同步更新：
  - `normalizeProgress(...)`
  - `INITIAL_PLAYER_PROGRESS`
  - 可能的 migration 邏輯

---

## 6) 建議調整流程（避免炸鍋）

1. 先改規則函式（例：`generateOffworkRewardPattern`）。
2. 用最小案例手測：
   - 新帳號（首輪）
   - 第 2 輪
   - 第 3 輪以上
3. 確認 UI 與資料一致（下班 modal、安排路線盤面、玩家進度）。
4. 跑 `npm run build`。
5. 更新 `docs/GAME_ROUTE_PROTOTYPE_LOG.md` 記錄這次規則變更。

---

## 7) 這份文件何時更新

當以下任一項變動時，請同步更新本文件：

- 新增/刪除核心規則函式
- 調整下班獎勵分配策略
- 調整 route/place pattern 生成策略
- `PlayerProgress` 欄位語義改變
