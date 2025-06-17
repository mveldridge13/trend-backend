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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const users_repository_1 = require("./repositories/users.repository");
let UsersService = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async findById(id) {
        const user = await this.usersRepository.findById(id);
        if (!user) {
            return null;
        }
        return this.toUserDto(user);
    }
    async findByEmail(email) {
        const user = await this.usersRepository.findByEmail(email);
        if (!user) {
            return null;
        }
        return this.toUserDto(user);
    }
    async updateProfile(id, updateData) {
        const existingUser = await this.usersRepository.findById(id);
        if (!existingUser) {
            throw new common_1.NotFoundException("User not found");
        }
        if (updateData.username && updateData.username !== existingUser.username) {
            const userWithUsername = await this.usersRepository.findByUsername(updateData.username);
            if (userWithUsername) {
                throw new Error("Username already taken");
            }
        }
        const updatedUser = await this.usersRepository.update(id, updateData);
        return this.toUserDto(updatedUser);
    }
    async getUserProfile(id) {
        const user = await this.usersRepository.findById(id);
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        return {
            income: user.income ? Number(user.income) : undefined,
            setupComplete: user.setupComplete,
            hasSeenWelcome: user.hasSeenWelcome,
        };
    }
    async updateUserProfile(id, profileData) {
        const existingUser = await this.usersRepository.findById(id);
        if (!existingUser) {
            throw new common_1.NotFoundException("User not found");
        }
        const updatedUser = await this.usersRepository.updateProfile(id, profileData);
        return {
            income: updatedUser.income ? Number(updatedUser.income) : undefined,
            setupComplete: updatedUser.setupComplete,
            hasSeenWelcome: updatedUser.hasSeenWelcome,
        };
    }
    async deactivate(id) {
        const existingUser = await this.usersRepository.findById(id);
        if (!existingUser) {
            throw new common_1.NotFoundException("User not found");
        }
        await this.usersRepository.update(id, { isActive: false });
    }
    toUserDto(user) {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository])
], UsersService);
//# sourceMappingURL=users.service.js.map