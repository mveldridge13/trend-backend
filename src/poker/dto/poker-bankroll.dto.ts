import { PokerBankrollTransactionType } from "@prisma/client";

export class PokerBankrollTransactionDto {
  id: string;
  userId: string;
  type: PokerBankrollTransactionType;
  amount: number;
  note?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Tier chip shown on the bankroll panel.
// BUILDING  : net profit below original capital (incl. losses) — keep building.
// IN_PROFIT : recouped capital, profit between 1x and 2x capital.
// FREEROLL  : playing on house money (withdrawals >= deposits) OR profit >= 2x capital.
export type PokerBankrollStatus = "BUILDING" | "IN_PROFIT" | "FREEROLL";

export class PokerBankrollDto {
  // Ledger aggregates
  totalDeposits: number; // D
  totalWithdrawals: number; // W
  lifetimeNetProfit: number; // N (from play results, never the ledger)

  // Derived picture
  currentBankroll: number; // B = D - W + N
  originalCapital: number; // C = D
  capitalAtRisk: number; // max(0, D - W) — your own money still in play
  capitalRecouped: number; // min(W, D) — original stake already pulled back out

  // Status / advice
  status: PokerBankrollStatus;
  isFreerolling: boolean; // W >= D and B > 0 — recouped entire stake
  suggestedWithdrawal: number; // advisory amount (#3); user can override

  // Ledger history (most recent first)
  transactions: PokerBankrollTransactionDto[];
}
