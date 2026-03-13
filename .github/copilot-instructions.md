# Copilot usage hints for Moment Prototype

簡短目標：幫助 AI 編碼助理在這個 Next.js 遊戲原型上快速上手，聚焦可實作的、可被程式碼驗證的規則與範例。

- **專案類型**：Next.js (App Router)、TypeScript、Chakra UI。全域 Provider 在 [src/app/layout.tsx](src/app/layout.tsx) → `Provider` ([src/components/ui/provider.tsx](src/components/ui/provider.tsx))。
- **主要目錄**：遊戲邏輯與場景在 [src/lib/game](src/lib/game)。UI 與舞台在 [src/components/game](src/components/game)。應用頁面在 [src/app](src/app)。

- **架構概觀**：
  - 路由與場景：場景資料定義在 [src/lib/game/scenes.ts](src/lib/game/scenes.ts)。頁面會傳入 scene 物件給 `GameSceneStageClient` → `GameFrame` → `GameSceneView`（見 [src/app/game/page.tsx](src/app/game/page.tsx) 與 [src/components/game/GameSceneStageClient.tsx](src/components/game/GameSceneStageClient.tsx)）。
  - 狀態與進度：玩家進度透過 [src/lib/game/playerProgress.ts](src/lib/game/playerProgress.ts) 的 load/save 與常數操作（localStorage-like）；`GameSceneStageClient` 在 mount 時讀取並傳遞給框架。
  - 事件總線：跨元件通訊採用 window CustomEvent 常數 (例如 `GAME_EVENT_CHEAT_TRIGGER`、`GAME_AVATAR_MOTION_TRIGGER` 等)，定義於若干 `src/lib/game/*Bus.ts` 檔案。可用 `window.dispatchEvent(new CustomEvent(EVENT_NAME,{detail:...}))` 模擬。

- **重要開發慣例／約定**：
  - 客戶端 UI 明確標注 `"use client"`；出現時代表該檔僅在瀏覽器執行（例如大多數 `src/components/game/*.tsx`）。避免把這些改成 server components。 
  - UI 使用 Chakra 的響應式斷點 `base/sm/md/lg`，樣式與 spacing 直接使用 tokens（請參考 [docs/README.md](docs/README.md) 的設計色票與元件說明）。
  - 全站共用區塊請使用 `Section`（位於 `src/components/ui/section.tsx`）以維持統一進場動畫與 Title 行為。
  - 背景圖片等靜態資源置於 `public/`；程式碼以 `backgroundImage="url('/path')"` 指向。

- **如何修改場景或新增互動**（實例）
  - 新場景：在 [src/lib/game/scenes.ts](src/lib/game/scenes.ts) 新增 `GameScene` 物件，並在路由或 `GAME_SCENES` 使用該 id。參考現有場景屬性 `dialogue`、`characterAvatar`、`autoAdvanceMs`。
  - 新事件：在 `src/lib/game/events.ts` 新增事件描述，若需跨元件觸發，新增 Bus 常數檔（pattern: `*Bus.ts`）並於 `GameFrame` 的金手指按鈕或其他位置 dispatch。
  - 玩家進度變更：使用 [src/lib/game/playerProgress.ts](src/lib/game/playerProgress.ts) 提供的 `loadPlayerProgress` / `savePlayerProgress` / `claimOffworkReward` 等 helper，避免直接操作 localStorage。

- **調試與快速開發**：
  - 本地開發：`npm run dev`（或 `yarn dev` / `pnpm dev` / `bun dev`）。見 [README.md](README.md)。
  - 金手指面板：桌面寬度下 `GameFrame` 右側/左側包含大量 cheat 按鈕（事件觸發、表情、背景震動、頭像動作），可直接用來驗證互動流程（見 [src/components/game/GameFrame.tsx](src/components/game/GameFrame.tsx)）。
  - 注意 hydration：某些 UI 只在 client mount 後載入（`useEffect` 設定 mounted），手動測試時需等待 mount 完成。

- **跨團隊／外部整合點**：
  - 靜態資源與圖像：`public/`。新增資源後請同步更新使用路徑與 CSS/背景屬性。
  - 可能的伺服器 API：目前玩家進度保存在客戶端 helper (localStorage-like)。若要改為 server，同步介面需保持 `PlayerProgress` 型別與 helper 名稱以減少改動範圍。

- **禁止與小心事項**：
  - 不要在 server components 中引用 `window` 或 `document`。若需要 DOM 事件，請把檔案設為 client。 
  - 避免在 Section 內額外加進場動畫（專案風格要求，見 [docs/README.md](docs/README.md)）。

如果有想要我把某個流程（例如「新增場景範本」或「新增事件 Bus」）實作成 PR，請告訴我你想改的檔案與用途，我會產出可直接應用的 patch。
