"use client";

import { keyframes } from "@emotion/react";
import { useEffect, useMemo, useState } from "react";
import {
  GAME_BACKGROUND_SHAKE_TRIGGER,
  type BackgroundShakeId,
  type BackgroundShakePayload,
} from "@/lib/game/backgroundShakeBus";

const shakeWeak = keyframes`
  0% { transform: translate3d(0, 0, 0); }
  20% { transform: translate3d(-1px, 1px, 0); }
  40% { transform: translate3d(1px, -1px, 0); }
  60% { transform: translate3d(-1px, 0, 0); }
  80% { transform: translate3d(1px, 1px, 0); }
  100% { transform: translate3d(0, 0, 0); }
`;

const shakeStrong = keyframes`
  0% { transform: translate3d(0, 0, 0); }
  12% { transform: translate3d(-4px, 2px, 0); }
  24% { transform: translate3d(4px, -2px, 0); }
  36% { transform: translate3d(-3px, -1px, 0); }
  48% { transform: translate3d(3px, 2px, 0); }
  60% { transform: translate3d(-2px, 1px, 0); }
  72% { transform: translate3d(2px, -1px, 0); }
  84% { transform: translate3d(-1px, 1px, 0); }
  100% { transform: translate3d(0, 0, 0); }
`;

export function useBackgroundShake() {
  const [effectId, setEffectId] = useState<BackgroundShakeId | null>(null);
  const [effectNonce, setEffectNonce] = useState(0);

  useEffect(() => {
    const handleTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<BackgroundShakePayload>;
      const nextEffectId = customEvent.detail?.shakeId;
      if (!nextEffectId) return;
      setEffectId(nextEffectId);
      setEffectNonce((prev) => prev + 1);
    };
    window.addEventListener(GAME_BACKGROUND_SHAKE_TRIGGER, handleTrigger);
    return () => {
      window.removeEventListener(GAME_BACKGROUND_SHAKE_TRIGGER, handleTrigger);
    };
  }, []);

  useEffect(() => {
    if (!effectId) return;
    const timer = setTimeout(() => {
      setEffectId(null);
    }, effectId === "shake-strong" ? 480 : 900);
    return () => clearTimeout(timer);
  }, [effectId, effectNonce]);

  const animation = useMemo(() => {
    if (effectId === "shake-weak") return `${shakeWeak} 360ms ease-out 1`;
    if (effectId === "shake-strong") return `${shakeStrong} 480ms ease-out 1`;
    return undefined;
  }, [effectId]);

  return { animation, effectNonce, activeEffectId: effectId };
}
