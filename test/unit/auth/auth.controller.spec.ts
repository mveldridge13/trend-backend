import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthResponse = {
    access_token: 'mock-jwt-token',
    user: {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      currency: 'USD',
      timezone: 'UTC',
      createdAt: new Date('2025-01-01'),
      income: null,
      incomeFrequency: null,
      nextPayDate: null,
      fixedExpenses: null,
      setupComplete: false,
      hasSeenBalanceCardTour: false,
      hasSeenAddTransactionTour: false,
      hasSeenTransactionSwipeTour: false,
    },
  };

  const mockUserProfile = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    username: 'testuser',
    currency: 'USD',
    timezone: 'UTC',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    setupComplete: false,
    hasSeenWelcome: false,
    hasSeenBalanceCardTour: false,
    hasSeenAddTransactionTour: false,
    hasSeenTransactionSwipeTour: false,
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      getUserProfile: jest.fn(),
      updateUserProfile: jest.fn(),
      changePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
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

    it('should register a new user and return auth response', async () => {
      authService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user and return auth response', async () => {
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      authService.getUserProfile.mockResolvedValue(mockUserProfile);

      const result = await controller.getProfile(mockRequest);

      expect(authService.getUserProfile).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockUserProfile);
    });
  });

  describe('updateProfile', () => {
    const updateDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update and return user profile', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const updatedProfile = { ...mockUserProfile, ...updateDto };
      authService.updateUserProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(mockRequest, updateDto);

      expect(authService.updateUserProfile).toHaveBeenCalledWith(
        'user-123',
        updateDto,
      );
      expect(result).toEqual(updatedProfile);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto = {
      currentPassword: 'oldpassword',
      newPassword: 'newpassword123',
    };

    it('should change password successfully', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const expectedResponse = {
        success: true,
        message: 'Password changed successfully',
      };
      authService.changePassword.mockResolvedValue(expectedResponse);

      const result = await controller.changePassword(
        mockRequest,
        changePasswordDto,
      );

      expect(authService.changePassword).toHaveBeenCalledWith(
        'user-123',
        changePasswordDto,
      );
      expect(result).toEqual(expectedResponse);
    });
  });
});
