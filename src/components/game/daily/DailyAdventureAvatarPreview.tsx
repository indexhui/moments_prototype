import { Box } from "@chakra-ui/react";
import {
  getDailyAdventureAvatarLayerPaths,
  type DailyAdventureAvatarConfig,
} from "@/lib/game/dailyAdventureProfile";

export function DailyAdventureAvatarPreview({
  avatar,
  name = "玩家角色",
  size = "220px",
  background = "#DDE8D4",
}: {
  avatar: DailyAdventureAvatarConfig;
  name?: string;
  size?: string;
  background?: string;
}) {
  const layers = getDailyAdventureAvatarLayerPaths(avatar);

  return (
    <Box
      position="relative"
      w={size}
      h={size}
      flexShrink={0}
      overflow="hidden"
      borderRadius="50%"
      bgColor={background}
      role="img"
      aria-label={`${name}的角色造型`}
    >
      {layers.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            zIndex: index + 1,
          }}
        />
      ))}
    </Box>
  );
}
