# 完成傳單到青蛙拍照：Unity 分析與移植交接

最後更新：2026-08-31

本文件記錄 Web 展覽版中，玩家完成「撿傳單」後，從成功結算、青蛙跳出動畫，
無縫銜接到青蛙拍照的完整行為契約。這段目前只存在 Web 原型，Unity 尚未實作；
Unity 團隊可依本文件確認所需圖檔、音檔、秒數、座標、圖層與狀態銜接。

若文件與 Web 程式碼有差異，現階段以下列檔案為準：

- `src/components/game/events/FrogFlyerWindMinigame.tsx`
- `src/components/game/events/FrogDiaryClueEventModal.tsx`
- `src/components/game/events/EventPhotoCaptureLayer.tsx`
- `src/lib/game/fmodWeb.ts`
- `src/lib/game/soundEffects.ts`

相關文件：

- [`FLYER_CHASE_MINIGAME.md`](./FLYER_CHASE_MINIGAME.md)：撿傳單玩法本體。
- [`PHOTO_TUTORIAL_UNITY_HANDOFF.md`](./PHOTO_TUTORIAL_UNITY_HANDOFF.md)：其他小日獸共用的拍照教學 modal。
- [`EXHIBITION_HANDOFF_AND_UNITY_PORT.md`](./EXHIBITION_HANDOFF_AND_UNITY_PORT.md)：展覽版完整流程與 Unity 架構建議。

## 範圍

本文件包含：

1. 撿到第 9 張傳單後的成功結算。
2. 玩家按下「完成」後的箱子背景與青蛙 `1～9` 格動畫。
3. 青蛙動畫結束後直接進入拍照。
4. 拍照階段的青蛙、傳單、拖曳、取景框、計分、照片輸出與音效。
5. Unity 所需的素材匯入與狀態資料。

本文件不重新定義撿傳單遊戲前半段的風道、判定窗與波次；那些規則以
`FLYER_CHASE_MINIGAME.md` 為準。拍照確認後的青蛙逃走、日記揭露與後續劇情也不在本文件主範圍。

## Unity 所需素材總表

### 圖檔

| 階段 | 用途 | Web 路徑 | 尺寸／格式 |
| --- | --- | --- | --- |
| 成功結算、Reveal、拍照 | 裝滿傳單的箱子背景 | `public/images/takepicture/拍青蛙/背景.jpg` | `786 × 1704` JPG |
| Reveal | 青蛙跳出第 1～9 格 | `public/images/takepicture/拍青蛙/青蛙跳出來/1.png`～`9.png` | 各 `786 × 1704` RGBA PNG |
| 拍照 | 青蛙循環第 1 格 | `public/images/takepicture/拍青蛙/青蛙1.png` | `786 × 1704` RGBA PNG |
| 拍照 | 青蛙循環第 2 格 | `public/images/takepicture/拍青蛙/青蛙2.png` | `786 × 1704` RGBA PNG |
| 拍照 | 可拖曳傳單 1 | `public/images/takepicture/拍青蛙/傳單1.png` | `786 × 1704` RGBA PNG |
| 拍照 | 可拖曳傳單 2 | `public/images/takepicture/拍青蛙/傳單2.png` | `786 × 1704` RGBA PNG |

所有素材以 `786 × 1704` 直式畫布輸出；Web 手機舞台基準為 `393 × 852`，因此可先用
原圖 50% 顯示核對。背景為不透明 JPG，其餘皆需保留透明通道。Unity 可匯入為
`Sprite (2D and UI)`，並用相同 RectTransform 畫布對位。

### 音檔與 FMOD cue

| Cue | Web 路徑／事件 |
| --- | --- |
| 撿傳單背景音樂 | `public/sounds/Convenience Store Pack/Music/Poppy Shop.ogg` |
| 傳單任務達標 | `public/sounds/Audio_interface/confirmation_001.ogg` |
| 交還傳單 | `public/sounds/Audio_rpg/bookPlace2.ogg` |
| 青蛙跳出 | `public/sounds/game-sfx/zapsplat_cartoon_frog_jump_26526.webm` |
| 拍照背景音樂 | FMOD `event:/music/music_piece_main` |
| 相機快門 | `public/sounds/game-sfx/photo-shutter.mp3` |
| 拍照失敗 | `public/sounds/game-sfx/photo-result-negative.ogg` |
| 拍照成功 | `public/sounds/game-sfx/photo-result-normal.ogg` |
| 確認照片 | FMOD `event:/object/obj_take_photo_done` |

## 玩家看到的完整順序

```text
撿到第 9 張傳單
→ 顯示成功結算卡
→ 依剩餘生命顯示「成功 / 大成功 / 超成功」
→ 玩家按「完成」
→ 背景立刻換成裝滿傳單的箱子
→ 播放青蛙 1 → 2 → 3 → 4 → 5 → 6
→ 第 6 格停留 1 秒
→ 播放 7 → 8 → 9
→ 直接進入拍照，沒有對話、教學或額外 modal
→ 青蛙在箱子四周巡遊，兩張傳單繞著青蛙漂浮
→ 玩家可拖曳傳單，但只有按「拍照」按鈕才會拍照
→ 顯示拍攝結果，通過門檻後可確認照片
```

Unity 應把這段視為一條連續 sequence。`完成`、`frog reveal finished`、`shutter pressed`、
`capture rendered` 與 `photo confirmed` 都要有明確事件，不要依畫面物件是否存在推測狀態。

## 建議狀態機

```text
FlyerCompleteResult
  ├─ Retry                         // 失敗結算，不進青蛙流程
  └─ ConfirmSuccess
       ↓
FrogReveal
       ↓ onRevealFinished
FrogPhotoAiming
       ↓ onShutterPressed
FrogPhotoProcessing
       ↓ onCaptureRendered
FrogPhotoResult
  ├─ Retake → FrogPhotoAiming
  └─ Confirm → 後續劇情 / 日記流程
```

建議穩定 ID：

| 狀態 | 建議 ID | 用途 |
| --- | --- | --- |
| 傳單成功結算 | `flyer-result-success` | 顯示生命對應結果與完成按鈕 |
| 青蛙跳出 | `frog-reveal` | 箱子背景與 1～9 格動畫 |
| 青蛙拍照 | `frog-photo-aiming` | 自動移動、拖曳傳單、掃動取景框 |
| 照片處理 | `frog-photo-processing` | 閃白、合成與編碼；禁止第二次快門 |
| 拍照結果 | `frog-photo-result` | 分數、重拍或確認照片 |

Unity 的展覽除錯選單至少要能直接進入 `frog-reveal` 與 `frog-photo-aiming`，並能從
`flyer-result-success` 順播驗證真正的銜接。

## 成功結算

### 進入條件

- 已撿到：`9 / 9`。
- 尚未失去全部 3 顆愛心。
- 達標瞬間播放 `flyerRoundSuccess`。
- 成功結算不會自動進下一幕；一定要等待玩家按下「完成」。

### 剩餘生命與標題

| 剩餘生命 | 繁中標題 | 英文現況 | 日文現況 |
| --- | --- | --- | --- |
| 1 | 成功! | Success! | 成功！ |
| 2 | 大成功! | Great success! | 大成功！ |
| 3 | 超成功! | Perfect! | 超大成功！ |

按下「完成」時：

1. 播放 `flyerHandOff`。
2. 將青蛙 reveal 影格重設為第 1 格。
3. 進入 `frog-reveal`。
4. 不插入事件對話或第二個 modal。

## 青蛙跳出時間軸

### 素材與背景

- 背景：`public/images/takepicture/拍青蛙/背景.jpg`
- 影格目錄：`public/images/takepicture/拍青蛙/青蛙跳出來/`
- 影格：`1.png`～`9.png`
- 所有圖檔：`786 × 1704 px`
- 手機舞台基準：`393 × 852`，剛好是原始素材的 50%。
- 呈現方式：素材對齊整個手機舞台，不再疊街道背景。

### 精確時間

| 顯示影格 | 停留時間 | 累積結束時間 |
| --- | ---: | ---: |
| 1 | 280 ms | 280 ms |
| 2 | 280 ms | 560 ms |
| 3 | 280 ms | 840 ms |
| 4 | 280 ms | 1120 ms |
| 5 | 280 ms | 1400 ms |
| 6 | 1000 ms | 2400 ms |
| 7 | 360 ms | 2760 ms |
| 8 | 320 ms | 3080 ms |
| 9 | 220 ms | 3300 ms |

總長約 `3.3 秒`。第 6 格本身停留 `1 秒`，不是在第 6 格後另插一張空畫面。
Web 目前在 `6 → 7` 的切換點播放 `frogJump`。

### 切格與防閃爍契約

Web 已確認只預載檔案仍可能閃爍，因此目前採用：

1. 進入 reveal 前先載入並解碼背景與九張影格。
2. 街道背景、箱子背景與九張 reveal 影格都保持固定節點。
3. 切格只切換可見度，不替換同一張圖片的 URL，也不每格重建圖片節點。
4. 任一時間恰好只有一張 reveal 影格可見。
5. 第 9 格播放完才送出 `onRevealFinished`。

Unity 對應做法：

- 在 sequence 開始前用 Addressables 或資源管理器完成 Sprite 載入。
- 可使用一個 `Image` 搭配已在記憶體中的 Sprite 陣列，或用兩個交替 buffer；不可在切格時才讀磁碟。
- 若使用多個 `Image`，播放前建立完成，切格只改 `CanvasRenderer` alpha 或 active state。
- 不要在每次切格時 Instantiate / Destroy UI 物件。
- 低記憶體裝置不建議把九張全尺寸透明貼圖永久留在場景；播放完成後應釋放 reveal 專用資源。

## Reveal 到拍照的無縫銜接

`frog-reveal` 結束後，父流程直接切換到 `frog-photo-aiming`。Unity 應在切換前完成以下準備：

- 箱子背景已在記憶體中；拍照沿用同一張背景，不要先退回街道。
- 青蛙兩格與傳單兩張已完成載入。
- 拍照控制器已建立，但在 reveal 結束前不可接受快門輸入。
- Reveal 最後一格與拍照第一幀之間不可插黑畫面、loading、對話或 modal。
- 若資源尚未準備完成，應延長第 9 格或在不可見的預備階段等待，不要先切到空拍照場景。

建議 Unity 使用同一個 Canvas／Camera 容器，讓 reveal layer 淡出或關閉的同一幀啟用
photo layer；箱子背景最好共用同一個背景 renderer，避免重複上傳貼圖。

## 拍照畫面

### 圖層順序

由下往上：

1. 箱子背景 `背景.jpg`
2. 青蛙兩格動畫
3. 第一張傳單
4. 第二張傳單
5. 掃動取景框
6. 操作提示與拍照按鈕
7. 快門閃白
8. 拍照結果 UI

背景使用 `cover` 邏輯；所有下列位置都以「背景實際渲染範圍」的 normalized rect 表示，
不是以整個桌面視窗計算。

### 青蛙

素材：

- `public/images/takepicture/拍青蛙/青蛙1.png`
- `public/images/takepicture/拍青蛙/青蛙2.png`

兩張皆為 `786 × 1704 px` RGBA PNG。播放規則：

- 第一格開始。
- 每 `280 ms` 交替一次。
- 動畫無限循環，直到按快門或離開拍照狀態。
- 兩張素材須先完成載入；不可在播放中從磁碟載入下一張。

初始 rect：

```text
x = 0.142
y = 0.159
width = 0.72
height = 0.72
```

自動巡遊：

```text
offsetX = cos(phase) × 0.12
offsetY = sin(phase) × 0.085
duration = 5200 ms
```

- 青蛙以橢圓路徑移動，幅度足以到達箱子的上、右、下、左四邊。
- 青蛙不可被玩家拖曳。
- 青蛙的位移要同步套用到拍照判定目標；畫面上的青蛙與計分目標不能分離。

### 兩張漂浮傳單

素材：

- `public/images/takepicture/拍青蛙/傳單1.png`
- `public/images/takepicture/拍青蛙/傳單2.png`

兩張皆為 `786 × 1704 px` RGBA PNG，但大部分區域透明。Web 目前用整張原尺寸素材維持
Figma 對位；Unity 建議美術另輸出裁切後 Sprite，並用 pivot／offset 還原位置，以降低紋理記憶體。

| 項目 | 傳單 1 | 傳單 2 |
| --- | ---: | ---: |
| 初始 x | 0.300 | 0.307 |
| 初始 y | 0.158 | 0.174 |
| width | 0.58 | 0.54 |
| height | 0.58 | 0.54 |
| X 軸半徑 | 0.13 | 0.13 |
| Y 軸半徑 | 0.07 | 0.07 |
| 一圈時間 | 4600 ms | 4600 ms |
| 初始相位 | 0 | π |
| 方向 | 正向 | 正向 |
| 可拖曳範圍 X | ±0.12 | ±0.12 |
| 可拖曳範圍 Y | ±0.09 | ±0.09 |

互動規則：

- 兩張傳單以相反相位繞著青蛙附近漂浮。
- 玩家可用手指或滑鼠稍微拖動傳單；Unity 至少需支援 touch drag。
- 拖曳時暫停該張傳單的自動位移。
- 放開後保存玩家拖曳 offset，傳單從新位置繼續漂浮。
- `PointerUp`、`PointerCancel`、視窗失焦／暫停都要結束 drag，避免傳單黏住指標。
- 拍照合成必須使用按快門當下的傳單位置。

## 快門、取景框與計分

### 觸發規則

街道箱子拍照使用 `shutter-only`：

- 只有按下畫面上的「拍照」按鈕才觸發快門。
- 點背景不拍照。
- 鍵盤空白鍵不拍照。
- 拖曳傳單後放開也不拍照。
- 照片處理期間鎖住快門，避免重複請求。

### 取景框

- 尺寸：`248 × 248 px`，以 Web `393 × 852` 手機舞台為目前基準。
- 預設為垂直掃動。
- 起點：`Y = -130 px`。
- 終點：`Y = 360 px`。
- 週期：`2200 ms`。
- easing：`ease-in-out`。
- 無限循環，直到按下快門。

Web 會依取景框是否掃過青蛙目標調整框線透明度。Unity 可用同一份 normalized target
和取景框位置直接計算，不需要每幀查詢 UI 物件的世界矩形。

### 青蛙判定目標

基礎 target rect：

```text
x = 0.34
y = 0.32
width = 0.48
height = 0.22
```

目標的 x／y 會跟隨青蛙 orbit offset，width／height 不變。

分數公式：

```text
score = round(
  intersectionArea(cameraFrameRect, frogTargetRect)
  / frogTargetRect.area
  × 100
)
```

- 分數限制在 `0～100`。
- Web 目前通過門檻為 `60`。
- 未通過顯示重拍；通過後可確認照片。
- 第一次街道青蛙在劇情上仍屬「第一次線索」，確認後的故事結果由外層流程決定，
  不可只用拍照分數推測已成功收服青蛙。

## 照片輸出契約

Web 的 `PhotoCaptureResult` 包含：

```text
score
polaroidUrl
sourceImage
normalizedCameraFrameRect
normalizedCroppedRect
framePreviewUrl
```

目前會輸出：

- `620 × 620` 的拍立得裁切。
- 以 `900 px` 寬生成的取景框預覽；本段取景框為正方形，因此通常是 `900 × 900`。
- 背景、當下青蛙影格與兩張傳單都要合成進照片。
- 按下快門後至少等待 `280 ms` 才顯示結果；若合成更久，則以合成完成時間為準。

Unity 可以改用 Texture／RenderTexture 或平台截圖管線，不需要保留 Web 的 Data URL 格式；
但對外回傳資料仍應包含分數、裁切範圍、預覽圖識別與來源場景 ID。

## 音樂與音效時間點

| 時間點 | Cue | Web 素材／事件 |
| --- | --- | --- |
| 撿傳單遊戲期間 | `flyerMinigame` | `Poppy Shop.ogg` |
| 第 9 張完成、成功卡出現 | `flyerRoundSuccess` | `confirmation_001.ogg` |
| 玩家按「完成」 | `flyerHandOff` | `bookPlace2.ogg` |
| 青蛙第 6 格切到第 7 格 | `frogJump` | `zapsplat_cartoon_frog_jump_26526.webm` |
| Reveal 元件離開、進入拍照 | `mainTheme` | FMOD `event:/music/music_piece_main` |
| 玩家按拍照按鈕 | `photoShutter` | `photo-shutter.mp3` |
| 拍照結果不通過 | `photoResultNegative` | `photo-result-negative.ogg` |
| 拍照結果通過 | `photoResultNormal` | `photo-result-normal.ogg` |
| 玩家確認照片 | `takePhotoDone` | FMOD `event:/object/obj_take_photo_done` |

注意：`frogJump` 目前是暫用 Zapsplat 命名素材，正式移入 Unity 或發行前要確認授權文件，
否則更換為正式蛙叫／跳躍音效。

## Unity 素材與播放設定

- Reveal 的背景與 `1～9` 格在玩家按下「完成」前完成載入。
- 拍照的背景、青蛙兩格、傳單兩張在 Reveal 播放期間完成載入。
- Reveal 影格播放模式為逐張切換，不做交叉淡化。
- 青蛙拍照兩格每 `280 ms` 直接互換，不做補間。
- 所有 normalized rect 都以箱子背景的實際顯示範圍為基準。
- Reveal 播完後可卸載 `青蛙跳出來/1.png`～`9.png`；拍照階段只使用背景、青蛙兩格與傳單兩張。
- 音效與背景音樂在 sequence 開始前完成載入，觸發時間依本文件音效表執行。
- 若 Unity 端裁切透明邊界，必須保留每張 Sprite 的 pivot／offset，確保與目前全畫布素材對位一致。

## 建議 Unity 模組

```text
FlyerToFrogSequenceController
├─ FlyerResultPresenter
├─ FrogRevealPlayer
├─ FrogPhotoController
│  ├─ FrogOrbitController
│  ├─ FlyerOrbitDragController × 2
│  ├─ CameraFrameController
│  └─ PhotoScoreCalculator
├─ PhotoCaptureRenderer
└─ AudioCueService
```

責任建議：

- `FlyerToFrogSequenceController`：唯一狀態機，接收傳單結果並送出拍照完成事件。
- `FrogRevealPlayer`：只負責背景、九格時間軸與 reveal cue。
- `FrogPhotoController`：輸入、orbit、拖曳、快門鎖定與拍照結果狀態。
- `PhotoCaptureRenderer`：只負責合成與非同步輸出，不自行推進遊戲狀態。
- `AudioCueService`：以穩定 cue ID 對應 Unity Audio 或 FMOD Event。

建議把時間與座標做成 ScriptableObject／JSON，而不是散落在 MonoBehaviour：

```text
FrogRevealConfig
- backgroundAddress
- frameAddresses[9]
- frameDurationsMs[9]
- jumpSfxTransitionIndex

FrogPhotoConfig
- backgroundAddress
- frogFrameAddresses[2]
- frogFrameDurationMs
- frogBaseRectNormalized
- frogOrbitRadiusNormalized
- frogOrbitDurationMs
- flyerDefinitions[2]
- targetRectNormalized
- cameraFrameSize
- cameraSweepFrom
- cameraSweepTo
- cameraSweepDurationMs
- passScore
```

## 驗收清單

### 流程

- [ ] 撿到 9 張後只顯示一次成功結算。
- [ ] 1／2／3 顆生命正確顯示成功／大成功／超成功。
- [ ] 未按「完成」時不會自行進 reveal。
- [ ] 按「完成」後立即換箱子背景，不顯示對話或額外 modal。
- [ ] Reveal 完成後直接進拍照，沒有黑畫面或背景跳回街道。

### Reveal

- [ ] 順序固定為 `1→2→3→4→5→6→7→8→9`。
- [ ] 第 6 格停留 `1 秒`。
- [ ] 總長約 `3.3 秒`。
- [ ] `frogJump` 在 `6→7` 播放一次。
- [ ] 所有影格在播放前載入完成，切格沒有白閃、背景閃或上一格殘影。

### 拍照互動

- [ ] 青蛙兩格每 `280 ms` 交替且沒有閃爍。
- [ ] 青蛙可巡遊到箱子上、右、下、左四側。
- [ ] 兩張傳單較小、相反相位漂浮。
- [ ] 傳單可觸控拖曳；放開、取消、App 暫停後都不黏住。
- [ ] 只有拍照按鈕可觸發快門。
- [ ] 快門當下的青蛙影格與傳單位置正確寫入照片。
- [ ] 判定目標跟著青蛙移動，60 分門檻正確。

### 音訊與素材

- [ ] 快門、結果與確認音效各只播放一次。
- [ ] `flyerHandOff`、`frogJump`、`photoShutter` 的觸發時間符合時間軸。
- [ ] Reveal 與拍照素材都在各自播放前完成載入。
- [ ] Reveal 切到拍照時沿用同一張箱子背景。
- [ ] Reveal 資源在切到拍照後可安全卸載。

## Unity 分析時仍需確認

1. 最終要使用 Unity AudioSource 還是 FMOD for Unity 承接全部 cue。
2. `frogJump` 暫用素材的授權與正式替換檔。
3. 圖檔要維持全畫布輸出，還是由美術另交裁切 Sprite 與 pivot／offset 對照表。
4. 照片要存成 Texture、檔案、Addressable session asset，或只保留預覽與裁切資料。
5. 第一次街道拍照的故事結果是否固定不足，或保留玩家分數影響 UI、故事仍固定逃走。
6. Unity 展覽除錯選單的直接跳轉需要還原哪些暫存照片與生命狀態。
