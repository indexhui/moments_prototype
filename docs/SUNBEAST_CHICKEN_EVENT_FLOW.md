# 小雞小日獸流程紀錄

本文件記錄 2026-05 完成的小雞小日獸主流程。若本文件與程式碼不同，請以程式碼為準；若之後要重構，先把這份當成行為基準。

主要程式位置：

- `src/components/game/ArrangeRouteView.tsx`
- `src/components/game/events/StreetExploreEventModal.tsx`
- `src/components/game/events/OfficeSunbeastChickenEventModal.tsx`
- `src/components/game/events/EventPhotoCaptureLayer.tsx`
- `src/components/game/DiaryOverlay.tsx`
- `src/lib/game/playerProgress.ts`

---

## 1. 玩家流程

### A. 小雞線索

小雞目前有兩段線索，顯示在小日獸圖鑑的未知詳情頁。

1. 第一段線索：
   - `前往 街道 打聽看看。`
   - 來自直太郎首次揭露後留下的小日獸線索。
2. 第二段線索：
   - 未解鎖時顯示 `線索二` + 鎖頭。
   - 玩家在街道選 `打探`，再選 `商店街`，拿到特殊地圖後解鎖。
   - 解鎖後顯示 `通過特殊地圖到達指定地點`。

舊版「同時經過轉角的公車和便利商店」已不再是小雞線索。

### B. 街道打探與特殊地圖

玩家進入街道後可選：

- `走走`：消除疲勞。
- `打探`：出現選項，目前包含文具街、商店街、河堤步道。

選 `商店街` 時會進入漫畫格與對話流程，最後獲得特殊地圖。

進度寫入：

- `hasUnlockedSpecialMap: true`
- `hasUnlockedSunbeastChickenHint: true`

### C. 特殊地圖安排路線

特殊地圖是安排行程中的另一張棋盤，不是新 route。

目前規則：

- 棋盤近似 `3x4`。
- 起點使用圖片 `start_home_010`。
- 神秘格在中間。
- 可用拼圖為 `normal_corner_leftTop`。
- 玩家可以重複使用同一個轉角拼圖。
- 拼圖可以旋轉。
- 剩餘旋轉次數目前為 `8` 次。
- 超過旋轉次數會顯示提示 modal，並將拼圖歸位。
- 出發前連通判定必須跟旋轉後 connector 對齊。
- 特殊地點過場中間 icon 顯示問號。

重要：特殊地圖不是一般地點路線；成功出發會直接進小雞劇情地點。

### D. 小雞劇情事件

特殊地圖出發後進 `OfficeSunbeastChickenEventModal`。

主要段落：

1. 到達特殊街景，遇到小雞。
2. 拍照前小麥與小貝狗對話。
3. 第一次拍照：
   - 使用 `place_chicken_demo`。
   - 背景比畫面寬，支援左右取景與縮放。
   - 拍照按鈕是一整條快門區。
4. 老闆來電：
   - 顯示黑色遮罩與整個來電 overlay。
   - 玩家按接聽後才進後續對話。
   - 小雞驚嘆號後跑走，背景切回街道。
5. 回公司上班。
6. 黃昏 / 夜晚辦公室完成文件。
7. 發現早上的小雞也在公司。
8. 第二次拍照：
   - 使用 `place_chicken_demo_company`。
   - 可左右取景與放大縮小。
   - 快門仍是一整條。
9. 拍照成功後進小雞收服與日記解鎖流程。

目前收服照片使用：

- `/animals/chicken.png`

---

## 2. 收服後流程

小雞收服後要沿用直太郎的節奏，而不是另做一套臨時 UI。

流程：

1. 進小雞圖鑑內頁。
2. 顯示小雞基本資訊：
   - 名稱：`小雞`
   - 描述：`專心工作的白色小雞`
3. 拍立得淡入：
   - 顯示 `animals/chicken`
   - 顯示 `★★★`
   - 按 `下一步`
4. 顯示日記解鎖卡：
   - 按 `解鎖一篇日記`
5. 切到交換日記列表。
6. 第三篇 `bai-entry-3` 解鎖。
7. 玩家可點第三篇進入日記內文。
8. 讀完按 `繼續`，播放小麥讀後對話。

第三篇日記可以在第二篇仍未解鎖時被解鎖；日記列表不要求前置篇章連續。

---

## 3. 第三篇交換日記內容

日記大意：

- 小白因為太認真工作，一整天忘了吃飯。
- 她在日記裡開心地寫，這樣可以省伙食費，也能順便減肥，好像不壞。

讀後對話大意：

- 小麥皺眉碎唸小白又廢寢忘食。
- 小麥擔心小白營養不良。
- 小白常因為太專心而忘記垃圾、碗盤和該做的事。
- 收尾是小麥希望小白快點醒來，別再讓她操心。

---

## 4. 進度欄位

目前小雞流程會用到：

- `hasUnlockedSunbeastChickenHint`
  - 是否已取得小雞線索。
- `hasUnlockedSpecialMap`
  - 是否已拿到商店街事件提供的特殊地圖。
- `hasTriggeredOfficeSunbeastChickenEvent`
  - 是否已正式觸發 / 完成辦公室小雞事件。
- `unlockedDiaryEntryIds`
  - 現在允許 `bai-entry-1`、`bai-entry-2`、`bai-entry-3`。

注意：

- `hasUnlockedSunbeastChickenHint` 只代表已能看到小雞線索，不代表已遇到小雞。
- `hasUnlockedSpecialMap` 會解鎖小雞第二段線索，也會讓安排路線頁出現特殊地圖 tab。
- `hasTriggeredOfficeSunbeastChickenEvent` 才代表小雞已進入 `discovered` 狀態。

---

## 5. 回歸檢查清單

調整小雞或特殊地圖時，至少檢查：

- `npm run build` 通過。
- 直太郎首次揭露後，青蛙與小雞仍會以 `hint` 狀態出現在小日獸圖鑑。
- 小雞線索頁第一段顯示街道打聽，第二段在特殊地圖未取得時鎖住。
- 商店街事件取得特殊地圖後，第二段線索顯示 `通過特殊地圖到達指定地點`。
- 特殊地圖的連通判斷會跟著旋轉後 connector 更新。
- 沒有連通時不能出發。
- 旋轉次數用完會提示並重置拼圖。
- 特殊地圖出發會進小雞劇情，而不是一般工作或一般地點事件。
- 第一次與第二次拍照快門都可以點，且快門區是一整條。
- 第三篇日記可以在第二篇仍鎖住時解鎖與點進去。
- 收服後 UI 不出現「日後更新素材」之類的 placeholder 文案。

---

## 6. 建議重構方向

這次功能已經可跑，但也暴露出幾個之後要整理的點。

### A. 小日獸資料表化

現在小日獸的名稱、圖像、線索、收服描述、日記 id 分散在 `DiaryOverlay` 與事件元件裡。建議整理成資料表：

```ts
type SunbeastDefinition = {
  id: string;
  name: string;
  discoveredFlag: keyof PlayerProgress;
  hintStages: SunbeastHintStage[];
  diaryEntryId?: DiaryEntryId;
  capturePhotoPath: string;
};
```

目標是讓之後新增小日獸時，不需要把 JSX if/else 再加深。

### B. 特殊地圖棋盤抽出

特殊地圖目前加在 `ArrangeRouteView` 內，和一般棋盤、便利商店棋盤交錯。建議抽：

- board config
- connector / rotation logic
- path validation
- rotation limit reset

並補最小單元測試，尤其是「旋轉後不連通不能出發」。

### C. 事件流程 controller

現在小雞流程由多個 callback/ref 串接：

- 街道探索結果
- 特殊地圖出發
- 公司過場
- 事件 modal
- 圖鑑 reveal
- 日記 reveal
- 回家 / 下班收尾

建議未來做 `eventFlowController` 或至少集中 flow state，避免新事件再散落在多個 callback 中。

### D. 拍照配置化

`EventPhotoCaptureLayer` 已經支援更多互動，但每個事件仍手動設定不少參數。可抽成拍照場景 config：

- 背景
- 目標圖
- 是否啟用 responsive background
- 初始 offset / zoom
- tutorial 是否顯示
- capture photo 寫入路徑

這樣下一隻小日獸能重用，不會再重做一套拍照邏輯。
