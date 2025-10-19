import { User, RolloverEntry, RolloverType, RolloverNotification } from "@prisma/client";
import { BaseRepository } from "../../database/base.repository";
import { PrismaService } from "../../database/prisma.service";
import { RegisterDto } from "../../auth/dto/register.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { UpdateUserProfileDto } from "../dto/update-user-profile.dto";
export declare class UsersRepository extends BaseRepository<User> {
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(data: RegisterDto & {
        passwordHash: string;
    }): Promise<User>;
    update(id: string, data: UpdateUserDto): Promise<User>;
    updateProfile(id: string, data: UpdateUserProfileDto): Promise<User>;
    updateLastLogin(id: string): Promise<void>;
    updatePassword(id: string, passwordHash: string): Promise<void>;
    getRolloverHistory(userId: string): Promise<RolloverEntry[]>;
    createRolloverEntry(data: {
        userId: string;
        amount: number;
        type: RolloverType;
        periodStart: Date;
        periodEnd: Date;
        description?: string;
    }): Promise<RolloverEntry>;
    getRolloverNotification(userId: string): Promise<RolloverNotification | null>;
    createRolloverNotification(data: {
        userId: string;
        amount: number;
        fromPeriod?: string;
        createdAt?: Date;
    }): Promise<RolloverNotification>;
    dismissRolloverNotification(userId: string): Promise<void>;
}
