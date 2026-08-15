import type { Metadata } from "next";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import {
  AudioLibraryClient,
  type AudioLibraryAsset,
  type AudioLibraryPack,
} from "./AudioLibraryClient";

export const metadata: Metadata = {
  title: "走走小日 | 音效試聽室",
  description: "瀏覽並試聽 Kenney 三套音效素材與 FMOD Studio Bank。",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-static";

const PACKS: Array<AudioLibraryPack & { directory: string }> = [
  {
    id: "interface",
    name: "Interface Sounds",
    shortName: "介面",
    description: "按鈕、確認、錯誤、開關與視窗操作",
    directory: "Audio_interface",
    accent: "#C96F52",
  },
  {
    id: "casino",
    name: "Casino Audio",
    shortName: "卡牌／骰子",
    description: "卡牌、籌碼與骰子的實體操作聲",
    directory: "Audio＿casino",
    accent: "#427D6B",
  },
  {
    id: "rpg",
    name: "RPG Audio",
    shortName: "生活物件",
    description: "書本、衣物、腳步、門與金屬物件",
    directory: "Audio_rpg",
    accent: "#75609A",
  },
];

const USED_ASSETS: Record<
  string,
  { renamedTo: string; use: string }
> = {
  "interface/select_002.ogg": {
    renamedTo: "ui-dialog-continue.ogg",
    use: "對話繼續",
  },
  "interface/drop_001.ogg": {
    renamedTo: "place-tile-drop.ogg",
    use: "地點拼圖：放置或移動",
  },
  "interface/drop_002.ogg": {
    renamedTo: "place-tile-pick-up.ogg",
    use: "路線／地點拼圖：拿起",
  },
  "interface/click_005.ogg": {
    renamedTo: "place-tile-remove.ogg",
    use: "路線／地點拼圖：拖到旁邊移除",
  },
  "casino/card-shuffle.ogg": {
    renamedTo: "card-duel-shuffle.ogg",
    use: "小貝卡牌對決：開局洗牌",
  },
  "casino/card-slide-1.ogg": {
    renamedTo: "card-duel-draft-pick.ogg",
    use: "小貝卡牌對決：拿取公開牌",
  },
  "casino/card-place-2.ogg": {
    renamedTo: "card-duel-play.ogg",
    use: "小貝卡牌對決：出牌",
  },
  "casino/card-fan-1.ogg": {
    renamedTo: "card-duel-reveal.ogg",
    use: "小貝卡牌對決：翻牌揭曉",
  },
  "rpg/cloth2.ogg": {
    renamedTo: "wardrobe-pick-up.ogg",
    use: "衣櫃：拿起衣服",
  },
  "rpg/clothBelt2.ogg": {
    renamedTo: "wardrobe-change.ogg",
    use: "衣櫃：換裝演出",
  },
  "rpg/bookOpen.ogg": {
    renamedTo: "diary-open.ogg",
    use: "日記：打開日記本",
  },
  "rpg/bookFlip2.ogg": {
    renamedTo: "diary-page-turn.ogg",
    use: "日記：目錄與內頁切換",
  },
};

function buildPublicAudioUrl(directory: string, filename: string) {
  return `/sounds/${encodeURIComponent(directory)}/${encodeURIComponent(filename)}`;
}

async function loadPackAssets(
  pack: (typeof PACKS)[number],
): Promise<AudioLibraryAsset[]> {
  const directoryPath = path.join(process.cwd(), "public", "sounds", pack.directory);
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const filenames = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".ogg"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "en", { numeric: true }));

  return Promise.all(
    filenames.map(async (filename) => {
      const fileStat = await stat(path.join(directoryPath, filename));
      const used = USED_ASSETS[`${pack.id}/${filename}`];

      return {
        id: `${pack.id}/${filename}`,
        packId: pack.id,
        filename,
        url: buildPublicAudioUrl(pack.directory, filename),
        bytes: fileStat.size,
        renamedTo: used?.renamedTo,
        use: used?.use,
      };
    }),
  );
}

export default async function AudioLibraryPage() {
  const assets = (await Promise.all(PACKS.map(loadPackAssets))).flat();
  const publicPacks = PACKS.map(({ directory: _directory, ...pack }) => pack);

  return <AudioLibraryClient packs={publicPacks} assets={assets} />;
}
