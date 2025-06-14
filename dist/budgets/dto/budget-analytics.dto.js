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
exports.BudgetAnalyticsDto = void 0;
const class_transformer_1 = require("class-transformer");
class BudgetAnalyticsDto {
}
exports.BudgetAnalyticsDto = BudgetAnalyticsDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], BudgetAnalyticsDto.prototype, "budgetId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], BudgetAnalyticsDto.prototype, "budgetName", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value.toString())),
    __metadata("design:type", Number)
], BudgetAnalyticsDto.prototype, "totalAmount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value.toString())),
    __metadata("design:type", Number)
], BudgetAnalyticsDto.prototype, "spentAmount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Transform)(({ value }) => parseFloat(value.toString())),
    __metadata("design:type", Number)
], BudgetAnalyticsDto.prototype, "remainingAmount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], BudgetAnalyticsDto.prototype, "spentPercentage", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], BudgetAnalyticsDto.prototype, "transactionCount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], BudgetAnalyticsDto.prototype, "daysTotal", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], BudgetAnalyticsDto.prototype, "daysElapsed", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], BudgetAnalyticsDto.prototype, "daysRemaining", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], BudgetAnalyticsDto.prototype, "dailyBudget", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], BudgetAnalyticsDto.prototype, "dailyAverageSpending", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], BudgetAnalyticsDto.prototype, "projectedTotalSpending", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Boolean)
], BudgetAnalyticsDto.prototype, "isOverBudget", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Boolean)
], BudgetAnalyticsDto.prototype, "isOnTrack", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Array)
], BudgetAnalyticsDto.prototype, "categoryBreakdown", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Array)
], BudgetAnalyticsDto.prototype, "spendingTrend", void 0);
//# sourceMappingURL=budget-analytics.dto.js.map