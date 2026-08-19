"use client";

import NextLink from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiCheck,
  FiMusic,
  FiPause,
  FiPlay,
  FiSearch,
  FiStar,
  FiVolume2,
} from "react-icons/fi";
import { stopFmodWebEvent } from "@/lib/game/fmodWeb";
import { FmodBankPanel } from "./FmodBankPanel";
import styles from "./audio-library.module.css";

export type AudioLibraryPack = {
  id: "interface" | "casino" | "rpg" | "frog" | "music";
  name: string;
  shortName: string;
  description: string;
  accent: string;
};

export type AudioLibraryAsset = {
  id: string;
  packId: AudioLibraryPack["id"];
  filename: string;
  url: string;
  bytes: number;
  group?: string;
  renamedTo?: string;
  use?: string;
  recommendation?: string;
};

type PackFilter = "all" | AudioLibraryPack["id"];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
}

export function AudioLibraryClient({
  packs,
  assets,
}: {
  packs: AudioLibraryPack[];
  assets: AudioLibraryAsset[];
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [packFilter, setPackFilter] = useState<PackFilter>("all");
  const [query, setQuery] = useState("");
  const [usedOnly, setUsedOnly] = useState(false);
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const [activeAsset, setActiveAsset] = useState<AudioLibraryAsset | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();

  const packById = useMemo(
    () => new Map(packs.map((pack) => [pack.id, pack])),
    [packs],
  );

  const packCounts = useMemo(() => {
    const counts = new Map<AudioLibraryPack["id"], number>();
    for (const asset of assets) {
      counts.set(asset.packId, (counts.get(asset.packId) ?? 0) + 1);
    }
    return counts;
  }, [assets]);

  const visibleAssets = useMemo(() => {
    const filteredAssets = assets.filter((asset) => {
        if (packFilter !== "all" && asset.packId !== packFilter) return false;
        if (usedOnly && !asset.renamedTo) return false;
        if (recommendedOnly && !asset.recommendation) return false;
        if (!normalizedQuery) return true;
        return [
          asset.filename,
          asset.group,
          asset.renamedTo,
          asset.use,
          asset.recommendation,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery));
      });

    if (packFilter !== "frog") return filteredAssets;

    return filteredAssets.toSorted((left, right) => {
      const recommendationOrder = Number(Boolean(right.recommendation))
        - Number(Boolean(left.recommendation));
      return recommendationOrder || left.id.localeCompare(right.id, "en", { numeric: true });
    });
  }, [assets, normalizedQuery, packFilter, recommendedOnly, usedOnly]);

  const toggleAsset = async (asset: AudioLibraryAsset) => {
    const audio = audioRef.current;
    if (!audio) return;

    stopFmodWebEvent();

    if (activeAsset?.id === asset.id) {
      if (audio.paused) {
        try {
          await audio.play();
        } catch {
          setIsPlaying(false);
        }
      } else {
        audio.pause();
      }
      return;
    }

    audio.pause();
    audio.src = asset.url;
    audio.currentTime = 0;
    setActiveAsset(asset);

    try {
      await audio.play();
    } catch {
      setIsPlaying(false);
    }
  };

  const stopNativeAudio = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setActiveAsset(null);
    setIsPlaying(false);
  };

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <NextLink className={styles.backLink} href="/trial/dev">
            <FiArrowLeft aria-hidden="true" />
            回到開發入口
          </NextLink>

          <div className={styles.eyebrow}>
            <FiVolume2 aria-hidden="true" />
            SOUND ASSET BROWSER
          </div>
          <h1>音效試聽室</h1>
          <p>
            瀏覽短音效素材與一組 FMOD Bank。點任何一支即可播放，再點一次暫停。
          </p>

          <div className={styles.heroStats}>
            <span><strong>{packs.length}</strong> 套素材包</span>
            <span><strong>{assets.length}</strong> 支音效</span>
            <span><strong>{assets.filter((asset) => asset.renamedTo).length}</strong> 支已採用</span>
            <span><strong>{assets.filter((asset) => asset.recommendation).length}</strong> 支建議候選</span>
            <span><strong>1</strong> 組 FMOD Bank</span>
          </div>
        </div>
      </header>

      <main className={styles.content}>
        <section className={styles.packSummary} aria-label="素材包摘要">
          {packs.map((pack) => (
            <button
              key={pack.id}
              type="button"
              className={`${styles.packCard} ${packFilter === pack.id ? styles.packCardActive : ""}`}
              style={{ "--pack-accent": pack.accent } as React.CSSProperties}
              onClick={() => setPackFilter((current) => (current === pack.id ? "all" : pack.id))}
            >
              <span className={styles.packDot} />
              <span className={styles.packCopy}>
                <strong>{pack.name}</strong>
                <small>{pack.description}</small>
              </span>
              <b>{packCounts.get(pack.id) ?? 0}</b>
            </button>
          ))}
        </section>

        <FmodBankPanel onBeforePlay={stopNativeAudio} />

        <section className={styles.browserPanel}>
          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <FiSearch aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜尋檔名或使用環節…"
                aria-label="搜尋音效"
              />
            </label>

            <label className={styles.usedToggle}>
              <input
                type="checkbox"
                checked={usedOnly}
                onChange={(event) => {
                  setUsedOnly(event.target.checked);
                  if (event.target.checked) setRecommendedOnly(false);
                }}
              />
              <span><FiCheck aria-hidden="true" /></span>
              只看已採用
            </label>

            <label className={`${styles.usedToggle} ${styles.recommendedToggle}`}>
              <input
                type="checkbox"
                checked={recommendedOnly}
                onChange={(event) => {
                  setRecommendedOnly(event.target.checked);
                  if (event.target.checked) setUsedOnly(false);
                }}
              />
              <span><FiStar aria-hidden="true" /></span>
              只看建議
            </label>
          </div>

          <div className={styles.filterTabs} role="tablist" aria-label="音效分類">
            <button
              type="button"
              role="tab"
              aria-selected={packFilter === "all"}
              onClick={() => setPackFilter("all")}
            >
              全部 <span>{assets.length}</span>
            </button>
            {packs.map((pack) => (
              <button
                key={pack.id}
                type="button"
                role="tab"
                aria-selected={packFilter === pack.id}
                onClick={() => setPackFilter(pack.id)}
              >
                {pack.shortName} <span>{packCounts.get(pack.id) ?? 0}</span>
              </button>
            ))}
          </div>

          <div className={styles.resultLine}>
            <span>顯示 {visibleAssets.length} 支</span>
            {normalizedQuery ? <span>搜尋「{query.trim()}」</span> : null}
          </div>

          {visibleAssets.length ? (
            <div className={styles.soundGrid}>
              {visibleAssets.map((asset) => {
                const pack = packById.get(asset.packId)!;
                const isActive = activeAsset?.id === asset.id;
                const showPause = isActive && isPlaying;

                return (
                  <button
                    key={asset.id}
                    type="button"
                    className={`${styles.soundCard} ${isActive ? styles.soundCardActive : ""}`}
                    style={{ "--pack-accent": pack.accent } as React.CSSProperties}
                    onClick={() => void toggleAsset(asset)}
                    aria-label={`${showPause ? "暫停" : "播放"}${asset.filename}`}
                  >
                    <span className={styles.playButton} aria-hidden="true">
                      {showPause ? <FiPause /> : <FiPlay />}
                    </span>
                    <span className={styles.soundInfo}>
                      <strong title={asset.filename}>{asset.filename}</strong>
                      <small>
                        <span>{asset.group ?? pack.shortName}</span>
                        {formatFileSize(asset.bytes)}
                      </small>
                      {asset.renamedTo ? (
                        <span className={styles.usedInfo}>
                          <i><FiCheck /> 已採用</i>
                          <b>{asset.use}</b>
                          <em>→ {asset.renamedTo}</em>
                        </span>
                      ) : null}
                      {asset.recommendation ? (
                        <span className={styles.recommendedInfo}>
                          <i><FiStar /> 建議採用</i>
                          <b>{asset.recommendation}</b>
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <FiMusic aria-hidden="true" />
              <strong>找不到符合條件的音效</strong>
              <span>換個關鍵字，或取消目前的篩選條件。</span>
            </div>
          )}
        </section>
      </main>

      <footer className={`${styles.playerDock} ${activeAsset ? styles.playerDockVisible : ""}`}>
        <div className={styles.playerInfo}>
          <span className={styles.nowPlayingIcon}><FiMusic aria-hidden="true" /></span>
          <span>
            <small>{activeAsset ? packById.get(activeAsset.packId)?.name : "尚未選擇"}</small>
            <strong>{activeAsset?.filename ?? "點選一支音效開始試聽"}</strong>
          </span>
        </div>
        <audio
          ref={audioRef}
          controls
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onError={() => setIsPlaying(false)}
        />
      </footer>
    </div>
  );
}
