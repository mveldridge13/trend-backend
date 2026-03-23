import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { Transaction, Prisma } from "@prisma/client";
import { CreateTransactionDto } from "../dto/create-transaction.dto";
import { UpdateTransactionDto } from "../dto/update-transaction.dto";
import { TransactionFilterDto } from "../dto/transaction-filter.dto";
import { startOfDay, endOfDay } from "date-fns";

@Injectable()
export class TransactionsRepository {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    data: CreateTransactionDto,
  ): Promise<Transaction> {
    return this.prisma.transaction.create({
      data: {
        userId,
        description: data.description,
        amount: new Prisma.Decimal(data.amount),
        currency: data.currency,
        date: new Date(data.date),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        type: data.type,
        status: data.status,
        budgetId: data.budgetId,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId, // ✅ Include subcategoryId
        recurrence: data.recurrence, // ✅ Include recurrence
      },
      include: {
        budget: {
          select: { id: true, name: true },
        },
        category: {
          select: { id: true, name: true, icon: true, color: true, type: true },
        },
        subcategory: {
          select: { id: true, name: true, icon: true, color: true },
        },
      },
    });
  }

  async findMany(
    userId: string,
    filters: TransactionFilterDto,
  ): Promise<Transaction[]> {
    const where: Prisma.TransactionWhereInput = {
      userId,
    };

    // Smart date filtering to properly show transactions for a pay period:
    // - PAID transactions: filter by date (payment date)
    // - UPCOMING/OVERDUE: filter by dueDate (when it's due)
    // - No status (discretionary): filter by date
    if (filters.startDate || filters.endDate) {
      const periodStart = filters.startDate ? startOfDay(new Date(filters.startDate)) : undefined;
      const periodEnd = filters.endDate ? endOfDay(new Date(filters.endDate)) : undefined;

      // Build date range conditions
      const dateInPeriod: Prisma.TransactionWhereInput = {};
      const dueDateInPeriod: Prisma.TransactionWhereInput = {};

      if (periodStart && periodEnd) {
        dateInPeriod.date = { gte: periodStart, lte: periodEnd };
        dueDateInPeriod.dueDate = { gte: periodStart, lte: periodEnd };
      } else if (periodStart) {
        dateInPeriod.date = { gte: periodStart };
        dueDateInPeriod.dueDate = { gte: periodStart };
      } else if (periodEnd) {
        dateInPeriod.date = { lte: periodEnd };
        dueDateInPeriod.dueDate = { lte: periodEnd };
      }

      // Smart filter:
      // - PAID: use date (payment date)
      // - UPCOMING/OVERDUE: use dueDate
      // - No status: use date (discretionary transactions)
      where.OR = [
        // PAID transactions with date in period
        { status: 'PAID', ...dateInPeriod },
        // UPCOMING transactions with dueDate in period
        { status: 'UPCOMING', ...dueDateInPeriod },
        // OVERDUE transactions with dueDate in period
        { status: 'OVERDUE', ...dueDateInPeriod },
        // Discretionary transactions (no status) with date in period
        { status: null, ...dateInPeriod },
      ];
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.budgetId) {
      where.budgetId = filters.budgetId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.search) {
      where.description = { contains: filters.search, mode: "insensitive" };
    }

    // ✅ Support for subcategoryId filter
    if (filters.subcategoryId) {
      where.subcategoryId = filters.subcategoryId;
    }

    return this.prisma.transaction.findMany({
      where,
      include: {
        budget: {
          select: { id: true, name: true },
        },
        category: {
          select: { id: true, name: true, icon: true, color: true, type: true },
        },
        subcategory: {
          select: { id: true, name: true, icon: true, color: true },
        },
      },
      orderBy: {
        [filters.sortBy]: filters.sortOrder,
      },
      take: filters.limit,
      skip: filters.offset,
    });
  }

  async findById(id: string, userId: string): Promise<Transaction | null> {
    return this.prisma.transaction.findFirst({
      where: { id, userId },
      include: {
        budget: {
          select: { id: true, name: true },
        },
        category: {
          select: { id: true, name: true, icon: true, color: true, type: true },
        },
        subcategory: {
          select: { id: true, name: true, icon: true, color: true },
        },
      },
    });
  }

  async update(
    id: string,
    userId: string,
    data: UpdateTransactionDto,
  ): Promise<Transaction> {
    const updateData: any = { ...data };

    if (data.amount !== undefined) {
      updateData.amount = new Prisma.Decimal(data.amount);
    }

    if (data.date !== undefined) {
      updateData.date = new Date(data.date);
    }
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    const result = await this.prisma.transaction.update({
      where: {
        id,
        userId, // ✅ CRITICAL FIX: Ensure user can only update their own transactions
      },
      data: updateData,
      include: {
        budget: {
          select: { id: true, name: true },
        },
        category: {
          select: { id: true, name: true, icon: true, color: true, type: true },
        },
        subcategory: {
          select: { id: true, name: true, icon: true, color: true },
        },
      },
    });

    return result;
  }

  async delete(id: string, userId: string): Promise<Transaction> {
    return this.prisma.transaction.delete({
      where: {
        id,
        userId, // ✅ FIXED: Add userId for security consistency
      },
    });
  }

  async count(
    userId: string,
    filters: Partial<TransactionFilterDto> = {},
  ): Promise<number> {
    const where: Prisma.TransactionWhereInput = {
      userId,
    };

    // Smart date filtering (same logic as findMany):
    // - PAID: filter by date
    // - UPCOMING/OVERDUE: filter by dueDate
    // - No status: filter by date
    if (filters.startDate || filters.endDate) {
      const periodStart = filters.startDate ? startOfDay(new Date(filters.startDate)) : undefined;
      const periodEnd = filters.endDate ? endOfDay(new Date(filters.endDate)) : undefined;

      const dateInPeriod: Prisma.TransactionWhereInput = {};
      const dueDateInPeriod: Prisma.TransactionWhereInput = {};

      if (periodStart && periodEnd) {
        dateInPeriod.date = { gte: periodStart, lte: periodEnd };
        dueDateInPeriod.dueDate = { gte: periodStart, lte: periodEnd };
      } else if (periodStart) {
        dateInPeriod.date = { gte: periodStart };
        dueDateInPeriod.dueDate = { gte: periodStart };
      } else if (periodEnd) {
        dateInPeriod.date = { lte: periodEnd };
        dueDateInPeriod.dueDate = { lte: periodEnd };
      }

      where.OR = [
        { status: 'PAID', ...dateInPeriod },
        { status: 'UPCOMING', ...dueDateInPeriod },
        { status: 'OVERDUE', ...dueDateInPeriod },
        { status: null, ...dateInPeriod },
      ];
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.budgetId) {
      where.budgetId = filters.budgetId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    // ✅ Support for subcategoryId filter in count
    if (filters.subcategoryId) {
      where.subcategoryId = filters.subcategoryId;
    }

    return this.prisma.transaction.count({ where });
  }
}
