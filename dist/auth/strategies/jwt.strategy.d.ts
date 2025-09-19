import { Strategy } from "passport-jwt";
import { UsersService } from "../../users/users.service";
export interface JwtPayload {
    userId?: string;
    sub?: string;
    email?: string;
    username?: string;
    iat?: number;
    exp?: number;
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private usersService;
    constructor(usersService: UsersService);
    validate(payload: JwtPayload): Promise<{
        userId: string;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        username: string;
    }>;
}
export {};
