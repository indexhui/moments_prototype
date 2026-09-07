"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LuckyTicketView } from "./LuckyTicketView";
import { EXHIBITION_LOCALE_OPTIONS, EXHIBITION_UI_COPY, type ExhibitionLocale } from "@/lib/game/exhibitionI18n";
import {
  registerExhibitionEmail, type EndingStep,
} from "@/lib/game/exhibitionEnding";
import { claimExhibitionPrize, type RaffleReceipt } from "@/lib/game/exhibitionRaffle";
import styles from "./ExhibitionEndingView.module.css";

const ART = "/images/exhibition/ending/";
const COPY = {
  zh: {
    photos: "所拍下的小日獸", dog: "黃金獵犬", frog: "呱", missing: "尚未拍攝", next: "繼續",
    won: "賞獲得", prizes: { A: "小日獸明信片兩張", B: "小日獸明信片・煙火", C: "小日獸明信片・夏日", D: "黃金獵犬貼紙" },
    redeem: "請向現場工作人員出示此畫面領獎", soldOut: "本次獎品已全數送出", soldOutNote: "謝謝您與小日獸一起度過今天！",
    thanks: "謝謝您的遊玩", body: "感謝您與我們一起走走小日，期待與您再次相見。", steamSearch: "搜尋", steamNote: "歡迎將我們加入您的願望清單。", or: "或是手機玩家",
    registrationTitle: "早期預約", nickname: "名稱（暱稱）", nicknameHint: "請輸入您的名稱或暱稱", email: "Email", consent: "我同意提供名稱（暱稱）與 Email，接收走走小日的上市與早期預約消息。", submit: "送出早期預約", saving: "儲存中⋯",
    saved: "已收到您的早期預約，謝謝您的支持！", saveError: "暫時無法儲存，請稍後再試。", storageError: "暫時無法讀取抽獎紀錄，請洽現場工作人員。", retry: "重試", back: "重新播放結尾",
  },
  ja: {
    photos: "撮影したヒビモン", dog: "ゴールデンレトリバー", frog: "ケロ", missing: "未撮影", next: "次へ",
    won: "賞を獲得", prizes: { A: "ヒビモンのポストカード 2枚", B: "ポストカード・花火", C: "ポストカード・夏の日", D: "ゴールデンレトリバーのシール" },
    redeem: "この画面をスタッフに見せて賞品を受け取ってね", soldOut: "賞品の配布は終了しました", soldOutNote: "ヒビモンと過ごしてくれてありがとう！",
    thanks: "遊んでいただき、ありがとうございます", body: "また皆さまと、小さな日々を歩めることを楽しみにしています。", steamSearch: "を検索", steamNote: "ウィッシュリストへの追加をお願いいたします。", or: "スマートフォンで遊ぶ方はこちら",
    registrationTitle: "事前登録", nickname: "お名前（ニックネーム）", nicknameHint: "お名前またはニックネーム", email: "メールアドレス", consent: "メールアドレスを登録し、発売や事前登録のお知らせを受け取ることに同意します。", submit: "事前登録する", saving: "保存中⋯",
    saved: "事前登録を受け付けました。ご支援ありがとうございます。", saveError: "保存できませんでした。もう一度お試しください。", storageError: "抽選記録を読み込めません。スタッフにお知らせください。", retry: "再試行", back: "エンディングをもう一度",
  },
  en: {
    photos: "Your Momentling photos", dog: "Golden Retriever", frog: "Frog", missing: "Not photographed", next: "Continue",
    won: "prize", prizes: { A: "Two Momentling postcards", B: "Momentling postcard · Fireworks", C: "Momentling postcard · Summer", D: "Golden Retriever sticker" },
    redeem: "Show this screen to a staff member to collect your prize", soldOut: "All prizes have been given out", soldOutNote: "Thank you for spending today with the Momentlings!",
    thanks: "Thank you for playing", body: "We look forward to sharing more little moments with you.", steamSearch: "Search for", steamNote: "We would appreciate a place on your wishlist.", or: "Or, for mobile players",
    registrationTitle: "Early registration", nickname: "Name (nickname)", nicknameHint: "Your name or nickname", email: "Email", consent: "I agree to receive Moments launch and pre-registration news at this email address.", submit: "Pre-register", saving: "Saving…",
    saved: "You're registered. Thank you for your support!", saveError: "Unable to save. Please try again.", storageError: "Unable to read your draw record. Please ask a staff member.", retry: "Retry", back: "Replay the ending",
  },
};

export function ExhibitionEndingView({ locale, onRestart, photoImagePaths, photoScores }: {
  locale: ExhibitionLocale;
  onRestart: () => void;
  photoImagePaths: string[];
  photoScores: Array<number | null>;
}) {
  const copy = COPY[locale];
  const localeOption = EXHIBITION_LOCALE_OPTIONS.find((option) => option.id === locale)!;
  const steamSearchText = locale === "ja"
    ? `${localeOption.logoAlt}${copy.steamSearch}`
    : `${copy.steamSearch}${locale === "en" ? " " : ""}${localeOption.logoAlt}`;
  const [step, setStep] = useState<EndingStep>("photos");
  // A fresh claim for each visit to the ending; never restore an earlier visit.
  const claimId = useRef<string | null>(null);
  const [receipt, setReceipt] = useState<RaffleReceipt | null>(null);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [registration, setRegistration] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [step]);

  const goTo = (next: EndingStep) => setStep(next);

  if (step === "ticket") return <LuckyTicketView locale={locale}
    onDraw={async () => {
      claimId.current ??= crypto.randomUUID();
      const result = await claimExhibitionPrize(claimId.current);
      setReceipt(result);
      return result.prize;
    }}
    onContinue={() => goTo("prize")}
  />;

  const prize = receipt?.prize;
  return <section className={`${styles.page} ${step === "thanks" ? styles.thanks : ""}`} data-exhibition-ending={step}>
    {step === "photos" && <>
      <header className={styles.header}><h1 ref={heading} tabIndex={-1}>{copy.photos}</h1></header>
      <div className={styles.collage}>
        {[0, 1, 2, 3].map((index) => {
          const score = photoScores[index];
          const imagePath = photoImagePaths[index];
          const label = index === 0 ? copy.dog : copy.frog;
          const stars = score == null ? 0 : score >= 90 ? 3 : score >= 70 ? 2 : 1;
          return <figure key={index} className={styles.photo} style={{ "--delay": `${120 + index * 360}ms` } as CSSProperties}>
            <img className={styles.tape} src={`${ART}photo-tape.svg`} width={118} height={29} alt="" />
            <div className={styles.photoWindow}>{imagePath ? <img className={styles.photoImage} src={imagePath} alt={`${label} ${index + 1}`} /> : <div className={styles.missing}>{copy.missing}</div>}</div>
            <figcaption>{label}</figcaption>
            {score != null && <div className={styles.stars} aria-label={`${Math.round(score)}%`}>
              {[1, 2, 3].map((star) => <img key={star} src={`${ART}star.svg`} width={17} height={17} alt="" style={{ "--star-order": star - 1, ...(star > stars ? { filter: "grayscale(1)", "--star-opacity": 0.4 } : {}) } as CSSProperties} />)}
            </div>}
          </figure>;
        })}
      </div>
      <button className={`${styles.primary} ${styles.next}`} onClick={() => goTo("ticket")}>{copy.next}</button>
    </>}
    {step === "prize" && <>
      <header className={`${styles.header} ${styles.prizeHeader}`}>
        <h1 ref={heading} tabIndex={-1}>{prize ? `${prize} ${copy.won}` : copy.soldOut}</h1>
        {prize && <p>{copy.prizes[prize]}</p>}
      </header>
      {prize ? <>
        <div className={`${styles.prizeArt} ${prize === "A" ? styles.pair : ""}`}>
          {(prize === "A" || prize === "C") && <img className={styles.postcard} src={`${ART}postcard-summer.png`} alt={copy.prizes.C} />}
          {(prize === "A" || prize === "B") && <img className={styles.postcard} src={`${ART}postcard-fireworks.png`} alt={copy.prizes.B} />}
          {prize === "D" && <img className={styles.sticker} src={`${ART}dog-sticker.png`} alt={copy.prizes.D} />}
        </div>
        <p className={styles.prizeNote}>{copy.redeem}</p>
      </> : <p className={styles.empty}>{copy.soldOutNote}</p>}
      <button className={`${styles.primary} ${styles.next} ${styles.prizeNext}`} onClick={() => goTo("thanks")}>{copy.next}</button>
    </>}
    {step === "thanks" && <>
      <img className={styles.logo} src={localeOption.logo} data-locale={locale} width={343} height={100} alt={localeOption.logoAlt} />
      <div className={styles.thanksCard}>
        <h1 ref={heading} tabIndex={-1}>{copy.thanks}</h1>
        <p>{copy.body}</p>
        <div className={styles.steam}>
          <img src={`${ART}steam-logo.png`} width={112} height={34} alt="Steam" />
          <p className={styles.steamSearch}>{steamSearchText}</p>
          <small>{copy.steamNote}</small>
        </div>
        <div className={styles.divider}>{copy.or}</div>
        {registration === "saved" ? <p className={styles.message} role="status">{copy.saved}</p> : <form className={styles.form} onSubmit={async (event) => {
          event.preventDefault();
          if (!consent || registration === "saving") return;
          setRegistration("saving");
          try {
            await registerExhibitionEmail(email, locale, nickname);
            setNickname("");
            setEmail("");
            setRegistration("saved");
          } catch { setRegistration("error"); }
        }}>
          <h2 className={styles.formTitle}>{copy.registrationTitle}</h2>
          <label htmlFor="exhibition-nickname">{copy.nickname}</label>
          <input className={styles.input} id="exhibition-nickname" name="nickname" type="text" autoComplete="off" maxLength={40} pattern=".*\S.*" placeholder={copy.nicknameHint} required value={nickname} onChange={(event) => setNickname(event.target.value)} />
          <label htmlFor="exhibition-email">{copy.email}</label>
          <input className={styles.input} id="exhibition-email" type="email" inputMode="email" autoComplete="off" maxLength={254} placeholder="hello@example.com" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <label className={styles.consent}><input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} />{copy.consent}</label>
          <button className={styles.primary} type="submit" disabled={registration === "saving"}>{registration === "saving" ? copy.saving : copy.submit}</button>
          {registration === "error" && <p className={`${styles.message} ${styles.error}`} role="alert">{copy.saveError}</p>}
        </form>}
      </div>
      <div className={styles.thanksActions}>
      <button className={styles.textButton} onClick={onRestart}>{EXHIBITION_UI_COPY.restart[locale]}</button>
      <button className={styles.textButton} onClick={() => {
        claimId.current = null;
        setReceipt(null);
        setNickname("");
        setEmail("");
        setConsent(false);
        setRegistration("idle");
        goTo("photos");
      }}>{copy.back}</button>
      </div>
    </>}
  </section>;
}
