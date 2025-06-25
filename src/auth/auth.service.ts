import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UsersRepository } from "../users/repositories/users.repository";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { UpdateUserProfileDto } from "../users/dto/update-user-profile.dto";
import { IncomeFrequency } from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    console.log("📝 Registration attempt for:", registerDto.email);

    // Check if user already exists
    const existingUser = await this.usersRepository.findByEmail(
      registerDto.email
    );
    if (existingUser) {
      console.log("❌ User already exists:", registerDto.email);
      throw new ConflictException("User with this email already exists");
    }

    // Check if username is taken (if provided)
    if (registerDto.username) {
      const userWithUsername = await this.usersRepository.findByUsername(
        registerDto.username
      );
      if (userWithUsername) {
        console.log("❌ Username already taken:", registerDto.username);
        throw new ConflictException("Username already taken");
      }
    }

    // Hash password
    console.log("🔐 Hashing password...");
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

    // Create user
    console.log("👤 Creating user...");
    const user = await this.usersRepository.create({
      ...registerDto,
      passwordHash,
    });

    // Generate JWT token
    console.log("🎫 Generating JWT token...");
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };
    const access_token = this.jwtService.sign(payload);

    console.log("✅ Registration successful for:", user.email);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        currency: user.currency,
        timezone: user.timezone,
        createdAt: user.createdAt,
        income: user.income ? Number(user.income) : null,
        incomeFrequency: user.incomeFrequency || null,
        nextPayDate: user.nextPayDate || null,
        fixedExpenses: user.fixedExpenses ? Number(user.fixedExpenses) : null,
        setupComplete: user.setupComplete ?? false,
        hasSeenBalanceCardTour: user.hasSeenBalanceCardTour ?? false,
        hasSeenAddTransactionTour: user.hasSeenAddTransactionTour ?? false,
        hasSeenTransactionSwipeTour: user.hasSeenTransactionSwipeTour ?? false,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    console.log("🔐 Login attempt for:", loginDto.email);
    console.log("🔐 Login data received:", {
      email: loginDto.email,
      passwordLength: loginDto.password?.length || 0,
    });

    // Find user
    console.log("👤 Looking up user...");
    const user = await this.usersRepository.findByEmail(loginDto.email);
    console.log("👤 User found:", user ? "Yes" : "No");

    if (user) {
      console.log("👤 User details:", {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        hasPasswordHash: !!user.passwordHash,
        passwordHashLength: user.passwordHash?.length || 0,
      });
    }

    if (!user || !user.isActive) {
      console.log("❌ User not found or inactive");
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    console.log("🔑 Verifying password...");
    console.log("🔑 Comparing:", {
      providedPasswordLength: loginDto.password?.length || 0,
      storedPasswordHashLength: user.passwordHash?.length || 0,
    });

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash || ""
    );
    console.log("🔑 Password validation result:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("❌ Invalid password for user:", user.email);
      throw new UnauthorizedException("Invalid credentials");
    }

    console.log("✅ Password verified successfully");

    // Update last login
    console.log("📅 Updating last login...");
    await this.usersRepository.updateLastLogin(user.id);

    // Generate JWT token
    console.log("🎫 Generating JWT token...");
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };
    const access_token = this.jwtService.sign(payload);

    console.log("✅ Login successful for:", user.email);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        currency: user.currency,
        timezone: user.timezone,
        createdAt: user.createdAt,
        income: user.income ? Number(user.income) : null,
        incomeFrequency: (user.incomeFrequency as IncomeFrequency) || null,
        nextPayDate: user.nextPayDate || null,
        fixedExpenses: user.fixedExpenses ? Number(user.fixedExpenses) : null,
        setupComplete: user.setupComplete ?? false,
        hasSeenBalanceCardTour: user.hasSeenBalanceCardTour ?? false,
        hasSeenAddTransactionTour: user.hasSeenAddTransactionTour ?? false,
        hasSeenTransactionSwipeTour: user.hasSeenTransactionSwipeTour ?? false,
      },
    };
  }

  async validateUser(id: string): Promise<any> {
    const user = await this.usersRepository.findById(id);
    if (!user || !user.isActive) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async getUserProfile(id: string): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string | null;
    currency: string;
    timezone: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    income?: number;
    incomeFrequency?: IncomeFrequency;
    nextPayDate?: Date;
    fixedExpenses?: number;
    setupComplete: boolean;
    hasSeenWelcome: boolean;
    hasSeenBalanceCardTour: boolean;
    hasSeenAddTransactionTour: boolean;
    hasSeenTransactionSwipeTour: boolean;
  }> {
    console.log("👤 Getting user profile for:", id);
    const user = await this.usersRepository.findById(id);

    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      currency: user.currency,
      timezone: user.timezone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      income: user.income ? Number(user.income) : undefined,
      incomeFrequency: user.incomeFrequency || undefined,
      nextPayDate: user.nextPayDate || undefined,
      fixedExpenses: user.fixedExpenses
        ? Number(user.fixedExpenses)
        : undefined,
      setupComplete: user.setupComplete ?? false,
      hasSeenWelcome: user.hasSeenWelcome ?? false,
      hasSeenBalanceCardTour: user.hasSeenBalanceCardTour ?? false,
      hasSeenAddTransactionTour: user.hasSeenAddTransactionTour ?? false,
      hasSeenTransactionSwipeTour: user.hasSeenTransactionSwipeTour ?? false,
    };
  }

  async updateUserProfile(
    id: string,
    profileData: UpdateUserProfileDto
  ): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string | null;
    currency: string;
    timezone: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    income?: number;
    incomeFrequency?: IncomeFrequency;
    nextPayDate?: Date;
    fixedExpenses?: number;
    setupComplete: boolean;
    hasSeenWelcome: boolean;
    hasSeenBalanceCardTour: boolean;
    hasSeenAddTransactionTour: boolean;
    hasSeenTransactionSwipeTour: boolean;
  }> {
    // ✅ ADD DEBUGGING LOGS
    console.log("🔥 AuthService.updateUserProfile called");
    console.log("🔥 User ID:", id);
    console.log(
      "🔥 Profile data received:",
      JSON.stringify(profileData, null, 2)
    );
    console.log("🔥 Income frequency in request:", profileData.incomeFrequency);
    console.log("🔥 Income amount in request:", profileData.income);
    console.log("🔥 Next pay date in request:", profileData.nextPayDate);

    const user = await this.usersRepository.findById(id);

    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found");
    }

    const updatedUser = await this.usersRepository.updateProfile(
      id,
      profileData
    );

    // ✅ ADD MORE DEBUGGING LOGS
    console.log("🔥 Updated user from database:", {
      income: updatedUser.income,
      incomeFrequency: updatedUser.incomeFrequency,
      nextPayDate: updatedUser.nextPayDate,
      setupComplete: updatedUser.setupComplete,
    });

    const result = {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      username: updatedUser.username,
      currency: updatedUser.currency,
      timezone: updatedUser.timezone,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      income: updatedUser.income ? Number(updatedUser.income) : undefined,
      incomeFrequency: updatedUser.incomeFrequency || undefined,
      nextPayDate: updatedUser.nextPayDate || undefined,
      fixedExpenses: updatedUser.fixedExpenses
        ? Number(updatedUser.fixedExpenses)
        : undefined,
      setupComplete: updatedUser.setupComplete ?? false,
      hasSeenWelcome: updatedUser.hasSeenWelcome ?? false,
      hasSeenBalanceCardTour: updatedUser.hasSeenBalanceCardTour ?? false,
      hasSeenAddTransactionTour: updatedUser.hasSeenAddTransactionTour ?? false,
      hasSeenTransactionSwipeTour:
        updatedUser.hasSeenTransactionSwipeTour ?? false,
    };

    // ✅ ADD FINAL DEBUGGING LOG
    console.log("🔥 Final result being returned:", {
      income: result.income,
      incomeFrequency: result.incomeFrequency,
      nextPayDate: result.nextPayDate,
      setupComplete: result.setupComplete,
    });

    return result;
  }
}
