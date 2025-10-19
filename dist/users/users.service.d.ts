import { UsersRepository } from "./repositories/users.repository";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { UserDto } from "./dto/user.dto";
import { RolloverEntryDto } from "./dto/rollover-entry.dto";
import { CreateRolloverEntryDto } from "./dto/create-rollover-entry.dto";
import { RolloverNotificationDto } from "./dto/rollover-notification.dto";
import { CreateRolloverNotificationDto } from "./dto/create-rollover-notification.dto";
import { PrismaService } from "../database/prisma.service";
export declare class UsersService {
    private readonly usersRepository;
    private readonly prisma;
    constructor(usersRepository: UsersRepository, prisma: PrismaService);
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
    getRolloverHistory(userId: string): Promise<RolloverEntryDto[]>;
    createRolloverEntry(userId: string, createRolloverEntryDto: CreateRolloverEntryDto): Promise<RolloverEntryDto>;
    getRolloverNotification(userId: string): Promise<RolloverNotificationDto | null>;
    createRolloverNotification(userId: string, createNotificationDto: CreateRolloverNotificationDto): Promise<RolloverNotificationDto>;
    dismissRolloverNotification(userId: string): Promise<void>;
    exportUserData(userId: string): Promise<any>;
    permanentlyDeleteAccount(userId: string): Promise<void>;
    private toUserDto;
}
