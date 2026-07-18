"use client";

import type { CSSProperties } from "react";
import { Flex } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

export const LOBBY_MAIN_STORY_CLOUD_COVER_DURATION_MS = 920;

const CLOUD_IMAGES = {
  cloud01: "/images/cloud/cloud_01.png",
  cloud02: "/images/cloud/cloud_02.png",
  cloud03: "/images/cloud/cloude_03.png",
  cloud04: "/images/cloud/cloude_04.png",
} as const;

type CloudLayer = {
  id: string;
  src: string;
  left: string;
  top: string;
  width: string;
  height: string;
  zIndex: number;
  delayMs: number;
  fromX: string;
  fromY: string;
  fromScale: number;
  fromRotate: string;
  endRotate?: string;
};

const CLOUD_LAYERS: CloudLayer[] = [
  {
    id: "top",
    src: CLOUD_IMAGES.cloud01,
    left: "-15px",
    top: "-24px",
    width: "401px",
    height: "308px",
    zIndex: 3,
    delayMs: 10,
    fromX: "-24px",
    fromY: "-310px",
    fromScale: 1.06,
    fromRotate: "176deg",
    endRotate: "180deg",
  },
  {
    id: "bottom-left",
    src: CLOUD_IMAGES.cloud01,
    left: "-107px",
    top: "490px",
    width: "471px",
    height: "362px",
    zIndex: 4,
    delayMs: 20,
    fromX: "-260px",
    fromY: "180px",
    fromScale: 1.08,
    fromRotate: "-9deg",
  },
  {
    id: "left-upper",
    src: CLOUD_IMAGES.cloud02,
    left: "-48px",
    top: "33px",
    width: "277px",
    height: "529px",
    zIndex: 5,
    delayMs: 0,
    fromX: "-230px",
    fromY: "-104px",
    fromScale: 1.05,
    fromRotate: "-5deg",
  },
  {
    id: "left-lower",
    src: CLOUD_IMAGES.cloud02,
    left: "-31px",
    top: "308px",
    width: "277px",
    height: "529px",
    zIndex: 6,
    delayMs: 45,
    fromX: "-250px",
    fromY: "120px",
    fromScale: 1.06,
    fromRotate: "-4deg",
  },
  {
    id: "bottom-right",
    src: CLOUD_IMAGES.cloud03,
    left: "197px",
    top: "643px",
    width: "320px",
    height: "246px",
    zIndex: 6,
    delayMs: 55,
    fromX: "210px",
    fromY: "210px",
    fromScale: 1.08,
    fromRotate: "9deg",
  },
  {
    id: "right-upper",
    src: CLOUD_IMAGES.cloud04,
    left: "129px",
    top: "-24px",
    width: "307px",
    height: "586px",
    zIndex: 7,
    delayMs: 15,
    fromX: "230px",
    fromY: "-168px",
    fromScale: 1.06,
    fromRotate: "5deg",
  },
];

const cloudVeilGather = keyframes`
  0% { opacity: 0; }
  48% { opacity: 0.08; }
  78% { opacity: 0.48; }
  100% { opacity: 1; }
`;

const cloudMistGather = keyframes`
  0% { opacity: 0; transform: scale(1.12); }
  52% { opacity: 0.18; transform: scale(1.06); }
  100% { opacity: 0.88; transform: scale(1); }
`;

const cloudGather = keyframes`
  0% {
    opacity: 0;
    transform:
      translate3d(var(--cloud-from-x), var(--cloud-from-y), 0)
      scale(var(--cloud-from-scale))
      rotate(var(--cloud-from-rotate));
    filter: brightness(1.05) blur(1.6px);
  }
  18% { opacity: 0.12; }
  52% { opacity: 0.94; }
  86% {
    opacity: 1;
    transform:
      translate3d(0, 0, 0)
      scale(1.03)
      rotate(var(--cloud-end-rotate));
    filter: brightness(1.06) blur(0);
  }
  100% {
    opacity: 1;
    transform:
      translate3d(0, 0, 0)
      scale(1)
      rotate(var(--cloud-end-rotate));
    filter: brightness(1.03) blur(0);
  }
`;

export function LobbyMainStoryCloudTransition() {
  return (
    <Flex
      aria-hidden="true"
      position="absolute"
      inset="0"
      zIndex={90}
      overflow="hidden"
      pointerEvents="auto"
    >
      <Flex
        position="absolute"
        inset="0"
        zIndex={0}
        bgColor="#F0F0EA"
        animation={`${cloudVeilGather} ${LOBBY_MAIN_STORY_CLOUD_COVER_DURATION_MS}ms ease-in both`}
      />
      <Flex
        position="absolute"
        inset="-18%"
        zIndex={1}
        bg="radial-gradient(circle at 50% 46%, rgba(255,255,255,0.82) 0%, rgba(248,248,238,0.5) 42%, rgba(232,236,224,0) 78%)"
        animation={`${cloudMistGather} ${LOBBY_MAIN_STORY_CLOUD_COVER_DURATION_MS}ms ease-in both`}
      />
      {CLOUD_LAYERS.map((cloud) => {
        const style = {
          "--cloud-from-x": cloud.fromX,
          "--cloud-from-y": cloud.fromY,
          "--cloud-from-scale": `${cloud.fromScale}`,
          "--cloud-from-rotate": cloud.fromRotate,
          "--cloud-end-rotate": cloud.endRotate ?? "0deg",
          willChange: "transform, opacity, filter",
        } as CSSProperties;

        return (
          <Flex
            key={cloud.id}
            position="absolute"
            left={cloud.left}
            top={cloud.top}
            w={cloud.width}
            h={cloud.height}
            zIndex={cloud.zIndex}
            alignItems="center"
            justifyContent="center"
            overflow="visible"
            style={style}
            animation={`${cloudGather} ${LOBBY_MAIN_STORY_CLOUD_COVER_DURATION_MS}ms cubic-bezier(0.34, 0.02, 0.22, 1) ${cloud.delayMs}ms both`}
          >
            <img
              src={cloud.src}
              alt=""
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                maxWidth: "none",
                objectFit: "contain",
                userSelect: "none",
              }}
            />
          </Flex>
        );
      })}
    </Flex>
  );
}
