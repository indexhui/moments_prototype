"use client";

import { useMemo, useState } from "react";
import { DEFAULT_DIARY_PUZZLE_DURATION, DIARY_PUZZLE_ART } from "@/lib/game/diaryPuzzleTrailer";
import { DEFAULT_FLYER_TRAILER_DURATION, FLYER_TRAILER_ART as ART, FLYER_TRAILER_ATTEMPTS, FLYER_TRANSITION_PAPERS, sampleFlyerTrailer } from "@/lib/game/flyerTrailer";
import { playGameSfx } from "@/lib/game/soundEffects";
import { useExhibitionLocale } from "./ExhibitionLocaleContext";
import { DiaryPuzzleStage } from "./DiaryPuzzleTrailerStudio";
import { FLYER_RECORDING_ART_PRELOAD, FlyerWindRecordingView } from "./events/FrogFlyerWindMinigame";
import { TrailerRecordingStudio } from "./TrailerRecordingStudio";
import studioStyles from "./TrailerRecordingStudio.module.css";
import styles from "./FlyerTrailerStudio.module.css";

const ASSETS = [...new Set([...Object.values(DIARY_PUZZLE_ART).flat(), ...Object.values(ART), ...FLYER_RECORDING_ART_PRELOAD])];
const seconds = (value: number) => `${value.toFixed(1)} 秒`;
const playJudgment = (index: number) => { playGameSfx(index < 2 ? "flyerMiss" : "flyerCatchSuccess"); };

function FlyerStage({ time, duration }: { time: number; duration: number }) {
  const locale = useExhibitionLocale();
  const sample = sampleFlyerTrailer(time, duration);
  return <section className={styles.scene} aria-label="日記完成轉場至撿傳單演出" data-flyer-trailer-phase={sample.phase}>
    <div className={styles.diary} style={{ opacity: sample.diaryOpacity }} aria-hidden={sample.diaryOpacity === 0}>
      <DiaryPuzzleStage time={DEFAULT_DIARY_PUZZLE_DURATION} duration={DEFAULT_DIARY_PUZZLE_DURATION} />
    </div>
    <div className={styles.game} style={{ opacity: sample.gameOpacity }} aria-hidden={sample.gameOpacity === 0}>
      <img className={styles.chase} src={ART.chase} alt="工讀生追趕四散的傳單" draggable={false} />
      <div className={styles.left}>
        <img className={styles.street} src={ART.street} alt="" draggable={false} />
        <div className={styles.streetTint} />
      </div>
      <div className={styles.phone}><FlyerWindRecordingView scene={sample.scene} locale={locale} /></div>
    </div>
    <div className={styles.transition} aria-hidden="true">
      {sample.papers.filter((paper) => paper.visible).map((paper) => {
        const art = FLYER_TRANSITION_PAPERS[paper.art];
        return <div key={paper.id} className={styles.flyingPaper} data-transition-flyer={paper.id}
          style={{ left: `${paper.x / 19.2}cqw`, top: `${paper.y / 19.2}cqw`, width: `${paper.width / 19.2}cqw`,
            aspectRatio: `${art.width} / ${art.height}`, opacity: paper.opacity,
            transform: `translate(-50%, -50%) rotate(${paper.rotation}deg) scaleX(${paper.scaleX})` }}>
          <img src={art.src} alt="" draggable={false} style={{ width: `${786 / art.width * 100}%`, height: `${1704 / art.height * 100}%`,
            left: `${-art.left / art.width * 100}%`, top: `${-art.top / art.height * 100}%` }} />
        </div>;
      })}
    </div>
  </section>;
}

export function FlyerTrailerStudio() {
  const [duration, setDuration] = useState(DEFAULT_FLYER_TRAILER_DURATION);
  const soundCues = useMemo(() => FLYER_TRAILER_ATTEMPTS.map((attempt) => attempt.tap * duration / DEFAULT_FLYER_TRAILER_DURATION), [duration]);
  return <TrailerRecordingStudio id="flyers" title="日記完成 → 撿傳單" badge="16:9 · 傳單轉場"
    duration={duration} assets={ASSETS} soundCues={soundCues} playCue={playJudgment} soundLabel="撿取音效"
    description="搬家日記完成 → 一群傳單隨風由左向右飄過 → 自動撿取三次：MISS、MISS、GREAT，最後停在成功畫面。"
    timelineHint={<>第一次 MISS {seconds(soundCues[0])} → 第二次 MISS {seconds(soundCues[1])} → GREAT {seconds(soundCues[2])}</>}
    settings={(reset) => <>
      <button onClick={() => { reset(); setDuration(DEFAULT_FLYER_TRAILER_DURATION); }}>9 秒預設</button>
      <label className={studioStyles.setting}>演出總長<input type="range" min="6" max="15" step="0.5" value={duration}
        onChange={(event) => { reset(); setDuration(Number(event.target.value)); }} /><output>{seconds(duration)}</output></label>
    </>}
  >{({ time }) => <FlyerStage time={time} duration={duration} />}</TrailerRecordingStudio>;
}
