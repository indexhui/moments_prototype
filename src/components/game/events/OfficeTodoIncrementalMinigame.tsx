"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import {
  FiCheck,
  FiCheckSquare,
  FiClock,
  FiCoffee,
  FiFileText,
  FiFolder,
  FiInbox,
  FiMail,
  FiMousePointer,
} from "react-icons/fi";

type TodoPhase = "intro" | "playing" | "upgrade" | "complete";
type TodoKind = "mail" | "proofread" | "files" | "report";
type SwipeDirection = "horizontal";
type TodoUpgrade = "gesture-shortcut" | "template" | "priority-label";

type TodoTask = {
  id: number;
  kind: TodoKind;
  title: string;
  detail: string;
  effort: number;
  progress: number;
  reward: number;
  timeLeft: number;
  overdue: boolean;
  completed: boolean;
  direction: SwipeDirection;
  color: string;
};

type StrokeState = {
  pointerId: number;
  startX: number;
  startY: number;
  anchorX: number;
  anchorY: number;
  trailStartX: number;
  trailStartY: number;
  lastScoredDirection: -1 | 0 | 1;
  scoredUnits: number;
};

type GesturePreview = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

type CompletionBurst = {
  nonce: number;
  title: string;
  reward: number;
};

const SCORE_TARGET = 120;
const UPGRADE_TARGETS = [35, 75] as const;

const TODO_TEMPLATES: Array<Omit<TodoTask, "id" | "progress" | "overdue" | "completed">> = [
  {
    kind: "mail",
    direction: "horizontal",
    title: "回覆客戶郵件",
    detail: "把三個問題回覆清楚",
    effort: 4,
    reward: 14,
    timeLeft: 25,
    color: "#F7D36B",
  },
  {
    kind: "proofread",
    direction: "horizontal",
    title: "校對下午簡報",
    detail: "圈出錯字並確認頁碼",
    effort: 5,
    reward: 20,
    timeLeft: 32,
    color: "#E5A0A7",
  },
  {
    kind: "files",
    direction: "horizontal",
    title: "整理共享資料夾",
    detail: "把散落檔案放回正確位置",
    effort: 6,
    reward: 26,
    timeLeft: 39,
    color: "#90C8B5",
  },
  {
    kind: "report",
    direction: "horizontal",
    title: "填寫今天的週報",
    detail: "補齊成果、問題與下一步",
    effort: 7,
    reward: 32,
    timeLeft: 46,
    color: "#AFA2D4",
  },
];

const UPGRADE_COPY: Record<
  TodoUpgrade,
  { title: string; detail: string; symbol: string }
> = {
  "gesture-shortcut": {
    title: "手勢捷徑",
    detail: "每次左右轉向多完成 1 格",
    symbol: "↔",
  },
  template: {
    title: "工作範本",
    detail: "新任務需要的處理格數 -25%",
    symbol: "▤",
  },
  "priority-label": {
    title: "優先標籤",
    detail: "新待辦的期限增加 12 秒",
    symbol: "!",
  },
};

const panelIn = keyframes`
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const taskArrive = keyframes`
  0% { opacity: 0; transform: translateX(28px) rotate(3deg); }
  70% { opacity: 1; transform: translateX(-3px) rotate(-1deg); }
  100% { opacity: 1; transform: translateX(0) rotate(0); }
`;

const checkBurst = keyframes`
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.4) rotate(-12deg); }
  26% { opacity: 1; transform: translate(-50%, -50%) scale(1.12) rotate(3deg); }
  72% { opacity: 1; transform: translate(-50%, -64%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -110%) scale(0.86); }
`;

const workPulse = keyframes`
  0% { transform: scale(1); }
  40% { transform: scale(0.985); filter: brightness(1.08); }
  100% { transform: scale(1); }
`;

const wrongGesture = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-7px); }
  50% { transform: translateX(6px); }
  75% { transform: translateX(-3px); }
`;

const brushHeadPulse = keyframes`
  0%, 100% { transform: scale(0.84); opacity: 0.82; }
  50% { transform: scale(1.14); opacity: 1; }
`;

const sparkDrift = keyframes`
  0% { opacity: 0.9; transform: translate(0, 0) scale(1); }
  100% { opacity: 0; transform: translate(var(--spark-x), var(--spark-y)) scale(0.25); }
`;

const strikeAcross = keyframes`
  from { transform: scaleX(0) rotate(-3deg); }
  to { transform: scaleX(1) rotate(-3deg); }
`;

const taskArchive = keyframes`
  0% { opacity: 1; transform: translateX(0) rotate(0); }
  45% { opacity: 1; transform: translateX(0) rotate(-2deg) scale(1.03); }
  100% { opacity: 0; transform: translateX(-38px) rotate(-4deg) scale(0.88); }
`;

const completedStamp = keyframes`
  0% { opacity: 0; transform: translate(-50%, -50%) scale(1.8) rotate(-9deg); }
  55% { opacity: 1; transform: translate(-50%, -50%) scale(0.92) rotate(-5deg); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(-5deg); }
`;

const urgentBlink = keyframes`
  0%, 100% { box-shadow: 0 0 0 rgba(214, 91, 84, 0); }
  50% { box-shadow: 0 0 0 3px rgba(214, 91, 84, 0.22); }
`;

function taskIcon(kind: TodoKind, size = 16) {
  if (kind === "mail") return <FiMail size={size} />;
  if (kind === "proofread") return <FiFileText size={size} />;
  if (kind === "files") return <FiFolder size={size} />;
  return <FiCheckSquare size={size} />;
}

const DIRECTION_META: Record<
  SwipeDirection,
  { arrow: string; label: string }
> = {
  horizontal: { arrow: "↔", label: "左右來回滑" },
};

function isMatchingDirection(direction: SwipeDirection, dx: number, dy: number) {
  void direction;
  const distance = Math.hypot(dx, dy);
  if (distance < 38) return false;
  return Math.abs(dx) >= Math.abs(dy) * 0.75;
}

const TODO_GUIDE_PATHS: Record<TodoKind, string> = {
  mail: "M13 16 C50 16 111 16 145 18 C153 19 153 24 144 28 C108 41 65 51 27 62 C12 66 11 73 25 77 C58 84 112 81 145 84 C153 85 152 90 142 92 L44 94",
  proofread: "M147 15 C108 15 52 15 22 18 C12 19 11 25 21 29 C55 41 105 47 139 54 C152 57 152 64 138 68 C101 76 54 75 24 80 C12 82 13 88 25 91 L121 94",
  files: "M14 14 C51 13 108 14 141 17 C153 18 153 25 141 30 C108 41 67 43 31 51 C14 55 14 63 30 67 C64 74 111 73 142 78 C153 80 152 87 139 91 C112 96 78 94 47 94",
  report: "M14 12 C54 12 112 12 145 15 C153 16 152 21 143 25 C110 34 63 35 25 41 C12 43 12 49 24 52 C59 58 111 55 144 60 C153 62 152 68 143 71 C108 79 61 77 25 83 C13 85 14 90 26 93 C59 97 103 94 133 94",
};

function HorizontalSwipeGuide({
  kind,
  progress,
}: {
  kind: TodoKind;
  progress: number;
}) {
  const path = TODO_GUIDE_PATHS[kind];
  const completedPercent = Math.max(0, Math.min(100, progress));
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 160 104"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: "block", overflow: "visible" }}
    >
      <path
        d={path}
        pathLength="100"
        fill="none"
        stroke="rgba(74,67,57,0.25)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={path}
        pathLength="100"
        fill="none"
        stroke="#3F786A"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${completedPercent} 100`}
      />
      <path
        d={path}
        pathLength="100"
        fill="none"
        stroke="rgba(255,248,215,0.92)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 8"
      >
        <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="0.8s" repeatCount="indefinite" />
      </path>
      <circle r="9" fill="rgba(255,248,215,0.24)">
        <animateMotion dur="2.5s" repeatCount="indefinite" path={path} />
        <animate attributeName="r" values="7;10;7" dur="0.72s" repeatCount="indefinite" />
      </circle>
      <circle r="5" fill="#FFF8D7" stroke="#4A4339" strokeWidth="3">
        <animateMotion dur="2.5s" repeatCount="indefinite" path={path} />
      </circle>
    </svg>
  );
}

function GestureBrushPreview({ preview }: { preview: GesturePreview }) {
  const dx = preview.endX - preview.startX;
  const dy = preview.endY - preview.startY;
  const distance = Math.hypot(dx, dy);
  const safeDistance = Math.max(1, distance);
  const normalX = -dy / safeDistance;
  const normalY = dx / safeDistance;
  const bend = Math.min(13, distance * 0.16) * (dx >= 0 ? -1 : 1);
  const controlX = preview.startX + dx * 0.5 + normalX * bend;
  const controlY = preview.startY + dy * 0.5 + normalY * bend;
  const path = `M ${preview.startX} ${preview.startY} Q ${controlX} ${controlY} ${preview.endX} ${preview.endY}`;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <Box position="absolute" inset="0" zIndex={12} overflow="hidden" pointerEvents="none">
      {distance > 3 ? (
        <svg width="100%" height="100%" style={{ display: "block", overflow: "visible" }} aria-hidden="true">
          <defs>
            <linearGradient
              id="todo-gesture-ribbon"
              gradientUnits="userSpaceOnUse"
              x1={preview.startX}
              y1={preview.startY}
              x2={preview.endX}
              y2={preview.endY}
            >
              <stop offset="0%" stopColor="#FFF8D7" stopOpacity="0" />
              <stop offset="42%" stopColor="#FFF8D7" stopOpacity="0.62" />
              <stop offset="78%" stopColor="#FFFFFF" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#3F786A" stopOpacity="0.94" />
            </linearGradient>
          </defs>
          <path d={path} fill="none" stroke="rgba(74,67,57,0.22)" strokeWidth="13" strokeLinecap="round" />
          <path d={path} fill="none" stroke="url(#todo-gesture-ribbon)" strokeWidth="8" strokeLinecap="round" />
          <path
            d={path}
            pathLength="100"
            fill="none"
            stroke="rgba(255,255,255,0.92)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="3 9"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="0.38s" repeatCount="indefinite" />
          </path>
        </svg>
      ) : null}

      <Box
        position="absolute"
        left={`${preview.endX}px`}
        top={`${preview.endY}px`}
        w="24px"
        h="18px"
        transform={`translate(-50%, -50%) rotate(${angle}deg)`}
      >
        <Flex
          w="100%"
          h="100%"
          alignItems="center"
          justifyContent="center"
          border="3px solid #4A4339"
          borderRadius="52% 68% 68% 52%"
          bgColor="#FFF8D7"
          boxShadow="0 0 0 4px rgba(255,248,215,0.3), 0 0 12px rgba(255,255,255,0.7)"
          animation={`${brushHeadPulse} 440ms ease-in-out infinite`}
        >
          <Box w="6px" h="6px" borderRadius="50%" bgColor="#3F786A" />
        </Flex>
      </Box>

      {distance > 7
        ? [
            { x: -11, y: -8 },
            { x: -14, y: 5 },
            { x: 8, y: -11 },
          ].map((spark, index) => (
            <Box
              key={index}
              position="absolute"
              left={`${preview.endX}px`}
              top={`${preview.endY}px`}
              w="5px"
              h="5px"
              borderRadius={index === 1 ? "50%" : "1px"}
              bgColor={index === 1 ? "#3F786A" : "#FFF8D7"}
              animation={`${sparkDrift} ${360 + index * 70}ms steps(4, end) infinite`}
              style={
                {
                  "--spark-x": `${spark.x}px`,
                  "--spark-y": `${spark.y}px`,
                } as CSSProperties
              }
            />
          ))
        : null}
    </Box>
  );
}

function createTodoTask(
  id: number,
  hasTemplate: boolean,
  hasPriorityLabel = false,
): TodoTask {
  const template = TODO_TEMPLATES[(id - 1) % TODO_TEMPLATES.length];
  return {
    ...template,
    id,
    progress: 0,
    overdue: false,
    completed: false,
    effort: hasTemplate ? Math.max(3, Math.ceil(template.effort * 0.75)) : template.effort,
    timeLeft: template.timeLeft + (id % 3) * 4 + (hasPriorityLabel ? 12 : 0),
  };
}

const INITIAL_TASKS: TodoTask[] = [
  createTodoTask(1, false),
  createTodoTask(2, false),
  createTodoTask(3, false),
];

export function OfficeTodoIncrementalMinigame({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [phase, setPhase] = useState<TodoPhase>("intro");
  const [tasks, setTasks] = useState<TodoTask[]>(INITIAL_TASKS);
  const [selectedTaskId, setSelectedTaskId] = useState(1);
  const [score, setScore] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [selectedUpgrades, setSelectedUpgrades] = useState<TodoUpgrade[]>([]);
  const [upgradeIndex, setUpgradeIndex] = useState(0);
  const [feedback, setFeedback] = useState("先挑一張待辦，再在工作紙上滑動處理");
  const [burst, setBurst] = useState<CompletionBurst | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const [gesturePreview, setGesturePreview] = useState<GesturePreview | null>(null);
  const [wrongGestureNonce, setWrongGestureNonce] = useState(0);
  const tasksRef = useRef<TodoTask[]>(INITIAL_TASKS);
  const selectedTaskIdRef = useRef(1);
  const taskIdRef = useRef(4);
  const strokeRef = useRef<StrokeState | null>(null);
  const burstNonceRef = useRef(0);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null;
  const activeTasks = tasks.filter((task) => !task.completed);
  const scoreProgress = Math.min(100, (score / SCORE_TARGET) * 100);
  const inboxPressure = Math.min(
    100,
    activeTasks.reduce((total, task) => total + (task.overdue ? 28 : Math.max(4, 16 - task.timeLeft * 0.32)), 0),
  );
  const hasGestureShortcut = selectedUpgrades.includes("gesture-shortcut");
  const hasTemplate = selectedUpgrades.includes("template");
  const hasPriorityLabel = selectedUpgrades.includes("priority-label");
  const workUnit = hasGestureShortcut ? 2 : 1;
  const upgradeChoices = useMemo<TodoUpgrade[]>(() => {
    const unused = (["gesture-shortcut", "template", "priority-label"] as TodoUpgrade[]).filter(
      (upgrade) => !selectedUpgrades.includes(upgrade),
    );
    return unused.slice(0, 2);
  }, [selectedUpgrades]);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    selectedTaskIdRef.current = selectedTaskId;
  }, [selectedTaskId]);

  const replaceTasks = useCallback((nextTasks: TodoTask[]) => {
    tasksRef.current = nextTasks;
    setTasks(nextTasks);
  }, []);

  const finishTask = useCallback(
    (task: TodoTask) => {
      const nextTasks = tasksRef.current.map((candidate) =>
        candidate.id === task.id
          ? { ...candidate, progress: candidate.effort, completed: true }
          : candidate,
      );
      replaceTasks(nextTasks);
      setCompletingTaskId(task.id);
      strokeRef.current = null;
      setGesturePreview(null);
      setScore((current) => current + task.reward);
      setCompletedCount((current) => current + 1);
      burstNonceRef.current += 1;
      setBurst({ nonce: burstNonceRef.current, title: task.title, reward: task.reward });
      setFeedback(task.overdue ? `補完逾期待辦「${task.title}」` : `打勾完成「${task.title}」`);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([18, 30, 24]);
    },
    [replaceTasks],
  );

  useEffect(() => {
    if (completingTaskId === null) return;
    const timer = window.setTimeout(() => {
      const nextTasks = tasksRef.current.filter((task) => task.id !== completingTaskId);
      replaceTasks(nextTasks);
      const nextSelected = nextTasks.find((task) => !task.completed)?.id ?? 0;
      selectedTaskIdRef.current = nextSelected;
      setSelectedTaskId(nextSelected);
      setCompletingTaskId(null);
    }, 820);
    return () => window.clearTimeout(timer);
  }, [completingTaskId, replaceTasks]);

  const applyWorkUnits = useCallback(
    (rawUnits: number) => {
      if (phase !== "playing") return;
      const task = tasksRef.current.find((candidate) => candidate.id === selectedTaskIdRef.current);
      if (!task || task.completed) {
        setFeedback("待辦箱暫時清空了，下一張馬上進來");
        return;
      }
      const units = Math.max(1, rawUnits) * workUnit;
      const nextProgress = Math.min(task.effort, task.progress + units);
      if (nextProgress >= task.effort) {
        finishTask({ ...task, progress: nextProgress });
        return;
      }
      const nextTasks = tasksRef.current.map((candidate) =>
        candidate.id === task.id ? { ...candidate, progress: nextProgress } : candidate,
      );
      replaceTasks(nextTasks);
      setFeedback(`正在處理「${task.title}」 ${nextProgress}/${task.effort}`);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(7);
    },
    [finishTask, phase, replaceTasks, workUnit],
  );

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => {
      const nextTasks = tasksRef.current.map((task) => {
        if (task.completed) return task;
        const timeLeft = Math.max(0, task.timeLeft - 1);
        return { ...task, timeLeft, overdue: task.overdue || timeLeft <= 0 };
      });
      replaceTasks(nextTasks);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, replaceTasks]);

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => {
      if (tasksRef.current.filter((task) => !task.completed).length >= 4) return;
      const nextId = taskIdRef.current;
      taskIdRef.current += 1;
      const nextTask = createTodoTask(nextId, hasTemplate, hasPriorityLabel);
      const nextTasks = [...tasksRef.current, nextTask];
      replaceTasks(nextTasks);
      if (!selectedTaskIdRef.current) {
        selectedTaskIdRef.current = nextTask.id;
        setSelectedTaskId(nextTask.id);
      }
      setFeedback(`新待辦進來了：「${nextTask.title}」`);
    }, 3800);
    return () => window.clearInterval(timer);
  }, [hasPriorityLabel, hasTemplate, phase, replaceTasks]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (score >= SCORE_TARGET) {
      setPhase("complete");
      return;
    }
    const target = UPGRADE_TARGETS[upgradeIndex];
    if (target !== undefined && score >= target) setPhase("upgrade");
  }, [phase, score, upgradeIndex]);

  const handleWorkPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (phase !== "playing") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    strokeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      anchorX: event.clientX,
      anchorY: event.clientY,
      trailStartX: event.clientX,
      trailStartY: event.clientY,
      lastScoredDirection: 0,
      scoredUnits: 0,
    };
    const workPadRect = event.currentTarget.getBoundingClientRect();
    setGesturePreview({
      startX: event.clientX - workPadRect.left,
      startY: event.clientY - workPadRect.top,
      endX: event.clientX - workPadRect.left,
      endY: event.clientY - workPadRect.top,
    });
  };

  const handleWorkPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const stroke = strokeRef.current;
    if (!stroke || stroke.pointerId !== event.pointerId) return;
    const task = tasksRef.current.find((candidate) => candidate.id === selectedTaskIdRef.current);
    if (!task || task.completed) return;
    const dxFromAnchor = event.clientX - stroke.anchorX;
    const dyFromAnchor = event.clientY - stroke.anchorY;
    const horizontalDistance = Math.abs(dxFromAnchor);
    const nextDirection: -1 | 0 | 1 = dxFromAnchor > 0 ? 1 : dxFromAnchor < 0 ? -1 : 0;

    const workPadRect = event.currentTarget.getBoundingClientRect();
    setGesturePreview({
      startX: stroke.trailStartX - workPadRect.left,
      startY: stroke.trailStartY - workPadRect.top,
      endX: event.clientX - workPadRect.left,
      endY: event.clientY - workPadRect.top,
    });

    if (
      horizontalDistance >= 32 &&
      horizontalDistance >= Math.abs(dyFromAnchor) * 0.75 &&
      nextDirection !== 0 &&
      nextDirection !== stroke.lastScoredDirection
    ) {
      applyWorkUnits(1);
      stroke.anchorX = event.clientX;
      stroke.anchorY = event.clientY;
      stroke.trailStartX = event.clientX;
      stroke.trailStartY = event.clientY;
      stroke.lastScoredDirection = nextDirection;
      stroke.scoredUnits += 1;
      setGesturePreview({
        startX: event.clientX - workPadRect.left,
        startY: event.clientY - workPadRect.top,
        endX: event.clientX - workPadRect.left,
        endY: event.clientY - workPadRect.top,
      });
      return;
    }

    if (
      stroke.lastScoredDirection !== 0 &&
      nextDirection === stroke.lastScoredDirection &&
      horizontalDistance >= Math.abs(dyFromAnchor) * 0.75
    ) {
      stroke.anchorX = event.clientX;
      stroke.anchorY = event.clientY;
    }
  };

  const finishWorkSwipe = (event: ReactPointerEvent<HTMLElement>) => {
    const stroke = strokeRef.current;
    if (!stroke || stroke.pointerId !== event.pointerId) return;
    const dx = event.clientX - stroke.startX;
    const dy = event.clientY - stroke.startY;
    const task = tasksRef.current.find((candidate) => candidate.id === selectedTaskIdRef.current);
    strokeRef.current = null;
    setGesturePreview(null);
    if (!task || task.completed) return;
    if (stroke.scoredUnits > 0) {
      setFeedback(`已完成 ${stroke.scoredUnits} 段，可繼續反覆${DIRECTION_META[task.direction].label}`);
      return;
    }
    if (isMatchingDirection(task.direction, dx, dy)) {
      applyWorkUnits(1);
      setFeedback(`${DIRECTION_META[task.direction].label}成功，再反覆滑動就能繼續填格`);
      return;
    }
    setWrongGestureNonce((current) => current + 1);
    setFeedback(`這張便利貼要${DIRECTION_META[task.direction].label} ${DIRECTION_META[task.direction].arrow}`);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([10, 22, 10]);
  };

  const cancelWorkSwipe = () => {
    strokeRef.current = null;
    setGesturePreview(null);
  };

  const handleWorkKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    applyWorkUnits(1);
  };

  const chooseUpgrade = (upgrade: TodoUpgrade) => {
    setSelectedUpgrades((current) => [...current, upgrade]);
    setUpgradeIndex((current) => current + 1);
    setFeedback(`裝上「${UPGRADE_COPY[upgrade].title}」，繼續清待辦`);
    setPhase("playing");
  };

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={78}
      direction="column"
      overflow="hidden"
      bgColor="#24313A"
      backgroundImage="linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(160deg, #344650 0%, #1D282F 74%)"
      backgroundSize="8px 8px, 8px 8px, auto"
      color="white"
      data-office-todo-phase={phase}
    >
      <Flex px="16px" pt="13px" pb="9px" direction="column" gap="8px" flexShrink={0}>
        <Flex alignItems="center" justifyContent="space-between" gap="10px">
          <Box minW="0">
            <Text color="#F6D875" fontSize="9px" fontWeight="900" letterSpacing="0.14em">
              辦公遊戲方案 2
            </Text>
            <Text fontSize="20px" fontWeight="900">今天的待辦，今天打勾</Text>
          </Box>
          <Flex alignItems="center" gap="6px" px="9px" py="6px" borderRadius="8px" bgColor="#172127" boxShadow="inset 0 -2px 0 rgba(255,255,255,0.05)">
            <FiCoffee size={14} />
            <Text fontSize="10px" fontWeight="900">效率 {score}</Text>
          </Flex>
        </Flex>
        <Box h="8px" border="2px solid #151E23" bgColor="#11191D" p="1px">
          <Box h="100%" w={`${scoreProgress}%`} bg="linear-gradient(90deg, #E5B650, #F7DC79)" transition="width 160ms ease" />
        </Box>
      </Flex>

      <Flex flex="1" minH="0" px="12px" pb="12px" gap="9px">
        <Flex w="34%" minW="112px" direction="column" gap="7px">
          <Flex alignItems="center" justifyContent="space-between" px="7px">
            <Flex alignItems="center" gap="5px"><FiInbox size={12} /><Text fontSize="10px" fontWeight="900">待辦箱</Text></Flex>
            <Flex gap="5px">
              <Text color="#9FD4C1" fontSize="9px" fontWeight="900">✓ {completedCount}</Text>
              <Text color="#F6D875" fontSize="10px" fontWeight="900">{activeTasks.length}/4</Text>
            </Flex>
          </Flex>

          <Flex flex="1" minH="0" direction="column" gap="6px" overflow="hidden">
            {tasks.map((task) => {
              const selected = task.id === selectedTask?.id;
              const progress = Math.min(100, (task.progress / task.effort) * 100);
              const direction = DIRECTION_META[task.direction];
              return (
                <Flex
                  as="button"
                  key={task.id}
                  data-todo-task-id={task.id}
                  data-todo-task-kind={task.kind}
                  data-todo-task-direction={task.direction}
                  data-todo-task-overdue={task.overdue ? "true" : "false"}
                  data-todo-task-completed={task.completed ? "true" : "false"}
                  position="relative"
                  flex="1"
                  minH="0"
                  maxH="118px"
                  direction="column"
                  alignItems="stretch"
                  justifyContent="space-between"
                  gap="5px"
                  p="8px"
                  border={selected ? "3px solid #FFF4BF" : "2px solid #172127"}
                  bgColor={task.overdue ? "#F2B5AA" : task.color}
                  color="#3C3831"
                  textAlign="left"
                  cursor={task.completed ? "default" : "pointer"}
                  boxShadow={selected ? "4px 4px 0 #11191D" : "2px 3px 0 rgba(15,24,28,0.75)"}
                  overflow="hidden"
                  animation={
                    task.completed
                      ? `${taskArchive} 820ms steps(8, end) both`
                      : `${taskArrive} 260ms steps(4, end) both${task.overdue ? `, ${urgentBlink} 1000ms steps(2, end) infinite` : ""}`
                  }
                  pointerEvents={task.completed ? "none" : "auto"}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <Flex
                    position="absolute"
                    zIndex={4}
                    right="3px"
                    bottom="3px"
                    w="19px"
                    h="19px"
                    alignItems="center"
                    justifyContent="center"
                    border="2px solid rgba(55,50,43,0.7)"
                    bgColor="rgba(255,250,226,0.92)"
                    fontSize="13px"
                    fontWeight="900"
                    pointerEvents="none"
                  >
                    {direction.arrow}
                  </Flex>
                  <Flex alignItems="flex-start" gap="5px">
                    <Flex w="21px" h="21px" flexShrink={0} alignItems="center" justifyContent="center" border="2px solid rgba(60,56,49,0.72)" bgColor="rgba(255,255,255,0.35)">
                      {task.completed ? <FiCheck size={13} /> : taskIcon(task.kind, 12)}
                    </Flex>
                    <Text pr="13px" fontSize="9px" fontWeight="900" lineHeight="1.25" textDecoration={task.completed ? "line-through" : "none"}>{task.title}</Text>
                  </Flex>
                  <Flex alignItems="center" justifyContent="space-between" gap="3px">
                    <Flex alignItems="center" gap="3px" color={task.overdue ? "#9B3F3B" : "#655E52"}>
                      <FiClock size={9} />
                      <Text fontSize="8px" fontWeight="900">{task.completed ? "已完成" : task.overdue ? "逾期" : `${task.timeLeft}s`}</Text>
                    </Flex>
                    <Text fontSize="8px" fontWeight="900">{task.progress}/{task.effort}</Text>
                  </Flex>
                  <Box h="5px" border="1px solid rgba(50,46,40,0.4)" bgColor="rgba(255,255,255,0.32)">
                    <Box h="100%" w={`${progress}%`} bgColor="#3F786A" />
                  </Box>
                  {task.completed ? (
                    <>
                      <Box
                        position="absolute"
                        left="7px"
                        right="7px"
                        top="46%"
                        zIndex={8}
                        h="4px"
                        bgColor="#AA3E3B"
                        transformOrigin="left center"
                        animation={`${strikeAcross} 360ms steps(6, end) both`}
                      />
                      <Flex position="absolute" inset="0" zIndex={7} alignItems="center" justifyContent="center" bgColor="rgba(239,244,222,0.38)">
                        <Text px="6px" py="2px" border="3px solid #3F786A" color="#315F52" fontSize="10px" fontWeight="900" animation={`${completedStamp} 360ms steps(5, end) both`}>✓ 完成</Text>
                      </Flex>
                    </>
                  ) : null}
                </Flex>
              );
            })}
          </Flex>

          <Box px="7px" py="6px" border="2px solid #151E23" bgColor="#172127">
            <Flex justifyContent="space-between"><Text fontSize="8px" fontWeight="900">待辦壓力</Text><Text color={inboxPressure > 65 ? "#FF9B8E" : "#A7D9C8"} fontSize="8px" fontWeight="900">{Math.round(inboxPressure)}%</Text></Flex>
            <Box mt="4px" h="5px" bgColor="#0D1418"><Box h="100%" w={`${inboxPressure}%`} bgColor={inboxPressure > 65 ? "#D95D56" : "#66AC96"} transition="width 300ms ease" /></Box>
          </Box>
        </Flex>

        <Flex flex="1" minW="0" direction="column" border="3px solid #121A1F" bgColor="#E8E2D4" boxShadow="5px 6px 0 rgba(10,16,19,0.7)" color="#3E3932">
          <Flex h="30px" flexShrink={0} alignItems="center" justifyContent="space-between" px="9px" bgColor="#C8C0AE" borderBottom="2px solid #6D675D">
            <Text fontSize="9px" fontWeight="900">CURRENT_TASK.txt</Text>
            <Flex gap="4px"><Box w="6px" h="6px" bgColor="#D45F58" /><Box w="6px" h="6px" bgColor="#DBB95D" /><Box w="6px" h="6px" bgColor="#65A58F" /></Flex>
          </Flex>

          {selectedTask ? (
            <Flex flex="1" minH="0" direction="column" p="12px" gap="9px">
              <Flex alignItems="flex-start" gap="9px">
                <Flex w="38px" h="38px" flexShrink={0} alignItems="center" justifyContent="center" border="3px solid #3E3932" bgColor={selectedTask.color} boxShadow="3px 3px 0 #8E877A">
                  {taskIcon(selectedTask.kind, 19)}
                </Flex>
                <Box minW="0">
                  <Text fontSize="15px" fontWeight="900">{selectedTask.title}</Text>
                  <Text mt="2px" color="#756D61" fontSize="9px" fontWeight="800" lineHeight="1.35">{selectedTask.detail}</Text>
                </Box>
              </Flex>

              <Box flex="1" minH="208px" position="relative">
                <Flex
                  position="absolute"
                  zIndex={8}
                  left="50%"
                  top="0"
                  transform="translateX(-50%)"
                  direction="row"
                  alignItems="center"
                  gap="2px"
                  color="#3E3932"
                  pointerEvents="none"
                >
                  <Flex w="25px" h="25px" alignItems="center" justifyContent="center" border="3px solid #3E3932" bgColor="#FFF4BF" fontSize="17px" fontWeight="900">
                    {DIRECTION_META[selectedTask.direction].arrow}
                  </Flex>
                  <Text px="3px" bgColor="#E8E2D4" fontSize="7px" fontWeight="900" whiteSpace="nowrap">
                    {DIRECTION_META[selectedTask.direction].label}
                  </Text>
                </Flex>

                <Flex
                  as="button"
                  key={`${selectedTask.id}-${wrongGestureNonce}`}
                  data-todo-work-pad="true"
                  data-todo-required-direction={selectedTask.direction}
                  position="absolute"
                  left="27px"
                  right="27px"
                  top="27px"
                  bottom="27px"
                  direction="column"
                  alignItems="stretch"
                  justifyContent="space-between"
                  p="12px"
                  border="3px solid #5C554A"
                  bgColor={selectedTask.completed ? "#DCE5D0" : selectedTask.color}
                  backgroundImage="linear-gradient(rgba(89,81,69,0.18) 1px, transparent 1px)"
                  backgroundSize="100% 25px"
                  cursor={selectedTask.completed ? "default" : "grab"}
                  touchAction="none"
                  userSelect="none"
                  outline="none"
                  overflow="hidden"
                  boxShadow="5px 6px 0 rgba(77,68,57,0.24)"
                  animation={wrongGestureNonce > 0 && !selectedTask.completed ? `${wrongGesture} 300ms steps(4, end)` : undefined}
                  pointerEvents={selectedTask.completed ? "none" : "auto"}
                  onPointerDown={handleWorkPointerDown}
                  onPointerMove={handleWorkPointerMove}
                  onPointerUp={finishWorkSwipe}
                  onPointerCancel={cancelWorkSwipe}
                  onKeyDown={handleWorkKeyDown}
                >
                  <Box position="absolute" top="-1px" right="-1px" w="0" h="0" borderTop="22px solid #F5EEDC" borderLeft="22px solid transparent" />
                  <Flex alignItems="center" justifyContent="space-between" gap="5px">
                    <Flex alignItems="center" gap="5px">
                      <Flex w="22px" h="22px" alignItems="center" justifyContent="center" border="2px solid #5C554A" bgColor="rgba(255,255,255,0.38)">
                        {selectedTask.completed ? <FiCheck size={14} /> : taskIcon(selectedTask.kind, 13)}
                      </Flex>
                      <Text fontSize="10px" fontWeight="900" textDecoration={selectedTask.completed ? "line-through" : "none"}>{selectedTask.title}</Text>
                    </Flex>
                    <Text pr="12px" color={selectedTask.overdue ? "#A43F3B" : "#3F6F61"} fontSize="9px" fontWeight="900">{selectedTask.progress}/{selectedTask.effort}</Text>
                  </Flex>

                  <Box
                    key={`${selectedTask.id}-${selectedTask.progress}`}
                    flex="1"
                    minH="88px"
                    my="4px"
                    px="3px"
                    animation={`${workPulse} 150ms steps(2, end)`}
                  >
                    <HorizontalSwipeGuide
                      kind={selectedTask.kind}
                      progress={(selectedTask.progress / selectedTask.effort) * 100}
                    />
                  </Box>

                  <Flex justifyContent="center" gap="5px" mb="3px">
                    {Array.from({ length: selectedTask.effort }, (_, index) => (
                      <Flex
                        key={index}
                        w="13px"
                        h="13px"
                        alignItems="center"
                        justifyContent="center"
                        border="2px solid #5C554A"
                        bgColor={index < selectedTask.progress ? "#EEF2DE" : "rgba(98,88,73,0.08)"}
                      >
                        {index < selectedTask.progress ? <FiCheck size={8} /> : null}
                      </Flex>
                    ))}
                  </Flex>

                  <Flex alignItems="center" justifyContent="space-between" gap="7px" color="#62594E">
                    <Text fontSize="9px" fontWeight="900">沿著線左右來回・每次轉向都算</Text>
                    <Text fontSize="16px" fontWeight="900">{DIRECTION_META[selectedTask.direction].arrow}</Text>
                  </Flex>

                  {gesturePreview ? <GestureBrushPreview preview={gesturePreview} /> : null}

                  {selectedTask.completed ? (
                    <Flex position="absolute" inset="0" zIndex={20} alignItems="center" justifyContent="center" bgColor="rgba(235,243,220,0.48)">
                      <Box position="absolute" left="9%" right="9%" top="49%" h="7px" bgColor="#A93E3A" transformOrigin="left center" animation={`${strikeAcross} 360ms steps(6, end) both`} />
                      <Text px="10px" py="5px" border="5px solid #3F786A" bgColor="#EEF2DE" color="#315F52" fontSize="15px" fontWeight="900" animation={`${completedStamp} 380ms steps(5, end) both`}>✓ ITEM 完成</Text>
                    </Flex>
                  ) : null}
                </Flex>
              </Box>

              <Flex minH="36px" alignItems="center" justifyContent="center" px="9px" border="2px solid #AFA695" bgColor="#DCD5C7">
                <Text overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" fontSize="9px" fontWeight="900">{feedback}</Text>
              </Flex>
            </Flex>
          ) : (
            <Flex flex="1" direction="column" alignItems="center" justifyContent="center" gap="8px" color="#756E62">
              <FiCheckSquare size={34} />
              <Text fontSize="14px" fontWeight="900">待辦暫時清空</Text>
              <Text fontSize="10px" fontWeight="800">先喘口氣，下一張很快就來</Text>
            </Flex>
          )}
        </Flex>
      </Flex>

      {burst ? (
        <Flex key={burst.nonce} position="absolute" left="67%" top="48%" zIndex={70} direction="column" alignItems="center" gap="4px" px="16px" py="11px" border="4px solid #21332D" bgColor="#E8F1D9" color="#315C4E" boxShadow="7px 8px 0 rgba(12,20,22,0.55)" pointerEvents="none" animation={`${checkBurst} 1100ms steps(9, end) both`}>
          <FiCheck size={26} />
          <Text fontSize="12px" fontWeight="900">完成！+{burst.reward}</Text>
          <Text maxW="150px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" fontSize="8px" fontWeight="900">{burst.title}</Text>
        </Flex>
      ) : null}

      {phase === "intro" ? (
        <Flex position="absolute" inset="0" zIndex={80} alignItems="center" justifyContent="center" px="20px" bgColor="rgba(10,15,18,0.78)" backdropFilter="blur(4px)">
          <Flex w="100%" direction="column" gap="12px" p="19px" border="4px solid #1A252B" bgColor="#F5EEDC" color="#3D3932" boxShadow="9px 10px 0 rgba(7,12,14,0.56)" animation={`${panelIn} 240ms steps(5, end) both`}>
            <Box>
              <Text color="#917329" fontSize="9px" fontWeight="900" letterSpacing="0.13em">辦公遊戲方案 2</Text>
              <Text mt="3px" fontSize="22px" fontWeight="900">把今天的待辦一張張打勾</Text>
            </Box>
            <Text color="#70685D" fontSize="11px" fontWeight="800" lineHeight="1.6">
              待辦會持續進箱，也有自己的期限。每張便利貼都有不同密度的蛇形路徑；手指不用離開，沿著引導線順暢左右刷，每次轉向都會填一格。填滿後整張任務會被劃掉並移出清單。
            </Text>
            <Grid templateColumns="repeat(3, 1fr)" gap="7px">
              {[{ icon: <FiInbox />, label: "選便利貼" }, { icon: <FiMousePointer />, label: "左右來回刷" }, { icon: <FiCheck />, label: "整張劃掉" }].map((item) => (
                <Flex key={item.label} direction="column" alignItems="center" gap="5px" py="10px" border="2px solid #B7AD9A" bgColor="#E7DECB">
                  {item.icon}<Text fontSize="9px" fontWeight="900">{item.label}</Text>
                </Flex>
              ))}
            </Grid>
            <Flex as="button" h="47px" alignItems="center" justifyContent="center" border="3px solid #27473E" bgColor="#4F8A78" color="white" boxShadow="0 5px 0 #27473E" onClick={() => setPhase("playing")}>
              <Text fontSize="14px" fontWeight="900">打開今天的 Todo List</Text>
            </Flex>
            <Text as="button" color="#958A79" fontSize="10px" fontWeight="900" onClick={onSkip}>略過方案 2</Text>
          </Flex>
        </Flex>
      ) : null}

      {phase === "upgrade" ? (
        <Flex position="absolute" inset="0" zIndex={82} alignItems="center" justifyContent="center" px="20px" bgColor="rgba(10,15,18,0.8)" backdropFilter="blur(4px)">
          <Flex w="100%" direction="column" gap="11px" p="19px" border="4px solid #1A252B" bgColor="#F5EEDC" color="#3D3932" boxShadow="9px 10px 0 rgba(7,12,14,0.56)" animation={`${panelIn} 220ms steps(5, end) both`}>
            <Box>
              <Text color="#917329" fontSize="9px" fontWeight="900" letterSpacing="0.13em">工作流程升級</Text>
              <Text mt="3px" fontSize="21px" fontWeight="900">選一個方法，保留主動操作</Text>
            </Box>
            {upgradeChoices.map((upgrade) => {
              const copy = UPGRADE_COPY[upgrade];
              return (
                <Flex key={upgrade} as="button" minH="73px" alignItems="center" gap="12px" p="11px" border="3px solid #807768" bgColor="#E7DECB" textAlign="left" boxShadow="4px 4px 0 #A69C89" onClick={() => chooseUpgrade(upgrade)}>
                  <Flex w="43px" h="43px" flexShrink={0} alignItems="center" justifyContent="center" bgColor="#3E7063" color="white" fontSize="22px" fontWeight="900">{copy.symbol}</Flex>
                  <Box><Text fontSize="14px" fontWeight="900">{copy.title}</Text><Text mt="3px" color="#71685C" fontSize="10px" fontWeight="800">{copy.detail}</Text></Box>
                </Flex>
              );
            })}
          </Flex>
        </Flex>
      ) : null}

      {phase === "complete" ? (
        <Flex position="absolute" inset="0" zIndex={84} alignItems="center" justifyContent="center" px="21px" bgColor="rgba(10,15,18,0.82)" backdropFilter="blur(5px)">
          <Flex w="100%" direction="column" alignItems="center" gap="12px" p="22px" border="4px solid #23443A" bgColor="#EEF2DE" color="#35473F" textAlign="center" boxShadow="9px 10px 0 rgba(7,12,14,0.58)" animation={`${panelIn} 220ms steps(5, end) both`}>
            <Flex w="62px" h="62px" alignItems="center" justifyContent="center" border="4px solid #315D50" bgColor="#65A58F" color="white"><FiCheck size={31} /></Flex>
            <Text fontSize="24px" fontWeight="900">今天的重點待辦完成</Text>
            <Text color="#66776F" fontSize="11px" fontWeight="800" lineHeight="1.6">你親手完成 {completedCount} 張任務，累積 {score} 點效率。剩下的工作已經排進下一輪。</Text>
            <Flex as="button" w="100%" h="47px" alignItems="center" justifyContent="center" border="3px solid #27473E" bgColor="#4F8A78" color="white" boxShadow="0 5px 0 #27473E" onClick={onComplete}>
              <Text fontSize="13px" fontWeight="900">收起 Todo List，前往便利商店</Text>
            </Flex>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}
