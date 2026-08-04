"use client";

import type { CSSProperties } from "react";
import { Flex } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

const OPENING_CLOUD_IMAGES = {
  cloud01: "/images/cloud/cloud_01.png",
  cloud02: "/images/cloud/cloud_02.png",
  cloud03: "/images/cloud/cloude_03.png",
  cloud04: "/images/cloud/cloude_04.png",
} as const;

export const OPENING_CLOUD_BURST_DURATION_MS = 1880;

type OpeningCloudLayer = {
  id: string;
  src: string;
  left: string;
  top: string;
  width: string;
  height?: string;
  imageWidth?: string;
  imageHeight?: string;
  imageRotate?: string;
  zIndex: number;
  delayMs: number;
  startScale: number;
  endX: string;
  endY: string;
  endScale: number;
  startRotate: string;
  endRotate: string;
};

const OPENING_CLOUD_LAYERS: OpeningCloudLayer[] = [
  {
    id: "bottom-left",
    src: OPENING_CLOUD_IMAGES.cloud01,
    left: "-107px",
    top: "490px",
    width: "471px",
    height: "362px",
    zIndex: 4,
    delayMs: 70,
    startScale: 1,
    endX: "-260px",
    endY: "180px",
    endScale: 1.08,
    startRotate: "0deg",
    endRotate: "-9deg",
  },
  {
    id: "top-blanket",
    src: OPENING_CLOUD_IMAGES.cloud01,
    left: "-15px",
    top: "-24px",
    width: "401px",
    height: "308px",
    zIndex: 3,
    delayMs: 0,
    startScale: 1,
    endX: "-26px",
    endY: "-310px",
    endScale: 1.06,
    startRotate: "180deg",
    endRotate: "176deg",
  },
  {
    id: "bottom-right",
    src: OPENING_CLOUD_IMAGES.cloud03,
    left: "197px",
    top: "643px",
    width: "320px",
    height: "246px",
    zIndex: 6,
    delayMs: 120,
    startScale: 1,
    endX: "210px",
    endY: "210px",
    endScale: 1.08,
    startRotate: "0deg",
    endRotate: "9deg",
  },
  {
    id: "middle-slant",
    src: OPENING_CLOUD_IMAGES.cloud02,
    left: "42px",
    top: "364px",
    width: "579px",
    height: "395px",
    imageWidth: "277px",
    imageHeight: "529px",
    imageRotate: "76.26deg",
    zIndex: 7,
    delayMs: 40,
    startScale: 1,
    endX: "270px",
    endY: "74px",
    endScale: 1.06,
    startRotate: "0deg",
    endRotate: "5deg",
  },
  {
    id: "left-upper-wall",
    src: OPENING_CLOUD_IMAGES.cloud02,
    left: "-48px",
    top: "33px",
    width: "277px",
    height: "529px",
    zIndex: 5,
    delayMs: 30,
    startScale: 1,
    endX: "-230px",
    endY: "-104px",
    endScale: 1.05,
    startRotate: "0deg",
    endRotate: "-5deg",
  },
  {
    id: "right-upper-wall",
    src: OPENING_CLOUD_IMAGES.cloud04,
    left: "129px",
    top: "-24px",
    width: "307px",
    height: "586px",
    zIndex: 8,
    delayMs: 10,
    startScale: 1,
    endX: "230px",
    endY: "-168px",
    endScale: 1.06,
    startRotate: "0deg",
    endRotate: "5deg",
  },
  {
    id: "left-lower-wall",
    src: OPENING_CLOUD_IMAGES.cloud02,
    left: "-31px",
    top: "308px",
    width: "277px",
    height: "529px",
    zIndex: 6,
    delayMs: 90,
    startScale: 1,
    endX: "-250px",
    endY: "120px",
    endScale: 1.06,
    startRotate: "0deg",
    endRotate: "-4deg",
  },
];

const openingCloudVeilFade = keyframes`
  0% { opacity: 1; }
  22% { opacity: 1; }
  70% { opacity: 0.18; }
  100% { opacity: 0; }
`;

const openingCloudMistDrift = keyframes`
  0% { opacity: 0.92; transform: translate3d(0, 0, 0) scale(1); }
  45% { opacity: 0.58; transform: translate3d(0, -12px, 0) scale(1.04); }
  100% { opacity: 0; transform: translate3d(0, -28px, 0) scale(1.1); }
`;

const openingCloudScatter = keyframes`
  0% {
    opacity: 1;
    transform:
      translate3d(0, 0, 0)
      scale(var(--cloud-start-scale))
      rotate(var(--cloud-start-rotate));
    filter: brightness(1.03) blur(0);
  }
  18% {
    opacity: 1;
    transform:
      translate3d(0, 0, 0)
      scale(calc(var(--cloud-start-scale) * 1.03))
      rotate(var(--cloud-start-rotate));
    filter: brightness(1.06) blur(0);
  }
  100% {
    opacity: 0;
    transform:
      translate3d(var(--cloud-end-x), var(--cloud-end-y), 0)
      scale(var(--cloud-end-scale))
      rotate(var(--cloud-end-rotate));
    filter: brightness(1.05) blur(1.2px);
  }
`;

export function OpeningCloudBurstOverlay() {
  return (
    <Flex
      aria-hidden="true"
      position="absolute"
      inset="0"
      zIndex={82}
      pointerEvents="none"
      overflow="hidden"
      bgColor="#F0F0EA"
      animation={`${openingCloudVeilFade} ${OPENING_CLOUD_BURST_DURATION_MS}ms ease-out both`}
    >
      <Flex
        position="absolute"
        inset="-18%"
        bg="radial-gradient(circle at 50% 46%, rgba(255,255,255,0.42) 0%, rgba(248,248,238,0.28) 38%, rgba(232,236,224,0) 78%)"
        animation={`${openingCloudMistDrift} ${OPENING_CLOUD_BURST_DURATION_MS}ms ease-out both`}
      />
      {OPENING_CLOUD_LAYERS.map((cloud) => {
        const cloudStyle = {
          "--cloud-start-scale": `${cloud.startScale}`,
          "--cloud-start-rotate": cloud.startRotate,
          "--cloud-end-x": cloud.endX,
          "--cloud-end-y": cloud.endY,
          "--cloud-end-scale": `${cloud.endScale}`,
          "--cloud-end-rotate": cloud.endRotate,
          willChange: "transform, opacity, filter",
        } as CSSProperties;
        const cloudImageStyle = {
          width: cloud.imageWidth ?? "100%",
          height: cloud.imageHeight ?? (cloud.height ? "100%" : "auto"),
          display: "block",
          maxWidth: "none",
          userSelect: "none",
          transform: cloud.imageRotate ? `rotate(${cloud.imageRotate})` : undefined,
          transformOrigin: "center",
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
            style={cloudStyle}
            animation={`${openingCloudScatter} ${OPENING_CLOUD_BURST_DURATION_MS}ms cubic-bezier(0.18, 0.76, 0.2, 1) ${cloud.delayMs}ms both`}
          >
            <img
              src={cloud.src}
              alt=""
              draggable={false}
              style={cloudImageStyle}
            />
          </Flex>
        );
      })}
    </Flex>
  );
}
