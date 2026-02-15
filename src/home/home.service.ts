import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DateService, PayPeriodBoundaries } from '../common/services/date.service';
import { IncomeFrequency, TransactionType, PaymentStatus, GoalType, ContributionType } from '@prisma/client';
import { format } from 'date-fns';
import {
  HomeSummaryResponse,
  IncomeInfo,
  CommittedInfo,
  DiscretionaryInfo,
  GoalsInfo,
  TotalsInfo,
} from './dto/home-summary.dto';

@Injectable()
export class HomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dateService: DateService,
  ) {}

  /**
   * Get complete home summary for Balance Card
   * This is the single source of truth for both mobile and web
   */
  async getSummary(userId: string): Promise<HomeSummaryResponse> {
    // Get user profile
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has pay period setup
    if (!user.nextPayDate || !user.incomeFrequency) {
      return this.getEmptySummary();
    }

    const userTimezone = this.dateService.getValidTimezone(user.timezone);
    const nextPayDate = new Date(user.nextPayDate);
    const frequency = user.incomeFrequency;

    // Calculate pay period boundaries
    const periodBoundaries = this.dateService.calculatePayPeriodBoundaries(
      nextPayDate,
      frequency,
      userTimezone
    );

    // Calculate all components in parallel
    const [income, committed, discretionary, goals] = await Promise.all([
      this.calculateIncome(user, periodBoundaries),
      this.calculateCommitted(userId, periodBoundaries),
      this.calculateDiscretionary(userId, periodBoundaries),
      this.calculateGoals(userId, periodBoundaries, frequency),
    ]);

    // Calculate totals
    const totals = this.calculateTotals(income, committed, discretionary, goals);

    return {
      period: {
        // Return date-only strings (YYYY-MM-DD) to avoid timezone issues
        start: format(periodBoundaries.start, 'yyyy-MM-dd'),
        end: format(periodBoundaries.end, 'yyyy-MM-dd'),
        frequency: periodBoundaries.frequency,
        daysRemaining: periodBoundaries.daysRemaining,
        daysTotal: periodBoundaries.daysTotal,
      },
      income,
      outflows: {
        committed,
        discretionary,
        goals,
      },
      totals,
    };
  }

  /**
   * Calculate income for the period
   */
  private async calculateIncome(
    user: any,
    period: PayPeriodBoundaries
  ): Promise<IncomeInfo> {
    // Base income from user profile
    const baseIncome = user.income ? Number(user.income) : 0;

    // Additional income from transactions in this period
    const additionalIncomeResult = await this.prisma.transaction.aggregate({
      where: {
        userId: user.id,
        type: TransactionType.INCOME,
        date: {
          gte: period.start,
          lte: period.end,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const additionalIncome = additionalIncomeResult._sum.amount
      ? Number(additionalIncomeResult._sum.amount)
      : 0;

    // Rollover from previous period
    const rolloverAvailable = user.rolloverAmount ? Number(user.rolloverAmount) : 0;

    return {
      baseIncome: Math.round(baseIncome * 100) / 100,
      additionalIncome: Math.round(additionalIncome * 100) / 100,
      rolloverAvailable: Math.round(rolloverAvailable * 100) / 100,
      totalInflow: Math.round((baseIncome + additionalIncome + rolloverAvailable) * 100) / 100,
    };
  }

  /**
   * Calculate committed expenses (recurring bills, scheduled payments)
   * A transaction is committed if:
   * - status is UPCOMING or OVERDUE
   * - OR has recurrence (not 'none')
   * - OR has a dueDate
   */
  private async calculateCommitted(
    userId: string,
    period: PayPeriodBoundaries
  ): Promise<CommittedInfo> {
    // Get all committed transactions for this period
    // Using AND to combine the "is committed" condition with "within period" condition
    const committedTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        AND: [
          // Condition 1: Is a committed transaction (has status, recurrence, or dueDate)
          {
            OR: [
              { status: { in: [PaymentStatus.UPCOMING, PaymentStatus.OVERDUE, PaymentStatus.PAID] } },
              { recurrence: { notIn: ['none', ''] } },
              { dueDate: { not: null } },
            ],
          },
          // Condition 2: Within period (by date or dueDate)
          {
            OR: [
              {
                date: {
                  gte: period.start,
                  lte: period.end,
                },
              },
              {
                dueDate: {
                  gte: period.start,
                  lte: period.end,
                },
              },
            ],
          },
        ],
      },
    });

    let plannedTotal = 0;
    let paidSoFar = 0;

    for (const t of committedTransactions) {
      const amount = Number(t.amount);
      plannedTotal += amount;

      if (t.status === PaymentStatus.PAID) {
        paidSoFar += amount;
      }
    }

    return {
      plannedTotal: Math.round(plannedTotal * 100) / 100,
      paidSoFar: Math.round(paidSoFar * 100) / 100,
      remaining: Math.round((plannedTotal - paidSoFar) * 100) / 100,
    };
  }

  /**
   * Calculate discretionary spending (one-time, non-recurring expenses)
   * A transaction is discretionary if:
   * - type is EXPENSE
   * - NOT committed (no recurrence or recurrence is 'none', no dueDate)
   * - status is null or PAID
   */
  private async calculateDiscretionary(
    userId: string,
    period: PayPeriodBoundaries
  ): Promise<DiscretionaryInfo> {
    const discretionaryResult = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: {
          gte: period.start,
          lte: period.end,
        },
        dueDate: null,
        AND: [
          // Not committed: no recurrence or recurrence is 'none'
          {
            OR: [
              { recurrence: null },
              { recurrence: 'none' },
              { recurrence: '' },
            ],
          },
          // Status is null or PAID (not UPCOMING/OVERDUE which would be committed)
          {
            OR: [
              { status: null },
              { status: PaymentStatus.PAID },
            ],
          },
        ],
      },
      _sum: {
        amount: true,
      },
    });

    const spentSoFar = discretionaryResult._sum.amount
      ? Number(discretionaryResult._sum.amount)
      : 0;

    return {
      spentSoFar: Math.round(spentSoFar * 100) / 100,
    };
  }

  /**
   * Calculate goal contributions for the period
   */
  private async calculateGoals(
    userId: string,
    period: PayPeriodBoundaries,
    frequency: IncomeFrequency
  ): Promise<GoalsInfo> {
    // Get all active goals for the user with contributions in this period
    const goals = await this.prisma.goal.findMany({
      where: {
        userId,
        isActive: true,
        isCompleted: false,
      },
      include: {
        contributions: {
          where: {
            date: {
              gte: period.start,
              lte: period.end,
            },
            // Only count contributions that affect cashflow
            type: {
              in: [ContributionType.MANUAL, ContributionType.AUTOMATIC, ContributionType.TRANSACTION],
            },
          },
        },
      },
    });

    let plannedTotal = 0;
    let paidSoFar = 0;
    let debtPlannedTotal = 0;
    let debtPaidSoFar = 0;
    let savingsPlannedTotal = 0;
    let savingsPaidSoFar = 0;

    for (const goal of goals) {
      // Calculate planned amount for this period
      let goalPlanned = 0;

      if (goal.type === GoalType.DEBT_PAYOFF && goal.minimumPayment) {
        // Debt: use minimum payment, prorated to period
        goalPlanned = this.dateService.prorateMonthlyAmount(
          Number(goal.minimumPayment),
          frequency
        );
      } else if (goal.monthlyTarget) {
        // Savings/Investment: use monthly target, prorated to period
        goalPlanned = this.dateService.prorateMonthlyAmount(
          Number(goal.monthlyTarget),
          frequency
        );
      }

      // Calculate paid so far from contributions
      const goalPaid = goal.contributions.reduce(
        (sum, c) => sum + Number(c.amount),
        0
      );

      plannedTotal += goalPlanned;
      paidSoFar += goalPaid;

      // Track by type
      if (goal.type === GoalType.DEBT_PAYOFF) {
        debtPlannedTotal += goalPlanned;
        debtPaidSoFar += goalPaid;
      } else {
        // SAVINGS, INVESTMENT, etc.
        savingsPlannedTotal += goalPlanned;
        savingsPaidSoFar += goalPaid;
      }
    }

    return {
      plannedTotal: Math.round(plannedTotal * 100) / 100,
      paidSoFar: Math.round(paidSoFar * 100) / 100,
      remaining: Math.round(Math.max(0, plannedTotal - paidSoFar) * 100) / 100,
      byType: {
        debt: {
          plannedTotal: Math.round(debtPlannedTotal * 100) / 100,
          paidSoFar: Math.round(debtPaidSoFar * 100) / 100,
        },
        savings: {
          plannedTotal: Math.round(savingsPlannedTotal * 100) / 100,
          paidSoFar: Math.round(savingsPaidSoFar * 100) / 100,
        },
      },
    };
  }

  /**
   * Calculate final totals
   * totalExpensesAllocated = committed.plannedTotal + discretionary.spentSoFar + goals.paidSoFar
   * leftToSpendSafe = totalInflow - totalExpensesAllocated
   *                 = totalInflow - committed.plannedTotal - discretionary.spentSoFar - goals.paidSoFar
   */
  private calculateTotals(
    income: IncomeInfo,
    committed: CommittedInfo,
    discretionary: DiscretionaryInfo,
    goals: GoalsInfo
  ): TotalsInfo {
    // Total allocated: planned committed + actual discretionary + actual goal contributions
    const totalExpensesAllocated =
      committed.plannedTotal + discretionary.spentSoFar + goals.paidSoFar;

    // Left to spend = income minus everything allocated
    const leftToSpendSafe = income.totalInflow - totalExpensesAllocated;

    return {
      totalExpensesAllocated: Math.round(totalExpensesAllocated * 100) / 100,
      leftToSpendSafe: Math.round(leftToSpendSafe * 100) / 100,
    };
  }

  /**
   * Return empty summary when user hasn't set up pay period
   */
  private getEmptySummary(): HomeSummaryResponse {
    const today = format(new Date(), 'yyyy-MM-dd');
    return {
      period: {
        start: today,
        end: today,
        frequency: IncomeFrequency.MONTHLY,
        daysRemaining: 0,
        daysTotal: 0,
      },
      income: {
        baseIncome: 0,
        additionalIncome: 0,
        rolloverAvailable: 0,
        totalInflow: 0,
      },
      outflows: {
        committed: {
          plannedTotal: 0,
          paidSoFar: 0,
          remaining: 0,
        },
        discretionary: {
          spentSoFar: 0,
        },
        goals: {
          plannedTotal: 0,
          paidSoFar: 0,
          remaining: 0,
          byType: {
            debt: { plannedTotal: 0, paidSoFar: 0 },
            savings: { plannedTotal: 0, paidSoFar: 0 },
          },
        },
      },
      totals: {
        totalExpensesAllocated: 0,
        leftToSpendSafe: 0,
      },
    };
  }
}
