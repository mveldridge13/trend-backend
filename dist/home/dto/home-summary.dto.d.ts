import { IncomeFrequency } from '@prisma/client';
export interface PeriodInfo {
    start: string;
    end: string;
    frequency: IncomeFrequency;
    daysRemaining: number;
    daysTotal: number;
}
export interface IncomeSourceBreakdown {
    id: string;
    name: string;
    amount: number;
}
export interface IncomeInfo {
    baseIncome: number;
    additionalIncome: number;
    rolloverAvailable: number;
    totalInflow: number;
    sources: IncomeSourceBreakdown[];
}
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
export interface DiscretionaryInfo {
    spentSoFar: number;
}
export interface GoalTypeBreakdown {
    plannedTotal: number;
    paidSoFar: number;
}
export interface GoalsInfo {
    plannedTotal: number;
    paidSoFar: number;
    remaining: number;
    byType: {
        debt: GoalTypeBreakdown;
        savings: GoalTypeBreakdown;
    };
}
export interface OutflowsInfo {
    committed: CommittedInfo;
    discretionary: DiscretionaryInfo;
    goals: GoalsInfo;
}
export interface TotalsInfo {
    totalExpensesAllocated: number;
    leftToSpendSafe: number;
}
export interface PotInfo {
    id: string;
    name: string;
    isSalary: boolean;
    received: number;
    spent: number;
    left: number;
    frequency: IncomeFrequency | null;
    nextPaymentDate: string | null;
}
export interface RolloverNotificationInfo {
    amount: number;
    fromPeriod: string;
    createdAt: string;
}
export interface UserInfo {
    isPro: boolean;
    proExpiresAt: string | null;
}
export interface FeatureFlags {
    spendingVelocityDetails: boolean;
    advancedAnalytics: boolean;
    exportData: boolean;
    aiAssistant: boolean;
}
export interface HomeSummaryResponse {
    period: PeriodInfo;
    income: IncomeInfo;
    outflows: OutflowsInfo;
    totals: TotalsInfo;
    pots: PotInfo[];
    rolloverNotification?: RolloverNotificationInfo;
    user: UserInfo;
    features: FeatureFlags;
}
export declare class HomeSummaryQueryDto {
}
