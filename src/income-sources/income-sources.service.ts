import {
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { DateService } from "../common/services/date.service";
import { IncomeSource, TransactionType } from "@prisma/client";
import { CreateIncomeSourceDto } from "./dto/create-income-source.dto";
import { UpdateIncomeSourceDto } from "./dto/update-income-source.dto";

export interface IncomeSourceResponse {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  nextPaymentDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class IncomeSourcesService {
  private readonly logger = new Logger(IncomeSourcesService.name);

  // Safety cap when catching up missed occurrences (mirrors maxTransitions in
  // HomeService); 26 covers half a year of weekly payments.
  private static readonly MAX_OCCURRENCES_PER_RUN = 26;

  constructor(
    private readonly prisma: PrismaService,
    private readonly dateService: DateService,
  ) {}

  async findAll(userId: string): Promise<IncomeSourceResponse[]> {
    const sources = await this.prisma.incomeSource.findMany({
      where: { userId },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    });
    return sources.map((s) => this.toResponse(s));
  }

  async create(
    userId: string,
    dto: CreateIncomeSourceDto,
  ): Promise<IncomeSourceResponse> {
    const source = await this.prisma.incomeSource.create({
      data: {
        userId,
        name: dto.name,
        amount: dto.amount,
        frequency: dto.frequency,
        nextPaymentDate: new Date(dto.nextPaymentDate),
        isActive: dto.isActive ?? true,
      },
    });
    return this.toResponse(source);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateIncomeSourceDto,
  ): Promise<IncomeSourceResponse> {
    await this.findOwned(userId, id);
    const source = await this.prisma.incomeSource.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.frequency !== undefined && { frequency: dto.frequency }),
        ...(dto.nextPaymentDate !== undefined && {
          nextPaymentDate: new Date(dto.nextPaymentDate),
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    return this.toResponse(source);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOwned(userId, id);
    // Hard delete; past transactions/contributions keep their rows via
    // onDelete: SetNull and remain labeled through their description text.
    await this.prisma.incomeSource.delete({ where: { id } });
  }

  /**
   * Dismiss this source's rollover banner (mirrors
   * UsersService.dismissRolloverNotification, scoped to one source).
   */
  async dismissRolloverNotification(userId: string, id: string): Promise<void> {
    await this.findOwned(userId, id);
    await this.prisma.incomeSourceRolloverNotification.updateMany({
      where: { incomeSourceId: id, dismissedAt: null },
      data: { dismissedAt: new Date() },
    });
  }

  /**
   * Verify a source exists and belongs to the user. Used by other modules
   * (goals, transactions) to validate incomeSourceId attribution.
   */
  async findOwned(userId: string, id: string): Promise<IncomeSource> {
    const source = await this.prisma.incomeSource.findFirst({
      where: { id, userId },
    });
    if (!source) {
      throw new NotFoundException("Income source not found");
    }
    return source;
  }

  /**
   * Materialize due occurrences of active income sources as INCOME
   * transactions, advancing nextPaymentDate past today.
   *
   * Called lazily from HomeService.getSummary() BEFORE the pay-period
   * transition, so occurrences dated in a just-ended period exist when
   * rollover is calculated. Existing income math needs no changes: it
   * already aggregates INCOME transactions per period.
   *
   * Race-safety: the advance of nextPaymentDate and the transaction insert
   * run in one DB transaction, and the advance is conditional on the date
   * still having its expected value — a concurrent request loses the
   * updateMany claim and creates nothing.
   */
  async materializeDueTransactions(
    userId: string,
    userTimezone: string,
  ): Promise<number> {
    const sources = await this.prisma.incomeSource.findMany({
      where: { userId, isActive: true },
    });

    let created = 0;

    for (const source of sources) {
      let dueDate = new Date(source.nextPaymentDate);
      let iterations = 0;

      // shouldTransitionPayPeriod is a generic "today >= date (user tz)" check
      while (
        this.dateService.shouldTransitionPayPeriod(dueDate, userTimezone) &&
        iterations < IncomeSourcesService.MAX_OCCURRENCES_PER_RUN
      ) {
        const nextDate = this.dateService.calculateNextPayDateFromCurrent(
          dueDate,
          source.frequency,
        );

        const claimedDate = dueDate;
        const materialized = await this.prisma.$transaction(async (tx) => {
          const claimed = await tx.incomeSource.updateMany({
            where: { id: source.id, nextPaymentDate: claimedDate },
            data: { nextPaymentDate: nextDate },
          });
          if (claimed.count === 0) {
            return false; // another request already handled this occurrence
          }
          await tx.transaction.create({
            data: {
              userId,
              description: source.name,
              amount: source.amount,
              date: claimedDate,
              type: TransactionType.INCOME,
              recurrence: "none",
              incomeSourceId: source.id,
              notes: "Auto-created from income source",
            },
          });
          return true;
        });

        if (!materialized) break;

        created++;
        this.logger.log(
          `Materialized income source "${source.name}" occurrence for user ${userId} on ${claimedDate.toISOString().slice(0, 10)}`,
        );

        dueDate = nextDate;
        iterations++;
      }
    }

    return created;
  }

  private toResponse(source: IncomeSource): IncomeSourceResponse {
    return {
      id: source.id,
      name: source.name,
      amount: Number(source.amount),
      frequency: source.frequency,
      nextPaymentDate: source.nextPaymentDate.toISOString(),
      isActive: source.isActive,
      createdAt: source.createdAt.toISOString(),
      updatedAt: source.updatedAt.toISOString(),
    };
  }
}
