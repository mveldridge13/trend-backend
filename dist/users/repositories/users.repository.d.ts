import { User } from "@prisma/client";
import { BaseRepository } from "../../database/base.repository";
import { PrismaService } from "../../database/prisma.service";
import { RegisterDto } from "../../auth/dto/register.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
export declare class UsersRepository extends BaseRepository<User> {
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(data: RegisterDto & {
        passwordHash: string;
    }): Promise<User>;
    update(id: string, data: UpdateUserDto): Promise<User>;
    updateLastLogin(id: string): Promise<void>;
}
