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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const users_repository_1 = require("../users/repositories/users.repository");
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_DURATION_MINUTES = 15;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
let AuthService = class AuthService {
    constructor(usersRepository, jwtService) {
        this.usersRepository = usersRepository;
        this.jwtService = jwtService;
    }
    generateRefreshToken() {
        return crypto.randomBytes(64).toString("hex");
    }
    isAccountLocked(lockedUntil) {
        if (!lockedUntil)
            return false;
        return new Date() < lockedUntil;
    }
    async register(registerDto, ipAddress, userAgent) {
        const existingUser = await this.usersRepository.findByEmail(registerDto.email);
        if (existingUser) {
            throw new common_1.ConflictException("User with this email already exists");
        }
        if (registerDto.username) {
            const userWithUsername = await this.usersRepository.findByUsername(registerDto.username);
            if (userWithUsername) {
                throw new common_1.ConflictException("Username already taken");
            }
        }
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);
        const user = await this.usersRepository.create({
            ...registerDto,
            passwordHash,
        });
        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
        };
        const access_token = this.jwtService.sign(payload);
        const refreshToken = this.generateRefreshToken();
        const refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        await this.usersRepository.createRefreshToken({
            userId: user.id,
            token: refreshToken,
            expiresAt: refreshTokenExpiry,
            ipAddress,
            userAgent,
        });
        return {
            access_token,
            refresh_token: refreshToken,
            expires_in: 900,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                currency: user.currency,
                timezone: user.timezone,
                createdAt: user.createdAt,
                income: user.income ? Number(user.income) : null,
                incomeFrequency: user.incomeFrequency || null,
                nextPayDate: user.nextPayDate || null,
                fixedExpenses: user.fixedExpenses ? Number(user.fixedExpenses) : null,
                setupComplete: user.setupComplete ?? false,
                hasSeenBalanceCardTour: user.hasSeenBalanceCardTour ?? false,
                hasSeenAddTransactionTour: user.hasSeenAddTransactionTour ?? false,
                hasSeenTransactionSwipeTour: user.hasSeenTransactionSwipeTour ?? false,
            },
        };
    }
    async login(loginDto, ipAddress, userAgent) {
        const user = await this.usersRepository.findByEmail(loginDto.email);
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        if (this.isAccountLocked(user.lockedUntil)) {
            const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
            throw new common_1.ForbiddenException(`Account is locked. Please try again in ${remainingMinutes} minute(s).`);
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash || "");
        if (!isPasswordValid) {
            const updatedUser = await this.usersRepository.recordFailedLogin(user.id);
            if (updatedUser.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
                await this.usersRepository.lockAccount(user.id, ACCOUNT_LOCK_DURATION_MINUTES);
                throw new common_1.ForbiddenException(`Account locked due to too many failed login attempts. Please try again in ${ACCOUNT_LOCK_DURATION_MINUTES} minutes.`);
            }
            const remainingAttempts = MAX_FAILED_LOGIN_ATTEMPTS - updatedUser.failedLoginAttempts;
            throw new common_1.UnauthorizedException(`Invalid credentials. ${remainingAttempts} attempt(s) remaining before account lockout.`);
        }
        await this.usersRepository.resetFailedLoginAttempts(user.id);
        await this.usersRepository.updateLastLogin(user.id);
        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
        };
        const access_token = this.jwtService.sign(payload);
        const refreshToken = this.generateRefreshToken();
        const refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        await this.usersRepository.createRefreshToken({
            userId: user.id,
            token: refreshToken,
            expiresAt: refreshTokenExpiry,
            ipAddress,
            userAgent,
        });
        return {
            access_token,
            refresh_token: refreshToken,
            expires_in: 900,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                currency: user.currency,
                timezone: user.timezone,
                createdAt: user.createdAt,
                income: user.income ? Number(user.income) : null,
                incomeFrequency: user.incomeFrequency || null,
                nextPayDate: user.nextPayDate || null,
                fixedExpenses: user.fixedExpenses ? Number(user.fixedExpenses) : null,
                setupComplete: user.setupComplete ?? false,
                hasSeenBalanceCardTour: user.hasSeenBalanceCardTour ?? false,
                hasSeenAddTransactionTour: user.hasSeenAddTransactionTour ?? false,
                hasSeenTransactionSwipeTour: user.hasSeenTransactionSwipeTour ?? false,
            },
        };
    }
    async refreshToken(refreshToken, ipAddress, userAgent) {
        const storedToken = await this.usersRepository.findRefreshToken(refreshToken);
        if (!storedToken) {
            throw new common_1.UnauthorizedException("Invalid refresh token");
        }
        if (storedToken.revokedAt) {
            throw new common_1.UnauthorizedException("Refresh token has been revoked");
        }
        if (new Date() > storedToken.expiresAt) {
            throw new common_1.UnauthorizedException("Refresh token has expired");
        }
        const user = await this.usersRepository.findById(storedToken.userId);
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException("User not found or inactive");
        }
        await this.usersRepository.revokeRefreshToken(refreshToken);
        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
        };
        const access_token = this.jwtService.sign(payload);
        const newRefreshToken = this.generateRefreshToken();
        const refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        await this.usersRepository.createRefreshToken({
            userId: user.id,
            token: newRefreshToken,
            expiresAt: refreshTokenExpiry,
            ipAddress,
            userAgent,
        });
        return {
            access_token,
            refresh_token: newRefreshToken,
            expires_in: 900,
        };
    }
    async logout(userId, refreshToken) {
        if (refreshToken) {
            await this.usersRepository.revokeRefreshToken(refreshToken);
        }
        else {
            await this.usersRepository.revokeAllUserRefreshTokens(userId);
        }
        return {
            success: true,
            message: refreshToken
                ? "Logged out successfully"
                : "Logged out from all devices",
        };
    }
    async validateUser(id) {
        const user = await this.usersRepository.findById(id);
        if (!user || !user.isActive) {
            return null;
        }
        const { passwordHash, ...result } = user;
        return result;
    }
    async getUserProfile(id) {
        const user = await this.usersRepository.findById(id);
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException("User not found");
        }
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            currency: user.currency,
            timezone: user.timezone,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            income: user.income ? Number(user.income) : undefined,
            incomeFrequency: user.incomeFrequency || undefined,
            nextPayDate: user.nextPayDate || undefined,
            fixedExpenses: user.fixedExpenses
                ? Number(user.fixedExpenses)
                : undefined,
            setupComplete: user.setupComplete ?? false,
            hasSeenWelcome: user.hasSeenWelcome ?? false,
            hasSeenBalanceCardTour: user.hasSeenBalanceCardTour ?? false,
            hasSeenAddTransactionTour: user.hasSeenAddTransactionTour ?? false,
            hasSeenTransactionSwipeTour: user.hasSeenTransactionSwipeTour ?? false,
        };
    }
    async updateUserProfile(id, profileData) {
        const user = await this.usersRepository.findById(id);
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException("User not found");
        }
        const updatedUser = await this.usersRepository.updateProfile(id, profileData);
        const result = {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            username: updatedUser.username,
            currency: updatedUser.currency,
            timezone: updatedUser.timezone,
            isActive: updatedUser.isActive,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
            income: updatedUser.income ? Number(updatedUser.income) : undefined,
            incomeFrequency: updatedUser.incomeFrequency || undefined,
            nextPayDate: updatedUser.nextPayDate || undefined,
            fixedExpenses: updatedUser.fixedExpenses
                ? Number(updatedUser.fixedExpenses)
                : undefined,
            setupComplete: updatedUser.setupComplete ?? false,
            hasSeenWelcome: updatedUser.hasSeenWelcome ?? false,
            hasSeenBalanceCardTour: updatedUser.hasSeenBalanceCardTour ?? false,
            hasSeenAddTransactionTour: updatedUser.hasSeenAddTransactionTour ?? false,
            hasSeenTransactionSwipeTour: updatedUser.hasSeenTransactionSwipeTour ?? false,
        };
        return result;
    }
    async changePassword(userId, changePasswordDto) {
        const user = await this.usersRepository.findById(userId);
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException("User not found");
        }
        const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.passwordHash || "");
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException("Current password is incorrect");
        }
        const isSamePassword = await bcrypt.compare(changePasswordDto.newPassword, user.passwordHash || "");
        if (isSamePassword) {
            throw new common_1.BadRequestException("New password must be different from current password");
        }
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);
        await this.usersRepository.updatePassword(userId, newPasswordHash);
        await this.usersRepository.revokeAllUserRefreshTokens(userId);
        return {
            success: true,
            message: "Password changed successfully. Please log in again on all devices.",
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map