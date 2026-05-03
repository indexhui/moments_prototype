# Game Refactoring Backlog

這份文件記錄 2026-05 針對遊戲原型程式碼邏輯的重構規劃。目的不是立刻大規模拆檔，而是在後續開功能時，把對應的重構項目順手排進去，避免新的章節、事件、小遊戲繼續堆在既有大型元件裡。

若文件與程式碼不同，請以程式碼為準。

---

## 0) 重構原則

- 先修會直接造成錯誤的邏輯，再拆架構。
- 優先抽純邏輯，不先重寫 UI。
- 每次重構都要能獨立 build，最好能搭配一個功能需求一起落地。
- 不一次拆完 `GameSceneView`、`ArrangeRouteView`、`DiaryOverlay`，避免 timer、ref、localStorage 流程被大搬家弄斷。
- 新增章節、事件、小遊戲時，若發現需要再加新的 `scene.id === ...` 或重複進度寫入邏輯，優先考慮本文件對應項目。

---

## 1) 優先止血項目

### 1.1 工作疲勞雙寫

位置：

- `src/components/game/ArrangeRouteView.tsx`
- `src/components/game/ArrangeRouteStageClient.tsx`
- `src/lib/game/playerProgress.ts`

目前風險：

- `office-sunbeast-chicken` 完成時，先用 `onPlayerStatusChange` 增加 fatigue。
- `ArrangeRouteStageClient` 的 status handler 會把更新後 status 寫入 `localStorage`。
- 接著又呼叫 `recordWorkShiftResult(fatigueIncrease)`，重新讀取已增加過的 fatigue 再加一次。
- 結果是工作事件疲勞可能被持久化兩次，UI 與存檔也可能短暫不同步。

建議修法：

- 事件完成時只走單一 persistence path。
- 保守做法：事件 modal 完成時不要先 `onPlayerStatusChange` 加 fatigue，改由 `recordWorkShiftResult(fatigueIncrease)` 寫入，再透過 `onProgressSaved` 讓外層重新讀進度。
- 後續更完整的做法是抽出 `completeWorkShift(outcome)`，讓所有工作結算都走同一個 helper。

適合排入的時機：

- 修改工作事件。
- 新增工作小遊戲。
- 調整疲勞、加班、工作日結算規則。

---

### 1.2 安排路線棋盤模式條件被蓋掉

位置：

- `src/components/game/ArrangeRouteView.tsx`

目前風險：

- `isExpandedBoard` 需要 `arrangeRouteAttempt >= 5`。
- 但 `boardCols`、`boardRows`、`startPos`、`endPos` 的判斷中，`isSecondArrange || arrangeRouteAttempt >= 2` 會先命中。
- 因此 `EXPANDED_BOARD_*`、`EXPANDED_START_POS`、`EXPANDED_END_POS` 實際不可達。
- `offworkRewardClaimCount >= 3 && hasPassedThroughStreet` 的 `SHIFTED_START_POS` 也會被前面的 `arrangeRouteAttempt >= 2` 蓋掉。

建議修法：

- 先抽出 board mode，而不是在每個值上各寫一串巢狀 ternary。

```ts
type ArrangeBoardMode =
  | "intro"
  | "convenience"
  | "expanded"
  | "second"
  | "shifted"
  | "default";
```

- 用 `resolveArrangeBoardConfig(params)` 回傳：
  - `mode`
  - `cols`
  - `rows`
  - `startPos`
  - `endPos`
  - `blockedCells`
  - `fixedCells`
  - `startConnector`
  - `endConnector`

適合排入的時機：

- 新增棋盤尺寸。
- 調整起點/終點。
- 新增便利商店、公園、公車站等特殊棋盤。
- 新增和安排路線盤面相關的教學。

---

## 2) Route board rules 拆分

目標檔案：

- 從 `src/components/game/ArrangeRouteView.tsx` 抽出純規則。

目前 `ArrangeRouteView` 同時負責：

- 棋盤尺寸與起終點規則
- 拼圖庫整理
- 拖放判定
- pair route 拆解與放置
- endpoint mismatch 判斷
- BFS 連通性檢查
- toast 與 rollback
- 小日獸特殊能力
- 出發後事件流程

建議拆分：

### 2.1 `src/lib/game/arrangeRouteBoard.ts`

放：

- board mode 判斷
- `resolveArrangeBoardConfig`
- index/position 轉換
- blocked/fixed cell 規則
- start/end connector 規則

適合排入的時機：

- 棋盤規格調整。
- 新增特殊盤面。
- 要修安排路線條件順序時。

### 2.2 `src/lib/game/arrangeRouteTiles.ts`

放：

- reward tiles 轉 route tiles
- place tile stacks
- route palette slides
- pair route id parsing
- tile map / edge map 生成

適合排入的時機：

- 新增拼圖來源。
- 調整下班獎勵。
- 新增地點兌換或拼圖庫 UI。

### 2.3 `src/lib/game/arrangeRoutePlacement.ts`

放：

- `canPlaceRouteInMap`
- `isMapRouteConnected`
- `isCellReachableFromStart`
- `getReachableDistanceFromStart`
- `getEndpointMismatchCells`
- pair placement decision
- rollback decision

適合排入的時機：

- 修改拖放規則。
- 修改連通判定。
- 新增小日獸能力會改變拼圖放置結果時。

建議測試：

- board mode 對應正確尺寸與起終點。
- expanded / shifted 模式可達。
- start/end mismatch 可偵測。
- pair route 放置與 rollback 正確。
- route connected 判定涵蓋 start-to-end。

---

## 3) Work settlement flow 拆分

目標檔案：

- `src/lib/game/playerProgress.ts`
- `src/lib/game/workTransition.ts`
- `src/components/game/ArrangeRouteView.tsx`
- `src/components/game/GameSceneView.tsx`

目前風險：

- 工作轉場、小遊戲、跳過、事件型工作結算分散在不同 component。
- `recordWorkShiftResult` 被多處直接呼叫。
- 有些路徑加 fatigue，有些路徑加 task progress，有些路徑加 savings。
- 之後新增小遊戲時，容易忘記同步 `workShiftCount`、`hadOvertimeToday`、疲勞與獎勵。

建議 API：

```ts
type WorkShiftOutcome = {
  fatigueIncrease: number;
  taskId?: string;
  taskProgress?: number;
  rewardSavings?: number;
  overtimeThreshold?: number;
};

function completeWorkShift(outcome: WorkShiftOutcome): PlayerProgress;
```

它應該集中負責：

- 增加 fatigue
- 增加 `workShiftCount`
- 寫入 `workTaskProgressById`
- 增加工作獎勵 savings
- 更新 `hadOvertimeToday`
- 回傳 next progress 給 UI 同步

適合排入的時機：

- 新增工作小遊戲。
- 修改工作疲勞或加班規則。
- 修改工作獎勵。
- 新增工作後對話或 settlement overlay。

---

## 4) Story scene effects / timers 拆分

目標檔案：

- `src/components/game/GameSceneView.tsx`

目前風險：

- 很多場景演出靠多個 `useEffect` + `scene.id === ...`。
- 新增場景特效時，容易再加一段 timer effect。
- cleanup 分散，之後容易有過期 timer 在切場景後仍觸發。

建議做法：

- 先做 declarative config，不重寫整個劇情系統。

```ts
const SCENE_EFFECTS = {
  "scene-7": [
    { at: 320, type: "avatar-expression", frameIndex: 13 },
    { at: 560, type: "avatar-motion", motionId: "fall-left-recover" },
    { at: 560, type: "background-shake", shakeId: "shake-strong" },
  ],
};
```

- 再用 `useSceneEffects(scene.id)` 統一註冊 timer、dispatch event、cleanup。

可先搬的內容：

- 背景震動與閃白。
- avatar expression / motion trigger。
- 單純延遲後切 phase 的場景演出。

暫時不急著搬的內容：

- 牽涉大量 UI 狀態、日記開啟、路由跳轉的場景流程。
- night hub、QA、weekend morning hub 這類互動狀態機。

適合排入的時機：

- 新增多個劇情演出場景。
- 調整 scene comic / avatar motion。
- 發現 `GameSceneView` 又需要新增新的 scene-specific `useEffect`。

---

## 5) DiaryOverlay 視圖拆分

目標檔案：

- `src/components/game/DiaryOverlay.tsx`

目前風險：

- 檔案很大，但它主要是多畫面 overlay，不是目前最危險的核心規則。
- 不建議第一步就抽狀態機，先拆視圖比較安全。

建議拆分：

- `JournalTab`
- `JournalEntryCard`
- `SunbeastCollectionView`
- `SunbeastDetailView`
- `DiaryUnlockSequence`
- `SunbeastRevealSequence`

拆分策略：

- 第一輪只拆 presentational components。
- 狀態先留在 `DiaryOverlay` parent。
- 等 JSX 變薄後，再判斷哪些 state 可以下放或整理成 reducer。

適合排入的時機：

- 新增日記頁。
- 新增小日獸圖鑑內容。
- 調整首次揭露或 unlock 動畫。
- 設計稿要求重做日記 UI。

---

## 6) 建議排期順序

1. 修工作疲勞雙寫。
2. 修安排路線 board mode 條件。
3. 抽 `arrangeRouteBoard.ts`，補 board mode 測試。
4. 抽 `completeWorkShift(outcome)`。
5. 抽 `arrangeRoutePlacement.ts`，補連通與 mismatch 測試。
6. 抽 `useSceneEffects(scene.id)`，先搬簡單 timer。
7. 拆 `DiaryOverlay` presentational components。

---

## 7) 開功能時的對照表

| 功能類型 | 建議同步排入的重構 |
| --- | --- |
| 新增棋盤尺寸/起終點 | `resolveArrangeBoardConfig` |
| 新增特殊地點棋盤 | `arrangeRouteBoard.ts` |
| 修改拖放/連通規則 | `arrangeRoutePlacement.ts` |
| 新增拼圖來源/兌換 | `arrangeRouteTiles.ts` |
| 新增工作小遊戲 | `completeWorkShift(outcome)` |
| 修改疲勞/加班/工作獎勵 | work settlement flow |
| 新增場景演出 timer | `SCENE_EFFECTS` + `useSceneEffects` |
| 新增日記或圖鑑頁 | DiaryOverlay 視圖拆分 |
| 新增需要 localStorage 的長期狀態 | 先檢查 `PlayerProgress` normalize/migration |

---

## 8) 檢查清單

每次碰到核心流程時，至少確認：

- `npm run build` 通過。
- 新增或調整的進度欄位有 normalize fallback。
- 同一個玩家狀態沒有同時被 UI state 與 localStorage helper 各寫一次。
- 新增 scene id 判斷前，先看是否能放進 config。
- 新增 timer 時有 cleanup，切 scene 後不會繼續觸發。
- 新增棋盤規則時，確認不同 board mode 條件順序不會互相蓋掉。
