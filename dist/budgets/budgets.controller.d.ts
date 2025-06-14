import { BudgetsService } from "./budgets.service";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { BudgetDto } from "./dto/budget.dto";
import { BudgetAnalyticsDto } from "./dto/budget-analytics.dto";
export declare class BudgetsController {
    private readonly budgetsService;
    constructor(budgetsService: BudgetsService);
    createBudget(req: any, createBudgetDto: CreateBudgetDto): Promise<BudgetDto>;
    getUserBudgets(req: any, page: number, limit: number): Promise<{
        data: BudgetDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    getBudgetById(req: any, id: string): Promise<BudgetDto>;
    updateBudget(req: any, id: string, updateBudgetDto: UpdateBudgetDto): Promise<BudgetDto>;
    deleteBudget(req: any, id: string): Promise<void>;
    getBudgetAnalytics(req: any, id: string): Promise<BudgetAnalyticsDto>;
}
