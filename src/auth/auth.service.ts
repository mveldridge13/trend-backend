import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { UsersRepository } from "../users/repositories/users.repository";
import { AuditService } from "../audit/audit.service";
import { HibpService } from "../common/services/hibp.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { UpdateUserProfileDto } from "../users/dto/update-user-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import {
  SessionDto,
  SessionListResponseDto,
  RevokeSessionResponseDto,
  RevokeOtherSessionsResponseDto,
} from "./dto/session.dto";
import { parseUserAgent } from "../common/utils/user-agent-parser";
import { IncomeFrequency } from "@prisma/client";

// Security constants
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_DURATION_MINUTES = 15;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const PASSWORD_HISTORY_COUNT = 5; // Prevent reuse of last N passwords

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly hibpService: HibpService,
  ) {}

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString("hex");
  }

  private isAccountLocked(lockedUntil: Date | null): boolean {
    if (!lockedUntil) return false;
    return new Date() < lockedUntil;
  }

  async register(
    registerDto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Check if username is taken (if provided)
    if (registerDto.username) {
      const userWithUsername = await this.usersRepository.findByUsername(
        registerDto.username,
      );
      if (userWithUsername) {
        throw new ConflictException("Username already taken");
      }
    }

    // Check password against breach database (HaveIBeenPwned)
    const isCompromised = await this.hibpService.isPasswordCompromised(registerDto.password);
    if (isCompromised) {
      throw new BadRequestException(
        "This password has been exposed in a data breach. Please choose a different password."
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

    // Create user
    const user = await this.usersRepository.create({
      ...registerDto,
      passwordHash,
    });

    // Add initial password to history
    await this.usersRepository.addPasswordToHistory(user.id, passwordHash);

    // Generate tokens
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };
    const access_token = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshToken = this.generateRefreshToken();
    const refreshTokenExpiry = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    await this.usersRepository.createRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt: refreshTokenExpiry,
      ipAddress,
      userAgent,
      deviceName: parseUserAgent(userAgent),
    });

    // Audit log: successful registration
    await this.auditService.logRegister(user.id, user.email, ipAddress, userAgent);

    return {
      access_token,
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes in seconds
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

  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    // Find user
    const user = await this.usersRepository.findByEmail(loginDto.email);

    if (!user || !user.isActive) {
      // Audit log: failed login - user not found
      await this.auditService.logLoginFailed(loginDto.email, ipAddress, userAgent, "User not found or inactive");
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if account is locked
    if (this.isAccountLocked(user.lockedUntil)) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil!.getTime() - Date.now()) / 60000
      );
      // Audit log: failed login - account locked
      await this.auditService.logLoginFailed(loginDto.email, ipAddress, userAgent, "Account locked");
      throw new ForbiddenException(
        `Account is locked. Please try again in ${remainingMinutes} minute(s).`
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash || "",
    );

    if (!isPasswordValid) {
      // Record failed attempt
      const updatedUser = await this.usersRepository.recordFailedLogin(user.id);

      // Lock account if max attempts exceeded
      if (updatedUser.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        await this.usersRepository.lockAccount(user.id, ACCOUNT_LOCK_DURATION_MINUTES);
        // Audit log: account locked due to failed attempts
        await this.auditService.logAccountLocked(user.id, loginDto.email, ipAddress, userAgent);
        throw new ForbiddenException(
          `Account locked due to too many failed login attempts. Please try again in ${ACCOUNT_LOCK_DURATION_MINUTES} minutes.`
        );
      }

      // Audit log: failed login - invalid password
      await this.auditService.logLoginFailed(loginDto.email, ipAddress, userAgent, "Invalid password");

      const remainingAttempts = MAX_FAILED_LOGIN_ATTEMPTS - updatedUser.failedLoginAttempts;
      throw new UnauthorizedException(
        `Invalid credentials. ${remainingAttempts} attempt(s) remaining before account lockout.`
      );
    }

    // Reset failed login attempts on successful login
    await this.usersRepository.resetFailedLoginAttempts(user.id);

    // Update last login
    await this.usersRepository.updateLastLogin(user.id);

    // Generate access token
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };
    const access_token = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshToken = this.generateRefreshToken();
    const refreshTokenExpiry = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    await this.usersRepository.createRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt: refreshTokenExpiry,
      ipAddress,
      userAgent,
      deviceName: parseUserAgent(userAgent),
    });

    // Audit log: successful login
    await this.auditService.logLoginSuccess(user.id, ipAddress, userAgent);

    return {
      access_token,
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes in seconds
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

  async refreshToken(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
    // Find the refresh token
    const storedToken = await this.usersRepository.findRefreshToken(refreshToken);

    if (!storedToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Check if token is revoked
    if (storedToken.revokedAt) {
      throw new UnauthorizedException("Refresh token has been revoked");
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException("Refresh token has expired");
    }

    // Get user
    const user = await this.usersRepository.findById(storedToken.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found or inactive");
    }

    // Revoke old refresh token (rotation)
    await this.usersRepository.revokeRefreshToken(refreshToken);

    // Generate new access token
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };
    const access_token = this.jwtService.sign(payload);

    // Generate new refresh token
    const newRefreshToken = this.generateRefreshToken();
    const refreshTokenExpiry = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    await this.usersRepository.createRefreshToken({
      userId: user.id,
      token: newRefreshToken,
      expiresAt: refreshTokenExpiry,
      ipAddress,
      userAgent,
      deviceName: parseUserAgent(userAgent),
    });

    // Audit log: token refresh
    await this.auditService.logTokenRefresh(user.id, ipAddress, userAgent);

    return {
      access_token,
      refresh_token: newRefreshToken,
      expires_in: 900,
    };
  }

  async logout(
    userId: string,
    refreshToken?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; message: string }> {
    const allDevices = !refreshToken;

    if (refreshToken) {
      // Revoke specific refresh token
      await this.usersRepository.revokeRefreshToken(refreshToken);
    } else {
      // Revoke all refresh tokens for user (logout everywhere)
      await this.usersRepository.revokeAllUserRefreshTokens(userId);
    }

    // Audit log: logout
    await this.auditService.logLogout(userId, ipAddress, userAgent, allDevices);

    return {
      success: true,
      message: refreshToken
        ? "Logged out successfully"
        : "Logged out from all devices",
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
    profileData: UpdateUserProfileDto,
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
    const user = await this.usersRepository.findById(id);

    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found");
    }

    const updatedUser = await this.usersRepository.updateProfile(
      id,
      profileData,
    );

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

    return result;
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; message: string }> {
    // 1. Get user
    const user = await this.usersRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found");
    }

    // 2. Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash || "",
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    // 3. Check new password is different
    const isSamePassword = await bcrypt.compare(
      changePasswordDto.newPassword,
      user.passwordHash || "",
    );

    if (isSamePassword) {
      throw new BadRequestException(
        "New password must be different from current password",
      );
    }

    // 4. Check against password history
    const passwordHistory = await this.usersRepository.getPasswordHistory(
      userId,
      PASSWORD_HISTORY_COUNT,
    );
    for (const oldHash of passwordHistory) {
      const matchesOld = await bcrypt.compare(changePasswordDto.newPassword, oldHash);
      if (matchesOld) {
        throw new BadRequestException(
          `Cannot reuse any of your last ${PASSWORD_HISTORY_COUNT} passwords. Please choose a different password.`,
        );
      }
    }

    // 5. Check new password against breach database (HaveIBeenPwned)
    const isCompromised = await this.hibpService.isPasswordCompromised(changePasswordDto.newPassword);
    if (isCompromised) {
      throw new BadRequestException(
        "This password has been exposed in a data breach. Please choose a different password."
      );
    }

    // 5. Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(
      changePasswordDto.newPassword,
      saltRounds,
    );

    // 7. Update password in database
    await this.usersRepository.updatePassword(userId, newPasswordHash);

    // 8. Add new password to history
    await this.usersRepository.addPasswordToHistory(userId, newPasswordHash);
    await this.usersRepository.cleanupOldPasswordHistory(userId, PASSWORD_HISTORY_COUNT);

    // 9. Revoke all refresh tokens (force re-login on all devices)
    await this.usersRepository.revokeAllUserRefreshTokens(userId);

    // Audit log: password change
    await this.auditService.logPasswordChange(userId, ipAddress, userAgent);

    return {
      success: true,
      message: "Password changed successfully. Please log in again on all devices.",
    };
  }

  // Session management methods
  async getActiveSessions(
    userId: string,
    currentToken?: string,
  ): Promise<SessionListResponseDto> {
    const sessions = await this.usersRepository.getActiveSessions(userId);

    const sessionDtos: SessionDto[] = sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      deviceName: session.deviceName || parseUserAgent(session.userAgent),
      isCurrent: currentToken === session.token,
    }));

    return {
      sessions: sessionDtos,
      totalCount: sessionDtos.length,
    };
  }

  async revokeSession(
    userId: string,
    sessionId: string,
    currentToken?: string,
  ): Promise<RevokeSessionResponseDto> {
    // Find the session to check if it's the current one
    const sessions = await this.usersRepository.getActiveSessions(userId);
    const targetSession = sessions.find((s) => s.id === sessionId);

    if (!targetSession) {
      return {
        success: false,
        message: "Session not found or already revoked",
      };
    }

    if (currentToken && targetSession.token === currentToken) {
      return {
        success: false,
        message: "Cannot revoke current session. Use logout instead.",
      };
    }

    const revoked = await this.usersRepository.revokeSessionById(userId, sessionId);

    return {
      success: revoked,
      message: revoked ? "Session revoked successfully" : "Failed to revoke session",
    };
  }

  async revokeOtherSessions(
    userId: string,
    currentToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<RevokeOtherSessionsResponseDto> {
    const revokedCount = await this.usersRepository.revokeOtherSessions(
      userId,
      currentToken,
    );

    // Audit log
    await this.auditService.logLogout(userId, ipAddress, userAgent, true);

    return {
      success: true,
      revokedCount,
      message:
        revokedCount > 0
          ? `Successfully revoked ${revokedCount} other session(s)`
          : "No other sessions to revoke",
    };
  }
}
