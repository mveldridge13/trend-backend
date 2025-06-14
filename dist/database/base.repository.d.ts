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
export declare abstract class BaseRepository<T> {
    protected readonly prisma: PrismaService;
    constructor(prisma: PrismaService);
    protected calculatePagination(params: PaginationParams): {
        page: number;
        limit: number;
        skip: number;
        take: number;
    };
    protected formatPaginationResult<T>(data: T[], total: number, page: number, limit: number): PaginationResult<T>;
    protected handleDatabaseError(error: any): never;
    transaction<R>(fn: (prisma: PrismaService) => Promise<R>): Promise<R>;
}
