"use client";

import { Box } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { RECORDING_STUDIOS, type RecordingStudioId } from "@/lib/game/recordingStudios";
import { EXHIBITION_LOCALE_OPTIONS, getExhibitionHtmlLang, parseExhibitionLocale, type ExhibitionLocale } from "@/lib/game/exhibitionI18n";
import { RECORDING_LOCALE_STORAGE_KEY } from "@/lib/game/trailerI18n";
import { ExhibitionLocaleProvider } from "./ExhibitionLocaleContext";
import styles from "./TrailerRecordingStudio.module.css";

const seconds = (value: number) => `${value.toFixed(1)} 秒`;
const NO_CUES: readonly number[] = [];

type TrailerRecordingStudioProps = {
  id: RecordingStudioId;
  title: string;
  badge: string;
  duration: number;
  assets: readonly string[];
  description: string;
  timelineHint?: ReactNode;
  settings?: (reset: () => void) => ReactNode;
  soundLabel?: string;
  soundCues?: readonly number[];
  prepareAudio?: () => void;
  playCue?: (cueIndex: number) => void;
  children: (state: { time: number; preview: boolean }) => ReactNode;
};

export function TrailerRecordingStudio({ id, title, badge, duration, assets, description, timelineHint, settings,
  soundLabel = "演出音效", soundCues = NO_CUES, prepareAudio, playCue, children,
}: TrailerRecordingStudioProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [locale, setLocale] = useState<ExhibitionLocale>("zh");
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
    const query = new URLSearchParams(window.location.search).get("lang");
    let saved: string | null = null;
    try { saved = window.sessionStorage.getItem(RECORDING_LOCALE_STORAGE_KEY); } catch { /* URL still works when storage is unavailable. */ }
    const selected = parseExhibitionLocale(query ?? saved);
    setLocale(selected);
    try { window.sessionStorage.setItem(RECORDING_LOCALE_STORAGE_KEY, selected); } catch { /* Optional recording preference. */ }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setMounted(true);
    setReady(false);
    setAssetError(false);
    Promise.all(assets.map((src) => new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => image.decode().then(resolve, reject);
      image.onerror = () => reject(new Error(src));
      image.src = src;
    }))).then(() => { if (!cancelled) setReady(true); })
      .catch(() => { if (!cancelled) setAssetError(true); });
    prepareAudio?.();
    return () => { cancelled = true; };
  }, [loadAttempt, assets, prepareAudio]);

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

  const reset = useCallback(() => {
    seek(0);
    setStarted(false);
    setPlaying(false);
  }, [seek]);

  const togglePlayback = useCallback(() => {
    if (!ready) return;
    if (!started || timeRef.current >= duration) replay();
    else setPlaying((value) => !value);
  }, [ready, started, duration, replay]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const from = timeRef.current;
      const next = Math.min(duration, from + (now - previous) / 1000);
      previous = now;
      if (sound) soundCues.forEach((cue, index) => { if (from < cue && next >= cue) playCue?.(index); });
      if (next >= duration) {
        if (loop) seek(0);
        else { seek(duration); setPlaying(false); return; }
      } else seek(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, loop, sound, duration, soundCues, playCue, seek]);

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
  const stateLabel = !ready ? "準備素材" : !started ? "構圖預覽" : playing ? "播放中" : time >= duration ? "演出結束" : "已暫停";

  // This recording canvas needs a browser viewport and decoded images. Mount
  // after the shared Emotion provider hydrates, before enabling playback.
  if (!mounted) return null;

  return <Box as="main" ref={rootRef} className={styles.root} style={stageStyle} data-recording-mode="true" data-trailer-playing={playing ? "true" : "false"}>
    {showControls && <div className={styles.toolbar} ref={toolbarRef} data-trailer-toolbar="true">
      <div className={styles.row}>
        <NextLink href={`/trial/recording?lang=${locale}`} className={styles.back}>← 錄影工具</NextLink>
        <h1>{title}</h1>
        <select className={styles.studioSelect} aria-label="選擇專用演出" value={id} onChange={(event) => {
          const next = RECORDING_STUDIOS.find((studio) => studio.id === event.target.value);
          if (next) router.push(`${next.href}?lang=${locale}`);
        }}>
          {RECORDING_STUDIOS.map((studio) => <option key={studio.id} value={studio.id}>{studio.label}</option>)}
        </select>
        <span className={styles.badge}>{badge}</span>
        <label className={styles.setting}>錄影語言
          <select className={styles.studioSelect} aria-label="錄影語言" value={locale} onChange={(event) => {
            const selected = parseExhibitionLocale(event.target.value);
            reset();
            setLocale(selected);
            try { window.sessionStorage.setItem(RECORDING_LOCALE_STORAGE_KEY, selected); } catch { /* Optional recording preference. */ }
            const url = new URL(window.location.href);
            url.searchParams.set("lang", selected);
            window.history.replaceState(window.history.state, "", url);
          }}>
            {EXHIBITION_LOCALE_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
          </select>
        </label>
        <button className={styles.primary} disabled={!ready} onClick={() => replay(true)}>播放並隱藏工具列</button>
        <button disabled={!ready} onClick={togglePlayback}>{playing ? "暫停" : started && time < duration ? "繼續播放" : "播放預覽"}</button>
        <button disabled={!ready} onClick={() => replay()}>重播 <kbd>R</kbd></button>
        <button onClick={() => void toggleFullscreen()}>{fullscreen ? "離開全螢幕" : "全螢幕"} <kbd>F</kbd></button>
        <button onClick={() => setShowControls(false)}>隱藏工具列 <kbd>H</kbd></button>
      </div>
      <div className={styles.row}>
        {settings?.(reset)}
        {playCue && <label className={styles.check}><input type="checkbox" checked={sound} onChange={(event) => setSound(event.target.checked)} />{soundLabel}</label>}
        <label className={styles.check}><input type="checkbox" checked={loop} onChange={(event) => setLoop(event.target.checked)} />循環播放</label>
      </div>
      <div className={styles.row}>
        <span className={styles.status} role="status">{stateLabel}</span>
        <input className={styles.timeline} aria-label="演出時間" type="range" min="0" max={duration} step="0.01" value={time} disabled={!ready} onChange={(event) => { setPlaying(false); setStarted(true); seek(Number(event.target.value)); }} />
        <output className={styles.time}>{seconds(time)} / {seconds(duration)}</output>
        <span className={styles.hint}>{timelineHint}</span>
      </div>
      <p className={styles.hint}>{description} H 工具列 · R 重播 · 空白鍵 暫停／繼續 · F 全螢幕 · Esc 叫回工具列。</p>
      {assetError && <p role="alert">素材載入失敗。<button onClick={() => setLoadAttempt((value) => value + 1)}>重新載入素材</button></p>}
      {notice && <p role="status">{notice}</p>}
    </div>}
    <div className={styles.stageArea}>
      <div className={styles.stage} data-trailer-stage={id} data-trailer-time={time.toFixed(2)} lang={getExhibitionHtmlLang(locale)} data-trailer-locale={locale}>
        <ExhibitionLocaleProvider locale={locale}>{children({ time, preview: !started })}</ExhibitionLocaleProvider>
      </div>
    </div>
  </Box>;
}
