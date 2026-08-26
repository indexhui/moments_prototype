# Exhibition start page icons for Unity

這個資料夾收錄 `ExhibitionExperienceGate.tsx` 的展覽版開始頁與其彈窗所使用的 icon。

## 建議使用方式

- `png/`：已套用開始頁主要顏色的 128 × 128 透明 PNG，可直接放入 Unity。
- `png-tintable/`：白色單色的 128 × 128 透明 PNG，適合用 Unity UI `Image.color` 切換顏色／狀態。
- `svg/`：與 `png-tintable/` 相同的白色單色向量檔；專案有安裝 Unity Vector Graphics package 時可使用。
- PNG 請設為 `Texture Type: Sprite (2D and UI)`、`Sprite Mode: Single`。
- 章節箭頭與其他非正方形圖示放在正方形透明畫布中央，請保持圖片比例。

## 網頁版使用對照

| 檔名 | 用途 | 網頁顯示尺寸 | 網頁顏色 |
| --- | --- | ---: | --- |
| `chapter-select-arrow` | 章節選擇下拉箭頭 | 12 × 7 px | `#937866` |
| `chapter-reset` | 重設為第一章 | 10 × 10 px | `#937866` |
| `settings` | 右上設定按鈕 | 16 × 16 px | `#8B7160` |
| `music-on` | 背景音樂標示／開啟狀態 | 16–17 px | `#755A48` / `#8B7160` / white |
| `music-off` | 背景音樂關閉狀態 | 23 × 23 px | white |
| `sfx-on` | 遊戲音效開啟狀態 | 16–17 px | `#755A48` / `#8B7160` |
| `sfx-off` | 遊戲音效關閉狀態 | 16–17 px | `#755A48` / white |
| `close` | 語言／設定／章節彈窗關閉 | 21 × 21 px | `#876B58` |
| `check` | 已選取語言／章節 | 15–17 px | `#4F929E` |
| `chevron-right` | 尚未選取的語言／章節 | 15–17 px | `rgba(117,90,72,0.34–0.38)` |

右上語言按鈕使用動態文字 `中`、`日`、`英`，不是圖檔，因此不包含在此包內。背景、Logo 與 loading 畫面也不是 icon，仍保留在 `public/images/exhibition/start/`。

## 來源

- `chapter-select-arrow`、`chapter-reset`：由現有展覽開始頁 SVG 整理為 Unity 可 tint 的白色版本。
- `settings`、`music-on`、`sfx-on`、`sfx-off`：與頁面目前使用的 Font Awesome 6 / `react-icons/fa6` 路徑一致。
- `music-off`：依頁面目前的音符加斜線組合整理，並加上透明間距，縮小後仍能辨認關閉狀態。
- `close`、`check`、`chevron-right`：依頁面目前使用的文字符號重畫成不依賴字型的向量圖。

Font Awesome 圖示授權與 attribution 見 [ATTRIBUTION.md](./ATTRIBUTION.md)。
