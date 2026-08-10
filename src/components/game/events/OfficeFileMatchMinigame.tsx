"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import {
  FiCheck,
  FiCpu,
  FiFileText,
  FiFolder,
  FiLayers,
  FiMessageCircle,
  FiMousePointer,
  FiStar,
  FiTrendingUp,
  FiUnlock,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";

type FileGamePhase = "intro" | "playing" | "complete";
type FileCategory = "layout" | "ai" | "daily" | "social";

type DocumentItem = {
  id: number;
  category: FileCategory;
  title: string;
  subtitle: string;
  emoji: string;
  files: number;
};

type FolderContents = Record<FileCategory, DocumentItem[]>;
type FolderStats = Record<FileCategory, { bundles: number; files: number }>;

const TARGET_BUNDLES = 8;

const CATEGORY_META: Record<
  FileCategory,
  {
    label: string;
    desktopLabel: string;
    folderName: string;
    color: string;
    light: string;
    glow: string;
    icon: "layers" | "cpu" | "folder" | "social";
  }
> = {
  layout: {
    label: "版面企劃",
    desktopLabel: "Layout",
    folderName: "Layout Drafts",
    color: "#E98A5B",
    light: "#FFF0E8",
    glow: "rgba(233,138,91,0.44)",
    icon: "layers",
  },
  ai: {
    label: "AI 協作",
    desktopLabel: "AI Lab",
    folderName: "AI Integration",
    color: "#8B79C5",
    light: "#F0EBFF",
    glow: "rgba(139,121,197,0.46)",
    icon: "cpu",
  },
  daily: {
    label: "日常資料",
    desktopLabel: "Daily",
    folderName: "Daily Memo",
    color: "#6EA487",
    light: "#E9F5EC",
    glow: "rgba(110,164,135,0.44)",
    icon: "folder",
  },
  social: {
    label: "社群文件",
    desktopLabel: "Social",
    folderName: "Social Notes",
    color: "#5A98BD",
    light: "#E7F3FA",
    glow: "rgba(90,152,189,0.44)",
    icon: "social",
  },
};

const CATEGORIES = Object.keys(CATEGORY_META) as FileCategory[];

const DOCUMENT_TEMPLATES: Record<
  FileCategory,
  readonly { title: string; subtitle: string; emoji: string; files: number }[]
> = {
  layout: [
    { title: "Layout Draft", subtitle: "Poster v3", emoji: "🤣", files: 12 },
    { title: "Visual Direction", subtitle: "Moodboard", emoji: "🎨", files: 18 },
    { title: "Landing Sketch", subtitle: "Wireframe", emoji: "✏️", files: 24 },
    { title: "Banner Revision", subtitle: "Final-ish", emoji: "😵‍💫", files: 31 },
    { title: "Campaign Grid", subtitle: "Square set", emoji: "📐", files: 16 },
  ],
  ai: [
    { title: "AI Integration", subtitle: "Prompt test", emoji: "✨", files: 25 },
    { title: "Model Notes", subtitle: "Compare 04", emoji: "🤖", files: 42 },
    { title: "Generated Copy", subtitle: "Review me", emoji: "🪄", files: 28 },
    { title: "Auto Summary", subtitle: "Meeting 03", emoji: "⚡", files: 36 },
    { title: "Training Tags", subtitle: "Clean set", emoji: "🧠", files: 19 },
  ],
  daily: [
    { title: "Everyday Stuff", subtitle: "Today", emoji: "🤩", files: 48 },
    { title: "Daily Memo", subtitle: "2026-Q3", emoji: "☕", files: 25 },
    { title: "Meeting Notes", subtitle: "Monday", emoji: "📝", files: 33 },
    { title: "Tiny Reminders", subtitle: "Don't lose", emoji: "😅", files: 14 },
    { title: "Office Receipt", subtitle: "August", emoji: "🧾", files: 21 },
  ],
  social: [
    { title: "Social Calendar", subtitle: "Week 32", emoji: "📅", files: 35 },
    { title: "Comment Notes", subtitle: "Hot replies", emoji: "💬", files: 44 },
    { title: "Post Assets", subtitle: "Ready-ish", emoji: "🥳", files: 55 },
    { title: "Trend Watch", subtitle: "Save later", emoji: "👀", files: 29 },
    { title: "Story Draft", subtitle: "9:16", emoji: "📱", files: 17 },
  ],
};

const DOCUMENT_QUEUE: readonly FileCategory[] = [
  "daily", "layout", "ai", "social",
  "layout", "daily", "ai", "layout",
  "social", "daily", "ai", "social",
  "daily", "layout", "social", "ai",
  "layout", "layout", "daily", "daily",
  "ai", "ai", "social", "social",
] as const;

const EMPTY_CONTENTS: FolderContents = { layout: [], ai: [], daily: [], social: [] };
const EMPTY_STATS: FolderStats = {
  layout: { bundles: 0, files: 0 },
  ai: { bundles: 0, files: 0 },
  daily: { bundles: 0, files: 0 },
  social: { bundles: 0, files: 0 },
};

const panelIn = keyframes`
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const documentLift = keyframes`
  0% { opacity: 0; transform: translateY(16px) rotate(-4deg) scale(0.9); }
  70% { opacity: 1; transform: translateY(-4px) rotate(2deg) scale(1.04); }
  100% { opacity: 1; transform: translateY(0) rotate(0) scale(1); }
`;

const paperInsert = keyframes`
  0% { opacity: 0; transform: translateY(-52px) scale(1.15) rotate(-8deg); }
  68% { opacity: 1; transform: translateY(5px) scale(0.96) rotate(3deg); }
  100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); }
`;

const folderShake = keyframes`
  0%, 100% { transform: translateX(0); }
  22% { transform: translateX(-8px) rotate(-1deg); }
  48% { transform: translateX(7px) rotate(1deg); }
  72% { transform: translateX(-4px); }
`;

const cleanCompress = keyframes`
  0% { opacity: 1; transform: translateY(0) scale(1); }
  60% { opacity: 1; transform: translateY(35px) scale(0.84); }
  100% { opacity: 0; transform: translateY(82px) scale(0.25); }
`;

const sparklePulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 3px rgba(59,112,234,0.25), 0 0 20px rgba(67,126,255,0.62), inset 0 0 14px rgba(133,178,255,0.55); transform: scale(1); }
  50% { box-shadow: 0 0 0 5px rgba(59,112,234,0.18), 0 0 34px rgba(67,126,255,0.92), inset 0 0 20px rgba(163,198,255,0.72); transform: scale(1.08); }
`;

const folderLevelUp = keyframes`
  0% { opacity: 0; transform: translate(-50%, -50%) scale(1.7) rotate(-8deg); }
  45%, 78% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(-3deg); }
  100% { opacity: 0; transform: translate(-50%, -78%) scale(0.92) rotate(0); }
`;

const unlockPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 rgba(233,191,79,0); }
  50% { box-shadow: 0 0 0 5px rgba(233,191,79,0.28); }
`;

function CategoryIcon({ category, size = 16 }: { category: FileCategory; size?: number }) {
  const icon = CATEGORY_META[category].icon;
  if (icon === "layers") return <FiLayers size={size} />;
  if (icon === "cpu") return <FiCpu size={size} />;
  if (icon === "social") return <FiMessageCircle size={size} />;
  return <FiFolder size={size} />;
}

function createDocument(serial: number): DocumentItem {
  const category = DOCUMENT_QUEUE[serial % DOCUMENT_QUEUE.length];
  const templates = DOCUMENT_TEMPLATES[category];
  const template = templates[Math.floor(serial / DOCUMENT_QUEUE.length + serial) % templates.length];
  return { id: serial, category, ...template };
}

function DocumentSheet({
  document,
  compact = false,
  labelsUnlocked = false,
  suggestionsUnlocked = false,
}: {
  document: DocumentItem;
  compact?: boolean;
  labelsUnlocked?: boolean;
  suggestionsUnlocked?: boolean;
}) {
  const meta = CATEGORY_META[document.category];
  return (
    <Flex
      position="relative"
      w={compact ? "86px" : "82px"}
      h={compact ? "110px" : "105px"}
      flexShrink={0}
      direction="column"
      px={compact ? "8px" : "7px"}
      pt={compact ? "13px" : "10px"}
      pb="7px"
      border={`2px solid ${labelsUnlocked ? `${meta.color}88` : "#E0E1E5"}`}
      borderRadius="12px"
      bgColor={labelsUnlocked ? meta.light : "rgba(252,253,255,0.96)"}
      color="#50515A"
      boxShadow="0 5px 12px rgba(33,34,44,0.14)"
      overflow="hidden"
    >
      {labelsUnlocked ? <Box position="absolute" left="0" top="0" bottom="0" w="4px" bgColor={meta.color} /> : null}
      <Text fontFamily="monospace" fontSize={compact ? "8px" : "7px"} fontWeight="800" lineHeight="1.15" lineClamp={1}>{document.title}</Text>
      <Text mt="2px" color="#999AA4" fontFamily="monospace" fontSize="6px" fontWeight="700">{document.subtitle}</Text>
      <Flex mt="8px" direction="column" gap="4px">
        {[93, 78, 87].map((width, index) => <Box key={index} w={`${width}%`} borderTop="4px solid #DDE3EE" borderRadius="4px" />)}
      </Flex>
      <Text mt="5px" fontSize={compact ? "17px" : "15px"} lineHeight="1">{document.emoji}</Text>
      <Text mt="auto" alignSelf="flex-end" color="#B5B6C1" fontSize={compact ? "20px" : "17px"} fontWeight="800" lineHeight="1">{document.files}</Text>
      {suggestionsUnlocked ? (
        <Flex position="absolute" left="6px" bottom="6px" alignItems="center" gap="2px" color={meta.color}>
          <CategoryIcon category={document.category} size={8} />
          <Text fontSize="6px" fontWeight="900">{meta.desktopLabel}</Text>
        </Flex>
      ) : null}
    </Flex>
  );
}

function DesktopFolder({
  category,
  active,
  contents,
  stats,
  onSelect,
}: {
  category: FileCategory;
  active: boolean;
  contents: number;
  stats: { bundles: number; files: number };
  onSelect: () => void;
}) {
  const meta = CATEGORY_META[category];
  const level = Math.min(5, Math.floor(stats.bundles / 2) + 1);
  return (
    <Flex as="button" minW="0" direction="column" alignItems="center" gap="4px" color="white" onClick={onSelect}>
      <Flex
        position="relative"
        w="58px"
        h="43px"
        alignItems="center"
        justifyContent="center"
        border={`3px solid ${active ? "#F5E087" : "#805C3C"}`}
        borderRadius="4px 7px 6px 6px"
        bg="linear-gradient(180deg, #F2C56A 0%, #C6873E 100%)"
        color="#6B472D"
        boxShadow={active ? `0 0 0 3px ${meta.glow}, 0 4px 0 #70482D` : "0 4px 0 #70482D"}
        transform={active ? "translateY(-4px)" : "none"}
        transition="transform 140ms ease, box-shadow 140ms ease"
        _before={{ content: '""', position: "absolute", left: "5px", top: "-9px", w: "24px", h: "10px", border: `3px solid ${active ? "#F5E087" : "#805C3C"}`, borderBottom: "0", borderRadius: "5px 5px 0 0", bgColor: "#E6B85E" }}
      >
        <CategoryIcon category={category} size={17} />
        {contents > 0 ? (
          <Flex position="absolute" right="-7px" top="-9px" w="19px" h="19px" alignItems="center" justifyContent="center" border="2px solid #3B3740" borderRadius="999px" bgColor={meta.color} color="white"><Text fontSize="8px" fontWeight="900">{contents}</Text></Flex>
        ) : null}
        <Flex position="absolute" left="50%" bottom="-9px" h="14px" alignItems="center" px="4px" border="1px solid #6D4D35" borderRadius="3px" bgColor="#FFF1C5" color="#70523A" transform="translateX(-50%)"><Text fontSize="6px" fontWeight="900">LV.{level}</Text></Flex>
      </Flex>
      <Text maxW="72px" color={active ? "#FFF2A5" : "#D6D9DF"} fontFamily="monospace" fontSize="7px" fontWeight="900" lineClamp={1}>{meta.desktopLabel}</Text>
    </Flex>
  );
}

export function OfficeFileMatchMinigame({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [phase, setPhase] = useState<FileGamePhase>("intro");
  const [activeCategory, setActiveCategory] = useState<FileCategory>("daily");
  const [contents, setContents] = useState<FolderContents>(EMPTY_CONTENTS);
  const [folderStats, setFolderStats] = useState<FolderStats>(EMPTY_STATS);
  const [inbox, setInbox] = useState<DocumentItem[]>(() => [0, 1, 2, 3].map(createDocument));
  const [bundlesCompleted, setBundlesCompleted] = useState(0);
  const [filesArchived, setFilesArchived] = useState(0);
  const [organizeScore, setOrganizeScore] = useState(0);
  const [isCleaning, setIsCleaning] = useState(false);
  const [wrongNonce, setWrongNonce] = useState(0);
  const [levelUp, setLevelUp] = useState<{ category: FileCategory; level: number; nonce: number } | null>(null);
  const [notice, setNotice] = useState<{ nonce: number; text: string; unlock: boolean } | null>(null);
  const nextDocumentRef = useRef(4);
  const bundlesRef = useRef(0);
  const statsRef = useRef<FolderStats>({ ...EMPTY_STATS });
  const timersRef = useRef<number[]>([]);
  const noticeNonceRef = useRef(0);

  const labelsUnlocked = bundlesCompleted >= 2;
  const suggestionsUnlocked = bundlesCompleted >= 4;
  const autoCleanUnlocked = bundlesCompleted >= 6;
  const activeMeta = CATEGORY_META[activeCategory];
  const activeContents = contents[activeCategory];
  const activeStats = folderStats[activeCategory];
  const activeLevel = Math.min(5, Math.floor(activeStats.bundles / 2) + 1);
  const canClean = activeContents.length === 3;

  useEffect(() => {
    return () => timersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const showNotice = useCallback((text: string, unlock = false) => {
    noticeNonceRef.current += 1;
    setNotice({ nonce: noticeNonceRef.current, text, unlock });
  }, []);

  const cleanFolder = useCallback(
    (category: FileCategory) => {
      const documents = contents[category];
      if (isCleaning || documents.length !== 3) return;
      setIsCleaning(true);
      setActiveCategory(category);

      const timer = window.setTimeout(() => {
        const fileCount = documents.reduce((total, item) => total + item.files, 0);
        const previousStats = statsRef.current[category];
        const previousLevel = Math.min(5, Math.floor(previousStats.bundles / 2) + 1);
        const nextCategoryStats = {
          bundles: previousStats.bundles + 1,
          files: previousStats.files + fileCount,
        };
        statsRef.current = { ...statsRef.current, [category]: nextCategoryStats };
        setFolderStats(statsRef.current);
        setContents((current) => ({ ...current, [category]: [] }));
        setFilesArchived((current) => current + fileCount);
        setOrganizeScore((current) => current + Math.round(fileCount * (1 + previousLevel * 0.35)));
        setIsCleaning(false);

        const nextLevel = Math.min(5, Math.floor(nextCategoryStats.bundles / 2) + 1);
        if (nextLevel > previousLevel) {
          setLevelUp({ category, level: nextLevel, nonce: Date.now() });
          const hideLevelTimer = window.setTimeout(() => setLevelUp(null), 1250);
          timersRef.current.push(hideLevelTimer);
        }

        bundlesRef.current += 1;
        const nextBundles = bundlesRef.current;
        setBundlesCompleted(nextBundles);
        if (nextBundles === 2) showNotice("整理能力解鎖：文件顯示彩色分類標籤", true);
        else if (nextBundles === 4) showNotice("整理能力解鎖：文件顯示建議資料夾", true);
        else if (nextBundles === 6) showNotice("整理能力解鎖：第三份文件進入後自動壓縮", true);
        else showNotice(`${CATEGORY_META[category].folderName} 完成整理・${fileCount} Files`);

        if (nextBundles >= TARGET_BUNDLES) {
          const completeTimer = window.setTimeout(() => setPhase("complete"), 850);
          timersRef.current.push(completeTimer);
        }
      }, 620);
      timersRef.current.push(timer);
    },
    [contents, isCleaning, showNotice],
  );

  const fileDocument = useCallback(
    (document: DocumentItem) => {
      if (phase !== "playing" || isCleaning) return;
      const currentContents = contents[activeCategory];
      if (currentContents.length >= 3) {
        showNotice("資料夾已經裝滿，先按右下角星光整理");
        return;
      }
      if (document.category !== activeCategory) {
        setWrongNonce((current) => current + 1);
        showNotice(`「${document.title}」不屬於 ${activeMeta.folderName}`);
        return;
      }

      const nextContents = [...currentContents, document];
      setContents((current) => ({ ...current, [activeCategory]: nextContents }));
      nextDocumentRef.current += 1;
      const replacement = createDocument(nextDocumentRef.current);
      setInbox((current) => current.map((item) => (item.id === document.id ? replacement : item)));
      showNotice(`${document.title} 收進 ${activeMeta.folderName}`);

    },
    [activeCategory, activeMeta.folderName, contents, isCleaning, phase, showNotice],
  );

  useEffect(() => {
    if (
      phase !== "playing" ||
      !autoCleanUnlocked ||
      isCleaning ||
      contents[activeCategory].length !== 3
    ) {
      return;
    }
    const timer = window.setTimeout(() => cleanFolder(activeCategory), 520);
    timersRef.current.push(timer);
    return () => window.clearTimeout(timer);
  }, [activeCategory, autoCleanUnlocked, cleanFolder, contents, isCleaning, phase]);

  const totalFolderFiles = useMemo(
    () => Object.values(folderStats).reduce((total, stats) => total + stats.files, 0),
    [folderStats],
  );

  return (
    <Flex position="absolute" inset="0" direction="column" overflow="hidden" bgColor="#131523" color="white" data-office-file-match={phase}>
      <Box position="absolute" inset="0" bg="radial-gradient(circle at 50% 38%, rgba(74,81,120,0.26), transparent 40%), linear-gradient(180deg, #191B2A 0%, #10121D 100%)" />
      <Box position="absolute" inset="0" opacity={0.18} bgImage="repeating-linear-gradient(0deg, transparent 0 3px, rgba(121,149,190,0.2) 3px 4px)" pointerEvents="none" />

      <Flex position="relative" zIndex={4} h="66px" flexShrink={0} alignItems="center" justifyContent="space-between" gap="8px" px="13px" borderBottom="3px solid #31354B" bgColor="rgba(18,20,32,0.94)">
        <Flex minW="0" alignItems="center" gap="9px">
          <Flex w="38px" h="38px" flexShrink={0} alignItems="center" justifyContent="center" border="2px solid #596181" borderRadius="8px" bgColor="#25283C" color="#9DB8FF" boxShadow="inset 0 0 12px rgba(86,123,230,0.25)"><FiFolder size={22} /></Flex>
          <Flex minW="0" direction="column">
            <Text color="#88A9FF" fontSize="8px" fontWeight="900" letterSpacing="0.14em">SMART FOLDER DESKTOP</Text>
            <Text fontSize="16px" fontWeight="900" lineHeight="1.1">文件分類・資料夾養成</Text>
            <Text mt="2px" color="#83899D" fontSize="8px" fontWeight="800">三份同類文件 → 星光整理 → 資料夾升級</Text>
          </Flex>
        </Flex>
        <Flex gap="6px" flexShrink={0}>
          <Flex minW="48px" h="40px" direction="column" alignItems="center" justifyContent="center" border="2px solid #3B4160" borderRadius="7px" bgColor="#252941" color="#A9C0FF"><Text fontSize="7px" fontWeight="900">資料包</Text><Text fontSize="15px" fontWeight="900" lineHeight="1">{bundlesCompleted}/{TARGET_BUNDLES}</Text></Flex>
          <Flex minW="50px" h="40px" direction="column" alignItems="center" justifyContent="center" border="2px solid #3B4160" borderRadius="7px" bgColor="#ECEFFF" color="#343A53"><Text fontSize="7px" fontWeight="900">整理分</Text><Text fontSize="13px" fontWeight="900" lineHeight="1">{organizeScore}</Text></Flex>
        </Flex>
      </Flex>

      <Flex position="relative" zIndex={3} h="91px" flexShrink={0} direction="column" px="10px" pt="8px" pb="7px" borderBottom="2px solid #34374B" bgColor="rgba(24,26,40,0.9)">
        <Flex h="18px" alignItems="center" justifyContent="space-between" px="3px"><Text color="#959BB0" fontSize="8px" fontWeight="900">DESKTOP FOLDERS・先選一個分類</Text><Text color="#70768D" fontSize="7px" fontWeight="800">已整理 {totalFolderFiles} Files</Text></Flex>
        <Grid mt="7px" templateColumns="repeat(4, 1fr)" gap="5px">
          {CATEGORIES.map((category) => <DesktopFolder key={category} category={category} active={activeCategory === category} contents={contents[category].length} stats={folderStats[category]} onSelect={() => setActiveCategory(category)} />)}
        </Grid>
      </Flex>

      <Flex position="relative" zIndex={2} flex="1" minH="0" direction="column" alignItems="center" justifyContent="center" px="12px" pt="12px" pb="8px">
        <Flex mb="7px" w="100%" alignItems="center" justifyContent="space-between" px="7px">
          <Flex alignItems="center" gap="5px" color={activeMeta.color}><CategoryIcon category={activeCategory} size={13} /><Text fontSize="9px" fontWeight="900">目前開啟：{activeMeta.folderName}</Text></Flex>
          <Text color="#83899A" fontSize="8px" fontWeight="800">LV.{activeLevel}・下一級 {activeStats.bundles % 2}/2</Text>
        </Flex>

        <Box w="100%" maxW="345px" h="255px" position="relative" animation={wrongNonce > 0 ? `${folderShake} 360ms ease both` : undefined}>
          <Flex position="absolute" left="50%" top="4px" w="275px" h="147px" transform="translateX(-50%)" alignItems="flex-end" justifyContent="center">
            {activeContents.map((document, index) => (
              <Box key={document.id} position="absolute" zIndex={3 + index} left={`${index === 0 ? 5 : index === 1 ? 50 : 95}px`} bottom={`${index === 1 ? 3 : 0}px`} transform={`rotate(${index === 0 ? -6 : index === 1 ? 0 : 7}deg)`} animation={isCleaning ? `${cleanCompress} 620ms ease-in both` : `${paperInsert} 270ms ease both`}>
                <DocumentSheet document={document} compact labelsUnlocked={labelsUnlocked} suggestionsUnlocked={suggestionsUnlocked} />
              </Box>
            ))}
            {activeContents.length === 0 ? (
              <Flex position="absolute" bottom="25px" direction="column" alignItems="center" color="#777D91"><FiFileText size={28} /><Text mt="5px" fontSize="8px" fontWeight="900">從下方選擇 {activeMeta.label} 文件</Text></Flex>
            ) : null}
          </Flex>

          <Box position="absolute" zIndex={8} left="50%" bottom="2px" w="314px" h="174px" transform="translateX(-50%)" border="4px solid #090B13" borderRadius="20px 22px 26px 26px" bg="linear-gradient(155deg, #202230 0%, #171923 62%, #11131E 100%)" boxShadow="0 9px 0 #080A11, inset 0 0 0 3px rgba(82,88,119,0.13), 0 18px 28px rgba(0,0,0,0.38)" _before={{ content: '""', position: "absolute", left: "0", top: "-25px", w: "135px", h: "35px", border: "4px solid #090B13", borderBottom: "0", borderRadius: "20px 20px 0 0", bg: "linear-gradient(180deg, #252735 0%, #202230 100%)" }}>
            <Flex position="absolute" left="21px" top="23px" direction="column">
              <Text color="#F2F2F6" fontFamily="monospace" fontSize="15px" fontWeight="900" letterSpacing="0.02em">{activeMeta.folderName}</Text>
              <Text mt="7px" color="#77798A" fontFamily="monospace" fontSize="11px" fontWeight="700">2026-Q3</Text>
            </Flex>
            <Flex position="absolute" left="21px" bottom="20px" alignItems="baseline" gap="7px">
              <Text color="white" fontFamily="monospace" fontSize="31px" fontWeight="900" lineHeight="1">{activeStats.files + activeContents.reduce((total, item) => total + item.files, 0)}</Text>
              <Text color="#77798A" fontFamily="monospace" fontSize="9px" fontWeight="800">Files</Text>
            </Flex>
            <Flex
              as="button"
              position="absolute"
              right="20px"
              bottom="17px"
              w="58px"
              h="58px"
              alignItems="center"
              justifyContent="center"
              border={`3px solid ${canClean ? "#426BCB" : "#333748"}`}
              borderRadius="999px"
              bg={canClean ? "radial-gradient(circle, #3659A6 0%, #18305E 70%)" : "#242633"}
              color={canClean ? "white" : "#606475"}
              cursor={canClean ? "pointer" : "default"}
              animation={canClean ? `${sparklePulse} 1300ms ease-in-out infinite` : undefined}
              onClick={() => cleanFolder(activeCategory)}
              aria-label={canClean ? "整理三份文件" : `還需要 ${3 - activeContents.length} 份文件`}
            >
              <HiSparkles size={25} />
            </Flex>
            <Flex position="absolute" right="14px" top="19px" h="21px" alignItems="center" px="7px" border="1px solid #34384B" borderRadius="999px" bgColor="#252837" color={canClean ? "#9AB6FF" : "#72778A"}><Text fontSize="7px" fontWeight="900">{activeContents.length}/3 READY</Text></Flex>
          </Box>

          {levelUp ? (
            <Flex key={levelUp.nonce} position="absolute" zIndex={20} left="50%" top="48%" alignItems="center" gap="6px" px="14px" py="9px" border="3px solid #D5AC4F" borderRadius="9px" bgColor="#FFF0B2" color="#785B20" boxShadow="0 7px 18px rgba(0,0,0,0.35)" animation={`${folderLevelUp} 1250ms ease both`}><FiTrendingUp size={16} /><Text fontSize="11px" fontWeight="900">{CATEGORY_META[levelUp.category].desktopLabel} 升到 LV.{levelUp.level}</Text></Flex>
          ) : null}
        </Box>

        <Flex mt="3px" minH="27px" alignItems="center" justifyContent="center" gap="6px" color={canClean ? "#A9BFFF" : "#858A9C"}>
          {canClean ? <HiSparkles size={12} /> : <FiMousePointer size={12} />}
          <Text fontSize="8px" fontWeight="900">{canClean ? (autoCleanUnlocked ? "智慧整理已啟用，文件正在自動壓縮" : "三份文件已到齊・按藍色星光整理") : `再收入 ${3 - activeContents.length} 份 ${activeMeta.label} 文件`}</Text>
        </Flex>
      </Flex>

      <Flex position="relative" zIndex={4} h="177px" flexShrink={0} direction="column" px="9px" pt="7px" pb="9px" borderTop="3px solid #34374B" bgColor="rgba(20,22,34,0.96)">
        <Flex h="22px" alignItems="center" justifyContent="space-between" px="3px"><Flex alignItems="center" gap="5px"><FiFileText size={12} /><Text color="#C4C8D5" fontSize="8px" fontWeight="900">INBOX・點文件收入目前資料夾</Text></Flex><Text color="#73798E" fontSize="7px" fontWeight="800">{suggestionsUnlocked ? "建議分類已顯示" : labelsUnlocked ? "彩色標籤已顯示" : "先讀標題判斷分類"}</Text></Flex>
        <Grid mt="5px" templateColumns="repeat(4, minmax(0, 1fr))" gap="5px" flex="1" alignItems="center">
          {inbox.map((document, index) => {
            const meta = CATEGORY_META[document.category];
            const isRecommended = document.category === activeCategory;
            return (
              <Flex key={document.id} as="button" minW="0" justifyContent="center" opacity={isRecommended || !suggestionsUnlocked ? 1 : 0.66} transform={`rotate(${index % 2 === 0 ? -2 : 2}deg)`} transition="transform 120ms ease" _hover={{ transform: "translateY(-5px) rotate(0deg)" }} animation={`${documentLift} 240ms ease both`} filter={suggestionsUnlocked && isRecommended ? `drop-shadow(0 0 7px ${meta.glow})` : undefined} onClick={() => fileDocument(document)}>
                <DocumentSheet document={document} labelsUnlocked={labelsUnlocked} suggestionsUnlocked={suggestionsUnlocked} />
              </Flex>
            );
          })}
        </Grid>
      </Flex>

      {notice ? (
        <Flex key={notice.nonce} position="absolute" zIndex={90} left="50%" bottom="181px" minH="34px" maxW="324px" alignItems="center" gap="6px" px="12px" border={`2px solid ${notice.unlock ? "#D2A842" : "#4A5271"}`} borderRadius="8px" bgColor={notice.unlock ? "#FFF0AD" : "#282C40"} color={notice.unlock ? "#77591B" : "#D9DDEC"} boxShadow="0 7px 18px rgba(0,0,0,0.34)" transform="translateX(-50%)" animation={notice.unlock ? `${unlockPulse} 1100ms ease-in-out infinite` : `${panelIn} 180ms ease both`} pointerEvents="none">
          {notice.unlock ? <FiUnlock size={15} /> : <FiFolder size={14} />}
          <Text fontSize="9px" fontWeight="900">{notice.text}</Text>
        </Flex>
      ) : null}

      {phase === "intro" ? (
        <Flex position="absolute" inset="0" zIndex={120} alignItems="center" justifyContent="center" px="20px" bgColor="rgba(8,10,17,0.86)" backdropFilter="blur(5px)">
          <Flex w="100%" direction="column" alignItems="center" p="20px" border="4px solid #353B58" borderRadius="14px" bgColor="#F7F6F2" color="#383B48" textAlign="center" boxShadow="8px 9px 0 rgba(0,0,0,0.48)" animation={`${panelIn} 260ms ease both`}>
            <Box position="relative" w="93px" h="77px">
              <Flex position="absolute" left="20px" top="0" w="53px" h="62px" border="2px solid #D9DCE6" borderRadius="8px" bgColor="white" transform="rotate(4deg)" />
              <Flex position="absolute" left="7px" bottom="0" w="82px" h="54px" alignItems="center" justifyContent="center" border="4px solid #11131E" borderRadius="11px" bgColor="#202230" color="#80A7FF" boxShadow="0 5px 0 #0B0D14"><HiSparkles size={25} /></Flex>
            </Box>
            <Text mt="14px" color="#6476A8" fontSize="9px" fontWeight="900" letterSpacing="0.16em">辦公遊戲方案 5・重新設計</Text>
            <Text mt="4px" fontSize="24px" fontWeight="900">智慧資料夾養成</Text>
            <Text mt="9px" color="#6D6F79" fontSize="11px" fontWeight="800" lineHeight="1.65">先選桌面上的分類資料夾，再把下方文件收入其中。三份同類文件會從資料夾上方露出；右下藍色星光亮起後，按一下把它們壓縮成乾淨資料包。</Text>
            <Grid mt="13px" w="100%" templateColumns="repeat(3, 1fr)" gap="7px">
              {[
                { icon: <FiFolder size={19} />, label: "選資料夾" },
                { icon: <FiFileText size={19} />, label: "收入三文件" },
                { icon: <HiSparkles size={19} />, label: "星光整理" },
              ].map((item) => <Flex key={item.label} h="62px" direction="column" alignItems="center" justifyContent="center" gap="5px" border="2px dashed #AEB5CC" borderRadius="8px" bgColor="#ECEEF5" color="#59627F">{item.icon}<Text fontSize="8px" fontWeight="900">{item.label}</Text></Flex>)}
            </Grid>
            <Flex as="button" mt="16px" w="100%" h="47px" alignItems="center" justifyContent="center" gap="8px" border="3px solid #253B73" borderRadius="8px" bgColor="#456BC2" color="white" boxShadow="0 5px 0 #253B73" onClick={() => setPhase("playing")}><HiSparkles size={17} /><Text fontSize="13px" fontWeight="900">開啟桌面資料夾</Text></Flex>
            <Text as="button" mt="10px" color="#90929A" fontSize="10px" fontWeight="800" onClick={onSkip}>略過工作小遊戲</Text>
          </Flex>
        </Flex>
      ) : null}

      {phase === "complete" ? (
        <Flex position="absolute" inset="0" zIndex={130} alignItems="center" justifyContent="center" px="20px" bgColor="rgba(7,9,15,0.87)" backdropFilter="blur(5px)">
          <Flex w="100%" direction="column" alignItems="center" p="22px" border="4px solid #354368" borderRadius="14px" bgColor="#F4F5F8" color="#373C4D" textAlign="center" boxShadow="8px 9px 0 rgba(0,0,0,0.52)" animation={`${panelIn} 260ms ease both`}>
            <Flex w="70px" h="70px" alignItems="center" justifyContent="center" border="4px solid #294B8A" borderRadius="999px" bg="radial-gradient(circle, #5684E2 0%, #25467F 74%)" color="white" boxShadow="0 0 24px rgba(73,125,226,0.62), 0 5px 0 #1C345F"><HiSparkles size={34} /></Flex>
            <Text mt="14px" color="#6476A8" fontSize="9px" fontWeight="900" letterSpacing="0.14em">DESKTOP CLEAN</Text>
            <Text mt="3px" fontSize="24px" fontWeight="900">文件都整理乾淨了</Text>
            <Text mt="8px" color="#707584" fontSize="11px" fontWeight="800" lineHeight="1.6">你將 {filesArchived} 份檔案壓縮成 {bundlesCompleted} 個資料包，得到 {organizeScore} 點整理分。</Text>
            <Grid mt="14px" w="100%" templateColumns="repeat(4, 1fr)" gap="6px">
              {CATEGORIES.map((category) => {
                const meta = CATEGORY_META[category];
                const stats = folderStats[category];
                return <Flex key={category} h="71px" direction="column" alignItems="center" justifyContent="center" gap="3px" border={`2px solid ${meta.color}77`} borderRadius="9px" bgColor={meta.light} color={meta.color}><CategoryIcon category={category} size={18} /><Text fontSize="7px" fontWeight="900">{meta.desktopLabel}</Text><Text color="#444956" fontSize="12px" fontWeight="900">{stats.files}</Text><Text color="#9699A3" fontSize="6px" fontWeight="800">Files</Text></Flex>;
              })}
            </Grid>
            <Flex mt="13px" alignItems="center" gap="6px" color="#52699E"><FiStar size={15} /><Text fontSize="10px" fontWeight="900">彩色標籤、分類建議與智慧整理皆已解鎖</Text></Flex>
            <Flex as="button" mt="18px" w="100%" h="48px" alignItems="center" justifyContent="center" gap="8px" border="3px solid #253B73" borderRadius="8px" bgColor="#456BC2" color="white" boxShadow="0 5px 0 #253B73" onClick={onComplete}><FiCheck size={18} /><Text fontSize="13px" fontWeight="900">關閉桌面，前往便利商店</Text></Flex>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}
