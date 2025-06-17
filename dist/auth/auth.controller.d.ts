import { AuthService } from "./auth.service";
import { UpdateUserProfileDto } from "../users/dto/update-user-profile.dto";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: any): Promise<import("./dto/auth-response.dto").AuthResponseDto>;
    login(loginDto: any): Promise<import("./dto/auth-response.dto").AuthResponseDto>;
    getProfile(req: any): Promise<{
        income?: number;
        setupComplete: boolean;
        hasSeenWelcome: boolean;
    }>;
    updateProfile(req: any, updateProfileDto: UpdateUserProfileDto): Promise<{
        income?: number;
        setupComplete: boolean;
        hasSeenWelcome: boolean;
    }>;
}
