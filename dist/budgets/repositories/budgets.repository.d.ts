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
        status: import(".prisma/client").$Enums.BudgetStatus;
        description: string | null;
        totalAmount: Prisma.Decimal;
        startDate: Date;
        endDate: Date | null;
        isRecurring: boolean;
        userId: string;
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
            status: import(".prisma/client").$Enums.BudgetStatus;
            description: string | null;
            totalAmount: Prisma.Decimal;
            startDate: Date;
            endDate: Date | null;
            isRecurring: boolean;
            userId: string;
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
        status: import(".prisma/client").$Enums.BudgetStatus;
        description: string | null;
        totalAmount: Prisma.Decimal;
        startDate: Date;
        endDate: Date | null;
        isRecurring: boolean;
        userId: string;
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
        status: import(".prisma/client").$Enums.BudgetStatus;
        description: string | null;
        totalAmount: Prisma.Decimal;
        startDate: Date;
        endDate: Date | null;
        isRecurring: boolean;
        userId: string;
    }>;
    delete(id: string, userId: string): Promise<{
        currency: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.BudgetStatus;
        description: string | null;
        totalAmount: Prisma.Decimal;
        startDate: Date;
        endDate: Date | null;
        isRecurring: boolean;
        userId: string;
    }>;
    getBudgetAnalytics(id: string, userId: string): Promise<{
        budget: {
            transactions: {
                category: {
                    name: string;
                    id: string;
                };
                categoryId: string;
                amount: Prisma.Decimal;
                date: Date;
                type: import(".prisma/client").$Enums.TransactionType;
            }[];
        } & {
            currency: string;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.BudgetStatus;
            description: string | null;
            totalAmount: Prisma.Decimal;
            startDate: Date;
            endDate: Date | null;
            isRecurring: boolean;
            userId: string;
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
