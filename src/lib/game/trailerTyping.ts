import { getTypingAdvance } from "./dialogTyping";

/** One recording clock: pause, seek, replay and duration scaling also control the typewriter. */
export function sampleTrailerTyping(text: string | null, elapsed: number, phaseDuration: number) {
  const count = Array.from(text ?? "").length;
  const delay = Math.min(.09, phaseDuration * .15);
  // Finish within 65% of each shot, leaving the rest for reading in every language.
  const typingDuration = Math.min(Math.max(0, count - 1) * getTypingAdvance("char", "").delay / 1000,
    Math.max(0, phaseDuration * .65 - delay));
  const interval = count > 1 ? typingDuration / (count - 1) : 0;
  const age = elapsed - delay;
  const visibleCharacters = age < 0 ? 0 : Math.min(count, interval > 0 ? 1 + Math.floor((age + 1e-9) / interval) : count);
  return { dialogueVisibleCharacters: visibleCharacters, dialogueComplete: text !== null && visibleCharacters === count };
}
