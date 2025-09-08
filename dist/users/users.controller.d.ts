import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { UserDto } from "./dto/user.dto";
import { UpdateRolloverDto } from "./dto/update-rollover.dto";
import { RolloverEntryDto } from "./dto/rollover-entry.dto";
import { CreateRolloverEntryDto } from "./dto/create-rollover-entry.dto";
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
    updateOnboarding(req: any, updateOnboardingDto: UpdateUserProfileDto): Promise<UserDto>;
    deactivateAccount(req: any): Promise<void>;
}
