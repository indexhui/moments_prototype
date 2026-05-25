export const IS_GAMEWORKS_TRIAL_BUILD =
  process.env.NEXT_PUBLIC_GAMEWORKS_TRIAL === "1";

export type TrialProfileId = "gameworks";

export const TRIAL_PROFILE_STORAGE_KEY = "moment:trial-profile";

export const CONFIGURED_TRIAL_PROFILE: TrialProfileId | null =
  process.env.NEXT_PUBLIC_TRIAL_PROFILE === "gameworks" ||
  IS_GAMEWORKS_TRIAL_BUILD
    ? "gameworks"
    : null;

export const SHOULD_SHOW_GAME_DEBUG_TOOLS =
  process.env.NEXT_PUBLIC_SHOW_GAME_DEBUG_TOOLS === "1" ||
  (process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_SHOW_GAME_DEBUG_TOOLS !== "0");

export const TRIAL_BUILD_LABEL = IS_GAMEWORKS_TRIAL_BUILD
  ? "GameWork 試玩版"
  : "開發試玩版";

function isTrialProfileId(value: string | null): value is TrialProfileId {
  return value === "gameworks";
}

export function getStoredTrialProfile(): TrialProfileId | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(TRIAL_PROFILE_STORAGE_KEY);
  return isTrialProfileId(raw) ? raw : null;
}

export function getActiveTrialProfile(): TrialProfileId | null {
  return CONFIGURED_TRIAL_PROFILE ?? getStoredTrialProfile();
}

export function withTrialProfileSearch(
  path: string,
  profileId: TrialProfileId | null = getActiveTrialProfile(),
) {
  if (profileId !== "gameworks") return path;

  const hashIndex = path.indexOf("#");
  const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const queryIndex = pathWithoutHash.indexOf("?");
  const pathname = queryIndex >= 0 ? pathWithoutHash.slice(0, queryIndex) : pathWithoutHash;
  const query = queryIndex >= 0 ? pathWithoutHash.slice(queryIndex + 1) : "";
  const params = new URLSearchParams(query);
  if (!params.has("trial")) params.set("trial", profileId);

  const nextQuery = params.toString();
  return `${pathname}${nextQuery ? `?${nextQuery}` : ""}${hash}`;
}

export function setStoredTrialProfile(profileId: TrialProfileId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRIAL_PROFILE_STORAGE_KEY, profileId);
}

export function clearStoredTrialProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TRIAL_PROFILE_STORAGE_KEY);
}
