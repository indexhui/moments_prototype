"use client";

import { Box } from "@chakra-ui/react";

/**
 * Decorative layers shared by the photo introduction and creature detail pages.
 * Figma 9ased7HFhhFpvVNl3WPrdK: dots 12929:16703, paper export 12929:16767.
 * The paper PNG includes its tilt, hand-drawn edges, and transparent margins.
 */
export function SunbeastDiscoveryBackdrop() {
  return (
    <Box
      position="absolute"
      inset="0"
      zIndex={1}
      overflow="hidden"
      pointerEvents="none"
      aria-hidden="true"
      bgColor="#F6F0E4"
      backgroundImage="url('/images/428出圖/20260805/換衣服/點點.png')"
      backgroundSize="100% auto"
      backgroundPosition="left top"
      backgroundRepeat="repeat-y"
      data-sunbeast-discovery-backdrop="true"
    >
      <img
        src="/images/diary/sunbeast-discovery-diary.png"
        alt=""
        draggable={false}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "left top",
        }}
      />
    </Box>
  );
}
