import { Injectable, NotFoundException } from "@nestjs/common";
import { addDays, endOfDay, format, isSameDay, startOfDay } from "date-fns";
import { IncomeFrequency, Plan, Transaction } from "@prisma/client";
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

    const plans = await this.plansService.findActive(userId);
    const bills = await this.transactionsService.getRecurringBillSeeds(userId);

    // A BILL_CHANGE plan represents moving one specific occurrence of a real
    // recurring bill to a new date. Without this adjustment, that occurrence
    // would be counted twice: once via the real bill (baked into
    // leftToSpendSafe if due this period, or as its own forecast event if
    // later) and again via the plan's own event on the new date.
    const billChangePlans = plans.filter(
      (p) => p.type === "BILL_CHANGE" && p.linkedEntityId,
    );
    const billsById = new Map(bills.map((b) => [b.id, b]));
    let billChangeAdjustment = 0;
    for (const plan of billChangePlans) {
      const bill = billsById.get(plan.linkedEntityId!);
      if (bill?.dueDate && new Date(bill.dueDate) <= currentPeriodEnd) {
        // Already subtracted from leftToSpendSafe as this period's committed
        // spend - add it back since the plan is moving it to a later event.
        billChangeAdjustment += Number(bill.amount);
      }
    }

    const baseTodaysBalance =
      summary.totals.leftToSpendSafe +
      summary.incomeLedger
        .filter((entry) => !entry.isSalary)
        .reduce((sum, entry) => sum + entry.left, 0);
    const todaysBalance = baseTodaysBalance + billChangeAdjustment;

    const realEvents: FinancialEvent[] = [
      ...this.buildPrimaryIncomeEvents(user, horizonEnd),
      ...(await this.buildIncomeSourceEvents(userId, horizonEnd)),
    ];
    // Baseline = real bills only, no plan-driven suppression - "if nothing
    // changes." The with-plans view suppresses/adjusts for active BILL_CHANGE
    // plans (see buildRecurringBillEvents).
    const baselineBillEvents = this.buildRecurringBillEvents(bills, horizonEnd, currentPeriodEnd, []);
    const adjustedBillEvents = this.buildRecurringBillEvents(bills, horizonEnd, currentPeriodEnd, billChangePlans);
    const planEvents = this.buildPlanEvents(plans, today, horizonEnd);

    const baselineEvents = [...realEvents, ...baselineBillEvents].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const events = [...realEvents, ...adjustedBillEvents, ...planEvents].sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const settings = await this.prisma.plannerSettings.findUnique({
      where: { userId },
    });
    const safetyBuffer =
      settings?.safetyBufferAmount != null
        ? Number(settings.safetyBufferAmount)
        : null;

    const dailyBalances = this.buildDailyBalances(events, todaysBalance, today, days);
    const baselineDailyBalances = this.buildDailyBalances(
      baselineEvents,
      baseTodaysBalance,
      today,
      days,
    );
    const breaches: DailyBalance[] =
      safetyBuffer !== null
        ? dailyBalances.filter((d) => d.balance < safetyBuffer)
        : [];
    const baselineBreaches: DailyBalance[] =
      safetyBuffer !== null
        ? baselineDailyBalances.filter((d) => d.balance < safetyBuffer)
        : [];

    return { events, dailyBalances, breaches, baselineDailyBalances, baselineBreaches };
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

  private buildRecurringBillEvents(
    bills: Transaction[],
    horizonEnd: Date,
    currentPeriodEnd: Date,
    billChangePlans: Plan[],
  ): FinancialEvent[] {
    const events: FinancialEvent[] = [];
    const movedBillIds = new Set(billChangePlans.map((p) => p.linkedEntityId));

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
        .filter((date) => date > currentPeriodEnd)
        // Skip the specific occurrence an active BILL_CHANGE plan is moving -
        // it's represented by the plan's own event on the new date instead,
        // so counting both would double the outflow.
        .filter((date) => !(movedBillIds.has(bill.id) && isSameDay(date, bill.dueDate!)));
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

  private buildPlanEvents(
    plans: Plan[],
    today: Date,
    horizonEnd: Date,
  ): FinancialEvent[] {
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
