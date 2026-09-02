# 疊箱子小遊戲規格與視覺校正經驗

本文件記錄公司整理櫃子的疊箱子小遊戲，以及這次整合美術素材時得到的可重用經驗。
若文件與程式碼不同，請以
`src/components/game/events/CabinetBoxStackMinigameModal.tsx` 為準。

## 遊戲定位與入口

- 承載容器：既有的工作事件 modal，不是獨立 page 或新的手機外殼。
- 主要元件：`CabinetBoxStackMinigameModal`。
- 展覽版測試網址：`/game/exhibition?preview=box-game&lang=zh`。
- 急件變體測試網址：`/game/exhibition?preview=work-clicker&lang=zh`。
- Figma 參考：`走走小日 2026`，節點 `12616:149`。
- 操作：整個遊戲舞台都可點擊；點擊時將移動中的箱子落下。
- 鍵盤：`Space`／`Enter` 放置，`Escape` 離開。

主畫面依 Figma 保持極簡，只保留：

1. 上方花紋橫幅
2. 目前正在放置的層數
3. 堆箱舞台
4. `GameFrame` 原本提供的右上選單

不要在 modal 內重做第二顆選單，也不要重新加入速度、方向、提示、進度句或放置按鈕。
失敗與完成 overlay，以及只在關鍵落點短暫出現的刺激文字，屬於必要狀態，可以保留。

## 三批急件變體

`CabinetBoxStackMinigameModal` 透過 `variant="dispatch"` 提供第二套規則，展覽流程的
`work-clicker` 會使用此模式取代舊短影音工作流：

- 固定完成 9 箱，每 3 箱算一批，共 3 批。
- 每批完成只短暫顯示封箱提示；不另加開場卡片或常駐批次 HUD，避免把玩法差異做成介面差異。
- 完全落空時保留既有塔身並重送當前箱，不進入失敗重開，避免展覽流程中斷。
- 依精準貼合次數給 1～3 星；完成後自動銜接午餐與便利商店段落。
- 急件模式預設不顯示黃金獵犬貼紙；僅 `wrong-way` 中成功把錯向箱轉正後，下一箱會以滿版貼紙作為操作獎勵。

展覽正式流程的第二次箱子遊戲（`work-clicker`）預設採用 `wrong-way`；第一次的 `box-game` 仍維持原本玩法。開發版右側快捷區另提供六種 `boxMotion` 動態模式，可覆寫第二次箱子遊戲的移動方式：

- `one-way`：箱子單向穿越，離場後由反方向補送。
- `tempo-shift`：每趟依序慢速、突然加速、再稍微降速。
- `corner-turn`：沿第一軸進入塔心，再轉 90 度沿第二軸離開；落點判定同時檢查 X／Z 重疊。
- `accelerating-bounce`：每次折返都加速，成功放下一箱後重置。
- `brief-stop`：高速移動，但每趟經過塔心會停靠 `180 ms`。
- `wrong-way`：每批第二箱會出現錯向，輪替為水平旋轉 `90°` 或放倒成標籤朝上；標籤朝上時，旋轉後露出的原底面改貼上表面材質。側轉箱以左右滑動轉正，標籤朝上箱則由上往下滑動轉正；明顯滑動不會觸發放置，短點擊才會直接放下。若先轉正並成功放下，下一箱的三個可見面會鋪滿貼紙。

直接網址可使用 `/game/exhibition?preview=work-clicker&boxMotion=<模式>`。

未傳 `variant` 時仍是 `archive` 模式，原本的 7／10／14 層與通關前落空失敗規則不變。

## 玩法與判定

- 7 層：通關資格／1 星
- 10 層：2 星
- 14 層：3 星並完成
- 每層速度倍率增加：`0.18`
- 完美容許值：`6`
- 無有效重疊：失敗
- 通關後若後續箱子落空：保留已取得成績並結算

落點判定必須使用當下已渲染的 `motionOffset`，不要直接讀動畫用的 ref。動畫 ref 可能已經
比畫面快一個 frame，會造成玩家明明看到箱子貼齊，實際卻被判成切邊，也讓「完美！」
回饋難以觸發。

移動軸交替規則：

- 第 1、3、5……個箱子走 `z` 軸，在畫面中呈現斜向左下／右上移動。
- 第 2、4、6……個箱子走 `x` 軸，在畫面中呈現左右斜向移動。
- 第一箱必須從較深處移向前側；美術稿中較深色的面是前側。

## 素材位置與面向

主要素材位於 `public/images/minigame/box_stacking/`：

- `BoxStacking_BG.png`：初始完整背景，`786 × 2833`
- `BoxStacking_BG_Tile.png`：向上捲動時使用的背景 tile，`786 × 1139`
- `Box_Variant_A/B/C_01.png`：正面／較深色面，包含 label 所在面
- `Box_Variant_A/B/C_02.png`：右側面
- `Box_Variant_A/B/C_03.png`：上表面
- `label.png`：箱子正面標籤來源，`786 × 2554`

上方橫幅沿用：

- `public/images/minigame/flyer_chase/top_banner_normal.png`
- `public/images/minigame/flyer_chase/top_banner_line.png`

黃金獵犬貼紙沿用 `public/slot/golden.png`。目前固定出現在第 3、7、11 層，規則為
`level % 4 === 3`，避免重播時隨機跳動。

### 面向對應不要只看檔名猜

這組素材的實際對應是：

| 檔案尾碼 | Three.js 面 | 視覺位置 |
| --- | --- | --- |
| `01` | `front` | 畫面前側、label 所在面 |
| `02` | `side` | 右側面 |
| `03` | `top` | 上表面 |

若對應錯誤，即使箱子尺寸和透視正確，也會讓玩家感覺箱子方向相反。

## 底盤與第一箱的精確校正

### 核心原則

第一箱的遊戲碰撞尺寸必須等於美術背景裡「底盤內側上表面」的投影尺寸。底盤的外框和
厚度可以露出，但第一箱完美落下時，底面四條邊應貼齊內側上表面。

不要只調整整體 scale 直到「看起來差不多」。應分別校正：

1. 長邊尺寸
2. 深度尺寸
3. 水平中心
4. 垂直中心

### 目前底盤量測值

以 `BoxStacking_BG.png` 的原始 `786 × 2833` 座標量測，底盤上表面四角約為：

- 後角：`(294, 2408)`
- 左角：`(92, 2522)`
- 右角：`(639, 2604)`
- 前角：`(436, 2717)`
- 四角中心：`(365.25, 2562.75)`
- 中心距背景底部：`270.25 px`

目前對應的遊戲與 Three.js 參數：

- `START_WIDTH = 164`
- `START_DEPTH = 96`
- `THREE_WORLD_SCALE = 0.025`
- `THREE_TOWER_ORIGIN_X = -0.166`
- `THREE_TOWER_ORIGIN_Z = 0.166`
- `THREE_CAMERA_HALF_WIDTH = 3.32`

若美術重新輸出背景，即使畫布仍是 `786 × 2833`，只要底盤四角移動，就必須重新量測，
不可沿用上述數字。

## 滿版舞台的相機縮放

### 曾經發生的問題

介面改成滿版前，3D 舞台扣除了 header 和底部按鈕；改成滿版後，舞台變高。如果
Orthographic Camera 繼續固定 `halfHeight`，水平可視範圍會隨長寬比縮小，結果同一個箱子
在長螢幕上突然變得很大，比底盤還寬。

### 正確做法

以舞台寬度固定投影比例：

```ts
const halfHeight = THREE_CAMERA_HALF_WIDTH / aspect;
camera.left = -THREE_CAMERA_HALF_WIDTH;
camera.right = THREE_CAMERA_HALF_WIDTH;
camera.top = halfHeight;
camera.bottom = -halfHeight;
```

這樣箱子尺寸由手機寬度決定，不會因螢幕更高而被放大。

相機垂直目標也不能再用單一魔術數字。程式會依：

- 舞台實際寬高
- 背景縮放倍率
- 底盤中心距背景底部的 `270.25 px`
- 等角投影的 Y 軸螢幕係數 `2 / sqrt(6)`

反推 `responsiveBaseCameraTargetY`，讓第一箱底面中心對準背景底盤中心。

## 背景 loop 與相機追蹤

### 啟動時機

滿版舞台能容納更多層，太早捲動會讓玩家在塔還很矮時看到背景接續，容易露餡。

目前：

- `TOWER_SCROLL_START_LAYER = 8`
- 第 1～8 層背景保持不動
- 第 9 層完成後開始第一段相機追蹤與背景 loop

第一段位移會藏在上方橫幅後；第 10 層開始露出的 tile 才會出現在玩家可見區域。

### 背景與 3D 相機必須同速

不能用固定 `px` 或以舞台高度為基準的百分比移動背景。長螢幕中，同一個百分比會移動
更遠，背景和箱塔很快不同步。

目前背景位移改用舞台寬度的 container query unit：

```ts
const backgroundScrollWidthPercent =
  backgroundScrollLayerCount *
  ((THREE_BOX_HEIGHT * THREE_ISOMETRIC_Y_SCREEN_FACTOR) /
    (THREE_CAMERA_HALF_WIDTH * 2)) *
  100;
```

外層設為 `containerType="inline-size"`，背景使用 `cqw` 位移。這個公式和 Three.js 每層箱高
的螢幕投影相同，因此相機每上追一層，背景也剛好移動一層。

調整 `THREE_BOX_HEIGHT`、`THREE_CAMERA_HALF_WIDTH` 或相機角度後，必須一起重新驗證 loop。

## 短暫刺激回饋

極簡介面不代表完全沒有回饋。保留「關鍵時刻才出現」的短文字，能讓玩家感覺自己的操作
有被遊戲辨識，又不會讓 HUD 重新變得雜亂。

目前規則：

- 完美貼合：`完美！`
- 第 7 層里程碑：`剩一半！`
- 單次只保留目前軸向的 `62%` 以下，或整體可用面積任一邊縮到初始 `50%` 以下：`危險！`
- 一般安全落點：不顯示文字

優先順序為里程碑、完美、危險；例如第 7 層同時完美時只顯示「剩一半！」。文字在舞台
上方短暫 pop／fade，不占固定版面，也不可擋住點擊。

多語系要同步維護繁中、日文、英文，並保留 `role="status"`／`aria-live="polite"`。

## 貼圖顏色、比例與清晰度

### 避免素材亮度被改變

箱子美術是已完成光影的 2D 素材，不應再被 Three.js 燈光和 tone mapping 二次改色。

- 箱子面使用 `MeshBasicMaterial`
- `toneMapped: false`
- texture 使用 `THREE.SRGBColorSpace`
- 不要用 `MeshStandardMaterial` 重新吃場景燈光

### 箱子材質比例

`BOX_ART_TEXTURE_REPEAT_SCALE = 0.68`。數值越小，素材圖樣看起來越大。

不要只放大幾何箱子來改善材質比例；幾何尺寸負責碰撞與底盤貼合，UV repeat 才負責紋理
尺度。

### Label 清晰度

`label.png` 是一張高圖，真正使用的標籤帶位於：

- source height：`2554`
- crop top：`1522`
- crop height：`587`
- `BOX_LABEL_TEXTURE_REPEAT_SCALE = 0.3`

Label texture 關閉 mipmap 並使用 `LinearFilter`，避免密集條文在小尺寸平面上糊成灰線。
若仍看不清楚，優先調整 crop／UV 尺度，不要把整個 label plane 無限制放大。

## 避免箱子落地瞬間變黑

如果每個箱子建立時才開始載入 face texture，第一幀可能只有 material 或未完成的 texture，
玩家會看到短暫黑箱。

目前做法：

1. 場景建立時預載 A／B／C 三種箱子的正面、側面、上面，共 9 張圖。
2. 同時預載 label 與黃金獵犬貼紙。
3. `texturesReady` 前不建立箱子 visual。
4. 每個 visual 使用 cache texture 的 clone，再設定自己的 UV repeat／offset。
5. 場景卸載時統一 dispose cache、clone、geometry 和 material。

新增箱子 variant 或貼紙後，必須同步加入預載 URL 清單。

## 常見錯誤

### 1. 用 camera height 修箱子大小

症狀：短螢幕正常，長螢幕箱子突然變大。

修正：固定 camera half width，再由 aspect 反算 half height。

### 2. 只調 `START_WIDTH`／`START_DEPTH`，不量底盤

症狀：箱子大小接近，但中心偏移或其中一組斜邊永遠貼不齊。

修正：量四角，分開解長邊、深度和中心。

### 3. 相機先動、背景後動

症狀：箱塔看起來在牆面上滑動。

修正：相機追蹤與背景 loop 使用同一個 `TOWER_SCROLL_START_LAYER` 和同一層數差值。

### 4. 背景用舞台高度百分比位移

症狀：越長的手機，每層背景移得越多，接縫或重複腳印很快露出。

修正：用舞台寬度推導的 `cqw` 位移，和 3D 的 width-based projection 同步。

### 5. Figma 整張照搬

症狀：modal 內又出現第二套選單、標題和底部操作列。

修正：Figma 是 event modal 的內容參考；外層選單由 `GameFrame` 提供。

## 驗收清單

每次調整箱子尺寸、相機、背景或素材後，至少檢查：

1. 以 `373 × 768` 手機 viewport 開啟遊戲。
2. 第一箱完美落下時，底面貼齊底盤內側上表面，外框仍可見。
3. 第二箱移動時尺寸和第一箱一致，沒有因靠近前側而放大。
4. 第 1～8 層背景完全不動。
5. 第 9 層第一次追蹤時，接圖區仍藏在橫幅後。
6. 第 10～14 層背景、牆角線與箱塔移動速度一致，沒有接縫跳動。
7. 箱子落地第一幀沒有黑框或黑面。
8. 箱子 PNG 顏色沒有被燈光或 tone mapping 改亮／改暗。
9. Label 條文在手機寬度下仍能辨認為清楚條紋。
10. 第 3、7、11 層黃金獵犬貼紙可見但不遮住整張 label。
11. 失敗、通關後落空、14 層完成流程都可離開 modal。
12. `npm exec tsc -- --noEmit` 與 `git diff --check` 通過。

## 修改入口

視覺與玩法目前集中在：

- `src/components/game/events/CabinetBoxStackMinigameModal.tsx`

未來若移植到 Unity，優先保留的不是 Web 的具體常數寫法，而是以下契約：

- 第一箱 footprint 對準背景底盤四角
- Orthographic Camera 以舞台寬度固定縮放
- 相機追蹤與背景 tile 使用相同的 layer offset
- 已完成光影的箱子素材使用 unlit／不受 tone mapping 影響的材質
- 所有會在遊玩中出現的貼圖先預載，再生成箱子 visual
