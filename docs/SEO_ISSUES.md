# SEO 問題分析報告

## 🔴 嚴重問題（影響搜尋引擎理解）

### 1. **大量使用 CSS 背景圖片，缺少語義化 `<img>` 標籤**

**問題位置：**
- `src/components/sections/Hero.tsx` - heroBg.png、animals.png、birds.png、dist01.png、dist02.png
- `src/components/sections/Introduce.tsx` - mrt.png
- `src/components/sections/Stories.tsx` - golden.png

**影響：**
- 搜尋引擎無法讀取圖片內容和 alt 文字
- 無法為圖片建立索引
- 失去圖片搜尋的流量機會

**建議：**
```tsx
// 將 bgImage 改為 <img> 標籤
<Box position="relative">
  <Image
    src="/hero/heroBg.png"
    alt="走走小日 moments 遊戲場景 - 麥尾與小貝狗在城市中探索"
    fill
    priority
    style={{ objectFit: 'cover', zIndex: 0 }}
  />
  {/* 其他內容 */}
</Box>
```

---

### 2. **Hero 區塊的 h1 使用 opacity:0 隱藏**

**問題位置：** `src/components/sections/Hero.tsx` (96-108行)

```tsx
<Heading
  as="h1"
  position="absolute"
  opacity={0}  // ⚠️ 搜尋引擎可能視為隱藏內容
  height="1px"
  width="1px"
  overflow="hidden"
```

**影響：**
- Google 可能將此視為「cloaking」或隱藏內容
- 可能被降權或忽略

**建議：**
```tsx
// 使用 CSS class 隱藏但保持可讀性
<Heading
  as="h1"
  className="sr-only" // 螢幕閱讀器可見
  // 或使用 visually-hidden pattern
>
  走走小日 moments - 跟著麥尾與小貝狗探索城市的療癒日常遊戲
</Heading>
```

---

### 3. **OpenGraph locale 設定錯誤**

**問題位置：** `src/app/layout.tsx` (46行)

```tsx
openGraph: {
  locale: "en_US",  // ⚠️ 內容是中文卻設為英文
}
```

**影響：**
- 社交分享時語言標記錯誤
- 可能影響在地搜尋結果

**建議：**
```tsx
locale: "zh_TW",  // 改為繁體中文
```

---

### 4. **過度使用 "use client"，影響 SSR**

**問題位置：** 幾乎所有 Section 組件都是 `"use client"`

**影響：**
- 內容可能無法被搜尋引擎完整索引
- 首次載入時內容可能為空
- 影響 Core Web Vitals 分數

**建議：**
- 只有真正需要互動的組件使用 `"use client"`
- 靜態內容組件（如 SEOInfo、Introduce）移除 `"use client"`
- 使用 Next.js 15 的 Server Components 優勢

---

## 🟡 中級問題（影響搜尋體驗）

### 5. **缺少 Canonical URL**

**問題位置：** `src/app/layout.tsx`

**影響：**
- 無法防止重複內容問題
- 無法明確告訴搜尋引擎哪個是主要 URL

**建議：**
```tsx
metadata: {
  alternates: {
    canonical: "https://moments.mugio.studio",
  },
}
```

---

### 6. **缺少語義化 HTML 標籤**

**問題：**
- 大量使用 `<Flex>`、`<Box>`，缺少 `<main>`、`<article>`、`<nav>` 等
- 所有 Section 都是 `<Flex>` 而非 `<section>`

**影響：**
- 搜尋引擎難以理解頁面結構
- 缺少語義化線索

**建議：**
```tsx
// LayoutRight.tsx
<main>  // 主要內容區域
  <Hero />
  <section aria-label="介紹">  // 明確標記
    <Introduce />
  </section>
</main>
```

---

### 7. **Google Search Console Verification 為空**

**問題位置：** `src/app/layout.tsx` (70行)

```tsx
verification: {
  google: "",  // ⚠️ 為空
}
```

**影響：**
- 無法驗證網站所有權
- 無法使用 Search Console 功能

---

### 8. **動畫可能隱藏初始內容**

**問題位置：** `src/components/ui/section.tsx`

**影響：**
- 如果動畫延遲顯示內容，搜尋引擎可能看不到
- 已修正：未進入視窗前不再設 opacity:0 ✅

---

## 🟢 輕微問題（可優化）

### 9. **圖片缺少詳細 alt 描述**

**現有：**
- `alt="Walk animation"` - 太簡略
- `alt="FansNetwork"` - 不明確

**建議：**
```tsx
alt="走走小日 moments - 麥尾與小貝狗在城市中漫步的動畫"
alt="走走小日 moments 遊戲角色 - 麥尾"
```

---

### 10. **缺少 breadcrumbs 結構化資料**

**影響：**
- 搜尋結果無法顯示麵包屑
- 失去 SERP 功能增強

**建議：**
在 StructuredData.tsx 中加入 BreadcrumbList schema

---

### 11. **Section title 使用英文**

**問題：** `title="Introduce"`、`title="About"`、`title="Feature"`

**影響：**
- 中文網站使用英文標題影響 SEO
- 用戶體驗不佳

**建議：**
```tsx
title="關於走走小日"
title="遊戲特色"
```

---

## 📊 優先修復建議

### 🔥 立即修復（高優先級）
1. ✅ 修正 OpenGraph locale 為 `zh_TW`
2. ✅ 移除 Hero h1 的 opacity:0，改用正確的隱藏方式
3. ✅ 將關鍵背景圖片改為 `<img>` 標籤並加上 alt

### ⚡ 近期修復（中優先級）
4. ✅ 加入 Canonical URL
5. ✅ 填入 Google Search Console verification
6. ✅ 將 Section title 改為中文
7. ✅ 減少不必要的 "use client"

### 💡 長期優化（低優先級）
8. ✅ 加入語義化 HTML 標籤
9. ✅ 優化圖片 alt 文字
10. ✅ 加入 Breadcrumbs 結構化資料

---

## ✅ 目前做得好的地方

- ✅ HTML lang 正確設為 `zh-TW`
- ✅ 有完整的 metadata 設定
- ✅ 有 StructuredData（VideoGame + WebSite schema）
- ✅ 有 sitemap.xml 和 robots.txt
- ✅ 標題結構（h1/h2/h3）已優化
- ✅ 關鍵字密度足夠（走走小日、麥尾）

