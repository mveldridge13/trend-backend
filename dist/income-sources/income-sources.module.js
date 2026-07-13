"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncomeSourcesModule = void 0;
const common_1 = require("@nestjs/common");
const income_sources_controller_1 = require("./income-sources.controller");
const income_sources_service_1 = require("./income-sources.service");
const database_module_1 = require("../database/database.module");
const common_module_1 = require("../common/common.module");
let IncomeSourcesModule = class IncomeSourcesModule {
};
exports.IncomeSourcesModule = IncomeSourcesModule;
exports.IncomeSourcesModule = IncomeSourcesModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, common_module_1.CommonModule],
        controllers: [income_sources_controller_1.IncomeSourcesController],
        providers: [income_sources_service_1.IncomeSourcesService],
        exports: [income_sources_service_1.IncomeSourcesService],
    })
], IncomeSourcesModule);
//# sourceMappingURL=income-sources.module.js.map