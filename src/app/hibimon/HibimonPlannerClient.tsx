"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { FrogDiaryClueEventModal } from "@/components/game/events/FrogDiaryClueEventModal";
import { OfficeChickenFocusMinigameModal } from "@/components/game/events/OfficeChickenFocusMinigameModal";
import { WorkMinigameTestModal } from "@/components/game/events/WorkMinigameTestModal";
import { WorkPdfExportMinigameModal } from "@/components/game/events/WorkPdfExportMinigameModal";
import { WorkStampMinigameModal } from "@/components/game/events/WorkStampMinigameModal";
import { DiaryOverlay } from "@/components/game/DiaryOverlay";
import { StorySimpleMetroRouteView } from "@/components/game/StorySimpleMetroRouteView";
import { getFrogDiaryClueStageByEventId } from "@/lib/game/frogDiaryClueFlow";
import {
  HIBIMON_PLANNING,
  HIBIMON_STAGE_FIELDS,
  type HibimonAnimal,
  type HibimonStage,
  type HibimonWorkUnit,
} from "@/lib/hibimonPlanning";
import styles from "./page.module.css";

type PreviewModalState = {
  kind: "level" | "diary";
  animal: HibimonAnimal;
  stage: HibimonStage;
  diaryVariant?: "unrestored" | "restored";
};

const GAME_DEVICE_WIDTH = 393;
const GAME_DEVICE_HEIGHT = 852;

const dependentRequestCopy: Record<
  Extract<HibimonWorkUnit, "dependent-cabinet" | "dependent-shredder" | "dependent-files">,
  {
    title: string;
    successRewardLabel: string;
    successFootnote: string;
  }
> = {
  "dependent-cabinet": {
    title: "整理櫃子",
    successRewardLabel: "櫃子整理完成",
    successFootnote: "先用便利貼整理暫代櫃子排序",
  },
  "dependent-shredder": {
    title: "拼回公文",
    successRewardLabel: "公文暫時拼回",
    successFootnote: "先用便利貼整理暫代碎紙拼回",
  },
  "dependent-files": {
    title: "整理會議文件",
    successRewardLabel: "會議文件整理完成",
    successFootnote: "先用便利貼整理暫代文件分類",
  },
};

function TextCell({ value }: { value: string }) {
  if (!value) return <span className={styles.emptyText}>-</span>;
  return <span>{value}</span>;
}

function LevelTag({ stage }: { stage: HibimonStage }) {
  return (
    <span className={stage.playUnit ? styles.playableTag : styles.disabledTag}>
      {stage.playUnit ? "可玩" : "未定"}
    </span>
  );
}

function DiaryCell({
  stage,
  onOpen,
}: {
  stage: HibimonStage;
  onOpen: (variant: "unrestored" | "restored") => void;
}) {
  if (!stage.diaryTarget) return <TextCell value={stage.diary} />;

  return (
    <div className={styles.diaryPreviewCell}>
      <div className={styles.diaryCopy}>
        <TextCell value={stage.diary} />
      </div>
      <div className={styles.diaryActions}>
        <button type="button" className={styles.diaryButton} onClick={() => onOpen("unrestored")}>
          未還原
        </button>
        <button
          type="button"
          className={`${styles.diaryButton} ${styles.diaryButtonPrimary}`}
          onClick={() => onOpen("restored")}
        >
          還原版
        </button>
      </div>
    </div>
  );
}

function CompletionPanel({ onRestart }: { onRestart: () => void }) {
  return (
    <div className={styles.completionPanel}>
      <strong>這個單元已結束</strong>
      <button type="button" onClick={onRestart}>
        重新開始
      </button>
    </div>
  );
}

function WorkUnitPlayer({ unit }: { unit: HibimonWorkUnit }) {
  const [runKey, setRunKey] = useState(0);
  const [isEnded, setIsEnded] = useState(false);

  const restart = () => {
    setIsEnded(false);
    setRunKey((value) => value + 1);
  };

  if (isEnded) return <CompletionPanel onRestart={restart} />;

  const commonProps = {
    key: `${unit}-${runKey}`,
    baseFatigue: 0,
    onSkip: () => setIsEnded(true),
    onComplete: () => setIsEnded(true),
    successSavingsTotal: null,
  };

  if (unit === "office-chicken") return <OfficeChickenFocusMinigameModal {...commonProps} />;
  if (unit === "stamp-documents") return <WorkStampMinigameModal {...commonProps} />;
  if (unit === "export-pdf") return <WorkPdfExportMinigameModal {...commonProps} />;
  if (unit === "sticky-notes") return <WorkMinigameTestModal {...commonProps} />;

  return (
    <WorkMinigameTestModal
      {...commonProps}
      title={dependentRequestCopy[unit].title}
      successRewardLabel={dependentRequestCopy[unit].successRewardLabel}
      successFootnote={dependentRequestCopy[unit].successFootnote}
    />
  );
}

function PlayUnit({ stage }: { stage: HibimonStage }) {
  const unit = stage.playUnit;
  const [runKey, setRunKey] = useState(0);
  const [isEnded, setIsEnded] = useState(false);

  if (!unit) return <CompletionPanel onRestart={() => undefined} />;

  const restart = () => {
    setIsEnded(false);
    setRunKey((value) => value + 1);
  };

  if (isEnded) return <CompletionPanel onRestart={restart} />;

  if (unit.type === "story-route") {
    return (
      <StorySimpleMetroRouteView
        key={`${stage.id}-${runKey}`}
        mode={unit.mode}
      />
    );
  }

  if (unit.type === "frog-event") {
    const frogStage = getFrogDiaryClueStageByEventId(unit.eventId);
    if (!frogStage) return <CompletionPanel onRestart={() => undefined} />;

    return (
      <FrogDiaryClueEventModal
        key={`${stage.id}-${runKey}`}
        stage={frogStage}
        savings={0}
        actionPower={6}
        fatigue={0}
        photoAttemptNumber={unit.photoAttemptNumber}
        requiredPhotoAttempts={3}
        onFirstClueDiaryReveal={(resumeEvent) => resumeEvent()}
        onFinish={() => setIsEnded(true)}
      />
    );
  }

  return <WorkUnitPlayer key={`${stage.id}-${runKey}`} unit={unit.unit} />;
}

function DiaryUnit({
  stage,
  variant,
  onClose,
}: {
  stage: HibimonStage;
  variant: "unrestored" | "restored";
  onClose: () => void;
}) {
  const target = stage.diaryTarget;
  if (!target) return <CompletionPanel onRestart={() => undefined} />;

  const shouldPreviewFrogCompletionFlow =
    variant === "restored" && Boolean(target.restoredFrogCompletionFlowPreview);

  const unlockedEntryIds = Array.from(
    new Set([
      ...(target.unlockedBeforeEntryIds ?? []),
      ...(variant === "restored" ? [target.entryId] : []),
      ...(shouldPreviewFrogCompletionFlow ? ["bai-entry-5" as const] : []),
    ]),
  );
  const shouldPreviewInitialFrogDiaryClue =
    variant === "unrestored" &&
    target.unrestoredView === "entry-bai-2-fragment" &&
    target.unrestoredFrogFragmentPhotoAttemptCount === 0;

  return (
    <DiaryOverlay
      open
      onClose={onClose}
      mode={
        shouldPreviewFrogCompletionFlow
          ? "frog-fragmented-diary"
          : shouldPreviewInitialFrogDiaryClue
            ? "frog-diary-catalog-guide"
            : undefined
      }
      unlockedEntryIds={unlockedEntryIds}
      initialJournalView={variant === "restored" ? target.restoredView : target.unrestoredView}
      onFragmentedDiaryComplete={onClose}
      initialBaiEntry1RestorationPreview={
        variant === "unrestored" && Boolean(target.unrestoredBaiEntry1RestorationPreview)
      }
      previewFrogDiaryFragmentPhotoAttemptCount={
        shouldPreviewFrogCompletionFlow
          ? 3
          : variant === "unrestored"
            ? target.unrestoredFrogFragmentPhotoAttemptCount
            : undefined
      }
    />
  );
}

export default function HibimonPlannerClient() {
  const [previewModal, setPreviewModal] = useState<PreviewModalState | null>(null);
  const [deviceScale, setDeviceScale] = useState(1);

  useEffect(() => {
    const updateDeviceScale = () => {
      const horizontalScale = (window.innerWidth - 32) / GAME_DEVICE_WIDTH;
      const verticalScale = (window.innerHeight - 32) / GAME_DEVICE_HEIGHT;
      setDeviceScale(Math.max(0.36, Math.min(1, horizontalScale, verticalScale)));
    };

    updateDeviceScale();
    window.addEventListener("resize", updateDeviceScale);
    return () => window.removeEventListener("resize", updateDeviceScale);
  }, []);

  const deviceStyle = {
    "--device-scale": deviceScale,
    "--device-width": `${GAME_DEVICE_WIDTH * deviceScale}px`,
    "--device-height": `${GAME_DEVICE_HEIGHT * deviceScale}px`,
  } as CSSProperties;

  return (
    <main className={styles.pageShell}>
      <div className={styles.sheetFrame}>
        <table className={styles.sheetTable}>
          <thead>
            <tr>
              <th>動物</th>
              <th>名字</th>
              <th>型格</th>
              {HIBIMON_STAGE_FIELDS.map((field) => (
                <th key={field.key}>{field.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HIBIMON_PLANNING.map((animal) =>
              animal.stages.map((stage, stageIndex) => (
                <tr key={stage.id}>
                  {stageIndex === 0 ? (
                    <>
                      <td rowSpan={animal.stages.length} className={styles.groupCell}>
                        <TextCell value={animal.animal} />
                      </td>
                      <td rowSpan={animal.stages.length} className={styles.groupCell}>
                        <TextCell value={animal.name} />
                      </td>
                      <td rowSpan={animal.stages.length} className={styles.groupCell}>
                        <TextCell value={animal.temperament} />
                      </td>
                    </>
                  ) : null}
                  {HIBIMON_STAGE_FIELDS.map((field) => (
                    <td
                      key={field.key}
                      className={
                        field.key === "level"
                          ? styles.levelCell
                          : field.key === "diary"
                            ? styles.diaryCell
                            : undefined
                      }
                    >
                      {field.key === "level" ? (
                        <button
                          type="button"
                          className={stage.playUnit ? styles.levelButton : styles.levelButtonDisabled}
                          onClick={() => {
                            if (!stage.playUnit) return;
                            setPreviewModal({ kind: "level", animal, stage });
                          }}
                        >
                          <span>{stage.level || "-"}</span>
                          <LevelTag stage={stage} />
                        </button>
                      ) : field.key === "diary" ? (
                        <DiaryCell
                          stage={stage}
                          onOpen={(diaryVariant) => {
                            setPreviewModal({ kind: "diary", animal, stage, diaryVariant });
                          }}
                        />
                      ) : (
                        <TextCell value={stage[field.key]} />
                      )}
                    </td>
                  ))}
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>

      {previewModal ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setPreviewModal(null)}>
          <div className={styles.deviceViewport} style={deviceStyle} onClick={(event) => event.stopPropagation()}>
            <button className={styles.closeButton} type="button" onClick={() => setPreviewModal(null)}>
              關閉
            </button>
            <section
              className={styles.levelModal}
              role="dialog"
              aria-modal="true"
              aria-label={
                previewModal.kind === "level"
                  ? `${previewModal.animal.animal} ${previewModal.stage.level}`
                  : `${previewModal.animal.animal} ${previewModal.stage.diary} ${
                      previewModal.diaryVariant === "restored" ? "還原版" : "未還原"
                    }`
              }
            >
              <div className={styles.playHost}>
                {previewModal.kind === "level" ? (
                  <PlayUnit stage={previewModal.stage} />
                ) : (
                  <DiaryUnit
                    stage={previewModal.stage}
                    variant={previewModal.diaryVariant ?? "unrestored"}
                    onClose={() => setPreviewModal(null)}
                  />
                )}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </main>
  );
}
