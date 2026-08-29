# 追傳單小遊戲規格與素材整理

本文件記錄街道青蛙事件中的「追傳單」小遊戲。若文件與程式碼有差異，請以
`src/components/game/events/FrogFlyerWindMinigame.tsx` 為準。

## 遊戲定位與入口

- 事件：`frog-clue-street-flyer`
- 關卡：`street-flyer`
- 承載容器：`FrogDiaryClueEventModal` 內的小遊戲階段，不是獨立頁面。
- 階段 ID：`flyer-wind-minigame`
- 完成後：回到街道事件對話，接續青蛙線索拍照與日記流程。
- 展覽版測試網址：
  `/game/exhibition?preview=street-flyer&sceneStep=flyer-wind-minigame`

Figma 版面參考：`走走小日 2026`，節點 `12522:1982`。

## 操作流程

1. 開啟兩頁教學。
2. 玩家按下「開始」後，傳單沿指定風道飛行。
3. 箭頭進入有效區間時，玩家點擊風道撿取傳單。
4. 每波結束顯示 `GREAT` 或 `MISS` 回饋。
5. 撿到 9 張傳單即通關；失去 3 顆愛心則失敗並可重試。
6. 通關後按下「交還傳單」回到事件流程。

## 判定與節奏

- 目標張數：`9`
- 愛心數：`3`
- 一般判定窗：`0.115`
- `GREAT` 判定：點擊誤差在一般判定窗的 `45%` 以內。
- 回饋演出：`1050 ms`
- 波次之間留白：`130 ms`
- 第 1～7 張：每波 1 張。
- 第 8 張起：每波 2 張，兩張相隔 `500 ms` 出現。
- 雙傳單波只要有一張失誤，該波扣 1 顆愛心。
- 玩家點錯時立即記為 `MISS`；傳單飛出畫面也會自動判定失誤。

## 畫面層級

手機舞台採 `393 × 852` 比例。主要圖層由下往上為：

1. 公司附近街道背景
2. 風道
3. 點擊判定區
4. 飛行傳單
5. 方向箭頭
6. `GREAT / MISS` 回饋
7. 上方小貝狗橫幅
8. 愛心與張數 HUD
9. 教學或結算 overlay

上方橫幅使用 Figma 的 `786 × 236` 比例；在 393px 寬舞台中顯示為
`393 × 118 px`。

## 上方橫幅素材與疊圖順序

新素材位於 `public/images/minigame/flyer_chase/`。

每種情緒的疊圖順序固定為：

1. `top_banner_<mood>.png`：情緒背景
2. `beigo_<mood>_01.png` / `beigo_<mood>_02.png`：兩格互斥角色動畫
3. `top_banner_line.png`：最上方底線

情緒對照：

- `normal`：教學第一頁與初始狀態
- `nervous`：進行中、失誤回饋、失敗結算
- `happy`：成功撿取回饋與通關結算

角色動畫週期為 `720 ms`。第一格與第二格必須互斥，不可讓第一格常駐在第二格後方，
否則不同輪廓會產生殘影。

底部邊緣處理：

- 角色圖層底部裁掉 `1 px`。
- `top_banner_line.png` 位於角色上方並向下偏移 `1 px`。
- 橫幅容器維持 `overflow: hidden`，避免小貝狗白色身體露到底線外。

### normal 底圖的特殊狀況

目前 `top_banner_normal.png` 本身已包含 `beigo_normal_01` 的第一格角色，和另外兩張
純背景的情緒圖不同。Web 版會以 `beigo_normal_01.png` 當遮罩，將背景水平位移
`33.46%` 補回角色區域，再疊真正互斥的兩格動畫。

若美術之後重新輸出不含角色的乾淨 `top_banner_normal.png`，應同步移除
`ArtistTopBanner` 內只對 `normal` 啟用的遮罩補底邏輯。

## 其他美術素材

目前風道與遊戲本體仍使用 `public/images/428出圖/20260822/追傳單/`：

- `風道/`：右、上、左、下四個方向
- `文件/`：四個方向的飛行傳單
- `矢印/`：每個方向各兩格箭頭
- `愛心/`：背景、正常、扣掉
- `great_miss/`：成功／失敗的背景、人、文字與流線

街道背景：`public/images/428出圖/背景/公司附近街道_白天.jpg`。

所有小遊戲素材會在元件掛載時預載，新增或改名時要同步更新
`FLYER_ART_PRELOAD_SOURCES`。

## 音樂與音效

- 小遊戲音樂：`Poppy Shop.ogg`
- 開始散落傳單：`paperScattered` FMOD 事件
- 撿取成功：`flyerCatchSuccess`
- 漏接／點錯：`flyerMiss`
- 達標：`flyerRoundSuccess`
- 未達標：`flyerRoundFail`
- 交還傳單：`flyerHandOff`

進入小遊戲時切換到 `flyerMinigame` 音樂狀態；離開元件時恢復 `mainTheme`。

## 多語系與無障礙

- 繁中、日文、英文文案位於元件內的 `FLYER_COPY`。
- 每條可點風道都要保留方向與操作的 `aria-label`。
- 撿取數與失誤數透過 `aria-live` 更新。
- 素材替換時不可移除街道、教學與回饋的替代文字。

## 維護與驗收

修改後至少檢查：

1. 教學兩頁的 normal／nervous 橫幅是否正確。
2. 兩格小貝狗是否完全互斥，沒有上一格的輪廓殘留。
3. 底線是否始終位於角色之上，白色身體沒有露出橫幅底部。
4. 成功時切到 happy，失誤與一般遊玩時切到 nervous。
5. 第 8 張起是否同時出現兩條風道。
6. 成功、失敗、重試與交還傳單是否都能完成。
7. `npm run build` 與 `npx tsc --noEmit` 是否通過。
