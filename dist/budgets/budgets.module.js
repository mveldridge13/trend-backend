"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetsModule = void 0;
const common_1 = require("@nestjs/common");
const budgets_controller_1 = require("./budgets.controller");
const budgets_service_1 = require("./budgets.service");
const budgets_repository_1 = require("./repositories/budgets.repository");
const database_module_1 = require("../database/database.module");
let BudgetsModule = class BudgetsModule {
};
exports.BudgetsModule = BudgetsModule;
exports.BudgetsModule = BudgetsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        controllers: [budgets_controller_1.BudgetsController],
        providers: [budgets_service_1.BudgetsService, budgets_repository_1.BudgetsRepository],
        exports: [budgets_service_1.BudgetsService, budgets_repository_1.BudgetsRepository],
    })
], BudgetsModule);
//# sourceMappingURL=budgets.module.js.map