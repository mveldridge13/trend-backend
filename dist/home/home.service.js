"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var HomeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const date_service_1 = require("../common/services/date.service");
const income_sources_service_1 = require("../income-sources/income-sources.service");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
let HomeService = HomeService_1 = class HomeService {
    constructor(prisma, dateService, incomeSourcesService) {
        this.prisma = prisma;
        this.dateService = dateService;
        this.incomeSourcesService = incomeSourcesService;
        this.logger = new common_1.Logger(HomeService_1.name);
    }
    async getSummary(userId) {
        let user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!user.nextPayDate || !user.incomeFrequency) {
            return this.getEmptySummary(user);
        }
        const userTimezone = this.dateService.getValidTimezone(user.timezone);
        let nextPayDate = new Date(user.nextPayDate);
        const frequency = user.incomeFrequency;
        await this.incomeSourcesService.materializeDueTransactions(userId, userTimezone);
        let transitionCount = 0;
        const maxTransitions = 12;
        while (this.dateService.shouldTransitionPayPeriod(nextPayDate, userTimezone) &&
            transitionCount < maxTransitions) {
            this.logger.log(`Pay period transition ${transitionCount + 1} detected for user ${userId}`);
            user = await this.processPayPeriodTransition(user, userTimezone);
            nextPayDate = new Date(user.nextPayDate);
            transitionCount++;
        }
        if (transitionCount > 0) {
            this.logger.log(`Processed ${transitionCount} pay period transition(s) for user ${userId}`);
        }
        const periodBoundaries = this.dateService.calculatePayPeriodBoundaries(nextPayDate, frequency, userTimezone);
        const [income, committed, discretionary, goals, rolloverNotification, incomeLedger] = await Promise.all([
            this.calculateIncome(user, periodBoundaries),
            this.calculateCommitted(userId, periodBoundaries),
            this.calculateDiscretionary(userId, periodBoundaries),
            this.calculateGoals(userId, periodBoundaries, frequency),
            this.getRolloverNotification(userId),
            this.calculateIncomeLedger(user, periodBoundaries),
        ]);
        const totals = this.calculateTotals(income, committed, discretionary, goals);
        const isPro = this.isProActive(user);
        const response = {
            period: {
                start: (0, date_fns_1.format)(periodBoundaries.start, 'yyyy-MM-dd'),
                end: (0, date_fns_1.format)(periodBoundaries.end, 'yyyy-MM-dd'),
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
        if (rolloverNotification) {
            response.rolloverNotification = rolloverNotification;
        }
        return response;
    }
    isProActive(user) {
        if (!user.isPro)
            return false;
        if (!user.proExpiresAt)
            return true;
        return new Date(user.proExpiresAt) > new Date();
    }
    getFeatureFlags(isPro) {
        return {
            spendingVelocityDetails: isPro,
            advancedAnalytics: isPro,
            exportData: isPro,
            aiAssistant: isPro,
        };
    }
    async calculateIncome(user, period) {
        const baseIncome = user.income ? Number(user.income) : 0;
        const additionalIncomeResult = await this.prisma.transaction.aggregate({
            where: {
                userId: user.id,
                type: client_1.TransactionType.INCOME,
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
        const sourceSums = await this.prisma.transaction.groupBy({
            by: ['incomeSourceId'],
            where: {
                userId: user.id,
                type: client_1.TransactionType.INCOME,
                incomeSourceId: { not: null },
                date: {
                    gte: period.start,
                    lte: period.end,
                },
            },
            _sum: { amount: true },
        });
        let sources = [];
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
        const rolloverAvailable = user.rolloverAmount ? Number(user.rolloverAmount) : 0;
        return {
            baseIncome: Math.round(baseIncome * 100) / 100,
            additionalIncome: Math.round(additionalIncome * 100) / 100,
            rolloverAvailable: Math.round(rolloverAvailable * 100) / 100,
            totalInflow: Math.round((baseIncome + additionalIncome + rolloverAvailable) * 100) / 100,
            sources,
        };
    }
    async calculateIncomeLedger(user, period) {
        const userId = user.id;
        const sources = await this.prisma.incomeSource.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
        if (sources.length === 0) {
            return [];
        }
        const [inflows, discretionaryRows, goalRows, committedTx] = await Promise.all([
            this.prisma.transaction.groupBy({
                by: ['incomeSourceId'],
                where: {
                    userId,
                    type: client_1.TransactionType.INCOME,
                    date: { gte: period.start, lte: period.end },
                },
                _sum: { amount: true },
            }),
            this.prisma.transaction.groupBy({
                by: ['incomeSourceId'],
                where: {
                    userId,
                    type: client_1.TransactionType.EXPENSE,
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
                        { OR: [{ status: null }, { status: client_1.PaymentStatus.PAID }] },
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
                            client_1.ContributionType.MANUAL,
                            client_1.ContributionType.AUTOMATIC,
                            client_1.ContributionType.TRANSACTION,
                        ],
                    },
                },
                _sum: { amount: true },
            }),
            this.prisma.transaction.findMany({
                where: {
                    userId,
                    type: client_1.TransactionType.EXPENSE,
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
        const NULL_KEY = '__null__';
        const committedBySource = new Map();
        for (const t of committedTx) {
            const transactionDate = new Date(t.date);
            const dueDate = t.dueDate ? new Date(t.dueDate) : null;
            const dateInPeriod = transactionDate >= period.start && transactionDate <= period.end;
            const dueDateInPeriod = !!dueDate && dueDate >= period.start && dueDate <= period.end;
            if (t.status === client_1.PaymentStatus.PAID) {
                if (!dateInPeriod && dueDateInPeriod)
                    continue;
            }
            else {
                if (dateInPeriod && !dueDateInPeriod)
                    continue;
            }
            const key = t.incomeSourceId ?? NULL_KEY;
            committedBySource.set(key, (committedBySource.get(key) ?? 0) + Number(t.amount));
        }
        const sumRow = (rows, key) => {
            const row = rows.find((r) => r.incomeSourceId === key);
            return row?._sum.amount ? Number(row._sum.amount) : 0;
        };
        const round = (n) => Math.round(n * 100) / 100;
        const breakdownFor = (id) => {
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
        const salaryReceived = baseIncome + rollover + sumRow(inflows, null);
        const salary = breakdownFor(null);
        const incomeLedger = [
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
            const received = sumRow(inflows, source.id);
            const b = breakdownFor(source.id);
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
            });
        }
        return incomeLedger;
    }
    async calculateCommitted(userId, period) {
        const committedTransactions = await this.prisma.transaction.findMany({
            where: {
                userId,
                type: client_1.TransactionType.EXPENSE,
                AND: [
                    {
                        OR: [
                            { recurrence: { notIn: ['none', ''] } },
                            { dueDate: { not: null } },
                        ],
                    },
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
        const filteredTransactions = committedTransactions.filter(t => {
            const transactionDate = new Date(t.date);
            const dueDate = t.dueDate ? new Date(t.dueDate) : null;
            const dateInPeriod = transactionDate >= period.start && transactionDate <= period.end;
            const dueDateInPeriod = dueDate && dueDate >= period.start && dueDate <= period.end;
            if (t.status === client_1.PaymentStatus.PAID) {
                if (!dateInPeriod && dueDateInPeriod) {
                    return false;
                }
            }
            else {
                if (dateInPeriod && !dueDateInPeriod) {
                    return false;
                }
            }
            return true;
        });
        const now = new Date();
        const items = [];
        for (const t of filteredTransactions) {
            const amount = Number(t.amount);
            plannedTotal += amount;
            if (t.status === client_1.PaymentStatus.PAID) {
                paidSoFar += amount;
            }
            let displayStatus;
            if (t.status === client_1.PaymentStatus.PAID) {
                displayStatus = 'PAID';
            }
            else if (t.dueDate && new Date(t.dueDate) < now) {
                displayStatus = 'OVERDUE';
            }
            else {
                displayStatus = t.status ?? 'UPCOMING';
            }
            items.push({
                id: t.id,
                description: t.description,
                amount: Math.round(amount * 100) / 100,
                status: displayStatus,
                date: new Date(t.date).toISOString(),
                dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
                categoryName: t.category?.name ?? null,
            });
        }
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
    async calculateDiscretionary(userId, period) {
        const discretionaryResult = await this.prisma.transaction.aggregate({
            where: {
                userId,
                type: client_1.TransactionType.EXPENSE,
                date: {
                    gte: period.start,
                    lte: period.end,
                },
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
                            { status: client_1.PaymentStatus.PAID },
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
    async calculateGoals(userId, period, frequency) {
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
                        type: {
                            in: [client_1.ContributionType.MANUAL, client_1.ContributionType.AUTOMATIC, client_1.ContributionType.TRANSACTION],
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
            let goalPlanned = 0;
            if (goal.type === client_1.GoalType.DEBT_PAYOFF && goal.minimumPayment) {
                goalPlanned = this.dateService.prorateMonthlyAmount(Number(goal.minimumPayment), frequency);
            }
            else if (goal.monthlyTarget) {
                goalPlanned = this.dateService.prorateMonthlyAmount(Number(goal.monthlyTarget), frequency);
            }
            const goalPaid = goal.contributions.reduce((sum, c) => sum + Number(c.amount), 0);
            plannedTotal += goalPlanned;
            paidSoFar += goalPaid;
            if (goal.type === client_1.GoalType.DEBT_PAYOFF) {
                debtPlannedTotal += goalPlanned;
                debtPaidSoFar += goalPaid;
            }
            else {
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
    calculateTotals(income, committed, discretionary, goals) {
        const totalExpensesAllocated = committed.plannedTotal + discretionary.spentSoFar + goals.paidSoFar;
        const leftToSpendSafe = income.totalInflow - totalExpensesAllocated;
        return {
            totalExpensesAllocated: Math.round(totalExpensesAllocated * 100) / 100,
            leftToSpendSafe: Math.round(leftToSpendSafe * 100) / 100,
        };
    }
    getEmptySummary(user) {
        const today = (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
        const isPro = user ? this.isProActive(user) : false;
        return {
            period: {
                start: today,
                end: today,
                frequency: client_1.IncomeFrequency.MONTHLY,
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
    async processPayPeriodTransition(user, userTimezone) {
        const nextPayDate = new Date(user.nextPayDate);
        const frequency = user.incomeFrequency;
        const isNewUser = !user.lastRolloverDate;
        if (isNewUser) {
            this.logger.log(`New user detected - skipping rollover calculation, just advancing pay period`);
            const newNextPayDate = this.dateService.calculateNextPayDateFromCurrent(nextPayDate, frequency);
            const updatedUser = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    nextPayDate: newNextPayDate,
                    lastRolloverDate: new Date(),
                    rolloverAmount: 0,
                },
            });
            this.logger.log(`New user pay period initialized. nextPayDate: ${(0, date_fns_1.format)(newNextPayDate, 'yyyy-MM-dd')}`);
            return updatedUser;
        }
        const previousPeriodBoundaries = this.dateService.calculatePayPeriodBoundaries(nextPayDate, frequency, userTimezone);
        this.logger.log(`Processing transition for period: ${(0, date_fns_1.format)(previousPeriodBoundaries.start, 'yyyy-MM-dd')} to ${(0, date_fns_1.format)(previousPeriodBoundaries.end, 'yyyy-MM-dd')}`);
        const currentRollover = user.rolloverAmount ? Number(user.rolloverAmount) : 0;
        const previousPeriodExpenses = await this.calculatePreviousPeriodExpenses(user, previousPeriodBoundaries);
        const baseIncome = user.income ? Number(user.income) : 0;
        const additionalIncome = await this.calculateAdditionalIncome(user.id, previousPeriodBoundaries);
        const totalAvailable = baseIncome + additionalIncome + currentRollover;
        const newRolloverAmount = Math.max(0, totalAvailable - previousPeriodExpenses);
        const amountRolledOver = Math.max(0, newRolloverAmount);
        const newNextPayDate = this.dateService.calculateNextPayDateFromCurrent(nextPayDate, frequency);
        this.logger.log(`Rollover calculation: available=${totalAvailable} (income=${baseIncome + additionalIncome}, rollover=${currentRollover}), spent=${previousPeriodExpenses}, newRollover=${newRolloverAmount}`);
        const updatedUser = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.user.update({
                where: { id: user.id },
                data: {
                    rolloverAmount: newRolloverAmount,
                    nextPayDate: newNextPayDate,
                    lastRolloverDate: new Date(),
                },
            });
            if (amountRolledOver > 0) {
                await tx.rolloverEntry.create({
                    data: {
                        userId: user.id,
                        amount: amountRolledOver,
                        type: client_1.RolloverType.ROLLOVER,
                        periodStart: previousPeriodBoundaries.start,
                        periodEnd: previousPeriodBoundaries.end,
                        description: `Auto-rollover from ${(0, date_fns_1.format)(previousPeriodBoundaries.start, 'MMM d')} - ${(0, date_fns_1.format)(previousPeriodBoundaries.end, 'MMM d')}`,
                    },
                });
                await tx.rolloverNotification.upsert({
                    where: { userId: user.id },
                    create: {
                        userId: user.id,
                        amount: amountRolledOver,
                        fromPeriod: `${(0, date_fns_1.format)(previousPeriodBoundaries.start, 'MMM d')} - ${(0, date_fns_1.format)(previousPeriodBoundaries.end, 'MMM d')}`,
                    },
                    update: {
                        amount: amountRolledOver,
                        fromPeriod: `${(0, date_fns_1.format)(previousPeriodBoundaries.start, 'MMM d')} - ${(0, date_fns_1.format)(previousPeriodBoundaries.end, 'MMM d')}`,
                        createdAt: new Date(),
                        dismissedAt: null,
                    },
                });
                this.logger.log(`Created rollover entry: $${amountRolledOver} from previous period`);
            }
            return updated;
        });
        this.logger.log(`Pay period transition complete. New nextPayDate: ${(0, date_fns_1.format)(newNextPayDate, 'yyyy-MM-dd')}`);
        return updatedUser;
    }
    async calculateAdditionalIncome(userId, periodBoundaries) {
        const additionalIncomeResult = await this.prisma.transaction.aggregate({
            where: {
                userId,
                type: client_1.TransactionType.INCOME,
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
    async calculatePreviousPeriodExpenses(user, periodBoundaries) {
        const userId = user.id;
        const committedResult = await this.prisma.transaction.aggregate({
            where: {
                userId,
                type: client_1.TransactionType.EXPENSE,
                status: client_1.PaymentStatus.PAID,
                date: {
                    gte: periodBoundaries.start,
                    lte: periodBoundaries.end,
                },
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
        const discretionaryResult = await this.prisma.transaction.aggregate({
            where: {
                userId,
                type: client_1.TransactionType.EXPENSE,
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
                            { status: client_1.PaymentStatus.PAID },
                        ],
                    },
                ],
            },
            _sum: { amount: true },
        });
        const discretionaryTotal = discretionaryResult._sum.amount
            ? Number(discretionaryResult._sum.amount)
            : 0;
        const goalContributions = await this.prisma.goalContribution.aggregate({
            where: {
                goal: { userId },
                date: { gte: periodBoundaries.start, lte: periodBoundaries.end },
                type: { in: [client_1.ContributionType.MANUAL, client_1.ContributionType.AUTOMATIC, client_1.ContributionType.TRANSACTION] },
            },
            _sum: { amount: true },
        });
        const goalsTotal = goalContributions._sum.amount
            ? Number(goalContributions._sum.amount)
            : 0;
        const totalExpenses = committedTotal + discretionaryTotal + goalsTotal;
        this.logger.log(`Previous period expenses (PAID only): committed=${committedTotal}, discretionary=${discretionaryTotal}, goals=${goalsTotal}, total=${totalExpenses}`);
        return Math.round(totalExpenses * 100) / 100;
    }
    async getRolloverNotification(userId) {
        const notification = await this.prisma.rolloverNotification.findFirst({
            where: {
                userId,
                dismissedAt: null,
            },
        });
        if (!notification) {
            return null;
        }
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
        const notificationAge = Date.now() - notification.createdAt.getTime();
        if (notificationAge > THREE_DAYS_MS) {
            await this.prisma.rolloverNotification.update({
                where: { id: notification.id },
                data: { dismissedAt: new Date() },
            });
            this.logger.log(`Rollover notification auto-dismissed after 3 days. Amount ${notification.amount} stays in spendable pool.`);
            return null;
        }
        return {
            amount: Number(notification.amount),
            fromPeriod: notification.fromPeriod,
            createdAt: notification.createdAt.toISOString(),
        };
    }
};
exports.HomeService = HomeService;
exports.HomeService = HomeService = HomeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        date_service_1.DateService,
        income_sources_service_1.IncomeSourcesService])
], HomeService);
//# sourceMappingURL=home.service.js.map