import { TransactionsRepository } from "./repositories/transactions.repository";
import { UsersRepository } from "../users/repositories/users.repository";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionDto } from "./dto/transaction.dto";
import { TransactionFilterDto } from "./dto/transaction-filter.dto";
import { TransactionAnalyticsDto } from "./dto/transaction-analytics.dto";
import { DayTimePatternsResponseDto } from "./dto/day-time-patterns.dto";
import { DateService } from "../common/services/date.service";
import { CurrencyService } from "../common/services/currency.service";
interface DiscretionaryBreakdownDto {
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
export declare class TransactionsService {
    private readonly transactionsRepository;
    private readonly usersRepository;
    private readonly dateService;
    private readonly currencyService;
    constructor(transactionsRepository: TransactionsRepository, usersRepository: UsersRepository, dateService: DateService, currencyService: CurrencyService);
    create(userId: string, createTransactionDto: CreateTransactionDto): Promise<TransactionDto>;
    findAll(userId: string, filters: TransactionFilterDto): Promise<{
        transactions: TransactionDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, userId: string): Promise<TransactionDto>;
    update(id: string, userId: string, updateTransactionDto: UpdateTransactionDto): Promise<TransactionDto>;
    private createNextRecurringTransaction;
    private calculateNextDueDate;
    remove(id: string, userId: string): Promise<void>;
    getAnalytics(userId: string, filters?: Partial<TransactionFilterDto>): Promise<TransactionAnalyticsDto>;
    getDiscretionaryBreakdown(userId: string, filters?: Partial<TransactionFilterDto>): Promise<DiscretionaryBreakdownDto>;
    getBillsAnalytics(userId: string, filters?: Partial<TransactionFilterDto>): Promise<any>;
    getDayTimePatterns(userId: string, filters?: Partial<TransactionFilterDto>): Promise<DayTimePatternsResponseDto>;
    private calculateWeekdayVsWeekendBreakdown;
    private calculateDayOfWeekBreakdown;
    private calculateTimeOfDayBreakdown;
    private calculateHourlyBreakdown;
    private calculateDayTimePatternSummary;
    private generateDayTimePatternInsights;
    private calculateDayTimePreviousPeriod;
    private determinePeriodType;
    private filterTransactionsForPeriod;
    private calculateCategoryBreakdown;
    private matchSubcategory;
    private calculatePreviousPeriodComparison;
    private generateDiscretionaryInsights;
    private calculateDiscretionarySummary;
    private validateTransactionAmount;
    private calculateTransactionStatus;
    private mapToDto;
    private calculateDailyBurnRate;
    private calculateMonthlyRecurringExpenses;
    private calculateDiscretionaryTrends;
    private calculateSpendingVelocity;
    private calculateTrends;
    private calculateAnalytics;
    getIncomeAnalytics(userId: string, filters?: Partial<TransactionFilterDto>): Promise<any>;
    private calculatePayPeriodInfo;
    private generateIncomeInsights;
    private generateCategoryColor;
}
export {};
