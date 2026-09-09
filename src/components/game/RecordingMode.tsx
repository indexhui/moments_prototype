"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import styles from "./RecordingMode.module.css";

const STORAGE_KEY = "moment:recording-mode";
const CANVAS_HEIGHT = 852;
const DEFAULT_SETTINGS = { enabled: false, wide: true, hideDialogue: false, hideCursor: true };
type RecordingSettings = typeof DEFAULT_SETTINGS;

function readSettings(): RecordingSettings {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null");
    return Object.fromEntries(Object.entries(DEFAULT_SETTINGS).map(([key, fallback]) => [
      key, typeof stored?.[key] === "boolean" ? stored[key] : fallback,
    ])) as RecordingSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function storeSettings(settings: RecordingSettings) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Recording controls still work when browser storage is unavailable.
  }
}

export function useRecordingMode(pathname: string, search: string) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [toolsVisible, setToolsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  const [size, setSize] = useState({ width: 1440, height: 900, toolbar: 140 });
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const requested = url.searchParams.get("capture");
    if (!initialized.current || requested === "1") {
      const next = { ...readSettings(), ...(requested === "1" ? { enabled: true } : {}) };
      setSettings(next);
      storeSettings(next);
      initialized.current = true;
    }
    // Consume the entry flag so exiting the mode stays effective on this scene.
    if (requested === "1") {
      url.searchParams.delete("capture");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, [pathname, search]);

  const update = useCallback((patch: Partial<RecordingSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      storeSettings(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!settings.enabled) return;
    const measure = () => setSize({
      width: window.innerWidth,
      height: window.innerHeight,
      toolbar: toolbarRef.current?.getBoundingClientRect().height ?? 0,
    });
    measure();
    const observer = new ResizeObserver(measure);
    if (toolbarRef.current) observer.observe(toolbarRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [settings.enabled, toolsVisible]);

  useEffect(() => {
    if (!settings.enabled) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === rootRef.current);
    syncFullscreen();
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("fullscreenchange", syncFullscreen);
    };
  }, [settings.enabled]);

  const toggleFullscreen = useCallback(async () => {
    setFullscreenError("");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (rootRef.current?.requestFullscreen) await rootRef.current.requestFullscreen();
      else setFullscreenError("此瀏覽器不支援網頁全螢幕，請使用瀏覽器的全螢幕功能。");
    } catch {
      setFullscreenError("無法進入全螢幕，請使用瀏覽器的全螢幕功能。");
    }
  }, []);

  const advance = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    // Only activate the topmost mounted dialogue; never broadcast to underlying events.
    const actions = Array.from(stage.querySelectorAll<HTMLElement>("[data-recording-continue='true']"));
    const action = actions.reverse().find((element) =>
      element.getClientRects().length > 0 && !element.closest("[inert], [aria-hidden='true']"),
    );
    if (action) {
      action.click();
      return;
    }
    // Image-only story scenes already expose their own screen-click progression.
    stage.querySelector<HTMLElement>("[data-recording-screen-continue='true']")?.click();
  }, []);

  useEffect(() => {
    if (!settings.enabled) return;
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (
        target.isContentEditable || target.closest("input:not([type='checkbox']):not([type='radio']), textarea, select")
      )) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (!["h", "d", "f", " ", "enter", "arrowright", "escape"].includes(key)) return;
      if ((key === " " || key === "enter" || key === "arrowright") &&
        target instanceof HTMLElement && target.closest("[data-recording-toolbar]")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      if (key === "h") setToolsVisible((value) => !value);
      else if (key === "d") {
        setSettings((current) => {
          const next = { ...current, hideDialogue: !current.hideDialogue };
          storeSettings(next);
          return next;
        });
      } else if (key === "f") void toggleFullscreen();
      else if (key === "escape") setToolsVisible(true);
      else advance();
    };
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [settings.enabled, advance, toggleFullscreen]);

  const canvasWidth = settings.wide ? CANVAS_HEIGHT * 16 / 9 : 393;
  const top = toolsVisible ? size.toolbar + 16 : 0;
  const padding = toolsVisible ? 32 : 0;
  const scale = Math.max(0.01, Math.min(
    (size.width - padding) / canvasWidth,
    (size.height - top - (toolsVisible ? 16 : 0)) / CANVAS_HEIGHT,
  ));
  const style = {
    "--recording-width": `${canvasWidth}px`,
    "--recording-height": `${CANVAS_HEIGHT}px`,
    "--recording-scale": scale,
    "--recording-preview-width": `${canvasWidth * scale}px`,
    "--recording-preview-height": `${CANVAS_HEIGHT * scale}px`,
    "--recording-top": `${top}px`,
    "--recording-bottom": toolsVisible ? "16px" : "0px",
  } as CSSProperties;

  return {
    settings, update, toolsVisible, setToolsVisible, rootRef, stageRef, toolbarRef, style,
    isFullscreen, fullscreenError, toggleFullscreen, advance,
    previewSize: `${Math.round(canvasWidth * scale)} × ${Math.round(CANVAS_HEIGHT * scale)}`,
    exit: () => {
      if (document.fullscreenElement === rootRef.current) void document.exitFullscreen().catch(() => {});
      update({ enabled: false });
      setToolsVisible(true);
    },
  };
}

export function RecordingToolbar({ mode, exhibition, scenePicker }: {
  mode: ReturnType<typeof useRecordingMode>;
  exhibition: boolean;
  scenePicker: ReactNode;
}) {
  const router = useRouter();
  if (!mode.settings.enabled || !mode.toolsVisible) return null;
  return (
    <div ref={mode.toolbarRef} className={styles.toolbar} data-recording-toolbar="true">
      <div className={styles.controls}>
        <strong className={styles.title}>預告錄影模式</strong>
        <nav className={styles.segment} aria-label="錄影版本">
          <NextLink href={`${ROUTES.gameRoot}?capture=1&trial=standard`} aria-current={!exhibition ? "page" : undefined}>正式版</NextLink>
          <NextLink href={`${ROUTES.gameExhibition}?capture=1&trial=standard`} aria-current={exhibition ? "page" : undefined}>展覽版</NextLink>
        </nav>
        <label className={styles.field}>專用演出
          <select
            value=""
            onChange={(event) => {
              if (event.target.value) router.push(event.target.value);
            }}
          >
            <option value="" disabled>選擇演出</option>
            <option value="/trial/recording/sunbeasts">黃金獵犬 × 青蛙・拍照演出</option>
          </select>
        </label>
        <label className={styles.field}>畫面
          <select value={mode.settings.wide ? "wide" : "phone"} onChange={(event) => mode.update({ wide: event.target.value === "wide" })}>
            <option value="wide">16:9 橫式</option>
            <option value="phone">手機直式</option>
          </select>
        </label>
        <label className={styles.field}>
          <input type="checkbox" checked={!mode.settings.hideDialogue} onChange={(event) => mode.update({ hideDialogue: !event.target.checked })} />
          顯示對話 UI（含立繪）
        </label>
        <label className={styles.field}>
          <input type="checkbox" checked={mode.settings.hideCursor} onChange={(event) => mode.update({ hideCursor: event.target.checked })} />
          隱藏游標
        </label>
        <button type="button" onClick={() => void mode.toggleFullscreen()}>{mode.isFullscreen ? "離開全螢幕" : "全螢幕"} <kbd>F</kbd></button>
        <button type="button" onClick={mode.exit}>退出錄影模式</button>
      </div>
      <div className={styles.controls}>
        <div className={styles.scenePicker}>{scenePicker}</div>
        <button type="button" onClick={mode.advance}>下一句 <kbd>Space</kbd></button>
        <button type="button" className={styles.primary} onClick={() => mode.setToolsVisible(false)}>隱藏工具列 <kbd>H</kbd></button>
        <span className={styles.hint}>H 顯示／隱藏工具列 · D 切換對話 · Space／→ 下一句 · Esc 叫回工具列</span>
        <span className={styles.dimensions}>{mode.previewSize}</span>
      </div>
      {mode.fullscreenError ? <p role="status" className={styles.hint}>{mode.fullscreenError}</p> : null}
    </div>
  );
}
