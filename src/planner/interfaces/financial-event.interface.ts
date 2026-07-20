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

export type InsightSeverity = "positive" | "warning" | "neutral";

/**
 * A single schedule-level observation about one active plan's consequences -
 * "what changed" in terms a user actually cares about (clustering, income
 * timing, period shift, risk), not a bare balance delta. See
 * CashFlowEngineService.buildInsights.
 */
export interface PlanInsight {
  planId: string;
  severity: InsightSeverity;
  message: string;
}

export interface ForecastResult {
  events: FinancialEvent[];
  dailyBalances: DailyBalance[];
  breaches: DailyBalance[];
  // Same projection with all active (Draft/Planned) Plans excluded - "if I
  // change nothing." Lets the frontend show the consequence of a what-if
  // (lowest balance, buffer breaches) relative to doing nothing, not just
  // the absolute forecast.
  baselineDailyBalances: DailyBalance[];
  baselineBreaches: DailyBalance[];
  insights: PlanInsight[];
}
