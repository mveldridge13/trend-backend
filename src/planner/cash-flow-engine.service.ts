import { Injectable, NotFoundException } from "@nestjs/common";
import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  format,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";
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
  PlanInsight,
  PlanInsightBreakdownItem,
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
    // Bills due within the current pay period are already subtracted from
    // leftToSpendSafe (see HomeService.calculateCommitted, which scopes to
    // dueDate BETWEEN period.start AND period.end - both bounds matter here,
    // not just the end). Project bill occurrences only from the next period
    // onward, or they'd be double-subtracted: once via today's starting
    // balance, once via the event.
    const currentPeriodStart = new Date(summary.period.start);
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
      if (
        bill?.dueDate &&
        new Date(bill.dueDate) >= currentPeriodStart &&
        new Date(bill.dueDate) <= currentPeriodEnd
      ) {
        // Already subtracted from leftToSpendSafe as this period's committed
        // spend - add it back since the plan is moving it to a later event.
        // A bill due BEFORE this period started (a carried-over overdue bill)
        // was never subtracted here in the first place - adding it back
        // would invent money that was never taken out.
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
    const baselineBillEvents = this.buildRecurringBillEvents(
      bills,
      today,
      horizonEnd,
      currentPeriodStart,
      currentPeriodEnd,
      [],
    );
    const adjustedBillEvents = this.buildRecurringBillEvents(
      bills,
      today,
      horizonEnd,
      currentPeriodStart,
      currentPeriodEnd,
      billChangePlans,
    );
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

    // Next pay period's boundaries, for "does this overload your next
    // period's committed bills" insights. Only computable if the user has
    // pay-period info configured at all (same guard as primary income).
    let nextPeriodStart: Date | null = null;
    let nextPeriodEnd: Date | null = null;
    if (user.nextPayDate && user.incomeFrequency) {
      const nextPeriodPayDate = this.dateService.calculateNextPayDateFromCurrent(
        new Date(user.nextPayDate),
        user.incomeFrequency,
      );
      const nextPeriodBoundaries = this.dateService.calculatePayPeriodBoundaries(
        nextPeriodPayDate,
        user.incomeFrequency,
        timezone,
      );
      nextPeriodStart = nextPeriodBoundaries.start;
      nextPeriodEnd = nextPeriodBoundaries.end;
    }

    const insights = this.buildInsights(
      plans,
      billsById,
      events,
      dailyBalances,
      baselineDailyBalances,
      today,
      currentPeriodStart,
      currentPeriodEnd,
      nextPeriodStart,
      nextPeriodEnd,
      user.currency || "USD",
    );

    return { events, dailyBalances, breaches, baselineDailyBalances, baselineBreaches, insights };
  }

  /**
   * Schedule-level observations about each active plan's consequences -
   * clustering, income timing, pay-period shift, cash availability, risk.
   * Deliberately not just a balance delta: "your lowest balance goes from X
   * to Y" doesn't explain WHY, and reads as arbitrary (or worse, like free
   * money) even when the underlying math is correct. See memory/conversation
   * history - this was built after a real user complaint that a mathematically
   * correct balance swing looked like a bug because nothing explained it.
   */
  private buildInsights(
    plans: Plan[],
    billsById: Map<string, Transaction>,
    events: FinancialEvent[],
    dailyBalances: DailyBalance[],
    baselineDailyBalances: DailyBalance[],
    today: Date,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    nextPeriodStart: Date | null,
    nextPeriodEnd: Date | null,
    currency: string,
  ): PlanInsight[] {
    const insights: PlanInsight[] = [];
    const money = new Intl.NumberFormat("en-US", { style: "currency", currency });
    const dateLabel = (d: Date) => format(d, "d MMM");

    for (const plan of plans) {
      const newDate = plan.plannedDate;
      const linkedBill =
        plan.type === "BILL_CHANGE" && plan.linkedEntityId
          ? billsById.get(plan.linkedEntityId)
          : undefined;
      // Clamped to today for display/comparison purposes (an overdue bill is
      // effectively "due now").
      //
      // For BILL_CHANGE, "original" is the real bill's current due date. For
      // every other plan type there's no linked real-world date to diff
      // against - previousPlannedDate (set by PlansService.update whenever
      // plannedDate actually changes) is the only available "before" state,
      // so a plain PURCHASE/INCOME/GOAL_CHANGE/DEBT_PAYMENT plan only gets
      // these insights once it's been moved at least once (a brand new plan
      // has no "before" to compare to, which is correct - it just IS at its
      // date).
      const realOriginalDate = linkedBill?.dueDate
        ? new Date(linkedBill.dueDate)
        : (plan.previousPlannedDate ?? undefined);
      const originalDate = realOriginalDate && (realOriginalDate < today ? today : realOriginalDate);

      // 2. Bill clustering - does the new date now land on, or near, other
      // payments? A 3-day window (not just the exact same day) catches "this
      // bunches up spending in the same week" even when nothing lands on the
      // literal same date. Message is deliberately just the headline count -
      // the breakdown carries the detail (which payments, committed vs
      // discretionary) for the frontend to drill into on click, rather than
      // cramming a name list into the message itself.
      const newDateKey = format(newDate, "yyyy-MM-dd");
      const CLUSTER_WINDOW_DAYS = 3;
      const nearbyOutflows = events.filter(
        (e) =>
          e.direction === "OUTFLOW" &&
          e.sourceId !== plan.id &&
          Math.abs(differenceInCalendarDays(parseISO(e.date), parseISO(newDateKey))) <=
            CLUSTER_WINDOW_DAYS,
      );
      if (nearbyOutflows.length > 0) {
        // isRequired mirrors "committed" (a real, already-scheduled bill) vs
        // "discretionary" (a Draft/Planned Plan - hypothetical regardless of
        // its type, a PURCHASE plan is discretionary spend, not committed).
        const breakdown: PlanInsightBreakdownItem[] = [
          {
            id: plan.id,
            name: plan.description || plan.type,
            amount: Number(plan.amount),
            date: newDateKey,
            kind: "discretionary",
          },
          ...nearbyOutflows.map((e) => ({
            id: `${e.sourceId}-${e.date}`,
            name: e.description,
            amount: e.amount,
            date: e.date,
            kind: (e.isRequired ? "committed" : "discretionary") as "committed" | "discretionary",
          })),
        ];
        insights.push({
          planId: plan.id,
          severity: "warning",
          message: `${breakdown.length} payments now fall in the same week.`,
          breakdown,
        });
      }

      // 5. Pay-period shift
      if (originalDate) {
        const wasInCurrentPeriod = originalDate <= currentPeriodEnd;
        const isInCurrentPeriod = newDate <= currentPeriodEnd;
        if (wasInCurrentPeriod && !isInCurrentPeriod && nextPeriodStart && nextPeriodEnd) {
          insights.push({
            planId: plan.id,
            severity: "neutral",
            message: `This now falls in the pay period of ${dateLabel(nextPeriodStart)} - ${dateLabel(nextPeriodEnd)}.`,
          });
        } else if (!wasInCurrentPeriod && isInCurrentPeriod) {
          insights.push({
            planId: plan.id,
            severity: "neutral",
            message: `This now falls in the pay period of ${dateLabel(currentPeriodStart)} - ${dateLabel(currentPeriodEnd)}.`,
          });
        }
      }
    }

    // 4. Risk - scenario-level, not attributable to one plan when several
    // are active, so it's computed once rather than per-plan.
    if (plans.length > 0) {
      const newNegative = dailyBalances.filter((d) => d.balance < 0);
      const baselineNegative = baselineDailyBalances.filter((d) => d.balance < 0);
      if (newNegative.length > 0 && baselineNegative.length === 0) {
        insights.push({
          planId: "",
          severity: "warning",
          message: `This creates a negative balance starting ${dateLabel(new Date(newNegative[0].date))}.`,
        });
      } else if (newNegative.length === 0) {
        insights.push({
          planId: "",
          severity: "positive",
          message: "Your balance remains positive throughout this forecast.",
        });
      }
    }

    return insights;
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
    today: Date,
    horizonEnd: Date,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    billChangePlans: Plan[],
  ): FinancialEvent[] {
    const events: FinancialEvent[] = [];
    const movedBillIds = new Set(billChangePlans.map((p) => p.linkedEntityId));

    for (const bill of bills) {
      if (!bill.dueDate || !bill.recurrence) continue;
      const dates = expandBillRecurrence(bill.dueDate, bill.recurrence, horizonEnd)
        // Skip occurrences already reflected in today's starting balance (see
        // the double-counting note in getForecast and calculateCommitted's
        // exact [period.start, period.end] bound). Occurrences BEFORE
        // period.start (a carried-over overdue bill) are NOT already
        // reflected there - those still need an event, just clamped to
        // today below rather than shown on a date in the past. This is a
        // simplification: it uses the main pay period's boundary for every
        // bill, even ones attributed to a named income source with its own
        // period cycle. Acceptable for now — the common case (unattributed
        // bills) is exact.
        .filter((date) => date < currentPeriodStart || date > currentPeriodEnd)
        // Skip the specific occurrence an active BILL_CHANGE plan is moving -
        // it's represented by the plan's own event on the new date instead,
        // so counting both would double the outflow.
        .filter((date) => !(movedBillIds.has(bill.id) && isSameDay(date, bill.dueDate!)));
      for (const date of dates) {
        // An overdue occurrence (before today) has already happened as far
        // as the forecast is concerned - show it landing today rather than
        // on a past date the chart/timeline can't represent.
        const eventDate = date < today ? today : date;
        events.push({
          date: format(eventDate, "yyyy-MM-dd"),
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
