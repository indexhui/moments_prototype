import Link from "next/link";
import { BEASTS } from "@/lib/game/muffinKnight";
export const metadata = { title: "小日獸動作圖集 | 走走小日" };
export default function SpriteGallery() {
  return <main style={{ minHeight: "100vh", background: "#22362e", color: "#f8edce", padding: "32px clamp(16px, 5vw, 72px)", fontFamily: "system-ui" }}>
    <Link href="/muffin-knight">← 返回遊戲</Link>
    <h1 style={{ fontSize: 30, margin: "24px 0 12px" }}>小日獸 · 動作圖集</h1>
    <p style={{ color: "#c2cfaf", lineHeight: 1.8 }}>青蛙沿用原始六張動作素材；其他角色依設定圖製作八格透明 Sprite Sheet，已接入遊戲。</p>
    {BEASTS.map(beast => <section key={beast.id} style={{ marginTop: 32, padding: 22, border: "1px solid #7d926266", borderRadius: 12, background: "#314739" }}>
      <h2 style={{ fontSize: 21 }}>{beast.name} <small style={{ fontSize: 13, color: "#d2c398" }}>{beast.skill}</small></h2>
      <p style={{ fontSize: 12, color: "#baccac", margin: "10px 0" }}>{beast.id === "frog" ? "騰空 → 下落 → 壓縮 → 待機 → 起跳 → 躍起（3 × 2，保留原始座標基準）" : "待機 → 眨眼 → 跑步 A → 跑步 B ／ 起跳 → 下落 → 攻擊 → 受傷（4 × 2）"}</p>
      {/* Raw atlas preview intentionally shows all frames with a checkerboard behind alpha. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/images/muffin-knight/sprites/${beast.id}.png`} alt={`${beast.name}完整透明動作圖集`} style={{ width: "100%", maxWidth: 1000, display: "block", background: "repeating-conic-gradient(#53624c 0% 25%, #4c5a46 0% 50%) 0 0 / 28px 28px", borderRadius: 8 }} />
      <a href={`/images/muffin-knight/sprites/${beast.id}.png`} download style={{ display: "inline-block", marginTop: 12, fontSize: 13 }}>下載透明 PNG ↓</a>
    </section>)}
    <p style={{ margin: "28px 0", fontSize: 12 }}><a href="/images/muffin-knight/sprites/prompts.json">素材來源與生成提示</a> · <a href="/images/muffin-knight/sprites/atlas.json">圖集座標</a></p>
  </main>;
}
