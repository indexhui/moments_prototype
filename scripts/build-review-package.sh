#!/bin/bash
# 一鍵打包審查包：build + 組裝 + zip
# 用法：./scripts/build-review-package.sh
# 詳細說明：docs/REVIEW_PACKAGE_GUIDE.md

set -e

# 切到專案根目錄（不論在哪裡執行此腳本）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

MINISERVE_VERSION="0.35.0"
DELIVERABLE_NAME="moments_prototype_review"
DELIVERABLE_DIR="$ROOT/../$DELIVERABLE_NAME"
ZIP_PATH="$ROOT/../$DELIVERABLE_NAME.zip"

echo "==> [1/4] 執行 next build"
npm run build

echo "==> [2/4] 確認 bin/ 內的 miniserve binary"
mkdir -p bin
download_if_missing() {
  local file="$1"
  local url="$2"
  if [ ! -f "bin/$file" ]; then
    echo "    下載 $file ..."
    curl -L -s -o "bin/$file" "$url"
  fi
}
download_if_missing "miniserve-mac-arm64" \
  "https://github.com/svenstaro/miniserve/releases/download/v${MINISERVE_VERSION}/miniserve-${MINISERVE_VERSION}-aarch64-apple-darwin"
download_if_missing "miniserve-mac-x86_64" \
  "https://github.com/svenstaro/miniserve/releases/download/v${MINISERVE_VERSION}/miniserve-${MINISERVE_VERSION}-x86_64-apple-darwin"
download_if_missing "miniserve-win-x86_64.exe" \
  "https://github.com/svenstaro/miniserve/releases/download/v${MINISERVE_VERSION}/miniserve-${MINISERVE_VERSION}-x86_64-pc-windows-msvc.exe"
chmod +x bin/miniserve-mac-arm64 bin/miniserve-mac-x86_64

echo "==> [3/4] 組裝交付資料夾 $DELIVERABLE_DIR"
rm -rf "$DELIVERABLE_DIR"
mkdir -p "$DELIVERABLE_DIR"
cp -r out bin "$DELIVERABLE_DIR/"
cp 啟動-Mac.command 啟動-Windows.bat README-審查說明.txt "$DELIVERABLE_DIR/"
chmod +x "$DELIVERABLE_DIR/啟動-Mac.command"
chmod +x "$DELIVERABLE_DIR/bin/miniserve-mac-arm64" "$DELIVERABLE_DIR/bin/miniserve-mac-x86_64"

# 防呆：確認 Windows bat 行尾是 CRLF
if ! file "$DELIVERABLE_DIR/啟動-Windows.bat" | grep -q "CRLF"; then
  echo "    警告：啟動-Windows.bat 不是 CRLF，自動轉換中..."
  perl -i -pe 's/\n/\r\n/ unless /\r\n$/' "$DELIVERABLE_DIR/啟動-Windows.bat"
fi

echo "==> [4/4] 壓縮為 $ZIP_PATH"
rm -f "$ZIP_PATH"
( cd "$ROOT/.." && zip -rq "$(basename "$ZIP_PATH")" "$DELIVERABLE_NAME" )

SIZE="$(du -h "$ZIP_PATH" | cut -f1)"
echo ""
echo "完成！審查包：$ZIP_PATH ($SIZE)"
