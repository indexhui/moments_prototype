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
  description: "瀏覽並試聽遊戲音效素材與 FMOD Studio Bank。",
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
  {
    id: "frog",
    name: "Frog SFX",
    shortName: "青蛙互動",
    description: "泡泡、進食、移動、舌頭、水聲與獎勵回饋",
    directory: "frog_sfx",
    accent: "#5E8F55",
  },
  {
    id: "cozy-ui",
    name: "lolurio Free Cozy Game UI SFX Pack",
    shortName: "Cozy UI",
    description: "選單、遊戲內介面、正負回饋與可愛提示音",
    directory: "lolurio Free Cozy Game UI SFX Pack/OGG",
    accent: "#B56E8F",
  },
  {
    id: "music",
    name: "Background Music",
    shortName: "背景音樂",
    description: "劇情與情境使用的長篇背景曲",
    directory: "music",
    accent: "#4F7896",
  },
];

const FROG_GROUP_LABELS: Record<string, string> = {
  bubble_pop: "泡泡破裂",
  frog_eating: "進食反應",
  movement: "移動跳躍",
  reward_magic: "獎勵魔法",
  tongue_stretch_wet: "舌頭伸縮",
  water: "水中互動",
};

const FROG_RECOMMENDATIONS: Record<string, string> = {
  "bubble_pop/comedy_bubble_pop_003.webm": "泡泡破裂的主要回饋",
  "bubble_pop/zapsplat_cartoon_bubbles_002_26517.webm": "多顆泡泡連鎖破裂",
  "frog_eating/zapsplat_cartoon_animal_lizard_eat_bite_27694.webm": "咬下或吞食目標",
  "frog_eating/zapsplat_cartoon_burp_10461.webm": "吃飽後的搞笑收尾",
  "frog_eating/zapsplat_cartoon_frog_jump_26526.webm": "青蛙招牌跳躍",
  "frog_eating/zapsplat_cartoon_lick_46214.webm": "吐舌命中食物",
  "movement/zapsplat_cartoon_ascend_climb_med_mallet_003_45227.webm": "向上攀爬或連續升高",
  "movement/zapsplat_cartoon_climb_down_descend_fast_steps_ladder_cute_001_38466.webm": "快速下降或回落",
  "movement/zapsplat_cartoon_jump_jaw_harp_edited_003_17209.webm": "短距離彈跳的替代音色",
  "reward_magic/zapsplat_multimedia_game_sound_synth_bright_pluck_digital_award_achievement_001_40711.webm": "吃到目標時的小獎勵",
  "reward_magic/zapsplat_sound_design_magical_rising_twinkling_nostalgic_002_40067.webm": "關卡完成或稀有獎勵",
  "tongue_stretch_wet/zapsplat_cartoon_dribble_squelch.webm": "舌頭黏住或收回",
  "tongue_stretch_wet/zapsplat_cartoon_squelch_003_27596.webm": "舌頭命中的濕黏回饋",
  "tongue_stretch_wet/zapsplat_cartoon_stretch_elastic_or_boing_17683.webm": "舌頭伸長的主要音效",
  "water/zapsplat_nature_water_drip_close_up_001_20094.webm": "場景待機的近距離水滴",
  "water/zapsplat_nature_water_splash_small_item_drop_in_24785.webm": "青蛙或物件落水",
  "water/zapsplat_nature_water_splash_swish_movement_002_24787.webm": "青蛙在水中移動",
};

const USED_ASSETS: Record<
  string,
  { renamedTo: string; use: string }
> = {
  "frog/bubble_pop/dustyroom_cartoon_bubble_pop.webm": {
    renamedTo: "comic-panel-bubble-pop.webm",
    use: "漫畫格：格子出現",
  },
  "frog/reward_magic/zapsplat_multimedia_game_sound_synth_bright_pluck_digital_award_achievement_008_40718.webm": {
    renamedTo: "camera-comic-reveal.webm",
    use: "展覽版捷運：小貝狗拿出相機漫畫格",
  },
  "cozy-ui/UI SFX_FEEDBACK_Negative.ogg": {
    renamedTo: "photo-result-negative.ogg",
    use: "拍照結果：未達要求分數",
  },
  "cozy-ui/UI SFX_FEEDBACK_Woop.ogg": {
    renamedTo: "comic-panel-woop.ogg",
    use: "漫畫格出現音效的備選版本",
  },
  "cozy-ui/UI SFX_InGameMenu_Open.ogg": {
    renamedTo: "photo-result-normal.ogg",
    use: "拍照結果：達標並開始日記揭曉",
  },
  "cozy-ui/UI SFX_MENU_Back.ogg": {
    renamedTo: "UI SFX_MENU_Back.ogg（原檔）",
    use: "小日獸照片：由左往右飛入日記",
  },
  "music/走走小日demo_05.mp3": {
    renamedTo: "走走小日demo_05.mp3",
    use: "展覽版：回憶段落背景音樂",
  },
  "rpg/doorClose_4.ogg": {
    renamedTo: "comic-door-close.ogg",
    use: "展覽版回憶：關門漫畫格",
  },
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
  "interface/drop_004.ogg": {
    renamedTo: "route-depart.ogg",
    use: "安排路線：點擊出發",
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
    use: "日記：點擊「打開日記」、「還原這篇日記」與目錄／內頁切換",
  },
};

function buildPublicAudioUrl(directory: string, relativePath: string) {
  return `/sounds/${[...directory.split("/"), ...relativePath.split("/")]
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

async function listAudioFiles(
  directoryPath: string,
  relativeDirectory = "",
): Promise<string[]> {
  const entries = await readdir(path.join(directoryPath, relativeDirectory), {
    withFileTypes: true,
  });
  const paths = await Promise.all(entries.map(async (entry) => {
    const relativePath = relativeDirectory
      ? `${relativeDirectory}/${entry.name}`
      : entry.name;

    if (entry.isDirectory()) return listAudioFiles(directoryPath, relativePath);
    if (!entry.isFile() || !/\.(ogg|mp3|webm)$/i.test(entry.name)) return [];
    return [relativePath];
  }));

  return paths.flat().sort((left, right) =>
    left.localeCompare(right, "en", { numeric: true }),
  );
}

async function loadPackAssets(
  pack: (typeof PACKS)[number],
): Promise<AudioLibraryAsset[]> {
  const directoryPath = path.join(process.cwd(), "public", "sounds", pack.directory);
  const filenames = await listAudioFiles(directoryPath);

  return Promise.all(
    filenames.map(async (filename) => {
      const fileStat = await stat(path.join(directoryPath, filename));
      const used = USED_ASSETS[`${pack.id}/${filename}`];
      const groupId = filename.includes("/") ? filename.split("/")[0] : undefined;

      return {
        id: `${pack.id}/${filename}`,
        packId: pack.id,
        filename,
        url: buildPublicAudioUrl(pack.directory, filename),
        bytes: fileStat.size,
        group: groupId ? FROG_GROUP_LABELS[groupId] : undefined,
        renamedTo: used?.renamedTo,
        use: used?.use,
        recommendation: pack.id === "frog"
          ? FROG_RECOMMENDATIONS[filename]
          : undefined,
      };
    }),
  );
}

export default async function AudioLibraryPage() {
  const assets = (await Promise.all(PACKS.map(loadPackAssets))).flat();
  const publicPacks = PACKS.map(({ directory: _directory, ...pack }) => pack);

  return <AudioLibraryClient packs={publicPacks} assets={assets} />;
}
