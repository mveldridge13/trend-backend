import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { UserDto } from "./dto/user.dto";
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<UserDto>;
    updateProfile(req: any, updateUserDto: UpdateUserDto): Promise<UserDto>;
    getIncome(req: any): Promise<any>;
    updateIncome(req: any, incomeData: UpdateUserDto): Promise<any>;
    updateOnboarding(req: any, updateOnboardingDto: UpdateUserProfileDto): Promise<UserDto>;
    deactivateAccount(req: any): Promise<void>;
}
