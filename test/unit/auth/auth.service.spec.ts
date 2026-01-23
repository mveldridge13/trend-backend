import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from 'src/auth/auth.service';
import { UsersRepository } from 'src/users/repositories/users.repository';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    username: 'testuser',
    passwordHash: 'hashed-password',
    currency: 'USD',
    timezone: 'UTC',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    income: null,
    incomeFrequency: null,
    nextPayDate: null,
    fixedExpenses: null,
    setupComplete: false,
    hasSeenWelcome: false,
    hasSeenBalanceCardTour: false,
    hasSeenAddTransactionTour: false,
    hasSeenTransactionSwipeTour: false,
    rolloverAmount: null,
    lastRolloverDate: null,
  };

  beforeEach(async () => {
    const mockUsersRepository = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateLastLogin: jest.fn(),
      updateProfile: jest.fn(),
      updatePassword: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get(UsersRepository);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      password: 'password123',
      username: 'newuser',
    };

    it('should successfully register a new user', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.findByUsername.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      usersRepository.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        username: registerDto.username,
      });

      const result = await service.register(registerDto);

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersRepository.findByUsername).toHaveBeenCalledWith(registerDto.username);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(usersRepository.create).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      usersRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'User with this email already exists',
      );
    });

    it('should throw ConflictException if username is taken', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.findByUsername.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'Username already taken',
      );
    });

    it('should register without username if not provided', async () => {
      const dtoWithoutUsername = {
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
      };

      usersRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      usersRepository.create.mockResolvedValue({
        ...mockUser,
        username: null,
      });

      const result = await service.register(dtoWithoutUsername);

      expect(usersRepository.findByUsername).not.toHaveBeenCalled();
      expect(result).toHaveProperty('access_token');
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      usersRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
      expect(usersRepository.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      });
      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      usersRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      usersRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('validateUser', () => {
    it('should return user without passwordHash if valid', async () => {
      usersRepository.findById.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-123');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe(mockUser.id);
    });

    it('should return null if user not found', async () => {
      usersRepository.findById.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null if user is inactive', async () => {
      usersRepository.findById.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await service.validateUser('user-123');

      expect(result).toBeNull();
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      usersRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getUserProfile('user-123');

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(service.getUserProfile('nonexistent')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      usersRepository.findById.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(service.getUserProfile('user-123')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updateUserProfile', () => {
    const updateDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update user profile successfully', async () => {
      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.updateProfile.mockResolvedValue({
        ...mockUser,
        ...updateDto,
      });

      const result = await service.updateUserProfile('user-123', updateDto);

      expect(usersRepository.updateProfile).toHaveBeenCalledWith(
        'user-123',
        updateDto,
      );
      expect(result.firstName).toBe(updateDto.firstName);
      expect(result.lastName).toBe(updateDto.lastName);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateUserProfile('nonexistent', updateDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto = {
      currentPassword: 'oldpassword',
      newPassword: 'newpassword123',
    };

    it('should change password successfully', async () => {
      usersRepository.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true) // current password valid
        .mockResolvedValueOnce(false); // new password is different
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      const result = await service.changePassword('user-123', changePasswordDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        mockUser.passwordHash,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(
        changePasswordDto.newPassword,
        12,
      );
      expect(usersRepository.updatePassword).toHaveBeenCalledWith(
        'user-123',
        'new-hashed-password',
      );
      expect(result).toEqual({
        success: true,
        message: 'Password changed successfully',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(
        service.changePassword('nonexistent', changePasswordDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if current password is wrong', async () => {
      usersRepository.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('user-123', changePasswordDto),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.changePassword('user-123', changePasswordDto),
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should throw BadRequestException if new password is same as current', async () => {
      usersRepository.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // both checks return true

      await expect(
        service.changePassword('user-123', changePasswordDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
