import { JwtService } from "@nestjs/jwt";
import { UsersRepository } from "../users/repositories/users.repository";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { UpdateUserProfileDto } from "../users/dto/update-user-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { IncomeFrequency } from "@prisma/client";
export declare class AuthService {
    private readonly usersRepository;
    private readonly jwtService;
    constructor(usersRepository: UsersRepository, jwtService: JwtService);
    private generateRefreshToken;
    private isAccountLocked;
    register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto>;
    login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto>;
    refreshToken(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
    }>;
    logout(userId: string, refreshToken?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    validateUser(id: string): Promise<any>;
    getUserProfile(id: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        username: string | null;
        currency: string;
        timezone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        income?: number;
        incomeFrequency?: IncomeFrequency;
        nextPayDate?: Date;
        fixedExpenses?: number;
        setupComplete: boolean;
        hasSeenWelcome: boolean;
        hasSeenBalanceCardTour: boolean;
        hasSeenAddTransactionTour: boolean;
        hasSeenTransactionSwipeTour: boolean;
    }>;
    updateUserProfile(id: string, profileData: UpdateUserProfileDto): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        username: string | null;
        currency: string;
        timezone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        income?: number;
        incomeFrequency?: IncomeFrequency;
        nextPayDate?: Date;
        fixedExpenses?: number;
        setupComplete: boolean;
        hasSeenWelcome: boolean;
        hasSeenBalanceCardTour: boolean;
        hasSeenAddTransactionTour: boolean;
        hasSeenTransactionSwipeTour: boolean;
    }>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
