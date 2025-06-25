import { TransactionsRepository } from "./repositories/transactions.repository";
import { UsersRepository } from "../users/repositories/users.repository";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionDto } from "./dto/transaction.dto";
import { TransactionFilterDto } from "./dto/transaction-filter.dto";
import { TransactionAnalyticsDto } from "./dto/transaction-analytics.dto";
export declare class TransactionsService {
    private readonly transactionsRepository;
    private readonly usersRepository;
    constructor(transactionsRepository: TransactionsRepository, usersRepository: UsersRepository);
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
    remove(id: string, userId: string): Promise<void>;
    getAnalytics(userId: string, filters?: Partial<TransactionFilterDto>): Promise<TransactionAnalyticsDto>;
    private validateTransactionAmount;
    private validateTransactionDate;
    private mapToDto;
    private calculateDailyBurnRate;
    private calculateMonthlyRecurringExpenses;
    private calculateDiscretionaryTrends;
    private calculateSpendingVelocity;
    private calculateTrends;
    private calculateAnalytics;
}
