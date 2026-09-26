"use client";

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Text, chakra } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { type ExhibitionLocale } from "@/lib/game/exhibitionI18n";

const RECONSTRUCTION_MS = 3600;
const MERGE_AT_MS = 3060;
const KEYWORD_EMPHASIS_MS = 1500;
const diaryKeywordEmphasis = keyframes`
  0%, 18% { transform: translateY(0) scale(1); color: #302A25; }
  42% { transform: translateY(-3px) scale(1.16); color: #B57C43; }
  65% { transform: translateY(-1px) scale(1.06); color: #A36D3D; }
  100% { transform: translateY(0) scale(1); color: #93603B; }
`;
const diaryKeywordUnderline = keyframes`
  0%, 30% { stroke-dashoffset: 1; opacity: 0; }
  42% { opacity: 0.85; }
  73% { stroke-dashoffset: 0; opacity: 0.85; }
  100% { stroke-dashoffset: 0; opacity: 0.65; }
`;

type WordCard = {
  id: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scatterX: number;
  scatterY: number;
};

type CardLayout = {
  cards: WordCard[];
  lines: { x: number; y: number; width: number; first: number; last: number }[];
  width: number;
  height: number;
  scatterScale: number;
};

// Pack a scrambled set of real letters/words; these are not placeholder cells.
function scatterCards(cards: WordCard[], width: number, scale: number) {
  const shuffled = [...cards].sort((a, b) => ((a.id * 7919) % 104729) - ((b.id * 7919) % 104729));
  const lineHeight = 24 * scale + 10;
  let x = 8;
  let y = 12;
  for (const card of shuffled) {
    const cellWidth = Math.max(16, card.width) * scale + 10;
    if (x + cellWidth > width - 8 && x > 8) {
      x = 8;
      y += lineHeight;
    }
    card.scatterX = x + cellWidth / 2 - card.width / 2;
    card.scatterY = y;
    x += cellWidth;
  }
  return y + lineHeight + 8;
}

export function ExhibitionDiaryTextReconstruction({ locale, paragraphs, fontFamily, onComplete, emphasizedKeyword }: {
  locale: ExhibitionLocale;
  paragraphs: readonly string[];
  fontFamily: string;
  onComplete: () => void;
  emphasizedKeyword?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const proseRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const startedAtRef = useRef<number | null>(null);
  const hasScrolledRef = useRef(false);
  const [layout, setLayout] = useState<CardLayout | null>(null);
  const [phase, setPhase] = useState<"release" | "assemble" | "merge" | "complete">("release");
  const [keywordSettled, setKeywordSettled] = useState(false);
  const tokens = useMemo(() => {
    const segmenter = new Intl.Segmenter(locale === "zh" ? "zh-Hant" : locale, { granularity: "grapheme" });
    let id = 0;
    return paragraphs.map(paragraph => {
      const keywordIndex = emphasizedKeyword ? paragraph.toLocaleLowerCase(locale).indexOf(emphasizedKeyword.toLocaleLowerCase(locale)) : -1;
      const sections = keywordIndex < 0 ? [{ text: paragraph, keyword: false }] : [
        { text: paragraph.slice(0, keywordIndex), keyword: false },
        { text: paragraph.slice(keywordIndex, keywordIndex + emphasizedKeyword!.length), keyword: true },
        { text: paragraph.slice(keywordIndex + emphasizedKeyword!.length), keyword: false },
      ];
      return sections.filter(section => section.text).map(section => {
        const parts = locale === "en"
          ? section.text.split(/(\s+|—)/u).filter(Boolean)
          : Array.from(segmenter.segment(section.text), part => part.segment);
        return { keyword: section.keyword, tokens: parts.map(text => ({ id: id++, text })) };
      });
    });
  }, [locale, paragraphs, emphasizedKeyword]);

  useEffect(() => {
    if (phase !== "complete" || !emphasizedKeyword) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setKeywordSettled(true);
      return;
    }
    const timer = window.setTimeout(() => setKeywordSettled(true), KEYWORD_EMPHASIS_MS);
    return () => window.clearTimeout(timer);
  }, [phase, emphasizedKeyword]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const prose = proseRef.current;
    if (!root || !prose) return;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const bounds = root.getBoundingClientRect();
      const cards = Array.from(prose.querySelectorAll<HTMLElement>("[data-reconstruction-token]"), token => {
        const range = document.createRange();
        range.selectNodeContents(token);
        const rect = range.getBoundingClientRect();
        return {
          id: Number(token.dataset.reconstructionToken), text: token.textContent ?? "",
          x: rect.left - bounds.left, y: rect.top - bounds.top,
          width: rect.width, height: rect.height, scatterX: 0, scatterY: 0,
        };
      });
      const availableHeight = Math.min(270, Math.max(180, (root.parentElement?.clientHeight ?? 320) - 48));
      let scatterScale = 1.12;
      let height = scatterCards(cards, bounds.width, scatterScale);
      while (height > availableHeight && scatterScale > 0.72) {
        scatterScale -= 0.08;
        height = scatterCards(cards, bounds.width, scatterScale);
      }
      const lines: CardLayout["lines"] = [];
      cards.forEach((card, index) => {
        const baseline = card.y + card.height + 2;
        const line = lines.find(candidate => Math.abs(candidate.y - baseline) < 2);
        if (line) {
          line.width = card.x + card.width - line.x;
          line.last = index;
        } else {
          lines.push({ x: card.x, y: baseline, width: card.width, first: index, last: index });
        }
      });
      setLayout({ cards, lines, width: bounds.width, height, scatterScale });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(prose);
    void document.fonts.ready.then(measure);
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [tokens]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const prose = proseRef.current;
    const cardLayer = cardsRef.current;
    if (!layout || !root || !prose || !cardLayer) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 180 : RECONSTRUCTION_MS;
    startedAtRef.current ??= performance.now();
    const elapsed = Math.min(duration, performance.now() - startedAtRef.current);
    const animations: Animation[] = [];
    const animate = (node: Element, frames: Keyframe[]) => {
      const animation = node.animate(frames, { duration, fill: "both" });
      animation.currentTime = elapsed;
      animations.push(animation);
    };

    // On short screens, bring the reconstruction into view once. Reading stays scrollable.
    const viewport = root.parentElement;
    if (viewport && !hasScrolledRef.current) {
      hasScrolledRef.current = true;
      const visibleHeight = viewport.getBoundingClientRect().bottom - root.getBoundingClientRect().top;
      if (visibleHeight < Math.min(layout.height, 220)) {
        viewport.scrollTo({
          top: viewport.scrollTop + root.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 24,
          behavior: reducedMotion ? "instant" : "smooth",
        });
      }
    }

    animate(prose, reducedMotion ? [{ opacity: 0 }, { opacity: 1 }] : [
      { opacity: 0, offset: 0 }, { opacity: 0, offset: 0.9 }, { opacity: 1, offset: 1 },
    ]);
    animate(cardLayer, reducedMotion ? [{ opacity: 0 }, { opacity: 0 }] : [
      { opacity: 1, offset: 0 }, { opacity: 1, offset: 0.9 }, { opacity: 0, offset: 1 },
    ]);

    if (!reducedMotion) {
      // A shared writing line replaces the individual frames as the letters settle.
      layout.lines.forEach((line, index) => {
        const node = cardLayer.querySelector<HTMLElement>(`[data-reconstruction-line="${index}"]`);
        if (!node) return;
        const start = 0.57 + line.first / Math.max(1, layout.cards.length - 1) * 0.24;
        const end = 0.57 + line.last / Math.max(1, layout.cards.length - 1) * 0.24;
        animate(node, [
          { offset: 0, opacity: 0 },
          { offset: start - 0.08, opacity: 0 },
          { offset: start, opacity: 0.65 },
          { offset: end + 0.035, opacity: 0.65 },
          { offset: end + 0.13, opacity: 0 },
          { offset: 1, opacity: 0 },
        ]);
        const stroke = node.firstElementChild;
        const glint = node.lastElementChild;
        if (stroke) animate(stroke, [
          { offset: 0, transform: "scaleX(0)" },
          { offset: start - 0.035, transform: "scaleX(0)", easing: "ease-in-out" },
          { offset: end + 0.025, transform: "scaleX(1)" },
          { offset: 1, transform: "scaleX(1)" },
        ]);
        if (glint) animate(glint, [
          { offset: 0, opacity: 0, transform: "translateX(-12px)" },
          { offset: start - 0.035, opacity: 0, transform: "translateX(-12px)" },
          { offset: start, opacity: 0.8 },
          { offset: end + 0.025, opacity: 0.8, transform: `translateX(${line.width - 12}px)` },
          { offset: end + 0.08, opacity: 0, transform: `translateX(${line.width - 12}px)` },
          { offset: 1, opacity: 0, transform: `translateX(${line.width - 12}px)` },
        ]);
      });
      layout.cards.forEach((card, index) => {
        const node = cardLayer.querySelector<HTMLElement>(`[data-reconstruction-card="${card.id}"]`);
        if (!node) return;
        const sequence = index / Math.max(1, layout.cards.length - 1);
        const releaseOffset = (index % 7) * 0.007;
        const angle = ((index * 13) % 17) - 8;
        const sourceX = layout.width * 0.5 + ((index % 5) - 2) * 22 - card.x - card.width / 2;
        const sourceY = -70 - (index % 4) * 12 - card.y;
        const scattered = `translate(${card.scatterX - card.x}px, ${card.scatterY - card.y}px) rotate(${angle}deg) scale(${layout.scatterScale})`;
        const floating = `translate(${card.scatterX - card.x}px, ${card.scatterY - card.y - 4}px) rotate(${-angle * 0.5}deg) scale(${layout.scatterScale})`;
        const source = `translate(${sourceX}px, ${sourceY}px) rotate(${angle * 9}deg) scale(0.12)`;
        const landing = 0.57 + sequence * 0.24;
        const approach = `translate(${(card.scatterX - card.x) * 0.12}px, -6px) rotate(${-angle * 0.08}deg) scale(1.015)`;
        animate(node, [
          { offset: 0, opacity: 0, transform: source },
          { offset: 0.02 + releaseOffset, opacity: 0, transform: source, easing: "cubic-bezier(.16,.75,.24,1)" },
          { offset: 0.22 + releaseOffset, opacity: 1, transform: scattered, easing: "ease-in-out" },
          { offset: 0.35 + sequence * 0.24, opacity: 1, transform: floating, easing: "cubic-bezier(.4,0,.2,1)" },
          { offset: landing - 0.055, opacity: 1, transform: approach, easing: "cubic-bezier(.2,.7,.2,1)" },
          { offset: landing, opacity: 1, transform: "translate(0,-0.7px) rotate(0deg) scale(1)", easing: "ease-out" },
          { offset: landing + 0.045, opacity: 1, transform: "translate(0,0) rotate(0deg) scale(1)" },
          { offset: 1, opacity: 1, transform: "translate(0,0) rotate(0deg) scale(1)" },
        ]);
        const frame = node.firstElementChild;
        if (frame) animate(frame, [
          { offset: 0, opacity: 1, boxShadow: "0 2px 4px #6047271A", transform: "scale(1)" },
          { offset: landing - 0.15, opacity: 1, boxShadow: "0 2px 4px #6047271A", transform: "scale(1)" },
          { offset: landing - 0.055, opacity: 0.12, boxShadow: "0 0 0 transparent", transform: "scale(.96,.88)" },
          { offset: landing, opacity: 0, boxShadow: "0 0 0 transparent", transform: "scale(.96,.88)" },
          { offset: 1, opacity: 0, boxShadow: "0 0 0 transparent", transform: "scale(.96,.88)" },
        ]);
        const ink = node.lastElementChild;
        if (ink) animate(ink, [
          { offset: 0, color: "#655443" },
          { offset: landing - 0.055, color: "#655443" },
          { offset: landing + 0.06, color: "#302A25" },
          { offset: 1, color: "#302A25" },
        ]);
      });
    }

    const timers = reducedMotion ? [] : [
      window.setTimeout(() => setPhase("assemble"), Math.max(0, 1330 - elapsed)),
      window.setTimeout(() => setPhase("merge"), Math.max(0, MERGE_AT_MS - elapsed)),
    ];
    timers.push(window.setTimeout(() => {
      setPhase("complete");
      onComplete();
    }, Math.max(0, duration - elapsed)));
    return () => {
      animations.forEach(animation => animation.cancel());
      timers.forEach(timer => window.clearTimeout(timer));
    };
  }, [layout, onComplete]);

  return (
    <Box
      ref={rootRef} position="relative" flexShrink={0} isolation="isolate"
      minH={phase === "complete" || !layout ? undefined : `${layout.height}px`}
      aria-live="polite" aria-busy={phase !== "complete"}
      data-exhibition-frog-diary-motion-role="text"
      data-exhibition-diary-restored-prose="true" data-exhibition-diary-reconstruction={phase}
    >
      <Flex ref={proseRef} direction="column" gap="8px" px="4px" opacity={0}>
        {tokens.map((paragraphGroups, paragraphIndex) => (
          <Text
            key={paragraphIndex} fontFamily={fontFamily} fontSize="16px" fontWeight="400" lineHeight="1.75"
            color="#302A25" textAlign="left" overflowWrap="break-word" aria-label={paragraphs[paragraphIndex]}
          >
            {paragraphGroups.map((group, groupIndex) => {
              const content = group.tokens.map(token => (
                <span key={token.id} aria-hidden="true" data-reconstruction-token={token.text.trim() ? token.id : undefined}>
                  {token.text}
                </span>
              ));
              return group.keyword ? (
                <Box as="span" key={groupIndex} position="relative" display="inline-block"
                  whiteSpace="nowrap" transformOrigin="center 70%"
                  data-exhibition-diary-keyword={emphasizedKeyword}
                  data-exhibition-diary-keyword-stage={phase !== "complete" ? "waiting" : keywordSettled ? "settled" : "emphasizing"}
                  animation={phase === "complete" ? `${diaryKeywordEmphasis} ${KEYWORD_EMPHASIS_MS}ms ease both` : undefined}
                  css={{ "@media (prefers-reduced-motion: reduce)": { animation: "none", color: phase === "complete" ? "#93603B" : undefined } }}
                >
                  {content}
                  <chakra.svg position="absolute" left="-2px" bottom="1px" w="calc(100% + 4px)" h="6px"
                    viewBox="0 0 100 8" preserveAspectRatio="none" fill="none" pointerEvents="none" aria-hidden="true"
                    opacity={phase === "complete" ? 1 : 0}>
                    <chakra.path d="M 3 5 Q 45 1 97 4" pathLength="1" stroke="#B18550" strokeWidth="2.2"
                      strokeLinecap="round" strokeDasharray="1" strokeDashoffset="1"
                      animation={phase === "complete" ? `${diaryKeywordUnderline} ${KEYWORD_EMPHASIS_MS}ms ease both` : undefined}
                      css={{ "@media (prefers-reduced-motion: reduce)": { animation: "none", strokeDashoffset: 0, opacity: 0.65 } }} />
                  </chakra.svg>
                </Box>
              ) : <Fragment key={groupIndex}>{content}</Fragment>;
            })}
          </Text>
        ))}
      </Flex>
      <Box ref={cardsRef} position="absolute" inset="0" display={phase === "complete" ? "none" : undefined} pointerEvents="none" aria-hidden="true">
        {layout?.lines.map((line, index) => (
          <Box
            key={`line-${index}`} data-reconstruction-line={index}
            position="absolute" left={`${line.x}px`} top={`${line.y}px`} w={`${line.width}px`} h="1px" opacity={0}
          >
            <Box w="100%" h="1px" transformOrigin="left center" bgImage="linear-gradient(90deg, #BFA07780, #CEB38C50 85%, transparent)" />
            <Box position="absolute" top="-4px" left="0" w="24px" h="9px" borderRadius="50%" bgImage="radial-gradient(ellipse, #D6B87790, #D6B87700 70%)" />
          </Box>
        ))}
        {layout?.cards.map(card => (
          <Box
            key={card.id} data-reconstruction-card={card.id}
            position="absolute" left={`${card.x}px`} top={`${card.y}px`} w={`${card.width}px`} h={`${card.height}px`}
            fontFamily={fontFamily} fontSize="16px" fontWeight="400" lineHeight={`${card.height}px`}
            color="#302A25" whiteSpace="nowrap" opacity={0}
          >
            <Box position="absolute" inset="-2px" border="1px solid #CFBBA080" borderRadius="3px" bgImage="linear-gradient(145deg, #FFFCF3, #F4EBDC)" />
            <Box as="span" position="relative">{card.text}</Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
