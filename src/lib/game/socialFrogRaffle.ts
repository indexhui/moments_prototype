import { SOCIAL_FROG_RAFFLE_ENTRIES } from "./socialFrogRaffleEntries";

export const FROG_RAFFLE_STORAGE_KEY = "moment:social-frog-raffle-threads-v4";
export const FROG_RAFFLE_COUNT_KEY = "moment:social-frog-raffle-threads-count-v2";
export const FROG_RAFFLE_TICKET_COUNT = SOCIAL_FROG_RAFFLE_ENTRIES.length;
export const FROG_RAFFLE_MIN_TICKETS = 2;

export type FrogRaffleResult = {
  version: 4;
  ticketCount: number;
  winners: [number, number];
  drawnAt: string;
};

export function ticketNumber(value: number) {
  return String(value).padStart(3, "0");
}

function randomIndex(size: number) {
  const range = 2 ** 32;
  const limit = Math.floor(range / size) * size;
  const bytes = new Uint32Array(1);
  do {
    crypto.getRandomValues(bytes);
  } while (bytes[0] >= limit);
  return bytes[0] % size;
}

/** Two distinct numbered comments from the configured pool, with no modulo bias. */
export function drawFrogRaffle(ticketCount: number): FrogRaffleResult {
  if (!Number.isInteger(ticketCount) || ticketCount < FROG_RAFFLE_MIN_TICKETS || ticketCount > FROG_RAFFLE_TICKET_COUNT) {
    throw new Error("Invalid ticket count");
  }
  const first = randomIndex(ticketCount) + 1;
  const secondIndex = randomIndex(ticketCount - 1) + 1;
  const second = secondIndex >= first ? secondIndex + 1 : secondIndex;
  return { version: 4, ticketCount, winners: [first, second], drawnAt: new Date().toISOString() };
}

export function parseFrogRaffleResult(raw: string | null): FrogRaffleResult | null {
  if (!raw) return null;
  try {
    const result = JSON.parse(raw) as FrogRaffleResult;
    if (result?.version !== 4 || !Number.isInteger(result.ticketCount) ||
      result.ticketCount < FROG_RAFFLE_MIN_TICKETS || result.ticketCount > FROG_RAFFLE_TICKET_COUNT ||
      !Array.isArray(result.winners) || result.winners.length !== 2 ||
      result.winners.some((winner) => !Number.isInteger(winner) || winner < 1 || winner > result.ticketCount) ||
      result.winners[0] === result.winners[1] || typeof result.drawnAt !== "string") return null;
    return result;
  } catch {
    return null;
  }
}

export function parseFrogRaffleCount(raw: string | null) {
  if (raw === null) return FROG_RAFFLE_TICKET_COUNT;
  const count = Number(raw);
  return Number.isInteger(count) && count >= FROG_RAFFLE_MIN_TICKETS && count <= FROG_RAFFLE_TICKET_COUNT
    ? count : FROG_RAFFLE_TICKET_COUNT;
}
