import { Test, TestingModule } from '@nestjs/testing';
import { PokerController } from 'src/poker/poker.controller';
import { PokerService } from 'src/poker/poker.service';

describe('PokerController', () => {
  let controller: PokerController;
  let pokerService: jest.Mocked<PokerService>;

  const mockTournament: any = {
    id: 'tournament-123',
    userId: 'user-123',
    name: 'Weekly Tournament',
    buyIn: 50,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
  };

  const mockEvent: any = {
    id: 'event-123',
    tournamentId: 'tournament-123',
    date: new Date('2025-01-15'),
    position: 3,
    payout: 200,
  };

  const mockAnalytics: any = {
    totalTournaments: 10,
    totalBuyIns: 500,
    totalPayouts: 800,
    netProfit: 300,
  };

  beforeEach(async () => {
    const mockPokerService = {
      createTournament: jest.fn(),
      getTournaments: jest.fn(),
      getTournamentById: jest.fn(),
      updateTournament: jest.fn(),
      deleteTournament: jest.fn(),
      createTournamentEvent: jest.fn(),
      getTournamentEvents: jest.fn(),
      updateTournamentEvent: jest.fn(),
      deleteTournamentEvent: jest.fn(),
      getPokerAnalytics: jest.fn(),
      getTournamentAnalytics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PokerController],
      providers: [{ provide: PokerService, useValue: mockPokerService }],
    }).compile();

    controller = module.get<PokerController>(PokerController);
    pokerService = module.get(PokerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTournament', () => {
    it('should create a new tournament', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const createDto = {
        name: 'Weekly Tournament',
        buyIn: 50,
      };
      pokerService.createTournament.mockResolvedValue(mockTournament);

      const result = await controller.createTournament(mockRequest, createDto as any);

      expect(pokerService.createTournament).toHaveBeenCalledWith('user-123', createDto);
      expect(result).toEqual(mockTournament);
    });
  });

  describe('getTournaments', () => {
    it('should return all tournaments for user', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      pokerService.getTournaments.mockResolvedValue([mockTournament]);

      const result = await controller.getTournaments(mockRequest);

      expect(pokerService.getTournaments).toHaveBeenCalledWith('user-123');
      expect(result).toEqual([mockTournament]);
    });
  });

  describe('getTournamentById', () => {
    it('should return a single tournament', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      pokerService.getTournamentById.mockResolvedValue(mockTournament);

      const result = await controller.getTournamentById(mockRequest, 'tournament-123');

      expect(pokerService.getTournamentById).toHaveBeenCalledWith('tournament-123', 'user-123');
      expect(result).toEqual(mockTournament);
    });
  });

  describe('updateTournament', () => {
    it('should update a tournament', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const updateDto = { name: 'Monthly Tournament' };
      const updatedTournament = { ...mockTournament, name: 'Monthly Tournament' };
      pokerService.updateTournament.mockResolvedValue(updatedTournament);

      const result = await controller.updateTournament(mockRequest, 'tournament-123', updateDto as any);

      expect(pokerService.updateTournament).toHaveBeenCalledWith(
        'tournament-123',
        'user-123',
        updateDto,
      );
      expect(result.name).toBe('Monthly Tournament');
    });
  });

  describe('deleteTournament', () => {
    it('should delete a tournament', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      pokerService.deleteTournament.mockResolvedValue(undefined);

      await controller.deleteTournament(mockRequest, 'tournament-123');

      expect(pokerService.deleteTournament).toHaveBeenCalledWith('tournament-123', 'user-123');
    });
  });

  describe('createTournamentEvent', () => {
    it('should create a tournament event', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const createDto = { date: '2025-01-15', position: 3, payout: 200 };
      pokerService.createTournamentEvent.mockResolvedValue(mockEvent);

      const result = await controller.createTournamentEvent(mockRequest, 'tournament-123', createDto as any);

      expect(pokerService.createTournamentEvent).toHaveBeenCalledWith(
        'tournament-123',
        'user-123',
        createDto,
      );
      expect(result).toEqual(mockEvent);
    });
  });

  describe('getTournamentEvents', () => {
    it('should return tournament events', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      pokerService.getTournamentEvents.mockResolvedValue([mockEvent]);

      const result = await controller.getTournamentEvents(mockRequest, 'tournament-123');

      expect(pokerService.getTournamentEvents).toHaveBeenCalledWith('tournament-123', 'user-123');
      expect(result).toEqual([mockEvent]);
    });
  });

  describe('getPokerAnalytics', () => {
    it('should return poker analytics', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      pokerService.getPokerAnalytics.mockResolvedValue(mockAnalytics);

      const result = await controller.getPokerAnalytics(mockRequest);

      expect(pokerService.getPokerAnalytics).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockAnalytics);
    });
  });

  describe('getTournamentAnalytics', () => {
    it('should return tournament analytics', async () => {
      const mockRequest = { user: { id: 'user-123' } };
      const tournamentAnalytics: any = { totalEvents: 5, totalProfit: 150 };
      pokerService.getTournamentAnalytics.mockResolvedValue(tournamentAnalytics);

      const result = await controller.getTournamentAnalytics(mockRequest, 'tournament-123');

      expect(pokerService.getTournamentAnalytics).toHaveBeenCalledWith('tournament-123', 'user-123');
      expect(result).toEqual(tournamentAnalytics);
    });
  });
});
