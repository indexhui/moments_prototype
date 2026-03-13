# SEO 優化狀態盤點

最後更新：2025-01-XX

## ✅ 已完成項目

### 🔴 嚴重問題（已修復）

1. ✅ **OpenGraph locale 修正**
   - 從 `en_US` 改為 `zh_TW`
   - 位置：`src/app/layout.tsx:46`

2. ✅ **Hero h1 隱藏方式修正**
   - 從 `opacity: 0` 改為 `left: -9999px`
   - 搜尋引擎可正常讀取
   - 位置：`src/components/sections/Hero.tsx:90-101`

3. ✅ **移除 Section 動畫功能**
   - 移除 framer-motion 依賴
   - Section 改為 Server Component
   - 內容在 SSR 時完全可見
   - 位置：`src/components/ui/section.tsx`

4. ✅ **減少不必要的 "use client"**
   - 已移除：SEOInfo, Introduce, Feature, Stories, Video, Teams, LayoutRight, Footer, teamCard
   - 保留必要：Hero, LayoutLeft, Walk, Slot, Podcast（需要互動功能）

### 🟢 基礎 SEO（已完成）

5. ✅ **HTML lang 設定**
   - 正確設為 `zh-TW`
   - 位置：`src/app/layout.tsx:82`

6. ✅ **完整的 Metadata**
   - Title, Description, Keywords 完整
   - 包含「走走小日」「麥尾」關鍵字
   - 位置：`src/app/layout.tsx:7-72`

7. ✅ **StructuredData**
   - VideoGame schema
   - WebSite schema
   - 包含角色資訊（麥尾、小貝狗）
   - 位置：`src/components/seo/StructuredData.tsx`

8. ✅ **標題結構優化**
   - h1：Hero 區塊（隱藏但可讀取）
   - h2：Introduce, Feature, SEOInfo
   - h3：SEOInfo 子區塊
   - 位置：各 Section 組件

9. ✅ **關鍵字密度**
   - 頁面內容多次自然使用「走走小日」「麥尾」
   - SEOInfo 區塊加強關鍵字密度

10. ✅ **Sitemap 和 Robots.txt**
    - `src/app/sitemap.ts`
    - `src/app/robots.ts`

---

## ❌ 待完成項目

### 🔴 高優先級（影響搜尋引擎理解）

1. **背景圖片改為 `<img>` 標籤**
   - **問題位置：**
     - `Hero.tsx` - heroBg.png, animals.png, birds.png, dist01.png, dist02.png
     - `Introduce.tsx` - mrt.png
     - `Stories.tsx` - golden.png
   - **影響：** 搜尋引擎無法讀取圖片內容和 alt 文字
   - **建議：** 將 `bgImage` 改為 Next.js `Image` 組件並加上 alt

2. **加入 Canonical URL**
   - **問題位置：** `src/app/layout.tsx`
   - **影響：** 無法防止重複內容問題
   - **建議：**
   ```tsx
   metadata: {
     alternates: {
       canonical: "https://moments.mugio.studio",
     },
   }
   ```

### 🟡 中優先級（影響搜尋體驗）

3. **Google Search Console Verification**
   - **問題位置：** `src/app/layout.tsx:70`
   - **狀態：** `google: ""` 為空
   - **影響：** 無法驗證網站所有權
   - **需要：** 用戶提供 verification code

4. **Section title 改為中文**
   - **問題位置：**
     - `Introduce.tsx` - `title="Introduce"`
     - `SEOInfo.tsx` - `title="About"`
     - `Feature.tsx` - `title="Feature"`
     - `Stories.tsx` - `title="Share Your Story"`
     - `Video.tsx` - `title="Video"`
     - `Teams.tsx` - `title="Teams"`
     - `Podcast.tsx` - `title="Podcast"`
   - **影響：** 中文網站使用英文標題影響 SEO
   - **建議：** 改為中文標題

5. **語義化 HTML 標籤**
   - **問題：** 缺少 `<main>`、`<article>`、`<nav>` 等語義化標籤
   - **影響：** 搜尋引擎難以理解頁面結構
   - **建議：** 在 LayoutRight 加入 `<main>`，各 Section 使用 `<section>`

### 🟢 低優先級（可優化）

6. **圖片 alt 文字優化**
   - **問題位置：**
     - `walk.tsx` - `alt="Walk animation"` 太簡略
     - `Partner.tsx` - `alt="FansNetwork"` 不明確
   - **建議：** 加入更詳細的描述，包含關鍵字

7. **Breadcrumbs 結構化資料**
   - **影響：** 搜尋結果無法顯示麵包屑
   - **建議：** 在 StructuredData.tsx 中加入 BreadcrumbList schema

8. **OpenGraph 圖片 alt 優化**
   - **位置：** `src/app/layout.tsx:57`
   - **目前：** `alt: "走走小日 moments"`
   - **建議：** 加入更詳細描述

---

## 📊 優化進度統計

- **已完成：** 10/18 項目（55.6%）
- **高優先級待完成：** 2 項
- **中優先級待完成：** 3 項
- **低優先級待完成：** 3 項

---

## 🎯 下一步建議

### 立即執行（高優先級）
1. 將關鍵背景圖片改為 `<img>` 標籤
2. 加入 Canonical URL

### 近期執行（中優先級）
3. 將所有 Section title 改為中文
4. 加入語義化 HTML 標籤（main, section）
5. 填入 Google Search Console verification code（需要用戶提供）

### 長期優化（低優先級）
6. 優化圖片 alt 文字
7. 加入 Breadcrumbs 結構化資料
8. 優化 OpenGraph 圖片 alt

---

## 📈 SEO 優勢總結

### 目前優勢
- ✅ Server Components 為主，SSR 內容完整
- ✅ 無動畫延遲，內容立即可見
- ✅ 完整的 metadata 和結構化資料
- ✅ 正確的標題層級（h1/h2/h3）
- ✅ 關鍵字密度足夠

### 待改善
- ⚠️ 背景圖片無法被索引
- ⚠️ 缺少 Canonical URL
- ⚠️ Section title 使用英文

---

## 🔍 技術細節

### Server Components 狀態
- **Server Components：** SEOInfo, Introduce, Feature, Stories, Video, Teams, LayoutRight, Footer, teamCard, Section
- **Client Components：** Hero, LayoutLeft, Walk, Slot, Podcast（需要互動功能）

### Bundle 優化
- ✅ 移除 Section 動畫後，減少 framer-motion 依賴
- ✅ 多個組件改為 Server Components，減少客戶端 JavaScript

### 搜尋引擎友好度
- ✅ 內容在 SSR 時完全可見
- ✅ 無需等待 JavaScript 執行
- ✅ 更好的 Core Web Vitals 分數

