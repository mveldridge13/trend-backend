import { IncomeFrequency } from '@prisma/client';

/**
 * Period information for the current pay period
 */
export interface PeriodInfo {
  start: string;
  end: string;
  frequency: IncomeFrequency;
  daysRemaining: number;
  daysTotal: number;
}

/**
 * Income breakdown for the pay period
 */
export interface IncomeInfo {
  baseIncome: number;
  additionalIncome: number;
  rolloverAvailable: number;
  totalInflow: number;
}

/**
 * Committed expenses (recurring bills, scheduled payments)
 */
export interface CommittedInfo {
  plannedTotal: number;
  paidSoFar: number;
  remaining: number;
}

/**
 * Discretionary spending (one-time, non-recurring)
 */
export interface DiscretionaryInfo {
  spentSoFar: number;
}

/**
 * Goal payment breakdown by type
 */
export interface GoalTypeBreakdown {
  plannedTotal: number;
  paidSoFar: number;
}

/**
 * Goals outflow information
 */
export interface GoalsInfo {
  plannedTotal: number;
  paidSoFar: number;
  remaining: number;
  byType: {
    debt: GoalTypeBreakdown;
    savings: GoalTypeBreakdown;
  };
}

/**
 * All outflows grouped
 */
export interface OutflowsInfo {
  committed: CommittedInfo;
  discretionary: DiscretionaryInfo;
  goals: GoalsInfo;
}

/**
 * Final totals for the balance card
 */
export interface TotalsInfo {
  totalExpensesAllocated: number;  // committed.plannedTotal + discretionary.spentSoFar + goals.paidSoFar
  leftToSpendSafe: number;
}

/**
 * Complete home summary response
 * This is the single source of truth for the Balance Card
 */
export interface HomeSummaryResponse {
  period: PeriodInfo;
  income: IncomeInfo;
  outflows: OutflowsInfo;
  totals: TotalsInfo;
}

/**
 * DTO class for validation (if needed for query params)
 */
export class HomeSummaryQueryDto {
  // Future: could add period selection (current, previous, etc.)
}
