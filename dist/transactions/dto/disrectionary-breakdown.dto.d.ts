export declare class DiscretionaryBreakdownDto {
    selectedDate: string;
    selectedPeriod: "daily" | "weekly" | "monthly";
    totalDiscretionaryAmount: number;
    transactions: {
        id: string;
        date: string;
        amount: number;
        description: string;
        merchant?: string;
        categoryId: string;
        categoryName: string;
        subcategoryId?: string;
        subcategoryName?: string;
    }[];
    categoryBreakdown: {
        categoryId: string;
        categoryName: string;
        categoryIcon?: string;
        categoryColor?: string;
        amount: number;
        transactionCount: number;
        percentage: number;
        subcategories: {
            subcategoryId?: string;
            subcategoryName: string;
            amount: number;
            transactionCount: number;
            percentage: number;
            transactions: {
                id: string;
                date: string;
                amount: number;
                description: string;
                merchant?: string;
            }[];
        }[];
        transactions: {
            id: string;
            date: string;
            amount: number;
            description: string;
            merchant?: string;
            subcategoryId?: string;
            subcategoryName?: string;
        }[];
    }[];
    previousPeriod?: {
        date: string;
        totalDiscretionaryAmount: number;
        percentageChange: number;
        topCategories: {
            categoryName: string;
            amount: number;
        }[];
    };
    insights: {
        type: "info" | "warning" | "success" | "error";
        category?: string;
        title: string;
        message: string;
        suggestion?: string;
        amount?: number;
    }[];
    summary: {
        transactionCount: number;
        averageTransactionAmount: number;
        largestTransaction: {
            id: string;
            amount: number;
            description: string;
            categoryName: string;
        };
        topSpendingCategory: {
            categoryName: string;
            amount: number;
            percentage: number;
        };
        spendingDistribution: {
            morning: number;
            afternoon: number;
            evening: number;
            night: number;
        };
    };
}
