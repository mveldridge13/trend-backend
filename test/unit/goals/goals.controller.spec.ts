import { Test, TestingModule } from '@nestjs/testing';
import { GoalsController } from 'src/goals/goals.controller';
import { GoalsService } from 'src/goals/goals.service';

describe('GoalsController', () => {
  let controller: GoalsController;
  let goalsService: jest.Mocked<GoalsService>;

  const mockGoal: any = {
    id: 'goal-123',
    userId: 'user-123',
    name: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 2500,
    deadline: new Date('2025-12-31'),
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockContribution: any = {
    id: 'contrib-123',
    goalId: 'goal-123',
    amount: 500,
    date: new Date('2025-01-15'),
  };

  beforeEach(async () => {
    const mockGoalsService = {
      createGoal: jest.fn(),
      getGoals: jest.fn(),
      getGoalById: jest.fn(),
      updateGoal: jest.fn(),
      deleteGoal: jest.fn(),
      addContribution: jest.fn(),
      getGoalContributions: jest.fn(),
      getGoalAnalytics: jest.fn(),
      generateSmartSuggestions: jest.fn(),
      addRolloverContribution: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoalsController],
      providers: [{ provide: GoalsService, useValue: mockGoalsService }],
    }).compile();

    controller = module.get<GoalsController>(GoalsController);
    goalsService = module.get(GoalsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGoal', () => {
    it('should create a new goal', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const createDto = {
        name: 'Emergency Fund',
        targetAmount: 10000,
        deadline: '2025-12-31',
      };
      goalsService.createGoal.mockResolvedValue(mockGoal);

      const result = await controller.createGoal(mockRequest, createDto as any);

      expect(goalsService.createGoal).toHaveBeenCalledWith('user-123', createDto);
      expect(result).toEqual(mockGoal);
    });
  });

  describe('getGoals', () => {
    it('should return goals for user', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const response: any = { goals: [mockGoal], total: 1, summary: {} };
      goalsService.getGoals.mockResolvedValue(response);

      const result = await controller.getGoals(mockRequest, {} as any);

      expect(goalsService.getGoals).toHaveBeenCalledWith('user-123', {});
      expect(result).toEqual(response);
    });
  });

  describe('getGoalById', () => {
    it('should return a single goal', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      goalsService.getGoalById.mockResolvedValue(mockGoal);

      const result = await controller.getGoalById(mockRequest, 'goal-123');

      expect(goalsService.getGoalById).toHaveBeenCalledWith('user-123', 'goal-123');
      expect(result).toEqual(mockGoal);
    });
  });

  describe('updateGoal', () => {
    it('should update a goal', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const updateDto = { targetAmount: 15000 };
      const updatedGoal = { ...mockGoal, targetAmount: 15000 };
      goalsService.updateGoal.mockResolvedValue(updatedGoal);

      const result = await controller.updateGoal(mockRequest, 'goal-123', updateDto as any);

      expect(goalsService.updateGoal).toHaveBeenCalledWith(
        'user-123',
        'goal-123',
        updateDto,
      );
      expect(result.targetAmount).toBe(15000);
    });
  });

  describe('deleteGoal', () => {
    it('should delete a goal', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      goalsService.deleteGoal.mockResolvedValue(undefined);

      await controller.deleteGoal(mockRequest, 'goal-123');

      expect(goalsService.deleteGoal).toHaveBeenCalledWith('user-123', 'goal-123');
    });
  });

  describe('addGoalContribution', () => {
    it('should add a contribution to goal', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const contributionDto = { amount: 500 };
      goalsService.addContribution.mockResolvedValue(mockContribution);

      const result = await controller.addGoalContribution(
        mockRequest,
        'goal-123',
        contributionDto as any,
      );

      expect(goalsService.addContribution).toHaveBeenCalledWith(
        'user-123',
        'goal-123',
        contributionDto,
      );
      expect(result).toEqual(mockContribution);
    });
  });

  describe('getGoalContributions', () => {
    it('should return goal contributions', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      goalsService.getGoalContributions.mockResolvedValue([mockContribution]);

      const result = await controller.getGoalContributions(mockRequest, 'goal-123');

      expect(goalsService.getGoalContributions).toHaveBeenCalledWith(
        'user-123',
        'goal-123',
        undefined,
        undefined,
      );
      expect(result).toEqual([mockContribution]);
    });
  });

  describe('getGoalAnalytics', () => {
    it('should return goal analytics', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const analytics: any = { progress: 25, daysRemaining: 300 };
      goalsService.getGoalAnalytics.mockResolvedValue(analytics);

      const result = await controller.getGoalAnalytics(mockRequest, 'goal-123');

      expect(goalsService.getGoalAnalytics).toHaveBeenCalledWith('user-123', 'goal-123');
      expect(result).toEqual(analytics);
    });
  });

  describe('getGoalSuggestions', () => {
    it('should return goal suggestions', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const suggestions: any = { suggestions: [], insights: [], userContext: {} };
      goalsService.generateSmartSuggestions.mockResolvedValue(suggestions);

      const result = await controller.getGoalSuggestions(mockRequest);

      expect(goalsService.generateSmartSuggestions).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(suggestions);
    });
  });
});
