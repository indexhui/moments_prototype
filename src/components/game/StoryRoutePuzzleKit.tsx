"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Box, Flex } from "@chakra-ui/react";

export const STORY_ROUTE_DROP_TARGET_ATTR = "data-story-route-drop-target";

export type StoryRouteDragState<TPayload> = {
  payload: TPayload;
  x: number;
  y: number;
  width: number;
  height: number;
};

type StoryRouteDragStartOptions = {
  size?: number;
  width?: number;
  height?: number;
};

type StoryRouteDropPoint = {
  x: number;
  y: number;
};

type UseStoryRoutePointerDragOptions<TPayload, TDropTarget extends string> = {
  disabled?: boolean;
  resolveDropTarget?: (x: number, y: number, payload: TPayload) => TDropTarget | null;
  onDragStart?: (payload: TPayload) => void;
  onDrop: (payload: TPayload, target: TDropTarget | null, point: StoryRouteDropPoint) => void;
  onCancel?: (payload: TPayload | null) => void;
};

export function getStoryRouteDropTargetAtPoint<TDropTarget extends string = string>(
  x: number,
  y: number,
) {
  if (typeof document === "undefined") return null;
  const target = document.elementFromPoint(x, y);
  const targetElement =
    target instanceof Element
      ? target.closest(`[${STORY_ROUTE_DROP_TARGET_ATTR}]`)
      : null;
  const value = targetElement?.getAttribute(STORY_ROUTE_DROP_TARGET_ATTR);
  return value ? (value as TDropTarget) : null;
}

export function useStoryRoutePointerDrag<TPayload, TDropTarget extends string = string>({
  disabled = false,
  resolveDropTarget,
  onDragStart,
  onDrop,
  onCancel,
}: UseStoryRoutePointerDragOptions<TPayload, TDropTarget>) {
  const [dragState, setDragState] = useState<StoryRouteDragState<TPayload> | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const activePayloadRef = useRef<TPayload | null>(null);
  const resolveDropTargetRef = useRef<typeof resolveDropTarget>(resolveDropTarget);
  const onDropRef = useRef(onDrop);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    resolveDropTargetRef.current = resolveDropTarget;
    onDropRef.current = onDrop;
    onCancelRef.current = onCancel;
  }, [onCancel, onDrop, resolveDropTarget]);

  const startDrag = useCallback(
    (
      event: ReactPointerEvent<HTMLElement>,
      payload: TPayload,
      options: StoryRouteDragStartOptions = {},
    ) => {
      if (disabled) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {}

      const size = options.size ?? 92;
      activePointerIdRef.current = event.pointerId;
      activePayloadRef.current = payload;
      setDragState({
        payload,
        x: event.clientX,
        y: event.clientY,
        width: options.width ?? size,
        height: options.height ?? size,
      });
      onDragStart?.(payload);
    },
    [disabled, onDragStart],
  );

  const isDragActive = dragState !== null;

  useEffect(() => {
    if (!isDragActive) return;

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    const clearDrag = (shouldCancel: boolean) => {
      const payload = activePayloadRef.current;
      activePointerIdRef.current = null;
      activePayloadRef.current = null;
      setDragState(null);
      if (shouldCancel) onCancelRef.current?.(payload);
    };

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      if (event.pointerId !== activePointerIdRef.current) return;
      event.preventDefault();
      setDragState((current) =>
        current
          ? {
              ...current,
              x: event.clientX,
              y: event.clientY,
            }
          : current,
      );
    };

    const handlePointerUp = (event: globalThis.PointerEvent) => {
      if (event.pointerId !== activePointerIdRef.current) return;
      event.preventDefault();
      const payload = activePayloadRef.current;
      if (payload) {
        const resolver = resolveDropTargetRef.current;
        const target = resolver
          ? resolver(event.clientX, event.clientY, payload)
          : getStoryRouteDropTargetAtPoint<TDropTarget>(event.clientX, event.clientY);
        onDropRef.current(payload, target, {
          x: event.clientX,
          y: event.clientY,
        });
      }
      clearDrag(false);
    };

    const handlePointerCancel = () => {
      clearDrag(true);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp, { passive: false });
    window.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [isDragActive]);

  return {
    dragState,
    startDrag,
    isDragging: isDragActive,
  };
}

export function StoryRouteDragPreviewLayer<TPayload>({
  dragState,
  renderPreview,
  zIndex = 120,
}: {
  dragState: StoryRouteDragState<TPayload> | null;
  renderPreview: (payload: TPayload) => ReactNode;
  zIndex?: number;
}) {
  if (!dragState) return null;

  return (
    <Flex
      position="fixed"
      left={`${dragState.x}px`}
      top={`${dragState.y}px`}
      zIndex={zIndex}
      w={`${dragState.width}px`}
      h={`${dragState.height}px`}
      borderRadius="8px"
      overflow="hidden"
      bgColor="#F8E7CD"
      border="3px solid #FFF7EC"
      boxShadow="0 22px 42px rgba(81, 56, 34, 0.28), 0 7px 14px rgba(81, 56, 34, 0.18)"
      transform="translate(-50%, -54%) rotate(-3deg) scale(1.06)"
      transformOrigin="center"
      pointerEvents="none"
      opacity={1}
      isolation="isolate"
      alignItems="center"
      justifyContent="center"
    >
      <Box position="absolute" inset="0" bgColor="#F8E7CD" zIndex={0} />
      <Flex
        position="relative"
        zIndex={1}
        w="100%"
        h="100%"
        alignItems="center"
        justifyContent="center"
      >
        {renderPreview(dragState.payload)}
      </Flex>
      <Box
        position="absolute"
        inset="0"
        zIndex={2}
        boxShadow="inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -2px 5px rgba(103,72,45,0.12)"
      />
    </Flex>
  );
}

export function StoryRoutePuzzleBoardTile({
  children,
  isEmpty = false,
  isActive = false,
  isConnected = false,
  size = "116px",
  cursor,
  ariaLabel,
  dropTarget,
  onClick,
}: {
  children?: ReactNode;
  isEmpty?: boolean;
  isActive?: boolean;
  isConnected?: boolean;
  size?: string;
  cursor?: string;
  ariaLabel?: string;
  dropTarget?: string;
  onClick?: () => void;
}) {
  return (
    <Flex
      as={onClick ? "button" : "div"}
      w={size}
      h={size}
      p="0"
      borderRadius={isConnected ? "0" : "10px"}
      bgColor={
        isConnected
          ? "transparent"
          : isEmpty
            ? "rgba(255, 251, 241, 0.96)"
            : "rgba(244,236,223,0.95)"
      }
      border={isEmpty && !isConnected ? "2px dashed rgba(157, 120, 89, 0.42)" : "0"}
      outline={isActive && !isConnected ? "3px solid rgba(83, 197, 213, 0.52)" : "0"}
      outlineOffset="-3px"
      boxShadow={
        isEmpty && !isConnected
          ? "inset 0 0 0 2px rgba(255,255,255,0.58), 0 2px 5px rgba(107,78,51,0.08)"
          : "none"
      }
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      cursor={cursor}
      transition="border-radius 420ms ease, outline-color 160ms ease, background-color 420ms ease, box-shadow 420ms ease"
      onClick={onClick}
      data-story-route-drop-target={dropTarget}
      aria-label={ariaLabel}
    >
      {children}
    </Flex>
  );
}
