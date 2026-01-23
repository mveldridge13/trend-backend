import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from 'src/health/health.controller';
import { HealthService } from 'src/health/health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: jest.Mocked<HealthService>;

  const mockHealthStatus: any = {
    status: 'healthy',
    uptime: 12345,
    timestamp: new Date().toISOString(),
    database: {
      status: 'ok',
      responseTime: 5,
    },
    memory: {
      used: 100,
      total: 512,
      percentage: 19.5,
    },
  };

  beforeEach(async () => {
    const mockHealthService = {
      getHealthStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: mockHealthService }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHealth', () => {
    it('should return health status', async () => {
      healthService.getHealthStatus.mockResolvedValue(mockHealthStatus);

      const result = await controller.getHealth();

      expect(healthService.getHealthStatus).toHaveBeenCalled();
      expect(result).toEqual(mockHealthStatus);
    });
  });

  describe('ping', () => {
    it('should return pong with timestamp', () => {
      const result = controller.ping();

      expect(result).toHaveProperty('message', 'pong');
      expect(result).toHaveProperty('timestamp');
    });
  });
});
