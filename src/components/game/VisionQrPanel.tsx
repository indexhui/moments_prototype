"use client";

import { Flex, Text } from "@chakra-ui/react";
import { useEffect, useState, type ReactNode } from "react";
import { preloadGameImage } from "@/lib/game/preloadAssets";

export const VISION_FEEDBACK_QR_SRC = "/images/QR/放視大賞試玩回饋.png";
export const VISION_RECRUIT_QR_SRC = "/images/QR/早起玩家招募QR.png";
export const VISION_LOGO_SRC = "/images/logo/logo_svg.svg";

export function VisionLogoMark() {
  const [visibleLogoSrc, setVisibleLogoSrc] = useState(VISION_LOGO_SRC);

  useEffect(() => {
    let cancelled = false;
    preloadGameImage(VISION_LOGO_SRC)
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setVisibleLogoSrc(VISION_LOGO_SRC);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Flex w="100%" h="58px" alignItems="center" justifyContent="center" pb="4px">
      <img
        src={visibleLogoSrc}
        alt="走走小日 Logo"
        width="180"
        height="55"
        loading="eager"
        decoding="sync"
        style={{ width: "180px", height: "55px", objectFit: "contain" }}
      />
    </Flex>
  );
}

export function VisionQrPanel({
  title,
  imageSrc,
  alt,
  header,
  children,
  footer,
  defaultQrOpen = false,
}: {
  title: string;
  imageSrc: string;
  alt: string;
  header?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  defaultQrOpen?: boolean;
}) {
  const [isQrOpen, setIsQrOpen] = useState(defaultQrOpen);

  return (
    <Flex direction="column" w="100%" h="100%" justifyContent="space-between">
      <Flex direction="column" gap="18px" w="100%">
        {header}
        <Flex direction="column" gap="10px" w="100%">
          <Text color="#13261D" fontSize="18px" fontWeight="700" lineHeight="1.4">
            {title}
          </Text>
          <Flex
            direction="column"
            w="100%"
            bgColor="rgba(255,255,255,0.36)"
            border="1px solid rgba(255,255,255,0.44)"
            borderRadius="12px"
            overflow="hidden"
            boxShadow="0 10px 22px rgba(58,75,61,0.1)"
          >
            <Flex
              h="42px"
              px="12px"
              alignItems="center"
              justifyContent="space-between"
              gap="12px"
              bgColor="rgba(255,255,255,0.42)"
            >
              <Text color="#5D7165" fontSize="12px" fontWeight="900">
                QR code
              </Text>
              <Flex
                as="button"
                h="28px"
                minW="72px"
                px="10px"
                bgColor={isQrOpen ? "#4F765D" : "white"}
                color={isQrOpen ? "white" : "#5D7165"}
                border="0"
                borderRadius="999px"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                fontSize="12px"
                fontWeight="900"
                onClick={() => setIsQrOpen((prev) => !prev)}
              >
                {isQrOpen ? "收合" : "顯示"}
              </Flex>
            </Flex>
            {isQrOpen ? (
              <Flex
                w="100%"
                aspectRatio="1"
                bgColor="white"
                alignItems="center"
                justifyContent="center"
                p="10px"
                overflow="hidden"
              >
                <img
                  src={imageSrc}
                  alt={alt}
                  loading="eager"
                  decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </Flex>
            ) : null}
          </Flex>
        </Flex>
        {children}
      </Flex>
      {footer}
    </Flex>
  );
}
