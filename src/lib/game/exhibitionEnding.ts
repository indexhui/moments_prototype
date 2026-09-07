const RUN_KEY = "moment:exhibition-run-v1";
const PHOTO_PREFIX = "moment:exhibition-photo-v1:";
const STEP_KEY = "moment:exhibition-ending-step-v1";
export const REGISTRATION_KEY = "moment:exhibition-registrations-v1";
export type EndingStep = "photos" | "ticket" | "prize" | "thanks";
export type ExhibitionPhoto = { imagePath: string; score: number };
export type ExhibitionRegistration = { nickname: string; email: string; registeredAt: string; locale: string };

/** New player: clear only this play session; preserve stock and registrations. */
export function startExhibitionRun() {
  window.sessionStorage.removeItem(RUN_KEY);
  window.sessionStorage.removeItem(STEP_KEY);
  window.sessionStorage.removeItem("moment-exhibition-naotaro-photo");
  for (let i = 0; i < 4; i += 1) window.sessionStorage.removeItem(`${PHOTO_PREFIX}${i}`);
}

export function saveExhibitionPhoto(slot: number, photo: ExhibitionPhoto) {
  try { window.sessionStorage.setItem(`${PHOTO_PREFIX}${slot}`, JSON.stringify(photo)); }
  catch { /* Existing parent state still retains the photo for this play session. */ }
}

export function loadExhibitionPhotos(): Array<ExhibitionPhoto | null> {
  return Array.from({ length: 4 }, (_, index) => {
    try {
      const raw = window.sessionStorage.getItem(`${PHOTO_PREFIX}${index}`);
      const photo = raw ? JSON.parse(raw) as ExhibitionPhoto : null;
      return photo && typeof photo.imagePath === "string" && Number.isFinite(photo.score) ? photo : null;
    } catch { return null; }
  });
}

export function loadExhibitionRegistrations(): ExhibitionRegistration[] {
  const raw = window.localStorage.getItem(REGISTRATION_KEY);
  if (!raw) return [];
  const rows = JSON.parse(raw) as ExhibitionRegistration[];
  if (!Array.isArray(rows) || !rows.every((row) => typeof row?.email === "string" &&
    typeof row.registeredAt === "string" && typeof row.locale === "string" &&
    (row.nickname === undefined || typeof row.nickname === "string"))) throw new Error("Invalid registrations");
  // Existing registrations remain exportable when they predate the nickname field.
  return rows.map((row) => ({ ...row, nickname: row.nickname ?? "" }));
}

export async function registerExhibitionEmail(emailInput: string, locale: string, nicknameInput: string) {
  const email = emailInput.trim().toLowerCase();
  const nickname = nicknameInput.trim();
  if (!nickname || nickname.length > 40 || /[\r\n\t]/.test(nickname)) throw new Error("Invalid nickname");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email");
  const save = () => {
    const rows = loadExhibitionRegistrations();
    const existing = rows.find((row) => row.email === email);
    if (existing) existing.nickname = nickname;
    else rows.push({ nickname, email, locale, registeredAt: new Date().toISOString() });
    window.localStorage.setItem(REGISTRATION_KEY, JSON.stringify(rows));
  };
  if (navigator.locks) await navigator.locks.request(REGISTRATION_KEY, save);
  else save();
}

export function exportExhibitionRegistrations() {
  // Quote fields and neutralize formula prefixes before opening in a spreadsheet.
  const cell = (value: string) => `"${value.replace(/^[=+@-]/, "'$&").replace(/"/g, '""')}"`;
  const rows = loadExhibitionRegistrations();
  const csv = "\uFEFFnickname,email,registered_at,language\r\n" + rows.map((row) =>
    [row.nickname, row.email, row.registeredAt, row.locale].map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `moments-preregistration-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
