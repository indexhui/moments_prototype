"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiRefreshCw, FiX } from "react-icons/fi";
import { loadPlayerProgress, saveWorkTaskProgress } from "@/lib/game/playerProgress";

type WorkStatKey = "copy" | "creativity" | "visual" | "analysis" | "system";

type RequirementKey = "copy" | "visual" | "analysis" | "system" | "creativity";

type WorkTaskTemplate = {
  id: string;
  title: string;
  deadlineLabel: string;
  maxProgress: number;
  favoredPair?: [WorkStatKey, WorkStatKey];
  requirements: Array<{ key: RequirementKey; label: string; value: number }>;
  expectedProgress: number;
};

type WorkTaskState = WorkTaskTemplate & {
  progress: number;
};

type TechniqueCard = {
  id: WorkStatKey;
  label: string;
  power: number;
  accent: string;
};

type WorkStep = "pick-task" | "dealing-technique" | "pick-technique" | "result";

const TASK_TEMPLATES: WorkTaskTemplate[] = [
  {
    id: "proposal",
    title: "撰寫企劃",
    deadlineLabel: "7天後到期",
    maxProgress: 32,
    favoredPair: ["analysis", "system"],
    requirements: [
      { key: "copy", label: "文案", value: 10 },
      { key: "visual", label: "視覺", value: 20 },
      { key: "system", label: "機制", value: 12 },
    ],
    expectedProgress: 16,
  },
  {
    id: "edm",
    title: "EDM 主旨內容改寫",
    deadlineLabel: "4天後到期",
    maxProgress: 10,
    favoredPair: ["copy", "creativity"],
    requirements: [
      { key: "copy", label: "文案", value: 14 },
      { key: "creativity", label: "創意", value: 8 },
      { key: "analysis", label: "分析", value: 6 },
    ],
    expectedProgress: 9,
  },
  {
    id: "comment",
    title: "回覆粉專留言",
    deadlineLabel: "4天後到期",
    maxProgress: 20,
    favoredPair: ["copy", "analysis"],
    requirements: [
      { key: "copy", label: "文案", value: 12 },
      { key: "analysis", label: "分析", value: 10 },
      { key: "system", label: "機制", value: 8 },
    ],
    expectedProgress: 11,
  },
];

const PANEL_BG = "#A57E5D";
const CARD_BG = "#B79069";
const CARD_BG_ACTIVE = "#B98F67";
const BUTTON_BG = "#9C6D44";
const WORK_DAY_FRAMES = [
  "/images/work/Office_Work_Day_Focus_01.png",
  "/images/work/Office_Work_Day_Focus_02.png",
  "/images/work/Office_Work_Day_Focus_03.png",
] as const;
const revealCard = keyframes`
  0% {
    opacity: 0;
    transform: translateY(18px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;
const thinkingSpin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;
const fadeOutSoft = keyframes`
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-6px);
  }
`;

function shuffleArray<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function createInitialTasks(savedProgressById?: Record<string, number>) {
  return TASK_TEMPLATES.map((task) => ({
    ...task,
    progress: Math.max(0, Math.min(task.maxProgress, savedProgressById?.[task.id] ?? 0)),
  }));
}

function buildTechniques(baseFatigue: number): TechniqueCard[] {
  const fatiguePenalty = Math.max(0, Math.round(baseFatigue / 25));
  return [
    { id: "copy", label: "文案", power: 5, accent: "#E4BB86" },
    { id: "creativity", label: "創意", power: Math.max(3, 5 - fatiguePenalty), accent: "#D98A72" },
    { id: "visual", label: "視覺", power: 4, accent: "#CFAB7D" },
    { id: "analysis", label: "分析", power: 4, accent: "#98AFC4" },
    { id: "system", label: "機制", power: 4, accent: "#92A0C7" },
  ];
}

function getTechniqueSummary(cards: TechniqueCard[]) {
  if (cards.length === 0) return "尚未選擇";
  if (cards.length === 1) return cards[0].label;
  return cards.map((card) => card.label).join(" + ");
}

function computeProgressGain(task: WorkTaskState, cards: TechniqueCard[]) {
  if (cards.length === 0) return 0;

  let amount = cards.reduce((sum, card) => sum + card.power, 0);
  const selectedIds = cards.map((card) => card.id);

  if (selectedIds.includes("copy") && selectedIds.includes("creativity")) amount += 2;
  if (selectedIds.includes("analysis") && selectedIds.includes("system")) amount += 3;
  if (selectedIds.includes("visual") && selectedIds.includes("creativity")) amount += 2;
  if (task.favoredPair && task.favoredPair.every((item) => selectedIds.includes(item))) amount += 3;

  return Math.max(2, amount);
}

function TaskOptionCard({
  task,
  isSelected,
  onClick,
}: {
  task: WorkTaskState;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Flex
      as="button"
      onClick={onClick}
      direction="column"
      gap="8px"
      px="16px"
      py="14px"
      borderRadius="12px"
      textAlign="left"
      bgColor={isSelected ? CARD_BG_ACTIVE : CARD_BG}
      border={isSelected ? "2px solid rgba(255,255,255,0.34)" : "2px solid transparent"}
      color="white"
    >
      <Flex align="flex-end" justify="space-between" gap="12px">
        <Box>
          <Text fontSize="13px" fontWeight="800">
            {task.title}
          </Text>
          <Text fontSize="10px" mt="4px" opacity={0.96}>
            {task.deadlineLabel}
          </Text>
        </Box>
        <Text fontSize="11px" fontWeight="700" whiteSpace="nowrap">
          完成度 {task.progress}/{task.maxProgress}
        </Text>
      </Flex>
    </Flex>
  );
}

function TechniqueOptionCard({
  technique,
  isSelected,
  onClick,
}: {
  technique: TechniqueCard;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Flex
      as="button"
      onClick={onClick}
      w="100%"
      direction="column"
      align="center"
      justify="space-between"
      minH="112px"
      borderRadius="10px"
      px="10px"
      py="16px"
      bgColor={isSelected ? "#C79E77" : "#C39B74"}
      border={isSelected ? `2px solid ${technique.accent}` : "2px solid transparent"}
      color="white"
    >
      <Text fontSize="16px" fontWeight="800">
        {technique.label}
      </Text>
      <Flex align="baseline" gap="4px">
        <Text fontSize="10px" fontWeight="700" opacity={0.9}>
          執行力
        </Text>
        <Text fontSize="20px" fontWeight="900">
          {technique.power}
        </Text>
      </Flex>
    </Flex>
  );
}

export function WorkMinigameTestModal({
  baseFatigue,
  onClose,
  onComplete,
}: {
  baseFatigue: number;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const allTechniques = useMemo(() => buildTechniques(baseFatigue), [baseFatigue]);
  const [tasks, setTasks] = useState<WorkTaskState[]>(() =>
    createInitialTasks(loadPlayerProgress().workTaskProgressById),
  );
  const [step, setStep] = useState<WorkStep>("pick-task");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [availableTechniqueIds, setAvailableTechniqueIds] = useState<WorkStatKey[]>([]);
  const [selectedTechniqueIds, setSelectedTechniqueIds] = useState<WorkStatKey[]>([]);
  const [appliedProgressGain, setAppliedProgressGain] = useState(0);
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const [visibleTechniqueCount, setVisibleTechniqueCount] = useState(0);
  const [isDealingIntroVisible, setIsDealingIntroVisible] = useState(false);
  const [workFrameIndex, setWorkFrameIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const frameTimer = window.setInterval(() => {
      setWorkFrameIndex((prev) => (prev + 1) % WORK_DAY_FRAMES.length);
    }, 240);
    return () => window.clearInterval(frameTimer);
  }, []);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const availableTechniques = allTechniques.filter((card) => availableTechniqueIds.includes(card.id));
  const selectedTechniques = availableTechniques.filter((card) => selectedTechniqueIds.includes(card.id));

  useEffect(() => {
    if (step !== "result" || selectedTask === null) return;

    let current = selectedTask.progress - appliedProgressGain;
    setDisplayedProgress(current);

    const timer = window.setInterval(() => {
      current = Math.min(selectedTask.progress, current + Math.max(1, Math.round(appliedProgressGain / 5)));
      setDisplayedProgress(current);
      if (current >= selectedTask.progress) {
        window.clearInterval(timer);
      }
    }, 120);

    return () => window.clearInterval(timer);
  }, [appliedProgressGain, selectedTask, step]);

  useEffect(() => {
    if (step !== "dealing-technique") return;

    setIsDealingIntroVisible(true);
    setVisibleTechniqueCount(0);

    const revealTimers = [0, 1, 2].map((index) =>
      window.setTimeout(() => {
        setVisibleTechniqueCount(index + 1);
      }, 1080 + index * 260),
    );
    const introHideTimer = window.setTimeout(() => {
      setIsDealingIntroVisible(false);
    }, 760);
    const readyTimer = window.setTimeout(() => {
      setStep("pick-technique");
    }, 2160);

    return () => {
      window.clearTimeout(introHideTimer);
      revealTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(readyTimer);
    };
  }, [step]);

  const resetFlow = () => {
    setTasks(createInitialTasks(loadPlayerProgress().workTaskProgressById));
    setStep("pick-task");
    setSelectedTaskId(null);
    setAvailableTechniqueIds([]);
    setSelectedTechniqueIds([]);
    setAppliedProgressGain(0);
    setDisplayedProgress(0);
    setVisibleTechniqueCount(0);
    setIsDealingIntroVisible(false);
  };

  const handleTaskPick = (taskId: string) => {
    const drawnTechniqueIds = shuffleArray(allTechniques.map((technique) => technique.id)).slice(0, 3);
    setSelectedTaskId(taskId);
    setAvailableTechniqueIds(drawnTechniqueIds);
    setSelectedTechniqueIds([]);
    setAppliedProgressGain(0);
    setDisplayedProgress(0);
    setVisibleTechniqueCount(0);
    setIsDealingIntroVisible(false);
    setStep("dealing-technique");
  };

  const toggleTechnique = (techniqueId: WorkStatKey) => {
    setSelectedTechniqueIds((prev) => {
      if (prev.includes(techniqueId)) return prev.filter((id) => id !== techniqueId);
      if (prev.length >= 2) return prev;
      return [...prev, techniqueId];
    });
  };

  const startWork = () => {
    if (!selectedTask || selectedTechniques.length === 0) return;
    const gain = computeProgressGain(selectedTask, selectedTechniques);
    const nextProgress = Math.min(selectedTask.maxProgress, selectedTask.progress + gain);
    setAppliedProgressGain(gain);
    setTasks((prev) =>
      prev.map((task) =>
        task.id === selectedTask.id
          ? { ...task, progress: nextProgress }
          : task,
      ),
    );
    saveWorkTaskProgress(selectedTask.id, nextProgress);
    setStep("result");
  };

  const topCard = selectedTask ? (
    <Flex
      w="100%"
      direction="column"
      gap="10px"
      borderRadius="10px"
      bgColor="rgba(167,127,92,0.96)"
      px="16px"
      py="14px"
      color="white"
    >
      <Flex justify="space-between" align="flex-start" gap="12px">
        <Box>
          <Text fontSize="14px" fontWeight="800">
            {selectedTask.title}
          </Text>
          <Text fontSize="10px" mt="4px" opacity={0.96}>
            {selectedTask.deadlineLabel}
          </Text>
        </Box>
        <Text fontSize="11px" fontWeight="700" whiteSpace="nowrap">
          完成度 {selectedTask.progress}/{selectedTask.maxProgress}
        </Text>
      </Flex>
      {step === "pick-technique" ? (
        <Flex gap="22px" wrap="wrap">
          {selectedTask.requirements.map((item) => (
            <Text key={item.key} fontSize="12px" fontWeight="700">
              {item.label} {item.value}
            </Text>
          ))}
        </Flex>
      ) : null}
    </Flex>
  ) : null;

  const progressRatio = selectedTask ? Math.min(1, displayedProgress / selectedTask.maxProgress) : 0;

  return (
    <Flex position="absolute" inset="0" zIndex={70} bgColor="rgba(31,24,18,0.58)" justifyContent="center" px="12px" py="18px">
      <Flex
        w="100%"
        maxW="420px"
        maxH="100%"
        direction="column"
        overflow="hidden"
        borderRadius="22px"
        bgColor={PANEL_BG}
        boxShadow="0 18px 46px rgba(0,0,0,0.34)"
      >
        <Flex
          position="relative"
          minH="340px"
          px="14px"
          pt="14px"
          pb="14px"
          direction="column"
          justify="space-between"
          overflow="hidden"
        >
          <Box position="absolute" inset="0">
            <img
              src={WORK_DAY_FRAMES[workFrameIndex]}
              alt="小麥上班背景動畫"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </Box>
          <Flex position="relative" zIndex={1} justify="flex-end" gap="8px">
            <Flex
              as="button"
              onClick={resetFlow}
              w="34px"
              h="34px"
              borderRadius="999px"
              bgColor="rgba(255,255,255,0.86)"
              align="center"
              justify="center"
              color="#7C624B"
            >
              <FiRefreshCw size={16} />
            </Flex>
            <Flex
              as="button"
              onClick={onClose}
              w="34px"
              h="34px"
              borderRadius="999px"
              bgColor="rgba(255,255,255,0.86)"
              align="center"
              justify="center"
              color="#7C624B"
            >
              <FiX size={18} />
            </Flex>
          </Flex>

          {step === "pick-technique" && topCard ? (
            <Flex position="relative" zIndex={1} justify="center" px="10px">
              {topCard}
            </Flex>
          ) : null}
        </Flex>

        <Flex flex="1" direction="column" px="18px" py="18px" gap="18px" overflowY="auto">
          {step === "pick-task" ? (
            <>
              <Text color="white" fontSize="16px" fontWeight="800" textAlign="center">
                今天要安排哪一項工作任務呢？
              </Text>

              <Flex direction="column" gap="12px" borderRadius="14px" bgColor="rgba(197,160,124,0.34)" p="12px">
                {tasks.map((task) => (
                  <TaskOptionCard
                    key={task.id}
                    task={task}
                    isSelected={selectedTaskId === task.id}
                    onClick={() => handleTaskPick(task.id)}
                  />
                ))}
              </Flex>
            </>
          ) : null}

          {step === "dealing-technique" ? (
            <>
              {isDealingIntroVisible ? (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  gap="8px"
                  minH="220px"
                  animation={`${fadeOutSoft} 260ms ease forwards`}
                  animationDelay="500ms"
                >
                  <Flex align="center" gap="8px">
                    <Box
                      w="14px"
                      h="14px"
                      borderRadius="999px"
                      border="2px solid rgba(255,255,255,0.28)"
                      borderTopColor="rgba(255,255,255,0.95)"
                      animation={`${thinkingSpin} 0.85s linear infinite`}
                    />
                    <Text color="rgba(255,255,255,0.92)" fontSize="12px" fontWeight="700">
                      思考中...
                    </Text>
                  </Flex>
                  <Text
                    color="rgba(255,255,255,0.92)"
                    fontSize="22px"
                    fontWeight="800"
                    lineHeight="1.65"
                    textAlign="center"
                  >
                    小麥今天腦中先浮現了幾個做法……
                  </Text>
                </Flex>
              ) : (
                <>
                  <Flex direction="column" align="center" gap="8px">
                    <Text color="white" fontSize="18px" fontWeight="800">
                      選擇行動
                    </Text>
                    <Text color="rgba(255,255,255,0.92)" fontSize="11px" fontWeight="700">
                      最多兩項
                    </Text>
                  </Flex>

                  <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap="12px">
                    {availableTechniques.map((technique, index) => {
                      const isVisible = index < visibleTechniqueCount;
                      return isVisible ? (
                        <Box
                          key={technique.id}
                          w="100%"
                          animation={`${revealCard} 320ms ease both`}
                        >
                          <TechniqueOptionCard
                            technique={technique}
                            isSelected={false}
                            onClick={() => undefined}
                          />
                        </Box>
                      ) : (
                        <Box key={technique.id} w="100%" minH="112px" />
                      );
                    })}
                  </Grid>
                </>
              )}
            </>
          ) : null}

          {step === "pick-technique" ? (
            <>
              <Flex direction="column" align="center" gap="8px">
                <Text color="white" fontSize="18px" fontWeight="800">
                  選擇行動
                </Text>
                <Text color="rgba(255,255,255,0.92)" fontSize="11px" fontWeight="700">
                  最多兩項
                </Text>
              </Flex>

              <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap="12px">
                {availableTechniques.map((technique) => (
                  <TechniqueOptionCard
                    key={technique.id}
                    technique={technique}
                    isSelected={selectedTechniqueIds.includes(technique.id)}
                    onClick={() => toggleTechnique(technique.id)}
                  />
                ))}
              </Grid>

              <Flex justify="center" mt="auto" pt="8px">
                <Flex
                  as="button"
                  onClick={startWork}
                  minW="118px"
                  h="54px"
                  px="28px"
                  borderRadius="10px"
                  align="center"
                  justify="center"
                  bgColor={selectedTechniqueIds.length > 0 ? BUTTON_BG : "rgba(156,109,68,0.44)"}
                  color="white"
                  fontSize="18px"
                  fontWeight="800"
                >
                  開工
                </Flex>
              </Flex>
            </>
          ) : null}

          {step === "result" && selectedTask ? (
            <>
              <Flex
                position="relative"
                w="100%"
                minH="76px"
                borderRadius="10px"
                overflow="hidden"
                bgColor="#A06E42"
              >
                <Flex
                  position="absolute"
                  left="0"
                  top="0"
                  bottom="0"
                  w={`${Math.max(0, progressRatio * 100)}%`}
                  bgColor="#7D5838"
                  transition="width 0.32s ease"
                >
                </Flex>
                <Flex
                  position="relative"
                  zIndex={1}
                  w="100%"
                  minH="76px"
                  align="center"
                  justify="space-between"
                  gap="12px"
                  px="16px"
                  py="12px"
                  color="white"
                >
                  <Box>
                    <Text fontSize="13px" fontWeight="800">
                      {selectedTask.title}
                    </Text>
                    <Text fontSize="10px" mt="4px" opacity={0.96}>
                      {selectedTask.deadlineLabel}
                    </Text>
                  </Box>
                  <Text fontSize="12px" fontWeight="700" whiteSpace="nowrap">
                    完成度 {displayedProgress}/{selectedTask.maxProgress}
                  </Text>
                </Flex>
              </Flex>

              <Flex justify="center" mt="auto" pt="16px">
                <Flex
                  as="button"
                  onClick={onComplete ?? onClose}
                minW="118px"
                h="54px"
                px="28px"
                  borderRadius="10px"
                  align="center"
                  justify="center"
                  bgColor={BUTTON_BG}
                  color="white"
                  fontSize="18px"
                  fontWeight="800"
                >
                  下班
                </Flex>
              </Flex>
            </>
          ) : null}
        </Flex>
      </Flex>
    </Flex>
  );
}
