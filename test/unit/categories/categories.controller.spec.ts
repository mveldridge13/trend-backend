import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from 'src/categories/categories.controller';
import { CategoriesService } from 'src/categories/categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let categoriesService: jest.Mocked<CategoriesService>;

  const mockCategory: any = {
    id: 'cat-123',
    userId: 'user-123',
    name: 'Groceries',
    icon: 'shopping-cart',
    color: '#4CAF50',
    type: 'EXPENSE',
    isSystem: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    const mockCategoriesService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getSystemCategories: jest.fn(),
      getMostUsedCategories: jest.fn(),
      findArchived: jest.fn(),
      restore: jest.fn(),
      getCategoryAnalytics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: mockCategoriesService }],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    categoriesService = module.get(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const mockRequest = { user: { userId: 'user-123' } };
      const createDto = {
        name: 'Groceries',
        icon: 'shopping-cart',
        color: '#4CAF50',
        type: 'EXPENSE',
      };
      categoriesService.create.mockResolvedValue(mockCategory);

      const result = await controller.create(mockRequest, createDto as any);

      expect(categoriesService.create).toHaveBeenCalledWith('user-123', createDto);
      expect(result).toEqual(mockCategory);
    });
  });

  describe('findAll', () => {
    it('should return paginated categories for user', async () => {
      const mockRequest = { user: { userId: 'user-123' } };
      const response = { categories: [mockCategory], total: 1, page: 1, totalPages: 1 };
      categoriesService.findAll.mockResolvedValue(response);

      const result = await controller.findAll(mockRequest);

      expect(categoriesService.findAll).toHaveBeenCalledWith('user-123', {}, 1, 50);
      expect(result).toEqual(response);
    });

    it('should pass filters to service', async () => {
      const mockRequest = { user: { userId: 'user-123' } };
      const response = { categories: [mockCategory], total: 1, page: 1, totalPages: 1 };
      categoriesService.findAll.mockResolvedValue(response);

      await controller.findAll(mockRequest, 'EXPENSE', undefined, undefined, undefined, undefined, 1, 50);

      expect(categoriesService.findAll).toHaveBeenCalledWith(
        'user-123',
        { type: 'EXPENSE' },
        1,
        50,
      );
    });
  });

  describe('findOne', () => {
    it('should return a single category', async () => {
      const mockRequest = { user: { userId: 'user-123' } };
      categoriesService.findOne.mockResolvedValue(mockCategory);

      const result = await controller.findOne(mockRequest, 'cat-123');

      expect(categoriesService.findOne).toHaveBeenCalledWith('user-123', 'cat-123');
      expect(result).toEqual(mockCategory);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const mockRequest = { user: { userId: 'user-123' } };
      const updateDto = { name: 'Food & Groceries' };
      const updatedCategory = { ...mockCategory, name: 'Food & Groceries' };
      categoriesService.update.mockResolvedValue(updatedCategory);

      const result = await controller.update(mockRequest, 'cat-123', updateDto as any);

      expect(categoriesService.update).toHaveBeenCalledWith(
        'user-123',
        'cat-123',
        updateDto,
      );
      expect(result.name).toBe('Food & Groceries');
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      const mockRequest = { user: { userId: 'user-123' } };
      categoriesService.remove.mockResolvedValue(undefined);

      await controller.remove(mockRequest, 'cat-123');

      expect(categoriesService.remove).toHaveBeenCalledWith('user-123', 'cat-123', {
        permanent: false,
        force: false,
      });
    });
  });

  describe('getSystemCategories', () => {
    it('should return system categories', async () => {
      const systemCategories = [{ ...mockCategory, isSystem: true }];
      categoriesService.getSystemCategories.mockResolvedValue(systemCategories);

      const result = await controller.getSystemCategories();

      expect(categoriesService.getSystemCategories).toHaveBeenCalled();
      expect(result).toEqual(systemCategories);
    });
  });

  describe('getMostUsedCategories', () => {
    it('should return most used categories', async () => {
      const mockRequest = { user: { userId: 'user-123' } };
      categoriesService.getMostUsedCategories.mockResolvedValue([mockCategory]);

      const result = await controller.getMostUsedCategories(mockRequest, 10);

      expect(categoriesService.getMostUsedCategories).toHaveBeenCalledWith('user-123', 10);
      expect(result).toEqual([mockCategory]);
    });
  });

  describe('restore', () => {
    it('should restore an archived category', async () => {
      const mockRequest = { user: { userId: 'user-123' } };
      categoriesService.restore.mockResolvedValue(mockCategory);

      const result = await controller.restore(mockRequest, 'cat-123');

      expect(categoriesService.restore).toHaveBeenCalledWith('user-123', 'cat-123');
      expect(result).toEqual(mockCategory);
    });
  });
});
