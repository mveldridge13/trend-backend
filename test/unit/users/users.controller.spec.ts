import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUserDto: any = {
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
    income: 5000,
    incomeFrequency: 'MONTHLY',
    nextPayDate: new Date('2025-02-01'),
    fixedExpenses: 2000,
    setupComplete: true,
    hasSeenWelcome: true,
    hasSeenBalanceCardTour: false,
    hasSeenAddTransactionTour: false,
    hasSeenTransactionSwipeTour: false,
    rolloverAmount: 500,
    lastRolloverDate: new Date('2025-01-15'),
  };

  const mockRolloverEntry: any = {
    id: 'rollover-123',
    amount: 100,
    date: new Date('2025-01-15'),
    type: 'ROLLOVER',
    periodStart: new Date('2025-01-01'),
    periodEnd: new Date('2025-01-31'),
    description: 'Monthly surplus',
  };

  const mockRolloverNotification: any = {
    id: 'notif-123',
    amount: 150,
    fromPeriod: 'January 2025',
    createdAt: new Date('2025-02-01'),
  };

  beforeEach(async () => {
    const mockUsersService = {
      findById: jest.fn(),
      updateProfile: jest.fn(),
      deactivate: jest.fn(),
      getRolloverHistory: jest.fn(),
      createRolloverEntry: jest.fn(),
      getRolloverNotification: jest.fn(),
      createRolloverNotification: jest.fn(),
      dismissRolloverNotification: jest.fn(),
      exportUserData: jest.fn(),
      permanentlyDeleteAccount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      usersService.findById.mockResolvedValue(mockUserDto);

      const result = await controller.getProfile(mockRequest);

      expect(usersService.findById).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockUserDto);
    });

    it('should throw NotFoundException when user not found', async () => {
      const mockRequest = { user: { id: 'nonexistent' } };
      usersService.findById.mockResolvedValue(null);

      await expect(controller.getProfile(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update and return user profile', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const updateDto = { firstName: 'Updated' };
      const updatedUser = { ...mockUserDto, ...updateDto };
      usersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(mockRequest, updateDto);

      expect(usersService.updateProfile).toHaveBeenCalledWith('user-123', updateDto);
      expect(result.firstName).toBe('Updated');
    });
  });

  describe('getIncome', () => {
    it('should return income data', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      usersService.findById.mockResolvedValue(mockUserDto);

      const result = await controller.getIncome(mockRequest);

      expect(result).toHaveProperty('income', mockUserDto.income);
      expect(result).toHaveProperty('incomeFrequency', mockUserDto.incomeFrequency);
      expect(result).toHaveProperty('setupComplete', mockUserDto.setupComplete);
    });

    it('should throw NotFoundException when user not found', async () => {
      const mockRequest = { user: { id: 'nonexistent' } };
      usersService.findById.mockResolvedValue(null);

      await expect(controller.getIncome(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateIncome', () => {
    it('should update income and return result', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const incomeData = { income: 6000 };
      const updatedUser = { ...mockUserDto, income: 6000 };
      usersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateIncome(mockRequest, incomeData);

      expect(result).toHaveProperty('success', true);
      expect(result.income).toHaveProperty('income', 6000);
    });
  });

  describe('getRolloverStatus', () => {
    it('should return rollover status', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      usersService.findById.mockResolvedValue(mockUserDto);

      const result = await controller.getRolloverStatus(mockRequest);

      expect(result).toHaveProperty('rolloverAmount', mockUserDto.rolloverAmount);
      expect(result).toHaveProperty('lastRolloverDate', mockUserDto.lastRolloverDate);
    });
  });

  describe('getRolloverHistory', () => {
    it('should return rollover history', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      usersService.getRolloverHistory.mockResolvedValue([mockRolloverEntry]);

      const result = await controller.getRolloverHistory(mockRequest);

      expect(usersService.getRolloverHistory).toHaveBeenCalledWith('user-123');
      expect(result).toHaveLength(1);
    });
  });

  describe('createRolloverEntry', () => {
    it('should create and return rollover entry', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const createDto: any = {
        amount: 100,
        type: 'ROLLOVER',
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
      };
      usersService.createRolloverEntry.mockResolvedValue(mockRolloverEntry);

      const result = await controller.createRolloverEntry(mockRequest, createDto);

      expect(usersService.createRolloverEntry).toHaveBeenCalledWith(
        'user-123',
        createDto,
      );
      expect(result).toEqual(mockRolloverEntry);
    });
  });

  describe('getRolloverNotification', () => {
    it('should return rollover notification', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      usersService.getRolloverNotification.mockResolvedValue(mockRolloverNotification);

      const result = await controller.getRolloverNotification(mockRequest);

      expect(result).toEqual(mockRolloverNotification);
    });

    it('should return null when no notification exists', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      usersService.getRolloverNotification.mockResolvedValue(null);

      const result = await controller.getRolloverNotification(mockRequest);

      expect(result).toBeNull();
    });
  });

  describe('dismissRolloverNotification', () => {
    it('should dismiss rollover notification', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      usersService.dismissRolloverNotification.mockResolvedValue(undefined);

      await controller.dismissRolloverNotification(mockRequest);

      expect(usersService.dismissRolloverNotification).toHaveBeenCalledWith(
        'user-123',
      );
    });
  });

  describe('exportUserData', () => {
    it('should export user data', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const exportData = { version: '1.0', user: mockUserDto };
      usersService.exportUserData.mockResolvedValue(exportData);

      const result = await controller.exportUserData(mockRequest);

      expect(usersService.exportUserData).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(exportData);
    });
  });

  describe('deleteAccount', () => {
    it('should permanently delete user account', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      usersService.permanentlyDeleteAccount.mockResolvedValue(undefined);

      await controller.deleteAccount(mockRequest);

      expect(usersService.permanentlyDeleteAccount).toHaveBeenCalledWith(
        'user-123',
      );
    });
  });

  describe('deactivateAccount', () => {
    it('should deactivate user account', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      usersService.deactivate.mockResolvedValue(undefined);

      await controller.deactivateAccount(mockRequest);

      expect(usersService.deactivate).toHaveBeenCalledWith('user-123');
    });
  });
});
