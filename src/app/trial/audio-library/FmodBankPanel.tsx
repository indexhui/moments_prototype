"use client";

import { useState } from "react";
import {
  FiAlertCircle,
  FiBox,
  FiLoader,
  FiPause,
  FiPlay,
  FiPower,
} from "react-icons/fi";
import {
  FMOD_BANK_EVENTS,
  initializeFmodWeb,
  stopFmodWebEvent,
  type FmodWebController,
} from "@/lib/game/fmodWeb";
import styles from "./audio-library.module.css";

type RuntimeState = "idle" | "loading" | "ready" | "error";

export function FmodBankPanel({ onBeforePlay }: { onBeforePlay: () => void }) {
  const [runtimeState, setRuntimeState] = useState<RuntimeState>("idle");
  const [controller, setController] = useState<FmodWebController | null>(null);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const integratedEventCount = FMOD_BANK_EVENTS.filter((event) => event.use).length;

  const initialize = async () => {
    setRuntimeState("loading");
    setErrorMessage("");

    try {
      const nextController = await initializeFmodWeb();
      setController(nextController);
      setRuntimeState("ready");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setRuntimeState("error");
    }
  };

  const toggleEvent = (path: string) => {
    if (!controller) return;

    try {
      if (activePath === path) {
        controller.stopCurrentEvent();
        setActivePath(null);
        return;
      }

      onBeforePlay();
      controller.playEvent(path);
      setActivePath(path);
      setErrorMessage("");
    } catch (error) {
      setActivePath(null);
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const stop = () => {
    stopFmodWebEvent();
    setActivePath(null);
  };

  return (
    <section className={styles.fmodPanel} aria-labelledby="fmod-bank-title">
      <div className={styles.fmodHeader}>
        <span className={styles.fmodMark}><FiBox aria-hidden="true" /></span>
        <div className={styles.fmodTitle}>
          <span>FMOD STUDIO BANK</span>
          <h2 id="fmod-bank-title">Mobile / Master.bank</h2>
          <p>Bank 內事件可直接點選試聽；首次啟動會載入約 12 MB。</p>
        </div>
        <div className={styles.fmodMeta}>
          <span><b>{FMOD_BANK_EVENTS.length}</b> 個事件</span>
          <span><b>{integratedEventCount}</b> 已接入遊戲</span>
          <span><b>9.5 MB</b> Master.bank</span>
          <span><b>1.7 KB</b> strings</span>
        </div>
      </div>

      {runtimeState !== "ready" ? (
        <div className={styles.fmodGate}>
          <div>
            <strong>
              {runtimeState === "loading" ? "正在載入 FMOD 與 Bank…" : "啟動後才會下載 Bank"}
            </strong>
            <span>瀏覽器需由你的點擊來開啟音訊；一般 OGG 試聽不受影響。</span>
          </div>
          <button
            type="button"
            onClick={() => void initialize()}
            disabled={runtimeState === "loading"}
          >
            {runtimeState === "loading" ? <FiLoader className={styles.spin} /> : <FiPower />}
            {runtimeState === "loading" ? "載入中" : runtimeState === "error" ? "重新嘗試" : "啟動 FMOD Bank"}
          </button>
        </div>
      ) : (
        <>
          <div className={styles.fmodStatus}>
            <span><i /> FMOD 已就緒</span>
            <button type="button" onClick={stop} disabled={!activePath}>停止目前事件</button>
          </div>
          <div className={styles.fmodEventGrid}>
            {FMOD_BANK_EVENTS.map((event) => {
              const isActive = activePath === event.path;
              return (
                <button
                  key={event.path}
                  type="button"
                  className={isActive ? styles.fmodEventActive : ""}
                  onClick={() => toggleEvent(event.path)}
                  title={event.path}
                >
                  <span>{isActive ? <FiPause /> : <FiPlay />}</span>
                  <span>
                    <small>{event.category}</small>
                    <strong>{event.name}</strong>
                    {event.use ? <i>已接入・{event.use}</i> : null}
                    <em>{event.path.replace("event:/", "")}</em>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {errorMessage ? (
        <div className={styles.fmodError} role="alert">
          <FiAlertCircle aria-hidden="true" />
          <span>
            <strong>{errorMessage}</strong>
            <small>
              這份 Bank 位於 Mobile 資料夾；若錯誤包含 ERR_FORMAT 或 ERR_VERSION，請在 FMOD Studio 改用 Web 平台重新 Build。
            </small>
          </span>
        </div>
      ) : null}
    </section>
  );
}
