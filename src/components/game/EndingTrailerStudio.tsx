"use client";

import { useMemo, useState } from "react";
import { DEFAULT_ENDING_TRAILER_DURATION, ENDING_BEIGO_FRAMES, ENDING_ENGLISH_LOGO_BOUNDS, ENDING_FROG_JUMP_CUE, ENDING_TITLE_LAYERS, ENDING_TRAILER_ASSETS, ENDING_TRAILER_BEATS, ENDING_TRAILER_GREEN, sampleEndingTrailer } from "@/lib/game/endingTrailer";
import { FROG_REVEAL_BACKGROUND_SRC, FROG_REVEAL_FRAME_SOURCES } from "@/lib/game/frogRevealSequence";
import { playGameSfx } from "@/lib/game/soundEffects";
import { TRAILER_LOGOS } from "@/lib/game/trailerI18n";
import { useExhibitionLocale } from "./ExhibitionLocaleContext";
import { TrailerRecordingStudio } from "./TrailerRecordingStudio";
import studioStyles from "./TrailerRecordingStudio.module.css";
import styles from "./EndingTrailerStudio.module.css";

const cqw = (value: number) => `${value / 19.2}cqw`;
const seconds = (value: number) => `${value.toFixed(1)} 秒`;
const playFrogJump = () => { playGameSfx("frogJump"); };
const ASSETS = [...ENDING_TRAILER_ASSETS, ...Object.values(TRAILER_LOGOS).map(logo => logo.src)];

function EndingStage({ time, duration }: { time: number; duration: number }) {
  const locale = useExhibitionLocale();
  const sample = sampleEndingTrailer(time, duration);
  return <section className={styles.scene} data-ending-phase={sample.phase} aria-label="街道青蛙與結尾標題演出">
    <div className={styles.boxScene} style={{ opacity: sample.boxVisible ? 1 : 0 }} aria-hidden={!sample.boxVisible}>
      <img className={styles.wideBackground} src={FROG_REVEAL_BACKGROUND_SRC} alt="" draggable={false} />
      <div className={styles.blur} />
      <div className={styles.phone}>
        <img className={styles.canvas} src={FROG_REVEAL_BACKGROUND_SRC} alt="街道上裝滿傳單的紙箱" draggable={false} />
        {FROG_REVEAL_FRAME_SOURCES.map((src, index) => <img key={src} className={styles.canvas} src={src} alt="" draggable={false}
          data-ending-frog-frame={index + 1} data-active={sample.frogFrame === index ? "true" : "false"}
          style={{ opacity: sample.frogFrame === index ? 1 : 0 }} />)}
      </div>
    </div>
    <div className={styles.titleScene} style={{ opacity: sample.titleVisible ? 1 : 0 }} aria-hidden={!sample.titleVisible}>
      {ENDING_TITLE_LAYERS.map((layer, index) => {
        const motion = sample.layers[index];
        const image = layer.image;
        const bounds = layer.id === "logo" && locale === "en" ? ENDING_ENGLISH_LOGO_BOUNDS : layer;
        return <div key={layer.id} className={styles.layer} data-ending-layer={layer.id}
          style={{ left: cqw(bounds.x), top: cqw(bounds.y), width: cqw(bounds.width), height: cqw(bounds.height),
            overflow: layer.clip ? "hidden" : "visible", opacity: motion.opacity,
            transform: `translate(${cqw(motion.x)}, ${cqw(motion.y)}) rotate(${motion.rotation}deg) scale(${motion.scale})` }}>
          <img src={layer.id === "logo" ? TRAILER_LOGOS[locale].src : layer.id === "beigo" ? ENDING_BEIGO_FRAMES[sample.beigoFrame] : layer.src}
            alt={layer.id === "logo" ? TRAILER_LOGOS[locale].alt : layer.alt} draggable={false}
            data-ending-beigo-frame={layer.id === "beigo" ? sample.beigoFrame + 1 : undefined} style={image ? {
            left: cqw(image.x), top: cqw(image.y), width: cqw(image.width), height: cqw(image.height),
            transform: `rotate(${image.rotation ?? 0}deg) scaleY(${image.flipY ? -1 : 1})`,
          } : { left: 0, top: 0, width: "100%", height: "100%", objectFit: layer.id === "logo" && locale !== "zh" ? "contain" : undefined,
            objectPosition: layer.id === "logo" && locale !== "zh" ? "left center" : undefined }} />
        </div>;
      })}
    </div>
    <div className={styles.green} style={{ backgroundColor: ENDING_TRAILER_GREEN, opacity: sample.greenOpacity }} aria-hidden="true" />
  </section>;
}

export function EndingTrailerStudio() {
  const [duration, setDuration] = useState(DEFAULT_ENDING_TRAILER_DURATION);
  const soundCues = useMemo(() => [ENDING_FROG_JUMP_CUE * duration / DEFAULT_ENDING_TRAILER_DURATION], [duration]);
  return <TrailerRecordingStudio id="ending" title="街道青蛙 → 結尾標題" badge="16:9 · 結尾演出"
    duration={duration} assets={ASSETS} soundCues={soundCues} playCue={playFrogJump} soundLabel="青蛙跳躍音效"
    description="街道紙箱 → 小青蛙爬出、跳近 → 綠色過場 → 結尾街景、角色與標題依序出現，角色輕微浮動。"
    timelineHint={<>綠色過場 {seconds(ENDING_TRAILER_BEATS.greenStart * duration / 9)} → 標題落定 {seconds(ENDING_TRAILER_BEATS.titleReady * duration / 9)}</>}
    settings={(reset) => <>
      <button onClick={() => { reset(); setDuration(DEFAULT_ENDING_TRAILER_DURATION); }}>9 秒預設</button>
      <label className={studioStyles.setting}>演出總長<input type="range" min="6" max="15" step="0.5" value={duration}
        onChange={(event) => { reset(); setDuration(Number(event.target.value)); }} /><output>{seconds(duration)}</output></label>
    </>}
  >{({ time }) => <EndingStage time={time} duration={duration} />}</TrailerRecordingStudio>;
}
