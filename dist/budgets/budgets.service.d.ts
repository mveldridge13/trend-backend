import { BudgetsRepository } from "./repositories/budgets.repository";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { BudgetDto } from "./dto/budget.dto";
import { BudgetAnalyticsDto } from "./dto/budget-analytics.dto";
export declare class BudgetsService {
    private readonly budgetsRepository;
    constructor(budgetsRepository: BudgetsRepository);
    createBudget(userId: string, createBudgetDto: CreateBudgetDto): Promise<BudgetDto>;
    getUserBudgets(userId: string, page?: number, limit?: number): Promise<{
        data: BudgetDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    getBudgetById(id: string, userId: string): Promise<BudgetDto>;
    updateBudget(id: string, userId: string, updateBudgetDto: UpdateBudgetDto): Promise<BudgetDto>;
    deleteBudget(id: string, userId: string): Promise<void>;
    getBudgetAnalytics(id: string, userId: string): Promise<BudgetAnalyticsDto>;
    private enrichBudgetWithAnalytics;
}
