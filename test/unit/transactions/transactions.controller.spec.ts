import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from 'src/transactions/transactions.controller';
import { TransactionsService } from 'src/transactions/transactions.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let transactionsService: jest.Mocked<TransactionsService>;

  const mockTransaction: any = {
    id: 'txn-123',
    userId: 'user-123',
    amount: 50.0,
    description: 'Test transaction',
    date: new Date('2025-01-15'),
    type: 'EXPENSE',
    categoryId: 'cat-123',
    isRecurring: false,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
  };

  const mockAnalytics: any = {
    totalIncome: 5000,
    totalExpenses: 2000,
    netIncome: 3000,
    transactionCount: 25,
    categoryBreakdown: [],
    recentTransactions: [mockTransaction],
  };

  beforeEach(async () => {
    const mockTransactionsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getAnalytics: jest.fn(),
      getDiscretionaryBreakdown: jest.fn(),
      getDayTimePatterns: jest.fn(),
      getBillsAnalytics: jest.fn(),
      getIncomeAnalytics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [{ provide: TransactionsService, useValue: mockTransactionsService }],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    transactionsService = module.get(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new transaction', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const createDto = {
        amount: 50,
        description: 'Test',
        date: '2025-01-15',
        type: 'EXPENSE',
        categoryId: 'cat-123',
      };
      transactionsService.create.mockResolvedValue(mockTransaction);

      const result = await controller.create(mockRequest, createDto as any);

      expect(transactionsService.create).toHaveBeenCalledWith('user-123', createDto);
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('findAll', () => {
    it('should return paginated transactions', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const filters = { limit: 10, offset: 0 };
      const response: any = { transactions: [mockTransaction], total: 1, page: 1, limit: 10, totalPages: 1 };
      transactionsService.findAll.mockResolvedValue(response);

      const result = await controller.findAll(mockRequest, filters as any);

      expect(transactionsService.findAll).toHaveBeenCalledWith('user-123', filters);
      expect(result).toEqual(response);
    });
  });

  describe('findOne', () => {
    it('should return a single transaction', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      transactionsService.findOne.mockResolvedValue(mockTransaction);

      const result = await controller.findOne(mockRequest, 'txn-123');

      expect(transactionsService.findOne).toHaveBeenCalledWith('txn-123', 'user-123');
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('update', () => {
    it('should update a transaction', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const updateDto = { amount: 75 };
      const updatedTransaction = { ...mockTransaction, amount: 75 };
      transactionsService.update.mockResolvedValue(updatedTransaction);

      const result = await controller.update(mockRequest, 'txn-123', updateDto as any);

      expect(transactionsService.update).toHaveBeenCalledWith(
        'txn-123',
        'user-123',
        updateDto,
      );
      expect(result.amount).toBe(75);
    });
  });

  describe('remove', () => {
    it('should remove a transaction', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      transactionsService.remove.mockResolvedValue(undefined);

      await controller.remove(mockRequest, 'txn-123');

      expect(transactionsService.remove).toHaveBeenCalledWith('txn-123', 'user-123');
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics data', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const filters = { startDate: '2025-01-01', endDate: '2025-01-31' };
      transactionsService.getAnalytics.mockResolvedValue(mockAnalytics);

      const result = await controller.getAnalytics(mockRequest, filters as any);

      expect(transactionsService.getAnalytics).toHaveBeenCalledWith('user-123', filters);
      expect(result).toEqual(mockAnalytics);
    });
  });

  describe('getSummary', () => {
    it('should return transaction summary', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      transactionsService.getAnalytics.mockResolvedValue(mockAnalytics);

      const result = await controller.getSummary(mockRequest, {} as any);

      expect(result).toHaveProperty('totalIncome');
      expect(result).toHaveProperty('totalExpenses');
      expect(result).toHaveProperty('netIncome');
    });
  });

  describe('getRecent', () => {
    it('should return recent transactions', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      transactionsService.findAll.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      } as any);

      const result = await controller.getRecent(mockRequest);

      expect(transactionsService.findAll).toHaveBeenCalledWith('user-123', expect.objectContaining({
        limit: 10,
        sortOrder: 'desc',
      }));
      expect(result).toEqual([mockTransaction]);
    });
  });

  describe('search', () => {
    it('should search transactions', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const searchDto = { query: 'groceries', filters: { limit: 20 } };
      transactionsService.findAll.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      } as any);

      const result = await controller.search(mockRequest, searchDto);

      expect(transactionsService.findAll).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({ search: 'groceries' }),
      );
    });
  });

  describe('getDiscretionaryBreakdown', () => {
    it('should return discretionary breakdown', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const breakdown: any = { categories: [], total: 0 };
      transactionsService.getDiscretionaryBreakdown.mockResolvedValue(breakdown);

      const result = await controller.getDiscretionaryBreakdown(mockRequest, {} as any);

      expect(transactionsService.getDiscretionaryBreakdown).toHaveBeenCalledWith(
        'user-123',
        {},
      );
      expect(result).toEqual(breakdown);
    });
  });

  describe('getDayTimePatterns', () => {
    it('should return day/time patterns', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const patterns: any = { dayOfWeek: [], hourOfDay: [] };
      transactionsService.getDayTimePatterns.mockResolvedValue(patterns);

      const result = await controller.getDayTimePatterns(mockRequest, {} as any);

      expect(transactionsService.getDayTimePatterns).toHaveBeenCalledWith(
        'user-123',
        {},
      );
      expect(result).toEqual(patterns);
    });
  });

  describe('getBillsAnalytics', () => {
    it('should return bills analytics', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const billsData = { upcoming: [], paid: [] };
      transactionsService.getBillsAnalytics.mockResolvedValue(billsData);

      const result = await controller.getBillsAnalytics(mockRequest, {} as any);

      expect(transactionsService.getBillsAnalytics).toHaveBeenCalledWith(
        'user-123',
        {},
      );
      expect(result).toEqual(billsData);
    });
  });

  describe('getIncomeAnalytics', () => {
    it('should return income analytics', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const incomeData = { totalIncome: 5000, sources: [] };
      transactionsService.getIncomeAnalytics.mockResolvedValue(incomeData);

      const result = await controller.getIncomeAnalytics(mockRequest, {} as any);

      expect(transactionsService.getIncomeAnalytics).toHaveBeenCalledWith(
        'user-123',
        {},
      );
      expect(result).toEqual(incomeData);
    });
  });
});
