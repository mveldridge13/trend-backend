"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PokerModule = void 0;
const common_1 = require("@nestjs/common");
const poker_controller_1 = require("./poker.controller");
const poker_service_1 = require("./poker.service");
const poker_repository_1 = require("./repositories/poker.repository");
const prisma_service_1 = require("../database/prisma.service");
let PokerModule = class PokerModule {
};
exports.PokerModule = PokerModule;
exports.PokerModule = PokerModule = __decorate([
    (0, common_1.Module)({
        controllers: [poker_controller_1.PokerController],
        providers: [poker_service_1.PokerService, poker_repository_1.PokerRepository, prisma_service_1.PrismaService],
        exports: [poker_service_1.PokerService, poker_repository_1.PokerRepository],
    })
], PokerModule);
//# sourceMappingURL=poker.module.js.map