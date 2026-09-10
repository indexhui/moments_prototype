import type { Metadata } from "next";
import { Box } from "@chakra-ui/react";
import NextLink from "next/link";
import { ROUTES } from "@/lib/routes";
import { RECORDING_STUDIOS } from "@/lib/game/recordingStudios";
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
      {RECORDING_STUDIOS.map((studio) => <NextLink key={studio.id} className={styles.specialRecording} href={studio.href}>
        <strong>{studio.label} →</strong>
        <span>{studio.description}</span>
      </NextLink>)}
      <p>選擇要錄製的版本，隨時切換手機直式與 16:9 橫式畫面。關閉對話 UI、隱藏游標，再收起工具列，就能開始螢幕錄影。</p>
      <div className={styles.versions}>
        <NextLink href={`${ROUTES.gameRoot}?capture=1&trial=standard`}><strong>開啟正式版 →</strong><span>完整劇情與遊戲場景</span></NextLink>
        <NextLink href={`${ROUTES.gameExhibition}?capture=1&trial=standard`}><strong>開啟展覽版 →</strong><span>展覽體驗與章節演出</span></NextLink>
      </div>
      <p>H 顯示／隱藏工具列 · D 切換對話 · F 全螢幕<br />Space／→ 推進下一句 · Esc 叫回工具列</p>
      <p>可用場景選單跳到要拍攝的段落。畫面比例、對話與游標偏好會在此分頁保留；重新進入一般遊戲時預設為正常模式，需要錄影時再由此入口或遊戲工具欄開啟。</p>
      <NextLink className={styles.back} href={ROUTES.home}>← 返回開發入口</NextLink>
    </div>
  </Box>;
}
