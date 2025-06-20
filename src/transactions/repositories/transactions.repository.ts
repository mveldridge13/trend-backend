import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { Transaction, Prisma } from "@prisma/client";
import { CreateTransactionDto } from "../dto/create-transaction.dto";
import { UpdateTransactionDto } from "../dto/update-transaction.dto";
import { TransactionFilterDto } from "../dto/transaction-filter.dto";

@Injectable()
export class TransactionsRepository {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    data: CreateTransactionDto
  ): Promise<Transaction> {
    return this.prisma.transaction.create({
      data: {
        userId,
        description: data.description,
        amount: new Prisma.Decimal(data.amount),
        currency: data.currency || "USD",
        date: new Date(data.date),
        type: data.type,
        budgetId: data.budgetId,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId, // ✅ ADDED: Include subcategoryId
        recurrence: data.recurrence, // ✅ ADDED: Include recurrence
      },
      include: {
        budget: {
          select: { id: true, name: true },
        },
        category: {
          select: { id: true, name: true, icon: true, color: true, type: true },
        },
        subcategory: {
          // ✅ ADDED: Include subcategory relation
          select: { id: true, name: true, icon: true, color: true },
        },
      },
    });
  }

  async findMany(
    userId: string,
    filters: TransactionFilterDto
  ): Promise<Transaction[]> {
    const where: Prisma.TransactionWhereInput = {
      userId,
    };

    // Build date filter object
    const dateFilter: any = {};
    if (filters.startDate) {
      dateFilter.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      dateFilter.lte = new Date(filters.endDate);
    }
    if (Object.keys(dateFilter).length > 0) {
      where.date = dateFilter;
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

    // ✅ ADDED: Support for subcategoryId filter
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
          // ✅ ADDED: Include subcategory relation
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
          // ✅ ADDED: Include subcategory relation
          select: { id: true, name: true, icon: true, color: true },
        },
      },
    });
  }

  async update(
    id: string,
    userId: string,
    data: UpdateTransactionDto
  ): Promise<Transaction> {
    const updateData: any = { ...data };

    if (data.amount !== undefined) {
      updateData.amount = new Prisma.Decimal(data.amount);
    }

    if (data.date !== undefined) {
      updateData.date = new Date(data.date);
    }

    // ✅ ADDED: Handle subcategoryId and recurrence in updates
    // These fields are already included in the spread operator above,
    // but making it explicit for clarity

    return this.prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        budget: {
          select: { id: true, name: true },
        },
        category: {
          select: { id: true, name: true, icon: true, color: true, type: true },
        },
        subcategory: {
          // ✅ ADDED: Include subcategory relation
          select: { id: true, name: true, icon: true, color: true },
        },
      },
    });
  }

  async delete(id: string, userId: string): Promise<Transaction> {
    return this.prisma.transaction.delete({
      where: { id },
    });
  }

  async count(
    userId: string,
    filters: Partial<TransactionFilterDto> = {}
  ): Promise<number> {
    const where: Prisma.TransactionWhereInput = {
      userId,
    };

    // Build date filter object
    const dateFilter: any = {};
    if (filters.startDate) {
      dateFilter.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      dateFilter.lte = new Date(filters.endDate);
    }
    if (Object.keys(dateFilter).length > 0) {
      where.date = dateFilter;
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

    // ✅ ADDED: Support for subcategoryId filter in count
    if (filters.subcategoryId) {
      where.subcategoryId = filters.subcategoryId;
    }

    return this.prisma.transaction.count({ where });
  }
}
