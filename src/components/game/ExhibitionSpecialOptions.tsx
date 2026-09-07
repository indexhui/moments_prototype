"use client";

import { useEffect, useRef, useState } from "react";
import type { ExhibitionLocale } from "@/lib/game/exhibitionI18n";
import { exportExhibitionRegistrations, loadExhibitionRegistrations } from "@/lib/game/exhibitionEnding";
import { INITIAL_PRIZE_STOCK, PRIZE_TIERS, RAFFLE_CHANGE_EVENT, RAFFLE_STORAGE_KEY, loadRaffleState, resetExhibitionPrizes, type RaffleState } from "@/lib/game/exhibitionRaffle";
import styles from "./ExhibitionEndingView.module.css";

export const SPECIAL_OPTIONS_LABEL = { zh: "特殊選項", ja: "特別設定", en: "Special options" };

export function ExhibitionSpecialOptions({ locale, onClose }: { locale: ExhibitionLocale; onClose: () => void }) {
  const copy = {
    zh: { code: "請輸入管理密碼", enter: "確認", invalid: "密碼不正確，請再試一次。", close: "關閉特殊選項", stock: "獎品剩餘組數", total: "初始", unit: "組", reset: "Reset 獎品庫存", confirm: "將剩餘組數恢復為 A 2、B 3、C 3、D 100。已抽出的結果會保留。", yes: "確認 Reset", cancel: "取消", done: "庫存已重置。", export: "匯出 Email 名單", people: "筆早期預約", note: "庫存與 Email 名單保存在此裝置的瀏覽器。重新開始遊戲不會清除；清除瀏覽器資料則會刪除。", error: "無法讀取或儲存資料，請確認瀏覽器儲存空間。" },
    ja: { code: "管理用パスコード", enter: "確認", invalid: "パスコードが違います。", close: "特別設定を閉じる", stock: "賞品の残り数", total: "初期", unit: "組", reset: "Reset 賞品在庫", confirm: "A 2、B 3、C 3、D 100に戻します。当選結果は保持されます。", yes: "Reset を確認", cancel: "キャンセル", done: "在庫をリセットしました。", export: "メール一覧をエクスポート", people: "件の事前登録", note: "在庫とメールはこの端末のブラウザーに保存されます。ゲームの再開では消えません。ブラウザーデータの削除で消去されます。", error: "データを読み書きできません。保存領域を確認してください。" },
    en: { code: "Enter staff passcode", enter: "Unlock", invalid: "Incorrect passcode. Please try again.", close: "Close special options", stock: "Remaining prize sets", total: "Initial", unit: "sets", reset: "Reset prize stock", confirm: "Restore A 2, B 3, C 3, D 100. Existing draw results will be kept.", yes: "Confirm Reset", cancel: "Cancel", done: "Prize stock reset.", export: "Export email list", people: "pre-registrations", note: "Stock and emails are saved in this device's browser. Restarting the game keeps them; clearing browser data deletes them.", error: "Unable to read or save data. Please check browser storage." },
  }[locale];
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [wrongCode, setWrongCode] = useState(false);
  const [stock, setStock] = useState<RaffleState | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  useEffect(() => {
    if (!unlocked) return;
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const refresh = () => {
      setError(false);
      try { setStock(loadRaffleState()); } catch { setError(true); }
      try { setCount(loadExhibitionRegistrations().length); } catch { setError(true); }
    };
    refresh();
    const onStorage = (event: StorageEvent) => { if (event.key === RAFFLE_STORAGE_KEY) refresh(); };
    window.addEventListener(RAFFLE_CHANGE_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(RAFFLE_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [unlocked]);

  return <div className={styles.backdrop} data-no-story-advance="true" onClick={onClose} onKeyDown={(event) => {
    event.stopPropagation();
    if (event.key === "Escape") onClose();
    if (event.key !== "Tab") return;
    const focusable = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])') ?? []);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!panel.current?.contains(document.activeElement)) { event.preventDefault(); first?.focus(); }
    else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}>
    <div ref={panel} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="special-options-title" onClick={(event) => event.stopPropagation()}>
      <div className={styles.modalHeader}><h2 id="special-options-title">{SPECIAL_OPTIONS_LABEL[locale]}</h2><button className={styles.close} onClick={onClose} aria-label={copy.close}>×</button></div>
      {!unlocked ? <form className={styles.form} onSubmit={(event) => {
        event.preventDefault();
        if (code !== "2026") { setWrongCode(true); return; }
        setCode("");
        setUnlocked(true);
      }}>
        <label htmlFor="exhibition-staff-code">{copy.code}</label>
        <input id="exhibition-staff-code" className={styles.input} type="password" inputMode="numeric" autoComplete="off" maxLength={4} required value={code} onChange={(event) => { setCode(event.target.value); setWrongCode(false); }} aria-invalid={wrongCode} />
        {wrongCode && <p role="alert" className={styles.error}>{copy.invalid}</p>}
        <button type="submit" className={styles.primary}>{copy.enter}</button>
      </form> : <>
        <p>{copy.stock}</p>
        <div className={styles.inventory}>{PRIZE_TIERS.map((tier) => <div key={tier} className={styles.stock}>
          <span>{tier} {locale === "en" ? "prize" : "賞"}</span><strong data-prize-stock={tier}>{stock?.remaining[tier] ?? "—"}</strong><span>{copy.unit} · {copy.total} {INITIAL_PRIZE_STOCK[tier]}</span>
        </div>)}</div>
        {confirming ? <div className={styles.resetConfirm}><p>{copy.confirm}</p><button disabled={busy} className={styles.primary} onClick={async () => {
          setBusy(true);
          try { setStock(await resetExhibitionPrizes()); setConfirming(false); setDone(true); setError(false); }
          catch { setError(true); }
          finally { setBusy(false); }
        }}>{copy.yes}</button><button disabled={busy} className={styles.textButton} onClick={() => setConfirming(false)}>{copy.cancel}</button></div>
          : <button className={styles.primary} onClick={() => { setConfirming(true); setDone(false); }}>{copy.reset}</button>}
        {done && <p className={styles.message} role="status">{copy.done}</p>}
        <p className={styles.adminNote}>{copy.note}</p>
        <p className={styles.adminNote}>{count ?? "—"} {copy.people}</p>
        <button disabled={!count} className={styles.primary} onClick={() => { try { exportExhibitionRegistrations(); } catch { setError(true); } }}>{copy.export}</button>
        {error && <p className={`${styles.message} ${styles.error}`} role="alert">{copy.error}</p>}
      </>}
    </div>
  </div>;
}
