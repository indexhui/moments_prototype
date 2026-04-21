# Game Mechanics Core Flow

這份文件整理 2026-04 目前版本的核心機制與流程，目標是讓之後調整規則時可以先快速判斷：

- 入口在哪裡
- 現在真正依賴的狀態是什麼
- 哪些地方還留著舊耦合，之後要拆

若文件與程式不同，請以程式碼為準。

---

## 0) 現在版本的核心循環

這一輪之後，安排路線不再適合主要用「第幾次安排路線」來理解。現在真正驅動流程的是：

- 玩家是否已完成直太郎首次揭露
- 玩家是否已經解鎖某個地點
- 玩家是否達成某個行程任務
- 玩家這次實際排出的路線順序

### 目前日常循環

1. 玩家進入 `安排路線`
2. 從 `捷運 / 街道 / 便利商店` 等 tab 挑拼圖排進棋盤
3. 按 `出發！`
4. 系統依這次排出的實際路線決定先去哪里、觸發哪個事件
5. 若事件完成後有新地點解鎖，先跳 `地點介紹頁`
6. 若事件完成後有日記揭露，先跳 `日記解鎖 -> 讀日記 -> 小麥對話`
7. 所有中繼演出完成後，才回到 `上班轉場 / 下班 / 下一輪安排`

### 目前兩個最重要的規則轉向

- `街道 / 便利商店 / 早餐店` 的解鎖條件，已不再主要綁 `arrangeRouteAttempt`
- `青蛙事件` 不再是「街道走兩次自動出現」，而是必須真的排出 `街道 -> 便利商店`

---

## 1) 快速定位地圖

### A. 安排行程主流程

- `src/components/game/ArrangeRouteView.tsx`
  - 棋盤 render、拖放、連通檢查
  - 進入安排行程時的引導優先順序
  - 出發後事件解析
  - 地點解鎖介紹頁、日記 reveal 串接
  - 地點兌換

### B. 地點 overlay 與介紹頁

- `src/components/game/ArrangeRouteMapOverlay.tsx`
  - `地點` overlay
  - 顯示各地點狀態、解鎖條件、兌換按鈕與小日幣
- `src/components/game/PlaceUnlockIntroOverlay.tsx`
  - 任務型解鎖後的地點介紹頁
  - 顯示地點簡介、剪影提示、送 1 個地點拼圖

### C. 玩家持久化（localStorage）

- `src/lib/game/playerProgress.ts`
  - `PlayerProgress` 型別與 normalize
  - `buildStreetVisitProgress()`
  - `getPlaceUnlockSnapshot()`
  - `syncDerivedPlaceUnlocks()`
  - `claimPlaceUnlockIntroReward()`

### D. 日記與小日獸揭露

- `src/components/game/DiaryOverlay.tsx`
  - `diary-reveal`
  - 日記卡、讀日記、讀後對話
- `docs/SUNBEAST_REVEAL_AND_NIGHT_HUB_SPEC.md`
  - 直太郎首次揭露與夜間 Hub follow-up

### E. 事件清單與文案

- `src/lib/game/events.ts`
  - 現行事件 id 與 cheat list
  - 青蛙、街道等事件文案

---

## 2) 進入安排行程時的真正優先順序

位置：`src/components/game/ArrangeRouteView.tsx`

玩家每次進入安排行程時，目前不是單純進棋盤，而是要先判斷：

1. 是否剛完成直太郎首次揭露，且還沒播過街道引導
2. 是否需要補送 3 個街道拼圖
3. 是否要先顯示街道任務
4. 是否有待介紹的新地點
5. 是否只是一般安排行程

### 目前代表的實際流程

- 直太郎首次揭露後
  - 下一次進安排行程
  - 先播「街道解鎖」引導
  - 補齊 3 個街道拼圖
  - 顯示 header 任務
  - 再讓玩家正式安排路線

這也是目前最容易和舊版「第 3 次安排」邏輯打架的地方。之後若再調整，建議抽成明確的 `ArrangeRouteEntryFlow`。

---

## 3) 地點解鎖規則

位置：`src/lib/game/playerProgress.ts`

### A. 街道

- 觸發來源：
  - 完成直太郎首次揭露後，下一次進安排行程
- 解鎖效果：
  - 補 3 個街道拼圖
  - 開啟街道 tab
  - 顯示街道任務

### B. 便利商店

- 解鎖條件：
  - `streetVisitStreak >= 2`
- 計算方式：
  - 由 `buildStreetVisitProgress(progress)` 計算
  - 記錄的是「是否連續兩天在安排行程中經過街道」
- 解鎖後流程：
  - `syncDerivedPlaceUnlocks()` 將 `convenience-store` 寫入 `ownedPlaceTileIds`
  - 同時加入 `pendingPlaceUnlockIntroIds`
  - 事件收尾時先跳 `PlaceUnlockIntroOverlay`
  - 玩家確認後透過 `claimPlaceUnlockIntroReward()` 送 1 個便利商店拼圖

### C. 早餐店

- 解鎖條件：
  - `countDiscoveredSunbeasts(progress) >= 2`
- 目前也走任務型解鎖流程：
  - 先寫進 `ownedPlaceTileIds`
  - 再進 `pendingPlaceUnlockIntroIds`
  - 播介紹頁後送拼圖

### D. 其他地點

- `公園 / 公車站` 目前已先有 UI 位置與文案
- 但正式 unlock 規則仍未完整接進事件主流程

---

## 4) 玩家進度中，現在真正有語義的欄位

位置：`src/lib/game/playerProgress.ts`

### 地點與任務

- `ownedPlaceTileIds`
  - 玩家已正式解鎖哪些地點
- `pendingPlaceUnlockIntroIds`
  - 哪些地點已達成條件，但還沒播完介紹頁
- `claimedPlaceUnlockIntroRewardIds`
  - 哪些地點介紹頁的首個拼圖已經領過

### 街道任務

- `hasPassedThroughStreet`
  - 玩家是否曾經經過街道
- `streetPassCount`
  - 玩家累積經過街道幾次
- `streetVisitStreak`
  - 玩家是否連續幾天經過街道
- `lastStreetVisitDay`
  - 上一次經過街道是哪一天

### 青蛙事件

- `hasTriggeredStreetForgotLunchEvent`
  - 是否已進入忘記帶便當事件流程
- `hasCompletedStreetForgotLunchFrogEvent`
  - 是否已完成青蛙捕捉與後續收尾
- `hasUnlockedSunbeastFrogHint`
  - 是否在小日獸圖鑑中顯示青蛙線索

### 日記

- `unlockedDiaryEntryIds`
  - 目前至少包含：
    - `bai-entry-1`
    - `bai-entry-2`

---

## 5) 路線出發後，事件是怎麼決定的

位置：`src/components/game/ArrangeRouteView.tsx`

目前不是單純看玩家有沒有某地點，而是看「這次實際排出來的路線順序」。

### 目前重要判斷

- 是否有經過 `街道`
- 是否有經過 `便利商店`
- `街道` 是否比 `便利商店` 更早從起點連通

這是用 `getReachableDistanceFromStart(...)` 算出從起點到每個地點格的距離，再比較：

- `earliestStreetReachDistance`
- `convenienceStoreReachDistance`

### 青蛙事件條件

- 必須同時滿足：
  - 這次有經過街道
  - 這次有經過便利商店
  - 街道比便利商店更早到達
  - 玩家還沒完成過青蛙事件

成立後才會觸發：

- `street-forgot-lunch-frog`

這是目前最重要的新機制，因為它把事件觸發從「累積次數」改成了「拼圖順序」。

---

## 6) 青蛙事件完成後的正確收尾順序

位置：

- `src/components/game/ArrangeRouteView.tsx`
- `src/components/game/DiaryOverlay.tsx`

### 目前正式順序

1. 玩家拍到青蛙
2. 顯示照片結果
3. 寫入青蛙完成狀態與第二篇日記解鎖
4. 打開 `DiaryOverlay`，模式是 `diary-reveal`
5. 玩家看完第二篇日記
6. 小麥讀後對話 UI 依序播放
7. 對話走完後才關閉 diary overlay
8. 再回到 `finishEventFlow()`
9. 若同時有地點任務解鎖，接著播地點介紹頁
10. 最後才回上班轉場或下一輪

### 這段不能退回舊寫法

之前容易出錯的做法有兩種：

- 事件完成後立刻 `finishEventFlow()`
- 只打開圖鑑，不走 `日記揭露 -> 小麥對話`

現在請以「青蛙捕捉後，流程要和直太郎揭露一樣完整」為基準。

---

## 7) 地點 overlay 與兌換規則

位置：`src/components/game/ArrangeRouteMapOverlay.tsx`

### 目前 UI 意義

- `捷運`
  - 可花 `10` 小日幣兌換 1 個捷運拼圖
- `街道`
  - 收集到第一隻小日獸後，可花 `10` 小日幣兌換 1 個街道拼圖
- `商店`
  - 顯示「連續兩天經過街道來解鎖」進度
- `早餐店`
  - 顯示「解鎖第二隻小日獸來解鎖」進度
- `公園 / 公車站 / 尚未解鎖`
  - 先作為之後擴充的地點位

### 目前兌換實作

- 入口在 `ArrangeRouteView.tsx` 的 `redeemPlaceTile(...)`
- 會：
  - 扣 `PLACE_REDEEM_COST`
  - 直接新增 1 個 `RewardPlaceTile`
  - 若該地點還不在 `ownedPlaceTileIds`，會一併補登記

---

## 8) 下班獎勵流程

### 基本路徑

1. 進入下班場景
2. `GameSceneView` 決定本輪可選獎勵
3. `generateOffworkRewardPattern(...)` 生成本輪 pattern
4. 玩家領取後，`claimOffworkReward(...)` 或 `claimOffworkRewardBatch(...)` 寫入進度
5. 下一輪回安排行程，讀進新的拼圖池

### 目前要注意的前期 pattern

- `FIRST_OFFWORK_REWARD_PATTERN`
  - 已調成 `111 / 010 / 010`
- 第一塊街道獎勵 pattern
  - 也已調成 `111 / 010 / 010`
- 便利商店介紹頁送的首塊拼圖
  - 目前是 `010 / 010 / 010`

---

## 9) 之後重構時，最需要注意的耦合點

### A. `ArrangeRouteView.tsx` 現在同時管太多事

同一個檔案目前同時處理：

- 棋盤 render
- 拖放
- 教學
- 任務提示
- 地點解鎖
- 事件優先順序
- 日記與圖鑑跳轉
- 地點兌換

建議未來至少拆成：

- `entry-flow`
- `departure-resolution`
- `reward/unlock-flow`

### B. 部分邏輯仍殘留「第幾次安排」思維

雖然主要 unlock 已改成任務/狀態驅動，但仍有部分 UI 或盤面條件依賴：

- `arrangeRouteAttempt`
- `offworkRewardClaimCount`

如果未來再增地點，建議把：

- 教學次序
- 盤面尺寸
- 劇情里程碑

分成獨立 state，不要再混在同一條 attempt 推導裡。

### C. 地點解鎖條件現在分散在多處

目前至少散在：

- `getPlaceUnlockSnapshot()`
- `syncDerivedPlaceUnlocks()`
- `ArrangeRouteMapOverlay.tsx` 顯示文案
- `ArrangeRouteView.tsx` 的事件收尾

之後若規則繼續增加，建議集中成單一 `placeUnlockRules.ts`。

### D. reveal callback 很容易漏接

目前只要下面任一 callback 沒接好，就會出現流程卡住：

- `onDiaryRevealEntryComplete`
- `onGuidedFlowComplete`
- `placeUnlockIntroNextActionRef`
- `sunbeastDiaryNextActionRef`

之後若再加 reveal 流程，建議統一成單一 flow controller，不要再靠多個 callback/ref 串接。

---

## 10) 建議調整流程

1. 先確認這次要改的是：
   - 地點解鎖規則
   - 路線事件觸發規則
   - reveal / unlock 收尾節奏
2. 先改純規則層：
   - `playerProgress.ts`
   - 或 `ArrangeRouteView.tsx` 的事件解析區
3. 再改 overlay 文案與 UI
4. 用最小案例手測：
   - 新帳號
   - 已看完直太郎
   - 已解鎖便利商店但未完成青蛙
   - 已完成青蛙
5. 跑 `npm run build`
6. 更新：
   - `docs/GAME_MECHANICS_CORE_FLOW.md`
   - `docs/GAME_ROUTE_PROTOTYPE_LOG.md`

---

## 11) 這份文件何時更新

當以下任一項變動時，請同步更新本文件：

- 新增或刪除地點解鎖規則
- 調整 `streetVisitStreak` / 小日獸解鎖條件
- 調整青蛙或其他事件的路線順序判定
- 調整 `地點介紹頁` 或 `日記 reveal` 的收尾順序
- `PlayerProgress` 欄位語義改變
