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
 * One line item behind an insight's headline number (e.g. one of the "N
 * payments" in a bill-clustering warning) - lets the frontend render a
 * breakdown without re-deriving it from raw events. "committed" mirrors
 * FinancialEvent.isRequired (a real, already-scheduled bill); "discretionary"
 * is a Draft/Planned Plan - hypothetical, not yet real, regardless of the
 * plan's type (a PURCHASE plan is discretionary spend, not a committed one).
 */
export interface PlanInsightBreakdownItem {
  id: string;
  name: string;
  amount: number;
  date: string; // ISO date (yyyy-MM-dd)
  kind: "committed" | "discretionary";
}

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
  // Present only for insights with a drill-down breakdown (currently just
  // bill clustering).
  breakdown?: PlanInsightBreakdownItem[];
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
