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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const users_service_1 = require("./users.service");
const update_user_dto_1 = require("./dto/update-user.dto");
const update_user_profile_dto_1 = require("./dto/update-user-profile.dto");
const update_rollover_dto_1 = require("./dto/update-rollover.dto");
const create_rollover_entry_dto_1 = require("./dto/create-rollover-entry.dto");
const create_rollover_notification_dto_1 = require("./dto/create-rollover-notification.dto");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getProfile(req) {
        const userId = req.user.id;
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        return user;
    }
    async updateProfile(req, updateUserDto) {
        const userId = req.user.id;
        return this.usersService.updateProfile(userId, updateUserDto);
    }
    async getIncome(req) {
        const userId = req.user.id;
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        return {
            income: user.income,
            incomeFrequency: user.incomeFrequency,
            nextPayDate: user.nextPayDate,
            setupComplete: user.setupComplete,
        };
    }
    async updateIncome(req, incomeData) {
        const userId = req.user.id;
        try {
            const updatedUser = await this.usersService.updateProfile(userId, incomeData);
            return {
                success: true,
                income: {
                    income: updatedUser.income,
                    incomeFrequency: updatedUser.incomeFrequency,
                    nextPayDate: updatedUser.nextPayDate,
                    setupComplete: updatedUser.setupComplete,
                },
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getRolloverStatus(req) {
        const userId = req.user.id;
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        return {
            rolloverAmount: user.rolloverAmount,
            lastRolloverDate: user.lastRolloverDate,
        };
    }
    async updateRollover(req, rolloverData) {
        const userId = req.user.id;
        try {
            const updatedUser = await this.usersService.updateProfile(userId, rolloverData);
            return {
                success: true,
                rollover: {
                    rolloverAmount: updatedUser.rolloverAmount,
                    lastRolloverDate: updatedUser.lastRolloverDate,
                },
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getRolloverHistory(req) {
        const userId = req.user.id;
        return this.usersService.getRolloverHistory(userId);
    }
    async createRolloverEntry(req, createRolloverEntryDto) {
        const userId = req.user.id;
        return this.usersService.createRolloverEntry(userId, createRolloverEntryDto);
    }
    async getRolloverNotification(req) {
        const userId = req.user.id;
        return this.usersService.getRolloverNotification(userId);
    }
    async createRolloverNotification(req, createNotificationDto) {
        const userId = req.user.id;
        return this.usersService.createRolloverNotification(userId, createNotificationDto);
    }
    async dismissRolloverNotification(req) {
        const userId = req.user.id;
        await this.usersService.dismissRolloverNotification(userId);
    }
    async exportUserData(req) {
        const userId = req.user.id;
        return this.usersService.exportUserData(userId);
    }
    async deleteAccount(req) {
        const userId = req.user.id;
        await this.usersService.permanentlyDeleteAccount(userId);
    }
    async updateOnboarding(req, updateOnboardingDto) {
        const userId = req.user.id;
        return this.usersService.updateProfile(userId, updateOnboardingDto);
    }
    async deactivateAccount(req) {
        const userId = req.user.id;
        await this.usersService.deactivate(userId);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)("profile"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)("profile"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)("income"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getIncome", null);
__decorate([
    (0, common_1.Put)("income"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateIncome", null);
__decorate([
    (0, common_1.Get)("rollover"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getRolloverStatus", null);
__decorate([
    (0, common_1.Put)("rollover"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_rollover_dto_1.UpdateRolloverDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateRollover", null);
__decorate([
    (0, common_1.Get)("rollover/history"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getRolloverHistory", null);
__decorate([
    (0, common_1.Post)("rollover/entries"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_rollover_entry_dto_1.CreateRolloverEntryDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createRolloverEntry", null);
__decorate([
    (0, common_1.Get)("rollover/notification"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getRolloverNotification", null);
__decorate([
    (0, common_1.Post)("rollover/notification"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_rollover_notification_dto_1.CreateRolloverNotificationDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createRolloverNotification", null);
__decorate([
    (0, common_1.Delete)("rollover/notification"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "dismissRolloverNotification", null);
__decorate([
    (0, common_1.Post)("export-data"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "exportUserData", null);
__decorate([
    (0, common_1.Delete)("account"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteAccount", null);
__decorate([
    (0, common_1.Patch)("onboarding"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_user_profile_dto_1.UpdateUserProfileDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateOnboarding", null);
__decorate([
    (0, common_1.Delete)("profile"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deactivateAccount", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)("users"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map