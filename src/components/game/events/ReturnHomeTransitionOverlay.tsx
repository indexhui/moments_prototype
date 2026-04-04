"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";

const RETURN_HOME_TRANSITION_DURATION_MS = 1800;

export function ReturnHomeTransitionOverlay({
  onFinish,
}: {
  onFinish: () => void;
}) {
  const [travelProgress, setTravelProgress] = useState(0);
  const frameRef = useRef<number | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const startedAt = performance.now();
    const tick = (now: number) => {
      const nextProgress = Math.min(1, (now - startedAt) / RETURN_HOME_TRANSITION_DURATION_MS);
      setTravelProgress(nextProgress);
      if (nextProgress >= 1) {
        frameRef.current = null;
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    finishTimerRef.current = setTimeout(() => {
      onFinish();
    }, RETURN_HOME_TRANSITION_DURATION_MS);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      if (finishTimerRef.current) {
        clearTimeout(finishTimerRef.current);
      }
    };
  }, [onFinish]);

  const characterLeftPercent = 14 + travelProgress * 60;

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={90}
      pointerEvents="none"
      overflow="hidden"
      bg="#F2E6D4"
      alignItems="center"
      justifyContent="center"
    >
      <Box position="absolute" left="0" right="0" top="0" h="72px" bgColor="#BC926F" />
      <Flex
        position="absolute"
        top="182px"
        left="0"
        right="0"
        h="184px"
        bgColor="#FBFBF8"
        borderTop="1px solid #BB906D"
        borderBottom="1px solid #BB906D"
        align="center"
        justify="center"
        direction="column"
        gap="22px"
      >
        <Text color="#B48662" fontSize="31px" fontWeight="500" letterSpacing="0.01em">
          回家
        </Text>
        <Flex align="center" gap="22px">
          <Flex w="44px" justify="center">
            <img
              src="/images/icon/company.png"
              alt="公司"
              style={{ width: "38px", height: "38px", objectFit: "contain" }}
            />
          </Flex>
          <Flex align="center" gap="14px">
            {Array.from({ length: 4 }).map((_, index) => (
              <Box
                key={index}
                w="10px"
                h="10px"
                borderRadius="999px"
                bgColor={travelProgress > index / 4 ? "#BC8D69" : "rgba(188,141,105,0.38)"}
              />
            ))}
          </Flex>
          <Flex w="44px" justify="center">
            <img
              src="/images/icon/house.png"
              alt="家"
              style={{ width: "40px", height: "40px", objectFit: "contain" }}
            />
          </Flex>
        </Flex>
      </Flex>
      <Box
        position="absolute"
        left="0"
        right="0"
        top="366px"
        bottom="76px"
        bgColor="#F2E6D4"
        borderBottom="1px solid #DCCFB8"
      />
      <Flex position="absolute" left="0" right="0" top="366px" bottom="76px" alignItems="flex-end">
        <Box
          position="absolute"
          left={`${characterLeftPercent}%`}
          bottom="6px"
          transform="translateX(-50%)"
        >
          <img
            src="/images/mai/walk.gif"
            alt="小麥回家"
            style={{
              height: "214px",
              width: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 6px 10px rgba(53,38,25,0.12))",
            }}
          />
        </Box>
      </Flex>
      <Flex
        position="absolute"
        left="0"
        right="0"
        bottom="0"
        h="76px"
        bgColor="#FBFBF8"
        align="center"
        justify="center"
      >
        <img
          src="/images/moment_logo.png"
          alt="Moment logo"
          style={{ width: "190px", height: "auto", objectFit: "contain" }}
        />
      </Flex>
    </Flex>
  );
}
