"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ExhibitionLocale } from "@/lib/game/exhibitionI18n";

const ExhibitionLocaleContext = createContext<ExhibitionLocale>("zh");

export function ExhibitionLocaleProvider({
  locale,
  children,
}: {
  locale: ExhibitionLocale;
  children: ReactNode;
}) {
  return (
    <ExhibitionLocaleContext.Provider value={locale}>
      {children}
    </ExhibitionLocaleContext.Provider>
  );
}

export function useExhibitionLocale(locale?: ExhibitionLocale) {
  const inheritedLocale = useContext(ExhibitionLocaleContext);
  return locale ?? inheritedLocale;
}
