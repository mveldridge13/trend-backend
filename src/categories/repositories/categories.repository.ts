import { Injectable } from "@nestjs/common";
import { Prisma, Category, CategoryType } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({
      data,
      // Temporarily remove subcategory includes until migration is applied
    });
  }

  async findById(id: string, userId?: string): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: {
        id,
        OR: [
          { userId }, // User's custom category
          { isSystem: true }, // System category
        ],
      },
      // Temporarily remove subcategory includes until migration is applied
    });
  }

  async findManyByUser(
    userId: string,
    filters: {
      type?: CategoryType;
      isSystem?: boolean;
      isActive?: boolean;
      parentId?: string;
      search?: string;
    } = {},
    pagination: { skip: number; take: number } = { skip: 0, take: 50 }
  ): Promise<{ categories: Category[]; total: number }> {
    const where: Prisma.CategoryWhereInput = {
      OR: [
        { userId }, // User's custom categories
        { isSystem: true }, // System categories
      ],
      isActive: filters.isActive ?? true,
      ...(filters.type && { type: filters.type }),
      ...(filters.isSystem !== undefined && { isSystem: filters.isSystem }),
      // Temporarily remove parentId filter until migration is applied
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
        ],
      }),
    };

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        include: {
          _count: {
            select: {
              transactions: true,
            },
          },
        },
        orderBy: [
          { isSystem: "desc" }, // System categories first
          { name: "asc" },
        ],
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.category.count({ where }),
    ]);

    return { categories, total };
  }

  async update(
    id: string,
    userId: string,
    data: Prisma.CategoryUpdateInput
  ): Promise<Category> {
    return this.prisma.category.update({
      where: {
        id,
        userId, // Only allow updating user's own categories
        isSystem: false, // Can't update system categories
      },
      data,
    });
  }

  async delete(id: string, userId: string): Promise<Category> {

    // Soft delete by setting isActive to false
    return this.prisma.category.update({
      where: {
        id,
        userId, // Only allow deleting user's own categories
        isSystem: false, // Can't delete system categories
      },
      data: {
        isActive: false,
      },
    });
  }

  async getSystemCategories(): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        isSystem: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });
  }

  async getCategoryAnalytics(
    categoryId: string,
    userId: string,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<any> {
    const { startDate, endDate } = dateRange;

    // Get category with transaction analytics
    const categoryWithStats = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        OR: [{ userId }, { isSystem: true }],
      },
      include: {
        transactions: {
          where: {
            userId,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            amount: true,
            date: true,
            type: true,
          },
        },
        _count: {
          select: {
            transactions: {
              where: {
                userId,
                date: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        },
      },
    });

    if (!categoryWithStats) return null;

    // Calculate analytics
    const transactions = categoryWithStats.transactions;
    const totalSpent = transactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );
    const averageTransaction =
      transactions.length > 0 ? totalSpent / transactions.length : 0;

    // Monthly spending breakdown
    const monthlySpending = transactions.reduce(
      (acc, transaction) => {
        const month = transaction.date.toISOString().substring(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + Number(transaction.amount);
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      categoryId,
      categoryName: categoryWithStats.name,
      categoryType: categoryWithStats.type,
      totalSpent,
      averageTransaction,
      transactionCount: transactions.length,
      lastUsed:
        transactions.length > 0
          ? Math.max(...transactions.map((t) => t.date.getTime()))
          : null,
      firstUsed:
        transactions.length > 0
          ? Math.min(...transactions.map((t) => t.date.getTime()))
          : null,
      monthlySpending: Object.entries(monthlySpending).map(
        ([month, amount]) => ({
          month,
          amount,
        })
      ),
    };
  }

  async getMostUsedCategories(
    userId: string,
    limit: number = 10
  ): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        OR: [{ userId }, { isSystem: true }],
        isActive: true,
      },
      include: {
        _count: {
          select: {
            transactions: {
              where: { userId },
            },
          },
        },
      },
      orderBy: {
        transactions: {
          _count: "desc",
        },
      },
      take: limit,
    });
  }
}
