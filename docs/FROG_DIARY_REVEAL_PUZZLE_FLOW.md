# 青蛙日記揭露拼圖流程規格

整理日期：2026-07-03

本文件是 `bai-entry-2`「搬家」第一段不完整日記的 canonical 規格。此流程要逐步接近直太郎 / 黃金獵犬日記揭露拼圖的體驗：玩家先看到不完整日記，完成拼圖後才取得下一個線索。

## 需求背景

這次需求一開始是「目前青蛙長這樣，要逐漸將青蛙改成像黃金獵犬那樣，圖片先用 `diary_02_01`」。這句的重點不是只換圖片，也不是把青蛙日記直接變成一張完整插圖，而是要參考黃金獵犬的日記揭露拼圖流程。

過程中曾出現幾個錯誤理解：

- 只把空白框換成 `diary_02_01`，沒有建立拼圖流程。
- 做出拼圖外觀，但拼圖無法移動。
- 完成拼圖後按「繼續」，畫面又回到舊版殘缺日記頁。

最終確認後的規格是：流程順序必須像黃金獵犬日記揭露拼圖，不是先拍到青蛙照片，也不是先給完整圖片。

## 正確流程總覽

1. 玩家從青蛙的未還原日記入口打開 `bai-entry-2`。
2. 玩家先看到不完整日記頁：
   - 標題是 `???`。
   - 插圖區是可移動的四片直向拼圖。
   - 文字區是被拼圖影響的文字格，不是舊版灰色破損長條頁。
3. 玩家拖曳或點選交換拼圖片，把插圖還原。
4. 拼圖完成後，頁面才出現「繼續」。
5. 玩家按「繼續」後，不切回舊版日記頁，直接在同一個拼圖日記頁上顯示線索 overlay。
6. 線索 overlay 顯示：
   - 標題：`獲得線索`
   - 線索：`便利商店`
7. 玩家按 overlay 的「繼續」後，結束這次日記揭露流程並回到上一層。

## 絕對不可改錯的順序

- 不是先拍到青蛙照片。
- 不是先顯示完整 `diary_02_01` 插圖。
- 不是先閱讀舊版殘缺日記再拿線索。
- 不是完成拼圖後再跳到舊版 `1/3` 缺字頁。
- 不是只做靜態切圖；拼圖必須能拖曳，也必須能點選交換。

這個流程的核心是：

```text
不完整日記 -> 完成拼圖 -> 獲得線索「便利商店」
```

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

完成拼圖後按「繼續」時，必須直接開啟線索 overlay。

線索 overlay：

- 使用既有 `FragmentedDiaryClueOverlay`。
- `headingText` 維持預設 `獲得線索`。
- `clueText` 是 `便利商店`。
- 不顯示舊版頁碼 `1/3`。
- 不重新 render 舊版 `buildBaiEntry2FragmentPages("initial")` 頁面。

這次修正的關鍵是：`continueAfterBaiEntry2Puzzle` 不能只把 `hasCompletedBaiEntry2Puzzle` 設為 `true`，因為那會讓 render 條件跳出拼圖頁並回到舊版 initial 殘缺日記頁。正確做法是，在引導流程中直接呼叫 `startFragmentedDiaryClueReward()`，讓線索 overlay 留在拼圖頁上揭露。

## Hibimon 入口規格

在 `/hibimon` 頁面，青蛙第一個未還原日記入口要直接預覽此拼圖揭露流程。

條件：

- `variant === "unrestored"`
- `target.unrestoredView === "entry-bai-2-fragment"`
- `target.unrestoredFrogFragmentPhotoAttemptCount === 0`

符合條件時：

- `DiaryOverlay` 使用 `mode="frog-diary-catalog-guide"`。
- `initialJournalView="entry-bai-2-fragment"`。
- `onFragmentedDiaryComplete={onClose}`，線索流程結束後回到 Hibimon 表格。

## 實作位置

- `src/components/game/DiaryOverlay.tsx`
  - `BAI_ENTRY_2_IMAGE_PATH`
  - `BAI_ENTRY_2_PUZZLE_TEXT_LINES`
  - `BAI_ENTRY_2_PUZZLE_INITIAL_ORDER`
  - `BAI_ENTRY_2_PUZZLE_TEXT_TOKENS`
  - `MetroCluePuzzleControl`
  - `continueAfterBaiEntry2Puzzle`
  - `entry-bai-2-fragment` render branch
- `src/app/hibimon/HibimonPlannerClient.tsx`
  - Hibimon 未還原入口切到 `frog-diary-catalog-guide`
- `src/lib/game/frogDiaryClueFlow.ts`
  - 搬家第一段完整文案
- `src/lib/game/preloadAssets.ts`
  - 預載 `diary_02_01.jpg`
- `src/lib/hibimonPlanning.ts`
  - Hibimon 青蛙第一段未還原入口的 attempt count 設為 `0`

## QA 檢查表

每次改此流程後，至少要驗證：

1. `/hibimon` 打開青蛙第一個未還原日記。
2. 畫面先出現 `???` 與四片直向拼圖。
3. 第三片拼圖是 `?`。
4. 拼圖可以拖曳，也可以點選交換。
5. 拼圖未完成時沒有底部「繼續」。
6. 拼圖完成後出現「繼續」。
7. 按「繼續」後直接顯示 `獲得線索 / 便利商店`。
8. 按「繼續」後沒有回到舊版 `1/3` 殘缺日記頁。
9. `npm run build` 通過。

## 給後續實作者的提醒

當需求說「參考黃金獵犬」時，優先複製的是流程與互動節奏，其次才是視覺細節。這裡的玩家認知順序比單張圖片更重要：玩家必須先意識到日記不完整，透過拼圖修復它，最後才得到下一個地點關鍵字。
