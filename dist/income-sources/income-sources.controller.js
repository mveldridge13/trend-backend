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
exports.IncomeSourcesController = void 0;
const common_1 = require("@nestjs/common");
const income_sources_service_1 = require("./income-sources.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const create_income_source_dto_1 = require("./dto/create-income-source.dto");
const update_income_source_dto_1 = require("./dto/update-income-source.dto");
let IncomeSourcesController = class IncomeSourcesController {
    constructor(incomeSourcesService) {
        this.incomeSourcesService = incomeSourcesService;
    }
    extractUserId(req) {
        const userId = req.user?.id || req.user?.userId || req.user?.sub;
        if (!userId) {
            throw new Error("User ID not found in request");
        }
        return userId;
    }
    async findAll(req) {
        return this.incomeSourcesService.findAll(this.extractUserId(req));
    }
    async create(req, dto) {
        return this.incomeSourcesService.create(this.extractUserId(req), dto);
    }
    async update(req, id, dto) {
        return this.incomeSourcesService.update(this.extractUserId(req), id, dto);
    }
    async remove(req, id) {
        await this.incomeSourcesService.remove(this.extractUserId(req), id);
    }
    async dismissRolloverNotification(req, id) {
        await this.incomeSourcesService.dismissRolloverNotification(this.extractUserId(req), id);
    }
};
exports.IncomeSourcesController = IncomeSourcesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IncomeSourcesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_income_source_dto_1.CreateIncomeSourceDto]),
    __metadata("design:returntype", Promise)
], IncomeSourcesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(":id"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_income_source_dto_1.UpdateIncomeSourceDto]),
    __metadata("design:returntype", Promise)
], IncomeSourcesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IncomeSourcesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(":id/dismiss-rollover-notification"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IncomeSourcesController.prototype, "dismissRolloverNotification", null);
exports.IncomeSourcesController = IncomeSourcesController = __decorate([
    (0, common_1.Controller)("income-sources"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [income_sources_service_1.IncomeSourcesService])
], IncomeSourcesController);
//# sourceMappingURL=income-sources.controller.js.map