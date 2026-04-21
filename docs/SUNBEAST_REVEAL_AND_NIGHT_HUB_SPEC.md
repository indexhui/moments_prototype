# Sunbeast Reveal And Night Hub Spec

這份文件整理 2026-04 夜間 Hub、直太郎揭露、小日獸線索與回 Hub 對話的最新規格。

若文件與程式碼不同，請以程式碼為準，但新的對話若要延續這段設計，請優先先讀這份。

---

## 1. 這份規格涵蓋什麼

- 夜間 Hub 進入 `小日獸揭露` 的入口規則
- 直太郎首次揭露的 UI / 演出順序
- 小日獸圖鑑清單與內頁的最新狀態語意
- 青蛙 / 小雞線索如何持久化
- 揭露完成後如何回到夜間 Hub 並播放小麥 / 小貝狗 follow-up 對話

主要程式位置：

- `src/components/game/DiaryOverlay.tsx`
- `src/components/game/GameSceneView.tsx`
- `src/lib/game/playerProgress.ts`

---

## 2. 夜間 Hub 入口規則

位置：`src/components/game/GameSceneView.tsx`

### 目前規則

1. 玩家在 `scene-night-hub` 打開日記時：
   - 若 `hasSeenSunbeastFirstReveal === false`
   - 則 `DiaryOverlay` 用 `mode="sunbeast-reveal"` 打開
2. 若首次小日獸揭露已看過：
   - 開日記走 `mode="default"`
   - 開小日獸圖鑑走 `mode="sunbeast"`

### 意義

- `sunbeast-reveal` 是一次性的引導演出模式
- 這個模式不是一般圖鑑瀏覽，它會帶首次揭露、直太郎內頁解鎖、follow-up 對話

---

## 3. 小日獸首次揭露流程

位置：`src/components/game/DiaryOverlay.tsx`

### 目前完整順序

1. 玩家經過前段劇情後進入 `sunbeast-reveal`
2. 小日獸圖鑑頁先出現 12 格未知
3. 第一格從 `???` 變成直太郎
4. 小麥對話：
   - 「黃金獵犬出現在日記上了！對，是小白常常提到的直太郎。」
5. 第二句引導：
   - 「點點看直太郎吧。」
6. 玩家點進直太郎內頁
7. 直太郎頁先顯示拍立得貼上 / 淡入演出
8. 之後進入解鎖演出：
   - 日記
   - 地點（街道）
   - 小日獸線索（青蛙 / 小雞）
9. 解鎖演出結尾，咖啡色遮罩往上滑出並淡出
10. 回到可操作狀態

### 目前揭露頁的互動原則

- 第一句仍由玩家點擊繼續
- 後面的解鎖項目採自動推進，不要讓玩家一直按 `點擊繼續`
- 解鎖完成後保留可點入口：
  - `閱讀` 可直接跳去交換日記 `entry-bai-1`
  - 線索卡中的青蛙 / 小雞可點進各自提示內頁

---

## 4. 直太郎內頁規格

位置：`src/components/game/DiaryOverlay.tsx`

### 結構

- 上段：書頁背景內的角色資訊
- 中段：拍立得照片區
- 下段：解鎖項目摘要 / overlay 演出

### 視覺與容器原則

- 書頁背景是裝飾，不是拿來包所有內容的真正 layout 容器
- 中段 / 下段必須可跨出書頁左側 padding，不可被書頁內縮限制住
- 中段與下段共用底層格紋背景
- 下段內容（白底解鎖卡 / 對話 UI）是疊在共用背景上

### 已實作演出

- 拍立得進場：淡入 + 貼上去的彈感
- 解鎖卡：依序 pulse
- 咖啡色遮罩：向上滑走並淡出

---

## 5. 直太郎頁的可點互動

位置：`src/components/game/DiaryOverlay.tsx`

### 完成後摘要區

- `來不及存檔的檔案`
  - 整條可點
  - 點擊後：
    - `setActiveTab("journal")`
    - `setJournalView("entry-bai-1")`

- `獲得線索`
  - 青蛙陰影可點進青蛙提示頁
  - 小雞陰影可點進小雞提示頁

### 解鎖 overlay 演出期間

- 若日記已亮起：
  - `閱讀` / 整條日記卡都可點進 `entry-bai-1`
- 若線索已亮起：
  - 青蛙 / 小雞陰影可直接切入各自提示頁

### 注意

- 這塊曾遇到 `z-index` 與巢狀 `button` 造成點不到的問題
- 目前修正方式：
  - 中下段 absolute 容器明確設 `zIndex`
  - 可點區塊設 `pointerEvents="auto"`
  - 避免 `button` 裡再包 `button`

---

## 6. 小日獸圖鑑狀態語意

位置：`src/components/game/DiaryOverlay.tsx`

### 三種狀態

- `discovered`
  - 已正式遇到該小日獸
  - 顯示正常圖像

- `hint`
  - 尚未正式遇到，但已拿到線索
  - 顯示陰影圖

- `unknown`
  - 完全未知
  - 顯示方塊問號

### 目前已指定的線索對象

- 青蛙
- 小雞

也就是說：

- 首次直太郎揭露完成後
- 原本清單中的兩格 `unknown`
- 會變成兩格 `hint`

---

## 7. 青蛙 / 小雞線索的持久化規則

位置：`src/lib/game/playerProgress.ts`

### 新欄位

- `hasUnlockedSunbeastFrogHint`
- `hasUnlockedSunbeastChickenHint`

### 意義

- 這兩個欄位代表「是否已取得線索」
- 不再把圖鑑的 hint 狀態綁死在舊版事件條件上
- 這是為了之後把小日獸尋找方式改成更貼近拼圖玩法

### 目前何時寫入

- 在直太郎揭露流程進到 `unlock-clues` 時
- 會把兩個欄位寫成 `true`

### 目前圖鑑判斷方式

- 青蛙：
  - `discovered` 仍看正式事件完成狀態
  - `hint` 先看 `hasUnlockedSunbeastFrogHint`

- 小雞：
  - `discovered` 仍看正式事件完成狀態
  - `hint` 先看 `hasUnlockedSunbeastChickenHint`

---

## 8. 青蛙 / 小雞提示內頁規格

位置：`src/components/game/DiaryOverlay.tsx`

### 目前內容

- 兩者都使用 `detail-unknown` 分支
- 透過 `selectedSunbeastCardId` 分辨是哪一隻

### 顯示內容

- 青蛙：
  - 陰影圖：`/collection/frog_sm_shadow.png`
  - 發現方式：`同時經過街道和便利商店`

- 小雞：
  - 陰影圖：`/collection/chicken_sm_shadow.png`
  - 發現方式：`同時經過轉角的公車和便利商店`

### 後續若要擴充

- 建議把 `selectedSunbeastCardId -> 提示頁設定` 抽成資料表
- 不要再把文案散落在 JSX if/else 中

---

## 9. 揭露完成後回夜間 Hub 的 follow-up 對話

位置：`src/components/game/GameSceneView.tsx`

### 觸發時機

- `DiaryOverlay` 在 `mode="sunbeast-reveal"` 完成後關閉
- 不直接回到可選單的 Hub
- 先播放一段小麥 / 小貝狗對話

### 對話主題

1. 已經確認直太郎出現在圖鑑與日記裡
2. 街道地點也已經解鎖
3. 其他小日獸的出現條件開始有方向
4. 接下來要繼續遇到小日獸
5. 目標是讓消失的日記內容慢慢復原

### 目前文案節奏

- 小麥：意識到不只直太郎，連街道和其他小日獸的出現方式也開始有方向
- 小貝狗：指出沿著線索繼續遇到牠們，日記內容可能會回來
- 小麥：下定決心，接下來要把小日獸一隻一隻遇回來

### 播放完後

- 才真正回到原本最近改版好的夜間 Hub 選單

---

## 10. 下個對話如果要接著做，建議先看什麼

1. 先讀這份文件
2. 再看：
   - `src/components/game/DiaryOverlay.tsx`
   - `src/components/game/GameSceneView.tsx`
   - `src/lib/game/playerProgress.ts`

### 接下來最可能會做的事

- 把青蛙 / 小雞提示頁視覺再貼近設計稿
- 把 `地點` 卡真正接到地點 overlay
- 把小日獸 hint 的條件與安排路線拼圖系統正式綁起來
- 把更多小日獸也改成 `hint -> discovered` 的一致流程
