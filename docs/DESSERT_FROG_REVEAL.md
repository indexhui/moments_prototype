# 甜點店青蛙正式美術演出

使用 `public/images/dessert_shop/` 原始透明圖；背景與各幀均為 786 × 1704。依本次明確指定的場景互動實作，沿用青蛙事件的 `container-search` 入口與 `EventPhotoCaptureLayer`。本段不是漫畫格，不新增漫畫呈現方式。

| 需求 | 對話 | 說話者 | 表情來源 | 背景 | 動作／效果 | 漫畫方式 | 玩法沿用 | 場景入口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 移除「嗷！提袋！提袋裡面！」；上一句結束後隱藏對話 UI | 無 | 無 | 甜點店.jpg | 對話結束，保留背景與袋子位置 | 無，使用者指定場景互動 | 原事件對話 | frog-dessert / line-5 |
| 2 | 無 | 無 | 無 | 同上 | 1、2、3 號袋子圖間歇循環鼓動，等待玩家 | 無 | container-search | frog-dessert / container-search |
| 3–4 | 無 | 無 | 無 | 同上 | 依參考圖播放 4 → 5 → 6 → 7 → 6 → 7 → 8 → 9 → 10 → 4，探頭交替兩輪後躍出；取消轉袋遊戲 | 無 | 原互動入口，單次點擊 | frog-dessert / container-search |
| 5 | 保留小麥發現青蛙及決心捕捉的兩句 | 小麥 | 沿用原場景表情 | 同上 | 3a 青蛙落在左側展示櫃，4 號空袋留在櫃台；後續對話與拍照沿用同一張空袋 | 無 | EventPhotoCaptureLayer；照片合成新圖及原背景 | frog-dessert / line-6、line-7、photo |

同一背景座標用於對話、互動、拍照，避免 UI 收起時櫃子和袋子縮放跳位。新圖在互動前預載，切幀不閃白；重入／離開互動會清理動畫計時。日文、英文對話索引同步移除提示句。

參考圖對齊：6、7 探頭交替兩輪，第二輪增加 410 ms。跳走後回到 4 號空袋，落地、後續對話及照片共用 `DESSERT_BAG_EMPTY_FRAME`，避免切換時回到 1 號袋子。

驗證：`tsc --noEmit --incremental false`、`npm run build` 通過；瀏覽器走完 `line-5 → container-search → line-6 → line-7 → photo → diary-photo-slide`。393 × 852 手機畫面實拍精準度 100%，拍立得含新青蛙與背景；375 × 667 驗證袋子熱區、展示櫃落點及 Enter 操作，日文正確接到移除提示句後的小麥台詞。
