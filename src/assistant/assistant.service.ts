import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../database/prisma.service';
import { DateService } from '../common/services/date.service';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';
import { TransactionType } from '@prisma/client';

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);
  private readonly anthropic: Anthropic;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly dateService: DateService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async chat(userId: string, request: ChatRequestDto): Promise<ChatResponseDto> {
    const toolsUsed: string[] = [];

    const systemPrompt = this.buildSystemPrompt(request.screenContext);
    const tools = this.getToolDefinitions();

    let messages: Anthropic.MessageParam[] = [
      { role: 'user', content: request.message },
    ];

    let response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages,
    });

    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        toolsUsed.push(toolUse.name);
        const result = await this.executeTool(userId, toolUse.name, toolUse.input as Record<string, any>);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      }

      messages = [
        ...messages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ];

      response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        tools,
        messages,
      });
    }

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    );

    return {
      response: textBlock?.text || 'I was unable to generate a response.',
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
    };
  }

  private buildSystemPrompt(screenContext?: { screen: string; data?: Record<string, any> }): string {
    let prompt = `You are a helpful financial assistant for a personal budgeting app called Trend. Your role is to help users understand their spending patterns, budget performance, and financial insights.

Guidelines:
- Be concise and friendly
- Use the user's actual data when answering questions
- Provide actionable insights when relevant
- If you need specific data to answer a question, use the available tools to fetch it
- Format currency values appropriately
- When comparing periods, be clear about the timeframes`;

    if (screenContext) {
      prompt += `\n\nThe user is currently viewing the "${screenContext.screen}" screen.`;
      if (screenContext.data) {
        prompt += ` Context from this screen: ${JSON.stringify(screenContext.data)}`;
      }
    }

    return prompt;
  }

  private getToolDefinitions(): Anthropic.Tool[] {
    return [
      {
        name: 'get_transactions',
        description: 'Fetch user transactions with optional filters. Use this to analyze spending on specific categories, time periods, or transaction types.',
        input_schema: {
          type: 'object' as const,
          properties: {
            startDate: { type: 'string', description: 'Start date in ISO format (e.g., 2024-01-01)' },
            endDate: { type: 'string', description: 'End date in ISO format' },
            type: { type: 'string', enum: ['EXPENSE', 'INCOME'], description: 'Filter by transaction type' },
            categoryId: { type: 'string', description: 'Filter by category ID' },
            limit: { type: 'number', description: 'Maximum number of transactions to return (default 50)' },
          },
          required: [],
        },
      },
      {
        name: 'get_spending_analytics',
        description: 'Get spending analytics including totals, category breakdown, spending velocity, and burn rate for a period.',
        input_schema: {
          type: 'object' as const,
          properties: {
            startDate: { type: 'string', description: 'Start date in ISO format' },
            endDate: { type: 'string', description: 'End date in ISO format' },
          },
          required: [],
        },
      },
      {
        name: 'get_category_breakdown',
        description: 'Get detailed breakdown of spending by category and subcategory.',
        input_schema: {
          type: 'object' as const,
          properties: {
            startDate: { type: 'string', description: 'Start date in ISO format' },
            endDate: { type: 'string', description: 'End date in ISO format' },
          },
          required: [],
        },
      },
      {
        name: 'get_day_time_patterns',
        description: 'Analyze spending patterns by day of week and time of day. Shows weekday vs weekend spending, peak spending times, etc.',
        input_schema: {
          type: 'object' as const,
          properties: {
            startDate: { type: 'string', description: 'Start date in ISO format' },
            endDate: { type: 'string', description: 'End date in ISO format' },
          },
          required: [],
        },
      },
      {
        name: 'get_bills',
        description: 'Get recurring bills and obligations, including upcoming due dates and payment status.',
        input_schema: {
          type: 'object' as const,
          properties: {
            startDate: { type: 'string', description: 'Start date in ISO format' },
            endDate: { type: 'string', description: 'End date in ISO format' },
          },
          required: [],
        },
      },
      {
        name: 'get_goals',
        description: 'Get user\'s financial goals including progress, target amounts, and contribution history.',
        input_schema: {
          type: 'object' as const,
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_budgets',
        description: 'Get user\'s budgets with current spending vs allocated amounts.',
        input_schema: {
          type: 'object' as const,
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_home_summary',
        description: 'Get the home screen summary including income, committed spending, discretionary balance, and pay period info.',
        input_schema: {
          type: 'object' as const,
          properties: {},
          required: [],
        },
      },
      {
        name: 'compare_periods',
        description: 'Compare spending between two time periods to identify changes and trends.',
        input_schema: {
          type: 'object' as const,
          properties: {
            currentStartDate: { type: 'string', description: 'Current period start date' },
            currentEndDate: { type: 'string', description: 'Current period end date' },
            previousStartDate: { type: 'string', description: 'Previous period start date' },
            previousEndDate: { type: 'string', description: 'Previous period end date' },
          },
          required: ['currentStartDate', 'currentEndDate', 'previousStartDate', 'previousEndDate'],
        },
      },
    ];
  }

  private async executeTool(userId: string, toolName: string, input: Record<string, any>): Promise<any> {
    this.logger.debug(`Executing tool: ${toolName} with input: ${JSON.stringify(input)}`);

    switch (toolName) {
      case 'get_transactions':
        return this.getTransactions(userId, input);
      case 'get_spending_analytics':
        return this.getSpendingAnalytics(userId, input);
      case 'get_category_breakdown':
        return this.getCategoryBreakdown(userId, input);
      case 'get_day_time_patterns':
        return this.getDayTimePatterns(userId, input);
      case 'get_bills':
        return this.getBills(userId, input);
      case 'get_goals':
        return this.getGoals(userId);
      case 'get_budgets':
        return this.getBudgets(userId);
      case 'get_home_summary':
        return this.getHomeSummary(userId);
      case 'compare_periods':
        return this.comparePeriods(userId, input);
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

  private async getTransactions(userId: string, input: Record<string, any>) {
    const { startDate, endDate, type, categoryId, limit = 50 } = input;

    const where: any = { userId };
    if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
    if (endDate) where.date = { ...where.date, lte: new Date(endDate) };
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: { category: true, subcategory: true },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return transactions.map((t) => ({
      id: t.id,
      date: t.date,
      amount: Number(t.amount),
      description: t.description,
      type: t.type,
      category: t.category?.name,
      subcategory: t.subcategory?.name,
      merchant: t.merchantName,
      recurrence: t.recurrence,
    }));
  }

  private async getSpendingAnalytics(userId: string, input: Record<string, any>) {
    const { startDate, endDate } = input;
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const where: any = {
      userId,
      type: TransactionType.EXPENSE,
      date: {
        gte: startDate ? new Date(startDate) : defaultStart,
        lte: endDate ? new Date(endDate) : now,
      },
    };

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: { category: true },
    });

    const totalExpenses = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const discretionaryExpenses = transactions
      .filter((t) => !t.recurrence || t.recurrence === 'none')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const categoryTotals = new Map<string, { name: string; amount: number; count: number }>();
    transactions.forEach((t) => {
      const catName = t.category?.name || 'Uncategorized';
      const existing = categoryTotals.get(catName) || { name: catName, amount: 0, count: 0 };
      existing.amount += Number(t.amount);
      existing.count += 1;
      categoryTotals.set(catName, existing);
    });

    return {
      totalExpenses,
      discretionaryExpenses,
      recurringExpenses: totalExpenses - discretionaryExpenses,
      transactionCount: transactions.length,
      averageTransaction: transactions.length > 0 ? totalExpenses / transactions.length : 0,
      topCategories: Array.from(categoryTotals.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
    };
  }

  private async getCategoryBreakdown(userId: string, input: Record<string, any>) {
    const { startDate, endDate } = input;
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: {
          gte: startDate ? new Date(startDate) : defaultStart,
          lte: endDate ? new Date(endDate) : now,
        },
      },
      include: { category: true, subcategory: true },
    });

    const categoryMap = new Map<string, any>();
    transactions.forEach((t) => {
      const catId = t.categoryId || 'uncategorized';
      const catName = t.category?.name || 'Uncategorized';

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          name: catName,
          amount: 0,
          count: 0,
          subcategories: new Map(),
        });
      }

      const cat = categoryMap.get(catId);
      cat.amount += Number(t.amount);
      cat.count += 1;

      if (t.subcategory) {
        const subName = t.subcategory.name;
        if (!cat.subcategories.has(subName)) {
          cat.subcategories.set(subName, { name: subName, amount: 0, count: 0 });
        }
        const sub = cat.subcategories.get(subName);
        sub.amount += Number(t.amount);
        sub.count += 1;
      }
    });

    const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

    return Array.from(categoryMap.values())
      .map((cat) => ({
        name: cat.name,
        amount: cat.amount,
        percentage: totalAmount > 0 ? (cat.amount / totalAmount) * 100 : 0,
        transactionCount: cat.count,
        subcategories: Array.from(cat.subcategories.values()),
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  private async getDayTimePatterns(userId: string, input: Record<string, any>) {
    const { startDate, endDate } = input;
    const now = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(now.getDate() - 30);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        recurrence: null,
        date: {
          gte: startDate ? new Date(startDate) : defaultStart,
          lte: endDate ? new Date(endDate) : now,
        },
      },
    });

    const dayTotals = new Array(7).fill(0).map(() => ({ amount: 0, count: 0 }));
    const timePeriods = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    let weekdayTotal = 0;
    let weekendTotal = 0;

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const day = date.getDay();
      const hour = date.getHours();
      const amount = Number(t.amount);

      dayTotals[day].amount += amount;
      dayTotals[day].count += 1;

      if (day === 0 || day === 6) {
        weekendTotal += amount;
      } else {
        weekdayTotal += amount;
      }

      if (hour >= 6 && hour < 12) timePeriods.morning += amount;
      else if (hour >= 12 && hour < 18) timePeriods.afternoon += amount;
      else if (hour >= 18 && hour < 22) timePeriods.evening += amount;
      else timePeriods.night += amount;
    });

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      byDayOfWeek: days.map((name, i) => ({
        day: name,
        amount: dayTotals[i].amount,
        transactionCount: dayTotals[i].count,
      })),
      byTimeOfDay: timePeriods,
      weekdayVsWeekend: {
        weekday: weekdayTotal,
        weekend: weekendTotal,
        weekendPercentage: weekdayTotal + weekendTotal > 0
          ? (weekendTotal / (weekdayTotal + weekendTotal)) * 100
          : 0,
      },
    };
  }

  private async getBills(userId: string, input: Record<string, any>) {
    const { startDate, endDate } = input;
    const now = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);

    const bills = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        recurrence: { not: null },
        dueDate: {
          gte: startDate ? new Date(startDate) : now,
          lte: endDate ? new Date(endDate) : futureDate,
        },
      },
      include: { category: true },
      orderBy: { dueDate: 'asc' },
    });

    return bills.map((b) => ({
      id: b.id,
      description: b.description,
      amount: Number(b.amount),
      dueDate: b.dueDate,
      recurrence: b.recurrence,
      status: b.status,
      category: b.category?.name,
    }));
  }

  private async getGoals(userId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { userId },
      include: {
        linkedTransactions: {
          select: { amount: true },
        },
      },
    });

    return goals.map((g) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
      progress: Number(g.targetAmount) > 0
        ? (Number(g.currentAmount) / Number(g.targetAmount)) * 100
        : 0,
      targetDate: g.targetDate,
      monthlyTarget: g.monthlyTarget ? Number(g.monthlyTarget) : null,
      autoContribute: g.autoContribute,
    }));
  }

  private async getBudgets(userId: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { userId },
      include: { transactions: true },
    });

    return budgets.map((b) => {
      const spentAmount = b.transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const budgetAmount = Number(b.totalAmount);

      return {
        id: b.id,
        name: b.name,
        description: b.description,
        allocated: budgetAmount,
        spent: spentAmount,
        remaining: budgetAmount - spentAmount,
        percentUsed: budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0,
        startDate: b.startDate,
        endDate: b.endDate,
        status: b.status,
      };
    });
  }

  private async getHomeSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.nextPayDate || !user.incomeFrequency) {
      return { message: 'Pay period not configured' };
    }

    const userTimezone = this.dateService.getValidTimezone(user.timezone);
    const payPeriod = this.dateService.calculatePayPeriodBoundaries(
      new Date(user.nextPayDate),
      user.incomeFrequency,
      userTimezone,
    );

    const income = Number(user.income || 0);

    const committedTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        recurrence: { not: null },
        dueDate: { gte: payPeriod.start, lte: payPeriod.end },
      },
    });

    const discretionaryTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        OR: [{ recurrence: null }, { recurrence: 'none' }],
        date: { gte: payPeriod.start, lte: payPeriod.end },
      },
    });

    const committed = committedTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const discretionarySpent = discretionaryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      payPeriod: {
        start: payPeriod.start,
        end: payPeriod.end,
        daysRemaining: Math.ceil((payPeriod.end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      },
      income,
      committed,
      discretionaryBudget: income - committed,
      discretionarySpent,
      discretionaryRemaining: income - committed - discretionarySpent,
    };
  }

  private async comparePeriods(userId: string, input: Record<string, any>) {
    const { currentStartDate, currentEndDate, previousStartDate, previousEndDate } = input;

    const [currentTransactions, previousTransactions] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          userId,
          type: TransactionType.EXPENSE,
          date: { gte: new Date(currentStartDate), lte: new Date(currentEndDate) },
        },
        include: { category: true },
      }),
      this.prisma.transaction.findMany({
        where: {
          userId,
          type: TransactionType.EXPENSE,
          date: { gte: new Date(previousStartDate), lte: new Date(previousEndDate) },
        },
        include: { category: true },
      }),
    ]);

    const currentTotal = currentTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const previousTotal = previousTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    const currentByCategory = new Map<string, number>();
    const previousByCategory = new Map<string, number>();

    currentTransactions.forEach((t) => {
      const cat = t.category?.name || 'Uncategorized';
      currentByCategory.set(cat, (currentByCategory.get(cat) || 0) + Number(t.amount));
    });

    previousTransactions.forEach((t) => {
      const cat = t.category?.name || 'Uncategorized';
      previousByCategory.set(cat, (previousByCategory.get(cat) || 0) + Number(t.amount));
    });

    const allCategories = new Set([...currentByCategory.keys(), ...previousByCategory.keys()]);
    const categoryChanges = Array.from(allCategories).map((cat) => {
      const current = currentByCategory.get(cat) || 0;
      const previous = previousByCategory.get(cat) || 0;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
      return { category: cat, current, previous, changePercent: change };
    });

    return {
      currentPeriod: { start: currentStartDate, end: currentEndDate, total: currentTotal },
      previousPeriod: { start: previousStartDate, end: previousEndDate, total: previousTotal },
      changePercent: previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0,
      categoryChanges: categoryChanges.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)),
    };
  }
}
