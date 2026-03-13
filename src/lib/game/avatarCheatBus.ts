import type { AvatarMotionId } from "@/lib/game/avatarPerformance";

export const GAME_AVATAR_MOTION_TRIGGER = "moment:avatar-motion-trigger";
export const GAME_AVATAR_EXPRESSION_TRIGGER = "moment:avatar-expression-trigger";

export type AvatarMotionPayload = {
  motionId: AvatarMotionId;
};

export type AvatarExpressionPayload = {
  frameIndex: number;
};
