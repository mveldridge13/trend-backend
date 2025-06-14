import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserDto } from "./dto/user.dto";
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<UserDto>;
    updateProfile(req: any, updateUserDto: UpdateUserDto): Promise<UserDto>;
    deactivateAccount(req: any): Promise<void>;
}
