# GameWorks 試玩版打包說明

這份文件記錄目前給 GameWorks 試玩用的 web build 方式。

## Build

```bash
npm run build:gameworks
```

這個 script 會設定：

- `NEXT_PUBLIC_GAMEWORKS_TRIAL=1`：切換 metadata、首頁與玩家旁欄為外部試玩版本。
- `NEXT_PUBLIC_TRIAL_PROFILE=gameworks`：讓子網域或直接進 `/game` 時也強制使用 GameWork 試玩模式。
- `NEXT_PUBLIC_SHOW_GAME_DEBUG_TOOLS=0`：隱藏開發用金手指、事件跳轉、場景跳轉與 debug preset。

## Trial Entry

正式給評審的入口：

```txt
/trial/gameworks
```

點擊「開始試玩」後會寫入 `moment:trial-profile = gameworks`，再進入 `/game?trial=gameworks`。遊戲流程仍共用現有 `/game`、`/game/arrange-route`、`/game/[sceneId]`，不 fork 另一套流程。

## Local Preview

```bash
NEXT_PUBLIC_GAMEWORKS_TRIAL=1 NEXT_PUBLIC_TRIAL_PROFILE=gameworks npm run start -- -H 127.0.0.1 -p 3003
```

若 3003 已被占用，可以改成其他 port。

## Internal Debug Build

一般開發時維持：

```bash
npm run dev
```

dev 模式預設會顯示金手指。如果需要在 production build 也顯示內部工具：

```bash
NEXT_PUBLIC_SHOW_GAME_DEBUG_TOOLS=1 npm run build
```

## Trial Build Notes

- 試玩版 production build 不顯示金手指文字或測試捷徑。
- 試玩版 metadata 會標記為 `noindex`，避免公開試玩連結被搜尋引擎索引。
- 試玩版不送出 `X-Frame-Options: DENY`，避免外部審查平台用 iframe 預覽時畫面被擋。
- 若 Vercel 另外接 GameWork 子網域，建議在該 deployment 設定 `NEXT_PUBLIC_TRIAL_PROFILE=gameworks`。
