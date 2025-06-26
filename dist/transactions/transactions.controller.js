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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const transactions_service_1 = require("./transactions.service");
const create_transaction_dto_1 = require("./dto/create-transaction.dto");
const update_transaction_dto_1 = require("./dto/update-transaction.dto");
const transaction_filter_dto_1 = require("./dto/transaction-filter.dto");
let TransactionsController = class TransactionsController {
    constructor(transactionsService) {
        this.transactionsService = transactionsService;
    }
    async create(req, createTransactionDto) {
        return this.transactionsService.create(req.user.id, createTransactionDto);
    }
    async findAll(req, filters) {
        return this.transactionsService.findAll(req.user.id, filters);
    }
    async getAnalytics(req, filters) {
        return this.transactionsService.getAnalytics(req.user.id, filters);
    }
    async getDiscretionaryBreakdown(req, filters) {
        return this.transactionsService.getDiscretionaryBreakdown(req.user.id, filters);
    }
    async getDayTimePatterns(req, filters) {
        return this.transactionsService.getDayTimePatterns(req.user.id, filters);
    }
    async getSummary(req, filters) {
        const analytics = await this.transactionsService.getAnalytics(req.user.id, filters);
        return {
            totalIncome: analytics.totalIncome,
            totalExpenses: analytics.totalExpenses,
            netIncome: analytics.netIncome,
            transactionCount: analytics.transactionCount,
            recentTransactions: analytics.recentTransactions,
        };
    }
    async getRecent(req) {
        const filters = {
            limit: 10,
            offset: 0,
            sortBy: "date",
            sortOrder: "desc",
        };
        const result = await this.transactionsService.findAll(req.user.id, filters);
        return result.transactions;
    }
    async findOne(req, id) {
        return this.transactionsService.findOne(id, req.user.id);
    }
    async update(req, id, updateTransactionDto) {
        return this.transactionsService.update(id, req.user.id, updateTransactionDto);
    }
    async remove(req, id) {
        await this.transactionsService.remove(id, req.user.id);
    }
    async getByCategory(req, categoryId, filters) {
        const categoryFilters = {
            ...filters,
            categoryId,
        };
        return this.transactionsService.findAll(req.user.id, categoryFilters);
    }
    async getByBudget(req, budgetId, filters) {
        const budgetFilters = {
            ...filters,
            budgetId,
        };
        return this.transactionsService.findAll(req.user.id, budgetFilters);
    }
    async search(req, searchDto) {
        const searchFilters = {
            ...searchDto.filters,
            search: searchDto.query,
            limit: searchDto.filters?.limit || 20,
            offset: searchDto.filters?.offset || 0,
            sortBy: searchDto.filters?.sortBy || "date",
            sortOrder: searchDto.filters?.sortOrder || "desc",
        };
        return this.transactionsService.findAll(req.user.id, searchFilters);
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_transaction_dto_1.CreateTransactionDto]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transaction_filter_dto_1.TransactionFilterDto]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("analytics"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transaction_filter_dto_1.TransactionFilterDto]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)("discretionary-breakdown"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transaction_filter_dto_1.TransactionFilterDto]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getDiscretionaryBreakdown", null);
__decorate([
    (0, common_1.Get)("day-time-patterns"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transaction_filter_dto_1.TransactionFilterDto]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getDayTimePatterns", null);
__decorate([
    (0, common_1.Get)("summary"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transaction_filter_dto_1.TransactionFilterDto]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)("recent"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getRecent", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_transaction_dto_1.UpdateTransactionDto]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)("by-category/:categoryId"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("categoryId")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, transaction_filter_dto_1.TransactionFilterDto]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getByCategory", null);
__decorate([
    (0, common_1.Get)("by-budget/:budgetId"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("budgetId")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, transaction_filter_dto_1.TransactionFilterDto]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getByBudget", null);
__decorate([
    (0, common_1.Post)("search"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "search", null);
exports.TransactionsController = TransactionsController = __decorate([
    (0, common_1.Controller)("transactions"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [transactions_service_1.TransactionsService])
], TransactionsController);
//# sourceMappingURL=transactions.controller.js.map