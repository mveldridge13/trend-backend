export declare class TransactionAnalyticsDto {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    transactionCount: number;
    averageTransaction: number;
    previousPeriodExpenses: number;
    previousPeriodDiscretionary: number;
    expensesPercentageChange: number;
    categoryBreakdown: {
        categoryId: string;
        categoryName: string;
        categoryIcon?: string;
        categoryColor?: string;
        amount: number;
        transactionCount: number;
        percentage: number;
    }[];
    monthlyTrends: {
        month: string;
        income: number;
        expenses: number;
        discretionaryExpenses: number;
        net: number;
        transactionCount: number;
    }[];
    spendingVelocity: {
        currentMonthSpent: number;
        daysElapsed: number;
        daysInMonth: number;
        dailyAverage: number;
        projectedMonthlySpending: number;
        monthlyBudget?: number;
        velocityStatus: "ON_TRACK" | "SLIGHTLY_HIGH" | "HIGH" | "VERY_HIGH";
        daysToOverspend?: number;
        recommendedDailySpending: number;
    };
    dailyBurnRate: {
        currentDailyBurnRate: number;
        sustainableDailyRate: number;
        daysUntilBudgetExceeded: number | null;
        recommendedDailySpending: number;
        burnRateStatus: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
        weeklyTrend: number[];
        weeklyTrendWithLabels: {
            day: string;
            amount: number;
            isToday: boolean;
        }[];
        projectedMonthlySpending: number;
        monthlyIncomeCapacity: number;
    };
    recentTransactions: {
        totalAmount: number;
        count: number;
        topCategories: string[];
    };
    budgetPerformance?: {
        budgetId: string;
        budgetName: string;
        allocated: number;
        spent: number;
        remaining: number;
        percentageUsed: number;
    }[];
}
