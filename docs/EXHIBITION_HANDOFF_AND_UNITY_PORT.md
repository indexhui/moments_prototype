# 展覽版交接與 Unity 移植筆記

最後更新：2026-08-22

這份文件記錄展覽版目前的實作邊界、後半段接續規則，以及未來移植到 Unity 時必須保留的行為契約。若文件與程式碼不同，以程式碼為準；逐句腳本對照請搭配 `EXHIBITION_FIVE_MINUTE_FLOW.md`。

## 目前完成邊界

編劇版本目前已落到「隔天選擇街道、遇到青蛙小日獸、第一次拍攝判定不足」及其拍照後對話。之後既有的 `work-return`、上班遊戲、`convenience-clerk`、`dessert-transition`、`frog-dessert`、`home-final`、`complete` 等 phase 仍可作為原型骨架，但其文案與銜接尚未全部重新由編劇確認。

- 後半段開發應沿用骨架、逐段替換，不要先把它當成正式腳本。
- 已經確認的前半段，不應再從後半段複製出另一套對話或流程狀態。
- 括號內文字預設是編劇舞台指示，不顯示給玩家；只有使用者明確要求時才轉成旁白。現在的例外是工讀生撿傳單那一句臨時旁白。
- 玩家代表小麥。凡是玩家正在做的選擇或操作，避免改寫成旁觀小麥行動的第三人稱敘述。

## 重要檔案

| 檔案 | 責任 |
| --- | --- |
| `src/lib/game/exhibitionFlow.ts` | phase 型別、展覽對話、下一段映射與 phase 登錄 |
| `src/lib/game/exhibitionSceneJump.ts` | 展覽選單的逐句、逐操作、逐遊戲 step 定義與驗證 |
| `src/components/game/ExhibitionExperienceView.tsx` | 展覽版 runtime 狀態機、計時、畫面與子遊戲切換、URL/step 同步 |
| `src/components/game/GameFrame.tsx` | 桌面展覽進度選單 |
| `src/lib/game/exhibitionFrogStreetFlow.ts` | 展覽版專用的青蛙街道編劇文本、表情與提示 |
| `src/lib/game/frogDiaryClueFlow.ts` | 共用青蛙事件資料結構與日記階段 |
| `src/components/game/events/FrogDiaryClueEventModal.tsx` | 青蛙對話、撿傳單、拍照與結果呈現 |
| `src/components/game/StorySimpleMetroRouteView.tsx` | 隔天安排路線棋盤與路線素材 |
| `src/components/game/DiaryOverlay.tsx` | 日記開啟、翻頁與修復呈現 |
| `docs/EXHIBITION_FIVE_MINUTE_FLOW.md` | 編劇腳本與實作流程對照 |
| `public/sounds/game-sfx/SOURCES.md` | 遊戲音效來源與用途紀錄 |

## 目前主要流程

```text
departure-opening
→ mai-intro
→ departure-plan
→ departure-route
→ metro-opening
→ metro-comic
→ metro-dog
→ dog-photo-diary
→ diary-incomplete
→ post-puzzle-metro
→ metro-to-company
→ office-opening
→ work-arrival
→ box-game
→ work-complete
→ work-dusk
→ work-leave
→ home-search
→ bai-change-first
→ bai-after-flashback
→ frog-diary-fragment
→ day-one-rest
→ morning-route-intro
→ morning-route
```

`argument-flashback`、`post-flashback-diary`、`post-flashback-metro`、`diary-restore` 等舊 phase 仍可能留在型別或相容流程內；修改前要先確認它目前是可見主線、直接跳轉相容層，還是已隱藏的舊流程。

### 隔天路線分支

- 路線中只要有任一「街道」格，就進入正式展覽主線 `street-flyer`。
- 沒有街道時，先播放原有出發過場，再進 `no-sunbeast-workday` 與 `no-sunbeast-summary`。
- 無街道路線結束後，小麥總結今天沒有遇到小日獸，小貝狗提示再看看日記，接著回到 `morning-route?sceneStep=open-diary` 並自動開啟日記。
- 目前單選商店也走「沒有遇到小日獸」的暫時分支。在收到商店事件腳本前，不自行發明正式事件。
- 有街道時會依序進入強風、傳單工讀生、撿傳單遊戲、青蛙出現、第一次拍照不足與青蛙逃走。

## 展覽選單與深連結契約

展覽選單不是只有 phase 清單。每一句話、每一次過場、每一次玩家操作、每一個遊戲與日記子步驟都必須能獨立選取。

```text
/game?preview=<phase>&sceneStep=<step>&trial=dev
```

- `phase` 是大段流程；`sceneStep` 是該段內穩定且有語意的步驟 ID。
- 對話行 ID 應保持穩定，例如 `EX-*`；互動則使用 `route-game`、`open-diary`、`flyer-wind-minigame`、`photo`、`post-photo-*` 等語意名稱。
- 直接跳轉必須還原正確背景、角色、表情、漫畫格、日記狀態與遊戲狀態，不只是顯示正確文字。
- 新增內容時需同步更新 `exhibitionSceneJump.ts`、`GameFrame.tsx` 選單，以及 `ExhibitionExperienceView.tsx` 的直接狀態還原。
- URL phase、目前 step 與由子元件管理的 step 必須同步；否則選單會顯示一個位置，手機舞台卻停在另一個位置。
- Unity 的展覽除錯選單也應直接讀取同一份流程資料，避免另維護一份人工清單。

## 接續編劇腳本的實作順序

1. 先區分玩家實際會看到的對白與括號舞台指示。
2. 依腳本順序建立穩定 line/step ID，不用畫面陣列索引當永久 ID。
3. 表情以中文表情名稱為準；若使用 frame index，確認 `avatarPerformance.ts` 的零起算規則。
4. 漫畫格只使用既有核准做法：單格漫畫或既有雙層漫畫 overlay，不自行創造第三種容器。
5. 優先重用現有路線、拍照、撿傳單、日記玩法，不為一行舞台指示發明新遊戲。
6. 同步補齊 phase/data、next map、選單 step、桌面選項與直接跳轉還原狀態。
7. 同時驗證「從上一句順播」與「從選單直接進入」；兩條路都必須成立。

## 現階段不可破壞的呈現規則

- 手機舞台基準為 `393 × 852`。
- 安排行程沿用遊戲既有路線圖示，不把地點文字 badge 壓在素材圖上。
- 玩家拿到日記後，安排行程頁右側要有日記按鈕。
- 拍到黃金獵犬後的日記漫畫格從「嗷嗷！快看看日記！」開始出現，下一句仍維持。
- 第一天在取得日記碎片後直接進入休息轉場，再接隔天小麥起床，不回到已移除的客廳敘事。
- 第一次青蛙拍攝為判定不足，青蛙會逃走；不要提前改成成功捕捉。

## 音效提示與授權注意

- 捷運到站提示使用 `metroAnnouncement1End`，並在「糟糕，已經到站了！晚點再來思考吧！」文字完全跑完前開始播放。
- 日記沿用開書、翻頁、拼圖拿起/放下與完成音效。
- 強風與傳單使用既有 `paperScattered`；青蛙跳出目前暫用 `frogJump`，收到正式蛙叫素材後再替換。
- 新增或換掉音效時，`src/lib/game/soundEffects.ts` 與來源紀錄要一起更新。
- Convenience Store Pack 的 ReadMe 註明 SFX 為 CC0、Music 為 CC BY-NC 4.0；商業發行前不可直接把其 Music 當作可商用素材。
- 現有 Zapsplat 命名的青蛙暫用音效缺少獨立授權文件，正式發行或搬進 Unity 前必須再次確認授權或替換。

## Unity 建議資料模型

不要逐個照搬 React component；應移植流程資料與行為契約。

```text
ExhibitionPhaseDefinition
- id
- kind: Narrative | Interaction | Transition | Gameplay | Diary
- defaultStepId
- steps[]
- nextPhaseId
- conditionalTransitions[]

ExhibitionStepDefinition
- id
- speakerId
- text
- backgroundAddress
- expressionId
- avatarMotionId
- sfxId
- presentationCue
- interactionId
```

建議 Unity runtime 模組：

- `ExhibitionFlowController`：唯一 phase/step 狀態機。
- `DialogueRunner`：逐字顯示、快速完成、繼續操作。
- `PresentationDirector`：背景、角色、漫畫格、轉場與鏡頭提示。
- `GameplayBridge`：路線、撿傳單、拍照等玩法，以有型別的結果回報狀態機。
- `DiaryController`：日記取得、頁面、修復與重新開啟。
- `AudioCueService`：以 cue ID 對應 Addressables 音效。
- `ExhibitionDebugMenu`：直接從 phase/step 定義產生可跳轉選單。

### Unity 移植原則

- phase ID、step ID、speaker ID、expression ID 與 audio cue ID 必須穩定。
- 資源路徑改成 Addressables key，不把 Web public path 散落在程式中。
- 非同步轉場要有完成訊號與取消機制，不把零散 `setTimeout` 翻成多處 coroutine。
- 每個小遊戲回傳明確結果，例如 `Completed`、`CapturedInsufficient`、`Cancelled`。
- 除錯快照至少能序列化 phase、step、日記狀態、路線選擇與暫存照片狀態。

## 建議移植順序

1. 先凍結現有穩定 ID，將 phase/step/cue 匯出成可驗證的資料。
2. 在 TypeScript 補純流程轉移測試，先固定條件分支與 next phase。
3. 在 Unity 建立 ScriptableObject 或 JSON importer 與 Addressables 對照。
4. 完成對話、表情、漫畫格與轉場 runner。
5. 接路線、拍照、撿傳單、日記等 gameplay bridge。
6. 用同一份資料生成展覽除錯選單。
7. 逐步做 `393 × 852` 視覺與順播比對。

## 每次後半段修改的驗證清單

- `git diff --check`
- `npm run build`
- 以 `393 × 852` 檢查手機畫面。
- 展覽選單逐項直接跳轉，每一句與每一個玩家操作都可抵達。
- 從上一 phase 順播，確認計時、音效與動畫能正常結束。
- 驗證街道與無街道兩種隔天分支。
- 驗證日記重新開啟、返回路線與自動開啟。
- 檢查 console error、重複音效與未清除 timer。
- 確認括號舞台指示沒有意外出現在玩家文字中。

## 已知技術債

- `ExhibitionExperienceView.tsx` 已很大；後半段繼續增加前，宜按 phase 群組拆出 runner/hook，但不可在拆分時改變逐句行為。
- 流程資料與 render callback 仍分散；條件轉移應逐步集中到單一流程層。
- 青蛙共用 flow 與展覽覆寫並存；編劇專用文字只放展覽 flow，不要回灌到一般版。
- timer、音效與動畫需要統一取消/清理機制，避免直接跳轉後殘留上一幕 callback。
- 後半段骨架仍待編劇逐段確認。
- 展覽選單的逐 step 完整性尚未有自動化測試。
- 暫存照片仍依賴瀏覽器儲存；Unity 需要明確的 session/save 資料結構。
- 青蛙暫用音效與 Convenience Store Music 的發行授權仍需在正式打包前處理。
