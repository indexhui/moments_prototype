"use client";

import { Box } from "@chakra-ui/react";
import NextLink from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
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
  const [mounted, setMounted] = useState(false);
  const [timing, setTiming] = useState(DEFAULT_SUNBEAST_TRAILER_TIMING);
  const timeline = getSunbeastTrailerTimeline(timing);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loop, setLoop] = useState(false);
  const [sound, setSound] = useState(true);
  const [ready, setReady] = useState(false);
  const [assetError, setAssetError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [notice, setNotice] = useState("");
  const [viewport, setViewport] = useState({ width: 1280, height: 720, toolbar: 170 });
  const rootRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);

  const seek = useCallback((value: number) => {
    timeRef.current = value;
    setTime(value);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setMounted(true);
    setReady(false);
    setAssetError(false);
    Promise.all(ASSETS.map((src) => new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => image.decode().then(resolve, reject);
      image.onerror = () => reject(new Error(src));
      image.src = src;
    }))).then(() => { if (!cancelled) setReady(true); })
      .catch(() => { if (!cancelled) setAssetError(true); });
    preparePhotoShutterSound();
    return () => { cancelled = true; };
  }, [loadAttempt]);

  useEffect(() => {
    const measure = () => setViewport({ width: window.innerWidth, height: window.innerHeight, toolbar: toolbarRef.current?.getBoundingClientRect().height ?? 0 });
    measure();
    const observer = new ResizeObserver(measure);
    if (toolbarRef.current) observer.observe(toolbarRef.current);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [showControls, mounted]);

  useEffect(() => {
    const onFullscreen = () => setFullscreen(document.fullscreenElement === rootRef.current);
    const onVisibility = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (rootRef.current?.requestFullscreen) await rootRef.current.requestFullscreen();
      else setNotice("此瀏覽器不支援網頁全螢幕，請使用瀏覽器的全螢幕功能。");
    } catch {
      setNotice("無法進入全螢幕，請使用瀏覽器的全螢幕功能。");
    }
  }, []);

  const replay = useCallback((hideControls = false) => {
    if (!ready) return;
    seek(0);
    setStarted(true);
    setPlaying(true);
    setNotice("");
    if (hideControls) setShowControls(false);
  }, [ready, seek]);

  const togglePlayback = useCallback(() => {
    if (!ready) return;
    if (!started || timeRef.current >= timeline.duration) replay();
    else setPlaying((value) => !value);
  }, [ready, started, timeline.duration, replay]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const from = timeRef.current;
      const next = Math.min(timeline.duration, from + (now - previous) / 1000);
      previous = now;
      if (sound && [timeline.dogShot, timeline.frogShot].some((shot) => from < shot && next >= shot)) playPhotoShutterSound();
      if (next >= timeline.duration) {
        if (loop) seek(0);
        else { seek(timeline.duration); setPlaying(false); return; }
      } else seek(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, loop, sound, timeline.duration, timeline.dogShot, timeline.frogShot, seek]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat || (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, select, textarea")))) return;
      const key = event.key.toLowerCase();
      if (key === " " && target instanceof HTMLElement && target.closest("button, a")) return;
      if (!["h", "r", "f", " ", "escape"].includes(key)) return;
      event.preventDefault();
      if (key === "h") setShowControls((value) => !value);
      else if (key === "r") replay();
      else if (key === "f") void toggleFullscreen();
      else if (key === "escape") setShowControls(true);
      else togglePlayback();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [replay, toggleFullscreen, togglePlayback]);

  const top = showControls ? viewport.toolbar + 16 : 0;
  const padding = showControls ? 32 : 0;
  const width = Math.max(1, Math.min(viewport.width - padding, (viewport.height - top - (showControls ? 16 : 0)) * 16 / 9));
  const stageStyle = { "--trailer-width": `${width}px`, "--trailer-top": `${top}px`, "--trailer-bottom": showControls ? "16px" : "0px" } as CSSProperties;
  const stateLabel = !ready ? "準備素材" : !started ? "構圖預覽" : playing ? "播放中" : time >= timeline.duration ? "演出結束" : "已暫停";

  // This recording canvas needs a browser viewport and decoded images. Mount
  // after the shared Emotion provider hydrates, before enabling playback.
  if (!mounted) return null;

  return <Box as="main" ref={rootRef} className={styles.root} style={stageStyle} data-recording-mode="true" data-trailer-playing={playing ? "true" : "false"}>
    {showControls && <div className={styles.toolbar} ref={toolbarRef} data-trailer-toolbar="true">
      <div className={styles.row}>
        <NextLink href="/trial/recording" className={styles.back}>← 錄影工具</NextLink>
        <h1>黃金獵犬 × 青蛙</h1>
        <span className={styles.badge}>16:9 · 捷運 × 便利商店</span>
        <button className={styles.primary} disabled={!ready} onClick={() => replay(true)}>播放並隱藏工具列</button>
        <button disabled={!ready} onClick={togglePlayback}>{playing ? "暫停" : started && time < timeline.duration ? "繼續播放" : "播放預覽"}</button>
        <button disabled={!ready} onClick={() => replay()}>重播 <kbd>R</kbd></button>
        <button onClick={() => void toggleFullscreen()}>{fullscreen ? "離開全螢幕" : "全螢幕"} <kbd>F</kbd></button>
        <button onClick={() => setShowControls(false)}>隱藏工具列 <kbd>H</kbd></button>
      </div>
      <div className={styles.row}>
        <button onClick={() => {
          setPlaying(false); setStarted(false); seek(0);
          setTiming(DEFAULT_SUNBEAST_TRAILER_TIMING);
        }}>5.5 秒預設</button>
        {([
          { key: "wait", label: "兩邊出現後等待", min: 0.1, max: 8, step: 0.1 },
          { key: "focus", label: "準星對焦", min: 0.5, max: 3, step: 0.1 },
          { key: "gap", label: "換邊等待", min: 0.5, max: 6, step: 0.5 },
        ] as const).map(({key, label, min, max, step}) => <label className={styles.setting} key={key}>
          {label}<input type="range" min={min} max={max} step={step} value={timing[key]} onChange={(event) => {
            setPlaying(false); setStarted(false); seek(0);
            setTiming((current) => ({ ...current, [key]: Number(event.target.value) }));
          }} /><output>{seconds(timing[key])}</output>
        </label>)}
        <label className={styles.check}><input type="checkbox" checked={sound} onChange={(event) => setSound(event.target.checked)} />快門音效</label>
        <label className={styles.check}><input type="checkbox" checked={loop} onChange={(event) => setLoop(event.target.checked)} />循環播放</label>
      </div>
      <div className={styles.row}>
        <span className={styles.status} role="status">{stateLabel}</span>
        <input className={styles.timeline} aria-label="演出時間" type="range" min="0" max={timeline.duration} step="0.01" value={time} disabled={!ready} onChange={(event) => { setPlaying(false); setStarted(true); seek(Number(event.target.value)); }} />
        <output className={styles.time}>{seconds(time)} / {seconds(timeline.duration)}</output>
        <span className={styles.hint}>左拍 {seconds(timeline.dogShot)} → 右拍 {seconds(timeline.frogShot)}</span>
      </div>
      <p className={styles.hint}>左半整塊出現 → 右半整塊出現 → 左邊拍照／三星拍立得 → 右邊拍照／三星拍立得。青蛙由右往左循環跳躍。H 工具列 · R 重播 · 空白鍵 暫停／繼續 · F 全螢幕 · Esc 叫回工具列。</p>
      {assetError && <p role="alert">素材載入失敗。<button onClick={() => setLoadAttempt((value) => value + 1)}>重新載入素材</button></p>}
      {notice && <p role="status">{notice}</p>}
    </div>}
    <div className={styles.stageArea}>
      <div className={styles.stage} data-trailer-stage="true" data-trailer-time={time.toFixed(2)}>
        <PhotoPanel side="dog" time={time} timing={timing} preview={!started} />
        <PhotoPanel side="frog" time={time} timing={timing} preview={!started} />
      </div>
    </div>
  </Box>;
}
