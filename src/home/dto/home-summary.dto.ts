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
 * Per-source breakdown of this period's additional income
 * (sum of INCOME transactions linked to each IncomeSource)
 */
export interface IncomeSourceBreakdown {
  id: string;
  name: string;
  amount: number;
}

/**
 * Income breakdown for the pay period
 */
export interface IncomeInfo {
  baseIncome: number;
  additionalIncome: number;
  rolloverAvailable: number;
  totalInflow: number;
  sources: IncomeSourceBreakdown[];
}

/**
 * Committed expenses (recurring bills, scheduled payments)
 */
/**
 * A single committed bill/obligation making up the committed total.
 * `status` is the computed display status (PAID / UPCOMING / OVERDUE).
 */
export interface CommittedItem {
  id: string;
  description: string;
  amount: number;
  status: string | null;
  date: string;
  dueDate: string | null;
  categoryName: string | null;
}

export interface CommittedInfo {
  plannedTotal: number;
  paidSoFar: number;
  remaining: number;
  items: CommittedItem[];
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
 * A spendable account in the per-source ledger view.
 * The primary (salary) account holds base income + rollover + unattributed
 * income and pays for all unattributed spending; each income source is its own
 * account, fed by its attributed INCOME transactions and drained by attributed
 * spending. Attribution only — the accounts always sum to the single spendable
 * total.
 */
export interface AccountInfo {
  id: string; // 'salary' or the IncomeSource id
  name: string;
  isSalary: boolean;
  received: number; // inflow into this account this period (salary includes rollover)
  // Same three expense buckets the main balance card shows, but restricted to
  // spending attributed to this account (unattributed spending falls to salary).
  committed: number; // committed bills planned this period (recurring / has due date)
  discretionary: number; // one-off discretionary spend
  goals: number; // goal contributions funded from this account
  spent: number; // committed + discretionary + goals (this account's Total Expenses)
  left: number; // received - spent; may be negative (over-spent)
  frequency: IncomeFrequency | null;
  nextPaymentDate: string | null;
}

/**
 * Rollover notification for UI banner
 * Shows when funds were automatically rolled over from previous period
 */
export interface RolloverNotificationInfo {
  amount: number;
  fromPeriod: string;
  createdAt: string;
}

/**
 * User subscription and profile info
 */
export interface UserInfo {
  isPro: boolean;
  proExpiresAt: string | null;
}

/**
 * Feature flags based on subscription status
 */
export interface FeatureFlags {
  spendingVelocityDetails: boolean;
  advancedAnalytics: boolean;
  exportData: boolean;
  aiAssistant: boolean;
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
  // Per-source ledger of accounts; present (length >= 2) only when the user
  // has income sources — otherwise [] and clients render the single-card view
  accounts: AccountInfo[];
  rolloverNotification?: RolloverNotificationInfo;  // Present if rollover occurred and not dismissed
  user: UserInfo;
  features: FeatureFlags;
}

/**
 * DTO class for validation (if needed for query params)
 */
export class HomeSummaryQueryDto {
  // Future: could add period selection (current, previous, etc.)
}
