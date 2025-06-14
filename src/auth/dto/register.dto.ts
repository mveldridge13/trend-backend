// src/auth/dto/register.dto.ts
export class RegisterDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  username?: string;
  currency?: string;
  timezone?: string;
}
