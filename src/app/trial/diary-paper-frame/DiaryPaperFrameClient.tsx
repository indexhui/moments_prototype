"use client";

import NextLink from "next/link";
import { useState } from "react";
import styles from "./diary-paper-frame.module.css";

type FrameMode = "paper" | "original";

const DIARY_PAGES = [
  {
    imagePath: "/images/diary/diary_02_01.jpg",
    aspectRatio: "640 / 460",
    text:
      "今天和小麥請搬家公司搬家。\n整理到一半，客廳出現幾瓶便利商店飲料，\n我以為是小麥買的，就很自然地全部喝掉了。\n但小白的表情一臉問號的看著我。\n外面有一陣騷動打亂我的不安....",
  },
  {
    imagePath: "/images/diary/diary_02_02.png",
    aspectRatio: "640 / 460",
    text:
      "跑出去看，才發現街道亂成一團。\n原來有人在玩球，撞到了正在發傳單的人。",
  },
  {
    imagePath: "/images/diary/diary_02_03.png",
    aspectRatio: "1584 / 1020",
    text:
      "忙完了一天，終於能繼續搬家。\n才發現原來下午喝到的飲料，是搬家工人的。\n我就帶著小麥去最近新開的甜點店，\n買了布丁和紅茶當作賠罪，也順便感謝今天的幫忙。",
  },
] as const;

function DiaryImage({
  imagePath,
  aspectRatio,
  pageNumber,
}: {
  imagePath: string;
  aspectRatio: string;
  pageNumber: number;
}) {
  return (
    <figure className={styles.originalImageFrame} style={{ aspectRatio }}>
      <img src={imagePath} alt={`搬家的飲料，第 ${pageNumber} 頁插圖`} />
    </figure>
  );
}

export default function DiaryPaperFrameClient() {
  const [frameMode, setFrameMode] = useState<FrameMode>("paper");

  return (
    <main className={styles.pageShell}>
      <header className={styles.trialToolbar}>
        <NextLink className={styles.backLink} href="/hibimon">
          ← 回 Hibimon 企劃表
        </NextLink>
        <div className={styles.trialCopy}>
          <strong>日記頁背景實驗</strong>
          <span>只替換整張日記頁背景，不影響正式日記流程</span>
        </div>
        <div className={styles.modeSwitch} role="group" aria-label="日記頁背景版本">
          <button
            type="button"
            className={frameMode === "paper" ? styles.modeButtonActive : styles.modeButton}
            aria-pressed={frameMode === "paper"}
            onClick={() => setFrameMode("paper")}
          >
            紙頁版
          </button>
          <button
            type="button"
            className={frameMode === "original" ? styles.modeButtonActive : styles.modeButton}
            aria-pressed={frameMode === "original"}
            onClick={() => setFrameMode("original")}
          >
            原版
          </button>
        </div>
      </header>

      <div className={styles.deviceViewport}>
        <section className={styles.diaryStage} aria-label="搬家的飲料日記頁背景測試">
          <div
            className={frameMode === "paper" ? styles.paperBookPage : styles.originalBookPage}
            data-paper-page={frameMode === "paper" ? "three-slice" : "original"}
          >
            <div
              className={
                frameMode === "paper"
                  ? styles.paperBookPageMiddle
                  : styles.originalBookPageMiddle
              }
            >
              <header className={styles.diaryTitle}>搬家的飲料</header>
              <div
                className={`${styles.diaryScroller} ${
                  frameMode === "paper" ? styles.diaryScrollerPaper : ""
                }`}
              >
                <div className={styles.versionLabel} aria-live="polite">
                  {frameMode === "paper" ? "三片式手繪頁面背景" : "目前正式版矩形頁面"}
                </div>

                {DIARY_PAGES.map((page, index) => (
                  <article className={styles.diaryEntryPage} key={page.imagePath}>
                    <DiaryImage
                      imagePath={page.imagePath}
                      aspectRatio={page.aspectRatio}
                      pageNumber={index + 1}
                    />
                    <p className={styles.diaryText}>{page.text}</p>
                  </article>
                ))}

                <button className={styles.continueButton} type="button">
                  繼續
                </button>
                <div className={styles.scrollSpacer} aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
