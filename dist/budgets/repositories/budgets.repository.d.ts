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
        currency: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        description: string | null;
        status: import(".prisma/client").$Enums.BudgetStatus;
        totalAmount: Prisma.Decimal;
        startDate: Date;
        endDate: Date | null;
        isRecurring: boolean;
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
            currency: string;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            description: string | null;
            status: import(".prisma/client").$Enums.BudgetStatus;
            totalAmount: Prisma.Decimal;
            startDate: Date;
            endDate: Date | null;
            isRecurring: boolean;
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
            category: {
                name: string;
                id: string;
            };
            amount: Prisma.Decimal;
            date: Date;
            type: import(".prisma/client").$Enums.TransactionType;
        }[];
        _count: {
            transactions: number;
        };
    } & {
        currency: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        description: string | null;
        status: import(".prisma/client").$Enums.BudgetStatus;
        totalAmount: Prisma.Decimal;
        startDate: Date;
        endDate: Date | null;
        isRecurring: boolean;
    }>;
    update(id: string, userId: string, data: UpdateBudgetDto): Promise<{
        _count: {
            transactions: number;
        };
    } & {
        currency: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        description: string | null;
        status: import(".prisma/client").$Enums.BudgetStatus;
        totalAmount: Prisma.Decimal;
        startDate: Date;
        endDate: Date | null;
        isRecurring: boolean;
    }>;
    delete(id: string, userId: string): Promise<{
        currency: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        description: string | null;
        status: import(".prisma/client").$Enums.BudgetStatus;
        totalAmount: Prisma.Decimal;
        startDate: Date;
        endDate: Date | null;
        isRecurring: boolean;
    }>;
    getBudgetAnalytics(id: string, userId: string): Promise<{
        budget: {
            transactions: {
                category: {
                    name: string;
                    id: string;
                };
                amount: Prisma.Decimal;
                date: Date;
                type: import(".prisma/client").$Enums.TransactionType;
                categoryId: string;
            }[];
        } & {
            currency: string;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            description: string | null;
            status: import(".prisma/client").$Enums.BudgetStatus;
            totalAmount: Prisma.Decimal;
            startDate: Date;
            endDate: Date | null;
            isRecurring: boolean;
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
