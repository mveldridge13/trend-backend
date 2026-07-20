import { Injectable, NotFoundException } from "@nestjs/common";
import { addDays, endOfDay, format, startOfDay } from "date-fns";
import { IncomeFrequency } from "@prisma/client";
import { UsersRepository } from "../users/repositories/users.repository";
import { TransactionsService } from "../transactions/transactions.service";
import { IncomeSourcesService } from "../income-sources/income-sources.service";
import { HomeService } from "../home/home.service";
import { DateService } from "../common/services/date.service";
import { PrismaService } from "../database/prisma.service";
import { expandBillRecurrence } from "../common/utils/recurrence.util";
import { PlansService } from "./plans.service";
import {
  DailyBalance,
  FinancialEvent,
  ForecastResult,
} from "./interfaces/financial-event.interface";

/**
 * Read-only simulation layer over Income/IncomeSources/Bills/Plans. Never
 * mutates real data itself (in particular, never calls
 * IncomeSourcesService.materializeDueTransactions directly) — it only reads
 * current state and projects it forward analytically. Note: HomeService.
 * getSummary() *does* lazily materialize due income-source occurrences and
 * process pay-period transitions as a side effect of reading — that's
 * inherited, pre-existing Dashboard behavior we reuse rather than duplicate,
 * not something the Planner introduces.
 */
@Injectable()
export class CashFlowEngineService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly transactionsService: TransactionsService,
    private readonly incomeSourcesService: IncomeSourcesService,
    private readonly homeService: HomeService,
    private readonly dateService: DateService,
    private readonly prisma: PrismaService,
    private readonly plansService: PlansService,
  ) {}

  async getForecast(userId: string, days: number): Promise<ForecastResult> {
    // getSummary is the single source of truth for "today's balance" (Left to
    // Spend + income-source surplus) and may advance nextPayDate/rolloverAmount
    // via a pay-period transition — so it must run BEFORE we read the user
    // record for income projection, or we'd seed from a stale nextPayDate.
    const summary = await this.homeService.getSummary(userId);
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const timezone = user.timezone || "UTC";
    const today = startOfDay(this.dateService.getNowInUserTimezone(timezone));
    const horizonEnd = endOfDay(addDays(today, days));
    // Bills already due within the remainder of the current pay period are
    // already subtracted from leftToSpendSafe (see HomeService.calculateCommitted).
    // Project bill occurrences only from the NEXT period onward, or they'd be
    // double-subtracted: once via today's starting balance, once via the event.
    const currentPeriodEnd = new Date(summary.period.end);

    const todaysBalance =
      summary.totals.leftToSpendSafe +
      summary.incomeLedger
        .filter((entry) => !entry.isSalary)
        .reduce((sum, entry) => sum + entry.left, 0);

    const events: FinancialEvent[] = [
      ...this.buildPrimaryIncomeEvents(user, horizonEnd),
      ...(await this.buildIncomeSourceEvents(userId, horizonEnd)),
      ...(await this.buildRecurringBillEvents(userId, horizonEnd, currentPeriodEnd)),
      ...(await this.buildPlanEvents(userId, today, horizonEnd)),
    ];
    events.sort((a, b) => a.date.localeCompare(b.date));

    const settings = await this.prisma.plannerSettings.findUnique({
      where: { userId },
    });
    const safetyBuffer =
      settings?.safetyBufferAmount != null
        ? Number(settings.safetyBufferAmount)
        : null;

    const dailyBalances = this.buildDailyBalances(
      events,
      todaysBalance,
      today,
      days,
    );
    const breaches: DailyBalance[] =
      safetyBuffer !== null
        ? dailyBalances.filter((d) => d.balance < safetyBuffer)
        : [];

    return { events, dailyBalances, breaches };
  }

  private buildPrimaryIncomeEvents(
    user: { id: string; income: unknown; incomeFrequency: IncomeFrequency | null; nextPayDate: Date | null },
    horizonEnd: Date,
  ): FinancialEvent[] {
    if (!user.income || !user.incomeFrequency || !user.nextPayDate) {
      return [];
    }

    const amount = Number(user.income);
    const dates = this.dateService.expandPayDates(
      new Date(user.nextPayDate),
      user.incomeFrequency,
      horizonEnd,
    );

    return dates.map((date) => ({
      date: format(date, "yyyy-MM-dd"),
      amount,
      direction: "INFLOW" as const,
      sourceType: "PRIMARY_INCOME" as const,
      sourceId: user.id,
      isRequired: true,
      description: "Primary income",
    }));
  }

  private async buildIncomeSourceEvents(
    userId: string,
    horizonEnd: Date,
  ): Promise<FinancialEvent[]> {
    const sources = await this.incomeSourcesService.findAll(userId);
    const events: FinancialEvent[] = [];

    for (const source of sources.filter((s) => s.isActive)) {
      const dates = this.dateService.expandPayDates(
        new Date(source.nextPaymentDate),
        source.frequency as IncomeFrequency,
        horizonEnd,
      );
      for (const date of dates) {
        events.push({
          date: format(date, "yyyy-MM-dd"),
          amount: Number(source.amount),
          direction: "INFLOW",
          sourceType: "INCOME_SOURCE",
          sourceId: source.id,
          isRequired: true,
          description: source.name,
        });
      }
    }

    return events;
  }

  private async buildRecurringBillEvents(
    userId: string,
    horizonEnd: Date,
    currentPeriodEnd: Date,
  ): Promise<FinancialEvent[]> {
    const bills = await this.transactionsService.getRecurringBillSeeds(userId);
    const events: FinancialEvent[] = [];

    for (const bill of bills) {
      if (!bill.dueDate || !bill.recurrence) continue;
      const dates = expandBillRecurrence(bill.dueDate, bill.recurrence, horizonEnd)
        // Skip occurrences already reflected in today's starting balance (see
        // the double-counting note in getForecast). This is a simplification:
        // it uses the main pay period's boundary for every bill, even ones
        // attributed to a named income source with its own period cycle, so
        // an income-source-attributed bill due later in that source's own
        // period could in theory still be excluded incorrectly. Acceptable
        // for now — the common case (unattributed bills) is exact.
        .filter((date) => date > currentPeriodEnd);
      for (const date of dates) {
        events.push({
          date: format(date, "yyyy-MM-dd"),
          amount: Number(bill.amount),
          direction: "OUTFLOW",
          sourceType: "RECURRING_BILL",
          sourceId: bill.id,
          isRequired: true,
          description: bill.description,
        });
      }
    }

    return events;
  }

  private async buildPlanEvents(
    userId: string,
    today: Date,
    horizonEnd: Date,
  ): Promise<FinancialEvent[]> {
    const plans = await this.plansService.findActive(userId);

    return plans
      .filter((plan) => plan.plannedDate >= today && plan.plannedDate <= horizonEnd)
      .map((plan) => ({
        date: format(plan.plannedDate, "yyyy-MM-dd"),
        amount: Number(plan.amount),
        direction: plan.direction,
        sourceType: "PLAN" as const,
        sourceId: plan.id,
        isRequired: false,
        description: plan.description || plan.type,
      }));
  }

  private buildDailyBalances(
    events: FinancialEvent[],
    startingBalance: number,
    today: Date,
    days: number,
  ): DailyBalance[] {
    const eventsByDate = new Map<string, FinancialEvent[]>();
    for (const event of events) {
      const bucket = eventsByDate.get(event.date) ?? [];
      bucket.push(event);
      eventsByDate.set(event.date, bucket);
    }

    const dailyBalances: DailyBalance[] = [];
    let runningBalance = startingBalance;

    for (let i = 0; i <= days; i++) {
      const dayKey = format(addDays(today, i), "yyyy-MM-dd");
      const dayEvents = eventsByDate.get(dayKey) ?? [];
      for (const event of dayEvents) {
        runningBalance +=
          event.direction === "INFLOW" ? event.amount : -event.amount;
      }
      dailyBalances.push({
        date: dayKey,
        balance: Math.round(runningBalance * 100) / 100,
      });
    }

    return dailyBalances;
  }
}
