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
        name: string;
        id: string;
        currency: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        description: string | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.BudgetStatus;
        totalAmount: Prisma.Decimal;
        isRecurring: boolean;
    }>;
    findByUserId(userId: string, page?: number, limit?: number): Promise<{
        data: ({
            _count: {
                transactions: number;
            };
            transactions: {
                type: import(".prisma/client").$Enums.TransactionType;
                amount: Prisma.Decimal;
            }[];
        } & {
            name: string;
            id: string;
            currency: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            description: string | null;
            startDate: Date;
            endDate: Date | null;
            status: import(".prisma/client").$Enums.BudgetStatus;
            totalAmount: Prisma.Decimal;
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
        _count: {
            transactions: number;
        };
        transactions: {
            category: {
                name: string;
                id: string;
            };
            type: import(".prisma/client").$Enums.TransactionType;
            amount: Prisma.Decimal;
            date: Date;
        }[];
    } & {
        name: string;
        id: string;
        currency: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        description: string | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.BudgetStatus;
        totalAmount: Prisma.Decimal;
        isRecurring: boolean;
    }>;
    update(id: string, userId: string, data: UpdateBudgetDto): Promise<{
        _count: {
            transactions: number;
        };
    } & {
        name: string;
        id: string;
        currency: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        description: string | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.BudgetStatus;
        totalAmount: Prisma.Decimal;
        isRecurring: boolean;
    }>;
    delete(id: string, userId: string): Promise<{
        name: string;
        id: string;
        currency: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        description: string | null;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.BudgetStatus;
        totalAmount: Prisma.Decimal;
        isRecurring: boolean;
    }>;
    getBudgetAnalytics(id: string, userId: string): Promise<{
        budget: {
            transactions: {
                category: {
                    name: string;
                    id: string;
                };
                type: import(".prisma/client").$Enums.TransactionType;
                amount: Prisma.Decimal;
                date: Date;
                categoryId: string;
            }[];
        } & {
            name: string;
            id: string;
            currency: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            description: string | null;
            startDate: Date;
            endDate: Date | null;
            status: import(".prisma/client").$Enums.BudgetStatus;
            totalAmount: Prisma.Decimal;
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
