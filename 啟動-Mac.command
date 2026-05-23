#!/bin/bash
# 雙擊此檔案即可啟動 prototype（無需安裝任何工具）

set -e
cd "$(dirname "$0")"

PORT=8080

# 依 CPU 架構選擇對應的 miniserve binary
if [ "$(uname -m)" = "arm64" ]; then
  BIN="./bin/miniserve-mac-arm64"
else
  BIN="./bin/miniserve-mac-x86_64"
fi

if [ ! -f "$BIN" ]; then
  echo "找不到 $BIN，請確認 bin/ 資料夾完整。"
  read -p "按 Enter 鍵關閉視窗..."
  exit 1
fi

if [ ! -d "./out" ]; then
  echo "找不到 out/ 資料夾，請確認檔案完整。"
  read -p "按 Enter 鍵關閉視窗..."
  exit 1
fi

# 解除 Gatekeeper 隔離屬性（從網路下載的檔案才有），失敗也沒關係
xattr -dr com.apple.quarantine ./bin 2>/dev/null || true
chmod +x "$BIN"

echo "啟動中... 瀏覽器將自動開啟 http://localhost:$PORT"
echo "（要關閉伺服器：關掉此視窗，或按 Ctrl+C）"
(sleep 1 && open "http://localhost:$PORT") &
exec "$BIN" --index index.html --port "$PORT" --quiet ./out
