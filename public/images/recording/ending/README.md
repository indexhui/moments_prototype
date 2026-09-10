# 結尾錄影素材

PNG 保留 Figma MCP 匯出的原始位元，沒有重畫或修改。

來源：[走走小日 2026，結尾分鏡 13010:17947](https://www.figma.com/design/9ased7HFhhFpvVNl3WPrdK?node-id=13010-17947)，結尾構圖為 `13010:17982`。2026-09-10 匯出。

| 檔案 | Figma 圖層 | 原始尺寸 |
| --- | --- | --- |
| street.png | 街景 2，13010:17983 | 4096 × 2314 |
| paper-blue-dark.png | image 7，13010:17984 | 1672 × 941 |
| paper-blue-light.png | image 4，13010:17985 | 2172 × 724 |
| friend.png | 青蛙日記_全圖_還原 1，13010:17988 | 2260 × 684 |
| promoter.png | Frame733 中 promoter 1，12736:11216 | 2260 × 684 |
| kid.png | Kid 中青蛙日記_全圖_還原 1，12736:11202 | 2260 × 684 |

小麥、小貝狗、青蛙、黃金獵犬及紙箱背景與既有遊戲圖逐像素相同，直接引用既有檔案；標題使用現有 `images/logo/logo_svg.svg`。裁切、旋轉及進場由 CSS 與錄影時間軸控制。

英文錄影標準字於 2026-09-11 從 [英文結尾 13031:2213](https://www.figma.com/design/9ased7HFhhFpvVNl3WPrdK?node-id=13031-2213) 的 `13031:2231` 匯出為 `hibimon-moments-en.svg`（648 × 274，透明向量圖）。圖稿字樣為「Hibimon MOMENTS」，包含白色描邊；所有字元已由 Figma 轉為向量輪廓，不依賴執行環境字型。原始 PNG 匯出會帶父層底色，因此使用 `exportAsync({ format: "SVG_STRING", contentsOnly: true, svgOutlineText: true })` 取得透明原圖並保存完整原始內容。1920 × 1080 結尾畫布的匯出位置為 x=127、y=37；使用原始比例與現有標題進場動畫。
