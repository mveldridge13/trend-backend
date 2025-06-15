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
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CategoryType } from "@prisma/client";

@Controller("categories")
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Request() req, @Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(req.user.userId, createCategoryDto);
  }

  @Get()
  async findAll(
    @Request() req,
    @Query("type") type?: CategoryType,
    @Query("isSystem") isSystem?: string,
    @Query("parentId") parentId?: string,
    @Query("search") search?: string,
    @Query("includeArchived") includeArchived?: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number = 50
  ) {
    const filters = {
      ...(type && { type }),
      ...(isSystem !== undefined && { isSystem: isSystem === "true" }),
      ...(parentId && { parentId }),
      ...(search && { search }),
      ...(includeArchived !== undefined && {
        includeArchived: includeArchived === "true",
      }),
    };

    return this.categoriesService.findAll(
      req.user.userId,
      filters,
      page,
      limit
    );
  }

  @Get("system")
  async getSystemCategories() {
    return this.categoriesService.getSystemCategories();
  }

  @Get("popular")
  async getMostUsedCategories(
    @Request() req,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number = 10
  ) {
    return this.categoriesService.getMostUsedCategories(req.user.userId, limit);
  }

  @Get("archived")
  async getArchivedCategories(@Request() req) {
    return this.categoriesService.findArchived(req.user.userId);
  }

  @Get(":id")
  async findOne(@Request() req, @Param("id") id: string) {
    return this.categoriesService.findOne(req.user.userId, id);
  }

  @Get(":id/analytics")
  async getCategoryAnalytics(
    @Request() req,
    @Param("id") id: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.categoriesService.getCategoryAnalytics(
      req.user.userId,
      id,
      start,
      end
    );
  }

  @Patch(":id")
  async update(
    @Request() req,
    @Param("id") id: string,
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    return this.categoriesService.update(
      req.user.userId,
      id,
      updateCategoryDto
    );
  }

  @Delete(":id")
  async remove(
    @Request() req,
    @Param("id") id: string,
    @Query("permanent") permanent?: string,
    @Query("force") force?: string
  ) {
    const options = {
      permanent: permanent === "true",
      force: force === "true",
    };

    return this.categoriesService.remove(req.user.userId, id, options);
  }

  @Post(":id/restore")
  async restore(@Request() req, @Param("id") id: string) {
    return this.categoriesService.restore(req.user.userId, id);
  }
}
