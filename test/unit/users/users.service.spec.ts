import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { UsersRepository } from 'src/users/repositories/users.repository';
import { PrismaService } from 'src/database/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let prismaService: any;

  const mockUser: any = {
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
    income: { toNumber: () => 5000 },
    incomeFrequency: 'MONTHLY',
    nextPayDate: new Date('2025-02-01'),
    fixedExpenses: { toNumber: () => 2000 },
    setupComplete: true,
    hasSeenWelcome: true,
    hasSeenBalanceCardTour: false,
    hasSeenAddTransactionTour: false,
    hasSeenTransactionSwipeTour: false,
    rolloverAmount: { toNumber: () => 500 },
    lastRolloverDate: new Date('2025-01-15'),
  };

  const mockRolloverEntry: any = {
    id: 'rollover-123',
    userId: 'user-123',
    amount: 100,
    date: new Date('2025-01-15'),
    type: 'ROLLOVER',
    periodStart: new Date('2025-01-01'),
    periodEnd: new Date('2025-01-31'),
    description: 'Monthly surplus',
  };

  const mockRolloverNotification: any = {
    id: 'notif-123',
    userId: 'user-123',
    amount: 150,
    fromPeriod: 'January 2025',
    createdAt: new Date('2025-02-01'),
    dismissedAt: null,
  };

  beforeEach(async () => {
    const mockUsersRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      update: jest.fn(),
      updateProfile: jest.fn(),
      getRolloverHistory: jest.fn(),
      createRolloverEntry: jest.fn(),
      getRolloverNotification: jest.fn(),
      createRolloverNotification: jest.fn(),
      dismissRolloverNotification: jest.fn(),
    };

    const mockPrismaService = {
      transaction: { findMany: jest.fn(), deleteMany: jest.fn() },
      goal: { findMany: jest.fn(), deleteMany: jest.fn() },
      budget: { findMany: jest.fn(), deleteMany: jest.fn() },
      category: { findMany: jest.fn(), deleteMany: jest.fn() },
      pokerTournament: { findMany: jest.fn(), deleteMany: jest.fn() },
      rolloverEntry: { findMany: jest.fn(), deleteMany: jest.fn() },
      rolloverNotification: { deleteMany: jest.fn() },
      goalContribution: { deleteMany: jest.fn() },
      user: { delete: jest.fn() },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(UsersRepository);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user dto when user exists', async () => {
      usersRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findById('user-123');

      expect(usersRepository.findById).toHaveBeenCalledWith('user-123');
      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.id);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should return null when user does not exist', async () => {
      usersRepository.findById.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user dto when user exists', async () => {
      usersRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(usersRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toBeDefined();
      expect(result.email).toBe(mockUser.email);
    });

    it('should return null when user does not exist', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    const updateData = { firstName: 'Updated', lastName: 'Name' };

    it('should update user profile successfully', async () => {
      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue({ ...mockUser, ...updateData });

      const result = await service.updateProfile('user-123', updateData);

      expect(usersRepository.update).toHaveBeenCalledWith('user-123', updateData);
      expect(result.firstName).toBe(updateData.firstName);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateProfile('nonexistent', updateData),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when username is already taken', async () => {
      const anotherUser = { ...mockUser, id: 'other-user' };
      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.findByUsername.mockResolvedValue(anotherUser);

      await expect(
        service.updateProfile('user-123', { username: 'takenuser' }),
      ).rejects.toThrow('Username already taken');
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      usersRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getUserProfile('user-123');

      expect(result.id).toBe(mockUser.id);
      expect(result.incomeFrequency).toBe('monthly');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(service.getUserProfile('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate user successfully', async () => {
      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue({ ...mockUser, isActive: false });

      await service.deactivate('user-123');

      expect(usersRepository.update).toHaveBeenCalledWith('user-123', {
        isActive: false,
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(service.deactivate('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getRolloverHistory', () => {
    it('should return rollover history', async () => {
      usersRepository.getRolloverHistory.mockResolvedValue([mockRolloverEntry]);

      const result = await service.getRolloverHistory('user-123');

      expect(usersRepository.getRolloverHistory).toHaveBeenCalledWith('user-123');
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(100);
    });

    it('should return empty array when no history exists', async () => {
      usersRepository.getRolloverHistory.mockResolvedValue([]);

      const result = await service.getRolloverHistory('user-123');

      expect(result).toHaveLength(0);
    });
  });

  describe('createRolloverEntry', () => {
    const createDto: any = {
      amount: 100,
      type: 'ROLLOVER',
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      description: 'Test rollover',
    };

    it('should create rollover entry successfully', async () => {
      usersRepository.createRolloverEntry.mockResolvedValue(mockRolloverEntry);

      const result = await service.createRolloverEntry('user-123', createDto);

      expect(usersRepository.createRolloverEntry).toHaveBeenCalled();
      expect(result.amount).toBe(100);
    });

    it('should throw error for invalid date format', async () => {
      const invalidDto = { ...createDto, periodStart: 'invalid-date' };

      await expect(
        service.createRolloverEntry('user-123', invalidDto),
      ).rejects.toThrow('Invalid date format');
    });
  });

  describe('getRolloverNotification', () => {
    it('should return notification when exists', async () => {
      usersRepository.getRolloverNotification.mockResolvedValue(
        mockRolloverNotification,
      );

      const result = await service.getRolloverNotification('user-123');

      expect(result).toBeDefined();
      expect(result.amount).toBe(150);
    });

    it('should return null when no notification exists', async () => {
      usersRepository.getRolloverNotification.mockResolvedValue(null);

      const result = await service.getRolloverNotification('user-123');

      expect(result).toBeNull();
    });
  });

  describe('dismissRolloverNotification', () => {
    it('should dismiss notification successfully', async () => {
      usersRepository.dismissRolloverNotification.mockResolvedValue(undefined);

      await service.dismissRolloverNotification('user-123');

      expect(usersRepository.dismissRolloverNotification).toHaveBeenCalledWith(
        'user-123',
      );
    });
  });

  describe('exportUserData', () => {
    it('should export all user data', async () => {
      usersRepository.findById.mockResolvedValue(mockUser);
      prismaService.transaction.findMany.mockResolvedValue([]);
      prismaService.goal.findMany.mockResolvedValue([]);
      prismaService.budget.findMany.mockResolvedValue([]);
      prismaService.category.findMany.mockResolvedValue([]);
      prismaService.pokerTournament.findMany.mockResolvedValue([]);
      prismaService.rolloverEntry.findMany.mockResolvedValue([]);

      const result = await service.exportUserData('user-123');

      expect(result).toHaveProperty('version', '1.0');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('goals');
      expect(result).toHaveProperty('budgets');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(service.exportUserData('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('permanentlyDeleteAccount', () => {
    it('should delete all user data', async () => {
      usersRepository.findById.mockResolvedValue(mockUser);
      prismaService.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          transaction: { deleteMany: jest.fn() },
          goalContribution: { deleteMany: jest.fn() },
          goal: { deleteMany: jest.fn() },
          budget: { deleteMany: jest.fn() },
          pokerTournament: { deleteMany: jest.fn() },
          category: { deleteMany: jest.fn() },
          rolloverEntry: { deleteMany: jest.fn() },
          rolloverNotification: { deleteMany: jest.fn() },
          user: { delete: jest.fn() },
        };
        await callback(tx);
      });

      await service.permanentlyDeleteAccount('user-123');

      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(
        service.permanentlyDeleteAccount('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
