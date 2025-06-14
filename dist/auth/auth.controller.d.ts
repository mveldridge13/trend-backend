import { AuthService } from "./auth.service";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: any): Promise<import("./dto/auth-response.dto").AuthResponseDto>;
    login(loginDto: any): Promise<import("./dto/auth-response.dto").AuthResponseDto>;
}
