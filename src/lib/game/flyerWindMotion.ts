export type WindZoneId = "right" | "top" | "left" | "bottom";
export type FlyerPhase = "flying" | "feedback" | "complete" | "frog-reveal";
export type FlyerResult = "base" | "bonus" | "missed";
export type DogMood = "normal" | "nervous" | "happy";

export type TrackPoint = {
  xPct: number;
  yPct: number;
};

export type WindTrack = {
  start: TrackPoint;
  end: TrackPoint;
  rotate: number;
  curvePct: number;
  curveSecondaryPct?: number;
  thicknessPct: number;
};

export type WindStep = {
  id: string;
  arrow: string;
  zoneId: WindZoneId;
  durationMs: number;
  hitWindow: number;
  targetProgress: number;
  track: WindTrack;
};

export type FlyerBeatConfig = Omit<WindStep, "id" | "arrow" | "hitWindow"> & {
  hitWindow?: number;
};

export type FlyerPosition = TrackPoint & {
  rotate: number;
};

export const DEFAULT_HIT_WINDOW = 0.115;
export const FLYER_FEEDBACK_DURATION_MS = 1250;

// Tracks follow the brightest painted wind ribbon in each finished corridor.
// The down corridor has an S-curve, so it also uses a second harmonic.
export const WIND_TRACK_BY_ZONE: Record<WindZoneId, WindTrack> = {
  right: {
    start: { xPct: 3, yPct: 55.1 },
    end: { xPct: 97, yPct: 65.3 },
    rotate: 0,
    curvePct: 2,
    thicknessPct: 28,
  },
  top: {
    start: { xPct: 72.2, yPct: 91 },
    end: { xPct: 56.9, yPct: 13 },
    rotate: 0,
    curvePct: -16,
    thicknessPct: 30,
  },
  left: {
    start: { xPct: 97, yPct: 53.6 },
    end: { xPct: 3, yPct: 62.8 },
    rotate: 0,
    curvePct: -0.25,
    thicknessPct: 29,
  },
  bottom: {
    start: { xPct: 38, yPct: 13 },
    end: { xPct: 29.6, yPct: 91 },
    rotate: 0,
    curvePct: -10.5,
    curveSecondaryPct: 7.5,
    thicknessPct: 31,
  },
};

const RHYTHM_FLYER_BEATS: readonly FlyerBeatConfig[] = [
  {
    zoneId: "right",
    durationMs: 1320,
    targetProgress: 0.63,
    track: WIND_TRACK_BY_ZONE.right,
  },
  {
    zoneId: "top",
    durationMs: 1240,
    targetProgress: 0.58,
    track: WIND_TRACK_BY_ZONE.top,
  },
  {
    zoneId: "left",
    durationMs: 1160,
    targetProgress: 0.62,
    track: WIND_TRACK_BY_ZONE.left,
  },
  {
    zoneId: "bottom",
    durationMs: 1100,
    targetProgress: 0.55,
    track: WIND_TRACK_BY_ZONE.bottom,
  },
  {
    zoneId: "right",
    durationMs: 1030,
    targetProgress: 0.68,
    track: WIND_TRACK_BY_ZONE.right,
  },
  {
    zoneId: "left",
    durationMs: 960,
    hitWindow: 0.125,
    targetProgress: 0.5,
    track: WIND_TRACK_BY_ZONE.left,
  },
  {
    zoneId: "top",
    durationMs: 920,
    hitWindow: 0.13,
    targetProgress: 0.57,
    track: WIND_TRACK_BY_ZONE.top,
  },
  {
    zoneId: "bottom",
    durationMs: 880,
    hitWindow: 0.13,
    targetProgress: 0.56,
    track: WIND_TRACK_BY_ZONE.bottom,
  },
  {
    zoneId: "right",
    durationMs: 840,
    hitWindow: 0.135,
    targetProgress: 0.64,
    track: WIND_TRACK_BY_ZONE.right,
  },
] as const;

const WIND_ARROW_BY_ZONE: Record<WindZoneId, string> = {
  right: "→",
  top: "↑",
  left: "←",
  bottom: "↓",
};

export const WIND_STEPS: readonly WindStep[] = RHYTHM_FLYER_BEATS.map((beat, index) => ({
  ...beat,
  id: `flyer-beat-${index + 1}-${beat.zoneId}`,
  arrow: WIND_ARROW_BY_ZONE[beat.zoneId],
  hitWindow: beat.hitWindow ?? DEFAULT_HIT_WINDOW,
}));

const clampProgress = (value: number) => Math.max(0, Math.min(1, value));

function isHorizontalTrack(track: WindTrack) {
  return Math.abs(track.end.xPct - track.start.xPct) >= Math.abs(track.end.yPct - track.start.yPct);
}

export function getFlyerPosition(track: WindTrack, progress: number): FlyerPosition {
  const safeProgress = clampProgress(progress);
  const curveWeight = Math.sin(Math.PI * safeProgress);
  const secondaryCurveWeight = Math.sin(Math.PI * safeProgress * 2);
  const curveOffset =
    curveWeight * track.curvePct +
    secondaryCurveWeight * (track.curveSecondaryPct ?? 0);
  const flutterWeight = Math.sin(Math.PI * safeProgress * 4.2) * (1 - safeProgress * 0.3);
  const isHorizontal = isHorizontalTrack(track);

  return {
    xPct:
      track.start.xPct +
      (track.end.xPct - track.start.xPct) * safeProgress +
      (isHorizontal ? 0 : curveOffset + flutterWeight * 0.6),
    yPct:
      track.start.yPct +
      (track.end.yPct - track.start.yPct) * safeProgress +
      (isHorizontal ? curveOffset + flutterWeight * 0.6 : 0),
    rotate: track.rotate,
  };
}

