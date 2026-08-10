"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import {
  FiArchive,
  FiBarChart2,
  FiCheck,
  FiClipboard,
  FiFileText,
  FiFolder,
  FiMail,
  FiMousePointer,
  FiPackage,
  FiTag,
  FiTruck,
} from "react-icons/fi";

type PackingPhase = "intro" | "playing" | "complete";
type PackingItemKind = "mail" | "slides" | "folder" | "report" | "receipt" | "badge";

type PackingOrder = {
  id: string;
  code: string;
  title: string;
  destination: string;
  items: readonly PackingItemKind[];
};

type PackingBoxState = {
  slotId: number;
  order: PackingOrder;
  packed: PackingItemKind[];
  sealed: boolean;
};

type DragState = {
  kind: PackingItemKind;
  pointerId: number;
  startX: number;
  startY: number;
  clientX: number;
  clientY: number;
};

const TARGET_SHIPMENTS = 5;

const ITEM_META: Record<
  PackingItemKind,
  { label: string; shortLabel: string; color: string; dark: string; paper: string }
> = {
  mail: {
    label: "回覆信件",
    shortLabel: "信件",
    color: "#E96E62",
    dark: "#8E413B",
    paper: "#FFE5D4",
  },
  slides: {
    label: "提案簡報",
    shortLabel: "簡報",
    color: "#EFAE45",
    dark: "#8E5B27",
    paper: "#FFF0B9",
  },
  folder: {
    label: "資料夾",
    shortLabel: "資料夾",
    color: "#70AD75",
    dark: "#426C47",
    paper: "#DFF3C8",
  },
  report: {
    label: "工作週報",
    shortLabel: "週報",
    color: "#55A7C8",
    dark: "#356777",
    paper: "#D7F1F2",
  },
  receipt: {
    label: "核銷單據",
    shortLabel: "單據",
    color: "#E0C246",
    dark: "#7D6A26",
    paper: "#FFF7C7",
  },
  badge: {
    label: "訪客證",
    shortLabel: "訪客證",
    color: "#9B78C6",
    dark: "#584575",
    paper: "#EEE0F7",
  },
};

const ITEM_KINDS = Object.keys(ITEM_META) as PackingItemKind[];

const PACKING_ORDERS: readonly PackingOrder[] = [
  {
    id: "proposal",
    code: "401",
    title: "提案寄送",
    destination: "廊橋設計",
    items: ["slides", "mail", "report"],
  },
  {
    id: "meeting",
    code: "315",
    title: "會議資料包",
    destination: "三樓會議室",
    items: ["slides", "badge", "report"],
  },
  {
    id: "archive",
    code: "208",
    title: "專案歸檔",
    destination: "行政組",
    items: ["folder", "receipt", "report"],
  },
  {
    id: "client",
    code: "522",
    title: "客戶回覆包",
    destination: "島嶼食品",
    items: ["mail", "folder", "slides"],
  },
  {
    id: "monthly",
    code: "609",
    title: "月底結案",
    destination: "財務組",
    items: ["receipt", "folder", "report", "mail"],
  },
  {
    id: "visitor",
    code: "711",
    title: "訪客報到包",
    destination: "一樓櫃台",
    items: ["badge", "mail", "slides"],
  },
  {
    id: "handoff",
    code: "836",
    title: "跨組交接",
    destination: "企劃二組",
    items: ["folder", "report", "badge"],
  },
] as const;

const boardIn = keyframes`
  from { opacity: 0; transform: translateY(18px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const orderArrive = keyframes`
  0% { opacity: 0; transform: translateY(-24px) rotate(4deg) scale(0.88); }
  72% { opacity: 1; transform: translateY(4px) rotate(-1deg) scale(1.03); }
  100% { opacity: 1; transform: translateY(0) rotate(0) scale(1); }
`;

const itemDrop = keyframes`
  0% { opacity: 0; transform: translateY(-32px) rotate(-9deg) scale(1.2); }
  62% { opacity: 1; transform: translateY(4px) rotate(3deg) scale(0.93); }
  100% { opacity: 1; transform: translateY(0) rotate(0) scale(1); }
`;

const boxSeal = keyframes`
  0% { transform: perspective(220px) rotateX(0deg); }
  52% { transform: perspective(220px) rotateX(-76deg); }
  100% { transform: perspective(220px) rotateX(-88deg); }
`;

const boxShip = keyframes`
  0%, 46% { opacity: 1; transform: translateX(0) scale(1); }
  100% { opacity: 0; transform: translateX(86px) scale(0.78); }
`;

const wrongBox = keyframes`
  0%, 100% { transform: translateX(0); }
  24% { transform: translateX(-6px) rotate(-1deg); }
  52% { transform: translateX(6px) rotate(1deg); }
  76% { transform: translateX(-3px); }
`;

const toastIn = keyframes`
  0% { opacity: 0; transform: translate(-50%, 8px) scale(0.92); }
  18%, 78% { opacity: 1; transform: translate(-50%, 0) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -8px) scale(0.96); }
`;

const stampIn = keyframes`
  0% { opacity: 0; transform: translate(-50%, -50%) scale(1.8) rotate(-14deg); }
  62% { opacity: 1; transform: translate(-50%, -50%) scale(0.9) rotate(-7deg); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(-7deg); }
`;

const beltMove = keyframes`
  from { background-position-x: 0; }
  to { background-position-x: 24px; }
`;

function PackingItemIcon({ kind, size = 23 }: { kind: PackingItemKind; size?: number }) {
  if (kind === "mail") return <FiMail size={size} />;
  if (kind === "slides") return <FiBarChart2 size={size} />;
  if (kind === "folder") return <FiFolder size={size} />;
  if (kind === "report") return <FiFileText size={size} />;
  if (kind === "receipt") return <FiClipboard size={size} />;
  return <FiTag size={size} />;
}

function SupplyItem({
  kind,
  selected,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onKeyDown,
}: {
  kind: PackingItemKind;
  selected: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>, kind: PackingItemKind) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>, kind: PackingItemKind) => void;
}) {
  const meta = ITEM_META[kind];
  const rotation = ITEM_KINDS.indexOf(kind) % 2 === 0 ? "-1.5deg" : "1.5deg";

  return (
    <Flex
      as="div"
      role="button"
      tabIndex={0}
      aria-label={`${meta.label}，拖曳到資料箱`}
      position="relative"
      minH="66px"
      direction="column"
      alignItems="center"
      justifyContent="center"
      gap="3px"
      border={`3px solid ${meta.dark}`}
      borderRadius="9px"
      bgColor={meta.paper}
      color={meta.dark}
      cursor="grab"
      touchAction="none"
      userSelect="none"
      transform={selected ? "translateY(-5px) rotate(0deg) scale(1.04)" : `rotate(${rotation})`}
      boxShadow={selected ? `0 0 0 4px ${meta.color}55, 0 8px 0 ${meta.dark}` : `0 5px 0 ${meta.dark}`}
      transition="transform 120ms ease, box-shadow 120ms ease"
      _active={{ cursor: "grabbing" }}
      onPointerDown={(event) => onPointerDown(event, kind)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={(event) => onKeyDown(event, kind)}
    >
      <Flex
        w="33px"
        h="33px"
        alignItems="center"
        justifyContent="center"
        border={`2px solid ${meta.dark}`}
        borderRadius={kind === "folder" ? "4px 8px 6px 6px" : "7px"}
        bgColor={meta.color}
        color="#FFFDF2"
        boxShadow="inset 0 2px 0 rgba(255,255,255,0.34)"
      >
        <PackingItemIcon kind={kind} size={20} />
      </Flex>
      <Text fontSize="9px" fontWeight="900" lineHeight="1">
        {meta.shortLabel}
      </Text>
      {selected ? (
        <Box
          position="absolute"
          top="-8px"
          right="-7px"
          w="18px"
          h="18px"
          border="2px solid #315F52"
          borderRadius="999px"
          bgColor="#6DB28E"
          color="white"
          fontSize="11px"
          lineHeight="14px"
          textAlign="center"
        >
          ✓
        </Box>
      ) : null}
    </Flex>
  );
}

function OrderTicket({ order, packed }: { order: PackingOrder; packed: PackingItemKind[] }) {
  return (
    <Flex
      position="relative"
      zIndex={3}
      minH="124px"
      direction="column"
      px="7px"
      pt="8px"
      pb="6px"
      border="3px solid #5A4B40"
      borderRadius="5px 5px 3px 3px"
      bgColor="#FFFDF3"
      color="#51463F"
      boxShadow="3px 4px 0 rgba(63,43,35,0.3)"
      animation={`${orderArrive} 320ms cubic-bezier(0.2,0.75,0.2,1) both`}
      _after={{
        content: '""',
        position: "absolute",
        right: "-3px",
        bottom: "-3px",
        borderStyle: "solid",
        borderWidth: "0 0 13px 13px",
        borderColor: "transparent transparent #D5C5B6 transparent",
      }}
    >
      <Flex alignItems="center" justifyContent="space-between" gap="3px">
        <Text fontSize="7px" fontWeight="900" letterSpacing="0.08em">
          DELIVERY
        </Text>
        <Flex alignItems="center" gap="2px">
          <FiArchive size={9} />
          <Text fontSize="12px" fontWeight="900">
            {order.code}
          </Text>
        </Flex>
      </Flex>
      <Box mt="3px" borderTop="2px dashed #C9BBAE" />
      <Text mt="4px" fontSize="9px" fontWeight="900" lineHeight="1.15" lineClamp={1}>
        {order.title}
      </Text>
      <Text mt="1px" color="#8B7768" fontSize="7px" fontWeight="800" lineHeight="1.15" lineClamp={1}>
        → {order.destination}
      </Text>
      <Flex mt="5px" direction="column" gap="2px">
        {order.items.map((kind) => {
          const isPacked = packed.includes(kind);
          return (
            <Flex key={kind} alignItems="center" gap="3px" minW="0">
              <Flex
                w="11px"
                h="11px"
                flexShrink={0}
                alignItems="center"
                justifyContent="center"
                border={`1.5px solid ${isPacked ? "#3F755E" : "#8D8179"}`}
                bgColor={isPacked ? "#78B694" : "transparent"}
                color="white"
                fontSize="8px"
                fontWeight="900"
              >
                {isPacked ? "✓" : ""}
              </Flex>
              <Text
                minW="0"
                color={isPacked ? "#7E9B88" : "#5B514A"}
                fontSize="7px"
                fontWeight="900"
                lineHeight="1"
                textDecoration={isPacked ? "line-through" : "none"}
                lineClamp={1}
              >
                {ITEM_META[kind].shortLabel}
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </Flex>
  );
}

function OpenPackingBox({
  box,
  selectedKind,
  mistakeNonce,
  onChoose,
}: {
  box: PackingBoxState;
  selectedKind: PackingItemKind | null;
  mistakeNonce: number;
  onChoose: (slotId: number) => void;
}) {
  const missingCount = box.order.items.length - box.packed.length;

  return (
    <Flex
      key={`${box.order.id}-${mistakeNonce}`}
      as="button"
      data-pack-box={box.slotId}
      position="relative"
      minH="126px"
      alignItems="flex-end"
      justifyContent="center"
      cursor={box.sealed ? "default" : selectedKind ? "pointer" : "grab"}
      animation={mistakeNonce > 0 ? `${wrongBox} 330ms ease both` : undefined}
      onClick={() => onChoose(box.slotId)}
      aria-label={`${box.order.title}資料箱，還缺 ${missingCount} 件`}
    >
      <Box
        position="absolute"
        left="6px"
        right="6px"
        bottom="8px"
        h="85px"
        border="4px solid #684936"
        bg="linear-gradient(135deg, #C38B55 0%, #E3B874 48%, #B97945 100%)"
        boxShadow="inset 0 0 0 3px rgba(255,225,167,0.36), 0 6px 0 rgba(77,47,31,0.45)"
        clipPath="polygon(5% 0, 95% 0, 100% 18%, 95% 100%, 5% 100%, 0 18%)"
      />
      <Box
        position="absolute"
        left="12px"
        right="12px"
        bottom="18px"
        h="58px"
        border="2px solid #5B4739"
        bg="repeating-linear-gradient(135deg, #B6E5D1 0 8px, #8BD1C6 8px 15px)"
        opacity={box.sealed ? 0 : 1}
      />
      <Flex
        position="absolute"
        left="13px"
        right="13px"
        bottom="16px"
        h="62px"
        zIndex={2}
        alignItems="center"
        justifyContent="center"
        wrap="wrap"
        gap="2px"
        px="4px"
        opacity={box.sealed ? 0 : 1}
      >
        {box.packed.map((kind, index) => {
          const meta = ITEM_META[kind];
          return (
            <Flex
              key={kind}
              w="33px"
              h="33px"
              alignItems="center"
              justifyContent="center"
              border={`2px solid ${meta.dark}`}
              borderRadius="6px"
              bgColor={meta.color}
              color="white"
              transform={`rotate(${index % 2 === 0 ? -5 : 5}deg)`}
              boxShadow="0 2px 0 rgba(63,45,35,0.34)"
              animation={`${itemDrop} 250ms cubic-bezier(0.2,0.8,0.2,1) both`}
            >
              <PackingItemIcon kind={kind} size={17} />
            </Flex>
          );
        })}
      </Flex>

      <Flex
        position="absolute"
        zIndex={box.sealed ? 5 : 1}
        left="5px"
        right="5px"
        bottom={box.sealed ? "52px" : "82px"}
        h="38px"
        border="4px solid #684936"
        bg="linear-gradient(180deg, #E6BE7E 0%, #BE814B 100%)"
        transformOrigin="center bottom"
        transform={box.sealed ? "perspective(220px) rotateX(-88deg)" : "perspective(220px) rotateX(34deg)"}
        animation={box.sealed ? `${boxSeal} 380ms ease-in both` : undefined}
        _after={{
          content: '""',
          position: "absolute",
          left: "10%",
          right: "10%",
          top: "44%",
          borderTop: "3px dashed rgba(105,70,43,0.55)",
        }}
      />

      {box.sealed ? (
        <>
          <Box
            position="absolute"
            inset="8px 0 0"
            zIndex={7}
            animation={`${boxShip} 680ms ease-in both`}
          />
          <Flex
            position="absolute"
            zIndex={8}
            left="50%"
            top="62%"
            w="66px"
            h="38px"
            alignItems="center"
            justifyContent="center"
            border="4px double #B84F45"
            color="#B84F45"
            bgColor="rgba(255,246,218,0.9)"
            fontSize="11px"
            fontWeight="900"
            letterSpacing="0.08em"
            animation={`${stampIn} 300ms 170ms ease both`}
          >
            已封箱
          </Flex>
        </>
      ) : null}
    </Flex>
  );
}

function createInitialBoxes(): PackingBoxState[] {
  return PACKING_ORDERS.slice(0, 3).map((order, slotId) => ({
    slotId,
    order,
    packed: [],
    sealed: false,
  }));
}

export function OfficePackingDeskMinigame({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [phase, setPhase] = useState<PackingPhase>("intro");
  const [boxes, setBoxes] = useState<PackingBoxState[]>(createInitialBoxes);
  const [selectedKind, setSelectedKind] = useState<PackingItemKind | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [shipments, setShipments] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [notice, setNotice] = useState<{ nonce: number; text: string; wrong: boolean } | null>(null);
  const [mistakes, setMistakes] = useState<Record<number, number>>({});
  const nextOrderIndexRef = useRef(3);
  const shipmentsRef = useRef(0);
  const noticeNonceRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const showNotice = useCallback((text: string, wrong = false) => {
    noticeNonceRef.current += 1;
    setNotice({ nonce: noticeNonceRef.current, text, wrong });
  }, []);

  const shipBox = useCallback((slotId: number) => {
    if (shipmentsRef.current >= TARGET_SHIPMENTS) return;
    shipmentsRef.current += 1;
    const nextShipments = shipmentsRef.current;
    setShipments(nextShipments);
    if (nextShipments >= TARGET_SHIPMENTS) {
      setPhase("complete");
      return;
    }

    const nextOrder = PACKING_ORDERS[nextOrderIndexRef.current % PACKING_ORDERS.length];
    nextOrderIndexRef.current += 1;
    setBoxes((currentBoxes) =>
      currentBoxes.map((box) =>
        box.slotId === slotId
          ? { slotId, order: nextOrder, packed: [], sealed: false }
          : box,
      ),
    );
  }, []);

  const packItem = useCallback(
    (slotId: number, kind: PackingItemKind) => {
      if (phase !== "playing") return;
      const targetBox = boxes.find((box) => box.slotId === slotId);
      if (!targetBox || targetBox.sealed) return;

      if (!targetBox.order.items.includes(kind) || targetBox.packed.includes(kind)) {
        setCombo(0);
        setMistakes((current) => ({ ...current, [slotId]: (current[slotId] ?? 0) + 1 }));
        showNotice(
          targetBox.packed.includes(kind)
            ? `這箱已經放過「${ITEM_META[kind].shortLabel}」了`
            : `${targetBox.order.title}不需要「${ITEM_META[kind].shortLabel}」`,
          true,
        );
        return;
      }

      const packed = [...targetBox.packed, kind];
      const wasCompleted = packed.length === targetBox.order.items.length;
      setBoxes((currentBoxes) =>
        currentBoxes.map((box) =>
          box.slotId === slotId ? { ...box, packed, sealed: wasCompleted } : box,
        ),
      );

      setSelectedKind(null);
      setScore((current) => current + 10 + Math.min(combo, 3) * 2 + (wasCompleted ? 25 : 0));
      setCombo((current) => current + 1);
      showNotice(wasCompleted ? "清單完成，封箱送出！" : `放入 ${ITEM_META[kind].shortLabel}`);

      if (wasCompleted) {
        const timer = window.setTimeout(() => shipBox(slotId), 690);
        timersRef.current.push(timer);
      }
    },
    [boxes, combo, phase, shipBox, showNotice],
  );

  const chooseBox = useCallback(
    (slotId: number) => {
      if (selectedKind) packItem(slotId, selectedKind);
    },
    [packItem, selectedKind],
  );

  const handleSupplyPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, kind: PackingItemKind) => {
      if (phase !== "playing") return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setSelectedKind(kind);
      setDrag({
        kind,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        clientX: event.clientX,
        clientY: event.clientY,
      });
    },
    [phase],
  );

  const handleSupplyPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    setDrag((current) =>
      current && current.pointerId === event.pointerId
        ? { ...current, clientX: event.clientX, clientY: event.clientY }
        : current,
    );
  }, []);

  const handleSupplyPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
      if (distance > 8) {
        const element = document.elementFromPoint(event.clientX, event.clientY);
        const targetBox = element?.closest<HTMLElement>("[data-pack-box]");
        const slotId = Number(targetBox?.dataset.packBox);
        if (Number.isInteger(slotId)) {
          packItem(slotId, drag.kind);
        } else {
          showNotice("把物件拖到打開的資料箱裡", true);
        }
      }
      setDrag(null);
    },
    [drag, packItem, showNotice],
  );

  const handleSupplyPointerCancel = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    setDrag((current) => (current?.pointerId === event.pointerId ? null : current));
  }, []);

  const handleSupplyKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>, kind: PackingItemKind) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      setSelectedKind(kind);
      showNotice(`已拿起 ${ITEM_META[kind].shortLabel}，再選一個資料箱`);
    },
    [showNotice],
  );

  const packedItemCount = useMemo(
    () => boxes.reduce((total, box) => total + box.packed.length, 0),
    [boxes],
  );

  return (
    <Flex
      position="absolute"
      inset="0"
      direction="column"
      overflow="hidden"
      bgColor="#B98757"
      color="#3D3834"
      userSelect="none"
      data-office-packing-desk={phase}
      onContextMenu={(event) => event.preventDefault()}
    >
      <Box
        position="absolute"
        inset="0"
        bgImage='linear-gradient(rgba(98,61,38,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(98,61,38,0.08) 1px, transparent 1px), url("/images/work/Office_Work_Day_Empty.png")'
        bgSize="22px 22px, 22px 22px, cover"
        backgroundPosition="center, center, center bottom"
        filter="saturate(0.82) brightness(0.82)"
      />
      <Box position="absolute" inset="0" bg="linear-gradient(180deg, rgba(28,35,39,0.68) 0 74px, rgba(68,48,37,0.18) 74px 100%)" />

      <Flex
        position="relative"
        zIndex={2}
        h="74px"
        flexShrink={0}
        alignItems="center"
        justifyContent="space-between"
        gap="8px"
        px="13px"
        borderBottom="4px solid #3E342E"
        bg="linear-gradient(180deg, #32494C 0%, #263C40 100%)"
        color="#FFF7DF"
        boxShadow="0 5px 0 rgba(35,25,20,0.24)"
      >
        <Flex minW="0" direction="column">
          <Text color="#EBC86F" fontSize="8px" fontWeight="900" letterSpacing="0.16em">
            OFFICE SHIPPING DESK
          </Text>
          <Text mt="2px" fontSize="17px" fontWeight="900" lineHeight="1.05">
            今日交付・資料裝箱
          </Text>
          <Text mt="3px" color="rgba(255,247,223,0.68)" fontSize="8px" fontWeight="800">
            看清單，把桌面物件送進正確的箱子
          </Text>
        </Flex>
        <Flex gap="6px" flexShrink={0}>
          <Flex minW="48px" h="44px" direction="column" alignItems="center" justifyContent="center" border="2px solid #182B2E" borderRadius="7px" bgColor="#D8B24E" color="#3C3329" boxShadow="0 3px 0 #182B2E">
            <Text fontSize="7px" fontWeight="900">已寄出</Text>
            <Text fontSize="17px" fontWeight="900" lineHeight="1">{shipments}/{TARGET_SHIPMENTS}</Text>
          </Flex>
          <Flex minW="47px" h="44px" direction="column" alignItems="center" justifyContent="center" border="2px solid #182B2E" borderRadius="7px" bgColor="#EEF1D8" color="#30443D" boxShadow="0 3px 0 #182B2E">
            <Text fontSize="7px" fontWeight="900">整理分</Text>
            <Text fontSize="15px" fontWeight="900" lineHeight="1">{score}</Text>
          </Flex>
        </Flex>
      </Flex>

      <Flex
        position="relative"
        zIndex={2}
        flex="1"
        minH="0"
        direction="column"
        px="9px"
        pt="9px"
        pb="10px"
        animation={`${boardIn} 300ms ease both`}
      >
        <Flex
          h="30px"
          flexShrink={0}
          alignItems="center"
          justifyContent="space-between"
          px="9px"
          border="3px solid #4C3B32"
          borderRadius="7px 7px 3px 3px"
          bgColor="#F4E4BC"
          boxShadow="0 3px 0 rgba(64,43,32,0.4)"
        >
          <Flex alignItems="center" gap="5px">
            <FiTruck size={13} />
            <Text fontSize="9px" fontWeight="900">同時處理 3 張交付單</Text>
          </Flex>
          <Text color="#8A6543" fontSize="8px" fontWeight="900">桌上 {packedItemCount} 件・連續 {combo}</Text>
        </Flex>

        <Grid
          mt="7px"
          templateColumns="repeat(3, minmax(0, 1fr))"
          gap="6px"
          minH="274px"
          p="6px"
          border="4px solid #5E3F3A"
          borderRadius="10px"
          bg="linear-gradient(180deg, #BD8BDB 0%, #A875CF 100%)"
          bgImage="linear-gradient(rgba(255,255,255,0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.11) 1px, transparent 1px)"
          bgSize="16px 16px"
          boxShadow="inset 0 0 0 3px rgba(255,236,255,0.22), 0 5px 0 rgba(64,43,32,0.4)"
        >
          {boxes.map((box) => (
            <Flex key={`${box.slotId}-${box.order.id}`} direction="column" gap="2px" animation={box.sealed ? `${boxShip} 680ms ease-in both` : undefined}>
              <OrderTicket order={box.order} packed={box.packed} />
              <OpenPackingBox
                box={box}
                selectedKind={selectedKind}
                mistakeNonce={mistakes[box.slotId] ?? 0}
                onChoose={chooseBox}
              />
            </Flex>
          ))}
        </Grid>

        <Flex
          mt="8px"
          h="24px"
          flexShrink={0}
          alignItems="center"
          justifyContent="space-between"
          px="9px"
          border="3px solid #4A3D36"
          borderRadius="5px"
          bgColor="#697A7D"
          color="white"
          boxShadow="0 3px 0 rgba(64,43,32,0.4)"
          bgImage="repeating-linear-gradient(90deg, transparent 0 13px, rgba(255,255,255,0.16) 13px 16px, transparent 16px 24px)"
          animation={`${beltMove} 1100ms linear infinite`}
        >
          <Text fontSize="8px" fontWeight="900" textShadow="0 1px 1px #334347">← 物件補給區・可重複拿取</Text>
          <FiPackage size={12} />
        </Flex>

        <Grid mt="7px" templateColumns="repeat(3, minmax(0, 1fr))" gap="8px" flex="1" minH="0" alignContent="center">
          {ITEM_KINDS.map((kind) => (
            <SupplyItem
              key={kind}
              kind={kind}
              selected={selectedKind === kind}
              onPointerDown={handleSupplyPointerDown}
              onPointerMove={handleSupplyPointerMove}
              onPointerUp={handleSupplyPointerUp}
              onPointerCancel={handleSupplyPointerCancel}
              onKeyDown={handleSupplyKeyDown}
            />
          ))}
        </Grid>

        <Flex mt="7px" minH="27px" flexShrink={0} alignItems="center" justifyContent="center" gap="5px" color="#FFF5DE" textShadow="0 2px 2px rgba(42,28,21,0.65)">
          <FiMousePointer size={12} />
          <Text fontSize="9px" fontWeight="900">
            {selectedKind ? `已拿起「${ITEM_META[selectedKind].shortLabel}」・點箱子或直接拖進去` : "拖曳物件進箱；也可以先點物件、再點箱子"}
          </Text>
        </Flex>
      </Flex>

      {drag ? (
        <Flex
          position="fixed"
          zIndex={200}
          left={`${drag.clientX}px`}
          top={`${drag.clientY}px`}
          w="58px"
          h="58px"
          alignItems="center"
          justifyContent="center"
          border={`4px solid ${ITEM_META[drag.kind].dark}`}
          borderRadius="12px"
          bgColor={ITEM_META[drag.kind].color}
          color="white"
          boxShadow="0 12px 18px rgba(38,25,20,0.38)"
          transform="translate(-50%, -62%) rotate(-4deg)"
          pointerEvents="none"
        >
          <PackingItemIcon kind={drag.kind} size={30} />
        </Flex>
      ) : null}

      {notice ? (
        <Flex
          key={notice.nonce}
          position="absolute"
          zIndex={90}
          left="50%"
          bottom="178px"
          minH="34px"
          maxW="310px"
          alignItems="center"
          gap="6px"
          px="12px"
          border={`3px solid ${notice.wrong ? "#713F3D" : "#315C4D"}`}
          borderRadius="7px"
          bgColor={notice.wrong ? "#EFA29A" : "#DDF0D3"}
          color={notice.wrong ? "#713F3D" : "#315C4D"}
          boxShadow="0 5px 0 rgba(46,31,26,0.4)"
          animation={`${toastIn} 1300ms ease both`}
          pointerEvents="none"
        >
          {notice.wrong ? <FiPackage size={14} /> : <FiCheck size={14} />}
          <Text fontSize="10px" fontWeight="900">{notice.text}</Text>
        </Flex>
      ) : null}

      {phase === "intro" ? (
        <Flex position="absolute" inset="0" zIndex={120} alignItems="center" justifyContent="center" px="20px" bgColor="rgba(20,25,27,0.78)" backdropFilter="blur(3px)">
          <Flex w="100%" direction="column" alignItems="center" p="20px" border="4px solid #34463F" borderRadius="12px" bgColor="#FFF3D4" color="#4B443E" textAlign="center" boxShadow="8px 9px 0 rgba(12,16,16,0.48)" animation={`${boardIn} 250ms ease both`}>
            <Flex w="62px" h="62px" alignItems="center" justifyContent="center" border="4px solid #72513A" borderRadius="11px" bgColor="#D59A58" color="#FFF8E7" boxShadow="0 5px 0 #72513A">
              <FiPackage size={33} />
            </Flex>
            <Text mt="15px" color="#93692F" fontSize="9px" fontWeight="900" letterSpacing="0.16em">辦公遊戲方案 3</Text>
            <Text mt="4px" fontSize="24px" fontWeight="900">今日交付・資料裝箱</Text>
            <Text mt="9px" color="#73675D" fontSize="11px" fontWeight="800" lineHeight="1.65">
              三個資料箱各有一張交付清單。從桌面拿起信件、簡報、週報等物件，放進需要它的箱子；清單集滿就會自動封箱寄出。
            </Text>
            <Flex mt="12px" w="100%" alignItems="center" justifyContent="space-around" p="10px" border="2px dashed #C29A62" borderRadius="9px" bgColor="#F7E4BB">
              <Flex direction="column" alignItems="center" gap="3px"><FiFileText size={21} /><Text fontSize="8px" fontWeight="900">看交付單</Text></Flex>
              <Text color="#A77E43" fontSize="18px" fontWeight="900">→</Text>
              <Flex direction="column" alignItems="center" gap="3px"><FiMousePointer size={21} /><Text fontSize="8px" fontWeight="900">拖曳物件</Text></Flex>
              <Text color="#A77E43" fontSize="18px" fontWeight="900">→</Text>
              <Flex direction="column" alignItems="center" gap="3px"><FiTruck size={21} /><Text fontSize="8px" fontWeight="900">封箱寄出</Text></Flex>
            </Flex>
            <Flex as="button" mt="16px" w="100%" h="47px" alignItems="center" justifyContent="center" gap="8px" border="3px solid #27483E" borderRadius="8px" bgColor="#4F8B76" color="white" boxShadow="0 5px 0 #27483E" onClick={() => setPhase("playing")}>
              <FiPackage size={17} />
              <Text fontSize="13px" fontWeight="900">開始整理桌面</Text>
            </Flex>
            <Text as="button" mt="10px" color="#9A8B7D" fontSize="10px" fontWeight="800" onClick={onSkip}>略過工作小遊戲</Text>
          </Flex>
        </Flex>
      ) : null}

      {phase === "complete" ? (
        <Flex position="absolute" inset="0" zIndex={130} alignItems="center" justifyContent="center" px="20px" bgColor="rgba(16,23,24,0.82)" backdropFilter="blur(4px)">
          <Flex w="100%" direction="column" alignItems="center" p="22px" border="4px solid #29483F" borderRadius="12px" bgColor="#F1F1D8" color="#3E4D47" textAlign="center" boxShadow="8px 9px 0 rgba(9,14,15,0.5)" animation={`${boardIn} 250ms ease both`}>
            <Flex w="68px" h="68px" alignItems="center" justifyContent="center" border="4px solid #315E50" borderRadius="12px" bgColor="#65A58B" color="white" boxShadow="0 5px 0 #315E50"><FiTruck size={34} /></Flex>
            <Text mt="15px" color="#897131" fontSize="9px" fontWeight="900" letterSpacing="0.14em">ALL PACKED</Text>
            <Text mt="3px" fontSize="24px" fontWeight="900">今天的交付都寄出了</Text>
            <Text mt="8px" color="#6C7A73" fontSize="11px" fontWeight="800" lineHeight="1.6">
              你照清單完成 {shipments} 箱資料，得到 {score} 點整理分。桌面終於恢復清爽了。
            </Text>
            <Flex mt="14px" gap="8px">
              {ITEM_KINDS.slice(0, 5).map((kind) => (
                <Flex key={kind} w="34px" h="34px" alignItems="center" justifyContent="center" border={`2px solid ${ITEM_META[kind].dark}`} borderRadius="6px" bgColor={ITEM_META[kind].color} color="white" transform={`rotate(${ITEM_KINDS.indexOf(kind) % 2 ? 5 : -5}deg)`}>
                  <PackingItemIcon kind={kind} size={17} />
                </Flex>
              ))}
            </Flex>
            <Flex as="button" mt="18px" w="100%" h="48px" alignItems="center" justifyContent="center" gap="8px" border="3px solid #27483E" borderRadius="8px" bgColor="#4F8B76" color="white" boxShadow="0 5px 0 #27483E" onClick={onComplete}>
              <FiCheck size={18} />
              <Text fontSize="13px" fontWeight="900">收起出貨台，前往便利商店</Text>
            </Flex>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}
