import { AppService } from "./app.service";
import { AuthService } from "./auth/auth.service";
import { AuthResponseDto } from "./auth/dto/auth-response.dto";
export declare class AppController {
    private readonly appService;
    private readonly authService;
    constructor(appService: AppService, authService: AuthService);
    getHello(): string;
    getHealth(): {
        status: string;
        timestamp: string;
        service: string;
    };
    authRegister(body: any): Promise<AuthResponseDto>;
    authLogin(body: any): Promise<AuthResponseDto>;
}
