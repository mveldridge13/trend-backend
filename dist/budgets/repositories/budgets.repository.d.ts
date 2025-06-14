import { Prisma } from "@prisma/client";
import { BaseRepository } from "../../database/base.repository";
import { PrismaService } from "../../database/prisma.service";
import { CreateBudgetDto } from "../dto/create-budget.dto";
import { UpdateBudgetDto } from "../dto/update-budget.dto";
export declare class BudgetsRepository extends BaseRepository<any> {
    protected readonly prisma: PrismaService;
    constructor(prisma: PrismaService);
    create(userId: string, data: CreateBudgetDto): Promise<{
        _count: {
            transactions: number;
        };
    } & {
        id: string;
        userId: string;
        name: string;
        description: string | null;
        totalAmount: Prisma.Decimal;
        currency: string;
        startDate: Date;
        endDate: Date | null;
        isRecurring: boolean;
        status: import(".prisma/client").$Enums.BudgetStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByUserId(userId: string, page?: number, limit?: number): Promise<{
        data: ({
            transactions: {
                amount: Prisma.Decimal;
                type: import(".prisma/client").$Enums.TransactionType;
            }[];
            _count: {
                transactions: number;
            };
        } & {
            id: string;
            userId: string;
            name: string;
            description: string | null;
            totalAmount: Prisma.Decimal;
            currency: string;
            startDate: Date;
            endDate: Date | null;
            isRecurring: boolean;
            status: import(".prisma/client").$Enums.BudgetStatus;
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    findByIdAndUserId(id: string, userId: string): Promise<{
        transactions: {
            amount: Prisma.Decimal;
            date: Date;
            type: import(".prisma/client").$Enums.TransactionType;
            category: {
                id: string;
                name: string;
            };
        }[];
        _count: {
            transactions: number;
        };
    } & {
        id: string;
        userId: string;
        name: string;
        description: string | null;
        totalAmount: Prisma.Decimal;
        currency: string;
        startDate: Date;
        endDate: Date | null;
        isRecurring: boolean;
        status: import(".prisma/client").$Enums.BudgetStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, userId: string, data: UpdateBudgetDto): Promise<{
        _count: {
            transactions: number;
        };
    } & {
        id: string;
        userId: string;
        name: string;
        description: string | null;
        totalAmount: Prisma.Decimal;
        currency: string;
        startDate: Date;
        endDate: Date | null;
        isRecurring: boolean;
        status: import(".prisma/client").$Enums.BudgetStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(id: string, userId: string): Promise<{
        id: string;
        userId: string;
        name: string;
        description: string | null;
        totalAmount: Prisma.Decimal;
        currency: string;
        startDate: Date;
        endDate: Date | null;
        isRecurring: boolean;
        status: import(".prisma/client").$Enums.BudgetStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getBudgetAnalytics(id: string, userId: string): Promise<{
        budget: {
            transactions: {
                categoryId: string;
                amount: Prisma.Decimal;
                date: Date;
                type: import(".prisma/client").$Enums.TransactionType;
                category: {
                    id: string;
                    name: string;
                };
            }[];
        } & {
            id: string;
            userId: string;
            name: string;
            description: string | null;
            totalAmount: Prisma.Decimal;
            currency: string;
            startDate: Date;
            endDate: Date | null;
            isRecurring: boolean;
            status: import(".prisma/client").$Enums.BudgetStatus;
            createdAt: Date;
            updatedAt: Date;
        };
        spentAmount: number;
        categoryBreakdown: any[];
        spendingTrend: {
            date: string;
            dailySpent: number;
            cumulativeSpent: number;
        }[];
    }>;
}
