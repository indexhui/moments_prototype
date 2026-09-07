export const PRIZE_TIERS = ["A", "B", "C", "D"] as const;
export type PrizeTier = (typeof PRIZE_TIERS)[number];
export const INITIAL_PRIZE_STOCK: Record<PrizeTier, number> = { A: 2, B: 3, C: 3, D: 100 };
export const RAFFLE_STORAGE_KEY = "moment:exhibition-raffle-v1";
export const RAFFLE_CHANGE_EVENT = "moment:exhibition-raffle-change";

export type RaffleReceipt = { runId: string; prize: PrizeTier | null; drawnAt: string };
export type RaffleState = {
  version: 1;
  remaining: Record<PrizeTier, number>;
  receipts: RaffleReceipt[];
};

export function initialRaffleState(): RaffleState {
  return { version: 1, remaining: { ...INITIAL_PRIZE_STOCK }, receipts: [] };
}

export function parseRaffleState(raw: string | null): RaffleState {
  if (raw === null) return initialRaffleState();
  const state = JSON.parse(raw) as RaffleState;
  if (state?.version !== 1 || !Array.isArray(state.receipts) ||
    !PRIZE_TIERS.every((tier) => Number.isInteger(state.remaining?.[tier]) &&
      state.remaining[tier] >= 0 && state.remaining[tier] <= INITIAL_PRIZE_STOCK[tier]) ||
    !state.receipts.every((receipt) => typeof receipt?.runId === "string" &&
      typeof receipt.drawnAt === "string" &&
      (receipt.prize === null || PRIZE_TIERS.includes(receipt.prize)))) {
    // Never silently replenish a damaged inventory.
    throw new Error("Invalid raffle inventory");
  }
  return state;
}

/** Each remaining physical prize has one chance. A run can only claim once. */
export function drawFromStock(state: RaffleState, runId: string, random: number, drawnAt: string) {
  if (!runId || !Number.isFinite(random) || random < 0 || random >= 1) throw new Error("Invalid draw");
  const existing = state.receipts.find((receipt) => receipt.runId === runId);
  if (existing) return { state, receipt: existing };
  const total = PRIZE_TIERS.reduce((sum, tier) => sum + state.remaining[tier], 0);
  let index = Math.floor(random * total);
  let prize: PrizeTier | null = null;
  for (const tier of PRIZE_TIERS) {
    if (index < state.remaining[tier]) { prize = tier; break; }
    index -= state.remaining[tier];
  }
  const receipt: RaffleReceipt = { runId, prize, drawnAt };
  const remaining = { ...state.remaining };
  if (prize) remaining[prize] -= 1;
  return { state: { ...state, remaining, receipts: [...state.receipts, receipt] }, receipt };
}

export function loadRaffleState() {
  return parseRaffleState(window.localStorage.getItem(RAFFLE_STORAGE_KEY));
}

async function withInventoryLock<T>(action: () => T): Promise<T> {
  if (navigator.locks) return navigator.locks.request(RAFFLE_STORAGE_KEY, action);
  // The supported exhibition browser must serialize tabs before awarding stock.
  throw new Error("Web Locks unavailable");
}

function saveRaffleState(state: RaffleState) {
  // Stock and receipt are committed together, before any result is displayed.
  window.localStorage.setItem(RAFFLE_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(RAFFLE_CHANGE_EVENT));
}

export async function claimExhibitionPrize(runId: string) {
  return withInventoryLock(() => {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    const result = drawFromStock(loadRaffleState(), runId, bytes[0] / 2 ** 32, new Date().toISOString());
    saveRaffleState(result.state);
    return result.receipt;
  });
}

export async function resetExhibitionPrizes() {
  return withInventoryLock(() => {
    let receipts: RaffleReceipt[] = [];
    try { receipts = loadRaffleState().receipts; } catch { /* Explicit staff reset repairs damaged stock. */ }
    const state = { ...initialRaffleState(), receipts };
    saveRaffleState(state);
    return state;
  });
}
