"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
let BaseRepository = class BaseRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    calculatePagination(params) {
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
    formatPaginationResult(data, total, page, limit) {
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
    handleDatabaseError(error) {
        console.error("Database error:", error);
        if (error.code === "P2002") {
            throw new Error("Unique constraint violation");
        }
        if (error.code === "P2025") {
            throw new Error("Record not found");
        }
        throw new Error("Database operation failed");
    }
    async transaction(fn) {
        return this.prisma.$transaction(async (tx) => {
            const txService = Object.create(this.prisma);
            Object.setPrototypeOf(txService, Object.getPrototypeOf(this.prisma));
            Object.assign(txService, tx);
            return fn(txService);
        });
    }
};
exports.BaseRepository = BaseRepository;
exports.BaseRepository = BaseRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BaseRepository);
//# sourceMappingURL=base.repository.js.map