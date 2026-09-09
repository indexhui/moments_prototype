import type { Metadata } from "next";
import { Box } from "@chakra-ui/react";
import NextLink from "next/link";
import { ROUTES } from "@/lib/routes";
import styles from "@/components/game/RecordingMode.module.css";

export const metadata: Metadata = {
  title: "走走小日 | 預告錄影模式",
  robots: { index: false, follow: false },
};

export default function RecordingPage() {
  return <Box as="main" className={styles.landing}>
    <div className={styles.intro}>
      <div className={styles.eyebrow}>MOMENT · TRAILER STUDIO</div>
      <h1>預告錄影模式</h1>
      <NextLink className={styles.specialRecording} href="/trial/recording/sunbeasts">
        <strong>黃金獵犬 × 青蛙 · 專用拍照演出 →</strong>
        <span>16:9 左右雙畫面，準星依序出現、自動拍照，一鍵播放錄影。</span>
      </NextLink>
      <p>選擇要錄製的版本，隨時切換手機直式與 16:9 橫式畫面。關閉對話 UI、隱藏游標，再收起工具列，就能開始螢幕錄影。</p>
      <div className={styles.versions}>
        <NextLink href={`${ROUTES.gameRoot}?capture=1&trial=standard`}><strong>開啟正式版 →</strong><span>完整劇情與遊戲場景</span></NextLink>
        <NextLink href={`${ROUTES.gameExhibition}?capture=1&trial=standard`}><strong>開啟展覽版 →</strong><span>展覽體驗與章節演出</span></NextLink>
      </div>
      <p>H 顯示／隱藏工具列 · D 切換對話 · F 全螢幕<br />Space／→ 推進下一句 · Esc 叫回工具列</p>
      <p>可用場景選單跳到要拍攝的段落。錄影設定會在此分頁保留；遊玩與場景跳轉會沿用原本的進度規則。</p>
      <NextLink className={styles.back} href={ROUTES.home}>← 返回開發入口</NextLink>
    </div>
  </Box>;
}
