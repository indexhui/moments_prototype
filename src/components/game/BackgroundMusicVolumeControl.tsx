"use client";

import { Flex, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  FMOD_MUSIC_VOLUME_CHANGE_EVENT,
  getFmodGameMusicVolume,
  setFmodGameMusicVolume,
} from "@/lib/game/fmodWeb";

export function BackgroundMusicVolumeControl({
  variant = "dark",
}: {
  variant?: "dark" | "light";
}) {
  const [volume, setVolume] = useState(() => getFmodGameMusicVolume());
  const percentage = Math.round(volume * 100);
  const isDark = variant === "dark";

  useEffect(() => {
    const handleVolumeChange = (event: Event) => {
      const nextVolume = (event as CustomEvent<{ volume?: number }>).detail?.volume;
      if (typeof nextVolume === "number") setVolume(nextVolume);
    };
    window.addEventListener(FMOD_MUSIC_VOLUME_CHANGE_EVENT, handleVolumeChange);
    return () => {
      window.removeEventListener(FMOD_MUSIC_VOLUME_CHANGE_EVENT, handleVolumeChange);
    };
  }, []);

  return (
    <Flex direction="column" gap="7px" px="4px" py="3px">
      <Flex alignItems="center" justifyContent="space-between">
        <Text
          color={isDark ? "#FCECDD" : "#6D523F"}
          fontSize="12px"
          fontWeight="800"
        >
          背景音樂音量
        </Text>
        <Text
          color={isDark ? "rgba(255,255,255,0.78)" : "#96745A"}
          fontSize="11px"
          fontWeight="800"
        >
          {percentage}%
        </Text>
      </Flex>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={percentage}
        aria-label="背景音樂音量"
        onChange={(event) => {
          const nextVolume = setFmodGameMusicVolume(Number(event.currentTarget.value) / 100);
          setVolume(nextVolume);
        }}
        style={{
          width: "100%",
          height: "20px",
          accentColor: isDark ? "#F0C79F" : "#9D7859",
          cursor: "pointer",
        }}
      />
      <Flex justifyContent="space-between">
        <Text color={isDark ? "rgba(255,255,255,0.5)" : "#A58A75"} fontSize="9px">
          靜音
        </Text>
        <Text color={isDark ? "rgba(255,255,255,0.5)" : "#A58A75"} fontSize="9px">
          100%
        </Text>
      </Flex>
    </Flex>
  );
}
