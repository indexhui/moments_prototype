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

## 9. 首次進入小日獸圖鑑的線索導覽

位置：`src/components/game/DiaryOverlay.tsx`

### 目前導覽內容

玩家完成直太郎揭露，回到夜間 Hub 後，再依照 Hub 引導點進 `小日獸`：

1. 小麥對話：
   - 「除了直太郎出現了，」
   - 「有兩隻小日獸的影子也出現了！」
2. 小貝狗對話：
   - 「熬！點點看牠們，有遇見牠們的線索。」
3. 導覽進入 spotlight step：
   - 全頁變暗
   - 青蛙線索卡保持亮起
   - 手指指向青蛙線索卡
   - 其他地方不可點
   - 點亮起區域後，開啟青蛙線索內頁

### 這次實作踩到的問題

這次 bug 修了很多輪，核心原因不是單一 CSS 錯誤，而是以下幾件事互相影響：

1. `DiaryOverlay` 是大型多畫面狀態機，collection、detail、首次揭露、夜間 Hub 引導都共用同一份 JSX 與 state。
2. spotlight 需要同時處理：
   - 視覺加暗
   - 亮區挖洞
   - 手指位置
   - 點擊攔截
   - 只允許目標卡片可點
3. 一開始把遮罩依賴 `getBoundingClientRect()` 量到的 rect。
   - 在 hot reload / 開發中測試時通常可行。
   - 但從完整流程重測時，DOM 可能還沒 layout 完、collection 還在切狀態、或 ref 還沒穩定，導致 rect 沒產生。
   - 結果就會出現「開發時有，從頭測試沒有」。
4. 後來改用卡片本身的大 `box-shadow` 做周圍加暗。
   - 這讓遮罩不依賴測量，手指也比較穩。
   - 但卡片在多層 `overflow="hidden"` / `overflowY="auto"` 裡，陰影會被列表容器裁掉。
   - 結果黑影只出現在列表範圍，不是滿版。
5. 再改成滿版暗幕後，又遇到 stacking context / pointer events 問題。
   - 暗幕在最上層時會吃掉點擊。
   - 只把青蛙卡片 `z-index` 拉高，不一定能穿過父層 stacking context。
   - 視覺亮了，但實際點不到。
6. 最後的穩定解法是把「顯示導覽」和「精準測量」解耦。
   - 進入導覽 step 一定顯示滿版 SVG mask。
   - 有量到青蛙卡 rect 時，用精準洞位。
   - 沒量到時，用依照頁面比例計算的 fallback 洞位。
   - 手指跟洞位走，不再直接依賴卡片 DOM。
   - 滿版暗幕攔截所有點擊，只有點在洞位範圍內時，手動呼叫開啟青蛙線索。

### 目前實作策略

目前程式碼採用以下做法：

- `isSunbeastShadowGuideVisible && sunbeastShadowGuideStep === 2` 代表 spotlight step。
- `sunbeastShadowTargetRect` 儲存量到的青蛙卡位置。
- `sunbeastSpotlightSize` 儲存 overlay root 的尺寸。
- `sunbeastShadowMaskRect` 是實際用來畫洞的 rect：
  - 優先使用 `sunbeastShadowTargetRect`
  - 若尚未量到，使用 fallback 比例位置
- SVG mask 放在小日獸頁最外層 overlay 座標系裡，避免被 collection padding / scroll 容器影響。
- 手指與點擊判斷都使用 `sunbeastShadowMaskRect`，避免手指、洞位、可點區域三者不同步。
- 暗幕 `pointerEvents="auto"`，負責攔截點擊。
- 暗幕 onClick 會把滑鼠座標轉成 mask viewBox 座標，只在亮洞範圍內開啟青蛙線索。

### 之後做類似導覽時的建議

不要把導覽 spotlight 寫成「某個目標元素旁邊附一個小元件」。

比較穩的架構應該是：

1. 用一個頁面級 `TutorialSpotlightOverlay` 統一處理暗幕、mask、手指、點擊攔截。
2. 目標元素只負責提供 ref 或 data attribute。
3. overlay 需要有 fallback rect，不能等到量測成功才 render。
4. 手指與可點 hitbox 要跟同一個 rect 走。
5. 點擊不要期待穿透暗幕到下層 DOM；由 overlay 代理目標 action。
6. 若頁面內有 scroll / transform / padding，測量座標必須統一轉成 overlay root 的座標系。
7. 要測完整流程，不只測 hot reload 後的局部畫面。

適合未來抽出的 API：

```ts
type TutorialSpotlightTarget = {
  id: string;
  fallbackRect: {
    leftRatio: number;
    topRatio: number;
    widthRatio: number;
    heightRatio: number;
  };
  pointer?: {
    offsetX: number;
    offsetY: number;
  };
  onActivate: () => void;
};
```

### 回歸測試清單

每次改這段導覽，至少確認：

- 從拍照開始跑完整流程，最後進小日獸頁時有出現小麥 / 小貝狗對話。
- 對話結束後，畫面全頁變暗。
- 青蛙線索卡亮起，亮區不要偏到直太郎或小雞。
- 手指出現，並在青蛙卡左側。
- 點青蛙亮區會進青蛙線索內頁。
- 點其他地方不會切頁、不會返回、不會改 filter。
- 點擊後 `hasSeenSunbeastShadowGuide` 會寫入，之後不重播。
- 按測試按鈕 `重新開始` / `重置玩家資料` 後，再從下班流程重測仍可出現。

---

## 10. 揭露完成後回夜間 Hub 的 follow-up 對話

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
