import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TransactionsService } from "./transactions.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionFilterDto } from "./dto/transaction-filter.dto";

@Controller("transactions")
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Body() createTransactionDto: CreateTransactionDto
  ) {
    return this.transactionsService.create(req.user.id, createTransactionDto);
  }

  @Get()
  async findAll(@Request() req, @Query() filters: TransactionFilterDto) {
    return this.transactionsService.findAll(req.user.id, filters);
  }

  @Get("analytics")
  async getAnalytics(@Request() req, @Query() filters: TransactionFilterDto) {
    return this.transactionsService.getAnalytics(req.user.id, filters);
  }

  @Get("discretionary-breakdown")
  async getDiscretionaryBreakdown(
    @Request() req,
    @Query() filters: TransactionFilterDto
  ): Promise<any> {
    return this.transactionsService.getDiscretionaryBreakdown(
      req.user.id,
      filters
    );
  }

  @Get("day-time-patterns")
  async getDayTimePatterns(
    @Request() req,
    @Query() filters: TransactionFilterDto
  ): Promise<any> {
    return this.transactionsService.getDayTimePatterns(req.user.id, filters);
  }

  @Get("summary")
  async getSummary(@Request() req, @Query() filters: TransactionFilterDto) {
    const analytics = await this.transactionsService.getAnalytics(
      req.user.id,
      filters
    );

    return {
      totalIncome: analytics.totalIncome,
      totalExpenses: analytics.totalExpenses,
      netIncome: analytics.netIncome,
      transactionCount: analytics.transactionCount,
      recentTransactions: analytics.recentTransactions,
    };
  }

  @Get("recent")
  async getRecent(@Request() req) {
    const filters: TransactionFilterDto = {
      limit: 10,
      offset: 0,
      sortBy: "date",
      sortOrder: "desc",
    };

    const result = await this.transactionsService.findAll(req.user.id, filters);
    return result.transactions;
  }

  @Get(":id")
  async findOne(@Request() req, @Param("id") id: string) {
    return this.transactionsService.findOne(id, req.user.id);
  }

  @Patch(":id")
  async update(
    @Request() req,
    @Param("id") id: string,
    @Body() updateTransactionDto: UpdateTransactionDto
  ) {
    return this.transactionsService.update(
      id,
      req.user.id,
      updateTransactionDto
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req, @Param("id") id: string) {
    await this.transactionsService.remove(id, req.user.id);
  }

  @Get("by-category/:categoryId")
  async getByCategory(
    @Request() req,
    @Param("categoryId") categoryId: string,
    @Query() filters: TransactionFilterDto
  ) {
    const categoryFilters = {
      ...filters,
      categoryId,
    };

    return this.transactionsService.findAll(req.user.id, categoryFilters);
  }

  @Get("by-budget/:budgetId")
  async getByBudget(
    @Request() req,
    @Param("budgetId") budgetId: string,
    @Query() filters: TransactionFilterDto
  ) {
    const budgetFilters = {
      ...filters,
      budgetId,
    };

    return this.transactionsService.findAll(req.user.id, budgetFilters);
  }

  @Post("search")
  async search(
    @Request() req,
    @Body()
    searchDto: { query: string; filters?: Partial<TransactionFilterDto> }
  ) {
    const searchFilters: TransactionFilterDto = {
      ...searchDto.filters,
      search: searchDto.query,
      limit: searchDto.filters?.limit || 20,
      offset: searchDto.filters?.offset || 0,
      sortBy: searchDto.filters?.sortBy || "date",
      sortOrder: searchDto.filters?.sortOrder || "desc",
    };

    return this.transactionsService.findAll(req.user.id, searchFilters);
  }
}
