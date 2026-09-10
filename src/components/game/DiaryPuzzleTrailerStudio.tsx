"use client";

import { useMemo, useState } from "react";
import { DIARY_PUZZLE_ART as ART, DIARY_PUZZLE_BEATS, DIARY_PUZZLE_DRAG, DIARY_PUZZLE_MOVES, DEFAULT_DIARY_PUZZLE_DURATION, buildDiaryPuzzleTrailerText, sampleDiaryPuzzleTrailer, sampleDiaryPuzzleTrailerText } from "@/lib/game/diaryPuzzleTrailer";
import { TRAILER_COPY } from "@/lib/game/trailerI18n";
import { useExhibitionLocale } from "./ExhibitionLocaleContext";
import { playGameSfx } from "@/lib/game/soundEffects";
import { TrailerRecordingStudio } from "./TrailerRecordingStudio";
import studioStyles from "./TrailerRecordingStudio.module.css";
import styles from "./DiaryPuzzleTrailerStudio.module.css";

const ASSETS = Object.values(ART).flat();
const seconds = (value: number) => `${value.toFixed(1)} 秒`;
const playDrop = () => { playGameSfx("diaryPuzzleMoveComplete"); };

export function DiaryPuzzleStage({ time, duration }: { time: number; duration: number }) {
  const locale = useExhibitionLocale();
  const diaryText = TRAILER_COPY.diaryText[locale];
  const title = TRAILER_COPY.diaryTitle[locale];
  const text = useMemo(() => buildDiaryPuzzleTrailerText(diaryText, locale), [diaryText, locale]);
  const sample = sampleDiaryPuzzleTrailer(time, duration);
  const textTiles = sampleDiaryPuzzleTrailerText(text, sample);
  return <section className={styles.scene} aria-label="搬家第一篇日記自動拼圖演出"
    data-diary-trailer-phase={sample.phase} data-diary-completed-moves={sample.completedMoves}>
    <img className={styles.panorama} src={ART.panorama} alt="搬家全幅空景" draggable={false}
      data-diary-panorama-x={sample.panoramaX} style={{ transform: `translateX(${sample.panoramaX / 19.2}cqw)` }} />
    <article className={styles.diary} aria-label="搬家第一篇">
      <div className={styles.paper} aria-hidden="true">
        <img className={styles.paperTop} src={ART.paper[0]} alt="" />
        <div className={styles.paperMiddle} style={{ backgroundImage: `url("${ART.paper[1]}")` }} />
        <img className={styles.paperBottom} src={ART.paper[2]} alt="" />
      </div>
      <div className={styles.content}>
        <h2 className={styles.title} aria-label={sample.titleProgress < 1 ? "???" : title}>
          <span style={{ opacity: 1 - sample.titleProgress }}>???</span>
          <span className={styles.restoredTitle} style={{ opacity: sample.titleProgress }}>{title}</span>
        </h2>
        <div className={styles.picture} aria-label="兩層四格拼圖" data-diary-puzzle-board="true">
          {sample.layers.map((layer, layerIndex) => layer.visible && <div className={styles.layer} key={layerIndex}
            data-diary-layer={layerIndex} data-diary-layer-order={layer.order.join(",")} data-diary-layer-solved={layer.solved}
            style={{ opacity: layer.opacity, zIndex: layerIndex + 1 }}>
            {layer.pieces.map((piece) => <div className={styles.piece} key={piece.id}
              data-diary-piece={piece.id} data-diary-piece-x={piece.x} data-diary-piece-y={piece.y}
              data-diary-piece-moving={piece.moving} style={{
                left: `${piece.x * 50}%`, top: `${piece.y * 50}%`,
                backgroundImage: `url("${ART.layers[layerIndex]}")`,
                backgroundPosition: `${piece.id % 2 * 100}% ${Math.floor(piece.id / 2) * 100}%`,
                zIndex: piece.moving ? 3 : 1,
                transform: `scale(${1 + piece.lift * 0.012})`,
                boxShadow: `0 ${piece.lift * 0.3}cqw ${piece.lift * 0.5}cqw rgba(80,72,60,${piece.lift * 0.24})`,
              }}>
              <div className={styles.pieceEdge} style={{ opacity: (1 - layer.settled) * 0.65 }} />
            </div>)}
          </div>)}
          {sample.target && <div className={styles.target} style={{ left: `${sample.target.x * 50}%`, top: `${sample.target.y * 50}%`, opacity: sample.target.opacity }} />}
          <img className={styles.hand} src={ART.pointer} alt="手指自動拖曳拼圖" draggable={false}
            aria-hidden={sample.hand.opacity === 0} data-diary-hand-pressed={sample.hand.pressed}
            style={{ left: `${sample.hand.x * 50}%`, top: `${sample.hand.y * 50}%`, opacity: sample.hand.opacity,
              transform: `translate(-40%, -6%) scale(${sample.hand.scale})` }} />
        </div>
        <p className={styles.text} aria-label={diaryText}
          data-diary-text-grid="true" style={{ height: `${text.height / text.width * 37.5}cqw` }}>
          {textTiles.map((tile) => <span className={styles.character} key={tile.index} aria-hidden="true"
            data-diary-text-index={tile.index} data-diary-text-layer={tile.layer} data-diary-text-piece={tile.piece}
            data-diary-text-progress={tile.progress} data-diary-text-dragging={tile.dragging}
            data-diary-text-state={tile.merge === 1 ? "merged" : tile.restored ? "restored" : "fragmented"}
            style={{
              left: `${tile.left / text.width * 100}%`, top: `${tile.top / text.width * 37.5}cqw`,
              width: `${tile.width / text.width * 37.5}cqw`, height: `${tile.height / text.width * 37.5}cqw`,
              fontSize: `${tile.fontSize / text.width * 37.5}cqw`,
              color: tile.restored ? "#4D4945" : "#55736E",
              opacity: tile.text.trim() ? tile.opacity * (tile.restored || tile.dragging ? 1 : 0.78) : 0,
              backgroundColor: tile.restored ? `rgba(247,245,242,${1 - tile.merge})` : tile.dragging ? "#C9E2DD" : "#DDEBE8",
              borderRadius: `${(1 - tile.merge) * 0.447761}cqw`, zIndex: tile.dragging ? 2 : 1,
            }}>{tile.text}</span>)}
        </p>
      </div>
    </article>
  </section>;
}

export function DiaryPuzzleTrailerStudio() {
  const [duration, setDuration] = useState(DEFAULT_DIARY_PUZZLE_DURATION);
  const scaled = (time: number) => time * duration / DEFAULT_DIARY_PUZZLE_DURATION;
  const soundCues = useMemo(() => DIARY_PUZZLE_MOVES.map((move) =>
    (move.at + DIARY_PUZZLE_DRAG.drop) * duration / DEFAULT_DIARY_PUZZLE_DURATION), [duration]);
  return <TrailerRecordingStudio id="diary-puzzle" title="搬家日記・自動拼圖" badge="16:9 · 全幅移動背景"
    duration={duration} assets={ASSETS} soundCues={soundCues} playCue={playDrop} soundLabel="拼圖音效"
    description="搬家第一篇：手指依序拼好背景、人物兩層，文字跟著歸位；全幅空景從右向左移動，最後停留在還原的日記。"
    timelineHint={<>背景拼圖 → 人物拼圖 {seconds(scaled(DIARY_PUZZLE_BEATS.secondLayer))} → 還原定格 {seconds(scaled(DIARY_PUZZLE_BEATS.restored))}</>}
    settings={(reset) => <>
      <button onClick={() => { reset(); setDuration(DEFAULT_DIARY_PUZZLE_DURATION); }}>8 秒預設</button>
      <label className={studioStyles.setting}>演出總長<input type="range" min="5.5" max="14" step="0.5" value={duration}
        onChange={(event) => { reset(); setDuration(Number(event.target.value)); }} /><output>{seconds(duration)}</output></label>
    </>}
  >{({ time }) => <DiaryPuzzleStage time={time} duration={duration} />}</TrailerRecordingStudio>;
}
