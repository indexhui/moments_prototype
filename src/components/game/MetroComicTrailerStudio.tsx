"use client";

import { useState } from "react";
import {
  DEFAULT_METRO_COMIC_DURATION,
  METRO_COMIC_BEATS,
  METRO_COMIC_LABELS,
  METRO_MAI_EXPRESSIONS,
  METRO_COMIC_TRAILER_ART as ART,
  getMetroComicSoundCues,
  sampleMetroComicTrailer,
} from "@/lib/game/metroComicTrailer";
import { playGameSfx } from "@/lib/game/soundEffects";
import { getExhibitionSpeakerName } from "@/lib/game/exhibitionI18n";
import { TRAILER_COPY } from "@/lib/game/trailerI18n";
import { useExhibitionLocale } from "./ExhibitionLocaleContext";
import { TrailerRecordingStudio } from "./TrailerRecordingStudio";
import studioStyles from "./TrailerRecordingStudio.module.css";
import styles from "./MetroComicTrailerStudio.module.css";

const ASSETS = [ART.background, ART.rightBackground, ...ART.comics, ...ART.portraits, ART.continueArrow, ART.choicePointer];
const seconds = (value: number) => `${value.toFixed(1)} 秒`;
const playComicCue = () => { playGameSfx("comicPanelPop"); };

function MetroComicStage({ time, duration }: { time: number; duration: number }) {
  const locale = useExhibitionLocale();
  const sample = sampleMetroComicTrailer(time, duration, locale);
  const { comic, mai } = sample;
  return <section className={styles.scene} aria-label="捷運事件與小麥反應漫畫演出" data-metro-comic-scene="true" data-metro-phase={sample.phase}>
    <div className={styles.left} data-metro-side="left">
      <img className={styles.background} src={ART.background} alt="捷運車廂" draggable={false}
        data-metro-background-y={sample.backgroundY}
        style={{ transform: `translate3d(0, ${sample.backgroundY / 19.2}cqw, 0)` }} />
      {comic.index !== null && <img className={styles.comic} src={ART.comics[comic.index]}
        alt={METRO_COMIC_LABELS[comic.index]} aria-hidden={comic.opacity === 0} draggable={false} data-metro-comic={comic.index}
        style={{ left: `${comic.x / 10.55}%`, top: `${comic.y / 10.8}%`, width: `${comic.width / 10.55}%`, opacity: comic.opacity,
          transform: `translate(-50%, calc(-50% + ${comic.offsetY / 19.2}cqw)) rotate(${comic.rotation}deg) scale(${comic.scale})` }} />}
    </div>
    <div className={styles.right} data-metro-side="right">
      <img className={styles.rightBackground} src={ART.rightBackground} alt="捷運車門旁" draggable={false}
        data-metro-right-background-y={sample.rightBackgroundY}
        style={{ transform: `translate3d(0, ${sample.rightBackgroundY / 19.2}cqw, 0)` }} />
      {mai.index !== null && <div className={styles.mai} data-metro-mai={METRO_MAI_EXPRESSIONS[mai.index]}
        style={{ width: `${mai.width / 19.2}cqw`, bottom: `${mai.bottom / 19.2}cqw`, opacity: mai.opacity,
          transform: `translate3d(${mai.x / 19.2}cqw, ${mai.y / 19.2}cqw, 0) rotate(${mai.rotation}deg) scale(${mai.scale})` }}>
        <img src={ART.portraits[mai.index]} alt={`小麥：${METRO_MAI_EXPRESSIONS[mai.index]}`} draggable={false}
          style={{ transform: mai.flip ? "scaleX(-1)" : undefined }} />
      </div>}
      {sample.dialogue !== null && <div className={styles.dialogue} data-metro-dialogue="true" data-metro-typing={sample.dialogueComplete ? "complete" : "typing"}>
        <div style={{ opacity: sample.dialogueOpacity }}>
          {mai.index !== null && <p className={styles.speaker}>{getExhibitionSpeakerName(locale, "小麥")}</p>}
          <p className={styles.line} aria-label={sample.dialogue}>
            {Array.from(sample.dialogue).map((character, index) => <span key={index} aria-hidden="true"
              style={{ visibility: index < sample.dialogueVisibleCharacters ? "visible" : "hidden" }}>{character}</span>)}
          </p>
          <img className={styles.continueArrow} src={ART.continueArrow} alt="" draggable={false}
            style={{ opacity: sample.dialogueComplete ? 1 : 0 }} />
        </div>
      </div>}
      {sample.choices && <div className={styles.choices} data-metro-choices="true" role="group" aria-label="準備選擇（自動演出）">
        <div className={styles.choiceList} style={{ opacity: sample.choiceOpacity, transform: `translateY(${12 * (1 - sample.choiceOpacity) / 19.2}cqw)` }}>
          {TRAILER_COPY.choices.map((choice, index) => <div className={styles.choice} key={index}>{choice[locale]}</div>)}
          <div className={styles.choiceFocus} aria-hidden="true" data-metro-choice-focus={sample.consideredChoice + 1}
            style={{ transform: `translateY(${sample.choiceFocusY / 19.2}cqw)` }} />
          <img className={styles.choicePointer} src={ART.choicePointer} alt="" aria-hidden="true" draggable={false}
            data-metro-choice-pointer={sample.consideredChoice + 1}
            style={{ transform: `translateY(${sample.choiceFocusY / 19.2}cqw) rotate(-90deg)` }} />
        </div>
      </div>}
    </div>
  </section>;
}

export function MetroComicTrailerStudio() {
  const [duration, setDuration] = useState(DEFAULT_METRO_COMIC_DURATION);
  const scaled = (time: number) => time * duration / DEFAULT_METRO_COMIC_DURATION;
  return <TrailerRecordingStudio
    key="metro" id="metro" title="捷運事件 × 小貝狗" badge="16:9 · 左右漫畫演出"
    duration={duration} assets={ASSETS} soundCues={getMetroComicSoundCues(duration)} playCue={playComicCue} soundLabel="漫畫格音效"
    timelineHint={<>選項 {seconds(scaled(METRO_COMIC_BEATS.choice))} → 袋子 {seconds(scaled(METRO_COMIC_BEATS.bagEnter))} → 探頭 {seconds(scaled(METRO_COMIC_BEATS.beigoReveal))}</>}
    description="左側事件漫畫、右側小麥反應 → 外框與手指考慮兩個選項 → 袋子蠕動、打開、小貝狗探頭三格演出。"
    settings={(reset) => <>
      <button onClick={() => { reset(); setDuration(DEFAULT_METRO_COMIC_DURATION); }}>5.5 秒預設</button>
      <label className={studioStyles.setting}>演出總長<input type="range" min="3.5" max="10" step="0.5" value={duration}
        onChange={(event) => { reset(); setDuration(Number(event.target.value)); }} /><output>{seconds(duration)}</output></label>
    </>}
  >
    {({ time }) => <MetroComicStage time={time} duration={duration} />}
  </TrailerRecordingStudio>;
}
