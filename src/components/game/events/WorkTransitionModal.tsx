"use client";

import { useEffect, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

const riseFade = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.96);
  }
  20% {
    opacity: 1;
    transform: translateY(0px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-26px) scale(1.02);
  }
`;
const waveChar = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
`;
const WORKING_TEXT = "上班中...";
const WORK_TASK_POOL = [
  "回覆粉專私訊與留言",
  "整理本週社群貼文排程",
  "彙整活動點擊與轉換報表",
  "校對 EDM 主旨與內文",
  "更新產品頁促銷文案",
  "和設計確認 Banner 改稿",
  "整理會議紀錄並寄出重點",
  "補齊提案簡報的素材頁",
] as const;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createFatigueIncreasePlan() {
  const total = randomInt(20, 35);
  const weights = [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2];
  const weightSum = weights.reduce((sum, value) => sum + value, 0);
  const chunks = weights.map((value) =>
    Math.max(3, Math.round((total * value) / weightSum)),
  );
  let diff = total - chunks.reduce((sum, value) => sum + value, 0);
  let guard = 0;
  while (diff !== 0 && guard < 30) {
    const index = guard % 3;
    if (diff > 0) {
      chunks[index] += 1;
      diff -= 1;
    } else if (chunks[index] > 3) {
      chunks[index] -= 1;
      diff += 1;
    }
    guard += 1;
  }
  const shuffledTasks = [...WORK_TASK_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
  return { total, chunks, tasks: shuffledTasks };
}

export function WorkTransitionModal({
  onFinish,
  baseFatigue,
}: {
  onFinish: (fatigueIncrease: number) => void;
  baseFatigue: number;
}) {
  const [fatiguePlan] = useState(createFatigueIncreasePlan);
  const [isImageVisible, setIsImageVisible] = useState(false);
  const [displayFatigue, setDisplayFatigue] = useState(baseFatigue);
  const [bubble, setBubble] = useState<{ id: number; value: number; task: string } | null>(null);

  useEffect(() => {
    let fatigueInterval: ReturnType<typeof setInterval> | null = null;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let currentFatigue = baseFatigue;

    const animateFatigueChunk = (
      increaseValue: number,
      taskText: string,
      startDelayMs: number,
    ) => {
      const timer = setTimeout(() => {
        setBubble({ id: Date.now() + startDelayMs, value: increaseValue, task: taskText });

        const animationMs = 520;
        const steps = 20;
        const perStepMs = Math.floor(animationMs / steps);
        const startValue = currentFatigue;
        const endValue = startValue + increaseValue;
        let tick = 0;

        if (fatigueInterval) clearInterval(fatigueInterval);
        fatigueInterval = setInterval(() => {
          tick += 1;
          const ratio = Math.min(1, tick / steps);
          const next = Math.round(startValue + (endValue - startValue) * ratio);
          setDisplayFatigue(next);
          if (ratio >= 1) {
            currentFatigue = endValue;
            if (fatigueInterval) clearInterval(fatigueInterval);
          }
        }, perStepMs);
      }, startDelayMs);
      timers.push(timer);
    };

    const fadeInTimer = setTimeout(() => {
      setIsImageVisible(true);
    }, 80);
    timers.push(fadeInTimer);

    // 上班中的三段任務疲勞累積：三次浮動泡泡，逐次上升。
    animateFatigueChunk(fatiguePlan.chunks[0], fatiguePlan.tasks[0], 760);
    animateFatigueChunk(fatiguePlan.chunks[1], fatiguePlan.tasks[1], 1760);
    animateFatigueChunk(fatiguePlan.chunks[2], fatiguePlan.tasks[2], 2760);

    const finishTimer = setTimeout(() => {
      onFinish(fatiguePlan.total);
    }, 4300);
    timers.push(finishTimer);

    return () => {
      if (fatigueInterval) clearInterval(fatigueInterval);
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [baseFatigue, fatiguePlan.chunks, fatiguePlan.tasks, fatiguePlan.total, onFinish]);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={55}
      direction="column"
      bgImage="url('/images/office.jpg')"
      bgSize="cover"
      backgroundPosition="center"
      bgRepeat="no-repeat"
      justifyContent="center"
      alignItems="center"
      p="20px"
    >
      {bubble ? (
        <Text
          key={bubble.id}
          mb="8px"
          color="#FFE8A8"
          fontSize="15px"
          fontWeight="800"
          letterSpacing="0.01em"
          textShadow="0 2px 8px rgba(0,0,0,0.35)"
          opacity={isImageVisible ? 1 : 0}
          animation={isImageVisible ? `${riseFade} 0.92s ease-out both` : "none"}
          pointerEvents="none"
          textAlign="center"
        >
          {bubble.task}・疲勞 +{bubble.value}
        </Text>
      ) : null}

      <Text mt="2px" color="white" fontSize="14px" fontWeight="700" textShadow="0 2px 8px rgba(0,0,0,0.35)">
        {WORKING_TEXT.split("").map((char, index) => (
          <Text
            as="span"
            key={`${char}-${index}`}
            display="inline-block"
            animation={`${waveChar} 0.9s ease-in-out ${index * 0.08}s infinite`}
          >
            {char}
          </Text>
        ))}
      </Text>

      <Flex
        mt="8px"
        px="12px"
        py="8px"
        borderRadius="10px"
        bgColor="rgba(66,43,26,0.62)"
        border="1px solid rgba(255,255,255,0.22)"
        alignItems="center"
        gap="10px"
        opacity={isImageVisible ? 1 : 0}
        transform={isImageVisible ? "translateY(0)" : "translateY(6px)"}
        transition="opacity 0.45s ease, transform 0.45s ease"
      >
        <Text color="#FFE7C4" fontSize="12px" fontWeight="700">
          疲勞值
        </Text>
        <Text color="white" fontSize="13px" fontWeight="700" minW="124px" textAlign="right">
          {displayFatigue}
        </Text>
      </Flex>

      <Flex
        mt="12px"
        w="100%"
        maxW="286px"
        borderRadius="12px"
        overflow="hidden"
        border="2px solid rgba(157,120,89,0.9)"
        boxShadow="0 8px 24px rgba(0,0,0,0.2)"
        opacity={isImageVisible ? 1 : 0}
        transform={isImageVisible ? "translateY(0)" : "translateY(8px)"}
        transition="opacity 0.45s ease, transform 0.45s ease"
      >
        <img
          src="/images/mai_work.jpg"
          alt="上班過場"
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </Flex>
    </Flex>
  );
}
