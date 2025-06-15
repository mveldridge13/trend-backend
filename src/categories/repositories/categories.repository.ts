import { Injectable } from "@nestjs/common";
import { Prisma, Category, CategoryType } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({
      data,
      include: {
        parent: true,
        subcategories: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
    } as any);
  }

  async findById(id: string, userId?: string): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: {
        id,
        isActive: true,
        OR: [{ userId: userId }, { isSystem: true }],
      },
      include: {
        parent: true,
        subcategories: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
    } as any);
  }

  async findManyByUser(
    userId: string,
    filters: {
      type?: CategoryType;
      isSystem?: boolean;
      isActive?: boolean;
      parentId?: string;
      search?: string;
      includeArchived?: boolean;
    } = {},
    pagination: { skip: number; take: number } = { skip: 0, take: 50 }
  ): Promise<{ categories: Category[]; total: number }> {
    const where: any = {
      OR: [{ userId: userId }, { isSystem: true }],
      isActive: filters.includeArchived ? undefined : true,
      ...(filters.type && { type: filters.type }),
      ...(filters.isSystem !== undefined && { isSystem: filters.isSystem }),
      ...(filters.parentId && { parentId: filters.parentId }),
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
          parent: true,
          subcategories: {
            where: { isActive: true },
            orderBy: { name: "asc" },
          },
          _count: {
            select: {
              transactions: true,
            },
          },
        },
        orderBy: [{ isSystem: "desc" }, { name: "asc" }],
        skip: pagination.skip,
        take: pagination.take,
      } as any),
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
        userId: userId,
        isSystem: false,
      },
      data,
      include: {
        parent: true,
        subcategories: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
    } as any);
  }

  async delete(id: string, userId: string): Promise<Category> {
    return this.prisma.category.update({
      where: {
        id,
        userId: userId,
        isSystem: false,
      },
      data: {
        isActive: false,
      },
    });
  }

  async countActiveSubcategories(
    parentId: string,
    userId: string
  ): Promise<number> {
    return this.prisma.category.count({
      where: {
        parentId: parentId,
        isActive: true,
        OR: [{ userId: userId }, { isSystem: true }],
      },
    } as any);
  }

  async archiveWithChildren(parentId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Archive all children first
      await tx.category.updateMany({
        where: {
          parentId: parentId,
          userId: userId,
          isSystem: false,
        } as any,
        data: {
          isActive: false,
        },
      });

      // Archive parent
      await tx.category.update({
        where: {
          id: parentId,
          userId: userId,
          isSystem: false,
        },
        data: {
          isActive: false,
        },
      });
    });
  }

  async permanentDelete(parentId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Delete all children first
      await tx.category.deleteMany({
        where: {
          parentId: parentId,
          userId: userId,
          isSystem: false,
        } as any,
      });

      // Delete parent
      await tx.category.delete({
        where: {
          id: parentId,
          userId: userId,
        },
      });
    });
  }

  async restoreWithChildren(parentId: string, userId: string): Promise<number> {
    const result = await this.prisma.$transaction(async (tx) => {
      // Restore parent
      await tx.category.update({
        where: {
          id: parentId,
          userId: userId,
        },
        data: {
          isActive: true,
        },
      });

      // Restore all children
      const restoredChildren = await tx.category.updateMany({
        where: {
          parentId: parentId,
          userId: userId,
        } as any,
        data: {
          isActive: true,
        },
      });

      return 1 + restoredChildren.count;
    });

    return result;
  }

  async findArchivedById(id: string, userId: string): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: {
        id,
        userId: userId,
        isActive: false,
      },
      include: {
        parent: true,
        subcategories: {
          where: { isActive: false },
          orderBy: { name: "asc" },
        },
      },
    } as any);
  }

  async findArchivedByUser(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        userId: userId,
        isActive: false,
        isSystem: false,
      },
      include: {
        parent: true,
        subcategories: {
          where: { isActive: false },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    } as any);
  }

  async getSystemCategories(): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        isSystem: true,
        isActive: true,
      },
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    } as any);
  }

  async getCategoryAnalytics(
    categoryId: string,
    userId: string,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<any> {
    const { startDate, endDate } = dateRange;

    const categoryWithStats = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        OR: [{ userId: userId }, { isSystem: true }],
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

    const transactions = categoryWithStats.transactions;
    const totalSpent = transactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );
    const averageTransaction =
      transactions.length > 0 ? totalSpent / transactions.length : 0;

    const monthlySpending = transactions.reduce(
      (acc, transaction) => {
        const month = transaction.date.toISOString().substring(0, 7);
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
        OR: [{ userId: userId }, { isSystem: true }],
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
