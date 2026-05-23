Moments Prototype 審查說明
================================

無需安裝任何工具，直接執行對應系統的啟動檔即可。

【啟動】
* macOS：
    雙擊「啟動-Mac.command」

    ⚠ 首次執行如果出現「無法打開，因為無法驗證開發者」：
      1. 在 Finder 中對「啟動-Mac.command」按右鍵 → 選「打開」
      2. 跳出警告視窗時，按「打開」
      之後雙擊就能正常啟動。

* Windows：
    雙擊「啟動-Windows.bat」

    ⚠ 首次執行如果 Windows SmartScreen 跳出「已保護您的電腦」：
      1. 點「其他資訊」
      2. 點「仍要執行」

啟動後瀏覽器會自動開啟 http://localhost:8080

【結束】
關閉跳出來的終端機 / 命令提示字元視窗即可。

【若 8080 連接埠被占用】
用文字編輯器打開啟動腳本，把 PORT=8080 改成其他數字（例如 9090）後存檔。

【資料夾結構】
.
├── out/                ← prototype 靜態檔
├── bin/                ← 內建的 miniserve 伺服器（macOS / Windows）
├── 啟動-Mac.command
├── 啟動-Windows.bat
└── README-審查說明.txt
