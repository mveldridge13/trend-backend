import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { UserDto } from "./dto/user.dto";
import { UpdateRolloverDto } from "./dto/update-rollover.dto";
import { RolloverEntryDto } from "./dto/rollover-entry.dto";
import { CreateRolloverEntryDto } from "./dto/create-rollover-entry.dto";
import { RolloverNotificationDto } from "./dto/rollover-notification.dto";
import { CreateRolloverNotificationDto } from "./dto/create-rollover-notification.dto";
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<UserDto>;
    updateProfile(req: any, updateUserDto: UpdateUserDto): Promise<UserDto>;
    getIncome(req: any): Promise<any>;
    updateIncome(req: any, incomeData: UpdateUserDto): Promise<any>;
    getRolloverStatus(req: any): Promise<any>;
    updateRollover(req: any, rolloverData: UpdateRolloverDto): Promise<any>;
    getRolloverHistory(req: any): Promise<RolloverEntryDto[]>;
    createRolloverEntry(req: any, createRolloverEntryDto: CreateRolloverEntryDto): Promise<RolloverEntryDto>;
    getRolloverNotification(req: any): Promise<RolloverNotificationDto | null>;
    createRolloverNotification(req: any, createNotificationDto: CreateRolloverNotificationDto): Promise<RolloverNotificationDto>;
    dismissRolloverNotification(req: any): Promise<void>;
    exportUserData(req: any): Promise<any>;
    deleteAccount(req: any): Promise<void>;
    updateOnboarding(req: any, updateOnboardingDto: UpdateUserProfileDto): Promise<UserDto>;
    deactivateAccount(req: any): Promise<void>;
}
