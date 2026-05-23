# 審查包打包指南

這份文件說明如何把 prototype 打包成「對方完全不需安裝任何東西，雙擊即可在本機執行」的審查包。

最後驗證日期：2026-05-23（Next.js 16.0.7、miniserve 0.35.0）

## 為什麼是這套方案

- **不部署**：prototype 階段不希望放到公網
- **對方零安裝**：不能要求審查者裝 Node.js、Python，或 npm
- **路由完整**：純靜態 server，而非用 `file://` 直接打開 HTML（後者會壞掉 Next.js 的 client routing 與資源路徑）

結論：用 Next.js 的 **static export** 產出純靜態檔，搭配內建在交付包裡的 **miniserve**（Rust 寫的單檔靜態 server）。

## 必要的程式碼設定（請勿移除）

以下設定一旦被改回，build 會壞掉或 prototype 行為會異常。

### 1. `next.config.ts`

```ts
output: "export",      // 開啟靜態匯出，build 後產出 out/
trailingSlash: true,   // 配合靜態 server 的路徑解析（每個路由產出 dir/index.html）
```

注意：`output: "export"` 模式下，`async headers()`、`async redirects()`、`async rewrites()` 等都會被 Next.js 忽略（沒有 server 來執行），所以那些設定不需保留。

### 2. `src/app/sitemap.ts` 與 `src/app/robots.ts`

兩支檔案最上方都需要：

```ts
export const dynamic = "force-static";
```

否則 build 會報 `export const dynamic = "force-static"/export const revalidate not configured on route ... with "output: export"`。

### 3. `src/app/game/[sceneId]/page.tsx`

動態路由必須補上 `generateStaticParams`，列出所有要預先生成的 sceneId：

```ts
export function generateStaticParams() {
  return Object.keys(GAME_SCENES).map((sceneId) => ({ sceneId }));
}
```

新增 scene 時不用改這支檔案，只要場景登錄進 `GAME_SCENES` 就會自動進來。

### 4. `src/app/game/arrange-route/page.tsx`

這支頁面**不能用 server-side `searchParams`**（會讓該路由變動態，與 `output: "export"` 衝突）。

請以 client component + `useSearchParams()` + `<Suspense>` 的模式讀取 query string。詳見該檔現有實作。

## 交付包結構

```
moments_prototype_review/
├── out/                          ← next build 產出的靜態檔（約 132 MB）
├── bin/                          ← 內建的 miniserve 伺服器（約 14 MB）
│   ├── miniserve-mac-arm64       Apple Silicon Mac
│   ├── miniserve-mac-x86_64      Intel Mac
│   └── miniserve-win-x86_64.exe  Windows
├── 啟動-Mac.command              ← Mac 對方雙擊
├── 啟動-Windows.bat              ← Windows 對方雙擊
└── README-審查說明.txt            ← 對方端說明
```

zip 後約 110 MB。

## 打包步驟

一鍵打包：

```bash
npm run package:review
```

腳本會：
1. 跑 `next build`
2. 確認 `bin/` 內的 miniserve binary 都在（缺的話自動從 GitHub Releases 下載 v0.35.0）
3. 組出 `../moments_prototype_review/` 資料夾
4. 壓縮為 `../moments_prototype_review.zip`（與專案目錄並列）

zip 完成後就可以傳給對方。腳本位於 `scripts/build-review-package.sh`，若需手動執行細節請直接看該檔。

## 啟動腳本注意事項

### `啟動-Mac.command`

- 第一次執行會被 Gatekeeper 擋下（未簽章）。對方需在 Finder 對檔案**右鍵 → 打開**確認一次
- 腳本本身會 `xattr -dr com.apple.quarantine ./bin` 解除 binary 的隔離屬性，所以 miniserve binary 不會再跳第二次警告

### `啟動-Windows.bat`

- 行尾**必須是 CRLF**（Windows 風格）。若被編輯器改成 LF，Windows cmd 會把整行當壞參數，導致 `--index index.html` 失效、miniserve 改顯示目錄列表
- 確認方法：`file 啟動-Windows.bat` 應該顯示 `with CRLF line terminators`
- 若不小心被改成 LF：`perl -i -pe 's/\n/\r\n/' 啟動-Windows.bat`
- echo 訊息一律用英文，避免 Traditional Chinese Windows 的 CP950 codepage 把 UTF-8 中文顯示成亂碼
- 第一次執行會被 SmartScreen 擋下，對方需點「其他資訊 → 仍要執行」

### 啟動順序

兩個腳本都採同一個策略：背景 spawn 一個延遲 1~2 秒的開瀏覽器命令，主程序則 foreground 跑 miniserve。這樣：

- miniserve 起來後瀏覽器才連線（避免連線被拒）
- 關閉終端機視窗即可中止 miniserve

## 常見問題

| 症狀 | 原因 | 排查 |
|---|---|---|
| Build 失敗：`route ... with output: export` 錯誤 | `sitemap.ts` 或 `robots.ts` 缺 `dynamic = "force-static"` | 補上 |
| Build 失敗：`Route ... with dynamic = "error"` 用了 `searchParams` | server 端讀 searchParams 與 static export 衝突 | 改用 client component + `useSearchParams` |
| Build 失敗：找不到動態路由的 params | `[sceneId]` 沒補 `generateStaticParams` | 補上 |
| 對方打開後是資料夾列表，不是 prototype | bat 行尾被改成 LF | 重新存成 CRLF（見上節） |
| 對方雙擊後沒打開瀏覽器 | 連接埠被占用，或 firewall 擋下 | 改腳本裡的 `PORT=8080` 為其他號 |
| Mac 提示「無法驗證開發者」 | 首次執行被 Gatekeeper 擋 | 右鍵 → 打開 |
