"use client";

export type DialogTypingMode = "char" | "double-char" | "punctuated" | "pause";

const DIALOG_TYPING_MODE_STORAGE_KEY = "moment:dialog-typing-mode";
export const GAME_DIALOG_TYPING_MODE_CHANGE = "moment:dialog-typing-mode-change";

export function loadDialogTypingMode(): DialogTypingMode {
  if (typeof window === "undefined") return "double-char";
  const raw = window.localStorage.getItem(DIALOG_TYPING_MODE_STORAGE_KEY);
  if (
    raw === "char" ||
    raw === "double-char" ||
    raw === "punctuated" ||
    raw === "pause"
  ) {
    return raw;
  }
  return "double-char";
}

export function saveDialogTypingMode(mode: DialogTypingMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DIALOG_TYPING_MODE_STORAGE_KEY, mode);
  window.dispatchEvent(
    new CustomEvent(GAME_DIALOG_TYPING_MODE_CHANGE, { detail: { mode } }),
  );
}

export function getTypingAdvance(mode: DialogTypingMode, currentChar: string) {
  if (mode === "double-char") {
    return { step: 2, delay: 32 };
  }
  if (mode === "pause") {
    if (/[。！？!?]/.test(currentChar)) return { step: 1, delay: 420 };
    if (/[，、,]/.test(currentChar)) return { step: 1, delay: 260 };
    return { step: 1, delay: 170 };
  }
  if (mode === "punctuated") {
    if (/[。！？!?]/.test(currentChar)) return { step: 1, delay: 280 };
    if (/[，、,]/.test(currentChar)) return { step: 1, delay: 160 };
    return { step: 1, delay: 34 };
  }
  return { step: 1, delay: 34 };
}

