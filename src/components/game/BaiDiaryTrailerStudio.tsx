"use client";

import { useMemo, useState } from "react";
import { BAI_DIARY_BEATS, BAI_DIARY_TRAILER_ART as ART, DEFAULT_BAI_DIARY_DURATION, sampleBaiDiaryTrailer } from "@/lib/game/baiDiaryTrailer";
import { getExhibitionSpeakerName } from "@/lib/game/exhibitionI18n";
import { useExhibitionLocale } from "./ExhibitionLocaleContext";
import { playGameSfx } from "@/lib/game/soundEffects";
import { TrailerRecordingStudio } from "./TrailerRecordingStudio";
import studioStyles from "./TrailerRecordingStudio.module.css";
import styles from "./BaiDiaryTrailerStudio.module.css";

const ASSETS = Object.values(ART).flat();
const seconds = (value: number) => `${value.toFixed(1)} 秒`;
const playGlow = () => { playGameSfx("beigoDiaryReveal"); };

function BaiDiaryStage({ time, duration }: { time: number; duration: number }) {
  const locale = useExhibitionLocale();
  const sample = sampleBaiDiaryTrailer(time, duration, locale);
  return <section className={styles.scene} aria-label="小白漂浮與發光日記演出" data-bai-diary-phase={sample.phase}>
    <div className={styles.right} data-bai-diary-side="right">
      <img className={styles.rightArt} src={ART.room} alt="小白房間" draggable={false} />
      <img className={styles.rightArt} src={ART.glow} alt="" draggable={false} style={{ opacity: sample.bai.glowOpacity }} />
      <img className={`${styles.rightArt} ${styles.floatingBai}`} src={ART.bai} alt="漂浮的小白" draggable={false}
        aria-hidden={sample.light.opacity === 1} data-bai-float-y={sample.bai.y}
        style={{ transform: `translateY(${sample.bai.y / 19.2}cqw) scale(${sample.bai.scale})` }} />
      <div className={styles.lightFrames} style={{ opacity: sample.light.opacity }} aria-hidden={sample.light.opacity === 0}
        data-bai-light-frame={sample.light.to + 1}>
        <img className={styles.rightArt} src={ART.backgrounds[sample.light.from]} alt="" draggable={false} />
        <img className={styles.rightArt} src={ART.backgrounds[sample.light.to]} alt="小白周圍的光芒" draggable={false} style={{ opacity: sample.light.mix }} />
      </div>
    </div>
    <div className={styles.left} data-bai-diary-side="left">
      <img className={styles.leftRoom} src={ART.room} alt="房間另一側" draggable={false} />
      {sample.lineIndex !== null && <div data-bai-diary-dialogue="true" data-bai-diary-typing={sample.dialogueComplete ? "complete" : "typing"} style={{ opacity: sample.uiOpacity }}>
        <div className={styles.mai} style={{ transform: `translate(${sample.mai.x / 19.2}cqw, ${sample.mai.y / 19.2}cqw) rotate(${sample.mai.rotation}deg)` }}>
          <img src={ART.portraits[sample.lineIndex]} alt={sample.lineIndex === 0 ? "小麥發現小白" : "小麥慌張地呼喊"} draggable={false} />
        </div>
        <div className={styles.dialogue}>
          <p className={styles.speaker}>{getExhibitionSpeakerName(locale, "小麥")}</p>
          <p className={styles.line} aria-label={sample.dialogue ?? ""} style={{ opacity: sample.lineOpacity }}>
            {Array.from(sample.dialogue ?? "").map((character, index) => <span key={index} aria-hidden="true"
              style={{ visibility: index < sample.dialogueVisibleCharacters ? "visible" : "hidden" }}>{character}</span>)}
          </p>
          <img className={styles.continueArrow} src={ART.continueArrow} alt="" draggable={false} style={{ opacity: sample.dialogueComplete ? 1 : 0 }} />
        </div>
      </div>}
      {sample.diary.visible && <div className={styles.diary} data-bai-diary-frame={sample.diary.frame + 1}
        style={{ opacity: sample.diary.opacity, transform: `translateY(${sample.diary.y / 19.2}cqw) scale(${sample.diary.scale})` }}>
        <img src={ART.diary[sample.diary.frame]} alt="小麥拿起發光的交換日記" draggable={false} />
      </div>}
    </div>
  </section>;
}

export function BaiDiaryTrailerStudio() {
  const [duration, setDuration] = useState(DEFAULT_BAI_DIARY_DURATION);
  const scaled = (time: number) => time * duration / DEFAULT_BAI_DIARY_DURATION;
  const soundCues = useMemo(() => [BAI_DIARY_BEATS.glow * duration / DEFAULT_BAI_DIARY_DURATION], [duration]);
  return <TrailerRecordingStudio id="bai-diary" title="小白漂浮 × 發光日記" badge="16:9 · 左右演出"
    duration={duration} assets={ASSETS} soundCues={soundCues} playCue={playGlow} soundLabel="發光音效"
    timelineHint={<>呼喊 {seconds(scaled(BAI_DIARY_BEATS.call))} → 拿起日記 {seconds(scaled(BAI_DIARY_BEATS.pickup))} → 發光 {seconds(scaled(BAI_DIARY_BEATS.glow))}</>}
    description="小麥發現漂浮的小白、呼喊她 → 對話退場 → 拿起日記，日記與小白周圍的光芒一起亮起。"
    settings={(reset) => <>
      <button onClick={() => { reset(); setDuration(DEFAULT_BAI_DIARY_DURATION); }}>5.5 秒預設</button>
      <label className={studioStyles.setting}>演出總長<input type="range" min="3.5" max="10" step="0.5" value={duration}
        onChange={(event) => { reset(); setDuration(Number(event.target.value)); }} /><output>{seconds(duration)}</output></label>
    </>}
  >{({ time }) => <BaiDiaryStage time={time} duration={duration} />}</TrailerRecordingStudio>;
}
