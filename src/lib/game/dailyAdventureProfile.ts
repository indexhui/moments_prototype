export const DAILY_ADVENTURE_HAIR_STYLES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
] as const;
export const DAILY_ADVENTURE_HAIR_COLORS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
] as const;
export const DAILY_ADVENTURE_FACE_STYLES = [1, 2, 3] as const;
export const DAILY_ADVENTURE_SKIN_TONES = [0, 1, 2, 3] as const;
export const DAILY_ADVENTURE_EYEBROW_STYLES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export const DAILY_ADVENTURE_EYE_STYLES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
] as const;
export const DAILY_ADVENTURE_NOSE_STYLES = [0, 1, 2, 3, 4, 5, 6, 7] as const;
export const DAILY_ADVENTURE_MOUTH_STYLES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
] as const;
export const DAILY_ADVENTURE_CLOTHES_STYLES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27,
] as const;
export const DAILY_ADVENTURE_ACCESSORY_STYLES = [0, 1, 2, 3, 4] as const;
export const DAILY_ADVENTURE_BLUSH_STYLES = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
] as const;
export const DAILY_ADVENTURE_ORNAMENT_STYLES = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
] as const;
export const DAILY_ADVENTURE_MAKEUP_STYLES = [0, 1, 2, 3, 4, 5, 6] as const;
export const DAILY_ADVENTURE_MOLE_STYLES = [0, 1, 2, 3, 4, 5] as const;
export const DAILY_ADVENTURE_STAMP_STYLES = [0, 1, 2, 3] as const;
export const DAILY_ADVENTURE_BACKGROUND_STYLES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
] as const;

export type DailyAdventureAvatarConfig = {
  faceStyle: (typeof DAILY_ADVENTURE_FACE_STYLES)[number];
  skinTone: (typeof DAILY_ADVENTURE_SKIN_TONES)[number];
  hairStyle: (typeof DAILY_ADVENTURE_HAIR_STYLES)[number];
  hairColor: (typeof DAILY_ADVENTURE_HAIR_COLORS)[number];
  eyebrowStyle: (typeof DAILY_ADVENTURE_EYEBROW_STYLES)[number];
  eyeStyle: (typeof DAILY_ADVENTURE_EYE_STYLES)[number];
  noseStyle: (typeof DAILY_ADVENTURE_NOSE_STYLES)[number];
  mouthStyle: (typeof DAILY_ADVENTURE_MOUTH_STYLES)[number];
  clothesStyle: (typeof DAILY_ADVENTURE_CLOTHES_STYLES)[number];
  accessoryStyle: (typeof DAILY_ADVENTURE_ACCESSORY_STYLES)[number];
  blushStyle: (typeof DAILY_ADVENTURE_BLUSH_STYLES)[number];
  ornamentStyle: (typeof DAILY_ADVENTURE_ORNAMENT_STYLES)[number];
  makeupStyle: (typeof DAILY_ADVENTURE_MAKEUP_STYLES)[number];
  moleStyle: (typeof DAILY_ADVENTURE_MOLE_STYLES)[number];
  stampStyle: (typeof DAILY_ADVENTURE_STAMP_STYLES)[number];
  backgroundStyle: (typeof DAILY_ADVENTURE_BACKGROUND_STYLES)[number];
};

export type DailyAdventureProfile = {
  version: 1;
  name: string;
  avatar: DailyAdventureAvatarConfig;
};

export const DAILY_ADVENTURE_PROFILE_CHANGE_EVENT =
  "moment:daily-adventure-profile-change";
const DAILY_ADVENTURE_PROFILE_STORAGE_KEY = "moment:daily-adventure:profile-v1";

export const DEFAULT_DAILY_ADVENTURE_AVATAR: DailyAdventureAvatarConfig = {
  faceStyle: 1,
  skinTone: 0,
  hairStyle: 10,
  hairColor: 3,
  eyebrowStyle: 2,
  eyeStyle: 3,
  noseStyle: 1,
  mouthStyle: 3,
  clothesStyle: 5,
  accessoryStyle: 0,
  blushStyle: 0,
  ornamentStyle: 0,
  makeupStyle: 0,
  moleStyle: 0,
  stampStyle: 0,
  backgroundStyle: 2,
};

function isNumberOption<T extends readonly number[]>(
  value: unknown,
  options: T,
): value is T[number] {
  return typeof value === "number" && options.includes(value);
}

function normalizeAvatar(value: unknown): DailyAdventureAvatarConfig {
  const avatar =
    value && typeof value === "object"
      ? (value as Partial<DailyAdventureAvatarConfig>)
      : {};
  return {
    faceStyle: isNumberOption(avatar.faceStyle, DAILY_ADVENTURE_FACE_STYLES)
      ? avatar.faceStyle
      : DEFAULT_DAILY_ADVENTURE_AVATAR.faceStyle,
    skinTone: isNumberOption(avatar.skinTone, DAILY_ADVENTURE_SKIN_TONES)
      ? avatar.skinTone
      : DEFAULT_DAILY_ADVENTURE_AVATAR.skinTone,
    hairStyle: isNumberOption(avatar.hairStyle, DAILY_ADVENTURE_HAIR_STYLES)
      ? avatar.hairStyle
      : DEFAULT_DAILY_ADVENTURE_AVATAR.hairStyle,
    hairColor: isNumberOption(avatar.hairColor, DAILY_ADVENTURE_HAIR_COLORS)
      ? avatar.hairColor
      : DEFAULT_DAILY_ADVENTURE_AVATAR.hairColor,
    eyebrowStyle: isNumberOption(
      avatar.eyebrowStyle,
      DAILY_ADVENTURE_EYEBROW_STYLES,
    )
      ? avatar.eyebrowStyle
      : DEFAULT_DAILY_ADVENTURE_AVATAR.eyebrowStyle,
    eyeStyle: isNumberOption(avatar.eyeStyle, DAILY_ADVENTURE_EYE_STYLES)
      ? avatar.eyeStyle
      : DEFAULT_DAILY_ADVENTURE_AVATAR.eyeStyle,
    noseStyle: isNumberOption(avatar.noseStyle, DAILY_ADVENTURE_NOSE_STYLES)
      ? avatar.noseStyle
      : DEFAULT_DAILY_ADVENTURE_AVATAR.noseStyle,
    mouthStyle: isNumberOption(avatar.mouthStyle, DAILY_ADVENTURE_MOUTH_STYLES)
      ? avatar.mouthStyle
      : DEFAULT_DAILY_ADVENTURE_AVATAR.mouthStyle,
    clothesStyle: isNumberOption(
      avatar.clothesStyle,
      DAILY_ADVENTURE_CLOTHES_STYLES,
    )
      ? avatar.clothesStyle
      : DEFAULT_DAILY_ADVENTURE_AVATAR.clothesStyle,
    accessoryStyle: isNumberOption(
      avatar.accessoryStyle,
      DAILY_ADVENTURE_ACCESSORY_STYLES,
    )
      ? avatar.accessoryStyle
      : DEFAULT_DAILY_ADVENTURE_AVATAR.accessoryStyle,
    blushStyle: isNumberOption(avatar.blushStyle, DAILY_ADVENTURE_BLUSH_STYLES)
      ? avatar.blushStyle
      : DEFAULT_DAILY_ADVENTURE_AVATAR.blushStyle,
    ornamentStyle: isNumberOption(
      avatar.ornamentStyle,
      DAILY_ADVENTURE_ORNAMENT_STYLES,
    )
      ? avatar.ornamentStyle
      : DEFAULT_DAILY_ADVENTURE_AVATAR.ornamentStyle,
    makeupStyle: isNumberOption(
      avatar.makeupStyle,
      DAILY_ADVENTURE_MAKEUP_STYLES,
    )
      ? avatar.makeupStyle
      : DEFAULT_DAILY_ADVENTURE_AVATAR.makeupStyle,
    moleStyle: isNumberOption(avatar.moleStyle, DAILY_ADVENTURE_MOLE_STYLES)
      ? avatar.moleStyle
      : DEFAULT_DAILY_ADVENTURE_AVATAR.moleStyle,
    stampStyle: isNumberOption(avatar.stampStyle, DAILY_ADVENTURE_STAMP_STYLES)
      ? avatar.stampStyle
      : DEFAULT_DAILY_ADVENTURE_AVATAR.stampStyle,
    backgroundStyle: isNumberOption(
      avatar.backgroundStyle,
      DAILY_ADVENTURE_BACKGROUND_STYLES,
    )
      ? avatar.backgroundStyle
      : DEFAULT_DAILY_ADVENTURE_AVATAR.backgroundStyle,
  };
}

export function loadDailyAdventureProfile(): DailyAdventureProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DAILY_ADVENTURE_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<DailyAdventureProfile>;
    const name = typeof value.name === "string" ? value.name.trim().slice(0, 12) : "";
    if (!name) return null;
    return {
      version: 1,
      name,
      avatar: normalizeAvatar(value.avatar),
    };
  } catch {
    return null;
  }
}

export function saveDailyAdventureProfile(profile: {
  name: string;
  avatar: DailyAdventureAvatarConfig;
}) {
  if (typeof window === "undefined") return null;
  const name = profile.name.trim().slice(0, 12);
  if (!name) return null;
  const normalized: DailyAdventureProfile = {
    version: 1,
    name,
    avatar: normalizeAvatar(profile.avatar),
  };
  window.localStorage.setItem(
    DAILY_ADVENTURE_PROFILE_STORAGE_KEY,
    JSON.stringify(normalized),
  );
  window.dispatchEvent(
    new CustomEvent(DAILY_ADVENTURE_PROFILE_CHANGE_EVENT, {
      detail: normalized,
    }),
  );
  return normalized;
}

export function resetDailyAdventureProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DAILY_ADVENTURE_PROFILE_STORAGE_KEY);
  window.dispatchEvent(
    new CustomEvent(DAILY_ADVENTURE_PROFILE_CHANGE_EVENT, { detail: null }),
  );
}

function pngPath(folder: string, value: number) {
  const useLowercaseExtension =
    value === 0 || (folder === "makeup" && value === 6);
  return `/images/shiroface/${folder}/${value}.${useLowercaseExtension ? "png" : "PNG"}`;
}

function hairPath(style: number, color: number) {
  const usableColor = style === 34 && color === 8 ? 7 : color;
  if (style === 8) {
    return `/images/shiroface/hair/${style}/${usableColor}-min.PNG`;
  }
  const extension = style >= 23 && style <= 30 ? "png" : "PNG";
  return `/images/shiroface/hair/${style}/${usableColor}.${extension}`;
}

function eyebrowPath(style: number, color: number) {
  if (style === 1) return "/images/shiroface/eyebrow/1/1.png";
  if (style === 3) return "/images/shiroface/eyebrow/3/IMG_0519.png";
  if (style === 6) return "/images/shiroface/eyebrow/6/IMG_0560.png";
  if (style === 9) return "/images/shiroface/eyebrow/9/IMG_0533.png";
  return `/images/shiroface/eyebrow/${style}/${color}.png`;
}

function facePath(style: number, skinTone: number) {
  return `/images/shiroface/face/${style}/${skinTone}.${skinTone === 0 ? "png" : "PNG"}`;
}

function backgroundPath(style: number) {
  return `/images/shiroface/bg/${style}.${style >= 9 ? "png" : "PNG"}`;
}

export function getDailyAdventureAvatarLayerPaths(
  avatar: DailyAdventureAvatarConfig,
) {
  return [
    backgroundPath(avatar.backgroundStyle),
    facePath(avatar.faceStyle, avatar.skinTone),
    pngPath("clothes", avatar.clothesStyle),
    hairPath(avatar.hairStyle, avatar.hairColor),
    pngPath("makeup", avatar.makeupStyle),
    pngPath("blush", avatar.blushStyle),
    pngPath("eyes", avatar.eyeStyle),
    eyebrowPath(avatar.eyebrowStyle, avatar.hairColor),
    pngPath("nose", avatar.noseStyle),
    pngPath("mouth", avatar.mouthStyle),
    pngPath("mole", avatar.moleStyle),
    pngPath("accessories", avatar.accessoryStyle),
    pngPath("ornament", avatar.ornamentStyle),
    pngPath("stamp", avatar.stampStyle),
  ];
}
