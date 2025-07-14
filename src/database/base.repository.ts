import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

@Injectable()
export abstract class BaseRepository<T> {
  constructor(protected readonly prisma: PrismaService) {}

  // Common pagination helper
  protected calculatePagination(params: PaginationParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    return {
      page,
      limit,
      skip,
      take: limit,
    };
  }

  // Common pagination result formatter
  protected formatPaginationResult<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginationResult<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  // Common error handling
  protected handleDatabaseError(error: any): never {
    if (error.code === "P2002") {
      throw new Error("Unique constraint violation");
    }

    if (error.code === "P2025") {
      throw new Error("Record not found");
    }

    throw new Error("Database operation failed");
  }

  // Fixed transaction wrapper
  async transaction<R>(fn: (prisma: PrismaService) => Promise<R>): Promise<R> {
    return this.prisma.$transaction(async (tx) => {
      // Create a proxy to make tx look like PrismaService
      const txService = Object.create(this.prisma);
      Object.setPrototypeOf(txService, Object.getPrototypeOf(this.prisma));
      Object.assign(txService, tx);

      return fn(txService);
    });
  }
}
