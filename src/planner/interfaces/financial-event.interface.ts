export type FinancialEventDirection = "INFLOW" | "OUTFLOW";

export type FinancialEventSourceType =
  | "PRIMARY_INCOME"
  | "INCOME_SOURCE"
  | "RECURRING_BILL"
  | "PLAN";

/**
 * A single projected money-movement event on the forecast timeline. Produced
 * by aggregating real Income/Bills/Goals data with active (Draft/Planned)
 * Plans — never persisted, computed fresh per forecast request.
 */
export interface FinancialEvent {
  date: string; // ISO date (yyyy-MM-dd), user-timezone bucketed
  amount: number;
  direction: FinancialEventDirection;
  sourceType: FinancialEventSourceType;
  sourceId: string;
  isRequired: boolean; // false for Draft/Planned Plans (hypothetical)
  description: string;
}

export interface DailyBalance {
  date: string;
  balance: number;
}

export interface ForecastResult {
  events: FinancialEvent[];
  dailyBalances: DailyBalance[];
  breaches: DailyBalance[];
}
