import { UsersRepository } from "./repositories/users.repository";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { UserDto } from "./dto/user.dto";
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: UsersRepository);
    findById(id: string): Promise<UserDto | null>;
    findByEmail(email: string): Promise<UserDto | null>;
    updateProfile(id: string, updateData: UpdateUserDto): Promise<UserDto>;
    getUserProfile(id: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        income?: number;
        incomeFrequency?: string;
        nextPayDate?: string;
        setupComplete: boolean;
        hasSeenWelcome: boolean;
    }>;
    updateUserProfile(id: string, profileData: UpdateUserProfileDto): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        income?: number;
        incomeFrequency?: string;
        nextPayDate?: string;
        setupComplete: boolean;
        hasSeenWelcome: boolean;
    }>;
    deactivate(id: string): Promise<void>;
    private toUserDto;
}
