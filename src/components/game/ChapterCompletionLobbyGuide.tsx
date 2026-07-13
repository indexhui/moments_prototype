"use client";

import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { IoCheckmark, IoPawOutline } from "react-icons/io5";

type ChapterCompletionGuideStep = "chapter" | "reward" | "lobby";

const guideSteps: ChapterCompletionGuideStep[] = ["chapter", "reward", "lobby"];

const paperIn = keyframes`
  0% { opacity: 0; transform: translateY(18px) rotate(-0.6deg); }
  100% { opacity: 1; transform: translateY(0) rotate(0deg); }
`;

const illustrationIn = keyframes`
  0% { opacity: 0; transform: scale(0.97) rotate(-1.5deg); }
  100% { opacity: 1; transform: scale(1) rotate(-1.5deg); }
`;

const rewardStampIn = keyframes`
  0% { opacity: 0; transform: scale(1.18) rotate(-8deg); }
  62% { opacity: 1; transform: scale(0.96) rotate(2deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
`;

const beigoIdle = keyframes`
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50% { transform: translateY(-4px) rotate(1deg); }
`;

function PaperTexture() {
  return (
    <>
      <Box position="absolute" inset="0" bgColor="#FCFAF4" />
      <Box
        position="absolute"
        inset="0"
        opacity={0.24}
        bgImage="radial-gradient(circle at 20% 30%, rgba(102, 82, 63, 0.28) 0 0.55px, transparent 0.8px), radial-gradient(circle at 75% 65%, rgba(151, 128, 101, 0.22) 0 0.5px, transparent 0.78px)"
        bgSize="8px 8px, 11px 11px"
        style={{ backgroundPosition: "0 0, 3px 2px" }}
        pointerEvents="none"
      />
      <Box
        position="absolute"
        inset="0"
        opacity={0.18}
        bgImage="repeating-linear-gradient(3deg, transparent 0, transparent 5px, rgba(117, 96, 75, 0.09) 5.5px, transparent 6px), linear-gradient(105deg, rgba(255,255,255,0.52), transparent 34%, rgba(194,176,151,0.08) 72%, transparent)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        left="-12px"
        top="86px"
        w="42px"
        h="13px"
        bgColor="rgba(194, 175, 143, 0.58)"
        transform="rotate(-4deg)"
      />
      <Box
        position="absolute"
        right="-11px"
        bottom="104px"
        w="46px"
        h="13px"
        bgColor="rgba(174, 194, 170, 0.52)"
        transform="rotate(5deg)"
      />
    </>
  );
}

function StepCounter({ step }: { step: ChapterCompletionGuideStep }) {
  const activeIndex = guideSteps.indexOf(step);
  return (
    <Flex alignItems="center" gap="6px" aria-label={`第 ${activeIndex + 1} 段，共 3 段`}>
      {guideSteps.map((item, index) => (
        <Box
          key={item}
          w={index === activeIndex ? "18px" : "6px"}
          h="6px"
          borderRadius="999px"
          bgColor={index === activeIndex ? "#937154" : "#D9CFC0"}
          transition="width 180ms ease, background-color 180ms ease"
        />
      ))}
    </Flex>
  );
}

function GuideButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Flex
      as="button"
      position="relative"
      w="100%"
      h="48px"
      flexShrink={0}
      overflow="hidden"
      border="1px solid #7E5F47"
      borderRadius="999px"
      bgColor="#947052"
      color="#FFFFFF"
      alignItems="center"
      justifyContent="center"
      fontSize="15px"
      fontWeight="800"
      boxShadow="0 2px 0 #6D503B, 0 4px 9px rgba(80, 57, 39, 0.1)"
      cursor="pointer"
      onClick={onClick}
      transition="transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease"
      _hover={{ bgColor: "#8D694C" }}
      _active={{ transform: "translateY(1px)", boxShadow: "0 1px 0 #6D503B, 0 2px 5px rgba(80, 57, 39, 0.1)" }}
      aria-label={label}
    >
      <Box
        position="absolute"
        inset="0"
        opacity={0.16}
        bgImage="radial-gradient(circle, rgba(255,255,255,0.8) 0 0.55px, transparent 0.8px), repeating-linear-gradient(2deg, transparent 0 5px, rgba(70,45,28,0.18) 5.5px, transparent 6px)"
        bgSize="8px 8px, auto"
        pointerEvents="none"
      />
      <Text position="relative" color="inherit" fontSize="inherit" fontWeight="inherit" lineHeight="1">
        {label}
      </Text>
    </Flex>
  );
}

function ChapterCompleteStep({ onContinue }: { onContinue: () => void }) {
  return (
    <Flex h="100%" minH="0" direction="column" alignItems="center" gap="20px">
      <Flex w="100%" alignItems="center" justifyContent="space-between">
        <Flex px="12px" py="6px" borderRadius="999px" bgColor="#EEE6DA">
          <Text color="#87684F" fontSize="12px" fontWeight="800" letterSpacing="0.08em">
            第 1 章
          </Text>
        </Flex>
        <StepCounter step="chapter" />
      </Flex>

      <Flex direction="column" alignItems="center">
        <Text color="#5F4A39" fontSize="30px" fontWeight="800" lineHeight="1.15">
          第一章完成
        </Text>
      </Flex>

      <Flex
        w="100%"
        h="202px"
        flexShrink={0}
        p="7px"
        borderRadius="7px"
        bgColor="#FFFFFF"
        border="2px solid #8E7765"
        boxShadow="4px 7px 0 rgba(126, 106, 87, 0.16)"
        transform="rotate(-1.5deg)"
        animation={`${illustrationIn} 420ms ease-out 80ms both`}
        overflow="hidden"
      >
        <img
          src="/images/428出圖/特別演出/CH01_SC02_SE03_Beigo_Stand_Book.png"
          alt="小貝狗站在發光日記上的第一章紀念插圖"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: "3px" }}
        />
      </Flex>

      <Flex
        mt="22px"
        w="100%"
        px="14px"
        py="11px"
        borderRadius="12px"
        border="1px dashed #B7A28D"
        bgColor="rgba(239, 232, 221, 0.65)"
        alignItems="center"
        gap="10px"
      >
        <Flex w="25px" h="25px" borderRadius="50%" bgColor="#91A184" alignItems="center" justifyContent="center" color="#FFFFFF">
          <IoCheckmark size={17} />
        </Flex>
        <Text color="#755D49" fontSize="13px" fontWeight="800">
          完成紀錄：找回日記裡的第一段故事
        </Text>
      </Flex>

      <Flex mt="auto" w="100%">
        <GuideButton label="查看獲得內容" onClick={onContinue} />
      </Flex>
    </Flex>
  );
}

function RewardStep({ onContinue }: { onContinue: () => void }) {
  return (
    <Flex h="100%" minH="0" direction="column" alignItems="center" gap="20px">
      <Flex w="100%" alignItems="center" justifyContent="flex-end">
        <StepCounter step="reward" />
      </Flex>

      <Flex direction="column" alignItems="center">
        <Text color="#5F4A39" fontSize="28px" fontWeight="800" lineHeight="1.15">
          獲得新成就
        </Text>
      </Flex>

      <Flex
        w="100%"
        px="14px"
        py="12px"
        borderRadius="14px"
        bgColor="#EEE7DC"
        border="1px solid #C6B6A3"
        alignItems="center"
        gap="12px"
        animation={`${rewardStampIn} 380ms cubic-bezier(0.2, 0.9, 0.22, 1.15) both`}
      >
        <Flex
          w="48px"
          h="48px"
          flexShrink={0}
          borderRadius="50%"
          bgColor="#FAF8F1"
          border="2px dashed #9C8066"
          color="#80664F"
          alignItems="center"
          justifyContent="center"
          transform="rotate(-6deg)"
        >
          <IoPawOutline size={25} />
        </Flex>
        <Flex direction="column" gap="4px" minW="0">
          <Text color="#5F4A39" fontSize="16px" fontWeight="800" lineHeight="1.1">
            成就「日記的第一頁」
          </Text>
          <Text color="#88705C" fontSize="12px" fontWeight="700" lineHeight="1.4">
            第一次找回日記裡消失的故事
          </Text>
        </Flex>
      </Flex>

      <Flex position="relative" flex="1" minH="0" w="100%" alignItems="center" justifyContent="center">
        <Flex
          position="relative"
          w="210px"
          h="238px"
          direction="column"
          p="10px 10px 33px"
          bgColor="#FFFEFA"
          border="1px solid #B7A591"
          boxShadow="5px 8px 0 rgba(122, 103, 84, 0.16)"
          transform="rotate(1.5deg)"
          animation={`${illustrationIn} 420ms ease-out 120ms both`}
        >
          <Flex flex="1" minH="0" overflow="hidden" bgColor="#F6F1E8" border="1px solid rgba(139, 116, 93, 0.28)">
            <img
              src="/collection/naotaro_lg.png"
              alt="坐著的直太郎紀念插圖"
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", padding: "8px" }}
            />
          </Flex>
          <Text position="absolute" left="0" right="0" bottom="8px" color="#6E5846" fontSize="15px" fontWeight="800" textAlign="center">
            直太郎
          </Text>
          <Flex
            position="absolute"
            top="-10px"
            right="-17px"
            px="11px"
            py="6px"
            bgColor="rgba(183, 202, 180, 0.92)"
            transform="rotate(5deg)"
            boxShadow="0 2px 5px rgba(96, 78, 62, 0.1)"
          >
            <Text color="#50604D" fontSize="11px" fontWeight="800">
              紀念插圖
            </Text>
          </Flex>
        </Flex>
      </Flex>

      <Flex w="100%">
        <GuideButton label="繼續" onClick={onContinue} />
      </Flex>
    </Flex>
  );
}

function LobbyStep({ onGoToLobby }: { onGoToLobby: () => void }) {
  return (
    <Flex h="100%" minH="0" direction="column" alignItems="center" gap="20px">
      <Flex w="100%" alignItems="center" justifyContent="flex-end">
        <StepCounter step="lobby" />
      </Flex>

      <Flex direction="column" alignItems="center">
        <Text color="#5F4A39" fontSize="28px" fontWeight="800" lineHeight="1.15">
          客廳開放
        </Text>
      </Flex>

      <Flex
        position="relative"
        w="100%"
        h="258px"
        flexShrink={0}
        overflow="hidden"
        borderRadius="12px"
        border="4px solid #FFFFFF"
        outline="2px solid #8E7765"
        boxShadow="4px 7px 0 rgba(126, 106, 87, 0.16)"
        bgColor="#E5D8C9"
      >
        <img
          src="/images/lobby/main_hub_bg.png"
          alt="冒險大廳預覽"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 48%", display: "block" }}
        />
        <Box position="absolute" inset="0" bg="linear-gradient(180deg, rgba(255,255,255,0.05) 42%, rgba(89,70,53,0.4) 100%)" />
        <img
          src="/images/lobby/beigo_idle.png"
          alt="在大廳等待的小貝狗"
          style={{
            position: "absolute",
            left: "15px",
            bottom: "9px",
            width: "72px",
            height: "90px",
            objectFit: "contain",
            display: "block",
            animation: `${beigoIdle} 2.2s ease-in-out infinite`,
          }}
        />
        <Flex
          position="absolute"
          right="12px"
          bottom="12px"
          px="12px"
          py="8px"
          borderRadius="8px"
          bgColor="rgba(255, 253, 247, 0.92)"
          border="1px solid rgba(126, 104, 83, 0.3)"
        >
          <Text color="#6D5846" fontSize="12px" fontWeight="800">
            主線・日常冒險・任務
          </Text>
        </Flex>
      </Flex>

      <Text color="#5F4A39" fontSize="15px" fontWeight="700" lineHeight="1.65" textAlign="center" px="5px">
        新的模式已開放
        <br />
        先休息一下吧
      </Text>

      <Flex mt="auto" w="100%">
        <GuideButton label="前往客廳" onClick={onGoToLobby} />
      </Flex>
    </Flex>
  );
}

export function ChapterCompletionLobbyGuide({ onGoToLobby }: { onGoToLobby: () => void }) {
  const [step, setStep] = useState<ChapterCompletionGuideStep>("chapter");

  const showNextStep = () => {
    setStep((current) => (current === "chapter" ? "reward" : "lobby"));
  };

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={30}
      bgColor="rgba(54, 47, 40, 0.67)"
      alignItems="center"
      justifyContent="center"
      px="20px"
      py="16px"
      pointerEvents="auto"
      role="dialog"
      aria-modal="true"
      aria-label={step === "chapter" ? "第一章完成" : step === "reward" ? "獲得新成就" : "客廳開放"}
    >
      <Flex
        key={step}
        position="relative"
        w="100%"
        maxW="345px"
        h="min(690px, calc(100% - 12px))"
        minH="0"
        borderRadius="16px"
        border="4px solid rgba(255,255,255,0.96)"
        outline="2px solid #826C59"
        boxShadow="0 18px 42px rgba(35, 28, 22, 0.36)"
        overflow="hidden"
        animation={`${paperIn} 300ms ease-out both`}
      >
        <PaperTexture />
        <Flex position="relative" zIndex={1} w="100%" h="100%" minH="0" direction="column" px="19px" py="18px" overflowY="auto">
          {step === "chapter" ? <ChapterCompleteStep onContinue={showNextStep} /> : null}
          {step === "reward" ? <RewardStep onContinue={showNextStep} /> : null}
          {step === "lobby" ? <LobbyStep onGoToLobby={onGoToLobby} /> : null}
        </Flex>
      </Flex>
    </Flex>
  );
}
