# 展覽版日記揭露 Unity 實作規格

最後更新：2026-08-26
狀態：展覽版 canonical 規格

這份文件只定義展覽版從黃金獵犬第一篇日記，到青蛙第三篇下段完成為止的日記揭露邏輯。Unity 版應移植這裡的狀態、順序與完成條件，不應直接照抄 React component，也不可套用正式版青蛙的地點順序。

紙張外觀、三層素材、可見留白與按鈕尺寸另見 [EXHIBITION_DIARY_PAPER_UI_STYLE_GUIDE.md](./EXHIBITION_DIARY_PAPER_UI_STYLE_GUIDE.md)。

## 一句話總結

- **黃金獵犬：一篇、單段，不分上下段。** 四片粗糙稿全部可見，拼完後先恢復上色，再讓小白淡入。
- **青蛙：三篇，每篇分上段與下段。** 上段由拼圖與地點紙膠帶完成，得到下一個地點；到該地拍到青蛙後，才揭露同一篇的下段。

```text
黃金獵犬單段
→ 青蛙第一篇上段 → 街道線索 → 街道拍照 → 第一篇下段
→ 青蛙第二篇上段 → 便利商店線索 → 便利商店拍照 → 第二篇下段
→ 青蛙第三篇上段 → 甜點店線索 → 甜點店拍照 → 第三篇下段
→ 青蛙完成
```

## 名詞與資料邊界

| 名詞 | 定義 |
| --- | --- |
| 篇 | 一個青蛙日記頁面單位。展覽版青蛙共有第一、第二、第三篇。 |
| 上段 | 該篇一開始殘缺的內容。玩家完成圖片拼圖，再把正確地點紙膠帶放入正文，才算還原。 |
| 下段 | 玩家到上段提示的地點拍到青蛙後，才在同一篇中新增的內容。 |
| 拼圖修復內容 | 玩家操作中的散落圖片、文字格、缺字輪廓與紙膠帶。 |
| 已還原日記內容 | 已完成並必須保存的上段、下段正文。重新開啟或完整閱讀時不能遺失。 |
| 地點線索 | 上段完成後才出現的獎勵 overlay，用來告訴玩家下一個拍照地點。 |

三層狀態必須分開保存：

```text
拼圖修復狀態 != 日記文字揭露狀態 != 地點線索狀態
```

完成拼圖不能自動視為已拍照；拍到青蛙也不能自動視為下一篇拼圖已完成。

## 第一篇日記：黃金獵犬

### 內容與結構

- 結構：一篇、單段。
- 正文：`睡過頭趕捷運，好不容易衝上車，卻發現大家都在看我。`
- 不使用青蛙的「上段／下段」邏輯。
- 舊 `diary-restore` 深連結中的後續正文不是展覽主線的一部分；Unity 不得把它接回正常流程。

### 固定流程

| 狀態 | 畫面與操作 | 完成條件 | 下一狀態 |
| --- | --- | --- | --- |
| `NaotaroPhotoSlide` | 拍到的黃金獵犬照片滑入日記。 | 照片演出結束。 | `NaotaroRoughPuzzle` |
| `NaotaroRoughPuzzle` | 四片都是公開的粗糙稿，不得有問號片。玩家可拖曳或點兩片交換。 | 四片順序正確。 | `NaotaroRestoreColor` |
| `NaotaroRestoreColor` | 鎖住拼圖操作，完整插圖由粗糙稿恢復成上色版；此時畫面還沒有小白。 | 上色淡入完成。 | `NaotaroRevealXiaobai` |
| `NaotaroRevealXiaobai` | 小白在上色版插圖中淡入。 | 小白淡入完成。 | `NaotaroComplete` |
| `NaotaroComplete` | 才開放「繼續」。 | 玩家按繼續。 | `post-puzzle-metro` |

Web 版目前的節奏參考：

- 拼圖完成後約 `0.36s` 開始恢復上色，恢復動畫約 `0.76s`。
- 從拼圖完成算起約 `1.18s` 開始讓小白淡入，淡入約 `0.90s`。
- 約 `2.26s` 後才開放繼續。

Unity 可以為手感微調時間，但不可改變「上色完成在前、小白淡入在後、最後才可繼續」的順序。

### 黃金獵犬禁止事項

- 不得顯示問號拼片。
- 不得拆成上段與下段。
- 不得在小白淡入前開放繼續。
- 不得完成後跳到舊 `diary-restore` 分段正文頁。
- 不得顯示青蛙式地點線索 overlay。

## 黃金獵犬到青蛙的銜接

黃金獵犬日記完成後，故事先回到捷運與當天行程。回家查看小白時：

1. 黃金獵犬日記的一格亮起並飛入小白。
2. 小白仍然沒有醒來。
3. 小貝狗提醒還有「下一篇日記」。
4. 玩家重新拿起日記，從交換日記目錄點進青蛙的殘缺篇章。

這段只是兩篇日記之間的橋接，不是黃金獵犬的下段。

## 交換日記目錄卡：Unity 視覺狀態

交換日記目錄不是另一套封面設計，而是用同一個 `967 × 684` 卡片容器切換三種純圖像狀態。卡片內不顯示篇章名稱、完成標籤或說明句，狀態必須由素材本身傳達。

| 狀態 | Unity 圖層 | 可見內容 | 禁止內容 |
| --- | --- | --- | --- |
| `Locked` | `LockCover` | Figma `12429:762` 匯出的 `diary-lock-cover.png` | 日記底圖、emoji 鎖、文字 |
| `Reveal` | `DiaryArtwork` + `RevealCover` | 下層日記圖，以及 Figma `12429:766` 匯出的透明 `diary-reveal-cover.png` | `diary-lock-cover.png`、CSS／程式多邊形、任何文字 |
| `Complete` | `DiaryArtwork` | 該篇正式完成日記圖 | Reveal／Lock 遮罩、「已完成」或篇章名稱 |

`Reveal` 的核心是兩張同尺寸圖片直接疊合：

```text
DiaryCatalogCard  (967:684)
├─ DiaryArtwork   (底層，完整撐滿)
└─ RevealCover    (上層，完整撐滿，透明開口露出底圖)
```

建議 Unity hierarchy：

```text
DiaryCatalogCard
├─ ArtworkImage
├─ RevealCoverImage
└─ LockCoverImage
```

- 三個 `Image` 共用同一個 full-stretch RectTransform，不另外加 padding。
- 容器使用 `AspectRatioFitter`，`Aspect Ratio = 967 / 684 = 1.4137427`。
- `ArtworkImage`、`RevealCoverImage`、`LockCoverImage` 的 Tint 固定純白，不以 Tint 改變設計色。
- 遮罩圖不負責互動，`Raycast Target = false`；點擊事件由最外層卡片接收。
- `RevealCoverImage` 必須排在 `ArtworkImage` 後面；Unity hierarchy 越後繪製越上層。
- 狀態切換直接控制 GameObject active，不可用同一張 cover 換色冒充另一個狀態。

### Reveal 透明素材規則

`diary-reveal-cover.png` 的左上缺口與中央撕裂開口是真實 alpha，不是灰色底，也不是要在 Unity 內再做 Mask。匯入 Unity 時：

- `Texture Type = Sprite (2D and UI)`。
- `Sprite Mode = Single`。
- `Mesh Type = Full Rect`，避免透明外框讓 Sprite rect 縮小後錯位。
- `Alpha Source = Input Texture Alpha`，並啟用 `Alpha Is Transparency`。
- UI 若出現髒邊，優先關閉壓縮或改用高品質壓縮，不可用灰色色塊蓋掉。
- `RevealCoverImage.preserveAspect = false`，因為容器已鎖定同一個 `967:684` 比例；三層應共享完全相同的 rect。

重新匯出素材時必須先驗證四角與左上開口的 alpha 為 `0`。若看到 `#BDBDBD` 灰底，代表匯出到 Figma 預覽畫布而不是透明 frame，該檔案不可進 Unity。

### 目前素材綁定

青蛙正式日記圖仍在製作，因此展覽版第二張 `Reveal` 卡暫時使用黃金獵犬完成日記圖作為 `DiaryArtwork`。這只是資料綁定，不是版面特例：正式青蛙圖完成後只替換底層 artwork reference，`RevealCover`、比例與 hierarchy 都不變。

卡片狀態切換順序：

```text
Locked
→ 收到篇章浮現事件
→ Reveal（移除 LockCover，顯示日記底圖與透明 RevealCover）
→ 該篇完整還原
→ Complete（移除 RevealCover，只留正式完成圖）
```

不要在 `Locked → Reveal` 之間同時顯示兩張 cover；否則透明開口仍會被 lock 圖遮住，看起來像 reveal 沒有作用。

## 青蛙前置紙膠帶頁：Unity 容器

這一頁是青蛙日記特有的前置互動，但仍由日記的單一紙張承載。Unity hierarchy 不得在 `ActivePaper` 裡再建立第二個白色 page panel：

```text
FrogBookmarkPage
├─ DotBackdrop
├─ PaperStack
│  ├─ BackPage3
│  ├─ BackPage2
│  └─ BackPage1
└─ ActivePaper                 (front 三切片紙張)
   └─ WashiInteractionRoot     (透明內容層)
      ├─ PaperPattern
      ├─ WashiTapes
      ├─ MovableBookmark
      └─ OpenDiaryButton       (完成後才 active)
```

- `ActivePaper` 與黃金獵犬頁共用相同三切片素材、位置與右側無縫裁切方式。
- `WashiInteractionRoot` 不設定白色 Image、Outline、圓角或 Shadow；它不是第二張紙。
- 這個前置頁不建立日期／天氣 header，也不建立 `03 / 14` 裝飾日期。
- 不建立 Back button；流程唯一出口是完成三張正確紙膠帶後出現的 `OpenDiaryButton`。
- 紙面內容 inset 對應 Web 為左 `14px`、右 `32px`、上 `14px`、下 `20px`；Unity 應按 reference resolution 等比換算。
- 紙膠帶、書籤與槽位都在同一個 `WashiInteractionRoot` 座標系中，換紙張素材不得改變拖放判定或答案資料。
- `PaperStack` 是三張裝飾背頁，不計入可互動日記頁數；可互動頁永遠只有 `ActivePaper` 一張。

## 展覽版青蛙全日記：Unity 容器

青蛙日記進入拼圖後仍沿用同一個 `ActivePaper`。Unity 不應為每個狀態 instantiate 另一個帶底色、外框或陰影的 page prefab；只切換紙面內的內容 root：

```text
FrogDiaryPage
├─ DotBackdrop
├─ PaperStack
│  ├─ BackPage3
│  ├─ BackPage2
│  └─ BackPage1
└─ ActivePaper                     (黃金獵犬同款 front 三切片)
   └─ ContentViewport              (透明，固定 inset)
      ├─ BookmarkIntroRoot         (前置紙膠帶狀態)
      ├─ PuzzleRoot                (上段拼圖狀態)
      ├─ RevealRoot                (照片／下段浮出狀態)
      └─ RestoredRoot              (完整閱讀狀態)
```

- 四個內容 root 同一時間只 active 一個，且都不可包含白色 page Image、條紋底、Outline、圓角外框或 Shadow。
- 展覽版 `FrogDiaryPage` 不建立 DateWeatherHeader，也不建立 BackButton；這條規則涵蓋三篇拼圖、揭露與完整閱讀。
- `???`／`搬家` 是 `ContentViewport` 內的普通標題文字，不使用滿寬棕色色帶。
- `ContentViewport` 與 Web 一致使用左 `14px`、右 `32px`、上 `14px`、下 `20px` 的等比 inset；互動元件只在這個座標系內排版。
- `PuzzleRoot`、`RevealRoot`、`RestoredRoot` 共用同一份篇章資料與狀態；換 root 不能重設拼圖答案、地點、上下段文字或拍照進度。
- `ContinueButton` 由當前狀態的完成條件控制 active；未完成時不要以 disabled 物件佔位。
- 翻頁時只對 `ActivePaper` 與其目前 active 的內容 root 做旋轉，`PaperStack` 三層永遠留在原位。

## 青蛙日記的共通循環

青蛙三篇共同組成同一個〈搬家〉故事，但每篇都有各自的上段與下段。Unity runtime 應把每篇資料分成 `upperText`、`lowerText` 與 `fullText`。

```text
進入第 N 篇上段拼圖
→ 完成圖片拼圖
→ 同一張地點書籤浮出
→ 把正確地點紙膠帶拖入正文輪廓
→ 上段完成
→ 顯示地點線索 overlay
→ 離開日記並前往該地
→ 拍到青蛙
→ 照片滑入日記，拍照進度 +1
→ 該篇圖片缺片補回
→ 該篇下段以青綠色浮出
→ 標題由 ??? 解析成「搬家」
→ 下段沉回一般日記色
→ 才開放「繼續」
→ 前兩篇進入下一篇上段；第三篇完成青蛙流程
```

拍照後的揭露畫面可以聚焦顯示「第 N 篇・第二段」，不必重播上段演出；但資料狀態必須保留上段。重新開啟日記、目錄預覽或完整閱讀時，必須使用 `fullText = upperText + lowerText`，不能只剩本次浮出的下段。

## 青蛙入口：地點書籤取得

第一次打開青蛙殘篇時，還沒有拍到青蛙，照片進度為 `0/3`。

1. 玩家先從日記封面進入交換日記目錄。
2. 目錄以 `Reveal` 圖像狀態顯示青蛙殘篇；卡片本身不寫「殘缺篇章」。
3. 點入後先進滿版紙膠帶／書籤解謎，不先顯示第一篇正文。
4. 玩家找出並親手貼上 `街道`、`便利商店`、`甜點店` 三張地點紙膠帶。
5. 三張都貼到同一張書籤後，才可翻開日記。
6. 之後三篇都沿用這張書籤；已使用的紙膠帶在原位留下同形膠痕，不得重新生成一套選項。

## 青蛙三篇內容與觸發

### 完整對照

| 篇章 | 上段拼圖完成內容 | 上段使用紙膠帶／獲得線索 | 拍照地點與進度 | 拍照後揭露的下段 | 完成後 |
| --- | --- | --- | --- | --- | --- |
| 第一篇 | `今天和小麥請了搬家公司搬家。`<br>`整理到一半，街道突然一陣騷動。` | `街道` | 街道，`0/3 → 1/3` | `原來有人玩球時不小心撞上發傳單的人，傳單瞬間散了一地。`<br>`我和小麥只好先放下手邊的事，一起幫忙把傳單撿回來。` | 按繼續進第二篇上段拼圖。 |
| 第二篇 | `幫忙把傳單撿回來後，我們總算能繼續搬家。`<br>`回到客廳，看到桌上有幾瓶便利商店飲料，` | `便利商店` | 便利商店，`1/3 → 2/3` | `我以為是小麥買的，就很自然地全部喝掉了。` | 按繼續進第三篇上段拼圖。 |
| 第三篇 | `搬家告一段落後，才發現原來客廳裡的飲料，是搬家工人的。`<br>`我就帶著小麥去最近新開的甜點店，` | `甜點店` | 甜點店，`2/3 → 3/3` | `買了布丁和紅茶當作賠罪，也順便感謝今天的幫忙。` | 青蛙正式收集，完成〈搬家〉並進展覽收尾。 |

### 第一篇

```text
第一篇上段拼圖
→ 玩家填入「街道」
→ 獲得線索「街道」
→ 隔天在街道第一次拍到青蛙
→ 照片進日記，青蛙仍以剪影／未完全收集狀態呈現
→ 第一篇下段浮出
→ 繼續進第二篇上段
```

### 第二篇

```text
第二篇上段拼圖
→ 玩家填入「便利商店」
→ 獲得提示「便利商店」
→ 在便利商店第二次拍到青蛙
→ 照片進日記，青蛙仍以剪影／未完全收集狀態呈現
→ 第二篇下段浮出
→ 繼續進第三篇上段
```

### 第三篇

```text
第三篇上段拼圖
→ 玩家填入「甜點店」
→ 獲得提示「甜點店」
→ 在甜點店第三次拍到青蛙
→ 照片進日記，青蛙由剪影變成正式收集圖
→ 第三篇下段浮出
→ 完成〈搬家〉
→ 直接進展覽版 home-final 收尾
```

展覽版在青蛙完成後不進入正式版的下一篇無尾熊流程。

## Unity 建議狀態機

### 流程狀態

```text
NaotaroPhotoSlide
NaotaroRoughPuzzle
NaotaroRestoreColor
NaotaroRevealXiaobai
NaotaroComplete

FrogBookmarkPuzzle
FrogPage1UpperPuzzle
FrogPage1Clue
AwaitStreetPhoto
FrogPage1PhotoSlide
FrogPage1LowerReveal
FrogPage2UpperPuzzle
FrogPage2Clue
AwaitConveniencePhoto
FrogPage2PhotoSlide
FrogPage2LowerReveal
FrogPage3UpperPuzzle
FrogPage3Clue
AwaitDessertPhoto
FrogPage3PhotoSlide
FrogPage3LowerReveal
FrogComplete
```

`Await*Photo` 代表日記暫時關閉，控制權回到展覽主流程；它不是一個日記 overlay 畫面。

### Runtime 必須保存的狀態

```text
frogPhotoCount: 0..3
frogUpperPuzzleCompleted[3]
frogClueConfirmed[3]
frogLowerRevealed[3]
usedLocationTapeIds
currentDiaryFlowState
```

不得只用 `frogPhotoCount` 推算所有狀態。直接跳轉、取消動畫或重新開啟日記時，拼圖完成、線索確認與下段揭露可能位於不同時間點。

### 建議資料結構

```csharp
[Serializable]
public sealed class ExhibitionFrogDiaryPageDefinition
{
    public string PageId;
    public int PageIndex;
    public string Title;
    public string UpperPromptText;
    public string UpperRestoredText;
    public string LowerRevealText;
    public string FullText;
    public string RequiredLocationTapeId;
    public string ClueLabel;
    public string PhotoLocationId;
    public int PhotoCountAfterCapture;
    public string PuzzleImageAddress;
    public string RestoredImageAddress;
}
```

頁面順序必須由三筆展覽資料明確定義為 `街道 → 便利商店 → 甜點店`，不可把正式版預設順序搬進 Unity，也不可只根據照片次數硬猜地點。

## 按鈕與動畫完成條件

- 拼圖未完成：不顯示或不啟用繼續。
- 圖片拼圖完成但紙膠帶尚未填入：仍不可繼續。
- 紙膠帶正確填入：上段完成，才可開線索 overlay。
- 下段揭露中：繼續保持鎖定。
- 圖片缺片、下段文字與標題揭露全部完成：才開放繼續。
- 動畫被跳過時，必須把所有最終狀態一次落定，再送出完成事件；不可只取消 coroutine 留下半完成畫面。

## 展覽版不可破壞的規則

1. 黃金獵犬沒有上下段；青蛙才有三篇上下段。
2. 黃金獵犬四片粗糙稿全部公開，不得有問號片。
3. 黃金獵犬固定是「粗糙稿 → 上色 → 小白淡入」。
4. 青蛙固定是 `街道 → 便利商店 → 甜點店`。
5. 青蛙每篇上段只由拼圖與紙膠帶完成；下段只由對應地點的照片觸發。
6. 拼圖頁不得提前顯示該篇下段。
7. 拍照揭露頁不得重播上段動畫，但完整內容資料仍須保留上下段。
8. 第一、第二次照片只能顯示青蛙剪影或未完整狀態；第三次才顯示正式收集圖。
9. 地點線索只在上段完成後出現；下段揭露完成後直接前往下一篇，不再重複同一個線索。
10. 第三篇下段完成後進展覽收尾，不進無尾熊篇。

## Web 對照位置

| 責任 | Web 實作 |
| --- | --- |
| 黃金獵犬四片粗糙稿、上色與小白淡入 | `src/components/game/DiaryOverlay.tsx` 的 `ExhibitionIncompleteBaiEntry1DiaryPuzzle` |
| 展覽版青蛙三篇正文 | `src/lib/game/frogDiaryClueFlow.ts` 的 `FROG_MOVING_DIARY_STREET_FIRST_FRAGMENT` |
| 青蛙上段拼圖、下段揭露與線索 overlay | `src/components/game/DiaryOverlay.tsx` 的 `frogDiaryLocationOrder === "street-first"` 分支 |
| 目錄卡 `Locked / Reveal / Complete` 視覺切換 | `src/components/game/DiaryOverlay.tsx` 的 `data-exhibition-diary-catalog-reveal-art` 區塊 |
| Reveal 透明遮罩 | `public/images/diary/catalog/diary-reveal-cover.png` |
| Lock 完整封面 | `public/images/diary/catalog/diary-lock-cover.png` |
| 0／1／2／3 次照片與展覽 phase 串接 | `src/components/game/ExhibitionExperienceView.tsx` |
| 主線文字與 phase | `src/lib/game/exhibitionFlow.ts` |

## Unity 驗收清單

### 交換日記目錄

- 所有卡片維持 `967:684`，三個狀態切換時尺寸不跳動。
- `Locked` 只顯示 lock 完整封面，不顯示 emoji 或文字。
- `Reveal` 由底層日記圖與上層透明 reveal cover 組成，左上開口能直接看到底圖。
- Reveal 素材沒有灰色背景、白邊或因 Tight mesh 造成的位移。
- Reveal 卡沒有「殘缺篇章」、「搬家」、「只浮現第一格」等文字。
- `Complete` 只顯示正式完成日記圖，不殘留 reveal 或 lock cover。
- 青蛙正式圖替換後只更換 artwork reference，遮罩與 hierarchy 不變。

### 黃金獵犬

- 四片一開始都是粗糙稿，沒有問號。
- 拼完後先看到沒有小白的上色圖。
- 接著小白才淡入。
- 動畫全部完成前不能繼續。
- 整段沒有第二段正文或地點線索。

### 青蛙

- 第一次開啟先取得同一張含三個地點的書籤。
- 第一篇上段完成後只得到街道線索，下段尚未出現。
- 街道拍照後才出現第一篇下段，並進第二篇上段。
- 第二篇上段完成後只得到便利商店線索。
- 便利商店拍照後才出現第二篇下段，並進第三篇上段。
- 第三篇上段完成後只得到甜點店線索。
- 甜點店拍照後才出現第三篇下段與完整青蛙。
- 任一完整閱讀狀態都保留已揭露的上段與下段。
- 第三篇完成後直接進展覽收尾。
