# 抽獎券原畫

來源：[Figma ticket_page](https://www.figma.com/design/9ased7HFhhFpvVNl3WPrdK?node-id=12812-12519)。

- `LuckyTicket_TearStrip.png`：使用者提供的 178 × 296 撕條。
- `LuckyTicket_A.png`、`LuckyTicket_B.png`、`LuckyTicket_C.png`、`LuckyTicket_D.png`：使用者提供的四個獎等券面，皆為 679 × 296，不含外部陰影邊界；陰影由 CSS 補上。
- `Ticket_Dots.png`：Figma `12812:12520` 原樣匯出，786 × 1704。

`LuckyTicketView` 在既有 GameFrame 中央舞台開啟，由右側「抽獎券」入口控制。券面依 786 × 1704 設計座標縮放：位置 (53, 678)，大小 679 × 296。撕條覆蓋最右側 178 px。

預覽在每次開啟或「再拆一張」時，等機率抽取 A、B、C、D（各 25%）。該張券的結果在拖曳、放手回彈到揭曉過程保持固定，券面與揭曉文字使用同一個獎等。開啟時預載全部四張券面。

目前未接入正式獎池、庫存或玩家獎勵；日後正式機率與發獎流程由實際獎項來源決定。
