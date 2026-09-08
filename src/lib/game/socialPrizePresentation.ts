export const SOCIAL_PRIZE_PRESENTATION_COMMAND = "moment:social-prize-presentation-command";
export type SocialPrizePresentationStart = "ticket" | "prizes";

export function replaySocialPrizePresentation(start: SocialPrizePresentationStart) {
  window.dispatchEvent(new CustomEvent(SOCIAL_PRIZE_PRESENTATION_COMMAND, { detail: start }));
}
