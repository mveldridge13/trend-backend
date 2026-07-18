import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from "@nestjs/common";
import { IncomeSourcesService } from "./income-sources.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateIncomeSourceDto } from "./dto/create-income-source.dto";
import { UpdateIncomeSourceDto } from "./dto/update-income-source.dto";

@Controller("income-sources")
@UseGuards(JwtAuthGuard)
export class IncomeSourcesController {
  constructor(private readonly incomeSourcesService: IncomeSourcesService) {}

  private extractUserId(req: any): string {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new Error("User ID not found in request");
    }
    return userId;
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.incomeSourcesService.findAll(this.extractUserId(req));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: any,
    @Body(ValidationPipe) dto: CreateIncomeSourceDto,
  ) {
    return this.incomeSourcesService.create(this.extractUserId(req), dto);
  }

  @Put(":id")
  async update(
    @Request() req: any,
    @Param("id") id: string,
    @Body(ValidationPipe) dto: UpdateIncomeSourceDto,
  ) {
    return this.incomeSourcesService.update(
      this.extractUserId(req),
      id,
      dto,
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req: any, @Param("id") id: string) {
    await this.incomeSourcesService.remove(this.extractUserId(req), id);
  }

  @Post(":id/dismiss-rollover-notification")
  @HttpCode(HttpStatus.NO_CONTENT)
  async dismissRolloverNotification(
    @Request() req: any,
    @Param("id") id: string,
  ) {
    await this.incomeSourcesService.dismissRolloverNotification(
      this.extractUserId(req),
      id,
    );
  }
}
