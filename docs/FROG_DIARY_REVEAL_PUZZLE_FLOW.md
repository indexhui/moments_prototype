# 青蛙日記揭露拼圖流程規格

整理日期：2026-07-03
補充日期：2026-07-08

本文件是 `bai-entry-2`「搬家」不完整日記的 canonical 規格。此流程要逐步接近直太郎 / 黃金獵犬日記揭露拼圖的體驗：玩家先看到不完整日記，完成拼圖或照片回收後，日記頁再依序補完整。

本文件刻意拆開兩個很容易混淆的節點：

- `initial`：黃金獵犬後、尚未拍到青蛙前。第一頁拼圖完成後只拿到 `便利商店` 線索。
- `first-photo`：第一次在便利商店拍到青蛙後。先補完第一頁後半段，再按「繼續」進第二頁圖層拼圖。

## 需求背景

這次需求一開始是「目前青蛙長這樣，要逐漸將青蛙改成像黃金獵犬那樣，圖片先用 `diary_02_01`」。這句的重點不是只換圖片，也不是把青蛙日記直接變成一張完整插圖，而是要參考黃金獵犬的日記揭露拼圖流程。

過程中曾出現幾個錯誤理解：

- 只把空白框換成 `diary_02_01`，沒有建立拼圖流程。
- 做出拼圖外觀，但拼圖無法移動。
- 完成拼圖後按「繼續」，畫面又回到舊版殘缺日記頁。

最終確認後的規格是：流程順序必須像黃金獵犬日記揭露拼圖，不是先拍到青蛙照片，也不是先給完整圖片。

## 初始線索流程

這段是黃金獵犬後、尚未拍到青蛙前的 `initial` 流程。

1. 玩家從青蛙的未還原日記入口打開 `bai-entry-2`。
2. 玩家先看到不完整日記頁：
   - 標題是 `???`。
   - 插圖區是可移動的四片直向拼圖。
   - 文字區是被拼圖影響的文字格，不是舊版灰色破損長條頁。
3. 玩家拖曳或點選交換拼圖片，把插圖還原。
4. 拼圖完成後，頁面才出現「繼續」。
5. 玩家按「繼續」後，不切回舊版日記頁，也不揭露後半段文字，直接在同一個拼圖日記頁上顯示線索 overlay。
6. 線索 overlay 顯示：
   - 標題：`獲得線索`
   - 線索：`便利商店`
7. 玩家按 overlay 的「繼續」後，結束這次日記揭露流程並回到上一層。

這段流程的核心是：

```text
不完整日記 -> 完成拼圖 -> 獲得線索「便利商店」
```

這裡不得出現 `FROG_MOVING_DIARY_FRAGMENT.revealText`，也就是不得提前顯示：

```text
但小白的表情一臉問號的看著我。
外面有一陣騷動打亂我的不安....
```

## 第一次拍到青蛙後的頁序

這段是便利商店事件第一次拍到青蛙後的 `first-photo` 流程。此時照片只讓青蛙在日記裡留下剪影，玩家還沒有正式收集青蛙。

前置順序：

1. `FrogDiaryClueEventModal` 播旁白：`青蛙發現被拍下後直接跳走了。`
2. `ArrangeRouteView` 記錄第一次青蛙照片，`streetForgotLunchFrogPhotoAttemptCount` 變成 `1`。
3. `DiaryOverlay` 用 `mode="frog-fragmented-diary"` 打開。
4. 先跑 `PhotoDiarySlidePage` / `firstPhotoSlideAcross`，讓青蛙照片飛進日記。
5. 回到剪影頁，問號變成青蛙剪影。
6. 小麥與小貝狗說明青蛙還沒被收集，只是在日記留下剪影，接著引導玩家查看日記。

日記頁序：

1. 先顯示第一頁的黃金獵犬式補完頁，也就是 `BaiEntry2MovingDiaryRevealPage`。
2. 第一頁標題先是 `???`。
3. 第一頁圖片仍是 `diary_02_01.jpg`，保留問號拼圖修復的視覺節奏。
4. 第一頁前半段 `openingText` 要一開始保留：

```text
今天和小麥請搬家公司搬家。
整理到一半，客廳出現幾瓶便利商店飲料，
我以為是小麥買的，就很自然地全部喝掉了。
```

5. 第一頁後半段 `revealText` 在揭露時間點才浮出：

```text
但小白的表情一臉問號的看著我。
外面有一陣騷動打亂我的不安....
```

6. 後半段浮出時使用青綠色揭露調性，標題解析完成後沉回一般日記色。
7. 標題從 `???` 解析成 `搬家` 後，才顯示「繼續」。
8. 玩家按「繼續」後，才進第二頁。
9. 第二頁才顯示 `BaiEntry2StreetPuzzlePage`，開始圖層拼圖。
10. 第二頁文字使用 `secondPuzzleText`：

```text
跑出去看，才發現外面亂成一團。
原來是有人在玩球，打到了外面發送傳單的
```

11. 第二頁圖層拼圖完成並推理出提示後，才顯示「繼續」。
12. 玩家按第二頁「繼續」後，才開 `FragmentedDiaryClueOverlay`。
13. overlay 顯示：
    - 標題：`獲得提示`
    - 提示：`街道`

這段流程的核心是：

```text
第一次青蛙照片 -> 第一頁後半段浮出 -> 繼續 -> 第二頁圖層拼圖 -> 獲得提示「街道」
```

## 第二次拍到青蛙後的頁序

這段是街道事件第二次拍到青蛙後的 `second-photo` 流程。

1. 仍先走照片飛入與剪影更新。
2. 日記顯示第一頁已恢復的完整內容。
3. 第二頁補完成可讀狀態。
4. 接著出現第三頁殘缺線索，指向下一個地點。
5. 不要回頭重播 `initial` 的便利商店拼圖。

## 絕對不可改錯的順序

- `initial` 不是先拍到青蛙照片。
- `initial` 不是先顯示完整 `diary_02_01` 插圖。
- `initial` 不是先閱讀舊版殘缺日記再拿線索。
- `initial` 完成拼圖後不得跳到舊版 `1/3` 缺字頁。
- `initial` 完成拼圖後不得顯示第一頁後半段文字，只能給 `便利商店` 線索。
- `first-photo` 不得直接跳第二頁圖層拼圖；必須先顯示第一頁後半段文字浮出。
- `first-photo` 的第二頁圖層拼圖必須等第一頁「繼續」後才出現。
- 不是只做靜態切圖；拼圖必須能拖曳，也必須能點選交換。

## 狀態對照

- `frogDiaryFragmentPhotoAttemptCount === 0`
  - reveal level：`initial`
  - 畫面：第一頁問號拼圖
  - 結果：`獲得線索 / 便利商店`
- `frogDiaryFragmentPhotoAttemptCount === 1`
  - reveal level：`first-photo`
  - 畫面一：第一頁問號拼圖式補完，後半段文字浮出
  - 畫面二：第二頁圖層拼圖
  - 結果：`獲得提示 / 街道`
- `frogDiaryFragmentPhotoAttemptCount === 2`
  - reveal level：`second-photo`
  - 畫面：第一頁完整、第二頁補完、第三頁殘缺線索
  - 結果：指向下一個地點
- `frogDiaryFragmentPhotoAttemptCount >= 3`
  - reveal level：完整日記
  - 畫面：`bai-entry-2` 完整閱讀與讀後對話

## 日記內容

圖片：

- `public/images/diary/diary_02_01.jpg`

文案：

```text
今天和小麥請搬家公司搬家。整理到一半，客廳出現幾瓶便利商店飲料，我以為是小麥買的，就很自然地全部喝掉了。
```

關鍵字：

```text
便利商店
```

## 拼圖規格

- 拼圖區使用 `diary_02_01.jpg`。
- 圖片比例：`640 / 460`。
- 拼圖切成 4 片直向切片。
- 正確順序：`[0, 1, 2, 3]`。
- 初始打亂順序：`[2, 0, 3, 1]`。
- 第三片拼圖必須是問號片。
  - 目前對應 `pieceId = 2`。
  - 在正確順序中，它會位於第三格。
- 玩家可以：
  - 拖曳拼圖片換位。
  - 點選第一片、再點第二片來交換。
- 拼圖未完成時不顯示底部「繼續」。
- 拼圖完成後才顯示底部「繼續」。

## 文字格規格

文字區要參考黃金獵犬揭露拼圖的文字格，而不是舊版破損長條文案。

- 文案以單字元文字格呈現。
- 文字格會依拼圖片位置散落或回到正確位置。
- 拼圖越接近正確順序，文字越接近可讀狀態。
- `便利商店` 是本段關鍵字，完成後要能被玩家讀到並對應到線索。
- 不使用舊版 `[[...]]` 破損遮罩作為此第一段揭露拼圖的主畫面。

## 線索揭露規格

`initial` 完成拼圖後按「繼續」時，必須直接開啟線索 overlay。

線索 overlay：

- 使用既有 `FragmentedDiaryClueOverlay`。
- `headingText` 維持預設 `獲得線索`。
- `clueText` 是 `便利商店`。
- 不顯示舊版頁碼 `1/3`。
- 不重新 render 舊版 `buildBaiEntry2FragmentPages("initial")` 頁面。

這次修正的關鍵是：`continueAfterBaiEntry2Puzzle` 不能只把 `hasCompletedBaiEntry2Puzzle` 設為 `true`，因為那會讓 render 條件跳出拼圖頁並回到舊版 initial 殘缺日記頁。正確做法是，在引導流程中直接呼叫 `startFragmentedDiaryClueReward()`，讓線索 overlay 留在拼圖頁上揭露。

## 實作守則

- `continueAfterBaiEntry2Puzzle` 只服務 `initial` 第一頁拼圖完成後的便利商店線索，不得用它觸發第一次青蛙照片後的文字補完。
- 第一次青蛙照片後的第一頁補完使用 `shouldPlayBaiEntry2FirstPhotoReveal`。
- 第一次青蛙照片後，玩家按第一頁「繼續」時只應設定本地狀態，例如 `hasAdvancedBaiEntry2FirstPhotoReveal`，再讓 render 進入 `BaiEntry2StreetPuzzlePage`。
- 第一頁補完與初始拼圖共用 `BaiEntry2MovingDiaryRevealPage` 的視覺語彙，但兩者的觸發時機與後續動作不同。
- 不要把 `openingText`、`revealText`、`firstText` 合併成單一字串來控制流程。前半段要保留，後半段要在揭露時間點才浮出，完整頁才使用 `firstText`。
- 新增日記狀態、continue handler、或 reveal flag 時，必須同步補進 `DiaryOverlay` 主 `content` `useMemo` 的 dependency list，避免點擊後畫面卡在舊 props。

## Hibimon 入口規格

在 `/hibimon` 頁面，青蛙未還原日記入口要依 `unrestoredFrogFragmentPhotoAttemptCount` 預覽對應階段。

條件：

- `variant === "unrestored"`
- `target.unrestoredView === "entry-bai-2-fragment"`

對應規則：

- `target.unrestoredFrogFragmentPhotoAttemptCount === 0`
  - 預覽 `initial`。
  - 第一頁拼圖完成後只顯示 `獲得線索 / 便利商店`。
  - `DiaryOverlay` 使用 `mode="frog-diary-catalog-guide"`。
- `target.unrestoredFrogFragmentPhotoAttemptCount === 1`
  - 預覽 `first-photo`。
  - 先顯示第一頁後半段文字浮出，按「繼續」後才顯示第二頁圖層拼圖。
- `target.unrestoredFrogFragmentPhotoAttemptCount === 2`
  - 預覽 `second-photo`。
  - 第一頁已完整，第二頁補完，並出現下一段殘缺線索。

所有入口都使用 `initialJournalView="entry-bai-2-fragment"`，並在流程結束後用 `onFragmentedDiaryComplete={onClose}` 回到 Hibimon 表格。

## 實作位置

- `src/components/game/DiaryOverlay.tsx`
  - `BAI_ENTRY_2_IMAGE_PATH`
  - `BAI_ENTRY_2_PUZZLE_TEXT_LINES`
  - `BAI_ENTRY_2_PUZZLE_INITIAL_ORDER`
  - `BAI_ENTRY_2_PUZZLE_TEXT_TOKENS`
  - `MetroCluePuzzleControl`
  - `continueAfterBaiEntry2Puzzle`
  - `shouldPlayBaiEntry2FirstPhotoReveal`
  - `hasAdvancedBaiEntry2FirstPhotoReveal`
  - `BaiEntry2MovingDiaryRevealPage`
  - `BaiEntry2StreetPuzzlePage`
  - `entry-bai-2-fragment` render branch
- `src/app/hibimon/HibimonPlannerClient.tsx`
  - Hibimon 未還原入口切到 `frog-diary-catalog-guide`
- `src/lib/game/frogDiaryClueFlow.ts`
  - 搬家第一段完整文案
- `src/lib/game/preloadAssets.ts`
  - 預載 `diary_02_01.jpg`
- `src/lib/hibimonPlanning.ts`
  - Hibimon 青蛙第一段未還原入口的 attempt count 設為 `0`
  - 青蛙便利商店事件後、前往街道路線前的未還原入口 attempt count 設為 `1`

## QA 檢查表

每次改此流程後，至少要驗證：

`initial`：

1. `/hibimon` 打開青蛙第一個未還原日記。
2. 畫面先出現 `???` 與四片直向拼圖。
3. 第三片拼圖是 `?`。
4. 拼圖可以拖曳，也可以點選交換。
5. 拼圖未完成時沒有底部「繼續」。
6. 拼圖完成後出現「繼續」。
7. 按「繼續」後直接顯示 `獲得線索 / 便利商店`。
8. 按「繼續」後沒有回到舊版 `1/3` 殘缺日記頁。
9. 按「繼續」後不得顯示 `外面有一陣騷動打亂我的不安....`。

`first-photo`：

1. 便利商店第一次拍到青蛙後，先看到照片飛入日記。
2. 問號剪影頁出現後，再進搬家日記。
3. 搬家日記先顯示第一頁補完頁，不得直接進第二頁圖層拼圖。
4. 第一頁前半段文字保留。
5. 第一頁後半段文字在揭露時間點才浮出。
6. 後半段浮出時呈青綠色，標題解析後沉回一般日記色。
7. 第一頁標題解析成 `搬家` 後才出現「繼續」。
8. 按第一頁「繼續」後才出現第二頁圖層拼圖。
9. 第二頁圖層拼圖完成後，按「繼續」才顯示 `獲得提示 / 街道`。

最後都要確認 `npm run build` 通過。

## 給後續實作者的提醒

當需求說「參考黃金獵犬」時，優先複製的是流程與互動節奏，其次才是視覺細節。這裡的玩家認知順序比單張圖片更重要：玩家必須先意識到日記不完整，透過拼圖修復它，最後才得到下一個地點關鍵字。
