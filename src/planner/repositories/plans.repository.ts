import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { Plan, Prisma } from "@prisma/client";
import { CreatePlanDto } from "../dto/create-plan.dto";
import { UpdatePlanDto } from "../dto/update-plan.dto";

@Injectable()
export class PlansRepository {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreatePlanDto): Promise<Plan> {
    return this.prisma.plan.create({
      data: {
        userId,
        type: data.type,
        status: data.status ?? "DRAFT",
        direction: data.direction,
        amount: new Prisma.Decimal(data.amount),
        plannedDate: new Date(data.plannedDate),
        description: data.description,
        linkedEntityType: data.linkedEntityType,
        linkedEntityId: data.linkedEntityId,
      },
    });
  }

  async findAll(userId: string): Promise<Plan[]> {
    return this.prisma.plan.findMany({
      where: { userId },
      orderBy: { plannedDate: "asc" },
    });
  }

  async findActive(userId: string): Promise<Plan[]> {
    return this.prisma.plan.findMany({
      where: { userId, status: { in: ["DRAFT", "PLANNED"] } },
      orderBy: { plannedDate: "asc" },
    });
  }

  async findById(id: string, userId: string): Promise<Plan | null> {
    return this.prisma.plan.findFirst({ where: { id, userId } });
  }

  async update(id: string, userId: string, data: UpdatePlanDto): Promise<Plan> {
    return this.prisma.plan.update({
      where: { id },
      data: {
        ...(data.type !== undefined && { type: data.type }),
        ...(data.direction !== undefined && { direction: data.direction }),
        ...(data.amount !== undefined && {
          amount: new Prisma.Decimal(data.amount),
        }),
        ...(data.plannedDate !== undefined && {
          plannedDate: new Date(data.plannedDate),
        }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.linkedEntityType !== undefined && {
          linkedEntityType: data.linkedEntityType,
        }),
        ...(data.linkedEntityId !== undefined && {
          linkedEntityId: data.linkedEntityId,
        }),
      },
    });
  }

  async updateStatus(
    id: string,
    status: "DRAFT" | "PLANNED" | "COMPLETED" | "CANCELLED",
    extra?: Partial<Pick<Plan, "completedAt" | "completedEntityId">>,
  ): Promise<Plan> {
    return this.prisma.plan.update({
      where: { id },
      data: { status, ...extra },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.plan.deleteMany({ where: { id, userId } });
  }
}
