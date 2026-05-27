export const IS_GAMEWORKS_TRIAL_BUILD =
  process.env.NEXT_PUBLIC_GAMEWORKS_TRIAL === "1" ||
  process.env.NEXT_PUBLIC_TRIAL_PROFILE === "gameworks";

export const IS_VISION_TRIAL_BUILD =
  process.env.NEXT_PUBLIC_VISION_TRIAL === "1" ||
  process.env.NEXT_PUBLIC_TRIAL_PROFILE === "vision";

export const IS_EXTERNAL_TRIAL_BUILD =
  IS_GAMEWORKS_TRIAL_BUILD || IS_VISION_TRIAL_BUILD;

export type TrialProfileId = "gameworks" | "vision" | "dev";
export type TrialProfilePreference = TrialProfileId | "standard";

export const TRIAL_PROFILE_STORAGE_KEY = "moment:trial-profile";
export const STANDARD_TRIAL_PROFILE_VALUE = "standard";

function isTrialProfileId(value: string | null): value is TrialProfileId {
  return value === "gameworks" || value === "vision" || value === "dev";
}

const CONFIGURED_TRIAL_PROFILE_RAW =
  process.env.NEXT_PUBLIC_TRIAL_PROFILE ?? null;

export const CONFIGURED_TRIAL_PROFILE: TrialProfileId | null =
  isTrialProfileId(CONFIGURED_TRIAL_PROFILE_RAW)
    ? CONFIGURED_TRIAL_PROFILE_RAW
    : IS_GAMEWORKS_TRIAL_BUILD
      ? "gameworks"
      : IS_VISION_TRIAL_BUILD
        ? "vision"
        : null;

export const SHOULD_SHOW_GAME_DEBUG_TOOLS =
  process.env.NEXT_PUBLIC_SHOW_GAME_DEBUG_TOOLS === "1" ||
  (process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_SHOW_GAME_DEBUG_TOOLS !== "0");

export const TRIAL_BUILD_LABEL = IS_GAMEWORKS_TRIAL_BUILD
  ? "GameWork 試玩版"
  : IS_VISION_TRIAL_BUILD
    ? "放視大賞特別版"
    : "開發試玩版";

function isTrialProfilePreference(value: string | null): value is TrialProfilePreference {
  return isTrialProfileId(value) || value === STANDARD_TRIAL_PROFILE_VALUE;
}

export function parseTrialProfilePreference(value: string | string[] | undefined): TrialProfilePreference | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "standard" || raw === "off") return STANDARD_TRIAL_PROFILE_VALUE;
  const candidate = raw ?? null;
  if (isTrialProfileId(candidate)) return candidate;
  return null;
}

export function getStoredTrialProfilePreference(): TrialProfilePreference | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(TRIAL_PROFILE_STORAGE_KEY);
  return isTrialProfilePreference(raw) ? raw : null;
}

export function getStoredTrialProfile(): TrialProfileId | null {
  const preference = getStoredTrialProfilePreference();
  return isTrialProfileId(preference) ? preference : null;
}

export function getActiveTrialProfile(): TrialProfileId | null {
  const storedPreference = getStoredTrialProfilePreference();
  if (storedPreference === STANDARD_TRIAL_PROFILE_VALUE) return null;
  return storedPreference ?? CONFIGURED_TRIAL_PROFILE;
}

export function withTrialProfileSearch(
  path: string,
  profileId: TrialProfileId | null = getActiveTrialProfile(),
) {
  if (!profileId) return path;

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

export function setStoredTrialProfile(profileId: TrialProfilePreference) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRIAL_PROFILE_STORAGE_KEY, profileId);
}

export function clearStoredTrialProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TRIAL_PROFILE_STORAGE_KEY);
}
