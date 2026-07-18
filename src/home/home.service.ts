import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DateService, PayPeriodBoundaries } from '../common/services/date.service';
import { IncomeSourcesService } from '../income-sources/income-sources.service';
import { IncomeFrequency, TransactionType, PaymentStatus, GoalType, ContributionType, RolloverType, Prisma } from '@prisma/client';
import { format } from 'date-fns';
import {
  HomeSummaryResponse,
  IncomeInfo,
  CommittedInfo,
  DiscretionaryInfo,
  GoalsInfo,
  TotalsInfo,
  RolloverNotificationInfo,
  UserInfo,
  FeatureFlags,
  IncomeLedgerInfo,
} from './dto/home-summary.dto';

@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dateService: DateService,
    private readonly incomeSourcesService: IncomeSourcesService,
  ) {}

  /**
   * Get complete home summary for Balance Card
   * This is the single source of truth for both mobile and web
   */
  async getSummary(userId: string): Promise<HomeSummaryResponse> {
    // Get user profile
    let user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has pay period setup
    if (!user.nextPayDate || !user.incomeFrequency) {
      return this.getEmptySummary(user);
    }

    const userTimezone = this.dateService.getValidTimezone(user.timezone);
    let nextPayDate = new Date(user.nextPayDate);
    const frequency = user.incomeFrequency;

    // Materialize any due income-source occurrences as INCOME transactions
    // BEFORE the pay-period transition, so occurrences dated in a just-ended
    // period are included in that period's rollover calculation.
    await this.incomeSourcesService.materializeDueTransactions(
      userId,
      userTimezone,
    );

    // Check if pay period transition is needed and process it atomically
    // Loop to handle multiple missed periods (e.g., user away for a month, paid weekly)
    let transitionCount = 0;
    const maxTransitions = 12; // Safety limit to prevent infinite loops

    while (
      this.dateService.shouldTransitionPayPeriod(nextPayDate, userTimezone) &&
      transitionCount < maxTransitions
    ) {
      this.logger.log(`Pay period transition ${transitionCount + 1} detected for user ${userId}`);
      user = await this.processPayPeriodTransition(user, userTimezone);
      nextPayDate = new Date(user.nextPayDate);
      transitionCount++;
    }

    if (transitionCount > 0) {
      this.logger.log(`Processed ${transitionCount} pay period transition(s) for user ${userId}`);
    }

    // Calculate pay period boundaries
    const periodBoundaries = this.dateService.calculatePayPeriodBoundaries(
      nextPayDate,
      frequency,
      userTimezone
    );

    // Calculate all components in parallel (including rollover notification)
    const [income, committed, discretionary, goals, rolloverNotification, incomeLedger] = await Promise.all([
      this.calculateIncome(user, periodBoundaries),
      this.calculateCommitted(userId, periodBoundaries),
      this.calculateDiscretionary(userId, periodBoundaries),
      this.calculateGoals(userId, periodBoundaries, frequency),
      this.getRolloverNotification(userId),
      this.calculateIncomeLedger(user, periodBoundaries),
    ]);

    // Calculate totals
    const totals = this.calculateTotals(income, committed, discretionary, goals);

    // Check if Pro subscription is still valid
    const isPro = this.isProActive(user);

    const response: HomeSummaryResponse = {
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
      incomeLedger,
      user: {
        isPro,
        proExpiresAt: user.proExpiresAt?.toISOString() || null,
      },
      features: this.getFeatureFlags(isPro),
    };

    // Include rollover notification if present (not dismissed)
    if (rolloverNotification) {
      response.rolloverNotification = rolloverNotification;
    }

    return response;
  }

  /**
   * Check if user's Pro subscription is currently active
   */
  private isProActive(user: any): boolean {
    if (!user.isPro) return false;
    if (!user.proExpiresAt) return true;
    return new Date(user.proExpiresAt) > new Date();
  }

  /**
   * Get feature flags based on subscription status
   */
  private getFeatureFlags(isPro: boolean): FeatureFlags {
    return {
      spendingVelocityDetails: isPro,
      advancedAnalytics: isPro,
      exportData: isPro,
      aiAssistant: isPro,
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

    // Additional income from transactions in this period. Excludes
    // isPrimaryIncome rows - those are the auto-materialized salary payday
    // and would double-count against baseIncome above, which is already
    // added to totalInflow below. Also excludes income attributed to a named
    // income source - that money lives entirely in its own ledger entry/card
    // (see calculateIncomeLedger), so it must not inflate the main total too.
    const additionalIncomeResult = await this.prisma.transaction.aggregate({
      where: {
        userId: user.id,
        type: TransactionType.INCOME,
        isPrimaryIncome: false,
        incomeSourceId: null,
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

    // Named breakdown of the additional income that came from income sources
    const sourceSums = await this.prisma.transaction.groupBy({
      by: ['incomeSourceId'],
      where: {
        userId: user.id,
        type: TransactionType.INCOME,
        incomeSourceId: { not: null },
        date: {
          gte: period.start,
          lte: period.end,
        },
      },
      _sum: { amount: true },
    });

    let sources: { id: string; name: string; amount: number }[] = [];
    if (sourceSums.length > 0) {
      const sourceRecords = await this.prisma.incomeSource.findMany({
        where: { id: { in: sourceSums.map((s) => s.incomeSourceId) } },
        select: { id: true, name: true },
      });
      const namesById = new Map(sourceRecords.map((s) => [s.id, s.name]));
      sources = sourceSums.map((s) => ({
        id: s.incomeSourceId,
        name: namesById.get(s.incomeSourceId) ?? 'Income source',
        amount: Math.round(Number(s._sum.amount ?? 0) * 100) / 100,
      }));
    }

    // Rollover from previous period
    const rolloverAvailable = user.rolloverAmount ? Number(user.rolloverAmount) : 0;

    return {
      baseIncome: Math.round(baseIncome * 100) / 100,
      additionalIncome: Math.round(additionalIncome * 100) / 100,
      rolloverAvailable: Math.round(rolloverAvailable * 100) / 100,
      totalInflow: Math.round((baseIncome + additionalIncome + rolloverAvailable) * 100) / 100,
      sources,
    };
  }

  /**
   * Calculate the per-source income ledger.
   *
   * Semantics (attribution-only — ledger entries always sum to the single
   * spendable total):
   * - Salary entry: base income + rollover + unattributed INCOME
   *   transactions, minus all unattributed spending. Every expense without an
   *   incomeSourceId comes out of here.
   * - One entry per income source: its attributed INCOME transactions in the
   *   period, minus the same committed / discretionary / goal buckets the main
   *   card shows, restricted to that source's attributed spending.
   * - An entry may go negative (over-spent) — clients render it as a warning,
   *   there is no hard wall.
   * - Rollover stays a single number folded into the salary entry (per-source
   *   rollover is a possible later step).
   *
   * Returns [] when the user has no income sources at all, so clients can
   * keep the plain single-card view.
   */
  private async calculateIncomeLedger(
    user: any,
    period: PayPeriodBoundaries
  ): Promise<IncomeLedgerInfo[]> {
    const userId = user.id;

    const sources = await this.prisma.incomeSource.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    if (sources.length === 0) {
      return [];
    }

    const sourceNotifications = new Map(
      await Promise.all(
        sources.map(
          async (source) =>
            [source.id, await this.getSourceRolloverNotification(source.id)] as const,
        ),
      ),
    );

    // Inflows (income) + discretionary + goal contributions per source in one
    // pass; committed needs the same date/dueDate reconciliation the main card
    // does, so it's fetched raw and bucketed below.
    const [inflows, discretionaryRows, goalRows, committedTx] =
      await Promise.all([
        this.prisma.transaction.groupBy({
          by: ['incomeSourceId'],
          where: {
            userId,
            type: TransactionType.INCOME,
            // Auto-materialized salary payday - already folded into
            // baseIncome below, exclude to avoid double-counting.
            isPrimaryIncome: false,
            date: { gte: period.start, lte: period.end },
          },
          _sum: { amount: true },
        }),
        this.prisma.transaction.groupBy({
          by: ['incomeSourceId'],
          where: {
            userId,
            type: TransactionType.EXPENSE,
            date: { gte: period.start, lte: period.end },
            dueDate: null,
            AND: [
              {
                OR: [
                  { recurrence: null },
                  { recurrence: 'none' },
                  { recurrence: '' },
                ],
              },
              { OR: [{ status: null }, { status: PaymentStatus.PAID }] },
            ],
          },
          _sum: { amount: true },
        }),
        this.prisma.goalContribution.groupBy({
          by: ['incomeSourceId'],
          where: {
            userId,
            date: { gte: period.start, lte: period.end },
            type: {
              in: [
                ContributionType.MANUAL,
                ContributionType.AUTOMATIC,
                ContributionType.TRANSACTION,
              ],
            },
          },
          _sum: { amount: true },
        }),
        this.prisma.transaction.findMany({
          where: {
            userId,
            type: TransactionType.EXPENSE,
            AND: [
              {
                OR: [
                  { recurrence: { notIn: ['none', ''] } },
                  { dueDate: { not: null } },
                ],
              },
              {
                OR: [
                  { date: { gte: period.start, lte: period.end } },
                  { dueDate: { gte: period.start, lte: period.end } },
                ],
              },
            ],
          },
          select: {
            incomeSourceId: true,
            amount: true,
            status: true,
            date: true,
            dueDate: true,
          },
        }),
      ]);

    // Bucket committed by source, applying the same PAID→date /
    // UPCOMING→dueDate reconciliation as calculateCommitted's plannedTotal.
    const NULL_KEY = '__null__';
    const committedBySource = new Map<string, number>();
    for (const t of committedTx) {
      const transactionDate = new Date(t.date);
      const dueDate = t.dueDate ? new Date(t.dueDate) : null;
      const dateInPeriod =
        transactionDate >= period.start && transactionDate <= period.end;
      const dueDateInPeriod =
        !!dueDate && dueDate >= period.start && dueDate <= period.end;

      if (t.status === PaymentStatus.PAID) {
        if (!dateInPeriod && dueDateInPeriod) continue;
      } else {
        if (dateInPeriod && !dueDateInPeriod) continue;
      }

      const key = t.incomeSourceId ?? NULL_KEY;
      committedBySource.set(
        key,
        (committedBySource.get(key) ?? 0) + Number(t.amount),
      );
    }

    const sumRow = (
      rows: { incomeSourceId: string | null; _sum: { amount: unknown } }[],
      key: string | null,
    ) => {
      const row = rows.find((r) => r.incomeSourceId === key);
      return row?._sum.amount ? Number(row._sum.amount) : 0;
    };
    const round = (n: number) => Math.round(n * 100) / 100;

    // Build one income stream's expense breakdown from the shared aggregates.
    const breakdownFor = (id: string | null) => {
      const committed = committedBySource.get(id ?? NULL_KEY) ?? 0;
      const discretionary = sumRow(discretionaryRows, id);
      const goals = sumRow(goalRows, id);
      return {
        committed,
        discretionary,
        goals,
        spent: committed + discretionary + goals,
      };
    };

    const baseIncome = user.income ? Number(user.income) : 0;
    const rollover = user.rolloverAmount ? Number(user.rolloverAmount) : 0;

    // Salary entry: base income + rollover + unattributed income in, and all
    // unattributed spending out.
    const salaryReceived = baseIncome + rollover + sumRow(inflows, null);
    const salary = breakdownFor(null);

    const incomeLedger: IncomeLedgerInfo[] = [
      {
        id: 'salary',
        name: 'Salary',
        isSalary: true,
        received: round(salaryReceived),
        committed: round(salary.committed),
        discretionary: round(salary.discretionary),
        goals: round(salary.goals),
        spent: round(salary.spent),
        left: round(salaryReceived - salary.spent),
        frequency: user.incomeFrequency ?? null,
        nextPaymentDate: user.nextPayDate
          ? new Date(user.nextPayDate).toISOString()
          : null,
      },
    ];

    for (const source of sources) {
      const sourceRollover = Number(source.rolloverAmount);
      // This source's own carried-forward surplus in, same as salary folds
      // in user.rolloverAmount - see IncomeSource.rolloverAmount.
      const received = sumRow(inflows, source.id) + sourceRollover;
      const b = breakdownFor(source.id);
      // Skip paused sources with no money movement this period
      if (!source.isActive && received === 0 && b.spent === 0) {
        continue;
      }
      incomeLedger.push({
        id: source.id,
        name: source.name,
        isSalary: false,
        received: round(received),
        committed: round(b.committed),
        discretionary: round(b.discretionary),
        goals: round(b.goals),
        spent: round(b.spent),
        left: round(received - b.spent),
        frequency: source.frequency,
        nextPaymentDate: source.isActive
          ? source.nextPaymentDate.toISOString()
          : null,
        rolloverNotification: sourceNotifications.get(source.id) ?? null,
      });
    }

    return incomeLedger;
  }

  /**
   * Calculate committed expenses (recurring bills, scheduled payments)
   * A transaction is committed if it has:
   * - recurrence (not 'none' or empty)
   * - OR a dueDate
   * Note: status=PAID alone does NOT make a transaction committed.
   * One-off paid expenses with no dueDate/recurrence are discretionary.
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
        // Spending attributed to a named income source is tracked in that
        // source's own ledger entry/card (see calculateIncomeLedger), not
        // against the main total.
        incomeSourceId: null,
        AND: [
          // Condition 1: Is a committed transaction (recurring OR has a due date)
          // Note: status alone doesn't make something committed - PAID one-off expenses are discretionary
          {
            OR: [
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
      include: { category: { select: { name: true } } },
    });

    let plannedTotal = 0;
    let paidSoFar = 0;

    // Filter transactions to avoid double-counting:
    // - PAID transactions: count by date (payment date), NOT dueDate
    // - UPCOMING/OVERDUE: count by dueDate (when it's due)
    const filteredTransactions = committedTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      const dueDate = t.dueDate ? new Date(t.dueDate) : null;

      const dateInPeriod = transactionDate >= period.start && transactionDate <= period.end;
      const dueDateInPeriod = dueDate && dueDate >= period.start && dueDate <= period.end;

      if (t.status === PaymentStatus.PAID) {
        // For PAID transactions, only count if the payment DATE is in this period
        // This prevents counting a bill paid in a previous period just because dueDate is in this period
        if (!dateInPeriod && dueDateInPeriod) {
          return false;
        }
      } else {
        // For UPCOMING/OVERDUE, only count if dueDate is in this period
        // This prevents counting a future bill just because it was created (date) in this period
        if (dateInPeriod && !dueDateInPeriod) {
          return false;
        }
      }

      return true;
    });

    const now = new Date();
    const items: CommittedInfo['items'] = [];

    for (const t of filteredTransactions) {
      const amount = Number(t.amount);
      plannedTotal += amount;

      if (t.status === PaymentStatus.PAID) {
        paidSoFar += amount;
      }

      // Computed display status: PAID stays; a past-due unpaid bill is OVERDUE;
      // otherwise it's UPCOMING. Mirrors the transactions service so the
      // breakdown labels match what the bills/transactions views show.
      let displayStatus: string | null;
      if (t.status === PaymentStatus.PAID) {
        displayStatus = 'PAID';
      } else if (t.dueDate && new Date(t.dueDate) < now) {
        displayStatus = 'OVERDUE';
      } else {
        displayStatus = t.status ?? 'UPCOMING';
      }

      items.push({
        id: t.id,
        description: t.description,
        amount: Math.round(amount * 100) / 100,
        status: displayStatus,
        date: new Date(t.date).toISOString(),
        dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
        categoryName: (t as any).category?.name ?? null,
      });
    }

    // Sort by due date (then date) so the list reads chronologically.
    items.sort((a, b) => {
      const aKey = a.dueDate ?? a.date;
      const bKey = b.dueDate ?? b.date;
      return aKey.localeCompare(bKey);
    });

    return {
      plannedTotal: Math.round(plannedTotal * 100) / 100,
      paidSoFar: Math.round(paidSoFar * 100) / 100,
      remaining: Math.round((plannedTotal - paidSoFar) * 100) / 100,
      items,
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
        // Spending attributed to a named income source is tracked in that
        // source's own ledger entry/card, not against the main total.
        incomeSourceId: null,
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
            // Contributions funded by a named income source are tracked in
            // that source's own ledger entry/card, not against the main total.
            incomeSourceId: null,
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
  private getEmptySummary(user?: any): HomeSummaryResponse {
    const today = format(new Date(), 'yyyy-MM-dd');
    const isPro = user ? this.isProActive(user) : false;
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
        sources: [],
      },
      incomeLedger: [],
      outflows: {
        committed: {
          plannedTotal: 0,
          paidSoFar: 0,
          remaining: 0,
          items: [],
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
      user: {
        isPro,
        proExpiresAt: user?.proExpiresAt?.toISOString() || null,
      },
      features: this.getFeatureFlags(isPro),
    };
  }

  // ============================================================================
  // PAY PERIOD TRANSITION - Automatic rollover calculation
  // ============================================================================

  /**
   * Process pay period transition atomically
   * Calculates surplus from the previous period, updates rollover, and advances nextPayDate
   *
   * This runs automatically when getSummary() detects that nextPayDate is in the past,
   * ensuring rollover is always calculated correctly regardless of when the app is opened.
   */
  private async processPayPeriodTransition(user: any, userTimezone: string): Promise<any> {
    const nextPayDate = new Date(user.nextPayDate);
    const frequency = user.incomeFrequency;

    // Check if this is a new user who hasn't completed a pay period yet
    // New users have lastRolloverDate = null/undefined, meaning no rollover should be calculated
    // We just need to advance their nextPayDate to the correct period
    const isNewUser = !user.lastRolloverDate;

    if (isNewUser) {
      this.logger.log(`New user detected - skipping rollover calculation, just advancing pay period`);

      const newNextPayDate = this.dateService.calculateNextPayDateFromCurrent(nextPayDate, frequency);
      const baseIncome = user.income ? Number(user.income) : 0;

      const updatedUser = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id: user.id },
          data: {
            nextPayDate: newNextPayDate,
            lastRolloverDate: new Date(), // Mark that we've handled initial setup
            rolloverAmount: 0, // Ensure rollover starts at 0 for new users
          },
        });

        await this.materializePrimaryIncomeTransaction(
          tx,
          user.id,
          baseIncome,
          nextPayDate,
        );

        return updated;
      });

      this.logger.log(`New user pay period initialized. nextPayDate: ${format(newNextPayDate, 'yyyy-MM-dd')}`);
      return updatedUser;
    }

    // Calculate the PREVIOUS period boundaries (the period that just ended)
    const previousPeriodBoundaries = this.dateService.calculatePayPeriodBoundaries(
      nextPayDate,
      frequency,
      userTimezone
    );

    this.logger.log(`Processing transition for period: ${format(previousPeriodBoundaries.start, 'yyyy-MM-dd')} to ${format(previousPeriodBoundaries.end, 'yyyy-MM-dd')}`);

    // Current rollover amount (what was available from previous periods)
    const currentRollover = user.rolloverAmount ? Number(user.rolloverAmount) : 0;

    // Calculate what was spent vs what was available in the previous period
    const previousPeriodExpenses = await this.calculatePreviousPeriodExpenses(
      user.id,
      previousPeriodBoundaries
    );

    // Base income for that period
    const baseIncome = user.income ? Number(user.income) : 0;

    // Additional income in that period
    const additionalIncome = await this.calculateAdditionalIncome(user.id, previousPeriodBoundaries);

    // Total available = income + existing rollover
    const totalAvailable = baseIncome + additionalIncome + currentRollover;

    // New rollover = what remains after spending (can't go negative)
    const newRolloverAmount = Math.max(0, totalAvailable - previousPeriodExpenses);

    // Track how much was actually rolled over (for history)
    const amountRolledOver = Math.max(0, newRolloverAmount);

    // Calculate new next pay date
    const newNextPayDate = this.dateService.calculateNextPayDateFromCurrent(nextPayDate, frequency);

    this.logger.log(`Rollover calculation: available=${totalAvailable} (income=${baseIncome + additionalIncome}, rollover=${currentRollover}), spent=${previousPeriodExpenses}, newRollover=${newRolloverAmount}`);

    // Per-source rollover: each income source carries its own surplus
    // forward, independent of the main salary pool above (money attributed
    // to a source never touches user.rolloverAmount - see calculateIncome).
    // Same clamp-to-zero rule as the main pool: a source that overspent its
    // period just starts the next one at 0, no carried debt.
    const sources = await this.prisma.incomeSource.findMany({
      where: { userId: user.id },
    });
    const sourceRollovers = await Promise.all(
      sources.map(async (source) => {
        const currentSourceRollover = Number(source.rolloverAmount);
        const [sourceIncome, sourceExpenses] = await Promise.all([
          this.calculateAdditionalIncome(user.id, previousPeriodBoundaries, source.id),
          this.calculatePreviousPeriodExpenses(user.id, previousPeriodBoundaries, source.id),
        ]);
        const totalSourceAvailable = sourceIncome + currentSourceRollover;
        const newSourceRollover = Math.max(0, totalSourceAvailable - sourceExpenses);
        return { source, newSourceRollover };
      }),
    );

    // Perform atomic update - all or nothing
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      // Update user record
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          rolloverAmount: newRolloverAmount,
          nextPayDate: newNextPayDate,
          lastRolloverDate: new Date(),
        },
      });

      // Create rollover entry for history (only if there's something to roll over)
      if (amountRolledOver > 0) {
        await tx.rolloverEntry.create({
          data: {
            userId: user.id,
            amount: amountRolledOver,
            type: RolloverType.ROLLOVER,
            periodStart: previousPeriodBoundaries.start,
            periodEnd: previousPeriodBoundaries.end,
            description: `Auto-rollover from ${format(previousPeriodBoundaries.start, 'MMM d')} - ${format(previousPeriodBoundaries.end, 'MMM d')}`,
          },
        });

        // Create/update rollover notification for UI banner
        await tx.rolloverNotification.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            amount: amountRolledOver,
            fromPeriod: `${format(previousPeriodBoundaries.start, 'MMM d')} - ${format(previousPeriodBoundaries.end, 'MMM d')}`,
          },
          update: {
            amount: amountRolledOver,
            fromPeriod: `${format(previousPeriodBoundaries.start, 'MMM d')} - ${format(previousPeriodBoundaries.end, 'MMM d')}`,
            createdAt: new Date(),
            dismissedAt: null,
          },
        });

        this.logger.log(`Created rollover entry: $${amountRolledOver} from previous period`);
      }

      await this.materializePrimaryIncomeTransaction(
        tx,
        user.id,
        baseIncome,
        nextPayDate,
      );

      // Persist each income source's rollover, mirroring the main pool above.
      for (const { source, newSourceRollover } of sourceRollovers) {
        await tx.incomeSource.update({
          where: { id: source.id },
          data: {
            rolloverAmount: newSourceRollover,
            lastRolloverDate: new Date(),
          },
        });

        if (newSourceRollover > 0) {
          await tx.incomeSourceRolloverNotification.upsert({
            where: { incomeSourceId: source.id },
            create: {
              incomeSourceId: source.id,
              userId: user.id,
              amount: newSourceRollover,
              fromPeriod: `${format(previousPeriodBoundaries.start, 'MMM d')} - ${format(previousPeriodBoundaries.end, 'MMM d')}`,
            },
            update: {
              amount: newSourceRollover,
              fromPeriod: `${format(previousPeriodBoundaries.start, 'MMM d')} - ${format(previousPeriodBoundaries.end, 'MMM d')}`,
              createdAt: new Date(),
              dismissedAt: null,
            },
          });
        }
      }

      return updated;
    });

    this.logger.log(`Pay period transition complete. New nextPayDate: ${format(newNextPayDate, 'yyyy-MM-dd')}`);

    return updatedUser;
  }

  /**
   * Creates the real (but hidden) INCOME transaction backing a completed pay
   * period's salary, so actual-income totals (YTD/lifetime) reflect money
   * genuinely paid rather than a projection. isPrimaryIncome keeps it out of
   * the transaction list and every other total that already adds baseIncome
   * separately (see the isPrimaryIncome guards throughout this file and in
   * transactions.service.ts).
   */
  private async materializePrimaryIncomeTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    baseIncome: number,
    payDate: Date,
  ): Promise<void> {
    if (baseIncome <= 0) {
      return;
    }

    await tx.transaction.create({
      data: {
        userId,
        description: 'Primary Income',
        amount: baseIncome,
        date: payDate,
        type: TransactionType.INCOME,
        recurrence: 'none',
        isPrimaryIncome: true,
        notes: 'Auto-created from primary income (pay period transition)',
      },
    });
  }

  /**
   * Calculate additional income (beyond base salary) for a period.
   *
   * `incomeSourceId` scopes this to one income stream: null (default) means
   * unattributed income only (the main salary pool); passing a source id
   * scopes it to that source's own attributed income instead, for
   * per-source rollover. isPrimaryIncome is always excluded - callers add
   * baseIncome separately, so counting the materialized salary transaction
   * too would double it in the rollover/"available" total (source-scoped
   * calls never touch primary-income rows anyway).
   */
  private async calculateAdditionalIncome(
    userId: string,
    periodBoundaries: PayPeriodBoundaries,
    incomeSourceId: string | null = null,
  ): Promise<number> {
    const additionalIncomeResult = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.INCOME,
        isPrimaryIncome: false,
        incomeSourceId,
        date: {
          gte: periodBoundaries.start,
          lte: periodBoundaries.end,
        },
      },
      _sum: { amount: true },
    });

    return additionalIncomeResult._sum.amount
      ? Number(additionalIncomeResult._sum.amount)
      : 0;
  }

  /**
   * Calculate total expenses (committed + discretionary + goals) for a period
   * For rollover purposes, only count ACTUAL money spent (PAID transactions),
   * not planned/upcoming expenses that haven't been paid yet.
   *
   * `incomeSourceId` scopes this to one income stream: null (default) means
   * the main salary pool (unattributed spending only); passing a source id
   * scopes it to that source's own attributed spending instead, for
   * per-source rollover.
   */
  private async calculatePreviousPeriodExpenses(
    userId: string,
    periodBoundaries: PayPeriodBoundaries,
    incomeSourceId: string | null = null,
  ): Promise<number> {
    // Calculate committed expenses - ONLY PAID transactions
    // For rollover, we only count actual money spent, not upcoming/overdue bills
    const committedResult = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        status: PaymentStatus.PAID,
        incomeSourceId,
        date: {
          gte: periodBoundaries.start,
          lte: periodBoundaries.end,
        },
        // Committed = has recurrence OR has dueDate
        OR: [
          { recurrence: { notIn: ['none', ''] } },
          { dueDate: { not: null } },
        ],
      },
      _sum: { amount: true },
    });

    const committedTotal = committedResult._sum.amount
      ? Number(committedResult._sum.amount)
      : 0;

    // Calculate discretionary expenses for the period
    const discretionaryResult = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        incomeSourceId,
        date: { gte: periodBoundaries.start, lte: periodBoundaries.end },
        dueDate: null,
        AND: [
          {
            OR: [
              { recurrence: null },
              { recurrence: 'none' },
              { recurrence: '' },
            ],
          },
          {
            OR: [
              { status: null },
              { status: PaymentStatus.PAID },
            ],
          },
        ],
      },
      _sum: { amount: true },
    });
    const discretionaryTotal = discretionaryResult._sum.amount
      ? Number(discretionaryResult._sum.amount)
      : 0;

    // Calculate goal contributions for the period
    const goalContributions = await this.prisma.goalContribution.aggregate({
      where: {
        goal: { userId },
        date: { gte: periodBoundaries.start, lte: periodBoundaries.end },
        type: { in: [ContributionType.MANUAL, ContributionType.AUTOMATIC, ContributionType.TRANSACTION] },
        incomeSourceId,
      },
      _sum: { amount: true },
    });
    const goalsTotal = goalContributions._sum.amount
      ? Number(goalContributions._sum.amount)
      : 0;

    const totalExpenses = committedTotal + discretionaryTotal + goalsTotal;

    this.logger.log(`Previous period expenses (PAID only, source=${incomeSourceId ?? 'salary'}): committed=${committedTotal}, discretionary=${discretionaryTotal}, goals=${goalsTotal}, total=${totalExpenses}`);

    return Math.round(totalExpenses * 100) / 100;
  }

  /**
   * Get rollover notification for the user (if not dismissed)
   * Returns null if no notification, already dismissed, or auto-expired (3+ days old)
   *
   * Auto-expiry: After 3 days, the notification is automatically dismissed
   * and the rollover amount stays in the spendable pool.
   */
  private async getRolloverNotification(userId: string): Promise<RolloverNotificationInfo | null> {
    const notification = await this.prisma.rolloverNotification.findFirst({
      where: {
        userId,
        dismissedAt: null,
      },
    });

    if (!notification) {
      return null;
    }

    // Check if notification is older than 3 days (auto-expiry)
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const notificationAge = Date.now() - notification.createdAt.getTime();

    if (notificationAge > THREE_DAYS_MS) {
      // Auto-dismiss expired notification
      await this.prisma.rolloverNotification.update({
        where: { id: notification.id },
        data: { dismissedAt: new Date() },
      });

      this.logger.log(
        `Rollover notification auto-dismissed after 3 days. Amount ${notification.amount} stays in spendable pool.`,
      );

      return null;
    }

    return {
      amount: Number(notification.amount),
      fromPeriod: notification.fromPeriod,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  /**
   * Same as getRolloverNotification, scoped to a single income source's
   * rollover banner instead of the main salary one.
   */
  private async getSourceRolloverNotification(
    incomeSourceId: string,
  ): Promise<RolloverNotificationInfo | null> {
    const notification = await this.prisma.incomeSourceRolloverNotification.findFirst({
      where: {
        incomeSourceId,
        dismissedAt: null,
      },
    });

    if (!notification) {
      return null;
    }

    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const notificationAge = Date.now() - notification.createdAt.getTime();

    if (notificationAge > THREE_DAYS_MS) {
      await this.prisma.incomeSourceRolloverNotification.update({
        where: { id: notification.id },
        data: { dismissedAt: new Date() },
      });

      this.logger.log(
        `Income source rollover notification auto-dismissed after 3 days. Amount ${notification.amount} stays in spendable pool.`,
      );

      return null;
    }

    return {
      amount: Number(notification.amount),
      fromPeriod: notification.fromPeriod,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
