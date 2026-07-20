import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { UpdatePlannerSettingsDto } from "./dto/update-planner-settings.dto";

export interface PlannerSettingsResponse {
  safetyBufferAmount: number | null;
}

@Injectable()
export class PlannerSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<PlannerSettingsResponse> {
    const settings = await this.prisma.plannerSettings.findUnique({
      where: { userId },
    });

    return {
      safetyBufferAmount: settings?.safetyBufferAmount
        ? Number(settings.safetyBufferAmount)
        : null,
    };
  }

  async update(
    userId: string,
    dto: UpdatePlannerSettingsDto,
  ): Promise<PlannerSettingsResponse> {
    const safetyBufferAmount = dto.clearSafetyBuffer
      ? null
      : dto.safetyBufferAmount;

    await this.prisma.plannerSettings.upsert({
      where: { userId },
      create: {
        userId,
        safetyBufferAmount,
      },
      update: {
        ...((dto.clearSafetyBuffer || dto.safetyBufferAmount !== undefined) && {
          safetyBufferAmount,
        }),
      },
    });

    return this.get(userId);
  }
}
