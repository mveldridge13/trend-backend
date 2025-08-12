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
exports.PokerController = void 0;
const common_1 = require("@nestjs/common");
const poker_service_1 = require("./poker.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const create_poker_tournament_dto_1 = require("./dto/create-poker-tournament.dto");
const update_poker_tournament_dto_1 = require("./dto/update-poker-tournament.dto");
const create_poker_tournament_event_dto_1 = require("./dto/create-poker-tournament-event.dto");
const update_poker_tournament_event_dto_1 = require("./dto/update-poker-tournament-event.dto");
let PokerController = class PokerController {
    constructor(pokerService) {
        this.pokerService = pokerService;
    }
    extractUserId(req) {
        const userId = req.user?.id || req.user?.userId || req.user?.sub;
        if (!userId) {
            throw new Error("User ID not found in request");
        }
        return userId;
    }
    async createTournament(req, createTournamentDto) {
        const userId = this.extractUserId(req);
        return this.pokerService.createTournament(userId, createTournamentDto);
    }
    async getTournaments(req) {
        const userId = this.extractUserId(req);
        return this.pokerService.getTournaments(userId);
    }
    async getTournamentById(req, id) {
        const userId = this.extractUserId(req);
        return this.pokerService.getTournamentById(id, userId);
    }
    async updateTournament(req, id, updateTournamentDto) {
        const userId = this.extractUserId(req);
        return this.pokerService.updateTournament(id, userId, updateTournamentDto);
    }
    async deleteTournament(req, id) {
        const userId = this.extractUserId(req);
        return this.pokerService.deleteTournament(id, userId);
    }
    async createTournamentEvent(req, tournamentId, createEventDto) {
        const userId = this.extractUserId(req);
        return this.pokerService.createTournamentEvent(tournamentId, userId, createEventDto);
    }
    async updateTournamentEvent(req, eventId, updateEventDto) {
        const userId = this.extractUserId(req);
        return this.pokerService.updateTournamentEvent(eventId, userId, updateEventDto);
    }
    async deleteTournamentEvent(req, eventId) {
        const userId = this.extractUserId(req);
        return this.pokerService.deleteTournamentEvent(eventId, userId);
    }
    async getPokerAnalytics(req) {
        const userId = this.extractUserId(req);
        return this.pokerService.getPokerAnalytics(userId);
    }
    async getTournamentAnalytics(req, id) {
        const userId = this.extractUserId(req);
        return this.pokerService.getTournamentAnalytics(id, userId);
    }
};
exports.PokerController = PokerController;
__decorate([
    (0, common_1.Post)("tournaments"),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_poker_tournament_dto_1.CreatePokerTournamentDto]),
    __metadata("design:returntype", Promise)
], PokerController.prototype, "createTournament", null);
__decorate([
    (0, common_1.Get)("tournaments"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PokerController.prototype, "getTournaments", null);
__decorate([
    (0, common_1.Get)("tournaments/:id"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PokerController.prototype, "getTournamentById", null);
__decorate([
    (0, common_1.Put)("tournaments/:id"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_poker_tournament_dto_1.UpdatePokerTournamentDto]),
    __metadata("design:returntype", Promise)
], PokerController.prototype, "updateTournament", null);
__decorate([
    (0, common_1.Delete)("tournaments/:id"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PokerController.prototype, "deleteTournament", null);
__decorate([
    (0, common_1.Post)("tournaments/:tournamentId/events"),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("tournamentId")),
    __param(2, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_poker_tournament_event_dto_1.CreatePokerTournamentEventDto]),
    __metadata("design:returntype", Promise)
], PokerController.prototype, "createTournamentEvent", null);
__decorate([
    (0, common_1.Put)("tournaments/events/:eventId"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("eventId")),
    __param(2, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_poker_tournament_event_dto_1.UpdatePokerTournamentEventDto]),
    __metadata("design:returntype", Promise)
], PokerController.prototype, "updateTournamentEvent", null);
__decorate([
    (0, common_1.Delete)("tournaments/events/:eventId"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("eventId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PokerController.prototype, "deleteTournamentEvent", null);
__decorate([
    (0, common_1.Get)("analytics"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PokerController.prototype, "getPokerAnalytics", null);
__decorate([
    (0, common_1.Get)("tournaments/:id/analytics"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PokerController.prototype, "getTournamentAnalytics", null);
exports.PokerController = PokerController = __decorate([
    (0, common_1.Controller)("poker"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [poker_service_1.PokerService])
], PokerController);
//# sourceMappingURL=poker.controller.js.map