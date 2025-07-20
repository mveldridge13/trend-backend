import { TransactionsService } from "./transactions.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionFilterDto } from "./dto/transaction-filter.dto";
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    create(req: any, createTransactionDto: CreateTransactionDto): Promise<import("./dto/transaction.dto").TransactionDto>;
    findAll(req: any, filters: TransactionFilterDto): Promise<{
        transactions: import("./dto/transaction.dto").TransactionDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getAnalytics(req: any, filters: TransactionFilterDto): Promise<import("./dto/transaction-analytics.dto").TransactionAnalyticsDto>;
    getDiscretionaryBreakdown(req: any, filters: TransactionFilterDto): Promise<any>;
    getDayTimePatterns(req: any, filters: TransactionFilterDto): Promise<any>;
    getBillsAnalytics(req: any, filters: TransactionFilterDto): Promise<any>;
    getIncomeAnalytics(req: any, filters: TransactionFilterDto): Promise<any>;
    getSummary(req: any, filters: TransactionFilterDto): Promise<{
        totalIncome: number;
        totalExpenses: number;
        netIncome: number;
        transactionCount: number;
        recentTransactions: {
            totalAmount: number;
            count: number;
            topCategories: string[];
        };
    }>;
    getRecent(req: any): Promise<import("./dto/transaction.dto").TransactionDto[]>;
    findOne(req: any, id: string): Promise<import("./dto/transaction.dto").TransactionDto>;
    update(req: any, id: string, updateTransactionDto: UpdateTransactionDto): Promise<import("./dto/transaction.dto").TransactionDto>;
    remove(req: any, id: string): Promise<void>;
    getByCategory(req: any, categoryId: string, filters: TransactionFilterDto): Promise<{
        transactions: import("./dto/transaction.dto").TransactionDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getByBudget(req: any, budgetId: string, filters: TransactionFilterDto): Promise<{
        transactions: import("./dto/transaction.dto").TransactionDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    search(req: any, searchDto: {
        query: string;
        filters?: Partial<TransactionFilterDto>;
    }): Promise<{
        transactions: import("./dto/transaction.dto").TransactionDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
