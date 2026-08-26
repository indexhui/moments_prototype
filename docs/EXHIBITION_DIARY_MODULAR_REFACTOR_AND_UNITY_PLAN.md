# 展覽版日記模組化重構與 Unity 移植計畫

最後更新：2026-08-26
狀態：規劃中，尚未開始搬移程式
適用範圍：展覽版黃金獵犬日記、青蛙三篇日記，以及之後沿用同一套紙張 UI 的交換日記

相關文件：

- [展覽版日記紙張 UI 規範](./EXHIBITION_DIARY_PAPER_UI_STYLE_GUIDE.md)
- [展覽版日記揭露 Unity 規格](./EXHIBITION_DIARY_REVEAL_UNITY_SPEC.md)
- [青蛙日記揭露拼圖流程](./FROG_DIARY_REVEAL_PUZZLE_FLOW.md)
- [Figma UI 落地規則](./FIGMA_UI_INTEGRATION_RULES.md)

## 1. 目標

目前展覽版日記已經逐步統一成同一套外觀，但程式仍以多個專用元件與布林參數維持一致。這次重構的目標是讓「一致」成為結構保證，而不是靠每一頁人工記得套相同 CSS。

必須同時達成：

1. 所有展覽版日記共用同一個紙張外殼、三層背頁、內容 inset、按鈕尺寸與翻頁演出。
2. 每種日記拼圖可以保留自己的玩法、狀態與完成條件。
3. 日記正文可自然支援單段、兩段，未來也能支援三段以上。
4. 拼圖修復內容、已還原正文、線索獎勵必須分開。
5. Web 與 Unity 共用相同的資料語意與狀態順序，但不互相照抄 UI 實作。
6. 重構期間不可改變現有展覽流程、文案、答案、解鎖順序或視覺結果。

## 2. 目前結構的風險

主要程式集中在 [`DiaryOverlay.tsx`](../src/components/game/DiaryOverlay.tsx)，目前超過 23,000 行，同時負責：

- 紙張外觀與翻頁。
- 交換日記目錄。
- 各篇日記資料。
- 各種拼圖實作。
- 揭露計時器。
- 線索 overlay。
- 小日獸圖鑑與引導。
- 多個入口的流程判斷。

目前幾個明顯風險：

- `usePaperFrameTrialAssets` 已經從「試驗旗標」變成正式展覽樣式開關。
- `embeddedInPaperFrame` 必須一路傳入多個內容元件，代表紙張責任仍洩漏到拼圖內部。
- `VisualDiaryBookPage` 同時處理紙張、slide、scroll、拼圖、文字、按鈕與 accessory。
- 青蛙日記在直接流程與目錄入口有近似的重複 render 分支，容易只修到其中一邊。
- `imageRevealed`、`textRevealed`、`titleRevealed` 與多個 `shouldPlay...` 布林值可能形成不合法組合。
- 公雞、山羊、海豹、浣熊、貓等 reveal page 有大量相似 JSX，但仍各自維護外框、標題、圖片、文字與按鈕。
- 底部行動按鈕目前混有 `42px`、`44px`、`56px`，日後容易再次視覺漂移。

## 3. 核心設計原則

### 3.1 模組化單位不是角色

不要繼續建立：

```text
GoldenRetrieverDiaryPage
FrogDiaryPage
ChickenDiaryPage
GoatDiaryPage
...
```

建議拆成：

```text
共用紙張外殼
+ 共用內容槽位
+ 可替換拼圖模組
+ 資料化文字段落
+ 日記流程狀態機
```

角色或篇章只提供資料與流程設定，不再擁有另一套紙張結構。

### 3.2 紙張是裝飾層，不是拼圖的一部分

只有 `ExhibitionDiaryShell` 可以畫：

- 點點介面背景。
- 三層錯位背頁。
- 最前方紙張素材。
- 紙張陰影。
- 翻頁正反面。
- 紙面內容裁切區。

所有拼圖與 reveal 元件都只能輸出透明內容，不得自行新增白底、條紋、border、圓角或第二組陰影。

### 3.3 拼圖修復、正文、獎勵分層

```text
PuzzleRepairContent
!= RestoredDiaryContent
!= RewardOverlay
```

- 拼圖完成只更新修復進度。
- 還原頁負責圖片、段落、標題的揭露。
- 線索只在玩家讀完還原頁並按下繼續後出現。

## 4. Web 目標結構

```text
DiaryOverlay
└─ ExhibitionDiaryShell
   └─ DiaryFlowHost
      └─ DiaryPageLayout
         ├─ DiaryTitleSlot
         ├─ DiaryArtworkSlot
         ├─ DiaryPuzzleHost
         ├─ DiaryTextSegments
         ├─ DiaryAccessorySlot
         ├─ DiaryActionSlot
         └─ DiaryRewardOverlay
```

### 4.1 建議檔案配置

```text
src/components/game/diary/
├─ shell/
│  ├─ ExhibitionDiaryShell.tsx
│  ├─ ExhibitionDiaryPaperStack.tsx
│  ├─ ExhibitionDiaryPageTurn.tsx
│  └─ exhibitionDiaryTokens.ts
├─ page/
│  ├─ DiaryPageLayout.tsx
│  ├─ DiaryTitle.tsx
│  ├─ DiaryArtwork.tsx
│  ├─ DiaryTextSegments.tsx
│  ├─ DiaryActionSlot.tsx
│  └─ DiaryRevealStage.tsx
└─ puzzles/
   ├─ DiaryPuzzleHost.tsx
   ├─ SliceSwapPuzzle.tsx
   ├─ LayerOrderPuzzle.tsx
   ├─ WashiBookmarkPuzzle.tsx
   └─ StickyObstructionPuzzle.tsx

src/lib/game/diary/
├─ types.ts
├─ diaryFlowReducer.ts
├─ diaryDefinitionValidation.ts
└─ entries/
   ├─ goldenRetrieverDiary.ts
   ├─ frogDiary.ts
   ├─ chickenDiary.ts
   └─ ...
```

UI 與純資料分開，讓 Unity 能對照 `src/lib/game/diary` 的語意，而不必閱讀 React JSX。

## 5. 日記資料模型

### 5.1 篇章與頁面

```ts
type DiaryEntryDefinition = {
  id: string;
  title: string;
  pages: readonly DiaryPageDefinition[];
  flow: readonly DiaryFlowStep[];
};

type DiaryPageDefinition = {
  id: string;
  artwork: DiaryArtworkDefinition;
  segments: readonly [DiaryTextSegment, ...DiaryTextSegment[]];
  puzzle?: DiaryPuzzleDefinition;
  reward?: DiaryRewardDefinition;
  accessory?: DiaryAccessoryDefinition;
  layoutPreset?: DiaryPageLayoutPreset;
};
```

`segments` 使用至少一項的 tuple，避免建立沒有正文的日記頁。

### 5.2 單段與多段

不要再用 `hasSecondSegment` 或 `secondSegmentOnly` 控制資料結構。

```ts
type DiaryTextSegment = {
  id: string;
  text: string;
  visibleFrom: "initial" | "after-puzzle" | "after-photo";
  revealStyle?: "none" | "teal-rise";
  separatorBefore?: "none" | "line-break" | "paragraph";
};
```

單段日記：

```ts
segments: [
  {
    id: "body",
    text: "睡過頭趕捷運……",
    visibleFrom: "after-puzzle",
  },
]
```

兩段日記：

```ts
segments: [
  {
    id: "upper",
    text: "已經恢復的前半段……",
    visibleFrom: "initial",
  },
  {
    id: "lower",
    text: "拍照後才浮出的後半段……",
    visibleFrom: "after-photo",
    revealStyle: "teal-rise",
    separatorBefore: "line-break",
  },
]
```

完整閱讀文字由固定 helper 依段落順序組合。不得在揭露第二段時覆寫或遺失第一段。

### 5.3 拼圖資料

使用 discriminated union，讓每種玩法保有自己的設定：

```ts
type DiaryPuzzleDefinition =
  | SliceSwapPuzzleDefinition
  | LayerOrderPuzzleDefinition
  | WashiBookmarkPuzzleDefinition
  | StickyObstructionPuzzleDefinition;

type SliceSwapPuzzleDefinition = {
  kind: "slice-swap";
  pieceCount: number;
  initialOrder: readonly number[];
  solvedOrder: readonly number[];
  questionPieceId?: number;
};

type LayerOrderPuzzleDefinition = {
  kind: "layer-order";
  layers: readonly DiaryLayerDefinition[];
  solvedOrder: readonly number[];
};

type WashiBookmarkPuzzleDefinition = {
  kind: "washi-bookmark";
  tapes: readonly WashiTapeDefinition[];
  slots: readonly BookmarkSlotDefinition[];
  correctTapeIds: readonly string[];
};
```

`DiaryPuzzleHost` 只依 `kind` 選擇 renderer。新增玩法時增加新的 definition 與 renderer，不修改現有拼圖。

## 6. 流程狀態機

以單一 discriminated union 取代互相依賴的 reveal booleans：

```ts
type DiaryFlowStage =
  | { kind: "prelude-puzzle"; puzzleId: string }
  | { kind: "page-puzzle"; pageId: string }
  | { kind: "location-fill"; pageId: string; locationId: string }
  | { kind: "restoring-image"; pageId: string }
  | { kind: "revealing-segment"; pageId: string; segmentId: string }
  | { kind: "resolving-title"; pageId: string }
  | { kind: "reading"; pageId: string }
  | { kind: "reward"; rewardId: string }
  | { kind: "complete" };
```

狀態機必須保證：

- 不可能在圖片尚未恢復前先顯示完成標題。
- 不可能在標題尚未落定前顯示繼續。
- 不可能在還原頁尚未讀完前顯示線索。
- 單段日記可直接略過 `revealing-segment`。
- 多段日記只揭露本次新增的段落，先前段落保持可見。

## 7. 外觀一致的強制方式

### 7.1 共用 tokens

```ts
export const exhibitionDiaryTokens = {
  paperPosition: { left: 27, right: -18, top: 72, bottom: 22 },
  contentInset: { left: 14, right: 32, top: 14, bottom: 20 },
  titleHeight: 44,
  actionHeight: 42,
  actionBottom: 20,
  contentGap: 18,
  titleColor: "#83654E",
  revealColor: "#668985",
  actionColor: "#806248",
} as const;
```

各拼圖只能選擇 `layoutPreset`，不可自行覆寫整套紙張尺寸。

建議 preset：

- `standard-puzzle`
- `scrolling-text`
- `bookmark-board`
- `restored-reading`

### 7.2 內容元件契約

所有放進 `ExhibitionDiaryShell` 的 root 必須：

- `background: transparent`
- `border: 0`
- `box-shadow: none`
- 填滿 `ContentViewport`
- 不包含日期、天氣、返回按鈕
- 不自行建立紙張或背頁

開發模式可加 `data-diary-content-root`，供瀏覽器驗收檢查。

## 8. 重構執行順序

### Phase 0：建立回歸基準

- 為黃金獵犬與青蛙每個主要 stage 保存 `428 × 852` 截圖。
- 記錄一張前頁、三張背頁、按鈕、標題與內容位置。
- 建立流程測試，鎖住目前答案與狀態順序。

完成條件：未修改架構前，所有測試可重複執行。

### Phase 1：抽出紙張外殼

- 移出 `ExhibitionDiaryShell`、紙張素材層、背頁與翻頁。
- 移出 `exhibitionDiaryTokens`。
- 黃金獵犬與青蛙改用同一個 shell。
- 內容仍用 adapter 包住現有元件，暫時不改玩法。

完成條件：畫面 pixel result 不變；紙張只由 shell 建立一次。

### Phase 2：抽出共用頁面槽位

- 建立 `DiaryPageLayout`。
- 統一 title、artwork、text、accessory、action、overlay slot。
- 統一按鈕高度與內容 inset。
- 移除內容元件內的紙張 CSS。

完成條件：移除 `embeddedInPaperFrame`。

### Phase 3：抽出通用 reveal stage

- 先搬黃金獵犬與青蛙。
- 再搬公雞、山羊、海豹等高度重複 reveal page。
- 特殊文字排版以 `textRenderer` 或 accessory slot 注入，不複製整頁。

完成條件：圖片 → 新段落 → 標題 → 繼續的節奏由單一元件控制。

### Phase 4：建立 Puzzle Host

- 一次搬一種拼圖。
- 先搬 `slice-swap`，再搬 `layer-order`、`washi-bookmark`、`sticky-obstruction`。
- 每種 puzzle 保留自己的 reducer 與完成條件。
- 既有拼圖先透過 adapter 接入，不要求同時重寫互動。

完成條件：拼圖元件不再知道外層是展覽紙張或正式版頁面。

### Phase 5：資料化日記與流程

- 建立 `DiaryEntryDefinition`。
- 青蛙單一 flow controller 同時服務展覽直接流程與目錄入口。
- 移除重複 JSX render branch。
- 以 `DiaryFlowStage` 取代 `shouldPlay...` 組合。

完成條件：新增日記只需新增資料、選擇 puzzle kind 與必要的特殊 renderer。

### Phase 6：清理舊旗標

- `usePaperFrameTrialAssets` 改為明確的 shell 選擇，最後移除。
- 移除 `embeddedInPaperFrame`。
- 移除不再需要的角色專用 reveal page。
- 更新 Web／Unity 文件與 scene jump 測試。

## 9. Web 驗收矩陣

每一篇至少測試：

| 類別 | 必測狀態 |
| --- | --- |
| 外觀 | 進場翻頁、靜止、長內容捲動、完成按鈕 |
| 拼圖 | 初始、交換中、剛完成、完成後 accessory |
| 單段 | 完成前、圖片恢復、標題落定、繼續 |
| 多段 | 前段保留、後段未出現、後段青綠浮出、沉回紙色 |
| 線索 | 還原頁之前不可見、按繼續後才顯示 |
| 容器 | 一張前頁、三張背頁、無第二層紙張、無日期與返回 |

自動檢查至少包含：

- `[data-exhibition-diary-paper="true"]` 數量為 `1`。
- `[data-paper-frame-stack-layer]` 數量為 `3`。
- `ContentViewport` 內沒有額外紙張背景或 border。
- 未完成時沒有 action button。
- 單段資料不產生空白 reveal placeholder。
- 多段揭露後完整正文包含所有既有段落。

---

# Unity 移植方案

## 10. Unity UI 技術選擇

建議先以 **uGUI + Canvas + TextMeshPro** 作為展覽版實作基準：

- 現有拼圖大量使用拖曳、交換、absolute overlay 與可移動書籤，uGUI 的 `RectTransform`、`GraphicRaycaster`、`IBeginDragHandler`／`IDragHandler`／`IEndDragHandler` 比較直接。
- 日記頁面適合做成 Prefab，拼圖玩法適合做成 child prefab。
- 翻頁需要 3D pivot 或自訂 shader，uGUI 放在 `Screen Space - Camera` 較容易建立透視。

若 Unity 專案已全面採用 UI Toolkit，可保留同一份資料與 flow controller，只替換 View；不要讓選擇 UI 技術改變日記狀態語意。

## 11. Unity 模組結構

```text
DiaryFeature
├─ Runtime/
│  ├─ Data/
│  │  ├─ DiaryEntryDefinitionSO
│  │  ├─ DiaryPageDefinitionSO
│  │  ├─ DiaryTextSegmentData
│  │  └─ DiaryPuzzleDefinitionSO
│  ├─ Flow/
│  │  ├─ DiaryFlowController
│  │  ├─ DiaryFlowState
│  │  └─ DiaryProgressStore
│  ├─ View/
│  │  ├─ ExhibitionDiaryShellView
│  │  ├─ DiaryPageView
│  │  ├─ DiaryRevealView
│  │  └─ DiaryRewardOverlayView
│  └─ Puzzles/
│     ├─ IDiaryPuzzleController
│     ├─ SliceSwapPuzzleController
│     ├─ LayerOrderPuzzleController
│     ├─ WashiBookmarkPuzzleController
│     └─ StickyObstructionPuzzleController
└─ Prefabs/
   ├─ ExhibitionDiaryShell.prefab
   ├─ DiaryPageView.prefab
   └─ Puzzles/
```

### 11.1 Controller 與 View 分離

```csharp
public interface IDiaryPuzzleController
{
    bool IsComplete { get; }
    event Action Completed;
    void Initialize(DiaryPuzzleContext context);
    DiaryPuzzleSaveData CaptureState();
    void RestoreState(DiaryPuzzleSaveData state);
}
```

- Controller 負責答案、交換、完成判斷與存檔。
- View 負責 RectTransform、Sprite、TMP 與動畫。
- Shell 不知道拼圖答案。
- Puzzle 不知道紙張素材。
- Flow Controller 只接收 `Completed` 並決定下一個 stage。

### 11.2 Unity 資料

建議先用 ScriptableObject 建立篇章資料，runtime progress 另存成純 serializable data：

```csharp
[Serializable]
public sealed class DiaryTextSegmentData
{
    public string id;
    [TextArea] public string text;
    public DiarySegmentVisibility visibleFrom;
    public DiarySegmentRevealStyle revealStyle;
}
```

拼圖設定可用每種玩法各一個 `DiaryPuzzleDefinitionSO` subclass，避免在 Inspector 出現大量不適用欄位。

Progress 必須分開保存：

```text
PuzzleProgress
TextRevealProgress
RewardProgress
```

不可只存單一 `isDiaryComplete`。

## 12. Unity 紙張背景：9-slice 還是三段式？

### 12.1 「四邊法」的正確名稱

Unity 常見做法是 **9-slice／九宮格切片**。

在 Sprite Editor 設定四個 Border：

```text
Left / Right / Top / Bottom
```

四個 Border 把圖片分成：

```text
四個固定角 + 四條可伸縮邊 + 一個中央區域 = 九區
```

所以它不是四張邊圖，而是用四個邊界值定義九個區域。

Unity 官方說明：

- [Unity 6：9-slice 概念](https://docs.unity3d.com/cn/6000.0/Manual/sprite/9-slice/9-slice-landing.html)
- [Unity：Sliced 與 Tiled 的差異](https://docs.unity3d.com/cn/2018.4/Manual/9SliceSprites.html)
- [UI Toolkit 9-slice](https://docs.unity3d.com/ja/2022.3/Manual/UIE-9-slice-images-with-ui-toolkit.html)

### 12.2 適用判斷

| 素材 | 建議方法 | 原因 |
| --- | --- | --- |
| 一般圓角面板、按鈕 | 9-slice `Sliced` | 保留四角，邊與中心可伸縮。 |
| 規律布紋、格紋 | 9-slice `Tiled` | 細節重複，不被拉長。 |
| 單純白紙、邊緣規則 | 9-slice `Sliced` | 素材少、尺寸彈性高。 |
| 手繪不規則紙邊 | 三段式或獨立 edge sprites | 避免自然起伏被縱向拉長。 |
| 本專案目前日記紙 | **保留 top + repeat + bottom 三段式** | Web 正式素材就是依這個目的製作，且每張背頁有不同中段起伏。 |

### 12.3 本專案不建議直接改成單張 9-slice

目前紙張素材位於：

```text
public/images/diary/paper-frame/
├─ card_top.svg
├─ card_repeat.svg
├─ card_bottom.svg
├─ left-page-back-1-*.svg
├─ left-page-back-2-*.svg
└─ left-page-back-3-*.svg
```

Web 實作明確使用：

```text
Top Cap + Repeat Body + Bottom Cap
```

這樣做的原因：

- 上緣與下緣各自保留自然撕紙曲線。
- 中段左邊緣有低頻率起伏，不是筆直線。
- 三張背頁各自使用不同曲線，避免看起來像三條平行直線。
- 右側刻意延伸到畫面外，不需要顯示右側紙縫。

若把它直接壓成一張 `Sliced`：

- 中段左邊緣會被拉長，波形可能變得太平或太長。
- 三層背頁容易重新變成相似直線。
- 上下紙邊的自然高度可能因不同裝置比例而改變。

### 12.4 Unity 建議 Prefab

```text
ExhibitionDiaryShell
├─ DotBackdrop
├─ PaperClipViewport                 RectMask2D
│  ├─ BackPage3                      translate(-10, 10)
│  │  ├─ RepeatBody
│  │  ├─ TopCap
│  │  └─ BottomCap
│  ├─ BackPage2                      translate(-7, 7)
│  │  └─ ...
│  ├─ BackPage1                      translate(-3, 3)
│  │  └─ ...
│  └─ ActivePaper                    pivot = (1, 0.5)
│     ├─ RepeatBody
│     ├─ TopCap
│     ├─ BottomCap
│     ├─ ContentViewport             透明內容層
│     └─ BackFace                    翻頁時使用
└─ MenuButton
```

定位以 Web reference `428 × 852` 為基準：

```text
ActivePaper left   = 27
ActivePaper right  = -18
ActivePaper top    = 72
ActivePaper bottom = 22

Content left   = 14
Content right  = 32
Content top    = 14
Content bottom = 20
```

`CanvasScaler` 建議：

```text
UI Scale Mode     = Scale With Screen Size
Reference         = 428 × 852
Screen Match Mode = Match Width Or Height
Match             = 0.5 起始，再依展覽裝置校正
```

若展覽硬體比例固定，可把 reference resolution 與安全區確定後鎖定，降低紙邊因極端比例產生的變形。

### 12.5 三段素材在 Unity 的 Image 設定

素材建議從 SVG 匯出透明 PNG；若 Unity 專案已正式採用 Vector Graphics package，才保留 SVG 流程。

共通 Import Settings：

```text
Texture Type         = Sprite (2D and UI)
Sprite Mode          = Single
Mesh Type            = Full Rect
Alpha Is Transparency = On
Wrap Mode            = Clamp（Top／Bottom）
Compression          = None 或 High Quality
```

`TopCap`／`BottomCap`：

- `Image.Type = Simple`。
- 水平 full stretch。
- 高度依原始比例固定；不要跟著整張紙垂直拉伸。
- `Raycast Target = false`。

`RepeatBody`：

- 第一版可用 `Image.Type = Simple` 填滿中段，因展覽比例固定且素材本身接近目標高度。
- 若要支援高度差異很大的裝置，優先改成「垂直重複、不水平重複」的專用 View／shader，或把左紙邊拆成窄條 sprite 再做垂直 tiled。
- 不建議直接讓整張 496px 寬素材在 X、Y 雙向 Tiled。
- `Raycast Target = false`。

所有紙張圖層應放進同一個 SpriteAtlas，降低材質切換與 draw call。

## 13. Unity 右側無縫與裁切

目前是左半本日記，右側紙張刻意超出可見畫面：

- `ActivePaper` 右側 offset 保留負值。
- `PaperClipViewport` 負責裁掉畫面外區域。
- 不要在紙張右側再加 border、shadow 或第二張 edge sprite。
- `ContentViewport` 的右 inset 要包含被裁掉的紙寬，不能只做左右對稱 padding。

若 `RectMask2D` 同時裁掉左側背頁或陰影，應把裁切層放在更外層，只裁手機舞台邊界，不裁 `PaperStack` 自己的錯位範圍。

## 14. Unity 翻頁演出

三張背頁必須放在旋轉容器之外，只有 `ActivePaper` 旋轉。

建議：

```text
ActivePaper pivot = (1, 0.5)
Canvas Render Mode = Screen Space - Camera
```

流程：

1. `ActivePaper` 從 `Y = 0°` 旋轉。
2. 正面接近 `90°` 時切換到 `BackFace`。
3. 背面使用同一套紙張素材，不可退回矩形白底。
4. 翻頁陰影跟著角度改變，但背後三張紙保持靜止。
5. 動畫完成後才開放 `ContentViewport` raycast。

若 uGUI 的平面旋轉無法達到足夠的透視，可選：

- `Screen Space - Camera` + perspective camera。
- 自訂 UI mesh／page-turn shader。
- 先用簡化的 scale／skew transition，但狀態與 hierarchy 不變。

不要把 PaperStack 放進同一個 Animator 後一起旋轉。

## 15. Unity 拼圖 Prefab 契約

每種 puzzle prefab 只接收：

- 自己的 definition。
- 自己的 progress state。
- `ContentViewport` 尺寸。
- 完成 callback。

不得接收：

- 紙張 sprite。
- 背頁數量。
- 日期／天氣。
- 外層返回按鈕。
- 整個 DiaryFlowController。

拖曳中的物件建議暫時移到 `DragOverlay`，避免被原本 layout group 或 mask 改變座標；放下後再轉回 `ContentViewport` local position。

## 16. Unity 測試與驗收

### EditMode

- 每份 `DiaryEntryDefinitionSO` 至少有一頁與一段文字。
- Puzzle kind 與對應 definition 型別一致。
- `solvedOrder` 沒有重複或缺少 piece。
- 多段完整正文可以依序組回。
- Reward 只能出現在 reading stage 之後。

### PlayMode

- 一張 ActivePaper、三張 BackPage。
- 未完成時沒有 ContinueButton。
- 拼圖完成後依規格進 reveal 或 reward。
- 前半段保留，後半段在揭露時間點才浮出。
- 線索在還原頁之後才出現。
- 翻頁時 PaperStack 不旋轉。
- `428 × 852`、`1080 × 1920` 與展覽實機比例都不出現右側縫隙。

### Unity MCP 實作時

1. 先讀取 Unity project info，確認使用 uGUI、TMP、Input System 或 UI Toolkit。
2. 建立／修改 Script 後等待編譯完成。
3. 檢查 Console error。
4. 使用 EditMode／PlayMode tests 驗證 state machine。
5. 用 Game View screenshot 檢查紙邊、三層背頁與不同解析度。

## 17. 完成定義

重構完成後應能做到：

1. 新增一篇單段日記：只新增 entry/page/segment data，選擇既有 puzzle kind。
2. 新增一篇兩段日記：加入第二個 segment 與 reveal flow，不修改 shell。
3. 新增一種拼圖：新增 definition、controller、view 與 PuzzleHost mapping，不修改其他玩法。
4. 修改紙張外觀：只修改 Shell、tokens 或紙張素材，所有日記同步更新。
5. Web 與 Unity 使用相同 entry/page/segment/puzzle/stage 語意。
6. 任一拼圖無法自行畫出第二張紙，外觀一致由 hierarchy 強制保證。
