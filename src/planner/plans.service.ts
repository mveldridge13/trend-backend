import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Plan } from "@prisma/client";
import { PlansRepository } from "./repositories/plans.repository";
import { CreatePlanDto } from "./dto/create-plan.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";
import { TransactionsService } from "../transactions/transactions.service";
import { GoalsService } from "../goals/goals.service";

@Injectable()
export class PlansService {
  constructor(
    private readonly plansRepository: PlansRepository,
    private readonly transactionsService: TransactionsService,
    private readonly goalsService: GoalsService,
  ) {}

  async create(userId: string, dto: CreatePlanDto): Promise<Plan> {
    if (dto.status && dto.status !== "DRAFT" && dto.status !== "PLANNED") {
      throw new BadRequestException(
        "New plans must start as DRAFT or PLANNED",
      );
    }
    if (
      (dto.type === "BILL_CHANGE" ||
        dto.type === "GOAL_CHANGE" ||
        dto.type === "DEBT_PAYMENT") &&
      !dto.linkedEntityId
    ) {
      throw new BadRequestException(
        `${dto.type} plans require a linkedEntityId`,
      );
    }
    return this.plansRepository.create(userId, dto);
  }

  async findAll(userId: string): Promise<Plan[]> {
    return this.plansRepository.findAll(userId);
  }

  async findActive(userId: string): Promise<Plan[]> {
    return this.plansRepository.findActive(userId);
  }

  private async findOwnedOrThrow(id: string, userId: string): Promise<Plan> {
    const plan = await this.plansRepository.findById(id, userId);
    if (!plan) {
      throw new NotFoundException("Plan not found");
    }
    return plan;
  }

  async update(id: string, userId: string, dto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOwnedOrThrow(id, userId);
    if (plan.status === "COMPLETED" || plan.status === "CANCELLED") {
      throw new BadRequestException(
        `Cannot edit a plan with status ${plan.status}`,
      );
    }
    return this.plansRepository.update(id, userId, dto);
  }

  async setStatus(
    id: string,
    userId: string,
    status: "DRAFT" | "PLANNED" | "CANCELLED",
  ): Promise<Plan> {
    const plan = await this.findOwnedOrThrow(id, userId);
    if (plan.status === "COMPLETED") {
      throw new BadRequestException("Cannot change status of a completed plan");
    }
    return this.plansRepository.updateStatus(id, status);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findOwnedOrThrow(id, userId);
    await this.plansRepository.delete(id, userId);
  }

  /**
   * Applies a Plan to real financial data — the only path by which the
   * Planner is ever allowed to mutate real data. Explicit, user-triggered
   * only; never called automatically by the forecast or by a schedule.
   */
  async complete(id: string, userId: string): Promise<Plan> {
    const plan = await this.findOwnedOrThrow(id, userId);
    if (plan.status === "COMPLETED") {
      throw new BadRequestException("Plan is already completed");
    }
    if (plan.status === "CANCELLED") {
      throw new BadRequestException("Cannot complete a cancelled plan");
    }

    const completedEntityId = await this.applyPlanToRealData(userId, plan);

    return this.plansRepository.updateStatus(id, "COMPLETED", {
      completedAt: new Date(),
      completedEntityId,
    });
  }

  private async applyPlanToRealData(
    userId: string,
    plan: Plan,
  ): Promise<string> {
    const amount = Number(plan.amount);
    const dateIso = plan.plannedDate.toISOString();

    switch (plan.type) {
      case "PURCHASE":
      case "INCOME": {
        // A Transaction represents something that already happened, so it
        // can never be dated in the future — TransactionsService.create
        // rejects that. Completing a plan means "this happened now," so we
        // record it as of the completion moment rather than plannedDate
        // (which may still be in the future, e.g. completing a Planned item
        // early, or in the past for an overdue one).
        const transaction = await this.transactionsService.create(userId, {
          description: plan.description || plan.type,
          amount,
          date: new Date().toISOString(),
          type: plan.direction === "INFLOW" ? "INCOME" : "EXPENSE",
        });
        return transaction.id;
      }

      case "BILL_CHANGE": {
        if (!plan.linkedEntityId) {
          throw new BadRequestException(
            "BILL_CHANGE plan is missing linkedEntityId",
          );
        }
        const updated = await this.transactionsService.update(
          plan.linkedEntityId,
          userId,
          { dueDate: dateIso },
        );
        return updated.id;
      }

      case "GOAL_CHANGE":
      case "DEBT_PAYMENT": {
        if (!plan.linkedEntityId) {
          throw new BadRequestException(
            `${plan.type} plan is missing linkedEntityId`,
          );
        }
        const contribution = await this.goalsService.addContribution(
          userId,
          plan.linkedEntityId,
          {
            amount,
            date: dateIso,
            description: plan.description || plan.type,
            type: "MANUAL",
          },
        );
        return contribution.id;
      }

      default:
        throw new BadRequestException(`Unsupported plan type: ${plan.type}`);
    }
  }
}
