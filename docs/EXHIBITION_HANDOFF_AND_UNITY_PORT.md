# 展覽版交接與 Unity 移植筆記

最後更新：2026-08-23

這份文件記錄展覽版目前的實作邊界、後半段接續規則，以及未來移植到 Unity 時必須保留的行為契約。若文件與程式碼不同，以程式碼為準；逐句腳本對照請搭配 `EXHIBITION_FIVE_MINUTE_FLOW.md`。

## 目前完成邊界

編劇版本目前已落到「隔天選擇街道、第一次遇到青蛙、完成街道日記後前往公司、完成上班遊戲、發現忘帶便當、安排便利商店路線、在超商與店員對話、第二次拍照、完成便利商店日記、返回公司繼續工作、下班陪同事尋找甜點店、第三次拍照、完成日記、夜晚街道收尾」。`complete` 保留為展覽體驗的系統完成卡，不是編劇對話。

- 後續篇章開發應延續目前 phase 與逐步跳轉契約，不要另起一套重複狀態。
- 已經確認的前半段，不應再從後半段複製出另一套對話或流程狀態。
- 黑色描述欄的括號文字是編劇舞台指示，不顯示給玩家；只有使用者明確要求時才轉成旁白。現在的例外是工讀生撿傳單那一句臨時旁白。角色／表情列上的綠色括號文字則視為內心話，顯示時移除括號並使用內心話樣式。
- 玩家代表小麥。凡是玩家正在做的選擇或操作，避免改寫成旁觀小麥行動的第三人稱敘述。

## 重要檔案

| 檔案 | 責任 |
| --- | --- |
| `src/lib/game/exhibitionFlow.ts` | phase 型別、展覽對話、下一段映射與 phase 登錄 |
| `src/lib/game/exhibitionSceneJump.ts` | 展覽選單的逐句、逐操作、逐遊戲 step 定義與驗證 |
| `src/components/game/ExhibitionExperienceView.tsx` | 展覽版 runtime 狀態機、計時、畫面與子遊戲切換、URL/step 同步 |
| `src/components/game/GameFrame.tsx` | 桌面展覽進度選單 |
| `src/lib/game/exhibitionFrogStreetFlow.ts` | 展覽版專用的青蛙街道編劇文本、表情與提示 |
| `src/lib/game/exhibitionFrogConvenienceFlow.ts` | 展覽版專用的便利商店編劇文本、店員表情、內心話與青蛙出現提示 |
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
- 有街道時會依序進入強風、傳單工讀生、撿傳單遊戲、青蛙出現、第一次拍照不足、完成本次日記、回到街道播放三句編劇台詞；台詞結束後先播放街道前往公司的行程轉場，抵達公司並讓小麥在座位就緒，才進入上班遊戲。
- `work-return → street-to-company → street-office-arrival → work-value` 是這段的固定順序；四個 phase 都需保留為展覽選單與 Unity 除錯選單可直接跳轉的節點。

### 上班完成到便利商店

- 任一展覽辦公遊戲完成或略過後，都進入 `convenience-clerk` 的 `intro-0`，依序播放四句編劇台詞：小麥準備吃午餐、發現忘帶便當、決定去便利商店、小貝狗回應。
- 午餐台詞後進入 `sceneStep=route`，沿用主線公司到便利商店的單格寬窄路線；不得用旁白代替玩家安排路線。
- 路線完成後從 `line-0` 進入便利商店。進場播放 `convenienceEntranceChime`，接著依序顯示涼麵特價、108 元微波誤會、餐具修正、店員臉紅、小貝狗提醒、青蛙出現與相機提示。
- 店內黑色括號描述不顯示成台詞；食品櫃、男店員與青蛙爬出分別由背景、店員立繪與青蛙 reveal 表現。`line-5`、`line-7`、`line-8` 是小麥內心話，顯示時不保留括號。
- 第二次拍照確認後，先進 `convenience-clerk` 的 second-photo 日記流程，補回便利商店飲料頁並取得甜點店提示；完成日記才進 `convenience-photo-return`，依序播放小麥擔心、小麥無奈困擾與小貝狗回應三句台詞。
- 三句結束後固定為 `convenience-to-company → convenience-work-resume → dessert-transition`：先播放便利商店回公司的行程，再顯示小麥回到座位繼續工作到下班。
- `intro-0..3`、`route`、`line-0..8`、`photo`、`EX-CONVENIENCE-RETURN-01..03`、`route-transition`、`work-resume` 與保留的日記驗收 step 都必須能從展覽選單直接跳入。

### 下班到甜點店收尾

- `dessert-transition` 依序播放公司黃昏四句與街道黃昏一段內心話；公司轉街道的黑字舞台指示由地點轉場表現，不顯示成旁白。
- `dessert-route` 沿用既有「尋找甜點店」滑動道路拼圖，展覽版完成時只前往 `frog-dessert`，不寫正式玩家進度。
- `frog-dessert` 使用 `EXHIBITION_DESSERT_FROG_STAGE` 的九句編劇台詞；店內音樂、同事結帳走回與青蛙躲在提袋等舞台指示由背景切換、角色表情及青蛙 reveal 表現。
- 小貝狗說完「嗷！提袋！提袋裡面！」後插入 `container-search`：先讓目標提袋晃動，再讓三個提袋轉位，玩家必須跟住並選對提袋；正確提袋打開、青蛙探頭後，才接回小麥認出青蛙與既有拍照玩法。錯選只給回饋並繼續選，不跳過原編劇台詞。
- 第三次拍照沿用 `EventPhotoCaptureLayer`，完成日記揭露後不播放舊原型的五句讀後反應，直接進 `home-final` 的夜晚街道六句編劇台詞，再進系統 `complete` 完成卡。
- `EX-DESSERT-DEPART-01..05`、`route-game`、`line-0..8`、`photo`、完整日記 steps、`EX-DESSERT-AFTER-01..06` 都必須能從展覽選單直接跳入。

### 青蛙日記的展覽版順序

- 展覽版固定使用 `street-first`：`街道 → 便利商店 → 甜點店`。
- 初始殘篇的紙膠帶／拼圖先解出街道；街道拍照後補回街道頁並引出便利商店；便利商店拍照後補回飲料頁並引出甜點店；甜點店是第三次完整收服。
- 青蛙共有三篇日記；每一篇都先在拼圖階段只還原該篇上半段，捕捉到對應的青蛙照片後才翻到新頁、只揭露該篇第二段。玩家看完第二段並按下繼續後，才能進入下一篇的拼圖階段；拍照揭露頁不可重播上半段，拼圖頁也不可預先顯示第二段。
- `street-first` 不是把正式版三張圖卡互換而已，必須使用展覽版專用時間線：搬家途中街道騷動（小朋友玩球撞上發傳單的人）→ 小白與小麥先幫忙撿傳單 → 回到客廳才看到便利商店飲料並喝掉 → 發現是搬家工人的飲料後去甜點店賠罪。目錄預覽、拼圖文字、拍照後揭露與完成頁都要引用同一組文本。
- 正式版仍維持原本的 `便利商店 → 街道 → 甜點店`，不得為展覽改序而修改共用預設值或正式玩家進度。
- Web 由 `DiaryOverlay.frogDiaryLocationOrder="street-first"` 明確啟用，Unity 移植時也要把地點順序做成展覽流程資料，不可依照片次數硬猜正式版順序。

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
- 街道強風使用 `streetStrongWind`；傳單撿到／漏接／達標／交還分別使用 `flyerCatchSuccess`、`flyerMiss`、`flyerRoundSuccess`、`flyerHandOff`。青蛙跳出目前暫用 `frogJump`，收到正式蛙叫素材後再替換。
- 便利商店進場使用 `mixkit-cartoon-door-melodic-bell-110.wav`；Unity 移植時需把此觸發保留在店內第一句開始前後，而不是放到路線拼圖內。
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
- 青蛙篇之後的其他日記篇章仍待編劇逐段確認。
- 展覽選單的逐 step 完整性尚未有自動化測試。
- 暫存照片仍依賴瀏覽器儲存；Unity 需要明確的 session/save 資料結構。
- 青蛙暫用音效與 Convenience Store Music 的發行授權仍需在正式打包前處理。
