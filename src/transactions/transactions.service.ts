import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { TransactionsRepository } from "./repositories/transactions.repository";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionDto } from "./dto/transaction.dto";
import { TransactionFilterDto } from "./dto/transaction-filter.dto";
import { TransactionAnalyticsDto } from "./dto/transaction-analytics.dto";
import { Transaction, TransactionType } from "@prisma/client";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository
  ) {}

  async create(
    userId: string,
    createTransactionDto: CreateTransactionDto
  ): Promise<TransactionDto> {
    // Validate that the transaction amount is appropriate for the type
    this.validateTransactionAmount(
      createTransactionDto.amount,
      createTransactionDto.type
    );

    // Validate date is not in future (optional business rule)
    this.validateTransactionDate(createTransactionDto.date);

    const transaction = await this.transactionsRepository.create(
      userId,
      createTransactionDto
    );
    return this.mapToDto(transaction);
  }

  async findAll(
    userId: string,
    filters: TransactionFilterDto
  ): Promise<{
    transactions: TransactionDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [transactions, total] = await Promise.all([
      this.transactionsRepository.findMany(userId, filters),
      this.transactionsRepository.count(userId, filters),
    ]);

    const page = Math.floor(filters.offset / filters.limit) + 1;
    const totalPages = Math.ceil(total / filters.limit);

    return {
      transactions: transactions.map(this.mapToDto),
      total,
      page,
      limit: filters.limit,
      totalPages,
    };
  }

  async findOne(id: string, userId: string): Promise<TransactionDto> {
    const transaction = await this.transactionsRepository.findById(id, userId);

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return this.mapToDto(transaction);
  }

  async update(
    id: string,
    userId: string,
    updateTransactionDto: UpdateTransactionDto
  ): Promise<TransactionDto> {
    console.log("🔍 Service UPDATE - Input params:", { id, userId });
    console.log(
      "🔍 Service UPDATE - UpdateTransactionDto:",
      updateTransactionDto
    );

    // Check if transaction exists
    const existingTransaction = await this.transactionsRepository.findById(
      id,
      userId
    );
    if (!existingTransaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    console.log(
      "🔍 Service UPDATE - Existing transaction found:",
      existingTransaction
    );

    // Validate amount and type if being updated
    if (
      updateTransactionDto.amount !== undefined &&
      updateTransactionDto.type !== undefined
    ) {
      this.validateTransactionAmount(
        updateTransactionDto.amount,
        updateTransactionDto.type
      );
    } else if (updateTransactionDto.amount !== undefined) {
      this.validateTransactionAmount(
        updateTransactionDto.amount,
        existingTransaction.type
      );
    } else if (updateTransactionDto.type !== undefined) {
      this.validateTransactionAmount(
        Number(existingTransaction.amount),
        updateTransactionDto.type
      );
    }

    // Validate date if being updated
    if (updateTransactionDto.date !== undefined) {
      this.validateTransactionDate(updateTransactionDto.date);
    }

    console.log("🔍 Service UPDATE - About to call repository update");
    const updatedTransaction = await this.transactionsRepository.update(
      id,
      userId,
      updateTransactionDto
    );

    console.log("🔍 Service UPDATE - Repository result:", updatedTransaction);

    const result = this.mapToDto(updatedTransaction);
    console.log("🔍 Service UPDATE - Final mapped result:", result);

    return result;
  }

  async remove(id: string, userId: string): Promise<void> {
    const transaction = await this.transactionsRepository.findById(id, userId);

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    await this.transactionsRepository.delete(id, userId);
  }

  async getAnalytics(
    userId: string,
    filters: Partial<TransactionFilterDto> = {}
  ): Promise<TransactionAnalyticsDto> {
    const transactions = await this.transactionsRepository.findMany(userId, {
      ...filters,
      limit: 10000, // Get all transactions for analytics
      offset: 0,
      sortBy: "date",
      sortOrder: "desc",
    } as TransactionFilterDto);

    return this.calculateAnalytics(transactions);
  }

  private validateTransactionAmount(
    amount: number,
    type: TransactionType
  ): void {
    if (amount <= 0) {
      throw new BadRequestException(
        "Transaction amount must be greater than 0"
      );
    }

    if (amount > 999999.99) {
      throw new BadRequestException(
        "Transaction amount cannot exceed $999,999.99"
      );
    }
  }

  private validateTransactionDate(dateString: string): void {
    const transactionDate = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (transactionDate > today) {
      throw new BadRequestException("Transaction date cannot be in the future");
    }

    // Don't allow transactions older than 5 years (business rule)
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(today.getFullYear() - 5);

    if (transactionDate < fiveYearsAgo) {
      throw new BadRequestException(
        "Transaction date cannot be more than 5 years in the past"
      );
    }
  }

  private mapToDto(transaction: any): TransactionDto {
    return {
      id: transaction.id,
      userId: transaction.userId,
      budgetId: transaction.budgetId,
      categoryId: transaction.categoryId,
      subcategoryId: transaction.subcategoryId, // ✅ ADDED: Include subcategoryId
      description: transaction.description,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      date: transaction.date,
      type: transaction.type,
      recurrence: transaction.recurrence || "none", // ✅ UPDATED: Use actual field
      isAICategorized: transaction.isAICategorized,
      aiConfidence: transaction.aiConfidence,
      notes: transaction.notes || null, // ✅ UPDATED: Use actual field
      location: transaction.location || null, // ✅ UPDATED: Use actual field
      merchantName: transaction.merchantName || null, // ✅ UPDATED: Use actual field
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      budget: transaction.budget
        ? {
            id: transaction.budget.id,
            name: transaction.budget.name,
          }
        : undefined,
      category: transaction.category
        ? {
            id: transaction.category.id,
            name: transaction.category.name,
            icon: transaction.category.icon,
            color: transaction.category.color,
            type: transaction.category.type,
          }
        : undefined,
      // ✅ ADDED: Include subcategory data
      subcategory: transaction.subcategory
        ? {
            id: transaction.subcategory.id,
            name: transaction.subcategory.name,
            icon: transaction.subcategory.icon,
            color: transaction.subcategory.color,
          }
        : undefined,
    };
  }

  private calculateAnalytics(transactions: any[]): TransactionAnalyticsDto {
    const income = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const transactionCount = transactions.length;
    const averageTransaction =
      transactionCount > 0 ? (income + expenses) / transactionCount : 0;

    // ✅ UPDATED: Category breakdown with subcategory support
    const categoryMap = new Map();
    transactions.forEach((transaction) => {
      // Use subcategory if available, otherwise use main category
      const categoryToUse = transaction.subcategory || transaction.category;

      if (categoryToUse) {
        const categoryId = categoryToUse.id;
        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, {
            categoryId,
            categoryName: categoryToUse.name,
            categoryIcon: categoryToUse.icon,
            categoryColor: categoryToUse.color,
            amount: 0,
            transactionCount: 0,
          });
        }
        const category = categoryMap.get(categoryId);
        category.amount += Number(transaction.amount);
        category.transactionCount += 1;
      }
    });

    const categoryBreakdown = Array.from(categoryMap.values()).map(
      (category) => ({
        ...category,
        percentage: expenses > 0 ? (category.amount / expenses) * 100 : 0,
      })
    );

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netIncome: income - expenses,
      transactionCount,
      averageTransaction,
      categoryBreakdown,
      monthlyTrends: [], // TODO: Implement monthly trends calculation
      recentTransactions: {
        totalAmount: transactions
          .slice(0, 10)
          .reduce((sum, t) => sum + Number(t.amount), 0),
        count: Math.min(10, transactions.length),
        topCategories: categoryBreakdown.slice(0, 3).map((c) => c.categoryName),
      },
      budgetPerformance: [], // TODO: Implement budget performance calculation
    };
  }
}
