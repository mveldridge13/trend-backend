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
exports.BudgetsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const budgets_service_1 = require("./budgets.service");
const create_budget_dto_1 = require("./dto/create-budget.dto");
const update_budget_dto_1 = require("./dto/update-budget.dto");
let BudgetsController = class BudgetsController {
    constructor(budgetsService) {
        this.budgetsService = budgetsService;
    }
    async createBudget(req, createBudgetDto) {
        return this.budgetsService.createBudget(req.user.id, createBudgetDto);
    }
    async getUserBudgets(req, page, limit) {
        const validPage = Math.max(1, page);
        const validLimit = Math.min(Math.max(1, limit), 100);
        return this.budgetsService.getUserBudgets(req.user.id, validPage, validLimit);
    }
    async getBudgetById(req, id) {
        return this.budgetsService.getBudgetById(id, req.user.id);
    }
    async updateBudget(req, id, updateBudgetDto) {
        return this.budgetsService.updateBudget(id, req.user.id, updateBudgetDto);
    }
    async deleteBudget(req, id) {
        return this.budgetsService.deleteBudget(id, req.user.id);
    }
    async getBudgetAnalytics(req, id) {
        return this.budgetsService.getBudgetAnalytics(id, req.user.id);
    }
};
exports.BudgetsController = BudgetsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_budget_dto_1.CreateBudgetDto]),
    __metadata("design:returntype", Promise)
], BudgetsController.prototype, "createBudget", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("page", new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)("limit", new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], BudgetsController.prototype, "getUserBudgets", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BudgetsController.prototype, "getBudgetById", null);
__decorate([
    (0, common_1.Put)(":id"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_budget_dto_1.UpdateBudgetDto]),
    __metadata("design:returntype", Promise)
], BudgetsController.prototype, "updateBudget", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BudgetsController.prototype, "deleteBudget", null);
__decorate([
    (0, common_1.Get)(":id/analytics"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BudgetsController.prototype, "getBudgetAnalytics", null);
exports.BudgetsController = BudgetsController = __decorate([
    (0, common_1.Controller)("budgets"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [budgets_service_1.BudgetsService])
], BudgetsController);
//# sourceMappingURL=budgets.controller.js.map