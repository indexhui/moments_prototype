"use client";

import { useState, type CSSProperties } from "react";
import { playPhotoShutterSound, preparePhotoShutterSound } from "@/lib/game/fmodWeb";
import {
  DEFAULT_SUNBEAST_TRAILER_TIMING,
  SUNBEAST_TRAILER_ART as ART,
  SUNBEAST_TRAILER_FRAMING,
  getSunbeastTrailerPhotoCrop,
  getSunbeastTrailerTimeline,
  sampleSunbeastTrailer,
  type SunbeastTrailerSide,
  type SunbeastTrailerTiming,
} from "@/lib/game/sunbeastTrailer";
import { TrailerRecordingStudio } from "./TrailerRecordingStudio";
import studioStyles from "./TrailerRecordingStudio.module.css";
import styles from "./SunbeastTrailerStudio.module.css";

const ASSETS = [ART.dogBackground, ...ART.dogFrames, ART.frogBackground, ...ART.frogFrames, ...ART.ticketFrames, ART.star];
const seconds = (value: number) => `${value.toFixed(1)} 秒`;

type TrailerSample = ReturnType<typeof sampleSunbeastTrailer>;

function TrailerArtwork({ side, sample, style }: { side: SunbeastTrailerSide; sample: TrailerSample; style?: CSSProperties }) {
  const isDog = side === "dog";
  return <div className={styles.artboard} style={style}>
    <img className={styles.layer} src={isDog ? ART.dogBackground : ART.frogBackground} alt={isDog ? "捷運車廂" : "便利商店櫃台與抽獎箱"} draggable={false} />
    <div className={isDog ? styles.dogSprite : styles.frogSprite}
      data-trailer-subject={side}
      data-hop-x={isDog ? undefined : sample.frogPose.x}
      data-hop-frame={isDog ? undefined : sample.frame}
      style={isDog ? undefined : { transform: `translate(${sample.frogPose.x / 0.8 * 100}%, ${sample.frogPose.y / 0.8 * 100}%)` }}>
      {(isDog ? ART.dogFrames : ART.frogFrames).map((src, index) =>
        <img key={src} className={styles.layer} src={src} alt="" aria-hidden="true" draggable={false} style={{ opacity: index === sample.frame ? 1 : 0 }} />,
      )}
    </div>
    {!isDog && <div className={styles.ticket} style={{ transform: `translate(${sample.ticket.x / 0.44 * 100}%, ${sample.ticket.y / 0.44 * 100}%)` }}>
      {ART.ticketFrames.map((src, index) => <img
        key={src} src={src} alt="" aria-hidden="true" draggable={false} className={styles.layer}
        style={{ opacity: index === sample.ticket.frame ? 1 : 0 }}
      />)}
    </div>}
  </div>;
}

function TrailerPolaroid({ side, sample }: { side: SunbeastTrailerSide; sample: TrailerSample }) {
  const crop = getSunbeastTrailerPhotoCrop(side);
  const progress = sample.polaroidProgress;
  return <>
    <div className={styles.resultBackdrop} style={{ opacity: progress * 0.22 }} />
    <figure className={styles.polaroid} data-trailer-polaroid={side}
      aria-label={`${side === "dog" ? "黃金獵犬" : "便利商店青蛙"}拍立得，3 顆星`}
      style={{
        opacity: progress,
        transform: `translate(-50%, calc(-50% + ${(1 - progress) * 2}cqw)) rotate(${(side === "dog" ? -3 : 3) * progress}deg) scale(${0.92 + progress * 0.08})`,
      }}>
      <div className={styles.polaroidImage} aria-hidden="true" style={{ filter: `brightness(${1 + (1 - sample.photoDevelop) * 0.65}) saturate(${0.72 + sample.photoDevelop * 0.28})` }}>
        <TrailerArtwork side={side} sample={sample} style={{
          width: `${100 / crop.width}%`, left: `${-crop.x / crop.width * 100}%`,
          top: `${-crop.y / crop.height * 100}%`, transform: "none",
        }} />
        <div className={styles.lightSweep} style={{ opacity: sample.lightSweep > 0 && sample.lightSweep < 1 ? 0.65 : 0, left: `${-60 + sample.lightSweep * 220}%` }} />
      </div>
      <figcaption className={styles.stars} aria-hidden="true">
        {sample.stars.map((star, index) => <img key={index} src={ART.star} alt="" draggable={false}
          data-trailer-star={index + 1}
          style={{ opacity: star, transform: `translateY(${(1 - star) * 0.5}cqw) scale(${0.5 + star * 0.5 + Math.sin(star * Math.PI) * 0.2})` }} />)}
      </figcaption>
    </figure>
  </>;
}

function PhotoPanel({ side, time, timing, preview }: {
  side: SunbeastTrailerSide; time: number; timing: SunbeastTrailerTiming; preview: boolean;
}) {
  const sample = sampleSunbeastTrailer(time, timing, side);
  const appearance = preview ? 1 : sample.appearance;
  const isDog = side === "dog";
  const framing = SUNBEAST_TRAILER_FRAMING[side];
  const artSample = preview ? sampleSunbeastTrailer(getSunbeastTrailerTimeline(timing).frogShot, timing, side) : sample;
  return <section
    className={`${styles.panel} ${isDog ? styles.dog : styles.frog}`}
    aria-label={isDog ? "黃金獵犬拍照演出" : "便利商店青蛙拍照演出"}
    style={{ opacity: appearance }}
    data-trailer-panel={side}
    data-captured={!preview && sample.captured ? "true" : "false"}
  >
    <TrailerArtwork side={side} sample={artSample} />
    <div className={styles.viewfinder}
      data-trailer-viewfinder={side}
      aria-hidden="true"
      style={{
        opacity: preview ? 0 : sample.viewfinderOpacity,
        left: `${framing.x * 100}%`,
        width: `${framing.width * 50}cqw`, height: `${framing.width * 50}cqw`,
        top: `${framing.y * 100 - (1 - sample.focusProgress) * 29}%`,
        transform: `translate(-50%, -50%) scale(${1.1 - sample.focusProgress * 0.1})`,
      }}>
      <i /><i /><i /><i />
      <span className={styles.crosshair} />
    </div>
    {!preview && sample.polaroidProgress > 0 && <TrailerPolaroid side={side} sample={sample} />}
    <div className={styles.flash} data-trailer-flash={side} style={{ opacity: preview ? 0 : sample.flashOpacity }} />
  </section>;
}

export function SunbeastTrailerStudio() {
  const [timing, setTiming] = useState(DEFAULT_SUNBEAST_TRAILER_TIMING);
  const timeline = getSunbeastTrailerTimeline(timing);
  return <TrailerRecordingStudio
    key="sunbeasts" id="sunbeasts" title="黃金獵犬 × 青蛙" badge="16:9 · 捷運 × 便利商店"
    duration={timeline.duration} assets={ASSETS}
    soundCues={[timeline.dogShot, timeline.frogShot]} playCue={playPhotoShutterSound} prepareAudio={preparePhotoShutterSound} soundLabel="快門音效"
    timelineHint={<>左拍 {seconds(timeline.dogShot)} → 右拍 {seconds(timeline.frogShot)}</>}
    description="左半整塊出現 → 右半整塊出現 → 左邊拍照／三星拍立得 → 右邊拍照／三星拍立得。青蛙由右往左循環跳躍。"
    settings={(reset) => <>
      <button onClick={() => { reset(); setTiming(DEFAULT_SUNBEAST_TRAILER_TIMING); }}>5.5 秒預設</button>
      {([
        { key: "wait", label: "兩邊出現後等待", min: 0.1, max: 8, step: 0.1 },
        { key: "focus", label: "準星對焦", min: 0.5, max: 3, step: 0.1 },
        { key: "gap", label: "換邊等待", min: 0.5, max: 6, step: 0.5 },
      ] as const).map(({ key, label, min, max, step }) => <label className={studioStyles.setting} key={key}>
        {label}<input type="range" min={min} max={max} step={step} value={timing[key]} onChange={(event) => {
          reset(); setTiming((current) => ({ ...current, [key]: Number(event.target.value) }));
        }} /><output>{seconds(timing[key])}</output>
      </label>)}
    </>}
  >
    {({ time, preview }) => <>
      <PhotoPanel side="dog" time={time} timing={timing} preview={preview} />
      <PhotoPanel side="frog" time={time} timing={timing} preview={preview} />
    </>}
  </TrailerRecordingStudio>;
}
