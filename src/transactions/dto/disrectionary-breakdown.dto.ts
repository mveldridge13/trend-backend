export class DiscretionaryBreakdownDto {
  // Selected date/period info
  selectedDate: string;
  selectedPeriod: "daily" | "weekly" | "monthly";
  totalDiscretionaryAmount: number;

  // Individual discretionary transactions for the period
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

  // Category breakdown with subcategories
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    categoryIcon?: string;
    categoryColor?: string;
    amount: number;
    transactionCount: number;
    percentage: number;

    // Subcategory breakdown within this category
    subcategories: {
      subcategoryId?: string;
      subcategoryName: string;
      amount: number;
      transactionCount: number;
      percentage: number; // Percentage within this category
      transactions: {
        id: string;
        date: string;
        amount: number;
        description: string;
        merchant?: string;
      }[];
    }[];

    // All transactions for this category
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

  // Period comparison (previous day/week/month)
  previousPeriod?: {
    date: string;
    totalDiscretionaryAmount: number;
    percentageChange: number;
    topCategories: {
      categoryName: string;
      amount: number;
    }[];
  };

  // Daily insights and recommendations
  insights: {
    type: "info" | "warning" | "success" | "error";
    category?: string;
    title: string;
    message: string;
    suggestion?: string;
    amount?: number;
  }[];

  // Summary statistics for the period
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
      morning: number; // 6-12
      afternoon: number; // 12-18
      evening: number; // 18-24
      night: number; // 0-6
    };
  };
}
