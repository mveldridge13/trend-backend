import { PrismaService } from '../database/prisma.service';
import { DateService } from '../common/services/date.service';
import { IncomeSourcesService } from '../income-sources/income-sources.service';
import { HomeSummaryResponse } from './dto/home-summary.dto';
export declare class HomeService {
    private readonly prisma;
    private readonly dateService;
    private readonly incomeSourcesService;
    private readonly logger;
    constructor(prisma: PrismaService, dateService: DateService, incomeSourcesService: IncomeSourcesService);
    getSummary(userId: string): Promise<HomeSummaryResponse>;
    private isProActive;
    private getFeatureFlags;
    private calculateIncome;
    private calculateIncomeLedger;
    private calculateCommitted;
    private calculateDiscretionary;
    private calculateGoals;
    private calculateTotals;
    private getEmptySummary;
    private processPayPeriodTransition;
    private materializePrimaryIncomeTransaction;
    private calculateAdditionalIncome;
    private calculatePreviousPeriodExpenses;
    private getRolloverNotification;
    private getSourceRolloverNotification;
}
