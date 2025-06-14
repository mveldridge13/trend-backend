import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() registerDto: any) {
    console.log("Register called with:", registerDto);
    return this.authService.register(registerDto);
  }

  @Post("login")
  async login(@Body() loginDto: any) {
    console.log("Login called with:", loginDto);
    return this.authService.login(loginDto);
  }
}
