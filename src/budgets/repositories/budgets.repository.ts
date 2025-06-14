import { Injectable } from "@nestjs/common";
import { Prisma, BudgetStatus } from "@prisma/client";
import { BaseRepository } from "../../database/base.repository";
import { PrismaService } from "../../database/prisma.service";
import { CreateBudgetDto } from "../dto/create-budget.dto";
import { UpdateBudgetDto } from "../dto/update-budget.dto";

@Injectable()
export class BudgetsRepository extends BaseRepository<any> {
  protected readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    super(prisma);
    this.prisma = prisma;
  }

  async create(userId: string, data: CreateBudgetDto) {
    // Validate totalAmount
    if (!data.totalAmount || isNaN(data.totalAmount)) {
      throw new Error(`Invalid totalAmount: ${data.totalAmount}`);
    }

    // DEBUG: Log in repository
    console.log("REPOSITORY DEBUG:");
    console.log("data.totalAmount:", data.totalAmount);
    console.log("data.totalAmount type:", typeof data.totalAmount);

    return this.prisma.budget.create({
      data: {
        name: data.name,
        description: data.description || null,
        userId,
        totalAmount: new Prisma.Decimal(data.totalAmount.toString()),
        currency: data.currency || "USD",
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isRecurring: data.isRecurring !== undefined ? data.isRecurring : true,
        status: (data.status as BudgetStatus) || BudgetStatus.ACTIVE,
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });
  }

  async findByUserId(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [budgets, total] = await Promise.all([
      this.prisma.budget.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { transactions: true },
          },
          transactions: {
            select: {
              amount: true,
              type: true,
            },
          },
        },
      }),
      this.prisma.budget.count({ where: { userId } }),
    ]);

    return {
      data: budgets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  async findByIdAndUserId(id: string, userId: string) {
    return this.prisma.budget.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { transactions: true },
        },
        transactions: {
          select: {
            amount: true,
            type: true,
            date: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { date: "desc" },
        },
      },
    });
  }

  async update(id: string, userId: string, data: UpdateBudgetDto) {
    const updateData: any = { ...data };

    if (data.totalAmount !== undefined) {
      updateData.totalAmount = new Prisma.Decimal(data.totalAmount);
    }
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }

    return this.prisma.budget.update({
      where: { id, userId },
      data: updateData,
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.budget.delete({
      where: { id, userId },
    });
  }

  async getBudgetAnalytics(id: string, userId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
      include: {
        transactions: {
          select: {
            amount: true,
            type: true,
            date: true,
            categoryId: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!budget) return null;

    // Calculate spending analytics
    const expenseTransactions = budget.transactions.filter(
      (t) => t.type === "EXPENSE"
    );
    const spentAmount = expenseTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount.toString()),
      0
    );

    // Category breakdown
    const categoryMap = new Map();
    expenseTransactions.forEach((t) => {
      const categoryId = t.categoryId || "uncategorized";
      const categoryName = t.category?.name || "Uncategorized";
      const amount = parseFloat(t.amount.toString());

      if (categoryMap.has(categoryId)) {
        const existing = categoryMap.get(categoryId);
        categoryMap.set(categoryId, {
          ...existing,
          amount: existing.amount + amount,
          transactionCount: existing.transactionCount + 1,
        });
      } else {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName,
          amount,
          percentage: 0, // Will calculate later
          transactionCount: 1,
        });
      }
    });

    // Calculate percentages
    const categoryBreakdown = Array.from(categoryMap.values()).map((cat) => ({
      ...cat,
      percentage: spentAmount > 0 ? (cat.amount / spentAmount) * 100 : 0,
    }));

    // Spending trend (daily)
    const spendingMap = new Map();
    expenseTransactions.forEach((t) => {
      const dateKey = t.date.toISOString().split("T")[0];
      const amount = parseFloat(t.amount.toString());
      spendingMap.set(dateKey, (spendingMap.get(dateKey) || 0) + amount);
    });

    const spendingTrend = Array.from(spendingMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce(
        (acc, [date, dailySpent], index) => {
          const cumulativeSpent =
            acc.length > 0
              ? acc[acc.length - 1].cumulativeSpent + dailySpent
              : dailySpent;

          acc.push({
            date,
            dailySpent,
            cumulativeSpent,
          });
          return acc;
        },
        [] as Array<{
          date: string;
          dailySpent: number;
          cumulativeSpent: number;
        }>
      );

    return {
      budget,
      spentAmount,
      categoryBreakdown,
      spendingTrend,
    };
  }
}
