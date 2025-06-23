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
const users_repository_1 = require("../users/repositories/users.repository");
let AuthService = class AuthService {
    constructor(usersRepository, jwtService) {
        this.usersRepository = usersRepository;
        this.jwtService = jwtService;
    }
    async register(registerDto) {
        console.log("📝 Registration attempt for:", registerDto.email);
        const existingUser = await this.usersRepository.findByEmail(registerDto.email);
        if (existingUser) {
            console.log("❌ User already exists:", registerDto.email);
            throw new common_1.ConflictException("User with this email already exists");
        }
        if (registerDto.username) {
            const userWithUsername = await this.usersRepository.findByUsername(registerDto.username);
            if (userWithUsername) {
                console.log("❌ Username already taken:", registerDto.username);
                throw new common_1.ConflictException("Username already taken");
            }
        }
        console.log("🔐 Hashing password...");
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);
        console.log("👤 Creating user...");
        const user = await this.usersRepository.create({
            ...registerDto,
            passwordHash,
        });
        console.log("🎫 Generating JWT token...");
        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
        };
        const access_token = this.jwtService.sign(payload);
        console.log("✅ Registration successful for:", user.email);
        return {
            access_token,
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
                setupComplete: user.setupComplete ?? false,
                hasSeenBalanceCardTour: user.hasSeenBalanceCardTour ?? false,
                hasSeenAddTransactionTour: user.hasSeenAddTransactionTour ?? false,
                hasSeenTransactionSwipeTour: user.hasSeenTransactionSwipeTour ?? false,
            },
        };
    }
    async login(loginDto) {
        console.log("🔐 Login attempt for:", loginDto.email);
        console.log("🔐 Login data received:", {
            email: loginDto.email,
            passwordLength: loginDto.password?.length || 0,
        });
        console.log("👤 Looking up user...");
        const user = await this.usersRepository.findByEmail(loginDto.email);
        console.log("👤 User found:", user ? "Yes" : "No");
        if (user) {
            console.log("👤 User details:", {
                id: user.id,
                email: user.email,
                isActive: user.isActive,
                hasPasswordHash: !!user.passwordHash,
                passwordHashLength: user.passwordHash?.length || 0,
            });
        }
        if (!user || !user.isActive) {
            console.log("❌ User not found or inactive");
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        console.log("🔑 Verifying password...");
        console.log("🔑 Comparing:", {
            providedPasswordLength: loginDto.password?.length || 0,
            storedPasswordHashLength: user.passwordHash?.length || 0,
        });
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash || "");
        console.log("🔑 Password validation result:", isPasswordValid);
        if (!isPasswordValid) {
            console.log("❌ Invalid password for user:", user.email);
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        console.log("✅ Password verified successfully");
        console.log("📅 Updating last login...");
        await this.usersRepository.updateLastLogin(user.id);
        console.log("🎫 Generating JWT token...");
        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
        };
        const access_token = this.jwtService.sign(payload);
        console.log("✅ Login successful for:", user.email);
        return {
            access_token,
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
                setupComplete: user.setupComplete ?? false,
                hasSeenBalanceCardTour: user.hasSeenBalanceCardTour ?? false,
                hasSeenAddTransactionTour: user.hasSeenAddTransactionTour ?? false,
                hasSeenTransactionSwipeTour: user.hasSeenTransactionSwipeTour ?? false,
            },
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
        console.log("👤 Getting user profile for:", id);
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
            setupComplete: user.setupComplete ?? false,
            hasSeenWelcome: user.hasSeenWelcome ?? false,
            hasSeenBalanceCardTour: user.hasSeenBalanceCardTour ?? false,
            hasSeenAddTransactionTour: user.hasSeenAddTransactionTour ?? false,
            hasSeenTransactionSwipeTour: user.hasSeenTransactionSwipeTour ?? false,
        };
    }
    async updateUserProfile(id, profileData) {
        console.log("👤 Updating user profile for:", id, profileData);
        const user = await this.usersRepository.findById(id);
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException("User not found");
        }
        const updatedUser = await this.usersRepository.updateProfile(id, profileData);
        return {
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
            setupComplete: updatedUser.setupComplete ?? false,
            hasSeenWelcome: updatedUser.hasSeenWelcome ?? false,
            hasSeenBalanceCardTour: updatedUser.hasSeenBalanceCardTour ?? false,
            hasSeenAddTransactionTour: updatedUser.hasSeenAddTransactionTour ?? false,
            hasSeenTransactionSwipeTour: updatedUser.hasSeenTransactionSwipeTour ?? false,
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