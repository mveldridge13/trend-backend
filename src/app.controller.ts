import { Controller, Get, Post, Body } from "@nestjs/common";
import { AppService } from "./app.service";
import { AuthService } from "./auth/auth.service";
import { RegisterDto } from "./auth/dto/register.dto";
import { LoginDto } from "./auth/dto/login.dto";
import { AuthResponseDto } from "./auth/dto/auth-response.dto";

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("health")
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "Trend API",
    };
  }

  @Post("auth/register")
  async authRegister(@Body() body: any): Promise<AuthResponseDto> {
    const registerDto: RegisterDto = {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      password: body.password,
      username: body.username,
      currency: body.currency || "USD",
      timezone: body.timezone || "UTC",
    };

    return await this.authService.register(registerDto);
  }

  @Post("auth/login")
  async authLogin(@Body() body: any): Promise<AuthResponseDto> {
    const loginDto: LoginDto = {
      email: body.email,
      password: body.password,
    };

    return await this.authService.login(loginDto);
  }
}
