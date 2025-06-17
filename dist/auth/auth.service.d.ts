import { JwtService } from "@nestjs/jwt";
import { UsersRepository } from "../users/repositories/users.repository";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { UpdateUserProfileDto } from "../users/dto/update-user-profile.dto";
export declare class AuthService {
    private readonly usersRepository;
    private readonly jwtService;
    constructor(usersRepository: UsersRepository, jwtService: JwtService);
    register(registerDto: RegisterDto): Promise<AuthResponseDto>;
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
    validateUser(id: string): Promise<any>;
    getUserProfile(id: string): Promise<{
        income?: number;
        setupComplete: boolean;
        hasSeenWelcome: boolean;
    }>;
    updateUserProfile(id: string, profileData: UpdateUserProfileDto): Promise<{
        income?: number;
        setupComplete: boolean;
        hasSeenWelcome: boolean;
    }>;
}
