import { AuthService } from "./auth.service";
import { UpdateUserProfileDto } from "../users/dto/update-user-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto, ip: string, userAgent: string): Promise<import("./dto/auth-response.dto").AuthResponseDto>;
    login(loginDto: LoginDto, ip: string, userAgent: string): Promise<import("./dto/auth-response.dto").AuthResponseDto>;
    refreshToken(refreshTokenDto: RefreshTokenDto, ip: string, userAgent: string): Promise<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
    }>;
    logout(body: {
        refreshToken?: string;
    }, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getProfile(req: any): Promise<{
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
        incomeFrequency?: import(".prisma/client").IncomeFrequency;
        nextPayDate?: Date;
        fixedExpenses?: number;
        setupComplete: boolean;
        hasSeenWelcome: boolean;
        hasSeenBalanceCardTour: boolean;
        hasSeenAddTransactionTour: boolean;
        hasSeenTransactionSwipeTour: boolean;
    }>;
    updateProfile(req: any, updateProfileDto: UpdateUserProfileDto): Promise<{
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
        incomeFrequency?: import(".prisma/client").IncomeFrequency;
        nextPayDate?: Date;
        fixedExpenses?: number;
        setupComplete: boolean;
        hasSeenWelcome: boolean;
        hasSeenBalanceCardTour: boolean;
        hasSeenAddTransactionTour: boolean;
        hasSeenTransactionSwipeTour: boolean;
    }>;
    changePassword(req: any, changePasswordDto: ChangePasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
