# moment_prototype

`moment_prototype` 是一個以手機直式畫面為核心的模擬遊戲原型。玩家會先進入「安排路線」拼圖階段，再進入劇情場景、事件、上班過場、下班獎勵，之後循環進入下一輪路線安排。

## Current Scope

- 首頁與手機畫布入口
- 安排路線拼圖：拖放、召回、連通驗證、錯誤回滾
- 劇情場景：資料驅動場景、章節內回顧 modal
- 事件演出：捷運座位、街道路線事件、背景特效、表情與頭像金手指
- 玩家進度：`localStorage` 持久化、下班獎勵、解鎖條件
- 桌面開發殼層：左右側欄顯示進程、玩家狀態與事件金手指

## Main Routes

- `/`：首頁
- `/game/arrange-route`：安排路線階段
- `/game`：第一個劇情場景
- `/game/[sceneId]`：動態劇情場景

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Chakra UI v3

## Project Structure

- `src/app`：頁面與 metadata
- `src/components/game`：遊戲舞台與互動 UI
- `src/lib/game`：場景、流程、玩家進度、事件定義
- `public`：場景背景、角色素材、音訊與拼圖相關圖片
- `docs/GAME_ROUTE_PROTOTYPE_LOG.md`：目前最可信的功能規格與流程紀錄

## Local Development

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

## Important Notes

- 玩家進度儲存在 `localStorage`，key 為 `moment:player-progress`
- 上班過場切到下班場景時，避免先卸載過場；應直接跳頁，否則會出現底層頁面閃爍
- 目前 git 歷史已重建，repo 只有一個 baseline 初始化 commit
- 舊網站時期的 SEO 文件仍保留在 `docs/`，但不代表目前遊戲原型的真實結構

## Related Docs

- `docs/GAME_ROUTE_PROTOTYPE_LOG.md`
- `docs/README.md`
- `docs/FIGMA_UI_INTEGRATION_RULES.md`
