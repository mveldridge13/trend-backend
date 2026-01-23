import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsController } from 'src/budgets/budgets.controller';
import { BudgetsService } from 'src/budgets/budgets.service';

describe('BudgetsController', () => {
  let controller: BudgetsController;
  let budgetsService: jest.Mocked<BudgetsService>;

  const mockBudget: any = {
    id: 'budget-123',
    userId: 'user-123',
    name: 'Monthly Budget',
    totalAmount: 2000,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    const mockBudgetsService = {
      createBudget: jest.fn(),
      getUserBudgets: jest.fn(),
      getBudgetById: jest.fn(),
      updateBudget: jest.fn(),
      deleteBudget: jest.fn(),
      getBudgetAnalytics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetsController],
      providers: [{ provide: BudgetsService, useValue: mockBudgetsService }],
    }).compile();

    controller = module.get<BudgetsController>(BudgetsController);
    budgetsService = module.get(BudgetsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBudget', () => {
    it('should create a new budget', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const createDto = {
        name: 'Monthly Budget',
        totalAmount: 2000,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };
      budgetsService.createBudget.mockResolvedValue(mockBudget);

      const result = await controller.createBudget(mockRequest, createDto as any);

      expect(budgetsService.createBudget).toHaveBeenCalledWith('user-123', createDto);
      expect(result).toEqual(mockBudget);
    });
  });

  describe('getUserBudgets', () => {
    it('should return paginated budgets for user', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const response: any = { data: [mockBudget], total: 1, page: 1, limit: 10, totalPages: 1, hasNext: false, hasPrev: false };
      budgetsService.getUserBudgets.mockResolvedValue(response);

      const result = await controller.getUserBudgets(mockRequest, 1, 10);

      expect(budgetsService.getUserBudgets).toHaveBeenCalledWith('user-123', 1, 10);
      expect(result).toEqual(response);
    });
  });

  describe('getBudgetById', () => {
    it('should return a single budget', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      budgetsService.getBudgetById.mockResolvedValue(mockBudget);

      const result = await controller.getBudgetById(mockRequest, 'budget-123');

      expect(budgetsService.getBudgetById).toHaveBeenCalledWith('budget-123', 'user-123');
      expect(result).toEqual(mockBudget);
    });
  });

  describe('updateBudget', () => {
    it('should update a budget', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const updateDto = { totalAmount: 2500 };
      const updatedBudget = { ...mockBudget, totalAmount: 2500 };
      budgetsService.updateBudget.mockResolvedValue(updatedBudget);

      const result = await controller.updateBudget(mockRequest, 'budget-123', updateDto as any);

      expect(budgetsService.updateBudget).toHaveBeenCalledWith(
        'budget-123',
        'user-123',
        updateDto,
      );
      expect(result.totalAmount).toBe(2500);
    });
  });

  describe('deleteBudget', () => {
    it('should delete a budget', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      budgetsService.deleteBudget.mockResolvedValue(undefined);

      await controller.deleteBudget(mockRequest, 'budget-123');

      expect(budgetsService.deleteBudget).toHaveBeenCalledWith('budget-123', 'user-123');
    });
  });

  describe('getBudgetAnalytics', () => {
    it('should return budget analytics', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const analytics: any = { spent: 500, remaining: 1500, percentUsed: 25 };
      budgetsService.getBudgetAnalytics.mockResolvedValue(analytics);

      const result = await controller.getBudgetAnalytics(mockRequest, 'budget-123');

      expect(budgetsService.getBudgetAnalytics).toHaveBeenCalledWith('budget-123', 'user-123');
      expect(result).toEqual(analytics);
    });
  });
});
