"use client";

import { useEffect, useState } from "react";
import type { ExhibitionLocale } from "@/lib/game/exhibitionI18n";
import styles from "./DessertRouteDepartureBadge.module.css";

const COMPLETION_DURATION_MS = 1400;

export function DessertRouteDepartureBadge({ ready, depart, locale, onClick }: {
  ready: string;
  depart: string;
  locale: ExhibitionLocale;
  onClick: () => void;
}) {
  const [showDeparture, setShowDeparture] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowDeparture(true), COMPLETION_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.banner} data-locale={locale} data-dessert-completion-banner="true">
      {showDeparture ? (
        <button className={styles.action} data-dessert-nearby-depart="true"
          type="button" onClick={onClick}>
          {depart}<span aria-hidden="true">→</span>
        </button>
      ) : (
        <div className={styles.completion} data-dessert-completion="true" role="status">
          <span className={styles.check} aria-hidden="true">✓</span>
          {ready}
        </div>
      )}
    </div>
  );
}
