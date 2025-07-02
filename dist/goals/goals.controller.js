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
exports.GoalsController = void 0;
const common_1 = require("@nestjs/common");
const goals_service_1 = require("./goals.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const create_goal_dto_1 = require("./dto/create-goal.dto");
const update_goal_dto_1 = require("./dto/update-goal.dto");
const goal_filters_dto_1 = require("./dto/goal-filters.dto");
const create_goal_contribution_dto_1 = require("./dto/create-goal-contribution.dto");
let GoalsController = class GoalsController {
    constructor(goalsService) {
        this.goalsService = goalsService;
    }
    extractUserId(req) {
        const userId = req.user?.id || req.user?.userId || req.user?.sub;
        if (!userId) {
            throw new Error("User ID not found in request");
        }
        return userId;
    }
    async createGoal(req, createGoalDto) {
        const userId = this.extractUserId(req);
        return this.goalsService.createGoal(userId, createGoalDto);
    }
    async getGoals(req, filters) {
        const userId = this.extractUserId(req);
        return this.goalsService.getGoals(userId, filters);
    }
    async getGoalSuggestions(req) {
        const userId = this.extractUserId(req);
        return this.goalsService.generateSmartSuggestions(userId);
    }
    async getGoalById(req, goalId) {
        const userId = this.extractUserId(req);
        return this.goalsService.getGoalById(userId, goalId);
    }
    async updateGoal(req, goalId, updateGoalDto) {
        const userId = this.extractUserId(req);
        return this.goalsService.updateGoal(userId, goalId, updateGoalDto);
    }
    async deleteGoal(req, goalId) {
        const userId = this.extractUserId(req);
        return this.goalsService.deleteGoal(userId, goalId);
    }
    async getGoalAnalytics(req, goalId) {
        const userId = this.extractUserId(req);
        return this.goalsService.getGoalAnalytics(userId, goalId);
    }
    async addGoalContribution(req, goalId, createContributionDto) {
        const userId = this.extractUserId(req);
        return this.goalsService.addContribution(userId, goalId, createContributionDto);
    }
    async getGoalContributions(req, goalId, startDate, endDate) {
        const userId = this.extractUserId(req);
        return this.goalsService.getGoalContributions(userId, goalId, startDate, endDate);
    }
};
exports.GoalsController = GoalsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_goal_dto_1.CreateGoalDto]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "createGoal", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, goal_filters_dto_1.GoalFiltersDto]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "getGoals", null);
__decorate([
    (0, common_1.Get)("suggestions"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "getGoalSuggestions", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "getGoalById", null);
__decorate([
    (0, common_1.Put)(":id"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_goal_dto_1.UpdateGoalDto]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "updateGoal", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "deleteGoal", null);
__decorate([
    (0, common_1.Get)(":id/analytics"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "getGoalAnalytics", null);
__decorate([
    (0, common_1.Post)(":id/contributions"),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_goal_contribution_dto_1.CreateGoalContributionDto]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "addGoalContribution", null);
__decorate([
    (0, common_1.Get)(":id/contributions"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Query)("startDate")),
    __param(3, (0, common_1.Query)("endDate")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "getGoalContributions", null);
exports.GoalsController = GoalsController = __decorate([
    (0, common_1.Controller)("goals"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [goals_service_1.GoalsService])
], GoalsController);
//# sourceMappingURL=goals.controller.js.map